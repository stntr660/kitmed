import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { handleMultipleFileUpload, getUploadPreset } from '@/lib/upload';
import { activityDb } from '@/lib/database';

async function uploadFiles(request: NextRequest) {
  try {
    const user = (request as any).user;
    const formData = await request.formData();
    const preset = formData.get('preset') as string;
    
    // Get upload options from preset or use defaults
    const uploadOptions = preset ? getUploadPreset(preset) : {};
    
    // Handle the file upload
    const result = await handleMultipleFileUpload(request, 'files', uploadOptions);
    
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
  resource: 'products', // Adjust based on what's being uploaded
  action: 'create',
});