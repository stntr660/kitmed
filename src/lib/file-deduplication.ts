import { createHash } from 'crypto';
import { prisma } from '@/lib/database';
import { downloadFileFromUrl, type DownloadFromUrlOptions } from '@/lib/url-downloader';

export interface FileDeduplicationResult {
  fileId: string;
  localPath: string;
  isNewDownload: boolean;
  contentHash: string;
  fileSize: number;
}

export interface FileRegistryEntry {
  id: string;
  originalUrl: string;
  urlHash: string;
  contentHash: string;
  localPath: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  fileType: string;
  downloadedAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  isOrphaned: boolean;
}

// Generate SHA-256 hash from string
export function generateUrlHash(url: string): string {
  return createHash('sha256').update(url.trim().toLowerCase()).digest('hex');
}

// Generate SHA-256 hash from file content
export function generateContentHash(content: Buffer | Uint8Array): string {
  return createHash('sha256').update(content).digest('hex');
}

// Determine file type from MIME type and URL
export function determineFileType(mimeType: string, url: string): string {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  
  // Fallback to URL extension
  const extension = url.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension || '')) {
    return 'image';
  }
  if (extension === 'pdf') {
    return 'pdf';
  }
  
  return 'document';
}

// Check if file exists in registry by URL hash
export async function findFileByUrlHash(urlHash: string): Promise<FileRegistryEntry | null> {
  try {
    const file = await prisma.fileRegistry.findUnique({
      where: { urlHash }
    });
    return file;
  } catch (error) {
    console.error('Error finding file by URL hash:', error);
    return null;
  }
}

// Check if file exists in registry by content hash
export async function findFileByContentHash(contentHash: string): Promise<FileRegistryEntry | null> {
  try {
    const file = await prisma.fileRegistry.findFirst({
      where: { contentHash }
    });
    return file;
  } catch (error) {
    console.error('Error finding file by content hash:', error);
    return null;
  }
}

// Update file access metadata
export async function updateFileAccess(fileId: string): Promise<void> {
  try {
    await prisma.fileRegistry.update({
      where: { id: fileId },
      data: {
        lastAccessedAt: new Date(),
        accessCount: {
          increment: 1
        }
      }
    });
  } catch (error) {
    console.error('Error updating file access:', error);
  }
}

// Register new file in registry
export async function registerFile(
  originalUrl: string,
  localPath: string,
  filename: string,
  mimeType: string,
  fileSize: number,
  contentHash: string
): Promise<FileRegistryEntry> {
  const urlHash = generateUrlHash(originalUrl);
  const fileType = determineFileType(mimeType, originalUrl);

  const file = await prisma.fileRegistry.create({
    data: {
      originalUrl,
      urlHash,
      contentHash,
      localPath,
      filename,
      mimeType,
      fileSize,
      fileType,
      downloadedAt: new Date(),
      lastAccessedAt: new Date(),
      accessCount: 1,
      isOrphaned: false
    }
  });

  return file;
}

// Download file with deduplication
export async function downloadWithDeduplication(
  url: string,
  options: DownloadFromUrlOptions = {}
): Promise<FileDeduplicationResult> {
  const urlHash = generateUrlHash(url);
  
  // Check if file already exists by URL hash
  let existingFile = await findFileByUrlHash(urlHash);
  
  if (existingFile) {
    // Update access metadata
    await updateFileAccess(existingFile.id);
    
    return {
      fileId: existingFile.id,
      localPath: existingFile.localPath,
      isNewDownload: false,
      contentHash: existingFile.contentHash,
      fileSize: existingFile.fileSize
    };
  }
  
  // Download the file
  const downloadResult = await downloadFileFromUrl(url, options);
  
  // Read downloaded file to generate content hash
  const fs = await import('fs/promises');
  const path = await import('path');
  const fullPath = path.join(process.cwd(), 'public', downloadResult.filePath);
  const fileBuffer = await fs.readFile(fullPath);
  const contentHash = generateContentHash(fileBuffer);
  
  // Check if we already have this content (different URL, same file)
  const duplicateContent = await findFileByContentHash(contentHash);
  
  if (duplicateContent) {
    // Same content exists, remove newly downloaded file
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.warn('Failed to remove duplicate file:', error);
    }
    
    // Update access metadata for existing file
    await updateFileAccess(duplicateContent.id);
    
    return {
      fileId: duplicateContent.id,
      localPath: duplicateContent.localPath,
      isNewDownload: false,
      contentHash: duplicateContent.contentHash,
      fileSize: duplicateContent.fileSize
    };
  }
  
  // Register new unique file
  const registeredFile = await registerFile(
    url,
    downloadResult.filePath,
    downloadResult.fileName,
    downloadResult.mimeType,
    downloadResult.fileSize,
    contentHash
  );
  
  return {
    fileId: registeredFile.id,
    localPath: registeredFile.localPath,
    isNewDownload: true,
    contentHash: registeredFile.contentHash,
    fileSize: registeredFile.fileSize
  };
}

// Associate file with product
export async function associateFileWithProduct(
  productId: string,
  fileId: string,
  fileType: 'pdf_brochure' | 'product_image',
  options: {
    sortOrder?: number;
    isPrimary?: boolean;
    altText?: string;
    title?: string;
    description?: string;
  } = {}
): Promise<string> {
  const productFile = await prisma.productFile.create({
    data: {
      productId,
      fileId,
      fileType,
      sortOrder: options.sortOrder || 0,
      isPrimary: options.isPrimary || false,
      altText: options.altText || null,
      title: options.title || null,
      description: options.description || null
    }
  });
  
  return productFile.id;
}

// Mark orphaned files for cleanup
export async function markOrphanedFiles(): Promise<number> {
  try {
    // Find files that have no product associations
    const orphanedFiles = await prisma.fileRegistry.findMany({
      where: {
        productFiles: {
          none: {}
        },
        isOrphaned: false
      }
    });
    
    if (orphanedFiles.length === 0) {
      return 0;
    }
    
    // Mark them as orphaned
    await prisma.fileRegistry.updateMany({
      where: {
        id: {
          in: orphanedFiles.map(f => f.id)
        }
      },
      data: {
        isOrphaned: true
      }
    });
    
    return orphanedFiles.length;
  } catch (error) {
    console.error('Error marking orphaned files:', error);
    return 0;
  }
}

// Get file registry statistics
export async function getFileRegistryStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  duplicatesFound: number;
  orphanedFiles: number;
  fileTypes: Record<string, number>;
}> {
  try {
    const [
      totalFiles,
      totalSizeResult,
      orphanedCount,
      fileTypeStats,
      allFiles
    ] = await Promise.all([
      prisma.fileRegistry.count(),
      prisma.fileRegistry.aggregate({
        _sum: {
          fileSize: true
        }
      }),
      prisma.fileRegistry.count({
        where: { isOrphaned: true }
      }),
      prisma.fileRegistry.groupBy({
        by: ['fileType'],
        _count: {
          fileType: true
        }
      }),
      prisma.fileRegistry.findMany({
        select: { contentHash: true }
      })
    ]);
    
    // Calculate duplicates by counting unique content hashes vs total files
    const uniqueContentHashes = new Set(allFiles.map(f => f.contentHash));
    const duplicatesFound = totalFiles - uniqueContentHashes.size;
    
    // Convert file type stats to record
    const fileTypes: Record<string, number> = {};
    fileTypeStats.forEach(stat => {
      fileTypes[stat.fileType] = stat._count.fileType;
    });
    
    return {
      totalFiles,
      totalSize: totalSizeResult._sum.fileSize || 0,
      duplicatesFound,
      orphanedFiles: orphanedCount,
      fileTypes
    };
  } catch (error) {
    console.error('Error getting file registry stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      duplicatesFound: 0,
      orphanedFiles: 0,
      fileTypes: {}
    };
  }
}

// Cleanup orphaned files older than specified days
export async function cleanupOrphanedFiles(olderThanDays: number = 7): Promise<{
  deleted: number;
  errors: string[];
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  try {
    const orphanedFiles = await prisma.fileRegistry.findMany({
      where: {
        isOrphaned: true,
        lastAccessedAt: {
          lt: cutoffDate
        }
      }
    });
    
    const fs = await import('fs/promises');
    const path = await import('path');
    
    let deleted = 0;
    const errors: string[] = [];
    
    for (const file of orphanedFiles) {
      try {
        // Delete physical file
        const fullPath = path.join(process.cwd(), 'public', file.localPath);
        await fs.unlink(fullPath);
        
        // Delete from registry
        await prisma.fileRegistry.delete({
          where: { id: file.id }
        });
        
        deleted++;
      } catch (error) {
        errors.push(`Failed to delete ${file.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return { deleted, errors };
  } catch (error) {
    return {
      deleted: 0,
      errors: [`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}