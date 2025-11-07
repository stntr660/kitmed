/**
 * @jest-environment node
 */

import { GET, POST, PUT, DELETE } from '@/app/api/products/route';
import { GET as GetProductBySlug } from '@/app/api/products/[slug]/route';
import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/prisma';
import { mockProducts, createMockProduct } from '../fixtures/mock-data';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    manufacturer: {
      findUnique: jest.fn(),
    },
    discipline: {
      findUnique: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/products API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('returns paginated products with default parameters', async () => {
      const mockResponse = {
        products: mockProducts.slice(0, 10),
        total: mockProducts.length,
      };

      mockPrisma.product.findMany.mockResolvedValue(mockProducts.slice(0, 10));
      mockPrisma.product.count.mockResolvedValue(mockProducts.length);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/products',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(2);
      expect(data.data.total).toBe(mockProducts.length);
      expect(data.data.page).toBe(1);
      expect(data.data.pageSize).toBe(10);
    });

    it('handles pagination parameters correctly', async () => {
      const page = 2;
      const limit = 5;
      const expectedSkip = (page - 1) * limit;

      mockPrisma.product.findMany.mockResolvedValue(mockProducts.slice(0, 5));
      mockPrisma.product.count.mockResolvedValue(mockProducts.length);

      const { req } = createMocks({
        method: 'GET',
        url: `/api/products?page=${page}&limit=${limit}`,
        query: { page: page.toString(), limit: limit.toString() },
      });

      await GET(req);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: expectedSkip,
          take: limit,
        })
      );
    });

    it('filters products by search query', async () => {
      const searchQuery = 'monitor';
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      const { req } = createMocks({
        method: 'GET',
        url: `/api/products?search=${searchQuery}`,
        query: { search: searchQuery },
      });

      await GET(req);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: expect.objectContaining({
                  path: ['en'],
                  string_contains: searchQuery,
                }),
              }),
              expect.objectContaining({
                description: expect.objectContaining({
                  path: ['en'],
                  string_contains: searchQuery,
                }),
              }),
            ]),
          }),
        })
      );
    });

    it('filters products by category', async () => {
      const categoryId = 'cat-1';
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      const { req } = createMocks({
        method: 'GET',
        url: `/api/products?category=${categoryId}`,
        query: { category: categoryId },
      });

      await GET(req);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId,
          }),
        })
      );
    });

    it('filters products by manufacturer', async () => {
      const manufacturerId = 'mfg-1';
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      const { req } = createMocks({
        method: 'GET',
        url: `/api/products?manufacturer=${manufacturerId}`,
        query: { manufacturer: manufacturerId },
      });

      await GET(req);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            manufacturerId,
          }),
        })
      );
    });

    it('sorts products by specified field and direction', async () => {
      const sortBy = 'name';
      const sortOrder = 'desc';
      
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(mockProducts.length);

      const { req } = createMocks({
        method: 'GET',
        url: `/api/products?sortBy=${sortBy}&sortOrder=${sortOrder}`,
        query: { sortBy, sortOrder },
      });

      await GET(req);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { [sortBy]: sortOrder },
        })
      );
    });

    it('returns only active products by default', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(mockProducts.length);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/products',
      });

      await GET(req);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
          }),
        })
      );
    });

    it('handles database errors gracefully', async () => {
      mockPrisma.product.findMany.mockRejectedValue(new Error('Database error'));

      const { req } = createMocks({
        method: 'GET',
        url: '/api/products',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });

    it('validates pagination limits', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/products?limit=1000', // Exceeds maximum limit
        query: { limit: '1000' },
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_PAGINATION');
    });
  });

  describe('GET /api/products/[slug]', () => {
    it('returns product by slug with all related data', async () => {
      const productSlug = 'intellivue-mp70-patient-monitor';
      const mockProduct = mockProducts[0];

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const { req } = createMocks({
        method: 'GET',
        url: `/api/products/${productSlug}`,
      });

      const response = await GetProductBySlug(req, { params: { slug: productSlug } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.slug).toBe(productSlug);
      expect(data.data.name).toBeDefined();
      expect(data.data.category).toBeDefined();
      expect(data.data.manufacturer).toBeDefined();
    });

    it('returns 404 for non-existent product', async () => {
      const nonExistentSlug = 'non-existent-product';
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'GET',
        url: `/api/products/${nonExistentSlug}`,
      });

      const response = await GetProductBySlug(req, { params: { slug: nonExistentSlug } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('includes related products in response', async () => {
      const productSlug = 'intellivue-mp70-patient-monitor';
      const mockProduct = mockProducts[0];

      mockPrisma.product.findUnique
        .mockResolvedValueOnce(mockProduct) // Main product
        .mockResolvedValueOnce(mockProducts); // Related products query

      const { req } = createMocks({
        method: 'GET',
        url: `/api/products/${productSlug}?includeRelated=true`,
        query: { includeRelated: 'true' },
      });

      const response = await GetProductBySlug(req, { params: { slug: productSlug } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.relatedProducts).toBeDefined();
    });

    it('handles inactive products correctly', async () => {
      const inactiveProduct = {
        ...mockProducts[0],
        status: 'inactive',
      };

      mockPrisma.product.findUnique.mockResolvedValue(inactiveProduct);

      const { req } = createMocks({
        method: 'GET',
        url: `/api/products/${inactiveProduct.slug}`,
      });

      const response = await GetProductBySlug(req, { params: { slug: inactiveProduct.slug } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('PRODUCT_NOT_AVAILABLE');
    });
  });

  describe('POST /api/products (Admin)', () => {
    const validProductData = {
      name: { en: 'New Product', fr: 'Nouveau Produit' },
      description: { en: 'Description', fr: 'Description' },
      slug: 'new-product',
      sku: 'NEW-001',
      categoryId: 'cat-1',
      manufacturerId: 'mfg-1',
      disciplineId: 'disc-1',
      status: 'active',
    };

    beforeEach(() => {
      // Mock auth middleware to allow admin access
      mockPrisma.category.findUnique.mockResolvedValue(mockProducts[0].category);
      mockPrisma.manufacturer.findUnique.mockResolvedValue(mockProducts[0].manufacturer);
      mockPrisma.discipline.findUnique.mockResolvedValue(mockProducts[0].discipline);
    });

    it('creates new product with valid data', async () => {
      const newProduct = createMockProduct(validProductData);
      mockPrisma.product.create.mockResolvedValue(newProduct);

      const { req } = createMocks({
        method: 'POST',
        url: '/api/products',
        headers: {
          'Authorization': 'Bearer valid-admin-token',
          'Content-Type': 'application/json',
        },
        body: validProductData,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toEqual(validProductData.name);
      expect(mockPrisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining(validProductData),
        })
      );
    });

    it('validates required fields', async () => {
      const invalidData = { name: { en: 'Incomplete Product' } };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/products',
        headers: {
          'Authorization': 'Bearer valid-admin-token',
          'Content-Type': 'application/json',
        },
        body: invalidData,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toContain('description is required');
    });

    it('validates SKU uniqueness', async () => {
      mockPrisma.product.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['sku'] },
      });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/products',
        headers: {
          'Authorization': 'Bearer valid-admin-token',
          'Content-Type': 'application/json',
        },
        body: validProductData,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('SKU_ALREADY_EXISTS');
    });

    it('validates foreign key references', async () => {
      const invalidData = {
        ...validProductData,
        categoryId: 'non-existent-category',
      };

      mockPrisma.category.findUnique.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'POST',
        url: '/api/products',
        headers: {
          'Authorization': 'Bearer valid-admin-token',
          'Content-Type': 'application/json',
        },
        body: invalidData,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_CATEGORY');
    });

    it('handles file uploads for product images', async () => {
      const productWithImages = {
        ...validProductData,
        images: [
          {
            url: '/uploads/product-image.jpg',
            alt: { en: 'Product Image', fr: 'Image du Produit' },
            width: 800,
            height: 600,
            isPrimary: true,
            order: 1,
          },
        ],
      };

      const newProduct = createMockProduct(productWithImages);
      mockPrisma.product.create.mockResolvedValue(newProduct);

      const { req } = createMocks({
        method: 'POST',
        url: '/api/products',
        headers: {
          'Authorization': 'Bearer valid-admin-token',
          'Content-Type': 'application/json',
        },
        body: productWithImages,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.images).toHaveLength(1);
      expect(data.data.images[0].url).toBe('/uploads/product-image.jpg');
    });
  });

  describe('PUT /api/products/[id] (Admin)', () => {
    const updateData = {
      name: { en: 'Updated Product', fr: 'Produit Mis à Jour' },
      description: { en: 'Updated Description', fr: 'Description Mise à Jour' },
    };

    it('updates existing product', async () => {
      const productId = 'prod-1';
      const updatedProduct = { ...mockProducts[0], ...updateData };
      
      mockPrisma.product.findUnique.mockResolvedValue(mockProducts[0]);
      mockPrisma.product.update.mockResolvedValue(updatedProduct);

      const { req } = createMocks({
        method: 'PUT',
        url: `/api/products/${productId}`,
        headers: {
          'Authorization': 'Bearer valid-admin-token',
          'Content-Type': 'application/json',
        },
        body: updateData,
      });

      const response = await PUT(req, { params: { id: productId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toEqual(updateData.name);
    });

    it('returns 404 for non-existent product', async () => {
      const nonExistentId = 'non-existent-id';
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'PUT',
        url: `/api/products/${nonExistentId}`,
        headers: {
          'Authorization': 'Bearer valid-admin-token',
          'Content-Type': 'application/json',
        },
        body: updateData,
      });

      const response = await PUT(req, { params: { id: nonExistentId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('DELETE /api/products/[id] (Admin)', () => {
    it('soft deletes product by setting status to inactive', async () => {
      const productId = 'prod-1';
      const deletedProduct = { ...mockProducts[0], status: 'inactive' };
      
      mockPrisma.product.findUnique.mockResolvedValue(mockProducts[0]);
      mockPrisma.product.update.mockResolvedValue(deletedProduct);

      const { req } = createMocks({
        method: 'DELETE',
        url: `/api/products/${productId}`,
        headers: {
          'Authorization': 'Bearer valid-admin-token',
        },
      });

      const response = await DELETE(req, { params: { id: productId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: { status: 'inactive' },
      });
    });

    it('prevents deletion of products with active RFP references', async () => {
      const productId = 'prod-1';
      
      mockPrisma.product.findUnique.mockResolvedValue(mockProducts[0]);
      mockPrisma.product.update.mockRejectedValue({
        code: 'P2003',
        meta: { field_name: 'rfpItems' },
      });

      const { req } = createMocks({
        method: 'DELETE',
        url: `/api/products/${productId}`,
        headers: {
          'Authorization': 'Bearer valid-admin-token',
        },
      });

      const response = await DELETE(req, { params: { id: productId } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PRODUCT_IN_USE');
    });
  });

  describe('Security', () => {
    it('requires authentication for admin operations', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/products',
        body: { name: 'Test Product' },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('validates admin role for write operations', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/products',
        headers: {
          'Authorization': 'Bearer user-token', // Non-admin token
        },
        body: { name: 'Test Product' },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('sanitizes input data to prevent injection attacks', async () => {
      const maliciousData = {
        name: { en: '<script>alert("xss")</script>Product' },
        description: { en: 'SELECT * FROM users; DROP TABLE products;' },
        slug: 'malicious-product',
        sku: 'MAL-001',
        categoryId: 'cat-1',
        manufacturerId: 'mfg-1',
        disciplineId: 'disc-1',
      };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/products',
        headers: {
          'Authorization': 'Bearer valid-admin-token',
          'Content-Type': 'application/json',
        },
        body: maliciousData,
      });

      const response = await POST(req);
      const data = await response.json();

      // Should sanitize the input
      expect(data.data?.name.en).not.toContain('<script>');
      expect(data.data?.description.en).not.toContain('DROP TABLE');
    });
  });

  describe('Performance', () => {
    it('handles large result sets efficiently', async () => {
      const largeProductSet = Array.from({ length: 1000 }, (_, i) =>
        createMockProduct({ id: `prod-${i}`, name: { en: `Product ${i}`, fr: `Produit ${i}` } })
      );

      mockPrisma.product.count.mockResolvedValue(largeProductSet.length);
      mockPrisma.product.findMany.mockResolvedValue(largeProductSet.slice(0, 50));

      const start = Date.now();
      
      const { req } = createMocks({
        method: 'GET',
        url: '/api/products?limit=50',
        query: { limit: '50' },
      });

      const response = await GET(req);
      const data = await response.json();
      
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(data.data.items).toHaveLength(50);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('implements proper database query optimization', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(mockProducts.length);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/products',
      });

      await GET(req);

      // Verify that the query includes proper relations and selections
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            category: true,
            manufacturer: true,
            discipline: true,
            images: true,
          }),
        })
      );
    });
  });
});