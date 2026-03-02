import { SetMetadata, type CustomDecorator } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access a route.
 * Usage: @Roles('school_admin', 'teacher')
 */
export const Roles = (...roles: string[]): CustomDecorator<string> => SetMetadata(ROLES_KEY, roles);
