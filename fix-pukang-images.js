const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

async function fixPukangImages() {
  try {
    console.log('🔧 Fixing PUKANG product images...');
    
    // Get all PUKANG products with their media
    const pukangProducts = await prisma.products.findMany({
      where: { constructeur: 'pukang' },
      include: { 
        product_media: true,
        product_translations: true
      }
    });
    
    console.log(`📦 Found ${pukangProducts.length} PUKANG products to fix`);
    
    let fixedCount = 0;
    
    for (const product of pukangProducts) {
      console.log(`\n🛠️  Processing: ${product.reference_fournisseur}`);
      
      // Get product name for the placeholder
      const frTranslation = product.product_translations.find(t => t.language_code === 'fr');
      const enTranslation = product.product_translations.find(t => t.language_code === 'en');
      const productName = frTranslation?.nom || enTranslation?.nom || product.reference_fournisseur;
      
      // Check if product has media with broken external URLs
      const brokenMedia = product.product_media.filter(media => 
        media.url.includes('image.chukouplus.com')
      );
      
      if (brokenMedia.length > 0) {
        console.log(`  🔍 Found ${brokenMedia.length} broken external image(s)`);
        
        // Option 1: Use a placeholder image URL or remove broken media
        // For now, let's remove the broken media entries
        for (const media of brokenMedia) {
          await prisma.product_media.delete({
            where: { id: media.id }
          });
          console.log(`  🗑️  Removed broken media: ${media.url.substring(0, 60)}...`);
        }
        
        // Create a new placeholder media entry
        const placeholderUrl = '/images/placeholder-product.svg';
        
        await prisma.product_media.create({
          data: {
            id: randomUUID(),
            product_id: product.id,
            type: 'image',
            url: placeholderUrl,
            alt_text: `${productName} - Image placeholder`,
            title: productName,
            is_primary: true,
            sort_order: 0
          }
        });
        
        console.log(`  ✅ Added placeholder image for ${product.reference_fournisseur}`);
        fixedCount++;
      } else {
        console.log(`  ✅ No broken images found`);
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} PUKANG products with broken images`);
    console.log('\n📝 Note: You may want to add a placeholder image at public/images/placeholder-product.jpg');
    
  } catch (error) {
    console.error('❌ Error fixing PUKANG images:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPukangImages();