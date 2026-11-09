"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { removeFacultyAvailability } from "./actions";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export function RemoveAvailabilityButton({ id }: { id: string }) {
  const [loading, setLoading] = React.useState(false);

  const handleRemove = async () => {
    setLoading(true);
    try {
      await removeFacultyAvailability(id);
      toast.success("ลบรายการเรียบร้อยแล้ว");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบ";
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
      className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">ลบรายการ</span>
    </Button>
  );
}
