import { describe, it, expect, beforeAll } from "vitest";
import { assertTestDatabase } from "@/lib/db-safety";
import prisma from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

describe("Phase 1 - Database Schema & Data Integrity Tests", () => {
  beforeAll(() => {
    assertTestDatabase();
  });

  it("enforces unique program code", async () => {
    const testCode = `TEST-PROG-${Date.now()}`;
    await prisma.academicProgram.create({
      data: {
        code: testCode,
        nameTh: "หลักสูตรทดสอบ",
      },
    });

    await expect(
      prisma.academicProgram.create({
        data: {
          code: testCode,
          nameTh: "หลักสูตรทดสอบซ้ำ",
        },
      })
    ).rejects.toThrow();
  });

  it("enforces unique academic year label", async () => {
    const testYear = `25${Math.floor(Math.random() * 899 + 100)}`;
    await prisma.academicYear.create({
      data: {
        yearLabel: testYear,
      },
    });

    await expect(
      prisma.academicYear.create({
        data: {
          yearLabel: testYear,
        },
      })
    ).rejects.toThrow();
  });

  it("enforces unique term code within an academic year", async () => {
    const year = await prisma.academicYear.create({
      data: {
        yearLabel: `YEAR-${Date.now()}`,
      },
    });

    await prisma.academicTerm.create({
      data: {
        academicYearId: year.id,
        termCode: "1",
        nameTh: "ภาคการศึกษาต้น",
      },
    });

    // Same term code under same year should fail
    await expect(
      prisma.academicTerm.create({
        data: {
          academicYearId: year.id,
          termCode: "1",
          nameTh: "ภาคการศึกษาต้นซ้ำ",
        },
      })
    ).rejects.toThrow();
  });

  it("enforces unique examination room code", async () => {
    const testRoom = `RM-${Date.now()}`;
    await prisma.examinationRoom.create({
      data: {
        code: testRoom,
        nameTh: "ห้องสอบทดสอบ",
        capacity: 40,
      },
    });

    await expect(
      prisma.examinationRoom.create({
        data: {
          code: testRoom,
          nameTh: "ห้องสอบทดสอบซ้ำ",
        },
      })
    ).rejects.toThrow();
  });
});

describe("Phase 1 - Authorization Matrix & Permissions Tests", () => {
  it("verifies ADMIN has all administrative permissions", () => {
    expect(hasPermission("ADMIN", "admin:access")).toBe(true);
    expect(hasPermission("ADMIN", "users:manage")).toBe(true);
    expect(hasPermission("ADMIN", "academic:manage")).toBe(true);
    expect(hasPermission("ADMIN", "academic:view")).toBe(true);
  });

  it("verifies ACADEMIC_STAFF cannot manage users or access admin operations", () => {
    expect(hasPermission("ACADEMIC_STAFF", "admin:access")).toBe(false);
    expect(hasPermission("ACADEMIC_STAFF", "users:manage")).toBe(false);
    expect(hasPermission("ACADEMIC_STAFF", "academic:manage")).toBe(true);
    expect(hasPermission("ACADEMIC_STAFF", "academic:view")).toBe(true);
  });

  it("verifies FACULTY and STUDENT cannot manage academic data or users", () => {
    expect(hasPermission("FACULTY", "admin:access")).toBe(false);
    expect(hasPermission("FACULTY", "academic:manage")).toBe(false);
    expect(hasPermission("FACULTY", "users:manage")).toBe(false);
    expect(hasPermission("FACULTY", "academic:view")).toBe(true);

    expect(hasPermission("STUDENT", "admin:access")).toBe(false);
    expect(hasPermission("STUDENT", "academic:manage")).toBe(false);
    expect(hasPermission("STUDENT", "users:manage")).toBe(false);
    expect(hasPermission("STUDENT", "academic:view")).toBe(true);
  });

  it("rejects invalid or null roles", () => {
    expect(hasPermission(null, "academic:view")).toBe(false);
    expect(hasPermission(undefined, "academic:view")).toBe(false);
    expect(hasPermission("UNKNOWN_ROLE", "academic:view")).toBe(false);
  });
});
