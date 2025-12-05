import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import {
  downloadFileFromUrl,
  downloadFilesFromUrls,
  isValidUrl,
  validateUrls,
  type DownloadResult,
  type DownloadError
} from '@/lib/url-downloader';
import { uploadPresets } from '@/lib/upload';

// Enhanced CSV schema with URL fields
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
  imageUrl: z.string().optional().default(''), // New: Product image URL
  imageUrl2: z.string().optional().default(''), // New: Additional image URL
  imageUrl3: z.string().optional().default(''), // New: Additional image URL
  downloadFiles: z.preprocess(
    (val) => String(val || 'false'),
    z.string().transform((val) => val?.toLowerCase() === 'true' || val === '1')
  ).default(false), // Whether to download files from URLs
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  featured: z.preprocess(
    (val) => String(val || 'false'),
    z.string().transform((val) => val?.toLowerCase() === 'true' || val === '1')
  ).default(false),
});

interface EnhancedImportResult {
  success: boolean;
  imported: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  fileDownloads: {
    attempted: number;
    successful: number;
    failed: number;
    details: Array<{
      row: number;
      productRef: string;
      downloads: DownloadResult[];
      errors: DownloadError[];
    }>;
  };
  data?: any[];
  totalProcessingTime: number;
}

interface ProductFileDownload {
  row: number;
  productRef: string;
  urls: Array<{ type: 'image' | 'pdf'; url: string; field: string }>;
}

// Renamed from bulk-import-enhanced to be the primary bulk import endpoint
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

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

    // Validate file size (max 10MB for enhanced import)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
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

    if (records.length > 500) { // Reduced limit for enhanced import
      return NextResponse.json(
        { error: 'CSV file contains too many rows (max 500 for enhanced import)' },
        { status: 400 }
      );
    }

    const result: EnhancedImportResult = {
      success: false,
      imported: 0,
      errors: [],
      fileDownloads: {
        attempted: 0,
        successful: 0,
        failed: 0,
        details: [],
      },
      totalProcessingTime: 0,
    };

    const validProducts = [];
    const fileDownloads: ProductFileDownload[] = [];

    // Validate each row and collect file URLs
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

        // Collect file URLs for download if enabled
        const urls: Array<{ type: 'image' | 'pdf'; url: string; field: string }> = [];

        if (validatedProduct.downloadFiles) {
          // Collect image URLs
          if (validatedProduct.imageUrl && isValidUrl(validatedProduct.imageUrl)) {
            urls.push({ type: 'image', url: validatedProduct.imageUrl, field: 'imageUrl' });
          }
          if (validatedProduct.imageUrl2 && isValidUrl(validatedProduct.imageUrl2)) {
            urls.push({ type: 'image', url: validatedProduct.imageUrl2, field: 'imageUrl2' });
          }
          if (validatedProduct.imageUrl3 && isValidUrl(validatedProduct.imageUrl3)) {
            urls.push({ type: 'image', url: validatedProduct.imageUrl3, field: 'imageUrl3' });
          }

          // Collect PDF URL
          if (validatedProduct.pdfBrochureUrl && isValidUrl(validatedProduct.pdfBrochureUrl)) {
            urls.push({ type: 'pdf', url: validatedProduct.pdfBrochureUrl, field: 'pdfBrochureUrl' });
          }

          if (urls.length > 0) {
            fileDownloads.push({
              row: rowNumber,
              productRef: validatedProduct.referenceFournisseur,
              urls,
            });
          }
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

    // Download files if any were found
    if (fileDownloads.length > 0) {

      for (const productDownload of fileDownloads) {
        const downloads: DownloadResult[] = [];
        const downloadErrors: DownloadError[] = [];

        // Generate unique folder for this product
        const productSlug = productDownload.productRef
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        result.fileDownloads.attempted += productDownload.urls.length;

        for (const urlInfo of productDownload.urls) {
          try {
            const downloadOptions = urlInfo.type === 'image'
              ? {
                  ...uploadPresets.productImage,
                  folder: `products/${productSlug}`,
                }
              : {
                  ...uploadPresets.productDocument,
                  folder: `documents/${productSlug}`,
                };

            const downloadResult = await downloadFileFromUrl(urlInfo.url, downloadOptions);
            downloads.push(downloadResult);
            result.fileDownloads.successful++;

          } catch (error) {
            const downloadError: DownloadError = {
              url: urlInfo.url,
              error: error instanceof Error ? error.message : 'Unknown download error',
              code: 'DOWNLOAD_FAILED',
            };
            downloadErrors.push(downloadError);
            result.fileDownloads.failed++;

            console.error(`Failed to download ${urlInfo.type} for ${productDownload.productRef}:`, downloadError.error);
          }
        }

        result.fileDownloads.details.push({
          row: productDownload.row,
          productRef: productDownload.productRef,
          downloads,
          errors: downloadErrors,
        });
      }
    }

    // Import valid products with downloaded files
    const createdProducts = [];
    for (const productData of validProducts) {
      try {
        // Find downloaded files for this product
        const productFileDownload = result.fileDownloads.details.find(
          d => d.productRef === productData.referenceFournisseur
        );

        // Generate slug from French name
        const slug = productData.nom.fr
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Determine final URLs (use downloaded files if available, otherwise original URLs)
        let finalPdfUrl = productData.pdfBrochureUrl || null;
        const imageUrls: string[] = [];

        if (productFileDownload) {
          // Use downloaded file URLs
          productFileDownload.downloads.forEach(download => {
            const originalUrl = download.originalUrl;

            if (originalUrl === productData.pdfBrochureUrl) {
              finalPdfUrl = download.url;
            } else if ([productData.imageUrl, productData.imageUrl2, productData.imageUrl3].includes(originalUrl)) {
              imageUrls.push(download.url);
            }
          });
        }

        // Create product in database
        const product = await prisma.product.create({
          data: {
            referenceFournisseur: productData.referenceFournisseur,
            constructeur: productData.constructeur,
            categoryId: productData.categoryId,
            slug,
            pdfBrochureUrl: finalPdfUrl,
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
            // Create media records for downloaded images
            ...(imageUrls.length > 0 && {
              media: {
                create: imageUrls.map((url, index) => ({
                  type: 'image',
                  url,
                  altText: `Product image ${index + 1}`,
                  title: `${productData.nom.fr} - Image ${index + 1}`,
                  sortOrder: index,
                  isPrimary: index === 0, // First image is primary
                })),
              },
            }),
          },
          include: {
            translations: true,
            media: true,
          },
        });

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
    result.totalProcessingTime = Date.now() - startTime;

    return NextResponse.json({
      message: `Successfully imported ${result.imported} products${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}. Downloaded ${result.fileDownloads.successful}/${result.fileDownloads.attempted} files.`,
      data: result,
    });

  } catch (error) {
    console.error('Enhanced bulk import error:', error);
    return NextResponse.json(
      { error: 'Internal server error during enhanced import' },
      { status: 500 }
    );
  }
}