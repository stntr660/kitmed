const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Brand to partner ID mapping
const brandToPartnerId = {
  'RHEON': '99f0f99c-e243-41a9-8005-5f1a9365a089',
  'COSWELL': '4e3f96da-da99-499f-a44a-32facfaa9c3e',
  'ISOMAX': 'isomax-partner-001',
  'ISOMAX ': 'isomax-partner-001',
  'ESPANSIONE MARKETING': '62d62ff4-f711-4949-9ddd-9c01ab3bc233',
  'THIS AG (SOPHI)': '3734676a-f33e-448e-ba91-2ed28f172e67',
};

// Simple CSV parser
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    const values = parseCSVLine(lines[i]);
    const record = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] || '';
    });
    records.push(record);
  }
  return records;
}

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

// Download image function
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    if (!url || url.trim() === '') {
      resolve(null);
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    protocol.get(url, { timeout: 10000 }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        resolve(null);
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      try { fs.unlinkSync(filepath); } catch(e) {}
      resolve(null);
    });
  });
}

// Generate slug from product name
function generateSlug(name, reference) {
  const base = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
  const refSlug = reference.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
  return `${base}-${refSlug}`;
}

// Generate unique ID
function generateId() {
  return `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function importProducts() {
  const csvPath = '/Users/mac/Downloads/Combined Products Jan 10 (1).csv';
  const imageDir = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/public/products';

  // Ensure image directory exists
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(csvContent);

  console.log(`Found ${records.length} products to import`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const brand = record['Brand']?.trim();
      const productName = record['Product Name']?.trim();
      const reference = record['References']?.trim();
      const descEn = record['Description English']?.trim() || '';
      const descFr = record['Description French']?.trim() || '';
      const imageUrl = record['Image URL 1']?.trim() || '';

      if (!brand || !productName || !reference) {
        console.log(`Skipping: missing required fields - ${productName || 'unnamed'}`);
        skipped++;
        continue;
      }

      const partnerId = brandToPartnerId[brand];
      if (!partnerId) {
        console.log(`Skipping: unknown brand "${brand}" for ${productName}`);
        skipped++;
        continue;
      }

      // Check if product already exists
      const existing = await prisma.products.findFirst({
        where: { reference_fournisseur: reference }
      });

      if (existing) {
        console.log(`Skipping: product with reference ${reference} already exists`);
        skipped++;
        continue;
      }

      const productId = generateId();
      const slug = generateSlug(productName, reference);

      // Download image if available
      let localImagePath = null;
      if (imageUrl && imageUrl.startsWith('http')) {
        try {
          const urlObj = new URL(imageUrl);
          const ext = path.extname(urlObj.pathname) || '.jpg';
          const imageName = `${slug.substring(0, 60)}${ext}`;
          const fullPath = path.join(imageDir, imageName);

          console.log(`Downloading image for ${productName}...`);
          const downloaded = await downloadImage(imageUrl, fullPath);
          if (downloaded) {
            localImagePath = `/products/${imageName}`;
            console.log(`  Image saved: ${localImagePath}`);
          } else {
            console.log(`  Image download failed`);
          }
        } catch (e) {
          console.log(`  Invalid image URL: ${imageUrl}`);
        }
      }

      // Create product
      await prisma.products.create({
        data: {
          id: productId,
          reference_fournisseur: reference,
          category_id: 'ophthalmology',
          constructeur: brand.toLowerCase().replace(/\s+/g, '-'),
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
            description: descEn || null,
          },
          {
            id: `${productId}-fr`,
            product_id: productId,
            language_code: 'fr',
            nom: productName,
            description: descFr || descEn || null,
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

      console.log(`Imported: ${productName} (${reference})`);
      imported++;

    } catch (error) {
      console.error(`Error importing product:`, error.message);
      errors++;
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);

  await prisma.$disconnect();
}

importProducts().catch(console.error);
