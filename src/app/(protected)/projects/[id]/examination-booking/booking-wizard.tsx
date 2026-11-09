"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { requestExaminationBooking } from "@/app/(protected)/projects/booking-actions";
import { fetchSlotsAction } from "./fetch-slots";
import { CandidateSlot } from "@/lib/slot-calculator";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Send,
} from "lucide-react";

interface BookingWizardProps {
  projectId: string;
  academicTermId: string;
  projectTitle: string;
  acceptedAdvisor?: {
    id: string;
    titleTh?: string | null;
    user: { name: string; email: string };
  };
  acceptedCommittees: Array<{
    id: string;
    titleTh?: string | null;
    user: { name: string; email: string };
  }>;
  isLeader: boolean;
}

export function BookingWizard({
  projectId,
  academicTermId,
  projectTitle,
  acceptedAdvisor,
  acceptedCommittees,
  isLeader,
}: BookingWizardProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<number>(1);
  const [dateStr, setDateStr] = React.useState<string>("");
  const [loadingSlots, setLoadingSlots] = React.useState<boolean>(false);
  const [slots, setSlots] = React.useState<CandidateSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<CandidateSlot | null>(
    null
  );
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // When date changes, fetch available slots
  const handleDateChange = async (newDate: string) => {
    setDateStr(newDate);
    setSelectedSlot(null);
    if (!newDate) {
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    try {
      const calculated = await fetchSlotsAction(
        projectId,
        newDate,
        academicTermId
      );
      setSlots(calculated);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการโหลดช่วงเวลาสอบ");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!acceptedAdvisor) {
        toast.error(
          "โครงงานต้องมีอาจารย์ที่ปรึกษาที่ตอบรับแล้วก่อนดำเนินการต่อ"
        );
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!dateStr || !selectedSlot) {
        toast.error("กรุณาเลือกวันและช่วงเวลาห้องสอบที่ต้องการ");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedSlot) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("examinationRoomId", selectedSlot.roomId);
      formData.append("academicTermId", academicTermId);
      formData.append("startAt", selectedSlot.startAt);
      formData.append("endAt", selectedSlot.endAt);

      await requestExaminationBooking(formData);
      toast.success(
        "ยื่นคำขอจองสอบเรียบร้อยแล้ว รอการตรวจสอบจากเจ้าหน้าที่วิชาการ"
      );
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการยื่นคำขอจองสอบ";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between border-b pb-4 text-xs font-medium">
        <div
          className={`flex items-center gap-1.5 ${
            step === 1 ? "text-foreground font-bold" : "text-muted-foreground"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[11px]">
            1
          </span>
          <span>ตรวจสอบความพร้อมโครงงาน</span>
        </div>
        <div className="bg-border h-px w-8" />
        <div
          className={`flex items-center gap-1.5 ${
            step === 2 ? "text-foreground font-bold" : "text-muted-foreground"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[11px]">
            2
          </span>
          <span>เลือกวัน เวลา และห้องสอบ</span>
        </div>
        <div className="bg-border h-px w-8" />
        <div
          className={`flex items-center gap-1.5 ${
            step === 3 ? "text-foreground font-bold" : "text-muted-foreground"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[11px]">
            3
          </span>
          <span>ยืนยันและยื่นคำขอจองสอบ</span>
        </div>
      </div>

      {/* Step 1: Verification */}
      {step === 1 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              ขั้นตอนที่ 1: ตรวจสอบความพร้อมของโครงงาน
            </CardTitle>
            <CardDescription className="text-xs">
              ระบบตรวจสอบความสมบูรณ์ของโครงงานก่อนเปิดให้เลือกช่วงเวลาสอบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/20 space-y-3 rounded-lg border p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  สถานะการลงทะเบียนโครงงาน:
                </span>
                <Badge
                  variant="outline"
                  className="border-emerald-300 text-emerald-600"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  อนุมัติการลงทะเบียนแล้ว
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  อาจารย์ที่ปรึกษาหลัก:
                </span>
                {acceptedAdvisor ? (
                  <span className="text-foreground font-semibold">
                    {acceptedAdvisor.titleTh || ""}
                    {acceptedAdvisor.user.name}
                  </span>
                ) : (
                  <span className="text-destructive font-medium">
                    ยังไม่มีที่ปรึกษาตอบรับ
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  คณะกรรมการสอบที่ตอบรับแล้ว:
                </span>
                <span className="text-foreground font-semibold">
                  {acceptedCommittees.length > 0
                    ? `${acceptedCommittees.length} ท่าน (${acceptedCommittees
                        .map((c) => c.user.name)
                        .join(", ")})`
                    : "อยู่ระหว่างการแต่งตั้งโดยเจ้าหน้าที่ (สามารถจองสอบล่วงหน้าได้)"}
                </span>
              </div>
            </div>

            {!isLeader && (
              <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                คุณไม่ใช่หัวหน้ากลุ่มโครงงานนี้
                เฉพาะหัวหน้ากลุ่มเท่านั้นที่สามารถยื่นคำขอจองสอบได้
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleNext}
                disabled={!isLeader || !acceptedAdvisor}
                className="gap-1.5 text-xs"
              >
                ถัดไป: เลือกวันและห้องสอบ
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date & Slot Selection */}
      {step === 2 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              ขั้นตอนที่ 2: เลือกวัน เวลา และห้องสอบ
            </CardTitle>
            <CardDescription className="text-xs">
              ระบุวันที่ต้องการสอบ
              ระบบจะคำนวณช่วงเวลาที่ห้องสอบและอาจารย์ทุกท่านว่างพร้อมกัน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="examDate" className="text-xs">
                เลือกวันที่ต้องการสอบ
              </Label>
              <Input
                id="examDate"
                type="date"
                value={dateStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="text-xs"
              />
            </div>

            {loadingSlots ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-center text-xs">
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังคำนวณช่วงเวลาว่างที่สอดคล้องกับอาจารย์และห้องสอบ...
              </div>
            ) : dateStr ? (
              <div className="space-y-3">
                <Label className="text-xs">
                  ช่วงเวลาและห้องสอบที่สามารถจองได้ในวันที่ {dateStr}
                </Label>
                {slots.length === 0 ? (
                  <p className="text-muted-foreground rounded border py-6 text-center text-xs">
                    ไม่พบข้อมูลห้องสอบที่เปิดใช้งานในระบบ
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {slots.map((s, idx) => {
                      const isSelected =
                        selectedSlot?.startAt === s.startAt &&
                        selectedSlot?.roomId === s.roomId;

                      const timeLabel = `${new Date(
                        s.startAt
                      ).toLocaleTimeString("th-TH", {
                        timeStyle: "short",
                      })} - ${new Date(s.endAt).toLocaleTimeString("th-TH", {
                        timeStyle: "short",
                      })}`;

                      return (
                        <div
                          key={idx}
                          onClick={() => s.available && setSelectedSlot(s)}
                          className={`rounded-lg border p-3.5 text-xs transition-all ${
                            !s.available
                              ? "bg-muted/40 cursor-not-allowed border-dashed opacity-45"
                              : isSelected
                                ? "cursor-pointer border-zinc-900 bg-zinc-900 text-zinc-50 shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                                : "bg-card cursor-pointer hover:border-zinc-400"
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {timeLabel}
                            </span>
                            <Badge
                              variant={s.available ? "outline" : "secondary"}
                              className={`text-[10px] ${
                                isSelected
                                  ? "border-current text-inherit"
                                  : s.available
                                    ? "border-emerald-300 text-emerald-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {s.available ? "ว่างสำหรับจอง" : "ไม่ว่าง"}
                            </Badge>
                          </div>
                          <div className="mt-2 text-[11px] opacity-85">
                            ห้องสอบ: {s.roomName} ({s.roomCode})
                          </div>
                          {s.conflictReason && (
                            <p className="text-destructive mt-1 text-[10px]">
                              ⚠️ {s.conflictReason}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground rounded border py-8 text-center text-xs">
                กรุณาเลือกวันที่ด้านบนเพื่อดูช่วงเวลาและห้องสอบที่ว่าง
              </p>
            )}

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="text-xs"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                ย้อนกลับ
              </Button>
              <Button
                onClick={handleNext}
                disabled={!selectedSlot}
                className="gap-1.5 text-xs"
              >
                ถัดไป: ตรวจสอบและยืนยัน
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && selectedSlot && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              ขั้นตอนที่ 3: ตรวจสอบและยื่นคำขอจองสอบ
            </CardTitle>
            <CardDescription className="text-xs">
              โปรดตรวจสอบความถูกต้องของข้อมูล
              เมื่อยื่นแล้วระบบจะทำการล็อกสำรองทรัพยากรชั่วคราว
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/20 space-y-3 rounded-lg border p-4 text-xs">
              <div>
                <span className="text-muted-foreground">ชื่อโครงงาน:</span>
                <p className="text-foreground mt-0.5 text-sm font-semibold">
                  {projectTitle}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 border-t pt-2 sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">
                    วันและเวลาที่เลือก:
                  </span>
                  <p className="text-foreground mt-0.5 font-semibold">
                    {new Date(selectedSlot.startAt).toLocaleDateString(
                      "th-TH",
                      {
                        dateStyle: "full",
                      }
                    )}
                    <br />
                    เวลา{" "}
                    {new Date(selectedSlot.startAt).toLocaleTimeString(
                      "th-TH",
                      {
                        timeStyle: "short",
                      }
                    )}{" "}
                    -{" "}
                    {new Date(selectedSlot.endAt).toLocaleTimeString("th-TH", {
                      timeStyle: "short",
                    })}{" "}
                    น.
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    สถานที่/ห้องสอบ:
                  </span>
                  <p className="text-foreground mt-0.5 font-semibold">
                    {selectedSlot.roomName} ({selectedSlot.roomCode})
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/40 text-muted-foreground rounded border p-3 text-xs">
              ℹ️{" "}
              <span className="text-foreground font-semibold">
                นโยบายการจอง (Provisional Hold):
              </span>{" "}
              คำขอจองสอบจะทำการสำรองช่วงเวลาห้องสอบและอาจารย์ชั่วคราวเพื่อรอเจ้าหน้าที่วิชาการตรวจสอบและยืนยัน
              หากเจ้าหน้าที่ปฏิเสธทรัพยากรจะถูกปล่อยว่างทันที
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={submitting}
                className="text-xs"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                ย้อนกลับไปแก้ไข
              </Button>
              <Button
                onClick={handleSubmitBooking}
                disabled={submitting}
                className="gap-1.5 text-xs"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                ยืนยันการยื่นคำขอจองสอบ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
