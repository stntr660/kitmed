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
import { ChevronDownIcon, ChevronUpIcon, GlobeAltIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { Partner } from '@/types';
import { ImageDropzone } from '@/components/ui/image-dropzone';

interface PartnerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: Partner | null;
  mode: 'add' | 'edit' | 'view';
  onSave?: (partner: Partial<Partner>) => Promise<void>;
}

export function PartnerDrawer({
  open,
  onOpenChange,
  partner,
  mode,
  onSave
}: PartnerDrawerProps) {
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

  // Progressive disclosure state
  const [showInternationalFields, setShowInternationalFields] = useState(false);

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
    }
  }, [partner, open, mode]);

  const handleSave = async () => {
    if (!onSave) return;

    // Reset error state
    setError(null);

    // Validate required fields
    if (!formData.nom?.fr?.trim()) {
      setError(t('admin.partners.validation.nameRequired'));
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
  };

  const getTitle = () => {
    switch (mode) {
      case 'add':
        return t('admin.addNew') + ' ' + t('admin.partners.partner');
      case 'edit':
        return t('admin.edit') + ' ' + t('admin.partners.partner');
      case 'view':
        return t('admin.partners.viewPartner');
      default:
        return t('admin.partners.partner');
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'add':
        return t('admin.partners.addDescription');
      case 'edit':
        return t('admin.partners.editDescription');
      case 'view':
        return t('admin.partners.viewDescription');
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
            {partner && (
              <Badge
                variant={partner.status === 'active' ? 'default' : 'secondary'}
                className="ml-4"
              >
                {t(`admin.partners.status.${partner.status}`, { defaultValue: partner.status })}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Primary Information - French First */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">{t('admin.partners.essentialInfo')}</CardTitle>
              <p className="text-sm text-gray-600">{t('admin.partners.essentialInfoDescription')}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Partner Name - French Primary */}
              <div className="space-y-2">
                <label htmlFor="nom-fr" className="text-sm font-semibold text-gray-900">
                  {t('admin.partners.partnerName')} *
                </label>
                <Input
                  id="nom-fr"
                  value={formData.nom?.fr || ''}
                  onChange={(e) => handleNestedInputChange('nom', 'fr', e.target.value)}
                  placeholder={t('admin.partners.partnerNamePlaceholder')}
                  disabled={isReadOnly}
                  className="text-lg font-medium border-2 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">{t('admin.partners.partnerNameHint')}</p>
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
                <p className="text-xs text-gray-500">{t('admin.partners.websiteUrlHint')}</p>
              </div>

              {/* Partner Type */}
              <div className="space-y-2">
                <label htmlFor="partner-type" className="text-sm font-semibold text-gray-700">
                  {t('admin.partners.type')} *
                </label>
                <div className="relative">
                  <BuildingOfficeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    id="partner-type"
                    value={formData.type || 'manufacturer'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    disabled={isReadOnly}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="manufacturer">{t('admin.partners.types.manufacturer.title')}</option>
                    <option value="distributor">{t('admin.partners.types.distributor.title')}</option>
                    <option value="service">{t('admin.partners.types.service.title')}</option>
                    <option value="technology">{t('admin.partners.types.technology.title')}</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500">
                  {formData.type === 'manufacturer' && t('admin.partners.types.manufacturer.description')}
                  {formData.type === 'distributor' && t('admin.partners.types.distributor.description')}
                  {formData.type === 'service' && t('admin.partners.types.service.description')}
                  {formData.type === 'technology' && t('admin.partners.types.technology.description')}
                </p>
              </div>

              {/* Partner Logo */}
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

              {/* Simple Description */}
              <div className="space-y-2">
                <label htmlFor="description-fr" className="text-sm font-semibold text-gray-700">
                  {t('admin.partners.shortDescription')}
                </label>
                <Textarea
                  id="description-fr"
                  value={formData.description?.fr || ''}
                  onChange={(e) => handleNestedInputChange('description', 'fr', e.target.value)}
                  placeholder={t('admin.partners.shortDescriptionPlaceholder')}
                  disabled={isReadOnly}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">{t('admin.partners.shortDescriptionHint')}</p>
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
              <p className="text-sm text-blue-600">{t('admin.partners.internationalDescription')}</p>
            </CardHeader>

            {showInternationalFields && (
              <CardContent className="space-y-4 border-t border-blue-100 pt-4">
                <div className="space-y-2">
                  <label htmlFor="nom-en" className="text-sm font-medium text-gray-700">
                    {t('admin.partners.partnerNameEnglish')}
                  </label>
                  <Input
                    id="nom-en"
                    value={formData.nom?.en || ''}
                    onChange={(e) => handleNestedInputChange('nom', 'en', e.target.value)}
                    placeholder={t('admin.partners.partnerNameEnglishPlaceholder')}
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
              disabled={loading || !formData.nom?.fr}
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