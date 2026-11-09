"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FacultyAvailabilityType } from "@prisma/client";

const availabilitySchema = z.object({
  startAt: z.string().min(1, "ระบุเวลาเริ่มต้น"),
  endAt: z.string().min(1, "ระบุเวลาสิ้นสุด"),
  availabilityType: z
    .nativeEnum(FacultyAvailabilityType)
    .default("UNAVAILABLE"),
  note: z.string().max(500).optional(),
});

export async function addFacultyAvailability(formData: FormData) {
  const { user } = await requireAuth();

  const facultyProfile = await prisma.facultyProfile.findUnique({
    where: { userId: user.id },
  });

  if (!facultyProfile) {
    throw new Error("เฉพาะอาจารย์เท่านั้นที่สามารถบันทึกตารางเวลาได้");
  }

  const validated = availabilitySchema.parse({
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    availabilityType: formData.get("availabilityType"),
    note: formData.get("note") || undefined,
  });

  const start = new Date(validated.startAt);
  const end = new Date(validated.endAt);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    throw new Error("ช่วงเวลาเริ่มต้นต้องเกิดขึ้นก่อนเวลาสิ้นสุด");
  }

  const created = await prisma.facultyAvailability.create({
    data: {
      facultyProfileId: facultyProfile.id,
      startAt: start,
      endAt: end,
      availabilityType: validated.availabilityType,
      note: validated.note,
    },
  });

  revalidatePath("/faculty/availability");
  return created.id;
}

export async function removeFacultyAvailability(id: string) {
  const { user } = await requireAuth();

  const facultyProfile = await prisma.facultyProfile.findUnique({
    where: { userId: user.id },
  });

  if (!facultyProfile) {
    throw new Error("เฉพาะอาจารย์เท่านั้นที่สามารถจัดการตารางเวลาได้");
  }

  const item = await prisma.facultyAvailability.findUnique({
    where: { id },
  });

  if (!item || item.facultyProfileId !== facultyProfile.id) {
    throw new Error("ไม่พบรายการหรือคุณไม่มีสิทธิ์ลบรายการนี้");
  }

  await prisma.facultyAvailability.delete({
    where: { id },
  });

  revalidatePath("/faculty/availability");
}
