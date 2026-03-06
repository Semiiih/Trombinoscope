const path = require('path');
const sharp = require('sharp');
const prisma = require('../config/prisma');
const { getUploadDir, deleteFile, generateFilename } = require('../utils/fileHelper');

async function getStudents({ classId, q }) {
  const where = {};

  if (classId) {
    where.classId = parseInt(classId, 10);
  }

  if (q) {
    const search = q.trim();
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.student.findMany({
    where,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: { class: { select: { id: true, label: true, year: true } } },
  });
}

async function getStudentById(id) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: { class: true },
  });
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }
  return student;
}

async function createStudent(data) {
  return prisma.student.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      classId: data.classId,
    },
    include: { class: true },
  });
}

async function updateStudent(id, data) {
  await getStudentById(id);
  return prisma.student.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      classId: data.classId,
    },
    include: { class: true },
  });
}

async function deleteStudent(id) {
  const student = await getStudentById(id);
  if (student.photoUrl) {
    const filePath = path.join(getUploadDir(), path.basename(student.photoUrl));
    deleteFile(filePath);
    const thumbPath = path.join(getUploadDir(), `thumb_${path.basename(student.photoUrl)}`);
    deleteFile(thumbPath);
  }
  return prisma.student.delete({ where: { id } });
}

async function uploadPhoto(id, file) {
  const student = await getStudentById(id);

  // Delete old photo if it exists
  if (student.photoUrl) {
    const oldPath = path.join(getUploadDir(), path.basename(student.photoUrl));
    deleteFile(oldPath);
    const oldThumb = path.join(getUploadDir(), `thumb_${path.basename(student.photoUrl)}`);
    deleteFile(oldThumb);
  }

  const ext = path.extname(file.filename);
  const thumbFilename = generateFilename('thumb', ext);
  const thumbPath = path.join(getUploadDir(), thumbFilename);

  // Generate 300x300 thumbnail
  await sharp(file.path)
    .resize(300, 300, { fit: 'cover', position: 'centre' })
    .toFile(thumbPath);

  const photoUrl = `/uploads/${thumbFilename}`;

  return prisma.student.update({
    where: { id },
    data: { photoUrl },
    include: { class: true },
  });
}

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent, uploadPhoto };
