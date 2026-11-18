import { MovementType, Resource, StockMovement, UserRole } from '@prisma/client'
import { RequestHandler, Router } from 'express'
import { logAudit, prisma, validateBody, z } from '../lib/validation'
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth'

const router = Router()

const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

const createResourceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  unit: z.string().trim().min(1).max(30).default('units'),
  stock: z.number().int().min(0),
  lowThreshold: z.number().int().min(0).default(10),
})

const createMovementSchema = z.object({
  type: z.nativeEnum(MovementType),
  quantity: z.number().int().positive(),
  reason: z.string().trim().min(2).max(300),
})

type MovementTxResult =
  | { ok: false; error: string; status: 400 | 404 }
  | {
      ok: true
      updatedResource: Resource
      movement: StockMovement & { performedBy: { id: string; name: string } | null }
    }

// GET /api/resources?category=...&lowStock=true
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const category =
      typeof req.query.category === 'string' && req.query.category.trim()
        ? req.query.category.trim()
        : undefined
    const lowStockOnly = req.query.lowStock === 'true'

    const resources = await prisma.resource.findMany({
      where: category ? { category: { equals: category, mode: 'insensitive' } } : {},
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            performedBy: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    const enriched = resources.map((r) => ({
      ...r,
      isLowStock: r.stock <= r.lowThreshold,
    }))

    res.json(lowStockOnly ? enriched.filter((r) => r.isLowStock) : enriched)
  })
)

// GET /api/resources/:id
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 25,
          include: {
            performedBy: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!resource) {
      res.status(404).json({ error: 'Resource not found.' })
      return
    }

    res.json({
      ...resource,
      isLowStock: resource.stock <= resource.lowThreshold,
    })
  })
)

// POST /api/resources (Create a new inventory item)
router.post(
  '/',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.STAFF),
  validateBody(createResourceSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!
    const body = req.body as z.infer<typeof createResourceSchema>

    const resource = await prisma.resource.create({
      data: {
        organizationId: user.organizationId,
        name: body.name,
        category: body.category,
        unit: body.unit,
        stock: body.stock,
        lowThreshold: body.lowThreshold,
        isDemo: false,
      },
    })

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'CREATE_RESOURCE',
      entityType: 'Resource',
      entityId: resource.id,
      metadata: { name: resource.name, initialStock: resource.stock },
    })

    res.status(201).json({
      ...resource,
      isLowStock: resource.stock <= resource.lowThreshold,
    })
  })
)

// POST /api/resources/:id/movements (Atomic stock INCOMING / OUTGOING / ADJUSTMENT)
router.post(
  '/:id/movements',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.STAFF),
  validateBody(createMovementSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!
    const body = req.body as z.infer<typeof createMovementSchema>

    const result = await prisma.$transaction<MovementTxResult>(async (tx) => {
      const resource = await tx.resource.findUnique({
        where: { id: req.params.id },
      })

      if (!resource) {
        return { ok: false, error: 'Resource not found.', status: 404 }
      }

      let nextStock = resource.stock
      if (body.type === MovementType.INCOMING) {
        nextStock += body.quantity
      } else if (body.type === MovementType.OUTGOING) {
        if (resource.stock < body.quantity) {
          return {
            ok: false,
            error: `Insufficient stock (${resource.stock} ${resource.unit} available).`,
            status: 400,
          }
        }
        nextStock -= body.quantity
      } else {
        // ADJUSTMENT sets exact verified count
        nextStock = body.quantity
      }

      const [updatedResource, movement] = await Promise.all([
        tx.resource.update({
          where: { id: resource.id },
          data: { stock: nextStock },
        }),
        tx.stockMovement.create({
          data: {
            resourceId: resource.id,
            performedById: user.id,
            type: body.type,
            quantity: body.quantity,
            reason: body.reason,
            isDemo: false,
          },
          include: {
            performedBy: { select: { id: true, name: true } },
          },
        }),
      ])

      return { ok: true, updatedResource, movement }
    })

    if (!result.ok) {
      res.status(result.status).json({ error: result.error })
      return
    }

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      action: `STOCK_${body.type}`,
      entityType: 'Resource',
      entityId: result.updatedResource.id,
      metadata: {
        quantity: body.quantity,
        newStock: result.updatedResource.stock,
        reason: body.reason,
      },
    })

    res.status(201).json({
      resource: {
        ...result.updatedResource,
        isLowStock: result.updatedResource.stock <= result.updatedResource.lowThreshold,
      },
      movement: result.movement,
    })
  })
)

export default router