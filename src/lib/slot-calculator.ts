import prisma from "@/lib/prisma";
import { ACTIVE_HOLD_STATUSES } from "./booking-conflict";

export interface CandidateSlot {
  startAt: string; // ISO string
  endAt: string; // ISO string
  roomId: string;
  roomName: string;
  roomCode: string;
  available: boolean;
  conflictReason?: string;
}

/**
 * Generates and evaluates candidate slots for a given project, date, and academic term.
 * Candidate time slots follow academic standards:
 * - 09:00 - 11:00
 * - 11:00 - 13:00
 * - 13:30 - 15:30
 * - 15:30 - 17:30
 */
export async function getAvailableExaminationSlots(params: {
  projectId: string;
  dateStr: string; // "YYYY-MM-DD"
  academicTermId: string;
}): Promise<CandidateSlot[]> {
  const { projectId, dateStr, academicTermId } = params;

  // 1. Fetch available rooms
  const rooms = await prisma.examinationRoom.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  // 2. Fetch project details and participating faculty
  const project = await prisma.academicProject.findUnique({
    where: { id: projectId },
    include: {
      advisorRequests: { where: { status: "ACCEPTED" } },
      committeeMembers: { where: { invitationStatus: "ACCEPTED" } },
    },
  });

  if (!project) return [];

  const facultyProfileIds = Array.from(
    new Set([
      ...project.advisorRequests.map((r) => r.facultyProfileId),
      ...project.committeeMembers.map((c) => c.facultyProfileId),
    ])
  );

  // Time windows (Local Asia/Bangkok)
  const timeWindows = [
    { start: "09:00:00", end: "11:00:00" },
    { start: "11:00:00", end: "13:00:00" },
    { start: "13:30:00", end: "15:30:00" },
    { start: "15:30:00", end: "17:30:00" },
  ];

  // Fetch all active bookings on this date
  const dayStart = new Date(`${dateStr}T00:00:00+07:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59+07:00`);

  const [activeBookings, explicitUnavailabilities] = await Promise.all([
    prisma.examinationBooking.findMany({
      where: {
        academicTermId,
        status: { in: ACTIVE_HOLD_STATUSES },
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      include: {
        project: {
          include: {
            advisorRequests: { where: { status: "ACCEPTED" } },
            committeeMembers: { where: { invitationStatus: "ACCEPTED" } },
          },
        },
      },
    }),
    prisma.facultyAvailability.findMany({
      where: {
        facultyProfileId: { in: facultyProfileIds },
        availabilityType: "UNAVAILABLE",
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      include: { facultyProfile: { include: { user: true } } },
    }),
  ]);

  const candidateSlots: CandidateSlot[] = [];

  for (const win of timeWindows) {
    const startAt = new Date(`${dateStr}T${win.start}+07:00`);
    const endAt = new Date(`${dateStr}T${win.end}+07:00`);

    // Check faculty conflict for this window
    let facultyConflictMsg: string | undefined;

    // A. Check explicit faculty unavailability
    const unavail = explicitUnavailabilities.find(
      (u) => startAt < u.endAt && endAt > u.startAt
    );
    if (unavail) {
      facultyConflictMsg = `อาจารย์ ${unavail.facultyProfile.user.name} ระบุไม่สะดวก (${unavail.note || "ติดภารกิจ"})`;
    }

    // B. Check active bookings involving any of our faculty
    if (!facultyConflictMsg) {
      for (const b of activeBookings) {
        if (startAt < b.endAt && endAt > b.startAt) {
          const matchedFaculty = [
            ...b.project.advisorRequests.map((r) => r.facultyProfileId),
            ...b.project.committeeMembers.map((c) => c.facultyProfileId),
          ].find((fId) => facultyProfileIds.includes(fId));

          if (matchedFaculty) {
            facultyConflictMsg =
              "กรรมการสอบหรืออาจารย์ที่ปรึกษาติดภารกิจสอบโครงงานอื่นในช่วงนี้";
            break;
          }
        }
      }
    }

    // Evaluate each room
    for (const room of rooms) {
      let isRoomBusy = false;
      for (const b of activeBookings) {
        if (
          b.examinationRoomId === room.id &&
          startAt < b.endAt &&
          endAt > b.startAt
        ) {
          isRoomBusy = true;
          break;
        }
      }

      let available = true;
      let conflictReason: string | undefined;

      if (facultyConflictMsg) {
        available = false;
        conflictReason = facultyConflictMsg;
      } else if (isRoomBusy) {
        available = false;
        conflictReason = `ห้องสอบ ${room.nameTh} ถูกใช้งานแล้ว`;
      }

      candidateSlots.push({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        roomId: room.id,
        roomName: room.nameTh,
        roomCode: room.code,
        available,
        conflictReason,
      });
    }
  }

  return candidateSlots;
}
