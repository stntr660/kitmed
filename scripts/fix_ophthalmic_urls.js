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

  let updated = 0;

  for (const record of records) {
    const reference = record['References']?.trim();
    const imageUrl = record['Image URL 1']?.trim();
    const brochureUrl = record['Brochure']?.trim();

    if (!reference) continue;

    // Find product by reference
    const product = await prisma.products.findFirst({
      where: { reference_fournisseur: reference },
      select: { id: true, reference_fournisseur: true }
    });

    if (!product) {
      console.log(`Not found: ${reference}`);
      continue;
    }

    // Update media URL to external URL
    if (imageUrl && imageUrl.startsWith('http')) {
      await prisma.product_media.updateMany({
        where: { product_id: product.id },
        data: { url: imageUrl }
      });
    }

    // Update PDF brochure URL to external URL
    if (brochureUrl && brochureUrl.startsWith('http')) {
      await prisma.products.update({
        where: { id: product.id },
        data: { pdf_brochure_url: brochureUrl }
      });
    }

    console.log(`Updated: ${reference}`);
    if (imageUrl) console.log(`  Image: ${imageUrl.substring(0, 60)}...`);
    if (brochureUrl) console.log(`  PDF: ${brochureUrl.substring(0, 60)}...`);
    updated++;
  }

  console.log(`\nUpdated ${updated} products with external URLs`);

  await prisma.$disconnect();
}

fixUrls().catch(console.error);
