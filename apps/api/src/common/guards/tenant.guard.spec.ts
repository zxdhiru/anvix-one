import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  function createMockContext(headers: Record<string, string | undefined>): ExecutionContext {
    const request: Record<string, unknown> = { headers };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extract tenant from x-tenant-id header', () => {
    const context = createMockContext({ 'x-tenant-id': 'dps-bangalore', host: 'localhost' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should extract tenant from subdomain', () => {
    const context = createMockContext({ host: 'dps-bangalore.anvixone.in' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when no tenant', () => {
    const context = createMockContext({ host: 'admin.anvixone.in' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should ignore www subdomain', () => {
    const context = createMockContext({ host: 'www.anvixone.in' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
