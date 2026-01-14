const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function consolidate() {
  console.log('=== CONSOLIDATING FOSHAN SIZE VARIANTS ===\n');

  // Find the size variants
  const variants = await prisma.products.findMany({
    where: {
      reference_fournisseur: { in: ['FS9251L(S)', 'FS9251L(M)', 'FS9251L(L)'] }
    },
    include: {
      product_translations: true,
      product_media: true
    }
  });

  console.log('Found variants:', variants.length);

  if (variants.length === 0) {
    console.log('No variants found');
    await prisma.$disconnect();
    return;
  }

  // Keep the first one (S) and update it with combined reference
  const keep = variants.find(v => v.reference_fournisseur === 'FS9251L(S)') || variants[0];
  const toDelete = variants.filter(v => v.id !== keep.id);

  console.log('Keeping:', keep.reference_fournisseur);
  console.log('Deleting:', toDelete.map(v => v.reference_fournisseur).join(', '));

  // Update the kept product with combined reference
  await prisma.products.update({
    where: { id: keep.id },
    data: {
      reference_fournisseur: 'FS9251L(S/M/L)'
    }
  });

  // Update translations to mention sizes
  await prisma.product_translations.updateMany({
    where: { product_id: keep.id, language_code: 'fr' },
    data: {
      nom: 'Béquille ajustable tailles S/M/L',
      description: 'Béquille disponible en 3 tailles : S (petit), M (moyen), L (grand). Aluminium léger et durable.'
    }
  });

  await prisma.product_translations.updateMany({
    where: { product_id: keep.id, language_code: 'en' },
    data: {
      nom: 'Adjustable Crutch Sizes S/M/L',
      description: 'Crutch available in 3 sizes: S (small), M (medium), L (large). Lightweight and durable aluminum.'
    }
  });

  // Delete the duplicates
  for (const v of toDelete) {
    await prisma.product_translations.deleteMany({ where: { product_id: v.id } });
    await prisma.product_media.deleteMany({ where: { product_id: v.id } });
    await prisma.products.delete({ where: { id: v.id } });
    console.log('Deleted:', v.reference_fournisseur);
  }

  console.log('\nConsolidation complete!');

  // Verify
  const count = await prisma.products.count({ where: { constructeur: 'foshan' } });
  console.log('Total FOSHAN products now:', count);

  await prisma.$disconnect();
}

consolidate().catch(console.error);
