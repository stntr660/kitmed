import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { unlink } from 'fs/promises';
import { join } from 'path';

// DELETE /api/admin/media/[mediaId] - Delete specific media file
async function deleteMedia(request: NextRequest, { params }: { params: { mediaId: string } }) {
  try {
    // Find the media record
    const media = await prisma.productMedia.findUnique({
      where: { id: params.mediaId },
    });

    if (!media) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Media not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete file from disk
    try {
      const filePath = join(process.cwd(), 'public', media.url);
      await unlink(filePath);
    } catch (fileError) {

      // Continue with database deletion even if file deletion fails
    }

    // Delete database record
    await prisma.productMedia.delete({
      where: { id: params.mediaId },
    });

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Media deletion error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete media',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/media/[mediaId] - Update media properties
async function updateMedia(request: NextRequest, { params }: { params: { mediaId: string } }) {
  try {
    const body = await request.json();
    const { altText, title, isPrimary, sortOrder } = body;

    // Find the media record
    const existingMedia = await prisma.productMedia.findUnique({
      where: { id: params.mediaId },
    });

    if (!existingMedia) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Media not found',
          },
        },
        { status: 404 }
      );
    }

    // If setting as primary, unset other primary images for this product
    if (isPrimary === true) {
      await prisma.productMedia.updateMany({
        where: {
          productId: existingMedia.productId,
          id: { not: params.mediaId }
        },
        data: { isPrimary: false },
      });
    }

    // Update media record
    const updatedMedia = await prisma.productMedia.update({
      where: { id: params.mediaId },
      data: {
        altText: altText !== undefined ? altText : existingMedia.altText,
        title: title !== undefined ? title : existingMedia.title,
        isPrimary: isPrimary !== undefined ? isPrimary : existingMedia.isPrimary,
        sortOrder: sortOrder !== undefined ? sortOrder : existingMedia.sortOrder,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedMedia,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Media update error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update media',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// Export handlers
export const DELETE = deleteMedia;
export const PUT = updateMedia;