import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract the current tenant ID from the request.
 * Usage: @CurrentTenant() tenantId: string
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    return request['tenantId'] as string;
  },
);
