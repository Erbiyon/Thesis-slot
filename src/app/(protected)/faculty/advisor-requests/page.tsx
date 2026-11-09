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
import { RespondAdvisorRequestDialog } from "./respond-advisor-dialog";
import {
  PROJECT_TYPE_LABELS_TH,
  ADVISOR_REQUEST_STATUS_LABELS_TH,
} from "@/lib/permissions";
import { Mail, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default async function FacultyAdvisorRequestsPage() {
  const { user } = await requireRole(["FACULTY", "ADMIN"]);

  const facultyProfile = await prisma.facultyProfile.findUnique({
    where: { userId: user.id },
  });

  const requests = facultyProfile
    ? await prisma.advisorRequest.findMany({
        where: { facultyProfileId: facultyProfile.id },
        orderBy: { createdAt: "desc" },
        include: {
          project: {
            include: {
              academicProgram: true,
              academicTerm: { include: { academicYear: true } },
              creator: true,
              members: {
                include: { studentProfile: { include: { user: true } } },
              },
            },
          },
        },
      })
    : [];

  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      <div className="border-border border-b pb-4">
        <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Mail className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          คำขอเป็นอาจารย์ที่ปรึกษาโครงงาน (Advisor Requests)
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          พิจารณาคำขอแต่งตั้งเป็นอาจารย์ที่ปรึกษาโครงงานและวิทยานิพนธ์จากกลุ่มนักศึกษา
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            รายการคำขอทั้งหมดที่ส่งถึงคุณ
          </CardTitle>
          <CardDescription>{requests.length} คำขอที่พบในระบบ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center text-sm">
              ยังไม่มีคำขอเป็นอาจารย์ที่ปรึกษาที่ส่งถึงคุณในขณะนี้
            </div>
          ) : (
            requests.map((req) => {
              const proj = req.project;

              return (
                <div
                  key={req.id}
                  className="border-border bg-muted/20 flex flex-col justify-between gap-4 rounded-lg border p-4 md:flex-row md:items-center"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {PROJECT_TYPE_LABELS_TH[proj.projectType]}
                      </Badge>
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

                    <h2 className="text-foreground text-base font-semibold">
                      {proj.titleTh}
                    </h2>

                    <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span>หลักสูตร: {proj.academicProgram.code}</span>
                      <span>
                        ภาคเรียน: {proj.academicTerm.nameTh} (
                        {proj.academicTerm.academicYear.yearLabel})
                      </span>
                      <span>ผู้ยื่นคำขอ: {proj.creator.name}</span>
                    </div>

                    {req.responseReason && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        หมายเหตุ: {req.responseReason}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/projects/${proj.id}`}
                        className="gap-1 text-xs"
                      >
                        ดูโครงงาน
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>

                    {req.status === "PENDING" && (
                      <RespondAdvisorRequestDialog requestId={req.id} />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
