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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignCommitteeMember } from "./actions";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";
import { CommitteeResponsibility } from "@prisma/client";

interface AssignCommitteeDialogProps {
  projectId: string;
  projectTitle: string;
  faculties: Array<{
    id: string;
    titleTh?: string | null;
    department?: string | null;
    user: { id: string; name: string; email: string };
  }>;
}

export function AssignCommitteeDialog({
  projectId,
  projectTitle,
  faculties,
}: AssignCommitteeDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [facultyProfileId, setFacultyProfileId] = React.useState("");
  const [responsibility, setResponsibility] =
    React.useState<CommitteeResponsibility>(CommitteeResponsibility.COMMITTEE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyProfileId) {
      toast.error("กรุณาเลือกอาจารย์ผู้ได้รับการแต่งตั้ง");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("facultyProfileId", facultyProfileId);
      formData.append("responsibility", responsibility);

      await assignCommitteeMember(formData);
      toast.success("แต่งตั้งกรรมการสอบและส่งคำเชิญเรียบร้อยแล้ว");
      setOpen(false);
      setFacultyProfileId("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการแต่งตั้ง";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 text-xs">
          <UserPlus className="h-3.5 w-3.5" />
          แต่งตั้งกรรมการสอบ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>แต่งตั้งคณะกรรมการสอบ</DialogTitle>
            <DialogDescription className="line-clamp-1 text-xs">
              โครงงาน: {projectTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="faculty">เลือกอาจารย์</Label>
              <Select
                value={facultyProfileId}
                onValueChange={setFacultyProfileId}
                disabled={loading}
              >
                <SelectTrigger id="faculty">
                  <SelectValue placeholder="-- เลือกอาจารย์ในระบบ --" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.titleTh || ""}
                      {f.user.name} ({f.department || "คณาจารย์"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="responsibility">หน้าที่ในชุดกรรมการสอบ</Label>
              <Select
                value={responsibility}
                onValueChange={(val) =>
                  setResponsibility(val as CommitteeResponsibility)
                }
                disabled={loading}
              >
                <SelectTrigger id="responsibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHAIR">
                    ประธานกรรมการสอบ (Chair)
                  </SelectItem>
                  <SelectItem value="COMMITTEE">
                    กรรมการสอบ (Committee Member)
                  </SelectItem>
                  <SelectItem value="ADVISOR">
                    อาจารย์ที่ปรึกษาหลัก (Advisor)
                  </SelectItem>
                  <SelectItem value="CO_ADVISOR">
                    อาจารย์ที่ปรึกษาร่วม (Co-Advisor)
                  </SelectItem>
                  <SelectItem value="EXTERNAL">
                    ผู้ทรงคุณวุฒิภายนอก (External Examiner)
                  </SelectItem>
                </SelectContent>
              </Select>
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
              บันทึกการแต่งตั้ง
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
