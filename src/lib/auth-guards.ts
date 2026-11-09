import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasPermission, Permission, Role } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function getCurrentSession() {
  const h = await headers();
  return auth.api.getSession({
    headers: h,
  });
}

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session || !session.user) {
    redirect("/login");
  }

  // Check if suspended
  if (session.user.banned) {
    redirect("/login?error=suspended");
  }

  // Verify isActive from database
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isActive: true, banned: true },
  });

  if (!dbUser || !dbUser.isActive || dbUser.banned) {
    redirect("/login?error=suspended");
  }

  return {
    session,
    user: session.user,
    role: (dbUser.role?.toUpperCase() || "STUDENT") as Role,
  };
}

export async function requirePermission(permission: Permission) {
  const authContext = await requireAuth();
  if (!hasPermission(authContext.role, permission)) {
    redirect("/dashboard?error=unauthorized");
  }
  return authContext;
}

export async function requireRole(allowedRoles: Role[]) {
  const authContext = await requireAuth();
  if (!allowedRoles.includes(authContext.role)) {
    redirect("/dashboard?error=unauthorized");
  }
  return authContext;
}
