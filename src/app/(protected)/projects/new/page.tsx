import { requireAuth } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import { ProjectForm } from "./project-form";
import { FolderPlus } from "lucide-react";

export default async function NewProjectPage() {
  const { user } = await requireAuth();

  // Fetch academic programs, active terms, and active faculties in parallel
  const [programs, terms, faculties] = await Promise.all([
    prisma.academicProgram.findMany({
      where: { isActive: true },
      orderBy: { nameTh: "asc" },
    }),
    prisma.academicTerm.findMany({
      where: { isActive: true },
      include: { academicYear: true },
      orderBy: [{ academicYear: { yearLabel: "desc" } }, { termCode: "asc" }],
    }),
    prisma.facultyProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <div className="animate-in fade-in-50 max-w-4xl space-y-6 duration-300">
      <div className="border-border border-b pb-4">
        <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
          <FolderPlus className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          ลงทะเบียนหัวข้อโครงงานและวิทยานิพนธ์ใหม่
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          กรอกรายละเอียดหัวข้อโครงงาน สังกัดหลักสูตร
          และเลือกภาคการศึกษาเพื่อบันทึกเป็นฉบับร่าง
        </p>
      </div>

      <ProjectForm
        programs={programs}
        terms={terms}
        faculties={faculties}
        userId={user.id}
      />
    </div>
  );
}
