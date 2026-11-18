import { NextFunction, Request, Response } from 'express'
import { PrismaClient, User, UserRole } from '@prisma/client'
import { supabaseAdmin } from '../lib/supabase'

const prisma = new PrismaClient()

export interface AuthenticatedRequest extends Request {
  user?: User
  authUserId?: string
  authEmail?: string
  authMetadata?: Record<string, unknown>
}

const VALID_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.STAFF,
  UserRole.EDUCATOR,
  UserRole.HEALTHCARE_STAFF,
  UserRole.DONOR,
  UserRole.STUDENT,
]

export async function verifySupabaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header.' })
    return
  }

  const token = authHeader.slice(7).trim()
  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' })
    return
  }

  req.authUserId = data.user.id
  req.authEmail = data.user.email
  req.authMetadata = data.user.user_metadata ?? {}
  next()
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  await verifySupabaseToken(req, res, async () => {
    try {
      if (!req.authUserId) return

      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { authId: req.authUserId },
            ...(req.authEmail ? [{ email: req.authEmail }] : []),
          ],
        },
        include: {
          organization: { select: { id: true, name: true, city: true } },
        },
      })

      // Auto-create PostgreSQL profile if Supabase Auth user exists without a DB row
      if (!user && req.authEmail) {
        const org = await prisma.organization.findFirst()
        if (!org) {
          res.status(500).json({ error: 'No organization configured. Run database seed first.' })
          return
        }

        const metaRole = req.authMetadata?.role as UserRole | undefined
        const safeRole =
          metaRole && VALID_ROLES.includes(metaRole) ? metaRole : UserRole.STAFF
        const metaName =
          typeof req.authMetadata?.name === 'string' && req.authMetadata.name.trim()
            ? req.authMetadata.name.trim()
            : req.authEmail.split('@')[0]

        user = await prisma.user.create({
          data: {
            authId: req.authUserId,
            email: req.authEmail,
            name: metaName,
            role: safeRole,
            isDemo: false,
            organizationId: org.id,
          },
          include: {
            organization: { select: { id: true, name: true, city: true } },
          },
        })
      } else if (user && !user.authId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { authId: req.authUserId },
          include: {
            organization: { select: { id: true, name: true, city: true } },
          },
        })
      }

      if (!user) {
        res.status(404).json({ error: 'User profile not found in database.' })
        return
      }

      req.user = user
      next()
    } catch (err) {
      next(err)
    }
  })
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
      })
      return
    }

    next()
  }
}