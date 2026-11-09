import { describe, it, expect, beforeAll } from "vitest";
import { assertTestDatabase } from "@/lib/db-safety";
import prisma from "@/lib/prisma";
import {
  ProjectType,
  ProjectReviewStatus,
  MemberRole,
  MembershipStatus,
  AdvisorRequestStatus,
} from "@prisma/client";

describe("Phase 2 - Academic Project Registration & Group Workflow Integration Tests", () => {
  let programId: string;
  let termId: string;
  let student1UserId: string;
  let student1ProfileId: string;
  let student2ProfileId: string;
  let facultyProfileId: string;
  let staffUserId: string;

  beforeAll(async () => {
    assertTestDatabase();

    // 1. Setup Academic Program & Term
    const program = await prisma.academicProgram.create({
      data: {
        code: `P2-PROG-${Date.now()}`,
        nameTh: "หลักสูตรวิทยาการคอมพิวเตอร์ (ทดสอบ Phase 2)",
      },
    });
    programId = program.id;

    const year = await prisma.academicYear.create({
      data: {
        yearLabel: `45${Math.floor(Math.random() * 89999 + 10000)}`,
      },
    });

    const term = await prisma.academicTerm.create({
      data: {
        academicYearId: year.id,
        termCode: "1",
        nameTh: "ภาคการศึกษาที่ 1",
      },
    });
    termId = term.id;

    // 2. Setup Student 1 (Project Leader)
    const s1 = await prisma.user.create({
      data: {
        id: `stu1_${Date.now()}`,
        name: "สมเกียรติ หัวหน้ากลุ่ม",
        email: `stu1_${Date.now()}@test.ac.th`,
        role: "STUDENT",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    student1UserId = s1.id;
    const s1Prof = await prisma.studentProfile.create({
      data: {
        userId: s1.id,
        studentCode: `6601${Math.floor(Math.random() * 8999 + 1000)}`,
        academicProgramId: programId,
      },
    });
    student1ProfileId = s1Prof.id;

    // 3. Setup Student 2 (Invited Member)
    const s2 = await prisma.user.create({
      data: {
        id: `stu2_${Date.now()}`,
        name: "สมหญิง สมาชิกร่วมกลุ่ม",
        email: `stu2_${Date.now()}@test.ac.th`,
        role: "STUDENT",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const s2Prof = await prisma.studentProfile.create({
      data: {
        userId: s2.id,
        studentCode: `6602${Math.floor(Math.random() * 8999 + 1000)}`,
        academicProgramId: programId,
      },
    });
    student2ProfileId = s2Prof.id;

    // 4. Setup Faculty Member (Advisor)
    const fac = await prisma.user.create({
      data: {
        id: `fac_${Date.now()}`,
        name: "ดร.วิชาการ สั่งสอน",
        email: `fac_${Date.now()}@test.ac.th`,
        role: "FACULTY",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const facProf = await prisma.facultyProfile.create({
      data: {
        userId: fac.id,
        titleTh: "ดร.",
        department: "ภาควิชาวิทยาการคอมพิวเตอร์",
      },
    });
    facultyProfileId = facProf.id;

    // 5. Setup Academic Staff
    const staff = await prisma.user.create({
      data: {
        id: `staff_${Date.now()}`,
        name: "เจ้าหน้าที่ ทะเบียนวิชาการ",
        email: `staff_${Date.now()}@test.ac.th`,
        role: "ACADEMIC_STAFF",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    staffUserId = staff.id;
  });

  it("creates a draft project with leader membership and activity log atomically", async () => {
    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.academicProject.create({
        data: {
          projectType: ProjectType.PROJECT,
          titleTh: "ระบบทดสอบการจองสอบโครงงานอัตโนมัติ",
          titleEn: "Automated Project Defense Booking System",
          abstractTh: "บทคัดย่อโครงงานทดสอบ...",
          academicProgramId: programId,
          academicTermId: termId,
          createdByUserId: student1UserId,
          reviewStatus: ProjectReviewStatus.DRAFT,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: p.id,
          studentProfileId: student1ProfileId,
          memberRole: MemberRole.LEADER,
          membershipStatus: MembershipStatus.ACCEPTED,
          invitedByUserId: student1UserId,
          respondedAt: new Date(),
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: p.id,
          actorUserId: student1UserId,
          action: "CREATE_PROJECT_DRAFT",
          details: "สร้างฉบับร่างโครงงาน",
        },
      });

      return p;
    });

    expect(project.id).toBeDefined();
    expect(project.reviewStatus).toBe(ProjectReviewStatus.DRAFT);

    const members = await prisma.projectMember.findMany({
      where: { projectId: project.id },
    });
    expect(members).toHaveLength(1);
    expect(members[0].memberRole).toBe(MemberRole.LEADER);
    expect(members[0].membershipStatus).toBe(MembershipStatus.ACCEPTED);

    const activities = await prisma.projectActivity.findMany({
      where: { projectId: project.id },
    });
    expect(activities).toHaveLength(1);
    expect(activities[0].action).toBe("CREATE_PROJECT_DRAFT");
  });

  it("handles peer invitation and duplicate member prevention", async () => {
    // Create new project
    const p = await prisma.academicProject.create({
      data: {
        projectType: ProjectType.PROJECT,
        titleTh: "โครงงานทดสอบการเชิญสมาชิก",
        academicProgramId: programId,
        academicTermId: termId,
        createdByUserId: student1UserId,
      },
    });

    // Add leader
    await prisma.projectMember.create({
      data: {
        projectId: p.id,
        studentProfileId: student1ProfileId,
        memberRole: MemberRole.LEADER,
        membershipStatus: MembershipStatus.ACCEPTED,
        invitedByUserId: student1UserId,
      },
    });

    // Invite peer student 2
    const invitation = await prisma.projectMember.create({
      data: {
        projectId: p.id,
        studentProfileId: student2ProfileId,
        memberRole: MemberRole.MEMBER,
        membershipStatus: MembershipStatus.INVITED,
        invitedByUserId: student1UserId,
      },
    });
    expect(invitation.membershipStatus).toBe(MembershipStatus.INVITED);

    // Enforce unique member constraint per project
    await expect(
      prisma.projectMember.create({
        data: {
          projectId: p.id,
          studentProfileId: student2ProfileId,
          memberRole: MemberRole.MEMBER,
          membershipStatus: MembershipStatus.INVITED,
          invitedByUserId: student1UserId,
        },
      })
    ).rejects.toThrow();

    // Student 2 accepts invitation
    const updated = await prisma.projectMember.update({
      where: { id: invitation.id },
      data: {
        membershipStatus: MembershipStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });
    expect(updated.membershipStatus).toBe(MembershipStatus.ACCEPTED);
  });

  it("handles faculty advisor request and approval lifecycle", async () => {
    const p = await prisma.academicProject.create({
      data: {
        projectType: ProjectType.THESIS,
        titleTh: "วิทยานิพนธ์ทดสอบคำขออาจารย์ที่ปรึกษา",
        academicProgramId: programId,
        academicTermId: termId,
        createdByUserId: student1UserId,
      },
    });

    // Student requests faculty advisor
    const request = await prisma.advisorRequest.create({
      data: {
        projectId: p.id,
        facultyProfileId: facultyProfileId,
        requestedByUserId: student1UserId,
        status: AdvisorRequestStatus.PENDING,
      },
    });
    expect(request.status).toBe(AdvisorRequestStatus.PENDING);

    // Faculty responds with ACCEPTED
    const acceptedRequest = await prisma.advisorRequest.update({
      where: { id: request.id },
      data: {
        status: AdvisorRequestStatus.ACCEPTED,
        respondedAt: new Date(),
        responseReason: "ยินดีรับเป็นอาจารย์ที่ปรึกษาหลักสำหรับงานวิจัยนี้",
      },
    });

    expect(acceptedRequest.status).toBe(AdvisorRequestStatus.ACCEPTED);
    expect(acceptedRequest.responseReason).toContain("ยินดีรับ");

    const verifiedRequests = await prisma.advisorRequest.findMany({
      where: { projectId: p.id, status: AdvisorRequestStatus.ACCEPTED },
    });
    expect(verifiedRequests).toHaveLength(1);
    expect(verifiedRequests[0].facultyProfileId).toBe(facultyProfileId);
  });

  it("executes the full review lifecycle: submit -> revision required -> resubmit -> approve", async () => {
    // 1. Create project with accepted advisor
    const project = await prisma.academicProject.create({
      data: {
        projectType: ProjectType.PROJECT,
        titleTh: "โครงงานพร้อมยื่นขออนุมัติ",
        academicProgramId: programId,
        academicTermId: termId,
        createdByUserId: student1UserId,
        reviewStatus: ProjectReviewStatus.DRAFT,
      },
    });

    await prisma.advisorRequest.create({
      data: {
        projectId: project.id,
        facultyProfileId: facultyProfileId,
        requestedByUserId: student1UserId,
        status: AdvisorRequestStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    // 2. Submit project for academic review
    const submitted = await prisma.academicProject.update({
      where: { id: project.id },
      data: {
        reviewStatus: ProjectReviewStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
    expect(submitted.reviewStatus).toBe(ProjectReviewStatus.SUBMITTED);

    // 3. Staff reviews and requests revision
    const revisionReview = await prisma.$transaction(async (tx) => {
      const rev = await tx.projectReview.create({
        data: {
          projectId: project.id,
          reviewedByUserId: staffUserId,
          decision: ProjectReviewStatus.REVISION_REQUIRED,
          comment: "กรุณาแก้ไขขอบเขตของโครงงานในบทคัดย่อให้ชัดเจนขึ้น",
        },
      });

      await tx.academicProject.update({
        where: { id: project.id },
        data: {
          reviewStatus: ProjectReviewStatus.REVISION_REQUIRED,
        },
      });

      return rev;
    });
    expect(revisionReview.decision).toBe(ProjectReviewStatus.REVISION_REQUIRED);

    // 4. Student modifies and resubmits
    const resubmitted = await prisma.academicProject.update({
      where: { id: project.id },
      data: {
        abstractTh: "บทคัดย่อฉบับแก้ไขปรับปรุงขอบเขตตามคำแนะนำของเจ้าหน้าที่",
        reviewStatus: ProjectReviewStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
    expect(resubmitted.reviewStatus).toBe(ProjectReviewStatus.SUBMITTED);
    expect(resubmitted.abstractTh).toContain("ฉบับแก้ไขปรับปรุง");

    // 5. Staff approves registration
    const finalReview = await prisma.$transaction(async (tx) => {
      const rev = await tx.projectReview.create({
        data: {
          projectId: project.id,
          reviewedByUserId: staffUserId,
          decision: ProjectReviewStatus.APPROVED,
          comment: "ข้อมูลครบถ้วนถูกต้อง อนุมัติการลงทะเบียนโครงงาน",
        },
      });

      await tx.academicProject.update({
        where: { id: project.id },
        data: {
          reviewStatus: ProjectReviewStatus.APPROVED,
          approvedAt: new Date(),
        },
      });

      return rev;
    });

    expect(finalReview.decision).toBe(ProjectReviewStatus.APPROVED);

    const checkProject = await prisma.academicProject.findUnique({
      where: { id: project.id },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    expect(checkProject?.reviewStatus).toBe(ProjectReviewStatus.APPROVED);
    expect(checkProject?.reviews).toHaveLength(2);
    expect(checkProject?.reviews[0].decision).toBe(
      ProjectReviewStatus.APPROVED
    );
    expect(checkProject?.reviews[1].decision).toBe(
      ProjectReviewStatus.REVISION_REQUIRED
    );
  });

  it("verifies transaction rollback on review failure", async () => {
    const p = await prisma.academicProject.create({
      data: {
        projectType: ProjectType.PROJECT,
        titleTh: "โครงงานสำหรับทดสอบ Rollback Transaction",
        academicProgramId: programId,
        academicTermId: termId,
        createdByUserId: student1UserId,
        reviewStatus: ProjectReviewStatus.SUBMITTED,
      },
    });

    await expect(
      prisma.$transaction(async (tx) => {
        // Step 1: Update status
        await tx.academicProject.update({
          where: { id: p.id },
          data: { reviewStatus: ProjectReviewStatus.APPROVED },
        });

        // Step 2: Trigger error
        throw new Error("Simulated transactional error");
      })
    ).rejects.toThrow("Simulated transactional error");

    // Verify project reviewStatus remained SUBMITTED due to rollback
    const pAfter = await prisma.academicProject.findUnique({
      where: { id: p.id },
    });
    expect(pAfter?.reviewStatus).toBe(ProjectReviewStatus.SUBMITTED);
  });
});
