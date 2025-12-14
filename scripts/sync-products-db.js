const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function syncProducts() {
  console.log('='.repeat(50));
  console.log('PRODUCT DATABASE SYNC');
  console.log('='.repeat(50));

  try {
    // Step 1: Truncate existing product tables
    console.log('\n1. Clearing existing product data...');
    await prisma.$executeRawUnsafe(`
      TRUNCATE product_files, product_attributes, product_media, product_translations, products CASCADE;
    `);
    console.log('   Done!');

    // Step 2: Read and execute the SQL export
    console.log('\n2. Importing product data...');
    const sqlPath = path.join(__dirname, '..', 'db-exports', 'products-full-export.sql');

    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Split by statements and execute
    // The pg_dump uses COPY commands, so we need to execute the whole file
    await prisma.$executeRawUnsafe(sqlContent);

    console.log('   Done!');

    // Step 3: Verify
    console.log('\n3. Verifying import...');
    const productCount = await prisma.products.count();
    const translationCount = await prisma.product_translations.count();

    console.log(`   Products: ${productCount}`);
    console.log(`   Translations: ${translationCount}`);

    console.log('\n' + '='.repeat(50));
    console.log('SYNC COMPLETE!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncProducts();
