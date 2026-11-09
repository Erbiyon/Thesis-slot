import { requireRole } from "@/lib/auth-guards";
import { getCalendarBookings } from "@/lib/calendar-service";
import { MonthCalendarClient } from "@/components/examination-calendar/month-calendar-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ปฏิทินตารางสอบวิทยานิพนธ์และโครงงาน | ThesisSlot",
  description: "ภาพรวมปฏิทินตารางสอบและคำขอจองสอบวิทยานิพนธ์/โครงงานประจำเดือน",
};

interface CalendarPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    status?: "ALL" | "CONFIRMED" | "PENDING_REVIEW";
    roomId?: string;
    selectedDate?: string;
  }>;
}

export default async function ExaminationCalendarPage({
  searchParams,
}: CalendarPageProps) {
  // All authenticated roles (ADMIN, ACADEMIC_STAFF, FACULTY, STUDENT) can access
  const { user, role } = await requireRole([
    "ADMIN",
    "ACADEMIC_STAFF",
    "FACULTY",
    "STUDENT",
  ]);

  const params = await searchParams;

  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;

  const calendarData = await getCalendarBookings(user.id, role, {
    year: isNaN(year) ? now.getFullYear() : year,
    month: isNaN(month) ? now.getMonth() + 1 : Math.max(1, Math.min(12, month)),
    status: params.status,
    roomId: params.roomId,
  });

  return (
    <div className="container mx-auto py-2">
      <MonthCalendarClient
        initialData={calendarData}
        currentUserRole={role}
        currentUserId={user.id}
      />
    </div>
  );
}
