const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const prisma = require("../config/prisma");
const { getExportDir, generateFilename } = require("../utils/fileHelper");
const storage = require("./storageService");

async function generateTrombi(classId, format, userId = null) {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      students: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
    },
  });

  if (!cls) {
    const err = new Error("Class not found");
    err.statusCode = 404;
    throw err;
  }

  const exportDir = getExportDir();
  let filePath;
  let exportPath;

  if (format === "html") {
    const filename = generateFilename(`trombi_${classId}`, ".html");
    filePath = path.join(exportDir, filename);
    await generateHtml(cls, filePath);
    exportPath = `/exports/${filename}`;
  } else if (format === "pdf") {
    const filename = generateFilename(`trombi_${classId}`, ".pdf");
    filePath = path.join(exportDir, filename);
    await generatePdf(cls, filePath);
    exportPath = `/exports/${filename}`;
  } else {
    const err = new Error('Invalid format. Use "html" or "pdf"');
    err.statusCode = 400;
    throw err;
  }

  // Save export record
  await prisma.export.create({
    data: { format, path: exportPath, classId, userId },
  });

  return { filePath, exportPath, cls };
}

async function generateHtml(cls, filePath) {
  const photoMap = new Map();
  await Promise.all(
    cls.students
      .filter((s) => s.photoUrl)
      .map(async (s) => {
        const buf = await storage.getBuffer(s.photoUrl);
        if (buf) photoMap.set(s.id, buf);
      }),
  );

  const studentCards = cls.students
    .map((s) => {
      let photo;
      const buf = photoMap.get(s.id);
      if (buf) {
        const ext = path.extname(s.photoUrl).slice(1).toLowerCase();
        const mime = ext === "jpg" ? "jpeg" : ext;
        const base64 = buf.toString("base64");
        photo = `<img src="data:image/${mime};base64,${base64}" alt="${s.firstName} ${s.lastName}" class="w-full h-full object-cover" />`;
      } else {
        photo = `<div class="flex items-center justify-center h-full bg-gray-200 text-gray-400 text-4xl font-bold">${s.firstName[0]}${s.lastName[0]}</div>`;
      }

      return `
      <div class="bg-white rounded-xl shadow-md overflow-hidden flex flex-col items-center p-4 gap-3">
        <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-300">
          ${photo}
        </div>
        <div class="text-center">
          <p class="font-semibold text-gray-800">${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</p>
          <p class="text-sm text-gray-500">${escapeHtml(s.email)}</p>
        </div>
      </div>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trombinoscope - ${escapeHtml(cls.label)} ${escapeHtml(cls.year)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen py-10 px-6">
  <div class="max-w-5xl mx-auto">
    <div class="text-center mb-10">
      <h1 class="text-4xl font-bold text-indigo-700">${escapeHtml(cls.label)}</h1>
      <p class="text-gray-500 mt-2">Promotion ${escapeHtml(cls.year)}</p>
      <p class="text-sm text-gray-400 mt-1">${cls.students.length} élève(s)</p>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      ${studentCards}
    </div>
    <footer class="text-center mt-12 text-xs text-gray-400">
      Généré le ${new Date().toLocaleDateString("fr-FR")} — Trombinoscope v2
    </footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(filePath, html, "utf-8");
}

async function generatePdf(cls, filePath) {
  const photoMap = new Map();
  await Promise.all(
    cls.students
      .filter((s) => s.photoUrl)
      .map(async (s) => {
        const buf = await storage.getBuffer(s.photoUrl);
        if (buf) photoMap.set(s.id, buf);
      }),
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title
    doc
      .fontSize(22)
      .fillColor("#4338ca")
      .text(`${cls.label} — ${cls.year}`, { align: "center" });
    doc
      .fontSize(11)
      .fillColor("#6b7280")
      .text(`${cls.students.length} élève(s)`, { align: "center" });
    doc.moveDown(1);

    const COLS = 4;
    const MARGIN = 40;
    const GAP_X = 12;
    const GAP_Y = 14;
    const CARD_W = (doc.page.width - MARGIN * 2 - GAP_X * (COLS - 1)) / COLS;
    const PHOTO_D = 60;
    const PAD_TOP = 12;
    const PAD_BOT = 12;
    const NAME_H = 11;
    const EMAIL_H = 9;
    const CARD_H = PAD_TOP + PHOTO_D + 6 + NAME_H + 3 + EMAIL_H + PAD_BOT;

    let x = MARGIN;
    let y = doc.y;

    cls.students.forEach((student, i) => {
      if (y + CARD_H > doc.page.height - MARGIN) {
        doc.addPage();
        y = MARGIN;
        x = MARGIN;
      }

      doc
        .roundedRect(x, y, CARD_W, CARD_H, 8)
        .fillAndStroke("#ffffff", "#e5e7eb");

      const photoX = x + (CARD_W - PHOTO_D) / 2;
      const photoY = y + PAD_TOP;
      const cx = photoX + PHOTO_D / 2;
      const cy = photoY + PHOTO_D / 2;
      const r = PHOTO_D / 2;

      const photoBuf = photoMap.get(student.id);
      if (photoBuf) {
        doc.save();
        doc.circle(cx, cy, r).clip();
        doc.image(photoBuf, photoX, photoY, {
          width: PHOTO_D,
          height: PHOTO_D,
        });
        doc.restore();
        doc.circle(cx, cy, r).lineWidth(1.5).stroke("#a5b4fc");
      } else {
        doc.circle(cx, cy, r).fillAndStroke("#e0e7ff", "#a5b4fc");
        const initials =
          `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
        doc
          .fontSize(16)
          .fillColor("#4338ca")
          .text(initials, photoX, cy - 9, { width: PHOTO_D, align: "center" });
      }

      const textY = photoY + PHOTO_D + 6;
      doc
        .fontSize(8)
        .fillColor("#1f2937")
        .font("Helvetica-Bold")
        .text(`${student.firstName} ${student.lastName}`, x + 4, textY, {
          width: CARD_W - 8,
          align: "center",
          ellipsis: true,
        });
      doc
        .fontSize(6.5)
        .fillColor("#6b7280")
        .font("Helvetica")
        .text(student.email, x + 4, textY + NAME_H + 3, {
          width: CARD_W - 8,
          align: "center",
          ellipsis: true,
        });

      if ((i + 1) % COLS === 0) {
        x = MARGIN;
        y += CARD_H + GAP_Y;
      } else {
        x += CARD_W + GAP_X;
      }
    });

    const footerY = doc.page.height - 30;
    doc
      .fontSize(7)
      .fillColor("#9ca3af")
      .text(
        `Généré le ${new Date().toLocaleDateString("fr-FR")} — Trombinoscope v2`,
        MARGIN,
        footerY,
        {
          width: doc.page.width - MARGIN * 2,
          align: "center",
        },
      );

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { generateTrombi };
