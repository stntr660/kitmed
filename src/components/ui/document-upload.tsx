'use client';

import { useState, useRef, useCallback } from 'react';
import { FileText, Upload, X, Loader2, File, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface DocumentUploadProps {
  value?: string;
  onChange: (url: string) => void;
  preset?: string;
  placeholder?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  acceptedFormats?: string[];
  label?: string;
}

export function DocumentUpload({
  value,
  onChange,
  preset = 'document',
  placeholder = 'Upload PDF document',
  maxSize = 10,
  className,
  disabled = false,
  acceptedFormats = ['.pdf'],
  label = 'PDF Brochure'
}: DocumentUploadProps) {
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
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!acceptedFormats.includes(fileExtension) && !file.type.includes('pdf')) {
      toast.error(`Please select a PDF file`);
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
        toast.success('Document uploaded successfully');
      } else {
        throw new Error('Upload failed - no results');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [maxSize, acceptedFormats, onChange, preset]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [disabled, handleFileUpload]);

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

  const handleRemove = useCallback(() => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {value ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <FileText className="h-10 w-10 text-red-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getFileName(value)}
                </p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => window.open(value, '_blank')}
                className="text-gray-600 hover:text-gray-900"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleRemove}
                disabled={disabled}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200',
            dragOver 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400 bg-white',
            disabled && 'opacity-50 cursor-not-allowed',
            isUploading && 'pointer-events-none'
          )}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-gray-400 animate-spin mb-3" />
              <p className="text-sm text-gray-600">Uploading document...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                {placeholder}
              </p>
              <p className="text-xs text-gray-500">
                Click to browse or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-2">
                PDF files up to {maxSize}MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}