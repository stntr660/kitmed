'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  SparklesIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProductDrawer } from './ProductDrawer';
import { ProductQuickView } from './ProductQuickView';
import { CSVUpload } from './CSVUpload';
import type { ImportResult } from './CSVUpload';
import { AdminSearchFilters, AdminSearchResult } from '@/types/admin';
import { Product } from '@/types';
import { formatDate, truncate } from '@/lib/utils';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { getAdminToken } from '@/lib/auth-utils';

interface ProductWithDetails extends Product {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    media: number;
    rfpItems: number;
  };
  media?: Array<{
    id: string;
    url: string;
    type: string;
    isPrimary: boolean;
  }>;
}

interface UnifiedProductListProps {
  initialFilters?: Partial<AdminSearchFilters>;
}

export function UnifiedProductList({ initialFilters = {} }: UnifiedProductListProps) {
  const t = useTranslations();
  const { canCreate, canUpdate, canDelete, canImport, canExport, isAdmin } = useAdminPermissions();
  
  // Data state
  const [products, setProducts] = useState<AdminSearchResult<ProductWithDetails> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<AdminSearchFilters>({
    query: '',
    status: [],
    category: [],
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/admin/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${getAdminToken()}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
      } else {
        throw new Error('Failed to load products');
      }
    } catch (err) {
      setError(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  // Unified action handlers
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  };

  const handleEditProduct = (product: ProductWithDetails) => {
    setSelectedProduct(product);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleQuickView = (product: ProductWithDetails) => {
    setSelectedProduct(product);
    setQuickViewOpen(true);
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const url = drawerMode === 'add' 
        ? '/api/admin/products' 
        : `/api/admin/products/${selectedProduct?.id}`;
      
      const method = drawerMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const result = await response.json();
        await loadProducts();
        setDrawerOpen(false);
        setSelectedProduct(null);
        return result.data; // Return the created/updated product
      } else {
        throw new Error('Failed to save product');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm(t('common.confirm') + ' ' + t('common.delete') + '?')) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAdminToken()}`,
        },
      });

      if (response.ok) {
        await loadProducts();
      }
    } catch (error) {
      // Handle error silently
    }
  };

  // Filter handlers
  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status?.includes(status) 
        ? prev.status.filter(s => s !== status)
        : [...(prev.status || []), status],
      page: 1,
    }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Selection handlers
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (!products) return;
    
    const allSelected = products.items.every(product => 
      selectedProducts.includes(product.id)
    );
    
    if (allSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.items.map(product => product.id));
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProducts.length === 0) return;

    try {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({
          action,
          productIds: selectedProducts,
        }),
      });

      if (response.ok) {
        await loadProducts();
        setSelectedProducts([]);
      }
    } catch (err) {
      // Handle bulk action error silently
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/products/export', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify(filters),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-export-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      // Handle export error silently
    }
  };

  const handleImportComplete = (result: ImportResult) => {
    if (result.success) {
      loadProducts(); // Refresh the product list
      setShowCSVUpload(false); // Close the upload section
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'discontinued':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading && !products) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('navigation.products')}</h1>
        </div>
        <LoadingSpinner size="lg" text={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('navigation.products')}</h1>
          <p className="mt-2 text-gray-600">
            {t('admin.manageProducts')}
          </p>
        </div>
        <div className="flex space-x-3">
          {canExport('products') && (
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>{t('common.export')}</span>
            </Button>
          )}
          {canImport('products') && (
            <Button
              variant="outline"
              onClick={() => setShowCSVUpload(!showCSVUpload)}
              className="flex items-center space-x-2"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              <span>{t('product.form.bulkImport.title')}</span>
            </Button>
          )}
          {canCreate('products') && (
            <Button
              onClick={handleAddProduct}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('common.add')} {t('navigation.products')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* CSV Upload Section */}
      {showCSVUpload && (
        <CSVUpload onImportComplete={handleImportComplete} />
      )}

      {/* Filters & Search */}
      <Card className="border border-gray-200/60">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t('common.searchPlaceholder')}
                  value={filters.query || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              {['active', 'inactive', 'discontinued'].map((status) => (
                <Button
                  key={status}
                  variant={filters.status?.includes(status) ? 'default' : 'outline'}
                  onClick={() => handleStatusFilter(status)}
                  className="capitalize h-12 px-6"
                >
                  {t(`admin.products.status.${status}`, { defaultValue: status })}
                </Button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && isAdmin && (
            <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary-700">
                  {selectedProducts.length} {selectedProducts.length === 1 ? t('admin.productSelected') : t('admin.productsSelected')}
                </span>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('activate')}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    {t('admin.activate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('deactivate')}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    {t('admin.deactivate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border border-gray-200/60">
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadProducts} variant="outline">
                {t('errors.tryAgain')}
              </Button>
            </div>
          ) : products?.items && products.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {isAdmin && (
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={products.items.every(product => 
                            selectedProducts.includes(product.id)
                          )}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 h-5 w-5"
                        />
                      </th>
                    )}
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      {t('navigation.products')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('sku')}
                    >
                      {t('admin.sku')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.category')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      {t('admin.status')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.media')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('createdAt')}
                    >
                      {t('admin.created')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.items.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="rounded border-gray-300 h-5 w-5"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {product.media && product.media.length > 0 ? (
                              <Image
                                src={product.media.find(m => m.isPrimary)?.url || product.media[0]?.url}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = `
                                    <div class="w-full h-full bg-primary-100 flex items-center justify-center">
                                      <span class="text-sm font-medium text-primary-600">${product.name.charAt(0)}</span>
                                    </div>
                                  `;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <PhotoIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {truncate(product.name, 50)}
                            </div>
                            {product.shortDescription && (
                              <div className="text-sm text-gray-600 mt-1">
                                {truncate(product.shortDescription.fr || product.shortDescription.en || '', 70)}
                              </div>
                            )}
                            {product.featured && (
                              <Badge variant="outline" className="mt-1 text-amber-600 border-amber-200 bg-amber-50">
                                <SparklesIcon className="h-3 w-3 mr-1" />
                                {t('product.featured')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <Badge variant="outline" className="bg-gray-50">
                          {product.category?.name?.fr || product.category?.name?.en || product.category?.name || t('admin.uncategorized')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusColor(product.status)}>
                          {t(`admin.products.status.${product.status}`, { defaultValue: product.status })}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product._count?.media || 0} {t('admin.files')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(product.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickView(product)}
                            className="hover:bg-blue-50 hover:text-blue-700"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {canUpdate('products') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditProduct(product)}
                              className="hover:bg-amber-50 hover:text-amber-700"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete('products') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <PlusIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('search.noResults')}</h3>
              <p className="text-gray-600 mb-6">{t('admin.getStartedProducts')}</p>
              <Button onClick={handleAddProduct} className="bg-primary-600 hover:bg-primary-700">
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('admin.addFirstProduct')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {products && products.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700 font-medium">
            {t('search.showingResults', {
              start: ((products.page - 1) * products.pageSize) + 1,
              end: Math.min(products.page * products.pageSize, products.total),
              total: products.total
            })}
          </p>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={products.page === 1}
              onClick={() => handlePageChange(products.page - 1)}
              className="h-10 px-4"
            >
              {t('common.previous')}
            </Button>
            
            {[...Array(Math.min(5, products.totalPages))].map((_, i) => {
              const page = products.page - 2 + i;
              if (page < 1 || page > products.totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={page === products.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="h-10 w-10"
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              disabled={products.page === products.totalPages}
              onClick={() => handlePageChange(products.page + 1)}
              className="h-10 px-4"
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Product Drawer for Add/Edit */}
      <ProductDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        product={selectedProduct}
        mode={drawerMode}
        onSave={handleSaveProduct}
      />

      {/* Quick View Modal */}
      <ProductQuickView
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        product={selectedProduct}
        onEdit={() => {
          setQuickViewOpen(false);
          handleEditProduct(selectedProduct!);
        }}
        onViewDetails={() => {
          // Future: Navigate to detailed view if needed
          setQuickViewOpen(false);
        }}
      />
    </div>
  );
}