import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '../jwt.service';

const mockJwtService = {
  verify: jest.fn(),
};

function buildContext(authHeader?: string): ExecutionContext {
  const req: Record<string, unknown> = {
    headers: authHeader ? { authorization: authHeader } : {},
    user: undefined,
  };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return true and attach user to request when token is valid', () => {
    const payload = { sub: 'user-1', email: 'a@b.com', role: 'user' };
    mockJwtService.verify.mockReturnValue(payload);
    const ctx = buildContext('Bearer valid.jwt.token');

    const req = ctx.switchToHttp().getRequest<Record<string, unknown>>();

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);

    expect(req['user']).toEqual(payload);
    expect(mockJwtService.verify).toHaveBeenCalledWith('valid.jwt.token');
  });

  it('should throw UnauthorizedException when Authorization header is missing', () => {
    const ctx = buildContext();
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when Authorization header does not start with Bearer', () => {
    const ctx = buildContext('Basic sometoken');
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token verification returns null', () => {
    mockJwtService.verify.mockReturnValue(null);
    const ctx = buildContext('Bearer invalid.token');
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for malformed Bearer format with no token', () => {
    const ctx = buildContext('Bearer ');
    mockJwtService.verify.mockReturnValue(null);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
