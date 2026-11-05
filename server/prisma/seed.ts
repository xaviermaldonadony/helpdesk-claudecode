// Creates the initial admin user. Sign-up is disabled, so this is the only way
// to create the first account. Safe to run more than once.
//
// Run from server/: bun x prisma db seed (command set in prisma.config.ts)
import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { prisma } from '../src/db';
import { Role } from '../src/generated/prisma/enums';

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error(
    'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in server/.env',
  );
}

async function seedAdmin(adminEmail: string, adminPassword: string) {
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    if (existing.role === Role.admin) {
      console.log(`Admin ${adminEmail} already exists. Nothing to do.`);
      return;
    }
    // Keep the existing password; only the role is changed.
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: Role.admin },
    });
    console.log(`Promoted existing user ${adminEmail} to admin.`);
    return;
  }

  const userId = randomUUID();
  const hashedPassword = await hashPassword(adminPassword);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        name: 'Admin',
        email: adminEmail,
        emailVerified: false,
        role: Role.admin,
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
  ]);
  console.log(`Created admin ${adminEmail}.`);
}

try {
  await seedAdmin(email, password);
} finally {
  await prisma.$disconnect();
}
