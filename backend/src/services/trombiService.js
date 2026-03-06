const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const prisma = require('../config/prisma');
const { getExportDir, generateFilename } = require('../utils/fileHelper');

async function generateTrombi(classId, format) {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      students: { orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] },
    },
  });

  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }

  const exportDir = getExportDir();
  let filePath;
  let exportPath;

  if (format === 'html') {
    const filename = generateFilename(`trombi_${classId}`, '.html');
    filePath = path.join(exportDir, filename);
    await generateHtml(cls, filePath);
    exportPath = `/exports/${filename}`;
  } else if (format === 'pdf') {
    const filename = generateFilename(`trombi_${classId}`, '.pdf');
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
    data: { format, path: exportPath, classId },
  });

  return { filePath, exportPath, cls };
}

function generateHtml(cls, filePath) {
  const studentCards = cls.students.map((s) => {
    const photo = s.photoUrl
      ? `<img src="http://localhost:${process.env.PORT || 3000}${s.photoUrl}" alt="${s.firstName} ${s.lastName}" class="w-full h-full object-cover" />`
      : `<div class="flex items-center justify-center h-full bg-gray-200 text-gray-400 text-4xl font-bold">
          ${s.firstName[0]}${s.lastName[0]}
        </div>`;

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
  }).join('');

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
      Généré le ${new Date().toLocaleDateString('fr-FR')} — Trombinoscope v2
    </footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(filePath, html, 'utf-8');
}

function generatePdf(cls, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Title
    doc.fontSize(22).fillColor('#4338ca').text(`${cls.label} — ${cls.year}`, { align: 'center' });
    doc.fontSize(11).fillColor('#6b7280').text(`${cls.students.length} élève(s)`, { align: 'center' });
    doc.moveDown(1.5);

    const COLS = 4;
    const CARD_W = 120;
    const CARD_H = 90;
    const GAP_X = 10;
    const GAP_Y = 15;
    const START_X = 40;
    let x = START_X;
    let y = doc.y;

    cls.students.forEach((student, i) => {
      // Check page overflow
      if (y + CARD_H > doc.page.height - 60) {
        doc.addPage();
        y = 40;
        x = START_X;
      }

      // Card background
      doc.roundedRect(x, y, CARD_W, CARD_H, 6).fillAndStroke('#f9fafb', '#e5e7eb');

      // Photo placeholder or initial
      if (student.photoUrl) {
        const photoPath = path.join(__dirname, '../../', student.photoUrl.replace('/uploads/', 'uploads/'));
        if (fs.existsSync(photoPath)) {
          doc.image(photoPath, x + 8, y + 8, { width: 40, height: 40 });
        } else {
          drawInitials(doc, student, x + 8, y + 8);
        }
      } else {
        drawInitials(doc, student, x + 8, y + 8);
      }

      // Name
      doc.fontSize(8).fillColor('#1f2937')
        .text(`${student.firstName} ${student.lastName}`, x + 54, y + 12, { width: CARD_W - 58, ellipsis: true });

      // Email
      doc.fontSize(6.5).fillColor('#6b7280')
        .text(student.email, x + 54, y + 28, { width: CARD_W - 58, ellipsis: true });

      // Next column / row
      if ((i + 1) % COLS === 0) {
        x = START_X;
        y += CARD_H + GAP_Y;
      } else {
        x += CARD_W + GAP_X;
      }
    });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function drawInitials(doc, student, x, y) {
  doc.roundedRect(x, y, 40, 40, 20).fill('#c7d2fe');
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
  doc.fontSize(14).fillColor('#4338ca').text(initials, x, y + 11, { width: 40, align: 'center' });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { generateTrombi };
