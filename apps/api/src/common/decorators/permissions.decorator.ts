import { SetMetadata, type CustomDecorator } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route.
 * Usage: @RequirePermissions('students.read', 'students.write')
 */
export const RequirePermissions = (...permissions: string[]): CustomDecorator<string> =>
  SetMetadata(PERMISSIONS_KEY, permissions);
