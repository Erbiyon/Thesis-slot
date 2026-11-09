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
  Calendar,
  CalendarDays,
  GraduationCap,
  DoorOpen,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const { user, role } = await requireAuth();

  // Load genuine Phase 1 metrics based on permissions
  const [programCount, yearCount, termCount, roomCount, userCount] =
    await Promise.all([
      prisma.academicProgram.count({ where: { isActive: true } }),
      prisma.academicYear.count({ where: { isActive: true } }),
      prisma.academicTerm.count({ where: { isActive: true } }),
      prisma.examinationRoom.count({ where: { isActive: true } }),
      role === "ADMIN"
        ? prisma.user.count({ where: { isActive: true } })
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
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile">ข้อมูลส่วนตัว</Link>
          </Button>
          {(role === "ADMIN" || role === "ACADEMIC_STAFF") && (
            <Button size="sm" asChild>
              <Link href="/academic/programs">
                จัดการข้อมูลวิชาการ
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Genuine Phase 1 Metric Cards */}
      {(role === "ADMIN" || role === "ACADEMIC_STAFF") && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                ปีการศึกษาที่เปิดใช้งาน
              </CardTitle>
              <Calendar className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {yearCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">ปีการศึกษา</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                ภาคการศึกษาที่เปิดใช้งาน
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {termCount}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">ภาคการศึกษา</p>
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
                    <GraduationCap className="h-4 w-4 text-zinc-600" />
                    ข้อมูลหลักสูตรและวิชาการ
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    กำหนดและปรับปรุงข้อมูลปีการศึกษา ภาคเรียน และห้องสอบ
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full"
                  asChild
                >
                  <Link href="/academic/programs">เข้าสู่เมนูวิชาการ</Link>
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
            <CardTitle className="text-lg font-semibold">
              ทางลัดการจัดการข้อมูลวิชาการ
            </CardTitle>
            <CardDescription>
              เตรียมความพร้อมข้อมูลพื้นฐานสำหรับรอบการจัดสอบโครงงานและวิทยานิพนธ์
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Button
              variant="outline"
              className="flex h-auto flex-col items-start gap-1 py-4"
              asChild
            >
              <Link href="/academic/years">
                <span className="text-sm font-semibold">ปีการศึกษา</span>
                <span className="text-muted-foreground text-xs font-normal">
                  จัดการปีการศึกษา
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
                  กำหนดภาคเรียนย่อย
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
                  รายชื่อหลักสูตรและสาขา
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
                  กำหนดห้องและอาคาร
                </span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {(role === "FACULTY" || role === "STUDENT") && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              สถานะข้อมูลวิชาการปัจจุบัน
            </CardTitle>
            <CardDescription>
              ข้อมูลอ้างอิงสำหรับการสอบโครงงานและวิทยานิพนธ์ในภาคการศึกษาปัจจุบัน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-border bg-muted/20 rounded-lg border p-4">
              <p className="text-foreground text-sm font-medium">
                ระบบข้อมูลหลัก (Academic Master Data)
                ได้รับการจัดเตรียมเรียบร้อยแล้ว
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                ฟังก์ชันการยื่นขอสอบและการเลือกกรรมการสอบจะเปิดให้ดำเนินการในเฟสถัดไปหลังจากได้รับการอนุมัติรอบการสอบจากเจ้าหน้าที่วิชาการ
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="sm" variant="outline" asChild>
                <Link href="/profile">ตรวจสอบข้อมูลส่วนตัว</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
