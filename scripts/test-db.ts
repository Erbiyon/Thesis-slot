import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log(
    "Testing Prisma connection with DATABASE_URL:",
    process.env.DATABASE_URL ? "CONFIGURED" : "MISSING"
  );
  const result = await prisma.$queryRaw<
    Array<{ result: number; db: string }>
  >`SELECT 1 as result, DATABASE() as db`;
  console.log("QUERY RESULT:", result);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Connection Failed:", err);
  process.exit(1);
});
