'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  XMarkIcon,
  PhotoIcon,
  GlobeAltIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ImageUploadBox } from '@/components/ui/image-upload-box';

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

interface CategoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  parentCategory: Category | null;
  mode: 'add' | 'edit';
  onSave: (categoryData: any) => Promise<void>;
}

export function CategoryDrawer({
  open,
  onOpenChange,
  category,
  parentCategory,
  mode,
  onSave
}: CategoryDrawerProps) {
  const t = useTranslations();

  // Form state
  const [formData, setFormData] = useState({
    translations: {
      fr: {
        name: '',
        description: '',
        metaTitle: '',
        metaDescription: '',
      },
      en: {
        name: '',
        description: '',
        metaTitle: '',
        metaDescription: '',
      }
    },
    sortOrder: 0,
    isActive: true,
    imageUrl: '',
  });

  // UI state
  const [showEnglishFields, setShowEnglishFields] = useState(false);
  const [showSeoFields, setShowSeoFields] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && category) {
        const frTranslation = category.translations.find(t => t.languageCode === 'fr');
        const enTranslation = category.translations.find(t => t.languageCode === 'en');

        setFormData({
          translations: {
            fr: {
              name: frTranslation?.name || category.name,
              description: frTranslation?.description || category.description || '',
              metaTitle: frTranslation?.metaTitle || category.metaTitle || '',
              metaDescription: frTranslation?.metaDescription || category.metaDescription || '',
            },
            en: {
              name: enTranslation?.name || '',
              description: enTranslation?.description || '',
              metaTitle: enTranslation?.metaTitle || '',
              metaDescription: enTranslation?.metaDescription || '',
            }
          },
          sortOrder: category.sortOrder,
          isActive: category.isActive,
          imageUrl: category.imageUrl || '',
        });

        // Show English fields if they have content
        setShowEnglishFields(!!(
          enTranslation?.name || 
          enTranslation?.description
        ));

        // Show SEO fields if they have content
        setShowSeoFields(!!(
          frTranslation?.metaTitle ||
          frTranslation?.metaDescription ||
          enTranslation?.metaTitle ||
          enTranslation?.metaDescription
        ));
      } else {
        // Reset form for new category
        setFormData({
          translations: {
            fr: { name: '', description: '', metaTitle: '', metaDescription: '' },
            en: { name: '', description: '', metaTitle: '', metaDescription: '' }
          },
          sortOrder: 0,
          isActive: true,
          imageUrl: '',
        });
        setShowEnglishFields(false);
        setShowSeoFields(false);
      }
      setError(null);
    }
  }, [open, mode, category]);

  const handleInputChange = (field: string, value: any, lang?: string) => {
    setFormData(prev => {
      if (lang && field.startsWith('translations.')) {
        const subField = field.replace('translations.', '');
        return {
          ...prev,
          translations: {
            ...prev.translations,
            [lang]: {
              ...prev.translations[lang as keyof typeof prev.translations],
              [subField]: value
            }
          }
        };
      } else {
        return {
          ...prev,
          [field]: value
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validation
      if (!formData.translations.fr.name.trim()) {
        throw new Error(t('admin.categories.validation.nameRequired'));
      }

      await onSave(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const getTitle = () => {
    if (mode === 'add') {
      return parentCategory 
        ? t('admin.categories.addSubcategory')
        : t('admin.categories.addCategory');
    }
    return t('admin.categories.editCategory');
  };

  const getDescription = () => {
    if (mode === 'add') {
      return parentCategory 
        ? t('admin.categories.addSubcategoryDescription')
        : t('admin.categories.addDescription');
    }
    return t('admin.categories.editDescription');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
              <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
              {parentCategory && (
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {t('admin.categories.parentCategory')}: {parentCategory.nom?.fr || parentCategory.name}
                  </Badge>
                </div>
              )}
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </Button>
          </div>

          <div className="p-6 space-y-8">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Essential Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <InformationCircleIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('admin.categories.essentialInfo')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('admin.categories.essentialInfoDescription')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* French Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('admin.categories.categoryName')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.translations.fr.name}
                    onChange={(e) => handleInputChange('translations.name', e.target.value, 'fr')}
                    placeholder={t('admin.categories.categoryNamePlaceholder')}
                    className="h-12 text-base"
                    required
                  />
                  {formData.translations.fr.name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Slug: {generateSlug(formData.translations.fr.name)}
                    </p>
                  )}
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('admin.categories.sortOrder')}
                  </label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                    className="h-12 text-base"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('admin.categories.sortOrderHint')}
                  </p>
                </div>
              </div>

              {/* French Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('admin.categories.shortDescription')}
                </label>
                <Textarea
                  value={formData.translations.fr.description}
                  onChange={(e) => handleInputChange('translations.description', e.target.value, 'fr')}
                  placeholder={t('admin.categories.shortDescriptionPlaceholder')}
                  rows={3}
                  className="text-base"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.categories.shortDescriptionHint')}
                </p>
              </div>

              {/* Category Image */}
              <div>
                <ImageUploadBox
                  label={t('admin.categories.categoryImage')}
                  value={formData.imageUrl}
                  onChange={(url) => handleInputChange('imageUrl', url)}
                  preset="productImage"
                  placeholder="Télécharger une image pour la catégorie"
                  maxSize={2}
                  aspectRatio="square"
                />
              </div>
            </div>

            {/* International Version Toggle */}
            <div className="border-t border-gray-200 pt-8">
              <button
                type="button"
                onClick={() => setShowEnglishFields(!showEnglishFields)}
                className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <GlobeAltIcon className="h-5 w-5 text-gray-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">
                      {t('admin.categories.internationalVersion')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t('admin.categories.internationalDescription')}
                    </p>
                  </div>
                </div>
                <ChevronDownIcon 
                  className={`h-5 w-5 text-gray-600 transition-transform ${
                    showEnglishFields ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {showEnglishFields && (
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* English Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t('admin.categories.categoryNameEnglish')}
                      </label>
                      <Input
                        value={formData.translations.en.name}
                        onChange={(e) => handleInputChange('translations.name', e.target.value, 'en')}
                        placeholder={t('admin.categories.categoryNameEnglishPlaceholder')}
                        className="h-12 text-base"
                      />
                    </div>
                  </div>

                  {/* English Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('admin.categories.descriptionEnglish')}
                    </label>
                    <Textarea
                      value={formData.translations.en.description}
                      onChange={(e) => handleInputChange('translations.description', e.target.value, 'en')}
                      placeholder={t('admin.categories.descriptionEnglishPlaceholder')}
                      rows={3}
                      className="text-base"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SEO Fields Toggle */}
            <div className="border-t border-gray-200 pt-8">
              <button
                type="button"
                onClick={() => setShowSeoFields(!showSeoFields)}
                className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <GlobeAltIcon className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">
                      {t('admin.categories.seoOptimization')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t('admin.categories.seoDescription')}
                    </p>
                  </div>
                </div>
                <ChevronDownIcon 
                  className={`h-5 w-5 text-gray-600 transition-transform ${
                    showSeoFields ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {showSeoFields && (
                <div className="mt-6 space-y-6">
                  {/* French SEO */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Français</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t('admin.categories.metaTitle')}
                        </label>
                        <Input
                          value={formData.translations.fr.metaTitle}
                          onChange={(e) => handleInputChange('translations.metaTitle', e.target.value, 'fr')}
                          placeholder={t('admin.categories.metaTitlePlaceholder')}
                          className="h-12 text-base"
                          maxLength={60}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.translations.fr.metaTitle.length}/60 caractères
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t('admin.categories.metaDescription')}
                        </label>
                        <Textarea
                          value={formData.translations.fr.metaDescription}
                          onChange={(e) => handleInputChange('translations.metaDescription', e.target.value, 'fr')}
                          placeholder={t('admin.categories.metaDescriptionPlaceholder')}
                          rows={2}
                          className="text-base"
                          maxLength={160}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.translations.fr.metaDescription.length}/160 caractères
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* English SEO */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">English</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t('admin.categories.metaTitle')}
                        </label>
                        <Input
                          value={formData.translations.en.metaTitle}
                          onChange={(e) => handleInputChange('translations.metaTitle', e.target.value, 'en')}
                          placeholder={t('admin.categories.metaTitlePlaceholderEn')}
                          className="h-12 text-base"
                          maxLength={60}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.translations.en.metaTitle.length}/60 characters
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t('admin.categories.metaDescription')}
                        </label>
                        <Textarea
                          value={formData.translations.en.metaDescription}
                          onChange={(e) => handleInputChange('translations.metaDescription', e.target.value, 'en')}
                          placeholder={t('admin.categories.metaDescriptionPlaceholderEn')}
                          rows={2}
                          className="text-base"
                          maxLength={160}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.translations.en.metaDescription.length}/160 characters
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category Visibility */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  {formData.isActive ? (
                    <EyeIcon className="h-5 w-5 text-primary-600" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('admin.categories.visibility')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('admin.categories.visibilityDescription')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">
                    {formData.isActive ? t('admin.categories.makeVisible') : t('admin.categories.keepHidden')}
                  </label>
                  <p className="text-sm text-gray-600">
                    {formData.isActive 
                      ? t('admin.categories.makeVisibleDescription')
                      : t('admin.categories.keepHiddenDescription')
                    }
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={saving || !formData.translations.fr.name.trim()}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('admin.categories.saving')}
                </>
              ) : (
                mode === 'add' ? t('admin.categories.createCategory') : t('admin.categories.updateCategory')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}