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

function generateSlug(name, reference) {
  const base = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 70);
  const refSlug = reference.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
  return `${base}-${refSlug}`;
}

function generateId() {
  return `led-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function importProducts() {
  const csvPath = '/Users/mac/Downloads/LED_SURTRON_Products.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(csvContent);

  console.log(`Found ${records.length} LED SURTRON products to import\n`);

  const partnerId = 'a041ffcf-3c82-4787-ba1d-d49a520c6e34'; // LED
  const categoryId = 'ophthalmology'; // Default category

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const reference = record['reference']?.trim();
      const productName = record['name']?.trim();
      const descriptionEn = record['description_en']?.trim();
      const descriptionFr = record['description_fr']?.trim();

      if (!reference || !productName) {
        console.log(`Skipping: Missing reference or name`);
        skipped++;
        continue;
      }

      const slug = generateSlug(productName, reference);

      // Check if product already exists
      const existing = await prisma.products.findFirst({
        where: {
          OR: [
            { reference_fournisseur: reference },
            { slug: slug }
          ]
        }
      });

      if (existing) {
        console.log(`Skipping: "${productName}" already exists`);
        skipped++;
        continue;
      }

      const productId = generateId();

      // Create product
      await prisma.products.create({
        data: {
          id: productId,
          reference_fournisseur: reference,
          category_id: categoryId,
          constructeur: 'led',
          slug: slug,
          status: 'active',
          is_featured: false,
          sort_order: 0,
          partner_id: partnerId,
          updated_at: new Date(),
        }
      });

      // Create translations
      await prisma.product_translations.createMany({
        data: [
          {
            id: `${productId}-en`,
            product_id: productId,
            language_code: 'en',
            nom: productName,
            description: descriptionEn || null,
          },
          {
            id: `${productId}-fr`,
            product_id: productId,
            language_code: 'fr',
            nom: productName,
            description: descriptionFr || descriptionEn || null,
          }
        ]
      });

      console.log(`Imported: "${productName}" (${reference})`);
      imported++;

    } catch (error) {
      console.error(`Error importing:`, error.message);
      errors++;
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);

  const count = await prisma.products.count({ where: { partner_id: partnerId } });
  console.log(`\nTotal LED products in database: ${count}`);

  await prisma.$disconnect();
}

importProducts().catch(console.error);
