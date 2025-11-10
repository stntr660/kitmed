import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

// GET /api/admin/products/[id]/media - Get product media
async function getProductMedia(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const media = await prisma.productMedia.findMany({
      where: { productId: params.id },
      orderBy: [
        { isPrimary: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ],
    });

    return NextResponse.json({
      success: true,
      data: media,
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
    const product = await prisma.product.findUnique({
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
      const mediaRecord = await prisma.productMedia.create({
        data: {
          productId: params.id,
          type: 'image',
          url: `/uploads/products/${params.id}/${fileName}`,
          altText: file.name.split('.')[0], // Use filename without extension as alt text
          title: file.name,
          sortOrder: i,
          isPrimary: i === 0, // First image is primary
        },
      });

      uploadedMedia.push(mediaRecord);
    }

    return NextResponse.json({
      success: true,
      data: uploadedMedia,
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
    const deletedMedia = await prisma.productMedia.deleteMany({
      where: { productId: params.id },
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

// Export handlers
export const GET = getProductMedia;
export const POST = uploadProductMedia;
export const DELETE = deleteProductMedia;