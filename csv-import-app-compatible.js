const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { parse } = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();

/**
 * App-Compatible CSV Import System
 * 
 * This importer follows the exact same process as your app's bulk-import API:
 * 1. Uses the same database structure (products, product_translations, product_media, product_files)
 * 2. Downloads files only when necessary (checks existing files first)
 * 3. Creates proper database entries with all relationships
 * 4. Follows the app's file organization structure
 * 5. Supports multi-language translations (FR/EN)
 * 6. Handles partners, categories, and all related data
 */

class AppCompatibleCSVImporter {
  constructor() {
    this.projectRoot = __dirname;
    this.publicDir = path.join(this.projectRoot, 'public');
    this.uploadsDir = path.join(this.publicDir, 'uploads');
    this.productsDir = path.join(this.uploadsDir, 'products');
    this.pdfsDir = path.join(this.uploadsDir, 'pdfs');
    
    // Track existing files to avoid re-downloading
    this.existingFiles = new Map();
    this.existingHashes = new Map();
    
    // Import statistics
    this.stats = {
      totalRows: 0,
      imported: 0,
      skipped: 0,
      errors: [],
      filesDownloaded: 0,
      filesReused: 0,
      startTime: Date.now()
    };

    this.init();
  }

  async init() {
    // Ensure directories exist
    [this.uploadsDir, this.productsDir, this.pdfsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${path.relative(this.projectRoot, dir)}`);
      }
    });

    // Load existing files
    this.loadExistingFiles();
    
    // Load existing data from database
    await this.loadExistingData();
  }

  loadExistingFiles() {
    console.log('🔍 Scanning existing files...');
    
    const searchDirs = [
      this.uploadsDir,
      path.join(this.publicDir, 'images'),
      path.join(this.publicDir, 'pdfs'),
      path.join(this.publicDir, 'products')
    ];

    let fileCount = 0;
    
    searchDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.scanDirectory(dir, (filePath, fileName) => {
          this.existingFiles.set(fileName.toLowerCase(), filePath);
          fileCount++;
        });
      }
    });

    console.log(`✅ Found ${fileCount} existing files`);
  }

  scanDirectory(dir, callback) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          this.scanDirectory(fullPath, callback);
        } else {
          callback(fullPath, entry.name);
        }
      }
    } catch (error) {
      console.log(`⚠️ Error scanning ${dir}: ${error.message}`);
    }
  }

  async loadExistingData() {
    try {
      // Load existing products
      const existingProducts = await prisma.products.findMany({
        select: { reference_fournisseur: true }
      });
      
      this.existingProductRefs = new Set(
        existingProducts.map(p => p.reference_fournisseur)
      );
      
      console.log(`📊 Found ${existingProducts.length} existing products in database`);
      
      // Load categories
      const categories = await prisma.categories.findMany({
        select: { id: true, slug: true, name: true }
      });
      
      this.categoryMap = new Map();
      categories.forEach(cat => {
        this.categoryMap.set(cat.slug, cat.id);
        this.categoryMap.set(cat.name, cat.id);
      });
      
      console.log(`📊 Found ${categories.length} categories in database`);
      
      // Load partners
      const partners = await prisma.partners.findMany({
        select: { id: true, name: true, slug: true }
      });
      
      this.partnerMap = new Map();
      partners.forEach(partner => {
        this.partnerMap.set(partner.name.toLowerCase(), partner.id);
        this.partnerMap.set(partner.slug, partner.id);
      });
      
      console.log(`📊 Found ${partners.length} partners in database`);
      
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  }

  // Generate slug from text
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[éèêë]/g, 'e')
      .replace(/[àâä]/g, 'a')
      .replace(/[îï]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/[ùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Get or download file
  async getOrDownloadFile(url, fileName, type = 'image') {
    // Check if file already exists
    const existingPath = this.existingFiles.get(fileName.toLowerCase());
    
    if (existingPath) {
      console.log(`  ✅ Reusing existing file: ${fileName}`);
      this.stats.filesReused++;
      return `/uploads/products/${fileName}`;
    }

    // Download file
    console.log(`  ⬬ Downloading: ${fileName}`);
    const targetDir = type === 'pdf' ? this.pdfsDir : this.productsDir;
    const targetPath = path.join(targetDir, fileName);
    
    try {
      await this.downloadFile(url, targetPath);
      this.stats.filesDownloaded++;
      this.existingFiles.set(fileName.toLowerCase(), targetPath);
      
      return `/uploads/${type === 'pdf' ? 'pdfs' : 'products'}/${fileName}`;
    } catch (error) {
      console.log(`  ❌ Download failed: ${error.message}`);
      return null;
    }
  }

  // Download file helper
  downloadFile(url, targetPath) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(targetPath);
      const protocol = url.startsWith('https') ? https : http;
      
      protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(targetPath);
          });
        } else {
          file.close();
          fs.unlinkSync(targetPath);
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      }).on('error', (err) => {
        file.close();
        fs.unlinkSync(targetPath);
        reject(err);
      });
    });
  }

  // Parse CSV row matching app structure
  parseCSVRow(row, rowIndex) {
    // Expected CSV columns (matching your app's bulk-import schema):
    // referenceFournisseur, constructeur, categoryId, nom_fr, nom_en, 
    // description_fr, description_en, ficheTechnique_fr, ficheTechnique_en,
    // pdfBrochureUrl, imageUrl, imageUrl2, imageUrl3, status, featured

    const productData = {
      reference_fournisseur: row.referenceFournisseur || row.reference_fournisseur || '',
      constructeur: row.constructeur || row.manufacturer || '',
      category_id: row.categoryId || row.category_id || '',
      nom_fr: row.nom_fr || row.name_fr || '',
      nom_en: row.nom_en || row.name_en || '',
      description_fr: row.description_fr || '',
      description_en: row.description_en || '',
      fiche_technique_fr: row.ficheTechnique_fr || row.fiche_technique_fr || '',
      fiche_technique_en: row.ficheTechnique_en || row.fiche_technique_en || '',
      pdf_brochure_url: row.pdfBrochureUrl || row.pdf_brochure_url || '',
      image_urls: [],
      status: row.status || 'active',
      is_featured: row.featured === 'true' || row.featured === '1' || false
    };

    // Collect image URLs
    if (row.imageUrl) productData.image_urls.push(row.imageUrl);
    if (row.imageUrl2) productData.image_urls.push(row.imageUrl2);
    if (row.imageUrl3) productData.image_urls.push(row.imageUrl3);

    return productData;
  }

  // Resolve category ID
  resolveCategoryId(categoryRef) {
    // Try to find by slug or name
    if (this.categoryMap.has(categoryRef)) {
      return this.categoryMap.get(categoryRef);
    }
    
    // Try lowercase match
    const lowercaseRef = categoryRef.toLowerCase();
    for (const [key, value] of this.categoryMap) {
      if (key.toLowerCase() === lowercaseRef) {
        return value;
      }
    }
    
    // If numeric, assume it's already an ID
    if (/^[a-f0-9-]+$/.test(categoryRef)) {
      return categoryRef;
    }
    
    return null;
  }

  // Resolve partner ID
  resolvePartnerId(constructeur) {
    if (!constructeur) return null;
    
    const lowercaseName = constructeur.toLowerCase();
    
    // Try exact match
    if (this.partnerMap.has(lowercaseName)) {
      return this.partnerMap.get(lowercaseName);
    }
    
    // Try partial match
    for (const [key, value] of this.partnerMap) {
      if (key.includes(lowercaseName) || lowercaseName.includes(key)) {
        return value;
      }
    }
    
    return null;
  }

  // Main import function
  async importCSV(csvFilePath) {
    console.log(`\n🚀 Starting App-Compatible CSV Import`);
    console.log(`📄 File: ${path.basename(csvFilePath)}\n`);
    
    // Read and parse CSV
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ',',
      quote: '"',
      escape: '"',
      trim: true,
    });

    this.stats.totalRows = records.length;
    console.log(`📊 Processing ${records.length} products...\n`);

    // Process each row
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // Account for header row
      
      console.log(`\n[${i + 1}/${records.length}] Processing: ${row.referenceFournisseur || row.reference_fournisseur}`);
      
      try {
        const productData = this.parseCSVRow(row, rowNum);
        
        // Validate required fields
        if (!productData.reference_fournisseur) {
          throw new Error('Missing reference_fournisseur');
        }
        
        if (!productData.nom_fr) {
          throw new Error('Missing French name (nom_fr)');
        }
        
        // Skip if product already exists
        if (this.existingProductRefs.has(productData.reference_fournisseur)) {
          console.log(`  ⏩ Skipped: Product already exists`);
          this.stats.skipped++;
          continue;
        }
        
        // Resolve category
        const categoryId = this.resolveCategoryId(productData.category_id);
        if (!categoryId) {
          throw new Error(`Category not found: ${productData.category_id}`);
        }
        
        // Resolve partner (optional)
        const partnerId = this.resolvePartnerId(productData.constructeur);
        
        // Generate slug
        const slug = this.generateSlug(productData.reference_fournisseur);
        
        // Handle file downloads
        const mediaFiles = [];
        
        // Download images if URLs provided
        for (let j = 0; j < productData.image_urls.length; j++) {
          const imageUrl = productData.image_urls[j];
          if (imageUrl && imageUrl.startsWith('http')) {
            const fileName = path.basename(new URL(imageUrl).pathname);
            const localPath = await this.getOrDownloadFile(imageUrl, fileName, 'image');
            
            if (localPath) {
              mediaFiles.push({
                type: 'image',
                url: localPath,
                is_primary: j === 0,
                sort_order: j
              });
            }
          }
        }
        
        // Download PDF if URL provided
        let pdfPath = null;
        if (productData.pdf_brochure_url && productData.pdf_brochure_url.startsWith('http')) {
          const fileName = path.basename(new URL(productData.pdf_brochure_url).pathname);
          pdfPath = await this.getOrDownloadFile(productData.pdf_brochure_url, fileName, 'pdf');
        }
        
        // Create product in database
        const product = await prisma.products.create({
          data: {
            id: uuidv4(),
            reference_fournisseur: productData.reference_fournisseur,
            constructeur: productData.constructeur,
            category_id: categoryId,
            partner_id: partnerId,
            slug: slug,
            status: productData.status,
            is_featured: productData.is_featured,
            pdf_brochure_url: pdfPath,
            created_at: new Date(),
            updated_at: new Date(),
            
            // Create translations
            product_translations: {
              create: [
                {
                  id: uuidv4(),
                  language_code: 'fr',
                  nom: productData.nom_fr,
                  description: productData.description_fr || null,
                  fiche_technique: productData.fiche_technique_fr || null
                },
                {
                  id: uuidv4(),
                  language_code: 'en',
                  nom: productData.nom_en || productData.nom_fr,
                  description: productData.description_en || null,
                  fiche_technique: productData.fiche_technique_en || null
                }
              ]
            },
            
            // Create media records
            ...(mediaFiles.length > 0 && {
              product_media: {
                create: mediaFiles.map(media => ({
                  id: uuidv4(),
                  type: media.type,
                  url: media.url,
                  is_primary: media.is_primary,
                  sort_order: media.sort_order,
                  created_at: new Date()
                }))
              }
            })
          }
        });
        
        console.log(`  ✅ Imported successfully (ID: ${product.id})`);
        this.stats.imported++;
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        this.stats.errors.push({
          row: rowNum,
          reference: row.referenceFournisseur || row.reference_fournisseur,
          error: error.message
        });
      }
    }

    // Generate final report
    this.generateReport();
    
    await prisma.$disconnect();
    
    return this.stats;
  }

  generateReport() {
    const duration = Math.round((Date.now() - this.stats.startTime) / 1000);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 IMPORT COMPLETE`);
    console.log(`${'='.repeat(60)}`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📄 Total Rows: ${this.stats.totalRows}`);
    console.log(`✅ Imported: ${this.stats.imported}`);
    console.log(`⏩ Skipped (existing): ${this.stats.skipped}`);
    console.log(`❌ Errors: ${this.stats.errors.length}`);
    console.log(`\n📁 FILE STATISTICS:`);
    console.log(`  📥 Downloaded: ${this.stats.filesDownloaded} new files`);
    console.log(`  ♻️  Reused: ${this.stats.filesReused} existing files`);
    console.log(`  💾 Storage saved: ~${Math.round(this.stats.filesReused * 0.1)} MB (estimated)`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  ERRORS:`);
      this.stats.errors.slice(0, 10).forEach(err => {
        console.log(`  Row ${err.row} (${err.reference}): ${err.error}`);
      });
      
      if (this.stats.errors.length > 10) {
        console.log(`  ... and ${this.stats.errors.length - 10} more errors`);
      }
    }

    // Save detailed report
    const reportPath = path.join(this.projectRoot, `import-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      duration: duration,
      stats: this.stats,
      errors: this.stats.errors
    }, null, 2));
    
    console.log(`\n💾 Detailed report saved: ${path.basename(reportPath)}`);
  }
}

// CLI usage
if (require.main === module) {
  const csvPath = process.argv[2];
  
  if (!csvPath) {
    console.log('Usage: node csv-import-app-compatible.js <csv-file>');
    console.log('Example: node csv-import-app-compatible.js products.csv');
    console.log('\nExpected CSV columns:');
    console.log('  - referenceFournisseur (required)');
    console.log('  - constructeur');
    console.log('  - categoryId');
    console.log('  - nom_fr (required)');
    console.log('  - nom_en');
    console.log('  - description_fr, description_en');
    console.log('  - ficheTechnique_fr, ficheTechnique_en');
    console.log('  - pdfBrochureUrl');
    console.log('  - imageUrl, imageUrl2, imageUrl3');
    console.log('  - status (active/inactive/discontinued)');
    console.log('  - featured (true/false)');
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  const importer = new AppCompatibleCSVImporter();
  
  // Wait for initialization then import
  setTimeout(async () => {
    try {
      await importer.importCSV(csvPath);
      console.log('\n✅ Import completed successfully!');
    } catch (error) {
      console.error('\n❌ Import failed:', error);
      process.exit(1);
    }
  }, 1000);
}

module.exports = AppCompatibleCSVImporter;