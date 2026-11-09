import { requireRole } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
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
import { ReviewDecisionForm } from "./review-decision-form";
import {
  PROJECT_REVIEW_STATUS_LABELS_TH,
  PROJECT_TYPE_LABELS_TH,
  MEMBERSHIP_STATUS_LABELS_TH,
} from "@/lib/permissions";
import {
  ClipboardCheck,
  ArrowLeft,
  Users,
  GraduationCap,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export default async function AcademicProjectReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole(["ACADEMIC_STAFF", "ADMIN"]);

  const project = await prisma.academicProject.findUnique({
    where: { id },
    include: {
      academicProgram: true,
      academicTerm: { include: { academicYear: true } },
      creator: true,
      members: {
        include: { studentProfile: { include: { user: true } } },
      },
      advisorRequests: {
        include: { facultyProfile: { include: { user: true } } },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { reviewer: true },
      },
    },
  });

  if (!project) notFound();

  const acceptedAdvisor = project.advisorRequests.find(
    (r) => r.status === "ACCEPTED"
  );

  return (
    <div className="animate-in fade-in-50 max-w-4xl space-y-6 duration-300">
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <Button variant="ghost" size="sm" asChild className="h-auto p-0">
            <Link
              href="/academic/project-reviews"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              กลับหน้ารายการคำขอ
            </Link>
          </Button>

          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline">
              {PROJECT_TYPE_LABELS_TH[project.projectType]}
            </Badge>
            <Badge
              variant={
                project.reviewStatus === "APPROVED"
                  ? "outline"
                  : project.reviewStatus === "REVISION_REQUIRED"
                    ? "destructive"
                    : "secondary"
              }
              className={
                project.reviewStatus === "APPROVED"
                  ? "border-emerald-300 text-emerald-600 dark:border-emerald-800"
                  : ""
              }
            >
              {PROJECT_REVIEW_STATUS_LABELS_TH[project.reviewStatus]}
            </Badge>
          </div>

          <h1 className="text-foreground mt-2 text-2xl font-bold tracking-tight">
            {project.titleTh}
          </h1>
          {project.titleEn && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {project.titleEn}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                รายละเอียดหัวข้อโครงงาน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">
                  บทคัดย่อ / สรุปสาระสำคัญ
                </p>
                <p className="text-foreground mt-1 leading-relaxed whitespace-pre-line">
                  {project.abstractTh || "ไม่มีข้อมูลบทคัดย่อ"}
                </p>
              </div>

              <div className="border-border grid grid-cols-2 gap-4 border-t pt-3 text-xs">
                <div>
                  <span className="text-muted-foreground">หลักสูตร:</span>
                  <p className="text-foreground mt-0.5 font-semibold">
                    {project.academicProgram.nameTh} (
                    {project.academicProgram.code})
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">ภาคการศึกษา:</span>
                  <p className="text-foreground mt-0.5 font-semibold">
                    {project.academicTerm.nameTh} (
                    {project.academicTerm.academicYear.yearLabel})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Users className="h-5 w-5 text-zinc-500" />
                สมาชิกกลุ่มโครงงาน ({project.members.length} คน)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="border-border bg-muted/20 flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-foreground text-sm font-semibold">
                      {member.studentProfile.user.name}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {member.studentProfile.studentCode} •{" "}
                      {member.studentProfile.user.email}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-normal">
                    {MEMBERSHIP_STATUS_LABELS_TH[member.membershipStatus]}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Decision Workspace (Only when submitted) */}
          {project.reviewStatus === "SUBMITTED" && (
            <Card className="border-border border-emerald-500/30 bg-emerald-50/10 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
                  <ClipboardCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  พิจารณาผลการลงทะเบียนโครงงาน
                </CardTitle>
                <CardDescription>
                  เลือกอนุมัติการลงทะเบียน
                  หรือส่งกลับให้นักศึกษาแก้ไขพร้อมข้อคิดเห็น
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewDecisionForm projectId={project.id} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <GraduationCap className="h-5 w-5 text-zinc-500" />
                อาจารย์ที่ปรึกษา
              </CardTitle>
            </CardHeader>
            <CardContent>
              {acceptedAdvisor ? (
                <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                  <p className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    ตอบรับเป็นที่ปรึกษาแล้ว
                  </p>
                  <p className="text-foreground mt-2 text-sm font-bold">
                    {acceptedAdvisor.facultyProfile.titleTh || ""}
                    {acceptedAdvisor.facultyProfile.user.name}
                  </p>
                  <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                    {acceptedAdvisor.facultyProfile.user.email}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  ยังไม่มีอาจารย์ที่ปรึกษาตอบรับ
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Calendar className="h-5 w-5 text-zinc-500" />
                ประวัติการพิจารณา
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {project.reviews.length === 0 ? (
                <p className="text-muted-foreground">
                  ยังไม่มีประวัติการพิจารณา
                </p>
              ) : (
                project.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="border-border bg-muted/20 space-y-1 rounded border p-2.5"
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span>{rev.reviewer.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {PROJECT_REVIEW_STATUS_LABELS_TH[rev.decision]}
                      </Badge>
                    </div>
                    {rev.comment && (
                      <p className="text-muted-foreground">{rev.comment}</p>
                    )}
                    <p className="text-muted-foreground/70 text-[10px]">
                      {new Date(rev.createdAt).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
