import { requireAuth } from "@/lib/auth-guards";
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
import { FolderGit2, Plus, ArrowRight, Clock, FileText } from "lucide-react";

export default async function ProjectsListPage() {
  const { user, role } = await requireAuth();

  // Parallel fetching without waterfall
  let projects;
  if (role === "STUDENT") {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    projects = await prisma.academicProject.findMany({
      where: {
        OR: [
          { createdByUserId: user.id },
          ...(studentProfile
            ? [{ members: { some: { studentProfileId: studentProfile.id } } }]
            : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        academicProgram: true,
        academicTerm: { include: { academicYear: true } },
        members: {
          include: { studentProfile: { include: { user: true } } },
        },
        advisorRequests: {
          include: { facultyProfile: { include: { user: true } } },
        },
      },
    });
  } else if (role === "FACULTY") {
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { userId: user.id },
    });

    projects = await prisma.academicProject.findMany({
      where: facultyProfile
        ? {
            advisorRequests: {
              some: { facultyProfileId: facultyProfile.id, status: "ACCEPTED" },
            },
          }
        : { id: "none" },
      orderBy: { updatedAt: "desc" },
      include: {
        academicProgram: true,
        academicTerm: { include: { academicYear: true } },
        members: {
          include: { studentProfile: { include: { user: true } } },
        },
        advisorRequests: {
          include: { facultyProfile: { include: { user: true } } },
        },
      },
    });
  } else {
    // Admin & Academic Staff see all
    projects = await prisma.academicProject.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        academicProgram: true,
        academicTerm: { include: { academicYear: true } },
        members: {
          include: { studentProfile: { include: { user: true } } },
        },
        advisorRequests: {
          include: { facultyProfile: { include: { user: true } } },
        },
      },
    });
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="border-emerald-300 text-emerald-600 dark:border-emerald-800"
          >
            {PROJECT_REVIEW_STATUS_LABELS_TH[status]}
          </Badge>
        );
      case "SUBMITTED":
        return (
          <Badge
            variant="outline"
            className="border-amber-300 text-amber-600 dark:border-amber-800"
          >
            {PROJECT_REVIEW_STATUS_LABELS_TH[status]}
          </Badge>
        );
      case "REVISION_REQUIRED":
        return (
          <Badge variant="destructive">
            {PROJECT_REVIEW_STATUS_LABELS_TH[status]}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {PROJECT_REVIEW_STATUS_LABELS_TH[status] || status}
          </Badge>
        );
    }
  };

  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FolderGit2 className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            รายการโครงงานและวิทยานิพนธ์ (Academic Projects)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ติดตามความคืบหน้าการลงทะเบียนหัวข้อ การจัดกลุ่ม
            และการขออาจารย์ที่ปรึกษา
          </p>
        </div>

        {(role === "STUDENT" || role === "ADMIN") && (
          <Button size="sm" className="gap-2" asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4" />
              ลงทะเบียนหัวข้อใหม่
            </Link>
          </Button>
        )}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            โครงงานที่เกี่ยวข้องกับคุณ
          </CardTitle>
          <CardDescription>{projects.length} รายการที่พบในระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ประเภท</TableHead>
                <TableHead>ชื่อโครงงาน (ภาษาไทย)</TableHead>
                <TableHead className="w-[180px]">หลักสูตร / ภาคเรียน</TableHead>
                <TableHead className="w-[160px]">อาจารย์ที่ปรึกษา</TableHead>
                <TableHead className="w-[140px]">สถานะ</TableHead>
                <TableHead className="text-right">รายละเอียด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-32 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="h-8 w-8 text-zinc-400" />
                      <p>ยังไม่มีรายการโครงงานในระบบ</p>
                      {(role === "STUDENT" || role === "ADMIN") && (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="mt-2"
                        >
                          <Link href="/projects/new">
                            เริ่มต้นลงทะเบียนหัวข้อ
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((proj) => {
                  const acceptedAdvisor = proj.advisorRequests.find(
                    (r) => r.status === "ACCEPTED"
                  );
                  const pendingAdvisor = proj.advisorRequests.find(
                    (r) => r.status === "PENDING"
                  );

                  return (
                    <TableRow
                      key={proj.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          {PROJECT_TYPE_LABELS_TH[proj.projectType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-foreground line-clamp-1 font-semibold">
                          {proj.titleTh}
                        </div>
                        {proj.titleEn && (
                          <div className="text-muted-foreground line-clamp-1 text-xs">
                            {proj.titleEn}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        <div>{proj.academicProgram.code}</div>
                        <div>
                          {proj.academicTerm.nameTh} (
                          {proj.academicTerm.academicYear.yearLabel})
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {acceptedAdvisor ? (
                          <span className="text-foreground font-medium">
                            {acceptedAdvisor.facultyProfile.titleTh || ""}
                            {acceptedAdvisor.facultyProfile.user.name}
                          </span>
                        ) : pendingAdvisor ? (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" />
                            รอตอบรับ
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            - ยังไม่ได้ระบุ -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(proj.reviewStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/projects/${proj.id}`}
                            className="gap-1 text-xs"
                          >
                            ดูข้อมูล
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
