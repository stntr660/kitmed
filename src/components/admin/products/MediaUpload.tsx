'use client';

import React, { useState, useRef, useCallback } from 'react';
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
import { cn } from '@/lib/utils';

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

interface MediaUploadProps {
  productId: string | null;
  disabled?: boolean;
  onMediaChange?: (media: MediaFile[]) => void;
}

export function MediaUpload({ productId, disabled, onMediaChange }: MediaUploadProps) {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load existing media when productId changes
  const loadMedia = useCallback(async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${productId}/media`);
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

  const handleFileSelect = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !productId) return;

    try {
      setUploading(true);
      
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`/api/admin/products/${productId}/media`, {
        method: 'POST',
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
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (disabled) return;
    
    try {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'DELETE',
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
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

  if (!productId) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-600">
          {t('admin.products.saveProductFirst')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          disabled 
            ? "border-gray-200 bg-gray-50" 
            : "border-gray-300 hover:border-primary-400 hover:bg-primary-50 cursor-pointer"
        )}
        onClick={handleFileSelect}
      >
        <PhotoIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-2">
          {uploading 
            ? t('admin.products.uploading') 
            : t('admin.products.mediaDescription')
          }
        </p>
        <Button 
          variant="outline" 
          disabled={disabled || uploading}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFileSelect();
          }}
        >
          {uploading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {t('admin.products.uploading')}
            </>
          ) : (
            t('admin.products.uploadMedia')
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          {t('admin.products.uploadHint')}
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Media Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : media.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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