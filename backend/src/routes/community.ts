import { ApplicationStatus, PaymentStatus, UserRole } from '@prisma/client'
import { RequestHandler, Router } from 'express'
import { logAudit, prisma, validateBody, z } from '../lib/validation'
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth'

const router = Router()

const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

const createDonationSchema = z.object({
  amount: z.number().positive().max(10000000),
  campaignId: z.string().uuid().optional(),
  donorName: z.string().trim().min(2).max(100).optional(),
  donorEmail: z.string().trim().email().optional(),
  isAnonymous: z.boolean().optional(),
})

const applyScholarshipSchema = z.object({
  childId: z.string().uuid().optional(),
  statement: z.string().trim().min(10).max(1000),
})

const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
})

const createSessionSchema = z.object({
  mentorId: z.string().uuid(),
  childId: z.string().uuid(),
  topic: z.string().trim().min(2).max(150),
  sessionDate: z.string(),
  durationMin: z.number().int().min(15).max(180).default(45),
  notes: z.string().trim().max(500).optional(),
})

// ── Donors & Campaigns ────────────────────────────────────────────────────────

// GET /api/donors (Donor transparency cards + campaign progress + personal history if DONOR)
router.get(
  '/donors',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!

    const [donors, campaigns, myDonor] = await Promise.all([
      prisma.donor.findMany({
        include: {
          donations: {
            where: { status: PaymentStatus.COMPLETED },
            select: { amount: true, donatedAt: true, campaignId: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.campaign.findMany({
        where: { isActive: true },
        include: {
          donations: {
            where: { status: PaymentStatus.COMPLETED },
            select: { amount: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      user.role === UserRole.DONOR
        ? prisma.donor.findUnique({
            where: { userId: user.id },
            include: {
              donations: {
                orderBy: { donatedAt: 'desc' },
                include: { campaign: { select: { id: true, title: true } } },
              },
            },
          })
        : Promise.resolve(null),
    ])

    const formattedDonors = donors.map((d) => {
      const total = d.donations.reduce((sum, item) => sum + item.amount, 0)
      return {
        id: d.id,
        name: d.isAnonymous && user.role === UserRole.DONOR ? 'Anonymous Benefactor' : d.name,
        city: d.city,
        isRecurring: d.isRecurring,
        donationCount: d.donations.length,
        total,
      }
    })

    const formattedCampaigns = campaigns.map((c) => {
      const liveRaised =
        c.raisedAmount + c.donations.reduce((sum, item) => sum + item.amount, 0)
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        targetAmount: c.targetAmount,
        raisedAmount: liveRaised,
        progressPercent: Math.min(100, Math.round((liveRaised / c.targetAmount) * 100)),
      }
    })

    res.json({
      donors: formattedDonors,
      campaigns: formattedCampaigns,
      myDonations: myDonor?.donations ?? [],
    })
  })
)

// POST /api/donations (Record a donor contribution or staff-logged offline donation)
router.post(
  '/donations',
  requireAuth,
  requireRole(UserRole.DONOR, UserRole.SUPER_ADMIN, UserRole.STAFF),
  validateBody(createDonationSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!
    const body = req.body as z.infer<typeof createDonationSchema>

    const email = (body.donorEmail ?? user.email).toLowerCase()
    const name = body.donorName ?? user.name

    const donor = await prisma.donor.upsert({
      where: { email },
      update: {
        ...(user.role === UserRole.DONOR ? { userId: user.id } : {}),
        ...(body.isAnonymous !== undefined ? { isAnonymous: body.isAnonymous } : {}),
      },
      create: {
        userId: user.role === UserRole.DONOR ? user.id : undefined,
        name,
        email,
        isAnonymous: body.isAnonymous ?? false,
        isDemo: false,
      },
    })

    const donation = await prisma.donation.create({
      data: {
        donorId: donor.id,
        organizationId: user.organizationId,
        campaignId: body.campaignId,
        amount: body.amount,
        currency: 'INR',
        status: PaymentStatus.COMPLETED,
        paymentRef: `SHY-DON-${Date.now()}`,
        isDemo: false,
      },
      include: {
        campaign: { select: { id: true, title: true } },
      },
    })

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'CREATE_DONATION',
      entityType: 'Donation',
      entityId: donation.id,
      metadata: { amount: body.amount, campaignId: body.campaignId ?? null },
    })

    res.status(201).json(donation)
  })
)

// ── Scholarships & Applications ───────────────────────────────────────────────

// GET /api/scholarships
router.get(
  '/scholarships',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!

    let studentChildId: string | undefined
    if (user.role === UserRole.STUDENT) {
      const ownChild = await prisma.child.findUnique({
        where: { studentUserId: user.id },
        select: { id: true },
      })
      studentChildId = ownChild?.id
    }

    const scholarships = await prisma.scholarship.findMany({
      where: { isActive: true },
      include: {
        applications: {
          include: {
            child: { select: { id: true, code: true, name: true } },
          },
          orderBy: { appliedAt: 'desc' },
        },
      },
      orderBy: { deadline: 'asc' },
    })

    res.json(
      scholarships.map((s) => ({
        id: s.id,
        name: s.title,
        title: s.title,
        provider: s.provider,
        amount: s.amount,
        eligibility: s.eligibility,
        deadline: s.deadline.toISOString(),
        awarded: s.applications.filter((a) => a.status === ApplicationStatus.APPROVED).length,
        totalApplications: s.applications.length,
        applications:
          user.role === UserRole.STUDENT
            ? s.applications.filter((a) => a.childId === studentChildId)
            : user.role === UserRole.DONOR
              ? []
              : s.applications,
      }))
    )
  })
)

// POST /api/scholarships/:id/apply
router.post(
  '/scholarships/:id/apply',
  requireAuth,
  requireRole(UserRole.STUDENT, UserRole.STAFF, UserRole.EDUCATOR, UserRole.SUPER_ADMIN),
  validateBody(applyScholarshipSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!
    const body = req.body as z.infer<typeof applyScholarshipSchema>

    let targetChildId = body.childId
    if (user.role === UserRole.STUDENT) {
      const ownChild = await prisma.child.findUnique({
        where: { studentUserId: user.id },
        select: { id: true },
      })
      if (!ownChild) {
        res.status(400).json({ error: 'Student profile is not linked to a child record yet.' })
        return
      }
      targetChildId = ownChild.id
    }

    if (!targetChildId) {
      res.status(400).json({ error: 'childId is required when applying on behalf of a student.' })
      return
    }

    const application = await prisma.scholarshipApplication.create({
      data: {
        scholarshipId: req.params.id,
        childId: targetChildId,
        statement: body.statement,
        status: ApplicationStatus.SUBMITTED,
        isDemo: false,
      },
      include: {
        scholarship: { select: { id: true, title: true } },
        child: { select: { id: true, code: true, name: true } },
      },
    })

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'APPLY_SCHOLARSHIP',
      entityType: 'ScholarshipApplication',
      entityId: application.id,
      metadata: { scholarshipId: req.params.id, childId: targetChildId },
    })

    res.status(201).json(application)
  })
)

// PATCH /api/scholarships/applications/:id (Approve or reject application)
router.patch(
  '/scholarships/applications/:id',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.STAFF, UserRole.EDUCATOR),
  validateBody(updateApplicationStatusSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!
    const body = req.body as z.infer<typeof updateApplicationStatusSchema>

    const updated = await prisma.scholarshipApplication.update({
      where: { id: req.params.id },
      data: { status: body.status },
    })

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'REVIEW_SCHOLARSHIP_APPLICATION',
      entityType: 'ScholarshipApplication',
      entityId: updated.id,
      metadata: { status: body.status },
    })

    res.json(updated)
  })
)

// ── Mentors & Mentorship Sessions ─────────────────────────────────────────────

// GET /api/mentors
router.get(
  '/mentors',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!

    let studentChildId: string | undefined
    if (user.role === UserRole.STUDENT) {
      const ownChild = await prisma.child.findUnique({
        where: { studentUserId: user.id },
        select: { id: true },
      })
      studentChildId = ownChild?.id
    }

    const [mentors, sessions] = await Promise.all([
      prisma.mentor.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { sessions: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.mentorshipSession.findMany({
        where: studentChildId ? { childId: studentChildId } : {},
        include: {
          mentor: { select: { id: true, name: true, specialty: true } },
          child: { select: { id: true, code: true, name: true } },
        },
        orderBy: { sessionDate: 'desc' },
        take: 50,
      }),
    ])

    res.json({ mentors, sessions })
  })
)

// POST /api/mentorship/sessions
router.post(
  '/mentorship/sessions',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.STAFF, UserRole.EDUCATOR),
  validateBody(createSessionSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!
    const body = req.body as z.infer<typeof createSessionSchema>

    const session = await prisma.mentorshipSession.create({
      data: {
        mentorId: body.mentorId,
        childId: body.childId,
        topic: body.topic,
        sessionDate: new Date(body.sessionDate),
        durationMin: body.durationMin,
        notes: body.notes,
        isDemo: false,
      },
      include: {
        mentor: { select: { id: true, name: true, specialty: true } },
        child: { select: { id: true, code: true, name: true } },
      },
    })

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'CREATE_MENTORSHIP_SESSION',
      entityType: 'MentorshipSession',
      entityId: session.id,
      metadata: { mentorId: body.mentorId, childId: body.childId },
    })

    res.status(201).json(session)
  })
)

export default router