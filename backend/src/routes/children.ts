import { Prisma, UserRole } from '@prisma/client'
import { Router } from 'express'
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth'
import { logAudit, prisma, validateBody, z } from '../lib/validation'

export const childrenRouter = Router()

const createChildSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  age: z.coerce.number().int().min(0).max(25),
  gender: z.string().trim().min(1).optional().default('Not specified'),
  education: z.string().trim().min(1, 'Education summary is required'),
  health: z.string().trim().min(1, 'Health summary is required'),
  photo: z.string().trim().url('Photo must be a valid URL'),
  bio: z.string().trim().max(1000).optional(),
})

const updateChildSchema = createChildSchema.partial()

function formatChildForUi(
  c: {
    id: string
    code: string
    name: string
    age: number
    gender: string
    educationSummary: string
    healthSummary: string
    photo: string
    bio: string | null
    admissionDate: Date
    isArchived: boolean
  },
  maskHealth: boolean
) {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    age: c.age,
    gender: c.gender,
    education: c.educationSummary,
    health: maskHealth ? 'Protected (Staff Only)' : c.healthSummary,
    photo: c.photo,
    bio: c.bio,
    admissionDate: c.admissionDate.toISOString().slice(0, 10),
    isArchived: c.isArchived,
  }
}

// GET /api/children — supports search, grade, archived, sortBy, sortOrder, and optional page/limit
childrenRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const grade = typeof req.query.grade === 'string' ? req.query.grade.trim() : ''
    const includeArchived = req.query.archived === 'true'
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'name'
    const sortOrder: Prisma.SortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc'

    const where: Prisma.ChildWhereInput = {
      ...(includeArchived ? {} : { isArchived: false }),
      ...(user.role === UserRole.STUDENT ? { studentUserId: user.id } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { educationSummary: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(grade
        ? {
            educationSummary: { contains: grade, mode: 'insensitive' },
          }
        : {}),
    }

    const orderBy: Prisma.ChildOrderByWithRelationInput =
      sortBy === 'age'
        ? { age: sortOrder }
        : sortBy === 'admissionDate'
          ? { admissionDate: sortOrder }
          : sortBy === 'code'
            ? { code: sortOrder }
            : { name: sortOrder }

    const maskHealth = user.role === UserRole.DONOR
    const pageParam = typeof req.query.page === 'string' ? Number(req.query.page) : NaN
    const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : 12

    if (Number.isInteger(pageParam) && pageParam > 0) {
      const pageSize = Math.min(Math.max(Number.isInteger(limitParam) ? limitParam : 12, 1), 100)
      const [total, rows] = await Promise.all([
        prisma.child.count({ where }),
        prisma.child.findMany({
          where,
          orderBy,
          skip: (pageParam - 1) * pageSize,
          take: pageSize,
        }),
      ])

      res.json({
        items: rows.map((c) => formatChildForUi(c, maskHealth)),
        total,
        page: pageParam,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      })
      return
    }

    const rows = await prisma.child.findMany({
      where,
      orderBy,
    })

    res.json(rows.map((c) => formatChildForUi(c, maskHealth)))
  } catch (err) {
    next(err)
  }
})

// GET /api/children/:id
childrenRouter.get('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    const child = await prisma.child.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            educationRecords: true,
            attendanceRecords: true,
            healthRecords: true,
            scholarshipApplications: true,
            mentorshipSessions: true,
          },
        },
      },
    })

    if (!child) {
      res.status(404).json({ error: 'Child record not found.' })
      return
    }

    if (user.role === UserRole.STUDENT && child.studentUserId !== user.id) {
      res.status(403).json({ error: 'Students can only view their own profile.' })
      return
    }

    const maskHealth = user.role === UserRole.DONOR
    res.json({
      ...formatChildForUi(child, maskHealth),
      counts: child._count,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/children
childrenRouter.post(
  '/',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.STAFF),
  validateBody(createChildSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!
      const { name, age, gender, education, health, photo, bio } = req.body

      const count = await prisma.child.count()
      const child = await prisma.child.create({
        data: {
          code: `SHY-${String(count + 1).padStart(3, '0')}`,
          name,
          age,
          gender,
          dateOfBirth: new Date(new Date().getFullYear() - age, 0, 1),
          admissionDate: new Date(),
          educationSummary: education,
          healthSummary: health,
          photo,
          bio: bio ?? null,
          isDemo: false,
          organizationId: user.organizationId,
        },
      })

      await logAudit({
        organizationId: user.organizationId,
        actorId: user.id,
        action: 'CREATE_CHILD',
        entityType: 'Child',
        entityId: child.id,
        metadata: { code: child.code, name: child.name },
      })

      res.status(201).json(formatChildForUi(child, false))
    } catch (err) {
      next(err)
    }
  }
)

// PATCH /api/children/:id
childrenRouter.patch(
  '/:id',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.STAFF),
  validateBody(updateChildSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!
      const { name, age, gender, education, health, photo, bio } = req.body

      const updated = await prisma.child.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(age !== undefined ? { age } : {}),
          ...(gender !== undefined ? { gender } : {}),
          ...(education !== undefined ? { educationSummary: education } : {}),
          ...(health !== undefined ? { healthSummary: health } : {}),
          ...(photo !== undefined ? { photo } : {}),
          ...(bio !== undefined ? { bio } : {}),
        },
      })

      await logAudit({
        organizationId: user.organizationId,
        actorId: user.id,
        action: 'UPDATE_CHILD',
        entityType: 'Child',
        entityId: updated.id,
        metadata: { updatedFields: Object.keys(req.body) },
      })

      res.json(formatChildForUi(updated, false))
    } catch (err) {
      next(err)
    }
  }
)

// DELETE /api/children/:id (soft-archive)
childrenRouter.delete(
  '/:id',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.STAFF),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!
      const archived = await prisma.child.update({
        where: { id: req.params.id },
        data: { isArchived: true },
      })

      await logAudit({
        organizationId: user.organizationId,
        actorId: user.id,
        action: 'ARCHIVE_CHILD',
        entityType: 'Child',
        entityId: archived.id,
      })

      res.json({ message: 'Child profile archived.', id: archived.id })
    } catch (err) {
      next(err)
    }
  }
)

export default childrenRouter