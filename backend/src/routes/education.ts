import { AttendanceStatus, UserRole } from '@prisma/client'
import { RequestHandler, Router } from 'express'
import { logAudit, prisma, validateBody, z } from '../lib/validation'
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth'

const router = Router()

const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

const createEducationSchema = z.object({
  childId: z.string().uuid(),
  schoolName: z.string().trim().min(2).max(120),
  grade: z.string().trim().min(1).max(40),
  academicYear: z.string().trim().min(4).max(20),
  term: z.string().trim().min(1).max(30),
  gpaOrScore: z.number().min(0).max(100),
  notes: z.string().trim().max(500).optional(),
})

const createAttendanceSchema = z.object({
  childId: z.string().uuid(),
  educationRecordId: z.string().uuid().optional(),
  date: z.string().optional(),
  status: z.nativeEnum(AttendanceStatus),
  remarks: z.string().trim().max(300).optional(),
})

// GET /api/education?childId=...
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!
    const requestedChildId =
      typeof req.query.childId === 'string' ? req.query.childId.trim() : undefined

    let studentChildId: string | undefined
    if (user.role === UserRole.STUDENT) {
      const ownChild = await prisma.child.findUnique({
        where: { studentUserId: user.id },
        select: { id: true },
      })
      if (!ownChild) {
        res.json({ records: [], trend: [], attendanceSummary: { total: 0, present: 0, rate: 0 } })
        return
      }
      studentChildId = ownChild.id
    }

    const filterChildId = studentChildId ?? requestedChildId

    const [records, attendances] = await Promise.all([
      prisma.educationRecord.findMany({
        where: filterChildId ? { childId: filterChildId } : {},
        include: {
          child: { select: { id: true, code: true, name: true, educationSummary: true } },
          educator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.attendance.findMany({
        where: filterChildId ? { childId: filterChildId } : {},
        select: { status: true, date: true },
      }),
    ])

    const totalAttendance = attendances.length
    const presentCount = attendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
    ).length
    const attendanceRate =
      totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

    // Monthly average score trend matching Education.tsx chart shape ({ month, score })
    const monthBuckets = new Map<string, { sum: number; count: number }>()
    for (const rec of [...records].reverse()) {
      const month = rec.createdAt.toLocaleString('en-US', { month: 'short' })
      const bucket = monthBuckets.get(month) ?? { sum: 0, count: 0 }
      bucket.sum += rec.gpaOrScore
      bucket.count += 1
      monthBuckets.set(month, bucket)
    }

    const trend = Array.from(monthBuckets.entries()).map(([month, b]) => ({
      month,
      score: Math.round((b.sum / b.count) * 10) / 10,
    }))

    res.json({
      records,
      trend,
      attendanceSummary: {
        total: totalAttendance,
        present: presentCount,
        rate: attendanceRate,
      },
    })
  })
)

// POST /api/education (Create academic term record + update child's educationSummary)
router.post(
  '/',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.STAFF, UserRole.EDUCATOR),
  validateBody(createEducationSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!
    const body = req.body as z.infer<typeof createEducationSchema>

    const child = await prisma.child.findUnique({ where: { id: body.childId } })
    if (!child) {
      res.status(404).json({ error: 'Child record not found.' })
      return
    }

    const record = await prisma.educationRecord.create({
      data: {
        childId: body.childId,
        educatorId: user.id,
        schoolName: body.schoolName,
        grade: body.grade,
        academicYear: body.academicYear,
        term: body.term,
        gpaOrScore: body.gpaOrScore,
        notes: body.notes,
        isDemo: false,
      },
      include: {
        child: { select: { id: true, code: true, name: true } },
        educator: { select: { id: true, name: true } },
      },
    })

    await prisma.child.update({
      where: { id: body.childId },
      data: { educationSummary: body.grade },
    })

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'CREATE_EDUCATION_RECORD',
      entityType: 'EducationRecord',
      entityId: record.id,
      metadata: { childId: body.childId, grade: body.grade, score: body.gpaOrScore },
    })

    res.status(201).json(record)
  })
)

// POST /api/education/attendance (Log daily attendance)
router.post(
  '/attendance',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.STAFF, UserRole.EDUCATOR),
  validateBody(createAttendanceSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!
    const body = req.body as z.infer<typeof createAttendanceSchema>

    const attendance = await prisma.attendance.create({
      data: {
        childId: body.childId,
        educationRecordId: body.educationRecordId,
        date: body.date ? new Date(body.date) : new Date(),
        status: body.status,
        remarks: body.remarks,
        isDemo: false,
      },
    })

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'LOG_ATTENDANCE',
      entityType: 'Attendance',
      entityId: attendance.id,
      metadata: { childId: body.childId, status: body.status },
    })

    res.status(201).json(attendance)
  })
)

export default router