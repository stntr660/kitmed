const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Fix RUMEX PDFs - Extract PDF URLs from descriptions and upload them
 */

async function downloadPDF(url, filename) {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(__dirname, 'public/uploads/products');
    const filePath = path.join(uploadDir, filename);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      resolve(`/uploads/products/${filename}`);
      return;
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
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
          console.log(`    ✅ Downloaded: ${filename}`);
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

async function extractAndUploadRumexPDFs() {
  try {
    console.log('🔧 FIXING RUMEX PDFS');
    console.log('====================');
    
    // Get RUMEX products that might have PDFs in descriptions
    const rumexProducts = await prisma.products.findMany({
      where: { 
        constructeur: 'rumex',
        // Look for products that don't have PDF media yet
        product_media: {
          none: { type: 'pdf' }
        }
      },
      include: { 
        product_translations: true,
        product_media: true 
      }
    });
    
    console.log(`Found ${rumexProducts.length} RUMEX products without PDFs\n`);
    
    let pdfCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of rumexProducts) {
      console.log(`📦 Processing: ${product.reference_fournisseur}`);
      
      // Get French description which might contain PDF URLs
      const frTranslation = product.product_translations.find(t => t.language_code === 'fr');
      const description = frTranslation?.description || '';
      
      // Extract PDF URLs from description
      const pdfUrlRegex = /https:\/\/[^\s,;]+\.pdf[^\s,;]*/gi;
      const pdfUrls = description.match(pdfUrlRegex) || [];
      
      if (pdfUrls.length > 0) {
        console.log(`  📄 Found ${pdfUrls.length} PDF URLs`);
        
        for (let i = 0; i < pdfUrls.length; i++) {
          const pdfUrl = pdfUrls[i].trim();
          console.log(`  📥 Downloading: ${pdfUrl.substring(0, 60)}...`);
          
          try {
            // Generate safe filename
            const cleanRef = product.reference_fournisseur.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            const suffix = pdfUrls.length > 1 ? `-${i + 1}` : '';
            const filename = `${cleanRef}-brochure${suffix}.pdf`;
            
            // Download PDF
            const localPath = await downloadPDF(pdfUrl, filename);
            
            // Create product_media entry
            await prisma.product_media.create({
              data: {
                id: crypto.randomUUID(),
                product_id: product.id,
                type: 'pdf',
                url: localPath,
                is_primary: i === 0, // First PDF is primary
                sort_order: i + 1,
                created_at: new Date(),
                updated_at: new Date()
              }
            });
            
            console.log(`    ✅ Added to database: ${localPath}`);
            pdfCount++;
            
          } catch (error) {
            console.log(`    ❌ Failed: ${error.message}`);
            errorCount++;
          }
        }
        successCount++;
      } else {
        console.log(`  ⏭️  No PDF URLs found in description`);
      }
      
      console.log('');
    }
    
    console.log('📊 SUMMARY');
    console.log('==========');
    console.log(`Products processed: ${rumexProducts.length}`);
    console.log(`Products with PDFs: ${successCount}`);
    console.log(`PDFs downloaded: ${pdfCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (pdfCount > 0) {
      console.log('\n🎉 SUCCESS! RUMEX PDFs have been extracted and uploaded');
      console.log('📁 PDFs stored in: public/uploads/products/');
      console.log('📋 Database updated with PDF media records');
    }
    
  } catch (error) {
    console.error('❌ Error fixing RUMEX PDFs:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixRumexPDFs().then(() => {
  console.log('\n✅ RUMEX PDF FIX COMPLETE!');
}).catch(error => {
  console.error('❌ PDF fix failed:', error.message);
  process.exit(1);
});

// Export for use in other scripts
module.exports = { extractAndUploadRumexPDFs };

// Fix function name typo
async function fixRumexPDFs() {
  return extractAndUploadRumexPDFs();
}