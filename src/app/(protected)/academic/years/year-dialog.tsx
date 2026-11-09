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
import { createAcademicYear, updateAcademicYear } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface YearDialogProps {
  year?: {
    id: string;
    yearLabel: string;
    isActive: boolean;
  };
  trigger: React.ReactNode;
}

export function YearDialog({ year, trigger }: YearDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [yearLabel, setYearLabel] = React.useState(year?.yearLabel || "");
  const [isActive, setIsActive] = React.useState(year ? year.isActive : true);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && year) {
      setYearLabel(year.yearLabel);
      setIsActive(year.isActive);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("yearLabel", yearLabel);
      formData.append("isActive", String(isActive));

      if (year) {
        await updateAcademicYear(year.id, formData);
        toast.success("แก้ไขข้อมูลปีการศึกษาสำเร็จ");
      } else {
        await createAcademicYear(formData);
        toast.success("เพิ่มปีการศึกษาสำเร็จ");
        setYearLabel("");
      }
      setOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {year ? "แก้ไขปีการศึกษา" : "เพิ่มปีการศึกษาใหม่"}
            </DialogTitle>
            <DialogDescription>
              ระบุป้ายกำกับปีการศึกษา เช่น 2567 หรือ 2024
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="yearLabel">
                ป้ายกำกับปีการศึกษา (Year Label)
              </Label>
              <Input
                id="yearLabel"
                value={yearLabel}
                onChange={(e) => setYearLabel(e.target.value)}
                placeholder="เช่น 2567"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <Label htmlFor="isActive" className="cursor-pointer text-sm">
                เปิดใช้งานในระบบ
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {year ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
