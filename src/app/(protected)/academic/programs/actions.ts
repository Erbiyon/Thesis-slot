"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const programSchema = z.object({
  code: z.string().min(2, "รหัสหลักสูตรต้องมีอย่างน้อย 2 ตัวอักษร").max(50),
  nameTh: z
    .string()
    .min(2, "ชื่อหลักสูตรภาษาไทยต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(255),
  nameEn: z.string().max(255).optional(),
  degree: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
});

export async function createAcademicProgram(formData: FormData) {
  await requirePermission("academic:manage");

  const validated = programSchema.parse({
    code: formData.get("code"),
    nameTh: formData.get("nameTh"),
    nameEn: (formData.get("nameEn") as string) || undefined,
    degree: (formData.get("degree") as string) || undefined,
    isActive: formData.get("isActive") === "true",
  });

  const existing = await prisma.academicProgram.findUnique({
    where: { code: validated.code },
  });

  if (existing) {
    throw new Error(`รหัสหลักสูตร "${validated.code}" มีอยู่ในระบบแล้ว`);
  }

  await prisma.academicProgram.create({
    data: validated,
  });

  revalidatePath("/academic/programs");
  revalidatePath("/dashboard");
}

export async function toggleAcademicProgramStatus(
  id: string,
  currentStatus: boolean
) {
  await requirePermission("academic:manage");

  await prisma.academicProgram.update({
    where: { id },
    data: { isActive: !currentStatus },
  });

  revalidatePath("/academic/programs");
  revalidatePath("/dashboard");
}

export async function updateAcademicProgram(id: string, formData: FormData) {
  await requirePermission("academic:manage");

  const validated = programSchema.parse({
    code: formData.get("code"),
    nameTh: formData.get("nameTh"),
    nameEn: (formData.get("nameEn") as string) || undefined,
    degree: (formData.get("degree") as string) || undefined,
    isActive: formData.get("isActive") === "true",
  });

  const existing = await prisma.academicProgram.findFirst({
    where: {
      code: validated.code,
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error(`รหัสหลักสูตร "${validated.code}" ซ้ำกับหลักสูตรอื่น`);
  }

  await prisma.academicProgram.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/academic/programs");
  revalidatePath("/dashboard");
}
