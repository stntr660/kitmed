const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function analyzeImageIssues() {
  try {
    console.log('🔍 COMPREHENSIVE IMAGE ANALYSIS');
    console.log('===============================\n');
    
    // 1. Products without any images
    const noImages = await prisma.products.count({
      where: { product_media: { none: {} } }
    });
    console.log(`❌ Products with NO images: ${noImages}`);
    
    // 2. Products with external images that might fail
    const externalImages = await prisma.product_media.count({
      where: { url: { startsWith: 'http' } }
    });
    console.log(`🌐 Products with external images: ${externalImages}`);
    
    // 3. Products with local images that might be missing files
    const localImages = await prisma.product_media.findMany({
      where: { 
        url: { startsWith: '/uploads/' }
      },
      include: {
        products: { 
          select: { reference_fournisseur: true, constructeur: true } 
        }
      }
    });
    
    let missingFiles = 0;
    let existingFiles = 0;
    
    console.log(`\n💾 Checking ${localImages.length} local images...`);
    
    for (const media of localImages.slice(0, 20)) { // Check first 20 to avoid overwhelming
      const fullPath = path.join('/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/public', media.url);
      if (fs.existsSync(fullPath)) {
        existingFiles++;
      } else {
        missingFiles++;
        console.log(`❌ Missing file: ${media.url} (${media.products.reference_fournisseur})`);
      }
    }
    
    console.log(`✅ Local files exist: ${existingFiles}`);
    console.log(`❌ Local files missing: ${missingFiles}`);
    
    // 4. Products with placeholder images
    const placeholders = await prisma.product_media.count({
      where: { url: '/images/placeholder-product.svg' }
    });
    console.log(`🔄 Products with placeholders: ${placeholders}`);
    
    // 5. Breakdown by manufacturer
    console.log('\n📊 IMAGES BY MANUFACTURER:');
    console.log('==========================');
    
    const manufacturers = await prisma.products.groupBy({
      by: ['constructeur'],
      _count: { id: true }
    });
    
    for (const mfg of manufacturers.slice(0, 10)) {
      const withImages = await prisma.products.count({
        where: { 
          constructeur: mfg.constructeur,
          product_media: { some: {} }
        }
      });
      const withoutImages = mfg._count.id - withImages;
      
      console.log(`${mfg.constructeur}: ${withImages}✅ / ${withoutImages}❌ (${mfg._count.id} total)`);
    }
    
    // 6. Recent uploads status
    console.log('\n🕒 RECENT UPLOADS (last 10):');
    console.log('============================');
    
    const recent = await prisma.products.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      include: { product_media: true }
    });
    
    recent.forEach(p => {
      const hasImages = p.product_media.length > 0 ? '✅' : '❌';
      const imageType = p.product_media[0]?.url.startsWith('http') ? '🌐' : 
                       p.product_media[0]?.url.includes('placeholder') ? '🔄' : '💾';
      console.log(`${hasImages} ${imageType} ${p.reference_fournisseur} (${p.constructeur})`);
    });
    
    console.log('\n📋 SUMMARY:');
    console.log('===========');
    console.log('🌐 External images might show question marks if domains have CORS issues');
    console.log('💾 Local images should display properly if files exist');
    console.log('🔄 Placeholders replace broken external images');
    console.log('❌ Products without images need CSV re-processing');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeImageIssues();