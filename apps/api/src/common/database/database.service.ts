import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;
  readonly db: NodePgDatabase;

  constructor(databaseUrl: string) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.db = drizzle(this.pool);
  }

  /** Get a raw pg Pool for advanced operations (e.g., schema creation). */
  getPool(): Pool {
    return this.pool;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
