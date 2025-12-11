const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Complete category mapping strategy
const categoryStrategy = {
  // === LEGITIMATE CATEGORIES ===
  'ENT → Examination Devices': 'surgery-instruments',
  'Ophthalmology → Treatment Devices': 'ophthalmology-surgical', 
  'Ophthalmology → Surgical Instruments': 'ophthalmology-surgical',
  'Ophthalmology → Diagnostic Equipment': 'ophthalmology-diagnostic',
  'Medical Equipment': 'surgery-instruments',
  
  // === PROBLEMATIC MAPPINGS ===
  'Pain Management → Topical Treatments': 'surgery-instruments', // Fallback since 'pharmaceutique' missing
  
  // === DATA ERRORS (SKUs in category field) ===
  'SCC14S': 'surgery-instruments',        // These are SKUs, map to default
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
  'SURGICON AG': 'surgery-instruments',  // This is a manufacturer name!
};

async function createMissingCategories() {
  try {
    console.log('🔧 Creating missing categories...');
    
    // Check if pharmaceutique category exists, if not create it
    const pharmaCategory = await prisma.categories.findUnique({
      where: { id: 'pharmaceutique' }
    });
    
    if (!pharmaCategory) {
      console.log('Creating pharmaceutique category...');
      await prisma.categories.create({
        data: {
          id: 'pharmaceutique',
          slug: 'pharmaceutique',
          name: 'Pharmaceutique',
          type: 'discipline',
          is_active: true,
          sort_order: 100,
          category_translations: {
            create: [
              {
                language_code: 'fr',
                name: 'Pharmaceutique',
                description: 'Produits pharmaceutiques et médicaments'
              },
              {
                language_code: 'en', 
                name: 'Pharmaceutical',
                description: 'Pharmaceutical products and medications'
              }
            ]
          }
        }
      });
      console.log('✅ Created pharmaceutique category');
      
      // Update mapping to use the new category
      categoryStrategy['Pain Management → Topical Treatments'] = 'pharmaceutique';
    }
    
    console.log('✅ All required categories ready');
    return categoryStrategy;
    
  } catch (error) {
    console.error('Error creating categories:', error);
    throw error;
  }
}

async function validateCategoryStrategy() {
  try {
    console.log('🔍 Validating category strategy...');
    
    const existingCategories = await prisma.categories.findMany({
      select: { id: true, name: true }
    });
    
    const existingIds = new Set(existingCategories.map(c => c.id));
    
    console.log('\n📊 Validation Results:');
    let allValid = true;
    
    Object.entries(categoryStrategy).forEach(([csvCategory, targetId]) => {
      const exists = existingIds.has(targetId);
      console.log(`${exists ? '✅' : '❌'} ${csvCategory} → ${targetId}`);
      if (!exists) allValid = false;
    });
    
    if (allValid) {
      console.log('\n🎉 All categories validated successfully!');
    } else {
      console.log('\n⚠️  Some target categories missing - run createMissingCategories()');
    }
    
    return allValid;
    
  } catch (error) {
    console.error('Error validating categories:', error);
    throw error;
  }
}

// Export strategy for use in import scripts
module.exports = {
  categoryStrategy,
  createMissingCategories,
  validateCategoryStrategy
};

// Run validation if called directly
if (require.main === module) {
  async function main() {
    try {
      await validateCategoryStrategy();
      
      console.log('\n💡 RECOMMENDED APPROACH:');
      console.log('1. Create missing categories first:');
      console.log('   await createMissingCategories()');
      console.log('2. Then process CSV with complete mapping strategy');
      console.log('3. All products will be properly categorized');
      
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error:', error);
      await prisma.$disconnect();
      process.exit(1);
    }
  }
  
  main();
}