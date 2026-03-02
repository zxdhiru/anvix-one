import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard that checks if the authenticated user has one of the required roles.
 * Must be used AFTER AuthGuard (which sets request['user']).
 *
 * If no @Roles() decorator is applied, access is granted to any authenticated user.
 */
@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles specified → allow any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const user = request['user'] as { role?: string } | undefined;

    if (!user?.role) {
      throw new ForbiddenException('User role not found');
    }

    // school_admin always passes
    if (user.role === 'school_admin') {
      return true;
    }

    if (!requiredRoles.includes(user.role)) {
      this.logger.warn(`Access denied: role '${user.role}' not in [${requiredRoles.join(', ')}]`);
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
