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
import { TermDialog } from "./term-dialog";
import { TermStatusButton } from "./term-status-button";
import { CalendarDays, Plus } from "lucide-react";

export default async function AcademicTermsPage() {
  await requirePermission("academic:manage");

  const [terms, years] = await Promise.all([
    prisma.academicTerm.findMany({
      orderBy: [{ academicYear: { yearLabel: "desc" } }, { termCode: "asc" }],
      include: {
        academicYear: true,
      },
    }),
    prisma.academicYear.findMany({
      where: { isActive: true },
      orderBy: { yearLabel: "desc" },
    }),
  ]);

  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
            <CalendarDays className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            การจัดการภาคการศึกษา (Academic Terms)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            กำหนดภาคการศึกษา (เช่น ภาคต้น ภาคปลาย ภาคฤดูร้อน) ภายใต้ปีการศึกษา
          </p>
        </div>

        <TermDialog
          years={years}
          trigger={
            <Button size="sm" className="gap-2" disabled={years.length === 0}>
              <Plus className="h-4 w-4" />
              เพิ่มภาคการศึกษา
            </Button>
          }
        />
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            รายการภาคการศึกษาทั้งหมด
          </CardTitle>
          <CardDescription>
            กำหนดช่วงเวลาและสถานะเปิดใช้งานเพื่อรองรับการเปิดรับลงทะเบียนจองสอบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">ปีการศึกษา</TableHead>
                <TableHead className="w-[140px]">รหัสภาคเรียน</TableHead>
                <TableHead className="w-[220px]">ชื่อภาคการศึกษา</TableHead>
                <TableHead className="w-[140px]">สถานะ</TableHead>
                <TableHead className="w-[180px]">สร้างเมื่อ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-28 text-center"
                  >
                    {years.length === 0
                      ? "กรุณาสร้างปีการศึกษาก่อนเพื่อเริ่มต้นเพิ่มภาคการศึกษา"
                      : 'ยังไม่มีข้อมูลภาคการศึกษาในระบบ กรุณาคลิกปุ่ม "เพิ่มภาคการศึกษา"'}
                  </TableCell>
                </TableRow>
              ) : (
                terms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="text-foreground font-medium">
                      พ.ศ. {term.academicYear.yearLabel}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {term.termCode}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {term.nameTh}
                    </TableCell>
                    <TableCell>
                      {term.isActive ? (
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
                      {new Date(term.createdAt).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <TermDialog
                        term={term}
                        years={years}
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
                      <TermStatusButton
                        id={term.id}
                        currentStatus={term.isActive}
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
