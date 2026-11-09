import { describe, it, expect, beforeAll } from "vitest";
import { assertTestDatabase } from "@/lib/db-safety";
import { prisma } from "@/lib/prisma";

describe("Database Integration - Test Isolation Safety", () => {
  beforeAll(() => {
    // Enforce safety guard before any database query runs
    assertTestDatabase();
  });

  it("verifies safety guard blocks forbidden database URLs", () => {
    expect(() => {
      const original = process.env.DATABASE_URL;
      try {
        process.env.DATABASE_URL =
          "mysql://user:pass@127.0.0.1:3306/thesis_slot_dev";
        assertTestDatabase();
      } finally {
        process.env.DATABASE_URL = original;
      }
    }).toThrow("[DatabaseSafetyError]");
  });

  it("connects to Docker MySQL and targets thesis_slot_test", async () => {
    const result = await prisma.$queryRaw<
      Array<{ result: number; db: string }>
    >`
      SELECT 1 as result, DATABASE() as db
    `;

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(Number(result[0].result)).toBe(1);
    expect(result[0].db).toBe("thesis_slot_test");
  });
});
