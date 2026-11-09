"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const yearSchema = z.object({
  yearLabel: z
    .string()
    .min(2, "กรุณาระบุปีการศึกษาอย่างน้อย 2 ตัวอักษร")
    .max(20),
  isActive: z.boolean().default(true),
});

export async function createAcademicYear(formData: FormData) {
  await requirePermission("academic:manage");

  const validated = yearSchema.parse({
    yearLabel: formData.get("yearLabel"),
    isActive: formData.get("isActive") === "true",
  });

  const existing = await prisma.academicYear.findUnique({
    where: { yearLabel: validated.yearLabel },
  });

  if (existing) {
    throw new Error(`ปีการศึกษา "${validated.yearLabel}" มีอยู่ในระบบแล้ว`);
  }

  await prisma.academicYear.create({
    data: validated,
  });

  revalidatePath("/academic/years");
  revalidatePath("/dashboard");
}

export async function toggleAcademicYearStatus(
  id: string,
  currentStatus: boolean
) {
  await requirePermission("academic:manage");

  await prisma.academicYear.update({
    where: { id },
    data: { isActive: !currentStatus },
  });

  revalidatePath("/academic/years");
  revalidatePath("/dashboard");
}

export async function updateAcademicYear(id: string, formData: FormData) {
  await requirePermission("academic:manage");

  const validated = yearSchema.parse({
    yearLabel: formData.get("yearLabel"),
    isActive: formData.get("isActive") === "true",
  });

  const existing = await prisma.academicYear.findFirst({
    where: {
      yearLabel: validated.yearLabel,
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error(
      `ปีการศึกษา "${validated.yearLabel}" ซ้ำกับรายการอื่นในระบบ`
    );
  }

  await prisma.academicYear.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/academic/years");
  revalidatePath("/dashboard");
}
