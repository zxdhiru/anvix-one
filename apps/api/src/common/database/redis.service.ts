import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis service for caching, pub/sub, and key-value storage.
 * Used primarily for:
 * - Tenant subscription status caching (10-min TTL)
 * - Webhook-driven cache invalidation
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');

    this.client = new Redis(redisUrl, {
      tls: redisUrl.startsWith('rediss://') ? {} : undefined, // ← add this line
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) {
          this.logger.error('Redis connection failed after 5 retries');
          return 5000; // ← change null to 5000 to keep retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));

    // Connect (non-blocking, will reconnect automatically)
    this.client.connect().catch((err: Error) => {
      this.logger.warn(`Redis initial connection failed: ${err.message}. Will retry.`);
    });
  }

  /** Get a cached value */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      this.logger.warn(`Redis GET failed for key: ${key}`);
      return null;
    }
  }

  /** Set a cached value with TTL (in seconds) */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      this.logger.warn(`Redis SET failed for key: ${key}`);
    }
  }

  /** Delete a cached key */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      this.logger.warn(`Redis DEL failed for key: ${key}`);
    }
  }

  /** Delete all keys matching a pattern */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      this.logger.warn(`Redis DEL pattern failed for: ${pattern}`);
    }
  }

  /** Check if Redis is connected */
  isReady(): boolean {
    return this.client.status === 'ready';
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
