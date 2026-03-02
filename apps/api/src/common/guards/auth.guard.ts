import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard that validates JWT tokens for authenticated routes.
 * Phase 0: Skeleton only — full implementation in Phase 1 with Better Auth.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    // TODO Phase 1: Validate token with Better Auth
    // For now, allow any non-empty token in development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    throw new UnauthorizedException('Invalid authentication token');
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
