require('./setup');

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

const mockStudent = {
  id: 1,
  firstName: 'Alice',
  lastName: 'Dupont',
  email: 'alice@example.com',
  photoUrl: null,
  classId: 1,
  createdAt: new Date(),
  class: { id: 1, label: 'BTS SIO', year: '2024' },
};

describe('Students API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/students', () => {
    it('returns list of students', async () => {
      prisma.student.findMany.mockResolvedValue([mockStudent]);

      const res = await request(app).get('/api/students');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('filters by class_id', async () => {
      prisma.student.findMany.mockResolvedValue([mockStudent]);

      const res = await request(app).get('/api/students?class_id=1');

      expect(res.status).toBe(200);
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ classId: 1 }) })
      );
    });
  });

  describe('POST /api/students', () => {
    it('creates a student with valid data', async () => {
      prisma.student.create.mockResolvedValue(mockStudent);

      const res = await request(app)
        .post('/api/students')
        .send({ firstName: 'Alice', lastName: 'Dupont', email: 'alice@example.com', classId: 1 });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('alice@example.com');
    });

    it('returns 400 with invalid email', async () => {
      const res = await request(app)
        .post('/api/students')
        .send({ firstName: 'Alice', lastName: 'Dupont', email: 'not-an-email', classId: 1 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when firstName is missing', async () => {
      const res = await request(app)
        .post('/api/students')
        .send({ lastName: 'Dupont', email: 'alice@example.com', classId: 1 });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/students/:id', () => {
    it('updates a student', async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent);
      prisma.student.update.mockResolvedValue({ ...mockStudent, firstName: 'Bob' });

      const res = await request(app)
        .put('/api/students/1')
        .send({ firstName: 'Bob', lastName: 'Dupont', email: 'alice@example.com', classId: 1 });

      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe('Bob');
    });
  });

  describe('DELETE /api/students/:id', () => {
    it('deletes a student', async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent);
      prisma.student.delete.mockResolvedValue(mockStudent);

      const res = await request(app).delete('/api/students/1');

      expect(res.status).toBe(204);
    });
  });
});
