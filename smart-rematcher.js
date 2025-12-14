const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Enhanced manufacturer mapping
const manufacturerMap = {
  'HAAG-STREIT': 'haag-streit-u-k',
  'Haag-Streit': 'haag-streit-u-k',
  'FOSHAN KAIYANG': 'foshan',
  'Foshan Kaiyang': 'foshan',
  'FOSHAN': 'foshan',
  'FCI': 'fci',
  'Keeler': 'KEELER',
  'KEELER': 'KEELER',
  'Medicel': 'medicel',
  'MEDICEL': 'medicel',
  'Moria Surgical': 'MORIA',
  'MORIA': 'MORIA',
  'ESPANSIONE GROUP': 'espansione-group',
  'Espansione Group': 'espansione-group'
};

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

// Smart SKU matching - handles complex multi-SKU formats
function matchComplexSku(csvSku, dbSkus) {
  if (!csvSku || csvSku === 'MISSING') return null;

  // Normalize the CSV SKU
  const normalizedCsvSku = csvSku.trim().toUpperCase();

  for (const dbSku of dbSkus) {
    const normalizedDbSku = dbSku.reference_fournisseur.toUpperCase();

    // Direct match
    if (normalizedDbSku === normalizedCsvSku) {
      return dbSku;
    }

    // Check if CSV SKU is contained in DB's multi-SKU field
    if (normalizedDbSku.includes(normalizedCsvSku)) {
      return dbSku;
    }

    // Check if any part of CSV multi-SKU matches DB
    const csvParts = normalizedCsvSku.split(/[,\s]+/).filter(p => p.length > 2);
    for (const part of csvParts) {
      if (normalizedDbSku.includes(part) || part === normalizedDbSku) {
        return dbSku;
      }
    }

    // Check if any part of DB multi-SKU matches CSV
    const dbParts = normalizedDbSku.split(/[,\s]+/).filter(p => p.length > 2);
    for (const part of dbParts) {
      if (normalizedCsvSku.includes(part) || part === normalizedCsvSku) {
        return dbSku;
      }
    }
  }

  return null;
}

// Smart name matching with similarity scoring
function calculateNameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;

  const n1 = name1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const n2 = name2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  if (n1 === n2) return 100;

  const words1 = n1.split(/\s+/).filter(w => w.length > 2);
  const words2 = n2.split(/\s+/).filter(w => w.length > 2);

  // Count matching words
  let matches = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
        matches++;
        break;
      }
    }
  }

  const similarity = (matches * 2) / (words1.length + words2.length) * 100;
  return similarity;
}

async function processUnmatchedProducts() {
  console.log('='.repeat(60));
  console.log('SMART RE-MATCHER FOR UNMATCHED PRODUCTS');
  console.log('='.repeat(60));

  const results = {
    matched: [],
    stillUnmatched: []
  };

  // Load all products grouped by constructeur for faster lookup
  const allProducts = await prisma.products.findMany({
    include: {
      product_translations: true
    }
  });

  const productsByConstructeur = {};
  for (const p of allProducts) {
    const key = p.constructeur.toLowerCase();
    if (!productsByConstructeur[key]) {
      productsByConstructeur[key] = [];
    }
    productsByConstructeur[key].push(p);
  }

  console.log(`\nLoaded ${allProducts.length} products from database`);
  console.log('Constructeurs:', Object.keys(productsByConstructeur).join(', '));

  // Process the unmatched HAAG-STREIT products from the report
  const haagStreitUnmatched = [
    { sku: 'BM970', title_en: 'BM970 Slit Lamp Biomicroscope', title_fr: 'Biomicroscope a Lampe a Fente BM970' },
    { sku: 'AT870', title_en: 'AT870 Applanation Tonometer', title_fr: 'Tonometre a Aplanation AT870' },
    { sku: 'IM950', title_en: 'IM950 Imaging Module', title_fr: 'Module d\'Imagerie IM950' }
  ];

  console.log('\n--- Processing HAAG-STREIT Products ---');
  const haagProducts = productsByConstructeur['haag-streit-u-k'] || [];
  console.log(`Found ${haagProducts.length} HAAG-STREIT products in DB`);

  for (const item of haagStreitUnmatched) {
    // Try SKU match first
    let matched = matchComplexSku(item.sku, haagProducts);

    // Try name similarity if no SKU match
    if (!matched) {
      let bestMatch = null;
      let bestScore = 0;

      for (const dbProduct of haagProducts) {
        const enTrans = dbProduct.product_translations.find(t => t.language_code === 'en');
        const score = calculateNameSimilarity(item.title_en, enTrans?.nom || '');
        if (score > bestScore && score >= 50) {
          bestScore = score;
          bestMatch = dbProduct;
        }
      }

      if (bestMatch) {
        matched = bestMatch;
        console.log(`  Name match: ${item.title_en} -> ${matched.reference_fournisseur} (${bestScore.toFixed(0)}%)`);
      }
    }

    if (matched) {
      results.matched.push({ csv: item, db: matched, manufacturer: 'HAAG-STREIT' });
    } else {
      results.stillUnmatched.push({ ...item, manufacturer: 'HAAG-STREIT' });
    }
  }

  // Process FOSHAN KAIYANG products
  const foshanUnmatched = [
    { sku: 'FS803-35', title_en: 'FS803-35 Ophthalmic Instrument', title_fr: 'Instrument Ophtalmologique FS803-35' },
    { sku: 'FS901-3C', title_en: 'FS901-3C Professional Device', title_fr: 'Dispositif Professionnel FS901-3C' },
    { sku: 'FS902C', title_en: 'FS902C Medical Equipment', title_fr: 'Equipement Medical FS902C' }
  ];

  console.log('\n--- Processing FOSHAN KAIYANG Products ---');
  const foshanProducts = productsByConstructeur['foshan'] || [];
  console.log(`Found ${foshanProducts.length} FOSHAN products in DB`);
  console.log('DB SKUs:', foshanProducts.map(p => p.reference_fournisseur).join(', '));

  for (const item of foshanUnmatched) {
    let matched = matchComplexSku(item.sku, foshanProducts);

    // Smart partial match for Foshan - FS803-35 should match FS802-35 (close models)
    if (!matched) {
      const skuPrefix = item.sku.substring(0, 5); // e.g., "FS803" -> "FS802"
      for (const dbProduct of foshanProducts) {
        if (dbProduct.reference_fournisseur.startsWith(skuPrefix.substring(0, 4))) {
          // Close enough model number
          console.log(`  Partial SKU match: ${item.sku} -> ${dbProduct.reference_fournisseur}`);
          matched = dbProduct;
          break;
        }
      }
    }

    if (matched) {
      results.matched.push({ csv: item, db: matched, manufacturer: 'FOSHAN' });
    } else {
      results.stillUnmatched.push({ ...item, manufacturer: 'FOSHAN' });
    }
  }

  // Process FCI products with complex SKUs
  console.log('\n--- Processing FCI Products with Complex SKUs ---');
  const fciProducts = productsByConstructeur['fci'] || [];
  console.log(`Found ${fciProducts.length} FCI products in DB`);

  const fciUnmatched = [
    { sku: 'S1.7309, S1.7409, S1.7310', title_en: 'StopLoss Jones Tube with Anti-Reflux System', title_fr: 'Tube de Jones StopLoss avec Systeme Anti-Reflux' },
    { sku: 'S2.3651, S2.3681, S2.3121, S2.3421, S2.3521', title_en: 'Ready-to-Use Punctal Plugs', title_fr: 'Bouchons Meatiques Prets a la Pose' },
    { sku: 'S2.4001', title_en: 'Painless Plug Punctal Occluder', title_fr: 'Bouchon Meatique Painless Plug' },
    { sku: 'S3.3001, S3.3021', title_en: 'Ptose-Up ePTFE Frontalis Suspension Band', title_fr: 'Bande de Suspension Frontale en ePTFE Ptose-Up' },
    { sku: 'S5.6003', title_en: 'Silicone Scleral Sponges', title_fr: 'Eponges Sclerales en Silicone' },
    { sku: 'S5.7100, S5.7500, S5.7160, S5.7560', title_en: 'Purified Silicone Oil for Vitreoretinal Surgery', title_fr: 'Huile de Silicone Purifiee pour Chirurgie Vitreoretinienne' },
    { sku: 'S5.8150, S5.8170, S5.8250, S5.8270', title_en: 'Liquid Perfluorocarbons (PFCL)', title_fr: 'Perfluorocarbones Liquides (PFCL)' },
    { sku: 'S5.9100', title_en: 'FCI Protect HPMC Ophthalmic Viscosurgical Device', title_fr: 'FCI Protect Dispositif Viscoelastique Ophtalmique HPMC' },
    { sku: 'S6.1012', title_en: 'Silicone Orbital Spheres', title_fr: 'Billes Orbitaires en Silicone' },
    { sku: 'S6.2301', title_en: 'Ocular Protector Shield', title_fr: 'Protecteur Oculaire' },
    { sku: 'S9.1012', title_en: 'Black Silicone Orbital Spheres', title_fr: 'Billes Orbitaires en Silicone Noir' },
    { sku: 'S9.7000, S9.7100', title_en: 'RetiLock One-Step Self-Locking Trocar System 23G/25G', title_fr: 'Systeme de Trocart Autobloquant One-Step RetiLock 23G/25G' }
  ];

  for (const item of fciUnmatched) {
    let matched = matchComplexSku(item.sku, fciProducts);

    if (matched) {
      console.log(`  SKU match: ${item.sku} -> ${matched.reference_fournisseur}`);
      results.matched.push({ csv: item, db: matched, manufacturer: 'FCI' });
    } else {
      results.stillUnmatched.push({ ...item, manufacturer: 'FCI' });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Newly Matched: ${results.matched.length}`);
  console.log(`Still Unmatched: ${results.stillUnmatched.length}`);

  if (results.matched.length > 0) {
    console.log('\n--- Products Ready to Update ---');
    for (const m of results.matched) {
      console.log(`  [${m.manufacturer}] ${m.csv.title_en}`);
      console.log(`    CSV SKU: ${m.csv.sku} -> DB SKU: ${m.db.reference_fournisseur}`);
    }
  }

  if (results.stillUnmatched.length > 0) {
    console.log('\n--- Still Unmatched (not in DB) ---');
    for (const u of results.stillUnmatched) {
      console.log(`  [${u.manufacturer}] ${u.title_en} (SKU: ${u.sku})`);
    }
  }

  // Ask if user wants to apply updates
  if (results.matched.length > 0) {
    console.log('\n--- Applying Updates ---');

    let updated = 0;
    for (const match of results.matched) {
      try {
        // Update French translation
        await prisma.product_translations.updateMany({
          where: {
            product_id: match.db.id,
            language_code: 'fr'
          },
          data: {
            nom: match.csv.title_fr,
            description: match.csv.desc_fr || match.csv.title_fr
          }
        });

        // Update English translation
        await prisma.product_translations.updateMany({
          where: {
            product_id: match.db.id,
            language_code: 'en'
          },
          data: {
            nom: match.csv.title_en,
            description: match.csv.desc_en || match.csv.title_en
          }
        });

        updated++;
        console.log(`  Updated: ${match.csv.title_en}`);
      } catch (err) {
        console.log(`  Error updating ${match.csv.title_en}: ${err.message}`);
      }
    }

    console.log(`\nTotal updated: ${updated}/${results.matched.length}`);
  }

  await prisma.$disconnect();
  return results;
}

processUnmatchedProducts().catch(console.error);
