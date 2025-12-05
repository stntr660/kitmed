import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

// Enhanced Prisma Client with Security Extensions
export class SecurePrismaClient {
  private static instance: SecurePrismaClient;
  private client: PrismaClient;
  private auditLog: boolean = true;

  private constructor() {
    this.client = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Security event logging
    this.client.$on('query', (e) => {
      if (this.auditLog) {
        this.logQuery(e);
      }
    });

    this.client.$on('error', (e) => {
      this.logError(e);
    });
  }

  public static getInstance(): SecurePrismaClient {
    if (!SecurePrismaClient.instance) {
      SecurePrismaClient.instance = new SecurePrismaClient();
    }
    return SecurePrismaClient.instance;
  }

  public getClient(): PrismaClient {
    return this.client;
  }

  // Security audit logging
  private async logQuery(event: any) {
    // Only log sensitive operations for security auditing
    const sensitiveOperations = ['CREATE', 'UPDATE', 'DELETE', 'DROP', 'ALTER'];
    const query = event.query.toUpperCase();

    if (sensitiveOperations.some(op => query.includes(op))) {

      // Log to database activity log
      try {
        await this.client.activityLog.create({
          data: {
            action: 'DATABASE_QUERY',
            resourceType: 'DATABASE',
            details: {
              query: event.query,
              duration: event.duration,
              timestamp: event.timestamp,
            },
            ipAddress: 'system',
            userAgent: 'prisma-client',
          },
        });
      } catch (error) {
        console.error('Failed to log audit event:', error);
      }
    }
  }

  private logError(event: any) {
    console.error(`🚨 DATABASE ERROR: ${event.timestamp} - ${event.message}`);
  }

  // Input sanitization and validation
  public sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Remove potentially dangerous characters
    return input
      .replace(/[<>'"]/g, '') // Remove HTML/script injection chars
      .replace(/[;--]/g, '') // Remove SQL injection chars
      .trim()
      .slice(0, 1000); // Limit length
  }

  // Secure password operations
  public async hashPassword(password: string): Promise<string> {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Rate limiting for database operations
  public createRateLimit(windowMs: number = 15 * 60 * 1000, max: number = 100) {
    return rateLimit({
      windowMs,
      max,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMITED',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  // Secure query execution with validation
  public async secureQuery<T>(
    operation: () => Promise<T>,
    context: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      action: string;
      resourceType: string;
    }
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();

      // Log successful operation
      if (this.auditLog) {
        await this.logActivity({
          ...context,
          details: {
            success: true,
            duration: Date.now() - startTime
          },
        });
      }

      return result;
    } catch (error) {
      // Log failed operation
      await this.logActivity({
        ...context,
        details: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime
        },
      });

      throw error;
    }
  }

  // Activity logging
  private async logActivity(context: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    action: string;
    resourceType: string;
    details?: any;
  }) {
    try {
      await this.client.activityLog.create({
        data: {
          userId: context.userId || null,
          action: context.action,
          resourceType: context.resourceType,
          details: context.details || {},
          ipAddress: context.ipAddress || null,
          userAgent: context.userAgent || null,
        },
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  // Data encryption for sensitive fields (example)
  public async encryptSensitiveData(data: string): Promise<string> {
    // In production, use proper encryption library like node-crypto
    return Buffer.from(data).toString('base64');
  }

  public async decryptSensitiveData(encryptedData: string): Promise<string> {
    // In production, use proper decryption
    return Buffer.from(encryptedData, 'base64').toString('utf-8');
  }

  // Database backup validation
  public async validateBackup(): Promise<boolean> {
    try {
      // Check if critical tables exist and have data
      const productCount = await this.client.product.count();
      const categoryCount = await this.client.category.count();

      return productCount > 0 && categoryCount > 0;
    } catch (error) {
      console.error('Backup validation failed:', error);
      return false;
    }
  }

  // Connection health check
  public async healthCheck(): Promise<{
    database: boolean;
    latency: number;
    connections: number;
  }> {
    const startTime = Date.now();

    try {
      await this.client.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      // Get connection count (PostgreSQL specific)
      const connectionResult = await this.client.$queryRaw<[{ count: number }]>`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      const connections = Number(connectionResult[0]?.count) || 0;

      return {
        database: true,
        latency,
        connections,
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        database: false,
        latency: Date.now() - startTime,
        connections: 0,
      };
    }
  }

  // Graceful shutdown
  public async disconnect(): Promise<void> {

    await this.client.$disconnect();

  }
}

// Singleton instance
export const securePrisma = SecurePrismaClient.getInstance();

// Export the client for use in other modules
export const prisma = securePrisma.getClient();

export default securePrisma;