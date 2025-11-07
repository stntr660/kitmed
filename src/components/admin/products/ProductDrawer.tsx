'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Product } from '@/types';

interface ProductDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  mode: 'add' | 'edit' | 'view';
  onSave?: (product: Partial<Product>) => Promise<void>;
}

export function ProductDrawer({ 
  open, 
  onOpenChange, 
  product, 
  mode,
  onSave 
}: ProductDrawerProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    shortDescription: '',
    description: '',
    status: 'active',
    featured: false,
  });

  useEffect(() => {
    if (product && open) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        status: product.status || 'active',
        featured: product.featured || false,
      });
    } else if (mode === 'add') {
      setFormData({
        name: '',
        sku: '',
        shortDescription: '',
        description: '',
        status: 'active',
        featured: false,
      });
    }
  }, [product, open, mode]);

  const handleSave = async () => {
    if (!onSave) return;
    
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    if (mode === 'view') return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTitle = () => {
    switch (mode) {
      case 'add':
        return t('admin.addNew') + ' ' + t('navigation.products');
      case 'edit':
        return t('admin.edit') + ' ' + t('navigation.products');
      case 'view':
        return t('product.viewProduct');
      default:
        return t('navigation.products');
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'add':
        return 'Add new medical equipment to your catalog';
      case 'edit':
        return 'Update product information and specifications';
      case 'view':
        return 'View detailed product information';
      default:
        return '';
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="border-b pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="text-2xl font-bold text-gray-900 font-poppins">
                {getTitle()}
              </SheetTitle>
              <SheetDescription className="text-gray-600">
                {getDescription()}
              </SheetDescription>
            </div>
            {product && (
              <Badge 
                variant={product.status === 'active' ? 'default' : 'secondary'}
                className="ml-4"
              >
                {product.status}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="product-name" className="text-sm font-semibold text-gray-700">
                    Product Name *
                  </label>
                  <Input
                    id="product-name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                    disabled={isReadOnly}
                    className="font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="product-sku" className="text-sm font-semibold text-gray-700">
                    SKU *
                  </label>
                  <Input
                    id="product-sku"
                    value={formData.sku || ''}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Enter product SKU"
                    disabled={isReadOnly}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="short-description" className="text-sm font-semibold text-gray-700">
                  Short Description
                </label>
                <Textarea
                  id="short-description"
                  value={formData.shortDescription || ''}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Brief product description (1-2 lines)"
                  disabled={isReadOnly}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-semibold text-gray-700">
                  Full Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed product description"
                  disabled={isReadOnly}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status & Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">Status & Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-semibold text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    disabled={isReadOnly}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Featured Product
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured || false}
                      onChange={(e) => handleInputChange('featured', e.target.checked)}
                      disabled={isReadOnly}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="text-sm text-gray-700">
                      Display as featured product
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Product images and documentation will be managed here
                </p>
                <Button variant="outline" disabled={isReadOnly}>
                  Upload Media
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t mt-8 pt-6 pb-6 flex justify-between space-x-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            {mode === 'view' ? t('common.close') : t('common.cancel')}
          </Button>
          
          {mode !== 'view' && (
            <Button
              onClick={handleSave}
              disabled={loading || !formData.name || !formData.sku}
              className="flex-1"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {mode === 'add' ? t('common.add') : t('common.save')}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}