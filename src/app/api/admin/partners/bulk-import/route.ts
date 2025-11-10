import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';

const csvPartnerSchema = z.object({
  nom_fr: z.string().min(1, 'French name is required'),
  nom_en: z.string().optional().default(''),
  description_fr: z.string().optional().default(''),
  description_en: z.string().optional().default(''),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
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
  data?: any[];
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
    };

    const validPartners = [];
    
    // Validate each row
    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // +2 because CSV rows start at 1 and we have headers
      const record = records[i];

      try {
        // Validate the record
        const validatedPartner = csvPartnerSchema.parse(record);
        
        // Generate slug from French name
        const baseSlug = validatedPartner.nom_fr
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Check if slug already exists
        const existingPartner = await prisma.partner.findFirst({
          where: { 
            slug: { startsWith: baseSlug }
          },
        });

        if (existingPartner && existingPartner.name === validatedPartner.nom_fr) {
          result.errors.push({
            row: rowNumber,
            field: 'nom_fr',
            message: `Partner with name "${validatedPartner.nom_fr}" already exists`,
          });
          continue;
        }

        validPartners.push({
          ...validatedPartner,
          nom: {
            fr: validatedPartner.nom_fr,
            en: validatedPartner.nom_en || '',
          },
          description: {
            fr: validatedPartner.description_fr || '',
            en: validatedPartner.description_en || '',
          },
          baseSlug,
          rowNumber,
        });
      } catch (error) {
        console.error(`Validation error for row ${rowNumber}:`, error);
        if (error instanceof z.ZodError && error.issues && Array.isArray(error.issues)) {
          error.issues.forEach((err) => {
            result.errors.push({
              row: rowNumber,
              field: err.path?.join?.('.') || 'unknown',
              message: err.message || 'Validation error',
            });
          });
        } else {
          result.errors.push({
            row: rowNumber,
            message: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Validation error',
          });
        }
      }
    }

    // Import valid partners
    const createdPartners = [];
    for (const partnerData of validPartners) {
      try {
        // Add timestamp to ensure uniqueness
        const timestamp = Date.now().toString().slice(-6);
        const slug = `${partnerData.baseSlug}-${timestamp}`;

        const partner = await prisma.partner.create({
          data: {
            name: partnerData.nom.fr, // Use French name as primary
            slug,
            websiteUrl: partnerData.websiteUrl || null,
            logoUrl: partnerData.logoUrl || null,
            status: partnerData.status,
            isFeatured: partnerData.featured,
            translations: {
              create: [
                {
                  languageCode: 'fr',
                  name: partnerData.nom.fr,
                  description: partnerData.description.fr || null,
                },
                ...(partnerData.nom.en ? [{
                  languageCode: 'en',
                  name: partnerData.nom.en,
                  description: partnerData.description.en || null,
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

    return NextResponse.json({
      message: `Successfully imported ${result.imported} partners${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`,
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