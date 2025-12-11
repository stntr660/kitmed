const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

/**
 * Extract RUMEX PDFs from original source CSV files
 * and upload them as brochures
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

async function extractRumexPDFsFromSource() {
  try {
    console.log('📄 EXTRACTING RUMEX BROCHURE PDFs FROM SOURCE CSV');
    console.log('================================================');
    
    // Read the source CSV files to find RUMEX products with PDFs
    const sourcePath = '/Users/mac/Downloads/kitmed agent/kitmed_batch_5_of_5.csv';
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source CSV not found: ${sourcePath}`);
    }
    
    console.log(`📁 Reading source: ${sourcePath}`);
    
    const csvContent = fs.readFileSync(sourcePath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📊 Found ${records.length} records in source CSV`);
    
    // Filter RUMEX products
    const rumexRecords = records.filter(record => 
      record.constructeur && record.constructeur.toUpperCase().includes('RUMEX')
    );
    
    console.log(`🔍 Found ${rumexRecords.length} RUMEX products in source`);
    
    let processedCount = 0;
    let pdfCount = 0;
    let errorCount = 0;
    
    for (const record of rumexRecords) {
      const reference = record.referenceFournisseur;
      console.log(`\\n📦 Processing: ${reference}`);
      
      // Check if this product exists in our database
      const existingProduct = await prisma.products.findFirst({
        where: { 
          reference_fournisseur: reference,
          constructeur: 'rumex'
        },
        include: { product_media: { where: { type: 'pdf' } } }
      });
      
      if (!existingProduct) {
        console.log(`  ⏭️  Product not found in database: ${reference}`);
        continue;
      }
      
      // Check if already has PDFs
      if (existingProduct.product_media.length > 0) {
        console.log(`  ⏭️  Already has ${existingProduct.product_media.length} PDF(s)`);
        continue;
      }
      
      // Extract PDF URLs from the pdfBrochureUrl column
      const pdfUrl = record.pdfBrochureUrl;
      
      if (!pdfUrl || pdfUrl.trim() === '') {
        console.log(`  ⏭️  No PDF URL in pdfBrochureUrl column`);
        continue;
      }
      
      console.log(`  📄 Found brochure PDF: ${pdfUrl.substring(0, 60)}...`);
      
      try {
        // Generate safe filename for brochure
        const cleanRef = reference.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const filename = `${cleanRef}-brochure.pdf`;
        
        // Download PDF
        const localPath = await downloadPDF(pdfUrl, filename);
        
        // Create product_media entry
        await prisma.product_media.create({
          data: {
            id: crypto.randomUUID(),
            product_id: existingProduct.id,
            type: 'pdf',
            url: localPath,
            is_primary: true, // Brochure PDFs are primary
            sort_order: 1,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        
        console.log(`  ✅ Added brochure to database: ${localPath}`);
        pdfCount++;
        
      } catch (error) {
        console.log(`  ❌ Failed to process PDF: ${error.message}`);
        errorCount++;
      }
      
      processedCount++;
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\\n📊 SUMMARY');
    console.log('===========');
    console.log(`RUMEX records in source CSV: ${rumexRecords.length}`);
    console.log(`Products processed: ${processedCount}`);
    console.log(`Brochure PDFs downloaded: ${pdfCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (pdfCount > 0) {
      console.log('\\n🎉 SUCCESS! RUMEX brochure PDFs extracted and uploaded');
      console.log('📁 PDFs stored in: public/uploads/products/');
      console.log('📋 Database updated with PDF brochure records');
    } else {
      console.log('\\n⚠️  No brochure PDFs found in pdfBrochureUrl column');
    }
    
  } catch (error) {
    console.error('❌ Error extracting RUMEX PDFs:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the extraction
extractRumexPDFsFromSource().then(() => {
  console.log('\\n✅ RUMEX PDF EXTRACTION COMPLETE!');
}).catch(error => {
  console.error('❌ PDF extraction failed:', error.message);
  process.exit(1);
});