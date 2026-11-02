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

async function updateTranslations() {
  const csvPath = '/Users/mac/Downloads/PRIM_Orthopaedic_Products_EN.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(csvContent);

  console.log(`Found ${records.length} PRIM products to update\n`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const reference = record['reference']?.trim();
      const nameFr = record['name']?.trim();
      const nameEn = record['name_en']?.trim();
      const descriptionEn = record['description_en']?.trim();
      const descriptionFr = record['description_fr']?.trim();

      if (!reference) continue;

      // Find product by reference
      const product = await prisma.products.findFirst({
        where: { reference_fournisseur: reference },
        select: { id: true }
      });

      if (!product) {
        console.log(`Not found: ${reference}`);
        notFound++;
        continue;
      }

      // Update English translation
      await prisma.product_translations.updateMany({
        where: {
          product_id: product.id,
          language_code: 'en'
        },
        data: {
          nom: nameEn || nameFr,
          description: descriptionEn || null
        }
      });

      // Update French translation
      await prisma.product_translations.updateMany({
        where: {
          product_id: product.id,
          language_code: 'fr'
        },
        data: {
          nom: nameFr,
          description: descriptionFr || null
        }
      });

      console.log(`Updated: ${reference}`);
      console.log(`  EN: ${nameEn}`);
      console.log(`  FR: ${nameFr}`);
      updated++;

    } catch (error) {
      console.error(`Error updating ${record['reference']}:`, error.message);
      errors++;
    }
  }

  console.log(`\n=== Update Summary ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Errors: ${errors}`);

  await prisma.$disconnect();
}

updateTranslations().catch(console.error);
