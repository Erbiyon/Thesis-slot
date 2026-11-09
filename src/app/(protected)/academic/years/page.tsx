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
import { YearDialog } from "./year-dialog";
import { YearStatusButton } from "./year-status-button";
import { Calendar, Plus } from "lucide-react";

export default async function AcademicYearsPage() {
  await requirePermission("academic:manage");

  const years = await prisma.academicYear.findMany({
    orderBy: { yearLabel: "desc" },
    include: {
      _count: {
        select: { terms: true },
      },
    },
  });

  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Calendar className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            การจัดการปีการศึกษา (Academic Years)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            กำหนดและจัดการข้อมูลปีการศึกษาสำหรับรอบการจัดสอบโครงงานและวิทยานิพนธ์
          </p>
        </div>

        <YearDialog
          trigger={
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มปีการศึกษา
            </Button>
          }
        />
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            รายการปีการศึกษาทั้งหมด
          </CardTitle>
          <CardDescription>
            ปีการศึกษาที่เปิดใช้งานจะปรากฏให้เลือกในการกำหนดภาคเรียนและการจัดรอบสอบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">ปีการศึกษา</TableHead>
                <TableHead className="w-[180px]">จำนวนภาคเรียน</TableHead>
                <TableHead className="w-[140px]">สถานะ</TableHead>
                <TableHead className="w-[200px]">สร้างเมื่อ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground h-28 text-center"
                  >
                    ยังไม่มีข้อมูลปีการศึกษาในระบบ กรุณาคลิกปุ่ม
                    &quot;เพิ่มปีการศึกษา&quot;
                  </TableCell>
                </TableRow>
              ) : (
                years.map((year) => (
                  <TableRow key={year.id}>
                    <TableCell className="text-foreground font-semibold">
                      พ.ศ. {year.yearLabel}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {year._count.terms} ภาคเรียน
                    </TableCell>
                    <TableCell>
                      {year.isActive ? (
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
                      {new Date(year.createdAt).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <YearDialog
                        year={year}
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
                      <YearStatusButton
                        id={year.id}
                        currentStatus={year.isActive}
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
