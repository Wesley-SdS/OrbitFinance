import { prisma } from "@/lib/prisma"

interface AuditLogData {
  userId: string
  action: "CREATE" | "UPDATE" | "DELETE" | "SOFT_DELETE"
  entity: string
  entityId: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValues: data.oldValues as any,
        newValues: data.newValues as any,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}

export function extractChanges<T extends Record<string, unknown>>(
  oldData: T,
  newData: T
): { old: Partial<T>; new: Partial<T> } {
  const oldChanges: Partial<T> = {}
  const newChanges: Partial<T> = {}

  Object.keys(newData).forEach((key) => {
    if (oldData[key] !== newData[key]) {
      oldChanges[key as keyof T] = oldData[key] as T[keyof T]
      newChanges[key as keyof T] = newData[key] as T[keyof T]
    }
  })

  return { old: oldChanges, new: newChanges }
}
