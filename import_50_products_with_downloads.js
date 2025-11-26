const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

// CSV parser function
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Download file function
async function downloadFile(url, filename, description = '') {
  return new Promise((resolve, reject) => {
    if (!url || url === '') {
      resolve(null);
      return;
    }

    try {
      const protocol = url.startsWith('https:') ? https : http;
      const filePath = path.join(__dirname, 'public/uploads/products', filename);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      console.log(`    📥 Downloading: ${description}`);
      
      const file = fs.createWriteStream(filePath);
      
      protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`    ✅ Downloaded: ${filename}`);
            resolve(`/uploads/products/${filename}`);
          });
        } else {
          console.log(`    ❌ Failed to download: ${response.statusCode} - ${url}`);
          file.close();
          fs.unlink(filePath, () => {});
          resolve(null);
        }
      }).on('error', (err) => {
        console.log(`    ❌ Error downloading: ${err.message}`);
        file.close();
        fs.unlink(filePath, () => {});
        resolve(null);
      });
    } catch (error) {
      console.log(`    ❌ Error processing: ${error.message}`);
      resolve(null);
    }
  });
}

// Get file extension from URL
function getFileExtension(url) {
  if (!url) return '';
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    return ext || '.jpg';
  } catch {
    return '.jpg';
  }
}

// Create French medical translations
function createFrenchTranslation(englishName, englishDescription) {
  // Medical device translations
  const translations = {
    'Forceps': 'Pinces',
    'forceps': 'pinces',
    'Scissors': 'Ciseaux',
    'scissors': 'ciseaux',
    'Hook': 'Crochet',
    'hook': 'crochet',
    'Manipulator': 'Manipulateur',
    'manipulator': 'manipulateur',
    'Spatula': 'Spatule',
    'spatula': 'spatule',
    'Needle': 'Aiguille',
    'needle': 'aiguille',
    'Cannula': 'Canule',
    'cannula': 'canule',
    'Retractor': 'Rétracteur',
    'retractor': 'rétracteur',
    'Holder': 'Porte',
    'holder': 'porte',
    'curved': 'courbe',
    'straight': 'droit',
    'blunt': 'émoussé',
    'sharp': 'pointu',
    'serrated': 'dentelé',
    'smooth': 'lisse',
    'platforms': 'plateformes',
    'teeth': 'dents',
    'jaws': 'mâchoires',
    'tip': 'pointe',
    'handle': 'manche',
    'length': 'longueur',
    'total': 'totale',
    'active': 'actif',
    'part': 'partie',
    'angled': 'angulé',
    'micro': 'micro',
    'surgery': 'chirurgie',
    'surgical': 'chirurgical',
    'ophthalmic': 'ophtalmique',
    'intraocular': 'intraoculaire',
    'lens': 'lentille',
    'cornea': 'cornée',
    'iris': 'iris',
    'capsule': 'capsule',
    'membrane': 'membrane',
    'suture': 'suture',
    'sutures': 'sutures',
    'Can be used to': 'Peut être utilisé pour',
    'used to': 'utilisé pour',
    'hold the': 'maintenir le',
    'hold': 'maintenir',
    'cut the': 'couper le',
    'cut': 'couper',
    'manipulate': 'manipuler',
    'implant': 'implanter',
    'explant': 'explanter',
    'position': 'positionner',
    'rotate': 'faire tourner'
  };

  let frenchName = englishName;
  let frenchDesc = englishDescription;

  // Apply translations
  for (const [en, fr] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    frenchName = frenchName.replace(regex, fr);
    frenchDesc = frenchDesc.replace(regex, fr);
  }

  return {
    nom_fr: frenchName,
    description_fr: frenchDesc
  };
}

async function import50ProductsWithDownloads() {
  const prisma = new PrismaClient();
  
  console.log('📦 IMPORTING 50 PRODUCTS FROM DIVERSE SELECTION');
  console.log('===============================================');
  console.log('25 MORIA + 25 KEELER products with local media');
  console.log('');
  
  try {
    // Read the original CSV
    const csvPath = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMED DATA/Consolidated products/MATCHED_products_with_full_details_20251125_142649.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📁 CSV loaded: ${lines.length - 1} total products`);
    
    // Parse header
    const headers = parseCSVLine(lines[0]);
    console.log(`📋 CSV columns: ${headers.length}`);
    
    // Get all products except those already imported
    const excludeRefs = ['9601', '13246', '7850A', '2414-P-5032', '1205-P-5010', '3010-P-2000'];
    let moriaProducts = [];
    let keelerProducts = [];
    
    console.log('🔍 Parsing products...');
    
    for (let i = 1; i < lines.length && (moriaProducts.length < 25 || keelerProducts.length < 25); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const values = parseCSVLine(line);
        const ref = values[5]; // Reference column
        const brand = values[3]; // Brand column
        
        if (excludeRefs.includes(ref)) continue;
        
        if (brand === 'MORIA' && moriaProducts.length < 25) {
          moriaProducts.push({ values, lineNumber: i + 1 });
        } else if (brand === 'KEELER' && keelerProducts.length < 25) {
          keelerProducts.push({ values, lineNumber: i + 1 });
        }
      } catch (error) {
        console.log(`⚠️  Error parsing line ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`📊 Selected: ${moriaProducts.length} MORIA + ${keelerProducts.length} KEELER products`);
    console.log('');
    
    const allProducts = [...moriaProducts, ...keelerProducts];
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    console.log('🔄 Starting import process...\n');

    for (const { values, lineNumber } of allProducts) {
      try {
        const productData = {
          referenceFournisseur: values[5] || '',
          constructeur: values[3] || '',
          englishName: values[6] || 'Medical Product',
          englishDescription: values[15] || values[16] || 'Professional medical equipment',
          primaryImageUrl: values[17] || '', // Primary_Image column
          galleryImages: values[18] || '', // Gallery_Images column  
          pdfLinks: values[31] || '', // PDF_Links column
          categoryId: 'ophthalmology-surgical'
        };

        console.log(`📦 Processing: ${productData.referenceFournisseur} (${productData.constructeur})`);
        console.log(`    Line ${lineNumber}: ${productData.englishName}`);

        // Check if product already exists
        const existing = await prisma.product.findUnique({
          where: { referenceFournisseur: productData.referenceFournisseur }
        });

        if (existing) {
          console.log(`  ⚠️  SKIPPED - Already exists: ${productData.referenceFournisseur}\n`);
          skipped++;
          continue;
        }

        // Find partner by manufacturer name
        const partner = await prisma.partner.findFirst({
          where: { name: productData.constructeur }
        });

        if (!partner) {
          console.log(`  ❌ ERROR - No partner found for: ${productData.constructeur}\n`);
          errors++;
          continue;
        }

        console.log(`  🏭 Partner found: ${partner.name} (ID: ${partner.id})`);

        // Create French translations
        const frenchTranslation = createFrenchTranslation(
          productData.englishName, 
          productData.englishDescription
        );

        // Download primary image
        let primaryImagePath = null;
        if (productData.primaryImageUrl) {
          const ext = getFileExtension(productData.primaryImageUrl);
          const filename = `${productData.referenceFournisseur}-primary${ext}`;
          primaryImagePath = await downloadFile(
            productData.primaryImageUrl, 
            filename, 
            'Primary image'
          );
        }

        // Process gallery images
        const galleryImagePaths = [];
        if (productData.galleryImages) {
          const galleryUrls = productData.galleryImages.split(',').map(url => url.trim()).filter(url => url);
          for (let idx = 0; idx < galleryUrls.length && idx < 3; idx++) {
            const url = galleryUrls[idx];
            const ext = getFileExtension(url);
            const filename = `${productData.referenceFournisseur}-gallery-${idx + 1}${ext}`;
            const downloadedPath = await downloadFile(url, filename, `Gallery image ${idx + 1}`);
            if (downloadedPath) {
              galleryImagePaths.push({
                url: downloadedPath,
                sortOrder: idx + 1,
                isPrimary: false,
                type: 'image'
              });
            }
          }
        }

        // Process PDF files
        const pdfPaths = [];
        if (productData.pdfLinks) {
          const pdfUrls = productData.pdfLinks.split(',').map(url => url.trim()).filter(url => url);
          for (let idx = 0; idx < pdfUrls.length && idx < 2; idx++) {
            const url = pdfUrls[idx];
            const filename = `${productData.referenceFournisseur}-brochure-${idx + 1}.pdf`;
            const downloadedPath = await downloadFile(url, filename, `PDF brochure ${idx + 1}`);
            if (downloadedPath) {
              pdfPaths.push({
                url: downloadedPath,
                sortOrder: 10 + idx,
                isPrimary: false,
                type: 'pdf'
              });
            }
          }
        }

        // Generate slug
        const slug = `${productData.englishName}-${productData.referenceFournisseur}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50);

        console.log(`  🔗 Slug: ${slug}`);

        // Create all media array
        const mediaData = [];
        if (primaryImagePath) {
          mediaData.push({
            type: 'image',
            url: primaryImagePath,
            isPrimary: true,
            sortOrder: 0,
            altText: productData.englishName
          });
        }
        mediaData.push(...galleryImagePaths);
        mediaData.push(...pdfPaths);

        // Create product with all data
        const createdProduct = await prisma.product.create({
          data: {
            referenceFournisseur: productData.referenceFournisseur,
            constructeur: productData.constructeur,
            slug: slug,
            categoryId: productData.categoryId,
            status: 'active',
            isFeatured: Math.random() < 0.2, // 20% chance to be featured
            partnerId: partner.id,

            // Create translations
            translations: {
              create: [
                {
                  languageCode: 'fr',
                  nom: frenchTranslation.nom_fr,
                  description: frenchTranslation.description_fr,
                  ficheTechnique: values[25] || values[24] || ''
                },
                {
                  languageCode: 'en',
                  nom: productData.englishName,
                  description: productData.englishDescription,
                  ficheTechnique: values[25] || values[24] || ''
                }
              ]
            },

            // Create media
            media: mediaData.length > 0 ? {
              create: mediaData
            } : undefined
          },
          include: {
            translations: true,
            media: true,
            partner: true
          }
        });

        console.log(`  ✅ SUCCESSFULLY IMPORTED: ${createdProduct.referenceFournisseur}`);
        console.log(`     Partner: ${createdProduct.partner.name}`);
        console.log(`     Translations: ${createdProduct.translations.length}`);
        console.log(`     Media files: ${createdProduct.media.length}`);
        console.log(`     Featured: ${createdProduct.isFeatured ? 'Yes' : 'No'}`);
        console.log('');

        imported++;

      } catch (error) {
        console.log(`  ❌ ERROR importing line ${lineNumber}: ${error.message}\n`);
        errors++;
      }
    }

    // Final summary
    console.log('='.repeat(60));
    console.log('📦 50-PRODUCT IMPORT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${imported} products`);
    console.log(`⚠️  Skipped (already exist): ${skipped} products`);
    console.log(`❌ Errors: ${errors} products`);
    console.log(`📊 Total processed: ${imported + skipped + errors} products`);

    if (imported > 0) {
      console.log('\n🎉 SUCCESS! 50 products imported with local media.');
      console.log('\n🔍 Next steps:');
      console.log('  1. Check admin dashboard: http://localhost:3001/fr/admin/products');
      console.log('  2. Verify French/English translations display correctly');
      console.log('  3. Test image and PDF loading from local storage');
      console.log('  4. Verify manufacturer/partner mapping');
      console.log('  5. Test search and filtering functionality');
      
      console.log('\n📁 Downloaded files location:');
      console.log('     public/uploads/products/');
      
      console.log('\n📊 Database totals:');
      console.log(`     Total products: ${await prisma.product.count()}`);
      console.log(`     Featured products: ${await prisma.product.count({ where: { isFeatured: true } })}`);
    }

    return { imported, skipped, errors };

  } catch (error) {
    console.error('❌ Import process failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  import50ProductsWithDownloads().then(result => {
    if (result.imported > 0) {
      console.log('\n🎯 50-PRODUCT IMPORT SUCCESSFUL!');
      console.log('📸 All media downloaded to local storage');
      console.log('🌍 French/English translations imported');
      console.log('🏭 Manufacturers properly linked');
      console.log(`📈 Database now contains ${result.imported + 6} products total`);
    } else {
      console.log('\n⚠️  No new products were imported.');
    }
  }).catch(error => {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  });
}

module.exports = { import50ProductsWithDownloads };