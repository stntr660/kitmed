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
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 70);
  const refSlug = reference.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
  return `${base}-${refSlug}`;
}

function generateId() {
  return `omni-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function importProducts() {
  const csvPath = '/Users/mac/Downloads/Omnilens_Products_Catalog.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(csvContent);

  console.log(`Found ${records.length} Omnilens products to import\n`);

  const partnerId = 'cd6d3a8e-65df-4b45-b58e-b5312cc20c9c'; // OMNI
  const categoryId = 'ophthalmology';

  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      const reference = record['reference']?.trim();
      const nameFr = record['name_fr']?.trim();
      const nameEn = record['name_en']?.trim();
      const descriptionFr = record['description_fr']?.trim();
      const descriptionEn = record['description_en']?.trim();

      if (!reference || !nameFr) {
        skipped++;
        continue;
      }

      const slug = generateSlug(nameEn || nameFr, reference);

      // Check if exists
      const existing = await prisma.products.findFirst({
        where: { OR: [{ reference_fournisseur: reference }, { slug: slug }] }
      });

      if (existing) {
        console.log(`Skipping: "${reference}" exists`);
        skipped++;
        continue;
      }

      const productId = generateId();

      await prisma.products.create({
        data: {
          id: productId,
          reference_fournisseur: reference,
          category_id: categoryId,
          constructeur: 'omni',
          slug: slug,
          status: 'active',
          is_featured: false,
          sort_order: 0,
          partner_id: partnerId,
          updated_at: new Date(),
        }
      });

      await prisma.product_translations.createMany({
        data: [
          { id: `${productId}-en`, product_id: productId, language_code: 'en', nom: nameEn || nameFr, description: descriptionEn },
          { id: `${productId}-fr`, product_id: productId, language_code: 'fr', nom: nameFr, description: descriptionFr }
        ]
      });

      console.log(`Imported: ${reference}`);
      console.log(`  EN: ${nameEn}`);
      console.log(`  FR: ${nameFr}`);
      imported++;
    } catch (error) {
      console.error(`Error:`, error.message);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);

  await prisma.$disconnect();
}

importProducts().catch(console.error);
