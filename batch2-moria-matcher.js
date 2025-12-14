const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Moria products from batch2 CSV that weren't matched due to brand name difference
const moriaProducts = [
  { sku: '11081', title_en: 'Bangerter Forceps with Pushbutton', title_fr: 'Pince Bangerter avec Bouton-Poussoir', desc_en: '8.6cm forceps with 13mm active part for strabismus surgery.', desc_fr: 'Pince 8.6cm avec partie active 13mm pour chirurgie du strabisme.' },
  { sku: '13241', title_en: 'Moria Forceps 7mm Straight Bird Cage', title_fr: 'Pince Moria 7mm Droite Cage Oiseau', desc_en: 'Straight forceps for 10/0 with 7mm platforms and bird cage handle. 12cm.', desc_fr: 'Pince droite pour 10/0 avec plateformes 7mm et manche cage oiseau. 12cm.' }
];

async function matchMoria() {
  console.log('='.repeat(60));
  console.log('MORIA SURGICAL -> MORIA MATCHER');
  console.log('='.repeat(60));

  // Get all MORIA products
  const dbProducts = await prisma.products.findMany({
    where: {
      OR: [
        { constructeur: 'MORIA' },
        { constructeur: 'moria' }
      ]
    },
    include: { product_translations: true }
  });

  console.log(`Found ${dbProducts.length} MORIA products in DB`);

  let matched = 0;

  for (const csvProd of moriaProducts) {
    // Find by SKU
    const dbMatch = dbProducts.find(p => p.reference_fournisseur === csvProd.sku);

    if (dbMatch) {
      console.log(`\nMATCHED: ${csvProd.title_en}`);
      console.log(`  CSV SKU: ${csvProd.sku} -> DB SKU: ${dbMatch.reference_fournisseur}`);

      // Update translations
      await prisma.product_translations.updateMany({
        where: { product_id: dbMatch.id, language_code: 'fr' },
        data: { nom: csvProd.title_fr, description: csvProd.desc_fr }
      });

      await prisma.product_translations.updateMany({
        where: { product_id: dbMatch.id, language_code: 'en' },
        data: { nom: csvProd.title_en, description: csvProd.desc_en }
      });

      matched++;
      console.log(`  Updated!`);
    } else {
      console.log(`\nNOT MATCHED: ${csvProd.title_en} (SKU: ${csvProd.sku})`);

      // Try to find similar SKUs
      const similar = dbProducts.filter(p =>
        p.reference_fournisseur.includes(csvProd.sku.substring(0, 3))
      ).slice(0, 3);

      if (similar.length > 0) {
        console.log(`  Similar SKUs in DB:`);
        for (const s of similar) {
          console.log(`    - ${s.reference_fournisseur}`);
        }
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total matched: ${matched}/${moriaProducts.length}`);

  await prisma.$disconnect();
}

matchMoria().catch(console.error);
