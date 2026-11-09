import { assertProjectAccess } from "@/lib/project-guards";
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
import { RequestAdvisorForm } from "./request-advisor-form";
import { ADVISOR_REQUEST_STATUS_LABELS_TH } from "@/lib/permissions";
import {
  GraduationCap,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default async function ProjectAdvisorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { project, isLeader } = await assertProjectAccess(id);

  const [faculties] = await Promise.all([
    prisma.facultyProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const canRequest =
    isLeader &&
    (project.reviewStatus === "DRAFT" ||
      project.reviewStatus === "REVISION_REQUIRED");

  return (
    <div className="animate-in fade-in-50 max-w-4xl space-y-6 duration-300">
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-auto p-0">
              <Link
                href={`/projects/${project.id}`}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                กลับหน้ารายละเอียด
              </Link>
            </Button>
          </div>
          <h1 className="text-foreground mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight">
            <GraduationCap className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            ขอแต่งตั้งอาจารย์ที่ปรึกษาโครงงาน
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            เลือกอาจารย์และส่งคำขอเป็นอาจารย์ที่ปรึกษาสำหรับโครงงาน &quot;
            {project.titleTh}&quot;
          </p>
        </div>
      </div>

      {canRequest && (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              ส่งคำขอถึงอาจารย์
            </CardTitle>
            <CardDescription>
              อาจารย์จะได้รับแจ้งคำขอและสามารถตอบรับหรือปฏิเสธผ่านระบบได้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestAdvisorForm projectId={project.id} faculties={faculties} />
          </CardContent>
        </Card>
      )}

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            ประวัติคำขออาจารย์ที่ปรึกษา
          </CardTitle>
          <CardDescription>
            รายการคำขอและสถานะการตอบรับของอาจารย์
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.advisorRequests.length === 0 ? (
            <div className="text-muted-foreground p-6 text-center text-sm">
              ยังไม่มีคำขออาจารย์ที่ปรึกษาสำหรับโครงงานนี้
            </div>
          ) : (
            project.advisorRequests.map((req) => (
              <div
                key={req.id}
                className="border-border bg-muted/20 flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold dark:bg-zinc-800">
                    อ.
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-semibold">
                      {req.facultyProfile.titleTh || ""}{" "}
                      {req.facultyProfile.user.name}
                    </p>
                    <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                      {req.facultyProfile.department || "อาจารย์ประจำสาขา"} •{" "}
                      {req.facultyProfile.user.email}
                    </p>
                    {req.responseReason && (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        หมายเหตุจากอาจารย์: {req.responseReason}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Badge
                    variant="outline"
                    className={
                      req.status === "ACCEPTED"
                        ? "border-emerald-300 text-emerald-600 dark:border-emerald-800"
                        : req.status === "PENDING"
                          ? "border-amber-300 text-amber-600 dark:border-amber-800"
                          : "text-zinc-500"
                    }
                  >
                    {req.status === "ACCEPTED" && (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    )}
                    {req.status === "PENDING" && (
                      <Clock className="mr-1 h-3 w-3" />
                    )}
                    {req.status === "DECLINED" && (
                      <XCircle className="mr-1 h-3 w-3" />
                    )}
                    {ADVISOR_REQUEST_STATUS_LABELS_TH[req.status]}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
