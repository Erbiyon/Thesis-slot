import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const name =
    process.env.ADMIN_NAME || process.argv[4] || "System Administrator";

  if (!email || !password) {
    console.error(
      "Usage: node --env-file=.env.local scripts/bootstrap-admin.ts <email> <password> [name]"
    );
    console.error("Or set ADMIN_EMAIL and ADMIN_PASSWORD in environment.");
    process.exit(1);
  }

  // Reject duplicate bootstrap
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.error(
      `Error: User with email "${email}" already exists. Duplicate bootstrap rejected.`
    );
    process.exit(1);
  }

  // Check if any admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log(
      `Notice: An administrator account already exists (${existingAdmin.email}).`
    );
    console.log(
      `Creating another administrator requires confirmation or existing admin credentials.`
    );
  }

  console.log(`Creating initial administrator account: ${email}...`);

  // Create user using Better Auth API
  const newUser = await auth.api.createUser({
    body: {
      email,
      password,
      name,
      role: "admin",
    },
  });

  if (!newUser || !newUser.user) {
    throw new Error("Failed to create admin user via Better Auth API.");
  }

  // Explicitly ensure role is set to ADMIN and active
  await prisma.user.update({
    where: { id: newUser.user.id },
    data: {
      role: "ADMIN",
      isActive: true,
      emailVerified: true,
    },
  });

  console.log(
    "Success: Initial administrator account has been safely initialized."
  );
  console.log(`User ID: ${newUser.user.id}`);
  console.log(`Role: ADMIN`);
  await prisma.$disconnect();
}

bootstrapAdmin().catch((err) => {
  console.error("Bootstrap Failed:", err);
  process.exit(1);
});
