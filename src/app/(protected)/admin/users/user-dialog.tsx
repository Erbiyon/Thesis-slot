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
import { createProvisionedUser } from "./actions";
import { ROLE_LABELS_TH, Role } from "@/lib/permissions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function UserDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("STUDENT");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);

      await createProvisionedUser(formData);
      toast.success("สร้างบัญชีผู้ใช้งานสำเร็จ");
      setName("");
      setEmail("");
      setPassword("");
      setOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสร้างบัญชี";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>สร้างบัญชีผู้ใช้งานใหม่</DialogTitle>
            <DialogDescription>
              สร้างบัญชีและกำหนดบทบาทเริ่มต้นให้แก่ผู้ใช้ในระบบ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName">ชื่อ - นามสกุล</Label>
              <Input
                id="userName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น อ.ดร.สมชาย ใจดี หรือ นายสมศักดิ์ รักเรียน"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">อีเมลสถาบัน</Label>
              <Input
                id="userEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="เช่น somchai.j@university.ac.th"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userPassword">
                รหัสผ่านเริ่มต้น (อย่างน้อย 8 ตัวอักษร)
              </Label>
              <Input
                id="userPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userRole">บทบาทหน้าที่ (Role)</Label>
              <Select
                value={role}
                onValueChange={(val) => setRole(val as Role)}
              >
                <SelectTrigger id="userRole">
                  <SelectValue placeholder="เลือกบทบาทหน้าที่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">
                    {ROLE_LABELS_TH.STUDENT}
                  </SelectItem>
                  <SelectItem value="FACULTY">
                    {ROLE_LABELS_TH.FACULTY}
                  </SelectItem>
                  <SelectItem value="ACADEMIC_STAFF">
                    {ROLE_LABELS_TH.ACADEMIC_STAFF}
                  </SelectItem>
                  <SelectItem value="ADMIN">{ROLE_LABELS_TH.ADMIN}</SelectItem>
                </SelectContent>
              </Select>
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
              สร้างบัญชี
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
