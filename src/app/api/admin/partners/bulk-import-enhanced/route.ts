import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import { 
  downloadFileFromUrl,
  isValidUrl,
  type DownloadResult,
  type DownloadError
} from '@/lib/url-downloader';
import { uploadPresets } from '@/lib/upload';

// Enhanced CSV schema with logo download support
const csvPartnerSchema = z.object({
  nom_fr: z.string().min(1, 'French name is required'),
  nom_en: z.string().optional().default(''),
  description_fr: z.string().optional().default(''),
  description_en: z.string().optional().default(''),
  websiteUrl: z.string().optional().default(''),
  logoUrl: z.string().optional().default(''),
  downloadLogo: z.preprocess(
    (val) => String(val || 'false'), 
    z.string().transform((val) => val?.toLowerCase() === 'true' || val === '1')
  ).default(false),
  status: z.enum(['active', 'inactive']).default('active'),
  featured: z.preprocess(
    (val) => String(val || 'false'), 
    z.string().transform((val) => val?.toLowerCase() === 'true' || val === '1')
  ).default(false),
});

interface EnhancedPartnerImportResult {
  success: boolean;
  imported: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  logoDownloads: {
    attempted: number;
    successful: number;
    failed: number;
    details: Array<{
      row: number;
      partnerName: string;
      download?: DownloadResult;
      error?: DownloadError;
    }>;
  };
  data?: any[];
  totalProcessingTime: number;
}

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

    if (records.length > 200) {
      return NextResponse.json(
        { error: 'CSV file contains too many rows (max 200 for partners)' },
        { status: 400 }
      );
    }

    const result: EnhancedPartnerImportResult = {
      success: false,
      imported: 0,
      errors: [],
      logoDownloads: {
        attempted: 0,
        successful: 0,
        failed: 0,
        details: [],
      },
      totalProcessingTime: 0,
    };

    const validPartners = [];
    const logoDownloads: Array<{
      row: number;
      partnerName: string;
      logoUrl: string;
    }> = [];
    
    // Validate each row and collect logo URLs
    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // +2 because CSV rows start at 1 and we have headers
      const record = records[i];

      try {
        // Validate the record
        const validatedPartner = csvPartnerSchema.parse(record);
        
        // Check if partner name already exists
        const existingPartner = await prisma.partner.findFirst({
          where: { 
            translations: {
              some: {
                name: validatedPartner.nom_fr
              }
            }
          },
        });

        if (existingPartner) {
          result.errors.push({
            row: rowNumber,
            field: 'nom_fr',
            message: `Partner with name ${validatedPartner.nom_fr} already exists`,
          });
          continue;
        }

        // Collect logo URL for download if enabled
        if (validatedPartner.downloadLogo && validatedPartner.logoUrl && isValidUrl(validatedPartner.logoUrl)) {
          logoDownloads.push({
            row: rowNumber,
            partnerName: validatedPartner.nom_fr,
            logoUrl: validatedPartner.logoUrl,
          });
        }

        validPartners.push({
          ...validatedPartner,
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

    // Download logos if any were found
    if (logoDownloads.length > 0) {
      console.log(`Starting logo downloads for ${logoDownloads.length} partners`);
      
      result.logoDownloads.attempted = logoDownloads.length;

      for (const logoDownload of logoDownloads) {
        try {
          // Generate unique folder for this partner
          const partnerSlug = logoDownload.partnerName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          const downloadOptions = {
            ...uploadPresets.partnerLogo,
            folder: `partners/${partnerSlug}`,
          };

          const downloadResult = await downloadFileFromUrl(logoDownload.logoUrl, downloadOptions);
          
          result.logoDownloads.details.push({
            row: logoDownload.row,
            partnerName: logoDownload.partnerName,
            download: downloadResult,
          });
          
          result.logoDownloads.successful++;
          console.log(`Downloaded logo for ${logoDownload.partnerName}: ${downloadResult.url}`);
          
        } catch (error) {
          const downloadError: DownloadError = {
            url: logoDownload.logoUrl,
            error: error instanceof Error ? error.message : 'Unknown download error',
            code: 'DOWNLOAD_FAILED',
          };
          
          result.logoDownloads.details.push({
            row: logoDownload.row,
            partnerName: logoDownload.partnerName,
            error: downloadError,
          });
          
          result.logoDownloads.failed++;
          console.error(`Failed to download logo for ${logoDownload.partnerName}:`, downloadError.error);
        }
      }
    }

    // Import valid partners with downloaded logos
    const createdPartners = [];
    for (const partnerData of validPartners) {
      try {
        // Find downloaded logo for this partner
        const logoDownloadResult = result.logoDownloads.details.find(
          d => d.partnerName === partnerData.nom_fr && d.download
        );

        // Generate slug from French name
        const baseSlug = partnerData.nom_fr
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Add timestamp to ensure uniqueness
        const timestamp = Date.now().toString().slice(-6);
        const slug = `${baseSlug}-${timestamp}`;

        // Determine final logo URL (use downloaded file if available, otherwise original URL)
        const finalLogoUrl = logoDownloadResult?.download?.url || partnerData.logoUrl || null;

        const partner = await prisma.partner.create({
          data: {
            name: partnerData.nom_fr, // Use French name as primary
            slug,
            websiteUrl: partnerData.websiteUrl || null,
            logoUrl: finalLogoUrl,
            status: partnerData.status,
            isFeatured: partnerData.featured,
            translations: {
              create: [
                {
                  languageCode: 'fr',
                  name: partnerData.nom_fr,
                  description: partnerData.description_fr || null,
                },
                ...(partnerData.nom_en ? [{
                  languageCode: 'en',
                  name: partnerData.nom_en,
                  description: partnerData.description_en || null,
                }] : []),
              ],
            },
          },
          include: {
            translations: true,
          },
        });

        createdPartners.push(partner);
        result.imported++;
      } catch (error) {
        console.error('Error creating partner:', error);
        result.errors.push({
          row: partnerData.rowNumber,
          message: 'Failed to create partner in database',
        });
      }
    }

    result.success = result.imported > 0;
    result.data = createdPartners;
    result.totalProcessingTime = Date.now() - startTime;

    return NextResponse.json({
      message: `Successfully imported ${result.imported} partners${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}. Downloaded ${result.logoDownloads.successful}/${result.logoDownloads.attempted} logos.`,
      data: result,
    });

  } catch (error) {
    console.error('Enhanced partner bulk import error:', error);
    return NextResponse.json(
      { error: 'Internal server error during enhanced import' },
      { status: 500 }
    );
  }
}