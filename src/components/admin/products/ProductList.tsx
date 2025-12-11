'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, MagnifyingGlassIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AdminSearchResult } from '@/types/admin';
import { Product } from '@/types';
import { formatDate, truncate } from '@/lib/utils';

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
}

interface ProductListProps {
  initialFilters?: Partial<AdminSearchFilters>;
}

interface AdminSearchFilters {
  query?: string;
  status?: string[];
  category?: string[];
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function ProductList({ initialFilters = {} }: ProductListProps) {
  const t = useTranslations();
  const router = useRouter();
  const [products, setProducts] = useState<AdminSearchResult<ProductWithDetails> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const [filters, setFilters] = useState<AdminSearchFilters>({
    query: '',
    status: [],
    category: [],
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
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

      const response = await fetch(`/api/admin/products?${params}`);

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
      } else {
        throw new Error('Failed to load products');
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

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

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

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
        headers: { 'Content-Type': 'application/json' },
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
      console.error('Bulk action failed:', err);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/products/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      console.error('Export failed:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'yellow';
      case 'discontinued':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading && !products) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">{t('navigation.products')}</h1>
        </div>
        <LoadingSpinner size="lg" text={t('admin.errors.failedToLoadProducts', {defaultValue: 'Loading products...'})} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('navigation.products')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('admin.manageProducts')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/products/import')}
          >
            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
            {t('product.form.bulkImport.title')}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
          <Button onClick={() => router.push('/admin/products/new')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('common.add')} {t('navigation.products')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t('common.searchPlaceholder')}
                  value={filters.query || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {['active', 'inactive', 'discontinued'].map((status) => (
                <Button
                  key={status}
                  variant={filters.status?.includes(status) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter(status)}
                  className="capitalize"
                >
                  {t(`admin.products.status.${status}`, { defaultValue: status })}
                </Button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedProducts.length} {selectedProducts.length === 1 ? t('admin.productSelected') : t('admin.productsSelected')}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('activate')}
                  >
                    {t('admin.activate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('deactivate')}
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
      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">{error}</p>
              <Button onClick={loadProducts} className="mt-4" variant="outline">
                {t('errors.retry')}
              </Button>
            </div>
          ) : products?.items && products.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={products.items.every(product =>
                          selectedProducts.includes(product.id)
                        )}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('nom')}
                    >
                      {t('navigation.products')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('referenceFournisseur')}
                    >
                      {t('common.reference')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('common.manufacturer')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.category')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      {t('admin.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.media')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      {t('admin.created')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.items.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-200 rounded-lg mr-3 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {product.nom?.fr?.charAt(0) || product.nom?.en?.charAt(0) || 'P'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {truncate(product.nom?.fr || product.nom?.en || t('common.productWithoutName'), 40)}
                            </div>
                            {product.description && (
                              <div className="text-sm text-gray-500">
                                {truncate(product.description?.fr || product.description?.en || '', 60)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {product.referenceFournisseur}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.constructeur}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.category?.name?.fr || product.category?.name?.en || product.category?.name || t('admin.uncategorized')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusColor(product.status) as any}>
                          {t(`admin.products.status.${product.status}`, { defaultValue: product.status })}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product._count?.media || 0} {t('admin.files')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(product.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/admin/products/${product.id}`)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">{t('search.noResults')}</p>
              <Button
                onClick={() => router.push('/admin/products/new')}
                className="mt-4"
              >
                {t('admin.addFirstProduct')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {products && products.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
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
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}