import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Transform snake_case to camelCase for frontend
function transformMedia(media: any) {
  return {
    id: media.id,
    productId: media.product_id,
    type: media.type,
    url: media.url,
    altText: media.alt_text,
    title: media.title,
    sortOrder: media.sort_order,
    isPrimary: media.is_primary,
    createdAt: media.created_at,
  };
}

// GET /api/admin/products/[id]/media - Get product media
async function getProductMedia(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const media = await prisma.product_media.findMany({
      where: { product_id: params.id },
      orderBy: [
        { is_primary: 'desc' },
        { sort_order: 'asc' },
        { created_at: 'asc' }
      ],
    });

    return NextResponse.json({
      success: true,
      data: media.map(transformMedia),
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Media fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch product media',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/products/[id]/media - Upload media files
async function uploadProductMedia(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No files provided',
          },
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'products', params.id);
    await mkdir(uploadsDir, { recursive: true });

    const uploadedMedia = [];

    // Check how many existing media to determine sort order
    const existingMediaCount = await prisma.product_media.count({
      where: { product_id: params.id },
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        continue; // Skip invalid file types
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        continue; // Skip files larger than 5MB
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}-${i}.${fileExtension}`;
      const filePath = join(uploadsDir, fileName);

      // Save file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Create database record
      const mediaRecord = await prisma.product_media.create({
        data: {
          id: crypto.randomUUID(),
          product_id: params.id,
          type: 'image',
          url: `/uploads/products/${params.id}/${fileName}`,
          alt_text: file.name.split('.')[0], // Use filename without extension as alt text
          title: file.name,
          sort_order: existingMediaCount + i,
          is_primary: existingMediaCount === 0 && i === 0, // First image is primary only if no existing media
        },
      });

      uploadedMedia.push(mediaRecord);
    }

    return NextResponse.json({
      success: true,
      data: uploadedMedia.map(transformMedia),
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        message: `${uploadedMedia.length} files uploaded successfully`,
      },
    });
  } catch (error) {
    console.error('Media upload error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload media',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id]/media - Delete all product media
async function deleteProductMedia(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Delete media records from database
    const deletedMedia = await prisma.product_media.deleteMany({
      where: { product_id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: `${deletedMedia.count} media files deleted successfully`,
      data: { deletedCount: deletedMedia.count },
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

// Export handlers with authentication
export const GET = withAuth(getProductMedia);
export const POST = withAuth(uploadProductMedia, { resource: 'products', action: 'update' });
export const DELETE = withAuth(deleteProductMedia, { resource: 'products', action: 'delete' });