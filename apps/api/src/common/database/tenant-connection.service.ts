import { Injectable, Logger, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { type Request } from 'express';
import { DatabaseService } from './database.service';

/**
 * Request-scoped service that provides tenant-scoped database queries.
 * Each request gets an isolated connection with the tenant's search_path.
 * Schema is lazily resolved so that guards can set request['tenantId'] first.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantConnectionService {
  private readonly logger = new Logger(TenantConnectionService.name);
  private schemaName: string | null = null;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Lazily resolve the tenant schema from the request.
   * Guards (TenantGuard) set request['tenantId'] before this is called.
   */
  private resolveSchema(): string {
    if (this.schemaName) return this.schemaName;

    const tenantId = (this.request as unknown as Record<string, unknown>)['tenantId'] as
      | string
      | undefined;
    if (tenantId) {
      this.schemaName = `tenant_${tenantId.replace(/[^a-z0-9_]/g, '_')}`;
    }

    if (!this.schemaName) {
      throw new Error('Tenant schema not resolved');
    }
    return this.schemaName;
  }

  /**
   * Execute a raw SQL query within the tenant's schema.
   * Automatically sets and resets search_path.
   */
  async query<T = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ): Promise<{ rows: T[]; rowCount: number }> {
    const schema = this.resolveSchema();

    const pool = this.databaseService.getPool();
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schema}"`);
      const result = await client.query(text, params);
      await client.query(`SET search_path TO public`);
      return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
    } finally {
      client.release();
    }
  }

  getSchemaName(): string | null {
    try {
      return this.resolveSchema();
    } catch {
      return null;
    }
  }
}
