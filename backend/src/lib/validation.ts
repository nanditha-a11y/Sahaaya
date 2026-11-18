import { Prisma, PrismaClient } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import { z, ZodSchema } from 'zod'

export const prisma = new PrismaClient()

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed.',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      })
      return
    }
    req.body = result.data
    next()
  }
}

export async function logAudit(params: {
  organizationId: string
  actorId?: string | null
  action: string
  entityType: string
  entityId: string
  metadata?: Prisma.InputJsonValue
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.actorId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    },
  })
}

export { z }