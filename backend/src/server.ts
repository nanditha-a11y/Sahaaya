import cors from 'cors'
import dotenv from 'dotenv'
import express, { ErrorRequestHandler, RequestHandler } from 'express'
import { Prisma, PrismaClient, UserRole } from '@prisma/client'
import {
  AuthenticatedRequest,
  requireAuth,
  requireRole,
  verifySupabaseToken,
} from './middleware/auth'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const port = Number(process.env.PORT) || 5000

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())

const asyncHandler = (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const ALLOWED_SIGNUP_ROLES: UserRole[] = [
  UserRole.STAFF,
  UserRole.EDUCATOR,
  UserRole.HEALTHCARE_STAFF,
  UserRole.DONOR,
  UserRole.STUDENT,
]

// --- Auth & Profile Routes ---

app.post(
  '/api/auth/register',
  verifySupabaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const authUserId = req.authUserId
    const email = req.authEmail

    if (!authUserId || !email) {
      res.status(400).json({ error: 'Authenticated Supabase user email is missing.' })
      return
    }

    const { name, role } = req.body ?? {}
    const safeName = isNonEmptyString(name) ? name.trim() : email.split('@')[0]
    const safeRole: UserRole = ALLOWED_SIGNUP_ROLES.includes(role)
      ? role
      : UserRole.DONOR

    const org = await prisma.organization.findFirst()
    if (!org) {
      res.status(500).json({ error: 'No organization configured. Run database seed first.' })
      return
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        authId: authUserId,
        name: safeName,
        role: safeRole,
      },
      create: {
        authId: authUserId,
        email,
        name: safeName,
        role: safeRole,
        isDemo: false,
        organizationId: org.id,
      },
      include: {
        organization: { select: { id: true, name: true, city: true } },
      },
    })

    if (safeRole === UserRole.DONOR) {
      await prisma.donor.upsert({
        where: { email },
        update: { userId: user.id, name: safeName },
        create: {
          userId: user.id,
          name: safeName,
          email,
          isDemo: false,
        },
      })
    }

    res.status(201).json({ user })
  })
)

app.get(
  '/api/auth/me',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user })
  })
)

// --- Core Sahaaya Endpoints ---

app.get(
  '/api/dashboard/stats',
  asyncHandler(async (_request, response) => {
    const [children, donations, resources, messages] = await Promise.all([
      prisma.child.count({ where: { isArchived: false } }),
      prisma.donation.aggregate({ _count: true, _sum: { amount: true } }),
      prisma.resource.aggregate({ _count: true, _sum: { stock: true } }),
      prisma.message.count({ where: { isPublicWall: true } }),
    ])

    response.json({
      children,
      donations: {
        count: donations._count,
        total: donations._sum.amount ?? 0,
      },
      resources: {
        count: resources._count,
        totalStock: resources._sum.stock ?? 0,
      },
      messages,
    })
  })
)

app.get(
  '/api/children',
  asyncHandler(async (_request, response) => {
    const rows = await prisma.child.findMany({
      where: { isArchived: false },
      orderBy: { name: 'asc' },
    })

    response.json(
      rows.map((c) => ({
        id: c.id,
        name: c.name,
        age: c.age,
        education: c.educationSummary,
        health: c.healthSummary,
        photo: c.photo,
      }))
    )
  })
)

app.post(
  '/api/children',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.STAFF),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const { name, age, education, health, photo } = request.body ?? {}

    if (
      !isNonEmptyString(name) ||
      !Number.isInteger(age) ||
      age < 0 ||
      !isNonEmptyString(education) ||
      !isNonEmptyString(health) ||
      !isNonEmptyString(photo)
    ) {
      response.status(400).json({
        error: 'Expected name, non-negative integer age, education, health, and photo.',
      })
      return
    }

    const org = await prisma.organization.findFirst()
    if (!org) {
      response.status(500).json({ error: 'No organization configured. Run database seed first.' })
      return
    }

    const count = await prisma.child.count()
    const child = await prisma.child.create({
      data: {
        code: `SHY-${String(count + 1).padStart(3, '0')}`,
        name: name.trim(),
        age,
        dateOfBirth: new Date(new Date().getFullYear() - age, 0, 1),
        gender: 'Not specified',
        admissionDate: new Date(),
        educationSummary: education.trim(),
        healthSummary: health.trim(),
        photo: photo.trim(),
        isDemo: false,
        organizationId: org.id,
      },
    })

    if (request.user) {
      await prisma.auditLog.create({
        data: {
          organizationId: org.id,
          actorId: request.user.id,
          action: 'CREATE_CHILD',
          entityType: 'Child',
          entityId: child.id,
        },
      })
    }

    response.status(201).json({
      id: child.id,
      name: child.name,
      age: child.age,
      education: child.educationSummary,
      health: child.healthSummary,
      photo: child.photo,
    })
  })
)

app.get(
  '/api/resources/:id',
  asyncHandler(async (request, response) => {
    const resource = await prisma.resource.findUnique({
      where: { id: request.params.id },
    })

    if (!resource) {
      response.status(404).json({ error: 'Resource not found.' })
      return
    }

    response.json(resource)
  })
)

app.get(
  '/api/messages',
  asyncHandler(async (_request, response) => {
    const rows = await prisma.message.findMany({
      where: { isPublicWall: true },
      orderBy: { createdAt: 'desc' },
      take: 25,
    })

    response.json(
      rows.map((m) => ({
        id: m.id,
        from: m.fromName,
        role: m.fromRole,
        text: m.text,
        date: m.createdAt.toISOString(),
      }))
    )
  })
)

app.post(
  '/api/messages',
  asyncHandler(async (request, response) => {
    const { from, role, text } = request.body ?? {}

    if (!isNonEmptyString(from) || !isNonEmptyString(role) || !isNonEmptyString(text)) {
      response.status(400).json({ error: 'Expected from, role, and text.' })
      return
    }

    const message = await prisma.message.create({
      data: {
        fromName: from.trim(),
        fromRole: role.trim(),
        text: text.trim(),
        isPublicWall: true,
        isDemo: false,
      },
    })

    response.status(201).json({
      id: message.id,
      from: message.fromName,
      role: message.fromRole,
      text: message.text,
      date: message.createdAt.toISOString(),
    })
  })
)

app.get(
  '/api/health',
  asyncHandler(async (_request, response) => {
    await prisma.$queryRaw`SELECT 1`
    response.json({ status: 'ok', database: 'connected' })
  })
)

const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'Request body must contain valid JSON.' })
    return
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    response.status(409).json({ error: 'A record with that unique value already exists.' })
    return
  }

  console.error('API request failed:', error)
  response.status(500).json({ error: 'An unexpected server error occurred.' })
}

app.use(errorHandler)

const server = app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`)
})

const shutdown = () => {
  server.close(() => {
    void prisma.$disconnect()
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)