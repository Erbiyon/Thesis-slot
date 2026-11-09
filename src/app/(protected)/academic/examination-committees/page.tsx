import { requireRole } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AssignCommitteeDialog } from "./assign-committee-dialog";
import { RemoveCommitteeButton } from "./remove-committee-button";
import {
  COMMITTEE_RESPONSIBILITY_LABELS_TH,
  COMMITTEE_INVITATION_STATUS_LABELS_TH,
} from "@/lib/permissions";
import { ShieldCheck, GraduationCap } from "lucide-react";

export default async function ExaminationCommitteesPage() {
  await requireRole(["ACADEMIC_STAFF", "ADMIN"]);

  const [approvedProjects, faculties] = await Promise.all([
    prisma.academicProject.findMany({
      where: { reviewStatus: "APPROVED" },
      include: {
        academicProgram: true,
        academicTerm: { include: { academicYear: true } },
        advisorRequests: {
          where: { status: "ACCEPTED" },
          include: { facultyProfile: { include: { user: true } } },
        },
        committeeMembers: {
          include: { facultyProfile: { include: { user: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.facultyProfile.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <div className="animate-in fade-in-50 max-w-6xl space-y-6 duration-300">
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground flex items-center gap-2.5 text-2xl font-bold tracking-tight md:text-3xl">
            <ShieldCheck className="h-7 w-7 text-zinc-700 dark:text-zinc-300" />
            การจัดตั้งคณะกรรมการสอบ (Examination Committees)
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            กำหนดและแต่งตั้งคณะกรรมการสอบสำหรับโครงงานและวิทยานิพนธ์ที่ผ่านการอนุมัติการลงทะเบียน
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {approvedProjects.length === 0 ? (
          <Card className="border-border shadow-sm">
            <CardContent className="text-muted-foreground py-12 text-center">
              <GraduationCap className="text-muted-foreground/40 mx-auto mb-3 h-10 w-10" />
              <p className="text-base font-medium">
                ยังไม่มีโครงงานที่ผ่านการอนุมัติการลงทะเบียน
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                เฉพาะโครงงานที่เจ้าหน้าที่วิชาการอนุมัติใน Phase 2
                แล้วเท่านั้นที่จะปรากฏในหน้านี้
              </p>
            </CardContent>
          </Card>
        ) : (
          approvedProjects.map((project) => {
            const acceptedAdvisor = project.advisorRequests[0];
            const activeCommittees = project.committeeMembers.filter(
              (m) => m.invitationStatus !== "CANCELLED"
            );

            return (
              <Card key={project.id} className="border-border shadow-sm">
                <CardHeader className="border-border/40 border-b pb-3">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {project.projectType === "PROJECT"
                            ? "โครงงานพิเศษ"
                            : "วิทยานิพนธ์"}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          หลักสูตร {project.academicProgram.code} •{" "}
                          {project.academicTerm.nameTh}
                        </span>
                      </div>
                      <CardTitle className="text-foreground mt-1 text-lg font-bold">
                        {project.titleTh}
                      </CardTitle>
                      {project.titleEn && (
                        <CardDescription className="text-xs">
                          {project.titleEn}
                        </CardDescription>
                      )}
                    </div>

                    <AssignCommitteeDialog
                      projectId={project.id}
                      projectTitle={project.titleTh}
                      faculties={faculties}
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <div className="bg-muted/20 border-border/50 grid grid-cols-1 gap-4 rounded-lg border p-3 text-xs md:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">
                        อาจารย์ที่ปรึกษาหลัก:
                      </span>{" "}
                      <span className="text-foreground font-semibold">
                        {acceptedAdvisor
                          ? `${acceptedAdvisor.facultyProfile.titleTh || ""}${acceptedAdvisor.facultyProfile.user.name}`
                          : "ยังไม่ระบุ"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        จำนวนกรรมการที่แต่งตั้งแล้ว:
                      </span>{" "}
                      <span className="text-foreground font-semibold">
                        {activeCommittees.length} ท่าน
                      </span>
                    </div>
                  </div>

                  {activeCommittees.length === 0 ? (
                    <div className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-xs">
                      ยังไม่มีการแต่งตั้งกรรมการสอบสำหรับโครงงานนี้ กรุณากดปุ่ม
                      &quot;แต่งตั้งกรรมการสอบ&quot; ด้านบน
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">
                            ชื่อ-นามสกุลอาจารย์
                          </TableHead>
                          <TableHead className="w-[25%]">
                            หน้าที่รับผิดชอบ
                          </TableHead>
                          <TableHead className="w-[20%]">สถานะคำเชิญ</TableHead>
                          <TableHead className="w-[15%] text-right">
                            การจัดการ
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeCommittees.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">
                              {member.facultyProfile.titleTh || ""}
                              {member.facultyProfile.user.name}
                              <p className="text-muted-foreground text-[11px] font-normal">
                                {member.facultyProfile.department || "คณาจารย์"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {
                                  COMMITTEE_RESPONSIBILITY_LABELS_TH[
                                    member.responsibility
                                  ]
                                }
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  member.invitationStatus === "ACCEPTED"
                                    ? "border-emerald-300 text-emerald-600 dark:border-emerald-800"
                                    : member.invitationStatus === "DECLINED"
                                      ? "text-destructive border-destructive/30"
                                      : "border-amber-300 text-amber-600 dark:border-amber-800"
                                }
                              >
                                {
                                  COMMITTEE_INVITATION_STATUS_LABELS_TH[
                                    member.invitationStatus
                                  ]
                                }
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <RemoveCommitteeButton memberId={member.id} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
