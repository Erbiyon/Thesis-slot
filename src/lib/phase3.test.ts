import { describe, it, expect, beforeAll } from "vitest";
import { assertTestDatabase } from "@/lib/db-safety";
import prisma from "@/lib/prisma";
import {
  acquireSchedulingLocks,
  getBookingLockKeys,
  runBookingTransactionWithRetry,
} from "@/lib/booking-concurrency";
import {
  validateBookingInterval,
  findRoomConflict,
  findFacultyConflict,
  findProjectBookingConflict,
} from "@/lib/booking-conflict";
import { getAvailableExaminationSlots } from "@/lib/slot-calculator";
import {
  ExaminationBookingStatus,
  BookingHistoryAction,
  CommitteeResponsibility,
  CommitteeInvitationStatus,
  FacultyAvailabilityType,
} from "@prisma/client";

describe("Phase 3 - Examination Committee, Availability & Concurrency-Safe Booking Engine", () => {
  let roomId: string;
  let termId: string;
  let programId: string;
  let leaderUserId: string;
  let studentProfileId: string;
  let faculty1ProfileId: string;
  let faculty2ProfileId: string;
  let staffUserId: string;
  let approvedProjectId: string;

  beforeAll(async () => {
    assertTestDatabase();

    // 1. Setup Room
    const room = await prisma.examinationRoom.create({
      data: {
        code: `R-TEST-${Date.now()}`,
        nameTh: "ห้องสอบอัจฉริยะ 301",
        building: "อาคารวิศวกรรม 1",
        floor: "3",
        capacity: 10,
        isActive: true,
      },
    });
    roomId = room.id;

    // 2. Setup Year & Term
    const yearLabel = `35${Math.floor(Math.random() * 89999 + 10000)}`;
    const year = await prisma.academicYear.create({
      data: { yearLabel },
    });
    const term = await prisma.academicTerm.create({
      data: {
        academicYearId: year.id,
        termCode: "1",
        nameTh: "ภาคการศึกษาที่ 1",
      },
    });
    termId = term.id;

    const program = await prisma.academicProgram.create({
      data: {
        code: `P3-PROG-${Date.now()}`,
        nameTh: "หลักสูตรเทคโนโลยีปัญญาประดิษฐ์",
      },
    });
    programId = program.id;

    // 3. Setup Users & Profiles
    const ts = Date.now();
    const leader = await prisma.user.create({
      data: {
        id: `leader_${ts}`,
        name: "สมคิด นักศึกษาผู้จองสอบ",
        email: `leader_${ts}@test.ac.th`,
        role: "STUDENT",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    leaderUserId = leader.id;
    const stuProfile = await prisma.studentProfile.create({
      data: {
        userId: leader.id,
        studentCode: `6501${Math.floor(Math.random() * 8999 + 1000)}`,
        academicProgramId: programId,
      },
    });
    studentProfileId = stuProfile.id;

    const f1 = await prisma.user.create({
      data: {
        id: `fac1_${ts}`,
        name: "ศ.ดร.อาจารย์ ที่ปรึกษา",
        email: `fac1_${ts}@test.ac.th`,
        role: "FACULTY",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const fp1 = await prisma.facultyProfile.create({
      data: {
        userId: f1.id,
        department: "วิศวกรรมคอมพิวเตอร์",
      },
    });
    faculty1ProfileId = fp1.id;

    const f2 = await prisma.user.create({
      data: {
        id: `fac2_${ts}`,
        name: "รศ.ดร.กรรมการ ผู้ทรงคุณวุฒิ",
        email: `fac2_${ts}@test.ac.th`,
        role: "FACULTY",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const fp2 = await prisma.facultyProfile.create({
      data: {
        userId: f2.id,
        department: "เทคโนโลยีสารสนเทศ",
      },
    });
    faculty2ProfileId = fp2.id;

    const staff = await prisma.user.create({
      data: {
        id: `staff_${ts}`,
        name: "เจ้าหน้าที่ งานบริการการศึกษา",
        email: `staff_${ts}@test.ac.th`,
        role: "ACADEMIC_STAFF",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    staffUserId = staff.id;

    // 4. Setup Approved Project
    const project = await prisma.academicProject.create({
      data: {
        academicProgramId: programId,
        academicTermId: termId,
        createdByUserId: leaderUserId,
        titleTh: "ระบบจองสอบวิทยานิพนธ์ระดับสูงแบบป้องกันการจัดซ้ำซ้อน",
        reviewStatus: "APPROVED",
        approvedAt: new Date(),
        members: {
          create: {
            studentProfileId,
            memberRole: "LEADER",
            membershipStatus: "ACCEPTED",
            invitedByUserId: leaderUserId,
          },
        },
        advisorRequests: {
          create: {
            facultyProfileId: faculty1ProfileId,
            requestedByUserId: leaderUserId,
            status: "ACCEPTED",
            respondedAt: new Date(),
          },
        },
      },
    });
    approvedProjectId = project.id;
  });

  describe("1. Committee Assignment and Response Workflow", () => {
    it("should allow staff to assign a committee member", async () => {
      const committee = await prisma.examinationCommitteeMember.create({
        data: {
          projectId: approvedProjectId,
          facultyProfileId: faculty2ProfileId,
          responsibility: CommitteeResponsibility.CHAIR,
          invitationStatus: CommitteeInvitationStatus.PENDING,
          assignedByUserId: staffUserId,
        },
      });

      expect(committee.id).toBeDefined();
      expect(committee.responsibility).toBe("CHAIR");
      expect(committee.invitationStatus).toBe("PENDING");
    });

    it("should allow faculty member to accept committee invitation", async () => {
      const updated = await prisma.examinationCommitteeMember.update({
        where: {
          projectId_facultyProfileId: {
            projectId: approvedProjectId,
            facultyProfileId: faculty2ProfileId,
          },
        },
        data: {
          invitationStatus: CommitteeInvitationStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      });

      expect(updated.invitationStatus).toBe("ACCEPTED");
    });
  });

  describe("2. Faculty Availability & Unavailability Intervals", () => {
    it("should record faculty unavailable window and detect collision", async () => {
      const busyStart = new Date("2026-12-15T09:00:00.000Z");
      const busyEnd = new Date("2026-12-15T12:00:00.000Z");

      await prisma.facultyAvailability.create({
        data: {
          facultyProfileId: faculty1ProfileId,
          startAt: busyStart,
          endAt: busyEnd,
          availabilityType: FacultyAvailabilityType.UNAVAILABLE,
          note: "ติดประชุมสภามหาวิทยาลัย",
        },
      });

      // Conflict overlapping check
      const conflict = await findFacultyConflict(prisma, {
        facultyProfileIds: [faculty1ProfileId],
        startAt: new Date("2026-12-15T10:00:00.000Z"),
        endAt: new Date("2026-12-15T11:00:00.000Z"),
      });

      expect(conflict).not.toBeNull();
      expect(conflict?.booking).toBeNull();
      expect(conflict?.reason).toContain("ระบุช่วงเวลาไม่สะดวก");
    });
  });

  describe("3. Candidate Slot Generator Logic", () => {
    it("should return valid 2-hour examination slots avoiding faculty unavailability", async () => {
      // 2026-12-16 is a Wednesday (Workday)
      const dateStr = "2026-12-16";
      const slots = await getAvailableExaminationSlots({
        projectId: approvedProjectId,
        dateStr,
        academicTermId: termId,
      });

      expect(slots.length).toBeGreaterThan(0);
      const testRoomSlot = slots.find((s) =>
        s.roomName.includes("ห้องสอบอัจฉริยะ 301")
      );
      expect(testRoomSlot).toBeDefined();
      expect(testRoomSlot?.available).toBe(true);
    });
  });

  describe("4. End-to-End Booking Request, Approval, Reschedule & Cancellation", () => {
    let bookingId: string;
    const slotStart = new Date("2026-12-20T09:00:00.000Z");
    const slotEnd = new Date("2026-12-20T11:00:00.000Z");

    it("should create booking in PENDING_REVIEW status with history log", async () => {
      validateBookingInterval(slotStart, slotEnd);

      const booking = await prisma.examinationBooking.create({
        data: {
          projectId: approvedProjectId,
          examinationRoomId: roomId,
          academicTermId: termId,
          startAt: slotStart,
          endAt: slotEnd,
          status: ExaminationBookingStatus.PENDING_REVIEW,
          requestedByUserId: leaderUserId,
          histories: {
            create: {
              actorUserId: leaderUserId,
              action: BookingHistoryAction.SUBMIT_REQUEST,
              newStatus: ExaminationBookingStatus.PENDING_REVIEW,
              details: "ยื่นคำขอจองสอบ",
            },
          },
        },
        include: { histories: true },
      });

      bookingId = booking.id;
      expect(booking.status).toBe("PENDING_REVIEW");
      expect(booking.histories.length).toBe(1);

      // Verify provisional hold: room conflict is triggered for pending booking
      const roomConflict = await findRoomConflict(prisma, {
        roomId,
        startAt: slotStart,
        endAt: slotEnd,
      });
      expect(roomConflict).not.toBeNull();
    });

    it("should allow staff to confirm the booking", async () => {
      const updated = await prisma.examinationBooking.update({
        where: { id: bookingId },
        data: {
          status: ExaminationBookingStatus.CONFIRMED,
          reviewedByUserId: staffUserId,
          reviewedAt: new Date(),
          confirmedAt: new Date(),
          histories: {
            create: {
              actorUserId: staffUserId,
              action: BookingHistoryAction.CONFIRM_BOOKING,
              previousStatus: ExaminationBookingStatus.PENDING_REVIEW,
              newStatus: ExaminationBookingStatus.CONFIRMED,
              details: "อนุมัติเรียบร้อย",
            },
          },
        },
      });

      expect(updated.status).toBe("CONFIRMED");
      expect(updated.confirmedAt).not.toBeNull();
    });

    it("should allow rescheduling to a new slot", async () => {
      const newStart = new Date("2026-12-21T13:00:00.000Z");
      const newEnd = new Date("2026-12-21T15:00:00.000Z");

      const rescheduled = await prisma.examinationBooking.update({
        where: { id: bookingId },
        data: {
          startAt: newStart,
          endAt: newEnd,
          status: ExaminationBookingStatus.CONFIRMED,
          histories: {
            create: {
              actorUserId: staffUserId,
              action: BookingHistoryAction.RESCHEDULE_BOOKING,
              previousStatus: ExaminationBookingStatus.CONFIRMED,
              newStatus: ExaminationBookingStatus.CONFIRMED,
              details: "เปลี่ยนเวลาสอบตามคำร้อง",
            },
          },
        },
      });

      expect(rescheduled.startAt).toEqual(newStart);

      // Previous slot should now be completely free
      const oldSlotConflict = await findRoomConflict(prisma, {
        roomId,
        startAt: slotStart,
        endAt: slotEnd,
      });
      expect(oldSlotConflict).toBeNull();
    });

    it("should cancel booking and release all locks/holds", async () => {
      const cancelled = await prisma.examinationBooking.update({
        where: { id: bookingId },
        data: {
          status: ExaminationBookingStatus.CANCELLED,
          cancelledAt: new Date(),
          histories: {
            create: {
              actorUserId: leaderUserId,
              action: BookingHistoryAction.CANCEL_BOOKING,
              previousStatus: ExaminationBookingStatus.CONFIRMED,
              newStatus: ExaminationBookingStatus.CANCELLED,
              details: "ยกเลิกการสอบ",
            },
          },
        },
      });

      expect(cancelled.status).toBe("CANCELLED");

      // Now all intervals for this booking should be free
      const projectConflict = await findProjectBookingConflict(prisma, {
        projectId: approvedProjectId,
      });
      expect(projectConflict).toBeNull();
    });
  });

  describe("5. High-Concurrency Stress Test (30+ Iterations)", () => {
    // 30 independent race conditions:
    // In each iteration, 2 concurrent requests compete simultaneously for the exact same room & time slot.
    // Assert: Exactly 1 succeeds, exactly 1 fails with conflict error, and no overlapping database rows exist.
    const ITERATIONS = 32;

    it(`must handle ${ITERATIONS} concurrent booking races where exactly 1 succeeds and 1 fails per iteration`, async () => {
      let successCount = 0;
      let conflictCount = 0;

      for (let i = 0; i < ITERATIONS; i++) {
        // Unique day for each iteration to avoid cross-iteration collision
        const raceDate = new Date(`2027-01-01T08:00:00.000Z`);
        raceDate.setDate(raceDate.getDate() + i);
        const raceEnd = new Date(raceDate.getTime() + 2 * 60 * 60 * 1000);

        // We create two distinct mock projects for the two competing students
        const [projectA, projectB] = await Promise.all([
          prisma.academicProject.create({
            data: {
              academicProgramId: programId,
              academicTermId: termId,
              createdByUserId: leaderUserId,
              titleTh: `Race Project A #${i}`,
              reviewStatus: "APPROVED",
            },
          }),
          prisma.academicProject.create({
            data: {
              academicProgramId: programId,
              academicTermId: termId,
              createdByUserId: leaderUserId,
              titleTh: `Race Project B #${i}`,
              reviewStatus: "APPROVED",
            },
          }),
        ]);

        const bookSlotAttempt = async (targetProjectId: string) => {
          const lockKeys = getBookingLockKeys({
            roomId,
            facultyProfileIds: [faculty1ProfileId],
            projectId: targetProjectId,
          });

          return await runBookingTransactionWithRetry(async (tx) => {
            // 1. Acquire row lock in sorted deterministic order
            await acquireSchedulingLocks(tx, lockKeys);

            // 2. Room Conflict Check
            const roomConflict = await findRoomConflict(tx, {
              roomId,
              startAt: raceDate,
              endAt: raceEnd,
            });
            if (roomConflict) {
              throw new Error("CONFLICT_ROOM_ALREADY_RESERVED");
            }

            // 3. Faculty Conflict Check
            const facultyConflict = await findFacultyConflict(tx, {
              facultyProfileIds: [faculty1ProfileId],
              startAt: raceDate,
              endAt: raceEnd,
            });
            if (facultyConflict) {
              throw new Error("CONFLICT_FACULTY_BUSY");
            }

            // 4. Create Booking
            return await tx.examinationBooking.create({
              data: {
                projectId: targetProjectId,
                examinationRoomId: roomId,
                academicTermId: termId,
                startAt: raceDate,
                endAt: raceEnd,
                status: ExaminationBookingStatus.PENDING_REVIEW,
                requestedByUserId: leaderUserId,
              },
            });
          });
        };

        // Execute 2 concurrent booking requests simultaneously
        const results = await Promise.allSettled([
          bookSlotAttempt(projectA.id),
          bookSlotAttempt(projectB.id),
        ]);

        const fulfilled = results.filter((r) => r.status === "fulfilled");
        const rejected = results.filter((r) => r.status === "rejected");

        if (fulfilled.length === 1 && rejected.length === 1) {
          successCount++;
          conflictCount++;
        } else {
          // Fail immediately if both succeeded (concurrency leak) or unexpected error
          throw new Error(
            `Race Iteration ${i} failed: ${fulfilled.length} fulfilled, ${rejected.length} rejected`
          );
        }

        // Double check DB state: room must have exactly ONE booking for this slot
        const rowCount = await prisma.examinationBooking.count({
          where: {
            examinationRoomId: roomId,
            startAt: raceDate,
            endAt: raceEnd,
          },
        });
        expect(rowCount).toBe(1);
      }

      expect(successCount).toBe(ITERATIONS);
      expect(conflictCount).toBe(ITERATIONS);
    }, 60000); // 60s timeout for stress testing
  });
});
