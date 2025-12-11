const { PrismaClient } = require('@prisma/client');
const { parse } = require('csv-parse/sync');
const { randomUUID } = require('crypto');
const fs = require('fs');

const prisma = new PrismaClient();

async function uploadFullBatch() {
  try {
    console.log('🚀 Starting full batch upload (180 products)...');
    
    // Category mapping from our processed CSV to actual DB slugs
    const categoryMapping = {
      'surgery-instruments': 'surgery-surgical-instruments',
      'ophthalmology-surgical': 'ophthalmology-surgical-equipment',
      'ophthalmology-diagnostic': 'ophthalmology-diagnostic-equipment'
    };
    
    // Read the CSV
    const csvContent = fs.readFileSync('kitmed_batch_5_FINAL.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📦 Found ${records.length} products to upload`);
    
    let uploaded = 0;
    let errors = 0;
    
    for (const record of records) {
      try {
        // Check if product already exists
        const existing = await prisma.products.findUnique({
          where: { reference_fournisseur: record.referenceFournisseur }
        });
        
        if (existing) {
          console.log(`⏭️  Skipping ${record.referenceFournisseur} - already exists`);
          continue;
        }
        
        // Find or verify manufacturer exists
        const manufacturer = await prisma.partners.findFirst({
          where: { slug: record.constructeur, type: 'manufacturer' }
        });
        
        if (!manufacturer) {
          console.log(`❌ Manufacturer '${record.constructeur}' not found for ${record.referenceFournisseur}`);
          errors++;
          continue;
        }
        
        // Map category to actual DB slug
        const actualCategorySlug = categoryMapping[record.categoryId] || record.categoryId;
        
        // Find or verify category exists
        const category = await prisma.categories.findFirst({
          where: { slug: actualCategorySlug, is_active: true }
        });
        
        if (!category) {
          console.log(`❌ Category '${record.categoryId}' not found for ${record.referenceFournisseur}`);
          errors++;
          continue;
        }
        
        // Generate slug
        const slug = record.nom_fr
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Create the product
        const product = await prisma.products.create({
          data: {
            id: randomUUID(),
            reference_fournisseur: record.referenceFournisseur,
            constructeur: record.constructeur,
            partner_id: manufacturer.id,
            category_id: category.id,
            slug: slug,
            pdf_brochure_url: record.pdfBrochureUrl || null,
            status: record.status || 'active',
            is_featured: record.featured === 'true',
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        
        // Create French translation
        await prisma.product_translations.create({
          data: {
            id: randomUUID(),
            product_id: product.id,
            language_code: 'fr',
            nom: record.nom_fr,
            description: record.description_fr || null,
            fiche_technique: record.ficheTechnique_fr || null
          }
        });
        
        // Create English translation  
        await prisma.product_translations.create({
          data: {
            id: randomUUID(),
            product_id: product.id,
            language_code: 'en',
            nom: record.nom_en,
            description: record.description_en || null,
            fiche_technique: record.ficheTechnique_en || null
          }
        });
        
        // Create media records for images
        if (record.imageUrls) {
          const imageUrls = record.imageUrls.split('|').map(u => u.trim()).filter(u => u);
          
          for (let i = 0; i < imageUrls.length && i < 5; i++) {
            await prisma.product_media.create({
              data: {
                id: randomUUID(),
                product_id: product.id,
                type: 'image',
                url: imageUrls[i],
                alt_text: `${record.nom_fr} - Image ${i + 1}`,
                title: `${record.nom_fr} - Image ${i + 1}`,
                sort_order: i,
                is_primary: i === 0
              }
            });
          }
        }
        
        console.log(`✅ Uploaded: ${record.referenceFournisseur} - ${record.nom_fr.substring(0, 50)}...`);
        uploaded++;
        
      } catch (error) {
        console.error(`❌ Error uploading ${record.referenceFournisseur}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n🎉 Upload complete!`);
    console.log(`✅ Successfully uploaded: ${uploaded} products`);
    console.log(`❌ Errors: ${errors} products`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('💥 Upload failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

uploadFullBatch();