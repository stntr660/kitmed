'use client';

import React, { forwardRef, useCallback, useRef } from 'react';
import { useDropzone, DropzoneOptions, FileRejection } from 'react-dropzone';
import { Upload, X, FileImage, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DropzoneProps extends Omit<DropzoneOptions, 'onDrop'> {
  onDrop: (files: File[]) => void;
  onError?: (fileRejections: FileRejection[]) => void;
  src?: File[] | string;
  className?: string;
  children?: React.ReactNode;
}

interface DropzoneEmptyStateProps {
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

interface DropzoneContentProps {
  className?: string;
  onRemove?: (index: number) => void;
  loading?: boolean;
}

const Dropzone = forwardRef<HTMLDivElement, DropzoneProps>(
  ({ onDrop, onError, src, className, children, ...props }, ref) => {
    const {
      getRootProps,
      getInputProps,
      isDragActive,
      isDragReject,
      isDragAccept,
    } = useDropzone({
      onDrop,
      onDropRejected: onError,
      ...props,
    });

    return (
      <div
        ref={ref}
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          'hover:bg-muted/50',
          isDragActive && 'border-primary bg-primary/5',
          isDragAccept && 'border-green-500 bg-green-50',
          isDragReject && 'border-red-500 bg-red-50',
          className
        )}
      >
        <input {...getInputProps()} />
        {children}
      </div>
    );
  }
);

Dropzone.displayName = 'Dropzone';

const DropzoneEmptyState = forwardRef<HTMLDivElement, DropzoneEmptyStateProps>(
  ({ className, title, description, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center py-8',
          className
        )}
        {...props}
      >
        <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
          {icon || <Upload className="h-full w-full" />}
        </div>
        <h3 className="mb-2 text-sm font-medium text-foreground">
          {title || 'Upload files'}
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {description || 'Drag & drop files here, or click to select files'}
        </p>
      </div>
    );
  }
);

DropzoneEmptyState.displayName = 'DropzoneEmptyState';

const DropzoneContent = forwardRef<HTMLDivElement, DropzoneContentProps>(
  ({ className, onRemove, loading, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-2', className)}
        {...props}
      >
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Uploading...</span>
          </div>
        )}
      </div>
    );
  }
);

DropzoneContent.displayName = 'DropzoneContent';

export { Dropzone, DropzoneEmptyState, DropzoneContent };
export type { DropzoneProps, DropzoneEmptyStateProps, DropzoneContentProps };