const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Migration script to convert existing Category model data to new Discipline/Category structure
 * This script safely migrates data while preserving all existing relationships
 */

const DISCIPLINE_MAPPING = {
  'cardiology': 'cardiology-disc',
  'radiology': 'radiology-disc', 
  'surgery': 'surgery-disc',
  'laboratory': 'laboratory-disc',
  'emergency': 'emergency-disc',
  'icu': 'icu-disc'
};

async function migrateCategoriesToDisciplines() {
  console.log('🔄 Starting migration from old Category structure to new Discipline/Category structure...');
  
  try {
    // Step 1: Analyze existing data
    console.log('\n📊 Analyzing existing data...');
    const existingCategories = await prisma.category.findMany({
      include: {
        translations: true,
        products: {
          select: { id: true }
        },
        children: {
          select: { id: true, name: true }
        }
      }
    });

    console.log(`Found ${existingCategories.length} existing categories`);
    
    // Categories marked as disciplines (type = 'discipline')
    const disciplineCategories = existingCategories.filter(cat => 
      cat.type === 'discipline' || DISCIPLINE_MAPPING[cat.slug]
    );
    
    // Categories marked as equipment (type = 'equipment' or have parentId)
    const equipmentCategories = existingCategories.filter(cat => 
      cat.type === 'equipment' || cat.parentId
    );

    console.log(`- ${disciplineCategories.length} discipline categories`);
    console.log(`- ${equipmentCategories.length} equipment categories`);

    // Step 2: Create backup
    console.log('\n💾 Creating backup of existing data...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Export current categories for backup
    const backup = {
      timestamp,
      categories: existingCategories,
      totalProducts: await prisma.product.count(),
      migrationMapping: DISCIPLINE_MAPPING
    };
    
    const fs = require('fs');
    const path = require('path');
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(backupDir, `category-migration-backup-${timestamp}.json`),
      JSON.stringify(backup, null, 2)
    );
    console.log(`✅ Backup saved to backups/category-migration-backup-${timestamp}.json`);

    // Step 3: Begin transaction for safe migration
    await prisma.$transaction(async (tx) => {
      console.log('\n🔄 Starting database transaction...');

      // Step 3a: Create new disciplines from existing discipline categories
      console.log('\n📝 Creating disciplines...');
      for (const cat of disciplineCategories) {
        const disciplineId = DISCIPLINE_MAPPING[cat.slug] || `${cat.slug}-disc`;
        
        // Map category data to discipline structure
        const disciplineData = {
          id: disciplineId,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          specialtyCode: generateSpecialtyCode(cat.slug),
          colorCode: generateColorCode(cat.slug),
          iconCode: generateIconCode(cat.slug),
          sortOrder: cat.sortOrder,
          isActive: cat.isActive,
          isFeatured: cat.sortOrder <= 6, // First 6 are featured
          metaTitle: cat.metaTitle,
          metaDescription: cat.metaDescription,
          imageUrl: cat.imageUrl
        };

        await tx.discipline.upsert({
          where: { id: disciplineId },
          update: disciplineData,
          create: disciplineData,
        });

        console.log(`✅ Created discipline: ${disciplineData.name}`);

        // Create discipline translations from category translations
        for (const translation of cat.translations) {
          await tx.disciplineTranslation.upsert({
            where: {
              disciplineId_languageCode: {
                disciplineId: disciplineId,
                languageCode: translation.languageCode
              }
            },
            update: {
              name: translation.name,
              description: translation.description,
              metaTitle: translation.metaTitle,
              metaDescription: translation.metaDescription
            },
            create: {
              disciplineId: disciplineId,
              languageCode: translation.languageCode,
              name: translation.name,
              description: translation.description,
              metaTitle: translation.metaTitle,
              metaDescription: translation.metaDescription
            }
          });
        }
      }

      // Step 3b: Update existing categories to reference disciplines
      console.log('\n🔗 Linking categories to disciplines...');
      
      // First, handle discipline categories (convert them to equipment categories)
      for (const cat of disciplineCategories) {
        const disciplineId = DISCIPLINE_MAPPING[cat.slug] || `${cat.slug}-disc`;
        
        // Update the category to become a top-level equipment category
        await tx.category.update({
          where: { id: cat.id },
          data: {
            disciplineId: disciplineId,
            level: 1,
            parentId: null, // Top level under discipline
            // Remove the type field as it's no longer needed
            type: undefined
          }
        });
        
        console.log(`✅ Linked category "${cat.name}" to discipline`);
      }

      // Handle equipment categories (those with parentId)
      for (const cat of equipmentCategories) {
        let disciplineId = null;
        let level = 2; // Default to level 2 (subcategory)

        if (cat.parentId) {
          // Find parent category and get its discipline
          const parentCategory = await tx.category.findUnique({
            where: { id: cat.parentId }
          });
          
          if (parentCategory && parentCategory.disciplineId) {
            disciplineId = parentCategory.disciplineId;
            level = (parentCategory.level || 1) + 1;
          }
        }

        // If no discipline found from parent, try to infer from category name/slug
        if (!disciplineId) {
          disciplineId = inferDisciplineFromCategory(cat);
        }

        if (disciplineId) {
          await tx.category.update({
            where: { id: cat.id },
            data: {
              disciplineId: disciplineId,
              level: level,
              safetyClass: inferSafetyClass(cat.name),
              type: undefined // Remove type field
            }
          });
          
          console.log(`✅ Linked equipment category "${cat.name}" to discipline`);
        } else {
          console.log(`⚠️  Could not determine discipline for category: ${cat.name}`);
        }
      }

      // Step 3c: Update products to include disciplineId
      console.log('\n🏷️  Updating products with discipline references...');
      
      const products = await tx.product.findMany({
        include: { category: true }
      });

      for (const product of products) {
        if (product.category && product.category.disciplineId) {
          await tx.product.update({
            where: { id: product.id },
            data: {
              disciplineId: product.category.disciplineId,
              // Add medical device fields with defaults
              deviceClass: inferDeviceClass(product.category.name),
              certificationNumbers: [],
              warrantyMonths: 12, // Default 1 year warranty
              maintenanceLevel: 'medium',
              installationLevel: 'simple'
            }
          });
        }
      }
      
      console.log(`✅ Updated ${products.length} products with discipline references`);

      // Step 3d: Clean up old type column
      console.log('\n🧹 Cleaning up old structure...');
      
      // Note: In a real migration, you would use raw SQL to drop the column
      // For now, we'll just mark it as cleaned up
      console.log('✅ Migration transaction completed successfully');
    });

    // Step 4: Validation
    console.log('\n🔍 Validating migration...');
    
    const finalDisciplines = await prisma.discipline.count();
    const finalCategories = await prisma.category.count();
    const productsWithDisciplines = await prisma.product.count({
      where: { disciplineId: { not: null } }
    });
    
    console.log(`✅ Final validation:`);
    console.log(`   - ${finalDisciplines} disciplines created`);
    console.log(`   - ${finalCategories} categories maintained`);
    console.log(`   - ${productsWithDisciplines} products linked to disciplines`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test the application with new structure');
    console.log('2. Update API endpoints to use new discipline/category relationships');
    console.log('3. Update frontend to display discipline-based navigation');
    console.log('4. Once confirmed working, remove old type column from database');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Database has been rolled back to previous state');
    throw error;
  }
}

// Helper functions
function generateSpecialtyCode(slug) {
  const codes = {
    'cardiology': 'CARD-01',
    'radiology': 'RADI-01',
    'surgery': 'SURG-01',
    'laboratory': 'LAB-01',
    'emergency': 'EMER-01',
    'icu': 'ICU-01'
  };
  return codes[slug] || `${slug.toUpperCase().substring(0, 4)}-01`;
}

function generateColorCode(slug) {
  const colors = {
    'cardiology': '#e74c3c',
    'radiology': '#3498db',
    'surgery': '#2ecc71',
    'laboratory': '#f39c12',
    'emergency': '#e67e22',
    'icu': '#9b59b6'
  };
  return colors[slug] || '#7f8c8d';
}

function generateIconCode(slug) {
  const icons = {
    'cardiology': 'heart',
    'radiology': 'xray',
    'surgery': 'scalpel',
    'laboratory': 'microscope',
    'emergency': 'ambulance',
    'icu': 'monitor'
  };
  return icons[slug] || 'medical';
}

function inferDisciplineFromCategory(category) {
  const categoryName = category.name.toLowerCase();
  const categorySlug = category.slug.toLowerCase();
  
  if (categoryName.includes('cardio') || categorySlug.includes('cardio')) {
    return 'cardiology-disc';
  }
  if (categoryName.includes('radio') || categorySlug.includes('radio')) {
    return 'radiology-disc';
  }
  if (categoryName.includes('chirurg') || categorySlug.includes('surg')) {
    return 'surgery-disc';
  }
  if (categoryName.includes('lab') || categorySlug.includes('lab')) {
    return 'laboratory-disc';
  }
  if (categoryName.includes('urgence') || categorySlug.includes('emergency')) {
    return 'emergency-disc';
  }
  if (categoryName.includes('intensif') || categorySlug.includes('icu')) {
    return 'icu-disc';
  }
  
  return null; // Will need manual assignment
}

function inferSafetyClass(categoryName) {
  const name = categoryName.toLowerCase();
  
  if (name.includes('défib') || name.includes('laser') || name.includes('implant')) {
    return 'Class III';
  }
  if (name.includes('monitor') || name.includes('scanner') || name.includes('echo')) {
    return 'Class II';
  }
  return 'Class I'; // Default for basic instruments
}

function inferDeviceClass(categoryName) {
  return inferSafetyClass(categoryName); // Same logic for now
}

// Run migration if called directly
if (require.main === module) {
  migrateCategoriesToDisciplines()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { migrateCategoriesToDisciplines };