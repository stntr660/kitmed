const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

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

      console.log(`  📥 Downloading: ${description}`);
      console.log(`     URL: ${url}`);
      console.log(`     File: ${filename}`);

      const file = fs.createWriteStream(filePath);
      
      protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`  ✅ Downloaded: ${filename}`);
            resolve(`/uploads/products/${filename}`);
          });
        } else {
          console.log(`  ❌ Failed to download: ${response.statusCode} - ${url}`);
          file.close();
          fs.unlink(filePath, () => {});
          resolve(null);
        }
      }).on('error', (err) => {
        console.log(`  ❌ Error downloading: ${err.message}`);
        file.close();
        fs.unlink(filePath, () => {});
        resolve(null);
      });
    } catch (error) {
      console.log(`  ❌ Error processing: ${error.message}`);
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

async function importTestProductsWithDownloads() {
  const prisma = new PrismaClient();
  
  console.log('🧪 IMPORTING 6 TEST PRODUCTS WITH DOWNLOADED MEDIA');
  console.log('===================================================');
  
  // Test products data with original URLs
  const testProducts = [
    // MORIA Products (3)
    {
      referenceFournisseur: '9601',
      constructeur: 'MORIA',
      nom_fr: 'Vannas Ciseaux (Courbes émoussées)',
      nom_en: 'Vannas Scissors (Curved blunt blades)',
      description_fr: 'Longueur totale de 8,7 cm avec lames courbes émoussées, 5 mm x 0,5 mm. Peut être utilisé pour couper la cornée, l\'iris, la capsule ou la membrane.',
      description_en: '8.7-cm total length with curved blunt blades, 5-mm x 0.5-mm blades. Can be used to cut the cornea, iris, capsule or membrane.',
      ficheTechnique: 'Réutilisable: Oui; Emballage: X1; Matériau: Acier inoxydable; Taille: 87 mm; Lames: 5 mm émoussées; Usage prévu: Couper la cornée, iris, capsule, membrane.',
      primaryImageUrl: 'https://www.moria-surgical.com/media/cache/product_viewer/files/product/82ad56e7c299ac116b0f7a2088e5ac633634573b.jpg',
      categoryId: 'ophthalmology-surgical'
    },
    {
      referenceFournisseur: '13246',
      constructeur: 'MORIA',
      nom_fr: 'Pinces Bonn-Kraff (0.12-mm dents avec plateformes)',
      nom_en: 'Bonn-Kraff Forceps (0.12-mm teeth with platforms and long jaws)',
      description_fr: 'Pinces de maintien Bonn-Kraff réutilisables avec plateformes et micro-dents de 0,12 mm, avec manche cage à oiseaux. Peut être utilisé pour tenir l\'œil pendant la chirurgie ophtalmique.',
      description_en: 'Reusable Bonn-Kraff holding forceps with platforms and 0.12-mm facing micro teeth, with a bird cage handle. Can be used to hold the eye during ophthalmic surgery.',
      ficheTechnique: 'Réutilisable: Oui; Emballage: X1; Matériau: Acier inoxydable; Longueur totale: 12 cm; Pointe: 0,12 mm dents, droites; Manche: Cage à oiseaux; Usage prévu: Tenir l\'œil pendant la chirurgie ophtalmique.',
      primaryImageUrl: 'https://www.moria-surgical.com/media/cache/product_viewer/files/product/a3a345b25137b6ffb0f3813c7c8afc2b5a6f73ff.jpg',
      categoryId: 'ophthalmology-surgical'
    },
    {
      referenceFournisseur: '7850A',
      constructeur: 'MORIA',
      nom_fr: 'Pinces Bonn-Moria (0.18-mm dents avec plateformes)',
      nom_en: 'Bonn-Moria Forceps (0.18-mm teeth with platforms)',
      description_fr: 'Pinces de maintien Bonn-Moria réutilisables avec plateformes et micro-dents de 0,18 mm. Peut être utilisé pour tenir la cornée.',
      description_en: 'Reusable Bonn-Moria holding forceps with platforms and 0.18-mm facing micro teeth. Can be used to hold the cornea.',
      ficheTechnique: 'Réutilisable: Oui; Emballage: X1; Matériau: Acier inoxydable; Longueur totale: 10 cm; Pointe: 0,18 mm dents, droites; Manche: Plat; Usage prévu: Tenir la cornée.',
      primaryImageUrl: 'https://www.moria-surgical.com/media/cache/product_viewer/files/product/e23723c718a7942ac831593e2bfa2303d74839ea.jpg',
      categoryId: 'ophthalmology-surgical'
    },
    
    // KEELER Products (3)
    {
      referenceFournisseur: '2414-P-5032',
      constructeur: 'KEELER',
      nom_fr: 'Plaque Guide de Tonomètre KAT T (Démontable)',
      nom_en: 'Tonometer Guide Plate KAT T (Removable)',
      description_fr: 'Accessoire original Keeler pour votre tonomètre d\'aplanation. Pièce de rechange de haute qualité de la plaque guide pour l\'orifice de la barre de test de votre tonomètre d\'aplanation numérique Keeler KAT-T (démontable).',
      description_en: 'Original Keeler accessory for your applanation tonometer. High quality replacement guide plate for the test bar hole of your Keeler KAT-T digital applanation tonometer (removable).',
      ficheTechnique: 'Compatible avec: Tonomètre KAT-T; Type: Plaque guide démontable; Qualité: Pièce de rechange originale Keeler; Usage: Tonomètrie d\'aplanation',
      primaryImageUrl: 'https://www.keelerglobal.com/wp-content/uploads/2024/02/2414-P-5032-7-jpg.webp',
      categoryId: 'ophthalmology-diagnostic'
    },
    {
      referenceFournisseur: '1205-P-5010',
      constructeur: 'KEELER',
      nom_fr: 'Vantage Plus LED Digital avec logiciel Keeler Kapture',
      nom_en: 'Vantage Plus LED Digital with Keeler Kapture software',
      description_fr: 'Images et documentation numériques exceptionnelles d\'un simple clic. Le Vantage Plus Digital est livré avec le logiciel Keeler Kapture qui vous permet de capturer facilement images et vidéos de vos examens.',
      description_en: 'Exceptional digital imaging and documentation at the touch of a button. The Vantage Plus Digital comes with Keeler Kapture software that allows you to conveniently capture images and videos of your examinations.',
      ficheTechnique: 'Capture d\'examens: Format numérique avec interface USB; Éducation simplifiée: Retransmission en direct des examens; Grossissement d\'image: Gamme de filtres et ouvertures, plus grossissement 1.6x avec objectif Hi-Mag™',
      primaryImageUrl: 'https://www.keelerglobal.com/wp-content/uploads/2024/02/1205-P-5010-8-jpg.webp',
      categoryId: 'ophthalmology-diagnostic'
    },
    {
      referenceFournisseur: '3010-P-2000',
      constructeur: 'KEELER',
      nom_fr: 'Keeler PSL Classic – Lampe à Fente Portable de Main',
      nom_en: 'Keeler PSL Classic – Portable Handheld Slit Lamp',
      description_fr: 'Excellence en optique, polyvalence et portabilité. Le PSL Classic combine l\'optique renommée de Keeler avec une construction robuste et portable, permettant des examens ophtalmologiques complets où que ce soit nécessaire.',
      description_en: 'Excellence in optics, versatility and portability. The PSL Classic combines Keeler\'s renowned optics with robust, portable construction, enabling comprehensive ophthalmic examinations wherever needed.',
      ficheTechnique: 'Optique avancée: Grossissements 10x et 16x; Éclairage contrôlable: De maximum à zéro; Ouverture carrée: 1 mm pour évaluation uvéite; Qualité: Fabrication britannique offrant une grande valeur',
      primaryImageUrl: 'https://www.keelerglobal.com/wp-content/uploads/2024/02/3010-P-2000-6-jpg.webp',
      categoryId: 'ophthalmology-diagnostic'
    }
  ];

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  try {
    console.log('🔄 Starting import process...\n');

    for (const productData of testProducts) {
      try {
        console.log(`📦 Processing: ${productData.referenceFournisseur} (${productData.constructeur})`);
        console.log(`    ${productData.nom_en}`);

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

        // Generate slug
        const slug = `${productData.nom_en}-${productData.referenceFournisseur}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50);

        console.log(`  🔗 Slug: ${slug}`);

        // Create product with all data
        const createdProduct = await prisma.product.create({
          data: {
            referenceFournisseur: productData.referenceFournisseur,
            constructeur: productData.constructeur,
            slug: slug,
            categoryId: productData.categoryId,
            status: 'active',
            isFeatured: false,
            partnerId: partner.id,

            // Create translations
            translations: {
              create: [
                {
                  languageCode: 'fr',
                  nom: productData.nom_fr,
                  description: productData.description_fr,
                  ficheTechnique: productData.ficheTechnique
                },
                {
                  languageCode: 'en',
                  nom: productData.nom_en,
                  description: productData.description_en,
                  ficheTechnique: productData.ficheTechnique
                }
              ]
            },

            // Create media (images)
            media: primaryImagePath ? {
              create: [{
                type: 'image',
                url: primaryImagePath,
                isPrimary: true,
                sortOrder: 0,
                altText: productData.nom_en
              }]
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
        console.log(`     Primary image: ${primaryImagePath || 'None'}`);
        console.log('');

        imported++;

      } catch (error) {
        console.log(`  ❌ ERROR importing ${productData.referenceFournisseur}: ${error.message}\n`);
        errors++;
      }
    }

    // Final summary
    console.log('='.repeat(60));
    console.log('🧪 TEST IMPORT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${imported} products`);
    console.log(`⚠️  Skipped (already exist): ${skipped} products`);
    console.log(`❌ Errors: ${errors} products`);
    console.log(`📊 Total processed: ${imported + skipped + errors} products`);

    if (imported > 0) {
      console.log('\n🎉 SUCCESS! Test products imported with local media.');
      console.log('\n🔍 Next steps:');
      console.log('  1. Check admin dashboard: http://localhost:3001/fr/admin/products');
      console.log('  2. Verify French/English translations display correctly');
      console.log('  3. Test image loading from local storage');
      console.log('  4. Verify manufacturer/partner mapping');
      console.log('  5. If all good → proceed with full import (615 products)');
      
      console.log('\n📁 Downloaded files location:');
      console.log('     public/uploads/products/');
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
  importTestProductsWithDownloads().then(result => {
    if (result.imported > 0) {
      console.log('\n🎯 TEST IMPORT SUCCESSFUL!');
      console.log('📸 All media downloaded to local storage');
      console.log('🌍 French/English translations imported');
      console.log('🏭 Manufacturers properly linked');
    } else {
      console.log('\n⚠️  No new products were imported.');
    }
  }).catch(error => {
    console.error('❌ Test import failed:', error.message);
    process.exit(1);
  });
}

module.exports = { importTestProductsWithDownloads };