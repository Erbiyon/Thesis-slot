"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { toggleAcademicYearStatus } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function YearStatusButton({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: boolean;
}) {
  const [loading, setLoading] = React.useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleAcademicYearStatus(id, currentStatus);
      toast.success(
        currentStatus
          ? "ปิดการใช้งานปีการศึกษาแล้ว"
          : "เปิดการใช้งานปีการศึกษาแล้ว"
      );
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 px-2 text-xs"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : currentStatus ? (
        "ปิดใช้งาน"
      ) : (
        "เปิดใช้งาน"
      )}
    </Button>
  );
}
