"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { toggleUserSuspension } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function UserSuspensionButton({
  userId,
  isSuspended,
}: {
  userId: string;
  isSuspended: boolean;
}) {
  const [loading, setLoading] = React.useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleUserSuspension(userId, isSuspended);
      toast.success(
        isSuspended ? "ยกเลิกการระงับการใช้งานแล้ว" : "ระงับการใช้งานบัญชีแล้ว"
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isSuspended ? "outline" : "destructive"}
      size="sm"
      className="h-8 px-2 text-xs"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isSuspended ? (
        "ปลดระงับ"
      ) : (
        "ระงับใช้งาน"
      )}
    </Button>
  );
}
