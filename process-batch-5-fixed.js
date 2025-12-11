const fs = require('fs');
const csv = require('csv-parser');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Map manufacturers to existing ones in database (smart matching)
const manufacturerMapping = {
  'RUMEX INTERNATIONAL': 'rumex',
  'RUMEX': 'rumex',
  // Add more mappings as needed
};

// Function to extract SKU/reference from product name or description
function extractReference(productName, description) {
  // Look for patterns like VRS-19, VRA-23, TR-17, etc.
  const nameMatch = productName.match(/^([A-Z]{2,3}-\d{2})/i);
  if (nameMatch) {
    return nameMatch[1].toUpperCase();
  }
  
  // Look in description for product codes
  const descMatch = description.match(/([A-Z]{2,3}-\d{2})/i);
  if (descMatch) {
    return descMatch[1].toUpperCase();
  }
  
  return null;
}

// Function to extract unique filename from URL
function extractFilename(url) {
  if (!url) return '';
  const urlParts = url.split('/');
  const filename = urlParts[urlParts.length - 1];
  // Remove query parameters if any
  return filename.split('?')[0];
}

// Read the CSV file
const csvContent = fs.readFileSync('/Users/mac/Downloads/kitmed agent/kitmed_batch_5_of_5.csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true
});

console.log(`Total records in batch: ${records.length}`);

// Process first 10 products as test batch
const testBatch = records.slice(0, 10);
const processedProducts = [];

testBatch.forEach((record, index) => {
  const manufacturer = record.constructeur || '';
  const mappedManufacturer = manufacturerMapping[manufacturer] || manufacturer.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Extract the actual reference from the product name or use the referenceFournisseur field
  let reference = record.referenceFournisseur;
  
  // If no reference provided, try to extract from product name
  if (!reference || reference.trim() === '') {
    const extracted = extractReference(record.nom_fr || '', record.description_fr || '');
    reference = extracted || `PROD-${index + 1}`;
  }
  
  // Clean up the descriptions - remove the embedded links and product codes
  let cleanDescFr = (record.description_fr || '').split('https://')[0].trim();
  let cleanDescEn = (record.description_en || '').split('https://')[0].trim();
  
  // Remove the trailing product codes from descriptions
  cleanDescFr = cleanDescFr.replace(/[a-z0-9_-]+,[\s\S]*$/i, '').trim();
  cleanDescEn = cleanDescEn.replace(/[a-z0-9_-]+,[\s\S]*$/i, '').trim();
  
  // Process images - clean up the pipe-separated list
  const imageUrls = (record.imageUrls || '').split('|').map(url => url.trim()).filter(url => url);
  
  // Take only first 5 unique images
  const uniqueImages = [...new Set(imageUrls)].slice(0, 5);
  
  // Clean up category - map to our existing categories
  let category = record.categoryId || '';
  if (category.includes('ENT')) {
    category = 'ORL'; // Map ENT to ORL (our existing category)
  } else if (category.includes('Ophthalmology')) {
    category = 'Ophtalmologie';
  }
  
  processedProducts.push({
    referenceFournisseur: reference,
    constructeur: mappedManufacturer,
    categoryId: category,
    nom_fr: record.nom_fr || '',
    nom_en: record.nom_en || '',
    description_fr: cleanDescFr,
    description_en: cleanDescEn,
    ficheTechnique_fr: '',
    ficheTechnique_en: '',
    pdfBrochureUrl: record.pdfBrochureUrl || '',
    imageUrls: uniqueImages.join(' | '),
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
const outputPath = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_5_ready_for_import.csv';
fs.writeFileSync(outputPath, outputCsv);

console.log('\n=== PROCESSING SUMMARY ===');
console.log(`Total products processed: ${processedProducts.length}`);
console.log('\nManufacturer Mapping:');
console.log('- RUMEX INTERNATIONAL → rumex (matched to existing)');
console.log('\nCategory Mapping:');
console.log('- ENT → ORL');
console.log('- Ophthalmology → Ophtalmologie');
console.log('\nOutput saved to:', outputPath);

// Display sample of processed products
console.log('\n=== SAMPLE OUTPUT (First 5 products) ===');
processedProducts.slice(0, 5).forEach((product, i) => {
  console.log(`\n${i + 1}. ${product.nom_fr}`);
  console.log(`   Reference: ${product.referenceFournisseur}`);
  console.log(`   Manufacturer: ${product.constructeur}`);
  console.log(`   Category: ${product.categoryId}`);
  console.log(`   Images: ${product.imageUrls.split(' | ').length} files`);
  console.log(`   PDF: ${product.pdfBrochureUrl ? 'Yes' : 'No'}`);
});