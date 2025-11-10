import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Content update schema (same as create but all fields optional)
const contentUpdateSchema = z.object({
  type: z.enum(['article', 'news', 'announcement', 'page']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  title: z.object({
    fr: z.string().min(1),
    en: z.string().optional(),
  }).optional(),
  slug: z.string().min(1).optional(),
  content: z.object({
    fr: z.string(),
    en: z.string().optional(),
  }).optional(),
  excerpt: z.object({
    fr: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  featuredImage: z.string().url().optional().or(z.literal('')).optional(),
  tags: z.array(z.string()).optional(),
  publishedAt: z.string().optional(),
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

// Mock content storage (shared with main route)
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
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const content = contentItems.find(item => item.id === params.id);
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(content);
  } catch (error) {
    console.error('Content fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = contentUpdateSchema.parse(body);
    
    const contentIndex = contentItems.findIndex(item => item.id === params.id);
    
    if (contentIndex === -1) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }
    
    // Update the content
    const updatedContent = {
      ...contentItems[contentIndex],
      ...validatedData,
      updatedAt: new Date().toISOString(),
    };
    
    contentItems[contentIndex] = updatedContent;
    
    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error('Content update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid content data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentIndex = contentItems.findIndex(item => item.id === params.id);
    
    if (contentIndex === -1) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }
    
    // Remove the content
    const deletedContent = contentItems.splice(contentIndex, 1)[0];
    
    return NextResponse.json(deletedContent);
  } catch (error) {
    console.error('Content deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}