const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const prisma = new PrismaClient();
const AVATARS_DIR = path.join(__dirname, "avatars");
const UPLOADS_DIR = path.join(__dirname, "../uploads");

async function copyAvatar(filename) {
  const src = path.join(AVATARS_DIR, filename);
  if (!fs.existsSync(src)) return null;

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const ext = path.extname(filename);
  const destName = `thumb_seed_${filename.replace(ext, "")}${ext}`;
  const dest = path.join(UPLOADS_DIR, destName);

  await sharp(src)
    .resize(300, 300, { fit: "cover", position: "centre" })
    .jpeg({ quality: 90 })
    .toFile(dest);

  return `/uploads/${destName}`;
}

async function main() {
  console.log("Seeding database...");

  const bts1 = await prisma.class.upsert({
    where: { id: 1 },
    update: {},
    create: { label: "BTS SIO SLAM", year: "2024-2025" },
  });

  const bts2 = await prisma.class.upsert({
    where: { id: 2 },
    update: {},
    create: { label: "BTS SIO SISR", year: "2024-2025" },
  });

  const bach = await prisma.class.upsert({
    where: { id: 3 },
    update: {},
    create: { label: "Bachelor DevOps", year: "2024-2025" },
  });

  console.log(`Classes : ${bts1.label}, ${bts2.label}, ${bach.label}`);

  // avatar = nom du fichier dans prisma/avatars/ (null si pas de photo)
  const allStudents = [
    {
      firstName: "Alice",
      lastName: "Dupont",
      email: "alice.dupont@bts-sio.fr",
      classId: bts1.id,
      avatar: "alice.jpg",
    },
    {
      firstName: "Baptiste",
      lastName: "Martin",
      email: "baptiste.martin@bts-sio.fr",
      classId: bts1.id,
      avatar: "baptiste.jpg",
    },
    {
      firstName: "Camille",
      lastName: "Bernard",
      email: "camille.bernard@bts-sio.fr",
      classId: bts1.id,
      avatar: "camille.jpg",
    },
    {
      firstName: "Dylan",
      lastName: "Leroy",
      email: "dylan.leroy@bts-sio.fr",
      classId: bts1.id,
      avatar: "dylan.jpg",
    },
    {
      firstName: "Emma",
      lastName: "Moreau",
      email: "emma.moreau@bts-sio.fr",
      classId: bts1.id,
      avatar: "emma.jpg",
    },
    {
      firstName: "Florian",
      lastName: "Simon",
      email: "florian.simon@bts-sio.fr",
      classId: bts1.id,
      avatar: "florian.jpg",
    },
    {
      firstName: "Gabriel",
      lastName: "Laurent",
      email: "gabriel.laurent@bts-sio.fr",
      classId: bts2.id,
      avatar: null,
    },
    {
      firstName: "Hugo",
      lastName: "Petit",
      email: "hugo.petit@bts-sio.fr",
      classId: bts2.id,
      avatar: "hugo.jpg",
    },
    {
      firstName: "Ines",
      lastName: "Garcia",
      email: "ines.garcia@bts-sio.fr",
      classId: bts2.id,
      avatar: "ines.jpg",
    },
    {
      firstName: "Julien",
      lastName: "Robert",
      email: "julien.robert@bts-sio.fr",
      classId: bts2.id,
      avatar: "julien.jpg",
    },
    {
      firstName: "Kevin",
      lastName: "Thomas",
      email: "kevin.thomas@bachelor.fr",
      classId: bach.id,
      avatar: null,
    },
    {
      firstName: "Lea",
      lastName: "Richard",
      email: "lea.richard@bachelor.fr",
      classId: bach.id,
      avatar: "lea.jpg",
    },
    {
      firstName: "Mathieu",
      lastName: "Durand",
      email: "mathieu.durand@bachelor.fr",
      classId: bach.id,
      avatar: null,
    },
    {
      firstName: "Noemie",
      lastName: "Lefebvre",
      email: "noemie.lefebvre@bachelor.fr",
      classId: bach.id,
      avatar: "noemie.jpg",
    },
    {
      firstName: "Oscar",
      lastName: "Mercier",
      email: "oscar.mercier@bachelor.fr",
      classId: bach.id,
      avatar: "oscar.jpg",
    },
  ];

  let withPhoto = 0;
  for (const s of allStudents) {
    const photoUrl = s.avatar ? await copyAvatar(s.avatar) : null;
    if (photoUrl) withPhoto++;

    await prisma.student.upsert({
      where: { email: s.email },
      update: { photoUrl },
      create: {
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        classId: s.classId,
        photoUrl,
      },
    });

    console.log(`  ${photoUrl ? "📷" : "  "} ${s.firstName} ${s.lastName}`);
  }

  console.log(`\n${allStudents.length} eleves crees (${withPhoto} avec photo)`);
  console.log("Seed termine !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
