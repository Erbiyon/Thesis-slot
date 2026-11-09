import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import {
  getBangkokDateKey,
  getBangkokMonthGridUtcRange,
  getCalendarBookings,
} from "./calendar-service";
import { ExaminationBookingStatus, ProjectType } from "@prisma/client";

describe("Calendar Service & Bangkok Timezone Tests", () => {
  it("computes Bangkok date keys correctly without off-by-one errors", () => {
    // 2026-12-25 09:00 Bangkok is 2026-12-25 02:00 UTC
    const utcDate = new Date("2026-12-25T02:00:00.000Z");
    expect(getBangkokDateKey(utcDate)).toBe("2026-12-25");

    // 2026-12-25 23:30 Bangkok is 2026-12-25 16:30 UTC
    const nightUtcDate = new Date("2026-12-25T16:30:00.000Z");
    expect(getBangkokDateKey(nightUtcDate)).toBe("2026-12-25");

    // 2026-12-26 00:30 Bangkok is 2026-12-25 17:30 UTC -> Bangkok date is 2026-12-26
    const nextDayUtcDate = new Date("2026-12-25T17:30:00.000Z");
    expect(getBangkokDateKey(nextDayUtcDate)).toBe("2026-12-26");
  });

  it("calculates month grid UTC ranges with Monday start", () => {
    // December 2026: 2026-12-01 is a Tuesday. Monday start is 2026-11-30.
    const { gridStartUtc, gridEndUtc } = getBangkokMonthGridUtcRange(2026, 12);
    expect(gridStartUtc.getTime()).toBeLessThan(gridEndUtc.getTime());

    // Start range should be in late November or 1st Dec
    const startKey = getBangkokDateKey(gridStartUtc);
    expect(startKey).toBe("2026-11-30");

    // End range covers through Sunday Jan 3, 2027
    const endKey = getBangkokDateKey(gridEndUtc);
    expect(endKey).toBe("2027-01-03");
  });

  describe("Role-based Calendar Query & Booking Status Lifecycle", () => {
    let studentUser: { id: string };
    let otherStudentUser: { id: string };
    let facultyUser: { id: string; facultyProfile: { id: string } };
    let otherFacultyUser: { id: string; facultyProfile: { id: string } };
    let staffUser: { id: string };
    let term: { id: string };
    let program: { id: string };
    let room: { id: string };
    let projectA: { id: string };
    let projectB: { id: string };
    let bookingA: { id: string };
    let bookingB: { id: string };

    beforeAll(async () => {
      // Create test users
      studentUser = await prisma.user.create({
        data: {
          id: `cal-test-stu-1-${Date.now()}`,
          name: "Cal Student 1",
          email: `cal-stu1-${Date.now()}@test.ac.th`,
          role: "STUDENT",
        },
      });

      otherStudentUser = await prisma.user.create({
        data: {
          id: `cal-test-stu-2-${Date.now()}`,
          name: "Cal Student 2",
          email: `cal-stu2-${Date.now()}@test.ac.th`,
          role: "STUDENT",
        },
      });

      const fac1 = await prisma.user.create({
        data: {
          id: `cal-test-fac-1-${Date.now()}`,
          name: "Dr. Cal Faculty 1",
          email: `cal-fac1-${Date.now()}@test.ac.th`,
          role: "FACULTY",
          facultyProfile: {
            create: {
              titleTh: "ผศ.ดร.",
              department: "วิศวกรรมคอมพิวเตอร์",
            },
          },
        },
        include: { facultyProfile: true },
      });
      facultyUser = fac1 as { id: string; facultyProfile: { id: string } };

      const fac2 = await prisma.user.create({
        data: {
          id: `cal-test-fac-2-${Date.now()}`,
          name: "Dr. Cal Faculty 2",
          email: `cal-fac2-${Date.now()}@test.ac.th`,
          role: "FACULTY",
          facultyProfile: {
            create: {
              titleTh: "รศ.ดร.",
              department: "วิศวกรรมไฟฟ้า",
            },
          },
        },
        include: { facultyProfile: true },
      });
      otherFacultyUser = fac2 as { id: string; facultyProfile: { id: string } };

      staffUser = await prisma.user.create({
        data: {
          id: `cal-test-staff-${Date.now()}`,
          name: "Cal Staff",
          email: `cal-staff-${Date.now()}@test.ac.th`,
          role: "ACADEMIC_STAFF",
        },
      });

      // Fetch or create master data
      const year =
        (await prisma.academicYear.findFirst()) ||
        (await prisma.academicYear.create({
          data: { yearLabel: `2569-${Date.now()}` },
        }));

      term =
        (await prisma.academicTerm.findFirst()) ||
        (await prisma.academicTerm.create({
          data: {
            academicYearId: year.id,
            termCode: "1",
            nameTh: "ภาคการศึกษาที่ 1",
            startDate: new Date("2026-08-01"),
            endDate: new Date("2026-12-31"),
          },
        }));

      program =
        (await prisma.academicProgram.findFirst()) ||
        (await prisma.academicProgram.create({
          data: {
            code: `CP-CAL-${Date.now()}`,
            nameTh: "วิศวกรรมคอมพิวเตอร์",
            degree: "ปริญญาตรี",
          },
        }));

      room = await prisma.examinationRoom.create({
        data: {
          code: `RM-CAL-${Date.now()}`,
          nameTh: `ห้องสอบทดสอบปฏิทิน ${Date.now()}`,
          building: "อาคารวิจัย",
          capacity: 30,
        },
      });

      // Project A (created by studentUser, advised by facultyUser)
      projectA = await prisma.academicProject.create({
        data: {
          titleTh: "โครงงานทดสอบปฏิทิน A",
          projectType: ProjectType.PROJECT,
          academicProgramId: program.id,
          academicTermId: term.id,
          createdByUserId: studentUser.id,
          reviewStatus: "APPROVED",
          advisorRequests: {
            create: {
              facultyProfile: {
                connect: { id: facultyUser.facultyProfile.id },
              },
              requester: {
                connect: { id: studentUser.id },
              },
              status: "ACCEPTED",
            },
          },
        },
      });

      // Project B (created by otherStudentUser, advised by otherFacultyUser)
      projectB = await prisma.academicProject.create({
        data: {
          titleTh: "โครงงานทดสอบปฏิทิน B",
          projectType: ProjectType.THESIS,
          academicProgramId: program.id,
          academicTermId: term.id,
          createdByUserId: otherStudentUser.id,
          reviewStatus: "APPROVED",
          advisorRequests: {
            create: {
              facultyProfile: {
                connect: { id: otherFacultyUser.facultyProfile.id },
              },
              requester: {
                connect: { id: otherStudentUser.id },
              },
              status: "ACCEPTED",
            },
          },
        },
      });

      // Booking A: PENDING_REVIEW on 2026-12-20
      bookingA = await prisma.examinationBooking.create({
        data: {
          projectId: projectA.id,
          examinationRoomId: room.id,
          academicTermId: term.id,
          startAt: new Date("2026-12-20T09:00:00+07:00"),
          endAt: new Date("2026-12-20T11:00:00+07:00"),
          status: ExaminationBookingStatus.PENDING_REVIEW,
          requestedByUserId: studentUser.id,
        },
      });

      // Booking B: CONFIRMED on 2026-12-22
      bookingB = await prisma.examinationBooking.create({
        data: {
          projectId: projectB.id,
          examinationRoomId: room.id,
          academicTermId: term.id,
          startAt: new Date("2026-12-22T13:00:00+07:00"),
          endAt: new Date("2026-12-22T15:00:00+07:00"),
          status: ExaminationBookingStatus.CONFIRMED,
          requestedByUserId: otherStudentUser.id,
        },
      });
    });

    afterAll(async () => {
      // Clean up test bookings and records
      if (bookingA)
        await prisma.examinationBooking.deleteMany({
          where: { id: bookingA.id },
        });
      if (bookingB)
        await prisma.examinationBooking.deleteMany({
          where: { id: bookingB.id },
        });
      if (projectA) {
        await prisma.advisorRequest.deleteMany({
          where: { projectId: projectA.id },
        });
        await prisma.academicProject.delete({ where: { id: projectA.id } });
      }
      if (projectB) {
        await prisma.advisorRequest.deleteMany({
          where: { projectId: projectB.id },
        });
        await prisma.academicProject.delete({ where: { id: projectB.id } });
      }
      if (room) await prisma.examinationRoom.delete({ where: { id: room.id } });
      if (studentUser)
        await prisma.user.delete({ where: { id: studentUser.id } });
      if (otherStudentUser)
        await prisma.user.delete({ where: { id: otherStudentUser.id } });
      if (facultyUser) {
        await prisma.facultyProfile.deleteMany({
          where: { userId: facultyUser.id },
        });
        await prisma.user.delete({ where: { id: facultyUser.id } });
      }
      if (otherFacultyUser) {
        await prisma.facultyProfile.deleteMany({
          where: { userId: otherFacultyUser.id },
        });
        await prisma.user.delete({ where: { id: otherFacultyUser.id } });
      }
      if (staffUser) await prisma.user.delete({ where: { id: staffUser.id } });
    });

    it("1. Pending booking appears on its intended examination date (not creation date)", async () => {
      const data = await getCalendarBookings(staffUser.id, "ACADEMIC_STAFF", {
        year: 2026,
        month: 12,
      });
      const pendingExam = data.bookings.find((b) => b.id === bookingA.id);
      expect(pendingExam).toBeDefined();
      expect(pendingExam?.dateKey).toBe("2026-12-20");
      expect(pendingExam?.status).toBe("PENDING_REVIEW");
    });

    it("2. Confirmed booking appears on its intended examination date", async () => {
      const data = await getCalendarBookings(staffUser.id, "ACADEMIC_STAFF", {
        year: 2026,
        month: 12,
      });
      const confirmedExam = data.bookings.find((b) => b.id === bookingB.id);
      expect(confirmedExam).toBeDefined();
      expect(confirmedExam?.dateKey).toBe("2026-12-22");
      expect(confirmedExam?.status).toBe("CONFIRMED");
    });

    it("3. Cancelled booking disappears from active schedule query", async () => {
      // Cancel bookingA temporarily
      await prisma.examinationBooking.update({
        where: { id: bookingA.id },
        data: { status: ExaminationBookingStatus.CANCELLED },
      });

      const data = await getCalendarBookings(staffUser.id, "ACADEMIC_STAFF", {
        year: 2026,
        month: 12,
      });
      const found = data.bookings.find((b) => b.id === bookingA.id);
      expect(found).toBeUndefined();

      // Restore to PENDING_REVIEW
      await prisma.examinationBooking.update({
        where: { id: bookingA.id },
        data: { status: ExaminationBookingStatus.PENDING_REVIEW },
      });
    });

    it("4. Rejected booking is not displayed as an active examination", async () => {
      // Reject bookingA temporarily
      await prisma.examinationBooking.update({
        where: { id: bookingA.id },
        data: { status: ExaminationBookingStatus.REJECTED },
      });

      const data = await getCalendarBookings(staffUser.id, "ACADEMIC_STAFF", {
        year: 2026,
        month: 12,
      });
      const found = data.bookings.find((b) => b.id === bookingA.id);
      expect(found).toBeUndefined();

      // Restore to PENDING_REVIEW
      await prisma.examinationBooking.update({
        where: { id: bookingA.id },
        data: { status: ExaminationBookingStatus.PENDING_REVIEW },
      });
    });

    it("5. Rescheduled booking appears on the new date", async () => {
      // Reschedule bookingA to 2026-12-28
      await prisma.examinationBooking.update({
        where: { id: bookingA.id },
        data: {
          startAt: new Date("2026-12-28T10:00:00+07:00"),
          endAt: new Date("2026-12-28T12:00:00+07:00"),
        },
      });

      const data = await getCalendarBookings(staffUser.id, "ACADEMIC_STAFF", {
        year: 2026,
        month: 12,
      });
      const found = data.bookings.find((b) => b.id === bookingA.id);
      expect(found).toBeDefined();
      expect(found?.dateKey).toBe("2026-12-28");

      // Restore original date
      await prisma.examinationBooking.update({
        where: { id: bookingA.id },
        data: {
          startAt: new Date("2026-12-20T09:00:00+07:00"),
          endAt: new Date("2026-12-20T11:00:00+07:00"),
        },
      });
    });

    it("6. Student sees only authorized project bookings", async () => {
      // studentUser should see bookingA, but NOT bookingB
      const stuData = await getCalendarBookings(studentUser.id, "STUDENT", {
        year: 2026,
        month: 12,
      });
      expect(stuData.bookings.some((b) => b.id === bookingA.id)).toBe(true);
      expect(stuData.bookings.some((b) => b.id === bookingB.id)).toBe(false);
    });

    it("7. Faculty sees only relevant examinations they advise or examine", async () => {
      // facultyUser advises projectA, should see bookingA, but NOT bookingB
      const facData = await getCalendarBookings(facultyUser.id, "FACULTY", {
        year: 2026,
        month: 12,
      });
      expect(facData.bookings.some((b) => b.id === bookingA.id)).toBe(true);
      expect(facData.bookings.some((b) => b.id === bookingB.id)).toBe(false);
    });

    it("8. Academic staff sees all institutional bookings", async () => {
      // staffUser should see both bookingA and bookingB
      const staffData = await getCalendarBookings(
        staffUser.id,
        "ACADEMIC_STAFF",
        {
          year: 2026,
          month: 12,
        }
      );
      expect(staffData.bookings.some((b) => b.id === bookingA.id)).toBe(true);
      expect(staffData.bookings.some((b) => b.id === bookingB.id)).toBe(true);
    });
  });
});
