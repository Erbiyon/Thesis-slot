import { requireRole } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewBookingDialog } from "./review-booking-dialog";

export const metadata = {
  title: "ตรวจสอบคำขอจองสอบ | ThesisSlot",
};

export default async function AcademicExaminationBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireRole(["ACADEMIC_STAFF", "ADMIN"]);
  const params = await searchParams;
  const currentTab = params.tab || "pending";

  const bookings = await prisma.examinationBooking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        include: {
          creator: {
            include: { studentProfile: true },
          },
          members: {
            include: {
              studentProfile: { include: { user: true } },
            },
          },
          advisorRequests: {
            where: { status: "ACCEPTED" },
            include: {
              facultyProfile: { include: { user: true } },
            },
          },
          committeeMembers: {
            include: {
              facultyProfile: { include: { user: true } },
            },
          },
        },
      },
      examinationRoom: true,
      academicTerm: {
        include: { academicYear: true },
      },
      reviewer: true,
    },
  });

  const pendingBookings = bookings.filter((b) => b.status === "PENDING_REVIEW");
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED");
  const rejectedOrCancelledBookings = bookings.filter(
    (b) => b.status === "REJECTED" || b.status === "CANCELLED"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <CalendarDays className="text-primary h-7 w-7" />
            คำขอจองสอบวิทยานิพนธ์และโครงงาน
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ตรวจสอบ อนุมัติ
            และจัดการตารางการสอบสำหรับเจ้าหน้าที่งานบริการการศึกษา
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/academic/examination-calendar">
              <CalendarDays className="h-4 w-4" />
              ดูปฏิทินภาพรวม
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/academic/examination-committees">
              <ShieldCheck className="h-4 w-4" />
              จัดการกรรมการสอบ
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
              <Clock3 className="h-4 w-4" />
              รอตรวจสอบ
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {pendingBookings.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            มีผลต่อการจองคิวห้องสอบแบบ Provisional Hold
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              ยืนยันการสอบแล้ว
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {confirmedBookings.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            อนุมัติตารางสอบอย่างเป็นทางการแล้ว
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-medium">
              <XCircle className="text-muted-foreground h-4 w-4" />
              ปฏิเสธ / ยกเลิก
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {rejectedOrCancelledBookings.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            ปล่อยช่วงเวลาห้องสอบคืนสู่ระบบแล้ว
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={currentTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pending" className="gap-1.5">
            รอตรวจสอบ
            {pendingBookings.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                {pendingBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="gap-1.5">
            ยืนยันแล้ว
            <Badge variant="outline" className="px-1.5 py-0 text-xs">
              {confirmedBookings.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1.5">
            ปฏิเสธ / ยกเลิก
            <Badge variant="outline" className="px-1.5 py-0 text-xs">
              {rejectedOrCancelledBookings.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingBookings.length === 0 ? (
            <Card className="text-muted-foreground p-8 text-center">
              <CheckCircle2 className="text-muted-foreground/60 mx-auto mb-2 h-10 w-10" />
              <p className="font-medium">
                ไม่มีคำขอจองสอบที่รอการตรวจสอบในขณะนี้
              </p>
            </Card>
          ) : (
            pendingBookings.map((booking) => renderBookingItem(booking, true))
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          {confirmedBookings.length === 0 ? (
            <Card className="text-muted-foreground p-8 text-center">
              <CalendarDays className="text-muted-foreground/60 mx-auto mb-2 h-10 w-10" />
              <p className="font-medium">ยังไม่มีรายการสอบที่ยืนยันแล้ว</p>
            </Card>
          ) : (
            confirmedBookings.map((booking) =>
              renderBookingItem(booking, false)
            )
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedOrCancelledBookings.length === 0 ? (
            <Card className="text-muted-foreground p-8 text-center">
              <p className="font-medium">
                ไม่มีรายการจองสอบที่ถูกปฏิเสธหรือยกเลิก
              </p>
            </Card>
          ) : (
            rejectedOrCancelledBookings.map((booking) =>
              renderBookingItem(booking, false)
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function renderBookingItem(
  booking: {
    id: string;
    status: string;
    startAt: Date;
    endAt: Date;
    reviewReason: string | null;
    examinationRoom: {
      nameTh: string;
      building: string | null;
      floor: string | null;
    };
    academicTerm: {
      termCode: string;
      nameTh: string;
      academicYear: { yearLabel: string };
    };
    project: {
      id: string;
      titleTh: string;
      titleEn: string | null;
      advisorRequests: Array<{ facultyProfile: { user: { name: string } } }>;
      committeeMembers: Array<{
        responsibility: string;
        invitationStatus: string;
        facultyProfile: { user: { name: string } };
      }>;
    };
  },
  showActions: boolean
) {
  const dateFormatted = format(new Date(booking.startAt), "d MMMM yyyy", {
    locale: th,
  });
  const timeFormatted = `${format(new Date(booking.startAt), "HH:mm")} - ${format(
    new Date(booking.endAt),
    "HH:mm"
  )} น.`;

  return (
    <Card
      key={booking.id}
      className="hover:border-foreground/30 transition-all"
    >
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  booking.status === "CONFIRMED"
                    ? "default"
                    : booking.status === "PENDING_REVIEW"
                      ? "secondary"
                      : "outline"
                }
                className={
                  booking.status === "CONFIRMED"
                    ? "bg-emerald-600 hover:bg-emerald-600"
                    : booking.status === "PENDING_REVIEW"
                      ? "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300"
                      : "text-muted-foreground"
                }
              >
                {booking.status === "CONFIRMED"
                  ? "ยืนยันการจองแล้ว"
                  : booking.status === "PENDING_REVIEW"
                    ? "รอเจ้าหน้าที่ตรวจสอบ"
                    : booking.status === "REJECTED"
                      ? "ปฏิเสธคำขอ"
                      : "ยกเลิกแล้ว"}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {booking.academicTerm.nameTh} (
                {booking.academicTerm.academicYear.yearLabel})
              </span>
            </div>

            <h3 className="text-base leading-snug font-semibold sm:text-lg">
              <Link
                href={`/projects/${booking.project.id}`}
                className="text-foreground flex items-center gap-1.5 hover:underline"
              >
                {booking.project.titleTh}
                <ArrowRight className="h-4 w-4 shrink-0 opacity-50" />
              </Link>
            </h3>
            {booking.project.titleEn && (
              <p className="text-muted-foreground text-xs">
                {booking.project.titleEn}
              </p>
            )}
          </div>

          {showActions && (
            <div className="flex shrink-0 items-center gap-2 pt-1">
              <ReviewBookingDialog
                bookingId={booking.id}
                projectCode={booking.project.id.slice(-6).toUpperCase()}
                projectTitle={booking.project.titleTh}
                roomName={`${booking.examinationRoom.nameTh} (${booking.examinationRoom.building || "อาคารหลัก"})`}
                dateTimeDisplay={`${dateFormatted} เวลา ${timeFormatted}`}
                decision="CONFIRMED"
              />
              <ReviewBookingDialog
                bookingId={booking.id}
                projectCode={booking.project.id.slice(-6).toUpperCase()}
                projectTitle={booking.project.titleTh}
                roomName={`${booking.examinationRoom.nameTh}`}
                dateTimeDisplay={`${dateFormatted} เวลา ${timeFormatted}`}
                decision="REJECTED"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 border-t pt-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2">
            <Clock className="text-primary h-4 w-4 shrink-0" />
            <div>
              <span className="text-muted-foreground">วันและเวลาสอบ: </span>
              <span className="text-foreground font-medium">
                {dateFormatted} ({timeFormatted})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="text-primary h-4 w-4 shrink-0" />
            <div>
              <span className="text-muted-foreground">ห้องสอบ: </span>
              <span className="text-foreground font-medium">
                {booking.examinationRoom.nameTh}{" "}
                {booking.examinationRoom.building &&
                  `(${booking.examinationRoom.building})`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building className="text-primary h-4 w-4 shrink-0" />
            <div>
              <span className="text-muted-foreground">อาจารย์ที่ปรึกษา: </span>
              <span className="text-foreground font-medium">
                {booking.project.advisorRequests
                  .map((r) => r.facultyProfile.user.name)
                  .join(", ") || "ไม่มี"}
              </span>
            </div>
          </div>
        </div>

        {booking.project.committeeMembers.length > 0 && (
          <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 pt-2 text-xs">
            <span className="text-foreground font-medium">กรรมการสอบ:</span>
            {booking.project.committeeMembers.map((cm, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="py-0 text-[11px] font-normal"
              >
                {cm.facultyProfile.user.name} (
                {cm.responsibility === "CHAIR"
                  ? "ประธาน"
                  : cm.responsibility === "COMMITTEE"
                    ? "กรรมการ"
                    : "ผู้เชี่ยวชาญภายนอก"}
                )
                {cm.invitationStatus === "ACCEPTED" ? (
                  <span className="ml-1 text-emerald-600">✓</span>
                ) : (
                  <span className="ml-1 text-amber-600">?</span>
                )}
              </Badge>
            ))}
          </div>
        )}

        {booking.reviewReason && (
          <div className="bg-muted/60 text-muted-foreground flex items-start gap-1.5 rounded p-2.5 text-xs">
            <AlertCircle className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>บันทึกจากเจ้าหน้าที่:</strong> {booking.reviewReason}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
