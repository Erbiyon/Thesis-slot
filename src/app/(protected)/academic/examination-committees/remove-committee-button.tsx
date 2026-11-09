"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { removeCommitteeMember } from "./actions";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export function RemoveCommitteeButton({ memberId }: { memberId: string }) {
  const [loading, setLoading] = React.useState(false);

  const handleRemove = async () => {
    if (!confirm("คุณต้องการถอดถอนกรรมการท่านนี้ออกจากโครงงานใช่หรือไม่?")) {
      return;
    }

    setLoading(true);
    try {
      await removeCommitteeMember(memberId);
      toast.success("ถอดถอนกรรมการเรียบร้อยแล้ว");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการถอดถอน";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemove}
      disabled={loading}
      className="text-destructive hover:bg-destructive/10 h-8 px-2 text-xs"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">ถอดถอน</span>
    </Button>
  );
}
