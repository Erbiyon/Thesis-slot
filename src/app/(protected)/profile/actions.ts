"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร").max(255),
  studentCode: z.string().max(50).optional(),
  academicProgramId: z.string().optional(),
  staffCode: z.string().max(50).optional(),
  department: z.string().max(255).optional(),
  titleTh: z.string().max(100).optional(),
});

export async function updateProfile(formData: FormData) {
  const { user, role } = await requireAuth();

  const validated = profileSchema.parse({
    name: formData.get("name"),
    studentCode: (formData.get("studentCode") as string) || undefined,
    academicProgramId:
      (formData.get("academicProgramId") as string) || undefined,
    staffCode: (formData.get("staffCode") as string) || undefined,
    department: (formData.get("department") as string) || undefined,
    titleTh: (formData.get("titleTh") as string) || undefined,
  });

  // Safe update: Only update name on User model (role, email, banned cannot be changed by user)
  await prisma.user.update({
    where: { id: user.id },
    data: { name: validated.name },
  });

  // Update or upsert student profile
  if (role === "STUDENT" && validated.studentCode) {
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        studentCode: validated.studentCode,
        academicProgramId: validated.academicProgramId || null,
      },
      create: {
        userId: user.id,
        studentCode: validated.studentCode,
        academicProgramId: validated.academicProgramId || null,
      },
    });
  }

  // Update or upsert faculty profile
  if (role === "FACULTY") {
    await prisma.facultyProfile.upsert({
      where: { userId: user.id },
      update: {
        staffCode: validated.staffCode || null,
        department: validated.department || null,
        titleTh: validated.titleTh || null,
      },
      create: {
        userId: user.id,
        staffCode: validated.staffCode || null,
        department: validated.department || null,
        titleTh: validated.titleTh || null,
      },
    });
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}
