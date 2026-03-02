import { Injectable, Logger, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { type Request } from 'express';
import { DatabaseService } from './database.service';

/**
 * Request-scoped service that provides tenant-scoped database queries.
 * Each request gets an isolated connection with the tenant's search_path.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantConnectionService {
  private readonly logger = new Logger(TenantConnectionService.name);
  private schemaName: string | null = null;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly databaseService: DatabaseService,
  ) {
    const tenantId = (this.request as unknown as Record<string, unknown>)['tenantId'] as
      | string
      | undefined;
    if (tenantId) {
      this.schemaName = `tenant_${tenantId.replace(/[^a-z0-9_]/g, '_')}`;
    }
  }

  /**
   * Execute a raw SQL query within the tenant's schema.
   * Automatically sets and resets search_path.
   */
  async query<T = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ): Promise<{ rows: T[]; rowCount: number }> {
    if (!this.schemaName) {
      throw new Error('Tenant schema not resolved');
    }

    const pool = this.databaseService.getPool();
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${this.schemaName}"`);
      const result = await client.query(text, params);
      await client.query(`SET search_path TO public`);
      return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
    } finally {
      client.release();
    }
  }

  getSchemaName(): string | null {
    return this.schemaName;
  }
}
