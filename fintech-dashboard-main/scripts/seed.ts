import { PrismaClient } from "@prisma/client";
import seed from "../data/transactions.json";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.transaction.deleteMany();

  for (const t of seed) {
    await prisma.transaction.create({
      data: {
        id: t.id,
        title: t.title,
        amount: t.amount,
        category: t.category,
        type: t.type as "Доход" | "Расход",
        date: t.date,
        userId: null,
      },
    });
  }

  console.log(`✅ Seeded ${seed.length} transactions`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });