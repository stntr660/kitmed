'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatFileSize } from '@/lib/utils';

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

interface FileUploadProps {
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  preview?: boolean;
  onUpload?: (files: UploadedFile[]) => void;
  onRemove?: (fileId: string) => void;
  disabled?: boolean;
  className?: string;
  preset?: 'productImage' | 'partnerLogo' | 'bannerImage' | 'productDocument' | 'avatar';
  existingFiles?: UploadedFile[];
}

const presetConfigs = {
  productImage: {
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    multiple: true,
    preview: true,
  },
  partnerLogo: {
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'] },
    maxSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    multiple: false,
    preview: true,
  },
  bannerImage: {
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
    multiple: false,
    preview: true,
  },
  productDocument: {
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] },
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 5,
    multiple: true,
    preview: false,
  },
  avatar: {
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 1 * 1024 * 1024, // 1MB
    maxFiles: 1,
    multiple: false,
    preview: true,
  },
};

export function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 1,
  multiple = false,
  preview = true,
  onUpload,
  onRemove,
  disabled = false,
  className,
  preset,
  existingFiles = [],
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(existingFiles);
  const [errors, setErrors] = useState<string[]>([]);

  // Apply preset configuration
  const config = preset ? presetConfigs[preset] : {
    accept,
    maxSize,
    maxFiles,
    multiple,
    preview,
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
    setErrors([]);

    // Handle file rejections
    if (fileRejections.length > 0) {
      const rejectionErrors = fileRejections.map(rejection => {
        const { file, errors } = rejection;
        return `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`;
      });
      setErrors(rejectionErrors);
    }

    if (acceptedFiles.length === 0) return;

    // Check if adding these files would exceed maxFiles
    if (uploadedFiles.length + acceptedFiles.length > config.maxFiles!) {
      setErrors(prev => [...prev, `Maximum ${config.maxFiles} files allowed`]);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });

      // Add preset information if available
      if (preset) {
        formData.append('preset', preset);
      }

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      if (data.success) {
        const newFiles = data.data.results;
        setUploadedFiles(prev => [...prev, ...newFiles]);
        onUpload?.(newFiles);

        if (data.data.errors?.length > 0) {
          setErrors(data.data.errors.map((err: any) => err.error));
        }
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors(prev => [...prev, 'Upload failed. Please try again.']);
    } finally {
      setUploading(false);
    }
  }, [uploadedFiles, config.maxFiles, preset, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: config.accept,
    maxSize: config.maxSize,
    multiple: config.multiple,
    disabled: disabled || uploading,
  });

  const handleRemove = async (fileId: string) => {
    try {
      const response = await fetch(`/api/admin/upload/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
        onRemove?.(fileId);
      }
    } catch (error) {
      console.error('Remove file error:', error);
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  return (
    <div className={className}>
      {/* Upload Area */}
      {(uploadedFiles.length < config.maxFiles! || config.multiple) && (
        <Card className="border-dashed border-2">
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`
                cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors
                ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />

              {uploading ? (
                <LoadingSpinner text="Uploading..." />
              ) : (
                <div className="space-y-2">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isDragActive ? 'Drop files here' : 'Upload files'}
                    </p>
                    <p className="text-xs text-gray-500">
                      or click to browse
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>
                      Max {formatFileSize(config.maxSize!)} per file
                      {config.maxFiles! > 1 && ` • Up to ${config.maxFiles} files`}
                    </p>
                    {config.accept && (
                      <p>
                        Accepted: {Object.values(config.accept).flat().join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card className="mt-4 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Uploaded Files ({uploadedFiles.length})
          </h4>

          <div className={`grid gap-3 ${config.preview && isImage(uploadedFiles[0]?.mimeType) ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {uploadedFiles.map((file) => (
              <Card key={file.id} className="relative">
                <CardContent className="p-3">
                  {config.preview && isImage(file.mimeType) ? (
                    <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={file.thumbnailUrl || file.url}
                        alt={file.originalName}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => handleRemove(file.id)}
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {isImage(file.mimeType) ? (
                          <PhotoIcon className="h-8 w-8 text-gray-400" />
                        ) : (
                          <DocumentIcon className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.originalName}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                          {file.width && file.height && (
                            <Badge variant="secondary" className="text-xs">
                              {file.width}×{file.height}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(file.id)}
                        className="flex-shrink-0"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {config.preview && isImage(file.mimeType) && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-900 truncate">
                        {file.originalName}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                        {file.width && file.height && (
                          <Badge variant="secondary" className="text-xs">
                            {file.width}×{file.height}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}