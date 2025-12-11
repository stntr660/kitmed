const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

/**
 * Add missing PDFs to existing NIDEK products
 */

async function downloadPDF(url, filename) {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(__dirname, 'public/uploads/products');
    const filePath = path.join(uploadDir, filename);
    
    // Check if file already exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      console.log(`    ⏭️  Already exists: ${filename}`);
      resolve(`/uploads/products/${filename}`);
      return;
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    console.log(`    📥 Downloading: ${filename}`);
    
    const protocol = url.startsWith('https:') ? https : http;
    const file = fs.createWriteStream(filePath);
    
    const request = protocol.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KITMED-PDF-Downloader/1.0)',
        'Accept': 'application/pdf,*/*;q=0.9'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          const size = fs.statSync(filePath).size;
          console.log(`    ✅ Downloaded: ${filename} (${(size / 1024).toFixed(1)}KB)`);
          resolve(`/uploads/products/${filename}`);
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

async function addMissingPDFsToNidek() {
  try {
    console.log('📄 ADDING MISSING PDFs TO EXISTING NIDEK PRODUCTS');
    console.log('=================================================');
    
    // Get existing NIDEK products without PDFs
    const nidekProducts = await prisma.products.findMany({
      where: { 
        constructeur: 'nidek',
        product_media: {
          none: { type: 'pdf' }
        }
      },
      include: { product_media: true }
    });
    
    console.log(`📊 Found ${nidekProducts.length} NIDEK products without PDFs`);
    
    // Read CSV to get PDF URLs
    const csvPath = './kitmed_batch_4_FINAL.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    let addedCount = 0;
    let errorCount = 0;
    
    for (const product of nidekProducts) {
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
      
      // Extract PDF URLs from imageUrls
      const mediaUrls = csvRecord.imageUrls.split('|').map(url => url.trim()).filter(url => url);
      const pdfUrls = mediaUrls.filter(url => url.toLowerCase().endsWith('.pdf'));
      
      if (pdfUrls.length === 0) {
        console.log(`  ⏭️  No PDF URLs found`);
        continue;
      }
      
      console.log(`  📄 Found ${pdfUrls.length} PDF(s)`);
      
      for (let i = 0; i < pdfUrls.length; i++) {
        const pdfUrl = pdfUrls[i];
        
        try {
          // Generate filename
          const cleanRef = product.reference_fournisseur.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          const suffix = i === 0 ? 'brochure' : `doc-${i + 1}`;
          const filename = `${cleanRef}-${suffix}.pdf`;
          
          // Download PDF
          const localPath = await downloadPDF(pdfUrl, filename);
          
          // Add to database
          await prisma.product_media.create({
            data: {
              id: crypto.randomUUID(),
              product_id: product.id,
              type: 'pdf',
              url: localPath,
              is_primary: i === 0, // First PDF is primary
              sort_order: product.product_media.length + i + 1,
              created_at: new Date()
            }
          });
          
          console.log(`    ✅ Added PDF to database: ${localPath}`);
          addedCount++;
          
        } catch (error) {
          console.log(`    ❌ Failed to process PDF: ${error.message}`);
          errorCount++;
        }
      }
    }
    
    console.log(`\n📊 PDF ADDITION SUMMARY`);
    console.log(`=======================`);
    console.log(`PDFs added: ${addedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    // Verify results
    const withPDFs = await prisma.products.count({
      where: { 
        constructeur: 'nidek',
        product_media: { some: { type: 'pdf' } }
      }
    });
    
    console.log(`\n📄 NIDEK products now with PDFs: ${withPDFs}/10`);
    
  } catch (error) {
    console.error('❌ Error adding PDFs:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addMissingPDFsToNidek().then(() => {
  console.log('\n✅ PDF ADDITION COMPLETED!');
}).catch(error => {
  console.error('❌ PDF addition failed:', error.message);
  process.exit(1);
});