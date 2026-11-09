"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const roomSchema = z.object({
  code: z.string().min(2, "รหัสห้องสอบต้องมีอย่างน้อย 2 ตัวอักษร").max(50),
  nameTh: z.string().min(2, "ชื่อห้องสอบต้องมีอย่างน้อย 2 ตัวอักษร").max(255),
  building: z.string().max(255).optional(),
  floor: z.string().max(50).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

export async function createExaminationRoom(formData: FormData) {
  await requirePermission("academic:manage");

  const validated = roomSchema.parse({
    code: formData.get("code"),
    nameTh: formData.get("nameTh"),
    building: (formData.get("building") as string) || undefined,
    floor: (formData.get("floor") as string) || undefined,
    capacity: formData.get("capacity") || undefined,
    isActive: formData.get("isActive") === "true",
  });

  const existing = await prisma.examinationRoom.findUnique({
    where: { code: validated.code },
  });

  if (existing) {
    throw new Error(`รหัสห้องสอบ "${validated.code}" มีอยู่ในระบบแล้ว`);
  }

  await prisma.examinationRoom.create({
    data: validated,
  });

  revalidatePath("/academic/rooms");
  revalidatePath("/dashboard");
}

export async function toggleExaminationRoomStatus(
  id: string,
  currentStatus: boolean
) {
  await requirePermission("academic:manage");

  await prisma.examinationRoom.update({
    where: { id },
    data: { isActive: !currentStatus },
  });

  revalidatePath("/academic/rooms");
  revalidatePath("/dashboard");
}

export async function updateExaminationRoom(id: string, formData: FormData) {
  await requirePermission("academic:manage");

  const validated = roomSchema.parse({
    code: formData.get("code"),
    nameTh: formData.get("nameTh"),
    building: (formData.get("building") as string) || undefined,
    floor: (formData.get("floor") as string) || undefined,
    capacity: formData.get("capacity") || undefined,
    isActive: formData.get("isActive") === "true",
  });

  const existing = await prisma.examinationRoom.findFirst({
    where: {
      code: validated.code,
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error(`รหัสห้องสอบ "${validated.code}" ซ้ำกับห้องสอบอื่น`);
  }

  await prisma.examinationRoom.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/academic/rooms");
  revalidatePath("/dashboard");
}
