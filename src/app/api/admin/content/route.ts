import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Content item schema
const contentSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['article', 'news', 'announcement', 'page']),
  status: z.enum(['draft', 'published', 'archived']),
  title: z.object({
    fr: z.string().min(1),
    en: z.string().optional(),
  }),
  slug: z.string().min(1),
  content: z.object({
    fr: z.string(),
    en: z.string().optional(),
  }),
  excerpt: z.object({
    fr: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  publishedAt: z.string().optional(), // ISO date string
  seoMeta: z.object({
    title: z.object({
      fr: z.string().optional(),
      en: z.string().optional(),
    }).optional(),
    description: z.object({
      fr: z.string().optional(),
      en: z.string().optional(),
    }).optional(),
  }).optional(),
});

// Mock content storage
let contentItems: any[] = [
  {
    id: 'content-1',
    type: 'article',
    status: 'published',
    title: {
      fr: 'Guide des équipements médicaux 2024',
      en: 'Medical Equipment Guide 2024'
    },
    slug: 'guide-equipements-medicaux-2024',
    content: {
      fr: 'Contenu de l\'article en français...',
      en: 'Article content in English...'
    },
    excerpt: {
      fr: 'Un guide complet pour choisir les bons équipements médicaux',
      en: 'A comprehensive guide to choosing the right medical equipment'
    },
    featuredImage: '/images/content/medical-equipment-guide.jpg',
    tags: ['équipements', 'guide', '2024'],
    publishedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'content-2',
    type: 'news',
    status: 'published',
    title: {
      fr: 'Nouvelle certification ISO pour KITMED',
      en: 'New ISO certification for KITMED'
    },
    slug: 'nouvelle-certification-iso-kitmed',
    content: {
      fr: 'KITMED a obtenu sa nouvelle certification ISO...',
      en: 'KITMED has obtained its new ISO certification...'
    },
    featuredImage: '/images/content/iso-certification.jpg',
    tags: ['certification', 'iso', 'qualité'],
    publishedAt: '2024-02-01T09:00:00Z',
    createdAt: '2024-01-25T16:45:00Z',
    updatedAt: '2024-02-01T09:00:00Z',
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredItems = contentItems;

    // Filter by type
    if (type && type !== 'all') {
      filteredItems = filteredItems.filter(item => item.type === type);
    }

    // Filter by status
    if (status && status !== 'all') {
      filteredItems = filteredItems.filter(item => item.status === status);
    }

    // Sort by creation date (newest first)
    filteredItems.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    return NextResponse.json({
      items: paginatedItems,
      total: filteredItems.length,
      page,
      totalPages: Math.ceil(filteredItems.length / limit),
    });
  } catch (error) {
    console.error('Content fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedContent = contentSchema.parse(body);
    
    const newContent = {
      ...validatedContent,
      id: `content-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    contentItems.unshift(newContent);
    
    return NextResponse.json(newContent, { status: 201 });
  } catch (error) {
    console.error('Content creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid content data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}