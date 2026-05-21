import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { JwtService } from './jwt.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockUserRepository = () => ({
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockJwtService = {
  sign: jest.fn(() => 'mock.access.token'),
  getExpiresIn: jest.fn(() => 3600),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: ReturnType<typeof mockUserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create and return a user when email is not taken', async () => {
      usersRepo.findOneBy.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      const newUser: Partial<User> = {
        id: 'uuid-1',
        email: 'new@test.com',
        role: 'user',
      };
      usersRepo.create.mockReturnValue(newUser);
      usersRepo.save.mockResolvedValue(newUser);

      const result = await service.register({
        email: 'new@test.com',
        password: 'secret',
      });

      expect(result).toEqual({
        id: 'uuid-1',
        email: 'new@test.com',
        role: 'user',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
    });

    it('should throw BadRequestException when email is already registered', async () => {
      usersRepo.findOneBy.mockResolvedValue({
        id: 'existing',
        email: 'taken@test.com',
      });

      await expect(
        service.register({ email: 'taken@test.com', password: 'secret' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use user role by default when role is not provided', async () => {
      usersRepo.findOneBy.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      const newUser: Partial<User> = {
        id: 'uuid-2',
        email: 'user@test.com',
        role: 'user',
      };
      usersRepo.create.mockReturnValue(newUser);
      usersRepo.save.mockResolvedValue(newUser);

      const result = await service.register({
        email: 'user@test.com',
        password: 'pass123',
      });
      expect(result.role).toBe('user');
    });

    it('should respect the role when provided', async () => {
      usersRepo.findOneBy.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      const newAdmin: Partial<User> = {
        id: 'uuid-3',
        email: 'admin@test.com',
        role: 'admin',
      };
      usersRepo.create.mockReturnValue(newAdmin);
      usersRepo.save.mockResolvedValue(newAdmin);

      const result = await service.register({
        email: 'admin@test.com',
        password: 'pass123',
        role: 'admin',
      });
      expect(result.role).toBe('admin');
    });
  });

  describe('login', () => {
    const mockUser: Partial<User> & { password_hash: string } = {
      id: 'uuid-1',
      email: 'user@test.com',
      password_hash: 'hashed_pw',
      role: 'user',
    };

    const buildQB = () => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(mockUser),
    });

    it('should return access_token and user on valid credentials', async () => {
      usersRepo.createQueryBuilder.mockReturnValue(buildQB());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'user@test.com',
        password: 'correct',
      });

      expect(result).toMatchObject({
        access_token: 'mock.access.token',
        expires_in: 3600,
        user: { id: 'uuid-1', email: 'user@test.com', role: 'user' },
      });
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      usersRepo.createQueryBuilder.mockReturnValue(buildQB());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const qb = buildQB();
      qb.getOne.mockResolvedValue(null);
      usersRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.login({ email: 'notexist@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
