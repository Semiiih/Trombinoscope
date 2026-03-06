require('./setup');

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Classes API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/classes', () => {
    it('returns list of classes', async () => {
      const mockClasses = [
        { id: 1, label: 'BTS SIO', year: '2024', createdAt: new Date(), _count: { students: 5 } },
      ];
      prisma.class.findMany.mockResolvedValue(mockClasses);

      const res = await request(app).get('/api/classes');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: 1 })]));
    });
  });

  describe('POST /api/classes', () => {
    it('creates a class with valid data', async () => {
      const newClass = { id: 1, label: 'BTS SIO', year: '2024', createdAt: new Date() };
      prisma.class.create.mockResolvedValue(newClass);

      const res = await request(app)
        .post('/api/classes')
        .send({ label: 'BTS SIO', year: '2024' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ label: 'BTS SIO', year: '2024' });
    });

    it('returns 400 when label is missing', async () => {
      const res = await request(app)
        .post('/api/classes')
        .send({ year: '2024' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when year is missing', async () => {
      const res = await request(app)
        .post('/api/classes')
        .send({ label: 'BTS SIO' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/classes/:id', () => {
    it('updates a class', async () => {
      const existing = { id: 1, label: 'BTS SIO', year: '2024', createdAt: new Date(), students: [] };
      const updated = { ...existing, label: 'BTS SIO SLAM' };
      prisma.class.findUnique.mockResolvedValue(existing);
      prisma.class.update.mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/classes/1')
        .send({ label: 'BTS SIO SLAM', year: '2024' });

      expect(res.status).toBe(200);
      expect(res.body.label).toBe('BTS SIO SLAM');
    });

    it('returns 404 when class does not exist', async () => {
      prisma.class.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/classes/999')
        .send({ label: 'X', year: '2024' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/classes/:id', () => {
    it('deletes a class', async () => {
      const existing = { id: 1, label: 'BTS SIO', year: '2024', createdAt: new Date(), students: [] };
      prisma.class.findUnique.mockResolvedValue(existing);
      prisma.class.delete.mockResolvedValue(existing);

      const res = await request(app).delete('/api/classes/1');

      expect(res.status).toBe(204);
    });
  });
});
