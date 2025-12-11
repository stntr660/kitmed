'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  BuildingOfficeIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
  CogIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CompactImageUpload } from '@/components/ui/compact-image-upload';
import { DocumentUpload } from '@/components/ui/document-upload';
import { Partner } from '@/types';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PartnerCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: Partner | null;
  mode: 'add' | 'edit';
  onSave: (partnerData: Partial<Partner>) => Promise<void>;
}

export function PartnerCreationWizard({
  open,
  onOpenChange,
  partner,
  mode,
  onSave
}: PartnerCreationWizardProps) {
  const t = useTranslations();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    nom: { fr: '', en: '' },
    description: { fr: '', en: '' },
    websiteUrl: '',
    logoUrl: '',
    defaultPdfUrl: '',
    type: 'manufacturer' as 'manufacturer' | 'other',
    status: 'active' as 'active' | 'inactive',
    featured: false,
  });

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Define wizard steps
  const steps: WizardStep[] = [
    {
      id: 'type',
      title: t('admin.partners.wizard.step1.title'),
      description: t('admin.partners.wizard.step1.description'),
      icon: BuildingOfficeIcon,
    },
    {
      id: 'basic',
      title: t('admin.partners.wizard.step2.title'),
      description: t('admin.partners.wizard.step2.description'),
      icon: InformationCircleIcon,
    },
    {
      id: 'details',
      title: t('admin.partners.wizard.step3.title'),
      description: t('admin.partners.wizard.step3.description'),
      icon: PhotoIcon,
    },
    {
      id: 'settings',
      title: t('admin.partners.wizard.step4.title'),
      description: t('admin.partners.wizard.step4.description'),
      icon: CogIcon,
    },
  ];

  // For edit mode, skip the type step since we can't change the type
  const getEffectiveSteps = () => {
    if (mode === 'edit') {
      return steps.slice(1); // Skip type selection for edit
    }
    return steps;
  };

  const effectiveSteps = getEffectiveSteps();
  const effectiveCurrentStep = currentStep;

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && partner) {
        setFormData({
          nom: partner.nom || { fr: '', en: '' },
          description: partner.description || { fr: '', en: '' },
          websiteUrl: partner.websiteUrl || '',
          logoUrl: partner.logoUrl || '',
          defaultPdfUrl: partner.defaultPdfUrl || '',
          type: partner.type || 'manufacturer',
          status: partner.status || 'active',
          featured: partner.featured || false,
        });
        setCurrentStep(0); // Start from basic info for editing
      } else {
        // Reset form for new partner
        setFormData({
          nom: { fr: '', en: '' },
          description: { fr: '', en: '' },
          websiteUrl: '',
          logoUrl: '',
          defaultPdfUrl: '',
          type: 'manufacturer',
          status: 'active',
          featured: false,
        });
        setCurrentStep(0);
      }
      setError(null);
    }
  }, [open, mode, partner]);

  const handleInputChange = (field: string, value: any, lang?: string) => {
    setFormData(prev => {
      if (lang && (field === 'nom' || field === 'description')) {
        return {
          ...prev,
          [field]: {
            ...prev[field as keyof typeof prev],
            [lang]: value
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

  const canProceedToNext = () => {
    const currentStepData = effectiveSteps[effectiveCurrentStep];

    switch (currentStepData.id) {
      case 'type':
        return true; // Always can proceed from type selection
      case 'basic':
        return formData.nom.fr.trim().length > 0;
      case 'details':
        return true; // Details are optional
      case 'settings':
        return true; // Settings are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (effectiveCurrentStep < effectiveSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (effectiveCurrentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);

    try {
      // Validation
      if (!formData.nom.fr.trim()) {
        throw new Error(t('admin.partners.validation.nameRequired'));
      }

      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {effectiveSteps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
            ${index <= effectiveCurrentStep
              ? 'bg-primary-600 border-primary-600 text-white'
              : 'bg-white border-gray-300 text-gray-500'
            }
          `}>
            {index < effectiveCurrentStep ? (
              <CheckIcon className="w-6 h-6" />
            ) : (
              <span className="text-sm font-semibold">{index + 1}</span>
            )}
          </div>
          {index < effectiveSteps.length - 1 && (
            <div className={`
              w-12 h-0.5 mx-2 transition-colors
              ${index < effectiveCurrentStep ? 'bg-primary-600' : 'bg-gray-300'}
            `} />
          )}
        </div>
      ))}
    </div>
  );

  const getPartnerTypeIcon = (type: string) => {
    switch (type) {
      case 'manufacturer':
        return BuildingOfficeIcon;
      case 'other':
        return InformationCircleIcon;
      default:
        return BuildingOfficeIcon;
    }
  };

  const renderStepContent = () => {
    const currentStepData = effectiveSteps[effectiveCurrentStep];

    switch (currentStepData.id) {
      case 'type':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('admin.partners.wizard.selectPartnerType')}
              </h3>
              <p className="text-gray-600 mb-8">
                {t('admin.partners.wizard.selectPartnerTypeDescription')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all border-2 ${
                  formData.type === 'manufacturer'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('type', 'manufacturer')}
              >
                <CardContent className="p-6 text-center">
                  <BuildingOfficeIcon className={`w-12 h-12 mx-auto mb-4 ${
                    formData.type === 'manufacturer' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t('admin.partners.types.manufacturer.title')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('admin.partners.types.manufacturer.description')}
                  </p>
                  <div className="mt-4 text-xs text-blue-600 font-medium">
                    🔗 {t('admin.partners.types.manufacturer.badge')}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Ex: Philips Healthcare, Siemens Healthineers
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all border-2 ${
                  formData.type === 'other'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('type', 'other')}
              >
                <CardContent className="p-6 text-center">
                  <InformationCircleIcon className={`w-12 h-12 mx-auto mb-4 ${
                    formData.type === 'other' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t('admin.partners.types.other.title')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('admin.partners.types.other.description')}
                  </p>
                  <div className="mt-4 text-xs text-gray-500">
                    Ex: {t('admin.partners.types.other.examples')}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'basic':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('admin.partners.wizard.basicPartnerInformation')}
              </h3>
              <p className="text-gray-600">
                {t('admin.partners.wizard.basicPartnerInformationDescription')}
              </p>
            </div>

            <div className="space-y-6">
              {/* Partner Type Display */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const IconComponent = getPartnerTypeIcon(formData.type);
                    return <IconComponent className="h-6 w-6 text-gray-600" />;
                  })()}
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      {t('admin.partners.wizard.partnerType')}:
                    </span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {t(`admin.partners.types.${formData.type}.title`)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Partner Name (French) */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('admin.partners.wizard.partnerNameFrench')} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.nom.fr}
                  onChange={(e) => handleInputChange('nom', e.target.value, 'fr')}
                  placeholder={t('admin.partners.wizard.partnerNameFrenchPlaceholder')}
                  className="h-14 text-base"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.partners.wizard.primaryNameHint')}
                </p>
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('admin.partners.wizard.websiteUrl')}
                </label>
                <div className="relative">
                  <GlobeAltIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                    placeholder="https://example.com"
                    type="url"
                    className="pl-10 h-14 text-base"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.partners.wizard.websiteUrlHint')}
                </p>
              </div>

              {/* Short Description (French) */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('admin.partners.wizard.briefDescriptionFrench')}
                </label>
                <Textarea
                  value={formData.description.fr}
                  onChange={(e) => handleInputChange('description', e.target.value, 'fr')}
                  placeholder={t('admin.partners.wizard.briefDescriptionPlaceholder')}
                  rows={3}
                  className="text-base resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.partners.wizard.briefDescriptionHint')}
                </p>
              </div>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('admin.partners.wizard.additionalDetails')}
              </h3>
              <p className="text-gray-600">
                {t('admin.partners.wizard.additionalDetailsDescription')}
              </p>
            </div>

            {/* Partner Logo */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                {t('admin.partners.wizard.partnerLogo')}
              </label>
              <div className="flex items-start space-x-4">
                <CompactImageUpload
                  value={formData.logoUrl}
                  onChange={(url) => handleInputChange('logoUrl', url)}
                  preset="partnerLogo"
                  size="lg"
                  shape="square"
                  placeholder="Upload partner logo"
                  className="flex-shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-gray-700">
                    {t('admin.partners.wizard.partnerLogoDescription')}
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• {t('admin.partners.wizard.logoFormatSupported')}</li>
                    <li>• {t('admin.partners.wizard.logoSizeLimit')}</li>
                    <li>• {t('admin.partners.wizard.logoRecommendation')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Default PDF Brochure */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Default PDF Brochure
              </label>
              <div className="space-y-3">
                <DocumentUpload
                  value={formData.defaultPdfUrl}
                  onChange={(url) => handleInputChange('defaultPdfUrl', url)}
                  preset="partnerBrochure"
                  placeholder="Upload default PDF brochure"
                  label="Default Manufacturer Brochure"
                  maxSize={25}
                />
                <p className="text-sm text-gray-600">
                  Upload a default PDF brochure that will be used for products without their own PDF.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• This PDF will be shown as a fallback for products without individual PDFs</li>
                  <li>• Helps ensure all products have documentation available</li>
                  <li>• Customers can download the manufacturer's general catalog when product-specific docs aren't available</li>
                </ul>
              </div>
            </div>

            {/* English Translation */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <GlobeAltIcon className="w-5 h-5 mr-2 text-blue-600" />
                {t('admin.partners.wizard.internationalVersion')}
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.partners.wizard.partnerNameEnglish')}
                  </label>
                  <Input
                    value={formData.nom.en}
                    onChange={(e) => handleInputChange('nom', e.target.value, 'en')}
                    placeholder={t('admin.partners.wizard.partnerNameEnglishPlaceholder')}
                    className="h-12 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.partners.wizard.descriptionEnglish')}
                  </label>
                  <Textarea
                    value={formData.description.en}
                    onChange={(e) => handleInputChange('description', e.target.value, 'en')}
                    placeholder={t('admin.partners.wizard.descriptionEnglishPlaceholder')}
                    rows={3}
                    className="text-base resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('admin.partners.wizard.visibilitySettings')}
              </h3>
              <p className="text-gray-600">
                {t('admin.partners.wizard.visibilitySettingsDescription')}
              </p>
            </div>

            {/* Visibility Settings */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                {formData.status === 'active' ? (
                  <EyeIcon className="w-5 h-5 mr-2 text-green-600" />
                ) : (
                  <EyeSlashIcon className="w-5 h-5 mr-2 text-gray-600" />
                )}
                {t('admin.partners.wizard.partnerVisibility')}
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">
                      {t('admin.partners.wizard.makeVisible')}
                    </label>
                    <p className="text-xs text-gray-600">{t('admin.partners.wizard.makeVisibleDescription')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="status-active"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <label htmlFor="status-active" className="text-sm text-gray-700">
                      {t('admin.partners.wizard.visible')}
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">
                      {t('admin.partners.wizard.keepHidden')}
                    </label>
                    <p className="text-xs text-gray-600">{t('admin.partners.wizard.keepHiddenDescription')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="status-inactive"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
                    />
                    <label htmlFor="status-inactive" className="text-sm text-gray-700">
                      {t('admin.partners.wizard.draft')}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Partner */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                {t('admin.partners.wizard.specialSettings')}
              </h4>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div>
                  <label className="font-medium text-gray-900">
                    {t('admin.partners.wizard.featuredPartner')}
                  </label>
                  <p className="text-sm text-gray-600">
                    {t('admin.partners.wizard.featuredPartnerDescription')}
                  </p>
                </div>
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleInputChange('featured', checked)}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {mode === 'add'
                ? t('admin.partners.wizard.addNewPartner')
                : t('admin.partners.wizard.editPartner')
              }
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {effectiveSteps[effectiveCurrentStep].description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Step Content */}
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={effectiveCurrentStep === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>{t('admin.partners.wizard.previous')}</span>
          </Button>

          <div className="text-sm text-gray-500">
            {t('admin.partners.wizard.stepOf', {
              current: effectiveCurrentStep + 1,
              total: effectiveSteps.length
            })}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>

            {effectiveCurrentStep === effectiveSteps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={saving || !canProceedToNext()}
                className="bg-primary-600 hover:bg-primary-700 min-w-[120px]"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('admin.partners.wizard.saving')}
                  </>
                ) : (
                  mode === 'add' ? t('admin.partners.wizard.createPartner') : t('admin.partners.wizard.updatePartner')
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="bg-primary-600 hover:bg-primary-700 flex items-center space-x-2 min-w-[120px]"
              >
                <span>{t('admin.partners.wizard.next')}</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}