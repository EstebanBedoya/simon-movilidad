import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: number;

  constructor(private config: ConfigService) {
    this.secret = config.getOrThrow<string>('JWT_SECRET');
    this.expiresIn = Number(config.get('JWT_EXPIRES_IN') ?? 86400);
  }

  sign(payload: Record<string, unknown>): string {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const body = Buffer.from(
      JSON.stringify({ ...payload, iat: now, exp: now + this.expiresIn }),
    ).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  verify(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, body, sig] = parts;
      const expected = crypto
        .createHmac('sha256', this.secret)
        .update(`${header}.${body}`)
        .digest('base64url');
      if (sig !== expected) return null;
      const payload = JSON.parse(
        Buffer.from(body, 'base64url').toString(),
      ) as Record<string, unknown>;
      if (
        typeof payload.exp === 'number' &&
        payload.exp < Math.floor(Date.now() / 1000)
      )
        return null;
      return payload;
    } catch {
      return null;
    }
  }

  getExpiresIn(): number {
    return this.expiresIn;
  }
}
