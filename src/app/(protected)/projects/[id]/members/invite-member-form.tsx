"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteStudentMember } from "@/app/(protected)/projects/actions";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

export function InviteMemberForm({ projectId }: { projectId: string }) {
  const [studentCode, setStudentCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) return;

    setLoading(true);
    try {
      await inviteStudentMember(projectId, studentCode.trim());
      toast.success(
        `ส่งคำเชิญไปยังรหัสนักศึกษา "${studentCode}" เรียบร้อยแล้ว`
      );
      setStudentCode("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชิญ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleInvite} className="flex gap-2">
      <Input
        value={studentCode}
        onChange={(e) => setStudentCode(e.target.value)}
        placeholder="กรอกรหัสนักศึกษา เช่น 64010002"
        className="max-w-xs text-sm"
        disabled={loading}
        required
      />
      <Button type="submit" disabled={loading} size="sm" className="gap-1.5">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        ส่งคำเชิญ
      </Button>
    </form>
  );
}
