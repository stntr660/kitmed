import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateFeaturedProducts() {
  console.log('Starting featured products update...\n');

  try {
    // Step 1: Get current featured products
    const currentFeatured = await prisma.products.findMany({
      where: { is_featured: true },
      select: {
        id: true,
        reference_fournisseur: true,
        constructeur: true,
        product_translations: {
          where: { language_code: 'fr' },
          select: { nom: true }
        }
      }
    });

    console.log(`Current featured products (${currentFeatured.length}):`);
    currentFeatured.forEach(p => {
      console.log(`  - ${p.product_translations[0]?.nom || 'No name'} (${p.reference_fournisseur})`);
    });

    // Step 2: Find high-quality products with:
    // - At least one image
    // - PDF brochure OR good description
    // - Active status
    const highQualityProducts = await prisma.products.findMany({
      where: {
        status: 'active',
        OR: [
          { pdf_brochure_url: { not: null } },
          {
            product_translations: {
              some: {
                description: { not: null },
                language_code: 'fr'
              }
            }
          }
        ]
      },
      include: {
        product_translations: {
          where: { language_code: 'fr' },
          select: {
            nom: true,
            description: true,
            fiche_technique: true
          }
        },
        product_media: {
          where: { type: 'image' },
          select: { id: true, url: true, is_primary: true }
        },
        _count: {
          select: { product_media: true }
        }
      },
      orderBy: [
        { created_at: 'desc' }
      ]
    });

    console.log(`\nFound ${highQualityProducts.length} active products to evaluate...\n`);

    // Step 3: Score products based on content quality
    const scoredProducts = highQualityProducts.map(product => {
      let score = 0;
      const reasons: string[] = [];

      // Has images (more is better)
      const imageCount = product._count.product_media;
      if (imageCount > 0) {
        score += Math.min(imageCount * 10, 30); // Up to 30 points for images
        reasons.push(`${imageCount} image(s)`);
      }

      // Has PDF brochure
      if (product.pdf_brochure_url) {
        score += 25;
        reasons.push('PDF brochure');
      }

      // Has description
      const description = product.product_translations[0]?.description;
      if (description && description.length > 50) {
        score += 20;
        reasons.push('good description');
      } else if (description && description.length > 0) {
        score += 10;
        reasons.push('basic description');
      }

      // Has technical specs
      const ficheTechnique = product.product_translations[0]?.fiche_technique;
      if (ficheTechnique && ficheTechnique.length > 30) {
        score += 15;
        reasons.push('technical specs');
      }

      // Has brand/manufacturer
      if (product.constructeur && product.constructeur.length > 2) {
        score += 10;
        reasons.push('brand');
      }

      return {
        id: product.id,
        name: product.product_translations[0]?.nom || 'Unknown',
        reference: product.reference_fournisseur,
        constructeur: product.constructeur,
        score,
        reasons,
        imageCount,
        hasPdf: !!product.pdf_brochure_url
      };
    });

    // Sort by score (highest first) and filter to minimum quality threshold
    const topProducts = scoredProducts
      .filter(p => p.score >= 35) // Minimum score threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Get top 8

    console.log('Top quality products selected for featuring:');
    topProducts.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.reference})`);
      console.log(`     Score: ${p.score} | Brand: ${p.constructeur}`);
      console.log(`     Reasons: ${p.reasons.join(', ')}`);
      console.log('');
    });

    if (topProducts.length === 0) {
      console.log('No products meet the quality threshold. Aborting.');
      return;
    }

    // Step 4: Remove featured from all products
    const unfeaturedResult = await prisma.products.updateMany({
      where: { is_featured: true },
      data: { is_featured: false }
    });
    console.log(`\nRemoved featured status from ${unfeaturedResult.count} products.`);

    // Step 5: Set new featured products
    const newFeaturedIds = topProducts.map(p => p.id);
    const featuredResult = await prisma.products.updateMany({
      where: { id: { in: newFeaturedIds } },
      data: { is_featured: true }
    });
    console.log(`Set ${featuredResult.count} new featured products.`);

    // Final verification
    const finalFeatured = await prisma.products.findMany({
      where: { is_featured: true },
      select: {
        reference_fournisseur: true,
        constructeur: true,
        product_translations: {
          where: { language_code: 'fr' },
          select: { nom: true }
        }
      }
    });

    console.log(`\n✅ Final featured products (${finalFeatured.length}):`);
    finalFeatured.forEach(p => {
      console.log(`  - ${p.product_translations[0]?.nom || 'No name'} | ${p.constructeur} (${p.reference_fournisseur})`);
    });

    console.log('\n🎉 Featured products updated successfully!');

  } catch (error) {
    console.error('Error updating featured products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateFeaturedProducts()
  .catch(console.error);
