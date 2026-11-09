"use client";

import * as React from "react";
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
import { updateProfile } from "./actions";
import { Role } from "@/lib/permissions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    studentProfile?: {
      studentCode: string;
      academicProgramId?: string | null;
    } | null;
    facultyProfile?: {
      staffCode?: string | null;
      department?: string | null;
      titleTh?: string | null;
    } | null;
  };
  role: Role;
  programs: Array<{ id: string; nameTh: string; code: string }>;
}

export function ProfileForm({ user, role, programs }: ProfileFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState(user.name);
  const [studentCode, setStudentCode] = React.useState(
    user.studentProfile?.studentCode || ""
  );
  const [academicProgramId, setAcademicProgramId] = React.useState(
    user.studentProfile?.academicProgramId || (programs[0]?.id ?? "")
  );
  const [staffCode, setStaffCode] = React.useState(
    user.facultyProfile?.staffCode || ""
  );
  const [department, setDepartment] = React.useState(
    user.facultyProfile?.department || ""
  );
  const [titleTh, setTitleTh] = React.useState(
    user.facultyProfile?.titleTh || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      if (role === "STUDENT") {
        formData.append("studentCode", studentCode);
        formData.append("academicProgramId", academicProgramId);
      }
      if (role === "FACULTY") {
        formData.append("staffCode", staffCode);
        formData.append("department", department);
        formData.append("titleTh", titleTh);
      }

      await updateProfile(formData);
      toast.success("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">อีเมลสถาบัน (ไม่สามารถแก้ไขได้)</Label>
        <Input
          id="email"
          value={user.email}
          disabled
          className="bg-muted/50 font-mono text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">ชื่อ - นามสกุล</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {role === "STUDENT" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="studentCode">รหัสนักศึกษา</Label>
            <Input
              id="studentCode"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="เช่น 64010001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program">หลักสูตร / สาขาวิชา</Label>
            <Select
              value={academicProgramId}
              onValueChange={setAcademicProgramId}
            >
              <SelectTrigger id="program">
                <SelectValue placeholder="เลือกหลักสูตรที่ศึกษา" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nameTh} ({p.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {role === "FACULTY" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="titleTh">คำนำหน้าทางวิชาการ</Label>
              <Input
                id="titleTh"
                value={titleTh}
                onChange={(e) => setTitleTh(e.target.value)}
                placeholder="เช่น ผศ.ดร. หรือ อ."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staffCode">รหัสบุคลากร</Label>
              <Input
                id="staffCode"
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                placeholder="เช่น ST-9021"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">ภาควิชา / สังกัด</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="เช่น ภาควิชาวิศวกรรมคอมพิวเตอร์"
            />
          </div>
        </>
      )}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          บันทึกการเปลี่ยนแปลง
        </Button>
      </div>
    </form>
  );
}
