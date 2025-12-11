const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Add the already downloaded PDF files to the database
 */

async function addDownloadedPDFsToDatabase() {
  try {
    console.log('📄 ADDING DOWNLOADED RUMEX PDFs TO DATABASE');
    console.log('==========================================');
    
    const uploadDir = path.join(__dirname, 'public/uploads/products');
    
    if (!fs.existsSync(uploadDir)) {
      throw new Error('Upload directory not found');
    }
    
    // Get all PDF files that were downloaded
    const pdfFiles = fs.readdirSync(uploadDir)
      .filter(file => file.endsWith('-brochure.pdf'))
      .filter(file => file.includes('rumex') || /^[0-9-a-z]+-brochure\.pdf$/.test(file));
    
    console.log(`📁 Found ${pdfFiles.length} downloaded PDF brochures:`);
    pdfFiles.forEach(file => console.log(`  - ${file}`));
    
    let addedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const pdfFile of pdfFiles) {
      // Extract product reference from filename
      const reference = pdfFile.replace('-brochure.pdf', '').toUpperCase();
      
      console.log(`\n📦 Processing: ${reference} (${pdfFile})`);
      
      // Find the product in database
      const product = await prisma.products.findFirst({
        where: { 
          reference_fournisseur: reference,
          constructeur: 'rumex'
        },
        include: { product_media: { where: { type: 'pdf' } } }
      });
      
      if (!product) {
        console.log(`  ⏭️  Product not found in database: ${reference}`);
        skippedCount++;
        continue;
      }
      
      // Check if PDF already exists
      if (product.product_media.length > 0) {
        console.log(`  ⏭️  PDF already exists for this product`);
        skippedCount++;
        continue;
      }
      
      try {
        // Add PDF to database (without updated_at field)
        await prisma.product_media.create({
          data: {
            id: crypto.randomUUID(),
            product_id: product.id,
            type: 'pdf',
            url: `/uploads/products/${pdfFile}`,
            is_primary: true,
            sort_order: 1,
            created_at: new Date()
          }
        });
        
        console.log(`  ✅ Added PDF to database: /uploads/products/${pdfFile}`);
        addedCount++;
        
      } catch (error) {
        console.log(`  ❌ Database error: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`PDF files found: ${pdfFiles.length}`);
    console.log(`PDFs added to database: ${addedCount}`);
    console.log(`PDFs skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (addedCount > 0) {
      console.log('\n🎉 SUCCESS! RUMEX brochure PDFs added to database');
      console.log('📋 Products now have accessible PDF brochures');
    }
    
    // Verify final state
    const rumexPDFCount = await prisma.product_media.count({
      where: { 
        type: 'pdf',
        products: { constructeur: 'rumex' }
      }
    });
    
    console.log(`\n📄 Total RUMEX PDF records in database: ${rumexPDFCount}`);
    
  } catch (error) {
    console.error('❌ Error adding PDFs to database:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addDownloadedPDFsToDatabase().then(() => {
  console.log('\n✅ PDF DATABASE UPDATE COMPLETE!');
}).catch(error => {
  console.error('❌ Database update failed:', error.message);
  process.exit(1);
});