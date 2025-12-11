import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { lookup } from 'mime-types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];
    const filePath = pathSegments.join('/');

    // Prevent path traversal attacks
    if (filePath.includes('..') || filePath.includes('//')) {
      return new NextResponse('Invalid path', { status: 400 });
    }

    // Construct full file path - check both public/uploads and /app/uploads
    const publicUploadsPath = join(process.cwd(), 'public', 'uploads', filePath);
    const appUploadsPath = join(process.cwd(), 'uploads', filePath);

    let fullPath: string | null = null;

    // Try public/uploads first, then /app/uploads
    try {
      await stat(publicUploadsPath);
      fullPath = publicUploadsPath;
    } catch {
      try {
        await stat(appUploadsPath);
        fullPath = appUploadsPath;
      } catch {
        return new NextResponse('File not found', { status: 404 });
      }
    }

    // Read the file
    const fileBuffer = await readFile(fullPath);

    // Determine content type
    const contentType = lookup(filePath) || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
