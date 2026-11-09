import { requireAuth } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import { ROLE_LABELS_TH } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FolderGit2,
  CalendarDays,
  GraduationCap,
  DoorOpen,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  ClipboardCheck,
  Mail,
  AlertCircle,
  CalendarCheck,
} from "lucide-react";

export default async function DashboardPage() {
  const { user, role } = await requireAuth();

  // Parallel fetching without waterfalls (Vercel React Best Practices)
  const [
    programCount,
    roomCount,
    userCount,
    myProjectsCount,
    submittedReviewsCount,
    pendingAdvisorRequestsCount,
    needsRevisionCount,
    pendingCommitteeInvitesCount,
    pendingBookingReviewsCount,
    activeBookingsCount,
  ] = await Promise.all([
    prisma.academicProgram.count({ where: { isActive: true } }),
    prisma.examinationRoom.count({ where: { isActive: true } }),
    role === "ADMIN" ? prisma.user.count({ where: { isActive: true } }) : null,

    // Student metrics
    role === "STUDENT"
      ? prisma.academicProject.count({
          where: {
            OR: [
              { createdByUserId: user.id },
              { members: { some: { studentProfile: { userId: user.id } } } },
            ],
          },
        })
      : null,

    // Staff metrics
    role === "ACADEMIC_STAFF" || role === "ADMIN"
      ? prisma.academicProject.count({ where: { reviewStatus: "SUBMITTED" } })
      : null,

    // Faculty metrics
    role === "FACULTY"
      ? prisma.advisorRequest.count({
          where: {
            facultyProfile: { userId: user.id },
            status: "PENDING",
          },
        })
      : null,

    // Revision required metrics (for students)
    role === "STUDENT"
      ? prisma.academicProject.count({
          where: {
            createdByUserId: user.id,
            reviewStatus: "REVISION_REQUIRED",
          },
        })
      : null,

    // Phase 3 Faculty Committee Invitations Pending
    role === "FACULTY"
      ? prisma.examinationCommitteeMember.count({
          where: {
            facultyProfile: { userId: user.id },
            invitationStatus: "PENDING",
          },
        })
      : null,

    // Phase 3 Staff Pending Booking Reviews
    role === "ACADEMIC_STAFF" || role === "ADMIN"
      ? prisma.examinationBooking.count({
          where: { status: "PENDING_REVIEW" },
        })
      : null,

    // Phase 3 Active bookings (confirmed or pending)
    prisma.examinationBooking.count({
      where: { status: { in: ["CONFIRMED", "PENDING_REVIEW"] } },
    }),
  ]);

  const roleTitles = {
    ADMIN: "ภาพรวมการบริหารระบบ",
    ACADEMIC_STAFF: "ภาพรวมงานวิชาการ",
    FACULTY: "พื้นที่ปฏิบัติงานอาจารย์",
    STUDENT: "พื้นที่ปฏิบัติงานนักศึกษา",
  };

  return (
    <div className="animate-in fade-in-50 space-y-8 duration-300">
      {/* Top Banner */}
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
              {roleTitles[role]}
            </h1>
            <Badge variant="outline" className="text-xs font-medium">
              {ROLE_LABELS_TH[role]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1.5 text-sm">
            ยินดีต้อนรับคุณ{" "}
            <span className="text-foreground font-semibold">{user.name}</span>{" "}
            สู่ระบบจองสอบโครงงานและวิทยานิพนธ์
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role === "STUDENT" && (
            <Button size="sm" asChild>
              <Link href="/projects/new">
                ลงทะเบียนหัวข้อใหม่
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          {role === "ACADEMIC_STAFF" && (
            <Button size="sm" asChild>
              <Link href="/academic/examination-bookings">
                ตรวจสอบคำขอจองสอบ
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          {role === "FACULTY" && (
            <Button size="sm" asChild>
              <Link href="/faculty/committee-invitations">
                คำเชิญกรรมการสอบ
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          {role === "ADMIN" && (
            <Button size="sm" asChild>
              <Link href="/admin/users">
                จัดการผู้ใช้งาน
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Student Highlight Cards */}
      {role === "STUDENT" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                โครงงานของฉัน
              </CardTitle>
              <FolderGit2 className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {myProjectsCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                โครงงานที่คุณเป็นผู้สร้างหรือสมาชิก
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                ต้องแก้ไขตามข้อเสนอแนะ
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {needsRevisionCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                คำขอที่ส่งกลับเพื่อให้นักศึกษาปรับปรุง
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                ปฏิทินตารางสอบ
              </CardTitle>
              <CalendarDays className="text-primary h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="h-auto p-0 text-base font-bold"
                asChild
              >
                <Link href="/academic/examination-calendar">ดูปฏิทินรวม →</Link>
              </Button>
              <p className="text-muted-foreground mt-1 text-xs">
                ตรวจสอบตารางการจัดสอบรายสัปดาห์
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                หลักสูตรที่เปิดรับ
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {programCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                หลักสูตรที่เปิดใช้งานในระบบ
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Faculty Highlight Cards */}
      {role === "FACULTY" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                คำขอที่ปรึกษาที่รอตอบรับ
              </CardTitle>
              <Mail className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {pendingAdvisorRequestsCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                คำขอจากกลุ่มนักศึกษาที่รอพิจารณา
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                คำเชิญกรรมการสอบที่รอตอบรับ
              </CardTitle>
              <ShieldCheck className="text-primary h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {pendingCommitteeInvitesCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                คำเชิญเป็นกรรมการสอบโครงงาน
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                กำหนดเวลาว่าง / ไม่สะดวก
              </CardTitle>
              <Clock className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="h-auto p-0 text-base font-bold"
                asChild
              >
                <Link href="/faculty/availability">จัดการช่วงเวลา →</Link>
              </Button>
              <p className="text-muted-foreground mt-1 text-xs">
                ป้องกันไม่ให้ระบบจัดตารางสอบซ้อน
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                ปฏิทินตารางสอบ
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="h-auto p-0 text-base font-bold"
                asChild
              >
                <Link href="/academic/examination-calendar">
                  ดูตารางสอบรวม →
                </Link>
              </Button>
              <p className="text-muted-foreground mt-1 text-xs">
                ตรวจสอบการจัดสอบสัปดาห์นี้
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staff & Admin Highlight Cards */}
      {(role === "ADMIN" || role === "ACADEMIC_STAFF") && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                คำขอลงทะเบียนรอตรวจ
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {submittedReviewsCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                คำขอลงทะเบียนโครงงานใหม่
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                คำขอจองสอบรอตรวจสอบ
              </CardTitle>
              <CalendarCheck className="text-primary h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {pendingBookingReviewsCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                คำขอจองสอบที่นักศึกษายื่นเข้ามา
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                การสอบในระบบทั้งหมด
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {activeBookingsCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                รายการสอบที่ยืนยันหรือรอตรวจ
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                ห้องสอบที่พร้อมใช้
              </CardTitle>
              <DoorOpen className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {roomCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                ห้องสอบที่เปิดใช้งาน
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role-specific Action Panels */}
      {role === "ADMIN" && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              การจัดการผู้ดูแลระบบ (System Administration)
            </CardTitle>
            <CardDescription>
              ระบบสิทธิ์และการควบคุมความปลอดภัยของบัญชีผู้ใช้งาน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="border-border bg-muted/20 flex flex-col justify-between rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-zinc-600" />
                    บัญชีผู้ใช้งานทั้งหมด
                  </div>
                  <p className="text-foreground mt-2 text-2xl font-bold">
                    {userCount}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    บัญชีผู้ใช้ในระบบทั้งหมด
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full"
                  asChild
                >
                  <Link href="/admin/users">จัดการผู้ใช้งาน</Link>
                </Button>
              </div>

              <div className="border-border bg-muted/20 flex flex-col justify-between rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CalendarCheck className="h-4 w-4 text-zinc-600" />
                    จัดการคำขอจองสอบ
                  </div>
                  <p className="text-foreground mt-2 text-2xl font-bold">
                    {pendingBookingReviewsCount}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    คำขอจองสอบรอตรวจสอบ
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full"
                  asChild
                >
                  <Link href="/academic/examination-bookings">
                    ตรวจสอบคำขอจองสอบ
                  </Link>
                </Button>
              </div>

              <div className="border-border bg-muted/20 flex flex-col justify-between rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-zinc-600" />
                    สถานะระบบฐานข้อมูล
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Prisma 7 และ MySQL Docker (thesis_slot_dev) เชื่อมต่อสมบูรณ์
                  </p>
                </div>
                <div className="mt-4">
                  <Badge
                    variant="outline"
                    className="border-emerald-300 text-emerald-600 dark:border-emerald-800"
                  >
                    Online & Active
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {role === "ACADEMIC_STAFF" && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <CalendarCheck className="h-5 w-5 text-zinc-600" />
              การจัดการข้อมูลวิชาการและการจัดสอบ
            </CardTitle>
            <CardDescription>
              ตรวจสอบคำขอลงทะเบียน แต่งตั้งกรรมการ และจัดตารางสอบ
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Button
              variant="outline"
              className="flex h-auto flex-col items-start gap-1 py-4"
              asChild
            >
              <Link href="/academic/examination-bookings">
                <span className="text-sm font-semibold">คำขอจองสอบ</span>
                <span className="text-muted-foreground text-xs font-normal">
                  รอตรวจสอบ ({pendingBookingReviewsCount})
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col items-start gap-1 py-4"
              asChild
            >
              <Link href="/academic/examination-committees">
                <span className="text-sm font-semibold">
                  แต่งตั้งกรรมการสอบ
                </span>
                <span className="text-muted-foreground text-xs font-normal">
                  จัดการคณะกรรมการสอบ
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col items-start gap-1 py-4"
              asChild
            >
              <Link href="/academic/examination-calendar">
                <span className="text-sm font-semibold">ปฏิทินตารางสอบ</span>
                <span className="text-muted-foreground text-xs font-normal">
                  ดูภาพรวมตารางสอบ
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col items-start gap-1 py-4"
              asChild
            >
              <Link href="/academic/project-reviews">
                <span className="text-sm font-semibold">
                  ตรวจสอบคำขอลงทะเบียน
                </span>
                <span className="text-muted-foreground text-xs font-normal">
                  พิจารณาโครงงาน ({submittedReviewsCount})
                </span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {role === "FACULTY" && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="h-5 w-5 text-zinc-600" />
              ภารกิจอาจารย์และกรรมการสอบ
            </CardTitle>
            <CardDescription>
              ตอบรับคำเชิญเป็นที่ปรึกษาหรือกรรมการสอบ และระบุเวลาที่ไม่สะดวก
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border-border bg-muted/20 flex flex-col items-start justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="text-foreground text-sm font-medium">
                    คำขอเป็นที่ปรึกษาที่รอการตอบรับ
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    มี {pendingAdvisorRequestsCount} คำขอที่รอดำเนินการ
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link href="/faculty/advisor-requests">
                    พิจารณาคำขอที่ปรึกษา
                  </Link>
                </Button>
              </div>

              <div className="border-border bg-muted/20 flex flex-col items-start justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="text-foreground text-sm font-medium">
                    คำเชิญเป็นกรรมการสอบที่รอตอบรับ
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    มี {pendingCommitteeInvitesCount} คำเชิญที่รอดำเนินการ
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link href="/faculty/committee-invitations">
                    พิจารณาคำเชิญกรรมการ
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
