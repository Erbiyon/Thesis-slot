"use client";

import { useState, useTransition } from "react";
import { reviewExaminationBooking } from "@/app/(protected)/projects/booking-actions";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewBookingDialogProps {
  bookingId: string;
  projectCode: string;
  projectTitle: string;
  roomName: string;
  dateTimeDisplay: string;
  decision: "CONFIRMED" | "REJECTED";
}

export function ReviewBookingDialog({
  bookingId,
  projectCode,
  projectTitle,
  roomName,
  dateTimeDisplay,
  decision,
}: ReviewBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const isConfirm = decision === "CONFIRMED";

  const handleAction = () => {
    if (!isConfirm && !reason.trim()) {
      toast.error("กรุณาระบุเหตุผลการปฏิเสธคำขอ");
      return;
    }

    startTransition(async () => {
      try {
        await reviewExaminationBooking(
          bookingId,
          decision,
          reason.trim() || undefined
        );
        toast.success(
          isConfirm
            ? "ยืนยันการจองสอบเรียบร้อยแล้ว"
            : "ปฏิเสธคำขอจองสอบเรียบร้อยแล้ว"
        );
        setOpen(false);
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isConfirm ? (
          <Button
            size="sm"
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            ยืนยันการจอง
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5"
          >
            <XCircle className="h-4 w-4" />
            ปฏิเสธ
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isConfirm ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ยืนยันการอนุมัติคำขอจองสอบ
              </>
            ) : (
              <>
                <XCircle className="text-destructive h-5 w-5" />
                ปฏิเสธคำขอจองสอบ
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isConfirm
              ? "เมื่อยืนยันแล้ว ห้องสอบและเวลาจะถูกล็อกอย่างเป็นทางการ และแจ้งเตือนไปยังนักศึกษาและกรรมการ"
              : "เมื่อปฏิเสธ ช่วงเวลาห้องสอบจะถูกปล่อยคืน และให้นักศึกษาสามารถทำการจองใหม่ได้"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="bg-muted/40 space-y-1.5 rounded-lg border p-3">
            <div className="text-foreground font-semibold">
              [{projectCode}] {projectTitle}
            </div>
            <div className="text-muted-foreground flex flex-col gap-0.5">
              <span>
                ห้องสอบ: <strong className="text-foreground">{roomName}</strong>
              </span>
              <span>
                วัน-เวลา:{" "}
                <strong className="text-foreground">{dateTimeDisplay}</strong>
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">
              {isConfirm
                ? "หมายเหตุเพิ่มเติม (ถ้ามี)"
                : "เหตุผลการปฏิเสธ (จำเป็น)"}
            </Label>
            <Textarea
              id="reason"
              placeholder={
                isConfirm
                  ? "เช่น กรรมการสอบครบถ้วน อนุมัติตามตาราง"
                  : "ระบุเหตุผล เช่น เอกสารยังไม่สมบูรณ์ หรือ กรรมการแจ้งติดภารกิจด่วน"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
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
            onClick={handleAction}
            disabled={isPending}
            className={
              isConfirm
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            }
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isConfirm ? "ยืนยันการจอง" : "บันทึกการปฏิเสธ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
