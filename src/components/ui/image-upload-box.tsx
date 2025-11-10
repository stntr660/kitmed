'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, FileImage, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadBoxProps {
  value?: string;
  onChange: (url: string) => void;
  preset?: string;
  label?: string;
  placeholder?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  showPreview?: boolean;
  aspectRatio?: 'square' | 'video' | 'auto';
  requiresSave?: boolean; // For new entities that need to be saved first
  saveMessage?: string; // Custom message when save is required
}

export function ImageUploadBox({
  value,
  onChange,
  preset = 'productImage',
  label,
  placeholder = 'Cliquez pour télécharger ou glissez-déposez',
  maxSize = 5,
  className,
  disabled = false,
  accept = 'image/*',
  multiple = false,
  showPreview = true,
  aspectRatio = 'auto',
  requiresSave = false,
  saveMessage = 'Veuillez d\'abord enregistrer le produit pour télécharger des images',
}: ImageUploadBoxProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${maxSize}MB)`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('preset', preset);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const result = await response.json();
      
      if (result.success && result.data.results.length > 0) {
        const uploadedFile = result.data.results[0];
        onChange(uploadedFile.url);
      } else {
        throw new Error(result.error?.message || 'Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du téléchargement');
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

  const handleRemove = useCallback(() => {
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const hasImage = value && value.trim() !== '';
  
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'min-h-[120px]'
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer group',
          aspectRatioClasses[aspectRatio],
          {
            'border-gray-300 hover:border-gray-400': !dragOver && !hasImage && !disabled,
            'border-primary-500 bg-primary-50': dragOver && !disabled,
            'border-gray-200 cursor-not-allowed opacity-50': disabled,
            'border-red-300 bg-red-50': error,
            'border-green-300': hasImage && !error,
          }
        )}
      >
        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload State */}
        {isUploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
            <span className="text-sm text-gray-600">Téléchargement...</span>
          </div>
        ) : hasImage && showPreview ? (
          /* Image Preview */
          <div className="relative w-full h-full">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
              onError={() => setError('Impossible de charger l\'image')}
            />
            
            {/* Remove Button */}
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        ) : requiresSave ? (
          /* Save Required Message */
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="mb-3 p-3 rounded-full bg-orange-100 text-orange-400">
              <FileImage className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-600">
                {saveMessage}
              </p>
              <p className="text-xs text-orange-500">
                Enregistrez d'abord ce {preset === 'productImage' ? 'produit' : 'élément'} pour activer le téléchargement
              </p>
            </div>
          </div>
        ) : (
          /* Upload Placeholder */
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className={cn(
              'mb-3 p-3 rounded-full transition-colors',
              {
                'bg-gray-100 text-gray-400 group-hover:bg-gray-200': !error && !disabled,
                'bg-red-100 text-red-400': error,
                'bg-gray-50 text-gray-300': disabled,
              }
            )}>
              {error ? (
                <FileImage className="w-6 h-6" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            
            <div className="space-y-1">
              <p className={cn(
                'text-sm font-medium',
                {
                  'text-gray-600': !error && !disabled,
                  'text-red-600': error,
                  'text-gray-400': disabled,
                }
              )}>
                {error || placeholder}
              </p>
              
              {!error && !disabled && (
                <p className="text-xs text-gray-500">
                  {multiple ? 'Formats' : 'Format'}: JPG, PNG, WEBP (max {maxSize}MB)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <X className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}

      {/* File Info */}
      {hasImage && !error && (
        <p className="text-xs text-green-600 flex items-center">
          <Image className="w-4 h-4 mr-1" />
          Image téléchargée avec succès
        </p>
      )}
    </div>
  );
}

// Multiple file upload variant
interface MultipleImageUploadBoxProps extends Omit<ImageUploadBoxProps, 'value' | 'onChange' | 'multiple'> {
  value?: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function MultipleImageUploadBox({
  value = [],
  onChange,
  maxFiles = 5,
  ...props
}: MultipleImageUploadBoxProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).slice(0, maxFiles - value.length);
    
    if (newFiles.length === 0) {
      setError(`Maximum ${maxFiles} fichiers autorisés`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      newFiles.forEach(file => formData.append('files', file));
      formData.append('preset', props.preset || 'productImage');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const result = await response.json();
      
      if (result.success && result.data.results.length > 0) {
        const newUrls = result.data.results.map((file: any) => file.url);
        onChange([...value, ...newUrls]);
      } else {
        throw new Error(result.error?.message || 'Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
    }
  }, [value, maxFiles, onChange, props.preset]);

  const handleRemove = useCallback((index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  }, [value, onChange]);

  return (
    <div className={cn('space-y-4', props.className)}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700">
          {props.label}
        </label>
      )}

      {/* Upload Area */}
      <ImageUploadBox
        {...props}
        value=""
        onChange={() => {}}
        placeholder={`Télécharger des images (${value.length}/${maxFiles})`}
        disabled={props.disabled || value.length >= maxFiles}
        showPreview={false}
      />

      {/* Hidden file input for multiple upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        disabled={props.disabled || isUploading}
      />

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full aspect-square object-cover rounded-lg border"
              />
              {!props.disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File count info */}
      <p className="text-xs text-gray-500">
        {value.length} / {maxFiles} images téléchargées
      </p>

      {/* Error/Loading state */}
      {isUploading && (
        <div className="flex items-center text-sm text-primary-600">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Téléchargement en cours...
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <X className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}