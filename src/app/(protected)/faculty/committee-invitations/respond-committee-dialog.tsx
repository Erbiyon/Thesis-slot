"use client";

import * as React from "react";
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
import { respondToCommitteeInvitation } from "@/app/(protected)/academic/examination-committees/actions";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

export function RespondCommitteeDialog({ memberId }: { memberId: string }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const handleAction = async (accept: boolean) => {
    setLoading(true);
    try {
      await respondToCommitteeInvitation(
        memberId,
        accept,
        reason.trim() || undefined
      );
      toast.success(
        accept
          ? "ตอบรับการเป็นกรรมการสอบเรียบร้อยแล้ว"
          : "ปฏิเสธคำเชิญเรียบร้อยแล้ว"
      );
      setOpen(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการตอบรับ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 text-xs">
          พิจารณาคำเชิญ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>พิจารณาคำเชิญเป็นกรรมการสอบ</DialogTitle>
          <DialogDescription className="text-xs">
            โปรดพิจารณาตอบรับหรือปฏิเสธคำเชิญแต่งตั้งเป็นคณะกรรมการสอบโครงงานนี้
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-3">
          <Label htmlFor="reason" className="text-xs">
            ข้อความ / เหตุผลประกอบ (ไม่บังคับ)
          </Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เช่น ยินดีรับเป็นกรรมการ หรือ ติดภารกิจสอนเวลาดังกล่าว"
            className="text-xs"
          />
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => handleAction(false)}
            disabled={loading}
          >
            <X className="mr-1 h-4 w-4" />
            ปฏิเสธคำเชิญ
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => handleAction(true)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-1 h-4 w-4" />
            )}
            ตอบรับเป็นกรรมการสอบ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
