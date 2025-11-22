'use client';

import { useState, useCallback } from 'react';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { Button } from '@/components/ui/button';
import { X, Camera, Upload, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ImageDropzoneProps {
  value?: string;
  onChange: (url: string) => void;
  preset?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  description?: string;
}

export function ImageDropzone({
  value,
  onChange,
  preset = 'image',
  maxSize = 5,
  className,
  disabled = false,
  placeholder = 'Upload image',
  description = 'Drag & drop an image here, or click to select',
}: ImageDropzoneProps) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value || '');

  const handleDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File too large (max ${maxSize}MB)`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setLoading(true);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload file
      const formData = new FormData();
      formData.append('files', file);
      formData.append('preset', preset);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      if (result.success && result.data.results.length > 0) {
        const uploadedFile = result.data.results[0];
        onChange(uploadedFile.url);
        setPreviewUrl(uploadedFile.url);
        toast.success('Image uploaded successfully');
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Upload failed';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Please log in to upload images';
        } else if (error.message.includes('403')) {
          errorMessage = 'You do not have permission to upload images';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      // Reset preview on error
      setPreviewUrl(value || '');
    } finally {
      setLoading(false);
    }
  }, [maxSize, preset, onChange, value]);

  const handleRemove = useCallback(() => {
    onChange('');
    setPreviewUrl('');
    toast.success('Image removed');
  }, [onChange]);

  const handleError = useCallback((fileRejections: any[]) => {
    fileRejections.forEach((rejection) => {
      toast.error(`File rejected: ${rejection.errors[0]?.message || 'Invalid file'}`);
    });
  }, []);

  const hasImage = previewUrl && previewUrl.trim() !== '';

  if (hasImage) {
    return (
      <div className={cn('relative group', className)}>
        <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-40 object-cover"
            onError={() => {
              console.error('Failed to load image:', previewUrl);
              setPreviewUrl('');
              onChange('');
            }}
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Trigger file input click for replacement
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) {
                      handleDrop(Array.from(files));
                    }
                  };
                  input.click();
                }}
                disabled={disabled || loading}
              >
                <Upload className="w-4 h-4 mr-1" />
                Replace
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || loading}
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Dropzone
      accept={{ 'image/*': [] }}
      onDrop={handleDrop}
      onError={handleError}
      disabled={disabled || loading}
      className={cn('min-h-40', className)}
      maxFiles={1}
      maxSize={maxSize * 1024 * 1024}
    >
      <DropzoneEmptyState
        title={placeholder}
        description={description}
        icon={<Camera className="h-full w-full" />}
      />
      <DropzoneContent loading={loading} />
    </Dropzone>
  );
}