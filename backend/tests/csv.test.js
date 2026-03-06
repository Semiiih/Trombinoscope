require('./setup');

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('CSV Import API', () => {
  beforeEach(() => jest.clearAllMocks());

  const validCsv = Buffer.from(
    'first_name,last_name,email,class_label,year\nAlice,Dupont,alice@test.com,BTS SIO,2024\nBob,Martin,bob@test.com,BTS SIO,2024\n'
  );

  const invalidCsv = Buffer.from(
    'first_name,last_name,email,class_label,year\n,Dupont,not-an-email,BTS SIO,2024\n'
  );

  it('imports valid CSV successfully', async () => {
    const mockClass = { id: 1, label: 'BTS SIO', year: '2024' };
    prisma.class.findFirst.mockResolvedValue(mockClass);
    prisma.student.upsert.mockResolvedValue({});

    const res = await request(app)
      .post('/api/students/import')
      .attach('file', validCsv, { filename: 'students.csv', contentType: 'text/csv' });

    expect(res.status).toBe(207);
    expect(res.body).toMatchObject({ created: 2, errors: 0 });
  });

  it('handles rows with validation errors', async () => {
    const res = await request(app)
      .post('/api/students/import')
      .attach('file', invalidCsv, { filename: 'students.csv', contentType: 'text/csv' });

    expect(res.status).toBe(207);
    expect(res.body.errors).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('details');
  });

  it('returns 400 when no file is attached', async () => {
    const res = await request(app).post('/api/students/import');

    expect(res.status).toBe(400);
  });
});
