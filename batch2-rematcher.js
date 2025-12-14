const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

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

// Smart name matching
function calculateNameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;

  const n1 = name1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const n2 = name2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  if (n1 === n2) return 100;
  if (n1.includes(n2) || n2.includes(n1)) return 85;

  const words1 = n1.split(/\s+/).filter(w => w.length > 2);
  const words2 = n2.split(/\s+/).filter(w => w.length > 2);

  let matches = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || (w1.length > 4 && (w1.includes(w2) || w2.includes(w1)))) {
        matches++;
        break;
      }
    }
  }

  return (matches * 2) / (words1.length + words2.length) * 100;
}

// Extract key identifying terms
function extractKeyTerms(text) {
  const terms = [];
  const lower = text.toLowerCase();

  // Extract model numbers and magnification
  const models = text.match(/\d+(?:\.\d+)?x/gi) || [];
  const codes = text.match(/[A-Z]{2,}\d+/gi) || [];

  // Key product types
  const types = ['ophthalmoscope', 'retinoscope', 'otoscope', 'loupes', 'tonometer',
                 'slit lamp', 'case', 'head', 'set', 'prism', 'tip', 'cover'];

  for (const type of types) {
    if (lower.includes(type)) terms.push(type);
  }

  // Key qualifiers
  const qualifiers = ['specialist', 'professional', 'standard', 'practitioner',
                      'mini', 'prismatic', 'high resolution', 'hi-res', 'digital'];

  for (const q of qualifiers) {
    if (lower.includes(q)) terms.push(q);
  }

  return { terms, models, codes };
}

async function processBatch2() {
  console.log('='.repeat(60));
  console.log('BATCH 2 SMART RE-MATCHER');
  console.log('='.repeat(60));

  // Read CSV
  const csvContent = fs.readFileSync('batch2-unmatched.csv', 'utf-8');
  const lines = csvContent.split('\n').filter(l => l.trim());
  const header = parseCSVLine(lines[0]);

  const csvProducts = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= 6) {
      csvProducts.push({
        brand: values[0],
        sku: values[1],
        title_en: values[2],
        title_fr: values[3],
        desc_en: values[4],
        desc_fr: values[5]
      });
    }
  }

  console.log(`Loaded ${csvProducts.length} unmatched products from CSV`);

  // Load DB products
  const allProducts = await prisma.products.findMany({
    include: { product_translations: true }
  });

  const productsByConstructeur = {};
  for (const p of allProducts) {
    const key = p.constructeur.toUpperCase();
    if (!productsByConstructeur[key]) productsByConstructeur[key] = [];
    productsByConstructeur[key].push(p);
  }

  const results = { matched: [], unmatched: [] };

  // Process each CSV product
  for (const csvProd of csvProducts) {
    const brand = csvProd.brand.toUpperCase();
    let dbProducts = productsByConstructeur[brand] || [];

    // Also check lowercase variant
    if (dbProducts.length === 0) {
      dbProducts = productsByConstructeur[csvProd.brand.toLowerCase()] || [];
    }

    if (dbProducts.length === 0) {
      console.log(`  [${csvProd.brand}] No products in DB for this brand`);
      results.unmatched.push({ ...csvProd, reason: 'Brand not in DB' });
      continue;
    }

    let bestMatch = null;
    let bestScore = 0;
    let matchType = '';

    // 1. Try exact SKU match
    for (const dbProd of dbProducts) {
      if (dbProd.reference_fournisseur === csvProd.sku) {
        bestMatch = dbProd;
        bestScore = 100;
        matchType = 'exact SKU';
        break;
      }
    }

    // 2. Try partial SKU match
    if (!bestMatch) {
      for (const dbProd of dbProducts) {
        const dbSku = dbProd.reference_fournisseur.toUpperCase();
        const csvSku = csvProd.sku.toUpperCase();

        if (dbSku.includes(csvSku) || csvSku.includes(dbSku)) {
          bestMatch = dbProd;
          bestScore = 90;
          matchType = 'partial SKU';
          break;
        }
      }
    }

    // 3. Try name similarity matching
    if (!bestMatch) {
      const csvTerms = extractKeyTerms(csvProd.title_en);

      for (const dbProd of dbProducts) {
        const enTrans = dbProd.product_translations.find(t => t.language_code === 'en');
        if (!enTrans) continue;

        const dbName = enTrans.nom || '';
        const score = calculateNameSimilarity(csvProd.title_en, dbName);

        // Boost score if key terms match
        const dbTerms = extractKeyTerms(dbName);
        let termBonus = 0;

        for (const term of csvTerms.terms) {
          if (dbTerms.terms.includes(term)) termBonus += 5;
        }

        // Check magnification match for loupes
        for (const mag of csvTerms.models) {
          if (dbName.toLowerCase().includes(mag.toLowerCase())) termBonus += 20;
        }

        const totalScore = score + termBonus;

        if (totalScore > bestScore && totalScore >= 55) {
          bestScore = totalScore;
          bestMatch = dbProd;
          matchType = 'name similarity';
        }
      }
    }

    if (bestMatch) {
      const enTrans = bestMatch.product_translations.find(t => t.language_code === 'en');
      console.log(`  [${csvProd.brand}] MATCHED (${matchType}, ${bestScore.toFixed(0)}%)`);
      console.log(`    CSV: ${csvProd.title_en}`);
      console.log(`    DB:  ${enTrans?.nom || 'N/A'} (SKU: ${bestMatch.reference_fournisseur})`);
      results.matched.push({ csv: csvProd, db: bestMatch, score: bestScore, matchType });
    } else {
      console.log(`  [${csvProd.brand}] NOT MATCHED: ${csvProd.title_en}`);
      results.unmatched.push({ ...csvProd, reason: 'No match found' });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Matched: ${results.matched.length}`);
  console.log(`Unmatched: ${results.unmatched.length}`);

  // Group unmatched by reason
  const byReason = {};
  for (const u of results.unmatched) {
    const reason = u.reason || 'Unknown';
    if (!byReason[reason]) byReason[reason] = [];
    byReason[reason].push(u);
  }

  console.log('\nUnmatched breakdown:');
  for (const [reason, items] of Object.entries(byReason)) {
    console.log(`  ${reason}: ${items.length}`);
    for (const item of items.slice(0, 3)) {
      console.log(`    - ${item.title_en}`);
    }
    if (items.length > 3) console.log(`    ... and ${items.length - 3} more`);
  }

  // Apply updates
  if (results.matched.length > 0) {
    console.log('\n--- Applying Updates ---');
    let updated = 0;

    for (const match of results.matched) {
      try {
        // Update French
        await prisma.product_translations.updateMany({
          where: { product_id: match.db.id, language_code: 'fr' },
          data: { nom: match.csv.title_fr, description: match.csv.desc_fr }
        });

        // Update English
        await prisma.product_translations.updateMany({
          where: { product_id: match.db.id, language_code: 'en' },
          data: { nom: match.csv.title_en, description: match.csv.desc_en }
        });

        updated++;
      } catch (err) {
        console.log(`  Error: ${match.csv.title_en} - ${err.message}`);
      }
    }

    console.log(`Updated: ${updated}/${results.matched.length}`);
  }

  await prisma.$disconnect();
  return results;
}

processBatch2().catch(console.error);
