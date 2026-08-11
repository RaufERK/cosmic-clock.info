/**
 * Delete users whose lastSeenAt is older than 2 years (and their cards via cascade).
 *
 * Usage: npm run users:prune-stale
 * Wire into deploy after migrate.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const cutoff = new Date(Date.now() - TWO_YEARS_MS);

  try {
    const result = await prisma.user.deleteMany({
      where: { lastSeenAt: { lt: cutoff } },
    });
    console.log(
      `Pruned ${result.count} user(s) with lastSeenAt before ${cutoff.toISOString()}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
