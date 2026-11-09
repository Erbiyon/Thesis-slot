import prisma from "@/lib/prisma";
import { Role } from "@/lib/permissions";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import {
  CalendarFilterParams,
  CalendarMonthData,
  SerializedCalendarBooking,
  getBangkokDateKey,
} from "./calendar-types";

export * from "./calendar-types";

/**
 * Calculates Bangkok UTC Date range for querying a full month including surrounding grid padding days (Monday to Sunday)
 */
export function getBangkokMonthGridUtcRange(year: number, month: number) {
  // Construct 1st of month in Bangkok time
  const paddedMonth = String(month).padStart(2, "0");
  const firstDayOfMonthStr = `${year}-${paddedMonth}-01T00:00:00`;
  const firstDayBangkok = new Date(`${firstDayOfMonthStr}+07:00`);

  // Start of month & end of month in Bangkok
  const bkkMonthStart = startOfMonth(firstDayBangkok);
  const bkkMonthEnd = endOfMonth(firstDayBangkok);

  // Extend to full Monday-starting weeks
  const gridStart = startOfWeek(bkkMonthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(bkkMonthEnd, { weekStartsOn: 1 });

  return {
    gridStartUtc: gridStart,
    gridEndUtc: gridEnd,
  };
}

/**
 * Server query for calendar bookings strictly scoped by RBAC and Month Range
 */
export async function getCalendarBookings(
  userId: string,
  role: Role,
  filters: CalendarFilterParams
): Promise<CalendarMonthData> {
  const { year, month, status, roomId } = filters;
  const { gridStartUtc, gridEndUtc } = getBangkokMonthGridUtcRange(year, month);

  // 1. Fetch available rooms for filtering
  const activeRooms = await prisma.examinationRoom.findMany({
    where: { isActive: true },
    select: { id: true, nameTh: true },
    orderBy: { nameTh: "asc" },
  });

  // 2. Build Status Filter
  const statusFilter =
    status && status !== "ALL"
      ? { equals: status }
      : { in: ["CONFIRMED" as const, "PENDING_REVIEW" as const] };

  // 3. Build Room Filter
  const roomFilter =
    roomId && roomId !== "ALL" ? { equals: roomId } : undefined;

  // 4. Role-based Project and Scope Filter
  let projectFilter: Record<string, unknown> | undefined = undefined;

  if (role === "STUDENT") {
    // Student can only see bookings for projects they created or belong to
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    projectFilter = {
      OR: [
        { createdByUserId: userId },
        ...(studentProfile
          ? [
              {
                members: {
                  some: {
                    studentProfileId: studentProfile.id,
                    membershipStatus: { in: ["ACCEPTED", "INVITED"] },
                  },
                },
              },
            ]
          : []),
      ],
    };
  } else if (role === "FACULTY") {
    // Faculty can see bookings where they are the advisor OR an appointed committee member
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (facultyProfile) {
      projectFilter = {
        OR: [
          {
            advisorRequests: {
              some: {
                facultyProfileId: facultyProfile.id,
                status: "ACCEPTED",
              },
            },
          },
          {
            committeeMembers: {
              some: {
                facultyProfileId: facultyProfile.id,
                invitationStatus: { in: ["ACCEPTED", "PENDING"] },
              },
            },
          },
        ],
      };
    } else {
      // Unassigned faculty sees nothing
      projectFilter = { id: "__impossible__" };
    }
  } else if (role === "ADMIN" || role === "ACADEMIC_STAFF") {
    // Institutional view: see all confirmed and pending requests across department
    projectFilter = undefined;
  } else {
    projectFilter = { id: "__impossible__" };
  }

  // 5. Query Bookings
  const bookings = await prisma.examinationBooking.findMany({
    where: {
      status: statusFilter,
      startAt: { gte: gridStartUtc, lte: gridEndUtc },
      ...(roomFilter ? { examinationRoomId: roomFilter } : {}),
      ...(projectFilter ? { project: projectFilter } : {}),
    },
    include: {
      project: {
        include: {
          creator: { select: { id: true, name: true } },
          members: {
            include: {
              studentProfile: {
                include: { user: { select: { id: true, name: true } } },
              },
            },
          },
          advisorRequests: {
            where: { status: "ACCEPTED" },
            include: {
              facultyProfile: {
                include: { user: { select: { id: true, name: true } } },
              },
            },
          },
          committeeMembers: {
            include: {
              facultyProfile: {
                include: { user: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
      examinationRoom: true,
    },
    orderBy: { startAt: "asc" },
  });

  // Map and serialize
  const serializedBookings: SerializedCalendarBooking[] = bookings.map((b) => {
    const isMyProject =
      b.project.createdByUserId === userId ||
      b.project.members.some((m) => m.studentProfile.user.id === userId);

    const isMyDuty =
      b.project.advisorRequests.some(
        (a) => a.facultyProfile.user.id === userId
      ) ||
      b.project.committeeMembers.some(
        (c) => c.facultyProfile.user.id === userId
      );

    return {
      id: b.id,
      projectId: b.projectId,
      projectTitleTh: b.project.titleTh,
      projectTitleEn: b.project.titleEn,
      projectType: b.project.projectType,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      dateKey: getBangkokDateKey(b.startAt),
      status: b.status as "CONFIRMED" | "PENDING_REVIEW",
      examinationRoomId: b.examinationRoomId,
      examinationRoomName: b.examinationRoom.nameTh,
      examinationRoomBuilding: b.examinationRoom.building,
      examinationRoomFloor: b.examinationRoom.floor,
      advisors: b.project.advisorRequests.map((a) => ({
        id: a.facultyProfile.id,
        name: a.facultyProfile.user.name,
      })),
      committeeMembers: b.project.committeeMembers.map((c) => ({
        id: c.facultyProfile.id,
        name: c.facultyProfile.user.name,
        responsibility: c.responsibility,
      })),
      isMyProject,
      isMyDuty,
    };
  });

  const THAI_MONTH_NAMES = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  return {
    year,
    month,
    monthLabelTh: `${THAI_MONTH_NAMES[month - 1]} ${year + 543}`,
    bookings: serializedBookings,
    activeRooms,
  };
}
