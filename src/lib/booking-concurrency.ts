import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Acquire deterministic scoped locks for a set of resource keys within a Prisma transaction.
 * MySQL row-level lock `SELECT ... FOR UPDATE` is used on `scheduling_lock`.
 *
 * Keys are sorted lexicographically to guarantee deterministic lock acquisition order
 * and prevent deadlocks across concurrent transactions.
 */
export async function acquireSchedulingLocks(
  tx: Prisma.TransactionClient,
  lockKeys: string[]
): Promise<void> {
  if (lockKeys.length === 0) return;

  // Deduplicate and sort deterministically
  const sortedKeys = Array.from(new Set(lockKeys)).sort();

  for (const key of sortedKeys) {
    // 1. Ensure lock record exists (upsert)
    // Note: Upsert in MySQL inside transaction
    await tx.schedulingLock.upsert({
      where: { lockKey: key },
      create: {
        lockKey: key,
        description: `Scoped concurrency lock for ${key}`,
      },
      update: {},
    });

    // 2. Lock the row exclusively with SELECT ... FOR UPDATE
    // Using Prisma raw query for authoritative row lock
    await tx.$queryRaw`SELECT id FROM scheduling_lock WHERE lockKey = ${key} FOR UPDATE`;
  }
}

/**
 * Helper to generate standard lock keys for booking engine
 */
export function getBookingLockKeys(params: {
  roomId: string;
  facultyProfileIds: string[];
  projectId: string;
}): string[] {
  const keys: string[] = [];

  if (params.roomId) {
    keys.push(`room:${params.roomId}`);
  }

  for (const fId of params.facultyProfileIds) {
    if (fId) {
      keys.push(`faculty:${fId}`);
    }
  }

  if (params.projectId) {
    keys.push(`project:${params.projectId}`);
  }

  return keys;
}

/**
 * Execute a booking engine mutation safely with retry on deadlock or transaction serialization failure.
 */
export async function runBookingTransactionWithRetry<T>(
  action: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          return await action(tx);
        },
        {
          timeout: 15000,
          maxWait: 5000,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );
    } catch (err: unknown) {
      attempt++;
      const isDeadlockOrTimeout =
        err instanceof Error &&
        (err.message.includes("Deadlock found") ||
          err.message.includes("Lock wait timeout") ||
          err.message.includes("P2034") || // Prisma transaction conflict
          err.message.includes("1213"));

      if (isDeadlockOrTimeout && attempt < maxRetries) {
        // Exponential backoff jitter
        const backoff =
          Math.floor(Math.random() * 50 * Math.pow(2, attempt)) + 20;
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      throw err;
    }
  }

  throw new Error(
    "ระบบไม่สามารถทำรายการได้เนื่องจากมีความขัดแย้งในการเข้าถึงฐานข้อมูลพร้อมกัน กรุณาลองใหม่อีกครั้ง"
  );
}
