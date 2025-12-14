const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findDuplicates() {
  console.log('='.repeat(60));
  console.log('DUPLICATE PRODUCTS ANALYSIS');
  console.log('='.repeat(60));

  // Get all products with translations
  const allProducts = await prisma.products.findMany({
    include: { product_translations: true }
  });

  console.log('Total products in DB: ' + allProducts.length);

  // 1. Find duplicate SKUs
  const skuMap = {};
  for (const p of allProducts) {
    const sku = p.reference_fournisseur.trim();
    if (!skuMap[sku]) skuMap[sku] = [];
    skuMap[sku].push(p);
  }

  const duplicateSkus = Object.entries(skuMap).filter(([sku, products]) => products.length > 1);

  console.log('\n--- DUPLICATE SKUs ---');
  console.log('Found ' + duplicateSkus.length + ' SKUs with duplicates');

  for (const [sku, products] of duplicateSkus) {
    console.log('\nSKU: "' + sku + '" (' + products.length + ' products)');
    for (const p of products) {
      const enTrans = p.product_translations.find(t => t.language_code === 'en');
      console.log('  - ID: ' + p.id.substring(0, 8) + '... | ' + p.constructeur + ' | ' + (enTrans?.nom || 'NO NAME').substring(0, 40));
    }
  }

  // 2. Find products with identical content (same name in same language)
  const contentMap = {};
  for (const p of allProducts) {
    const enTrans = p.product_translations.find(t => t.language_code === 'en');
    const frTrans = p.product_translations.find(t => t.language_code === 'fr');

    // Create content key from name + constructeur
    const key = (p.constructeur + '|' + (enTrans?.nom || '') + '|' + (frTrans?.nom || '')).toLowerCase().trim();

    if (!contentMap[key]) contentMap[key] = [];
    contentMap[key].push(p);
  }

  const duplicateContent = Object.entries(contentMap).filter(([key, products]) => products.length > 1 && key.length > 10);

  console.log('\n--- DUPLICATE CONTENT (same name + constructeur) ---');
  console.log('Found ' + duplicateContent.length + ' content duplicates');

  for (const [key, products] of duplicateContent.slice(0, 20)) {
    const parts = key.split('|');
    const constructeur = parts[0];
    const enName = parts[1] || parts[2];
    console.log('\n[' + constructeur.toUpperCase() + '] "' + (enName).substring(0, 50) + '" (' + products.length + ' dupes)');
    for (const p of products) {
      console.log('  - SKU: ' + p.reference_fournisseur + ' | ID: ' + p.id.substring(0, 8) + '...');
    }
  }

  if (duplicateContent.length > 20) {
    console.log('\n... and ' + (duplicateContent.length - 20) + ' more content duplicate groups');
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Duplicate SKUs: ' + duplicateSkus.length + ' groups (' + duplicateSkus.reduce((sum, [,p]) => sum + p.length - 1, 0) + ' extra products)');
  console.log('Duplicate Content: ' + duplicateContent.length + ' groups');

  await prisma.$disconnect();
}

findDuplicates().catch(console.error);
