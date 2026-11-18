import { UserRole } from '@prisma/client'
import { RequestHandler, Router } from 'express'
import { logAudit, prisma, validateBody, z } from '../lib/validation'
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth'

const router = Router()

const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

const createHealthRecordSchema = z.object({
  childId: z.string().uuid(),
  checkupDate: z.string().optional(),
  heightCm: z.number().positive().max(250).optional(),
  weightKg: z.number().positive().max(200).optional(),
  immunizationNotes: z.string().trim().max(400).optional(),
  diagnosisOrNotes: z.string().trim().min(2).max(1000),
  healthStatusSummary: z.enum(['Good', 'Fair', 'Needs Follow-up']).optional(),
  followUpDate: z.string().optional(),
})

// GET /api/health-records?childId=... (Strictly HEALTHCARE_STAFF and SUPER_ADMIN)
router.get(
  '/',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.HEALTHCARE_STAFF),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!
    const childId =
      typeof req.query.childId === 'string' && req.query.childId.trim()
        ? req.query.childId.trim()
        : undefined

    const records = await prisma.healthRecord.findMany({
      where: childId ? { childId } : {},
      include: {
        child: {
          select: {
            id: true,
            code: true,
            name: true,
            age: true,
            healthSummary: true,
          },
        },
        healthcareStaff: {
          select: { id: true, name: true },
        },
      },
      orderBy: { checkupDate: 'desc' },
      take: 100,
    })

    // Privacy audit log when viewing clinical records
    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'VIEW_HEALTH_RECORDS',
      entityType: 'HealthRecord',
      entityId: childId ?? 'ALL',
      metadata: { recordCount: records.length },
    })

    res.json(records)
  })
)

// POST /api/health-records (Log a new clinical checkup + update Child.healthSummary)
router.post(
  '/',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.HEALTHCARE_STAFF),
  validateBody(createHealthRecordSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!
    const body = req.body as z.infer<typeof createHealthRecordSchema>

    const child = await prisma.child.findUnique({ where: { id: body.childId } })
    if (!child) {
      res.status(404).json({ error: 'Child record not found.' })
      return
    }

    const record = await prisma.healthRecord.create({
      data: {
        childId: body.childId,
        healthcareStaffId: user.id,
        checkupDate: body.checkupDate ? new Date(body.checkupDate) : new Date(),
        heightCm: body.heightCm,
        weightKg: body.weightKg,
        immunizationNotes: body.immunizationNotes,
        diagnosisOrNotes: body.diagnosisOrNotes,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : undefined,
        isDemo: false,
      },
      include: {
        child: { select: { id: true, code: true, name: true, healthSummary: true } },
        healthcareStaff: { select: { id: true, name: true } },
      },
    })

    if (body.healthStatusSummary) {
      await prisma.child.update({
        where: { id: body.childId },
        data: { healthSummary: body.healthStatusSummary },
      })
    }

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'CREATE_HEALTH_RECORD',
      entityType: 'HealthRecord',
      entityId: record.id,
      metadata: {
        childId: body.childId,
        updatedStatus: body.healthStatusSummary ?? null,
      },
    })

    res.status(201).json(record)
  })
)

export default router