"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guards";
import { assertProjectAccess } from "@/lib/project-guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ProjectType } from "@prisma/client";

const projectSchema = z.object({
  projectType: z.enum(["PROJECT", "THESIS"]).default("PROJECT"),
  titleTh: z
    .string()
    .min(5, "ชื่อโครงงานภาษาไทยต้องมีอย่างน้อย 5 ตัวอักษร")
    .max(500),
  titleEn: z.string().max(500).optional(),
  abstractTh: z.string().optional(),
  academicProgramId: z.string().min(1, "กรุณาเลือกหลักสูตรการศึกษา"),
  academicTermId: z.string().min(1, "กรุณาเลือกภาคการศึกษา"),
});

export async function createProjectDraft(formData: FormData) {
  const { user, role } = await requireAuth();

  if (role !== "STUDENT" && role !== "ADMIN") {
    throw new Error(
      "เฉพาะนักศึกษาหรือผู้ดูแลระบบเท่านั้นที่สามารถสร้างโครงงานได้"
    );
  }

  const validated = projectSchema.parse({
    projectType: formData.get("projectType") as ProjectType,
    titleTh: formData.get("titleTh"),
    titleEn: (formData.get("titleEn") as string) || undefined,
    abstractTh: (formData.get("abstractTh") as string) || undefined,
    academicProgramId: formData.get("academicProgramId"),
    academicTermId: formData.get("academicTermId"),
  });

  // Fetch student profile for the current user (if student)
  let studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!studentProfile && role === "STUDENT") {
    // Auto-create basic student profile if studentCode provided or generated temporary
    studentProfile = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        studentCode: `STU-${Date.now().toString().slice(-6)}`,
        academicProgramId: validated.academicProgramId,
      },
    });
  }

  // Atomic creation of project and initial leader membership via Prisma Transaction
  const newProject = await prisma.$transaction(async (tx) => {
    const project = await tx.academicProject.create({
      data: {
        projectType: validated.projectType,
        titleTh: validated.titleTh,
        titleEn: validated.titleEn,
        abstractTh: validated.abstractTh,
        academicProgramId: validated.academicProgramId,
        academicTermId: validated.academicTermId,
        createdByUserId: user.id,
        reviewStatus: "DRAFT",
      },
    });

    if (studentProfile) {
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          studentProfileId: studentProfile.id,
          memberRole: "LEADER",
          membershipStatus: "ACCEPTED",
          invitedByUserId: user.id,
          respondedAt: new Date(),
        },
      });
    }

    await tx.projectActivity.create({
      data: {
        projectId: project.id,
        actorUserId: user.id,
        action: "CREATE_PROJECT_DRAFT",
        details: `สร้างฉบับร่างโครงงาน: ${validated.titleTh}`,
      },
    });

    return project;
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return newProject.id;
}

export async function updateProjectDraft(
  projectId: string,
  formData: FormData
) {
  const { user, project } = await assertProjectAccess(projectId, true);

  if (
    project.reviewStatus !== "DRAFT" &&
    project.reviewStatus !== "REVISION_REQUIRED"
  ) {
    throw new Error(
      "ไม่สามารถแก้ไขข้อมูลได้เนื่องจากโครงงานไม่อยู่ในสถานะฉบับร่างหรือส่งกลับเพื่อแก้ไข"
    );
  }

  const validated = projectSchema.parse({
    projectType: formData.get("projectType") as ProjectType,
    titleTh: formData.get("titleTh"),
    titleEn: (formData.get("titleEn") as string) || undefined,
    abstractTh: (formData.get("abstractTh") as string) || undefined,
    academicProgramId: formData.get("academicProgramId"),
    academicTermId: formData.get("academicTermId"),
  });

  await prisma.$transaction(async (tx) => {
    await tx.academicProject.update({
      where: { id: projectId },
      data: {
        projectType: validated.projectType,
        titleTh: validated.titleTh,
        titleEn: validated.titleEn,
        abstractTh: validated.abstractTh,
        academicProgramId: validated.academicProgramId,
        academicTermId: validated.academicTermId,
      },
    });

    await tx.projectActivity.create({
      data: {
        projectId,
        actorUserId: user.id,
        action: "UPDATE_PROJECT_DRAFT",
        details: `ปรับปรุงข้อมูลโครงงาน`,
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

export async function submitProjectRegistration(projectId: string) {
  const { user, project } = await assertProjectAccess(projectId, true);

  if (
    project.reviewStatus !== "DRAFT" &&
    project.reviewStatus !== "REVISION_REQUIRED"
  ) {
    throw new Error(
      "โครงงานต้องอยู่ในสถานะฉบับร่าง หรือต้องแก้ไข จึงจะยื่นคำขอลงทะเบียนได้"
    );
  }

  // Validation: Must have at least 1 advisor request accepted or pending
  const hasAdvisor = project.advisorRequests.some(
    (r) => r.status === "ACCEPTED" || r.status === "PENDING"
  );

  if (!hasAdvisor) {
    throw new Error("กรุณายื่นคำขออาจารย์ที่ปรึกษาก่อนส่งคำขอลงทะเบียนโครงงาน");
  }

  await prisma.$transaction(async (tx) => {
    await tx.academicProject.update({
      where: { id: projectId },
      data: {
        reviewStatus: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    await tx.projectActivity.create({
      data: {
        projectId,
        actorUserId: user.id,
        action: "SUBMIT_REGISTRATION",
        details: "ยื่นคำขอลงทะเบียนโครงงานเพื่อรอเจ้าหน้าที่วิชาการตรวจสอบ",
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/academic/project-reviews");
  revalidatePath("/dashboard");
}

export async function inviteStudentMember(
  projectId: string,
  studentCode: string
) {
  const { user, project } = await assertProjectAccess(projectId, true);

  if (
    project.reviewStatus !== "DRAFT" &&
    project.reviewStatus !== "REVISION_REQUIRED"
  ) {
    throw new Error(
      "สามารถเชิญสมาชิกได้เฉพาะตอนที่โครงงานอยู่ในสถานะฉบับร่างหรือส่งกลับเพื่อแก้ไขเท่านั้น"
    );
  }

  const targetStudent = await prisma.studentProfile.findUnique({
    where: { studentCode },
    include: { user: true },
  });

  if (!targetStudent) {
    throw new Error(`ไม่พบนักศึกษารหัส "${studentCode}" ในระบบ`);
  }

  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_studentProfileId: {
        projectId,
        studentProfileId: targetStudent.id,
      },
    },
  });

  if (existingMember) {
    throw new Error(
      "นักศึกษาท่านนี้เป็นสมาชิกหรือได้รับคำเชิญในโครงงานนี้แล้ว"
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectMember.create({
      data: {
        projectId,
        studentProfileId: targetStudent.id,
        memberRole: "MEMBER",
        membershipStatus: "INVITED",
        invitedByUserId: user.id,
      },
    });

    await tx.projectActivity.create({
      data: {
        projectId,
        actorUserId: user.id,
        action: "INVITE_MEMBER",
        details: `เชิญ ${targetStudent.user.name} (${studentCode}) เข้าร่วมกลุ่ม`,
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/members`);
}

export async function respondToMembershipInvitation(
  membershipId: string,
  accept: boolean
) {
  const { user } = await requireAuth();

  const membership = await prisma.projectMember.findUnique({
    where: { id: membershipId },
    include: {
      studentProfile: true,
      project: true,
    },
  });

  if (!membership) {
    throw new Error("ไม่พบข้อมูลคำเชิญ");
  }

  if (membership.studentProfile.userId !== user.id) {
    throw new Error("คุณไม่มีสิทธิ์ตอบรับคำเชิญนี้");
  }

  if (membership.membershipStatus !== "INVITED") {
    throw new Error("คำเชิญนี้ได้รับการตอบรับหรือยกเลิกไปแล้ว");
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectMember.update({
      where: { id: membershipId },
      data: {
        membershipStatus: accept ? "ACCEPTED" : "DECLINED",
        respondedAt: new Date(),
      },
    });

    await tx.projectActivity.create({
      data: {
        projectId: membership.projectId,
        actorUserId: user.id,
        action: accept ? "ACCEPT_MEMBERSHIP" : "DECLINE_MEMBERSHIP",
        details: `${accept ? "ตอบรับ" : "ปฏิเสธ"}คำเชิญเข้าร่วมกลุ่มโครงงาน`,
      },
    });
  });

  revalidatePath(`/projects/${membership.projectId}`);
  revalidatePath("/dashboard");
}

export async function requestAdvisor(
  projectId: string,
  facultyProfileId: string
) {
  const { user, project } = await assertProjectAccess(projectId, true);

  if (
    project.reviewStatus !== "DRAFT" &&
    project.reviewStatus !== "REVISION_REQUIRED"
  ) {
    throw new Error(
      "สามารถขออาจารย์ที่ปรึกษาได้เฉพาะตอนที่โครงงานอยู่ในสถานะฉบับร่างหรือส่งกลับเพื่อแก้ไข"
    );
  }

  const faculty = await prisma.facultyProfile.findUnique({
    where: { id: facultyProfileId },
    include: { user: true },
  });

  if (!faculty) {
    throw new Error("ไม่พบข้อมูลอาจารย์ที่เลือก");
  }

  // Check if there is already an accepted or pending advisor request
  const existingPending = await prisma.advisorRequest.findFirst({
    where: {
      projectId,
      facultyProfileId,
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });

  if (existingPending) {
    throw new Error(
      "อาจารย์ท่านนี้มีคำขอหรือเป็นที่ปรึกษาของโครงงานนี้อยู่แล้ว"
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.advisorRequest.create({
      data: {
        projectId,
        facultyProfileId,
        requestedByUserId: user.id,
        status: "PENDING",
      },
    });

    await tx.projectActivity.create({
      data: {
        projectId,
        actorUserId: user.id,
        action: "REQUEST_ADVISOR",
        details: `ยื่นคำขอให้อาจารย์ ${faculty.titleTh || ""}${faculty.user.name} เป็นที่ปรึกษา`,
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/faculty/advisor-requests");
  revalidatePath("/dashboard");
}

export async function respondToAdvisorRequest(
  requestId: string,
  accept: boolean,
  responseReason?: string
) {
  const { user, role } = await requireAuth();

  if (role !== "FACULTY" && role !== "ADMIN") {
    throw new Error("เฉพาะอาจารย์ที่ปรึกษาเท่านั้นที่สามารถตอบรับคำขอนี้ได้");
  }

  const facultyProfile = await prisma.facultyProfile.findUnique({
    where: { userId: user.id },
  });

  const request = await prisma.advisorRequest.findUnique({
    where: { id: requestId },
    include: { project: true, facultyProfile: true },
  });

  if (!request) {
    throw new Error("ไม่พบคำขออาจารย์ที่ปรึกษา");
  }

  if (role !== "ADMIN" && request.facultyProfileId !== facultyProfile?.id) {
    throw new Error("คุณไม่มีสิทธิ์ตอบรับคำขอของอาจารย์ท่านอื่น");
  }

  if (request.status !== "PENDING") {
    throw new Error("คำขอนี้ได้รับการตอบรับหรือดำเนินการไปแล้ว");
  }

  await prisma.$transaction(async (tx) => {
    await tx.advisorRequest.update({
      where: { id: requestId },
      data: {
        status: accept ? "ACCEPTED" : "DECLINED",
        responseReason: responseReason || null,
        respondedAt: new Date(),
      },
    });

    await tx.projectActivity.create({
      data: {
        projectId: request.projectId,
        actorUserId: user.id,
        action: accept ? "ACCEPT_ADVISOR_REQUEST" : "DECLINE_ADVISOR_REQUEST",
        details: `อาจารย์ ${accept ? "ตอบรับ" : "ปฏิเสธ"} เป็นที่ปรึกษาโครงงาน ${responseReason ? `(เหตุผล: ${responseReason})` : ""}`,
      },
    });
  });

  revalidatePath(`/projects/${request.projectId}`);
  revalidatePath("/faculty/advisor-requests");
  revalidatePath("/dashboard");
}

export async function reviewProjectRegistration(
  projectId: string,
  decision: "APPROVED" | "REVISION_REQUIRED" | "REJECTED",
  comment?: string
) {
  const { user, role } = await requireAuth();

  if (role !== "ACADEMIC_STAFF" && role !== "ADMIN") {
    throw new Error(
      "เฉพาะเจ้าหน้าที่วิชาการหรือผู้ดูแลระบบเท่านั้นที่สามารถพิจารณาคำขอลงทะเบียนได้"
    );
  }

  const project = await prisma.academicProject.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("ไม่พบโครงงานที่ต้องการพิจารณา");
  }

  if (project.reviewStatus !== "SUBMITTED") {
    throw new Error(
      "สามารถพิจารณาได้เฉพาะโครงงานที่ยื่นคำขอลงทะเบียนแล้วเท่านั้น"
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.academicProject.update({
      where: { id: projectId },
      data: {
        reviewStatus: decision,
        approvedAt: decision === "APPROVED" ? new Date() : null,
      },
    });

    await tx.projectReview.create({
      data: {
        projectId,
        reviewedByUserId: user.id,
        decision,
        comment: comment || null,
      },
    });

    await tx.projectActivity.create({
      data: {
        projectId,
        actorUserId: user.id,
        action: `REVIEW_${decision}`,
        details: `เจ้าหน้าที่วิชาการได้ ${decision === "APPROVED" ? "อนุมัติ" : decision === "REVISION_REQUIRED" ? "ส่งกลับเพื่อแก้ไข" : "ปฏิเสธ"} ${comment ? `(ความเห็น: ${comment})` : ""}`,
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/academic/project-reviews");
  revalidatePath("/dashboard");
}
