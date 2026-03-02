import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard();
  });

  function createMockContext(authHeader?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: authHeader,
          },
        }),
      }),
    } as ExecutionContext;
  }

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException when no token', () => {
    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for non-Bearer tokens', () => {
    const context = createMockContext('Basic abc123');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should allow Bearer tokens in development', () => {
    process.env.NODE_ENV = 'development';
    const context = createMockContext('Bearer test-token');
    expect(guard.canActivate(context)).toBe(true);
  });
});
