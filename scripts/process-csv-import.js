const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createWriteStream, createReadStream } = require('fs');
const { randomUUID } = require('crypto');

// Function to download a file from URL
async function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    if (!url || url === '') {
      resolve(null);
      return;
    }

    try {
      const protocol = url.startsWith('https:') ? https : http;
      const filePath = path.join(__dirname, '../public/uploads/products', filename);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const file = createWriteStream(filePath);
      
      protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(`/uploads/products/${filename}`);
          });
        } else {
          console.warn(`Failed to download ${url} - Status: ${response.statusCode}`);
          file.close();
          fs.unlink(filePath, () => {}); // Delete the file
          resolve(null);
        }
      }).on('error', (err) => {
        console.warn(`Error downloading ${url}:`, err.message);
        file.close();
        fs.unlink(filePath, () => {}); // Delete the file
        resolve(null);
      });
    } catch (error) {
      console.warn(`Error processing ${url}:`, error.message);
      resolve(null);
    }
  });
}

// Function to get file extension from URL
function getFileExtension(url) {
  if (!url) return '';
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    return ext || '.jpg'; // Default to .jpg for images
  } catch {
    return '.jpg';
  }
}

// Function to process CSV data
async function processCSVData() {
  console.log('Starting CSV processing...');
  
  // Original CSV data
  const csvData = [
    {
      Manufacturer: 'ESENSA',
      'Product name': 'AQUA ICE COMPLEX GEL 100ML',
      SKU: '8606011740809',
      Description: 'Helps alleviate problems caused by crushing, sprains, and sports injuries. Provides cooling, anti-inflammatory, and relief for muscle/joint stiffness and tension.',
      'Description FR': '',
      'Fiche Technique': 'Test test',
      'Brochure PDF': 'https://enterprisersproject.com/sites/default/files/what_is_digital_transformation_2020.pdf',
      'Primary Image': 'https://www.esensa.rs/static/uploads/aqua-ice-comlex-gel-600x600.jpg',
      'Secondary Images': 'https://www.esensa.rs/static/uploads/melatosan-melatonin-kapi-600x600.jpg',
      'Secondary Image 2': 'https://www.esensa.rs/en/proizvodi/aqua-ice-complex-roll-2/',
      'Secondary Image 3': 'https://regensight.com/wp-content/uploads/2021/07/C4V-1.png',
      'Secondary Image 4': 'https://regensight.com/wp-content/uploads/2021/07/RitSight-confezione-scaled.jpg'
    },
    {
      Manufacturer: 'ESENSA',
      'Product name': 'Melatosan melatonin oral drops',
      SKU: '19037',
      Description: 'Contains 1 mg of melatonin in the daily dose (2 drops). Reduces time to sleep onset, reduces awakenings, and improves overall sleep quality. Fast-acting.',
      'Description FR': '',
      'Fiche Technique': 'test 1',
      'Brochure PDF': 'https://pdf.sciencedirectassets.com/271674/1-s2.0-S0963868719X00037/1-s2.0-S0963868717302196/am.pdf',
      'Primary Image': 'https://www.esensa.rs/static/uploads/melatosan-melatonin-kapi-600x600.jpg',
      'Secondary Images': 'https://www.esensa.rs/static/uploads/melatosan-melatonin-kapi-600x600.jpg',
      'Secondary Image 2': 'https://www.esensa.rs/en/proizvodi/aqua-ice-complex-roll-2/',
      'Secondary Image 3': 'https://regensight.com/wp-content/uploads/2021/07/C4V-1.png',
      'Secondary Image 4': 'https://regensight.com/wp-content/uploads/2021/07/RitSight-confezione-scaled.jpg'
    }
  ];

  const processedData = [];

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    console.log(`Processing product ${i + 1}: ${row['Product name']}`);

    // Generate unique identifiers
    const productId = randomUUID();
    const slug = row['Product name']
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Download PDF brochure
    let brochureUrl = null;
    if (row['Brochure PDF']) {
      const pdfFilename = `${productId}-brochure.pdf`;
      brochureUrl = await downloadFile(row['Brochure PDF'], pdfFilename);
      console.log(`PDF downloaded: ${brochureUrl || 'Failed'}`);
    }

    // Download primary image
    let primaryImageUrl = null;
    if (row['Primary Image']) {
      const ext = getFileExtension(row['Primary Image']);
      const imageFilename = `${productId}-primary${ext}`;
      primaryImageUrl = await downloadFile(row['Primary Image'], imageFilename);
      console.log(`Primary image downloaded: ${primaryImageUrl || 'Failed'}`);
    }

    // Download secondary images
    const secondaryImages = [];
    const imageFields = ['Secondary Images', 'Secondary Image 2', 'Secondary Image 3', 'Secondary Image 4'];
    
    for (let j = 0; j < imageFields.length; j++) {
      const imageUrl = row[imageFields[j]];
      if (imageUrl && imageUrl.startsWith('http')) {
        const ext = getFileExtension(imageUrl);
        const imageFilename = `${productId}-secondary-${j + 1}${ext}`;
        const downloadedUrl = await downloadFile(imageUrl, imageFilename);
        if (downloadedUrl) {
          secondaryImages.push(downloadedUrl);
          console.log(`Secondary image ${j + 1} downloaded: ${downloadedUrl}`);
        }
      }
    }

    // Create properly formatted product data
    const productData = {
      // Basic product info
      id: productId,
      referenceFournisseur: row.SKU,
      constructeur: row.Manufacturer,
      slug: slug,
      categoryId: 'laboratory', // Default category, can be changed
      status: 'active',
      isFeatured: false,
      pdfBrochureUrl: brochureUrl,
      
      // Translations
      translations: [
        {
          languageCode: 'fr',
          nom: row['Product name'],
          description: row['Description FR'] || row.Description,
          ficheTechnique: row['Fiche Technique']
        },
        {
          languageCode: 'en',
          nom: row['Product name'],
          description: row.Description,
          ficheTechnique: row['Fiche Technique']
        }
      ],
      
      // Media files
      media: []
    };

    // Add primary image to media
    if (primaryImageUrl) {
      productData.media.push({
        type: 'image',
        url: primaryImageUrl,
        isPrimary: true,
        sortOrder: 0,
        altText: row['Product name']
      });
    }

    // Add secondary images to media
    secondaryImages.forEach((imageUrl, index) => {
      productData.media.push({
        type: 'image',
        url: imageUrl,
        isPrimary: false,
        sortOrder: index + 1,
        altText: `${row['Product name']} - Image ${index + 1}`
      });
    });

    processedData.push(productData);
  }

  // Save processed data to JSON file for import
  const outputFile = path.join(__dirname, '../data/processed-products.json');
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2));
  console.log(`Processed data saved to: ${outputFile}`);

  // Create CSV for manual review
  const csvHeader = 'ID,Reference,Manufacturer,Name,Description,Category,Status,Primary Image,Secondary Images,PDF Brochure\n';
  const csvRows = processedData.map(product => {
    const primaryImage = product.media.find(m => m.isPrimary)?.url || '';
    const secondaryImages = product.media.filter(m => !m.isPrimary).map(m => m.url).join(';');
    
    return [
      product.id,
      product.referenceFournisseur,
      product.constructeur,
      product.translations[0].nom,
      `"${product.translations[0].description}"`,
      product.categoryId,
      product.status,
      primaryImage,
      secondaryImages,
      product.pdfBrochureUrl || ''
    ].join(',');
  }).join('\n');

  const csvFile = path.join(__dirname, '../data/processed-products.csv');
  fs.writeFileSync(csvFile, csvHeader + csvRows);
  console.log(`CSV file created: ${csvFile}`);

  return processedData;
}

// Function to import data to database (for testing)
async function importToDatabase(products) {
  console.log('Importing products to database...');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    for (const product of products) {
      console.log(`Importing: ${product.translations[0].nom}`);
      
      // Create product
      const createdProduct = await prisma.product.create({
        data: {
          id: product.id,
          referenceFournisseur: product.referenceFournisseur,
          constructeur: product.constructeur,
          slug: product.slug,
          categoryId: product.categoryId,
          status: product.status,
          isFeatured: product.isFeatured,
          pdfBrochureUrl: product.pdfBrochureUrl,
          translations: {
            create: product.translations.map(trans => ({
              languageCode: trans.languageCode,
              nom: trans.nom,
              description: trans.description,
              ficheTechnique: trans.ficheTechnique
            }))
          },
          media: {
            create: product.media.map(media => ({
              type: media.type,
              url: media.url,
              isPrimary: media.isPrimary,
              sortOrder: media.sortOrder,
              altText: media.altText
            }))
          }
        }
      });
      
      console.log(`✅ Imported: ${createdProduct.referenceFournisseur}`);
    }
    
    console.log('🎉 All products imported successfully!');
  } catch (error) {
    console.error('Error importing products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  try {
    const processedData = await processCSVData();
    
    console.log('\n=== Processing Summary ===');
    console.log(`Products processed: ${processedData.length}`);
    console.log('Files saved:');
    console.log('- data/processed-products.json (for database import)');
    console.log('- data/processed-products.csv (for manual review)');
    
    // Ask if user wants to import to database
    console.log('\nTo import to database, run:');
    console.log('node scripts/import-products.js');
    
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processCSVData, importToDatabase };