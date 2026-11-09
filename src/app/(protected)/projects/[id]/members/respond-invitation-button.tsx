"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { respondToMembershipInvitation } from "@/app/(protected)/projects/actions";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

export function RespondInvitationButton({
  membershipId,
}: {
  membershipId: string;
}) {
  const [loading, setLoading] = React.useState(false);

  const handleResponse = async (accept: boolean) => {
    setLoading(true);
    try {
      await respondToMembershipInvitation(membershipId, accept);
      toast.success(
        accept
          ? "ตอบรับเข้าร่วมกลุ่มเรียบร้อยแล้ว"
          : "ปฏิเสธคำเชิญเรียบร้อยแล้ว"
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการตอบรับคำเชิญ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-2 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950"
        onClick={() => handleResponse(true)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="mr-1 h-3.5 w-3.5" />
        )}
        ตอบรับ
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:bg-destructive/10 h-8 px-2 text-xs"
        onClick={() => handleResponse(false)}
        disabled={loading}
      >
        <X className="mr-1 h-3.5 w-3.5" />
        ปฏิเสธ
      </Button>
    </div>
  );
}
