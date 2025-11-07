import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { mockProducts, mockCategories, mockManufacturers, mockUsers, mockRFPRequests } from '../fixtures/mock-data';

const handlers = [
  // Product API handlers
  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category');
    
    let filteredProducts = mockProducts;
    
    if (search) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.en.toLowerCase().includes(search.toLowerCase()) ||
        product.description.en.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category.slug === category
      );
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      success: true,
      data: {
        items: paginatedProducts,
        total: filteredProducts.length,
        page,
        pageSize: limit,
        totalPages: Math.ceil(filteredProducts.length / limit),
      },
    });
  }),

  http.get('/api/products/:slug', ({ params }) => {
    const product = mockProducts.find(p => p.slug === params.slug);
    if (!product) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: product });
  }),

  // Admin API handlers
  http.get('/api/admin/products', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = mockProducts.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      success: true,
      data: {
        items: paginatedProducts,
        total: mockProducts.length,
        page,
        pageSize: limit,
        totalPages: Math.ceil(mockProducts.length / limit),
      },
    });
  }),

  http.post('/api/admin/products', async ({ request }) => {
    const body = await request.json();
    const newProduct = {
      id: `prod-${Date.now()}`,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return HttpResponse.json({ success: true, data: newProduct }, { status: 201 });
  }),

  http.put('/api/admin/products/:id', async ({ params, request }) => {
    const body = await request.json();
    const product = mockProducts.find(p => p.id === params.id);
    if (!product) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }
    const updatedProduct = { ...product, ...body, updatedAt: new Date() };
    return HttpResponse.json({ success: true, data: updatedProduct });
  }),

  http.delete('/api/admin/products/:id', ({ params }) => {
    const productIndex = mockProducts.findIndex(p => p.id === params.id);
    if (productIndex === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, message: 'Product deleted successfully' });
  }),

  // Category API handlers
  http.get('/api/categories', () => {
    return HttpResponse.json({ success: true, data: mockCategories });
  }),

  // Manufacturer API handlers
  http.get('/api/manufacturers', () => {
    return HttpResponse.json({ success: true, data: mockManufacturers });
  }),

  // Auth API handlers
  http.post('/api/admin/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    if (body.email === 'admin@kitmed.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUsers[0],
          token: 'mock-jwt-token',
        },
      });
    }
    
    return HttpResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } },
      { status: 401 }
    );
  }),

  http.get('/api/admin/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({ success: true, data: mockUsers[0] });
  }),

  // RFP API handlers
  http.post('/api/rfp/submit', async ({ request }) => {
    const body = await request.json();
    const newRequest = {
      id: `rfp-${Date.now()}`,
      requestNumber: `RFP-${Date.now()}`,
      ...body,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: new Date(),
    };
    return HttpResponse.json({ success: true, data: newRequest }, { status: 201 });
  }),

  http.get('/api/admin/rfp-requests', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRequests = mockRFPRequests.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      success: true,
      data: {
        items: paginatedRequests,
        total: mockRFPRequests.length,
        page,
        pageSize: limit,
        totalPages: Math.ceil(mockRFPRequests.length / limit),
      },
    });
  }),

  // File upload handler
  http.post('/api/admin/upload', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return HttpResponse.json(
        { success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        url: `/uploads/${file.name}`,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
      },
    });
  }),

  // Dashboard stats
  http.get('/api/admin/dashboard/stats', () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalProducts: mockProducts.length,
        totalCategories: mockCategories.length,
        totalRFPRequests: mockRFPRequests.length,
        pendingRFPs: mockRFPRequests.filter(r => r.status === 'submitted').length,
      },
    });
  }),
];

export const server = setupServer(...handlers);