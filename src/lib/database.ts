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
    sortBy = 'created_at',
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
    where.created_at = {
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
      prisma.products,
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
    return prisma.products.findUnique({
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
    return prisma.products.create({
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
    return prisma.products.update({
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
    return prisma.products.delete({
      where: { id },
    });
  },

  async bulkUpdate(ids: string[], data: any) {
    return prisma.products.updateMany({
      where: { id: { in: ids } },
      data,
    });
  },

  async getStats() {
    const [total, active, featured, recentlyAdded] = await Promise.all([
      prisma.products.count(),
      prisma.products.count({ where: { status: 'active' } }),
      prisma.products.count({ where: { is_featured: true } }),
      prisma.products.count({
        where: {
          created_at: {
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
      prisma.categories,
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
    return prisma.categories.findUnique({
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
    const categories = await prisma.categories.findMany({
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

    return categories.filter(cat => !cat.parent_id);
  },

  async create(data: any) {
    return prisma.categories.create({
      data,
      include: {
        translations: true,
        children: true,
        parent: true,
      },
    });
  },

  async update(id: string, data: any) {
    return prisma.categories.update({
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
    return prisma.categories.delete({
      where: { id },
    });
  },

  async getStats() {
    const [total, active, withProducts] = await Promise.all([
      prisma.categories.count(),
      prisma.categories.count({ where: { is_active: true } }),
      prisma.categories.count({
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
      prisma.partners,
      filters,
      {
        translations: true,
      }
    );
  },

  async findById(id: string) {
    return prisma.partners.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });
  },

  async create(data: any) {
    return prisma.partners.create({
      data,
      include: {
        translations: true,
      },
    });
  },

  async update(id: string, data: any) {
    return prisma.partners.update({
      where: { id },
      data,
      include: {
        translations: true,
      },
    });
  },

  async delete(id: string) {
    return prisma.partners.delete({
      where: { id },
    });
  },

  async getStats() {
    const [total, active, featured] = await Promise.all([
      prisma.partners.count(),
      prisma.partners.count({ where: { status: 'active' } }),
      prisma.partners.count({ where: { is_featured: true } }),
    ]);

    return { total, active, featured };
  },
};

// RFP-specific database functions
export const rfpDb = {
  async search(filters: AdminSearchFilters) {
    return searchWithPagination<any>(
      prisma.rfp_requests,
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
    return prisma.rfp_requests.findUnique({
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
    return prisma.rfp_requests.create({
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
    return prisma.rfp_requests.update({
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
    return prisma.rfp_requests.delete({
      where: { id },
    });
  },

  async getStats() {
    const [total, pending, processing, completed] = await Promise.all([
      prisma.rfp_requests.count(),
      prisma.rfp_requests.count({ where: { status: 'pending' } }),
      prisma.rfp_requests.count({ where: { status: 'processing' } }),
      prisma.rfp_requests.count({ where: { status: 'quoted' } }),
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
      prisma.rfp_requests.findMany({
        where: {
          created_at: {
            gte: startDate,
          },
        },
        include: {
          items: true,
        },
        orderBy: {
          created_at: 'desc',
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
      prisma.users,
      filters,
      {
        sessions: true,
        activityLogs: {
          take: 5,
          orderBy: { created_at: 'desc' },
        },
      }
    );
  },

  async findById(id: string) {
    return prisma.users.findUnique({
      where: { id },
      include: {
        sessions: true,
        activityLogs: {
          take: 10,
          orderBy: { created_at: 'desc' },
        },
      },
    });
  },

  async findByEmail(email: string) {
    return prisma.users.findUnique({
      where: { email },
      include: {
        sessions: true,
      },
    });
  },

  async create(data: any) {
    return prisma.users.create({
      data,
      include: {
        sessions: true,
      },
    });
  },

  async update(id: string, data: any) {
    return prisma.users.update({
      where: { id },
      data,
      include: {
        sessions: true,
      },
    });
  },

  async delete(id: string) {
    return prisma.users.delete({
      where: { id },
    });
  },

  async updateLastLogin(id: string) {
    return prisma.users.update({
      where: { id },
      data: { last_login: new Date() },
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
    return prisma.activity_logs.create({
      data: {
        ...data,
        created_at: new Date(),
      },
    });
  },

  async getRecent(limit = 50) {
    return prisma.activity_logs.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  },

  async getForResource(resourceType: string, resourceId: string) {
    return prisma.activity_logs.findMany({
      where: {
        resourceType,
        resourceId,
      },
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
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
      prisma.page_views.count({
        where: {
          created_at: {
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
    return prisma.page_views.create({
      data: {
        ...data,
        created_at: new Date(),
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
      prisma.products.count(),
      prisma.categories.count(),
      prisma.partners.count(),
      prisma.rfp_requests.count(),
      prisma.users.count(),
      prisma.pages.count(),
      prisma.banners.count(),
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
    await prisma.user_sessions.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });

    // Clean up old activity logs (keep last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await prisma.activity_logs.deleteMany({
      where: {
        created_at: {
          lt: ninetyDaysAgo,
        },
      },
    });

    // Clean up old page views (keep last 365 days)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    await prisma.page_views.deleteMany({
      where: {
        created_at: {
          lt: oneYearAgo,
        },
      },
    });
  },
};