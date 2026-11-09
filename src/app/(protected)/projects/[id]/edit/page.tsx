import { requireAuth } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/app/(protected)/projects/new/project-form";
import { Edit } from "lucide-react";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireAuth();

  const [project, programs, terms] = await Promise.all([
    prisma.academicProject.findUnique({
      where: { id },
    }),
    prisma.academicProgram.findMany({
      where: { isActive: true },
      orderBy: { nameTh: "asc" },
    }),
    prisma.academicTerm.findMany({
      where: { isActive: true },
      include: { academicYear: true },
      orderBy: [{ academicYear: { yearLabel: "desc" } }, { termCode: "asc" }],
    }),
  ]);

  if (!project) notFound();

  return (
    <div className="animate-in fade-in-50 max-w-4xl space-y-6 duration-300">
      <div className="border-border border-b pb-4">
        <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Edit className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          แก้ไขข้อมูลโครงงาน / วิทยานิพนธ์
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          ปรับปรุงรายละเอียดของโครงงานตามข้อเสนอแนะหรือการแก้ไข
        </p>
      </div>

      <ProjectForm
        project={project}
        programs={programs}
        terms={terms}
        userId={user.id}
      />
    </div>
  );
}
