"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRole } from "./actions";
import { ROLE_LABELS_TH, Role } from "@/lib/permissions";
import { toast } from "sonner";

export function UserRoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  const [loading, setLoading] = React.useState(false);
  const [role, setRole] = React.useState<Role>(currentRole);

  const handleRoleChange = async (newRole: string) => {
    setLoading(true);
    const targetRole = newRole as Role;
    try {
      await updateUserRole(userId, targetRole);
      setRole(targetRole);
      toast.success(`เปลี่ยนบทบาทเป็น "${ROLE_LABELS_TH[targetRole]}" สำเร็จ`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select value={role} onValueChange={handleRoleChange} disabled={loading}>
      <SelectTrigger className="h-8 w-[140px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="STUDENT">{ROLE_LABELS_TH.STUDENT}</SelectItem>
        <SelectItem value="FACULTY">{ROLE_LABELS_TH.FACULTY}</SelectItem>
        <SelectItem value="ACADEMIC_STAFF">
          {ROLE_LABELS_TH.ACADEMIC_STAFF}
        </SelectItem>
        <SelectItem value="ADMIN">{ROLE_LABELS_TH.ADMIN}</SelectItem>
      </SelectContent>
    </Select>
  );
}
