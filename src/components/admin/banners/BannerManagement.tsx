'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image,
  Calendar,
  Settings,
  Upload,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { BannerForm } from './BannerForm';
import { BannerPreview } from './BannerPreview';
import { getAdminToken } from '@/lib/auth-utils';

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
  createdAt: string;
  updatedAt: string;
  translations: BannerTranslation[];
}

interface BannerTranslation {
  id: string;
  bannerId: string;
  languageCode: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
}

export function BannerManagement() {
  const t = useTranslations('admin');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);

      // Use proper authenticated route
      const response = await fetch('/api/admin/banners', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`,
        },
      });

      if (response.ok) {

        setIsUsingFallback(false);
        const result = await response.json();
        setBanners(result.data.items || []);
      } else {
        console.error('Failed to fetch banners:', response.status, response.statusText);
        setIsUsingFallback(true);
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBanner = () => {
    setSelectedBanner(null);
    setShowForm(true);
  };

  const handleEditBanner = (banner: Banner) => {
    setSelectedBanner(banner);
    setShowForm(true);
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`,
        },
      });

      if (response.ok) {
        await fetchBanners();
      } else {
        console.error('Failed to delete banner');
        alert('Failed to delete banner. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Error deleting banner. Please try again.');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      // Create a minimal payload with all required fields for the update
      const updatePayload = {
        translations: {
          fr: {
            title: banner.translations.find(t => t.languageCode === 'fr')?.title || banner.title,
            subtitle: banner.translations.find(t => t.languageCode === 'fr')?.subtitle || banner.subtitle || '',
            description: banner.translations.find(t => t.languageCode === 'fr')?.description || banner.description || '',
            ctaText: banner.translations.find(t => t.languageCode === 'fr')?.ctaText || banner.ctaText || '',
          },
          en: {
            title: banner.translations.find(t => t.languageCode === 'en')?.title || banner.title,
            subtitle: banner.translations.find(t => t.languageCode === 'en')?.subtitle || banner.subtitle || '',
            description: banner.translations.find(t => t.languageCode === 'en')?.description || banner.description || '',
            ctaText: banner.translations.find(t => t.languageCode === 'en')?.ctaText || banner.ctaText || '',
          }
        },
        imageUrl: banner.imageUrl || '',
        backgroundUrl: banner.backgroundUrl || '',
        ctaUrl: banner.ctaUrl || '',
        ctaStyle: banner.ctaStyle,
        position: banner.position,
        layout: banner.layout,
        textAlign: banner.textAlign,
        overlayOpacity: banner.overlayOpacity,
        sortOrder: banner.sortOrder,
        isActive: !banner.isActive, // Toggle the active state
        startDate: banner.startDate || undefined,
        endDate: banner.endDate || undefined,
      };

      const response = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        await fetchBanners();
      } else {
        console.error('Failed to toggle banner status');
      }
    } catch (error) {
      console.error('Error toggling banner status:', error);
    }
  };

  const handlePreviewBanner = (banner: Banner) => {
    setSelectedBanner(banner);
    setShowPreview(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedBanner(null);
    fetchBanners();
  };

  const getStatusColor = (banner: Banner) => {
    if (!banner.isActive) return 'bg-gray-500';

    const now = new Date();
    const startDate = banner.startDate ? new Date(banner.startDate) : null;
    const endDate = banner.endDate ? new Date(banner.endDate) : null;

    if (startDate && startDate > now) return 'bg-yellow-500'; // Scheduled
    if (endDate && endDate < now) return 'bg-red-500'; // Expired
    return 'bg-green-500'; // Active
  };

  const getStatusText = (banner: Banner) => {
    if (!banner.isActive) return 'Inactive';

    const now = new Date();
    const startDate = banner.startDate ? new Date(banner.startDate) : null;
    const endDate = banner.endDate ? new Date(banner.endDate) : null;

    if (startDate && startDate > now) return 'Scheduled';
    if (endDate && endDate < now) return 'Expired';
    return 'Active';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading banners...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-600 mt-1">Create and manage homepage banners</p>
          {isUsingFallback && (
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md text-sm text-yellow-800">
              ⚠️ Read-only mode: Please log in for all management features
            </div>
          )}
        </div>
        <Button
          onClick={handleCreateBanner}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Banner</span>
        </Button>
      </div>

      {/* Banners List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => (
          <Card key={banner.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                    {banner.title}
                  </CardTitle>
                  {banner.subtitle && (
                    <p className="text-sm text-gray-600">{banner.subtitle}</p>
                  )}
                </div>
                <Badge className={`text-white text-xs ${getStatusColor(banner)}`}>
                  {getStatusText(banner)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Banner Preview Miniature */}
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {banner.backgroundUrl || banner.imageUrl ? (
                  <div className="relative w-full h-full">
                    {/* Background Image */}
                    {banner.backgroundUrl && (
                      <img
                        src={banner.backgroundUrl}
                        alt={`${banner.title} background`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Failed to load background image:', banner.backgroundUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-white/90" style={{ opacity: banner.overlayOpacity || 0.9 }}></div>

                    {/* Content Preview */}
                    <div className="absolute inset-0 p-2 flex items-center">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-medium text-blue-600 truncate">
                          {banner.title === 'kitMed' ? (
                            <>kit<span className="text-blue-700">Med</span></>
                          ) : (
                            banner.title
                          )}
                        </h3>
                        {banner.subtitle && (
                          <p className="text-xs text-gray-700 truncate">{banner.subtitle}</p>
                        )}
                      </div>

                      {/* Product Image */}
                      {banner.imageUrl && (
                        <div className="w-8 h-8 ml-2 flex-shrink-0">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              console.error('Failed to load product image:', banner.imageUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="h-8 w-8 text-gray-400" />
                    <span className="ml-2 text-xs text-gray-500">{banner.title}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePreviewBanner(banner)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>

              {/* Banner Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-medium capitalize">{banner.position}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Layout:</span>
                  <span className="font-medium capitalize">{banner.layout}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sort Order:</span>
                  <span className="font-medium">{banner.sortOrder}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditBanner(banner)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(banner)}
                  >
                    {banner.isActive ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => handlePreviewBanner(banner)}
                >
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {banners.length === 0 && (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No banners yet</h3>
              <p className="text-gray-600 mb-4">Create your first banner to get started</p>
              <Button onClick={handleCreateBanner}>
                <Plus className="h-4 w-4 mr-2" />
                Create Banner
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Banner Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBanner ? 'Edit Banner' : 'Create New Banner'}
            </DialogTitle>
            <DialogDescription>
              {selectedBanner
                ? 'Update banner content and settings'
                : 'Create a new banner for your homepage'
              }
            </DialogDescription>
          </DialogHeader>
          <BannerForm
            banner={selectedBanner}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Banner Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Banner Preview</DialogTitle>
                <DialogDescription>
                  {selectedBanner?.title}
                </DialogDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                  onClick={() => setPreviewDevice('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                  onClick={() => setPreviewDevice('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                  onClick={() => setPreviewDevice('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          {selectedBanner && (
            <BannerPreview banner={selectedBanner} device={previewDevice} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}