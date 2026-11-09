import { requireAuth } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export async function assertProjectAccess(
  projectId: string,
  requireLeader = false
) {
  const authContext = await requireAuth();
  const { user, role } = authContext;

  // Staff and Admin have review/supervisory access
  if (role === "ADMIN" || role === "ACADEMIC_STAFF") {
    const project = await prisma.academicProject.findUnique({
      where: { id: projectId },
      include: {
        academicProgram: true,
        academicTerm: { include: { academicYear: true } },
        creator: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            studentProfile: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        advisorRequests: {
          include: {
            facultyProfile: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { reviewer: { select: { id: true, name: true } } },
        },
      },
    });

    if (!project) notFound();
    return {
      ...authContext,
      project,
      isLeader: project.createdByUserId === user.id,
    };
  }

  // Student Access Check
  if (role === "STUDENT") {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      throw new Error("กรุณากรอกรหัสนักศึกษาในหน้าข้อมูลส่วนตัวก่อนดำเนินการ");
    }

    const project = await prisma.academicProject.findUnique({
      where: { id: projectId },
      include: {
        academicProgram: true,
        academicTerm: { include: { academicYear: true } },
        creator: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            studentProfile: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        advisorRequests: {
          include: {
            facultyProfile: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { reviewer: { select: { id: true, name: true } } },
        },
      },
    });

    if (!project) notFound();

    const isCreator = project.createdByUserId === user.id;
    const isMember = project.members.some(
      (m) =>
        m.studentProfileId === studentProfile.id &&
        (m.membershipStatus === "ACCEPTED" || m.membershipStatus === "INVITED")
    );

    if (!isCreator && !isMember) {
      redirect("/dashboard?error=unauthorized");
    }

    if (requireLeader && !isCreator) {
      throw new Error(
        "เฉพาะหัวหน้ากลุ่ม/ผู้สร้างโครงงานเท่านั้นที่สามารถดำเนินการนี้ได้"
      );
    }

    return {
      ...authContext,
      project,
      studentProfile,
      isLeader: isCreator,
    };
  }

  // Faculty Access Check (Supervised projects)
  if (role === "FACULTY") {
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { userId: user.id },
    });

    const project = await prisma.academicProject.findUnique({
      where: { id: projectId },
      include: {
        academicProgram: true,
        academicTerm: { include: { academicYear: true } },
        creator: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            studentProfile: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        advisorRequests: {
          include: {
            facultyProfile: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { reviewer: { select: { id: true, name: true } } },
        },
      },
    });

    if (!project) notFound();

    const isAdvisor = facultyProfile
      ? project.advisorRequests.some(
          (r) =>
            r.facultyProfileId === facultyProfile.id &&
            (r.status === "ACCEPTED" || r.status === "PENDING")
        )
      : false;

    if (!isAdvisor) {
      redirect("/dashboard?error=unauthorized");
    }

    return {
      ...authContext,
      project,
      facultyProfile,
      isLeader: false,
    };
  }

  redirect("/dashboard?error=unauthorized");
}
