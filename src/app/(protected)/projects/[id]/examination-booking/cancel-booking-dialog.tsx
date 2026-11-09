"use client";

import { useState, useTransition } from "react";
import { cancelExaminationBooking } from "@/app/(protected)/projects/booking-actions";
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
import { XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CancelBookingDialogProps {
  bookingId: string;
  projectTitle: string;
  roomName: string;
  dateTimeDisplay: string;
  isStaff?: boolean;
}

export function CancelBookingDialog({
  bookingId,
  projectTitle,
  roomName,
  dateTimeDisplay,
  isStaff = false,
}: CancelBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!reason.trim()) {
      toast.error("กรุณาระบุเหตุผลการยกเลิกการจองสอบ");
      return;
    }

    startTransition(async () => {
      try {
        await cancelExaminationBooking(bookingId, reason.trim());
        toast.success("ยกเลิกการจองสอบเรียบร้อยแล้ว คืนช่วงเวลาห้องสอบสู่ระบบ");
        setOpen(false);
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error.message || "เกิดข้อผิดพลาดในการยกเลิก");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5"
        >
          <XCircle className="h-4 w-4" />
          ยกเลิกกำหนดการสอบ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            ยืนยันการยกเลิกกำหนดการสอบ
          </DialogTitle>
          <DialogDescription>
            {isStaff
              ? "เมื่อยกเลิกแล้ว ห้องสอบและเวลาจะถูกปล่อยคืนสู่ระบบ และแจ้งเตือนไปยังกลุ่มนักศึกษาและคณะกรรมการสอบ"
              : "เมื่อยกเลิกแล้ว การจองนี้จะถูกยกเลิกอย่างถาวร และสล็อตห้องสอบจะถูกปล่อยคืนสู่ระบบเพื่อให้นักศึกษาสามารถทำการจองใหม่ได้"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="bg-muted/40 space-y-1.5 rounded-lg border p-3 text-xs">
            <div className="text-foreground font-semibold">{projectTitle}</div>
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
            <Label htmlFor="cancel-reason">
              เหตุผลการขอยกเลิก (จำเป็น){" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="ระบุเหตุผล เช่น เอกสารรูปเล่มไม่สมบูรณ์ หรือ มีความจำเป็นต้องเลื่อนไปภาคเรียนถัดไป"
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
            ปิด
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            ยืนยันการยกเลิก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
