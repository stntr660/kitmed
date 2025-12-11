import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

// Configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export interface UploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
  optimizeImage?: boolean;
  folder?: string;
}

export interface UploadResult {
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

export interface UploadError {
  code: string;
  message: string;
  field?: string;
}

// Ensure upload directory exists
async function ensureUploadDir(folder?: string): Promise<string> {
  const uploadPath = folder ? join(UPLOAD_DIR, folder) : UPLOAD_DIR;

  try {
    await mkdir(uploadPath, { recursive: true });
    return uploadPath;
  } catch (error) {
    throw new Error(`Failed to create upload directory: ${error.message}`);
  }
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const extension = originalName.split('.').pop() || '';
  const name = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
  const timestamp = Date.now();
  const uuid = randomUUID().split('-')[0];

  return `${name}-${timestamp}-${uuid}.${extension}`.toLowerCase();
}

// Validate file
function validateFile(file: File, options: UploadOptions = {}): UploadError | null {
  const {
    maxSize = MAX_FILE_SIZE,
    allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      code: 'INVALID_FILE_TYPE',
      message: `File type ${file.type} is not allowed`,
    };
  }

  return null;
}

// Get image dimensions
async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    return null;
  }
}

// Optimize image
async function optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    let pipeline = sharp(buffer);

    // Resize if too large
    pipeline = pipeline.resize(2048, 2048, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Optimize based on type
    switch (mimeType) {
      case 'image/jpeg':
        pipeline = pipeline.jpeg({ quality: 85, progressive: true });
        break;
      case 'image/png':
        pipeline = pipeline.png({ compressionLevel: 8 });
        break;
      case 'image/webp':
        pipeline = pipeline.webp({ quality: 85 });
        break;
    }

    return pipeline.toBuffer();
  } catch (error) {
    return buffer; // Return original if optimization fails
  }
}

// Generate thumbnail
async function generateThumbnail(buffer: Buffer, mimeType: string): Promise<Buffer | null> {
  try {
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return null;
    }

    return sharp(buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    return null;
  }
}

// Single file upload
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    folder,
    optimizeImage: shouldOptimize = true,
    generateThumbnail: shouldGenerateThumbnail = true,
  } = options;

  // Validate file
  const validationError = validateFile(file, options);
  if (validationError) {
    throw new Error(validationError.message);
  }

  // Prepare upload directory
  const uploadPath = await ensureUploadDir(folder);

  // Generate filename
  const filename = generateFilename(file.name);
  const filePath = join(uploadPath, filename);

  // Get file buffer
  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  // Get image dimensions if it's an image
  const dimensions = ALLOWED_IMAGE_TYPES.includes(file.type)
    ? await getImageDimensions(buffer)
    : null;

  // Optimize image if requested
  if (shouldOptimize && ALLOWED_IMAGE_TYPES.includes(file.type)) {
    buffer = await optimizeImage(buffer, file.type);
  }

  // Save main file
  await writeFile(filePath, buffer);

  // Generate thumbnail if requested
  let thumbnailUrl: string | undefined;
  if (shouldGenerateThumbnail && dimensions) {
    const thumbnailBuffer = await generateThumbnail(buffer, file.type);
    if (thumbnailBuffer) {
      const thumbnailFilename = `thumb-${filename}`;
      const thumbnailPath = join(uploadPath, thumbnailFilename);
      await writeFile(thumbnailPath, thumbnailBuffer);

      const thumbnailSubPath = folder ? `${folder}/${thumbnailFilename}` : thumbnailFilename;
      thumbnailUrl = `/uploads/${thumbnailSubPath}`;
    }
  }

  // Construct file URL
  const fileSubPath = folder ? `${folder}/${filename}` : filename;
  const url = `/uploads/${fileSubPath}`;

  return {
    id: randomUUID(),
    filename,
    originalName: file.name,
    url,
    size: buffer.length,
    mimeType: file.type,
    width: dimensions?.width,
    height: dimensions?.height,
    thumbnailUrl,
  };
}

// Multiple file upload
export async function uploadFiles(
  files: File[],
  options: UploadOptions = {}
): Promise<{ results: UploadResult[]; errors: Array<{ index: number; error: string }> }> {
  const results: UploadResult[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadFile(files[i], options);
      results.push(result);
    } catch (error) {
      errors.push({
        index: i,
        error: error.message,
      });
    }
  }

  return { results, errors };
}

// Handle form data upload from request
export async function handleFileUpload(
  request: NextRequest,
  fieldName: string = 'file',
  options: UploadOptions = {}
): Promise<UploadResult> {
  const formData = await request.formData();
  const file = formData.get(fieldName) as File;

  if (!file) {
    throw new Error('No file provided');
  }

  return uploadFile(file, options);
}

// Handle multiple files from request
export async function handleMultipleFileUpload(
  request: NextRequest,
  fieldName: string = 'files',
  options: UploadOptions = {}
): Promise<{ results: UploadResult[]; errors: Array<{ index: number; error: string }> }> {
  const formData = await request.formData();
  const files = formData.getAll(fieldName) as File[];

  if (files.length === 0) {
    throw new Error('No files provided');
  }

  return uploadFiles(files, options);
}

// Delete file
export async function deleteFile(filename: string, folder?: string): Promise<void> {
  const { unlink } = await import('fs/promises');
  const uploadPath = folder ? join(UPLOAD_DIR, folder) : UPLOAD_DIR;
  const filePath = join(uploadPath, filename);

  try {
    await unlink(filePath);

    // Also delete thumbnail if it exists
    const thumbnailFilename = `thumb-${filename}`;
    const thumbnailPath = join(uploadPath, thumbnailFilename);
    try {
      await unlink(thumbnailPath);
    } catch {
      // Thumbnail doesn't exist, ignore
    }
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

// Get file info
export async function getFileInfo(filename: string, folder?: string): Promise<{
  exists: boolean;
  size?: number;
  mimeType?: string;
}> {
  const { stat } = await import('fs/promises');
  const { lookup } = await import('mime-types');
  const uploadPath = folder ? join(UPLOAD_DIR, folder) : UPLOAD_DIR;
  const filePath = join(uploadPath, filename);

  try {
    const stats = await stat(filePath);
    const mimeType = lookup(filename) || 'application/octet-stream';

    return {
      exists: true,
      size: stats.size,
      mimeType: mimeType as string,
    };
  } catch (error) {
    return { exists: false };
  }
}

// Preset configurations for different file types
export const uploadPresets: Record<string, UploadOptions> = {
  productImage: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ALLOWED_IMAGE_TYPES,
    generateThumbnail: true,
    optimizeImage: true,
    folder: 'products',
  },

  partnerLogo: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ALLOWED_IMAGE_TYPES,
    generateThumbnail: true,
    optimizeImage: true,
    folder: 'partners',
  },

  bannerImage: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ALLOWED_IMAGE_TYPES,
    generateThumbnail: false,
    optimizeImage: true,
    folder: 'banners',
  },

  productDocument: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    generateThumbnail: false,
    optimizeImage: false,
    folder: 'documents',
  },

  avatar: {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ALLOWED_IMAGE_TYPES,
    generateThumbnail: true,
    optimizeImage: true,
    folder: 'avatars',
  },

  categoryImage: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ALLOWED_IMAGE_TYPES,
    generateThumbnail: true,
    optimizeImage: true,
    folder: 'categories',
  },

  partnerBrochure: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    generateThumbnail: false,
    optimizeImage: false,
    folder: 'brochures',
  },

  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    generateThumbnail: false,
    optimizeImage: false,
    folder: 'documents',
  },
};

// Utility to get preset by name
export function getUploadPreset(presetName: string): UploadOptions {
  return uploadPresets[presetName] || {};
}

// Clean up old files (utility for maintenance)
export async function cleanupOldFiles(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
  const { readdir, stat, unlink } = await import('fs/promises');

  async function cleanDirectory(dirPath: string): Promise<void> {
    try {
      const files = await readdir(dirPath);
      const now = Date.now();

      for (const file of files) {
        const filePath = join(dirPath, file);
        const stats = await stat(filePath);

        if (stats.isFile() && (now - stats.mtime.getTime()) > maxAgeMs) {
          await unlink(filePath);
        }
      }
    } catch (error) {
      console.error(`Failed to clean directory ${dirPath}:`, error);
    }
  }

  // Clean main upload directory and subdirectories
  await cleanDirectory(UPLOAD_DIR);

  for (const preset of Object.values(uploadPresets)) {
    if (preset.folder) {
      await cleanDirectory(join(UPLOAD_DIR, preset.folder));
    }
  }
}