import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const csvProductSchema = z.object({
  referenceFournisseur: z.string().min(1, 'Référence fournisseur is required'),
  constructeur: z.string().min(1, 'Constructeur is required'),
  categoryId: z.string().min(1, 'Category is required'),
  nom_fr: z.string().min(1, 'French name is required'),
  nom_en: z.string().min(1, 'English name is required'),
  description_fr: z.string().optional().default(''),
  description_en: z.string().optional().default(''),
  ficheTechnique_fr: z.string().optional().default(''),
  ficheTechnique_en: z.string().optional().default(''),
  pdfBrochureUrl: z.string().optional().default(''),
  imageUrls: z.string().optional().default(''), // Comma-separated URLs
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  featured: z.preprocess((val) => String(val || 'false'), z.string().transform((val) => val?.toLowerCase() === 'true' || val === '1')),
});

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  filesDownloaded?: number;
  data?: any[];
}

// File download utility
async function downloadAndSaveFile(url: string, fileName: string, subDir: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // Create uploads directory structure
    const uploadsDir = join(process.cwd(), 'public', 'uploads', subDir);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, uint8Array);
    
    return `/uploads/${subDir}/${fileName}`;
  } catch (error) {
    console.error(`Failed to download ${url}:`, error);
    return null;
  }
}

// Generate unique filename
function generateFileName(originalUrl: string, productRef: string, index: number = 0): string {
  const urlParts = originalUrl.split('/');
  const originalName = urlParts[urlParts.length - 1];
  const extension = originalName.includes('.') ? originalName.split('.').pop() : 'jpg';
  const timestamp = Date.now();
  const suffix = index > 0 ? `-${index}` : '';
  return `${productRef}-${timestamp}${suffix}.${extension}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV file' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const csvText = await file.text();
    let records: any[];

    try {
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
        quote: '"',
        escape: '"',
        trim: true,
      });
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid CSV format' },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    if (records.length > 1000) {
      return NextResponse.json(
        { error: 'CSV file contains too many rows (max 1000)' },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: false,
      imported: 0,
      errors: [],
      filesDownloaded: 0,
    };

    const validProducts = [];
    
    // Validate each row
    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // +2 because CSV rows start at 1 and we have headers
      const record = records[i];

      try {
        // Validate the record
        const validatedProduct = csvProductSchema.parse(record);
        
        // Check if reference already exists
        const existingProduct = await prisma.product.findUnique({
          where: { referenceFournisseur: validatedProduct.referenceFournisseur },
        });

        if (existingProduct) {
          result.errors.push({
            row: rowNumber,
            field: 'referenceFournisseur',
            message: `Product with reference ${validatedProduct.referenceFournisseur} already exists`,
          });
          continue;
        }

        validProducts.push({
          ...validatedProduct,
          nom: {
            fr: validatedProduct.nom_fr,
            en: validatedProduct.nom_en,
          },
          description: {
            fr: validatedProduct.description_fr,
            en: validatedProduct.description_en,
          },
          ficheTechnique: {
            fr: validatedProduct.ficheTechnique_fr,
            en: validatedProduct.ficheTechnique_en,
          },
          rowNumber,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach((err) => {
            result.errors.push({
              row: rowNumber,
              field: err.path.join('.'),
              message: err.message,
            });
          });
        } else {
          result.errors.push({
            row: rowNumber,
            message: 'Validation error',
          });
        }
      }
    }

    // Import valid products
    const createdProducts = [];
    for (const productData of validProducts) {
      try {
        // Generate slug from French name
        const slug = productData.nom.fr
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Download PDF brochure if URL provided
        let localPdfUrl = null;
        if (productData.pdfBrochureUrl && productData.pdfBrochureUrl.startsWith('http')) {
          const pdfFileName = generateFileName(productData.pdfBrochureUrl, productData.referenceFournisseur);
          localPdfUrl = await downloadAndSaveFile(productData.pdfBrochureUrl, pdfFileName, 'brochures');
          if (localPdfUrl) {
            result.filesDownloaded!++;
          } else {
            result.errors.push({
              row: productData.rowNumber,
              field: 'pdfBrochureUrl',
              message: `Failed to download PDF: ${productData.pdfBrochureUrl}`,
            });
          }
        }

        // Create product first
        const product = await prisma.product.create({
          data: {
            referenceFournisseur: productData.referenceFournisseur,
            constructeur: productData.constructeur,
            categoryId: productData.categoryId,
            slug,
            pdfBrochureUrl: localPdfUrl || productData.pdfBrochureUrl || null,
            status: productData.status,
            isFeatured: productData.featured,
            translations: {
              create: [
                {
                  languageCode: 'fr',
                  nom: productData.nom.fr,
                  description: productData.description.fr || null,
                  ficheTechnique: productData.ficheTechnique.fr || null,
                },
                {
                  languageCode: 'en',
                  nom: productData.nom.en,
                  description: productData.description.en || null,
                  ficheTechnique: productData.ficheTechnique.en || null,
                },
              ],
            },
          },
          include: {
            translations: true,
          },
        });

        // Download and attach images if URLs provided
        if (productData.imageUrls && productData.imageUrls.trim()) {
          const imageUrlList = productData.imageUrls.split(',').map(url => url.trim()).filter(Boolean);
          const mediaItems = [];
          
          for (let i = 0; i < imageUrlList.length; i++) {
            const imageUrl = imageUrlList[i];
            if (imageUrl.startsWith('http')) {
              const imageFileName = generateFileName(imageUrl, productData.referenceFournisseur, i);
              const localImageUrl = await downloadAndSaveFile(imageUrl, imageFileName, 'products');
              
              if (localImageUrl) {
                try {
                  const mediaItem = await prisma.productMedia.create({
                    data: {
                      productId: product.id,
                      type: 'image',
                      url: localImageUrl,
                      sortOrder: i,
                      isPrimary: i === 0, // First image is primary
                      altText: `${productData.nom.fr} - Image ${i + 1}`,
                      title: productData.nom.fr,
                    },
                  });
                  mediaItems.push(mediaItem);
                  result.filesDownloaded!++;
                } catch (mediaError) {
                  result.errors.push({
                    row: productData.rowNumber,
                    field: 'imageUrls',
                    message: `Failed to save image metadata for: ${imageUrl}`,
                  });
                }
              } else {
                result.errors.push({
                  row: productData.rowNumber,
                  field: 'imageUrls',
                  message: `Failed to download image: ${imageUrl}`,
                });
              }
            }
          }
        }

        createdProducts.push(product);
        result.imported++;
      } catch (error) {
        console.error('Error creating product:', error);
        result.errors.push({
          row: productData.rowNumber,
          message: 'Failed to create product in database',
        });
      }
    }

    result.success = result.imported > 0;
    result.data = createdProducts;

    return NextResponse.json({
      message: `Successfully imported ${result.imported} products and downloaded ${result.filesDownloaded} files${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`,
      data: result,
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Internal server error during import' },
      { status: 500 }
    );
  }
}