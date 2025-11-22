const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeAllManufacturers() {
  try {
    console.log('🗑️ Starting manufacturer removal...');

    // First, delete all partner translations
    const deletedTranslations = await prisma.partnerTranslation.deleteMany({});
    console.log(`Deleted ${deletedTranslations.count} partner translations`);

    // Then delete all partners
    const deletedPartners = await prisma.partner.deleteMany({});
    console.log(`Deleted ${deletedPartners.count} partners`);

    // Verify removal
    const remainingPartners = await prisma.partner.count();
    const remainingTranslations = await prisma.partnerTranslation.count();

    console.log('\n=== REMOVAL SUMMARY ===');
    console.log(`Remaining partners: ${remainingPartners}`);
    console.log(`Remaining translations: ${remainingTranslations}`);
    
    if (remainingPartners === 0 && remainingTranslations === 0) {
      console.log('✅ All manufacturers successfully removed!');
    } else {
      console.log('⚠️ Some data may still remain');
    }

  } catch (error) {
    console.error('❌ Error removing manufacturers:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeAllManufacturers();