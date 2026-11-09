"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { submitProjectRegistration } from "../actions";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

export function ProjectSubmitButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    if (
      !confirm(
        "คุณต้องการส่งคำขอลงทะเบียนโครงงานเพื่อรอเจ้าหน้าที่วิชาการตรวจสอบใช่หรือไม่?"
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await submitProjectRegistration(projectId);
      toast.success("ยื่นคำขอลงทะเบียนโครงงานเรียบร้อยแล้ว");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการยื่นคำขอ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleSubmit}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send className="h-4 w-4" />
      )}
      ส่งคำขอลงทะเบียน
    </Button>
  );
}
