const prisma = require('../config/prisma');

async function getAllClasses() {
  return prisma.class.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { students: true } } },
  });
}

async function getClassById(id) {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: { students: true },
  });
  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }
  return cls;
}

async function createClass(data) {
  return prisma.class.create({ data: { label: data.label, year: data.year } });
}

async function updateClass(id, data) {
  await getClassById(id);
  return prisma.class.update({ where: { id }, data: { label: data.label, year: data.year } });
}

async function deleteClass(id) {
  await getClassById(id);
  return prisma.class.delete({ where: { id } });
}

async function findOrCreateClass(label, year) {
  let cls = await prisma.class.findFirst({ where: { label, year } });
  if (!cls) {
    cls = await prisma.class.create({ data: { label, year } });
  }
  return cls;
}

module.exports = { getAllClasses, getClassById, createClass, updateClass, deleteClass, findOrCreateClass };
