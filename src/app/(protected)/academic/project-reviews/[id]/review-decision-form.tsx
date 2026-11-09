"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { reviewProjectRegistration } from "@/app/(protected)/projects/actions";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, XCircle, Loader2 } from "lucide-react";

export function ReviewDecisionForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [comment, setComment] = React.useState("");

  const handleDecision = async (
    decision: "APPROVED" | "REVISION_REQUIRED" | "REJECTED"
  ) => {
    if (decision === "REVISION_REQUIRED" && !comment.trim()) {
      toast.error("กรุณาระบุข้อคิดเห็นหรือข้อแก้ไขเพื่อให้นักศึกษาปรับปรุง");
      return;
    }

    setLoading(true);
    try {
      await reviewProjectRegistration(
        projectId,
        decision,
        comment.trim() || undefined
      );
      toast.success(
        decision === "APPROVED"
          ? "อนุมัติการลงทะเบียนโครงงานเรียบร้อยแล้ว"
          : decision === "REVISION_REQUIRED"
            ? "ส่งกลับเพื่อให้นักศึกษาแก้ไขเรียบร้อยแล้ว"
            : "ปฏิเสธคำขอลงทะเบียนโครงงานแล้ว"
      );
      router.push("/academic/project-reviews");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกผล";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reviewComment">
          ข้อคิดเห็น / ข้อแนะนำจากเจ้าหน้าที่วิชาการ
        </Label>
        <textarea
          id="reviewComment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="ระบุข้อแนะนำ หรือสิ่งที่นักศึกษาต้องแก้ไขเพิ่มเติม..."
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
          disabled={loading}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => handleDecision("REJECTED")}
          disabled={loading}
        >
          <XCircle className="mr-1.5 h-4 w-4" />
          ปฏิเสธคำขอ
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/50"
          onClick={() => handleDecision("REVISION_REQUIRED")}
          disabled={loading}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          ส่งกลับเพื่อแก้ไข
        </Button>
        <Button
          type="button"
          className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => handleDecision("APPROVED")}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          อนุมัติการลงทะเบียน
        </Button>
      </div>
    </div>
  );
}
