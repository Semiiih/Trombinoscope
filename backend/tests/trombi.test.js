require('./setup');

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

const mockClass = {
  id: 1,
  label: 'BTS SIO',
  year: '2024',
  createdAt: new Date(),
  students: [
    { id: 1, firstName: 'Alice', lastName: 'Dupont', email: 'alice@test.com', photoUrl: null, classId: 1 },
    { id: 2, firstName: 'Bob', lastName: 'Martin', email: 'bob@test.com', photoUrl: null, classId: 1 },
  ],
};

describe('Trombi Generation API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('generates HTML trombinoscope', async () => {
    prisma.class.findUnique.mockResolvedValue(mockClass);
    prisma.export.create.mockResolvedValue({});

    const res = await request(app).get('/api/trombi?class_id=1&format=html');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });

  it('generates PDF trombinoscope', async () => {
    prisma.class.findUnique.mockResolvedValue(mockClass);
    prisma.export.create.mockResolvedValue({});

    const res = await request(app).get('/api/trombi?class_id=1&format=pdf');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
  });

  it('returns 400 when format is invalid', async () => {
    const res = await request(app).get('/api/trombi?class_id=1&format=docx');

    expect(res.status).toBe(400);
  });

  it('returns 400 when class_id is missing', async () => {
    const res = await request(app).get('/api/trombi?format=html');

    expect(res.status).toBe(400);
  });

  it('returns 404 when class does not exist', async () => {
    prisma.class.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/trombi?class_id=999&format=html');

    expect(res.status).toBe(404);
  });
});
