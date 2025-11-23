'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  RectangleGroupIcon,
  WrenchScrewdriverIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CompactImageUpload } from '@/components/ui/compact-image-upload';
import { getAdminToken } from '@/lib/auth-utils';

interface CategoryTranslation {
  id: string;
  languageCode: string;
  name: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type?: 'discipline' | 'equipment';
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string;
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

type CategoryType = 'discipline' | 'equipment';

interface Discipline {
  id: string;
  name: string;
  nom?: {
    fr: string;
    en?: string;
  };
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CategoryCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  parentCategory: Category | null;
  mode: 'add' | 'edit';
  onSave: (categoryData: any) => Promise<void>;
}

export function CategoryCreationWizard({
  open,
  onOpenChange,
  category,
  parentCategory,
  mode,
  onSave
}: CategoryCreationWizardProps) {
  const t = useTranslations();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [categoryType, setCategoryType] = useState<CategoryType>('discipline');
  
  // Discipline state
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('');
  const [disciplinesLoading, setDisciplinesLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    translations: {
      fr: {
        name: '',
        description: '',
      },
      en: {
        name: '',
        description: '',
      }
    },
    sortOrder: 0,
    isActive: true,
    imageUrl: '',
  });

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch disciplines when component mounts
  useEffect(() => {
    if (open) {
      fetchDisciplines();
    }
  }, [open]);

  const fetchDisciplines = async () => {
    setDisciplinesLoading(true);
    
    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/admin/categories?hierarchical=true&isActive=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch disciplines: ${response.status}`);
      }

      const data = await response.json();
      // Filter to get only top-level categories (disciplines)
      const allCategories = data.data?.items || [];
      const disciplines = allCategories.filter((category: any) => !category.parentId);
      
      const disciplineList = disciplines.map((discipline: any) => ({
        id: discipline.id,
        name: discipline.name,
        nom: {
          fr: discipline.nom?.fr || discipline.name,
          en: discipline.nom?.en || '',
        }
      }));
      
      setDisciplines(disciplineList);
    } catch (error) {
      console.error('Error fetching disciplines:', error);
      setError(`Failed to load disciplines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDisciplinesLoading(false);
    }
  };

  // Define wizard steps
  const steps: WizardStep[] = [
    {
      id: 'type',
      title: t('admin.categories.wizard.step1.title'),
      description: t('admin.categories.wizard.step1.description'),
      icon: RectangleGroupIcon,
    },
    {
      id: 'discipline',
      title: t('admin.categories.wizard.disciplineStep.title'),
      description: t('admin.categories.wizard.disciplineStep.description'),
      icon: InformationCircleIcon,
    },
    {
      id: 'basic',
      title: t('admin.categories.wizard.step2.title'),
      description: t('admin.categories.wizard.step2.description'),
      icon: InformationCircleIcon,
    },
    {
      id: 'details',
      title: t('admin.categories.wizard.step3.title'),
      description: t('admin.categories.wizard.step3.description'),
      icon: GlobeAltIcon,
    },
  ];

  // For edit mode, skip the type step
  // For disciplines, skip the discipline selection step
  const getEffectiveSteps = () => {
    let filteredSteps = steps;
    
    if (mode === 'edit') {
      filteredSteps = filteredSteps.slice(1); // Skip type selection for edit
    }
    
    if (categoryType === 'discipline') {
      filteredSteps = filteredSteps.filter(step => step.id !== 'discipline');
    }
    
    return filteredSteps;
  };
  
  const effectiveSteps = getEffectiveSteps();
  const effectiveCurrentStep = Math.min(currentStep, effectiveSteps.length - 1);

  // Reset current step when category type changes
  useEffect(() => {
    const effectiveSteps = getEffectiveSteps();
    if (currentStep >= effectiveSteps.length) {
      setCurrentStep(Math.max(0, effectiveSteps.length - 1));
    }
  }, [categoryType, mode]);

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
            },
            en: {
              name: enTranslation?.name || '',
              description: enTranslation?.description || '',
            }
          },
          sortOrder: category.sortOrder,
          isActive: category.isActive,
          imageUrl: category.imageUrl || '',
        });
        setCurrentStep(0); // Start from basic info for editing
      } else {
        // Reset form for new category
        setFormData({
          translations: {
            fr: { name: '', description: '' },
            en: { name: '', description: '' }
          },
          sortOrder: 0,
          isActive: true,
          imageUrl: '',
        });
        setCurrentStep(0);
        setCategoryType('discipline');
        setSelectedDisciplineId('');
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const canProceedToNext = () => {
    const currentStepData = effectiveSteps[effectiveCurrentStep];
    
    switch (currentStepData.id) {
      case 'type':
        return true; // Always can proceed from type selection
      case 'discipline':
        return categoryType === 'discipline' || (selectedDisciplineId.trim().length > 0 && disciplines.length > 0);
      case 'basic':
        return formData.translations.fr.name.trim().length > 0;
      case 'details':
        return true; // Details are optional
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
      if (!formData.translations.fr.name.trim()) {
        throw new Error(t('admin.categories.validation.nameRequired'));
      }

      // Equipment categories MUST have a parent discipline
      if (categoryType === 'equipment' && (!selectedDisciplineId || !selectedDisciplineId.trim())) {
        throw new Error('Equipment categories must be linked to a parent discipline');
      }

      const finalFormData = {
        ...formData,
        type: categoryType,
        parentId: categoryType === 'equipment' && selectedDisciplineId && selectedDisciplineId.trim() ? selectedDisciplineId : formData.parentId || null,
      };
      
      console.log('🔥 WIZARD SENDING:', JSON.stringify({
        type: categoryType,
        selectedDisciplineId,
        parentId: finalFormData.parentId,
        finalType: finalFormData.type
      }, null, 2));

      await onSave(finalFormData);
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

  const renderStepContent = () => {
    const currentStepData = effectiveSteps[effectiveCurrentStep];

    switch (currentStepData.id) {
      case 'type':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('admin.categories.wizard.selectCategoryType')}
              </h3>
              <p className="text-gray-600 mb-8">
                {t('admin.categories.wizard.selectCategoryTypeDescription')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all border-2 ${
                  categoryType === 'discipline' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCategoryType('discipline')}
              >
                <CardContent className="p-6 text-center">
                  <RectangleGroupIcon className={`w-12 h-12 mx-auto mb-4 ${
                    categoryType === 'discipline' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t('admin.categories.wizard.disciplineCategory')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('admin.categories.wizard.disciplineCategoryDescription')}
                  </p>
                  <div className="mt-4 text-xs text-gray-500">
                    Ex: Cardiologie, Radiologie, Chirurgie
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all border-2 ${
                  categoryType === 'equipment' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCategoryType('equipment')}
              >
                <CardContent className="p-6 text-center">
                  <WrenchScrewdriverIcon className={`w-12 h-12 mx-auto mb-4 ${
                    categoryType === 'equipment' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t('admin.categories.wizard.equipmentCategory')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('admin.categories.wizard.equipmentCategoryDescription')}
                  </p>
                  <div className="mt-4 text-xs text-gray-500">
                    Ex: Moniteurs, Échographes, Tables d'opération
                  </div>
                </CardContent>
              </Card>
            </div>

            {parentCategory && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {t('admin.categories.wizard.parentCategoryInfo')}
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {t('admin.categories.wizard.parentCategoryIs')}: {parentCategory.nom?.fr || parentCategory.name}
                </p>
              </div>
            )}
          </div>
        );

      case 'discipline':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('admin.categories.wizard.selectMedicalDiscipline')}
              </h3>
              <p className="text-gray-600 mb-8">
                {categoryType === 'equipment' 
                  ? t('admin.categories.wizard.linkEquipmentToDiscipline')
                  : t('admin.categories.wizard.createTopLevelDiscipline')
                }
              </p>
            </div>

            {categoryType === 'equipment' && (
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('admin.categories.wizard.selectDiscipline')} <span className="text-red-500">*</span>
                </label>
                
                {!disciplinesLoading && disciplines.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-medium text-amber-900 mb-1">{t('admin.categories.wizard.noDisciplinesFound')}</h4>
                        <p className="text-sm text-amber-700 mb-3">
                          {t('admin.categories.wizard.noDisciplinesFoundDescription')}
                        </p>
                        <p className="text-xs text-amber-600">
                          {t('admin.categories.wizard.noDisciplinesFoundHint')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedDisciplineId}
                      onChange={(e) => setSelectedDisciplineId(e.target.value)}
                      className="w-full h-14 text-base border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="">
                        {disciplinesLoading ? t('admin.categories.wizard.loadingDisciplines') : t('admin.categories.wizard.selectADiscipline')}
                      </option>
                      {disciplines.map((discipline) => (
                        <option key={discipline.id} value={discipline.id}>
                          {discipline.nom?.fr || discipline.name}
                        </option>
                      ))}
                    </select>
                    
                    <p className="text-xs text-gray-500">
                      {t('admin.categories.wizard.equipmentCategoriesHint')}
                    </p>
                  </>
                )}
              </div>
            )}

            {categoryType === 'discipline' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <RectangleGroupIcon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h4 className="font-semibold text-gray-900 mb-2">
                  {t('admin.categories.wizard.creatingNewDiscipline')}
                </h4>
                <p className="text-sm text-blue-700">
                  {t('admin.categories.wizard.creatingNewDisciplineDescription')}
                </p>
              </div>
            )}
          </div>
        );

      case 'basic':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('admin.categories.wizard.basicInformation')}
              </h3>
              <p className="text-gray-600">
                {t('admin.categories.wizard.basicInformationDescription')}
              </p>
            </div>

            <div className="space-y-6">
              {/* Category Name (French) */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('admin.categories.categoryName')}{' '}<span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.translations.fr.name}
                  onChange={(e) => handleInputChange('translations.name', e.target.value, 'fr')}
                  placeholder={t('admin.categories.categoryNamePlaceholder')}
                  className="h-14 text-base"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
                {formData.translations.fr.name && (
                  <p className="text-xs text-gray-500 mt-1">
                    Slug: {generateSlug(formData.translations.fr.name)}
                  </p>
                )}
              </div>

              {/* Parent Category Display */}
              {parentCategory && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      {t('admin.categories.parentCategory')}:
                    </span>
                    <Badge variant="outline">
                      {parentCategory.nom?.fr || parentCategory.name}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Short Description (French) */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('admin.categories.shortDescription')}
                </label>
                <Textarea
                  value={formData.translations.fr.description}
                  onChange={(e) => handleInputChange('translations.description', e.target.value, 'fr')}
                  placeholder={t('admin.categories.shortDescriptionPlaceholder')}
                  rows={3}
                  className="text-base resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.categories.shortDescriptionHint')}
                </p>
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
                  className="h-14 text-base"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.categories.sortOrderHint')}
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
                {t('admin.categories.wizard.additionalDetails')}
              </h3>
              <p className="text-gray-600">
                {t('admin.categories.wizard.additionalDetailsDescription')}
              </p>
            </div>

            {/* Category Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                {t('admin.categories.categoryImage')}
              </label>
              <div className="flex items-start space-x-4">
                <CompactImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => handleInputChange('imageUrl', url)}
                  preset="categoryImage"
                  size="lg"
                  shape="square"
                  placeholder={t('admin.categories.uploadImage')}
                  className="flex-shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-gray-700">
                    {t('admin.categories.imageUploadDescription')}
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• {t('admin.categories.imageFormatSupported')}</li>
                    <li>• {t('admin.categories.imageSizeLimit')}</li>
                    <li>• {t('admin.categories.imageRecommendation')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* English Translation */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <GlobeAltIcon className="w-5 h-5 mr-2 text-blue-600" />
                {t('admin.categories.internationalVersion')}
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.categories.categoryNameEnglish')}
                  </label>
                  <Input
                    value={formData.translations.en.name}
                    onChange={(e) => handleInputChange('translations.name', e.target.value, 'en')}
                    placeholder={t('admin.categories.categoryNameEnglishPlaceholder')}
                    className="h-12 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.categories.descriptionEnglish')}
                  </label>
                  <Textarea
                    value={formData.translations.en.description}
                    onChange={(e) => handleInputChange('translations.description', e.target.value, 'en')}
                    placeholder={t('admin.categories.descriptionEnglishPlaceholder')}
                    rows={3}
                    className="text-base resize-none"
                  />
                </div>
              </div>
            </div>


            {/* Visibility Settings */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                {formData.isActive ? (
                  <EyeIcon className="w-5 h-5 mr-2 text-green-600" />
                ) : (
                  <EyeSlashIcon className="w-5 h-5 mr-2 text-gray-600" />
                )}
                {t('admin.categories.visibility')}
              </h4>

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
                ? (parentCategory 
                    ? t('admin.categories.addSubcategory')
                    : t('admin.categories.addCategory')
                  )
                : t('admin.categories.editCategory')
              }
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {effectiveSteps[effectiveCurrentStep]?.description || ''}
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
            <span>{t('admin.categories.wizard.previous')}</span>
          </Button>

          <div className="text-sm text-gray-500">
            Étape {effectiveCurrentStep + 1} sur {effectiveSteps.length}
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
                    {t('admin.categories.saving')}
                  </>
                ) : (
                  mode === 'add' ? t('admin.categories.createCategory') : t('admin.categories.updateCategory')
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="bg-primary-600 hover:bg-primary-700 flex items-center space-x-2 min-w-[120px]"
              >
                <span>{t('admin.categories.wizard.next')}</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}