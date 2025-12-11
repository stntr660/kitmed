const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findExactDuplicates() {
  try {
    console.log('🔍 FINDING EXACT DUPLICATE PRODUCTS');
    console.log('====================================\n');

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

    // 1. Find products with EXACT same reference AND manufacturer
    console.log('📌 1. EXACT DUPLICATES (Same Reference + Same Manufacturer)');
    console.log('-----------------------------------------------------------');
    
    const refManufacturerMap = {};
    products.forEach(p => {
      const key = `${p.reference_fournisseur}|${p.constructeur}`;
      if (!refManufacturerMap[key]) {
        refManufacturerMap[key] = [];
      }
      refManufacturerMap[key].push({
        id: p.id,
        slug: p.slug,
        ref: p.reference_fournisseur,
        manufacturer: p.constructeur,
        name: p.product_translations.find(t => t.language_code === 'fr')?.nom || 'No name',
        created: p.created_at
      });
    });

    let exactDuplicatesFound = false;
    Object.entries(refManufacturerMap)
      .filter(([key, items]) => items.length > 1)
      .forEach(([key, items]) => {
        exactDuplicatesFound = true;
        console.log(`\n❗ DUPLICATE: ${items[0].ref} (${items[0].manufacturer})`);
        console.log(`   Found ${items.length} copies:`);
        items.forEach((item, index) => {
          console.log(`   ${index + 1}. ID: ${item.id.substring(0, 8)}... | Created: ${item.created.toISOString().split('T')[0]}`);
          console.log(`      Name: ${item.name}`);
          console.log(`      Slug: ${item.slug}`);
        });
        console.log(`   ➜ Action: Keep oldest, delete ${items.length - 1} duplicate(s)`);
      });

    if (!exactDuplicatesFound) {
      console.log('   ✅ No exact duplicates found');
    }

    // 2. Find products with same name AND manufacturer (but different refs)
    console.log('\n\n📌 2. SAME NAME + SAME MANUFACTURER (Possible Duplicates)');
    console.log('----------------------------------------------------------');
    
    const nameManufacturerMap = {};
    products.forEach(p => {
      const frName = p.product_translations.find(t => t.language_code === 'fr')?.nom;
      if (frName) {
        const key = `${frName.toLowerCase().trim()}|${p.constructeur}`;
        if (!nameManufacturerMap[key]) {
          nameManufacturerMap[key] = [];
        }
        nameManufacturerMap[key].push({
          id: p.id,
          ref: p.reference_fournisseur,
          manufacturer: p.constructeur,
          name: frName,
          hasImage: p.product_media.some(m => m.type === 'image'),
          hasPdf: p.product_media.some(m => m.type === 'pdf')
        });
      }
    });

    let nameduplicatesFound = false;
    Object.entries(nameManufacturerMap)
      .filter(([key, items]) => items.length > 1)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 20) // Show top 20
      .forEach(([key, items]) => {
        nameduplicatesFound = true;
        const [name, manufacturer] = key.split('|');
        console.log(`\n🔄 "${items[0].name}" by ${manufacturer}`);
        console.log(`   ${items.length} products with this exact name:`);
        items.forEach(item => {
          console.log(`   - Ref: ${item.ref} | Media: ${item.hasImage ? '📸' : '❌'} Image, ${item.hasPdf ? '📄' : '❌'} PDF`);
        });
        
        // Check if references are truly different or just variations
        const refs = items.map(i => i.ref);
        const baseRef = refs[0].replace(/[A-Z]$/, '').replace(/\d+$/, '');
        const allSimilar = refs.every(ref => ref.startsWith(baseRef.substring(0, 5)));
        
        if (allSimilar) {
          console.log(`   ➜ Likely variations (sequential refs), not true duplicates`);
        } else {
          console.log(`   ⚠️ Different references - verify if truly same product`);
        }
      });

    if (!nameduplicatesFound) {
      console.log('   No products with identical names found');
    }

    // 3. Find suspiciously similar slugs (often indicates duplicates)
    console.log('\n\n📌 3. DUPLICATE SLUGS (System-generated duplicates)');
    console.log('---------------------------------------------------');
    
    const slugMap = {};
    products.forEach(p => {
      const baseSlug = p.slug.replace(/-\d+$/, ''); // Remove trailing numbers
      if (!slugMap[baseSlug]) {
        slugMap[baseSlug] = [];
      }
      slugMap[baseSlug].push({
        id: p.id,
        slug: p.slug,
        ref: p.reference_fournisseur,
        manufacturer: p.constructeur,
        name: p.product_translations.find(t => t.language_code === 'fr')?.nom || 'No name'
      });
    });

    let slugDuplicatesFound = false;
    Object.entries(slugMap)
      .filter(([slug, items]) => {
        // Only show if slugs end with numbers (like product-name-2, product-name-3)
        return items.length > 1 && items.some(i => /-\d+$/.test(i.slug));
      })
      .slice(0, 10)
      .forEach(([baseSlug, items]) => {
        slugDuplicatesFound = true;
        console.log(`\n🔗 Base slug: "${baseSlug}"`);
        items.forEach(item => {
          console.log(`   - ${item.slug} | Ref: ${item.ref} | ${item.manufacturer}`);
          console.log(`     Name: ${item.name}`);
        });
        console.log(`   ⚠️ System added numbers to avoid slug conflicts - check if duplicates`);
      });

    if (!slugDuplicatesFound) {
      console.log('   No suspicious slug patterns found');
    }

    // 4. Summary statistics
    console.log('\n\n📊 SUMMARY');
    console.log('----------');
    
    const exactDupeCount = Object.values(refManufacturerMap)
      .filter(items => items.length > 1)
      .reduce((sum, items) => sum + (items.length - 1), 0);
    
    const nameDupeCount = Object.values(nameManufacturerMap)
      .filter(items => items.length > 1)
      .reduce((sum, items) => sum + (items.length - 1), 0);

    console.log(`Total products analyzed: ${products.length}`);
    console.log(`Exact duplicates to remove: ${exactDupeCount}`);
    console.log(`Products with identical names: ${nameDupeCount}`);
    console.log(`\nPotential space savings: ${exactDupeCount} products can be safely deleted`);

    await prisma.$disconnect();

  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

findExactDuplicates();