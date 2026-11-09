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
import { respondToAdvisorRequest } from "@/app/(protected)/projects/actions";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

export function RespondAdvisorRequestDialog({
  requestId,
}: {
  requestId: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const handleAction = async (accept: boolean) => {
    setLoading(true);
    try {
      await respondToAdvisorRequest(
        requestId,
        accept,
        reason.trim() || undefined
      );
      toast.success(
        accept
          ? "ตอบรับเป็นอาจารย์ที่ปรึกษาเรียบร้อยแล้ว"
          : "ปฏิเสธคำขอเรียบร้อยแล้ว"
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
        <Button size="sm" className="h-8 gap-1 text-xs">
          พิจารณาคำขอ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>พิจารณาคำขอเป็นอาจารย์ที่ปรึกษา</DialogTitle>
          <DialogDescription>
            คุณสามารถระบุข้อความหรือข้อเสนอแนะถึงนักศึกษาได้ (ไม่บังคับ)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Label htmlFor="reason">ข้อความ / เหตุผลประกอบ</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เช่น ยินดีรับเป็นที่ปรึกษา หรือ ติดภาระงานวิจัยเต็มโควตา"
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
            ปฏิเสธคำขอ
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
            ตอบรับเป็นที่ปรึกษา
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
