const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
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

    const record = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] || '';
    });
    records.push(record);
  }

  return records;
}

async function fixUrls() {
  const csvPath = '/Users/mac/Downloads/Ophthalmic_Products_Bilingual.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(csvContent);

  console.log(`Processing ${records.length} products\n`);

  // Get all MEDIWORKS and OCULAR products
  const products = await prisma.products.findMany({
    where: { constructeur: { in: ['mediworks', 'ocular'] } },
    include: { product_media: true, product_translations: true }
  });

  console.log(`Found ${products.length} products in database\n`);

  let updated = 0;

  for (const record of records) {
    const reference = record['References']?.trim();
    const nameEn = record['Product Name EN']?.trim();
    const nameFr = record['Product Name']?.trim();
    const imageUrl = record['Image URL 1']?.trim();
    const brochureUrl = record['Brochure']?.trim();

    // Find matching product by reference OR by name
    let product = null;

    if (reference) {
      product = products.find(p => p.reference_fournisseur === reference);
    }

    if (!product && nameEn) {
      product = products.find(p => {
        const trans = p.product_translations.find(t => t.language_code === 'en');
        return trans && trans.nom === nameEn;
      });
    }

    if (!product) {
      console.log(`Not found: ${reference || nameEn}`);
      continue;
    }

    let changes = [];

    // Update media URL to external URL
    if (imageUrl && imageUrl.startsWith('http') && product.product_media.length > 0) {
      await prisma.product_media.updateMany({
        where: { product_id: product.id },
        data: { url: imageUrl }
      });
      changes.push('IMG');
    }

    // Update PDF brochure URL to external URL
    if (brochureUrl && brochureUrl.startsWith('http')) {
      await prisma.products.update({
        where: { id: product.id },
        data: { pdf_brochure_url: brochureUrl }
      });
      changes.push('PDF');
    }

    if (changes.length > 0) {
      console.log(`Updated: ${product.reference_fournisseur} [${changes.join(', ')}]`);
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} products with external URLs`);

  await prisma.$disconnect();
}

fixUrls().catch(console.error);
