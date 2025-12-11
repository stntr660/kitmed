const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function getFileNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return path.basename(pathname).split('?')[0]; // Remove query parameters
  } catch (error) {
    return null;
  }
}

function checkMediaDuplicates(csvPath) {
  console.log('🔍 Analyzing media files for duplicates...');
  
  // Get existing files
  const uploadsPath = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/public/uploads/products/';
  const existingFiles = new Set(fs.readdirSync(uploadsPath));
  console.log(`📁 Found ${existingFiles.size} existing media files`);
  
  // Parse CSV
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`📄 Processing ${records.length} products...`);
  
  const analysis = {
    totalUrls: 0,
    pdfUrls: 0,
    imageUrls: 0,
    existingFiles: 0,
    newFiles: 0,
    duplicatesInCsv: 0,
    urlsToDownload: [],
    duplicatesFound: [],
    existingFilesReused: []
  };
  
  const seenUrls = new Set();
  const seenFilenames = new Set();
  
  records.forEach((record, index) => {
    const productRef = record.referenceFournisseur || `Product-${index + 1}`;
    
    // Check PDF
    if (record.pdfBrochureUrl && record.pdfBrochureUrl.startsWith('http')) {
      analysis.totalUrls++;
      analysis.pdfUrls++;
      
      const pdfUrl = record.pdfBrochureUrl;
      const filename = getFileNameFromUrl(pdfUrl);
      
      if (filename) {
        if (seenUrls.has(pdfUrl)) {
          analysis.duplicatesInCsv++;
          analysis.duplicatesFound.push({
            type: 'PDF',
            filename: filename,
            url: pdfUrl,
            product: productRef,
            reason: 'Duplicate URL in CSV'
          });
        } else if (seenFilenames.has(filename)) {
          analysis.duplicatesInCsv++;
          analysis.duplicatesFound.push({
            type: 'PDF',
            filename: filename,
            url: pdfUrl,
            product: productRef,
            reason: 'Duplicate filename in CSV'
          });
        } else if (existingFiles.has(filename)) {
          analysis.existingFiles++;
          analysis.existingFilesReused.push({
            type: 'PDF',
            filename: filename,
            product: productRef
          });
          seenUrls.add(pdfUrl);
          seenFilenames.add(filename);
        } else {
          analysis.newFiles++;
          analysis.urlsToDownload.push({
            type: 'PDF',
            url: pdfUrl,
            filename: filename,
            product: productRef
          });
          seenUrls.add(pdfUrl);
          seenFilenames.add(filename);
        }
      }
    }
    
    // Check Images
    if (record.imageUrls) {
      const imageUrls = record.imageUrls.split('|').map(u => u.trim()).filter(u => u.startsWith('http'));
      
      imageUrls.forEach(imageUrl => {
        analysis.totalUrls++;
        analysis.imageUrls++;
        
        const filename = getFileNameFromUrl(imageUrl);
        
        if (filename) {
          if (seenUrls.has(imageUrl)) {
            analysis.duplicatesInCsv++;
            analysis.duplicatesFound.push({
              type: 'Image',
              filename: filename,
              url: imageUrl,
              product: productRef,
              reason: 'Duplicate URL in CSV'
            });
          } else if (seenFilenames.has(filename)) {
            analysis.duplicatesInCsv++;
            analysis.duplicatesFound.push({
              type: 'Image',
              filename: filename,
              url: imageUrl,
              product: productRef,
              reason: 'Duplicate filename in CSV'
            });
          } else if (existingFiles.has(filename)) {
            analysis.existingFiles++;
            analysis.existingFilesReused.push({
              type: 'Image',
              filename: filename,
              product: productRef
            });
            seenUrls.add(imageUrl);
            seenFilenames.add(filename);
          } else {
            analysis.newFiles++;
            analysis.urlsToDownload.push({
              type: 'Image',
              url: imageUrl,
              filename: filename,
              product: productRef
            });
            seenUrls.add(imageUrl);
            seenFilenames.add(filename);
          }
        }
      });
    }
  });
  
  // Report Results
  console.log('\n📊 MEDIA ANALYSIS RESULTS:');
  console.log(`📄 Total URLs: ${analysis.totalUrls} (${analysis.pdfUrls} PDFs, ${analysis.imageUrls} images)`);
  console.log(`✅ Files already exist: ${analysis.existingFiles}`);
  console.log(`📥 New files to download: ${analysis.newFiles}`);
  console.log(`🔄 Duplicates in CSV: ${analysis.duplicatesInCsv}`);
  
  if (analysis.existingFilesReused.length > 0) {
    console.log('\n💾 EXISTING FILES THAT WILL BE REUSED:');
    analysis.existingFilesReused.slice(0, 10).forEach(item => {
      console.log(`  ✅ ${item.type}: ${item.filename} (${item.product})`);
    });
    if (analysis.existingFilesReused.length > 10) {
      console.log(`  ... and ${analysis.existingFilesReused.length - 10} more existing files`);
    }
  }
  
  if (analysis.duplicatesFound.length > 0) {
    console.log('\n🔄 DUPLICATES DETECTED (WILL BE SKIPPED):');
    analysis.duplicatesFound.forEach(item => {
      console.log(`  ⏭️  ${item.type}: ${item.filename} (${item.product}) - ${item.reason}`);
    });
  }
  
  if (analysis.urlsToDownload.length > 0) {
    console.log('\n📥 NEW FILES TO DOWNLOAD:');
    analysis.urlsToDownload.slice(0, 10).forEach(item => {
      console.log(`  📄 ${item.type}: ${item.filename} (${item.product})`);
    });
    if (analysis.urlsToDownload.length > 10) {
      console.log(`  ... and ${analysis.urlsToDownload.length - 10} more new files`);
    }
  }
  
  console.log('\n💡 STORAGE EFFICIENCY:');
  const totalValidFiles = analysis.existingFiles + analysis.newFiles;
  const reuseRate = totalValidFiles > 0 ? Math.round((analysis.existingFiles / totalValidFiles) * 100) : 0;
  console.log(`Storage reuse rate: ${reuseRate}% (${analysis.existingFiles}/${totalValidFiles} files)`);
  console.log(`Bandwidth saved: ${analysis.existingFiles} file downloads avoided`);
  console.log(`Duplicates avoided: ${analysis.duplicatesInCsv} redundant downloads`);
  
  return analysis;
}

// Run the check
const csvPath = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_5_FINAL.csv';
try {
  const analysis = checkMediaDuplicates(csvPath);
  
  console.log('\n🚀 READY FOR UPLOAD:');
  console.log('✅ Duplicate detection complete');
  console.log('✅ Existing files will be reused');
  console.log('✅ Only new files will be downloaded');
  console.log('\nProceed with CSV upload to admin panel!');
} catch (error) {
  console.error('❌ Error analyzing media:', error);
}