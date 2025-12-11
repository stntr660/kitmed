import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { AdminSearchFilters } from '@/types/admin';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// GET /api/admin/partners - List partners with filters
async function getPartners(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      query: searchParams.get('query') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.getAll('status'),
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '100'),
      sortBy: searchParams.get('sortBy') || 'created_at',
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
          partner_translations: {
            some: {
              name: { contains: filters.query }
            }
          }
        },
        {
          partner_translations: {
            some: {
              description: { contains: filters.query }
            }
          }
        },
        { website_url: { contains: filters.query } },
      ];
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    // Type filter using the new type field
    if (filters.type) {
      where.type = filters.type;
    }

    // Execute queries
    const [items, total] = await Promise.all([
      prisma.partners.findMany({
        where,
        include: {
          partner_translations: true,
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take,
      }),
      prisma.partners.count({ where }),
    ]);

    // Transform the data to match expected format
    const transformedItems = items.map(partner => ({
      id: partner.id,
      slug: partner.slug,
      websiteUrl: partner.website_url,
      logoUrl: partner.logo_url,
      type: partner.type,
      status: partner.status,
      featured: partner.is_featured,
      sortOrder: partner.sort_order,
      createdAt: partner.created_at,
      updatedAt: partner.updated_at,
      // Create a name field from French translation for compatibility
      name: partner.partner_translations.find(t => t.language_code === 'fr')?.name ||
            partner.partner_translations[0]?.name ||
            'Unnamed Partner',
      // Create nom object for new structure
      nom: {
        fr: partner.partner_translations.find(t => t.language_code === 'fr')?.name || '',
        en: partner.partner_translations.find(t => t.language_code === 'en')?.name || '',
      },
      description: {
        fr: partner.partner_translations.find(t => t.language_code === 'fr')?.description || '',
        en: partner.partner_translations.find(t => t.language_code === 'en')?.description || '',
      },
      translations: partner.partner_translations,
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
  websiteUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  type: z.enum(['manufacturer', 'distributor', 'service', 'technology']).default('manufacturer'),
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
    const partner = await prisma.partners.create({
      data: {
        name: partnerData.nom.fr, // Use French name as primary
        slug,
        website_url: partnerData.websiteUrl || null,
        logo_url: partnerData.logoUrl || null,
        type: partnerData.type,
        status: partnerData.status,
        is_featured: partnerData.featured,
        partner_translations: {
          create: [
            {
              id: randomUUID(),
              language_code: 'fr',
              name: partnerData.nom.fr,
              description: partnerData.description?.fr || null,
            },
            ...(partnerData.nom.en ? [{
              id: randomUUID(),
              language_code: 'en',
              name: partnerData.nom.en,
              description: partnerData.description?.en || null,
            }] : []),
          ],
        },
      },
      include: {
        partner_translations: true,
      },
    });

    // Transform the response to match expected format
    const transformedPartner = {
      id: partner.id,
      slug: partner.slug,
      websiteUrl: partner.website_url,
      logoUrl: partner.logo_url,
      type: partner.type,
      status: partner.status,
      featured: partner.is_featured,
      sortOrder: partner.sort_order,
      createdAt: partner.created_at,
      updatedAt: partner.updated_at,
      nom: {
        fr: partner.partner_translations.find(t => t.language_code === 'fr')?.name || '',
        en: partner.partner_translations.find(t => t.language_code === 'en')?.name || '',
      },
      description: {
        fr: partner.partner_translations.find(t => t.language_code === 'fr')?.description || '',
        en: partner.partner_translations.find(t => t.language_code === 'en')?.description || '',
      },
      translations: partner.partner_translations,
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
export const GET = withAuth(getPartners);
export const POST = withAuth(createPartner);