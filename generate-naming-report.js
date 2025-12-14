const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function generateReport() {
  console.log('Generating naming report...');

  const allProducts = await prisma.products.findMany({
    include: { product_translations: true }
  });

  // Categories of products needing proper names
  const report = {
    genericNames: [],        // Products with generic placeholder names
    mixedLanguage: [],       // Products with mixed language content
    missingTranslations: [], // Products missing FR or EN translation
    lowQualityNames: []      // Very short or unclear names
  };

  const genericPatterns = [
    /^keeler instrument$/i,
    /^rumex instrument$/i,
    /^moria instrument$/i,
    /^heine instrument$/i,
    /^fci instrument$/i,
    /instrument$/i,
    /^equipement medical/i,
    /^medical equipment$/i,
    /^produit\s/i,
    /^product\s/i
  ];

  const mixedLangPatterns = [
    /\bof\b.*\bde\b/i,
    /\bwith\b.*\bavec\b/i,
    /\bfor\b.*\bpour\b/i,
    /cámara.*lamp.*hendidura/i,
    /système.*of/i,
    /système.*with/i,
    /\bof\b.*ophtalmique/i,
    /\ben\b.*\bwith\b/i
  ];

  for (const product of allProducts) {
    const enTrans = product.product_translations.find(t => t.language_code === 'en');
    const frTrans = product.product_translations.find(t => t.language_code === 'fr');

    const enName = enTrans?.nom || '';
    const frName = frTrans?.nom || '';
    const enDesc = enTrans?.description || '';
    const frDesc = frTrans?.description || '';

    // Check for generic names
    for (const pattern of genericPatterns) {
      if (pattern.test(enName) || pattern.test(frName)) {
        report.genericNames.push({
          sku: product.reference_fournisseur,
          constructeur: product.constructeur,
          name_en: enName,
          name_fr: frName,
          id: product.id
        });
        break;
      }
    }

    // Check for mixed language
    for (const pattern of mixedLangPatterns) {
      if (pattern.test(enName) || pattern.test(frName) || pattern.test(enDesc) || pattern.test(frDesc)) {
        report.mixedLanguage.push({
          sku: product.reference_fournisseur,
          constructeur: product.constructeur,
          name_en: enName,
          name_fr: frName,
          desc_en: enDesc?.substring(0, 100),
          desc_fr: frDesc?.substring(0, 100),
          id: product.id
        });
        break;
      }
    }

    // Check for missing translations
    if (!enTrans || !frTrans || !enName || !frName) {
      report.missingTranslations.push({
        sku: product.reference_fournisseur,
        constructeur: product.constructeur,
        has_en: !!enName,
        has_fr: !!frName,
        name_en: enName || 'MISSING',
        name_fr: frName || 'MISSING',
        id: product.id
      });
    }

    // Check for low quality (very short names)
    if ((enName && enName.length < 10) || (frName && frName.length < 10)) {
      if (!report.genericNames.find(p => p.id === product.id)) {
        report.lowQualityNames.push({
          sku: product.reference_fournisseur,
          constructeur: product.constructeur,
          name_en: enName,
          name_fr: frName,
          id: product.id
        });
      }
    }
  }

  // Generate markdown report
  let markdown = `# Products Requiring Proper Naming - Report
Generated: ${new Date().toISOString().split('T')[0]}

## Executive Summary

| Category | Count |
|----------|-------|
| Generic/Placeholder Names | ${report.genericNames.length} |
| Mixed Language Content | ${report.mixedLanguage.length} |
| Missing Translations | ${report.missingTranslations.length} |
| Low Quality Names | ${report.lowQualityNames.length} |
| **Total Issues** | **${report.genericNames.length + report.mixedLanguage.length + report.missingTranslations.length + report.lowQualityNames.length}** |

---

## 1. Generic/Placeholder Names (${report.genericNames.length} products)

These products have generic names like "KEELER Instrument" or "Rumex Instrument" that need proper product names.

### By Manufacturer

`;

  // Group by manufacturer
  const genericByMfr = {};
  for (const p of report.genericNames) {
    if (!genericByMfr[p.constructeur]) genericByMfr[p.constructeur] = [];
    genericByMfr[p.constructeur].push(p);
  }

  for (const [mfr, products] of Object.entries(genericByMfr).sort((a, b) => b[1].length - a[1].length)) {
    markdown += `#### ${mfr.toUpperCase()} (${products.length} products)\n\n`;
    markdown += `| SKU | Current Name (EN) | Current Name (FR) |\n`;
    markdown += `|-----|-------------------|-------------------|\n`;
    for (const p of products.slice(0, 20)) {
      markdown += `| ${p.sku} | ${p.name_en.substring(0, 40)} | ${p.name_fr.substring(0, 40)} |\n`;
    }
    if (products.length > 20) {
      markdown += `| ... | *${products.length - 20} more products* | |\n`;
    }
    markdown += '\n';
  }

  markdown += `---

## 2. Mixed Language Content (${report.mixedLanguage.length} products)

These products have content mixing French and English in the same field.

| SKU | Manufacturer | Name EN | Name FR |
|-----|--------------|---------|---------|
`;

  for (const p of report.mixedLanguage.slice(0, 30)) {
    markdown += `| ${p.sku} | ${p.constructeur} | ${p.name_en.substring(0, 35)} | ${p.name_fr.substring(0, 35)} |\n`;
  }

  if (report.mixedLanguage.length > 30) {
    markdown += `\n*... and ${report.mixedLanguage.length - 30} more products with mixed language*\n`;
  }

  markdown += `
---

## 3. Missing Translations (${report.missingTranslations.length} products)

These products are missing either French or English translations.

| SKU | Manufacturer | Has EN | Has FR | Available Name |
|-----|--------------|--------|--------|----------------|
`;

  for (const p of report.missingTranslations.slice(0, 20)) {
    markdown += `| ${p.sku} | ${p.constructeur} | ${p.has_en ? 'Yes' : 'No'} | ${p.has_fr ? 'Yes' : 'No'} | ${(p.name_en || p.name_fr).substring(0, 40)} |\n`;
  }

  if (report.missingTranslations.length > 20) {
    markdown += `\n*... and ${report.missingTranslations.length - 20} more products with missing translations*\n`;
  }

  markdown += `
---

## 4. Low Quality Names (${report.lowQualityNames.length} products)

These products have very short names (less than 10 characters) that may need improvement.

| SKU | Manufacturer | Name EN | Name FR |
|-----|--------------|---------|---------|
`;

  for (const p of report.lowQualityNames.slice(0, 20)) {
    markdown += `| ${p.sku} | ${p.constructeur} | ${p.name_en} | ${p.name_fr} |\n`;
  }

  if (report.lowQualityNames.length > 20) {
    markdown += `\n*... and ${report.lowQualityNames.length - 20} more products*\n`;
  }

  markdown += `
---

## Recommendations

### Priority 1: Generic Names
The ${report.genericNames.length} products with generic names should be prioritized. These are primarily:
- **KEELER**: Many products simply named "KEELER Instrument"
- **RUMEX**: Many products simply named "Rumex Instrument"

These need manufacturer documentation or catalog lookup to get proper product names.

### Priority 2: Mixed Language
Fix the ${report.mixedLanguage.length} products with mixed language content by:
- Separating French and English content properly
- Re-translating where needed

### Priority 3: Missing Translations
Add missing translations for ${report.missingTranslations.length} products.

---

## Full Product Lists (CSV Export)

The following CSV files have been generated for bulk editing:
- \`products-needing-names-generic.csv\`
- \`products-needing-names-mixed-lang.csv\`
- \`products-needing-names-missing-trans.csv\`

---

*End of Report*
`;

  // Write markdown report
  fs.writeFileSync('PRODUCTS_NEEDING_PROPER_NAMES.md', markdown);
  console.log('Written: PRODUCTS_NEEDING_PROPER_NAMES.md');

  // Write CSV files for each category
  // Generic names CSV
  let csv = 'SKU,Manufacturer,Current_Name_EN,Current_Name_FR,New_Name_EN,New_Name_FR\n';
  for (const p of report.genericNames) {
    csv += `"${p.sku}","${p.constructeur}","${p.name_en.replace(/"/g, '""')}","${p.name_fr.replace(/"/g, '""')}","",""\n`;
  }
  fs.writeFileSync('products-needing-names-generic.csv', csv);
  console.log('Written: products-needing-names-generic.csv');

  // Mixed language CSV
  csv = 'SKU,Manufacturer,Name_EN,Name_FR,Desc_EN,Desc_FR\n';
  for (const p of report.mixedLanguage) {
    csv += `"${p.sku}","${p.constructeur}","${(p.name_en || '').replace(/"/g, '""')}","${(p.name_fr || '').replace(/"/g, '""')}","${(p.desc_en || '').replace(/"/g, '""')}","${(p.desc_fr || '').replace(/"/g, '""')}"\n`;
  }
  fs.writeFileSync('products-needing-names-mixed-lang.csv', csv);
  console.log('Written: products-needing-names-mixed-lang.csv');

  // Missing translations CSV
  csv = 'SKU,Manufacturer,Has_EN,Has_FR,Available_Name\n';
  for (const p of report.missingTranslations) {
    csv += `"${p.sku}","${p.constructeur}","${p.has_en}","${p.has_fr}","${(p.name_en || p.name_fr).replace(/"/g, '""')}"\n`;
  }
  fs.writeFileSync('products-needing-names-missing-trans.csv', csv);
  console.log('Written: products-needing-names-missing-trans.csv');

  console.log('\nReport generation complete!');
  console.log(`- Generic names: ${report.genericNames.length}`);
  console.log(`- Mixed language: ${report.mixedLanguage.length}`);
  console.log(`- Missing translations: ${report.missingTranslations.length}`);
  console.log(`- Low quality names: ${report.lowQualityNames.length}`);

  await prisma.$disconnect();
}

generateReport().catch(console.error);
