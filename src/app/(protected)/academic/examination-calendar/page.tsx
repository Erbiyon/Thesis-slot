import { requireRole } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { th } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  MapPin,
  Building,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "ปฏิทินตารางสอบวิทยานิพนธ์ | ThesisSlot",
};

export default async function AcademicExaminationCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireRole(["ACADEMIC_STAFF", "ADMIN", "FACULTY", "STUDENT"]);
  const params = await searchParams;

  const selectedDate = params.date ? new Date(params.date) : new Date();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const daysOfWeek = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)); // Mon-Fri

  const rooms = await prisma.examinationRoom.findMany({
    where: { isActive: true },
    orderBy: { nameTh: "asc" },
  });

  const bookings = await prisma.examinationBooking.findMany({
    where: {
      status: { in: ["CONFIRMED", "PENDING_REVIEW"] },
      startAt: { gte: weekStart },
      endAt: { lte: addDays(weekEnd, 1) },
    },
    include: {
      project: {
        include: {
          creator: true,
          advisorRequests: {
            where: { status: "ACCEPTED" },
            include: { facultyProfile: { include: { user: true } } },
          },
          committeeMembers: {
            include: { facultyProfile: { include: { user: true } } },
          },
        },
      },
      examinationRoom: true,
    },
    orderBy: { startAt: "asc" },
  });

  const prevWeekDate = format(addDays(weekStart, -7), "yyyy-MM-dd");
  const nextWeekDate = format(addDays(weekStart, 7), "yyyy-MM-dd");
  const currentWeekDate = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <CalendarDays className="text-primary h-7 w-7" />
            ปฏิทินตารางสอบวิทยานิพนธ์และโครงงาน
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            มุมมองตารางสอบประจำสัปดาห์ (วันจันทร์ - วันศุกร์) แยกตามห้องสอบ
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/examination-calendar">
              <CalendarDays className="mr-1 h-4 w-4" />
              มุมมองรายเดือน
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/academic/examination-calendar?date=${prevWeekDate}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              สัปดาห์ก่อนหน้า
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/academic/examination-calendar?date=${currentWeekDate}`}
            >
              สัปดาห์ปัจจุบัน
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/academic/examination-calendar?date=${nextWeekDate}`}>
              สัปดาห์ถัดไป
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-emerald-600" />
          <span className="text-muted-foreground">
            ยืนยันการสอบแล้ว (Confirmed)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-amber-500" />
          <span className="text-muted-foreground">
            รอการตรวจสอบ (Pending Review)
          </span>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {daysOfWeek.map((day) => {
          const isToday = isSameDay(day, new Date());
          const dayBookings = bookings.filter((b) =>
            isSameDay(new Date(b.startAt), day)
          );

          return (
            <Card
              key={day.toISOString()}
              className={`flex h-full flex-col ${
                isToday ? "border-primary ring-primary/20 shadow-sm ring-1" : ""
              }`}
            >
              <CardHeader className="bg-muted/30 border-b p-3 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {format(day, "EEEE", { locale: th })}
                  </span>
                  {isToday && (
                    <Badge
                      variant="default"
                      className="h-4 px-1.5 py-0 text-[10px]"
                    >
                      วันนี้
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {format(day, "d MMMM yyyy", { locale: th })}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-2 p-2.5">
                {dayBookings.length === 0 ? (
                  <div className="text-muted-foreground/60 flex h-28 items-center justify-center text-xs italic">
                    ไม่มีการสอบ
                  </div>
                ) : (
                  dayBookings.map((b) => {
                    const isConfirmed = b.status === "CONFIRMED";
                    return (
                      <div
                        key={b.id}
                        className={`space-y-1.5 rounded-lg border p-2.5 text-xs transition-colors ${
                          isConfirmed
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 font-semibold">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3" />
                            {format(new Date(b.startAt), "HH:mm")} -{" "}
                            {format(new Date(b.endAt), "HH:mm")}
                          </span>
                          <span className="text-[10px]">
                            {isConfirmed ? "อนุมัติแล้ว" : "รอตรวจสอบ"}
                          </span>
                        </div>

                        <div className="line-clamp-2 font-medium">
                          <Link
                            href={`/projects/${b.project.id}`}
                            className="hover:underline"
                          >
                            {b.project.titleTh}
                          </Link>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] opacity-80">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {b.examinationRoom.nameTh}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 truncate text-[10px] opacity-75">
                          <User className="h-3 w-3 shrink-0" />
                          <span>
                            ที่ปรึกษา:{" "}
                            {b.project.advisorRequests
                              .map((r) => r.facultyProfile.user.name)
                              .join(", ") || "-"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Room Summary Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="text-primary h-5 w-5" />
            ข้อมูลห้องสอบที่เปิดให้บริการ ({rooms.length} ห้อง)
          </CardTitle>
          <CardDescription>
            ห้องสอบที่พร้อมใช้งานสำหรับการจัดสอบโครงงานและวิทยานิพนธ์
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {rooms.map((r) => (
              <div
                key={r.id}
                className="bg-card space-y-1 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{r.nameTh}</span>
                  <Badge variant="outline" className="text-xs">
                    ความจุ {r.capacity || "-"} ที่นั่ง
                  </Badge>
                </div>
                <div className="text-muted-foreground text-xs">
                  {r.building || "อาคารหลัก"} {r.floor ? `ชั้น ${r.floor}` : ""}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
