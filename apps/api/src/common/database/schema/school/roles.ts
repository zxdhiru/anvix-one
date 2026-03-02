import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Roles table — predefined + custom roles within a tenant.
 * Default roles: school_admin, vice_principal, teacher, accountant, staff
 */
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Permissions table — granular permissions for RBAC.
 * e.g. "students.read", "attendance.write", "fees.manage"
 */
export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(), // e.g. "students.read"
  module: varchar('module', { length: 50 }).notNull(), // e.g. "students", "attendance"
  action: varchar('action', { length: 20 }).notNull(), // e.g. "read", "write", "delete", "manage"
  description: text('description'),
});

/**
 * Role-Permission mapping — M:N relation
 */
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
});

/**
 * User-Role mapping — a user can have multiple roles
 */
export const userRoles = pgTable('user_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // references users.id — same schema
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
});
