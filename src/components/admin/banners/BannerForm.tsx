'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Image as ImageIcon,
  Link2,
  Settings,
  Eye,
  Calendar,
  Globe,
  Save,
  X
} from 'lucide-react';
import { CompactImageUpload } from '@/components/ui/compact-image-upload';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAdminToken } from '@/lib/auth-utils';

const bannerSchema = z.object({
  // French content (required)
  title_fr: z.string().min(1, 'French title is required'),
  subtitle_fr: z.string().optional(),
  description_fr: z.string().optional(),
  ctaText_fr: z.string().optional(),

  // English content (optional)
  title_en: z.string().optional(),
  subtitle_en: z.string().optional(),
  description_en: z.string().optional(),
  ctaText_en: z.string().optional(),

  // Media
  imageUrl: z.string().optional(),
  backgroundUrl: z.string().optional(),

  // CTA
  ctaUrl: z.string().optional().or(z.literal('')),
  ctaStyle: z.enum(['primary', 'secondary', 'outline']),

  // Layout & Design
  position: z.string().min(1, 'Position is required'),
  layout: z.enum(['split', 'centered', 'full-width']),
  textAlign: z.enum(['left', 'center', 'right']),
  overlayOpacity: z.number().min(0).max(1),

  // Settings
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  backgroundUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  ctaStyle: 'primary' | 'secondary' | 'outline';
  position: string;
  layout: 'split' | 'centered' | 'full-width';
  textAlign: 'left' | 'center' | 'right';
  overlayOpacity: number;
  sortOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  translations: Array<{
    languageCode: string;
    title: string;
    subtitle?: string;
    description?: string;
    ctaText?: string;
  }>;
}

interface BannerFormProps {
  banner?: Banner | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BannerForm({ banner, onSuccess, onCancel }: BannerFormProps) {
  const [loading, setLoading] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [backgroundUploadLoading, setBackgroundUploadLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title_fr: '',
      subtitle_fr: '',
      description_fr: '',
      ctaText_fr: '',
      title_en: '',
      subtitle_en: '',
      description_en: '',
      ctaText_en: '',
      imageUrl: '',
      backgroundUrl: '',
      ctaUrl: '',
      ctaStyle: 'primary',
      position: 'homepage',
      layout: 'split',
      textAlign: 'left',
      overlayOpacity: 0.9,
      sortOrder: 0,
      isActive: true,
      startDate: '',
      endDate: '',
    }
  });

  useEffect(() => {
    if (banner) {
      // Populate form with existing banner data
      const frTranslation = banner.translations.find(t => t.languageCode === 'fr');
      const enTranslation = banner.translations.find(t => t.languageCode === 'en');

      reset({
        title_fr: frTranslation?.title || banner.title,
        subtitle_fr: frTranslation?.subtitle || banner.subtitle || '',
        description_fr: frTranslation?.description || banner.description || '',
        ctaText_fr: frTranslation?.ctaText || banner.ctaText || '',
        title_en: enTranslation?.title || '',
        subtitle_en: enTranslation?.subtitle || '',
        description_en: enTranslation?.description || '',
        ctaText_en: enTranslation?.ctaText || '',
        imageUrl: banner.imageUrl || '',
        backgroundUrl: banner.backgroundUrl || '',
        ctaUrl: banner.ctaUrl || '',
        ctaStyle: banner.ctaStyle,
        position: banner.position,
        layout: banner.layout,
        textAlign: banner.textAlign,
        overlayOpacity: banner.overlayOpacity,
        sortOrder: banner.sortOrder,
        isActive: banner.isActive,
        startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
        endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
      });
    }
  }, [banner, reset]);

  const onSubmit = async (data: BannerFormData) => {

    setLoading(true);
    try {
      const payload = {
        // Top-level fields (required by API schema)
        title: data.title_fr, // Use French title as primary
        subtitle: data.subtitle_fr || undefined,
        description: data.description_fr || undefined,
        ctaText: data.ctaText_fr || undefined,
        imageUrl: data.imageUrl || undefined,
        backgroundUrl: data.backgroundUrl || undefined,
        ctaUrl: data.ctaUrl || undefined,
        ctaStyle: data.ctaStyle,
        position: data.position,
        layout: data.layout,
        textAlign: data.textAlign,
        overlayOpacity: data.overlayOpacity,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        startDate: data.startDate ? `${data.startDate}T00:00:00Z` : undefined,
        endDate: data.endDate ? `${data.endDate}T23:59:59Z` : undefined,
        // Translations object (also required by API schema)
        translations: {
          fr: {
            title: data.title_fr,
            subtitle: data.subtitle_fr || undefined,
            description: data.description_fr || undefined,
            ctaText: data.ctaText_fr || undefined,
          },
          en: data.title_en ? {
            title: data.title_en,
            subtitle: data.subtitle_en || undefined,
            description: data.description_en || undefined,
            ctaText: data.ctaText_en || undefined,
          } : undefined,
        },
      };

      const url = banner ? `/api/admin/banners/${banner.id}` : '/api/admin/banners';
      const method = banner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        console.error('Failed to save banner:', errorData);

        // Extract error message from different possible structures
        let errorMessage = 'Please try again.';
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.error?.details) {
          errorMessage = Array.isArray(errorData.error.details)
            ? errorData.error.details.map((d: any) => d.message || d).join(', ')
            : String(errorData.error.details);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = String(errorData.error);
        }

        alert(`Failed to save banner: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      alert(`An error occurred while saving the banner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'image' | 'background') => {
    const setUploadLoading = type === 'image' ? setImageUploadLoading : setBackgroundUploadLoading;

    setUploadLoading(true);
    try {
      // Upload file to server
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Set the permanent URL from the upload response
      const imageUrl = result.data.url;

      if (type === 'image') {
        setValue('imageUrl', imageUrl);
      } else {
        setValue('backgroundUrl', imageUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
      alert(message);
    } finally {
      setUploadLoading(false);
    }
  };

  const watchedImageUrl = watch('imageUrl');
  const watchedBackgroundUrl = watch('backgroundUrl');

  return (
    <form onSubmit={handleSubmit(onSubmit, (errors) => {

      alert('Please fix form validation errors before submitting.');
    })} className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Content</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center space-x-2">
            <ImageIcon className="h-4 w-4" />
            <span>Media</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* French Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">French Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title_fr">Title *</Label>
                  <Input
                    id="title_fr"
                    {...register('title_fr')}
                    placeholder="Enter French title"
                  />
                  {errors.title_fr && (
                    <p className="text-sm text-red-600 mt-1">{errors.title_fr.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="subtitle_fr">Subtitle</Label>
                  <Input
                    id="subtitle_fr"
                    {...register('subtitle_fr')}
                    placeholder="Enter French subtitle"
                  />
                </div>

                <div>
                  <Label htmlFor="description_fr">Description</Label>
                  <Textarea
                    id="description_fr"
                    {...register('description_fr')}
                    placeholder="Enter French description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="ctaText_fr">CTA Text</Label>
                  <Input
                    id="ctaText_fr"
                    {...register('ctaText_fr')}
                    placeholder="e.g., Découvrir les Produits"
                  />
                </div>
              </CardContent>
            </Card>

            {/* English Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">English Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title_en">Title</Label>
                  <Input
                    id="title_en"
                    {...register('title_en')}
                    placeholder="Enter English title"
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle_en">Subtitle</Label>
                  <Input
                    id="subtitle_en"
                    {...register('subtitle_en')}
                    placeholder="Enter English subtitle"
                  />
                </div>

                <div>
                  <Label htmlFor="description_en">Description</Label>
                  <Textarea
                    id="description_en"
                    {...register('description_en')}
                    placeholder="Enter English description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="ctaText_en">CTA Text</Label>
                  <Input
                    id="ctaText_en"
                    {...register('ctaText_en')}
                    placeholder="e.g., Discover Products"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA URL and Banner Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Link2 className="h-5 w-5" />
                <span>Call to Action & Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="ctaUrl">CTA URL</Label>
                  <Input
                    id="ctaUrl"
                    {...register('ctaUrl')}
                    placeholder="/products or https://example.com/products"
                  />
                </div>
                <div>
                  <Label htmlFor="ctaStyle">CTA Style</Label>
                  <Controller
                    name="ctaStyle"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Controller
                    name="position"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homepage">Homepage</SelectItem>
                          <SelectItem value="category">Category Pages</SelectItem>
                          <SelectItem value="product">Product Pages</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="isActive"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Product Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="imageFile">Upload Image</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'image');
                      }}
                    />
                    <label htmlFor="imageFile" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </label>
                  </div>
                </div>

                {watchedImageUrl && (
                  <div className="mt-4">
                    <img
                      src={watchedImageUrl}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Background Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Background Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="backgroundFile">Upload Background</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      id="backgroundFile"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'background');
                      }}
                    />
                    <label htmlFor="backgroundFile" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </label>
                  </div>
                </div>

                {watchedBackgroundUrl && (
                  <div className="mt-4">
                    <img
                      src={watchedBackgroundUrl}
                      alt="Background Preview"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : (banner ? 'Update Banner' : 'Create Banner')}
        </Button>
      </div>
    </form>
  );
}