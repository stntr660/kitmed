import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'basic';

  try {
    // Get categories for reference
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      take: 10,
    });

    const categoryIds = categories.map(c => c.id).join(' | ');
    const categoryNames = categories.map(c => c.name).join(' | ');

    let csvContent = '';
    
    if (type === 'enhanced') {
      // Enhanced template with file download support
      csvContent = `referenceFournisseur,constructeur,categoryId,nom_fr,nom_en,description_fr,description_en,ficheTechnique_fr,ficheTechnique_en,pdfBrochureUrl,imageUrl,imageUrl2,imageUrl3,downloadFiles,status,featured
# Template for Enhanced Bulk Import with File Downloads
# Available Categories: ${categoryNames}
# Category IDs: ${categoryIds}
#
# Fields Explanation:
# - referenceFournisseur: Unique supplier reference (required)
# - constructeur: Manufacturer name (required)
# - categoryId: Category UUID from above list (required)
# - nom_fr: French product name (required)
# - nom_en: English product name (required)
# - description_fr: French description (optional)
# - description_en: English description (optional)
# - ficheTechnique_fr: French technical sheet (optional)
# - ficheTechnique_en: English technical sheet (optional)
# - pdfBrochureUrl: URL to PDF brochure (optional)
# - imageUrl: URL to main product image (optional)
# - imageUrl2: URL to second product image (optional)
# - imageUrl3: URL to third product image (optional)
# - downloadFiles: true/false - whether to download files from URLs (default: false)
# - status: active/inactive/discontinued (default: active)
# - featured: true/false (default: false)
#
# Example rows:
TEST001,Philips,${categories[0]?.id || 'category-id-here'},"Moniteur Patient Avancé","Advanced Patient Monitor","Moniteur haute résolution avec surveillance continue","High resolution monitor with continuous monitoring","Spécifications techniques complètes","Complete technical specifications","https://example.com/brochure.pdf","https://example.com/image1.jpg","https://example.com/image2.jpg","","true","active","false"
TEST002,GE Healthcare,${categories[0]?.id || 'category-id-here'},"Échographe Portable","Portable Ultrasound","Échographe compact et portable","Compact portable ultrasound","Guide d'utilisation","User manual","https://example.com/manual.pdf","https://example.com/ultrasound.jpg","","","true","active","true"`;
    } else {
      // Basic template
      csvContent = `referenceFournisseur,constructeur,categoryId,nom_fr,nom_en,description_fr,description_en,ficheTechnique_fr,ficheTechnique_en,pdfBrochureUrl,status,featured
# Template for Basic Bulk Import
# Available Categories: ${categoryNames}
# Category IDs: ${categoryIds}
#
# Fields Explanation:
# - referenceFournisseur: Unique supplier reference (required)
# - constructeur: Manufacturer name (required)
# - categoryId: Category UUID from above list (required)
# - nom_fr: French product name (required)
# - nom_en: English product name (required)
# - description_fr: French description (optional)
# - description_en: English description (optional)
# - ficheTechnique_fr: French technical sheet (optional)
# - ficheTechnique_en: English technical sheet (optional)
# - pdfBrochureUrl: Direct URL or local path to PDF (optional)
# - status: active/inactive/discontinued (default: active)
# - featured: true/false (default: false)
#
# Example rows:
TEST001,Philips,${categories[0]?.id || 'category-id-here'},"Moniteur Patient","Patient Monitor","Moniteur haute résolution","High resolution monitor","Spécifications techniques","Technical specifications","","active","false"
TEST002,GE Healthcare,${categories[0]?.id || 'category-id-here'},"Échographe","Ultrasound","Échographe médical","Medical ultrasound","Guide utilisateur","User guide","","active","true"`;
    }

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="${type}-products-template.csv"`);

    return new NextResponse(csvContent, { headers });

  } catch (error) {
    console.error('CSV template error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSV template' },
      { status: 500 }
    );
  }
}

// POST endpoint to generate custom template
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { 
      includeExamples = true,
      categoryFilter = null,
      includeFileDownloads = false,
      customFields = []
    } = body;

    // Get categories (filtered if needed)
    const categoriesQuery: any = { where: { isActive: true } };
    if (categoryFilter) {
      categoriesQuery.where.id = { in: categoryFilter };
    }

    const categories = await prisma.category.findMany({
      ...categoriesQuery,
      select: { id: true, name: true },
      take: 20,
    });

    // Build header
    const baseFields = [
      'referenceFournisseur',
      'constructeur', 
      'categoryId',
      'nom_fr',
      'nom_en',
      'description_fr',
      'description_en',
      'ficheTechnique_fr',
      'ficheTechnique_en',
      'pdfBrochureUrl'
    ];

    const enhancedFields = includeFileDownloads ? [
      'imageUrl',
      'imageUrl2', 
      'imageUrl3',
      'downloadFiles'
    ] : [];

    const statusFields = ['status', 'featured'];
    
    const allFields = [...baseFields, ...enhancedFields, ...customFields, ...statusFields];
    
    let csvContent = allFields.join(',') + '\n';
    
    // Add comments
    csvContent += `# Custom CSV Template Generated ${new Date().toISOString()}\n`;
    csvContent += `# Available Categories: ${categories.map(c => c.name).join(' | ')}\n`;
    csvContent += `# Category IDs: ${categories.map(c => c.id).join(' | ')}\n`;
    csvContent += '#\n';
    
    // Add examples if requested
    if (includeExamples && categories.length > 0) {
      csvContent += '# Example rows:\n';
      
      const exampleRow1 = [
        'TEST001',
        'Philips',
        categories[0].id,
        '"Moniteur Patient"',
        '"Patient Monitor"',
        '"Description française"',
        '"English description"',
        '"Fiche technique FR"',
        '"Technical sheet EN"',
        includeFileDownloads ? '"https://example.com/brochure.pdf"' : '""',
        ...(includeFileDownloads ? [
          '"https://example.com/image1.jpg"',
          '""',
          '""',
          '"true"'
        ] : []),
        ...customFields.map(() => '""'),
        '"active"',
        '"false"'
      ];
      
      csvContent += exampleRow1.join(',') + '\n';
      
      if (categories.length > 1) {
        const exampleRow2 = [
          'TEST002',
          'GE Healthcare',
          categories[1].id,
          '"Échographe"',
          '"Ultrasound"',
          '"Échographe médical"',
          '"Medical ultrasound"',
          '""',
          '""',
          '""',
          ...(includeFileDownloads ? [
            '"https://example.com/device.jpg"',
            '""',
            '""',
            '"false"'
          ] : []),
          ...customFields.map(() => '""'),
          '"active"',
          '"true"'
        ];
        
        csvContent += exampleRow2.join(',') + '\n';
      }
    }

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', 'attachment; filename="custom-products-template.csv"');

    return new NextResponse(csvContent, { headers });

  } catch (error) {
    console.error('Custom CSV template error:', error);
    return NextResponse.json(
      { error: 'Failed to generate custom CSV template' },
      { status: 500 }
    );
  }
}