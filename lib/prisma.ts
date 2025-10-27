import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Helper for optimized queries
export const createOptimizedQuery = () => {
  return prisma.$extends({
    query: {
      transaction: {
        async findMany({ args, query }) {
          // Default to select instead of include for better performance
          if (args.include && !args.select) {
            args.select = {
              id: true,
              type: true,
              amount: true,
              description: true,
              date: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
              financialAccount: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  currency: true
                }
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  color: true
                }
              }
            }
            delete args.include
          }
          return query(args)
        }
      }
    }
  })
}