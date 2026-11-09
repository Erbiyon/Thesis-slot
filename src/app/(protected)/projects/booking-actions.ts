"use server";

import prisma from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-guards";
import { assertProjectAccess } from "@/lib/project-guards";
import {
  acquireSchedulingLocks,
  getBookingLockKeys,
  runBookingTransactionWithRetry,
} from "@/lib/booking-concurrency";
import {
  validateBookingInterval,
  findRoomConflict,
  findFacultyConflict,
  findProjectBookingConflict,
} from "@/lib/booking-conflict";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ExaminationBookingStatus, BookingHistoryAction } from "@prisma/client";

const requestBookingSchema = z.object({
  projectId: z.string().min(1, "กรุณาระบุรหัสโครงงาน"),
  examinationRoomId: z.string().min(1, "กรุณาเลือกห้องสอบ"),
  academicTermId: z.string().min(1, "กรุณาระบุภาคการศึกษา"),
  startAt: z.string().min(1, "กรุณาระบุวันเวลาเริ่มต้น"),
  endAt: z.string().min(1, "กรุณาระบุวันเวลาสิ้นสุด"),
});

/**
 * Student requests an examination booking.
 * Fully concurrency-safe with scoped MySQL row locking and retry.
 */
export async function requestExaminationBooking(formData: FormData) {
  const { user } = await requireAuth();

  const validated = requestBookingSchema.parse({
    projectId: formData.get("projectId"),
    examinationRoomId: formData.get("examinationRoomId"),
    academicTermId: formData.get("academicTermId"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
  });

  const startAt = new Date(validated.startAt);
  const endAt = new Date(validated.endAt);
  validateBookingInterval(startAt, endAt);

  // Authorize student access and leadership
  const { isLeader, project } = await assertProjectAccess(
    validated.projectId,
    true
  );
  if (!isLeader) {
    throw new Error("เฉพาะหัวหน้ากลุ่มโครงงานเท่านั้นที่สามารถยื่นขอจองสอบได้");
  }

  if (project.reviewStatus !== "APPROVED") {
    throw new Error(
      "โครงงานต้องได้รับการอนุมัติการลงทะเบียนก่อนจึงจะสามารถจองสอบได้"
    );
  }

  // Pre-fetch participating faculty (accepted advisor + accepted committee)
  const acceptedAdvisor = project.advisorRequests.find(
    (r) => r.status === "ACCEPTED"
  );
  if (!acceptedAdvisor) {
    throw new Error("โครงงานต้องมีอาจารย์ที่ปรึกษาตอบรับแล้วก่อนทำการจองสอบ");
  }

  const acceptedCommittees = await prisma.examinationCommitteeMember.findMany({
    where: {
      projectId: validated.projectId,
      invitationStatus: "ACCEPTED",
    },
    select: { facultyProfileId: true },
  });

  const facultyProfileIds = Array.from(
    new Set([
      acceptedAdvisor.facultyProfileId,
      ...acceptedCommittees.map((c) => c.facultyProfileId),
    ])
  );

  // Prepare deterministic lock keys
  const lockKeys = getBookingLockKeys({
    roomId: validated.examinationRoomId,
    facultyProfileIds,
    projectId: validated.projectId,
  });

  // Execute in concurrency-safe transaction with retry
  const newBooking = await runBookingTransactionWithRetry(async (tx) => {
    // 1. Acquire row-level locks
    await acquireSchedulingLocks(tx, lockKeys);

    // 2. Re-verify project eligibility & active booking conflicts
    const existingActiveBooking = await findProjectBookingConflict(tx, {
      projectId: validated.projectId,
    });
    if (existingActiveBooking) {
      throw new Error(
        "โครงงานนี้มีคำขอหรือกำหนดการสอบที่กำลังดำเนินการอยู่แล้ว"
      );
    }

    // 3. Re-verify room conflict
    const roomConflict = await findRoomConflict(tx, {
      roomId: validated.examinationRoomId,
      startAt,
      endAt,
    });
    if (roomConflict) {
      throw new Error(
        `ห้องสอบ ${roomConflict.examinationRoom.nameTh} ถูกจองในช่วงเวลาดังกล่าวแล้ว กรุณาเลือกห้องหรือเวลาอื่น`
      );
    }

    // 4. Re-verify faculty conflict (examiners + advisor)
    const facultyConflict = await findFacultyConflict(tx, {
      facultyProfileIds,
      startAt,
      endAt,
    });
    if (facultyConflict) {
      throw new Error(`พบข้อขัดแย้งเวลาของอาจารย์: ${facultyConflict.reason}`);
    }

    // 5. Create booking with PENDING_REVIEW (Provisional Hold)
    const booking = await tx.examinationBooking.create({
      data: {
        projectId: validated.projectId,
        examinationRoomId: validated.examinationRoomId,
        academicTermId: validated.academicTermId,
        startAt,
        endAt,
        status: ExaminationBookingStatus.PENDING_REVIEW,
        requestedByUserId: user.id,
      },
    });

    // 6. Record audit history
    await tx.examinationBookingHistory.create({
      data: {
        bookingId: booking.id,
        actorUserId: user.id,
        action: BookingHistoryAction.SUBMIT_REQUEST,
        previousStatus: null,
        newStatus: ExaminationBookingStatus.PENDING_REVIEW,
        details: `ยื่นคำขอจองสอบสำหรับวันที่ ${startAt.toISOString().slice(0, 10)}`,
      },
    });

    return booking;
  });

  revalidatePath(`/projects/${validated.projectId}`);
  revalidatePath(`/projects/${validated.projectId}/examination-booking`);
  revalidatePath(`/academic/examination-bookings`);
  revalidatePath(`/dashboard`);
  return newBooking.id;
}

/**
 * Academic Staff reviews booking request (CONFIRM or REJECT).
 */
export async function reviewExaminationBooking(
  bookingId: string,
  decision: "CONFIRMED" | "REJECTED",
  reason?: string
) {
  const { user } = await requireRole(["ACADEMIC_STAFF", "ADMIN"]);

  const booking = await prisma.examinationBooking.findUnique({
    where: { id: bookingId },
    include: {
      project: {
        include: {
          advisorRequests: { where: { status: "ACCEPTED" } },
          committeeMembers: { where: { invitationStatus: "ACCEPTED" } },
        },
      },
    },
  });

  if (!booking) throw new Error("ไม่พบรายการจองสอบ");
  if (booking.status !== "PENDING_REVIEW") {
    throw new Error("รายการจองนี้ไม่ได้อยู่ในสถานะรอการตรวจสอบ");
  }

  const facultyProfileIds = Array.from(
    new Set([
      ...booking.project.advisorRequests.map((r) => r.facultyProfileId),
      ...booking.project.committeeMembers.map((c) => c.facultyProfileId),
    ])
  );

  const lockKeys = getBookingLockKeys({
    roomId: booking.examinationRoomId,
    facultyProfileIds,
    projectId: booking.projectId,
  });

  await runBookingTransactionWithRetry(async (tx) => {
    await acquireSchedulingLocks(tx, lockKeys);

    if (decision === "CONFIRMED") {
      // Re-verify room conflict before finalizing
      const roomConflict = await findRoomConflict(tx, {
        roomId: booking.examinationRoomId,
        startAt: booking.startAt,
        endAt: booking.endAt,
        excludeBookingId: booking.id,
      });
      if (roomConflict) {
        throw new Error("ห้องสอบติดการใช้งานอื่นแล้ว ไม่สามารถยืนยันการจองได้");
      }

      await tx.examinationBooking.update({
        where: { id: bookingId },
        data: {
          status: ExaminationBookingStatus.CONFIRMED,
          reviewedByUserId: user.id,
          reviewedAt: new Date(),
          confirmedAt: new Date(),
          reviewReason: reason?.trim() || null,
        },
      });

      await tx.examinationBookingHistory.create({
        data: {
          bookingId,
          actorUserId: user.id,
          action: BookingHistoryAction.CONFIRM_BOOKING,
          previousStatus: ExaminationBookingStatus.PENDING_REVIEW,
          newStatus: ExaminationBookingStatus.CONFIRMED,
          details: reason?.trim() || "อนุมัติการจองสอบเรียบร้อย",
        },
      });
    } else {
      // REJECTED (Releases provisional hold)
      await tx.examinationBooking.update({
        where: { id: bookingId },
        data: {
          status: ExaminationBookingStatus.REJECTED,
          reviewedByUserId: user.id,
          reviewedAt: new Date(),
          reviewReason: reason?.trim() || "ปฏิเสธคำขอจองสอบ",
        },
      });

      await tx.examinationBookingHistory.create({
        data: {
          bookingId,
          actorUserId: user.id,
          action: BookingHistoryAction.REJECT_BOOKING,
          previousStatus: ExaminationBookingStatus.PENDING_REVIEW,
          newStatus: ExaminationBookingStatus.REJECTED,
          details: reason?.trim() || "ปฏิเสธคำขอจองสอบ",
        },
      });
    }
  });

  revalidatePath(`/academic/examination-bookings`);
  revalidatePath(`/academic/examination-calendar`);
  revalidatePath(`/projects/${booking.projectId}`);
  revalidatePath(`/dashboard`);
}

/**
 * Reschedule an existing booking atomically.
 */
export async function rescheduleExaminationBooking(
  bookingId: string,
  newRoomId: string,
  newStartAt: Date,
  newEndAt: Date,
  reason?: string
) {
  const { user, role } = await requireAuth();
  validateBookingInterval(newStartAt, newEndAt);

  const booking = await prisma.examinationBooking.findUnique({
    where: { id: bookingId },
    include: {
      project: {
        include: {
          advisorRequests: { where: { status: "ACCEPTED" } },
          committeeMembers: { where: { invitationStatus: "ACCEPTED" } },
        },
      },
    },
  });

  if (!booking) throw new Error("ไม่พบรายการจองสอบ");
  if (booking.status !== "PENDING_REVIEW" && booking.status !== "CONFIRMED") {
    throw new Error(
      "ไม่สามารถเลื่อนกำหนดการสอบสำหรับรายการที่ถูกยกเลิกหรือปฏิเสธแล้วได้"
    );
  }

  // Authorization: Only Staff, Admin or the Project Leader can reschedule
  const isLeader = booking.project.createdByUserId === user.id;
  const isStaff = role === "ACADEMIC_STAFF" || role === "ADMIN";
  if (!isLeader && !isStaff) {
    throw new Error("คุณไม่มีสิทธิ์ในการขอเปลี่ยนแปลงกำหนดการสอบนี้");
  }

  const facultyProfileIds = Array.from(
    new Set([
      ...booking.project.advisorRequests.map((r) => r.facultyProfileId),
      ...booking.project.committeeMembers.map((c) => c.facultyProfileId),
    ])
  );

  // Lock both old and new room keys + faculty + project
  const lockKeys = Array.from(
    new Set([
      ...getBookingLockKeys({
        roomId: booking.examinationRoomId,
        facultyProfileIds,
        projectId: booking.projectId,
      }),
      `room:${newRoomId}`,
    ])
  );

  await runBookingTransactionWithRetry(async (tx) => {
    await acquireSchedulingLocks(tx, lockKeys);

    // Verify room conflict for NEW slot
    const roomConflict = await findRoomConflict(tx, {
      roomId: newRoomId,
      startAt: newStartAt,
      endAt: newEndAt,
      excludeBookingId: booking.id,
    });
    if (roomConflict) {
      throw new Error(
        `ห้องสอบ ${roomConflict.examinationRoom.nameTh} ถูกจองในช่วงเวลาดังกล่าวแล้ว`
      );
    }

    // Verify faculty conflict for NEW slot
    const facultyConflict = await findFacultyConflict(tx, {
      facultyProfileIds,
      startAt: newStartAt,
      endAt: newEndAt,
      excludeBookingId: booking.id,
    });
    if (facultyConflict) {
      throw new Error(`พบข้อขัดแย้งเวลาของอาจารย์: ${facultyConflict.reason}`);
    }

    // Update booking
    await tx.examinationBooking.update({
      where: { id: bookingId },
      data: {
        examinationRoomId: newRoomId,
        startAt: newStartAt,
        endAt: newEndAt,
        status: isStaff
          ? booking.status
          : ExaminationBookingStatus.PENDING_REVIEW,
      },
    });

    await tx.examinationBookingHistory.create({
      data: {
        bookingId,
        actorUserId: user.id,
        action: BookingHistoryAction.RESCHEDULE_BOOKING,
        previousStatus: booking.status,
        newStatus: isStaff
          ? booking.status
          : ExaminationBookingStatus.PENDING_REVIEW,
        details:
          reason?.trim() ||
          `เลื่อนวันเวลาสอบเป็น ${newStartAt.toISOString().slice(0, 16)}`,
      },
    });
  });

  revalidatePath(`/academic/examination-bookings`);
  revalidatePath(`/academic/examination-calendar`);
  revalidatePath(`/projects/${booking.projectId}`);
  revalidatePath(`/dashboard`);
}

/**
 * Cancel an existing booking. Releases reserved resource locks.
 */
export async function cancelExaminationBooking(
  bookingId: string,
  reason?: string
) {
  const { user, role } = await requireAuth();

  const booking = await prisma.examinationBooking.findUnique({
    where: { id: bookingId },
    include: { project: true },
  });

  if (!booking) throw new Error("ไม่พบรายการจองสอบ");
  if (booking.status === "CANCELLED" || booking.status === "REJECTED") {
    throw new Error("รายการนี้ถูกยกเลิกไปแล้ว");
  }

  const isLeader = booking.project.createdByUserId === user.id;
  const isStaff = role === "ACADEMIC_STAFF" || role === "ADMIN";
  if (!isLeader && !isStaff) {
    throw new Error("คุณไม่มีสิทธิ์ยกเลิกการจองสอบนี้");
  }

  await prisma.$transaction(async (tx) => {
    await tx.examinationBooking.update({
      where: { id: bookingId },
      data: {
        status: ExaminationBookingStatus.CANCELLED,
        cancelledAt: new Date(),
        reviewReason: reason?.trim() || "ยกเลิกการจองสอบ",
      },
    });

    await tx.examinationBookingHistory.create({
      data: {
        bookingId,
        actorUserId: user.id,
        action: BookingHistoryAction.CANCEL_BOOKING,
        previousStatus: booking.status,
        newStatus: ExaminationBookingStatus.CANCELLED,
        details: reason?.trim() || "ยกเลิกการจองสอบ",
      },
    });
  });

  revalidatePath(`/academic/examination-bookings`);
  revalidatePath(`/academic/examination-calendar`);
  revalidatePath(`/projects/${booking.projectId}`);
  revalidatePath(`/dashboard`);
}
