const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

async function fixMixedLanguageDescriptions() {
  try {
    console.log('🔧 FIXING MIXED-LANGUAGE PRODUCT DESCRIPTIONS');
    console.log('=============================================\n');

    // Get all products with translations
    const allProducts = await prisma.products.findMany({
      include: { 
        product_translations: true,
        partners: true
      }
    });

    console.log(`Analyzing ${allProducts.length} products for mixed language issues...\n`);

    // Common words that indicate language mixing
    const frenchWords = ['pour', 'avec', 'le', 'la', 'les', 'un', 'une', 'et', 'de', 'du', 'des', 'dans', 'sur', 'par', 'ce', 'cette', 'ces', 'ou', 'qui', 'que', 'dont', 'où', 'sans', 'sous', 'très', 'tout', 'tous', 'toute', 'toutes', 'plus', 'moins', 'mais', 'donc', 'alors', 'puis', 'enfin', 'aussi', 'encore', 'même', 'déjà', 'jamais', 'toujours', 'souvent', 'parfois', 'peut-être', 'ailleurs', 'ici', 'là', 'partout', 'nulle', 'courbe', 'pachymètre', 'tonomètre'];
    
    const englishWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'without', 'from', 'by', 'about', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'your', 'their', 'our', 'its', 'this', 'that', 'these', 'those', 'all', 'both', 'each', 'every', 'either', 'neither', 'any', 'some', 'many', 'much', 'most', 'few', 'little', 'several', 'enough', 'clear', 'holder', 'table', 'top', 'products', 'designed', 'comfortably', 'hold', 'while', 'not', 'use'];

    const problematicProducts = [];

    for (const product of allProducts) {
      const frTrans = product.product_translations.find(t => t.language_code === 'fr');
      const enTrans = product.product_translations.find(t => t.language_code === 'en');
      
      let hasProblem = false;
      const issues = {
        product,
        frTrans,
        enTrans,
        problems: []
      };

      // Check French text for English words
      if (frTrans) {
        const frNameLower = (frTrans.nom || '').toLowerCase();
        const frDescLower = (frTrans.description || '').toLowerCase();
        
        const englishInFrench = englishWords.filter(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          return regex.test(frNameLower) || regex.test(frDescLower);
        });

        if (englishInFrench.length > 0) {
          hasProblem = true;
          issues.problems.push({
            type: 'english_in_french',
            words: englishInFrench,
            text: frTrans.description || frTrans.nom
          });
        }
      }

      // Check English text for French words
      if (enTrans) {
        const enNameLower = (enTrans.nom || '').toLowerCase();
        const enDescLower = (enTrans.description || '').toLowerCase();
        
        const frenchInEnglish = frenchWords.filter(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          return regex.test(enNameLower) || regex.test(enDescLower);
        });

        if (frenchInEnglish.length > 0) {
          hasProblem = true;
          issues.problems.push({
            type: 'french_in_english',
            words: frenchInEnglish,
            text: enTrans.description || enTrans.nom
          });
        }
      }

      // Check for mixed sentences (e.g., "Un clear table top holder pour your pachmetry products")
      if (frTrans && frTrans.description) {
        const mixedPattern = /(?:Un|Une|Le|La|Les)\s+(?:clear|table|top|holder|your|products|designed|hold)/i;
        if (mixedPattern.test(frTrans.description)) {
          hasProblem = true;
          issues.problems.push({
            type: 'mixed_sentence',
            text: frTrans.description
          });
        }
      }

      if (enTrans && enTrans.description) {
        const mixedPattern = /(?:pour|avec|le|la|les|un|une|courbe|pachymètre|tonomètre)/i;
        if (mixedPattern.test(enTrans.description)) {
          hasProblem = true;
          issues.problems.push({
            type: 'mixed_sentence',
            text: enTrans.description
          });
        }
      }

      if (hasProblem) {
        problematicProducts.push(issues);
      }
    }

    console.log(`Found ${problematicProducts.length} products with mixed-language issues\n`);

    // Display problematic products
    console.log('📋 PRODUCTS WITH MIXED LANGUAGES:');
    console.log('==================================\n');

    let fixedCount = 0;

    for (const issue of problematicProducts.slice(0, 50)) { // Process first 50
      const { product, frTrans, enTrans, problems } = issue;
      
      console.log(`\n📦 ${product.reference_fournisseur} (${product.constructeur})`);
      console.log(`Slug: ${product.slug}`);
      
      problems.forEach(problem => {
        if (problem.type === 'mixed_sentence') {
          console.log(`❌ Mixed sentence: "${problem.text.substring(0, 100)}..."`);
        } else if (problem.type === 'english_in_french') {
          console.log(`❌ English words in French: ${problem.words.join(', ')}`);
        } else if (problem.type === 'french_in_english') {
          console.log(`❌ French words in English: ${problem.words.join(', ')}`);
        }
      });

      // Attempt to fix the descriptions
      let frenchFixed = false;
      let englishFixed = false;

      // Fix French description
      if (frTrans && problems.some(p => p.type === 'english_in_french' || p.type === 'mixed_sentence')) {
        let fixedFrDesc = frTrans.description || '';
        let fixedFrName = frTrans.nom || '';
        
        // Common replacements for French
        fixedFrDesc = fixedFrDesc
          .replace(/\bthe\b/gi, 'le')
          .replace(/\byour\b/gi, 'votre')
          .replace(/\bclear\b/gi, 'transparent')
          .replace(/\btable top holder\b/gi, 'support de table')
          .replace(/\btable top\b/gi, 'plateau de table')
          .replace(/\bholder\b/gi, 'support')
          .replace(/\bproducts\b/gi, 'produits')
          .replace(/\bdesigned\b/gi, 'conçu')
          .replace(/\bcomfortably\b/gi, 'confortablement')
          .replace(/\bhold\b/gi, 'tenir')
          .replace(/\bwhile not in use\b/gi, 'lorsqu\'ils ne sont pas utilisés')
          .replace(/\bhandheld\b/gi, 'portatif')
          .replace(/\bA clear\b/gi, 'Un support transparent')
          .replace(/\bthat is\b/gi, 'qui est')
          .replace(/\bboth\b/gi, 'les deux');

        fixedFrName = fixedFrName
          .replace(/\bclear\b/gi, 'transparent')
          .replace(/\bholder\b/gi, 'support')
          .replace(/\btable top\b/gi, 'plateau de table');

        // Clean up descriptions that start with "Un" or "Une" improperly
        if (fixedFrDesc.match(/^Un\s+[a-z]/)) {
          fixedFrDesc = fixedFrDesc.replace(/^Un\s+/, 'Un ');
        }

        if (fixedFrDesc !== frTrans.description || fixedFrName !== frTrans.nom) {
          await prisma.product_translations.update({
            where: { id: frTrans.id },
            data: {
              nom: fixedFrName,
              description: fixedFrDesc || `${fixedFrName}. Instrument médical professionnel de haute qualité.`
            }
          });
          frenchFixed = true;
          console.log('✅ Fixed French translation');
        }
      }

      // Fix English description
      if (enTrans && problems.some(p => p.type === 'french_in_english' || p.type === 'mixed_sentence')) {
        let fixedEnDesc = enTrans.description || '';
        let fixedEnName = enTrans.nom || '';
        
        // Common replacements for English
        fixedEnDesc = fixedEnDesc
          .replace(/\bpour\b/gi, 'for')
          .replace(/\bavec\b/gi, 'with')
          .replace(/\ble\b/gi, 'the')
          .replace(/\bla\b/gi, 'the')
          .replace(/\bles\b/gi, 'the')
          .replace(/\bun\b/gi, 'a')
          .replace(/\bune\b/gi, 'a')
          .replace(/\bet\b/gi, 'and')
          .replace(/\bde\b/gi, 'of')
          .replace(/\bcourbe\b/gi, 'curved')
          .replace(/\bpachymètre\b/gi, 'pachymeter')
          .replace(/\btonomètre\b/gi, 'tonometer')
          .replace(/\bportatif\b/gi, 'handheld')
          .replace(/\blorsqu\'ils ne sont pas utilisés\b/gi, 'while not in use');

        fixedEnName = fixedEnName
          .replace(/\bpour\b/gi, 'for')
          .replace(/\bavec\b/gi, 'with')
          .replace(/\bcourbe\b/gi, 'curved');

        if (fixedEnDesc !== enTrans.description || fixedEnName !== enTrans.nom) {
          await prisma.product_translations.update({
            where: { id: enTrans.id },
            data: {
              nom: fixedEnName,
              description: fixedEnDesc || `${fixedEnName}. Professional high-quality medical instrument.`
            }
          });
          englishFixed = true;
          console.log('✅ Fixed English translation');
        }
      }

      if (frenchFixed || englishFixed) {
        fixedCount++;
      }
    }

    // Special case: Fix the specific product mentioned by user
    const problematicProduct = await prisma.products.findFirst({
      where: {
        product_translations: {
          some: {
            description: { contains: 'Un clear table top holder pour your pachmetry products' }
          }
        }
      },
      include: { product_translations: true }
    });

    if (problematicProduct) {
      console.log('\n🔧 FIXING SPECIFIC PROBLEMATIC PRODUCT');
      console.log('=====================================');
      console.log(`Product: ${problematicProduct.reference_fournisseur}`);
      
      const frTrans = problematicProduct.product_translations.find(t => t.language_code === 'fr');
      const enTrans = problematicProduct.product_translations.find(t => t.language_code === 'en');
      
      if (frTrans) {
        await prisma.product_translations.update({
          where: { id: frTrans.id },
          data: {
            nom: 'Support de Table Transparent pour Pachymètres',
            description: 'Support de table transparent conçu pour tenir confortablement le pachymètre portatif PachPen et le tonomètre portatif AccuPen lorsqu\'ils ne sont pas utilisés. Design ergonomique et stable pour une utilisation pratique en clinique.'
          }
        });
        console.log('✅ Fixed French version');
      }

      if (enTrans) {
        await prisma.product_translations.update({
          where: { id: enTrans.id },
          data: {
            nom: 'Clear Tabletop Holder for Pachymetry Products',
            description: 'A clear curved tabletop holder designed to comfortably hold both the PachPen handheld pachymeter and AccuPen handheld tonometer while not in use. Ergonomic and stable design for practical clinical use.'
          }
        });
        console.log('✅ Fixed English version');
      }
      
      fixedCount++;
    }

    console.log('\n📊 SUMMARY');
    console.log('==========');
    console.log(`✅ Fixed: ${fixedCount} products`);
    console.log(`📋 Total problematic: ${problematicProducts.length} products`);
    console.log(`⏳ Remaining: ${Math.max(0, problematicProducts.length - fixedCount)} products need manual review`);

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixMixedLanguageDescriptions();