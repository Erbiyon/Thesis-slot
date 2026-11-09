"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Users,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  Calendar as CalendarIcon,
  Filter,
  ExternalLink,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  CalendarMonthData,
  SerializedCalendarBooking,
  getBangkokDateKey,
} from "@/lib/calendar-types";
import { Role } from "@/lib/permissions";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface MonthCalendarClientProps {
  initialData: CalendarMonthData;
  currentUserRole?: Role;
  currentUserId?: string;
}

export function MonthCalendarClient({ initialData }: MonthCalendarClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected date key (e.g. "2026-12-25")
  const todayBangkokKey = getBangkokDateKey(new Date());
  const [selectedDateKey, setSelectedDateKey] = React.useState<string>(
    searchParams.get("selectedDate") || todayBangkokKey
  );

  const [statusFilter, setStatusFilter] = React.useState<string>(
    searchParams.get("status") || "ALL"
  );
  const [roomFilter, setRoomFilter] = React.useState<string>(
    searchParams.get("roomId") || "ALL"
  );

  const { year, month, monthLabelTh, bookings, activeRooms } = initialData;

  // Filter bookings in client for instant feedback
  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (roomFilter !== "ALL" && b.examinationRoomId !== roomFilter)
        return false;
      return true;
    });
  }, [bookings, statusFilter, roomFilter]);

  // Group filtered bookings by dateKey
  const bookingsByDate = React.useMemo(() => {
    const map = new Map<string, SerializedCalendarBooking[]>();
    for (const b of filteredBookings) {
      const list = map.get(b.dateKey) || [];
      list.push(b);
      map.set(b.dateKey, list);
    }
    return map;
  }, [filteredBookings]);

  // Bookings for selected date
  const selectedDayBookings = React.useMemo(() => {
    return (bookingsByDate.get(selectedDateKey) || []).sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }, [bookingsByDate, selectedDateKey]);

  // Compute calendar grid days (Mon to Sun)
  const calendarGridDays = React.useMemo(() => {
    // 1st of month in Bangkok
    const firstDate = new Date(year, month - 1, 1);
    const lastDate = new Date(year, month, 0);

    // Days in current month
    const daysInMonth = lastDate.getDate();

    // Day of week for 1st day: 0=Sun, 1=Mon, ..., 6=Sat
    // Convert to Monday start: Mon=0, Tue=1, ..., Sun=6
    const firstDayIndex = (firstDate.getDay() + 6) % 7;

    // Previous month padding
    const prevMonthLastDate = new Date(year, month - 1, 0).getDate();
    const prevDays: {
      dayNum: number;
      dateKey: string;
      isCurrentMonth: boolean;
    }[] = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDate - i;
      const prevM = month === 1 ? 12 : month - 1;
      const prevY = month === 1 ? year - 1 : year;
      const dateKey = `${prevY}-${String(prevM).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      prevDays.push({ dayNum, dateKey, isCurrentMonth: false });
    }

    // Current month days
    const currentDays: {
      dayNum: number;
      dateKey: string;
      isCurrentMonth: boolean;
    }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      currentDays.push({ dayNum: d, dateKey, isCurrentMonth: true });
    }

    // Next month padding to fill complete weeks (multiple of 7)
    const totalFilled = prevDays.length + currentDays.length;
    const remaining = totalFilled % 7 === 0 ? 0 : 7 - (totalFilled % 7);
    const nextDays: {
      dayNum: number;
      dateKey: string;
      isCurrentMonth: boolean;
    }[] = [];
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 12 ? 1 : month + 1;
      const nextY = month === 12 ? year + 1 : year;
      const dateKey = `${nextY}-${String(nextM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      nextDays.push({ dayNum: d, dateKey, isCurrentMonth: false });
    }

    return [...prevDays, ...currentDays, ...nextDays];
  }, [year, month]);

  // Month navigation handlers
  const navigateMonth = (direction: "prev" | "next" | "today") => {
    let targetYear = year;
    let targetMonth = month;

    if (direction === "today") {
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth() + 1;
      setSelectedDateKey(todayBangkokKey);
    } else if (direction === "prev") {
      if (month === 1) {
        targetYear = year - 1;
        targetMonth = 12;
      } else {
        targetMonth = month - 1;
      }
    } else {
      if (month === 12) {
        targetYear = year + 1;
        targetMonth = 1;
      } else {
        targetMonth = month + 1;
      }
    }

    const query = new URLSearchParams();
    query.set("year", String(targetYear));
    query.set("month", String(targetMonth));
    if (statusFilter !== "ALL") query.set("status", statusFilter);
    if (roomFilter !== "ALL") query.set("roomId", roomFilter);
    router.push(`/examination-calendar?${query.toString()}`);
  };

  const handleFilterChange = (type: "status" | "room", value: string) => {
    if (type === "status") setStatusFilter(value);
    if (type === "room") setRoomFilter(value);

    const query = new URLSearchParams();
    query.set("year", String(year));
    query.set("month", String(month));
    query.set("status", type === "status" ? value : statusFilter);
    query.set("roomId", type === "room" ? value : roomFilter);
    router.push(`/examination-calendar?${query.toString()}`);
  };

  const dayHeadersTh = [
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
    "อาทิตย์",
  ];

  // Format selected date in Thai
  const selectedDateObj = new Date(`${selectedDateKey}T12:00:00+07:00`);
  const selectedDateLabelTh = !isNaN(selectedDateObj.getTime())
    ? format(selectedDateObj, "d MMMM yyyy (EEEE)", { locale: th })
    : selectedDateKey;

  const totalMonthExams = filteredBookings.length;
  const confirmedMonthCount = filteredBookings.filter(
    (b) => b.status === "CONFIRMED"
  ).length;
  const pendingMonthCount = filteredBookings.filter(
    (b) => b.status === "PENDING_REVIEW"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              ปฏิทินตารางสอบวิทยานิพนธ์และโครงงาน
            </h1>
            <Badge variant="outline" className="text-xs">
              รายเดือน
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            ภาพรวมกำหนดการสอบและคำขอจองสอบ (เวลาท้องถิ่นประเทศไทย Asia/Bangkok)
          </p>
        </div>

        {/* View Switcher and Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("prev")}
            aria-label="เดือนก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">เดือนก่อน</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("today")}
            className="font-medium"
          >
            วันนี้
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("next")}
            aria-label="เดือนถัดไป"
          >
            <span className="sr-only sm:not-sr-only sm:mr-1">เดือนถัดไป</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          {/* Quick link to weekly master view */}
          <Button asChild variant="secondary" size="sm">
            <Link href="/academic/examination-calendar">
              <CalendarDays className="mr-1.5 h-4 w-4" />
              มุมมองรายสัปดาห์
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3">
          <div className="text-muted-foreground text-xs font-medium">
            เดือนปัจจุบัน
          </div>
          <div className="text-foreground mt-1 text-lg font-bold sm:text-xl">
            {monthLabelTh}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-muted-foreground text-xs font-medium">
            การสอบทั้งหมดในเดือน
          </div>
          <div className="text-foreground mt-1 text-lg font-bold sm:text-xl">
            {totalMonthExams}{" "}
            <span className="text-muted-foreground text-xs font-normal">
              รายการ
            </span>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            ยืนยันกำหนดสอบแล้ว
          </div>
          <div className="text-foreground mt-1 text-lg font-bold sm:text-xl">
            {confirmedMonthCount}{" "}
            <span className="text-muted-foreground text-xs font-normal">
              รายการ
            </span>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            รอการตรวจสอบ
          </div>
          <div className="text-foreground mt-1 text-lg font-bold sm:text-xl">
            {pendingMonthCount}{" "}
            <span className="text-muted-foreground text-xs font-normal">
              รายการ
            </span>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar (Staff/Admin/Faculty) */}
      <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Filter className="text-muted-foreground h-3.5 w-3.5" />
            <span>ตัวกรอง:</span>
          </div>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => handleFilterChange("status", val)}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="สถานะการจอง" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">สถานะทั้งหมด</SelectItem>
              <SelectItem value="CONFIRMED">ยืนยันแล้ว (Confirmed)</SelectItem>
              <SelectItem value="PENDING_REVIEW">
                รออนุมัติ (Pending)
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Room filter */}
          {activeRooms.length > 0 && (
            <Select
              value={roomFilter}
              onValueChange={(val) => handleFilterChange("room", val)}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="ห้องสอบ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกห้องสอบ</SelectItem>
                {activeRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.nameTh}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span className="text-muted-foreground">ยืนยันกำหนดสอบ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
            <span className="text-muted-foreground">รออนุมัติการจอง</span>
          </div>
        </div>
      </div>

      {/* Main Grid & Side Detail Panel Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Month Calendar Grid (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="text-primary h-5 w-5" />
                  {monthLabelTh}
                </CardTitle>
                <div className="text-muted-foreground text-xs">
                  คลิกที่ช่องวันที่เพื่อดูตารางสอบประจำวัน
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Day headers */}
              <div className="bg-muted/20 border-border grid grid-cols-7 border-b text-center text-xs font-semibold">
                {dayHeadersTh.map((header, idx) => (
                  <div
                    key={header}
                    className={`py-2.5 ${
                      idx >= 5 ? "text-muted-foreground/70" : "text-foreground"
                    }`}
                  >
                    {header}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 divide-x divide-y">
                {calendarGridDays.map((item, index) => {
                  const dayEvents = bookingsByDate.get(item.dateKey) || [];
                  const isSelected = item.dateKey === selectedDateKey;
                  const isToday = item.dateKey === todayBangkokKey;
                  const confirmedCount = dayEvents.filter(
                    (e) => e.status === "CONFIRMED"
                  ).length;
                  const pendingCount = dayEvents.filter(
                    (e) => e.status === "PENDING_REVIEW"
                  ).length;

                  return (
                    <button
                      key={`${item.dateKey}-${index}`}
                      type="button"
                      onClick={() => setSelectedDateKey(item.dateKey)}
                      aria-label={`${item.dateKey} มีการสอบ ${dayEvents.length} รายการ`}
                      className={`focus-visible:ring-primary relative flex min-h-[85px] flex-col p-1.5 text-left transition-all focus-visible:ring-2 focus-visible:outline-none sm:min-h-[105px] sm:p-2 ${
                        !item.isCurrentMonth
                          ? "bg-muted/10 text-muted-foreground/40"
                          : "bg-card text-foreground"
                      } ${
                        isSelected
                          ? "ring-primary bg-primary/5 z-10 shadow-sm ring-2 ring-inset"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      {/* Date number */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday
                              ? "bg-primary text-primary-foreground font-bold shadow-xs"
                              : isSelected
                                ? "text-primary font-bold"
                                : ""
                          }`}
                        >
                          {item.dayNum}
                        </span>

                        {/* Event count badge */}
                        {dayEvents.length > 0 && (
                          <span className="bg-muted text-muted-foreground py-0.2 rounded-full px-1.5 text-[10px] font-medium">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event status dots and compact markers */}
                      <div className="mt-1 flex flex-1 flex-col gap-1">
                        {dayEvents.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {/* Confirmed chip */}
                            {confirmedCount > 0 && (
                              <div className="flex items-center gap-1 rounded bg-emerald-500/10 px-1 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span className="truncate">
                                  ยืนยัน {confirmedCount}
                                </span>
                              </div>
                            )}

                            {/* Pending chip */}
                            {pendingCount > 0 && (
                              <div className="flex items-center gap-1 rounded bg-amber-500/10 px-1 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                <span className="truncate">
                                  รออนุมัติ {pendingCount}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Day Schedule Detail Panel (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <Card className="sticky top-6 flex h-full flex-col">
            <CardHeader className="bg-muted/20 border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                    <CalendarCheck className="text-primary h-4 w-4" />
                    กำหนดการประจำวัน
                  </CardTitle>
                  <CardDescription className="text-foreground/80 mt-1 text-xs font-medium">
                    {selectedDateLabelTh}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {selectedDayBookings.length} รายการ
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3 p-4">
              {selectedDayBookings.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                    <CalendarIcon className="text-muted-foreground/60 h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-medium">
                    ไม่มีการสอบในวันที่เลือก
                  </p>
                  <p className="text-muted-foreground/70 mt-1 max-w-[240px] text-xs">
                    ไม่มีคำขอจองสอบหรือกำหนดการสอบที่ได้รับการยืนยันสำหรับวันที่นี้
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayBookings.map((b) => {
                    const isConfirmed = b.status === "CONFIRMED";
                    const startTime = format(new Date(b.startAt), "HH:mm");
                    const endTime = format(new Date(b.endAt), "HH:mm");

                    return (
                      <div
                        key={b.id}
                        className={`space-y-2 rounded-lg border p-3.5 transition-all ${
                          isConfirmed
                            ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                            : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                        }`}
                      >
                        {/* Header: Time + Status badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-foreground flex items-center gap-1.5 font-mono text-xs font-semibold">
                            <Clock className="h-3.5 w-3.5 opacity-70" />
                            {startTime} - {endTime} น.
                          </span>

                          <Badge
                            variant={isConfirmed ? "default" : "secondary"}
                            className={`text-[10px] ${
                              isConfirmed
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {isConfirmed ? (
                              <CheckCircle2 className="mr-1 inline h-3 w-3" />
                            ) : (
                              <AlertCircle className="mr-1 inline h-3 w-3" />
                            )}
                            {isConfirmed
                              ? "ยืนยันกำหนดสอบแล้ว"
                              : "รออนุมัติการจอง"}
                          </Badge>
                        </div>

                        {/* Project title */}
                        <div>
                          <div className="text-foreground text-sm leading-snug font-semibold">
                            {b.projectTitleTh}
                          </div>
                          {b.projectTitleEn && (
                            <div className="text-muted-foreground text-xs italic">
                              {b.projectTitleEn}
                            </div>
                          )}
                        </div>

                        {/* Room */}
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <MapPin className="text-primary h-3.5 w-3.5 shrink-0" />
                          <span className="text-foreground font-medium">
                            {b.examinationRoomName}
                          </span>
                          {b.examinationRoomBuilding && (
                            <span className="text-xs">
                              ({b.examinationRoomBuilding}{" "}
                              {b.examinationRoomFloor
                                ? `ชั้น ${b.examinationRoomFloor}`
                                : ""}
                              )
                            </span>
                          )}
                        </div>

                        {/* Advisor */}
                        {b.advisors.length > 0 && (
                          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              ที่ปรึกษา:{" "}
                              {b.advisors.map((a) => a.name).join(", ")}
                            </span>
                          </div>
                        )}

                        {/* Committee members */}
                        {b.committeeMembers.length > 0 && (
                          <div className="text-muted-foreground flex items-start gap-1.5 text-xs">
                            <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <div>
                              กรรมการ:{" "}
                              {b.committeeMembers.map((c) => c.name).join(", ")}
                            </div>
                          </div>
                        )}

                        {/* Navigation link */}
                        <div className="flex items-center justify-between pt-1">
                          {b.isMyProject || b.isMyDuty ? (
                            <Badge
                              variant="outline"
                              className="bg-primary/10 text-primary text-[10px]"
                            >
                              เกี่ยวข้องกับคุณ
                            </Badge>
                          ) : (
                            <div />
                          )}

                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                          >
                            <Link href={`/projects/${b.projectId}`}>
                              รายละเอียดโครงงาน
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
