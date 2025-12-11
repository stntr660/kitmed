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

// Map categories to our database category IDs
const categoryMapping = {
  'ENT → Examination Devices': 'surgery-instruments', // Surgical instruments
  'ENT → EXAMINATION DEVICES': 'surgery-instruments',
  'ENT': 'surgery-instruments',
  'Ophthalmology → Treatment Devices': 'ophthalmology-surgical', // Ophthalmology surgical equipment
  'OPHTHALMOLOGY → TREATMENT DEVICES': 'ophthalmology-surgical',
  'Ophthalmology': 'ophthalmology-surgical',
  'Surgery': 'surgery-instruments',
  'Surgical Instruments': 'surgery-instruments'
};

// Function to extract SKU/reference from product name or description
function extractReference(productName, description) {
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
  
  return null;
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
  
  // Extract the actual reference from the product name
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
  
  // Clean up semicolons and make descriptions more readable
  cleanDescFr = cleanDescFr.replace(/;/g, '.').trim();
  cleanDescEn = cleanDescEn.replace(/;/g, '.').trim();
  
  // Process images - clean up the pipe-separated list
  const imageUrls = (record.imageUrls || '').split('|').map(url => url.trim()).filter(url => url);
  
  // Take only first 5 unique images
  const uniqueImages = [...new Set(imageUrls)].slice(0, 5);
  
  // Map category to our database categories
  let categoryId = categoryMapping[record.categoryId] || '';
  
  // If no category mapping found, try to guess from product name
  if (!categoryId) {
    const productName = record.nom_fr || '';
    if (productName.toLowerCase().includes('couteau') || productName.toLowerCase().includes('knife')) {
      if (productName.toLowerCase().includes('mvr') || productName.toLowerCase().includes('side-port')) {
        categoryId = 'ophthalmology-surgical'; // Eye surgery instruments
      } else {
        categoryId = 'surgery-instruments'; // General surgical instruments
      }
    } else {
      categoryId = 'surgery-instruments'; // Default fallback
    }
  }
  
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
const outputPath = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_5_final.csv';
fs.writeFileSync(outputPath, outputCsv);

console.log('\n=== PROCESSING SUMMARY ===');
console.log(`Total products processed: ${processedProducts.length}`);
console.log('\nManufacturer Mapping:');
console.log('- RUMEX INTERNATIONAL → rumex (matched to existing)');
console.log('\nCategory Mapping:');
console.log('- ENT → surgery-instruments');
console.log('- Ophthalmology → ophthalmology-surgical');
console.log('\nOutput saved to:', outputPath);

console.log('\n=== CATEGORY ASSIGNMENTS ===');
const categoryStats = {};
processedProducts.forEach(p => {
  categoryStats[p.categoryId] = (categoryStats[p.categoryId] || 0) + 1;
});
Object.keys(categoryStats).forEach(cat => {
  console.log(`${cat}: ${categoryStats[cat]} products`);
});

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

console.log('\n=== READY FOR UPLOAD ===');
console.log('File ready for import via admin panel or API');
console.log('Next steps:');
console.log('1. Upload CSV via admin interface');
console.log('2. Media files will be downloaded automatically during import');
console.log('3. Products will be created with proper manufacturer and category mapping');