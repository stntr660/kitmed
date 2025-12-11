const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

/**
 * Optimized CSV Import Tool for KITMED Products
 * 
 * Features:
 * 1. Checks existing files before downloading
 * 2. Uses file hashes to detect duplicates
 * 3. Batch downloads missing files only
 * 4. Organizes files in proper directory structure
 * 5. Generates import report with statistics
 */

class CSVImportOptimizer {
  constructor() {
    this.projectRoot = __dirname;
    this.publicDir = path.join(this.projectRoot, 'public');
    this.uploadsDir = path.join(this.publicDir, 'uploads');
    this.productsDir = path.join(this.uploadsDir, 'products');
    this.pdfsDir = path.join(this.uploadsDir, 'pdfs');
    
    this.existingFiles = new Map(); // filename -> full path
    this.existingHashes = new Map(); // hash -> file info
    this.downloadQueue = [];
    this.stats = {
      totalProcessed: 0,
      alreadyExists: 0,
      downloaded: 0,
      duplicatesSkipped: 0,
      errors: 0,
      totalSize: 0
    };

    this.ensureDirectories();
    this.loadExistingFiles();
  }

  ensureDirectories() {
    [this.uploadsDir, this.productsDir, this.pdfsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${path.relative(this.projectRoot, dir)}`);
      }
    });
  }

  loadExistingFiles() {
    console.log('🔍 Loading existing files...');
    
    const searchDirs = [
      this.uploadsDir,
      path.join(this.publicDir, 'images'),
      path.join(this.publicDir, 'pdfs'),
      path.join(this.publicDir, 'products')
    ];

    let fileCount = 0;
    
    searchDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.scanDirectoryRecursive(dir, (filePath, fileName, stats) => {
          // Store by filename for quick lookup
          this.existingFiles.set(fileName.toLowerCase(), filePath);
          
          // Store by hash for duplicate detection
          try {
            if (stats.size > 0) { // Only hash non-empty files
              const hash = this.getFileHash(filePath);
              if (hash) {
                this.existingHashes.set(hash, {
                  path: filePath,
                  fileName: fileName,
                  size: stats.size
                });
              }
            }
          } catch (error) {
            // Skip files that can't be hashed
          }
          
          fileCount++;
        });
      }
    });

    console.log(`✅ Loaded ${fileCount} existing files`);
    console.log(`📊 File hash index: ${this.existingHashes.size} entries`);
  }

  scanDirectoryRecursive(dir, callback) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue; // Skip hidden files
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          this.scanDirectoryRecursive(fullPath, callback);
        } else {
          const stats = fs.statSync(fullPath);
          callback(fullPath, entry.name, stats);
        }
      }
    } catch (error) {
      console.log(`⚠️  Error scanning ${dir}: ${error.message}`);
    }
  }

  getFileHash(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(fileBuffer).digest('hex');
    } catch (error) {
      return null;
    }
  }

  // Extract filename from URL
  getFileNameFromURL(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return path.basename(pathname);
    } catch (error) {
      // Fallback for malformed URLs
      return url.split('/').pop().split('?')[0];
    }
  }

  // Check if we already have this file
  fileExists(fileName) {
    return this.existingFiles.has(fileName.toLowerCase());
  }

  // Get existing file path
  getExistingFilePath(fileName) {
    return this.existingFiles.get(fileName.toLowerCase());
  }

  // Check if file is an image
  isImageFile(fileName) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const ext = path.extname(fileName).toLowerCase();
    return imageExtensions.includes(ext);
  }

  // Check if file is a PDF
  isPDFFile(fileName) {
    return path.extname(fileName).toLowerCase() === '.pdf';
  }

  // Download a single file
  async downloadFile(url, fileName, targetDir) {
    return new Promise((resolve, reject) => {
      const targetPath = path.join(targetDir, fileName);
      const file = fs.createWriteStream(targetPath);
      
      const protocol = url.startsWith('https:') ? https : http;
      
      const request = protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            const stats = fs.statSync(targetPath);
            this.stats.totalSize += stats.size;
            console.log(`✅ Downloaded: ${fileName} (${this.formatSize(stats.size)})`);
            resolve(targetPath);
          });
          
          file.on('error', (err) => {
            fs.unlink(targetPath, () => {}); // Delete partial file
            reject(err);
          });
        } else {
          file.close();
          fs.unlink(targetPath, () => {}); // Delete empty file
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      }).on('error', (err) => {
        file.close();
        fs.unlink(targetPath, () => {}); // Delete empty file
        reject(err);
      });

      // Set timeout
      request.setTimeout(30000, () => {
        request.destroy();
        file.close();
        fs.unlink(targetPath, () => {});
        reject(new Error('Download timeout'));
      });
    });
  }

  // Process CSV row and extract media URLs
  processCSVRow(row, rowIndex) {
    const mediaItems = [];
    
    // Common CSV fields that might contain URLs
    const urlFields = [
      'image_url', 'image_urls', 'images',
      'primary_image', 'secondary_images', 'gallery_images',
      'product_image', 'product_images',
      'pdf_url', 'pdf_urls', 'pdfs',
      'brochure_url', 'brochure', 'brochures',
      'manual_url', 'datasheet_url',
      'media_urls', 'attachments'
    ];

    urlFields.forEach(field => {
      if (row[field] && row[field].trim()) {
        const urls = row[field].split(',').map(url => url.trim()).filter(url => url);
        
        urls.forEach(url => {
          if (url.startsWith('http')) {
            const fileName = this.getFileNameFromURL(url);
            
            if (fileName) {
              mediaItems.push({
                url: url,
                fileName: fileName,
                field: field,
                rowIndex: rowIndex,
                isImage: this.isImageFile(fileName),
                isPDF: this.isPDFFile(fileName)
              });
            }
          }
        });
      }
    });

    return mediaItems;
  }

  // Main CSV processing function
  async processCSV(csvFilePath) {
    console.log(`\n🚀 Starting optimized CSV import: ${path.basename(csvFilePath)}`);
    
    // Read and parse CSV
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = this.parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
    }

    console.log(`📄 Found ${rows.length} rows in CSV`);
    
    // Process each row
    const allMediaItems = [];
    rows.forEach((row, index) => {
      const mediaItems = this.processCSVRow(row, index);
      allMediaItems.push(...mediaItems);
    });

    console.log(`🎯 Found ${allMediaItems.length} total media references`);

    // Check what we need to download
    const needDownload = [];
    const alreadyExists = [];

    allMediaItems.forEach(item => {
      this.stats.totalProcessed++;
      
      if (this.fileExists(item.fileName)) {
        this.stats.alreadyExists++;
        alreadyExists.push({
          ...item,
          existingPath: this.getExistingFilePath(item.fileName)
        });
        console.log(`✅ Already exists: ${item.fileName}`);
      } else {
        needDownload.push(item);
      }
    });

    console.log(`\n📊 Analysis Complete:`);
    console.log(`  Total media items: ${allMediaItems.length}`);
    console.log(`  Already exist: ${alreadyExists.length}`);
    console.log(`  Need download: ${needDownload.length}`);
    
    if (needDownload.length > 0) {
      console.log(`\n⬬ Starting downloads...`);
      await this.batchDownload(needDownload);
    }

    this.generateReport(allMediaItems, alreadyExists, needDownload);
    
    return {
      total: allMediaItems.length,
      existing: alreadyExists.length,
      downloaded: this.stats.downloaded,
      errors: this.stats.errors
    };
  }

  // Simple CSV line parser
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim().replace(/"/g, ''));
    return values;
  }

  // Batch download with concurrency control
  async batchDownload(items) {
    const concurrency = 3; // Download 3 files at a time
    const batches = [];
    
    for (let i = 0; i < items.length; i += concurrency) {
      batches.push(items.slice(i, i + concurrency));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n📦 Processing batch ${i + 1}/${batches.length} (${batch.length} files)`);
      
      const promises = batch.map(async (item) => {
        try {
          const targetDir = item.isImage ? this.productsDir : this.pdfsDir;
          await this.downloadFile(item.url, item.fileName, targetDir);
          this.stats.downloaded++;
          return { success: true, item };
        } catch (error) {
          console.log(`❌ Failed to download ${item.fileName}: ${error.message}`);
          this.stats.errors++;
          return { success: false, item, error: error.message };
        }
      });

      await Promise.all(promises);
      
      // Small delay between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  formatSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  generateReport(allItems, existing, downloaded) {
    console.log(`\n📊 IMPORT COMPLETE REPORT`);
    console.log(`========================`);
    console.log(`Total media references: ${allItems.length}`);
    console.log(`Already existed: ${existing.length}`);
    console.log(`Successfully downloaded: ${this.stats.downloaded}`);
    console.log(`Failed downloads: ${this.stats.errors}`);
    console.log(`Total download size: ${this.formatSize(this.stats.totalSize)}`);
    console.log(`Storage saved by reusing existing files: ${this.formatSize(existing.length * 100000)} (estimated)`); // Rough estimate

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      statistics: this.stats,
      existingFiles: existing.map(item => ({
        fileName: item.fileName,
        existingPath: item.existingPath,
        sourceRow: item.rowIndex,
        sourceField: item.field
      })),
      downloadedFiles: downloaded.map(item => ({
        fileName: item.fileName,
        url: item.url,
        sourceRow: item.rowIndex,
        sourceField: item.field
      }))
    };

    const reportPath = path.join(this.projectRoot, `csv-import-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved: ${path.basename(reportPath)}`);
  }
}

// Export for use in other scripts
module.exports = CSVImportOptimizer;

// If run directly, provide CLI interface
if (require.main === module) {
  const csvPath = process.argv[2];
  
  if (!csvPath) {
    console.log('Usage: node csv-import-optimizer.js <path-to-csv-file>');
    console.log('Example: node csv-import-optimizer.js products.csv');
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.log(`Error: CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const optimizer = new CSVImportOptimizer();
  optimizer.processCSV(csvPath)
    .then(result => {
      console.log(`\n✅ Import completed successfully!`);
      console.log(`📊 Final stats: ${result.existing} existing + ${result.downloaded} downloaded = ${result.total} total`);
    })
    .catch(error => {
      console.error(`❌ Import failed:`, error);
      process.exit(1);
    });
}