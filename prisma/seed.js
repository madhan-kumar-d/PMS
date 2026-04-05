import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding started...");

  const specializations = [
    { code: "CARD", description: "Cardiology" },
    { code: "GYN", description: "Gynecology" },
    { code: "NEURO", description: "Neurology" },
    { code: "ENT", description: "ENT Specialist" },
  ];

  for (const s of specializations) {
    await prisma.specialization.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }
  console.log("Specializations seeded.");

  const adminEmail = "superadmin@pms.com";
  const hashedPassword = await bcrypt.hash("Test@123", 10);

  await prisma.users.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: "supeAdmin",
      is_active: true,
    },
    create: {
      name: "Super Admin",
      email: adminEmail,
      phone_no: "0000000000",
      password: hashedPassword,
      role: "supeAdmin",
      is_active: true,
    },
  });
  console.log(`Super Admin created: ${adminEmail} / Test@123`);

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
