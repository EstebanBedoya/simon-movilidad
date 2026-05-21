import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from './jwt.service';

const mockConfigService = {
  getOrThrow: jest.fn((key: string) => {
    if (key === 'JWT_SECRET') return 'test-secret-key-for-jest';
    throw new Error(`Missing config: ${key}`);
  }),
  get: jest.fn((key: string) => {
    if (key === 'JWT_EXPIRES_IN') return '3600';
    return undefined;
  }),
};

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  describe('sign', () => {
    it('should return a JWT with 3 dot-separated parts', () => {
      const token = service.sign({
        sub: 'user-1',
        email: 'a@b.com',
        role: 'user',
      });
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should embed the payload data in the body part', () => {
      const token = service.sign({
        sub: 'user-1',
        email: 'a@b.com',
        role: 'admin',
      });
      const [, body] = token.split('.');
      const decoded = JSON.parse(
        Buffer.from(body, 'base64url').toString(),
      ) as Record<string, unknown>;
      expect(decoded.sub).toBe('user-1');
      expect(decoded.email).toBe('a@b.com');
      expect(decoded.role).toBe('admin');
    });

    it('should include iat and exp in the payload', () => {
      const before = Math.floor(Date.now() / 1000);
      const token = service.sign({ sub: 'user-1' });
      const after = Math.floor(Date.now() / 1000);
      const [, body] = token.split('.');
      const decoded = JSON.parse(Buffer.from(body, 'base64url').toString()) as {
        iat: number;
        exp: number;
      };
      expect(decoded.iat).toBeGreaterThanOrEqual(before);
      expect(decoded.iat).toBeLessThanOrEqual(after);
      expect(decoded.exp).toBe(decoded.iat + 3600);
    });
  });

  describe('verify', () => {
    it('should return the payload for a valid token', () => {
      const token = service.sign({ sub: 'user-1', role: 'user' });
      const payload = service.verify(token);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-1');
      expect(payload?.role).toBe('user');
    });

    it('should return null for a token with an invalid signature', () => {
      const token = service.sign({ sub: 'user-1' });
      const [header, body, sig] = token.split('.');
      const tampered = `${header}.${body}.${sig}INVALID`;
      expect(service.verify(tampered)).toBeNull();
    });

    it('should return null for an expired token', () => {
      const now = Math.floor(Date.now() / 1000);
      // Build a token manually with exp in the past
      const header = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      ).toString('base64url');
      const body = Buffer.from(
        JSON.stringify({ sub: 'user-1', iat: now - 7200, exp: now - 3600 }),
      ).toString('base64url');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto') as typeof import('crypto');
      const sig = crypto
        .createHmac('sha256', 'test-secret-key-for-jest')
        .update(`${header}.${body}`)
        .digest('base64url');
      const expiredToken = `${header}.${body}.${sig}`;
      expect(service.verify(expiredToken)).toBeNull();
    });

    it('should return null for a malformed token (not 3 parts)', () => {
      expect(service.verify('not.a.valid.jwt.token')).toBeNull();
      expect(service.verify('onlyone')).toBeNull();
    });

    it('should return null for a completely invalid string', () => {
      expect(service.verify('garbage')).toBeNull();
    });

    it('should return null when body is not valid base64 JSON', () => {
      const [header, , sig] = service.sign({ sub: 'x' }).split('.');
      expect(service.verify(`${header}.!!!invalid!!!.${sig}`)).toBeNull();
    });
  });

  describe('getExpiresIn', () => {
    it('should return the numeric value of JWT_EXPIRES_IN', () => {
      expect(service.getExpiresIn()).toBe(3600);
    });
  });
});
