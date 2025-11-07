import { PrismaClient } from '@prisma/client';
import type { 
  Product, 
  Category, 
  Partner, 
  RFPRequest, 
  User,
  ActivityLog,
  PageView 
} from '@prisma/client';
import { AdminSearchFilters, AdminSearchResult } from '@/types/admin';

// Global Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = globalThis.__prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export { prisma };

// Generic search and pagination utility
export async function searchWithPagination<T>(
  model: any,
  filters: AdminSearchFilters,
  include?: any,
  orderBy?: any
): Promise<AdminSearchResult<T>> {
  const {
    query,
    status,
    category,
    dateRange,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    pageSize = 10,
  } = filters;

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // Build where clause
  const where: any = {};

  // Text search
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  // Status filter
  if (status && status.length > 0) {
    where.status = { in: status };
  }

  // Category filter
  if (category && category.length > 0) {
    where.categoryId = { in: category };
  }

  // Date range filter
  if (dateRange) {
    where.createdAt = {
      gte: dateRange.start,
      lte: dateRange.end,
    };
  }

  // Execute queries
  const [items, total] = await Promise.all([
    model.findMany({
      where,
      include,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    }),
    model.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    filters,
  };
}

// Product-specific database functions
export const productDb = {
  async search(filters: AdminSearchFilters) {
    return searchWithPagination<Product>(
      prisma.product,
      filters,
      {
        category: true,
        translations: true,
        media: true,
        attributes: true,
      }
    );
  },

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        translations: true,
        media: true,
        attributes: true,
      },
    });
  },

  async create(data: any) {
    return prisma.product.create({
      data,
      include: {
        category: true,
        translations: true,
        media: true,
        attributes: true,
      },
    });
  },

  async update(id: string, data: any) {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        translations: true,
        media: true,
        attributes: true,
      },
    });
  },

  async delete(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  },

  async bulkUpdate(ids: string[], data: any) {
    return prisma.product.updateMany({
      where: { id: { in: ids } },
      data,
    });
  },

  async getStats() {
    const [total, active, featured, recentlyAdded] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: 'active' } }),
      prisma.product.count({ where: { isFeatured: true } }),
      prisma.product.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return { total, active, featured, recentlyAdded };
  },
};

// Category-specific database functions
export const categoryDb = {
  async search(filters: AdminSearchFilters) {
    return searchWithPagination<Category>(
      prisma.category,
      filters,
      {
        translations: true,
        children: true,
        parent: true,
        _count: {
          select: { products: true },
        },
      }
    );
  },

  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        translations: true,
        children: true,
        parent: true,
        products: true,
      },
    });
  },

  async getTree() {
    const categories = await prisma.category.findMany({
      include: {
        translations: true,
        children: {
          include: {
            translations: true,
            children: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.filter(cat => !cat.parentId);
  },

  async create(data: any) {
    return prisma.category.create({
      data,
      include: {
        translations: true,
        children: true,
        parent: true,
      },
    });
  },

  async update(id: string, data: any) {
    return prisma.category.update({
      where: { id },
      data,
      include: {
        translations: true,
        children: true,
        parent: true,
      },
    });
  },

  async delete(id: string) {
    return prisma.category.delete({
      where: { id },
    });
  },

  async getStats() {
    const [total, active, withProducts] = await Promise.all([
      prisma.category.count(),
      prisma.category.count({ where: { isActive: true } }),
      prisma.category.count({
        where: {
          products: {
            some: {},
          },
        },
      }),
    ]);

    return { total, active, withProducts };
  },
};

// Partner-specific database functions
export const partnerDb = {
  async search(filters: AdminSearchFilters) {
    return searchWithPagination<Partner>(
      prisma.partner,
      filters,
      {
        translations: true,
      }
    );
  },

  async findById(id: string) {
    return prisma.partner.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });
  },

  async create(data: any) {
    return prisma.partner.create({
      data,
      include: {
        translations: true,
      },
    });
  },

  async update(id: string, data: any) {
    return prisma.partner.update({
      where: { id },
      data,
      include: {
        translations: true,
      },
    });
  },

  async delete(id: string) {
    return prisma.partner.delete({
      where: { id },
    });
  },

  async getStats() {
    const [total, active, featured] = await Promise.all([
      prisma.partner.count(),
      prisma.partner.count({ where: { status: 'active' } }),
      prisma.partner.count({ where: { isFeatured: true } }),
    ]);

    return { total, active, featured };
  },
};

// RFP-specific database functions
export const rfpDb = {
  async search(filters: AdminSearchFilters) {
    return searchWithPagination<any>(
      prisma.rFPRequest,
      filters,
      {
        items: {
          include: {
            product: true,
          },
        },
      }
    );
  },

  async findById(id: string) {
    return prisma.rFPRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                media: true,
              },
            },
          },
        },
      },
    });
  },

  async create(data: any) {
    return prisma.rFPRequest.create({
      data,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  },

  async update(id: string, data: any) {
    return prisma.rFPRequest.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  },

  async delete(id: string) {
    return prisma.rFPRequest.delete({
      where: { id },
    });
  },

  async getStats() {
    const [total, pending, processing, completed] = await Promise.all([
      prisma.rFPRequest.count(),
      prisma.rFPRequest.count({ where: { status: 'pending' } }),
      prisma.rFPRequest.count({ where: { status: 'processing' } }),
      prisma.rFPRequest.count({ where: { status: 'quoted' } }),
    ]);

    return { total, pending, processing, completed };
  },

  async getDashboardData(timeframe: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const [requests, dailyStats] = await Promise.all([
      prisma.rFPRequest.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        include: {
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as requests,
          COUNT(DISTINCT customer_email) as unique_customers
        FROM rfp_requests 
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    return { requests, dailyStats };
  },
};

// User-specific database functions
export const userDb = {
  async search(filters: AdminSearchFilters) {
    return searchWithPagination<User>(
      prisma.user,
      filters,
      {
        sessions: true,
        activityLogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      }
    );
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        sessions: true,
        activityLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        sessions: true,
      },
    });
  },

  async create(data: any) {
    return prisma.user.create({
      data,
      include: {
        sessions: true,
      },
    });
  },

  async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        sessions: true,
      },
    });
  },

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },

  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  },
};

// Activity logging
export const activityDb = {
  async log(data: {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.activityLog.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
    });
  },

  async getRecent(limit = 50) {
    return prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  },

  async getForResource(resourceType: string, resourceId: string) {
    return prisma.activityLog.findMany({
      where: {
        resourceType,
        resourceId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  },
};

// Analytics
export const analyticsDb = {
  async getPageViews(timeframe: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const [total, unique, topPages] = await Promise.all([
      prisma.pageView.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT session_id) as unique_views
        FROM page_views 
        WHERE created_at >= ${startDate}
      `,
      prisma.$queryRaw`
        SELECT 
          page_path,
          COUNT(*) as views
        FROM page_views 
        WHERE created_at >= ${startDate}
        GROUP BY page_path
        ORDER BY views DESC
        LIMIT 10
      `,
    ]);

    return { total, unique: (unique as any)[0]?.unique_views || 0, topPages };
  },

  async recordPageView(data: {
    pagePath: string;
    referrer?: string;
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  }) {
    return prisma.pageView.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
    });
  },
};

// Utility functions
export const dbUtils = {
  async healthCheck() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date() };
    }
  },

  async getTableCounts() {
    const [
      products,
      categories,
      partners,
      rfpRequests,
      users,
      pages,
      banners,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.partner.count(),
      prisma.rFPRequest.count(),
      prisma.user.count(),
      prisma.page.count(),
      prisma.banner.count(),
    ]);

    return {
      products,
      categories,
      partners,
      rfpRequests,
      users,
      pages,
      banners,
    };
  },

  async cleanup() {
    // Clean up old sessions
    await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Clean up old activity logs (keep last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    // Clean up old page views (keep last 365 days)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    await prisma.pageView.deleteMany({
      where: {
        createdAt: {
          lt: oneYearAgo,
        },
      },
    });
  },
};