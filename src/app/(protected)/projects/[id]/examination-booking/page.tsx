import { assertProjectAccess } from "@/lib/project-guards";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingWizard } from "./booking-wizard";
import {
  EXAMINATION_BOOKING_STATUS_LABELS_TH,
  BOOKING_HISTORY_ACTION_LABELS_TH,
} from "@/lib/permissions";
import { CancelBookingDialog } from "./cancel-booking-dialog";
import { RescheduleBookingDialog } from "./reschedule-booking-dialog";
import { CalendarDays, ArrowLeft, AlertCircle } from "lucide-react";

export default async function ExaminationBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { project, isLeader } = await assertProjectAccess(id);

  if (project.reviewStatus !== "APPROVED") {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-600" />
        <h1 className="text-xl font-bold">โครงงานยังไม่พร้อมสำหรับการจองสอบ</h1>
        <p className="text-muted-foreground text-sm">
          เฉพาะโครงงานที่ผ่านการอนุมัติการลงทะเบียนโครงงานแล้วเท่านั้นจึงจะสามารถจองสอบได้
        </p>
        <Button asChild variant="outline">
          <Link href={`/projects/${project.id}`}>
            กลับหน้ารายละเอียดโครงงาน
          </Link>
        </Button>
      </div>
    );
  }

  // Fetch accepted advisor + accepted committee
  const [activeBooking, acceptedAdvisor, acceptedCommittees] =
    await Promise.all([
      prisma.examinationBooking.findFirst({
        where: {
          projectId: project.id,
          status: { in: ["PENDING_REVIEW", "CONFIRMED"] },
        },
        include: {
          examinationRoom: true,
          histories: {
            orderBy: { createdAt: "desc" },
            include: { actor: { select: { name: true } } },
          },
        },
      }),
      prisma.advisorRequest.findFirst({
        where: { projectId: project.id, status: "ACCEPTED" },
        include: { facultyProfile: { include: { user: true } } },
      }),
      prisma.examinationCommitteeMember.findMany({
        where: { projectId: project.id, invitationStatus: "ACCEPTED" },
        include: { facultyProfile: { include: { user: true } } },
      }),
      prisma.examinationRoom.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
      }),
    ]);

  return (
    <div className="animate-in fade-in-50 max-w-4xl space-y-6 duration-300">
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <Button variant="ghost" size="sm" asChild className="h-auto p-0">
            <Link
              href={`/projects/${project.id}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              กลับหน้ารายละเอียดโครงงาน
            </Link>
          </Button>

          <h1 className="text-foreground mt-2 flex items-center gap-2.5 text-2xl font-bold tracking-tight md:text-3xl">
            <CalendarDays className="h-7 w-7 text-zinc-700 dark:text-zinc-300" />
            การจองสอบโครงงานและวิทยานิพนธ์ (Examination Booking)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            โครงงาน: &quot;{project.titleTh}&quot;
          </p>
        </div>
      </div>

      {activeBooking ? (
        <div className="space-y-6">
          <div className="border-border bg-card space-y-4 rounded-xl border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    activeBooking.status === "CONFIRMED"
                      ? "outline"
                      : "secondary"
                  }
                  className={
                    activeBooking.status === "CONFIRMED"
                      ? "border-emerald-300 text-emerald-600"
                      : "border-amber-300 text-amber-600"
                  }
                >
                  {EXAMINATION_BOOKING_STATUS_LABELS_TH[activeBooking.status]}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  ยื่นคำขอเมื่อ{" "}
                  {new Date(activeBooking.createdAt).toLocaleDateString(
                    "th-TH"
                  )}
                </span>
              </div>

              {isLeader && (
                <div className="flex items-center gap-2">
                  <RescheduleBookingDialog
                    bookingId={activeBooking.id}
                    projectId={project.id}
                    academicTermId={project.academicTermId}
                    projectTitle={project.titleTh}
                    currentRoomName={activeBooking.examinationRoom.nameTh}
                    currentDateTimeDisplay={`${new Date(activeBooking.startAt).toLocaleDateString("th-TH")} (${new Date(activeBooking.startAt).toLocaleTimeString("th-TH", { timeStyle: "short" })} - ${new Date(activeBooking.endAt).toLocaleTimeString("th-TH", { timeStyle: "short" })})`}
                    isStaff={false}
                  />
                  <CancelBookingDialog
                    bookingId={activeBooking.id}
                    projectTitle={project.titleTh}
                    roomName={activeBooking.examinationRoom.nameTh}
                    dateTimeDisplay={`${new Date(activeBooking.startAt).toLocaleDateString("th-TH")} (${new Date(activeBooking.startAt).toLocaleTimeString("th-TH", { timeStyle: "short" })} - ${new Date(activeBooking.endAt).toLocaleTimeString("th-TH", { timeStyle: "short" })})`}
                    isStaff={false}
                  />
                </div>
              )}
            </div>

            <div className="bg-muted/20 grid grid-cols-1 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground block text-xs">
                  วันและเวลาสอบ:
                </span>
                <span className="text-foreground font-semibold">
                  {new Date(activeBooking.startAt).toLocaleDateString("th-TH", {
                    dateStyle: "full",
                  })}{" "}
                  (
                  {new Date(activeBooking.startAt).toLocaleTimeString("th-TH", {
                    timeStyle: "short",
                  })}{" "}
                  -{" "}
                  {new Date(activeBooking.endAt).toLocaleTimeString("th-TH", {
                    timeStyle: "short",
                  })}
                  )
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">
                  สถานที่/ห้องสอบ:
                </span>
                <span className="text-foreground font-semibold">
                  {activeBooking.examinationRoom.nameTh} (
                  {activeBooking.examinationRoom.code})
                </span>
              </div>
            </div>

            {activeBooking.reviewReason && (
              <div className="bg-muted/40 text-muted-foreground rounded-lg border p-3 text-xs">
                <span className="text-foreground font-semibold">
                  บันทึกจากเจ้าหน้าที่:
                </span>{" "}
                {activeBooking.reviewReason}
              </div>
            )}

            {/* Audit History */}
            <div className="pt-2">
              <h3 className="text-muted-foreground mb-2 text-xs font-semibold">
                ประวัติการดำเนินการ (Audit Trail)
              </h3>
              <div className="space-y-2">
                {activeBooking.histories.map((h) => (
                  <div
                    key={h.id}
                    className="bg-muted/10 flex items-center justify-between rounded border p-2.5 text-xs"
                  >
                    <div>
                      <span className="text-foreground font-medium">
                        {BOOKING_HISTORY_ACTION_LABELS_TH[h.action] || h.action}
                      </span>
                      {h.details && (
                        <span className="text-muted-foreground ml-2">
                          — {h.details}
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground text-[11px]">
                      โดย {h.actor.name} (
                      {new Date(h.createdAt).toLocaleTimeString("th-TH", {
                        timeStyle: "short",
                      })}
                      )
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <BookingWizard
          projectId={project.id}
          academicTermId={project.academicTermId}
          projectTitle={project.titleTh}
          acceptedAdvisor={acceptedAdvisor?.facultyProfile}
          acceptedCommittees={acceptedCommittees.map((c) => c.facultyProfile)}
          isLeader={isLeader}
        />
      )}
    </div>
  );
}
