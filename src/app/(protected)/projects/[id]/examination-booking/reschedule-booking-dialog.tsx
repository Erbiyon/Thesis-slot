"use client";

import { useState, useTransition } from "react";
import { rescheduleExaminationBooking } from "@/app/(protected)/projects/booking-actions";
import { fetchSlotsAction } from "./fetch-slots";
import { CandidateSlot } from "@/lib/slot-calculator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Loader2, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

interface RescheduleBookingDialogProps {
  bookingId: string;
  projectId: string;
  academicTermId: string;
  projectTitle: string;
  currentRoomName: string;
  currentDateTimeDisplay: string;
  isStaff?: boolean;
}

export function RescheduleBookingDialog({
  bookingId,
  projectId,
  academicTermId,
  projectTitle,
  currentRoomName,
  currentDateTimeDisplay,
  isStaff = false,
}: RescheduleBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [candidateSlots, setCandidateSlots] = useState<CandidateSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CandidateSlot | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSearchSlots = async (selectedDate: string) => {
    setDateStr(selectedDate);
    setSelectedSlot(null);
    if (!selectedDate) return;

    setIsLoadingSlots(true);
    try {
      const slots = await fetchSlotsAction(
        projectId,
        selectedDate,
        academicTermId
      );
      setCandidateSlots(slots);
    } catch {
      toast.error("ไม่สามารถตรวจสอบช่วงเวลาสอบได้");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleReschedule = () => {
    if (!selectedSlot) {
      toast.error("กรุณาเลือกช่วงเวลาและห้องสอบใหม่");
      return;
    }

    startTransition(async () => {
      try {
        await rescheduleExaminationBooking(
          bookingId,
          selectedSlot.roomId,
          new Date(selectedSlot.startAt),
          new Date(selectedSlot.endAt),
          reason.trim() || undefined
        );
        toast.success(
          isStaff
            ? "เปลี่ยนวันเวลาสอบสำเร็จเรียบร้อยแล้ว"
            : "ส่งคำขอเปลี่ยนแปลงวันเวลาสอบเรียบร้อยแล้ว รอเจ้าหน้าที่ตรวจสอบ"
        );
        setOpen(false);
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error.message || "เกิดข้อผิดพลาดในการเลื่อนสอบ");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <CalendarClock className="h-4 w-4" />
          ขอเปลี่ยนแปลงวัน-เวลาสอบ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="text-primary h-5 w-5" />
            ขอเปลี่ยนแปลงวันและเวลาสอบ (Reschedule)
          </DialogTitle>
          <DialogDescription>
            {isStaff
              ? "เจ้าหน้าที่ทำการเปลี่ยนวันเวลาและห้องสอบในระบบอย่างเป็นทางการทันที"
              : "นักศึกษาสามารถเลือกวันและห้องสอบใหม่ที่สะดวก เพื่อส่งคำขอให้เจ้าหน้าที่พิจารณา"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Current booking info */}
          <div className="bg-muted/40 space-y-1 rounded-lg border p-3 text-xs">
            <div className="text-foreground font-semibold">{projectTitle}</div>
            <div className="text-muted-foreground flex flex-col gap-0.5">
              <span>
                ห้องเดิม:{" "}
                <strong className="text-foreground">{currentRoomName}</strong>
              </span>
              <span>
                เวลาเดิม:{" "}
                <strong className="text-foreground">
                  {currentDateTimeDisplay}
                </strong>
              </span>
            </div>
          </div>

          {/* New Date selection */}
          <div className="space-y-2">
            <Label htmlFor="new-date">เลือกวันที่ต้องการย้ายไปสอบใหม่</Label>
            <Input
              id="new-date"
              type="date"
              value={dateStr}
              onChange={(e) => handleSearchSlots(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Slot Search Feedback */}
          {isLoadingSlots && (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-center">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
              <p className="text-xs">
                กำลังตรวจสอบห้องสอบและตารางความพร้อมของอาจารย์...
              </p>
            </div>
          )}

          {!isLoadingSlots && dateStr && candidateSlots.length > 0 && (
            <div className="space-y-2">
              <Label>เลือกช่วงเวลาและห้องสอบใหม่ (2 ชั่วโมง)</Label>
              <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto rounded-lg border p-1 sm:grid-cols-2">
                {candidateSlots.map((slot, index) => {
                  const isSelected =
                    selectedSlot?.roomId === slot.roomId &&
                    selectedSlot?.startAt === slot.startAt;
                  const startTime = new Date(slot.startAt).toLocaleTimeString(
                    "th-TH",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );
                  const endTime = new Date(slot.endAt).toLocaleTimeString(
                    "th-TH",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`flex flex-col justify-between rounded-md border p-2.5 text-left text-xs transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-primary shadow-sm ring-1"
                          : slot.available
                            ? "border-border hover:border-foreground/30 bg-card"
                            : "bg-muted/40 cursor-not-allowed border-dashed opacity-45"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 font-mono font-semibold">
                          <Clock className="h-3 w-3" />
                          {startTime} - {endTime}
                        </span>
                        {slot.available ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-300 text-[10px] text-emerald-600"
                          >
                            ว่าง
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-destructive border-destructive/30 text-[10px]"
                          >
                            ติดขัด
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{slot.roomName}</span>
                      </div>
                      {slot.conflictReason && (
                        <p className="text-destructive/80 mt-1 line-clamp-1 text-[10px]">
                          {slot.conflictReason}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reschedule-reason">
              เหตุผลการขอเลื่อนสอบ (ถ้ามี)
            </Label>
            <Textarea
              id="reschedule-reason"
              placeholder="ระบุเหตุผล เช่น กรรมการแจ้งปรับเวลา หรือ กลุ่มนักศึกษาขอขยับเวลาเตรียมนำเสนอ"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={isPending || !selectedSlot}
            className="bg-primary text-primary-foreground"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            บันทึกการเปลี่ยนแปลง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
