import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

async function seedDevUsers() {
  const usersToSeed = [
    {
      email: "student1@thesisslot.local",
      name: "นายเอกชัย ขยันเรียน (หัวหน้ากลุ่ม)",
      role: "STUDENT" as const,
      studentCode: "66010001",
    },
    {
      email: "student2@thesisslot.local",
      name: "นางสาวสมใจ เรียนดี (สมาชิกกลุ่ม)",
      role: "STUDENT" as const,
      studentCode: "66010002",
    },
    {
      email: "faculty@thesisslot.local",
      name: "ดร.สมบัติ วิชาการ",
      role: "FACULTY" as const,
      titleTh: "ผศ.ดร.",
      department: "ภาควิชาวิทยาการคอมพิวเตอร์",
    },
    {
      email: "staff@thesisslot.local",
      name: "นางสาวสุภาภรณ์ ทะเบียนวิชาการ",
      role: "ACADEMIC_STAFF" as const,
    },
  ];

  for (const item of usersToSeed) {
    const existing = await prisma.user.findUnique({
      where: { email: item.email },
    });

    if (!existing) {
      const created = await auth.api.createUser({
        body: {
          email: item.email,
          password: "password123",
          name: item.name,
          role: "user",
        },
      });

      await prisma.user.update({
        where: { id: created.user.id },
        data: {
          role: item.role,
          isActive: true,
          emailVerified: true,
        },
      });

      if (item.role === "STUDENT") {
        await prisma.studentProfile.upsert({
          where: { userId: created.user.id },
          create: {
            userId: created.user.id,
            studentCode: item.studentCode!,
          },
          update: {},
        });
      }

      if (item.role === "FACULTY") {
        await prisma.facultyProfile.upsert({
          where: { userId: created.user.id },
          create: {
            userId: created.user.id,
            titleTh: item.titleTh,
            department: item.department,
          },
          update: {},
        });
      }

      console.log(`Created user: ${item.email} (${item.role})`);
    } else {
      console.log(`User already exists: ${item.email}`);
    }
  }

  // Also ensure academic year, term, and program exist for dev workspace
  let program = await prisma.academicProgram.findFirst({
    where: { code: "CPE-2565" },
  });
  if (!program) {
    program = await prisma.academicProgram.create({
      data: {
        code: "CPE-2565",
        nameTh: "หลักสูตรวิศวกรรมคอมพิวเตอร์ (ปรับปรุง 2565)",
        degree: "วศ.บ.",
        isActive: true,
      },
    });
    console.log("Created academic program CPE-2565");
  }

  let year = await prisma.academicYear.findUnique({
    where: { yearLabel: "2567" },
  });
  if (!year) {
    year = await prisma.academicYear.create({
      data: {
        yearLabel: "2567",
        isActive: true,
      },
    });
    console.log("Created academic year 2567");
  }

  let term = await prisma.academicTerm.findFirst({
    where: { academicYearId: year.id, termCode: "1" },
  });
  if (!term) {
    term = await prisma.academicTerm.create({
      data: {
        academicYearId: year.id,
        termCode: "1",
        nameTh: "ภาคการศึกษาต้น 2567",
        isActive: true,
      },
    });
    console.log("Created academic term 1/2567");
  }

  // Ensure default examination rooms exist
  const defaultRooms = [
    {
      code: "EN-301",
      nameTh: "ห้องสอบวิทยานิพนธ์ 301",
      building: "อาคารวิศวกรรม 1",
      floor: "3",
      capacity: 12,
      isActive: true,
    },
    {
      code: "EN-302",
      nameTh: "ห้องสอบวิทยานิพนธ์ 302",
      building: "อาคารวิศวกรรม 1",
      floor: "3",
      capacity: 10,
      isActive: true,
    },
  ];

  for (const r of defaultRooms) {
    const existingRoom = await prisma.examinationRoom.findUnique({
      where: { code: r.code },
    });
    if (!existingRoom) {
      await prisma.examinationRoom.create({ data: r });
      console.log(`Created examination room ${r.code}`);
    }
  }

  await prisma.$disconnect();
}

seedDevUsers().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
