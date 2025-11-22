'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@/types';
import { formatDate } from '@/lib/utils';

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const t = useTranslations();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'discontinued':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{product.nom?.fr || product.nom?.en || product.name || t('common.productWithoutName')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('common.sku')}: {product.sku}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(product.status)}>
            {t(`admin.products.status.${product.status}`, { defaultValue: product.status })}
          </Badge>
          {product.featured && (
            <Badge variant="secondary">{t('product.featured')}</Badge>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('product.basicInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('common.name')} ({t('common.french')})</label>
              <p className="mt-1 text-sm text-gray-900">{product.nom?.fr || t('common.notSpecified')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('common.name')} ({t('common.english')})</label>
              <p className="mt-1 text-sm text-gray-900">{product.nom?.en || t('common.notSpecified')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('common.sku')}</label>
              <p className="mt-1 text-sm text-gray-900">{product.sku}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('admin.status')}</label>
              <div className="mt-1">
                <Badge className={getStatusColor(product.status)}>
                  {t(`admin.products.status.${product.status}`, { defaultValue: product.status })}
                </Badge>
              </div>
            </div>
          </div>

          {product.categoryId && (
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('admin.category')}</label>
              <p className="mt-1 text-sm text-gray-900">{product.categoryId}</p>
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('common.tags')}</label>
              <div className="mt-1 flex flex-wrap gap-1">
                {product.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>{t('product.description')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {product.shortDescription && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('product.shortDescriptionLabel')} ({t('common.french')})</label>
                <p className="mt-1 text-sm text-gray-900">{product.shortDescription?.fr || t('common.notSpecified')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('product.shortDescriptionLabel')} ({t('common.english')})</label>
                <p className="mt-1 text-sm text-gray-900">{product.shortDescription?.en || t('common.notSpecified')}</p>
              </div>
            </div>
          )}

          {product.description && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('product.fullDescription')} ({t('common.french')})</label>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {product.description?.fr || t('common.notSpecified')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('product.fullDescription')} ({t('common.english')})</label>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {product.description?.en || t('common.notSpecified')}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specifications */}
      {product.specifications && product.specifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('product.specifications')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('common.specification')}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('common.value')}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('common.unit')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {product.specifications.map((spec, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {spec.name || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {spec.value || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {spec.unit || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>{t('product.metadata')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('product.createdAt')}</label>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(product.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('product.lastUpdated')}</label>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(product.updatedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}