'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductFormData } from '@/types/admin';
import { Product } from '@/types';

interface ProductFormProps {
  product?: Product | null;
  onSave: (data: Product) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormData>({
    defaultValues: product ? {
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      sku: product.sku,
      categoryId: product.categoryId,
      manufacturerId: product.manufacturerId,
      disciplineId: product.disciplineId,
      tags: product.tags || [],
      status: product.status,
      featured: product.featured || false,
      specifications: product.specifications || [],
    } : {
      name: { en: '', ar: '' },
      description: { en: '', ar: '' },
      shortDescription: { en: '', ar: '' },
      sku: '',
      categoryId: '',
      tags: [],
      status: 'active',
      featured: false,
      specifications: [],
    }
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        sku: product.sku,
        categoryId: product.categoryId,
        manufacturerId: product.manufacturerId,
        disciplineId: product.disciplineId,
        tags: product.tags || [],
        status: product.status,
        featured: product.featured || false,
        specifications: product.specifications || [],
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);
      
      const url = product 
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products';
      
      const method = product ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const savedProduct = await response.json();
        onSave(savedProduct.data);
      } else {
        throw new Error('Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (English) *
              </label>
              <Input
                {...register('name.en', { required: 'English name is required' })}
                placeholder="Product name in English"
              />
              {errors.name?.en && (
                <p className="text-sm text-red-600 mt-1">{errors.name.en.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (Arabic) *
              </label>
              <Input
                {...register('name.ar', { required: 'Arabic name is required' })}
                placeholder="Product name in Arabic"
                dir="rtl"
              />
              {errors.name?.ar && (
                <p className="text-sm text-red-600 mt-1">{errors.name.ar.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU *
            </label>
            <Input
              {...register('sku', { required: 'SKU is required' })}
              placeholder="Product SKU"
            />
            {errors.sku && (
              <p className="text-sm text-red-600 mt-1">{errors.sku.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                {...register('status', { required: 'Status is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                {...register('featured')}
                className="rounded border-gray-300"
              />
              <label className="text-sm font-medium text-gray-700">
                Featured Product
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description (English)
              </label>
              <textarea
                {...register('shortDescription.en')}
                rows={3}
                placeholder="Brief product description in English"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description (Arabic)
              </label>
              <textarea
                {...register('shortDescription.ar')}
                rows={3}
                placeholder="Brief product description in Arabic"
                dir="rtl"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Description (English)
              </label>
              <textarea
                {...register('description.en')}
                rows={5}
                placeholder="Detailed product description in English"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Description (Arabic)
              </label>
              <textarea
                {...register('description.ar')}
                rows={5}
                placeholder="Detailed product description in Arabic"
                dir="rtl"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}