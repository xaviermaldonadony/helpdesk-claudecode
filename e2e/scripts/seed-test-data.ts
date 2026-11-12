// Creates the known test users (admin and agent) in the e2e database.
// Expects the tables to be empty (prepare-db.ts truncates first).
// Imported dynamically after DATABASE_URL is set, because server/src/db.ts reads it on import.
import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { prisma } from '../../server/src/db'
import { Role } from '../../server/src/generated/prisma/enums'
import { TEST_USERS } from '../env'

const users = [
  { ...TEST_USERS.admin, role: Role.admin },
  { ...TEST_USERS.agent, role: Role.agent },
]

export async function seedTestData(): Promise<void> {
  try {
    for (const user of users) {
      const userId = randomUUID()
      const hashedPassword = await hashPassword(user.password)
      await prisma.$transaction([
        prisma.user.create({
          data: {
            id: userId,
            name: user.name,
            email: user.email,
            emailVerified: true,
            role: user.role,
          },
        }),
        prisma.account.create({
          data: {
            id: randomUUID(),
            accountId: userId,
            providerId: 'credential',
            userId,
            password: hashedPassword,
          },
        }),
      ])
      console.log(`[e2e] Seeded ${user.role} ${user.email}.`)
    }
  } finally {
    // The pool would keep the process alive, and the API start command chains after this script.
    await prisma.$disconnect()
  }
}
