const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Calculate similarity between two strings (Levenshtein distance)
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
    'marker', 'caliper', 'speculum', 'IOL', 'lens', 'implant',
    'capsulorhexis', 'iris', 'tying', 'micro', 'titanium',
    'straight', 'curved', 'angled', 'serrated', 'phaco',
    'vitrectomy', 'retinal', 'corneal', 'cataract'
  ];
  
  const nameLower = name.toLowerCase();
  const foundTerms = [];
  
  medicalTerms.forEach(term => {
    if (nameLower.includes(term)) {
      foundTerms.push(term);
    }
  });
  
  // Also extract measurements
  const measurements = name.match(/\d+(?:\.\d+)?\s*(?:mm|cm|ml|gauge|g)/gi) || [];
  const angles = name.match(/\d+\s*°/g) || [];
  
  return {
    terms: foundTerms,
    measurements: measurements,
    angles: angles
  };
}

async function smartMatchFCIProducts() {
  try {
    console.log('🧠 SMART MATCHING FCI PRODUCTS BY NAME');
    console.log('======================================\n');

    // Read the professional CSV file
    const csvPath = '/Users/mac/Downloads/Batch1_Products_1-200_PROFESSIONAL.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Get all FCI products from database
    const fciProducts = await prisma.products.findMany({
      where: { constructeur: 'fci' },
      include: { product_translations: true }
    });
    
    console.log(`Found ${fciProducts.length} FCI products in database\n`);
    
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
    
    let matchedCount = 0;
    let updatedCount = 0;
    const matches = [];
    
    // Process each CSV line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = parseCSVLine(line);
      if (columns.length < 6) continue;
      
      const [brand, sku, titleEn, titleFr, descEn, descFr] = columns;
      
      // Only process FCI products
      if (brand !== 'FCI') continue;
      
      console.log(`\n📦 Processing FCI product from CSV:`);
      console.log(`   EN: ${titleEn}`);
      console.log(`   FR: ${titleFr}`);
      console.log(`   SKU: ${sku || 'NO SKU'}`);
      
      // Extract key terms from CSV product names
      const csvTermsEn = extractKeyTerms(titleEn);
      const csvTermsFr = extractKeyTerms(titleFr);
      
      console.log(`   Key terms: ${[...csvTermsEn.terms, ...csvTermsFr.terms].join(', ')}`);
      
      // Find best match in database
      let bestMatch = null;
      let bestScore = 0;
      
      for (const dbProduct of fciProducts) {
        // Try exact SKU match first if SKU exists
        if (sku && sku.trim() !== '') {
          // Handle complex SKUs (e.g., "A10.1500, A1.2100")
          const skuParts = sku.split(/[,\s]+/).filter(s => s.trim());
          for (const skuPart of skuParts) {
            if (dbProduct.reference_fournisseur === skuPart.trim()) {
              bestMatch = dbProduct;
              bestScore = 100;
              console.log(`   ✅ Exact SKU match found: ${skuPart}`);
              break;
            }
          }
          if (bestMatch) break;
        }
        
        // If no exact SKU match, try name matching
        const frTrans = dbProduct.product_translations.find(t => t.language_code === 'fr');
        const enTrans = dbProduct.product_translations.find(t => t.language_code === 'en');
        
        if (!frTrans && !enTrans) continue;
        
        // Calculate name similarity scores
        let nameScore = 0;
        if (frTrans && frTrans.nom) {
          const frScore = calculateSimilarity(titleFr, frTrans.nom);
          nameScore = Math.max(nameScore, frScore);
        }
        if (enTrans && enTrans.nom) {
          const enScore = calculateSimilarity(titleEn, enTrans.nom);
          nameScore = Math.max(nameScore, enScore);
        }
        
        // Boost score if key medical terms match
        const dbTermsFr = frTrans ? extractKeyTerms(frTrans.nom) : { terms: [], measurements: [], angles: [] };
        const dbTermsEn = enTrans ? extractKeyTerms(enTrans.nom) : { terms: [], measurements: [], angles: [] };
        
        const commonTerms = [
          ...csvTermsEn.terms.filter(t => dbTermsEn.terms.includes(t) || dbTermsFr.terms.includes(t)),
          ...csvTermsFr.terms.filter(t => dbTermsEn.terms.includes(t) || dbTermsFr.terms.includes(t))
        ];
        
        if (commonTerms.length > 0) {
          nameScore += commonTerms.length * 10; // Boost for each matching medical term
        }
        
        // Check for matching measurements
        const csvMeasurements = [...csvTermsEn.measurements, ...csvTermsFr.measurements];
        const dbMeasurements = [...dbTermsEn.measurements, ...dbTermsFr.measurements];
        const commonMeasurements = csvMeasurements.filter(m => dbMeasurements.includes(m));
        
        if (commonMeasurements.length > 0) {
          nameScore += commonMeasurements.length * 15; // Higher boost for matching measurements
        }
        
        if (nameScore > bestScore) {
          bestScore = nameScore;
          bestMatch = dbProduct;
        }
      }
      
      // If we found a good match (score > 60), update it
      if (bestMatch && bestScore > 60) {
        console.log(`   🎯 Best match: ${bestMatch.reference_fournisseur} (score: ${bestScore.toFixed(1)})`);
        
        matches.push({
          csvProduct: { brand, sku, titleEn, titleFr },
          dbProduct: bestMatch,
          score: bestScore
        });
        
        // Update the product with professional translations
        const frTrans = bestMatch.product_translations.find(t => t.language_code === 'fr');
        const enTrans = bestMatch.product_translations.find(t => t.language_code === 'en');
        
        try {
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
                product_id: bestMatch.id,
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
                product_id: bestMatch.id,
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
        
        matchedCount++;
      } else if (bestMatch) {
        console.log(`   ⚠️  Best match score too low: ${bestMatch.reference_fournisseur} (${bestScore.toFixed(1)})`);
      } else {
        console.log(`   ❌ No match found`);
      }
    }
    
    console.log('\n📊 SMART MATCHING RESULTS');
    console.log('========================');
    console.log(`Total FCI products in CSV: ${lines.filter(l => l.includes('FCI')).length - 1}`);
    console.log(`Successfully matched: ${matchedCount}`);
    console.log(`Successfully updated: ${updatedCount}`);
    
    if (matches.length > 0) {
      console.log('\n🎯 TOP MATCHES:');
      matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .forEach((match, i) => {
          console.log(`${i + 1}. Score ${match.score.toFixed(1)}: ${match.dbProduct.reference_fournisseur}`);
          console.log(`   CSV: ${match.csvProduct.titleEn}`);
          const dbTrans = match.dbProduct.product_translations.find(t => t.language_code === 'en');
          console.log(`   DB:  ${dbTrans ? dbTrans.nom : 'No English name'}`);
        });
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

smartMatchFCIProducts();