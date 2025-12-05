import { Pool } from 'pg';
import Redis from 'ioredis';

// PostgreSQL Connection Pool Configuration
export class DatabasePool {
  private static instance: DatabasePool;
  private pool: Pool;
  private redis: Redis;

  private constructor() {
    // PostgreSQL Pool Configuration
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum connections in pool
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 2000, // Connection timeout
      statement_timeout: 10000, // Query timeout
      query_timeout: 10000,
      allowExitOnIdle: true,
    });

    // Redis Configuration
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
        keepAlive: 30000,
      });

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      this.redis.on('connect', () => {

      });
    } else {

    }

    // Pool event handlers
    this.pool.on('connect', (client) => {

    });

    this.pool.on('error', (err) => {
      console.error('🚨 PostgreSQL pool error:', err);
    });

    this.pool.on('acquire', () => {

    });

    this.pool.on('release', () => {

    });
  }

  public static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public getRedis(): Redis | undefined {
    return this.redis;
  }

  // Query method with connection pooling
  public async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  // Transaction method
  public async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Cache methods (Redis)
  public async cacheGet(key: string): Promise<string | null> {
    if (!this.redis) return null;
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  public async cacheSet(key: string, value: string, ttlSeconds = 3600): Promise<boolean> {
    if (!this.redis) return false;
    try {
      await this.redis.setex(key, ttlSeconds, value);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  public async cacheDel(key: string): Promise<boolean> {
    if (!this.redis) return false;
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Health check methods
  public async healthCheck(): Promise<{ postgres: boolean; redis: boolean }> {
    const result = { postgres: false, redis: false };

    // Test PostgreSQL connection
    try {
      await this.query('SELECT 1');
      result.postgres = true;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
    }

    // Test Redis connection
    if (this.redis) {
      try {
        await this.redis.ping();
        result.redis = true;
      } catch (error) {
        console.error('Redis health check failed:', error);
      }
    }

    return result;
  }

  // Graceful shutdown
  public async close(): Promise<void> {

    try {
      await this.pool.end();

    } catch (error) {
      console.error('❌ Error closing PostgreSQL pool:', error);
    }

    if (this.redis) {
      try {
        this.redis.disconnect();

      } catch (error) {
        console.error('❌ Error closing Redis connection:', error);
      }
    }
  }
}

// Singleton instance
export const dbPool = DatabasePool.getInstance();

// Graceful shutdown handlers
process.on('SIGINT', async () => {

  await dbPool.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {

  await dbPool.close();
  process.exit(0);
});

export default dbPool;