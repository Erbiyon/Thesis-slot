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
  Calendar,
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
} from "lucide-react";

export default async function DashboardPage() {
  const { user, role } = await requireAuth();

  // Parallel fetching without waterfalls (Vercel React Best Practices)
  const [
    programCount,
    yearCount,
    termCount,
    roomCount,
    userCount,
    myProjectsCount,
    submittedReviewsCount,
    pendingAdvisorRequestsCount,
    needsRevisionCount,
  ] = await Promise.all([
    prisma.academicProgram.count({ where: { isActive: true } }),
    prisma.academicYear.count({ where: { isActive: true } }),
    prisma.academicTerm.count({ where: { isActive: true } }),
    prisma.examinationRoom.count({ where: { isActive: true } }),
    role === "ADMIN" ? prisma.user.count({ where: { isActive: true } }) : null,

    // Student metrics
    role === "STUDENT"
      ? prisma.academicProject.count({ where: { createdByUserId: user.id } })
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
              <Link href="/academic/project-reviews">
                ตรวจสอบคำขอลงทะเบียน
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          {role === "FACULTY" && (
            <Button size="sm" asChild>
              <Link href="/faculty/advisor-requests">
                ดูคำขอที่ปรึกษา
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                คำขอที่ปรึกษาที่รอการตอบรับ
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {pendingAdvisorRequestsCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                คำขอจากกลุ่มนักศึกษาที่รอคุณพิจารณา
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                โครงงานที่รับเป็นที่ปรึกษา
              </CardTitle>
              <FolderGit2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="h-auto p-0 text-base font-bold"
                asChild
              >
                <Link href="/projects">ดูรายการโครงงานทั้งหมด →</Link>
              </Button>
              <p className="text-muted-foreground mt-1 text-xs">
                เข้าสู่หน้ารายการโครงงานในความดูแล
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
                ห้องสอบที่ลงทะเบียนในระบบ
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
                คำขอที่รอการตรวจสอบ
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {submittedReviewsCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                คำขอลงทะเบียนที่ยื่นเข้ามา
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                หลักสูตรที่เปิดใช้งาน
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {programCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                หลักสูตรในระบบ
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                ปีการศึกษา / ภาคเรียน
              </CardTitle>
              <Calendar className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {yearCount} / {termCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                ปีการศึกษา และภาคเรียนที่เปิดใช้งาน
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
                ห้องสอบที่ลงทะเบียน
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
                    <ClipboardCheck className="h-4 w-4 text-zinc-600" />
                    ตรวจสอบคำขอลงทะเบียน
                  </div>
                  <p className="text-foreground mt-2 text-2xl font-bold">
                    {submittedReviewsCount}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    คำขอลงทะเบียนโครงงานที่รอการพิจารณา
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full"
                  asChild
                >
                  <Link href="/academic/project-reviews">
                    เข้าสู่หน้าตรวจสอบคำขอ
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
              <ClipboardCheck className="h-5 w-5 text-zinc-600" />
              การจัดการข้อมูลวิชาการและการตรวจสอบโครงงาน
            </CardTitle>
            <CardDescription>
              ตรวจสอบคำขอลงทะเบียนและจัดการข้อมูลพื้นฐานสำหรับการจัดสอบ
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Button
              variant="outline"
              className="flex h-auto flex-col items-start gap-1 py-4"
              asChild
            >
              <Link href="/academic/project-reviews">
                <span className="text-sm font-semibold">ตรวจสอบคำขอ</span>
                <span className="text-muted-foreground text-xs font-normal">
                  พิจารณาโครงงาน ({submittedReviewsCount})
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col items-start gap-1 py-4"
              asChild
            >
              <Link href="/academic/programs">
                <span className="text-sm font-semibold">หลักสูตร</span>
                <span className="text-muted-foreground text-xs font-normal">
                  รายชื่อหลักสูตร ({programCount})
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col items-start gap-1 py-4"
              asChild
            >
              <Link href="/academic/terms">
                <span className="text-sm font-semibold">ภาคการศึกษา</span>
                <span className="text-muted-foreground text-xs font-normal">
                  กำหนดภาคเรียนย่อย ({termCount})
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col items-start gap-1 py-4"
              asChild
            >
              <Link href="/academic/rooms">
                <span className="text-sm font-semibold">ห้องสอบ</span>
                <span className="text-muted-foreground text-xs font-normal">
                  กำหนดห้องและอาคาร ({roomCount})
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
              <Mail className="h-5 w-5 text-zinc-600" />
              ภารกิจอาจารย์ที่ปรึกษา (Advisor Management)
            </CardTitle>
            <CardDescription>
              ตรวจสอบคำขอจากนักศึกษาและดูรายการโครงงานในความดูแล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-border bg-muted/20 flex flex-col items-center justify-between gap-3 rounded-lg border p-4 sm:flex-row">
              <div>
                <p className="text-foreground text-sm font-medium">
                  คำขอเป็นอาจารย์ที่ปรึกษาที่รอการตอบรับ
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  มี {pendingAdvisorRequestsCount} คำขอที่รอดำเนินการ
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/faculty/advisor-requests">พิจารณาคำขอ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
