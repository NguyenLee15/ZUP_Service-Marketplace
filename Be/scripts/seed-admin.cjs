const { PrismaClient, UserRole, UserStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME || 'Staging Admin';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, status: true },
  });

  if (existing) {
    if (existing.role !== UserRole.ADMIN) {
      throw new Error(
        `User ${email} already exists but is not ADMIN. Refusing to modify it.`,
      );
    }

    console.log(`Admin exists: id=${existing.id}, status=${existing.status}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      permissions: [],
    },
    select: { id: true, email: true, role: true, status: true },
  });

  console.log(
    `Created admin: id=${admin.id}, email=${admin.email}, role=${admin.role}, status=${admin.status}`,
  );
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Admin seed failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
