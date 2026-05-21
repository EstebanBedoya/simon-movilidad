import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';

const mockReflector = {
  getAllAndOverride: jest.fn(),
};

function buildContext(role: string): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return true when no @Roles metadata is set', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = buildContext('user');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should return true when user role matches required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const ctx = buildContext('admin');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when user role does not match required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const ctx = buildContext('user');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should return true when user role matches one of multiple required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin', 'moderator']);
    const ctx = buildContext('moderator');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when none of the required roles match', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin', 'moderator']);
    const ctx = buildContext('user');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
