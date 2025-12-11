const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

// Enhanced CSV Parser for complex quoted fields
function parseCSVLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = null;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (!inQuotes) {
      if (char === '"' || char === "'") {
        inQuotes = true;
        quoteChar = char;
      } else if (char === delimiter) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    } else {
      if (char === quoteChar) {
        if (nextChar === quoteChar) {
          // Escaped quote
          current += char;
          i++; // Skip next character
        } else {
          // End of quoted string
          inQuotes = false;
          quoteChar = null;
        }
      } else {
        current += char;
      }
    }
  }
  
  // Add the last field
  result.push(current.trim());
  return result;
}

// Generate unique slug with collision checking
async function generateUniqueSlug(baseName, reference, prisma, maxLength = 50) {
  let baseSlug = `${baseName}-${reference}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, maxLength - 10); // Leave space for suffix
  
  let slug = baseSlug;
  let counter = 1;
  
  // Check if slug exists
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing) {
      return slug;
    }
    
    // Create variant with counter
    counter++;
    const suffix = `-${counter}`;
    slug = (baseSlug + suffix).substring(0, maxLength);
  }
}

// Download file function (same as original)
async function downloadFile(url, filename, description = '') {
  return new Promise((resolve, reject) => {
    if (!url || url === '') {
      resolve(null);
      return;
    }

    try {
      const protocol = url.startsWith('https:') ? https : http;
      const filePath = path.join(__dirname, 'public/uploads/products', filename);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      console.log(`    📥 Downloading: ${description}`);

      const file = fs.createWriteStream(filePath);
      
      const request = protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(`/uploads/products/${filename}`);
          });
        } else {
          file.close();
          fs.unlink(filePath, () => {});
          resolve(null);
        }
      }).on('error', (err) => {
        file.close();
        fs.unlink(filePath, () => {});
        resolve(null);
      });
      
      // Set timeout
      request.setTimeout(30000, () => {
        request.destroy();
        file.close();
        fs.unlink(filePath, () => {});
        resolve(null);
      });
    } catch (error) {
      resolve(null);
    }
  });
}

// Get file extension from URL
function getFileExtension(url) {
  if (!url) return '';
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    return ext || '.jpg';
  } catch {
    return '.jpg';
  }
}

// Main import function with unique slug generation
async function importBatchWithUniqueSlug(csvPath, batchSize = 25, startLine = 2) {
  const prisma = new PrismaClient();
  
  console.log('🔄 BATCH CSV IMPORT WITH UNIQUE SLUG GENERATION');
  console.log('===============================================');
  console.log(`Batch size: ${batchSize} products`);
  console.log(`Starting from line: ${startLine}`);
  console.log(`CSV file: ${csvPath}`);
  console.log('');
  
  try {
    // Get available partners for validation
    const availablePartners = await prisma.partner.findMany({
      where: { status: 'active' },
      select: { id: true, name: true }
    });
    console.log(`🏢 Available partners: ${availablePartners.map(p => p.name).join(', ')}`);
    console.log('');
    
    // Read CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    
    console.log(`📊 Total lines in CSV: ${lines.length}`);
    console.log(`📦 Total products: ${lines.length - 1}`);
    console.log('');
    
    // Calculate batch
    const endLine = Math.min(startLine + batchSize - 1, lines.length - 1);
    const batchLines = lines.slice(startLine - 1, endLine);
    
    console.log(`🎯 Processing batch: lines ${startLine} to ${endLine} (${batchLines.length} products)`);
    console.log('');
    
    let processed = 0;
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < batchLines.length; i++) {
      const currentLine = startLine + i;
      const line = batchLines[i];
      
      console.log(`\n📦 Processing Product ${processed + 1}/${batchLines.length} (Line ${currentLine})`);
      console.log('=' .repeat(60));
      
      try {
        // Parse CSV line
        const fields = parseCSVLine(line);
        
        // Expected field structure
        const expectedFields = [
          'referenceFournisseur', 'constructeur', 'slug', 'categoryId', 'status', 'isFeatured',
          'nom_fr', 'nom_en', 'description_fr', 'description_en', 'ficheTechnique_fr', 'ficheTechnique_en', 'imageUrl'
        ];
        
        if (fields.length < expectedFields.length) {
          console.log(`   ❌ VALIDATION FAILED: Expected ${expectedFields.length} fields, got ${fields.length}`);
          errors++;
          processed++;
          continue;
        }
        
        // Map fields to object
        const productData = {};
        expectedFields.forEach((field, index) => {
          productData[field] = fields[index] || '';
        });
        
        console.log(`   📋 Reference: ${productData.referenceFournisseur}`);
        console.log(`   🏭 Manufacturer: ${productData.constructeur}`);
        console.log(`   🇫🇷 French: ${productData.nom_fr.substring(0, 50)}...`);
        console.log(`   🇬🇧 English: ${productData.nom_en.substring(0, 50)}...`);
        
        // Check if product already exists
        const existing = await prisma.product.findUnique({
          where: { referenceFournisseur: productData.referenceFournisseur }
        });
        
        if (existing) {
          console.log(`   ⚠️  SKIPPED - Already exists: ${productData.referenceFournisseur}`);
          skipped++;
          processed++;
          continue;
        }
        
        // Find partner
        const partner = availablePartners.find(p => p.name === productData.constructeur);
        
        if (!partner) {
          console.log(`   ❌ ERROR - No partner found for: ${productData.constructeur}`);
          errors++;
          processed++;
          continue;
        }
        
        console.log(`   🏢 Partner found: ${partner.name} (ID: ${partner.id})`);
        
        // Download image
        let primaryImagePath = null;
        if (productData.imageUrl) {
          const ext = getFileExtension(productData.imageUrl);
          const filename = `${productData.referenceFournisseur}-primary${ext}`;
          primaryImagePath = await downloadFile(
            productData.imageUrl, 
            filename, 
            'Primary image'
          );
        }
        
        // Generate UNIQUE slug
        const uniqueSlug = await generateUniqueSlug(
          productData.nom_en, 
          productData.referenceFournisseur, 
          prisma
        );
        
        console.log(`   🔗 Unique Slug: ${uniqueSlug}`);
        
        // Create product
        const createdProduct = await prisma.product.create({
          data: {
            referenceFournisseur: productData.referenceFournisseur,
            constructeur: productData.constructeur,
            slug: uniqueSlug,
            categoryId: productData.categoryId,
            status: productData.status || 'active',
            isFeatured: productData.isFeatured === 'true',
            partnerId: partner.id,
            
            translations: {
              create: [
                {
                  languageCode: 'fr',
                  nom: productData.nom_fr,
                  description: productData.description_fr,
                  ficheTechnique: productData.ficheTechnique_fr
                },
                {
                  languageCode: 'en',
                  nom: productData.nom_en,
                  description: productData.description_en,
                  ficheTechnique: productData.ficheTechnique_en
                }
              ]
            },
            
            media: primaryImagePath ? {
              create: [{
                type: 'image',
                url: primaryImagePath,
                isPrimary: true,
                sortOrder: 0,
                altText: productData.nom_en
              }]
            } : undefined
          },
          include: {
            translations: true,
            media: true,
            partner: true
          }
        });
        
        console.log(`   ✅ IMPORTED SUCCESSFULLY: ${createdProduct.referenceFournisseur}`);
        console.log(`      Partner: ${createdProduct.partner.name}`);
        console.log(`      Translations: ${createdProduct.translations.length}`);
        console.log(`      Media files: ${createdProduct.media.length}`);
        
        imported++;
        processed++;
        
      } catch (error) {
        console.log(`   ❌ ERROR importing line ${currentLine}: ${error.message}`);
        errors++;
        processed++;
      }
    }
    
    // Final batch summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 BATCH IMPORT COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${imported} products`);
    console.log(`⚠️  Skipped (already exist): ${skipped} products`);
    console.log(`❌ Errors: ${errors} products`);
    console.log(`📊 Total processed: ${processed} products`);
    console.log('');
    
    if (imported > 0) {
      console.log('✅ UNIQUE SLUG IMPORT SUCCESSFUL!');
      console.log('🔗 All products imported with collision-free slugs');
      console.log(`📊 To continue: Run with startLine=${endLine + 1}`);
    }
    
    return { imported, skipped, errors, nextStartLine: endLine + 1 };
    
  } catch (error) {
    console.error('❌ Batch import failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
if (require.main === module) {
  const csvPath = process.argv[2] || './data/kitmed_full_import_2025-11-25T13-46-22.csv';
  const batchSize = parseInt(process.argv[3]) || 25;
  const startLine = parseInt(process.argv[4]) || 2;
  
  console.log('🚀 Starting unique slug import...');
  console.log(`📄 CSV: ${csvPath}`);
  console.log(`📦 Batch size: ${batchSize}`);
  console.log(`🎯 Start line: ${startLine}`);
  console.log('');
  
  importBatchWithUniqueSlug(csvPath, batchSize, startLine).then(result => {
    if (result.imported > 0) {
      console.log('\n🎉 UNIQUE SLUG IMPORT SUCCESSFUL!');
      
      if (result.nextStartLine <= 615) {
        console.log(`\n🔄 To continue with next batch:`);
        console.log(`   node fix-slug-import.js "${csvPath}" ${batchSize} ${result.nextStartLine}`);
      } else {
        console.log('\n🎊 ALL PRODUCTS IMPORTED! Full CSV processing complete.');
      }
    } else {
      console.log('\n⚠️  No products were imported in this batch.');
    }
  }).catch(error => {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  });
}

module.exports = { importBatchWithUniqueSlug };