import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      const dto = { email: 'a@b.com', password: 'pass123' };
      const expected = { id: 'uuid-1', email: 'a@b.com', role: 'user' };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const dto = { email: 'a@b.com', password: 'pass123' };
      const expected = {
        access_token: 'tok',
        expires_in: 3600,
        user: { id: 'uuid-1', email: 'a@b.com', role: 'user' },
      };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('me', () => {
    it('should return the user from the request', () => {
      const req = { user: { sub: 'uuid-1', email: 'a@b.com', role: 'admin' } };
      const result = controller.me(req);
      expect(result).toEqual({ id: 'uuid-1', email: 'a@b.com', role: 'admin' });
    });
  });
});
