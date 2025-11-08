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
import { XMarkIcon, PhotoIcon, ChevronDownIcon, ChevronUpIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
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
    referenceFournisseur: '',
    constructeur: '',
    categoryId: '',
    nom: { en: '', fr: '' },
    description: { en: '', fr: '' },
    ficheTechnique: { en: '', fr: '' },
    pdfBrochureUrl: '',
    status: 'active',
    featured: false,
  });
  
  // Progressive disclosure state
  const [showInternationalFields, setShowInternationalFields] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  useEffect(() => {
    if (product && open) {
      setFormData({
        referenceFournisseur: product.referenceFournisseur || '',
        constructeur: product.constructeur || '',
        categoryId: product.categoryId || '',
        nom: product.nom || { en: '', fr: '' },
        description: product.description || { en: '', fr: '' },
        ficheTechnique: product.ficheTechnique || { en: '', fr: '' },
        pdfBrochureUrl: product.pdfBrochureUrl || '',
        status: product.status || 'active',
        featured: product.featured || false,
      });
    } else if (mode === 'add') {
      setFormData({
        referenceFournisseur: '',
        constructeur: '',
        categoryId: '',
        nom: { en: '', fr: '' },
        description: { en: '', fr: '' },
        ficheTechnique: { en: '', fr: '' },
        pdfBrochureUrl: '',
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

  const handleNestedInputChange = (field: 'nom' | 'description' | 'ficheTechnique', lang: 'en' | 'fr', value: string) => {
    if (mode === 'view') return;
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value
      }
    }));
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
        return t('admin.products.addDescription');
      case 'edit':
        return t('admin.products.editDescription');
      case 'view':
        return t('admin.products.viewDescription');
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

        <div className="space-y-6">
          {/* Primary Information - French First */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">{t('admin.products.essentialInfo')}</CardTitle>
              <p className="text-sm text-gray-600">{t('admin.products.essentialInfoDescription')}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Name - French Primary */}
              <div className="space-y-2">
                <label htmlFor="nom-fr" className="text-sm font-semibold text-gray-900">
                  {t('admin.products.productName')} *
                </label>
                <Input
                  id="nom-fr"
                  value={formData.nom?.fr || ''}
                  onChange={(e) => handleNestedInputChange('nom', 'fr', e.target.value)}
                  placeholder={t('admin.products.productNamePlaceholder')}
                  disabled={isReadOnly}
                  className="text-lg font-medium border-2 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">{t('admin.products.productNameHint')}</p>
              </div>

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <label htmlFor="constructeur" className="text-sm font-semibold text-gray-700">
                    {t('admin.products.brand')} *
                  </label>
                  <Input
                    id="constructeur"
                    value={formData.constructeur || ''}
                    onChange={(e) => handleInputChange('constructeur', e.target.value)}
                    placeholder={t('admin.products.brandPlaceholder')}
                    disabled={isReadOnly}
                    className="font-medium"
                  />
                  <p className="text-xs text-gray-500">{t('admin.products.brandHint')}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="reference-fournisseur" className="text-sm font-semibold text-gray-700">
                    {t('admin.products.referenceCode')} *
                  </label>
                  <Input
                    id="reference-fournisseur"
                    value={formData.referenceFournisseur || ''}
                    onChange={(e) => handleInputChange('referenceFournisseur', e.target.value)}
                    placeholder={t('admin.products.referenceCodePlaceholder')}
                    disabled={isReadOnly}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">{t('admin.products.referenceCodeHint')}</p>
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <label htmlFor="categoryId" className="text-sm font-semibold text-gray-700">
                  {t('admin.products.medicalDiscipline')} *
                </label>
                <select
                  id="categoryId"
                  value={formData.categoryId || ''}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  disabled={isReadOnly}
                  className="flex h-12 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{t('admin.products.selectDiscipline')}</option>
                  <option value="cardiology">{t('admin.products.categories.cardiology')}</option>
                  <option value="radiology">{t('admin.products.categories.radiology')}</option>
                  <option value="surgery">{t('admin.products.categories.surgery')}</option>
                  <option value="laboratory">{t('admin.products.categories.laboratory')}</option>
                  <option value="emergency">{t('admin.products.categories.emergency')}</option>
                  <option value="icu">{t('admin.products.categories.icu')}</option>
                </select>
                <p className="text-xs text-gray-500">{t('admin.products.disciplineHint')}</p>
              </div>

              {/* Simple Description */}
              <div className="space-y-2">
                <label htmlFor="description-fr" className="text-sm font-semibold text-gray-700">
                  {t('admin.products.shortDescription')}
                </label>
                <Textarea
                  id="description-fr"
                  value={formData.description?.fr || ''}
                  onChange={(e) => handleNestedInputChange('description', 'fr', e.target.value)}
                  placeholder={t('admin.products.shortDescriptionPlaceholder')}
                  disabled={isReadOnly}
                  rows={2}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">{t('admin.products.shortDescriptionHint')}</p>
              </div>
            </CardContent>
          </Card>

          {/* International Fields - Collapsible */}
          <Card className="border-blue-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GlobeAltIcon className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg font-medium text-gray-900">
                    {t('admin.products.internationalVersion')}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {t('common.optional')}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInternationalFields(!showInternationalFields)}
                  disabled={isReadOnly}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showInternationalFields ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                  <span className="ml-1 text-sm">
                    {showInternationalFields ? t('common.hide') : t('common.show')}
                  </span>
                </Button>
              </div>
              <p className="text-sm text-blue-600">{t('admin.products.internationalDescription')}</p>
            </CardHeader>
            
            {showInternationalFields && (
              <CardContent className="space-y-4 border-t border-blue-100 pt-4">
                <div className="space-y-2">
                  <label htmlFor="nom-en" className="text-sm font-medium text-gray-700">
                    {t('admin.products.productNameEnglish')}
                  </label>
                  <Input
                    id="nom-en"
                    value={formData.nom?.en || ''}
                    onChange={(e) => handleNestedInputChange('nom', 'en', e.target.value)}
                    placeholder={t('admin.products.productNameEnglishPlaceholder')}
                    disabled={isReadOnly}
                    className="font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description-en" className="text-sm font-medium text-gray-700">
                    {t('admin.products.descriptionEnglish')}
                  </label>
                  <Textarea
                    id="description-en"
                    value={formData.description?.en || ''}
                    onChange={(e) => handleNestedInputChange('description', 'en', e.target.value)}
                    placeholder={t('admin.products.descriptionEnglishPlaceholder')}
                    disabled={isReadOnly}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Advanced Details - Collapsible */}
          <Card className="border-amber-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg font-medium text-gray-900">
                    {t('admin.products.technicalDetails')}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {t('common.optional')}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                  disabled={isReadOnly}
                  className="text-amber-600 hover:text-amber-700"
                >
                  {showAdvancedFields ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                  <span className="ml-1 text-sm">
                    {showAdvancedFields ? t('common.hide') : t('common.show')}
                  </span>
                </Button>
              </div>
              <p className="text-sm text-amber-600">{t('admin.products.technicalDetailsDescription')}</p>
            </CardHeader>
            
            {showAdvancedFields && (
              <CardContent className="space-y-4 border-t border-amber-100 pt-4">
                <div className="space-y-2">
                  <label htmlFor="fiche-technique-fr" className="text-sm font-medium text-gray-700">
                    {t('admin.products.specifications')}
                  </label>
                  <Textarea
                    id="fiche-technique-fr"
                    value={formData.ficheTechnique?.fr || ''}
                    onChange={(e) => handleNestedInputChange('ficheTechnique', 'fr', e.target.value)}
                    placeholder={t('admin.products.specificationsPlaceholder')}
                    disabled={isReadOnly}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">{t('admin.products.specificationsHint')}</p>
                </div>

                {showInternationalFields && (
                  <div className="space-y-2">
                    <label htmlFor="fiche-technique-en" className="text-sm font-medium text-gray-700">
                      {t('admin.products.specificationsEnglish')}
                    </label>
                    <Textarea
                      id="fiche-technique-en"
                      value={formData.ficheTechnique?.en || ''}
                      onChange={(e) => handleNestedInputChange('ficheTechnique', 'en', e.target.value)}
                      placeholder={t('admin.products.specificationsEnglishPlaceholder')}
                      disabled={isReadOnly}
                      rows={4}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="pdf-brochure" className="text-sm font-medium text-gray-700">
                    {t('admin.products.brochureDocument')}
                  </label>
                  <Input
                    id="pdf-brochure"
                    value={formData.pdfBrochureUrl || ''}
                    onChange={(e) => handleInputChange('pdfBrochureUrl', e.target.value)}
                    placeholder={t('admin.products.brochureDocumentPlaceholder')}
                    disabled={isReadOnly}
                    type="url"
                  />
                  <p className="text-xs text-gray-500">{t('admin.products.brochureDocumentHint')}</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Status & Settings - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">{t('admin.products.visibility')}</CardTitle>
              <p className="text-sm text-gray-600">{t('admin.products.visibilityDescription')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">
                      {t('admin.products.makeVisible')}
                    </label>
                    <p className="text-xs text-gray-600">{t('admin.products.makeVisibleDescription')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="status-active"
                      name="status"
                      value="active"
                      checked={(formData.status || 'active') === 'active'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      disabled={isReadOnly}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <label htmlFor="status-active" className="text-sm text-gray-700">
                      {t('admin.products.statusOptions.visible')}
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">
                      {t('admin.products.keepHidden')}
                    </label>
                    <p className="text-xs text-gray-600">{t('admin.products.keepHiddenDescription')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="status-inactive"
                      name="status"
                      value="inactive"
                      checked={(formData.status || 'active') === 'inactive'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      disabled={isReadOnly}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
                    />
                    <label htmlFor="status-inactive" className="text-sm text-gray-700">
                      {t('admin.products.statusOptions.draft')}
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured || false}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    disabled={isReadOnly}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    {t('admin.products.highlightProduct')}
                  </label>
                  <p className="text-xs text-gray-500">({t('admin.products.highlightProductDescription')})</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">{t('admin.products.media')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  {t('admin.products.mediaDescription')}
                </p>
                <Button variant="outline" disabled={isReadOnly}>
                  {t('admin.products.uploadMedia')}
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
              disabled={loading || !formData.nom?.fr || !formData.referenceFournisseur || !formData.constructeur || !formData.categoryId}
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