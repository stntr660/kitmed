const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getFileNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = path.basename(pathname);
    return filename;
  } catch (error) {
    return null;
  }
}

function generateFileHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

function checkExistingMedia(csvPath, uploadsPath = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/public/uploads/products/') {
  console.log('🔍 Checking for existing media files...');
  
  // Get all existing files
  const existingFiles = fs.readdirSync(uploadsPath);
  console.log(`📁 Found ${existingFiles.length} existing media files`);
  
  // Read CSV and extract URLs
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  
  const mediaAnalysis = {
    totalUrls: 0,
    uniqueUrls: 0,
    duplicateUrls: 0,
    existingFiles: 0,
    newFiles: 0,
    urlsToDownload: [],
    duplicatesSkipped: []
  };
  
  const seenUrls = new Set();
  const urlFileMapping = new Map();
  
  lines.slice(1).forEach((line, index) => {
    if (!line.trim()) return;
    
    const parts = line.split(',');
    const pdfUrl = parts[9]?.replace(/"/g, '').trim();
    const imageUrls = parts[10]?.replace(/"/g, '').trim();
    
    // Process PDF URL
    if (pdfUrl && pdfUrl.startsWith('http')) {
      mediaAnalysis.totalUrls++;
      const filename = getFileNameFromUrl(pdfUrl);
      
      if (filename) {
        if (seenUrls.has(pdfUrl)) {
          mediaAnalysis.duplicateUrls++;
          mediaAnalysis.duplicatesSkipped.push({
            url: pdfUrl,
            filename: filename,
            reason: 'Duplicate URL in CSV'
          });
        } else {
          seenUrls.add(pdfUrl);
          mediaAnalysis.uniqueUrls++;
          
          if (existingFiles.includes(filename)) {
            mediaAnalysis.existingFiles++;
            console.log(`✅ PDF exists: ${filename}`);
          } else {
            mediaAnalysis.newFiles++;
            mediaAnalysis.urlsToDownload.push({
              url: pdfUrl,
              filename: filename,
              type: 'pdf',
              product: `Row ${index + 2}`
            });
          }
          
          urlFileMapping.set(pdfUrl, filename);
        }
      }
    }
    
    // Process Image URLs
    if (imageUrls) {
      const urls = imageUrls.split('|').map(u => u.trim()).filter(u => u.startsWith('http'));
      
      urls.forEach(url => {
        mediaAnalysis.totalUrls++;
        const filename = getFileNameFromUrl(url);
        
        if (filename) {
          if (seenUrls.has(url)) {
            mediaAnalysis.duplicateUrls++;
            mediaAnalysis.duplicatesSkipped.push({
              url: url,
              filename: filename,
              reason: 'Duplicate URL in CSV'
            });
          } else {
            seenUrls.add(url);
            mediaAnalysis.uniqueUrls++;
            
            if (existingFiles.includes(filename)) {
              mediaAnalysis.existingFiles++;
              console.log(`✅ Image exists: ${filename}`);
            } else {
              mediaAnalysis.newFiles++;
              mediaAnalysis.urlsToDownload.push({
                url: url,
                filename: filename,
                type: 'image',
                product: `Row ${index + 2}`
              });
            }
            
            urlFileMapping.set(url, filename);
          }
        }
      });
    }
  });
  
  // Report analysis
  console.log('\n📊 MEDIA ANALYSIS RESULTS:');
  console.log(`Total URLs found in CSV: ${mediaAnalysis.totalUrls}`);
  console.log(`Unique URLs: ${mediaAnalysis.uniqueUrls}`);
  console.log(`Duplicate URLs (skipped): ${mediaAnalysis.duplicateUrls}`);
  console.log(`Files that already exist: ${mediaAnalysis.existingFiles}`);
  console.log(`New files to download: ${mediaAnalysis.newFiles}`);
  
  console.log('\n🔄 DUPLICATE ANALYSIS:');
  if (mediaAnalysis.duplicatesSkipped.length > 0) {
    console.log('Files that will be skipped due to duplication:');
    mediaAnalysis.duplicatesSkipped.forEach(item => {
      console.log(`  ⏭️  ${item.filename} - ${item.reason}`);
    });
  } else {
    console.log('✅ No duplicates found');
  }
  
  console.log('\n📥 NEW DOWNLOADS NEEDED:');
  if (mediaAnalysis.urlsToDownload.length > 0) {
    console.log(`${mediaAnalysis.urlsToDownload.length} files need to be downloaded:`);
    mediaAnalysis.urlsToDownload.slice(0, 10).forEach(item => {
      console.log(`  📄 ${item.type.toUpperCase()}: ${item.filename}`);
    });
    if (mediaAnalysis.urlsToDownload.length > 10) {
      console.log(`  ... and ${mediaAnalysis.urlsToDownload.length - 10} more`);
    }
  } else {
    console.log('🎉 All files already exist - no downloads needed!');
  }
  
  console.log('\n💾 STORAGE IMPACT:');
  console.log(`Existing files reused: ${mediaAnalysis.existingFiles}`);
  console.log(`New storage required: ${mediaAnalysis.newFiles} files`);
  console.log(`Storage efficiency: ${Math.round((mediaAnalysis.existingFiles / mediaAnalysis.uniqueUrls) * 100)}% reuse rate`);
  
  return mediaAnalysis;
}

// Run the analysis
const csvPath = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_5_FINAL.csv';
checkExistingMedia(csvPath);