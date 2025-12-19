// prisma/seed.ts
import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Seeding: Subjects → Classes → Admin → Teachers + Relations (2025-2026)...");

  // === FULL CLEANUP IN CORRECT ORDER (to avoid FK violations) ===
  console.log("Cleaning database...");

  await prisma.classOnTeacher.deleteMany();
  await prisma.subjectOnTeacher.deleteMany();
  await prisma.announcementRecipient.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.inquest.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.scheduleItem.deleteMany();
  await prisma.substitution.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.weeklyPlanItem.deleteMany();
  await prisma.weeklyPlan.deleteMany();
  await prisma.gradeSubject.deleteMany();

  await prisma.user.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.academicYear.deleteMany();

  console.log("Database cleaned successfully.");

  // === ACADEMIC YEAR ===
  const year = await prisma.academicYear.create({
    data: {
      name: "2025-2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
      isCurrent: true,
    },
  });

  // === SUBJECTS ===
  const subjects = [
    "AP Biology", "Arabic", "Biology", "Chemistry", "Economics", "English",
    "French", "ICT", "Internet of Things", "Islamic", "Life Skills", "Math",
    "Physics", "Principles of Business", "Science", "Social Arabic",
    "Social Studies", "World History",
  ];

  for (const name of subjects) {
    await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // === CLASSES ===
  const classNames = [
    "1A", "2A", "3A", "4A", "4B", "4C", "5A", "5B", "5C",
    "6A", "6B", "6C", "6G",
    "7A", "7B", "7C", "7G",
    "8A", "8G",
    "9A", "9B", "9C",
    "10A", "10B",
    "11A", "11B", "11C",
    "12A", "12B",
  ];

  for (const name of classNames) {
    await prisma.class.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // === ADMIN (plain text password) ===
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@example.com",
      name: "Admin User",
      password: "admin123",  // ← Plain text
      role: Role.ADMIN,
    },
  });

  // === TEACHERS (all use same plain text password) ===
  const teacherPlainPassword = "P@55word";  // ← Plain text

  const teachersData = [
    { username: "ae3114399", name: "Ahmed Ismail", classes: ["2A", "3A"], subjects: ["English"], specialty: "English" },
    { username: "ibra.salama2", name: "Ibrahim Salama", classes: ["4A", "4B", "4C"], subjects: ["English"], specialty: "English" },
    { username: "abdelaziz.me3", name: "Abdulaziz Metwally", classes: ["6B", "6C", "6G"], subjects: ["English"], specialty: "English" },
    { username: "ofadlallah75", name: "Omar Fadlalah", classes: ["6A", "8A", "8G"], subjects: ["English"], specialty: "English" },
    { username: "mohhmd122", name: "Mohamed Abdulfattah", classes: ["9A", "9B", "9C"], subjects: ["English"], specialty: "English" },
    { username: "amr.ahmed.hamouda", name: "Amr Hamouda", classes: ["7G", "10A", "10B"], subjects: ["English"], specialty: "English" },
    { username: "momostafa1710", name: "Mohamed Moustafa", classes: ["7A", "7B", "7C"], subjects: ["English"], specialty: "English" },
    { username: "abdallahelsemary7", name: "Abdullah Mostafa", classes: ["11A", "11B", "11C"], subjects: ["English"], specialty: "English" },
    { username: "ssegram1", name: "Saeed Segram", classes: ["11A", "11B", "11C", "12A", "12B"], subjects: ["English", "Principles of Business", "Economics"], specialty: "English" },
    { username: "mahmoudomar87", name: "Mahmoud Omar", classes: ["2A", "3A", "4A", "4B", "4C", "5C"], subjects: ["English", "Social Studies", "Life Skills"], specialty: "English" },
    { username: "mohammed.zaky810", name: "Mohammad Zaky", classes: ["9C", "10A", "10B"], subjects: ["Math"], specialty: "Math" },
    { username: "muhammadshaaban95", name: "Mohamed Shaaban", classes: ["7G", "8A", "8G", "9A", "9B", "9C", "10A", "10B"], subjects: ["Social Studies", "Life Skills", "World History"], specialty: "Social Studies" },
    { username: "ibrahimelhadad704", name: "Ibrahim Elhadad", classes: ["2A", "3A", "4B", "4C"], subjects: ["Math"], specialty: "Math" },
    { username: "moaliarab3", name: "Mohamad Ali", classes: ["4A", "5A", "5B", "5C"], subjects: ["Math"], specialty: "Math" },
    { username: "moelbry", name: "Mohamed Albry", classes: ["6A", "6B", "6C", "6G"], subjects: ["Math"], specialty: "Math" },
    { username: "momo.mo2men", name: "Mohamed Hemdan", classes: ["7A", "7B", "7C", "7G"], subjects: ["Math"], specialty: "Math" },
    { username: "alielkest", name: "Ali Alsaeed", classes: ["8A", "8G", "9A", "9B"], subjects: ["Math"], specialty: "Math" },
    { username: "mohammedsayed.ms1111", name: "Mohamed Thabet", classes: ["11A", "11B", "11C", "12A", "12B"], subjects: ["Math"], specialty: "Math" },
    { username: "mgwad852", name: "Mohamed Yousef", classes: ["2A", "3A", "4A", "4B", "4C"], subjects: ["Science"], specialty: "Science" },
    { username: "ashrafflefl2030", name: "Ashraf Alsayed", classes: ["5A", "5B", "5C", "6A", "6B"], subjects: ["Science"], specialty: "Science" },
    { username: "ebrahim.1631994", name: "Ibrahim Mohamed", classes: ["6C", "6G", "7G", "8G"], subjects: ["Science"], specialty: "Science" },
    { username: "mohamedresha10", name: "Mohammed Ashraf", classes: ["11A", "11B", "11C"], subjects: ["Chemistry"], specialty: "Chemistry" },
    { username: "sherifbedair227", name: "Sherif Alsayed", classes: ["9A", "9B", "9C", "12A", "12B"], subjects: ["Science", "Physics"], specialty: "Science" },
    { username: "z.f.b2012", name: "Zyad Banawas", classes: ["6A", "6B", "6C", "6G"], subjects: ["Islamic"], specialty: "Islamic" },
    { username: "mm4822556", name: "Mohamed Mohsen", classes: ["10A", "10B", "12A", "12B"], subjects: ["Biology", "AP Biology"], specialty: "Biology" },
    { username: "ahmedabady347", name: "Ahmed Darwish", classes: ["1A", "2A", "3A", "4A", "4B", "4C", "5A", "5B", "5C"], subjects: ["ICT"], specialty: "ICT" },
    { username: "ahmed.ashraf.saad9", name: "Ahmed Ashraf", classes: ["6A", "6B", "6C", "6G", "7A", "7B", "7C", "7G", "8A", "8G"], subjects: ["ICT"], specialty: "ICT" },
    { username: "mryossri", name: "Yousry Ahmed", classes: ["9A", "9B", "9C", "10A", "10B", "11A", "11B", "11C", "12A", "12B"], subjects: ["ICT", "Internet of Things"], specialty: "ICT" },
    { username: "khalilataky", name: "Khalil Ataky", classes: ["4A", "4B", "4C", "5A", "5B", "5C", "6A", "6B", "6C", "6G", "7A", "7B", "7C", "7G", "8A", "8G", "9A", "9B", "9C"], subjects: ["French"], specialty: "French" },
    { username: "moh1133ele", name: "Mohamed Alwany", classes: ["1A", "2A", "4A", "4B", "4C"], subjects: ["Islamic", "Arabic"], specialty: "Islamic" },
    { username: "mahmoudhmoawwad", name: "Mahmoud Moawwad", classes: ["2A", "3A"], subjects: ["Islamic", "Arabic"], specialty: "Islamic" },
    { username: "mmjdy4157", name: "Mahmoud Magdy", classes: ["6C", "6G", "7A", "7B", "7C"], subjects: ["Arabic"], specialty: "Arabic" },
    { username: "tareqalsolami39", name: "Tariq Alsalami", classes: ["5A", "5B", "5C", "6A", "6B"], subjects: ["Arabic"], specialty: "Arabic" },
    { username: "mddsir5", name: "Mohammed Almatrafi", classes: ["7G", "8A", "8G", "9A", "9B", "9C"], subjects: ["Arabic"], specialty: "Arabic" },
    { username: "malekelazb8", name: "Mohamed Shehata", classes: ["10A", "10B", "11A", "11B", "11C", "12A", "12B"], subjects: ["Arabic"], specialty: "Arabic" },
    { username: "aymanelgamal9", name: "Ayman Algamal", classes: ["5B", "5C", "7A", "7B"], subjects: ["Islamic"], specialty: "Islamic" },
    { username: "ahmadalolyany", name: "Ahmed Alsulami", classes: ["4A", "4B", "4C", "5A"], subjects: ["Islamic"], specialty: "Islamic" },
    { username: "alazwari.93", name: "Mohamed Alazwari", classes: ["7C", "7G", "8A", "8G"], subjects: ["Islamic"], specialty: "Islamic" },
    { username: "shaddad.atiyah", name: "Shaddad Atiyah", classes: ["9A", "9B", "9C", "10B"], subjects: ["Islamic"], specialty: "Islamic" },
    { username: "m-e-m159", name: "Yousef Alsalami", classes: ["10A", "11A", "11B", "11C", "12A", "12B"], subjects: ["Islamic"], specialty: "Islamic" },
    { username: "m7md.456.ksa", name: "Mohammad Almahmadi", classes: ["4A", "4B", "4C", "5A", "5B", "5C", "6A", "6B", "6C", "6G", "7B", "7C"], subjects: ["Social Arabic"], specialty: "Social Arabic" },
    { username: "sultanalhazmi11", name: "Sultan Alhazmi", classes: ["7A", "7G", "8A", "8G", "9A", "9B", "9C", "10A", "10B", "11A", "11B", "11C", "12A", "12B"], subjects: ["Social Arabic"], specialty: "Social Arabic" },
    { username: "hanyhashem1881", name: "Hany Hashem", classes: ["1A"], subjects: ["Science", "English", "Math", "Social Studies", "Life Skills"], specialty: "Science" },
    { username: "osamakamara", name: "Osama Kamara", classes: ["7A", "7B", "7C", "8A", "9A"], subjects: ["Science"], specialty: "Science" },
    { username: "abdelrahman221317", name: "Abdelrahman Mostafa", classes: ["3A", "4A", "4B", "4C", "6A", "6B", "6C", "6G", "7A", "7B", "7C"], subjects: ["Social Studies", "Life Skills"], specialty: "Social Studies" },
    { username: "m.budran", name: "Mohamed Salah", classes: ["5A", "5B", "5C"], subjects: ["English", "Social Studies", "Life Skills"], specialty: "English" },
  ];

  console.log(`Creating ${teachersData.length} teachers...`);

  for (const t of teachersData) {
    const user = await prisma.user.upsert({
      where: { username: t.username },
      update: {
        name: t.name,
        specialty: t.specialty,
        jobTitle: t.subjects.join(" | "),
        schoolName: "Your School Name",
        password: teacherPlainPassword,  // ← Plain text on update too
      },
      create: {
        username: t.username,
        email: `${t.username}@school.example.com`,
        name: t.name,
        password: teacherPlainPassword,  // ← Plain text
        role: Role.TEACHER,
        specialty: t.specialty,
        jobTitle: t.subjects.join(" | "),
        schoolName: "Your School Name",
      },
    });

    // Connect classes
    for (const className of t.classes) {
      const cls = await prisma.class.findUnique({ where: { name: className } });
      if (cls) {
        await prisma.classOnTeacher.upsert({
          where: { teacherId_classId: { teacherId: user.id, classId: cls.id } },
          update: {},
          create: { teacherId: user.id, classId: cls.id },
        });
      }
    }

    // Connect subjects
    for (const subjectName of t.subjects) {
      const subj = await prisma.subject.findUnique({ where: { name: subjectName } });
      if (subj) {
        await prisma.subjectOnTeacher.upsert({
          where: { teacherId_subjectId: { teacherId: user.id, subjectId: subj.id } },
          update: {},
          create: { teacherId: user.id, subjectId: subj.id },
        });
      }
    }
  }

  // === SAMPLE INQUEST (optional) ===
  const firstTeacher = await prisma.user.findFirst({ where: { role: Role.TEACHER } });
  if (firstTeacher) {
    await prisma.inquest.create({
      data: {
        inquestType: "ABSENT",
        reason: "Sample absent inquest from seed.",
        details: "This is a test inquest created during seeding.",
        academicYearId: year.id,
        createdById: admin.id,
        teacherId: firstTeacher.id,
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log("\nLogin credentials (plain text passwords):");
  console.log("Admin:     username: admin           password: admin123");
  console.log(`Teachers (${teachersData.length}): username = their username, password: P@55word`);
  console.log("Example:   username: ae3114399      password: P@55word");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });