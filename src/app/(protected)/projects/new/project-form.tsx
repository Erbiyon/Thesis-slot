"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProjectDraft, updateProjectDraft } from "../actions";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface ProjectFormProps {
  programs: Array<{ id: string; nameTh: string; code: string }>;
  terms: Array<{
    id: string;
    nameTh: string;
    termCode: string;
    academicYear: { yearLabel: string };
  }>;
  faculties?: Array<{
    id: string;
    titleTh?: string | null;
    user: { id: string; name: string; email: string };
  }>;
  project?: {
    id: string;
    projectType: "PROJECT" | "THESIS";
    titleTh: string;
    titleEn?: string | null;
    abstractTh?: string | null;
    academicProgramId: string;
    academicTermId: string;
  };
  userId: string;
}

export function ProjectForm({ programs, terms, project }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const [projectType, setProjectType] = React.useState<"PROJECT" | "THESIS">(
    project?.projectType || "PROJECT"
  );
  const [titleTh, setTitleTh] = React.useState(project?.titleTh || "");
  const [titleEn, setTitleEn] = React.useState(project?.titleEn || "");
  const [abstractTh, setAbstractTh] = React.useState(project?.abstractTh || "");
  const [academicProgramId, setAcademicProgramId] = React.useState(
    project?.academicProgramId || (programs[0]?.id ?? "")
  );
  const [academicTermId, setAcademicTermId] = React.useState(
    project?.academicTermId || (terms[0]?.id ?? "")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleTh || !academicProgramId || !academicTermId) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("projectType", projectType);
      formData.append("titleTh", titleTh);
      formData.append("titleEn", titleEn);
      formData.append("abstractTh", abstractTh);
      formData.append("academicProgramId", academicProgramId);
      formData.append("academicTermId", academicTermId);

      if (project) {
        await updateProjectDraft(project.id, formData);
        toast.success("บันทึกการแก้ไขโครงงานเรียบร้อยแล้ว");
        router.push(`/projects/${project.id}`);
      } else {
        const newProjectId = await createProjectDraft(formData);
        toast.success("บันทึกฉบับร่างโครงงานใหม่สำเร็จ");
        router.push(`/projects/${newProjectId}`);
      }
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            ข้อมูลพื้นฐานของโครงงาน (Project Profile)
          </CardTitle>
          <CardDescription>
            กำหนดประเภท ชื่อเรื่องภาษาไทย/อังกฤษ และสังกัดหลักสูตร
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="projectType">ประเภทโครงงาน</Label>
              <Select
                value={projectType}
                onValueChange={(val) =>
                  setProjectType(val as "PROJECT" | "THESIS")
                }
              >
                <SelectTrigger id="projectType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROJECT">
                    โครงงานพิเศษ (Special Project)
                  </SelectItem>
                  <SelectItem value="THESIS">วิทยานิพนธ์ (Thesis)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicProgramId">หลักสูตร / สาขาวิชา</Label>
              <Select
                value={academicProgramId}
                onValueChange={setAcademicProgramId}
              >
                <SelectTrigger id="academicProgramId">
                  <SelectValue placeholder="เลือกหลักสูตร" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nameTh} ({p.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academicTermId">ปีการศึกษา / ภาคการศึกษา</Label>
            <Select value={academicTermId} onValueChange={setAcademicTermId}>
              <SelectTrigger id="academicTermId">
                <SelectValue placeholder="เลือกภาคการศึกษา" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nameTh} ปีการศึกษา {t.academicYear.yearLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titleTh">
              ชื่อหัวข้อโครงงาน (ภาษาไทย){" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titleTh"
              value={titleTh}
              onChange={(e) => setTitleTh(e.target.value)}
              placeholder="เช่น ระบบจองสอบโครงงานและวิทยานิพนธ์แบบบูรณาการ"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="titleEn">ชื่อหัวข้อโครงงาน (ภาษาอังกฤษ)</Label>
            <Input
              id="titleEn"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Integrated Thesis and Project Defense Scheduling Platform"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="abstractTh">
              บทคัดย่อ / สรุปสาระสำคัญโดยสังเขป
            </Label>
            <textarea
              id="abstractTh"
              rows={4}
              value={abstractTh}
              onChange={(e) => setAbstractTh(e.target.value)}
              placeholder="ระบุวัตถุประสงค์ ขอบเขต และเทคโนโลยีที่ใช้โดยสังเขป..."
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
            />
          </div>
        </CardContent>

        <CardFooter className="border-border flex justify-between border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            ยกเลิก
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {project ? "บันทึกการแก้ไข" : "บันทึกฉบับร่าง"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
