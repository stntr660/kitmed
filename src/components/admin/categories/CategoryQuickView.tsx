'use client';

import { useTranslations } from 'next-intl';
import {
  XMarkIcon,
  PencilIcon,
  RectangleGroupIcon,
  DocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';

interface CategoryTranslation {
  id: string;
  languageCode: string;
  name: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
  translations: CategoryTranslation[];
  children?: Category[];
  _count?: {
    children: number;
    products: number;
  };
  nom?: {
    fr: string;
    en?: string;
  };
  descriptionMultilingual?: {
    fr?: string;
    en?: string;
  };
}

interface CategoryQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onEdit: () => void;
}

export function CategoryQuickView({
  open,
  onOpenChange,
  category,
  onEdit
}: CategoryQuickViewProps) {
  const t = useTranslations();

  if (!category) return null;

  const frTranslation = category.translations.find(t => t.languageCode === 'fr');
  const enTranslation = category.translations.find(t => t.languageCode === 'en');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {/* Category Icon */}
              <div className="h-16 w-16 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                ) : (
                  <RectangleGroupIcon className="h-8 w-8 text-primary-600" />
                )}
              </div>

              {/* Category Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {category.nom?.fr || category.name}
                  </h1>
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? (
                      <><EyeIcon className="h-3 w-3 mr-1" />{t('admin.active')}</>
                    ) : (
                      <><EyeSlashIcon className="h-3 w-3 mr-1" />{t('admin.inactive')}</>
                    )}
                  </Badge>
                  {category.metaTitle && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <GlobeAltIcon className="h-3 w-3 mr-1" />SEO
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <RectangleGroupIcon className="h-4 w-4" />
                    <span>{category._count?.children || 0} {t('admin.categories.subcategories')}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <DocumentIcon className="h-4 w-4" />
                    <span>{category._count?.products || 0} {t('admin.products.products')}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{t('admin.created')}: {formatDate(category.createdAt)}</span>
                  </span>
                </div>

                {category.descriptionMultilingual?.fr && (
                  <p className="mt-3 text-gray-700 leading-relaxed">
                    {category.descriptionMultilingual.fr}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={onEdit}
                className="flex items-center space-x-2"
              >
                <PencilIcon className="h-4 w-4" />
                <span>{t('common.edit')}</span>
              </Button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('admin.categories.basicInformation')}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      {t('admin.categories.slug')}
                    </label>
                    <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                      {category.slug}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      {t('admin.categories.sortOrder')}
                    </label>
                    <p className="text-sm text-gray-900">{category.sortOrder}</p>
                  </div>

                  {category.imageUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        {t('admin.categories.imageUrl')}
                      </label>
                      <p className="text-sm text-gray-900 break-all">{category.imageUrl}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SEO Information */}
              {(frTranslation?.metaTitle || frTranslation?.metaDescription || 
                enTranslation?.metaTitle || enTranslation?.metaDescription) && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('admin.categories.seoInformation')}
                  </h2>
                  
                  {/* French SEO */}
                  {(frTranslation?.metaTitle || frTranslation?.metaDescription) && (
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-700 mb-2">Français</h3>
                      <div className="space-y-2">
                        {frTranslation?.metaTitle && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Meta Title
                            </label>
                            <p className="text-sm text-gray-900">{frTranslation.metaTitle}</p>
                          </div>
                        )}
                        {frTranslation?.metaDescription && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Meta Description
                            </label>
                            <p className="text-sm text-gray-900">{frTranslation.metaDescription}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* English SEO */}
                  {(enTranslation?.metaTitle || enTranslation?.metaDescription) && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">English</h3>
                      <div className="space-y-2">
                        {enTranslation?.metaTitle && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Meta Title
                            </label>
                            <p className="text-sm text-gray-900">{enTranslation.metaTitle}</p>
                          </div>
                        )}
                        {enTranslation?.metaDescription && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Meta Description
                            </label>
                            <p className="text-sm text-gray-900">{enTranslation.metaDescription}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Multilingual Content */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('admin.categories.translations')}
                </h2>
                
                <div className="space-y-6">
                  {/* French Content */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3 flex items-center space-x-2">
                      <span className="w-6 h-4 bg-blue-500 rounded-sm"></span>
                      <span>Français</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          {t('admin.categories.categoryName')}
                        </label>
                        <p className="text-sm text-gray-900">{frTranslation?.name || category.name}</p>
                      </div>
                      {frTranslation?.description && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {t('admin.categories.description')}
                          </label>
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {frTranslation.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* English Content */}
                  {(enTranslation?.name || enTranslation?.description) && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-3 flex items-center space-x-2">
                        <span className="w-6 h-4 bg-red-500 rounded-sm"></span>
                        <span>English</span>
                      </h3>
                      <div className="space-y-3">
                        {enTranslation?.name && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              {t('admin.categories.categoryName')}
                            </label>
                            <p className="text-sm text-gray-900">{enTranslation.name}</p>
                          </div>
                        )}
                        {enTranslation?.description && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              {t('admin.categories.description')}
                            </label>
                            <p className="text-sm text-gray-900 leading-relaxed">
                              {enTranslation.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* System Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('admin.categories.systemInformation')}
                </h2>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      {t('admin.categories.categoryId')}
                    </label>
                    <p className="text-sm text-gray-900 font-mono">{category.id}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      {t('admin.created')}
                    </label>
                    <p className="text-sm text-gray-900">{formatDate(category.createdAt)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      {t('admin.categories.lastUpdated')}
                    </label>
                    <p className="text-sm text-gray-900">{formatDate(category.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subcategories Preview */}
          {category.children && category.children.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('admin.categories.subcategories')} ({category.children.length})
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.children.slice(0, 6).map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                      {child.imageUrl ? (
                        <img
                          src={child.imageUrl}
                          alt={child.name}
                          className="h-6 w-6 rounded object-cover"
                        />
                      ) : (
                        <RectangleGroupIcon className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {child.nom?.fr || child.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {child._count?.products || 0} {t('admin.products.products')}
                      </p>
                    </div>
                  </div>
                ))}
                
                {category.children.length > 6 && (
                  <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm text-gray-600">
                      +{category.children.length - 6} {t('admin.categories.more')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}