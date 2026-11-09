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
import { AddAvailabilityDialog } from "./add-availability-dialog";
import { RemoveAvailabilityButton } from "./remove-availability-button";
import { Calendar, Clock, CalendarCheck2 } from "lucide-react";

export default async function FacultyAvailabilityPage() {
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

  // Fetch faculty's availability entries + confirmed examination commitments
  const [availabilities, confirmedExaminations] = await Promise.all([
    prisma.facultyAvailability.findMany({
      where: { facultyProfileId: facultyProfile.id },
      orderBy: { startAt: "asc" },
    }),
    prisma.examinationBooking.findMany({
      where: {
        status: "CONFIRMED",
        project: {
          OR: [
            {
              advisorRequests: {
                some: {
                  facultyProfileId: facultyProfile.id,
                  status: "ACCEPTED",
                },
              },
            },
            {
              committeeMembers: {
                some: {
                  facultyProfileId: facultyProfile.id,
                  invitationStatus: "ACCEPTED",
                },
              },
            },
          ],
        },
      },
      include: {
        project: true,
        examinationRoom: true,
      },
      orderBy: { startAt: "asc" },
    }),
  ]);

  return (
    <div className="animate-in fade-in-50 max-w-5xl space-y-6 duration-300">
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground flex items-center gap-2.5 text-2xl font-bold tracking-tight md:text-3xl">
            <CalendarCheck2 className="h-7 w-7 text-zinc-700 dark:text-zinc-300" />
            ตารางเวลาว่างและความพร้อมของอาจารย์ (Faculty Availability)
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            ระบุช่วงเวลาที่ท่านไม่สะดวกเพื่อป้องกันการจัดสอบชนกับภารกิจอื่นของท่าน
          </p>
        </div>

        <AddAvailabilityDialog />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Confirmed Exam Commitments */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-border/40 border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4 text-emerald-600" />
              กำหนดการสอบที่ยืนยันแล้วของท่าน
            </CardTitle>
            <CardDescription className="text-xs">
              ช่วงเวลาที่ท่านมีภารกิจเป็นกรรมการสอบหรือที่ปรึกษาในระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {confirmedExaminations.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-xs">
                ยังไม่มีกำหนดการสอบที่ยืนยันแล้ว
              </p>
            ) : (
              confirmedExaminations.map((exam) => (
                <div
                  key={exam.id}
                  className="border-border space-y-1.5 rounded-lg border bg-emerald-50/40 p-3 text-xs dark:bg-emerald-950/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-semibold">
                      {exam.project.titleTh}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-emerald-300 text-[10px] text-emerald-700"
                    >
                      ยืนยันแล้ว
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <span>
                      📅{" "}
                      {new Date(exam.startAt).toLocaleDateString("th-TH", {
                        dateStyle: "medium",
                      })}
                    </span>
                    <span>
                      ⏰{" "}
                      {new Date(exam.startAt).toLocaleTimeString("th-TH", {
                        timeStyle: "short",
                      })}{" "}
                      -{" "}
                      {new Date(exam.endAt).toLocaleTimeString("th-TH", {
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    🏫 ห้องสอบ: {exam.examinationRoom.nameTh} (
                    {exam.examinationRoom.code})
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right: Explicit Availability Blocks */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-border/40 border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Calendar className="h-4 w-4 text-amber-600" />
              ช่วงเวลาที่ระบุว่าไม่สะดวก (Unavailable Windows)
            </CardTitle>
            <CardDescription className="text-xs">
              ระบบจะไม่นำเสนอช่วงเวลานี้ให้นักศึกษาเลือกจองสอบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {availabilities.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-xs">
                ยังไม่ได้ระบุช่วงเวลาไม่สะดวก (พร้อมสำหรับการจัดสอบตามปกติ)
              </p>
            ) : (
              availabilities.map((item) => (
                <div
                  key={item.id}
                  className="border-border bg-muted/20 flex items-center justify-between rounded-lg border p-3 text-xs"
                >
                  <div>
                    <div className="text-foreground flex items-center gap-2 font-medium">
                      <span>
                        📅{" "}
                        {new Date(item.startAt).toLocaleDateString("th-TH", {
                          dateStyle: "medium",
                        })}
                      </span>
                      <span>
                        ⏰{" "}
                        {new Date(item.startAt).toLocaleTimeString("th-TH", {
                          timeStyle: "short",
                        })}{" "}
                        -{" "}
                        {new Date(item.endAt).toLocaleTimeString("th-TH", {
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-muted-foreground mt-0.5 text-[11px]">
                        เหตุผล: {item.note}
                      </p>
                    )}
                  </div>

                  <RemoveAvailabilityButton id={item.id} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
