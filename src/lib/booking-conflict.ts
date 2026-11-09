import { Prisma, ExaminationBookingStatus } from "@prisma/client";

export interface TimeInterval {
  startAt: Date;
  endAt: Date;
}

/**
 * Checks if two half-open intervals [startA, endA) and [startB, endB) overlap.
 * Definition: startA < endB AND endA > startB
 */
export function isOverlapping(a: TimeInterval, b: TimeInterval): boolean {
  return (
    a.startAt.getTime() < b.endAt.getTime() &&
    a.endAt.getTime() > b.startAt.getTime()
  );
}

/**
 * Active statuses that reserve resources according to Phase 3 Provisional-Hold Policy:
 * - PENDING_REVIEW: Provisional Hold
 * - CONFIRMED: Definite Hold
 */
export const ACTIVE_HOLD_STATUSES: ExaminationBookingStatus[] = [
  ExaminationBookingStatus.PENDING_REVIEW,
  ExaminationBookingStatus.CONFIRMED,
];

/**
 * Validates that requested interval is well-formed:
 * - startAt < endAt
 * - duration is between 30 and 480 minutes (configurable default 120 mins)
 * - dates are within valid academic bounds
 */
export function validateBookingInterval(startAt: Date, endAt: Date): void {
  const startMs = startAt.getTime();
  const endMs = endAt.getTime();

  if (isNaN(startMs) || isNaN(endMs)) {
    throw new Error("รูปแบบวันเวลาที่ระบุไม่ถูกต้อง");
  }

  if (startMs >= endMs) {
    throw new Error("เวลาเริ่มต้นการสอบต้องเกิดขึ้นก่อนเวลาสิ้นสุด");
  }

  const durationMinutes = (endMs - startMs) / (1000 * 60);
  if (durationMinutes < 30) {
    throw new Error("ช่วงเวลาการสอบต้องมีความยาวอย่างน้อย 30 นาที");
  }

  if (durationMinutes > 480) {
    throw new Error("ช่วงเวลาการสอบต้องไม่เกิน 8 ชั่วโมงต่อครั้ง");
  }
}

/**
 * Check room conflict inside a transaction.
 * Returns conflicting booking if exists, otherwise null.
 */
export async function findRoomConflict(
  tx: Prisma.TransactionClient,
  params: {
    roomId: string;
    startAt: Date;
    endAt: Date;
    excludeBookingId?: string;
  }
) {
  const conflictingBookings = await tx.examinationBooking.findMany({
    where: {
      examinationRoomId: params.roomId,
      status: { in: ACTIVE_HOLD_STATUSES },
      id: params.excludeBookingId
        ? { not: params.excludeBookingId }
        : undefined,
      startAt: { lt: params.endAt },
      endAt: { gt: params.startAt },
    },
    include: {
      project: { select: { id: true, titleTh: true } },
      examinationRoom: { select: { id: true, nameTh: true, code: true } },
    },
  });

  return conflictingBookings[0] ?? null;
}

/**
 * Check faculty conflict across all active bookings where faculty is participating as
 * an accepted committee member or advisor.
 */
export async function findFacultyConflict(
  tx: Prisma.TransactionClient,
  params: {
    facultyProfileIds: string[];
    startAt: Date;
    endAt: Date;
    excludeBookingId?: string;
  }
) {
  if (params.facultyProfileIds.length === 0) return null;

  // Find all active bookings that overlap with requested time
  const overlappingBookings = await tx.examinationBooking.findMany({
    where: {
      status: { in: ACTIVE_HOLD_STATUSES },
      id: params.excludeBookingId
        ? { not: params.excludeBookingId }
        : undefined,
      startAt: { lt: params.endAt },
      endAt: { gt: params.startAt },
    },
    include: {
      project: {
        include: {
          committeeMembers: {
            where: {
              facultyProfileId: { in: params.facultyProfileIds },
              invitationStatus: "ACCEPTED",
            },
            include: { facultyProfile: { include: { user: true } } },
          },
          advisorRequests: {
            where: {
              facultyProfileId: { in: params.facultyProfileIds },
              status: "ACCEPTED",
            },
            include: { facultyProfile: { include: { user: true } } },
          },
        },
      },
      examinationRoom: true,
    },
  });

  for (const b of overlappingBookings) {
    const matchedCommittee = b.project.committeeMembers[0];
    if (matchedCommittee) {
      return {
        booking: b,
        faculty: matchedCommittee.facultyProfile,
        reason: `อาจารย์ ${matchedCommittee.facultyProfile.user.name} ติดภารกิจกรรมการสอบในโครงงาน "${b.project.titleTh}" ช่วงเวลาดังกล่าว`,
      };
    }

    const matchedAdvisor = b.project.advisorRequests[0];
    if (matchedAdvisor) {
      return {
        booking: b,
        faculty: matchedAdvisor.facultyProfile,
        reason: `อาจารย์ ${matchedAdvisor.facultyProfile.user.name} ติดภารกิจที่ปรึกษาในการสอบโครงงาน "${b.project.titleTh}" ช่วงเวลาดังกล่าว`,
      };
    }
  }

  // Also check faculty explicit unavailability
  const explicitUnavailability = await tx.facultyAvailability.findFirst({
    where: {
      facultyProfileId: { in: params.facultyProfileIds },
      availabilityType: "UNAVAILABLE",
      startAt: { lt: params.endAt },
      endAt: { gt: params.startAt },
    },
    include: { facultyProfile: { include: { user: true } } },
  });

  if (explicitUnavailability) {
    return {
      booking: null,
      faculty: explicitUnavailability.facultyProfile,
      reason: `อาจารย์ ${explicitUnavailability.facultyProfile.user.name} ระบุช่วงเวลาไม่สะดวก (บันทึกส่วนตัว: ${explicitUnavailability.note || "ติดภารกิจ"})`,
    };
  }

  return null;
}

/**
 * Check if the project already has an active examination booking in progress.
 */
export async function findProjectBookingConflict(
  tx: Prisma.TransactionClient,
  params: {
    projectId: string;
    excludeBookingId?: string;
  }
) {
  return await tx.examinationBooking.findFirst({
    where: {
      projectId: params.projectId,
      status: { in: ACTIVE_HOLD_STATUSES },
      id: params.excludeBookingId
        ? { not: params.excludeBookingId }
        : undefined,
    },
    include: { examinationRoom: true },
  });
}
