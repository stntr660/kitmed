const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
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

async function downloadFile(url, filepath) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) {
      resolve(null);
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    const request = protocol.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.chukouplus.com/'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(filepath); } catch(e) {}
        downloadFile(response.headers.location, filepath).then(resolve);
        return;
      }

      if (response.statusCode !== 200) {
        console.log(`    HTTP ${response.statusCode}`);
        file.close();
        try { fs.unlinkSync(filepath); } catch(e) {}
        resolve(null);
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filepath);
        if (stats.size > 500) {
          resolve(filepath);
        } else {
          try { fs.unlinkSync(filepath); } catch(e) {}
          resolve(null);
        }
      });
    });

    request.on('error', (e) => {
      console.log(`    Error: ${e.message}`);
      file.close();
      try { fs.unlinkSync(filepath); } catch(e) {}
      resolve(null);
    });

    request.on('timeout', () => {
      console.log('    Timeout');
      request.destroy();
      file.close();
      try { fs.unlinkSync(filepath); } catch(e) {}
      resolve(null);
    });
  });
}

async function updatePukangProducts() {
  const imageDir = path.join(__dirname, '../public/images/products');
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  // Load CSV files
  const chunk1Path = '/Users/mac/Downloads/chunk1.csv';
  const chunk2Path = '/Users/mac/Downloads/chunk2_fixed.csv';

  const chunk1 = fs.existsSync(chunk1Path) ? parseCSV(fs.readFileSync(chunk1Path, 'utf-8')) : [];
  const chunk2 = fs.existsSync(chunk2Path) ? parseCSV(fs.readFileSync(chunk2Path, 'utf-8')) : [];

  const allRecords = [...chunk1, ...chunk2];
  const pukangRecords = allRecords.filter(r => r.constructeur === 'PUKANG');

  console.log(`Found ${pukangRecords.length} PUKANG products in CSV files\n`);

  let updated = 0;
  let imagesDownloaded = 0;

  for (const record of pukangRecords) {
    const ref = record.referenceFournisseur;
    const nomFr = record.nom_fr;
    const nomEn = record.nom_en;
    const descFr = record.description_fr;
    const descEn = record.description_en;
    const imageUrl = record.imageUrls;

    console.log(`\nProcessing: ${ref}`);
    console.log(`  FR: ${nomFr}`);
    console.log(`  EN: ${nomEn}`);

    // Find product in database
    const product = await prisma.products.findFirst({
      where: { reference_fournisseur: ref },
      include: { product_translations: true, product_media: true }
    });

    if (!product) {
      console.log(`  NOT FOUND in database`);
      continue;
    }

    // Update translations
    for (const lang of ['fr', 'en']) {
      const nom = lang === 'fr' ? nomFr : nomEn;
      const desc = lang === 'fr' ? descFr : descEn;

      const existing = product.product_translations.find(t => t.language_code === lang);
      if (existing) {
        await prisma.product_translations.update({
          where: { id: existing.id },
          data: { nom, description: desc }
        });
      } else {
        await prisma.product_translations.create({
          data: {
            id: `${product.id}-${lang}`,
            product_id: product.id,
            language_code: lang,
            nom,
            description: desc
          }
        });
      }
    }

    console.log(`  Updated translations`);

    // Try to download image
    if (imageUrl && imageUrl.startsWith('http')) {
      console.log(`  Trying image: ${imageUrl.substring(0, 50)}...`);

      const urlObj = new URL(imageUrl);
      let ext = path.extname(urlObj.pathname) || '.jpg';
      if (ext.includes('?')) ext = ext.split('?')[0];
      if (!ext.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ext = '.png';

      const filename = `pukang-${ref.toLowerCase().replace(/[^a-z0-9]/g, '-')}${ext}`;
      const filepath = path.join(imageDir, filename);
      const localUrl = `/images/products/${filename}`;

      const downloaded = await downloadFile(imageUrl, filepath);

      if (downloaded) {
        // Update or create media
        if (product.product_media.length > 0) {
          await prisma.product_media.updateMany({
            where: { product_id: product.id },
            data: { url: localUrl }
          });
        } else {
          await prisma.product_media.create({
            data: {
              id: `${product.id}-media-1`,
              product_id: product.id,
              type: 'image',
              url: localUrl,
              alt_text: nomEn || nomFr,
              is_primary: true,
              sort_order: 0
            }
          });
        }
        console.log(`  Downloaded: ${filename}`);
        imagesDownloaded++;
      } else {
        // Set placeholder
        if (product.product_media.length > 0) {
          await prisma.product_media.updateMany({
            where: { product_id: product.id },
            data: { url: '/images/placeholder-product.svg' }
          });
        }
        console.log(`  Using placeholder`);
      }
    }

    updated++;
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated} products`);
  console.log(`Images downloaded: ${imagesDownloaded}`);

  await prisma.$disconnect();
}

updatePukangProducts().catch(console.error);
