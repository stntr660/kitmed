const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

async function createDisciplineCategories() {
  try {
    console.log('🏗️ CREATING CATEGORIES UNDER DISCIPLINES');
    console.log('========================================\n');

    // First, analyze all products to understand what categories we need
    const products = await prisma.products.findMany({
      include: {
        product_translations: true
      }
    });
    
    console.log(`📊 Analyzing ${products.length} products...\n`);

    // Categorize products based on their names and characteristics
    const productCategories = {
      'surgical-instruments': {
        fr: 'Instruments Chirurgicaux',
        en: 'Surgical Instruments',
        keywords: ['forceps', 'pince', 'scissors', 'ciseaux', 'knife', 'couteau', 'spatula', 'spatule', 'cannula', 'canule', 'needle', 'aiguille', 'hook', 'crochet', 'retractor', 'écarteur'],
        products: []
      },
      'diagnostic-equipment': {
        fr: 'Équipement de Diagnostic',
        en: 'Diagnostic Equipment',
        keywords: ['ophthalmoscope', 'ophtalmoscope', 'otoscope', 'tonometer', 'tonomètre', 'pachymeter', 'pachymètre', 'slit lamp', 'lampe à fente', 'retinoscope', 'rétinoscope'],
        products: []
      },
      'microsurgical-instruments': {
        fr: 'Instruments Microchirurgicaux',
        en: 'Microsurgical Instruments',
        keywords: ['micro', 'fine', 'delicate', 'délicat', '0.12', '0.15', 'colibri', 'mosquito'],
        products: []
      },
      'implants-lenses': {
        fr: 'Implants et Lentilles',
        en: 'Implants and Lenses',
        keywords: ['iol', 'implant', 'lens', 'lentille', 'artisan', 'artiflex', 'phakic'],
        products: []
      },
      'surgical-accessories': {
        fr: 'Accessoires Chirurgicaux',
        en: 'Surgical Accessories',
        keywords: ['holder', 'support', 'marker', 'marqueur', 'caliper', 'compas', 'speculum', 'spéculum', 'shield', 'protection'],
        products: []
      },
      'consumables': {
        fr: 'Consommables',
        en: 'Consumables',
        keywords: ['blade', 'lame', 'disposable', 'jetable', 'single use', 'usage unique', 'sterile', 'stérile'],
        products: []
      },
      'upgrade-kits': {
        fr: 'Kits de Mise à Niveau',
        en: 'Upgrade Kits',
        keywords: ['upgrade', 'mise à niveau', 'kit', 'battery', 'batterie', 'led', 'lithium', 'wireless', 'sans fil'],
        products: []
      }
    };

    // Categorize each product
    products.forEach(product => {
      const frName = product.product_translations.find(t => t.language_code === 'fr')?.nom || '';
      const enName = product.product_translations.find(t => t.language_code === 'en')?.nom || '';
      const fullText = `${frName} ${enName}`.toLowerCase();
      
      let categorized = false;
      
      for (const [categoryKey, categoryData] of Object.entries(productCategories)) {
        for (const keyword of categoryData.keywords) {
          if (fullText.includes(keyword.toLowerCase())) {
            categoryData.products.push({
              id: product.id,
              ref: product.reference_fournisseur,
              manufacturer: product.constructeur,
              name: frName || enName
            });
            categorized = true;
            break;
          }
        }
        if (categorized) break;
      }
      
      // If not categorized, put in surgical instruments as default for medical products
      if (!categorized && product.constructeur) {
        productCategories['surgical-instruments'].products.push({
          id: product.id,
          ref: product.reference_fournisseur,
          manufacturer: product.constructeur,
          name: frName || enName
        });
      }
    });

    // Show category distribution
    console.log('📊 PRODUCT DISTRIBUTION BY CATEGORY:');
    for (const [key, data] of Object.entries(productCategories)) {
      console.log(`  ${data.en}: ${data.products.length} products`);
    }

    // Get or create main disciplines
    const disciplines = {
      ophthalmology: null,
      surgery: null,
      general: null
    };

    // Get ophthalmology discipline
    let ophthalmology = await prisma.categories.findFirst({
      where: { slug: 'ophtalmologie', type: 'discipline' }
    });
    
    if (!ophthalmology) {
      const now = new Date();
      ophthalmology = await prisma.categories.create({
        data: {
          id: randomUUID(),
          slug: 'ophtalmologie',
          name: 'Ophtalmologie',
          type: 'discipline',
          is_active: true,
          sort_order: 1,
          created_at: now,
          updated_at: now
        }
      });
      
      await prisma.category_translations.createMany({
        data: [
          {
            id: randomUUID(),
            category_id: ophthalmology.id,
            language_code: 'fr',
            name: 'Ophtalmologie',
            description: 'Équipements et instruments pour l\'ophtalmologie'
          },
          {
            id: randomUUID(),
            category_id: ophthalmology.id,
            language_code: 'en',
            name: 'Ophthalmology',
            description: 'Equipment and instruments for ophthalmology'
          }
        ]
      });
    }
    disciplines.ophthalmology = ophthalmology;

    // Get surgery discipline
    let surgery = await prisma.categories.findFirst({
      where: { slug: 'chirurgie', type: 'discipline' }
    });
    
    if (!surgery) {
      const now = new Date();
      surgery = await prisma.categories.create({
        data: {
          id: randomUUID(),
          slug: 'chirurgie',
          name: 'Chirurgie',
          type: 'discipline',
          is_active: true,
          sort_order: 2,
          created_at: now,
          updated_at: now
        }
      });
      
      await prisma.category_translations.createMany({
        data: [
          {
            id: randomUUID(),
            category_id: surgery.id,
            language_code: 'fr',
            name: 'Chirurgie',
            description: 'Instruments et équipements chirurgicaux'
          },
          {
            id: randomUUID(),
            category_id: surgery.id,
            language_code: 'en',
            name: 'Surgery',
            description: 'Surgical instruments and equipment'
          }
        ]
      });
    }
    disciplines.surgery = surgery;

    // Get general medicine discipline
    let general = await prisma.categories.findFirst({
      where: { slug: 'medecine-generale', type: 'discipline' }
    });
    
    if (!general) {
      const now = new Date();
      general = await prisma.categories.create({
        data: {
          id: randomUUID(),
          slug: 'medecine-generale',
          name: 'Médecine Générale',
          type: 'discipline',
          is_active: true,
          sort_order: 3,
          created_at: now,
          updated_at: now
        }
      });
      
      await prisma.category_translations.createMany({
        data: [
          {
            id: randomUUID(),
            category_id: general.id,
            language_code: 'fr',
            name: 'Médecine Générale',
            description: 'Équipements pour la médecine générale'
          },
          {
            id: randomUUID(),
            category_id: general.id,
            language_code: 'en',
            name: 'General Medicine',
            description: 'Equipment for general medicine'
          }
        ]
      });
    }
    disciplines.general = general;

    console.log('\n✅ DISCIPLINES READY:');
    console.log('  - Ophthalmology:', disciplines.ophthalmology.id);
    console.log('  - Surgery:', disciplines.surgery.id);
    console.log('  - General Medicine:', disciplines.general.id);

    // Create categories under disciplines
    const createdCategories = {};
    
    // Categories for Ophthalmology
    const ophthalmologyCategories = [
      {
        slug: 'ophthalmic-surgical-instruments',
        name: { fr: 'Instruments Chirurgicaux Ophtalmiques', en: 'Ophthalmic Surgical Instruments' },
        description: { 
          fr: 'Instruments spécialisés pour la chirurgie ophtalmique',
          en: 'Specialized instruments for ophthalmic surgery'
        },
        parent: disciplines.ophthalmology.id,
        categoryKey: 'surgical-instruments',
        manufacturers: ['MORIA', 'rumex', 'surgicon-ag']
      },
      {
        slug: 'ophthalmic-diagnostic',
        name: { fr: 'Diagnostic Ophtalmique', en: 'Ophthalmic Diagnostic' },
        description: { 
          fr: 'Équipements de diagnostic pour l\'ophtalmologie',
          en: 'Diagnostic equipment for ophthalmology'
        },
        parent: disciplines.ophthalmology.id,
        categoryKey: 'diagnostic-equipment',
        manufacturers: ['KEELER', 'HEINE', 'nidek-japon', 'haag-streit-u-k']
      },
      {
        slug: 'ophthalmic-microsurgery',
        name: { fr: 'Microchirurgie Ophtalmique', en: 'Ophthalmic Microsurgery' },
        description: { 
          fr: 'Instruments de microchirurgie pour l\'œil',
          en: 'Microsurgical instruments for the eye'
        },
        parent: disciplines.ophthalmology.id,
        categoryKey: 'microsurgical-instruments',
        manufacturers: ['MORIA', 'rumex']
      },
      {
        slug: 'intraocular-lenses',
        name: { fr: 'Lentilles Intraoculaires', en: 'Intraocular Lenses' },
        description: { 
          fr: 'Implants et lentilles intraoculaires',
          en: 'Intraocular implants and lenses'
        },
        parent: disciplines.ophthalmology.id,
        categoryKey: 'implants-lenses',
        manufacturers: ['johnson-johnson-vision', 'ophtec']
      }
    ];

    // Categories for Surgery
    const surgeryCategories = [
      {
        slug: 'general-surgical-instruments',
        name: { fr: 'Instruments Chirurgicaux Généraux', en: 'General Surgical Instruments' },
        description: { 
          fr: 'Instruments de base pour la chirurgie',
          en: 'Basic instruments for surgery'
        },
        parent: disciplines.surgery.id,
        categoryKey: 'surgical-instruments',
        manufacturers: ['surgicon-ag', 'MORIA']
      },
      {
        slug: 'surgical-accessories',
        name: { fr: 'Accessoires Chirurgicaux', en: 'Surgical Accessories' },
        description: { 
          fr: 'Accessoires et supports pour la chirurgie',
          en: 'Accessories and supports for surgery'
        },
        parent: disciplines.surgery.id,
        categoryKey: 'surgical-accessories',
        manufacturers: ['rumex', 'MORIA']
      },
      {
        slug: 'surgical-consumables',
        name: { fr: 'Consommables Chirurgicaux', en: 'Surgical Consumables' },
        description: { 
          fr: 'Produits à usage unique pour la chirurgie',
          en: 'Single-use products for surgery'
        },
        parent: disciplines.surgery.id,
        categoryKey: 'consumables',
        manufacturers: ['surgicon-ag']
      }
    ];

    // Categories for General Medicine
    const generalCategories = [
      {
        slug: 'diagnostic-instruments',
        name: { fr: 'Instruments de Diagnostic', en: 'Diagnostic Instruments' },
        description: { 
          fr: 'Instruments de diagnostic général',
          en: 'General diagnostic instruments'
        },
        parent: disciplines.general.id,
        categoryKey: 'diagnostic-equipment',
        manufacturers: ['HEINE', 'KEELER']
      },
      {
        slug: 'equipment-upgrades',
        name: { fr: 'Mises à Niveau d\'Équipement', en: 'Equipment Upgrades' },
        description: { 
          fr: 'Kits de mise à niveau et accessoires',
          en: 'Upgrade kits and accessories'
        },
        parent: disciplines.general.id,
        categoryKey: 'upgrade-kits',
        manufacturers: ['KEELER', 'HEINE']
      }
    ];

    // Create all categories
    const allCategories = [...ophthalmologyCategories, ...surgeryCategories, ...generalCategories];
    
    for (const catData of allCategories) {
      // Check if category already exists
      let category = await prisma.categories.findFirst({
        where: { slug: catData.slug }
      });
      
      if (!category) {
        const now = new Date();
        category = await prisma.categories.create({
          data: {
            id: randomUUID(),
            slug: catData.slug,
            name: catData.name.en,
            type: 'category',
            parent_id: catData.parent,
            is_active: true,
            sort_order: 1,
            created_at: now,
            updated_at: now
          }
        });
        
        // Create translations
        await prisma.category_translations.createMany({
          data: [
            {
              id: randomUUID(),
              category_id: category.id,
              language_code: 'fr',
              name: catData.name.fr,
              description: catData.description.fr
            },
            {
              id: randomUUID(),
              category_id: category.id,
              language_code: 'en',
              name: catData.name.en,
              description: catData.description.en
            }
          ]
        });
        
        console.log(`✅ Created category: ${catData.name.en}`);
      } else {
        console.log(`⏭️ Category exists: ${catData.name.en}`);
      }
      
      createdCategories[catData.categoryKey] = category;
      
      // Link products to this category
      const categoryProducts = productCategories[catData.categoryKey]?.products || [];
      const relevantProducts = categoryProducts.filter(p => 
        catData.manufacturers.some(mfg => p.manufacturer.toLowerCase().includes(mfg.toLowerCase()))
      );
      
      if (relevantProducts.length > 0) {
        console.log(`   Linking ${relevantProducts.length} products to ${catData.name.en}...`);
        
        for (const product of relevantProducts) {
          try {
            await prisma.products.update({
              where: { id: product.id },
              data: { category_id: category.id }
            });
          } catch (err) {
            // Product might not exist or already linked
            console.log(`   ⚠️ Could not link product ${product.ref}: ${err.message}`);
          }
        }
      }
    }

    // Summary
    const finalCount = await prisma.categories.count({
      where: { type: { in: ['discipline', 'category'] } }
    });
    
    console.log('\n📊 FINAL SUMMARY:');
    console.log('================');
    console.log(`Total disciplines: 3`);
    console.log(`Total categories created: ${allCategories.length}`);
    console.log(`Total categories in database: ${finalCount}`);
    
    // Show sample products per category
    console.log('\n📦 SAMPLE PRODUCTS PER CATEGORY:');
    for (const catData of allCategories) {
      const sampleProducts = await prisma.products.findMany({
        where: { category_id: catData.slug },
        take: 3,
        include: { product_translations: true }
      });
      
      if (sampleProducts.length > 0) {
        console.log(`\n${catData.name.en}:`);
        sampleProducts.forEach(p => {
          const name = p.product_translations.find(t => t.language_code === 'en')?.nom || 
                       p.product_translations.find(t => t.language_code === 'fr')?.nom || 
                       p.reference_fournisseur;
          console.log(`  - ${name}`);
        });
      }
    }

    await prisma.$disconnect();
    console.log('\n✅ CATEGORIES CREATION COMPLETE!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the category creation
createDisciplineCategories();