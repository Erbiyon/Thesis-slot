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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAcademicTerm, updateAcademicTerm } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TermDialogProps {
  term?: {
    id: string;
    academicYearId: string;
    termCode: string;
    nameTh: string;
    isActive: boolean;
  };
  years: Array<{ id: string; yearLabel: string }>;
  trigger: React.ReactNode;
}

export function TermDialog({ term, years, trigger }: TermDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [academicYearId, setAcademicYearId] = React.useState(
    term?.academicYearId || (years[0]?.id ?? "")
  );
  const [termCode, setTermCode] = React.useState(term?.termCode || "1");
  const [nameTh, setNameTh] = React.useState(term?.nameTh || "ภาคการศึกษาต้น");
  const [isActive, setIsActive] = React.useState(term ? term.isActive : true);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && term) {
      setAcademicYearId(term.academicYearId);
      setTermCode(term.termCode);
      setNameTh(term.nameTh);
      setIsActive(term.isActive);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("academicYearId", academicYearId);
      formData.append("termCode", termCode);
      formData.append("nameTh", nameTh);
      formData.append("isActive", String(isActive));

      if (term) {
        await updateAcademicTerm(term.id, formData);
        toast.success("แก้ไขข้อมูลภาคการศึกษาสำเร็จ");
      } else {
        await createAcademicTerm(formData);
        toast.success("เพิ่มภาคการศึกษาสำเร็จ");
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
              {term ? "แก้ไขภาคการศึกษา" : "เพิ่มภาคการศึกษาใหม่"}
            </DialogTitle>
            <DialogDescription>
              กำหนดรหัสและชื่อภาคการศึกษาภายใต้ปีการศึกษาที่เลือก
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="academicYearId">ปีการศึกษา</Label>
              <Select
                value={academicYearId}
                onValueChange={setAcademicYearId}
                disabled={!!term}
              >
                <SelectTrigger id="academicYearId">
                  <SelectValue placeholder="เลือกปีการศึกษา" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      พ.ศ. {y.yearLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="termCode">รหัสภาคเรียน (Term Code)</Label>
              <Input
                id="termCode"
                value={termCode}
                onChange={(e) => setTermCode(e.target.value)}
                placeholder="เช่น 1, 2 หรือ 3 (ภาคฤดูร้อน)"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameTh">ชื่อภาคการศึกษา (ภาษาไทย)</Label>
              <Input
                id="nameTh"
                value={nameTh}
                onChange={(e) => setNameTh(e.target.value)}
                placeholder="เช่น ภาคการศึกษาต้น หรือ ภาคการศึกษาปลาย"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActiveTerm"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <Label htmlFor="isActiveTerm" className="cursor-pointer text-sm">
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
              {term ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
