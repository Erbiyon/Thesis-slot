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
import { InviteMemberForm } from "./invite-member-form";
import { RespondInvitationButton } from "./respond-invitation-button";
import { MEMBERSHIP_STATUS_LABELS_TH } from "@/lib/permissions";
import { Users, ArrowLeft, Mail } from "lucide-react";

export default async function ProjectMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, project, isLeader } = await assertProjectAccess(id);

  const canManage =
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
            <Users className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            จัดการสมาชิกกลุ่มโครงงาน
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            เชิญเพื่อนนักศึกษาเข้าร่วมกลุ่มโครงงาน &quot;{project.titleTh}&quot;
          </p>
        </div>
      </div>

      {canManage && (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Mail className="h-4 w-4" />
              เชิญนักศึกษาเข้าร่วมกลุ่ม
            </CardTitle>
            <CardDescription>
              ระบุรหัสนักศึกษาของเพื่อนร่วมกลุ่มเพื่อส่งคำเชิญ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteMemberForm projectId={project.id} />
          </CardContent>
        </Card>
      )}

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            รายชื่อสมาชิกและสถานะคำเชิญ
          </CardTitle>
          <CardDescription>
            สมาชิกที่ตอบรับคำเชิญจะได้รับสิทธิ์ในการดูรายละเอียดโครงงานร่วมกัน
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.members.map((member) => {
            const isMe = member.studentProfile.userId === user.id;

            return (
              <div
                key={member.id}
                className="border-border bg-muted/20 flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold dark:bg-zinc-800">
                    {member.memberRole === "LEADER" ? "หัวหน้า" : "สมาชิก"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-foreground text-sm font-semibold">
                        {member.studentProfile.user.name}
                      </p>
                      {isMe && (
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0 text-[10px]"
                        >
                          บัญชีของคุณ
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                      รหัสนักศึกษา: {member.studentProfile.studentCode} •{" "}
                      {member.studentProfile.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

                  {/* If current user is invited member, show respond buttons */}
                  {isMe && member.membershipStatus === "INVITED" && (
                    <RespondInvitationButton membershipId={member.id} />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
