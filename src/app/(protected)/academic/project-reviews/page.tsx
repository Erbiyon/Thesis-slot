import { requireRole } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PROJECT_REVIEW_STATUS_LABELS_TH,
  PROJECT_TYPE_LABELS_TH,
} from "@/lib/permissions";
import { ClipboardCheck, ArrowRight, Clock } from "lucide-react";

export default async function AcademicProjectReviewsPage() {
  await requireRole(["ACADEMIC_STAFF", "ADMIN"]);

  const projects = await prisma.academicProject.findMany({
    where: {
      reviewStatus: { in: ["SUBMITTED", "REVISION_REQUIRED", "APPROVED"] },
    },
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    include: {
      academicProgram: true,
      academicTerm: { include: { academicYear: true } },
      creator: true,
      members: {
        include: { studentProfile: { include: { user: true } } },
      },
      advisorRequests: {
        where: { status: "ACCEPTED" },
        include: { facultyProfile: { include: { user: true } } },
      },
    },
  });

  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      <div className="border-border border-b pb-4">
        <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ClipboardCheck className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          ตรวจสอบคำขอลงทะเบียนโครงงาน (Project Registration Reviews)
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          พิจารณาอนุมัติ
          หรือส่งกลับเพื่อแก้ไขสำหรับคำขอลงทะเบียนโครงงานและวิทยานิพนธ์
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            รายการคำขอลงทะเบียนที่ยื่นเข้ามา
          </CardTitle>
          <CardDescription>
            {projects.length} รายการที่อยู่ในกระบวนการพิจารณา
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ประเภท</TableHead>
                <TableHead>ชื่อโครงงาน</TableHead>
                <TableHead className="w-[160px]">หลักสูตร</TableHead>
                <TableHead className="w-[160px]">อาจารย์ที่ปรึกษา</TableHead>
                <TableHead className="w-[140px]">สถานะ</TableHead>
                <TableHead className="text-right">พิจารณา</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-28 text-center"
                  >
                    ยังไม่มีคำขอลงทะเบียนที่รอการตรวจสอบในขณะนี้
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((proj) => {
                  const advisor = proj.advisorRequests[0];

                  return (
                    <TableRow
                      key={proj.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {PROJECT_TYPE_LABELS_TH[proj.projectType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-foreground line-clamp-1 font-semibold">
                          {proj.titleTh}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          ยื่นโดย: {proj.creator.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        <div>{proj.academicProgram.code}</div>
                        <div>
                          {proj.academicTerm.nameTh} (
                          {proj.academicTerm.academicYear.yearLabel})
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {advisor ? (
                          <span className="text-foreground font-medium">
                            {advisor.facultyProfile.titleTh || ""}
                            {advisor.facultyProfile.user.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" />
                            ยังไม่มีที่ปรึกษา
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {proj.reviewStatus === "APPROVED" ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-300 text-emerald-600 dark:border-emerald-800"
                          >
                            {PROJECT_REVIEW_STATUS_LABELS_TH[proj.reviewStatus]}
                          </Badge>
                        ) : proj.reviewStatus === "REVISION_REQUIRED" ? (
                          <Badge variant="destructive">
                            {PROJECT_REVIEW_STATUS_LABELS_TH[proj.reviewStatus]}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-300 text-amber-600 dark:border-amber-800"
                          >
                            {PROJECT_REVIEW_STATUS_LABELS_TH[proj.reviewStatus]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          asChild
                          className="h-8 gap-1.5 text-xs"
                        >
                          <Link href={`/academic/project-reviews/${proj.id}`}>
                            ตรวจสอบ
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
