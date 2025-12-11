const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

async function verifyAndFixCategoryTranslations() {
  try {
    console.log('🔍 VERIFYING CATEGORY TRANSLATIONS');
    console.log('==================================\n');
    
    // Get all active categories
    const categories = await prisma.categories.findMany({
      where: { is_active: true },
      include: { category_translations: true },
      orderBy: { type: 'asc' }
    });
    
    console.log('Total active categories:', categories.length);
    
    let missingTranslations = [];
    let perfectCategories = [];
    
    for (const category of categories) {
      const frTrans = category.category_translations.find(t => t.language_code === 'fr');
      const enTrans = category.category_translations.find(t => t.language_code === 'en');
      
      if (!frTrans || !enTrans) {
        missingTranslations.push({
          category,
          missingFr: !frTrans,
          missingEn: !enTrans
        });
      } else {
        perfectCategories.push(category);
      }
    }
    
    console.log('✅ Categories with both translations:', perfectCategories.length);
    console.log('❌ Categories missing translations:', missingTranslations.length);
    
    if (missingTranslations.length > 0) {
      console.log('\n🔧 FIXING MISSING TRANSLATIONS:');
      console.log('================================');
      
      for (const item of missingTranslations) {
        const { category, missingFr, missingEn } = item;
        console.log('\nCategory:', category.slug, '(', category.name, ')');
        
        if (missingFr) {
          // Create French translation
          const frName = translateToFrench(category.name, category.type);
          const frDesc = generateFrenchDescription(frName, category.type);
          
          await prisma.category_translations.create({
            data: {
              id: randomUUID(),
              category_id: category.id,
              language_code: 'fr',
              name: frName,
              description: frDesc
            }
          });
          
          console.log('  ✅ Added French translation:', frName);
        }
        
        if (missingEn) {
          // Create English translation
          const enName = translateToEnglish(category.name, category.type);
          const enDesc = generateEnglishDescription(enName, category.type);
          
          await prisma.category_translations.create({
            data: {
              id: randomUUID(),
              category_id: category.id,
              language_code: 'en',
              name: enName,
              description: enDesc
            }
          });
          
          console.log('  ✅ Added English translation:', enName);
        }
      }
    }
    
    // Final verification
    console.log('\n📊 FINAL VERIFICATION:');
    console.log('======================');
    
    const finalCategories = await prisma.categories.findMany({
      where: { is_active: true },
      include: { category_translations: true }
    });
    
    let allHaveBoth = true;
    let stillMissing = [];
    
    for (const cat of finalCategories) {
      const hasFr = cat.category_translations.some(t => t.language_code === 'fr');
      const hasEn = cat.category_translations.some(t => t.language_code === 'en');
      
      if (!hasFr || !hasEn) {
        stillMissing.push({
          slug: cat.slug,
          name: cat.name,
          missingFr: !hasFr,
          missingEn: !hasEn
        });
        allHaveBoth = false;
      }
    }
    
    if (allHaveBoth) {
      console.log('✅ SUCCESS: All ' + finalCategories.length + ' categories have both French and English translations!');
      
      // Show breakdown by type
      const disciplines = finalCategories.filter(c => c.type === 'discipline');
      const categories = finalCategories.filter(c => c.type === 'category');
      const subcategories = finalCategories.filter(c => c.type === 'subcategory');
      
      console.log('\n📊 CATEGORY BREAKDOWN:');
      console.log('  Disciplines:', disciplines.length);
      console.log('  Categories:', categories.length);
      console.log('  Subcategories:', subcategories.length);
      
      // Show some examples
      console.log('\n📝 SAMPLE BILINGUAL CATEGORIES:');
      const samples = await prisma.categories.findMany({
        where: { type: 'category' },
        include: { category_translations: true },
        take: 5
      });
      
      samples.forEach(cat => {
        const fr = cat.category_translations.find(t => t.language_code === 'fr');
        const en = cat.category_translations.find(t => t.language_code === 'en');
        console.log('\n' + cat.slug + ':');
        console.log('  🇫🇷 ' + (fr?.name || 'Missing'));
        console.log('  🇬🇧 ' + (en?.name || 'Missing'));
      });
      
      // Count products per category
      console.log('\n📦 PRODUCTS PER CATEGORY:');
      for (const cat of categories) {
        const productCount = await prisma.products.count({
          where: { category_id: cat.id }
        });
        const fr = cat.category_translations.find(t => t.language_code === 'fr');
        const en = cat.category_translations.find(t => t.language_code === 'en');
        if (productCount > 0) {
          console.log('  ' + (en?.name || cat.name) + ': ' + productCount + ' products');
        }
      }
      
    } else {
      console.log('❌ Still missing translations for:');
      stillMissing.forEach(item => {
        console.log('  - ' + item.slug + ': ' + 
          (item.missingFr ? 'FR missing' : '') + 
          (item.missingFr && item.missingEn ? ', ' : '') +
          (item.missingEn ? 'EN missing' : ''));
      });
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

function translateToFrench(name, type) {
  // Common translations
  const translations = {
    'Ophthalmology': 'Ophtalmologie',
    'Surgery': 'Chirurgie',
    'General Medicine': 'Médecine Générale',
    'Diagnostic Equipment': 'Équipement de Diagnostic',
    'Surgical Instruments': 'Instruments Chirurgicaux',
    'Microsurgical Instruments': 'Instruments Microchirurgicaux',
    'Diagnostic Instruments': 'Instruments de Diagnostic',
    'Surgical Accessories': 'Accessoires Chirurgicaux',
    'Equipment Upgrades': 'Mises à Niveau d\'Équipement',
    'Consumables': 'Consommables',
    'Implants': 'Implants',
    'Lenses': 'Lentilles',
    'Ophthalmic Surgical Instruments': 'Instruments Chirurgicaux Ophtalmiques',
    'Ophthalmic Diagnostic': 'Diagnostic Ophtalmique',
    'Ophthalmic Microsurgery': 'Microchirurgie Ophtalmique',
    'Intraocular Lenses': 'Lentilles Intraoculaires',
    'General Surgical Instruments': 'Instruments Chirurgicaux Généraux',
    'Surgical Consumables': 'Consommables Chirurgicaux'
  };
  
  return translations[name] || name;
}

function translateToEnglish(name, type) {
  // Common translations
  const translations = {
    'Ophtalmologie': 'Ophthalmology',
    'Chirurgie': 'Surgery',
    'Médecine Générale': 'General Medicine',
    'Équipement de Diagnostic': 'Diagnostic Equipment',
    'Instruments Chirurgicaux': 'Surgical Instruments',
    'Instruments Microchirurgicaux': 'Microsurgical Instruments',
    'Instruments de Diagnostic': 'Diagnostic Instruments',
    'Accessoires Chirurgicaux': 'Surgical Accessories',
    'Mises à Niveau d\'Équipement': 'Equipment Upgrades',
    'Consommables': 'Consumables',
    'Implants': 'Implants',
    'Lentilles': 'Lenses',
    'Instruments Chirurgicaux Ophtalmiques': 'Ophthalmic Surgical Instruments',
    'Diagnostic Ophtalmique': 'Ophthalmic Diagnostic',
    'Microchirurgie Ophtalmique': 'Ophthalmic Microsurgery',
    'Lentilles Intraoculaires': 'Intraocular Lenses',
    'Instruments Chirurgicaux Généraux': 'General Surgical Instruments',
    'Consommables Chirurgicaux': 'Surgical Consumables',
    'tesssee': 'Test Category'
  };
  
  return translations[name] || name;
}

function generateFrenchDescription(name, type) {
  if (type === 'discipline') {
    return 'Catégorie principale pour ' + name.toLowerCase() + ' et équipements associés.';
  }
  return 'Produits et équipements pour ' + name.toLowerCase() + '.';
}

function generateEnglishDescription(name, type) {
  if (type === 'discipline') {
    return 'Main category for ' + name.toLowerCase() + ' and related equipment.';
  }
  return 'Products and equipment for ' + name.toLowerCase() + '.';
}

// Run the verification
verifyAndFixCategoryTranslations();