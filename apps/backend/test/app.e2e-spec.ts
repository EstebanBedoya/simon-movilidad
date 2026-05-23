import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { User } from '../src/auth/user.entity';
import { ConfigModule } from '@nestjs/config';

jest.mock('bcrypt', () => ({
  hash: (_plain: string, _rounds: number) =>
    Promise.resolve('$hashed$password'),
  compare: (plain: string, hashed: string) =>
    Promise.resolve(hashed === '$hashed$password' && plain === 'secret123'),
}));

const mockUserRepo = {
  findOneBy: jest.fn(),
  createQueryBuilder: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('Auth endpoints (e2e)', () => {
  let app: INestApplication<App>;

  const existingUser: Partial<User> = {
    id: 'user-uuid-1',
    email: 'driver@simon.co',
    password_hash: '$hashed$password',
    role: 'user',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AuthModule,
      ],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /auth/register', () => {
    it('registers a new user and returns id, email, role', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({ ...existingUser });
      mockUserRepo.save.mockResolvedValue(existingUser);

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'driver@simon.co', password: 'secret123' })
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        email: 'driver@simon.co',
        role: 'user',
      });
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('returns 400 when email is already registered', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(existingUser);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'driver@simon.co', password: 'secret123' })
        .expect(400);
    });

    it('returns 400 when body is invalid (missing password)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'driver@simon.co' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('returns access_token and user on valid credentials', async () => {
      const qb = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingUser),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'driver@simon.co', password: 'secret123' })
        .expect(200);

      expect(res.body).toMatchObject({
        access_token: expect.any(String),
        expires_in: expect.any(Number),
        user: { email: 'driver@simon.co', role: 'user' },
      });
      // JWT is three base64url segments separated by dots
      expect(res.body.access_token.split('.')).toHaveLength(3);
    });

    it('returns 401 on wrong password', async () => {
      const qb = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingUser),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'driver@simon.co', password: 'wrongpassword' })
        .expect(401);
    });

    it('returns 401 when user does not exist', async () => {
      const qb = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@simon.co', password: 'secret123' })
        .expect(401);
    });
  });
});
