import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';

// Categories to seed
const categories = [
  {
    id: 'ophthalmology',
    slug: 'ophthalmology',
    is_active: true,
    sort_order: 1,
    translations: [
      { language_code: 'fr', name: 'Ophtalmologie', description: 'Equipements ophtalmologiques de pointe' },
      { language_code: 'en', name: 'Ophthalmology', description: 'Advanced ophthalmology equipment' }
    ]
  },
  {
    id: 'cardiology',
    slug: 'cardiology',
    is_active: true,
    sort_order: 2,
    translations: [
      { language_code: 'fr', name: 'Cardiologie', description: 'Equipements cardiovasculaires de pointe' },
      { language_code: 'en', name: 'Cardiology', description: 'Advanced cardiovascular equipment' }
    ]
  },
  {
    id: 'ent',
    slug: 'ent',
    is_active: true,
    sort_order: 3,
    translations: [
      { language_code: 'fr', name: 'ORL (Oto-Rhino-Laryngologie)', description: 'Equipements ORL specialises' },
      { language_code: 'en', name: 'ENT (Ear, Nose and Throat)', description: 'Specialized ENT equipment' }
    ]
  },
  {
    id: 'hospital-furniture',
    slug: 'hospital-furniture',
    is_active: true,
    sort_order: 4,
    translations: [
      { language_code: 'fr', name: 'Mobilier et literie hospitaliers', description: 'Mobilier medical et literie hospitaliere' },
      { language_code: 'en', name: 'Hospital Furniture & Bedding', description: 'Medical furniture and hospital bedding' }
    ]
  },
  {
    id: 'orthopedics',
    slug: 'orthopedics',
    is_active: true,
    sort_order: 5,
    translations: [
      { language_code: 'fr', name: 'Orthopedie', description: 'Equipements orthopediques' },
      { language_code: 'en', name: 'Orthopedics', description: 'Orthopedic equipment' }
    ]
  }
];

async function seedCategories(request: NextRequest) {
  try {
    const results: string[] = [];

    // First, deactivate all existing categories
    await prisma.categories.updateMany({
      data: { is_active: false }
    });
    results.push('Deactivated all existing categories');

    // Upsert each category with translations
    for (const category of categories) {
      // Upsert category
      await prisma.categories.upsert({
        where: { id: category.id },
        update: {
          slug: category.slug,
          is_active: category.is_active,
          sort_order: category.sort_order,
          updated_at: new Date()
        },
        create: {
          id: category.id,
          slug: category.slug,
          is_active: category.is_active,
          sort_order: category.sort_order,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Delete existing translations and create new ones
      await prisma.category_translations.deleteMany({
        where: { category_id: category.id }
      });

      for (const translation of category.translations) {
        await prisma.category_translations.create({
          data: {
            id: `${category.id}-${translation.language_code}`,
            category_id: category.id,
            language_code: translation.language_code,
            name: translation.name,
            description: translation.description
          }
        });
      }

      results.push(`Seeded category: ${category.translations[0].name}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Categories seeded successfully',
      results,
      meta: {
        timestamp: new Date().toISOString(),
        activeCategories: ['Ophthalmology', 'Cardiology', 'ENT', 'Hospital Furniture', 'Orthopedics']
      }
    });
  } catch (error) {
    console.error('Category seeding error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to seed categories',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(seedCategories);
