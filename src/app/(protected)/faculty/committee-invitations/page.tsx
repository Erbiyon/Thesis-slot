import { requireAuth } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RespondCommitteeDialog } from "./respond-committee-dialog";
import {
  COMMITTEE_RESPONSIBILITY_LABELS_TH,
  COMMITTEE_INVITATION_STATUS_LABELS_TH,
} from "@/lib/permissions";
import { ShieldAlert, Clock } from "lucide-react";

export default async function FacultyCommitteeInvitationsPage() {
  const { user } = await requireAuth();

  const facultyProfile = await prisma.facultyProfile.findUnique({
    where: { userId: user.id },
  });

  if (!facultyProfile) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        ไม่พบข้อมูลโปรไฟล์คณาจารย์สำหรับบัญชีนี้
      </div>
    );
  }

  const invitations = await prisma.examinationCommitteeMember.findMany({
    where: {
      facultyProfileId: facultyProfile.id,
      invitationStatus: { in: ["PENDING", "ACCEPTED", "DECLINED"] },
    },
    include: {
      project: {
        include: {
          academicProgram: true,
          academicTerm: { include: { academicYear: true } },
          creator: true,
          advisorRequests: {
            where: { status: "ACCEPTED" },
            include: { facultyProfile: { include: { user: true } } },
          },
        },
      },
      assigner: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-in fade-in-50 max-w-5xl space-y-6 duration-300">
      <div className="border-border border-b pb-4">
        <h1 className="text-foreground flex items-center gap-2.5 text-2xl font-bold tracking-tight md:text-3xl">
          <ShieldAlert className="h-7 w-7 text-zinc-700 dark:text-zinc-300" />
          คำเชิญเป็นคณะกรรมการสอบ (Committee Invitations)
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          ตรวจสอบและตอบรับคำเชิญเข้าร่วมเป็นคณะกรรมการสอบโครงงานและวิทยานิพนธ์
        </p>
      </div>

      <div className="space-y-4">
        {invitations.length === 0 ? (
          <Card className="border-border shadow-sm">
            <CardContent className="text-muted-foreground py-12 text-center">
              <Clock className="text-muted-foreground/40 mx-auto mb-3 h-10 w-10" />
              <p className="text-base font-medium">
                ยังไม่มีคำเชิญเป็นกรรมการสอบในขณะนี้
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                เมื่อเจ้าหน้าที่วิชาการแต่งตั้งท่านเป็นกรรมการสอบ
                รายการจะปรากฏที่นี่
              </p>
            </CardContent>
          </Card>
        ) : (
          invitations.map((inv) => {
            const advisor = inv.project.advisorRequests[0];

            return (
              <Card key={inv.id} className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {inv.project.projectType === "PROJECT"
                            ? "โครงงานพิเศษ"
                            : "วิทยานิพนธ์"}
                        </Badge>
                        <Badge variant="secondary">
                          {
                            COMMITTEE_RESPONSIBILITY_LABELS_TH[
                              inv.responsibility
                            ]
                          }
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            inv.invitationStatus === "ACCEPTED"
                              ? "border-emerald-300 text-emerald-600 dark:border-emerald-800"
                              : inv.invitationStatus === "DECLINED"
                                ? "text-destructive border-destructive/30"
                                : "border-amber-300 text-amber-600 dark:border-amber-800"
                          }
                        >
                          {
                            COMMITTEE_INVITATION_STATUS_LABELS_TH[
                              inv.invitationStatus
                            ]
                          }
                        </Badge>
                      </div>

                      <CardTitle className="text-foreground mt-2 text-lg font-bold">
                        {inv.project.titleTh}
                      </CardTitle>
                      {inv.project.titleEn && (
                        <CardDescription className="text-xs">
                          {inv.project.titleEn}
                        </CardDescription>
                      )}
                    </div>

                    {inv.invitationStatus === "PENDING" && (
                      <RespondCommitteeDialog memberId={inv.id} />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="border-border/40 space-y-2 border-t pt-2 text-xs">
                  <div className="text-muted-foreground grid grid-cols-1 gap-2 md:grid-cols-3">
                    <div>
                      <span>หลักสูตร:</span>{" "}
                      <span className="text-foreground font-medium">
                        {inv.project.academicProgram.code}
                      </span>
                    </div>
                    <div>
                      <span>ภาคการศึกษา:</span>{" "}
                      <span className="text-foreground font-medium">
                        {inv.project.academicTerm.nameTh}
                      </span>
                    </div>
                    <div>
                      <span>อาจารย์ที่ปรึกษาหลัก:</span>{" "}
                      <span className="text-foreground font-medium">
                        {advisor
                          ? `${advisor.facultyProfile.titleTh || ""}${advisor.facultyProfile.user.name}`
                          : "ยังไม่ระบุ"}
                      </span>
                    </div>
                  </div>

                  {inv.responseReason && (
                    <div className="bg-muted/30 text-muted-foreground mt-2 rounded border p-2.5">
                      <span className="text-foreground font-semibold">
                        บันทึกเหตุผล:
                      </span>{" "}
                      {inv.responseReason}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
