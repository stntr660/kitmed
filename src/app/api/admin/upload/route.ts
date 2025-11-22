import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { uploadFiles as uploadFilesFunction, getUploadPreset } from '@/lib/upload';
import { activityDb } from '@/lib/database';

async function uploadFiles(request: NextRequest) {
  try {
    const user = (request as any).user;
    const formData = await request.formData();
    const preset = formData.get('preset') as string;
    const files = formData.getAll('files') as File[];
    
    if (files.length === 0) {
      throw new Error('No files provided');
    }
    
    // Get upload options from preset or use defaults
    const uploadOptions = preset ? getUploadPreset(preset) : {};
    
    // Handle the file upload directly with the files array
    const result = await uploadFilesFunction(files, uploadOptions);
    
    // Log activity for successful uploads
    if (result.results.length > 0) {
      await activityDb.log({
        userId: user.id,
        action: 'upload',
        resourceType: 'file',
        details: {
          fileCount: result.results.length,
          preset,
          files: result.results.map(f => ({ name: f.originalName, size: f.size })),
        },
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error' || 'File upload failed',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(uploadFiles, {
  resource: 'partners', // Allow partner uploads since that's what we're mainly using
  action: 'create',
});