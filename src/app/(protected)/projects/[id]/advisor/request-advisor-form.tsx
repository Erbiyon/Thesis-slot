"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestAdvisor } from "@/app/(protected)/projects/actions";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface RequestAdvisorFormProps {
  projectId: string;
  faculties: Array<{
    id: string;
    titleTh?: string | null;
    department?: string | null;
    user: { id: string; name: string; email: string };
  }>;
}

export function RequestAdvisorForm({
  projectId,
  faculties,
}: RequestAdvisorFormProps) {
  const [facultyProfileId, setFacultyProfileId] = React.useState(
    faculties[0]?.id || ""
  );
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyProfileId) {
      toast.error("กรุณาเลือกอาจารย์ที่ปรึกษา");
      return;
    }

    setLoading(true);
    try {
      await requestAdvisor(projectId, facultyProfileId);
      toast.success("ส่งคำขออาจารย์ที่ปรึกษาเรียบร้อยแล้ว");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งคำขอ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="faculty">เลือกอาจารย์ที่ปรึกษา</Label>
        <Select
          value={facultyProfileId}
          onValueChange={setFacultyProfileId}
          disabled={loading || faculties.length === 0}
        >
          <SelectTrigger id="faculty">
            <SelectValue placeholder="เลือกอาจารย์จากรายชื่อ" />
          </SelectTrigger>
          <SelectContent>
            {faculties.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.titleTh || ""} {f.user.name} (
                {f.department || "อาจารย์ประจำสาขา"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        disabled={loading || faculties.length === 0}
        className="gap-1.5"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        ส่งคำขอเป็นที่ปรึกษา
      </Button>
    </form>
  );
}
