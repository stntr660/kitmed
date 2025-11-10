import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { AdminSearchFilters } from '@/types/admin';
import { z } from 'zod';

// GET /api/admin/partners - List partners with filters
async function getPartners(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      query: searchParams.get('query') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.getAll('status'),
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;

    // Build where clause
    const where: any = {};

    // Text search in partner translations
    if (filters.query) {
      where.OR = [
        { 
          translations: {
            some: {
              name: { contains: filters.query }
            }
          }
        },
        {
          translations: {
            some: {
              description: { contains: filters.query }
            }
          }
        },
        { websiteUrl: { contains: filters.query } },
      ];
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    // Type filter - SQLite compatible pattern matching
    if (filters.type === 'manufacturer') {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { 
            translations: {
              some: {
                OR: [
                  { name: { contains: 'Manufacturer' } },
                  { name: { contains: 'manufacturer' } },
                  { name: { contains: 'Fabricant' } },
                  { name: { contains: 'fabricant' } },
                  { description: { contains: 'Manufacturer' } },
                  { description: { contains: 'manufacturer' } },
                  { description: { contains: 'Fabricant' } },
                  { description: { contains: 'fabricant' } },
                ]
              }
            }
          },
          { name: { contains: 'Manufacturer' } },
          { name: { contains: 'manufacturer' } },
          { name: { contains: 'Fabricant' } },
          { name: { contains: 'fabricant' } },
        ]
      });
    }

    // Execute queries
    const [items, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        include: {
          translations: true,
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take,
      }),
      prisma.partner.count({ where }),
    ]);

    // Transform the data to match expected format
    const transformedItems = items.map(partner => ({
      id: partner.id,
      slug: partner.slug,
      websiteUrl: partner.websiteUrl,
      logoUrl: partner.logoUrl,
      status: partner.status,
      featured: partner.isFeatured,
      sortOrder: partner.sortOrder,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      // Create a name field from French translation for compatibility
      name: partner.translations.find(t => t.languageCode === 'fr')?.name || 
            partner.translations[0]?.name || 
            'Unnamed Partner',
      // Create nom object for new structure
      nom: {
        fr: partner.translations.find(t => t.languageCode === 'fr')?.name || '',
        en: partner.translations.find(t => t.languageCode === 'en')?.name || '',
      },
      description: {
        fr: partner.translations.find(t => t.languageCode === 'fr')?.description || '',
        en: partner.translations.find(t => t.languageCode === 'en')?.description || '',
      },
      translations: partner.translations,
    }));

    const result = {
      items: transformedItems,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
      filters,
    };

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Partners list error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve partners',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/partners - Create new partner
const createPartnerSchema = z.object({
  nom: z.object({
    fr: z.string().min(1, 'Nom en français est requis'),
    en: z.string().optional(), // English is optional for French-first approach
  }),
  description: z.object({
    fr: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
  featured: z.boolean().default(false),
});

async function createPartner(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = createPartnerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid partner data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const partnerData = validation.data;

    // Generate unique slug from French name (primary language)
    const baseSlug = partnerData.nom.fr
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const slug = `${baseSlug}-${timestamp}`;

    // Create partner in database
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
              description: partnerData.description?.fr || null,
            },
            ...(partnerData.nom.en ? [{
              languageCode: 'en',
              name: partnerData.nom.en,
              description: partnerData.description?.en || null,
            }] : []),
          ],
        },
      },
      include: {
        translations: true,
      },
    });

    // Transform the response to match expected format
    const transformedPartner = {
      id: partner.id,
      slug: partner.slug,
      websiteUrl: partner.websiteUrl,
      logoUrl: partner.logoUrl,
      status: partner.status,
      featured: partner.isFeatured,
      sortOrder: partner.sortOrder,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      nom: {
        fr: partner.translations.find(t => t.languageCode === 'fr')?.name || '',
        en: partner.translations.find(t => t.languageCode === 'en')?.name || '',
      },
      description: {
        fr: partner.translations.find(t => t.languageCode === 'fr')?.description || '',
        en: partner.translations.find(t => t.languageCode === 'en')?.description || '',
      },
      translations: partner.translations,
    };

    return NextResponse.json({
      success: true,
      data: transformedPartner,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Partner creation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create partner',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = getPartners;
export const POST = createPartner;