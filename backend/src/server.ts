import cors from 'cors'
import dotenv from 'dotenv'
import express, { ErrorRequestHandler, RequestHandler } from 'express'
import { Prisma, UserRole } from '@prisma/client'
import { supabaseAdmin } from './lib/supabase'
import { prisma } from './lib/validation'
import { AuthenticatedRequest, requireAuth, requireRole } from './middleware/auth'
import childrenRouter from './routes/children'
import educationRouter from './routes/education'
import healthRouter from './routes/health'
import resourcesRouter from './routes/resources'
import communityRouter from './routes/community'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 5000

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())

const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const ALLOWED_SELF_REGISTER_ROLES: UserRole[] = [
  UserRole.DONOR,
  UserRole.STUDENT,
  UserRole.STAFF,
  UserRole.EDUCATOR,
  UserRole.HEALTHCARE_STAFF,
]

// ── Auth & Profile Provisioning ───────────────────────────────────────────────

app.post(
  '/api/auth/register',
  asyncHandler(async (request, response) => {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      response.status(401).json({ error: 'Missing Supabase session token.' })
      return
    }

    const token = authHeader.slice(7).trim()
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data.user || !data.user.email) {
      response.status(401).json({ error: 'Invalid Supabase session token.' })
      return
    }

    const { name, role } = request.body ?? {}
    const email = data.user.email.toLowerCase()
    const requestedRole = Object.values(UserRole).includes(role)
      ? (role as UserRole)
      : UserRole.DONOR

    if (!ALLOWED_SELF_REGISTER_ROLES.includes(requestedRole)) {
      response.status(400).json({ error: 'Invalid role selection.' })
      return
    }

    const org = await prisma.organization.findFirst()
    if (!org) {
      response.status(500).json({ error: 'No organization found. Run db:seed first.' })
      return
    }

    const displayName = isNonEmptyString(name)
      ? name.trim()
      : (data.user.user_metadata?.name as string) || email.split('@')[0]

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        authId: data.user.id,
        name: displayName,
      },
      create: {
        authId: data.user.id,
        email,
        name: displayName,
        role: requestedRole,
        organizationId: org.id,
        isDemo: false,
      },
    })

    if (user.role === UserRole.DONOR) {
      await prisma.donor.upsert({
        where: { email },
        update: { userId: user.id, name: displayName },
        create: {
          userId: user.id,
          name: displayName,
          email,
          isDemo: false,
        },
      })
    }

    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        actorId: user.id,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: user.id,
        metadata: { role: user.role },
      },
    })

    response.status(201).json({ user })
  })
)

app.get(
  '/api/auth/me',
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      include: {
        organization: { select: { id: true, name: true, city: true } },
        donorProfile: true,
        studentChild: true,
      },
    })

    response.json({ user })
  })
)

app.get(
  '/api/users',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (_request, response) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isDemo: true,
        createdAt: true,
      },
    })
    response.json(users)
  })
)

app.patch(
  '/api/users/:id/role',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const { role } = request.body ?? {}
    if (!Object.values(UserRole).includes(role)) {
      response.status(400).json({ error: 'Invalid role provided.' })
      return
    }

    const updated = await prisma.user.update({
      where: { id: request.params.id },
      data: { role },
    })

    await prisma.auditLog.create({
      data: {
        organizationId: request.user!.organizationId,
        actorId: request.user!.id,
        action: 'UPDATE_USER_ROLE',
        entityType: 'User',
        entityId: updated.id,
        metadata: { newRole: role },
      },
    })

    response.json(updated)
  })
)

// ── Dashboard & Public Wall Routes ────────────────────────────────────────────

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
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const { text } = request.body ?? {}

    if (!isNonEmptyString(text)) {
      response.status(400).json({ error: 'Expected message text.' })
      return
    }

    const user = request.user!
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        fromName: user.name,
        fromRole: user.role,
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

// ── Phase 3 Domain Routers ────────────────────────────────────────────────────

app.use('/api/children', childrenRouter)
app.use('/api/education', educationRouter)
app.use('/api/health-records', healthRouter)
app.use('/api/resources', resourcesRouter)
app.use('/api', communityRouter)

app.get(
  '/api/health',
  asyncHandler(async (_request, response) => {
    await prisma.$queryRaw`SELECT 1`
    response.json({ status: 'ok', database: 'connected' })
  })
)

// ── Error Handling & Server Lifecycle ─────────────────────────────────────────

const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'Request body must contain valid JSON.' })
    return
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    response.status(409).json({ error: 'A record with that unique value already exists.' })
    return
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    response.status(404).json({ error: 'Requested record was not found.' })
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