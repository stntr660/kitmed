'use client';

import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  PencilIcon, 
  EyeIcon, 
  CalendarIcon,
  TagIcon,
  CubeIcon 
} from '@heroicons/react/24/outline';
import { Product } from '@/types';
import { formatDate } from '@/lib/utils';

interface ProductWithDetails extends Product {
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    media: number;
    rfpItems: number;
  };
}

interface ProductQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithDetails | null;
  onEdit?: () => void;
  onViewDetails?: () => void;
}

export function ProductQuickView({ 
  open, 
  onOpenChange, 
  product, 
  onEdit,
  onViewDetails 
}: ProductQuickViewProps) {
  const t = useTranslations();

  if (!product) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'discontinued':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <CubeIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold text-gray-900 font-poppins line-clamp-2">
                    {product.name}
                  </SheetTitle>
                  <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Badge className={getStatusColor(product.status)}>
                  {product.status}
                </Badge>
                {product.featured && (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                    Featured
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-primary-50 border-primary-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {product._count?.media || 0}
                </div>
                <p className="text-xs text-primary-700 font-medium">Media Files</p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {product._count?.rfpItems || 0}
                </div>
                <p className="text-xs text-green-700 font-medium">RFP Requests</p>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">
                  <TagIcon className="h-6 w-6 mx-auto" />
                </div>
                <p className="text-xs text-amber-700 font-medium">Category</p>
              </CardContent>
            </Card>
          </div>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.shortDescription && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Short Description</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {product.shortDescription}
                  </p>
                </div>
              )}

              {product.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Full Description</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Category:</span>
                  <p className="text-gray-600 mt-1">
                    {product.category?.name || t('uncategorized')}
                  </p>
                </div>
                
                <div>
                  <span className="font-semibold text-gray-700">Created:</span>
                  <p className="text-gray-600 mt-1 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(product.createdAt)}
                  </p>
                </div>
              </div>

              {product.updatedAt && product.updatedAt !== product.createdAt && (
                <div className="text-sm">
                  <span className="font-semibold text-gray-700">Last Updated:</span>
                  <p className="text-gray-600 mt-1 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(product.updatedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Media & Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="h-16 w-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <CubeIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {product._count?.media || 0} media files
                </p>
                <Button variant="outline" size="sm">
                  View All Media
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Product created</span>
                  <span className="text-gray-400 ml-auto">
                    {formatDate(product.createdAt)}
                  </span>
                </div>
                
                {product.updatedAt && product.updatedAt !== product.createdAt && (
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Product updated</span>
                    <span className="text-gray-400 ml-auto">
                      {formatDate(product.updatedAt)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t mt-8 pt-6 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onEdit}
              className="flex items-center justify-center space-x-2"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Edit Product</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={onViewDetails}
              className="flex items-center justify-center space-x-2"
            >
              <EyeIcon className="h-4 w-4" />
              <span>Full Details</span>
            </Button>
          </div>
          
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}