import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';

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
  pdfBrochureUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  featured: z.string().transform((val) => val?.toLowerCase() === 'true' || val === '1').default('false'),
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
          error.errors.forEach((err) => {
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

        const product = await prisma.product.create({
          data: {
            referenceFournisseur: productData.referenceFournisseur,
            constructeur: productData.constructeur,
            categoryId: productData.categoryId,
            slug,
            pdfBrochureUrl: productData.pdfBrochureUrl || null,
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
      message: `Successfully imported ${result.imported} products${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`,
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