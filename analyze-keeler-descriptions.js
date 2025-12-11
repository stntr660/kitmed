const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeKeelerDescriptions() {
  try {
    console.log('🔍 ANALYZING KEELER PRODUCT DESCRIPTIONS');
    console.log('========================================\n');

    // Get all Keeler products with their translations
    const keelerProducts = await prisma.products.findMany({
      where: {
        constructeur: 'KEELER'
      },
      include: {
        product_translations: true,
        product_media: true
      },
      orderBy: { reference_fournisseur: 'asc' }
    });

    console.log(`Total Keeler products: ${keelerProducts.length}\n`);

    // Analyze description patterns
    const productGroups = {
      ophthalmoscopes: [],
      otoscopes: [],
      loupes: [],
      tonometers: [],
      batteries: [],
      accessories: [],
      lamps: [],
      indirect: [],
      other: []
    };

    // Group products by type based on name patterns
    keelerProducts.forEach(product => {
      const frName = product.product_translations.find(t => t.language_code === 'fr')?.nom || '';
      const enName = product.product_translations.find(t => t.language_code === 'en')?.nom || '';
      const combinedName = `${frName} ${enName}`.toLowerCase();
      
      const productInfo = {
        ref: product.reference_fournisseur,
        frName: frName,
        enName: enName,
        frDesc: product.product_translations.find(t => t.language_code === 'fr')?.description || '',
        enDesc: product.product_translations.find(t => t.language_code === 'en')?.description || '',
        hasImage: product.product_media.some(m => m.type === 'image'),
        hasPdf: product.product_media.some(m => m.type === 'pdf')
      };

      // Categorize based on keywords
      if (combinedName.includes('ophthalmoscope') || combinedName.includes('oftalmoscopio')) {
        productGroups.ophthalmoscopes.push(productInfo);
      } else if (combinedName.includes('otoscope')) {
        productGroups.otoscopes.push(productInfo);
      } else if (combinedName.includes('loupe') || combinedName.includes('magnif')) {
        productGroups.loupes.push(productInfo);
      } else if (combinedName.includes('tonometer') || combinedName.includes('pulsair')) {
        productGroups.tonometers.push(productInfo);
      } else if (combinedName.includes('battery') || combinedName.includes('lithium') || combinedName.includes('charger')) {
        productGroups.batteries.push(productInfo);
      } else if (combinedName.includes('lamp') || combinedName.includes('lámpara') || combinedName.includes('slit')) {
        productGroups.lamps.push(productInfo);
      } else if (combinedName.includes('indirect') || combinedName.includes('vantage')) {
        productGroups.indirect.push(productInfo);
      } else if (combinedName.includes('sleeve') || combinedName.includes('prism') || combinedName.includes('shield') || 
                 combinedName.includes('case') || combinedName.includes('kit') || combinedName.includes('pack')) {
        productGroups.accessories.push(productInfo);
      } else {
        productGroups.other.push(productInfo);
      }
    });

    // Display analysis for each category
    console.log('📊 PRODUCT CATEGORIES AND CURRENT DESCRIPTIONS\n');
    console.log('================================================\n');

    // 1. OPHTHALMOSCOPES
    if (productGroups.ophthalmoscopes.length > 0) {
      console.log('🔬 OPHTHALMOSCOPES (' + productGroups.ophthalmoscopes.length + ' products)');
      console.log('--------------------------------');
      
      // Show sample products with missing or problematic descriptions
      const samples = productGroups.ophthalmoscopes.slice(0, 5);
      samples.forEach(p => {
        console.log(`\n📦 ${p.ref}`);
        console.log(`   FR Name: ${p.frName || '❌ MISSING'}`);
        console.log(`   EN Name: ${p.enName || '❌ MISSING'}`);
        console.log(`   FR Desc: ${p.frDesc ? '✅ ' + p.frDesc.substring(0, 50) + '...' : '❌ MISSING'}`);
        console.log(`   EN Desc: ${p.enDesc ? '✅ ' + p.enDesc.substring(0, 50) + '...' : '❌ MISSING'}`);
        
        if (!p.frDesc || !p.enDesc) {
          console.log('   ⚠️  Needs description update');
        }
      });
    }

    // 2. OTOSCOPES
    if (productGroups.otoscopes.length > 0) {
      console.log('\n\n🔬 OTOSCOPES (' + productGroups.otoscopes.length + ' products)');
      console.log('--------------------------------');
      
      const samples = productGroups.otoscopes.slice(0, 5);
      samples.forEach(p => {
        console.log(`\n📦 ${p.ref}`);
        console.log(`   FR Name: ${p.frName || '❌ MISSING'}`);
        console.log(`   EN Name: ${p.enName || '❌ MISSING'}`);
        console.log(`   FR Desc: ${p.frDesc ? '✅ ' + p.frDesc.substring(0, 50) + '...' : '❌ MISSING'}`);
        console.log(`   EN Desc: ${p.enDesc ? '✅ ' + p.enDesc.substring(0, 50) + '...' : '❌ MISSING'}`);
      });
    }

    // 3. TONOMETERS
    if (productGroups.tonometers.length > 0) {
      console.log('\n\n🔬 TONOMETERS (' + productGroups.tonometers.length + ' products)');
      console.log('--------------------------------');
      
      const samples = productGroups.tonometers.slice(0, 5);
      samples.forEach(p => {
        console.log(`\n📦 ${p.ref}`);
        console.log(`   FR Name: ${p.frName || '❌ MISSING'}`);
        console.log(`   EN Name: ${p.enName || '❌ MISSING'}`);
        console.log(`   FR Desc: ${p.frDesc ? '✅ ' + p.frDesc.substring(0, 50) + '...' : '❌ MISSING'}`);
        console.log(`   EN Desc: ${p.enDesc ? '✅ ' + p.enDesc.substring(0, 50) + '...' : '❌ MISSING'}`);
      });
    }

    // 4. BATTERIES & POWER
    if (productGroups.batteries.length > 0) {
      console.log('\n\n🔋 BATTERIES & POWER (' + productGroups.batteries.length + ' products)');
      console.log('--------------------------------');
      
      const samples = productGroups.batteries.slice(0, 5);
      samples.forEach(p => {
        console.log(`\n📦 ${p.ref}`);
        console.log(`   FR Name: ${p.frName || '❌ MISSING'}`);
        console.log(`   EN Name: ${p.enName || '❌ MISSING'}`);
        console.log(`   FR Desc: ${p.frDesc ? '✅ ' + p.frDesc.substring(0, 50) + '...' : '❌ MISSING'}`);
        console.log(`   EN Desc: ${p.enDesc ? '✅ ' + p.enDesc.substring(0, 50) + '...' : '❌ MISSING'}`);
      });
    }

    // Summary statistics
    console.log('\n\n📊 DESCRIPTION ANALYSIS SUMMARY');
    console.log('================================');
    
    let totalMissingFr = 0;
    let totalMissingEn = 0;
    let totalMissingBoth = 0;
    let totalWithSpanish = 0;
    
    keelerProducts.forEach(p => {
      const frTrans = p.product_translations.find(t => t.language_code === 'fr');
      const enTrans = p.product_translations.find(t => t.language_code === 'en');
      
      const hasFrDesc = frTrans && frTrans.description && frTrans.description.length > 0;
      const hasEnDesc = enTrans && enTrans.description && enTrans.description.length > 0;
      
      if (!hasFrDesc) totalMissingFr++;
      if (!hasEnDesc) totalMissingEn++;
      if (!hasFrDesc && !hasEnDesc) totalMissingBoth++;
      
      // Check for Spanish words
      const frName = frTrans?.nom || '';
      const enName = enTrans?.nom || '';
      if (frName.includes('oftalmoscopio') || frName.includes('lámpara') || 
          frName.includes('deportiva') || enName.includes('oftalmoscopio')) {
        totalWithSpanish++;
      }
    });

    console.log(`Total Keeler products: ${keelerProducts.length}`);
    console.log(`Missing French descriptions: ${totalMissingFr}`);
    console.log(`Missing English descriptions: ${totalMissingEn}`);
    console.log(`Missing both descriptions: ${totalMissingBoth}`);
    console.log(`Products with Spanish words: ${totalWithSpanish}`);
    
    console.log('\n📝 LANGUAGE ISSUES DETECTED:');
    console.log('----------------------------');
    
    // Find products with Spanish words
    const spanishProducts = keelerProducts.filter(p => {
      const frName = p.product_translations.find(t => t.language_code === 'fr')?.nom || '';
      return frName.includes('oftalmoscopio') || frName.includes('lámpara') || 
             frName.includes('deportiva') || frName.includes('pour') || 
             frName.includes('de bolsillo');
    });
    
    console.log('\nProducts with Spanish/Mixed language in French names:');
    spanishProducts.slice(0, 10).forEach(p => {
      const frName = p.product_translations.find(t => t.language_code === 'fr')?.nom || '';
      console.log(`- ${p.reference_fournisseur}: "${frName}"`);
    });

    await prisma.$disconnect();

  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

analyzeKeelerDescriptions();