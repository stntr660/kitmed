const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Patterns to remove from descriptions
function cleanDescription(text) {
  if (!text) return text;

  let cleaned = text;

  // Remove HTML links <a href="...">...</a>
  cleaned = cleaned.replace(/<a\s+[^>]*href=[^>]*>.*?<\/a>/gi, '');

  // Remove standalone URLs (http, https, www)
  cleaned = cleaned.replace(/https?:\/\/[^\s<>"']+/gi, '');
  cleaned = cleaned.replace(/www\.[^\s<>"']+/gi, '');

  // Remove leftover product reference codes that look like URLs (comma-separated refs at end)
  // Pattern: product-code,product-code,product-code at end of text
  cleaned = cleaned.replace(/[a-z0-9\-_]+,[a-z0-9\-_,]+$/gi, '');

  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // Clean up trailing/leading whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

async function removeLinksFromDescriptions() {
  console.log('=== REMOVING LINKS FROM DESCRIPTIONS ===\n');

  // Find all descriptions with potential links
  const translations = await prisma.product_translations.findMany({
    where: {
      OR: [
        { description: { contains: 'http' } },
        { description: { contains: 'www.' } },
        { description: { contains: 'href' } },
        { description: { contains: '<a ' } }
      ]
    }
  });

  console.log('Found', translations.length, 'descriptions with links\n');

  let updated = 0;
  let skipped = 0;

  for (const t of translations) {
    const originalDesc = t.description;
    const cleanedDesc = cleanDescription(originalDesc);

    if (cleanedDesc !== originalDesc) {
      await prisma.product_translations.update({
        where: { id: t.id },
        data: { description: cleanedDesc }
      });

      console.log('Updated:', t.nom?.substring(0, 40));
      console.log('  Before:', originalDesc?.substring(0, 100));
      console.log('  After:', cleanedDesc?.substring(0, 100));
      console.log('');
      updated++;
    } else {
      skipped++;
    }
  }

  console.log('\n=== COMPLETE ===');
  console.log('Updated:', updated);
  console.log('Skipped (no change):', skipped);

  await prisma.$disconnect();
}

removeLinksFromDescriptions().catch(console.error);
