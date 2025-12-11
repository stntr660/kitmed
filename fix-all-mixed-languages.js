const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Translation mappings for common medical terms
const medicalTranslations = {
  // Medical devices
  'pachymeter': { fr: 'pachymètre', en: 'pachymeter' },
  'tonometer': { fr: 'tonomètre', en: 'tonometer' },
  'ophthalmoscope': { fr: 'ophtalmoscope', en: 'ophthalmoscope' },
  'forceps': { fr: 'pince', en: 'forceps' },
  'scissors': { fr: 'ciseaux', en: 'scissors' },
  'holder': { fr: 'support', en: 'holder' },
  'spatula': { fr: 'spatule', en: 'spatula' },
  
  // Common terms
  'clear': { fr: 'transparent', en: 'clear' },
  'curved': { fr: 'courbé', en: 'curved' },
  'straight': { fr: 'droit', en: 'straight' },
  'pointed': { fr: 'pointu', en: 'pointed' },
  'blunt': { fr: 'émoussé', en: 'blunt' },
  'serrated': { fr: 'dentelé', en: 'serrated' },
  'angled': { fr: 'angulaire', en: 'angled' },
  'blades': { fr: 'lames', en: 'blades' },
  'handle': { fr: 'poignée', en: 'handle' },
  'platform': { fr: 'plateforme', en: 'platform' },
  'platforms': { fr: 'plateformes', en: 'platforms' },
  'teeth': { fr: 'dents', en: 'teeth' },
  'jaws': { fr: 'mâchoires', en: 'jaws' },
  
  // Procedures
  'cataract surgery': { fr: 'chirurgie de la cataracte', en: 'cataract surgery' },
  'retinal detachment': { fr: 'décollement de rétine', en: 'retinal detachment' },
  'keratoplasty': { fr: 'kératoplastie', en: 'keratoplasty' },
  
  // Actions
  'designed': { fr: 'conçu', en: 'designed' },
  'can be used': { fr: 'peut être utilisé', en: 'can be used' },
  'hold': { fr: 'tenir', en: 'hold' },
  'cut': { fr: 'couper', en: 'cut' },
  'manipulate': { fr: 'manipuler', en: 'manipulate' },
  'implant': { fr: 'implanter', en: 'implant' },
  'explant': { fr: 'explanter', en: 'explant' }
};

async function fixAllMixedLanguages() {
  try {
    console.log('🔧 COMPREHENSIVE FIX FOR ALL MIXED-LANGUAGE DESCRIPTIONS');
    console.log('========================================================\n');

    // Get all products with translations
    const allProducts = await prisma.products.findMany({
      include: { product_translations: true }
    });

    console.log(`Processing ${allProducts.length} products...\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const product of allProducts) {
      const frTrans = product.product_translations.find(t => t.language_code === 'fr');
      const enTrans = product.product_translations.find(t => t.language_code === 'en');
      
      let needsFix = false;

      // Process French translation
      if (frTrans && (frTrans.nom || frTrans.description)) {
        let frName = frTrans.nom || '';
        let frDesc = frTrans.description || '';
        
        // Clean French text - remove English words
        const originalFrName = frName;
        const originalFrDesc = frDesc;
        
        // Fix common patterns in French
        frDesc = frDesc
          // English phrases to French
          .replace(/\bCan be used to\b/gi, 'Peut être utilisé pour')
          .replace(/\bDesigned for\b/gi, 'Conçu pour')
          .replace(/\bDesigned with\b/gi, 'Conçu avec')
          .replace(/\bTotal length is\b/gi, 'La longueur totale est de')
          .replace(/\btotal length\b/gi, 'longueur totale')
          .replace(/\bwith a\b/gi, 'avec un')
          .replace(/\bwith an\b/gi, 'avec un')
          .replace(/\bduring\b/gi, 'pendant')
          .replace(/\bwhile not in use\b/gi, "lorsqu'ils ne sont pas utilisés")
          .replace(/\bactive part\b/gi, 'partie active')
          .replace(/\bbird cage handle\b/gi, 'poignée en cage')
          .replace(/\bbird-cage handle\b/gi, 'poignée en cage')
          .replace(/\btyping platforms\b/gi, 'plateformes de nouage')
          .replace(/\btying platforms\b/gi, 'plateformes de nouage')
          .replace(/\boblique teeth\b/gi, 'dents obliques')
          .replace(/\bfacing micro teeth\b/gi, 'micro-dents opposées')
          .replace(/\bcolibri type\b/gi, 'type colibri')
          .replace(/\bnotched jaws\b/gi, 'mâchoires crantées')
          
          // Individual words
          .replace(/\bReusable\b/gi, 'Réutilisable')
          .replace(/\bthe\b/gi, 'le')
          .replace(/\byour\b/gi, 'votre')
          .replace(/\btheir\b/gi, 'leur')
          .replace(/\bclear\b/gi, 'transparent')
          .replace(/\btable top\b/gi, 'plateau de table')
          .replace(/\btabletop\b/gi, 'plateau de table')
          .replace(/\bholder\b/gi, 'support')
          .replace(/\bproducts\b/gi, 'produits')
          .replace(/\bhandheld\b/gi, 'portatif')
          .replace(/\bboth\b/gi, 'les deux')
          .replace(/\bthat is\b/gi, 'qui est')
          .replace(/\bto hold\b/gi, 'pour tenir')
          .replace(/\bto cut\b/gi, 'pour couper')
          .replace(/\bto manipulate\b/gi, 'pour manipuler')
          .replace(/\bto implant\b/gi, 'pour implanter')
          .replace(/\bto explant\b/gi, 'pour explanter')
          .replace(/\bor\b/gi, 'ou')
          .replace(/\buse\b/gi, 'utilisation')
          .replace(/\bwithout\b/gi, 'sans');

        frName = frName
          .replace(/\bclear\b/gi, 'transparent')
          .replace(/\bholder\b/gi, 'support')
          .replace(/\btable top\b/gi, 'plateau de table')
          .replace(/\bReusable\b/gi, 'Réutilisable');

        // Clean up bad formatting
        frDesc = frDesc.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add spaces between camelCase
        frName = frName.replace(/([a-z])([A-Z])/g, '$1 $2');

        if (frName !== originalFrName || frDesc !== originalFrDesc) {
          try {
            await prisma.product_translations.update({
              where: { id: frTrans.id },
              data: {
                nom: frName || originalFrName,
                description: frDesc || 'Instrument médical professionnel de haute qualité.'
              }
            });
            needsFix = true;
          } catch (e) {
            errorCount++;
          }
        }
      }

      // Process English translation
      if (enTrans && (enTrans.nom || enTrans.description)) {
        let enName = enTrans.nom || '';
        let enDesc = enTrans.description || '';
        
        const originalEnName = enName;
        const originalEnDesc = enDesc;
        
        // Fix common patterns in English
        enDesc = enDesc
          // French phrases to English
          .replace(/\bPeut être utilisé pour\b/gi, 'Can be used to')
          .replace(/\bConçu pour\b/gi, 'Designed for')
          .replace(/\bConçu avec\b/gi, 'Designed with')
          .replace(/\bLa longueur totale est de\b/gi, 'Total length is')
          .replace(/\blongueur totale\b/gi, 'total length')
          .replace(/\bavec un\b/gi, 'with a')
          .replace(/\bavec une\b/gi, 'with a')
          .replace(/\bpendant\b/gi, 'during')
          .replace(/\blorsqu'ils ne sont pas utilisés\b/gi, 'while not in use')
          .replace(/\bpartie active\b/gi, 'active part')
          .replace(/\bpoignée en cage\b/gi, 'bird cage handle')
          .replace(/\bplateformes de nouage\b/gi, 'tying platforms')
          .replace(/\bdents obliques\b/gi, 'oblique teeth')
          .replace(/\bmicro-dents opposées\b/gi, 'facing micro teeth')
          .replace(/\btype colibri\b/gi, 'colibri type')
          .replace(/\bmâchoires crantées\b/gi, 'notched jaws')
          
          // Individual French words to English
          .replace(/\bpour\b/gi, 'for')
          .replace(/\bavec\b/gi, 'with')
          .replace(/\ble\s/gi, 'the ')
          .replace(/\bla\s/gi, 'the ')
          .replace(/\bles\s/gi, 'the ')
          .replace(/\bun\s/gi, 'a ')
          .replace(/\bune\s/gi, 'a ')
          .replace(/\bet\b/gi, 'and')
          .replace(/\bde\s/gi, 'of ')
          .replace(/\bdu\s/gi, 'of the ')
          .replace(/\bdes\s/gi, 'of the ')
          .replace(/\bcourbe\b/gi, 'curved')
          .replace(/\bcourbé\b/gi, 'curved')
          .replace(/\bpachymètre\b/gi, 'pachymeter')
          .replace(/\btonomètre\b/gi, 'tonometer')
          .replace(/\bportatif\b/gi, 'handheld')
          .replace(/\bou\b/gi, 'or')
          .replace(/\bsans\b/gi, 'without')
          .replace(/\bplus\b/gi, 'plus');

        enName = enName
          .replace(/\bpour\b/gi, 'for')
          .replace(/\bavec\b/gi, 'with')
          .replace(/\bcourbe\b/gi, 'curved')
          .replace(/\bplus\b/gi, 'plus');

        // Clean up bad formatting
        enDesc = enDesc.replace(/([a-z])([A-Z])/g, '$1 $2');
        enName = enName.replace(/([a-z])([A-Z])/g, '$1 $2');

        if (enName !== originalEnName || enDesc !== originalEnDesc) {
          try {
            await prisma.product_translations.update({
              where: { id: enTrans.id },
              data: {
                nom: enName || originalEnName,
                description: enDesc || 'Professional high-quality medical instrument.'
              }
            });
            needsFix = true;
          } catch (e) {
            errorCount++;
          }
        }
      }

      if (needsFix) {
        fixedCount++;
        if (fixedCount % 50 === 0) {
          console.log(`Progress: Fixed ${fixedCount} products...`);
        }
      }
    }

    console.log('\n📊 FINAL SUMMARY');
    console.log('================');
    console.log(`✅ Total fixed: ${fixedCount} products`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(`📦 Total processed: ${allProducts.length} products`);
    console.log('\n✨ All mixed-language issues have been addressed!');

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixAllMixedLanguages();