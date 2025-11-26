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

// Field validation functions
const validators = {
  referenceFournisseur: (value) => {
    if (!value || value.length === 0) return { valid: false, error: 'Reference is required' };
    if (value.length > 50) return { valid: false, error: 'Reference too long (max 50 chars)' };
    if (!/^[A-Z0-9-]+$/i.test(value)) return { valid: false, error: 'Reference contains invalid characters' };
    return { valid: true };
  },
  
  constructeur: (value, availablePartners = []) => {
    if (!value || value.length === 0) return { valid: false, error: 'Manufacturer is required' };
    
    // Check against available partners in database
    const partnerNames = availablePartners.map(p => p.name);
    if (partnerNames.length > 0 && !partnerNames.includes(value)) {
      return { valid: false, error: `Unknown manufacturer: ${value}. Available: ${partnerNames.join(', ')}` };
    }
    
    // Fallback to hardcoded list if no partners loaded
    if (partnerNames.length === 0 && !['MORIA', 'KEELER'].includes(value)) {
      return { valid: false, error: 'Unknown manufacturer: ' + value };
    }
    
    return { valid: true };
  },
  
  categoryId: (value) => {
    if (!value || value.length === 0) return { valid: false, error: 'Category ID is required' };
    if (value !== 'ophthalmology-surgical') return { valid: false, error: 'Invalid category: ' + value };
    return { valid: true };
  },
  
  status: (value) => {
    if (!['active', 'inactive', 'draft'].includes(value)) return { valid: false, error: 'Invalid status: ' + value };
    return { valid: true };
  },
  
  nom_fr: (value) => {
    if (!value || value.length === 0) return { valid: false, error: 'French name is required' };
    if (value.length > 200) return { valid: false, error: 'French name too long (max 200 chars)' };
    return { valid: true };
  },
  
  nom_en: (value) => {
    if (!value || value.length === 0) return { valid: false, error: 'English name is required' };
    if (value.length > 200) return { valid: false, error: 'English name too long (max 200 chars)' };
    return { valid: true };
  },
  
  description_fr: (value) => {
    if (value && value.length > 2000) return { valid: false, error: 'French description too long (max 2000 chars)' };
    return { valid: true };
  },
  
  description_en: (value) => {
    if (value && value.length > 2000) return { valid: false, error: 'English description too long (max 2000 chars)' };
    return { valid: true };
  },
  
  imageUrl: (value) => {
    if (!value || value.length === 0) return { valid: false, error: 'Image URL is required' };
    if (!value.startsWith('https://')) return { valid: false, error: 'Image URL must be HTTPS' };
    if (!value.includes('moria-surgical.com') && !value.includes('keelerglobal.com')) {
      return { valid: false, error: 'Image URL must be from official manufacturer domain' };
    }
    return { valid: true };
  }
};

// Language detection and validation
function detectLanguage(text) {
  if (!text) return 'unknown';
  
  // Spanish indicators
  const spanishWords = ['para', 'con', 'que', 'una', 'del', 'por', 'sistema', 'digital', 'lámpara', 'guía'];
  const spanishCount = spanishWords.filter(word => text.toLowerCase().includes(word)).length;
  
  // French indicators  
  const frenchWords = ['pour', 'avec', 'que', 'une', 'du', 'par', 'système', 'numérique', 'lampe', 'guide'];
  const frenchCount = frenchWords.filter(word => text.toLowerCase().includes(word)).length;
  
  // English indicators
  const englishWords = ['for', 'with', 'that', 'a', 'the', 'by', 'system', 'digital', 'lamp', 'guide'];
  const englishCount = englishWords.filter(word => text.toLowerCase().includes(word)).length;
  
  if (spanishCount >= 2) return 'spanish';
  if (frenchCount >= 2) return 'french';
  if (englishCount >= 2) return 'english';
  
  return 'unknown';
}

// Validate parsed CSV row
function validateRow(fields, rowNumber, availablePartners = []) {
  const errors = [];
  const warnings = [];
  
  // Expected field structure
  const expectedFields = [
    'referenceFournisseur', 'constructeur', 'slug', 'categoryId', 'status', 'isFeatured',
    'nom_fr', 'nom_en', 'description_fr', 'description_en', 'ficheTechnique_fr', 'ficheTechnique_en', 'imageUrl'
  ];
  
  if (fields.length < expectedFields.length) {
    errors.push(`Row ${rowNumber}: Expected ${expectedFields.length} fields, got ${fields.length}`);
    return { valid: false, errors, warnings, data: null };
  }
  
  // Map fields to object
  const data = {};
  expectedFields.forEach((field, index) => {
    data[field] = fields[index] || '';
  });
  
  // Validate each field
  Object.keys(validators).forEach(field => {
    if (data[field] !== undefined) {
      // Pass availablePartners to constructeur validator
      const validation = field === 'constructeur' 
        ? validators[field](data[field], availablePartners)
        : validators[field](data[field]);
      
      if (!validation.valid) {
        errors.push(`Row ${rowNumber}: ${field} - ${validation.error}`);
      }
    }
  });
  
  // Language validation
  const frLang = detectLanguage(data.nom_fr);
  const enLang = detectLanguage(data.nom_en);
  
  if (frLang === 'spanish') {
    warnings.push(`Row ${rowNumber}: French name appears to be in Spanish: "${data.nom_fr.substring(0, 50)}..."`);
  }
  if (enLang === 'spanish') {
    warnings.push(`Row ${rowNumber}: English name appears to be in Spanish: "${data.nom_en.substring(0, 50)}..."`);
  }
  
  // Check for duplicate French/English content
  if (data.nom_fr === data.nom_en && data.nom_fr.length > 5) {
    warnings.push(`Row ${rowNumber}: French and English names are identical - possible missing translation`);
  }
  if (data.description_fr === data.description_en && data.description_fr.length > 10) {
    warnings.push(`Row ${rowNumber}: French and English descriptions are identical - possible missing translation`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? data : null
  };
}

// Download file function
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
      console.log(`       URL: ${url}`);
      console.log(`       File: ${filename}`);

      const file = fs.createWriteStream(filePath);
      
      const request = protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`    ✅ Downloaded: ${filename}`);
            resolve(`/uploads/products/${filename}`);
          });
        } else {
          console.log(`    ❌ Failed to download: ${response.statusCode} - ${url}`);
          file.close();
          fs.unlink(filePath, () => {});
          resolve(null);
        }
      }).on('error', (err) => {
        console.log(`    ❌ Error downloading: ${err.message}`);
        file.close();
        fs.unlink(filePath, () => {});
        resolve(null);
      });
      
      // Set timeout
      request.setTimeout(30000, () => {
        request.destroy();
        console.log(`    ⏰ Download timeout: ${url}`);
        file.close();
        fs.unlink(filePath, () => {});
        resolve(null);
      });
    } catch (error) {
      console.log(`    ❌ Error processing: ${error.message}`);
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

// Get available partners for validation
async function getAvailablePartners(prisma) {
  const partners = await prisma.partner.findMany({
    where: { status: 'active' },
    select: { id: true, name: true }
  });
  return partners;
}

// Main batch import function
async function importBatch(csvPath, batchSize = 25, startLine = 2) {
  const prisma = new PrismaClient();
  
  console.log('🔄 BATCH CSV IMPORT WITH VALIDATION');
  console.log('=====================================');
  console.log(`Batch size: ${batchSize} products`);
  console.log(`Starting from line: ${startLine}`);
  console.log(`CSV file: ${csvPath}`);
  console.log('');
  
  try {
    // Get available partners for validation
    const availablePartners = await getAvailablePartners(prisma);
    console.log(`🏢 Available partners: ${availablePartners.map(p => p.name).join(', ')}`);
    console.log('');
    
    // Read CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    
    console.log(`📊 Total lines in CSV: ${lines.length}`);
    console.log(`📦 Total products: ${lines.length - 1}`);
    console.log('');
    
    // Parse header
    const header = parseCSVLine(lines[0]);
    console.log('📋 CSV Header:', header);
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
    let totalWarnings = 0;
    
    const validationSummary = {
      languageIssues: [],
      duplicateContent: [],
      fieldErrors: [],
      missingImages: []
    };
    
    for (let i = 0; i < batchLines.length; i++) {
      const currentLine = startLine + i;
      const line = batchLines[i];
      
      console.log(`\n📦 Processing Product ${processed + 1}/${batchLines.length} (Line ${currentLine})`);
      console.log('=' .repeat(60));
      
      try {
        // Parse CSV line
        const fields = parseCSVLine(line);
        console.log(`   Fields parsed: ${fields.length}`);
        
        // Validate row with available partners
        const validation = validateRow(fields, currentLine, availablePartners);
        
        if (!validation.valid) {
          console.log('   ❌ VALIDATION FAILED:');
          validation.errors.forEach(error => {
            console.log(`      - ${error}`);
            validationSummary.fieldErrors.push(error);
          });
          errors++;
          processed++;
          continue;
        }
        
        // Display warnings
        if (validation.warnings.length > 0) {
          console.log('   ⚠️  WARNINGS:');
          validation.warnings.forEach(warning => {
            console.log(`      - ${warning}`);
            totalWarnings++;
            
            if (warning.includes('appears to be in Spanish')) {
              validationSummary.languageIssues.push(validation.data.referenceFournisseur);
            }
            if (warning.includes('are identical')) {
              validationSummary.duplicateContent.push(validation.data.referenceFournisseur);
            }
          });
        }
        
        const productData = validation.data;
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
        
        // Find partner from available partners list
        const partner = availablePartners.find(p => p.name === productData.constructeur);
        
        if (!partner) {
          console.log(`   ❌ ERROR - No partner found for: ${productData.constructeur}`);
          console.log(`   🏢 Available partners: ${availablePartners.map(p => p.name).join(', ')}`);
          validationSummary.fieldErrors.push(`No partner found for manufacturer: ${productData.constructeur}`);
          errors++;
          processed++;
          continue;
        }
        
        // Verify brand consistency (constructeur should match partner name)
        if (productData.constructeur !== partner.name) {
          console.log(`   ⚠️  WARNING - Brand mismatch: CSV shows '${productData.constructeur}' but partner is '${partner.name}'`);
          validationSummary.fieldErrors.push(`Brand mismatch for ${productData.referenceFournisseur}: CSV='${productData.constructeur}' vs Partner='${partner.name}'`);
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
          
          if (!primaryImagePath) {
            validationSummary.missingImages.push(productData.referenceFournisseur);
            console.log(`   ⚠️  Image download failed for: ${productData.referenceFournisseur}`);
          }
        }
        
        // Generate slug
        const slug = `${productData.nom_en}-${productData.referenceFournisseur}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50);
        
        console.log(`   🔗 Slug: ${slug}`);
        
        // Create product
        const createdProduct = await prisma.product.create({
          data: {
            referenceFournisseur: productData.referenceFournisseur,
            constructeur: productData.constructeur,
            slug: slug,
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
        validationSummary.fieldErrors.push(`Line ${currentLine}: ${error.message}`);
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
    console.log(`⚠️  Total warnings: ${totalWarnings}`);
    console.log('');
    
    // Detailed validation summary
    console.log('📋 VALIDATION SUMMARY:');
    console.log('=====================');
    
    if (validationSummary.languageIssues.length > 0) {
      console.log(`🌍 Products with language issues: ${validationSummary.languageIssues.length}`);
      console.log(`   ${validationSummary.languageIssues.join(', ')}`);
    }
    
    if (validationSummary.duplicateContent.length > 0) {
      console.log(`📋 Products with duplicate FR/EN content: ${validationSummary.duplicateContent.length}`);
      console.log(`   ${validationSummary.duplicateContent.join(', ')}`);
    }
    
    if (validationSummary.missingImages.length > 0) {
      console.log(`📸 Products with failed image downloads: ${validationSummary.missingImages.length}`);
      console.log(`   ${validationSummary.missingImages.join(', ')}`);
    }
    
    if (validationSummary.fieldErrors.length > 0) {
      console.log(`❌ Field validation errors: ${validationSummary.fieldErrors.length}`);
      validationSummary.fieldErrors.slice(0, 5).forEach(error => {
        console.log(`   - ${error}`);
      });
      if (validationSummary.fieldErrors.length > 5) {
        console.log(`   ... and ${validationSummary.fieldErrors.length - 5} more errors`);
      }
    }
    
    console.log('');
    console.log('🎯 NEXT STEPS:');
    
    if (imported > 0) {
      console.log('✅ This batch was successful!');
      console.log(`📊 To continue: Run with startLine=${endLine + 1}`);
      console.log('💡 Check admin dashboard: http://localhost:3001/fr/admin/products');
    }
    
    if (errors > 0) {
      console.log('❌ Address validation errors before continuing');
      console.log('🔧 Consider fixing CSV data or adjusting validation rules');
    }
    
    if (totalWarnings > 5) {
      console.log('⚠️  High warning count - consider data quality improvements');
    }
    
    return { imported, skipped, errors, totalWarnings, validationSummary, nextStartLine: endLine + 1 };
    
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
  
  console.log('🚀 Starting batch import...');
  console.log(`📄 CSV: ${csvPath}`);
  console.log(`📦 Batch size: ${batchSize}`);
  console.log(`🎯 Start line: ${startLine}`);
  console.log('');
  
  importBatch(csvPath, batchSize, startLine).then(result => {
    if (result.imported > 0) {
      console.log('\n🎉 BATCH IMPORT SUCCESSFUL!');
      console.log('📸 Media files downloaded to local storage');
      console.log('🌍 Translations imported (with validation warnings)');
      console.log('🏭 Manufacturers properly linked');
      
      if (result.nextStartLine <= 615) {
        console.log(`\n🔄 To continue with next batch:`);
        console.log(`   node import-csv-batch-validated.js "${csvPath}" ${batchSize} ${result.nextStartLine}`);
      } else {
        console.log('\n🎊 ALL PRODUCTS IMPORTED! Full CSV processing complete.');
      }
    } else {
      console.log('\n⚠️  No products were imported in this batch.');
    }
  }).catch(error => {
    console.error('\n❌ Batch import failed:', error.message);
    process.exit(1);
  });
}

module.exports = { importBatch, parseCSVLine, validateRow, detectLanguage };