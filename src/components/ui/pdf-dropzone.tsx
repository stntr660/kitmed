'use client';

import { useState, useCallback } from 'react';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { Button } from '@/components/ui/button';
import { X, Upload, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PdfDropzoneProps {
  value?: string;
  onChange: (url: string) => void;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  description?: string;
}

export function PdfDropzone({
  value,
  onChange,
  maxSize = 10,
  className,
  disabled = false,
  placeholder = 'Upload PDF',
  description = 'Drag & drop a PDF file here, or click to select',
}: PdfDropzoneProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const handleDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File too large (max ${maxSize}MB)`);
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    setLoading(true);
    setFileName(file.name);

    try {
      // Upload file
      const formData = new FormData();
      formData.append('files', file);
      formData.append('preset', 'pdf');

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

      if (result.success && result.data.results.length > 0) {
        const uploadedFile = result.data.results[0];
        onChange(uploadedFile.url);
        setFileName(file.name);
        toast.success('PDF uploaded successfully');
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);

      let errorMessage = 'Upload failed';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Please log in to upload files';
        } else if (error.message.includes('403')) {
          errorMessage = 'You do not have permission to upload files';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
      setFileName('');
    } finally {
      setLoading(false);
    }
  }, [maxSize, onChange]);

  const handleRemove = useCallback(() => {
    onChange('');
    setFileName('');
    toast.success('PDF removed');
  }, [onChange]);

  const handleError = useCallback((fileRejections: any[]) => {
    fileRejections.forEach((rejection) => {
      toast.error(`File rejected: ${rejection.errors[0]?.message || 'Invalid file'}`);
    });
  }, []);

  const hasPdf = value && value.trim() !== '';

  // Extract filename from URL if not already set
  const displayName = fileName || (value ? value.split('/').pop() : '');

  if (hasPdf) {
    return (
      <div className={cn('relative', className)}>
        <div className="border-2 border-amber-200 rounded-lg bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {displayName || 'PDF Document'}
                </p>
                <p className="text-xs text-amber-600">PDF Brochure</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(value, '_blank')}
                disabled={disabled || loading}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,application/pdf';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) {
                      handleDrop(Array.from(files));
                    }
                  };
                  input.click();
                }}
                disabled={disabled || loading}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || loading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto mb-2"></div>
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
      accept={{ 'application/pdf': ['.pdf'] }}
      onDrop={handleDrop}
      onError={handleError}
      disabled={disabled || loading}
      className={cn(
        'min-h-32 border-amber-300 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400',
        className
      )}
      maxFiles={1}
      maxSize={maxSize * 1024 * 1024}
    >
      <DropzoneEmptyState
        title={placeholder}
        description={description}
        icon={<FileText className="h-full w-full text-amber-500" />}
      />
      <DropzoneContent loading={loading} />
    </Dropzone>
  );
}
