const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function analyzeUnmatchedProducts() {
  try {
    console.log('🔍 ANALYZING WHY PRODUCTS WEREN\'T MATCHED');
    console.log('==========================================\n');

    // Read the professional CSV file
    const csvPath = '/Users/mac/Downloads/Batch1_Products_1-200_PROFESSIONAL.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Manufacturer mapping
    const manufacturerMap = {
      'ESENSA': 'esensa',
      'Espansione Group': 'espansione-marketing',
      'FCI': 'fci', 
      'Foshan Kaiyang': 'foshan',
      'HAAG-STREIT': 'haag-streit-u-k',
      'Haag-Streit': 'haag-streit-u-k',
      'HEINE': 'heine',
      'Johnson & Johnson': 'johnson-johnson-vision',
      'Keeler': 'KEELER'
    };

    // Get all manufacturers in database
    const dbManufacturers = await prisma.products.groupBy({
      by: ['constructeur'],
      _count: { id: true }
    });

    console.log('📋 MANUFACTURERS IN DATABASE:');
    dbManufacturers.forEach(m => {
      console.log(`  ${m.constructeur}: ${m._count.id} products`);
    });
    console.log('');

    let unmatchedCount = 0;
    let reasonBreakdown = {
      'No SKU': 0,
      'Manufacturer not in DB': 0,
      'SKU not found': 0,
      'Mixed issues': 0
    };

    // Parse CSV line helper
    function parseCSVLine(line) {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    }

    // Check first 20 unmatched products for detailed analysis
    let checkedCount = 0;
    console.log('🔍 DETAILED ANALYSIS OF FIRST 20 UNMATCHED:');
    console.log('===========================================');

    for (let i = 1; i < Math.min(lines.length, 21); i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = parseCSVLine(line);
      if (columns.length < 6) continue;

      const [brand, sku, titleEn, titleFr, descEn, descFr] = columns;
      
      if (!sku || sku.trim() === '') {
        console.log(`${i}. ❌ ${brand} - NO SKU PROVIDED`);
        reasonBreakdown['No SKU']++;
        unmatchedCount++;
        continue;
      }

      const dbManufacturer = manufacturerMap[brand] || brand.toLowerCase();
      
      // Check if manufacturer exists in database
      const manufacturerExists = dbManufacturers.some(m => m.constructeur === dbManufacturer);
      
      if (!manufacturerExists) {
        console.log(`${i}. ❌ ${brand} ${sku} - MANUFACTURER "${dbManufacturer}" NOT IN DATABASE`);
        console.log(`     Available variations: ${dbManufacturers.filter(m => m.constructeur.includes(brand.toLowerCase().substring(0, 3))).map(m => m.constructeur).join(', ') || 'None similar'}`);
        reasonBreakdown['Manufacturer not in DB']++;
        unmatchedCount++;
        continue;
      }

      // Check if product exists
      const product = await prisma.products.findFirst({
        where: {
          reference_fournisseur: sku,
          constructeur: dbManufacturer
        }
      });

      if (!product) {
        // Try to find similar SKUs
        const similarSKUs = await prisma.products.findMany({
          where: {
            constructeur: dbManufacturer,
            reference_fournisseur: {
              contains: sku.substring(0, Math.min(3, sku.length))
            }
          },
          select: { reference_fournisseur: true },
          take: 3
        });

        console.log(`${i}. ❌ ${brand} ${sku} - SKU NOT FOUND`);
        if (similarSKUs.length > 0) {
          console.log(`     Similar SKUs in DB: ${similarSKUs.map(p => p.reference_fournisseur).join(', ')}`);
        } else {
          console.log(`     No similar SKUs found for manufacturer ${dbManufacturer}`);
        }
        reasonBreakdown['SKU not found']++;
        unmatchedCount++;
      } else {
        console.log(`${i}. ✅ ${brand} ${sku} - WOULD MATCH (this should have been updated)`);
        checkedCount++;
      }

      if (checkedCount >= 20) break;
    }

    console.log('\n📊 UNMATCHED REASONS BREAKDOWN:');
    console.log('===============================');
    Object.entries(reasonBreakdown).forEach(([reason, count]) => {
      if (count > 0) {
        console.log(`${reason}: ${count} products`);
      }
    });

    console.log(`\nTotal unmatched analyzed: ${unmatchedCount}`);
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    
    if (reasonBreakdown['Manufacturer not in DB'] > 0) {
      console.log('• Some manufacturers in CSV don\'t exist in database');
      console.log('• Need to check manufacturer name mapping');
    }
    
    if (reasonBreakdown['SKU not found'] > 0) {
      console.log('• Many SKUs in CSV don\'t match database references');
      console.log('• Consider fuzzy matching or reference format differences');
    }

    if (reasonBreakdown['No SKU'] > 0) {
      console.log('• Some CSV rows have empty SKU fields');
      console.log('• These products cannot be matched without reference codes');
    }

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

analyzeUnmatchedProducts();