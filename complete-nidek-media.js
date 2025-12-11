const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

async function downloadMedia(url, filename) {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(__dirname, 'public/uploads/products');
    
    // Ensure safe filename
    let safeFilename = filename;
    if (filename.length > 100) {
      const ext = path.extname(filename);
      const baseName = path.basename(filename, ext);
      safeFilename = baseName.substring(0, 80) + ext;
    }
    
    const filePath = path.join(uploadDir, safeFilename);
    
    // Check if file already exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      console.log(`    ⏭️  Already exists: ${safeFilename}`);
      resolve(`/uploads/products/${safeFilename}`);
      return;
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    console.log(`    📥 Downloading: ${safeFilename}`);
    
    const protocol = url.startsWith('https:') ? https : http;
    const file = fs.createWriteStream(filePath);
    
    const request = protocol.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KITMED-Media-Downloader/1.0)',
        'Accept': 'application/pdf,image/jpeg,image/png,*/*;q=0.9'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          const size = fs.statSync(filePath).size;
          console.log(`    ✅ Downloaded: ${safeFilename} (${(size / 1024).toFixed(1)}KB)`);
          resolve(`/uploads/products/${safeFilename}`);
        });
      } else {
        file.close();
        fs.unlink(filePath, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });
    
    request.on('error', (err) => {
      file.close();
      fs.unlink(filePath, () => {});
      reject(err);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      file.close();
      fs.unlink(filePath, () => {});
      reject(new Error('Download timeout'));
    });
  });
}

async function completeNidekMedia() {
  try {
    console.log('📸 COMPLETING NIDEK PRODUCTS MEDIA');
    console.log('==================================');
    
    // Get NIDEK products without media
    const nidekWithoutMedia = await prisma.products.findMany({
      where: { 
        constructeur: 'nidek',
        product_media: { none: {} }
      },
      select: { id: true, reference_fournisseur: true }
    });
    
    console.log(`📊 Found ${nidekWithoutMedia.length} NIDEK products without media`);
    
    // Read CSV to get media URLs
    const csvPath = './kitmed_batch_4_FINAL.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    let processedCount = 0;
    let mediaAddedCount = 0;
    
    for (const product of nidekWithoutMedia) {
      console.log(`\n📦 Processing: ${product.reference_fournisseur}`);
      
      // Find matching CSV record
      const csvRecord = records.find(r => 
        r.referenceFournisseur === product.reference_fournisseur && 
        r.constructeur === 'nidek'
      );
      
      if (!csvRecord || !csvRecord.imageUrls) {
        console.log(`  ⏭️  No media URLs found in CSV`);
        continue;
      }
      
      // Process media URLs
      const mediaUrls = csvRecord.imageUrls.split('|').map(url => url.trim()).filter(url => url);
      
      if (mediaUrls.length === 0) {
        console.log(`  ⏭️  No valid media URLs`);
        continue;
      }
      
      console.log(`  📸 Found ${mediaUrls.length} media URL(s)`);
      
      for (let i = 0; i < mediaUrls.length; i++) {
        const mediaUrl = mediaUrls[i];
        const mediaType = mediaUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
        const fileExt = mediaType === 'pdf' ? '.pdf' : '.jpg';
        
        try {
          // Generate safe filename
          const cleanRef = product.reference_fournisseur.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          const suffix = i === 0 ? 'primary' : `gallery-${i + 1}`;
          const filename = `${cleanRef}-${suffix}${fileExt}`;
          
          const localPath = await downloadMedia(mediaUrl, filename);
          
          // Add to database
          await prisma.product_media.create({
            data: {
              id: crypto.randomUUID(),
              product_id: product.id,
              type: mediaType,
              url: localPath,
              is_primary: i === 0,
              sort_order: i + 1
            }
          });
          
          console.log(`    ✅ Added ${mediaType}: ${localPath}`);
          mediaAddedCount++;
          
        } catch (error) {
          console.log(`    ❌ Failed to process ${mediaType}: ${error.message}`);
        }
      }
      
      processedCount++;
      
      // Small delay between products
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 MEDIA COMPLETION SUMMARY`);
    console.log(`===========================`);
    console.log(`Products processed: ${processedCount}`);
    console.log(`Media files added: ${mediaAddedCount}`);
    
    // Final verification
    const finalStatus = await checkFinalStatus();
    console.log(`\n🎯 FINAL NIDEK STATUS:`);
    console.log(`   Products: ${finalStatus.total}/36`);
    console.log(`   With PDFs: ${finalStatus.withPDFs}/${finalStatus.total}`);
    console.log(`   With Images: ${finalStatus.withImages}/${finalStatus.total}`);
    console.log(`   Without Media: ${finalStatus.withoutMedia}`);
    
    if (finalStatus.withoutMedia === 0) {
      console.log(`\n✅ SUCCESS: All NIDEK products now have media!`);
    }
    
  } catch (error) {
    console.error('❌ Error completing media:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkFinalStatus() {
  const total = await prisma.products.count({
    where: { constructeur: 'nidek' }
  });
  
  const withPDFs = await prisma.products.count({
    where: { 
      constructeur: 'nidek',
      product_media: { some: { type: 'pdf' } }
    }
  });
  
  const withImages = await prisma.products.count({
    where: { 
      constructeur: 'nidek',
      product_media: { some: { type: 'image' } }
    }
  });
  
  const withoutMedia = await prisma.products.count({
    where: { 
      constructeur: 'nidek',
      product_media: { none: {} }
    }
  });
  
  return { total, withPDFs, withImages, withoutMedia };
}

// Run the script
completeNidekMedia().then(() => {
  console.log('\n✅ NIDEK MEDIA COMPLETION FINISHED!');
}).catch(error => {
  console.error('❌ Media completion failed:', error.message);
  process.exit(1);
});