const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Enhanced manufacturer mapping with all variations
const manufacturerMap = {
  'Keeler': 'KEELER',
  'KEELER': 'KEELER',
  'Medicel': 'medicel',
  'MEDICEL': 'medicel',
  'Moria Surgical': 'MORIA',
  'MORIA': 'MORIA',
  'Moria': 'MORIA'
};

// Calculate similarity between two strings
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 100;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 90;
  }
  
  // Calculate word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));
  const similarity = (commonWords.length * 2) / (words1.length + words2.length) * 100;
  
  return similarity;
}

// Extract key medical terms from product name
function extractKeyTerms(name) {
  const medicalTerms = [
    'forceps', 'scissors', 'knife', 'spatula', 'hook', 'cannula', 
    'marker', 'caliper', 'speculum', 'lens', 'implant', 'frame',
    'capsulorhexis', 'iris', 'tying', 'micro', 'titanium',
    'straight', 'curved', 'angled', 'serrated', 'phaco',
    'vitrectomy', 'retinal', 'corneal', 'cataract', 'disposable',
    'ophthalmoscope', 'otoscope', 'slit', 'lamp', 'tonometer',
    'jazz', 'pocket', 'wireless', 'rechargeable', 'led', 'specialist',
    'artisan', 'artilens', 'artiflex', 'veriflex', 'verisyse'
  ];
  
  const nameLower = name.toLowerCase();
  const foundTerms = [];
  
  medicalTerms.forEach(term => {
    if (nameLower.includes(term)) {
      foundTerms.push(term);
    }
  });
  
  // Also extract measurements and model numbers
  const measurements = name.match(/\d+(?:\.\d+)?\s*(?:mm|cm|ml|gauge|g)/gi) || [];
  const angles = name.match(/\d+\s*°/g) || [];
  const models = name.match(/[A-Z0-9]+-?[A-Z0-9]+/g) || [];
  
  return {
    terms: foundTerms,
    measurements: measurements,
    angles: angles,
    models: models
  };
}

// Parse CSV line handling quoted fields
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

async function processBatch2() {
  try {
    console.log('🚀 PROCESSING BATCH 2 (201-400) WITH SMART MATCHING');
    console.log('==================================================\n');

    // Read the Batch 2 CSV file
    const csvPath = '/Users/mac/Downloads/Batch2_Products_201-400_PROFESSIONAL.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📄 Processing ${lines.length - 1} products from Batch 2\n`);
    
    // Track statistics
    let processedCount = 0;
    let exactMatches = 0;
    let smartMatches = 0;
    let updatedCount = 0;
    let failedMatches = [];
    
    // Process each CSV line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = parseCSVLine(line);
      if (columns.length < 6) continue;
      
      const [brand, sku, titleEn, titleFr, descEn, descFr] = columns;
      
      processedCount++;
      
      // Map manufacturer name
      const dbManufacturer = manufacturerMap[brand] || brand.toLowerCase();
      
      console.log(`\n${processedCount}. Processing: ${brand} - ${sku || 'NO SKU'}`);
      console.log(`   EN: ${titleEn.substring(0, 60)}...`);
      
      let matched = false;
      let product = null;
      
      // 1. Try exact SKU match first
      if (sku && sku.trim() !== '') {
        // Handle complex SKUs
        const skuParts = sku.split(/[,\s]+/).filter(s => s.trim());
        
        for (const skuPart of skuParts) {
          product = await prisma.products.findFirst({
            where: {
              reference_fournisseur: skuPart.trim(),
              constructeur: dbManufacturer
            },
            include: { product_translations: true }
          });
          
          if (product) {
            console.log(`   ✅ Exact SKU match: ${skuPart}`);
            exactMatches++;
            matched = true;
            break;
          }
        }
      }
      
      // 2. If no exact match, try smart name matching
      if (!matched) {
        const allProducts = await prisma.products.findMany({
          where: { constructeur: dbManufacturer },
          include: { product_translations: true }
        });
        
        const csvTermsEn = extractKeyTerms(titleEn);
        const csvTermsFr = extractKeyTerms(titleFr);
        
        let bestMatch = null;
        let bestScore = 0;
        
        for (const dbProduct of allProducts) {
          const frTrans = dbProduct.product_translations.find(t => t.language_code === 'fr');
          const enTrans = dbProduct.product_translations.find(t => t.language_code === 'en');
          
          if (!frTrans && !enTrans) continue;
          
          // Calculate name similarity
          let nameScore = 0;
          if (frTrans && frTrans.nom) {
            const frScore = calculateSimilarity(titleFr, frTrans.nom);
            nameScore = Math.max(nameScore, frScore);
          }
          if (enTrans && enTrans.nom) {
            const enScore = calculateSimilarity(titleEn, enTrans.nom);
            nameScore = Math.max(nameScore, enScore);
          }
          
          // Boost score for matching key terms
          const dbTermsFr = frTrans ? extractKeyTerms(frTrans.nom) : { terms: [], measurements: [], angles: [], models: [] };
          const dbTermsEn = enTrans ? extractKeyTerms(enTrans.nom) : { terms: [], measurements: [], angles: [], models: [] };
          
          // Check common medical terms
          const commonTerms = [
            ...csvTermsEn.terms.filter(t => dbTermsEn.terms.includes(t) || dbTermsFr.terms.includes(t)),
            ...csvTermsFr.terms.filter(t => dbTermsEn.terms.includes(t) || dbTermsFr.terms.includes(t))
          ];
          
          if (commonTerms.length > 0) {
            nameScore += commonTerms.length * 10;
          }
          
          // Check matching measurements
          const csvMeasurements = [...csvTermsEn.measurements, ...csvTermsFr.measurements];
          const dbMeasurements = [...dbTermsEn.measurements, ...dbTermsFr.measurements];
          const commonMeasurements = csvMeasurements.filter(m => dbMeasurements.includes(m));
          
          if (commonMeasurements.length > 0) {
            nameScore += commonMeasurements.length * 15;
          }
          
          // Check matching model numbers
          const csvModels = [...csvTermsEn.models, ...csvTermsFr.models];
          const dbModels = [...dbTermsEn.models, ...dbTermsFr.models];
          const commonModels = csvModels.filter(m => dbModels.includes(m));
          
          if (commonModels.length > 0) {
            nameScore += commonModels.length * 20;
          }
          
          if (nameScore > bestScore) {
            bestScore = nameScore;
            bestMatch = dbProduct;
          }
        }
        
        // Accept matches with score > 60
        if (bestMatch && bestScore > 60) {
          product = bestMatch;
          console.log(`   🎯 Smart match: ${product.reference_fournisseur} (score: ${bestScore.toFixed(1)})`);
          smartMatches++;
          matched = true;
        }
      }
      
      // 3. Update product if matched
      if (matched && product) {
        try {
          const frTrans = product.product_translations.find(t => t.language_code === 'fr');
          const enTrans = product.product_translations.find(t => t.language_code === 'en');
          
          // Update or create French translation
          if (frTrans) {
            await prisma.product_translations.update({
              where: { id: frTrans.id },
              data: {
                nom: titleFr,
                description: descFr
              }
            });
          } else {
            await prisma.product_translations.create({
              data: {
                id: require('crypto').randomUUID(),
                product_id: product.id,
                language_code: 'fr',
                nom: titleFr,
                description: descFr
              }
            });
          }
          
          // Update or create English translation
          if (enTrans) {
            await prisma.product_translations.update({
              where: { id: enTrans.id },
              data: {
                nom: titleEn,
                description: descEn
              }
            });
          } else {
            await prisma.product_translations.create({
              data: {
                id: require('crypto').randomUUID(),
                product_id: product.id,
                language_code: 'en',
                nom: titleEn,
                description: descEn
              }
            });
          }
          
          updatedCount++;
          console.log(`   ✅ Updated with professional translations`);
        } catch (error) {
          console.log(`   ❌ Update error: ${error.message}`);
        }
      } else {
        console.log(`   ❌ No match found`);
        failedMatches.push({
          brand,
          sku: sku || 'NO_SKU',
          titleEn,
          titleFr,
          descEn,
          descFr
        });
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BATCH 2 PROCESSING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total products in CSV: ${processedCount}`);
    console.log(`Exact SKU matches: ${exactMatches}`);
    console.log(`Smart name matches: ${smartMatches}`);
    console.log(`Total matched: ${exactMatches + smartMatches}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Unmatched products: ${failedMatches.length}`);
    console.log(`Success rate: ${((updatedCount / processedCount) * 100).toFixed(1)}%`);
    
    // Save unmatched products to file
    if (failedMatches.length > 0) {
      const unmatchedContent = failedMatches.map(p => 
        `${p.brand},${p.sku},"${p.titleEn}","${p.titleFr}","${p.descEn}","${p.descFr}"`
      ).join('\n');
      
      const header = 'Brand,SKU,Title_EN,Title_FR,Description_EN,Description_FR';
      fs.writeFileSync(
        '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/batch2-unmatched.csv',
        header + '\n' + unmatchedContent
      );
      
      console.log('\n📝 Unmatched products saved to: batch2-unmatched.csv');
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Batch 2 processing complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the batch 2 processor
processBatch2();