const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Import our category strategy
const categoryStrategy = {
  // === LEGITIMATE CATEGORIES ===
  'ENT → Examination Devices': 'surgery-instruments',
  'Ophthalmology → Treatment Devices': 'ophthalmology-surgical', 
  'Ophthalmology → Surgical Instruments': 'ophthalmology-surgical',
  'Ophthalmology → Diagnostic Equipment': 'ophthalmology-diagnostic',
  'Medical Equipment': 'surgery-instruments',
  'Pain Management → Topical Treatments': 'surgery-instruments',
  
  // === DATA ERRORS (SKUs in category field) - map to safe defaults ===
  'SCC14S': 'surgery-instruments',        
  'SCC14SP': 'surgery-instruments',
  'SCC22': 'surgery-instruments', 
  'SCC22P': 'surgery-instruments',
  'SCU26': 'surgery-instruments',
  'SCU26P': 'surgery-instruments',
  'SFIRR21': 'surgery-instruments',
  'SSL14S': 'surgery-instruments',
  'SSL14SP': 'surgery-instruments', 
  'SSL22': 'surgery-instruments',
  'SSL22P': 'surgery-instruments',
  'SST30': 'surgery-instruments',
  'SST30P': 'surgery-instruments',
  'SVR23': 'surgery-instruments',
  'SVR21A': 'surgery-instruments',
  'SVR21AP': 'surgery-instruments',
  'SVR23P': 'surgery-instruments',
  'SURGICON AG': 'surgery-instruments',  
};

// Smart manufacturer mapping
const manufacturerMapping = {
  'RUMEX INTERNATIONAL': 'rumex',
  'RUMEX': 'rumex',
  'SURGICON AG': 'surgicon-ag', // Already exists in our DB
  'URSAPHARM': 'ursapharmm', // Note: double 'm' in DB
  'Moria Surgical': 'moria', // Moria Surgical products
  'MORIA': 'moria',
};

function extractReference(productName, description, index) {
  // Look for patterns like VRS-19, VRA-23, TR-17, SP-15, SL-32 etc.
  const nameMatch = productName.match(/^([A-Z]{2,3}-\d{2,3})/i);
  if (nameMatch) {
    return nameMatch[1].toUpperCase();
  }
  
  // Look in description for product codes
  const descMatch = description.match(/([A-Z]{2,3}-\d{2,3})/i);
  if (descMatch) {
    return descMatch[1].toUpperCase();
  }
  
  // Last resort: generate from product name
  const cleanName = productName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
  return cleanName || `PROD-${index + 1}`;
}

function cleanDescription(desc) {
  if (!desc) return '';
  
  // Remove URLs and everything after them
  let cleaned = desc.split('https://')[0].trim();
  
  // Remove trailing product codes and related items
  cleaned = cleaned.replace(/[a-z0-9_-]+,[\s\S]*$/i, '').trim();
  
  // Clean up semicolons and make more readable
  cleaned = cleaned.replace(/;/g, '.').replace(/\.\s*\./g, '.').trim();
  
  // Remove "Note:" sections that are incomplete
  cleaned = cleaned.replace(/Note:\s*[^.]*$/i, '').trim();
  
  return cleaned;
}

function processImages(imageUrls) {
  if (!imageUrls) return '';
  
  const urls = imageUrls.split('|').map(url => url.trim()).filter(url => url);
  const uniqueUrls = [...new Set(urls)];
  
  return uniqueUrls.slice(0, 5).join(' | ');
}

function determineCategoryFromProduct(productName, description, originalCategory) {
  // If we have a mapping for the original category, use it
  if (categoryStrategy[originalCategory]) {
    return categoryStrategy[originalCategory];
  }
  
  // Smart category detection based on product content
  const text = (productName + ' ' + description).toLowerCase();
  
  if (text.includes('mvr') || text.includes('side-port') || text.includes('phaco') || 
      text.includes('lens') || text.includes('intraocular')) {
    return 'ophthalmology-surgical';
  }
  
  if (text.includes('eye') || text.includes('retina') || text.includes('corneal') ||
      text.includes('ophthalmology') || text.includes('ophthalmic')) {
    return 'ophthalmology-surgical';
  }
  
  if (text.includes('pain') || text.includes('topical') || text.includes('cream') ||
      text.includes('ointment') || text.includes('gel')) {
    return 'surgery-instruments'; // Safe fallback since pharmaceutique might not exist
  }
  
  // Default fallback
  return 'surgery-instruments';
}

async function processBatch(inputPath, outputPath, maxProducts = null) {
  try {
    console.log(`📁 Processing: ${inputPath}`);
    
    // Read CSV
    const csvContent = fs.readFileSync(inputPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📊 Total records: ${records.length}`);
    
    // Process records (limit if specified)
    const recordsToProcess = maxProducts ? records.slice(0, maxProducts) : records;
    const processedProducts = [];
    
    recordsToProcess.forEach((record, index) => {
      const manufacturer = record.constructeur || '';
      const mappedManufacturer = manufacturerMapping[manufacturer] || 
                                 manufacturer.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Extract or generate reference
      const reference = record.referenceFournisseur || 
                       extractReference(record.nom_fr || '', record.description_fr || '', index);
      
      // Clean descriptions
      const cleanDescFr = cleanDescription(record.description_fr);
      const cleanDescEn = cleanDescription(record.description_en);
      
      // Process images
      const imageUrls = processImages(record.imageUrls);
      
      // Smart category mapping
      const categoryId = determineCategoryFromProduct(
        record.nom_fr || '', 
        cleanDescFr, 
        record.categoryId || ''
      );
      
      processedProducts.push({
        referenceFournisseur: reference,
        constructeur: mappedManufacturer,
        categoryId: categoryId,
        nom_fr: record.nom_fr || '',
        nom_en: record.nom_en || '',
        description_fr: cleanDescFr,
        description_en: cleanDescEn,
        ficheTechnique_fr: '',
        ficheTechnique_en: '',
        pdfBrochureUrl: record.pdfBrochureUrl || '',
        imageUrls: imageUrls,
        status: 'active',
        featured: 'false'
      });
    });
    
    // Generate CSV
    const outputCsv = stringify(processedProducts, {
      header: true,
      columns: [
        'referenceFournisseur', 'constructeur', 'categoryId', 'nom_fr', 'nom_en',
        'description_fr', 'description_en', 'ficheTechnique_fr', 'ficheTechnique_en',
        'pdfBrochureUrl', 'imageUrls', 'status', 'featured'
      ]
    });
    
    fs.writeFileSync(outputPath, outputCsv);
    
    // Report results
    console.log(`\n✅ Processing complete!`);
    console.log(`📦 Products processed: ${processedProducts.length}`);
    console.log(`💾 Output saved: ${outputPath}`);
    
    // Category statistics
    const categoryStats = {};
    processedProducts.forEach(p => {
      categoryStats[p.categoryId] = (categoryStats[p.categoryId] || 0) + 1;
    });
    
    console.log(`\n📊 Category Distribution:`);
    Object.entries(categoryStats).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} products`);
    });
    
    // Manufacturer statistics  
    const mfgStats = {};
    processedProducts.forEach(p => {
      mfgStats[p.constructeur] = (mfgStats[p.constructeur] || 0) + 1;
    });
    
    console.log(`\n🏭 Manufacturer Distribution:`);
    Object.entries(mfgStats).forEach(([mfg, count]) => {
      console.log(`  ${mfg}: ${count} products`);
    });
    
    // Sample products
    console.log(`\n📋 Sample Products (first 3):`);
    processedProducts.slice(0, 3).forEach((product, i) => {
      console.log(`  ${i + 1}. ${product.nom_fr.substring(0, 50)}...`);
      console.log(`     REF: ${product.referenceFournisseur} | MFG: ${product.constructeur} | CAT: ${product.categoryId}`);
    });
    
    console.log(`\n🚀 Ready for upload!`);
    return outputPath;
    
  } catch (error) {
    console.error('❌ Processing error:', error);
    throw error;
  }
}

// Process the batch
const inputFile = '/Users/mac/Downloads/kitmed agent/kitmed_batch_1_of_5.csv';
const outputFile = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_1_FINAL.csv';

// Process full batch (remove limit to process all 180+ products)
processBatch(inputFile, outputFile)
  .then(() => {
    console.log('\n🎉 Full batch ready for import!');
    console.log('All products processed and ready for upload');
  })
  .catch(error => {
    console.error('Failed to process batch:', error);
    process.exit(1);
  });