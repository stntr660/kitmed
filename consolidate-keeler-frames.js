const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

async function consolidateKeelerFrames() {
  try {
    console.log('🔧 CONSOLIDATING KEELER SPORT FRAMES');
    console.log('=====================================\n');

    // Find all the duplicate Keeler sport frame products
    const duplicateFrames = await prisma.products.findMany({
      where: {
        constructeur: 'KEELER',
        product_translations: {
          some: {
            nom: { contains: 'Montura deportiva keeler' }
          }
        }
      },
      include: {
        product_translations: true,
        product_media: true
      },
      orderBy: { created_at: 'asc' }
    });

    console.log(`Found ${duplicateFrames.length} Keeler sport frame products\n`);

    if (duplicateFrames.length === 0) {
      console.log('No products to consolidate');
      await prisma.$disconnect();
      return;
    }

    // List all products to be consolidated
    console.log('Products to consolidate:');
    duplicateFrames.forEach(p => {
      const frName = p.product_translations.find(t => t.language_code === 'fr')?.nom || 'No name';
      console.log(`- ${p.reference_fournisseur}: ${frName}`);
    });

    // Keep the first/oldest product as the master
    const masterProduct = duplicateFrames[0];
    const productsToDelete = duplicateFrames.slice(1);

    console.log(`\n📌 Master product: ${masterProduct.reference_fournisseur}`);
    console.log(`📌 Products to merge: ${productsToDelete.length}\n`);

    // Collect all unique reference numbers
    const allReferences = duplicateFrames.map(p => p.reference_fournisseur);
    const consolidatedRef = allReferences.join(', ');

    // Collect all media from products to be deleted
    const additionalMedia = [];
    for (const product of productsToDelete) {
      if (product.product_media && product.product_media.length > 0) {
        additionalMedia.push(...product.product_media);
      }
    }

    console.log('🔄 Updating master product...');

    // Update master product reference to include all SKUs
    await prisma.products.update({
      where: { id: masterProduct.id },
      data: {
        reference_fournisseur: consolidatedRef,
        updated_at: new Date()
      }
    });

    // Update French translation - remove (copy) and make it proper
    const frTranslation = await prisma.product_translations.findFirst({
      where: { 
        product_id: masterProduct.id,
        language_code: 'fr'
      }
    });

    if (frTranslation) {
      await prisma.product_translations.update({
        where: { id: frTranslation.id },
        data: {
          nom: 'Monture Sport Keeler (Standard)',
          description: 'Monture sport Keeler pour loupes binoculaires. Design ergonomique et confortable pour usage prolongé. Compatible avec toutes les loupes Keeler.'
        }
      });
      console.log('✅ Updated French translation');
    } else {
      // Create French translation if missing
      await prisma.product_translations.create({
        data: {
          id: randomUUID(),
          product_id: masterProduct.id,
          language_code: 'fr',
          nom: 'Monture Sport Keeler (Standard)',
          description: 'Monture sport Keeler pour loupes binoculaires. Design ergonomique et confortable pour usage prolongé. Compatible avec toutes les loupes Keeler.',
          fiche_technique: 'Monture sport standard compatible avec toutes les loupes Keeler'
        }
      });
      console.log('✅ Created French translation');
    }

    // Update or create English translation
    const enTranslation = await prisma.product_translations.findFirst({
      where: { 
        product_id: masterProduct.id,
        language_code: 'en'
      }
    });

    if (enTranslation) {
      await prisma.product_translations.update({
        where: { id: enTranslation.id },
        data: {
          nom: 'Keeler Sport Frame (Standard)',
          description: 'Keeler sport frame for binocular loupes. Ergonomic and comfortable design for extended use. Compatible with all Keeler loupes.'
        }
      });
      console.log('✅ Updated English translation');
    } else {
      // Create English translation
      await prisma.product_translations.create({
        data: {
          id: randomUUID(),
          product_id: masterProduct.id,
          language_code: 'en',
          nom: 'Keeler Sport Frame (Standard)',
          description: 'Keeler sport frame for binocular loupes. Ergonomic and comfortable design for extended use. Compatible with all Keeler loupes.',
          fiche_technique: 'Standard sport frame compatible with all Keeler loupes'
        }
      });
      console.log('✅ Created English translation');
    }

    // Copy unique media from deleted products to master (if any)
    if (additionalMedia.length > 0) {
      console.log(`\n📸 Checking ${additionalMedia.length} media items from products to be deleted...`);
      
      const masterMediaUrls = masterProduct.product_media.map(m => m.url);
      const uniqueMedia = additionalMedia.filter(m => !masterMediaUrls.includes(m.url));
      
      if (uniqueMedia.length > 0) {
        console.log(`Found ${uniqueMedia.length} unique media items to preserve`);
        
        for (const media of uniqueMedia) {
          await prisma.product_media.create({
            data: {
              id: randomUUID(),
              product_id: masterProduct.id,
              url: media.url,
              type: media.type,
              is_primary: false,
              alt_text: media.alt_text,
              title: media.title,
              sort_order: media.sort_order || 999
            }
          });
        }
        console.log('✅ Media preserved');
      } else {
        console.log('No unique media to preserve');
      }
    }

    // Delete the duplicate products
    console.log('\n🗑️ Deleting duplicate products...');
    for (const product of productsToDelete) {
      // First delete related data
      await prisma.product_translations.deleteMany({
        where: { product_id: product.id }
      });
      
      await prisma.product_media.deleteMany({
        where: { product_id: product.id }
      });
      
      // Then delete the product
      await prisma.products.delete({
        where: { id: product.id }
      });
      
      console.log(`  ✅ Deleted: ${product.reference_fournisseur}`);
    }

    // Final summary
    console.log('\n📊 CONSOLIDATION COMPLETE');
    console.log('========================');
    console.log(`✅ Master product updated: ${consolidatedRef}`);
    console.log(`✅ French name: Monture Sport Keeler (Standard)`);
    console.log(`✅ English name: Keeler Sport Frame (Standard)`);
    console.log(`✅ Deleted ${productsToDelete.length} duplicate products`);
    console.log(`✅ All SKUs consolidated into single listing`);

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

consolidateKeelerFrames();