export const BANGKOK_TIMEZONE = "Asia/Bangkok";

export interface CalendarFilterParams {
  year: number; // e.g. 2026
  month: number; // 1-12
  status?: "ALL" | "CONFIRMED" | "PENDING_REVIEW";
  roomId?: string;
}

export interface SerializedCalendarBooking {
  id: string;
  projectId: string;
  projectTitleTh: string;
  projectTitleEn?: string | null;
  projectType: string;
  startAt: string; // ISO string
  endAt: string; // ISO string
  dateKey: string; // "YYYY-MM-DD" in Bangkok timezone
  status: "CONFIRMED" | "PENDING_REVIEW";
  examinationRoomId: string;
  examinationRoomName: string;
  examinationRoomBuilding?: string | null;
  examinationRoomFloor?: string | null;
  advisors: { id: string; name: string }[];
  committeeMembers: { id: string; name: string; responsibility: string }[];
  isMyProject?: boolean;
  isMyDuty?: boolean;
}

export interface CalendarMonthData {
  year: number;
  month: number; // 1-12
  monthLabelTh: string;
  bookings: SerializedCalendarBooking[];
  activeRooms: { id: string; nameTh: string }[];
}

/**
 * Pure date calculation for Bangkok timezone date key (UTC+7)
 */
export function getBangkokDateKey(date: Date): string {
  // Asia/Bangkok is fixed at UTC+7
  const bangkokOffsetMs = 7 * 60 * 60 * 1000;
  const bkkDate = new Date(date.getTime() + bangkokOffsetMs);
  const y = bkkDate.getUTCFullYear();
  const m = String(bkkDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(bkkDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
