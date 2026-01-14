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

// Proper CSV parser that handles multiline quoted fields
function parseCSV(content) {
  const records = [];
  let headers = [];
  let currentRecord = [];
  let currentField = '';
  let inQuotes = false;
  let isFirstRow = true;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRecord.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (char === '\r') i++; // Skip \n in \r\n
      currentRecord.push(currentField.trim());
      currentField = '';

      if (isFirstRow) {
        headers = currentRecord;
        isFirstRow = false;
      } else if (currentRecord.some(f => f !== '')) {
        const record = {};
        headers.forEach((h, idx) => {
          record[h] = currentRecord[idx] || '';
        });
        records.push(record);
      }
      currentRecord = [];
    } else {
      currentField += char;
    }
  }

  // Handle last record
  if (currentField || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    if (currentRecord.some(f => f !== '')) {
      const record = {};
      headers.forEach((h, idx) => {
        record[h] = currentRecord[idx] || '';
      });
      records.push(record);
    }
  }

  return records;
}

// Download image function
async function downloadImage(url, filepath) {
  return new Promise((resolve) => {
    if (!url || url.trim() === '' || !url.startsWith('http')) {
      resolve(null);
      return;
    }

    const protocol = url.startsWith('https') ? https : http;

    try {
      const file = fs.createWriteStream(filepath);
      const request = protocol.get(url, { timeout: 15000 }, (response) => {
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
      });

      request.on('error', () => {
        file.close();
        try { fs.unlinkSync(filepath); } catch(e) {}
        resolve(null);
      });

      request.on('timeout', () => {
        request.destroy();
        file.close();
        try { fs.unlinkSync(filepath); } catch(e) {}
        resolve(null);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

// Generate slug from product name
function generateSlug(name, reference) {
  const base = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 70);
  const refSlug = reference.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
  return `${base}-${refSlug}`;
}

// Generate unique ID
function generateId() {
  return `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate reference from product name if missing
function generateReference(brand, productName) {
  const brandPrefix = brand.substring(0, 3).toUpperCase();
  const nameHash = productName.split(' ')
    .map(w => w.charAt(0).toUpperCase())
    .join('')
    .substring(0, 6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${brandPrefix}-${nameHash}-${random}`;
}

// Clean description - remove extra whitespace and newlines
function cleanDescription(desc) {
  if (!desc) return '';
  return desc
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, '\n')
    .trim();
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

  console.log(`Found ${records.length} products to parse`);

  // Filter valid products (must have Brand and Product Name)
  const validProducts = records.filter(r => {
    const brand = r['Brand']?.trim();
    const name = r['Product Name']?.trim();
    return brand && name && brandToPartnerId[brand];
  });

  console.log(`Valid products to import: ${validProducts.length}`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of validProducts) {
    try {
      const brand = record['Brand'].trim();
      const productName = record['Product Name'].trim();
      let reference = record['References']?.trim() || '';
      const descEn = cleanDescription(record['Description English'] || '');
      const descFr = cleanDescription(record['Description French'] || '');
      const imageUrl = record['Image URL 1']?.trim() || '';

      // Generate reference if missing
      if (!reference) {
        reference = generateReference(brand, productName);
        console.log(`Generated reference for "${productName}": ${reference}`);
      }

      const partnerId = brandToPartnerId[brand];

      // Check if product already exists
      const existing = await prisma.products.findFirst({
        where: {
          OR: [
            { reference_fournisseur: reference },
            { slug: generateSlug(productName, reference) }
          ]
        }
      });

      if (existing) {
        console.log(`Skipping: "${productName}" already exists`);
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
          let ext = path.extname(urlObj.pathname) || '.jpg';
          if (ext.length > 5) ext = '.jpg';
          const imageName = `${slug.substring(0, 50)}${ext}`;
          const fullPath = path.join(imageDir, imageName);

          console.log(`Downloading image for "${productName}"...`);
          const downloaded = await downloadImage(imageUrl, fullPath);
          if (downloaded) {
            localImagePath = `/products/${imageName}`;
            console.log(`  Image saved: ${localImagePath}`);
          } else {
            console.log(`  Image download failed`);
          }
        } catch (e) {
          console.log(`  Invalid image URL`);
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

      console.log(`Imported: "${productName}" (${reference})`);
      imported++;

    } catch (error) {
      console.error(`Error importing:`, error.message);
      errors++;
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Errors: ${errors}`);

  // Show final counts by brand
  const counts = await prisma.products.groupBy({
    by: ['constructeur'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  console.log(`\n=== Products by Brand ===`);
  counts.forEach(c => console.log(`${c.constructeur}: ${c._count.id}`));

  await prisma.$disconnect();
}

importProducts().catch(console.error);
