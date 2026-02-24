import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding colleges and programs...");

  const colleges = [
    { code: "CAFE", name: "College of Agriculture, Forestry and Environment" },
    { code: "CAS", name: "College of Arts and Sciences" },
    { code: "COE", name: "College of Education" },
    { code: "CHMT", name: "College of Hotel Management and Tourism" },
    { code: "COTE", name: "College of Technology and Engineering" },
  ];

  const programsByCollege: Record<string, { code: string; name: string }[]> = {
    CAFE: [
      { code: "BSF", name: "Bachelor of Science in Forestry" },
      { code: "BSES", name: "Bachelor of Science in Environmental Science" },
      { code: "BSA", name: "Bachelor of Science in Agriculture" },
    ],
    CAS: [
      { code: "BAEL", name: "Bachelor of Arts in English Language Studies" },
      { code: "BALIT", name: "Bachelor of Arts in Literature" },
      { code: "BSP", name: "Bachelor of Science in Psychology" },
    ],
    COE: [
      { code: "BEED", name: "Bachelor of Elementary Education" },
      {
        code: "BTLED-HE",
        name: "Bachelor of Technology and Livelihood Education Major in Home Economics",
      },
      {
        code: "BSED-ENG",
        name: "Bachelor of Secondary Education Major in English",
      },
      {
        code: "BSED-MATH",
        name: "Bachelor of Secondary Education Major in Mathematics",
      },
    ],
    CHMT: [
      { code: "BSHM", name: "Bachelor of Science in Hotel Management" },
      { code: "BSTM", name: "Bachelor of Science in Tourism Management" },
    ],
    COTE: [
      {
        code: "BSIE",
        name: "Bachelor of Science in Industrial Engineering",
      },
      {
        code: "BSIT",
        name: "Bachelor of Science in Information Technology",
      },
      {
        code: "BIT-AUTO",
        name: "Bachelor of Industrial Technology Major in Automotive Technology",
      },
      {
        code: "BIT-COMP",
        name: "Bachelor of Industrial Technology Major in Computer Technology",
      },
      {
        code: "BIT-DRAFT",
        name: "Bachelor of Industrial Technology Major in Drafting Technology",
      },
      {
        code: "BIT-ELEC",
        name: "Bachelor of Industrial Technology Major in Electronics Technology",
      },
      {
        code: "BIT-GAR",
        name: "Bachelor of Industrial Technology Major in Garments Technology",
      },
    ],
  };

  for (const c of colleges) {
    const college = await prisma.college.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: { code: c.code, name: c.name },
    });
    console.log(`  ✓ College: ${college.code}`);

    const programs = programsByCollege[c.code] ?? [];
    for (const p of programs) {
      await prisma.program.upsert({
        where: {
          collegeId_code: { collegeId: college.id, code: p.code },
        },
        update: { name: p.name, isActive: true },
        create: {
          collegeId: college.id,
          code: p.code,
          name: p.name,
          isActive: true,
        },
      });
      console.log(`    ✓ Program: ${p.code}`);
    }
  }

  console.log("\nSeeding admin user...");
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      firstName: "System",
      lastName: "Administrator",
      role: "admin",
    },
    create: {
      username: "admin",
      email: "admin@ipms.local",
      firstName: "System",
      lastName: "Administrator",
      passwordHash: "changeme", // placeholder — replace with a proper hash
      role: "admin",
    },
  });
  console.log("  ✓ Admin user created (username: admin)\n");

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
