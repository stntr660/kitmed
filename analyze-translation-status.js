const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeTranslationStatus() {
  try {
    console.log('📊 ANALYZING TRANSLATION STATUS FOR ALL PRODUCTS');
    console.log('================================================\n');

    const allProducts = await prisma.products.findMany({
      include: { 
        product_translations: true,
        partners: true
      },
      orderBy: [
        { constructeur: 'asc' },
        { reference_fournisseur: 'asc' }
      ]
    });

    // Categories of issues
    const categories = {
      perfect: [],           // Both languages, no issues
      mixedLanguage: [],     // Still has mixed languages
      missingFrench: [],     // No French translation
      missingEnglish: [],    // No English translation
      missingBoth: [],       // No translations at all
      genericContent: [],    // Has generic/placeholder content
      formattingIssues: [],  // CamelCase or spacing issues
      spanishWords: []       // Still has Spanish words
    };

    // Analyze each product
    for (const product of allProducts) {
      const frTrans = product.product_translations.find(t => t.language_code === 'fr');
      const enTrans = product.product_translations.find(t => t.language_code === 'en');
      
      const productInfo = {
        ref: product.reference_fournisseur,
        manufacturer: product.constructeur,
        slug: product.slug,
        frName: frTrans?.nom || null,
        enName: enTrans?.nom || null,
        frDesc: frTrans?.description || null,
        enDesc: enTrans?.description || null
      };

      let issues = [];

      // Check for missing translations
      if (!frTrans || !frTrans.nom) {
        categories.missingFrench.push(productInfo);
        issues.push('missing_french');
      }
      if (!enTrans || !enTrans.nom) {
        categories.missingEnglish.push(productInfo);
        issues.push('missing_english');
      }
      if ((!frTrans || !frTrans.nom) && (!enTrans || !enTrans.nom)) {
        categories.missingBoth.push(productInfo);
        issues.push('missing_both');
        continue; // Skip further checks
      }

      // Check for mixed languages in French
      if (frTrans?.nom || frTrans?.description) {
        const frText = `${frTrans.nom || ''} ${frTrans.description || ''}`.toLowerCase();
        const englishWords = ['the', 'with', 'for', 'and', 'or', 'but', 'holder', 'clear', 'your', 'products', 'designed', 'can be used', 'reusable'];
        const hasEnglish = englishWords.some(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          return regex.test(frText);
        });
        if (hasEnglish) {
          categories.mixedLanguage.push(productInfo);
          issues.push('english_in_french');
        }
      }

      // Check for mixed languages in English
      if (enTrans?.nom || enTrans?.description) {
        const enText = `${enTrans.nom || ''} ${enTrans.description || ''}`.toLowerCase();
        const frenchWords = ['pour', 'avec', 'le', 'la', 'les', 'un', 'une', 'et', 'ou', 'sans', 'sur', 'dans'];
        const hasFrench = frenchWords.some(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          return regex.test(enText);
        });
        if (hasFrench) {
          categories.mixedLanguage.push(productInfo);
          issues.push('french_in_english');
        }
      }

      // Check for Spanish words
      const allText = `${frTrans?.nom || ''} ${frTrans?.description || ''} ${enTrans?.nom || ''} ${enTrans?.description || ''}`.toLowerCase();
      if (allText.includes('oftalmoscopio') || allText.includes('lampara') || allText.includes('deportiva') || allText.includes('de bolsillo')) {
        categories.spanishWords.push(productInfo);
        issues.push('spanish_words');
      }

      // Check for generic content
      if ((frTrans?.nom && frTrans.nom.includes('Équipement Médical de Précision')) ||
          (enTrans?.nom && enTrans.nom.includes('Precision Medical Equipment')) ||
          (frTrans?.nom && frTrans.nom.includes('Produit ')) ||
          (enTrans?.nom && enTrans.nom.includes('Product '))) {
        categories.genericContent.push(productInfo);
        issues.push('generic_content');
      }

      // Check for formatting issues (camelCase, missing spaces)
      const formatPattern = /[a-z][A-Z]/;
      if ((frTrans?.nom && formatPattern.test(frTrans.nom)) ||
          (enTrans?.nom && formatPattern.test(enTrans.nom)) ||
          (frTrans?.description && formatPattern.test(frTrans.description)) ||
          (enTrans?.description && formatPattern.test(enTrans.description))) {
        categories.formattingIssues.push(productInfo);
        issues.push('formatting');
      }

      // If no issues, it's perfect
      if (issues.length === 0) {
        categories.perfect.push(productInfo);
      }
    }

    // Display results by manufacturer
    const manufacturerStats = {};
    for (const product of allProducts) {
      const mfg = product.constructeur;
      if (!manufacturerStats[mfg]) {
        manufacturerStats[mfg] = {
          total: 0,
          perfect: 0,
          hasIssues: 0,
          missingTranslations: 0
        };
      }
      manufacturerStats[mfg].total++;
      
      const isPerfect = categories.perfect.some(p => p.ref === product.reference_fournisseur && p.manufacturer === mfg);
      const hasMissing = categories.missingFrench.concat(categories.missingEnglish, categories.missingBoth)
        .some(p => p.ref === product.reference_fournisseur && p.manufacturer === mfg);
      
      if (isPerfect) {
        manufacturerStats[mfg].perfect++;
      } else if (hasMissing) {
        manufacturerStats[mfg].missingTranslations++;
      } else {
        manufacturerStats[mfg].hasIssues++;
      }
    }

    // Display summary
    console.log('📈 OVERALL STATUS');
    console.log('=================');
    console.log(`✅ Perfect (no issues): ${categories.perfect.length}`);
    console.log(`⚠️  Mixed languages: ${categories.mixedLanguage.length}`);
    console.log(`❌ Missing French: ${categories.missingFrench.length}`);
    console.log(`❌ Missing English: ${categories.missingEnglish.length}`);
    console.log(`❌ Missing both: ${categories.missingBoth.length}`);
    console.log(`📝 Generic content: ${categories.genericContent.length}`);
    console.log(`🔧 Formatting issues: ${categories.formattingIssues.length}`);
    console.log(`🇪🇸 Spanish words: ${categories.spanishWords.length}`);
    console.log(`\n📦 Total products: ${allProducts.length}`);

    console.log('\n\n📊 BY MANUFACTURER');
    console.log('===================');
    
    Object.entries(manufacturerStats)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([mfg, stats]) => {
        const percentPerfect = Math.round((stats.perfect / stats.total) * 100);
        console.log(`\n${mfg.toUpperCase()}`);
        console.log(`  Total: ${stats.total} products`);
        console.log(`  ✅ Perfect: ${stats.perfect} (${percentPerfect}%)`);
        console.log(`  ⚠️  Has issues: ${stats.hasIssues}`);
        console.log(`  ❌ Missing translations: ${stats.missingTranslations}`);
      });

    // Show sample problematic products
    console.log('\n\n❌ SAMPLE PRODUCTS WITH ISSUES');
    console.log('================================');
    
    console.log('\n1. MIXED LANGUAGES (first 5):');
    categories.mixedLanguage.slice(0, 5).forEach(p => {
      console.log(`  ${p.manufacturer} ${p.ref}`);
      if (p.frName) console.log(`    FR: "${p.frName.substring(0, 60)}..."`);
      if (p.enName) console.log(`    EN: "${p.enName.substring(0, 60)}..."`);
    });

    console.log('\n2. FORMATTING ISSUES (first 5):');
    categories.formattingIssues.slice(0, 5).forEach(p => {
      console.log(`  ${p.manufacturer} ${p.ref}`);
      if (p.frName) console.log(`    FR: "${p.frName.substring(0, 60)}..."`);
      if (p.enName) console.log(`    EN: "${p.enName.substring(0, 60)}..."`);
    });

    console.log('\n3. GENERIC CONTENT (first 5):');
    categories.genericContent.slice(0, 5).forEach(p => {
      console.log(`  ${p.manufacturer} ${p.ref}`);
      if (p.frName) console.log(`    FR: "${p.frName.substring(0, 60)}..."`);
      if (p.enName) console.log(`    EN: "${p.enName.substring(0, 60)}..."`);
    });

    console.log('\n4. SPANISH WORDS (first 5):');
    categories.spanishWords.slice(0, 5).forEach(p => {
      console.log(`  ${p.manufacturer} ${p.ref}`);
      if (p.frName) console.log(`    FR: "${p.frName.substring(0, 60)}..."`);
    });

    // Show which ones need most attention
    console.log('\n\n🎯 PRIORITY FIXES NEEDED');
    console.log('========================');
    const priorityManufacturers = Object.entries(manufacturerStats)
      .filter(([mfg, stats]) => stats.perfect < stats.total * 0.5)
      .sort((a, b) => a[1].perfect / a[1].total - b[1].perfect / b[1].total);
    
    console.log('Manufacturers needing most work:');
    priorityManufacturers.slice(0, 10).forEach(([mfg, stats]) => {
      const percentFixed = Math.round((stats.perfect / stats.total) * 100);
      console.log(`  ${mfg}: Only ${percentFixed}% complete (${stats.perfect}/${stats.total})`);
    });

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

analyzeTranslationStatus();