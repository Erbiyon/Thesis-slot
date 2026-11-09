import { assertProjectAccess } from "@/lib/project-guards";
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
  PROJECT_REVIEW_STATUS_LABELS_TH,
  PROJECT_TYPE_LABELS_TH,
  MEMBERSHIP_STATUS_LABELS_TH,
} from "@/lib/permissions";
import { ProjectSubmitButton } from "./project-submit-button";
import {
  FolderGit2,
  Users,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  UserPlus,
  Send,
} from "lucide-react";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { project, isLeader } = await assertProjectAccess(id);

  const acceptedAdvisor = project.advisorRequests.find(
    (r) => r.status === "ACCEPTED"
  );
  const pendingAdvisor = project.advisorRequests.find(
    (r) => r.status === "PENDING"
  );

  const canEdit =
    isLeader &&
    (project.reviewStatus === "DRAFT" ||
      project.reviewStatus === "REVISION_REQUIRED");

  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      {/* Top Banner */}
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href={`/projects/${project.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  แก้ไขข้อมูล
                </Link>
              </Button>
              <ProjectSubmitButton projectId={project.id} />
            </>
          )}
        </div>
      </div>

      {/* Revision Feedback Alert */}
      {project.reviewStatus === "REVISION_REQUIRED" && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                เจ้าหน้าที่วิชาการส่งกลับเพื่อให้แก้ไขข้อมูล
              </p>
              {project.reviews[0]?.comment && (
                <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                  ข้อเสนอแนะ: {project.reviews[0].comment}
                </p>
              )}
              <p className="text-muted-foreground mt-2 text-xs">
                กรุณาตรวจสอบและปรับปรุงข้อมูล จากนั้นกด
                &quot;ส่งคำขอลงทะเบียน&quot; อีกครั้ง
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Main Details (2 cols) */}
        <div className="space-y-6 md:col-span-2">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FolderGit2 className="h-5 w-5 text-zinc-500" />
                รายละเอียดโครงงาน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  บทคัดย่อ / คำอธิบายโดยสังเขป
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
                    {project.academicTerm.nameTh} (ปีการศึกษา{" "}
                    {project.academicTerm.academicYear.yearLabel})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Users className="h-5 w-5 text-zinc-500" />
                  สมาชิกกลุ่มโครงงาน
                </CardTitle>
                <CardDescription>
                  {
                    project.members.filter(
                      (m) => m.membershipStatus === "ACCEPTED"
                    ).length
                  }{" "}
                  คน
                </CardDescription>
              </div>

              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="gap-1.5 text-xs"
                >
                  <Link href={`/projects/${project.id}/members`}>
                    <UserPlus className="h-3.5 w-3.5" />
                    จัดการสมาชิก
                  </Link>
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="border-border bg-muted/20 flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold dark:bg-zinc-800">
                      {member.memberRole === "LEADER" ? "หัว" : "สมาชิก"}
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        {member.studentProfile.user.name}
                      </p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {member.studentProfile.studentCode} •{" "}
                        {member.studentProfile.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.memberRole === "LEADER" && (
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        หัวหน้ากลุ่ม
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={
                        member.membershipStatus === "ACCEPTED"
                          ? "border-emerald-300 text-emerald-600 dark:border-emerald-800"
                          : "border-amber-300 text-amber-600 dark:border-amber-800"
                      }
                    >
                      {MEMBERSHIP_STATUS_LABELS_TH[member.membershipStatus]}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info (1 col) */}
        <div className="space-y-6">
          {/* Advisor Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <GraduationCap className="h-5 w-5 text-zinc-500" />
                อาจารย์ที่ปรึกษา
              </CardTitle>

              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="gap-1 text-xs"
                >
                  <Link href={`/projects/${project.id}/advisor`}>
                    <Send className="h-3.5 w-3.5" />
                    ยื่นคำขอ
                  </Link>
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              {acceptedAdvisor ? (
                <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    ตอบรับเป็นที่ปรึกษาแล้ว
                  </div>
                  <p className="text-foreground mt-2 text-sm font-bold">
                    {acceptedAdvisor.facultyProfile.titleTh || ""}
                    {acceptedAdvisor.facultyProfile.user.name}
                  </p>
                  <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                    {acceptedAdvisor.facultyProfile.user.email}
                  </p>
                </div>
              ) : pendingAdvisor ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <Clock className="h-4 w-4" />
                    รออาจารย์ตอบรับ
                  </div>
                  <p className="text-foreground mt-2 text-sm font-bold">
                    {pendingAdvisor.facultyProfile.titleTh || ""}
                    {pendingAdvisor.facultyProfile.user.name}
                  </p>
                  <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                    {pendingAdvisor.facultyProfile.user.email}
                  </p>
                </div>
              ) : (
                <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
                  ยังไม่ได้ยื่นคำขออาจารย์ที่ปรึกษา
                  {canEdit && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="text-xs"
                      >
                        <Link href={`/projects/${project.id}/advisor`}>
                          เลือกอาจารย์ที่ปรึกษา
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline & Metadata */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Calendar className="h-5 w-5 text-zinc-500" />
                ประวัติเวลาและการดำเนินการ
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3 text-xs">
              <div className="border-border flex justify-between border-b py-1">
                <span>สร้างฉบับร่าง:</span>
                <span className="text-foreground font-medium">
                  {new Date(project.createdAt).toLocaleDateString("th-TH")}
                </span>
              </div>
              <div className="border-border flex justify-between border-b py-1">
                <span>ส่งคำขอลงทะเบียน:</span>
                <span className="text-foreground font-medium">
                  {project.submittedAt
                    ? new Date(project.submittedAt).toLocaleDateString("th-TH")
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>อนุมัติการลงทะเบียน:</span>
                <span className="text-foreground font-medium">
                  {project.approvedAt
                    ? new Date(project.approvedAt).toLocaleDateString("th-TH")
                    : "-"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
