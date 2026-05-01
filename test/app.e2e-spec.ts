import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Subscription API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;

    it('POST /auth/signup — should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          name: 'E2E User',
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.email).toBe(uniqueEmail);
          expect(res.body.user.role).toBe('user');
          accessToken = res.body.access_token;
        });
    });

    it('POST /auth/signup — should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          name: 'E2E User',
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(409);
    });

    it('POST /auth/signup — should reject invalid body', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: 'not-valid' })
        .expect(400);
    });

    it('POST /auth/login — should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail, password: 'password123' })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          accessToken = res.body.access_token;
        });
    });

    it('POST /auth/login — should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail, password: 'wrongpass' })
        .expect(401);
    });
  });

  describe('Plans', () => {
    it('GET /plans — should return 3 plans', () => {
      return request(app.getHttpServer())
        .get('/plans')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(3);
          expect(res.body.map((p) => p.id)).toEqual(
            expect.arrayContaining(['basic', 'standard', 'premium']),
          );
          res.body.forEach((plan) => {
            expect(plan).toHaveProperty('name');
            expect(plan).toHaveProperty('price');
            expect(plan).not.toHaveProperty('stripePriceId');
          });
        });
    });
  });

  describe('Subscriptions', () => {
    it('GET /subscriptions — should require authentication', () => {
      return request(app.getHttpServer())
        .get('/subscriptions')
        .expect(401);
    });

    it('GET /subscriptions — should return 404 when no subscription', () => {
      return request(app.getHttpServer())
        .get('/subscriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('POST /subscriptions/cancel — should return 404 when no subscription', () => {
      return request(app.getHttpServer())
        .post('/subscriptions/cancel')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('POST /subscriptions/checkout — should require authentication', () => {
      return request(app.getHttpServer())
        .post('/subscriptions/checkout')
        .send({ planId: 'basic' })
        .expect(401);
    });

    it('POST /subscriptions/checkout — should reject invalid planId', () => {
      return request(app.getHttpServer())
        .post('/subscriptions/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: 'invalid' })
        .expect(400);
    });

    it('POST /subscriptions/checkout — should create checkout session', () => {
      return request(app.getHttpServer())
        .post('/subscriptions/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: 'basic' })
        .expect(201)
        .expect((res) => {
          expect(res.body.checkoutUrl).toBeDefined();
          expect(res.body.checkoutUrl).toContain('checkout.stripe.com');
        });
    });
  });

});
