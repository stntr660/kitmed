const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Parse CSV
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    // Handle CSV with quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => row[h] = values[idx] || '');
    products.push(row);
  }

  return products;
}

async function updateNidek() {
  console.log('=== UPDATING NIDEK PRODUCTS ===\n');

  // Read CSV
  const csvPath = '/Users/mac/Downloads/nidek_products.csv';
  const content = fs.readFileSync(csvPath, 'utf-8');
  const csvProducts = parseCSV(content);

  console.log('CSV products:', csvProducts.length);

  // Get existing Nidek products
  const existing = await prisma.products.findMany({
    where: { constructeur: 'nidek-japon' },
    include: { product_translations: true }
  });

  console.log('DB products:', existing.length);

  // First, update all constructeur from nidek-japon to nidek
  const updateConstructeur = await prisma.products.updateMany({
    where: { constructeur: 'nidek-japon' },
    data: { constructeur: 'nidek' }
  });
  console.log('Updated constructeur to "nidek":', updateConstructeur.count, 'products\n');

  let updated = 0;
  let notFound = [];

  for (const csv of csvProducts) {
    const ref = csv.Reference;
    const product = existing.find(p => p.reference_fournisseur === ref);

    if (!product) {
      notFound.push(ref);
      continue;
    }

    // Update French translation
    const frTrans = product.product_translations.find(t => t.language_code === 'fr');
    if (frTrans) {
      await prisma.product_translations.update({
        where: { id: frTrans.id },
        data: {
          nom: csv.Product_Name,
          description: csv.Description_FR
        }
      });
    }

    // Update English translation
    const enTrans = product.product_translations.find(t => t.language_code === 'en');
    if (enTrans) {
      await prisma.product_translations.update({
        where: { id: enTrans.id },
        data: {
          nom: csv.Product_Name,
          description: csv.Description_EN
        }
      });
    }

    console.log('Updated:', ref, '-', csv.Product_Name);
    updated++;
  }

  console.log('\n=== COMPLETE ===');
  console.log('Updated translations:', updated, 'products');
  console.log('Constructeur changed: nidek-japon -> nidek');

  if (notFound.length > 0) {
    console.log('Not found in DB:', notFound.join(', '));
  }

  await prisma.$disconnect();
}

updateNidek().catch(console.error);
