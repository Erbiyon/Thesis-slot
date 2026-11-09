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
import { createAcademicProgram, updateAcademicProgram } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProgramDialogProps {
  program?: {
    id: string;
    code: string;
    nameTh: string;
    nameEn?: string | null;
    degree?: string | null;
    isActive: boolean;
  };
  trigger: React.ReactNode;
}

export function ProgramDialog({ program, trigger }: ProgramDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [code, setCode] = React.useState(program?.code || "");
  const [nameTh, setNameTh] = React.useState(program?.nameTh || "");
  const [nameEn, setNameEn] = React.useState(program?.nameEn || "");
  const [degree, setDegree] = React.useState(program?.degree || "ปริญญาตรี");
  const [isActive, setIsActive] = React.useState(
    program ? program.isActive : true
  );

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && program) {
      setCode(program.code);
      setNameTh(program.nameTh);
      setNameEn(program.nameEn || "");
      setDegree(program.degree || "ปริญญาตรี");
      setIsActive(program.isActive);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("code", code);
      formData.append("nameTh", nameTh);
      formData.append("nameEn", nameEn);
      formData.append("degree", degree);
      formData.append("isActive", String(isActive));

      if (program) {
        await updateAcademicProgram(program.id, formData);
        toast.success("แก้ไขข้อมูลหลักสูตรสำเร็จ");
      } else {
        await createAcademicProgram(formData);
        toast.success("เพิ่มหลักสูตรสำเร็จ");
        setCode("");
        setNameTh("");
        setNameEn("");
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
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {program ? "แก้ไขข้อมูลหลักสูตร" : "เพิ่มหลักสูตรใหม่"}
            </DialogTitle>
            <DialogDescription>
              ระบุรหัสหลักสูตร ชื่อหลักสูตรภาษาไทยและภาษาอังกฤษ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">รหัสหลักสูตร (Program Code)</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น CPE-B.Eng."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameTh">ชื่อหลักสูตร (ภาษาไทย)</Label>
              <Input
                id="nameTh"
                value={nameTh}
                onChange={(e) => setNameTh(e.target.value)}
                placeholder="เช่น วิศวกรรมคอมพิวเตอร์บัณฑิต"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameEn">
                ชื่อหลักสูตร (ภาษาอังกฤษ - ไม่บังคับ)
              </Label>
              <Input
                id="nameEn"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="เช่น Bachelor of Engineering in Computer Engineering"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="degree">ระดับปริญญา</Label>
              <Input
                id="degree"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="เช่น ปริญญาตรี, ปริญญาโท, ปริญญาเอก"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActiveProgram"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <Label
                htmlFor="isActiveProgram"
                className="cursor-pointer text-sm"
              >
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
              {program ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
