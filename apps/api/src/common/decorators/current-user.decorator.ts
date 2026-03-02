import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract the current user from the request.
 * Usage: @CurrentUser() user: UserPayload
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Record<string, unknown>>();
  return request['user'];
});
