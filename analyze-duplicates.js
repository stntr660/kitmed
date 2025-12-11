const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeDuplicates() {
  try {
    console.log('🔍 ANALYZING PRODUCT DUPLICATES AND VARIATIONS');
    console.log('==============================================\n');

    // Get all products with translations
    const products = await prisma.products.findMany({
      include: {
        product_translations: true,
        product_media: true
      },
      orderBy: [
        { constructeur: 'asc' },
        { reference_fournisseur: 'asc' }
      ]
    });

    // 1. Find products with similar names
    console.log('📊 1. PRODUCTS WITH SIMILAR NAMES (Potential Duplicates)');
    console.log('--------------------------------------------------------');
    
    const nameGroups = {};
    products.forEach(p => {
      const frTranslation = p.product_translations.find(t => t.language_code === 'fr');
      if (frTranslation?.nom) {
        // Clean and normalize the name for comparison
        const baseName = frTranslation.nom
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s]/g, '')
          .trim();
        
        // Get first few words as key
        const key = baseName.split(' ').slice(0, 3).join(' ');
        
        if (!nameGroups[key]) {
          nameGroups[key] = [];
        }
        nameGroups[key].push({
          id: p.id,
          ref: p.reference_fournisseur,
          manufacturer: p.constructeur,
          name: frTranslation.nom,
          hasImage: p.product_media.some(m => m.type === 'image'),
          hasPdf: p.product_media.some(m => m.type === 'pdf')
        });
      }
    });

    // Show groups with multiple items
    Object.entries(nameGroups)
      .filter(([key, items]) => items.length > 1)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([key, items]) => {
        console.log(`\n🔄 Group: "${key}" (${items.length} products)`);
        items.forEach(item => {
          console.log(`   - ${item.ref} (${item.manufacturer}) - ${item.name}`);
          console.log(`     Media: ${item.hasImage ? '📸' : '❌'} Image | ${item.hasPdf ? '📄' : '❌'} PDF`);
        });
      });

    // 2. Find products with sequential references (likely variations)
    console.log('\n\n📊 2. SEQUENTIAL REFERENCES (Likely Size/Model Variations)');
    console.log('----------------------------------------------------------');
    
    const refPatterns = {};
    products.forEach(p => {
      // Extract base pattern from reference (remove trailing numbers/letters)
      const basePattern = p.reference_fournisseur.replace(/[\d\-]+$/, '').replace(/[A-Z]$/, '');
      
      if (basePattern.length > 2) {
        if (!refPatterns[basePattern]) {
          refPatterns[basePattern] = [];
        }
        refPatterns[basePattern].push({
          ref: p.reference_fournisseur,
          manufacturer: p.constructeur,
          name: p.product_translations.find(t => t.language_code === 'fr')?.nom || 'No name'
        });
      }
    });

    Object.entries(refPatterns)
      .filter(([pattern, items]) => items.length > 2)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([pattern, items]) => {
        console.log(`\n📦 Pattern: "${pattern}" (${items.length} variations)`);
        const byManufacturer = {};
        items.forEach(item => {
          if (!byManufacturer[item.manufacturer]) {
            byManufacturer[item.manufacturer] = [];
          }
          byManufacturer[item.manufacturer].push(item);
        });
        
        Object.entries(byManufacturer).forEach(([mfg, mfgItems]) => {
          console.log(`   ${mfg}:`);
          mfgItems.forEach(item => {
            console.log(`     - ${item.ref}: ${item.name}`);
          });
        });
      });

    // 3. Find products with comma-separated references (bulk entries)
    console.log('\n\n📊 3. COMMA-SEPARATED REFERENCES (Bulk Entries)');
    console.log('------------------------------------------------');
    
    const commaRefs = products.filter(p => p.reference_fournisseur.includes(','));
    if (commaRefs.length > 0) {
      commaRefs.forEach(p => {
        const frName = p.product_translations.find(t => t.language_code === 'fr')?.nom || 'No name';
        console.log(`\n🔗 ${p.constructeur}: ${p.reference_fournisseur}`);
        console.log(`   Name: ${frName}`);
        const refs = p.reference_fournisseur.split(',').map(r => r.trim());
        console.log(`   Contains ${refs.length} references: ${refs.join(', ')}`);
      });
    } else {
      console.log('   None found');
    }

    // 4. Find products with similar references but different manufacturers
    console.log('\n\n📊 4. SAME REFERENCE - DIFFERENT MANUFACTURERS');
    console.log('----------------------------------------------');
    
    const refByManufacturer = {};
    products.forEach(p => {
      if (!refByManufacturer[p.reference_fournisseur]) {
        refByManufacturer[p.reference_fournisseur] = [];
      }
      refByManufacturer[p.reference_fournisseur].push({
        manufacturer: p.constructeur,
        name: p.product_translations.find(t => t.language_code === 'fr')?.nom || 'No name'
      });
    });

    Object.entries(refByManufacturer)
      .filter(([ref, items]) => items.length > 1)
      .forEach(([ref, items]) => {
        console.log(`\n❗ Reference: ${ref}`);
        items.forEach(item => {
          console.log(`   - ${item.manufacturer}: ${item.name}`);
        });
      });

    // 5. Analyze by manufacturer
    console.log('\n\n📊 5. MANUFACTURER ANALYSIS');
    console.log('---------------------------');
    
    const manufacturerStats = {};
    products.forEach(p => {
      if (!manufacturerStats[p.constructeur]) {
        manufacturerStats[p.constructeur] = {
          total: 0,
          withImages: 0,
          withPdfs: 0,
          withTranslations: 0
        };
      }
      manufacturerStats[p.constructeur].total++;
      if (p.product_media.some(m => m.type === 'image')) {
        manufacturerStats[p.constructeur].withImages++;
      }
      if (p.product_media.some(m => m.type === 'pdf')) {
        manufacturerStats[p.constructeur].withPdfs++;
      }
      if (p.product_translations.length > 0) {
        manufacturerStats[p.constructeur].withTranslations++;
      }
    });

    Object.entries(manufacturerStats)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .forEach(([mfg, stats]) => {
        console.log(`\n${mfg}:`);
        console.log(`   Total: ${stats.total} products`);
        console.log(`   With Images: ${stats.withImages} (${Math.round(stats.withImages/stats.total*100)}%)`);
        console.log(`   With PDFs: ${stats.withPdfs} (${Math.round(stats.withPdfs/stats.total*100)}%)`);
        console.log(`   With Translations: ${stats.withTranslations} (${Math.round(stats.withTranslations/stats.total*100)}%)`);
      });

    // 6. Find accessory patterns
    console.log('\n\n📊 6. ACCESSORY PATTERNS');
    console.log('------------------------');
    
    const accessoryKeywords = ['accessoire', 'kit', 'set', 'pack', 'spare', 'replacement', 'adapter', 'connector', 'cable', 'lens', 'filter'];
    const accessories = products.filter(p => {
      const frName = p.product_translations.find(t => t.language_code === 'fr')?.nom || '';
      const enName = p.product_translations.find(t => t.language_code === 'en')?.nom || '';
      const combinedName = `${frName} ${enName}`.toLowerCase();
      return accessoryKeywords.some(keyword => combinedName.includes(keyword));
    });

    if (accessories.length > 0) {
      console.log(`Found ${accessories.length} potential accessories:`);
      accessories.slice(0, 20).forEach(p => {
        const frName = p.product_translations.find(t => t.language_code === 'fr')?.nom || 'No name';
        console.log(`   - ${p.reference_fournisseur} (${p.constructeur}): ${frName}`);
      });
    }

    await prisma.$disconnect();

  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

analyzeDuplicates();