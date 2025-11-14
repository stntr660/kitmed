import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import { 
  downloadFileWithProgress, 
  isValidUrl,
  type DownloadProgress
} from '@/lib/url-downloader';
import { uploadPresets } from '@/lib/upload';

// Progress tracking store (in production, use Redis or similar)
const progressStore = new Map<string, {
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  totalProducts: number;
  processedProducts: number;
  downloadProgress: DownloadProgress[];
  errors: string[];
  results?: any;
}>();

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
  imageUrl: z.string().optional().default(''),
  imageUrl2: z.string().optional().default(''),
  imageUrl3: z.string().optional().default(''),
  downloadFiles: z.preprocess(
    (val) => String(val || 'false'), 
    z.string().transform((val) => val?.toLowerCase() === 'true' || val === '1')
  ).default(false),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  featured: z.preprocess(
    (val) => String(val || 'false'), 
    z.string().transform((val) => val?.toLowerCase() === 'true' || val === '1')
  ).default(false),
});

// GET endpoint to check progress
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    );
  }

  const progress = progressStore.get(jobId);
  
  if (!progress) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    jobId,
    ...progress,
  });
}

// POST endpoint to start bulk import with progress tracking
export async function POST(request: NextRequest): Promise<NextResponse> {
  const jobId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Initialize progress tracking
    progressStore.set(jobId, {
      status: 'processing',
      progress: 0,
      currentStep: 'Parsing CSV file',
      totalProducts: 0,
      processedProducts: 0,
      downloadProgress: [],
      errors: [],
    });

    // Process import asynchronously
    processImportWithProgress(jobId, file).catch(error => {
      const progress = progressStore.get(jobId);
      if (progress) {
        progress.status = 'failed';
        progress.errors.push(error.message);
        progressStore.set(jobId, progress);
      }
    });

    return NextResponse.json({
      jobId,
      message: 'Import started. Use the job ID to track progress.',
    });

  } catch (error) {
    console.error('Bulk import with progress error:', error);
    return NextResponse.json(
      { error: 'Failed to start import process' },
      { status: 500 }
    );
  }
}

// Background processing function
async function processImportWithProgress(jobId: string, file: File) {
  const updateProgress = (updates: any) => {
    const current = progressStore.get(jobId);
    if (current) {
      progressStore.set(jobId, { ...current, ...updates });
    }
  };

  try {
    // Parse CSV
    updateProgress({ 
      currentStep: 'Parsing CSV file',
      progress: 5 
    });

    const csvText = await file.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ',',
      quote: '"',
      escape: '"',
      trim: true,
    });

    updateProgress({ 
      currentStep: 'Validating records',
      progress: 10,
      totalProducts: records.length 
    });

    // Validate records
    const validProducts = [];
    const fileDownloads: Array<{
      row: number;
      productRef: string;
      urls: Array<{ type: 'image' | 'pdf'; url: string; field: string }>;
    }> = [];

    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2;
      const record = records[i];

      try {
        const validatedProduct = csvProductSchema.parse(record);
        
        // Check for duplicates
        const existingProduct = await prisma.product.findUnique({
          where: { referenceFournisseur: validatedProduct.referenceFournisseur },
        });

        if (existingProduct) {
          updateProgress({ 
            errors: [...(progressStore.get(jobId)?.errors || []), 
              `Row ${rowNumber}: Product ${validatedProduct.referenceFournisseur} already exists`]
          });
          continue;
        }

        // Collect file URLs
        const urls: Array<{ type: 'image' | 'pdf'; url: string; field: string }> = [];
        
        if (validatedProduct.downloadFiles) {
          if (validatedProduct.imageUrl && isValidUrl(validatedProduct.imageUrl)) {
            urls.push({ type: 'image', url: validatedProduct.imageUrl, field: 'imageUrl' });
          }
          if (validatedProduct.imageUrl2 && isValidUrl(validatedProduct.imageUrl2)) {
            urls.push({ type: 'image', url: validatedProduct.imageUrl2, field: 'imageUrl2' });
          }
          if (validatedProduct.imageUrl3 && isValidUrl(validatedProduct.imageUrl3)) {
            urls.push({ type: 'image', url: validatedProduct.imageUrl3, field: 'imageUrl3' });
          }
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
        updateProgress({ 
          errors: [...(progressStore.get(jobId)?.errors || []), 
            `Row ${rowNumber}: Validation error`]
        });
      }

      // Update validation progress
      updateProgress({ 
        progress: 10 + (i / records.length) * 20 
      });
    }

    // Download files with progress tracking
    const fileDownloadResults = new Map<string, any>();
    
    if (fileDownloads.length > 0) {
      updateProgress({ 
        currentStep: 'Downloading files',
        progress: 30 
      });

      for (let i = 0; i < fileDownloads.length; i++) {
        const productDownload = fileDownloads[i];
        const downloads: any[] = [];
        
        const productSlug = productDownload.productRef
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        for (const urlInfo of productDownload.urls) {
          try {
            const downloadOptions = urlInfo.type === 'image' 
              ? { ...uploadPresets.productImage, folder: `products/${productSlug}` }
              : { ...uploadPresets.productDocument, folder: `documents/${productSlug}` };

            const downloadResult = await downloadFileWithProgress(
              urlInfo.url,
              downloadOptions,
              (progress) => {
                // Update download progress
                const current = progressStore.get(jobId);
                if (current) {
                  const existingProgress = current.downloadProgress.find(p => p.url === progress.url);
                  if (existingProgress) {
                    Object.assign(existingProgress, progress);
                  } else {
                    current.downloadProgress.push(progress);
                  }
                  progressStore.set(jobId, current);
                }
              }
            );
            
            downloads.push(downloadResult);
            
          } catch (error) {
            updateProgress({ 
              errors: [...(progressStore.get(jobId)?.errors || []), 
                `Failed to download ${urlInfo.url}: ${error.message}`]
            });
          }
        }

        fileDownloadResults.set(productDownload.productRef, downloads);
        
        // Update file download progress
        updateProgress({ 
          progress: 30 + (i / fileDownloads.length) * 40 
        });
      }
    }

    // Create products
    updateProgress({ 
      currentStep: 'Creating products in database',
      progress: 70 
    });

    const createdProducts = [];
    for (let i = 0; i < validProducts.length; i++) {
      const productData = validProducts[i];
      
      try {
        const downloads = fileDownloadResults.get(productData.referenceFournisseur) || [];
        
        const slug = productData.nom.fr
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Determine final URLs
        let finalPdfUrl = productData.pdfBrochureUrl || null;
        const imageUrls: string[] = [];

        downloads.forEach((download: any) => {
          if (download.originalUrl === productData.pdfBrochureUrl) {
            finalPdfUrl = download.url;
          } else {
            imageUrls.push(download.url);
          }
        });

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
            ...(imageUrls.length > 0 && {
              media: {
                create: imageUrls.map((url, index) => ({
                  type: 'image',
                  url,
                  altText: `Product image ${index + 1}`,
                  title: `${productData.nom.fr} - Image ${index + 1}`,
                  sortOrder: index,
                  isPrimary: index === 0,
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
        
        updateProgress({ 
          processedProducts: i + 1,
          progress: 70 + (i / validProducts.length) * 25 
        });
        
      } catch (error) {
        updateProgress({ 
          errors: [...(progressStore.get(jobId)?.errors || []), 
            `Failed to create product ${productData.referenceFournisseur}: ${error.message}`]
        });
      }
    }

    // Complete
    updateProgress({
      status: 'completed',
      currentStep: 'Import completed',
      progress: 100,
      processedProducts: createdProducts.length,
      results: {
        imported: createdProducts.length,
        total: records.length,
        filesDownloaded: Array.from(fileDownloadResults.values()).flat().length,
        data: createdProducts,
      }
    });

  } catch (error) {
    updateProgress({
      status: 'failed',
      errors: [...(progressStore.get(jobId)?.errors || []), error.message]
    });
  }
}

// Cleanup endpoint to remove completed jobs
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    );
  }

  const deleted = progressStore.delete(jobId);
  
  return NextResponse.json({
    success: deleted,
    message: deleted ? 'Job removed' : 'Job not found',
  });
}