import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatabaseService } from './database.service';

/**
 * SQL for creating tenant-level tables inside a schema.
 * These replicate the Drizzle schemas in schema/school/ but as raw SQL
 * so they can be run dynamically inside any tenant schema.
 */
const TENANT_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS school_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    board VARCHAR(20) NOT NULL,
    udise_code VARCHAR(20),
    affiliation_number VARCHAR(50),
    logo_url VARCHAR(500),
    phone VARCHAR(15),
    email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

@Injectable()
export class TenantDatabaseService {
  private readonly logger = new Logger(TenantDatabaseService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new PostgreSQL schema for a tenant and run tenant migrations.
   * Schema name is derived from the tenant slug: "tenant_{slug}".
   */
  async createTenantSchema(slug: string): Promise<string> {
    const schemaName = this.getSchemaName(slug);
    this.logger.log(`Creating schema: ${schemaName}`);

    await this.databaseService.db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`));

    return schemaName;
  }

  /**
   * Run tenant-specific migrations (create tables) inside a tenant schema.
   * Uses SET search_path to target the correct schema.
   */
  async runTenantMigrations(schemaName: string): Promise<void> {
    this.logger.log(`Running migrations for schema: ${schemaName}`);

    const pool = this.databaseService.getPool();
    const client = await pool.connect();
    try {
      // Set search_path to the tenant schema so tables are created there
      await client.query(`SET search_path TO "${schemaName}"`);
      await client.query(TENANT_TABLES_SQL);
      // Reset search_path
      await client.query(`SET search_path TO public`);
      this.logger.log(`Migrations completed for schema: ${schemaName}`);
    } finally {
      client.release();
    }
  }

  /**
   * Create the school admin user inside a tenant schema.
   * Returns the created user record.
   */
  async createSchoolAdmin(
    schemaName: string,
    data: { name: string; phone: string; email: string },
  ): Promise<{ id: string; name: string; phone: string; email: string; role: string }> {
    this.logger.log(`Creating school admin in schema: ${schemaName}`);

    const pool = this.databaseService.getPool();
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaName}"`);
      const result = await client.query(
        `INSERT INTO users (name, phone, email, role) VALUES ($1, $2, $3, 'admin') RETURNING id, name, phone, email, role`,
        [data.name, data.phone, data.email],
      );
      await client.query(`SET search_path TO public`);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Full provisioning: create schema + run migrations + create admin.
   * Runs inside a single connection with transaction-like behavior.
   * If any step fails, the schema is dropped (rollback).
   */
  async provisionTenantSchema(
    slug: string,
    admin: { name: string; phone: string; email: string },
  ): Promise<{
    schemaName: string;
    adminUser: { id: string; name: string; phone: string; email: string; role: string };
  }> {
    const schemaName = this.getSchemaName(slug);
    this.logger.log(`Provisioning tenant schema: ${schemaName}`);

    try {
      // Step 1: Create schema
      await this.createTenantSchema(slug);

      // Step 2: Run migrations (create tables)
      await this.runTenantMigrations(schemaName);

      // Step 3: Create school admin user
      const adminUser = await this.createSchoolAdmin(schemaName, admin);

      this.logger.log(`Provisioning complete for schema: ${schemaName}, admin: ${adminUser.id}`);
      return { schemaName, adminUser };
    } catch (error) {
      // Rollback: drop the schema if any step fails
      this.logger.error(`Provisioning failed for ${schemaName}, rolling back...`, error);
      try {
        await this.databaseService.db.execute(
          sql.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`),
        );
        this.logger.warn(`Rolled back schema: ${schemaName}`);
      } catch (rollbackError) {
        this.logger.error(`Rollback also failed for ${schemaName}`, rollbackError);
      }
      throw error;
    }
  }

  /**
   * Drop a tenant schema (use with extreme caution).
   */
  async dropTenantSchema(slug: string): Promise<void> {
    const schemaName = this.getSchemaName(slug);
    this.logger.warn(`Dropping schema: ${schemaName}`);

    await this.databaseService.db.execute(sql.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`));
  }

  /**
   * Check if a tenant schema exists.
   */
  async schemaExists(slug: string): Promise<boolean> {
    const schemaName = this.getSchemaName(slug);
    const result = await this.databaseService.db.execute(
      sql`SELECT schema_name FROM information_schema.schemata WHERE schema_name = ${schemaName}`,
    );
    return result.rows.length > 0;
  }

  /**
   * Convert tenant slug to schema name.
   * Sanitizes to prevent SQL injection.
   */
  getSchemaName(slug: string): string {
    const sanitized = slug.replace(/[^a-z0-9_]/g, '_');
    return `tenant_${sanitized}`;
  }
}
