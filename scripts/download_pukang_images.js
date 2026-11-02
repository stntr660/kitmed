const fs = require('fs');
const path = require('path');
const https = require('https');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function downloadFile(url, filepath) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) {
      resolve(null);
      return;
    }

    const file = fs.createWriteStream(filepath);

    https.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(filepath); } catch(e) {}
        downloadFile(response.headers.location, filepath).then(resolve);
        return;
      }

      if (response.statusCode !== 200) {
        console.log(`  Failed: HTTP ${response.statusCode}`);
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
    }).on('error', (e) => {
      console.log(`  Error: ${e.message}`);
      file.close();
      try { fs.unlinkSync(filepath); } catch(e) {}
      resolve(null);
    }).on('timeout', () => {
      console.log('  Timeout');
      file.close();
      try { fs.unlinkSync(filepath); } catch(e) {}
      resolve(null);
    });
  });
}

async function downloadPukangImages() {
  const imageDir = path.join(__dirname, '../public/images/products');
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  // Get PUKANG products with external images
  const media = await prisma.product_media.findMany({
    where: {
      products: { partner_id: '8e928e51-8b4a-424d-b0d2-8182411dc002' },
      url: { startsWith: 'http' }
    },
    include: {
      products: {
        select: { slug: true, reference_fournisseur: true }
      }
    }
  });

  console.log(`Found ${media.length} PUKANG images to download\n`);

  let downloaded = 0;
  let failed = 0;

  for (const m of media) {
    const ref = m.products?.reference_fournisseur || 'unknown';
    const slug = m.products?.slug || ref;

    console.log(`Processing: ${ref}`);
    console.log(`  URL: ${m.url.substring(0, 60)}...`);

    // Generate local filename
    const urlObj = new URL(m.url);
    let ext = path.extname(urlObj.pathname) || '.jpg';
    if (ext.includes('?')) ext = ext.split('?')[0];
    if (!ext.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ext = '.jpg';

    const filename = `pukang-${slug.substring(0, 40)}${ext}`;
    const filepath = path.join(imageDir, filename);
    const localUrl = `/images/products/${filename}`;

    const result = await downloadFile(m.url, filepath);

    if (result) {
      // Update database with local path
      await prisma.product_media.update({
        where: { id: m.id },
        data: { url: localUrl }
      });
      console.log(`  Downloaded: ${filename}`);
      downloaded++;
    } else {
      // Set placeholder for failed downloads
      await prisma.product_media.update({
        where: { id: m.id },
        data: { url: '/images/placeholder-product.svg' }
      });
      console.log(`  Using placeholder`);
      failed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Failed (using placeholder): ${failed}`);

  await prisma.$disconnect();
}

downloadPukangImages().catch(console.error);
