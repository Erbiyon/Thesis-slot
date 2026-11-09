"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@/lib/permissions";

const createUserSchema = z.object({
  name: z.string().min(2, "ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร"),
  role: z.enum(["ADMIN", "ACADEMIC_STAFF", "FACULTY", "STUDENT"]),
});

export async function createProvisionedUser(formData: FormData) {
  await requirePermission("users:manage");

  const validated = createUserSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  const existing = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existing) {
    throw new Error(`อีเมล "${validated.email}" มีอยู่ในระบบแล้ว`);
  }

  // Create user via Better Auth API
  const newUser = await auth.api.createUser({
    body: {
      name: validated.name,
      email: validated.email,
      password: validated.password,
      role: validated.role === "ADMIN" ? "admin" : "user",
    },
  });

  if (!newUser || !newUser.user) {
    throw new Error("เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้");
  }

  // Ensure role and active status
  await prisma.user.update({
    where: { id: newUser.user.id },
    data: {
      role: validated.role,
      isActive: true,
      emailVerified: true,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
}

export async function toggleUserSuspension(
  userId: string,
  isSuspended: boolean
) {
  const authContext = await requirePermission("users:manage");

  // Prevent self-suspension
  if (authContext.user.id === userId) {
    throw new Error("ไม่อนุญาตให้ระงับการใช้งานบัญชีของตนเอง");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      banned: !isSuspended,
      banReason: !isSuspended ? "ระงับการใช้งานโดยผู้ดูแลระบบ" : null,
      isActive: isSuspended, // if was suspended (!isActive), now active
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
}

export async function updateUserRole(userId: string, newRole: Role) {
  const authContext = await requirePermission("users:manage");

  // Prevent self-role change to avoid losing admin access accidentally
  if (authContext.user.id === userId) {
    throw new Error("ไม่อนุญาตให้เปลี่ยนระดับสิทธิ์ของตนเอง");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
}
