import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Get basic table counts
    const [products, categories, partners] = await Promise.all([
      prisma.products.count({ where: { status: 'active' } }),
      prisma.categories.count({ where: { is_active: true } }),
      prisma.partners.count({ where: { status: 'active' } }),
    ]);

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      tables: {
        products,
        categories,
        partners
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}