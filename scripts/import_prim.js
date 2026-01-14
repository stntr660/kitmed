const fs = require('fs');
const path = require('path');
const https = require('https');
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

async function downloadImage(url, filepath) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) {
      resolve(null);
      return;
    }

    const file = fs.createWriteStream(filepath);
    https.get(url, { timeout: 15000 }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(filepath); } catch(e) {}
        downloadImage(response.headers.location, filepath).then(resolve);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(filepath); } catch(e) {}
        resolve(null);
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', () => {
      file.close();
      try { fs.unlinkSync(filepath); } catch(e) {}
      resolve(null);
    }).on('timeout', function() {
      this.destroy();
      file.close();
      try { fs.unlinkSync(filepath); } catch(e) {}
      resolve(null);
    });
  });
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
  return `prim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function importProducts() {
  const csvPath = '/Users/mac/Downloads/PRIM_Orthopaedic_Products.csv';
  const imageDir = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/public/products';

  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(csvContent);

  console.log(`Found ${records.length} PRIM products to import\n`);

  const partnerId = 'f1731aed-ede2-4bf8-aa60-e071e4fc0404'; // PRIM
  const categoryId = 'orthopedics'; // Orthopedics category

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let imagesDownloaded = 0;

  for (const record of records) {
    try {
      const reference = record['reference']?.trim();
      const productName = record['name']?.trim();
      const descriptionEn = record['description_en']?.trim();
      const descriptionFr = record['description_fr']?.trim();
      const imageUrl = record['image_url']?.trim();

      if (!reference || !productName) {
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
        console.log(`Skipping: "${reference}" already exists`);
        skipped++;
        continue;
      }

      const productId = generateId();

      // Download image if available
      let localImagePath = null;
      if (imageUrl && imageUrl.startsWith('http')) {
        try {
          const urlObj = new URL(imageUrl);
          let ext = path.extname(urlObj.pathname) || '.jpg';
          if (ext.length > 5) ext = '.jpg';
          const imageName = `prim-${reference.toLowerCase().replace(/[^a-z0-9]/g, '-')}${ext}`;
          const fullPath = path.join(imageDir, imageName);

          const downloaded = await downloadImage(imageUrl, fullPath);
          if (downloaded) {
            localImagePath = `/products/${imageName}`;
            imagesDownloaded++;
          }
        } catch (e) {
          // Skip image errors
        }
      }

      // Create product
      await prisma.products.create({
        data: {
          id: productId,
          reference_fournisseur: reference,
          category_id: categoryId,
          constructeur: 'prim',
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

      // Create media if image was downloaded
      if (localImagePath) {
        await prisma.product_media.create({
          data: {
            id: `${productId}-media-1`,
            product_id: productId,
            type: 'image',
            url: localImagePath,
            alt_text: productName,
            title: productName,
            sort_order: 0,
            is_primary: true,
          }
        });
      }

      console.log(`Imported: "${reference}" - ${productName}${localImagePath ? ' [IMG]' : ''}`);
      imported++;

    } catch (error) {
      console.error(`Error importing:`, error.message);
      errors++;
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Images downloaded: ${imagesDownloaded}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);

  const count = await prisma.products.count({ where: { partner_id: partnerId } });
  console.log(`\nTotal PRIM products in database: ${count}`);

  await prisma.$disconnect();
}

importProducts().catch(console.error);
