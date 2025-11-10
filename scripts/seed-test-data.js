#!/usr/bin/env node

/**
 * KITMED Test Data Seeding Script
 * Adds sample categories and manufacturer partners for complete testing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Starting KITMED test data seeding...\n');

  try {
    // 1. Add sample categories
    console.log('📂 Creating sample categories...');
    const categories = [
      {
        id: 'cardiology',
        name: 'Cardiologie',
        slug: 'cardiologie',
        description: 'Équipements pour cardiologie et surveillance cardiaque',
        sortOrder: 1,
        isActive: true,
        metaTitle: 'Équipements de Cardiologie | KITMED',
        metaDescription: 'Découvrez notre gamme d\'équipements de cardiologie professionnels'
      },
      {
        id: 'radiology',
        name: 'Radiologie',
        slug: 'radiologie', 
        description: 'Équipements d\'imagerie médicale et radiologie',
        sortOrder: 2,
        isActive: true,
        metaTitle: 'Équipements de Radiologie | KITMED',
        metaDescription: 'Solutions d\'imagerie médicale et équipements de radiologie'
      },
      {
        id: 'surgery',
        name: 'Chirurgie',
        slug: 'chirurgie',
        description: 'Instruments et équipements chirurgicaux',
        sortOrder: 3,
        isActive: true,
        metaTitle: 'Équipements de Chirurgie | KITMED',
        metaDescription: 'Instruments chirurgicaux et équipements de bloc opératoire'
      },
      {
        id: 'laboratory',
        name: 'Laboratoire',
        slug: 'laboratoire',
        description: 'Équipements et instruments de laboratoire médical',
        sortOrder: 4,
        isActive: true,
        metaTitle: 'Équipements de Laboratoire | KITMED',
        metaDescription: 'Équipements de laboratoire médical et instruments d\'analyse'
      },
      {
        id: 'emergency',
        name: 'Urgences',
        slug: 'urgences',
        description: 'Équipements d\'urgence et de réanimation',
        sortOrder: 5,
        isActive: true,
        metaTitle: 'Équipements d\'Urgence | KITMED',
        metaDescription: 'Matériel médical d\'urgence et équipements de réanimation'
      },
      {
        id: 'icu',
        name: 'Soins Intensifs',
        slug: 'soins-intensifs',
        description: 'Équipements de soins intensifs et surveillance continue',
        sortOrder: 6,
        isActive: true,
        metaTitle: 'Équipements de Soins Intensifs | KITMED',
        metaDescription: 'Équipements de surveillance et soins intensifs'
      }
    ];

    for (const category of categories) {
      try {
        await prisma.category.upsert({
          where: { id: category.id },
          update: category,
          create: category
        });
        console.log(`✅ Category created: ${category.name}`);
      } catch (error) {
        console.log(`⚠️  Category ${category.name} already exists, skipping...`);
      }
    }

    // Add category translations
    console.log('\n🌐 Adding category translations...');
    const categoryTranslations = [
      // Cardiology
      { categoryId: 'cardiology', languageCode: 'fr', name: 'Cardiologie', description: 'Équipements pour cardiologie et surveillance cardiaque' },
      { categoryId: 'cardiology', languageCode: 'en', name: 'Cardiology', description: 'Cardiology and cardiac monitoring equipment' },
      
      // Radiology
      { categoryId: 'radiology', languageCode: 'fr', name: 'Radiologie', description: 'Équipements d\'imagerie médicale et radiologie' },
      { categoryId: 'radiology', languageCode: 'en', name: 'Radiology', description: 'Medical imaging and radiology equipment' },
      
      // Surgery
      { categoryId: 'surgery', languageCode: 'fr', name: 'Chirurgie', description: 'Instruments et équipements chirurgicaux' },
      { categoryId: 'surgery', languageCode: 'en', name: 'Surgery', description: 'Surgical instruments and equipment' },
      
      // Laboratory
      { categoryId: 'laboratory', languageCode: 'fr', name: 'Laboratoire', description: 'Équipements et instruments de laboratoire médical' },
      { categoryId: 'laboratory', languageCode: 'en', name: 'Laboratory', description: 'Medical laboratory equipment and instruments' },
      
      // Emergency
      { categoryId: 'emergency', languageCode: 'fr', name: 'Urgences', description: 'Équipements d\'urgence et de réanimation' },
      { categoryId: 'emergency', languageCode: 'en', name: 'Emergency', description: 'Emergency and resuscitation equipment' },
      
      // ICU
      { categoryId: 'icu', languageCode: 'fr', name: 'Soins Intensifs', description: 'Équipements de soins intensifs et surveillance continue' },
      { categoryId: 'icu', languageCode: 'en', name: 'Intensive Care', description: 'Intensive care and continuous monitoring equipment' }
    ];

    for (const translation of categoryTranslations) {
      try {
        await prisma.categoryTranslation.upsert({
          where: { 
            categoryId_languageCode: { 
              categoryId: translation.categoryId, 
              languageCode: translation.languageCode 
            }
          },
          update: translation,
          create: translation
        });
      } catch (error) {
        // Translation might already exist
      }
    }

    // 2. Add manufacturer partners
    console.log('\n🏭 Creating manufacturer partners...');
    const manufacturers = [
      {
        id: 'philips-healthcare',
        name: 'Philips Healthcare',
        slug: 'philips-healthcare',
        description: 'Leader mondial en technologie de la santé',
        websiteUrl: 'https://www.philips.com/healthcare',
        logoUrl: null,
        isFeatured: true,
        status: 'active',
        sortOrder: 1
      },
      {
        id: 'siemens-healthineers',
        name: 'Siemens Healthineers',
        slug: 'siemens-healthineers',
        description: 'Innovateur en technologies médicales',
        websiteUrl: 'https://www.siemens-healthineers.com',
        logoUrl: null,
        isFeatured: true,
        status: 'active',
        sortOrder: 2
      },
      {
        id: 'ge-healthcare',
        name: 'GE Healthcare',
        slug: 'ge-healthcare',
        description: 'Solutions médicales et technologies de pointe',
        websiteUrl: 'https://www.gehealthcare.com',
        logoUrl: null,
        isFeatured: true,
        status: 'active',
        sortOrder: 3
      },
      {
        id: 'medtronic',
        name: 'Medtronic',
        slug: 'medtronic',
        description: 'Technologies médicales et thérapies innovantes',
        websiteUrl: 'https://www.medtronic.com',
        logoUrl: null,
        isFeatured: false,
        status: 'active',
        sortOrder: 4
      },
      {
        id: 'abbott',
        name: 'Abbott',
        slug: 'abbott',
        description: 'Diagnostics et dispositifs médicaux',
        websiteUrl: 'https://www.abbott.com',
        logoUrl: null,
        isFeatured: false,
        status: 'active',
        sortOrder: 5
      }
    ];

    for (const manufacturer of manufacturers) {
      try {
        await prisma.partner.upsert({
          where: { id: manufacturer.id },
          update: manufacturer,
          create: manufacturer
        });
        console.log(`✅ Manufacturer created: ${manufacturer.name}`);
      } catch (error) {
        console.log(`⚠️  Manufacturer ${manufacturer.name} already exists, skipping...`);
      }
    }

    // Add manufacturer translations
    console.log('\n🌐 Adding manufacturer translations...');
    const manufacturerTranslations = [
      // Philips Healthcare
      { partnerId: 'philips-healthcare', languageCode: 'fr', name: 'Philips Healthcare', description: 'Leader mondial en technologie de la santé' },
      { partnerId: 'philips-healthcare', languageCode: 'en', name: 'Philips Healthcare', description: 'Global leader in health technology' },
      
      // Siemens Healthineers  
      { partnerId: 'siemens-healthineers', languageCode: 'fr', name: 'Siemens Healthineers', description: 'Innovateur en technologies médicales' },
      { partnerId: 'siemens-healthineers', languageCode: 'en', name: 'Siemens Healthineers', description: 'Innovator in medical technologies' },
      
      // GE Healthcare
      { partnerId: 'ge-healthcare', languageCode: 'fr', name: 'GE Healthcare', description: 'Solutions médicales et technologies de pointe' },
      { partnerId: 'ge-healthcare', languageCode: 'en', name: 'GE Healthcare', description: 'Medical solutions and cutting-edge technologies' },
      
      // Medtronic
      { partnerId: 'medtronic', languageCode: 'fr', name: 'Medtronic', description: 'Technologies médicales et thérapies innovantes' },
      { partnerId: 'medtronic', languageCode: 'en', name: 'Medtronic', description: 'Medical technologies and innovative therapies' },
      
      // Abbott
      { partnerId: 'abbott', languageCode: 'fr', name: 'Abbott', description: 'Diagnostics et dispositifs médicaux' },
      { partnerId: 'abbott', languageCode: 'en', name: 'Abbott', description: 'Diagnostics and medical devices' }
    ];

    for (const translation of manufacturerTranslations) {
      try {
        await prisma.partnerTranslation.upsert({
          where: { 
            partnerId_languageCode: { 
              partnerId: translation.partnerId, 
              languageCode: translation.languageCode 
            }
          },
          update: translation,
          create: translation
        });
      } catch (error) {
        // Translation might already exist
      }
    }

    console.log('\n✅ Test data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${categories.length} categories created`);
    console.log(`   • ${manufacturers.length} manufacturer partners created`);
    console.log(`   • Multilingual support added for all items`);
    console.log('\n🎯 Testing is now ready:');
    console.log('   • Product form category dropdown will be populated');
    console.log('   • Manufacturer dropdown will show all 5 manufacturers');
    console.log('   • Categories API will return structured data');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding if called directly
if (require.main === module) {
  seedTestData().catch(console.error);
}

module.exports = { seedTestData };