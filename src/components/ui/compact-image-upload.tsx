'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface CompactImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  preset?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'square' | 'circle' | 'rectangle';
  placeholder?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  showRemove?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24', 
  lg: 'w-32 h-32'
};

const shapeClasses = {
  square: 'rounded-lg',
  circle: 'rounded-full',
  rectangle: 'rounded-lg aspect-video'
};

export function CompactImageUpload({
  value,
  onChange,
  preset = 'partnerLogo',
  size = 'md',
  shape = 'square',
  placeholder = 'Upload image',
  maxSize = 2,
  className,
  disabled = false,
  showRemove = true,
}: CompactImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

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

    setIsUploading(true);

    try {
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
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || 'Upload failed';
        } catch {
          errorMessage = `Upload failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.success && result.data.results.length > 0) {
        const uploadedFile = result.data.results[0];
        onChange(uploadedFile.url);
        toast.success('Image uploaded successfully');
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Upload error details:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: response?.status,
        statusText: response?.statusText
      });
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [maxSize, preset, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [disabled, handleFileUpload]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const hasImage = value && value.trim() !== '';

  return (
    <div className={cn('relative group', className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          // Base styles
          'relative border-2 border-dashed cursor-pointer transition-all duration-200',
          'flex items-center justify-center overflow-hidden',
          // Size classes
          sizeClasses[size],
          // Shape classes
          shapeClasses[shape],
          // State styles
          dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : hasImage 
              ? 'border-gray-200 hover:border-gray-300' 
              : 'border-gray-300 hover:border-gray-400',
          disabled && 'cursor-not-allowed opacity-50',
          hasImage ? 'bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
        )}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {/* Content */}
        {isUploading ? (
          <div className="flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin mb-1" />
            <span className="text-xs">Uploading...</span>
          </div>
        ) : hasImage ? (
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Failed to load image:', value);
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <Camera className="w-5 h-5 mb-1" />
            <span className="text-xs text-center px-1">{placeholder}</span>
          </div>
        )}

        {/* Hover overlay */}
        {hasImage && !isUploading && !disabled && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Remove button */}
      {hasImage && showRemove && !disabled && !isUploading && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleRemove}
          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}