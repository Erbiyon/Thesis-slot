"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const termSchema = z.object({
  academicYearId: z.string().min(1, "กรุณาเลือกปีการศึกษา"),
  termCode: z.string().min(1, "กรุณาระบุรหัสภาคการศึกษา").max(10),
  nameTh: z.string().min(2, "กรุณาระบุชื่อภาคการศึกษา").max(100),
  isActive: z.boolean().default(true),
});

export async function createAcademicTerm(formData: FormData) {
  await requirePermission("academic:manage");

  const validated = termSchema.parse({
    academicYearId: formData.get("academicYearId"),
    termCode: formData.get("termCode"),
    nameTh: formData.get("nameTh"),
    isActive: formData.get("isActive") === "true",
  });

  const existing = await prisma.academicTerm.findUnique({
    where: {
      academicYearId_termCode: {
        academicYearId: validated.academicYearId,
        termCode: validated.termCode,
      },
    },
  });

  if (existing) {
    throw new Error(`ภาคการศึกษานี้มีอยู่ในปีการศึกษาที่เลือกแล้ว`);
  }

  await prisma.academicTerm.create({
    data: validated,
  });

  revalidatePath("/academic/terms");
  revalidatePath("/dashboard");
}

export async function toggleAcademicTermStatus(
  id: string,
  currentStatus: boolean
) {
  await requirePermission("academic:manage");

  await prisma.academicTerm.update({
    where: { id },
    data: { isActive: !currentStatus },
  });

  revalidatePath("/academic/terms");
  revalidatePath("/dashboard");
}

export async function updateAcademicTerm(id: string, formData: FormData) {
  await requirePermission("academic:manage");

  const validated = termSchema.parse({
    academicYearId: formData.get("academicYearId"),
    termCode: formData.get("termCode"),
    nameTh: formData.get("nameTh"),
    isActive: formData.get("isActive") === "true",
  });

  const existing = await prisma.academicTerm.findFirst({
    where: {
      academicYearId: validated.academicYearId,
      termCode: validated.termCode,
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error(
      `ภาคการศึกษารหัส "${validated.termCode}" ซ้ำกับรายการอื่นในปีการศึกษานี้`
    );
  }

  await prisma.academicTerm.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/academic/terms");
  revalidatePath("/dashboard");
}
