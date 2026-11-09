import { requirePermission } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProgramDialog } from "./program-dialog";
import { ProgramStatusButton } from "./program-status-button";
import { GraduationCap, Plus } from "lucide-react";

export default async function AcademicProgramsPage() {
  await requirePermission("academic:manage");

  const programs = await prisma.academicProgram.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: {
        select: { studentProfiles: true },
      },
    },
  });

  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
            <GraduationCap className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            การจัดการหลักสูตรการศึกษา (Academic Programs)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            กำหนดหลักสูตร สาขาวิชา
            และระดับปริญญาสำหรับเชื่อมโยงกับนักศึกษาและการสอบ
          </p>
        </div>

        <ProgramDialog
          trigger={
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มหลักสูตร
            </Button>
          }
        />
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            รายชื่อหลักสูตรทั้งหมด
          </CardTitle>
          <CardDescription>
            หลักสูตรที่เปิดใช้งานสามารถผูกกับบัญชีนักศึกษาและระเบียบการสอบได้
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">รหัสหลักสูตร</TableHead>
                <TableHead>ชื่อหลักสูตร (ภาษาไทย)</TableHead>
                <TableHead className="w-[160px]">ระดับปริญญา</TableHead>
                <TableHead className="w-[130px]">สถานะ</TableHead>
                <TableHead className="w-[150px]">จำนวนนักศึกษา</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-28 text-center"
                  >
                    ยังไม่มีข้อมูลหลักสูตรในระบบ กรุณาคลิกปุ่ม
                    &quot;เพิ่มหลักสูตร&quot;
                  </TableCell>
                </TableRow>
              ) : (
                programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="text-foreground font-mono text-xs font-semibold">
                      {program.code}
                    </TableCell>
                    <TableCell>
                      <div className="text-foreground font-medium">
                        {program.nameTh}
                      </div>
                      {program.nameEn && (
                        <div className="text-muted-foreground text-xs">
                          {program.nameEn}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {program.degree || "ปริญญาตรี"}
                    </TableCell>
                    <TableCell>
                      {program.isActive ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 text-emerald-600 dark:border-emerald-800"
                        >
                          เปิดใช้งาน
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-zinc-300 text-zinc-500 dark:border-zinc-700"
                        >
                          ปิดใช้งาน
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {program._count.studentProfiles} คน
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <ProgramDialog
                        program={program}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                          >
                            แก้ไข
                          </Button>
                        }
                      />
                      <ProgramStatusButton
                        id={program.id}
                        currentStatus={program.isActive}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
