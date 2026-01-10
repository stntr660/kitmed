'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  PhotoIcon,
  XMarkIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Dropzone, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { cn } from '@/lib/utils';
import { getAdminToken } from '@/lib/auth-utils';

interface MediaFile {
  id: string;
  type: string;
  url: string;
  altText: string | null;
  title: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

interface TempFileWithPreview {
  file: File;
  previewUrl: string;
}

interface MediaUploadProps {
  productId: string | null;
  disabled?: boolean;
  onMediaChange?: (media: MediaFile[]) => void;
  onTempFilesChange?: (files: File[]) => void;
}

export function MediaUpload({ productId, disabled, onMediaChange, onTempFilesChange }: MediaUploadProps) {
  const t = useTranslations();
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempFilesWithPreview, setTempFilesWithPreview] = useState<TempFileWithPreview[]>([]);

  // Load existing media when productId changes
  const loadMedia = useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const token = getAdminToken();
      const response = await fetch(`/api/admin/products/${productId}/media`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        setMedia(result.data || []);
        onMediaChange?.(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  }, [productId, onMediaChange]);

  // Load media when component mounts or productId changes
  React.useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Cleanup preview URLs when component unmounts or temp files change
  useEffect(() => {
    return () => {
      tempFilesWithPreview.forEach(item => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const handleFilesDrop = async (files: File[]) => {
    console.log('[MediaUpload] handleFilesDrop called with', files.length, 'files');
    if (disabled || files.length === 0) return;

    // If no productId, store files temporarily with preview URLs
    if (!productId) {
      console.log('[MediaUpload] No productId - storing files temporarily');
      const newTempFilesWithPreview = files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      const updatedTempFiles = [...tempFilesWithPreview, ...newTempFilesWithPreview];
      setTempFilesWithPreview(updatedTempFiles);
      console.log('[MediaUpload] Calling onTempFilesChange with', updatedTempFiles.length, 'files');
      onTempFilesChange?.(updatedTempFiles.map(item => item.file));
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const token = getAdminToken();
      const response = await fetch(`/api/admin/products/${productId}/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const newMedia = [...media, ...result.data];
        setMedia(newMedia);
        onMediaChange?.(newMedia);
      } else {
        const error = await response.json();
        console.error('Upload failed:', error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Handle removal of temp files
  const handleRemoveTempFile = (index: number) => {
    if (disabled) return;
    // Revoke the URL being removed
    URL.revokeObjectURL(tempFilesWithPreview[index].previewUrl);
    const newTempFiles = tempFilesWithPreview.filter((_, i) => i !== index);
    setTempFilesWithPreview(newTempFiles);
    onTempFilesChange?.(newTempFiles.map(item => item.file));
  };

  // Upload temp files after product is created
  const uploadTempFiles = async (newProductId: string) => {
    if (tempFilesWithPreview.length === 0) return;

    try {
      setUploading(true);

      const formData = new FormData();
      tempFilesWithPreview.forEach(item => {
        formData.append('files', item.file);
      });

      const token = getAdminToken();
      const response = await fetch(`/api/admin/products/${newProductId}/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setMedia(result.data || []);
        // Cleanup preview URLs
        tempFilesWithPreview.forEach(item => URL.revokeObjectURL(item.previewUrl));
        setTempFilesWithPreview([]); // Clear temp files after successful upload
        onMediaChange?.(result.data || []);
      }
    } catch (error) {
      console.error('Temp files upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Expose uploadTempFiles function
  React.useEffect(() => {
    (window as any).uploadTempFiles = uploadTempFiles;
  }, [tempFilesWithPreview]);

  const handleDeleteMedia = async (mediaId: string) => {
    if (disabled) return;

    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const newMedia = media.filter(m => m.id !== mediaId);
        setMedia(newMedia);
        onMediaChange?.(newMedia);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSetPrimary = async (mediaId: string) => {
    if (disabled) return;

    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isPrimary: true }),
      });

      if (response.ok) {
        const newMedia = media.map(m => ({
          ...m,
          isPrimary: m.id === mediaId
        }));
        setMedia(newMedia);
        onMediaChange?.(newMedia);
      }
    } catch (error) {
      console.error('Set primary error:', error);
    }
  };

  const handleMoveMedia = async (mediaId: string, direction: 'up' | 'down') => {
    if (disabled) return;

    const currentIndex = media.findIndex(m => m.id === mediaId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= media.length) return;

    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sortOrder: newIndex }),
      });

      if (response.ok) {
        const newMedia = [...media];
        [newMedia[currentIndex], newMedia[newIndex]] = [newMedia[newIndex], newMedia[currentIndex]];
        newMedia[currentIndex].sortOrder = currentIndex;
        newMedia[newIndex].sortOrder = newIndex;
        setMedia(newMedia);
        onMediaChange?.(newMedia);
      }
    } catch (error) {
      console.error('Move error:', error);
    }
  };

  // Always render the upload interface - no need to block when productId is null

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Dropzone
        onDrop={handleFilesDrop}
        accept={{
          'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        }}
        multiple
        disabled={disabled || uploading}
        className={cn(
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <DropzoneEmptyState
          title={uploading ? t('admin.products.uploading') : t('admin.products.uploadMedia')}
          description={uploading ? undefined : t('admin.products.mediaDescription')}
          icon={uploading ? <LoadingSpinner size="md" /> : <PhotoIcon className="h-full w-full" />}
        />
      </Dropzone>

      {/* Temp Files Info Banner */}
      {tempFilesWithPreview.length > 0 && !productId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <PhotoIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {tempFilesWithPreview.length} {tempFilesWithPreview.length === 1 ? t('admin.products.tempImage') : 'images temporaires'}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {t('admin.products.tempImageDescription')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (media.length > 0 || tempFilesWithPreview.length > 0) ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Show temp files for new products */}
          {tempFilesWithPreview.map((item, index) => (
            <div key={`temp-${index}-${item.file.name}`} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={item.previewUrl}
                  alt={item.file.name || `Temporary image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image preview failed for:', item.file.name);
                    // Try to recreate the blob URL
                    const newUrl = URL.createObjectURL(item.file);
                    (e.target as HTMLImageElement).src = newUrl;
                  }}
                />
              </div>

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Delete button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white hover:bg-gray-50 text-gray-600"
                    onClick={() => handleRemoveTempFile(index)}
                    disabled={disabled}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Temp indicator */}
              <div className="absolute top-2 left-2">
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {t('admin.products.tempImage')}
                </div>
              </div>
            </div>
          ))}

          {/* Show actual media */}
          {media.map((item, index) => (
            <div key={item.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={item.url}
                  alt={item.altText || item.title || 'Product image'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                  {/* Primary star */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white hover:bg-yellow-50"
                    onClick={() => handleSetPrimary(item.id)}
                    disabled={disabled}
                  >
                    {item.isPrimary ? (
                      <StarIconSolid className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <StarIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>

                  {/* Delete button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white hover:bg-gray-50 text-gray-600"
                    onClick={() => handleDeleteMedia(item.id)}
                    disabled={disabled}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Move buttons */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white"
                    onClick={() => handleMoveMedia(item.id, 'up')}
                    disabled={disabled || index === 0}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white"
                    onClick={() => handleMoveMedia(item.id, 'down')}
                    disabled={disabled || index === media.length - 1}
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Primary indicator */}
              {item.isPrimary && (
                <div className="absolute top-2 left-2">
                  <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {t('admin.products.primaryImage')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <PhotoIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-sm">{t('admin.products.noImages')}</p>
        </div>
      )}
    </div>
  );
}