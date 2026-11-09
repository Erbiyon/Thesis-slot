"use server";

import prisma from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CommitteeResponsibility } from "@prisma/client";

const assignCommitteeSchema = z.object({
  projectId: z.string().min(1, "ระบุรหัสโครงงาน"),
  facultyProfileId: z.string().min(1, "เลือกอาจารย์ผู้ได้รับการแต่งตั้ง"),
  responsibility: z.nativeEnum(CommitteeResponsibility).default("COMMITTEE"),
});

/**
 * Assign a faculty member as an examination committee member.
 * Accessible by: ACADEMIC_STAFF, ADMIN
 */
export async function assignCommitteeMember(formData: FormData) {
  const { user } = await requireRole(["ACADEMIC_STAFF", "ADMIN"]);

  const validated = assignCommitteeSchema.parse({
    projectId: formData.get("projectId"),
    facultyProfileId: formData.get("facultyProfileId"),
    responsibility: formData.get("responsibility"),
  });

  // Verify project eligibility (must be APPROVED)
  const project = await prisma.academicProject.findUnique({
    where: { id: validated.projectId },
    include: { committeeMembers: true },
  });

  if (!project) throw new Error("ไม่พบข้อมูลโครงงาน");
  if (project.reviewStatus !== "APPROVED") {
    throw new Error(
      "โครงงานต้องผ่านการอนุมัติการลงทะเบียนก่อนจึงจะสามารถแต่งตั้งกรรมการสอบได้"
    );
  }

  // Prevent duplicate assignment for same faculty
  const existing = await prisma.examinationCommitteeMember.findUnique({
    where: {
      projectId_facultyProfileId: {
        projectId: validated.projectId,
        facultyProfileId: validated.facultyProfileId,
      },
    },
  });

  if (existing) {
    if (
      existing.invitationStatus === "CANCELLED" ||
      existing.invitationStatus === "DECLINED"
    ) {
      // Re-activate with updated responsibility
      const updated = await prisma.examinationCommitteeMember.update({
        where: { id: existing.id },
        data: {
          responsibility: validated.responsibility,
          invitationStatus: "PENDING",
          assignedByUserId: user.id,
          respondedAt: null,
          responseReason: null,
        },
      });
      revalidatePath(`/academic/examination-committees`);
      revalidatePath(`/projects/${validated.projectId}`);
      return updated.id;
    }
    throw new Error(
      "อาจารย์ท่านนี้ได้รับการแต่งตั้งเป็นกรรมการในโครงงานนี้อยู่แล้ว"
    );
  }

  const created = await prisma.examinationCommitteeMember.create({
    data: {
      projectId: validated.projectId,
      facultyProfileId: validated.facultyProfileId,
      responsibility: validated.responsibility,
      assignedByUserId: user.id,
      invitationStatus: "PENDING",
    },
  });

  revalidatePath(`/academic/examination-committees`);
  revalidatePath(`/projects/${validated.projectId}`);
  return created.id;
}

/**
 * Remove/Cancel committee assignment.
 * Accessible by: ACADEMIC_STAFF, ADMIN
 */
export async function removeCommitteeMember(memberId: string) {
  await requireRole(["ACADEMIC_STAFF", "ADMIN"]);

  const member = await prisma.examinationCommitteeMember.findUnique({
    where: { id: memberId },
    include: { project: true },
  });

  if (!member) throw new Error("ไม่พบรายการกรรมการสอบ");

  // Check if active booking exists
  const activeBooking = await prisma.examinationBooking.findFirst({
    where: {
      projectId: member.projectId,
      status: { in: ["PENDING_REVIEW", "CONFIRMED"] },
    },
  });

  if (activeBooking) {
    throw new Error(
      "ไม่สามารถถอดถอนกรรมการได้เนื่องจากโครงงานมีกำหนดการสอบที่กำลังดำเนินการอยู่ กรุณายกเลิกหรือเลื่อนสอบก่อน"
    );
  }

  await prisma.examinationCommitteeMember.update({
    where: { id: memberId },
    data: { invitationStatus: "CANCELLED" },
  });

  revalidatePath(`/academic/examination-committees`);
  revalidatePath(`/projects/${member.projectId}`);
}

/**
 * Faculty responds to committee invitation.
 * Accessible by: FACULTY (must own the profile)
 */
export async function respondToCommitteeInvitation(
  memberId: string,
  accept: boolean,
  reason?: string
) {
  const { user } = await requireAuth();

  const facultyProfile = await prisma.facultyProfile.findUnique({
    where: { userId: user.id },
  });

  if (!facultyProfile) {
    throw new Error(
      "เฉพาะอาจารย์ที่ผูกข้อมูลโปรไฟล์แล้วเท่านั้นที่สามารถตอบรับได้"
    );
  }

  const member = await prisma.examinationCommitteeMember.findUnique({
    where: { id: memberId },
  });

  if (!member) throw new Error("ไม่พบคำเชิญเป็นกรรมการสอบ");
  if (member.facultyProfileId !== facultyProfile.id) {
    throw new Error("คุณไม่มีสิทธิ์ตอบรับคำเชิญที่ส่งถึงอาจารย์ท่านอื่น");
  }

  if (member.invitationStatus !== "PENDING") {
    throw new Error("คำเชิญนี้ได้รับการตอบรับหรือดำเนินการไปแล้ว");
  }

  const updated = await prisma.examinationCommitteeMember.update({
    where: { id: memberId },
    data: {
      invitationStatus: accept ? "ACCEPTED" : "DECLINED",
      respondedAt: new Date(),
      responseReason: reason?.trim() || null,
    },
  });

  revalidatePath("/faculty/committee-invitations");
  revalidatePath("/dashboard");
  return updated.id;
}
