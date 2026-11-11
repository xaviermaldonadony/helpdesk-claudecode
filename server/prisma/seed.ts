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

// Matches minPasswordLength in Better Auth's defaults.
const MIN_PASSWORD_LENGTH = 8;

if (!email || !password) {
  throw new Error(
    'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in server/.env',
  );
}

if (password.length < MIN_PASSWORD_LENGTH) {
  throw new Error(
    `SEED_ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`,
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
    // Promoting an existing account is a privilege change, so it needs an explicit opt-in.
    if (process.env.SEED_PROMOTE_EXISTING !== 'true') {
      throw new Error(
        `User ${adminEmail} exists but is not an admin. Set SEED_PROMOTE_EXISTING=true to promote it.`,
      );
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
