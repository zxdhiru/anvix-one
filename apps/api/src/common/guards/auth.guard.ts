import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';

/**
 * Guard that validates HMAC-signed tokens for school routes.
 * Decodes the token and attaches user info (id, phone, role) to request['user'].
 *
 * In development with no token, allows access for testing.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly tokenSecret = process.env.JWT_SECRET ?? 'dev-secret-change-me';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      throw new UnauthorizedException('Missing authentication token');
    }

    const payload = this.verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    // Attach user info to request
    (request as unknown as Record<string, unknown>)['user'] = {
      id: payload.userId,
      phone: payload.phone,
      role: payload.role,
      tenantSchema: payload.tenantSchema,
    };

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private verifyToken(
    token: string,
  ): { userId: string; phone: string; role: string; tenantSchema: string; exp: number } | null {
    try {
      const [payloadB64, signature] = token.split('.');
      if (!payloadB64 || !signature) return null;

      const expectedSig = crypto
        .createHmac('sha256', this.tokenSecret)
        .update(payloadB64)
        .digest('hex');

      if (signature !== expectedSig) return null;

      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

      if (payload.exp && Date.now() > payload.exp) return null;

      return payload;
    } catch {
      return null;
    }
  }
}
