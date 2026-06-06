import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const TEST_EMAIL = 'todos-e2e@test.local';
const TEST_PASSWORD = 'TestPass123!';

describe('Todos (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let todoId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, displayName: 'E2E Todos' });

    expect(res.status).toBe(201);
    accessToken = res.body.accessToken as string;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await app.close();
  });

  describe('POST /todos', () => {
    it('returns 401 without token', () =>
      request(app.getHttpServer()).post('/todos').send({ title: 'Test' }).expect(401));

    it('returns 400 for missing title', () =>
      request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400));

    it('returns 400 for title exceeding max length', () =>
      request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'x'.repeat(501) })
        .expect(400));

    it('creates a todo and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Buy milk' })
        .expect(201);

      expect(res.body.title).toBe('Buy milk');
      expect(res.body.completed).toBe(false);
      expect(res.body.id).toBeDefined();
      todoId = res.body.id as string;
    });
  });

  describe('GET /todos', () => {
    it('returns 401 without token', () => request(app.getHttpServer()).get('/todos').expect(401));

    it('returns all todos for the current user', async () => {
      const res = await request(app.getHttpServer())
        .get('/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].title).toBe('Buy milk');
    });

    it('filters active todos', async () => {
      const res = await request(app.getHttpServer())
        .get('/todos?status=active')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.every((t: { completed: boolean }) => !t.completed)).toBe(true);
    });

    it('filters completed todos (empty initially)', async () => {
      const res = await request(app.getHttpServer())
        .get('/todos?status=completed')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.every((t: { completed: boolean }) => t.completed)).toBe(true);
    });
  });

  describe('GET /todos/:id', () => {
    it('returns 401 without token', () =>
      request(app.getHttpServer()).get(`/todos/${todoId}`).expect(401));

    it('returns the todo by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(todoId);
      expect(res.body.title).toBe('Buy milk');
    });

    it('returns 404 for non-existent id', () =>
      request(app.getHttpServer())
        .get('/todos/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404));
  });

  describe('PATCH /todos/:id', () => {
    it('returns 401 without token', () =>
      request(app.getHttpServer()).patch(`/todos/${todoId}`).send({ completed: true }).expect(401));

    it('updates completed flag', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ completed: true })
        .expect(200);

      expect(res.body.completed).toBe(true);
    });

    it('updates title', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Buy oat milk' })
        .expect(200);

      expect(res.body.title).toBe('Buy oat milk');
    });

    it('returns 400 for extra unknown fields', () =>
      request(app.getHttpServer())
        .patch(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Valid', hack: 'evil' })
        .expect(400));

    it('returns 404 for non-existent id', () =>
      request(app.getHttpServer())
        .patch('/todos/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ completed: true })
        .expect(404));
  });

  describe('DELETE /todos/:id', () => {
    it('returns 401 without token', () =>
      request(app.getHttpServer()).delete(`/todos/${todoId}`).expect(401));

    it('deletes the todo and returns 204', () =>
      request(app.getHttpServer())
        .delete(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204));

    it('returns 404 after deletion', () =>
      request(app.getHttpServer())
        .get(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404));

    it('returns 404 on re-delete', () =>
      request(app.getHttpServer())
        .delete(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404));
  });
});
