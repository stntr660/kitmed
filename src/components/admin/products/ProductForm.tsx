'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploadBox } from '@/components/ui/image-upload-box';
import { ProductFormData } from '@/types/admin';
import { Product, Partner } from '@/types';
import { getAdminToken } from '@/lib/auth-utils';

interface ProductFormProps {
  product?: Product | null;
  onSave: (data: Product) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [manufacturers, setManufacturers] = useState<Partner[]>([]);
  const [loadingManufacturers, setLoadingManufacturers] = useState(false);
  const [brochureUrl, setBrochureUrl] = useState(product?.pdfBrochureUrl || '');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormData>({
    defaultValues: product ? {
      referenceFournisseur: product.referenceFournisseur,
      constructeur: product.constructeur,
      categoryId: product.categoryId,
      nom: product.nom,
      description: product.description || { en: '', fr: '' },
      ficheTechnique: product.ficheTechnique || { en: '', fr: '' },
      pdfBrochureUrl: product.pdfBrochureUrl || '',
      status: product.status,
      featured: product.featured || false,
    } : {
      referenceFournisseur: '',
      constructeur: '',
      categoryId: '',
      nom: { en: '', fr: '' },
      description: { en: '', fr: '' },
      ficheTechnique: { en: '', fr: '' },
      pdfBrochureUrl: '',
      status: 'active',
      featured: false,
    }
  });

  useEffect(() => {
    if (product) {
      reset({
        referenceFournisseur: product.referenceFournisseur,
        constructeur: product.constructeur,
        categoryId: product.categoryId,
        nom: product.nom,
        description: product.description || { en: '', fr: '' },
        ficheTechnique: product.ficheTechnique || { en: '', fr: '' },
        pdfBrochureUrl: product.pdfBrochureUrl || '',
        status: product.status,
        featured: product.featured || false,
      });
      setBrochureUrl(product.pdfBrochureUrl || '');
    }
  }, [product, reset]);

  // Fetch manufacturers from partners
  useEffect(() => {
    const fetchManufacturers = async () => {
      setLoadingManufacturers(true);
      console.group('🔍 ProductForm: Manufacturer Loading Debug');

      try {
        const token = getAdminToken();

        if (!token) {
          console.error('❌ No authentication token available - please login first');
          console.groupEnd();
          return;
        }

        const apiUrl = '/api/admin/partners?type=manufacturer&pageSize=200&status=active';

        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('📋 Response headers:', Object.fromEntries(response.headers));

        if (response.ok) {
          const result = await response.json();

          // Access the items array from the paginated response
          const manufacturersList = result.data?.items || [];
          console.log(`✅ Raw manufacturers list (${manufacturersList.length} items):`, manufacturersList);

          if (manufacturersList.length < 49) {

          } else if (manufacturersList.length >= 49) {

          }

          // Debug each manufacturer structure
          if (manufacturersList.length > 0) {

            console.log('🔬 Available fields:', Object.keys(manufacturersList[0]));

            // Check for name field variations
            const firstManufacturer = manufacturersList[0];

          }

          setManufacturers(manufacturersList);

        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Failed to fetch manufacturers:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
          });

          if (response.status === 401) {
            console.error('🔒 Authentication failed - please login to admin panel first');
          }
        }
      } catch (error) {
        console.error('💥 Network error fetching manufacturers:', error);
        console.error('📋 Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } finally {
        setLoadingManufacturers(false);

        console.groupEnd();
      }
    };

    fetchManufacturers();
  }, []);

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);

      // Include brochure URL in form data
      const formData = {
        ...data,
        pdfBrochureUrl: brochureUrl,
      };

      const url = product
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products';

      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
          <CardTitle>{t('product.form.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('product.form.nomProduitFr')} *
              </label>
              <Input
                {...register('nom.fr', { required: t('product.form.validation.nomFrRequired') })}
                placeholder={t('product.form.placeholders.nomProduitFr')}
              />
              {errors.nom?.fr && (
                <p className="text-sm text-red-600 mt-1">{errors.nom.fr.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('product.form.nomProduitEn')} *
              </label>
              <Input
                {...register('nom.en', { required: t('product.form.validation.nomEnRequired') })}
                placeholder={t('product.form.placeholders.nomProduitEn')}
              />
              {errors.nom?.en && (
                <p className="text-sm text-red-600 mt-1">{errors.nom.en.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('product.form.referenceFournisseur')} *
              </label>
              <Input
                {...register('referenceFournisseur', { required: t('product.form.validation.referenceFournisseurRequired') })}
                placeholder={t('product.form.placeholders.referenceFournisseur')}
              />
              {errors.referenceFournisseur && (
                <p className="text-sm text-red-600 mt-1">{errors.referenceFournisseur.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('product.form.manufacturer')} *
              </label>
              <select
                {...register('constructeur', { required: t('product.form.validation.manufacturerRequired') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loadingManufacturers}
              >
                <option value="">
                  {loadingManufacturers
                    ? t('common.loading')
                    : manufacturers.length > 0
                      ? `${t('product.form.placeholders.selectManufacturer')} (${manufacturers.length} available)`
                      : 'No manufacturers available - please login first'
                  }
                </option>
                {(() => {
                  console.group('🎨 ProductForm: Rendering Dropdown Options');

                  const options = manufacturers.map((manufacturer, index) => {
                    // Debug each manufacturer during render

                    // Try different name sources
                    const displayName = manufacturer.name || manufacturer.nom?.fr || manufacturer.nom?.en || 'Unnamed';
                    const optionValue = manufacturer.name || manufacturer.nom?.fr || manufacturer.nom?.en || '';

                    return (
                      <option key={manufacturer.id} value={optionValue}>
                        {displayName}
                      </option>
                    );
                  });

                  if (options.length < 49) {

                  }

                  console.groupEnd();
                  return options;
                })()}
              </select>
              {errors.constructeur && (
                <p className="text-sm text-red-600 mt-1">{errors.constructeur.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('product.form.categorieDiscipline')} *
              </label>
              <select
                {...register('categoryId', { required: t('product.form.validation.categorieRequired') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('product.form.placeholders.selectCategory')}</option>
                <option value="cardiology">{t('product.form.categories.cardiology')}</option>
                <option value="radiology">{t('product.form.categories.radiology')}</option>
                <option value="surgery">{t('product.form.categories.surgery')}</option>
                <option value="laboratory">{t('product.form.categories.laboratory')}</option>
                <option value="emergency">{t('product.form.categories.emergency')}</option>
                <option value="icu">{t('product.form.categories.icu')}</option>
              </select>
              {errors.categoryId && (
                <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('product.form.status')} *
              </label>
              <select
                {...register('status', { required: t('product.form.validation.statusRequired') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">{t('product.form.statuses.active')}</option>
                <option value="inactive">{t('product.form.statuses.inactive')}</option>
                <option value="discontinued">{t('product.form.statuses.discontinued')}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('featured')}
              className="rounded border-gray-300"
            />
            <label className="text-sm font-medium text-gray-700">
              {t('product.form.featured')}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('product.form.descriptions')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('product.form.descriptionFr')}
              </label>
              <textarea
                {...register('description.fr')}
                rows={4}
                placeholder={t('product.form.placeholders.descriptionFr')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('product.form.descriptionEn')}
              </label>
              <textarea
                {...register('description.en')}
                rows={4}
                placeholder={t('product.form.placeholders.descriptionEn')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('product.form.ficheTechniqueFr')}
              </label>
              <textarea
                {...register('ficheTechnique.fr')}
                rows={5}
                placeholder={t('product.form.placeholders.ficheTechniqueFr')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('product.form.ficheTechniqueEn')}
              </label>
              <textarea
                {...register('ficheTechnique.en')}
                rows={5}
                placeholder={t('product.form.placeholders.ficheTechniqueEn')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* PDF Brochure Upload - Moved here from bottom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('product.form.pdfBrochure')}
            </label>
            <ImageUploadBox
              value={brochureUrl}
              onChange={setBrochureUrl}
              preset="productDocument"
              placeholder="Télécharger la brochure PDF"
              maxSize={10}
              accept="application/pdf,.pdf"
              showPreview={false}
              requiresSave={!product}
              saveMessage="Veuillez d'abord enregistrer le produit pour télécharger des documents"
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('product.form.actions.cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t('product.form.actions.saving') : product ? t('product.form.actions.update') : t('product.form.actions.create')}
        </Button>
      </div>
    </form>
  );
}