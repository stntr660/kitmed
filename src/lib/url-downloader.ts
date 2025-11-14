import { uploadFile, type UploadOptions, type UploadResult } from './upload';

export interface DownloadFromUrlOptions extends UploadOptions {
  timeout?: number;
  userAgent?: string;
  maxRetries?: number;
  retryDelay?: number;
}

export interface DownloadResult extends UploadResult {
  originalUrl: string;
  downloadTime: number;
}

export interface DownloadError {
  url: string;
  error: string;
  code: string;
  retries?: number;
}

// Validate if string is a valid URL
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Get file extension from URL
function getFileExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split('.').pop();
    return extension || 'bin';
  } catch {
    return 'bin';
  }
}

// Get filename from URL
function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split('/').pop();
    return filename || `download.${getFileExtensionFromUrl(url)}`;
  } catch {
    return `download.${getFileExtensionFromUrl(url)}`;
  }
}

// Get content type from response headers or URL extension
function getContentType(response: Response, url: string): string {
  const contentType = response.headers.get('content-type');
  if (contentType) {
    return contentType.split(';')[0]; // Remove charset info
  }

  // Fallback to guessing from extension
  const extension = getFileExtensionFromUrl(url).toLowerCase();
  const typeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return typeMap[extension] || 'application/octet-stream';
}

// Download file from URL with retry logic
async function fetchWithRetry(
  url: string, 
  options: DownloadFromUrlOptions,
  retryCount = 0
): Promise<Response> {
  const {
    timeout = 30000,
    userAgent = 'KITMED-Platform/1.0',
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': userAgent,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (retryCount < maxRetries) {
      console.warn(`Download attempt ${retryCount + 1} failed for ${url}, retrying...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
      return fetchWithRetry(url, options, retryCount + 1);
    }

    throw error;
  }
}

// Download single file from URL
export async function downloadFileFromUrl(
  url: string,
  options: DownloadFromUrlOptions = {}
): Promise<DownloadResult> {
  const startTime = Date.now();

  // Validate URL
  if (!isValidUrl(url)) {
    throw new Error(`Invalid URL: ${url}`);
  }

  try {
    // Download the file
    const response = await fetchWithRetry(url, options);
    
    // Get file info
    const arrayBuffer = await response.arrayBuffer();
    const contentType = getContentType(response, url);
    const filename = getFilenameFromUrl(url);

    // Create File-like object
    const file = new File([arrayBuffer], filename, { type: contentType });

    // Upload to local storage
    const uploadResult = await uploadFile(file, options);
    
    const downloadTime = Date.now() - startTime;

    return {
      ...uploadResult,
      originalUrl: url,
      downloadTime,
    };
  } catch (error) {
    const downloadTime = Date.now() - startTime;
    throw new Error(`Failed to download ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Download multiple files from URLs
export async function downloadFilesFromUrls(
  urls: string[],
  options: DownloadFromUrlOptions = {}
): Promise<{
  results: DownloadResult[];
  errors: DownloadError[];
}> {
  const results: DownloadResult[] = [];
  const errors: DownloadError[] = [];

  // Process downloads in parallel (max 5 concurrent)
  const BATCH_SIZE = 5;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (url, index) => {
      try {
        const result = await downloadFileFromUrl(url, options);
        return { success: true, result, url, index: i + index };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          url, 
          index: i + index 
        };
      }
    });

    const batchResults = await Promise.all(promises);
    
    batchResults.forEach((item) => {
      if (item.success) {
        results.push(item.result);
      } else {
        errors.push({
          url: item.url,
          error: item.error,
          code: 'DOWNLOAD_FAILED',
        });
      }
    });
  }

  return { results, errors };
}

// Utility to extract URLs from text
export function extractUrlsFromText(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s,;]+/gi;
  const urls = text.match(urlRegex) || [];
  return urls.filter(url => isValidUrl(url));
}

// Validate URLs before processing
export async function validateUrls(urls: string[]): Promise<{
  valid: string[];
  invalid: Array<{ url: string; reason: string }>;
}> {
  const valid: string[] = [];
  const invalid: Array<{ url: string; reason: string }> = [];

  for (const url of urls) {
    if (!isValidUrl(url)) {
      invalid.push({ url, reason: 'Invalid URL format' });
      continue;
    }

    try {
      // Quick HEAD request to check if URL is accessible
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) 
      });
      
      if (response.ok) {
        valid.push(url);
      } else {
        invalid.push({ url, reason: `HTTP ${response.status}` });
      }
    } catch (error) {
      invalid.push({ 
        url, 
        reason: error instanceof Error ? error.message : 'Network error'
      });
    }
  }

  return { valid, invalid };
}

// Clean filename for safe storage
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100); // Limit length
}

// Get file size from URL without downloading
export async function getRemoteFileSize(url: string): Promise<number | null> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : null;
  } catch {
    return null;
  }
}

// Progress tracking interface
export interface DownloadProgress {
  url: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number; // 0-100
  downloadedBytes?: number;
  totalBytes?: number;
  error?: string;
}

// Download with progress tracking
export async function downloadFileWithProgress(
  url: string,
  options: DownloadFromUrlOptions = {},
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
  const startTime = Date.now();
  
  if (!isValidUrl(url)) {
    throw new Error(`Invalid URL: ${url}`);
  }

  // Initial progress
  onProgress?.({
    url,
    status: 'pending',
    progress: 0,
  });

  try {
    const {
      timeout = 30000,
      userAgent = 'KITMED-Platform/1.0',
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    onProgress?.({
      url,
      status: 'downloading',
      progress: 10,
    });

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': userAgent,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : null;

    onProgress?.({
      url,
      status: 'downloading',
      progress: 25,
      totalBytes: totalBytes || undefined,
    });

    // Read response with progress
    const chunks: Uint8Array[] = [];
    let downloadedBytes = 0;

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      downloadedBytes += value.length;

      if (totalBytes) {
        const progress = Math.min(25 + (downloadedBytes / totalBytes) * 60, 85);
        onProgress?.({
          url,
          status: 'downloading',
          progress,
          downloadedBytes,
          totalBytes,
        });
      }
    }

    // Combine chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const arrayBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      arrayBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    onProgress?.({
      url,
      status: 'downloading',
      progress: 90,
      downloadedBytes: totalLength,
      totalBytes: totalBytes || totalLength,
    });

    // Create file and upload
    const contentType = getContentType(response, url);
    const filename = getFilenameFromUrl(url);
    const file = new File([arrayBuffer], filename, { type: contentType });
    
    const uploadResult = await uploadFile(file, options);
    const downloadTime = Date.now() - startTime;

    const result: DownloadResult = {
      ...uploadResult,
      originalUrl: url,
      downloadTime,
    };

    onProgress?.({
      url,
      status: 'completed',
      progress: 100,
      downloadedBytes: totalLength,
      totalBytes: totalBytes || totalLength,
    });

    return result;
  } catch (error) {
    onProgress?.({
      url,
      status: 'failed',
      progress: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
}