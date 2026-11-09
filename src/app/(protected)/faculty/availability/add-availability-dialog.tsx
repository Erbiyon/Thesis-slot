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
import { addFacultyAvailability } from "./actions";
import { toast } from "sonner";
import { CalendarPlus, Loader2 } from "lucide-react";

export function AddAvailabilityDialog() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [date, setDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("12:00");
  const [note, setNote] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) {
      toast.error("กรุณาระบุวันที่และช่วงเวลาให้ครบถ้วน");
      return;
    }

    setLoading(true);
    try {
      const startAt = `${date}T${startTime}:00+07:00`;
      const endAt = `${date}T${endTime}:00+07:00`;

      const formData = new FormData();
      formData.append("startAt", startAt);
      formData.append("endAt", endAt);
      formData.append("availabilityType", "UNAVAILABLE");
      formData.append("note", note);

      await addFacultyAvailability(formData);
      toast.success("บันทึกช่วงเวลาไม่สะดวกเรียบร้อยแล้ว");
      setOpen(false);
      setDate("");
      setNote("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 text-xs">
          <CalendarPlus className="h-3.5 w-3.5" />
          ระบุช่วงเวลาไม่สะดวก
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>ระบุช่วงเวลาไม่สะดวก (Unavailable)</DialogTitle>
            <DialogDescription className="text-xs">
              ระบบจะไม่นำเสนอช่วงเวลานี้ในการคำนวณสล็อตว่างสำหรับการจัดสอบ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="space-y-1">
              <Label htmlFor="date" className="text-xs">
                วันที่
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="startTime" className="text-xs">
                  เวลาเริ่มต้น
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endTime" className="text-xs">
                  เวลาสิ้นสุด
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="note" className="text-xs">
                เหตุผลหรือบันทึกช่วยจำ (ไม่บังคับ)
              </Label>
              <Input
                id="note"
                placeholder="เช่น ติดภารกิจสอน, ลากิจ, สัมมนาวิชาการ"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
