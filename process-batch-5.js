const fs = require('fs');
const csv = require('csv-parser');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const crypto = require('crypto');

// Map manufacturers to existing ones in database (smart matching)
const manufacturerMapping = {
  'RUMEX INTERNATIONAL': 'rumex',
  'RUMEX': 'rumex',
  // Add more mappings as needed
};

// Function to generate SKU from product name
function generateSKU(productName, manufacturer, variant = '') {
  const cleanName = productName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
  const mfgCode = manufacturer.substring(0, 3).toUpperCase();
  const variantCode = variant ? '-' + variant.substring(0, 3).toUpperCase() : '';
  return `${mfgCode}-${cleanName}${variantCode}`;
}

// Function to extract unique filename from URL
function extractFilename(url) {
  if (!url) return '';
  const urlParts = url.split('/');
  const filename = urlParts[urlParts.length - 1];
  // Remove query parameters if any
  return filename.split('?')[0];
}

// Function to check if media already exists
function mediaExists(filename, existingFiles) {
  return existingFiles.includes(filename);
}

// Read the CSV file
const csvContent = fs.readFileSync('/Users/mac/Downloads/kitmed agent/kitmed_batch_5_of_5.csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true
});

console.log(`Total records in batch: ${records.length}`);

// Get existing media files (simulate check - in reality, would check actual filesystem)
const existingMediaFiles = [];

// Process first 10 products as test batch
const testBatch = records.slice(0, 10);
const processedProducts = [];
const skuGroups = {};

// Group products by potential SKU variants
testBatch.forEach((record, index) => {
  const manufacturer = record.constructeur || '';
  const mappedManufacturer = manufacturerMapping[manufacturer] || manufacturer.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Extract base product name (remove size/variant info)
  const productNameFr = record.nom_fr || '';
  const productNameEn = record.nom_en || '';
  
  // Identify if this is a variant (contains size info like "19 Ga", "20 Ga", etc.)
  const variantMatch = productNameFr.match(/(\d+)\s*(Ga|mm|°)/i);
  const variant = variantMatch ? variantMatch[0] : '';
  
  // Create base SKU for grouping
  const baseName = productNameFr.replace(/\d+\s*(Ga|mm|°).*/i, '').trim();
  const baseKey = `${manufacturer}_${baseName}`;
  
  if (!skuGroups[baseKey]) {
    skuGroups[baseKey] = {
      baseName: baseName,
      manufacturer: manufacturer,
      mappedManufacturer: mappedManufacturer,
      category: record.categoryId,
      variants: []
    };
  }
  
  // Process images - skip duplicates
  const imageUrls = (record.imageUrls || '').split('|').map(url => url.trim()).filter(url => url);
  const uniqueImages = [];
  const processedImageFiles = [];
  
  imageUrls.forEach(url => {
    const filename = extractFilename(url);
    if (filename && !mediaExists(filename, existingMediaFiles) && !processedImageFiles.includes(filename)) {
      uniqueImages.push(url);
      processedImageFiles.push(filename);
    }
  });
  
  // Process PDF - skip if duplicate
  const pdfUrl = record.pdfBrochureUrl;
  let uniquePdfUrl = '';
  if (pdfUrl) {
    const pdfFilename = extractFilename(pdfUrl);
    if (!mediaExists(pdfFilename, existingMediaFiles)) {
      uniquePdfUrl = pdfUrl;
    }
  }
  
  skuGroups[baseKey].variants.push({
    variant: variant,
    nom_fr: productNameFr,
    nom_en: productNameEn,
    description_fr: record.description_fr,
    description_en: record.description_en,
    images: uniqueImages,
    pdf: uniquePdfUrl,
    originalIndex: index
  });
});

// Convert grouped products to final format
Object.keys(skuGroups).forEach(key => {
  const group = skuGroups[key];
  
  // Merge variants into single product
  const mainVariant = group.variants[0]; // Use first variant as main
  const additionalVariants = group.variants.slice(1);
  
  // Generate unique SKU
  const sku = generateSKU(group.baseName, group.manufacturer);
  
  // Collect all unique images
  const allImages = [];
  const seenImages = new Set();
  group.variants.forEach(v => {
    v.images.forEach(img => {
      if (!seenImages.has(img)) {
        allImages.push(img);
        seenImages.add(img);
      }
    });
  });
  
  // Use first non-empty PDF
  const pdfUrl = group.variants.find(v => v.pdf)?.pdf || '';
  
  // Create variant descriptions
  let variantInfo = '';
  if (additionalVariants.length > 0) {
    variantInfo = '\n\nVariantes disponibles:\n';
    group.variants.forEach(v => {
      if (v.variant) {
        variantInfo += `- ${v.variant}\n`;
      }
    });
  }
  
  processedProducts.push({
    referenceFournisseur: sku,
    constructeur: group.mappedManufacturer,
    categoryId: group.category || 'Ophthalmology → Treatment Devices',
    nom_fr: mainVariant.nom_fr,
    nom_en: mainVariant.nom_en,
    description_fr: (mainVariant.description_fr || '') + variantInfo,
    description_en: (mainVariant.description_en || '') + variantInfo,
    ficheTechnique_fr: '',
    ficheTechnique_en: '',
    pdfBrochureUrl: pdfUrl,
    imageUrls: allImages.slice(0, 5).join(' | '), // Limit to 5 images
    status: 'active',
    featured: 'false'
  });
});

// Generate the CSV output
const outputCsv = stringify(processedProducts, {
  header: true,
  columns: [
    'referenceFournisseur',
    'constructeur',
    'categoryId',
    'nom_fr',
    'nom_en',
    'description_fr',
    'description_en',
    'ficheTechnique_fr',
    'ficheTechnique_en',
    'pdfBrochureUrl',
    'imageUrls',
    'status',
    'featured'
  ]
});

// Save the processed CSV
const outputPath = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_5_processed_test.csv';
fs.writeFileSync(outputPath, outputCsv);

console.log('\n=== PROCESSING SUMMARY ===');
console.log(`Original products: ${testBatch.length}`);
console.log(`Consolidated products: ${processedProducts.length}`);
console.log(`Products merged: ${testBatch.length - processedProducts.length}`);
console.log('\nManufacturer Mapping:');
console.log('- RUMEX INTERNATIONAL → rumex (matched to existing)');
console.log('\nOutput saved to:', outputPath);

// Display sample of processed products
console.log('\n=== SAMPLE OUTPUT (First 3 products) ===');
processedProducts.slice(0, 3).forEach((product, i) => {
  console.log(`\n${i + 1}. ${product.nom_fr}`);
  console.log(`   SKU: ${product.referenceFournisseur}`);
  console.log(`   Manufacturer: ${product.constructeur}`);
  console.log(`   Images: ${product.imageUrls.split(' | ').length} unique files`);
  console.log(`   PDF: ${product.pdfBrochureUrl ? 'Yes' : 'No'}`);
});