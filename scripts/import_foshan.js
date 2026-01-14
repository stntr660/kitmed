const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();

// Category mapping: CSV category -> database slug
const CATEGORY_MAP = {
  'Manual Wheelchairs': 'hospital-furniture',
  'Aluminum Wheelchairs': 'hospital-furniture',
  'Electric Wheelchairs': 'hospital-furniture',
  'Commode Wheelchairs': 'hospital-furniture',
  'Walkers': 'hospital-furniture',
  'Crutches': 'hospital-furniture',
  'Hospital Beds': 'hospital-furniture',
  'Bedside Commode': 'hospital-furniture',
};

const MANUFACTURER = 'foshan';

// Parse CSV
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

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

// Download image
async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    if (!url || url.trim() === '') {
      resolve(null);
      return;
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);

    // Skip if already exists
    if (fs.existsSync(filePath)) {
      console.log('  Image exists:', filename);
      resolve(`/uploads/products/${filename}`);
      return;
    }

    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadImage(response.headers.location, filename).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        console.log('  Image download failed:', response.statusCode, url);
        resolve(null);
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log('  Downloaded:', filename);
        resolve(`/uploads/products/${filename}`);
      });

      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {});
        console.log('  Download error:', err.message);
        resolve(null);
      });
    });

    request.on('error', (err) => {
      console.log('  Request error:', err.message);
      resolve(null);
    });

    request.on('timeout', () => {
      request.destroy();
      console.log('  Timeout:', url);
      resolve(null);
    });
  });
}

// Generate slug
function generateSlug(name, ref) {
  const base = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  return `${base}-${ref.toLowerCase()}`;
}

async function importFoshan() {
  console.log('=== IMPORTING FOSHAN PRODUCTS ===\n');

  // Read CSV
  const csvPath = '/Users/mac/Downloads/FOSHAN_Catalog_Simple.csv';
  const content = fs.readFileSync(csvPath, 'utf-8');
  const csvProducts = parseCSV(content);

  console.log('CSV products:', csvProducts.length);

  // Get category mapping
  const categories = await prisma.categories.findMany({
    where: { is_active: true }
  });

  const categoryBySlug = {};
  categories.forEach(c => categoryBySlug[c.slug] = c);

  // Get existing products by reference
  const existingProducts = await prisma.products.findMany({
    where: { reference_fournisseur: { startsWith: 'FS' } },
    include: { product_translations: true, product_media: true }
  });

  const existingByRef = {};
  existingProducts.forEach(p => existingByRef[p.reference_fournisseur] = p);

  console.log('Existing FOSHAN products:', Object.keys(existingByRef).length);
  console.log('');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const csv of csvProducts) {
    const ref = csv.reference;
    if (!ref) continue;

    console.log('Processing:', ref, '-', csv.name_en?.substring(0, 40));

    // Get category
    const categorySlug = CATEGORY_MAP[csv.category] || 'hospital-furniture';
    const category = categoryBySlug[categorySlug];

    if (!category) {
      console.log('  WARNING: Category not found:', categorySlug);
      skipped++;
      continue;
    }

    // Download image if URL exists
    let imageUrl = null;
    if (csv.image_url && csv.image_url.trim()) {
      const ext = csv.image_url.split('.').pop()?.split('?')[0] || 'jpg';
      const filename = `${ref.toLowerCase()}-primary.${ext}`;
      imageUrl = await downloadImage(csv.image_url, filename);
    }

    const existing = existingByRef[ref];

    if (existing) {
      // UPDATE existing product
      console.log('  Updating existing product...');

      // Update translations
      for (const lang of ['fr', 'en']) {
        const name = lang === 'fr' ? csv.name_fr : csv.name_en;
        const desc = csv.description_en; // Use English description for both (we can improve FR later)

        const existingTrans = existing.product_translations.find(t => t.language_code === lang);

        if (existingTrans) {
          await prisma.product_translations.update({
            where: { id: existingTrans.id },
            data: {
              nom: name || existingTrans.nom,
              description: desc || existingTrans.description
            }
          });
        } else {
          await prisma.product_translations.create({
            data: {
              id: randomUUID(),
              product_id: existing.id,
              language_code: lang,
              nom: name || ref,
              description: desc || null
            }
          });
        }
      }

      // Update image if we downloaded a new one
      if (imageUrl) {
        const existingMedia = existing.product_media.find(m => m.is_primary);
        if (existingMedia) {
          await prisma.product_media.update({
            where: { id: existingMedia.id },
            data: { url: imageUrl }
          });
        } else {
          await prisma.product_media.create({
            data: {
              id: randomUUID(),
              product_id: existing.id,
              type: 'image',
              url: imageUrl,
              is_primary: true,
              sort_order: 0
            }
          });
        }
      }

      updated++;
    } else {
      // CREATE new product
      console.log('  Creating new product...');

      const productId = randomUUID();
      const slug = generateSlug(csv.name_en || ref, ref);

      await prisma.products.create({
        data: {
          id: productId,
          reference_fournisseur: ref,
          constructeur: MANUFACTURER,
          category_id: category.id,
          status: 'active',
          is_featured: false,
          slug: slug,
          created_at: new Date(),
          updated_at: new Date(),
          product_translations: {
            create: [
              {
                id: randomUUID(),
                language_code: 'fr',
                nom: csv.name_fr || csv.name_en || ref,
                description: csv.description_en || null
              },
              {
                id: randomUUID(),
                language_code: 'en',
                nom: csv.name_en || ref,
                description: csv.description_en || null
              }
            ]
          },
          ...(imageUrl && {
            product_media: {
              create: {
                id: randomUUID(),
                type: 'image',
                url: imageUrl,
                is_primary: true,
                sort_order: 0
              }
            }
          })
        }
      });

      created++;
    }
  }

  console.log('\n=== COMPLETE ===');
  console.log('Created:', created);
  console.log('Updated:', updated);
  console.log('Skipped:', skipped);

  await prisma.$disconnect();
}

importFoshan().catch(console.error);
