import { describe, it, expect, beforeAll } from "vitest";
import { assertTestDatabase } from "@/lib/db-safety";
import prisma from "@/lib/prisma";
import {
  acquireSchedulingLocks,
  getBookingLockKeys,
  runBookingTransactionWithRetry,
} from "@/lib/booking-concurrency";
import {
  findRoomConflict,
  findFacultyConflict,
  findProjectBookingConflict,
} from "@/lib/booking-conflict";
import {
  ExaminationBookingStatus,
  FacultyAvailabilityType,
} from "@prisma/client";

describe("Phase 4 — Hardened Concurrency & Multi-Resource Conflict Integrity Suite", () => {
  let roomId1: string;
  let roomId2: string;
  let termId: string;
  let programId: string;
  let studentUserId: string;
  let advisorProfileId: string;
  let committeeProfileId: string;

  beforeAll(async () => {
    assertTestDatabase();

    const ts = Date.now();

    // 1. Create two test rooms
    const r1 = await prisma.examinationRoom.create({
      data: {
        code: `R4-A-${ts}`,
        nameTh: "ห้องสอบเฉพาะกิจ 401",
        isActive: true,
      },
    });
    roomId1 = r1.id;

    const r2 = await prisma.examinationRoom.create({
      data: {
        code: `R4-B-${ts}`,
        nameTh: "ห้องสอบเฉพาะกิจ 402",
        isActive: true,
      },
    });
    roomId2 = r2.id;

    // 2. Academic Year & Term
    const year = await prisma.academicYear.create({
      data: { yearLabel: `94${Math.floor(Math.random() * 89999 + 10000)}` },
    });
    const term = await prisma.academicTerm.create({
      data: {
        academicYearId: year.id,
        termCode: "1",
        nameTh: "ภาคการศึกษาทดสอบ Phase 4",
      },
    });
    termId = term.id;

    const prog = await prisma.academicProgram.create({
      data: {
        code: `P4-PROG-${ts}`,
        nameTh: "หลักสูตรความมั่นคงไซเบอร์และระบบคลาวด์",
      },
    });
    programId = prog.id;

    // 3. Setup student
    const student = await prisma.user.create({
      data: {
        id: `stu_p4_${ts}`,
        name: "นักศึกษา ทดสอบระบบจอง",
        email: `stu_p4_${ts}@test.ac.th`,
        role: "STUDENT",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    studentUserId = student.id;

    // 4. Setup Advisor Faculty
    const fAdv = await prisma.user.create({
      data: {
        id: `fac_adv_${ts}`,
        name: "ศ.ดร.ที่ปรึกษา ร่วม",
        email: `fac_adv_${ts}@test.ac.th`,
        role: "FACULTY",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const pAdv = await prisma.facultyProfile.create({
      data: { userId: fAdv.id, department: "วิศวกรรมคอมพิวเตอร์" },
    });
    advisorProfileId = pAdv.id;

    // 5. Setup Committee Faculty
    const fCom = await prisma.user.create({
      data: {
        id: `fac_com_${ts}`,
        name: "รศ.ดร.กรรมการ สหวิทยาการ",
        email: `fac_com_${ts}@test.ac.th`,
        role: "FACULTY",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const pCom = await prisma.facultyProfile.create({
      data: { userId: fCom.id, department: "วิทยาการสารสนเทศ" },
    });
    committeeProfileId = pCom.id;
  });

  // ---------------------------------------------------------------------------
  // Scenario 1: Same faculty, different rooms, overlapping period (30 Iterations)
  // ---------------------------------------------------------------------------
  describe("Scenario 1: Same faculty across different rooms, overlapping period", () => {
    const ITERATIONS = 30;

    it(`handles ${ITERATIONS} races where 2 projects compete for different rooms with the same faculty: exactly 1 succeeds, 1 fails`, async () => {
      let successCount = 0;
      let conflictCount = 0;

      for (let i = 0; i < ITERATIONS; i++) {
        const slotStart = new Date(`2027-02-01T08:00:00.000Z`);
        slotStart.setDate(slotStart.getDate() + i);
        const slotEnd = new Date(slotStart.getTime() + 2 * 60 * 60 * 1000);

        // Project 1 uses Room 1 with advisorProfileId
        const p1 = await prisma.academicProject.create({
          data: {
            academicProgramId: programId,
            academicTermId: termId,
            createdByUserId: studentUserId,
            titleTh: `Faculty Conflict Project 1 #${i}`,
            reviewStatus: "APPROVED",
            advisorRequests: {
              create: {
                facultyProfileId: advisorProfileId,
                requestedByUserId: studentUserId,
                status: "ACCEPTED",
              },
            },
          },
        });

        // Project 2 uses Room 2 with SAME advisorProfileId
        const p2 = await prisma.academicProject.create({
          data: {
            academicProgramId: programId,
            academicTermId: termId,
            createdByUserId: studentUserId,
            titleTh: `Faculty Conflict Project 2 #${i}`,
            reviewStatus: "APPROVED",
            advisorRequests: {
              create: {
                facultyProfileId: advisorProfileId,
                requestedByUserId: studentUserId,
                status: "ACCEPTED",
              },
            },
          },
        });

        const bookProjectSlot = async (
          targetProjectId: string,
          targetRoomId: string
        ) => {
          const lockKeys = getBookingLockKeys({
            roomId: targetRoomId,
            facultyProfileIds: [advisorProfileId],
            projectId: targetProjectId,
          });

          return await runBookingTransactionWithRetry(async (tx) => {
            await acquireSchedulingLocks(tx, lockKeys);

            const roomConflict = await findRoomConflict(tx, {
              roomId: targetRoomId,
              startAt: slotStart,
              endAt: slotEnd,
            });
            if (roomConflict) throw new Error("CONFLICT_ROOM");

            const facultyConflict = await findFacultyConflict(tx, {
              facultyProfileIds: [advisorProfileId],
              startAt: slotStart,
              endAt: slotEnd,
            });
            if (facultyConflict) throw new Error("CONFLICT_FACULTY");

            return await tx.examinationBooking.create({
              data: {
                projectId: targetProjectId,
                examinationRoomId: targetRoomId,
                academicTermId: termId,
                startAt: slotStart,
                endAt: slotEnd,
                status: ExaminationBookingStatus.PENDING_REVIEW,
                requestedByUserId: studentUserId,
              },
            });
          });
        };

        const results = await Promise.allSettled([
          bookProjectSlot(p1.id, roomId1),
          bookProjectSlot(p2.id, roomId2),
        ]);

        const fulfilled = results.filter((r) => r.status === "fulfilled");
        const rejected = results.filter((r) => r.status === "rejected");

        if (fulfilled.length === 1 && rejected.length === 1) {
          successCount++;
          conflictCount++;
        } else {
          throw new Error(
            `Iteration ${i} race failure: ${fulfilled.length} succeeded, ${rejected.length} failed`
          );
        }

        // Invariant verification: Faculty has exactly ONE active booking across all rooms
        const facultyBookings = await prisma.examinationBooking.count({
          where: {
            startAt: slotStart,
            endAt: slotEnd,
            status: { in: ["PENDING_REVIEW", "CONFIRMED"] },
            project: {
              advisorRequests: {
                some: {
                  facultyProfileId: advisorProfileId,
                  status: "ACCEPTED",
                },
              },
            },
          },
        });
        expect(facultyBookings).toBe(1);
      }

      expect(successCount).toBe(ITERATIONS);
      expect(conflictCount).toBe(ITERATIONS);
    }, 60000);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2: Same project with simultaneous duplicate booking requests
  // ---------------------------------------------------------------------------
  describe("Scenario 2: Duplicate booking requests for same project", () => {
    it("permits only 1 active booking per project and rejects simultaneous duplicate requests", async () => {
      const p = await prisma.academicProject.create({
        data: {
          academicProgramId: programId,
          academicTermId: termId,
          createdByUserId: studentUserId,
          titleTh: "Duplicate Booking Prevention Test Project",
          reviewStatus: "APPROVED",
        },
      });

      const slotStart = new Date("2027-03-01T09:00:00.000Z");
      const slotEnd = new Date("2027-03-01T11:00:00.000Z");

      const bookForProject = async (rId: string) => {
        const lockKeys = getBookingLockKeys({
          roomId: rId,
          facultyProfileIds: [],
          projectId: p.id,
        });

        return await runBookingTransactionWithRetry(async (tx) => {
          await acquireSchedulingLocks(tx, lockKeys);

          const projectConflict = await findProjectBookingConflict(tx, {
            projectId: p.id,
          });
          if (projectConflict) {
            throw new Error("PROJECT_ALREADY_HAS_ACTIVE_BOOKING");
          }

          return await tx.examinationBooking.create({
            data: {
              projectId: p.id,
              examinationRoomId: rId,
              academicTermId: termId,
              startAt: slotStart,
              endAt: slotEnd,
              status: ExaminationBookingStatus.PENDING_REVIEW,
              requestedByUserId: studentUserId,
            },
          });
        });
      };

      const results = await Promise.allSettled([
        bookForProject(roomId1),
        bookForProject(roomId2),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      const dbCount = await prisma.examinationBooking.count({
        where: {
          projectId: p.id,
          status: { in: ["PENDING_REVIEW", "CONFIRMED"] },
        },
      });
      expect(dbCount).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 3: Adjacent non-overlapping periods remain allowed
  // ---------------------------------------------------------------------------
  describe("Scenario 3: Adjacent non-overlapping periods in same room", () => {
    it("allows back-to-back adjacent bookings [09:00, 11:00) and [11:00, 13:00) without collision", async () => {
      const pA = await prisma.academicProject.create({
        data: {
          academicProgramId: programId,
          academicTermId: termId,
          createdByUserId: studentUserId,
          titleTh: "Adjacent Booking Project A",
          reviewStatus: "APPROVED",
        },
      });

      const pB = await prisma.academicProject.create({
        data: {
          academicProgramId: programId,
          academicTermId: termId,
          createdByUserId: studentUserId,
          titleTh: "Adjacent Booking Project B",
          reviewStatus: "APPROVED",
        },
      });

      const slot1Start = new Date("2027-03-05T09:00:00.000Z");
      const slot1End = new Date("2027-03-05T11:00:00.000Z");

      const slot2Start = new Date("2027-03-05T11:00:00.000Z");
      const slot2End = new Date("2027-03-05T13:00:00.000Z");

      const b1 = await prisma.examinationBooking.create({
        data: {
          projectId: pA.id,
          examinationRoomId: roomId1,
          academicTermId: termId,
          startAt: slot1Start,
          endAt: slot1End,
          status: ExaminationBookingStatus.CONFIRMED,
          requestedByUserId: studentUserId,
        },
      });

      const b2 = await prisma.examinationBooking.create({
        data: {
          projectId: pB.id,
          examinationRoomId: roomId1,
          academicTermId: termId,
          startAt: slot2Start,
          endAt: slot2End,
          status: ExaminationBookingStatus.CONFIRMED,
          requestedByUserId: studentUserId,
        },
      });

      expect(b1.id).toBeDefined();
      expect(b2.id).toBeDefined();

      const conflictCheck = await findRoomConflict(prisma, {
        roomId: roomId1,
        startAt: slot2Start,
        endAt: slot2End,
        excludeBookingId: b2.id,
      });
      expect(conflictCheck).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 4: Cancellation competing with another incoming booking
  // ---------------------------------------------------------------------------
  describe("Scenario 4: Cancellation and new booking race", () => {
    it("releases room hold when cancelled, allowing subsequent bookings immediately", async () => {
      const p = await prisma.academicProject.create({
        data: {
          academicProgramId: programId,
          academicTermId: termId,
          createdByUserId: studentUserId,
          titleTh: "Cancellation Race Test",
          reviewStatus: "APPROVED",
        },
      });

      const start = new Date("2027-03-10T13:30:00.000Z");
      const end = new Date("2027-03-10T15:30:00.000Z");

      const b = await prisma.examinationBooking.create({
        data: {
          projectId: p.id,
          examinationRoomId: roomId1,
          academicTermId: termId,
          startAt: start,
          endAt: end,
          status: ExaminationBookingStatus.PENDING_REVIEW,
          requestedByUserId: studentUserId,
        },
      });

      // While active, room has conflict
      const beforeCancelConflict = await findRoomConflict(prisma, {
        roomId: roomId1,
        startAt: start,
        endAt: end,
      });
      expect(beforeCancelConflict).not.toBeNull();

      // Cancel booking
      await prisma.examinationBooking.update({
        where: { id: b.id },
        data: {
          status: ExaminationBookingStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      // Now room is immediately available
      const afterCancelConflict = await findRoomConflict(prisma, {
        roomId: roomId1,
        startAt: start,
        endAt: end,
      });
      expect(afterCancelConflict).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 5: Faculty dynamic unavailability blocking candidate slots
  // ---------------------------------------------------------------------------
  describe("Scenario 5: Faculty dynamic unavailability and conflict detection", () => {
    it("detects unavailable faculty windows created at runtime and prevents booking", async () => {
      const unavailStart = new Date("2027-03-15T09:00:00.000Z");
      const unavailEnd = new Date("2027-03-15T12:00:00.000Z");

      await prisma.facultyAvailability.create({
        data: {
          facultyProfileId: committeeProfileId,
          startAt: unavailStart,
          endAt: unavailEnd,
          availabilityType: FacultyAvailabilityType.UNAVAILABLE,
          note: "นำเสนองานวิจัยต่างประเทศ",
        },
      });

      const conflict = await findFacultyConflict(prisma, {
        facultyProfileIds: [committeeProfileId],
        startAt: new Date("2027-03-15T10:00:00.000Z"),
        endAt: new Date("2027-03-15T11:00:00.000Z"),
      });

      expect(conflict).not.toBeNull();
      expect(conflict?.reason).toContain("นำเสนองานวิจัยต่างประเทศ");
    });
  });
});
