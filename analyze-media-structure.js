const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Comprehensive Media Folder Analysis for CSV Import Optimization
 * 
 * This script analyzes all existing images and PDFs to:
 * 1. Catalog all existing files by type, size, and hash
 * 2. Identify file naming patterns
 * 3. Create a mapping system for efficient CSV import
 * 4. Generate statistics about current storage
 */

class MediaAnalyzer {
  constructor() {
    this.results = {
      images: [],
      pdfs: [],
      statistics: {
        totalImages: 0,
        totalPdfs: 0,
        totalSize: 0,
        fileTypes: {},
        duplicates: [],
        namingPatterns: {}
      },
      directories: {
        mainPublic: path.join(__dirname, 'public'),
        uploads: path.join(__dirname, 'public/uploads'),
        products: path.join(__dirname, 'public/uploads/products'),
        pdfs: path.join(__dirname, 'public/uploads/pdfs'),
        backup: path.join(__dirname, 'KITMED_COMPLETE_BACKUP_20251203_151543')
      }
    };
  }

  // Calculate file hash for duplicate detection
  getFileHash(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(fileBuffer).digest('hex');
    } catch (error) {
      console.log(`Error reading file ${filePath}: ${error.message}`);
      return null;
    }
  }

  // Analyze a single file
  analyzeFile(filePath, relativePath) {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath);
      const hash = this.getFileHash(filePath);

      const fileInfo = {
        fullPath: filePath,
        relativePath: relativePath,
        fileName: fileName,
        extension: ext,
        size: stats.size,
        hash: hash,
        created: stats.birthtime,
        modified: stats.mtime
      };

      // Categorize by type
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
        this.results.images.push(fileInfo);
        this.results.statistics.totalImages++;
      } else if (ext === '.pdf') {
        this.results.pdfs.push(fileInfo);
        this.results.statistics.totalPdfs++;
      }

      // Track file types
      if (!this.results.statistics.fileTypes[ext]) {
        this.results.statistics.fileTypes[ext] = 0;
      }
      this.results.statistics.fileTypes[ext]++;

      this.results.statistics.totalSize += stats.size;

      return fileInfo;
    } catch (error) {
      console.log(`Error analyzing ${filePath}: ${error.message}`);
      return null;
    }
  }

  // Recursively scan directory
  scanDirectory(dirPath, baseDir) {
    if (!fs.existsSync(dirPath)) {
      console.log(`Directory does not exist: ${dirPath}`);
      return [];
    }

    const files = [];
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        // Skip system files
        if (entry.name.startsWith('.DS_Store') || entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          files.push(...this.scanDirectory(fullPath, baseDir));
        } else {
          const fileInfo = this.analyzeFile(fullPath, relativePath);
          if (fileInfo) {
            files.push(fileInfo);
          }
        }
      }
    } catch (error) {
      console.log(`Error scanning directory ${dirPath}: ${error.message}`);
    }

    return files;
  }

  // Find duplicates based on hash
  findDuplicates() {
    const hashMap = {};
    const duplicates = [];

    [...this.results.images, ...this.results.pdfs].forEach(file => {
      if (file.hash) {
        if (!hashMap[file.hash]) {
          hashMap[file.hash] = [];
        }
        hashMap[file.hash].push(file);
      }
    });

    Object.entries(hashMap).forEach(([hash, files]) => {
      if (files.length > 1) {
        duplicates.push({
          hash: hash,
          files: files,
          count: files.length,
          size: files[0].size
        });
      }
    });

    this.results.statistics.duplicates = duplicates;
  }

  // Analyze naming patterns
  analyzeNamingPatterns() {
    const patterns = {
      productCodes: [],
      timestamps: [],
      uuids: [],
      descriptive: [],
      brochures: [],
      galleries: []
    };

    [...this.results.images, ...this.results.pdfs].forEach(file => {
      const name = file.fileName;

      // Product codes (numbers with dashes)
      if (/^\d+(-[A-Z])?(-P-\d+)?/.test(name)) {
        patterns.productCodes.push(name);
      }
      
      // Timestamps
      else if (/\d{13}-[a-f0-9]{8}/.test(name)) {
        patterns.timestamps.push(name);
      }
      
      // UUIDs
      else if (/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/.test(name)) {
        patterns.uuids.push(name);
      }
      
      // Brochures
      else if (name.includes('brochure')) {
        patterns.brochures.push(name);
      }
      
      // Gallery images
      else if (name.includes('gallery') || name.includes('secondary')) {
        patterns.galleries.push(name);
      }
      
      // Descriptive names
      else {
        patterns.descriptive.push(name);
      }
    });

    this.results.statistics.namingPatterns = patterns;
  }

  // Format size in human readable format
  formatSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Run full analysis
  async analyze() {
    console.log('🔍 Starting comprehensive media analysis...\n');

    // Scan all directories
    console.log('📁 Scanning directories...');
    
    if (fs.existsSync(this.results.directories.uploads)) {
      console.log('  - Scanning public/uploads...');
      this.scanDirectory(this.results.directories.uploads, this.results.directories.mainPublic);
    }

    if (fs.existsSync(this.results.directories.backup)) {
      console.log('  - Scanning backup folder...');
      this.scanDirectory(this.results.directories.backup, this.results.directories.backup);
    }

    // Additional scans for specific folders
    const additionalDirs = [
      path.join(__dirname, 'public/pdfs'),
      path.join(__dirname, 'public/products'),
      path.join(__dirname, 'public/images')
    ];

    additionalDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        console.log(`  - Scanning ${path.relative(__dirname, dir)}...`);
        this.scanDirectory(dir, this.results.directories.mainPublic);
      }
    });

    // Analysis
    console.log('\n🔬 Performing analysis...');
    this.findDuplicates();
    this.analyzeNamingPatterns();

    // Generate report
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 MEDIA ANALYSIS REPORT');
    console.log('========================');
    
    console.log(`\n📈 STATISTICS:`);
    console.log(`  Total Images: ${this.results.statistics.totalImages}`);
    console.log(`  Total PDFs: ${this.results.statistics.totalPdfs}`);
    console.log(`  Total Size: ${this.formatSize(this.results.statistics.totalSize)}`);
    console.log(`  Duplicates Found: ${this.results.statistics.duplicates.length}`);

    console.log(`\n📄 FILE TYPES:`);
    Object.entries(this.results.statistics.fileTypes).forEach(([ext, count]) => {
      console.log(`  ${ext}: ${count} files`);
    });

    console.log(`\n🎯 NAMING PATTERNS:`);
    Object.entries(this.results.statistics.namingPatterns).forEach(([pattern, files]) => {
      console.log(`  ${pattern}: ${files.length} files`);
    });

    if (this.results.statistics.duplicates.length > 0) {
      console.log(`\n🔄 DUPLICATES (Top 10):`);
      this.results.statistics.duplicates
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)
        .forEach(dup => {
          console.log(`  Hash: ${dup.hash.substring(0, 8)}... (${dup.count} copies, ${this.formatSize(dup.size)} each)`);
          dup.files.forEach(file => {
            console.log(`    - ${file.relativePath}`);
          });
        });
    }

    // Save detailed report
    const reportPath = path.join(__dirname, 'media-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);

    // Generate CSV mapping template
    this.generateCSVMappingTemplate();
  }

  generateCSVMappingTemplate() {
    const templatePath = path.join(__dirname, 'csv-import-template.js');
    
    const template = `/**
 * CSV Import Template with Media Optimization
 * Generated on: ${new Date().toISOString()}
 * 
 * Current Media Statistics:
 * - Images: ${this.results.statistics.totalImages}
 * - PDFs: ${this.results.statistics.totalPdfs}  
 * - Total Size: ${this.formatSize(this.results.statistics.totalSize)}
 * - Duplicates: ${this.results.statistics.duplicates.length}
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class OptimizedCSVImporter {
  constructor() {
    this.existingFiles = new Map();
    this.downloadQueue = [];
    this.mediaBasePath = path.join(__dirname, 'public/uploads');
    this.init();
  }

  // Initialize with existing file mapping
  init() {
    // Load existing file hashes for deduplication
    ${JSON.stringify(this.results.images.slice(0, 5), null, 4)} // Sample of existing images
    
    console.log('📁 Initialized with ${this.results.statistics.totalImages} existing images and ${this.results.statistics.totalPdfs} PDFs');
  }

  // Check if file already exists (by name or hash)
  fileExists(fileName) {
    const possiblePaths = [
      path.join(this.mediaBasePath, 'products', fileName),
      path.join(this.mediaBasePath, 'pdfs', fileName),
      path.join(__dirname, 'public/uploads/products', fileName)
    ];

    return possiblePaths.find(p => fs.existsSync(p));
  }

  // Process CSV with optimization
  async processCSV(csvData) {
    console.log('🚀 Starting optimized CSV import...');
    
    for (const row of csvData) {
      // Check for existing images
      const imageFiles = this.extractImageURLs(row);
      const pdfFiles = this.extractPDFURLs(row);
      
      const downloadNeeded = [];
      
      // Check each image
      for (const imageUrl of imageFiles) {
        const fileName = this.getFileNameFromURL(imageUrl);
        if (!this.fileExists(fileName)) {
          downloadNeeded.push({
            url: imageUrl,
            type: 'image',
            fileName: fileName
          });
        } else {
          console.log(\`✅ Image already exists: \${fileName}\`);
        }
      }
      
      // Check each PDF
      for (const pdfUrl of pdfFiles) {
        const fileName = this.getFileNameFromURL(pdfUrl);
        if (!this.fileExists(fileName)) {
          downloadNeeded.push({
            url: pdfUrl,
            type: 'pdf',
            fileName: fileName
          });
        } else {
          console.log(\`✅ PDF already exists: \${fileName}\`);
        }
      }
      
      this.downloadQueue.push(...downloadNeeded);
    }
    
    console.log(\`📥 Need to download \${this.downloadQueue.length} new files\`);
    console.log(\`💾 \${(${this.results.statistics.totalImages} + ${this.results.statistics.totalPdfs}) - this.downloadQueue.length} files already exist\`);
    
    // Process downloads in batches
    await this.processBatchDownloads();
  }

  extractImageURLs(row) {
    // Extract image URLs from CSV row
    const urls = [];
    
    // Common CSV fields that might contain image URLs
    ['image_url', 'primary_image', 'gallery_images', 'product_image'].forEach(field => {
      if (row[field]) {
        urls.push(...row[field].split(',').map(url => url.trim()));
      }
    });
    
    return urls.filter(url => url && this.isImageURL(url));
  }

  extractPDFURLs(row) {
    // Extract PDF URLs from CSV row
    const urls = [];
    
    ['pdf_url', 'brochure_url', 'manual_url', 'datasheet_url'].forEach(field => {
      if (row[field]) {
        urls.push(...row[field].split(',').map(url => url.trim()));
      }
    });
    
    return urls.filter(url => url && url.toLowerCase().includes('.pdf'));
  }

  isImageURL(url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  getFileNameFromURL(url) {
    return path.basename(new URL(url).pathname);
  }

  async processBatchDownloads() {
    // Implement batch download logic here
    console.log('🔄 Starting batch downloads...');
    // This would contain your actual download logic
  }
}

module.exports = OptimizedCSVImporter;
`;

    fs.writeFileSync(templatePath, template);
    console.log(`\n🛠️  CSV import template generated: ${templatePath}`);
  }
}

// Run analysis
const analyzer = new MediaAnalyzer();
analyzer.analyze().catch(console.error);