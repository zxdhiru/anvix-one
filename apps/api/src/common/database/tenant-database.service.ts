import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatabaseService } from './database.service';

@Injectable()
export class TenantDatabaseService {
  private readonly logger = new Logger(TenantDatabaseService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new PostgreSQL schema for a tenant.
   * Schema name is derived from the tenant slug: "tenant_{slug}".
   */
  async createTenantSchema(slug: string): Promise<string> {
    const schemaName = this.getSchemaName(slug);
    this.logger.log(`Creating schema: ${schemaName}`);

    await this.databaseService.db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`));

    return schemaName;
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
