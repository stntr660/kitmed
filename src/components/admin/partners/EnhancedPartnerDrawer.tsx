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
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  GlobeAltIcon, 
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { Partner } from '@/types';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { PartnerTypeSelector } from './PartnerTypeSelector';

interface EnhancedPartnerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: Partner | null;
  mode: 'add' | 'edit' | 'view';
  onSave?: (partner: Partial<Partner>) => Promise<void>;
}

export function EnhancedPartnerDrawer({ 
  open, 
  onOpenChange, 
  partner, 
  mode,
  onSave 
}: EnhancedPartnerDrawerProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Partner>>({
    nom: { fr: '', en: '' },
    description: { fr: '', en: '' },
    websiteUrl: '',
    logoUrl: '',
    type: 'manufacturer',
    status: 'active',
    featured: false,
  });
  
  // UI State
  const [showInternationalFields, setShowInternationalFields] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(mode === 'add');
  const [linkedProducts, setLinkedProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (partner && open) {
      setFormData({
        nom: partner.nom || { fr: '', en: '' },
        description: partner.description || { fr: '', en: '' },
        websiteUrl: partner.websiteUrl || '',
        logoUrl: partner.logoUrl || '',
        type: partner.type || 'manufacturer',
        status: partner.status || 'active',
        featured: partner.featured || false,
      });
      setShowTypeSelection(false);
      
      // Load linked products if it's a manufacturer
      if (partner.type === 'manufacturer') {
        loadLinkedProducts(partner.nom.fr);
      }
    } else if (mode === 'add') {
      setFormData({
        nom: { fr: '', en: '' },
        description: { fr: '', en: '' },
        websiteUrl: '',
        logoUrl: '',
        type: 'manufacturer',
        status: 'active',
        featured: false,
      });
      setShowTypeSelection(true);
    }
  }, [partner, open, mode]);

  const loadLinkedProducts = async (manufacturerName: string) => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`/api/admin/products?constructeur=${encodeURIComponent(manufacturerName)}`);
      if (response.ok) {
        const data = await response.json();
        setLinkedProducts(data.data?.items || []);
      }
    } catch (error) {
      console.error('Failed to load linked products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    // Reset error state
    setError(null);
    
    // Validate required fields
    if (!formData.nom?.fr?.trim()) {
      setError(t('admin.partners.validation.nameRequired'));
      return;
    }

    if (!formData.type) {
      setError(t('admin.partners.validation.typeRequired'));
      return;
    }
    
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save partner:', error);
      setError(t('admin.errors.failedToSave'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Partner, value: any) => {
    if (mode === 'view') return;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If type changed to manufacturer and we have a name, load products
    if (field === 'type' && value === 'manufacturer' && formData.nom?.fr) {
      loadLinkedProducts(formData.nom.fr);
    }
  };

  const handleNestedInputChange = (field: 'nom' | 'description', lang: 'fr' | 'en', value: string) => {
    if (mode === 'view') return;
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value
      }
    }));
    
    // If manufacturer name changed, reload products
    if (field === 'nom' && lang === 'fr' && formData.type === 'manufacturer' && value.trim()) {
      loadLinkedProducts(value);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'add':
        return t('admin.partners.addNew');
      case 'edit':
        return t('admin.partners.editPartner');
      case 'view':
        return t('admin.partners.viewPartner');
      default:
        return t('admin.partners.partner');
    }
  };

  const getDescription = () => {
    if (formData.type === 'manufacturer') {
      return t('admin.partners.manufacturerDescription');
    }
    return t('admin.partners.generalDescription');
  };

  const isReadOnly = mode === 'view';
  const isManufacturer = formData.type === 'manufacturer';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
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
            {partner && (
              <div className="flex space-x-2 ml-4">
                <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>
                  {t(`admin.partners.status.${partner.status}`)}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {t(`admin.partners.types.${partner.type}.title`)}
                </Badge>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Partner Type Selection - Only for Add Mode */}
          {showTypeSelection && mode === 'add' && (
            <Card>
              <CardContent className="p-6">
                <PartnerTypeSelector
                  value={formData.type}
                  onChange={(type) => handleInputChange('type', type)}
                  disabled={isReadOnly}
                />
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <BuildingOfficeIcon className="h-5 w-5" />
                <span>{t('admin.partners.basicInformation')}</span>
                {isManufacturer && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    {t('admin.partners.manufacturerBadge')}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Partner Name */}
              <div className="space-y-2">
                <label htmlFor="nom-fr" className="text-sm font-semibold text-gray-900">
                  {isManufacturer 
                    ? t('admin.partners.manufacturerName') 
                    : t('admin.partners.partnerName')} *
                </label>
                <Input
                  id="nom-fr"
                  value={formData.nom?.fr || ''}
                  onChange={(e) => handleNestedInputChange('nom', 'fr', e.target.value)}
                  placeholder={isManufacturer 
                    ? t('admin.partners.manufacturerNamePlaceholder')
                    : t('admin.partners.partnerNamePlaceholder')
                  }
                  disabled={isReadOnly}
                  className="text-lg font-medium border-2 focus:border-blue-500"
                />
                {isManufacturer && (
                  <p className="text-xs text-blue-600 font-medium">
                    💡 {t('admin.partners.manufacturerNameHint')}
                  </p>
                )}
              </div>

              {/* Website URL */}
              <div className="space-y-2">
                <label htmlFor="website-url" className="text-sm font-semibold text-gray-700">
                  {t('admin.partners.websiteUrl')}
                </label>
                <div className="relative">
                  <GlobeAltIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="website-url"
                    value={formData.websiteUrl || ''}
                    onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                    placeholder={t('admin.partners.websiteUrlPlaceholder')}
                    disabled={isReadOnly}
                    type="url"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  {t('admin.partners.logo')}
                </label>
                <ImageDropzone
                  value={formData.logoUrl || ''}
                  onChange={(url) => handleInputChange('logoUrl', url)}
                  preset="partnerLogo"
                  placeholder="Logo du partenaire"
                  description="Glissez-déposez le logo ici, ou cliquez pour sélectionner un fichier (PNG, JPG - max 2MB)"
                  maxSize={2}
                  disabled={isReadOnly}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description-fr" className="text-sm font-semibold text-gray-700">
                  {t('admin.partners.description')}
                </label>
                <Textarea
                  id="description-fr"
                  value={formData.description?.fr || ''}
                  onChange={(e) => handleNestedInputChange('description', 'fr', e.target.value)}
                  placeholder={isManufacturer 
                    ? t('admin.partners.manufacturerDescriptionPlaceholder')
                    : t('admin.partners.descriptionPlaceholder')
                  }
                  disabled={isReadOnly}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Linked Products - Only for Manufacturers */}
          {isManufacturer && (mode === 'edit' || mode === 'view') && (
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center space-x-2">
                  <LinkIcon className="h-5 w-5" />
                  <span>{t('admin.partners.linkedProducts')}</span>
                  {linkedProducts.length > 0 && (
                    <Badge variant="secondary">{linkedProducts.length}</Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-blue-700">
                  {t('admin.partners.linkedProductsDescription')}
                </p>
              </CardHeader>
              <CardContent className="p-6">
                {loadingProducts ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="sm" text={t('admin.partners.loadingProducts')} />
                  </div>
                ) : linkedProducts.length > 0 ? (
                  <div className="space-y-3">
                    {linkedProducts.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {product.media?.[0] ? (
                            <img 
                              src={product.media[0].url} 
                              alt={product.nom}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-xs text-gray-500">IMG</span>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{product.nom}</p>
                          <p className="text-xs text-gray-500">
                            {t('admin.products.reference')}: {product.referenceFournisseur}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {product.status}
                        </Badge>
                      </div>
                    ))}
                    {linkedProducts.length > 5 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        +{linkedProducts.length - 5} {t('admin.partners.moreProducts')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">{t('admin.partners.noLinkedProducts')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* International Fields */}
          <Card className="border-blue-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GlobeAltIcon className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg font-medium text-gray-900">
                    {t('admin.partners.internationalVersion')}
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
            </CardHeader>
            
            {showInternationalFields && (
              <CardContent className="space-y-4 border-t border-blue-100 pt-4">
                <div className="space-y-2">
                  <label htmlFor="nom-en" className="text-sm font-medium text-gray-700">
                    {t('admin.partners.nameEnglish')}
                  </label>
                  <Input
                    id="nom-en"
                    value={formData.nom?.en || ''}
                    onChange={(e) => handleNestedInputChange('nom', 'en', e.target.value)}
                    placeholder={t('admin.partners.nameEnglishPlaceholder')}
                    disabled={isReadOnly}
                    className="font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description-en" className="text-sm font-medium text-gray-700">
                    {t('admin.partners.descriptionEnglish')}
                  </label>
                  <Textarea
                    id="description-en"
                    value={formData.description?.en || ''}
                    onChange={(e) => handleNestedInputChange('description', 'en', e.target.value)}
                    placeholder={t('admin.partners.descriptionEnglishPlaceholder')}
                    disabled={isReadOnly}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Status & Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">{t('admin.partners.visibility')}</CardTitle>
              <p className="text-sm text-gray-600">{t('admin.partners.visibilityDescription')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">
                      {t('admin.partners.makeVisible')}
                    </label>
                    <p className="text-xs text-gray-600">{t('admin.partners.makeVisibleDescription')}</p>
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
                      {t('admin.partners.statusOptions.visible')}
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">
                      {t('admin.partners.keepHidden')}
                    </label>
                    <p className="text-xs text-gray-600">{t('admin.partners.keepHiddenDescription')}</p>
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
                      {t('admin.partners.statusOptions.draft')}
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
                    {t('admin.partners.highlightPartner')}
                  </label>
                  <p className="text-xs text-gray-500">({t('admin.partners.highlightPartnerDescription')})</p>
                </div>
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
              disabled={loading || !formData.nom?.fr || !formData.type}
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