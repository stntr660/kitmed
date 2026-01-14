const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const brandToPartnerId = {
  'MEDIWORKS': '630166d9-269c-49d2-969a-0fda3262af99',
  'OCULAR': '316d7982-4ea8-49d6-b82a-230b1357ed7c',
};

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

async function downloadFile(url, filepath) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) {
      resolve(null);
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    const request = protocol.get(url, { timeout: 20000 }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(filepath); } catch(e) {}
        downloadFile(response.headers.location, filepath).then(resolve);
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
        const stats = fs.statSync(filepath);
        if (stats.size > 100) {
          resolve(filepath);
        } else {
          try { fs.unlinkSync(filepath); } catch(e) {}
          resolve(null);
        }
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
  });
}

function generateSlug(name, reference) {
  const base = name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 70);
  const refSlug = (reference || 'ref').toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
  return `${base}-${refSlug}`;
}

function generateId() {
  return `oph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function importProducts() {
  const csvPath = '/Users/mac/Downloads/Ophthalmic_Products_Bilingual.csv';
  const imageDir = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/public/images/products';
  const pdfDir = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/public/pdfs';

  if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(csvContent);

  console.log(`Found ${records.length} ophthalmic products to import\n`);

  const categoryId = 'ophthalmology';

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let imagesDownloaded = 0;
  let pdfsDownloaded = 0;

  for (const record of records) {
    try {
      const brand = record['Brand']?.trim();
      const nameFr = record['Product Name']?.trim();
      const nameEn = record['Product Name EN']?.trim();
      const reference = record['References']?.trim();
      const descriptionEn = record['Full Description']?.trim();
      const descriptionFr = record['Description FR']?.trim();
      const imageUrl = record['Image URL 1']?.trim();
      const brochureUrl = record['Brochure']?.trim();

      const partnerId = brandToPartnerId[brand];
      if (!partnerId || !nameFr) {
        console.log(`Skipping: Missing brand or name - ${brand}`);
        skipped++;
        continue;
      }

      // Generate reference if missing
      const productRef = reference || `${brand.substring(0,3)}-${Date.now().toString(36)}`.toUpperCase();
      const slug = generateSlug(nameEn || nameFr, productRef);

      // Check if product already exists
      const existing = await prisma.products.findFirst({
        where: {
          OR: [
            { reference_fournisseur: productRef },
            { slug: slug }
          ]
        }
      });

      if (existing) {
        console.log(`Skipping: "${productRef}" already exists`);
        skipped++;
        continue;
      }

      const productId = generateId();

      // Download image
      let localImagePath = null;
      if (imageUrl && imageUrl.startsWith('http')) {
        try {
          const urlObj = new URL(imageUrl);
          let ext = path.extname(urlObj.pathname) || '.jpg';
          if (ext.length > 5 || !ext.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ext = '.jpg';
          const imageName = `${slug.substring(0, 50)}${ext}`;
          const fullPath = path.join(imageDir, imageName);

          console.log(`  Downloading image...`);
          const downloaded = await downloadFile(imageUrl, fullPath);
          if (downloaded) {
            localImagePath = `/images/products/${imageName}`;
            imagesDownloaded++;
          }
        } catch (e) {}
      }

      // Download PDF brochure
      let localPdfPath = null;
      if (brochureUrl && brochureUrl.startsWith('http')) {
        try {
          const pdfName = `${slug.substring(0, 50)}.pdf`;
          const fullPath = path.join(pdfDir, pdfName);

          console.log(`  Downloading PDF...`);
          const downloaded = await downloadFile(brochureUrl, fullPath);
          if (downloaded) {
            localPdfPath = `/pdfs/${pdfName}`;
            pdfsDownloaded++;
          }
        } catch (e) {}
      }

      // Create product
      await prisma.products.create({
        data: {
          id: productId,
          reference_fournisseur: productRef,
          category_id: categoryId,
          constructeur: brand.toLowerCase(),
          slug: slug,
          status: 'active',
          is_featured: false,
          sort_order: 0,
          partner_id: partnerId,
          pdf_brochure_url: localPdfPath,
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
            nom: nameEn || nameFr,
            description: descriptionEn || null,
          },
          {
            id: `${productId}-fr`,
            product_id: productId,
            language_code: 'fr',
            nom: nameFr,
            description: descriptionFr || null,
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
            alt_text: nameEn || nameFr,
            title: nameEn || nameFr,
            sort_order: 0,
            is_primary: true,
          }
        });
      }

      console.log(`Imported: ${productRef} - ${nameEn || nameFr}${localImagePath ? ' [IMG]' : ''}${localPdfPath ? ' [PDF]' : ''}`);
      imported++;

    } catch (error) {
      console.error(`Error:`, error.message);
      errors++;
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Images downloaded: ${imagesDownloaded}`);
  console.log(`PDFs downloaded: ${pdfsDownloaded}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);

  await prisma.$disconnect();
}

importProducts().catch(console.error);
