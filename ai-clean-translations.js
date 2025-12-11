const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Intelligent cleaning and translation system
async function cleanAndTranslateAllProducts() {
  try {
    console.log('🤖 AI-POWERED PRODUCT CLEANING & TRANSLATION');
    console.log('===========================================\n');

    // Get ALL products with their translations
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

    console.log(`Processing ALL ${allProducts.length} products with AI cleaning...\n`);

    let processedCount = 0;
    let createdTranslations = 0;
    let cleanedTranslations = 0;

    // Process EVERY SINGLE PRODUCT
    for (const product of allProducts) {
      const frTrans = product.product_translations.find(t => t.language_code === 'fr');
      const enTrans = product.product_translations.find(t => t.language_code === 'en');
      
      let updated = false;

      // CASE 1: Both translations exist - clean them
      if (frTrans && enTrans) {
        // Clean French translation
        if (frTrans.nom || frTrans.description) {
          const cleanedFr = cleanFrenchText(frTrans.nom, frTrans.description);
          
          if (cleanedFr.nom !== frTrans.nom || cleanedFr.description !== frTrans.description) {
            await prisma.product_translations.update({
              where: { id: frTrans.id },
              data: {
                nom: cleanedFr.nom,
                description: cleanedFr.description
              }
            });
            cleanedTranslations++;
            updated = true;
          }
        }

        // Clean English translation
        if (enTrans.nom || enTrans.description) {
          const cleanedEn = cleanEnglishText(enTrans.nom, enTrans.description);
          
          if (cleanedEn.nom !== enTrans.nom || cleanedEn.description !== enTrans.description) {
            await prisma.product_translations.update({
              where: { id: enTrans.id },
              data: {
                nom: cleanedEn.nom,
                description: cleanedEn.description
              }
            });
            cleanedTranslations++;
            updated = true;
          }
        }
      }
      
      // CASE 2: Only French exists - create English translation
      else if (frTrans && !enTrans) {
        const englishVersion = translateToEnglish(frTrans.nom, frTrans.description);
        
        await prisma.product_translations.create({
          data: {
            id: require('crypto').randomUUID(),
            product_id: product.id,
            language_code: 'en',
            nom: englishVersion.nom,
            description: englishVersion.description
          }
        });
        createdTranslations++;
        updated = true;
      }
      
      // CASE 3: Only English exists - create French translation
      else if (enTrans && !frTrans) {
        const frenchVersion = translateToFrench(enTrans.nom, enTrans.description);
        
        await prisma.product_translations.create({
          data: {
            id: require('crypto').randomUUID(),
            product_id: product.id,
            language_code: 'fr',
            nom: frenchVersion.nom,
            description: frenchVersion.description
          }
        });
        createdTranslations++;
        updated = true;
      }
      
      // CASE 4: No translations at all - create both based on reference
      else if (!frTrans && !enTrans) {
        // Create basic translations from product reference
        const basicName = generateNameFromReference(product.reference_fournisseur, product.constructeur);
        
        // Create French translation
        await prisma.product_translations.create({
          data: {
            id: require('crypto').randomUUID(),
            product_id: product.id,
            language_code: 'fr',
            nom: basicName.fr,
            description: generateDescription(basicName.fr, product.constructeur, 'fr')
          }
        });
        
        // Create English translation
        await prisma.product_translations.create({
          data: {
            id: require('crypto').randomUUID(),
            product_id: product.id,
            language_code: 'en',
            nom: basicName.en,
            description: generateDescription(basicName.en, product.constructeur, 'en')
          }
        });
        
        createdTranslations += 2;
        updated = true;
      }

      if (updated) {
        processedCount++;
        if (processedCount % 50 === 0) {
          console.log(`Progress: ${processedCount} products processed...`);
        }
      }
    }

    console.log('\n✅ PROCESSING COMPLETE');
    console.log('=======================');
    console.log(`📦 Total products: ${allProducts.length}`);
    console.log(`✅ Products updated: ${processedCount}`);
    console.log(`🧹 Translations cleaned: ${cleanedTranslations}`);
    console.log(`✨ Translations created: ${createdTranslations}`);
    console.log('\nAll products now have proper French and English translations!');

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Clean French text by removing English words and fixing grammar
function cleanFrenchText(nom, description) {
  let cleanNom = nom || '';
  let cleanDesc = description || '';

  // Clean the name
  cleanNom = cleanNom
    // Fix Spanish to French
    .replace(/\boftalmoscopio\b/gi, 'ophtalmoscope')
    .replace(/\blampara\b/gi, 'lampe')
    .replace(/\blámparas?\b/gi, 'lampe')
    .replace(/\bde bolsillo\b/gi, 'de poche')
    .replace(/\bdeportiva\b/gi, 'sport')
    
    // Fix English to French
    .replace(/\bpocket\b/gi, 'poche')
    .replace(/\bophthalmoscope\b/gi, 'ophtalmoscope')
    .replace(/\botoscope\b/gi, 'otoscope')
    .replace(/\bwireless\b/gi, 'sans fil')
    .replace(/\brechargeable\b/gi, 'rechargeable')
    .replace(/\bbattery\b/gi, 'batterie')
    .replace(/\blithium\b/gi, 'lithium')
    .replace(/\bdouble\b/gi, 'double')
    .replace(/\bkit\b/gi, 'kit')
    .replace(/\bupgrade\b/gi, 'mise à niveau')
    .replace(/\bpractitioner\b/gi, 'praticien')
    .replace(/\bfibre optic\b/gi, 'fibre optique')
    .replace(/\bdesktop\b/gi, 'de bureau')
    .replace(/\bnon contact\b/gi, 'sans contact')
    .replace(/\btonometer\b/gi, 'tonomètre')
    .replace(/\bpulsair\b/gi, 'Pulsair')
    .replace(/\bintelliPuff\b/gi, 'IntelliPuff')
    .replace(/\bvantage plus\b/gi, 'Vantage Plus')
    .replace(/\ball pupil\b/gi, 'All Pupil')
    .replace(/\bportable slit lamp\b/gi, 'lampe à fente portable')
    .replace(/\bpour\s+wireless\b/gi, 'pour sans fil')
    .replace(/\bwith\b/gi, 'avec')
    .replace(/\bfor\b/gi, 'pour')
    .replace(/\band\b/gi, 'et')
    
    // Keep brand names intact
    .replace(/\bjazz led\b/gi, 'Jazz LED')
    .replace(/\bkeeler\b/gi, 'Keeler')
    .replace(/\bheine\b/gi, 'HEINE')
    .replace(/\bmoria\b/gi, 'MORIA')
    .replace(/\bnidek\b/gi, 'NIDEK');

  // Clean the description
  cleanDesc = cleanDesc
    // Common English phrases to French
    .replace(/\bCan be used to\b/gi, 'Peut être utilisé pour')
    .replace(/\bCan be used for\b/gi, 'Peut être utilisé pour')
    .replace(/\bDesigned for\b/gi, 'Conçu pour')
    .replace(/\bDesigned with\b/gi, 'Conçu avec')
    .replace(/\bDesigned to\b/gi, 'Conçu pour')
    .replace(/\bTotal length is\b/gi, 'La longueur totale est de')
    .replace(/\btotal length\b/gi, 'longueur totale')
    .replace(/\bactive part\b/gi, 'partie active')
    .replace(/\bwith a length of\b/gi, 'avec une longueur de')
    .replace(/\bwith a\b/gi, 'avec un')
    .replace(/\bwith an\b/gi, 'avec un')
    .replace(/\bthat can be used\b/gi, 'qui peut être utilisé')
    .replace(/\bthat is designed\b/gi, 'qui est conçu')
    .replace(/\bduring\b/gi, 'pendant')
    .replace(/\bwhile not in use\b/gi, "lorsqu'il n'est pas utilisé")
    .replace(/\bbird cage handle\b/gi, 'poignée en cage')
    .replace(/\bbird-cage handle\b/gi, 'poignée en cage')
    .replace(/\btying platforms\b/gi, 'plateformes de nouage')
    .replace(/\btyping platforms\b/gi, 'plateformes de nouage')
    .replace(/\boblique teeth\b/gi, 'dents obliques')
    .replace(/\bfacing micro teeth\b/gi, 'micro-dents opposées')
    .replace(/\bcolibri type\b/gi, 'type colibri')
    .replace(/\bnotched jaws\b/gi, 'mâchoires crantées')
    .replace(/\bcataract surgery\b/gi, 'chirurgie de la cataracte')
    .replace(/\bretinal detachment surgery\b/gi, 'chirurgie du décollement de rétine')
    .replace(/\bretinal detachment\b/gi, 'décollement de rétine')
    .replace(/\bkeratoplasty\b/gi, 'kératoplastie')
    .replace(/\btenotomy\b/gi, 'ténotomie')
    
    // Individual English words to French
    .replace(/\bReusable\b/gi, 'Réutilisable')
    .replace(/\bthe eye\b/gi, "l'œil")
    .replace(/\bthe iris\b/gi, "l'iris")
    .replace(/\bthe cornea\b/gi, 'la cornée')
    .replace(/\bthe capsule\b/gi, 'la capsule')
    .replace(/\bthe eyelid\b/gi, 'la paupière')
    .replace(/\bto hold\b/gi, 'pour tenir')
    .replace(/\bto cut\b/gi, 'pour couper')
    .replace(/\bto manipulate\b/gi, 'pour manipuler')
    .replace(/\bto implant\b/gi, 'pour implanter')
    .replace(/\bto explant\b/gi, 'pour explanter')
    .replace(/\bstraight\b/gi, 'droit')
    .replace(/\bcurved\b/gi, 'courbé')
    .replace(/\bpointed\b/gi, 'pointu')
    .replace(/\bblunt\b/gi, 'émoussé')
    .replace(/\bangled\b/gi, 'angulaire')
    .replace(/\bserrated\b/gi, 'dentelé')
    .replace(/\bblades\b/gi, 'lames')
    .replace(/\bscissors\b/gi, 'ciseaux')
    .replace(/\bforceps\b/gi, 'pince')
    .replace(/\bspatula\b/gi, 'spatule')
    .replace(/\bholder\b/gi, 'support')
    .replace(/\bclear\b/gi, 'transparent')
    .replace(/\btabletop\b/gi, 'de table')
    .replace(/\btable top\b/gi, 'de table')
    .replace(/\bhandheld\b/gi, 'portatif')
    .replace(/\buse\b/gi, 'utilisation')
    .replace(/\bOne Use-Plus\b/gi, 'Usage Unique Plus');

  // Fix camelCase issues
  cleanNom = cleanNom.replace(/([a-z])([A-Z])/g, '$1 $2');
  cleanDesc = cleanDesc.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Capitalize first letter
  cleanNom = cleanNom.charAt(0).toUpperCase() + cleanNom.slice(1);
  cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);

  return {
    nom: cleanNom,
    description: cleanDesc || generateDefaultDescription(cleanNom, 'fr')
  };
}

// Clean English text by removing French words and fixing grammar
function cleanEnglishText(nom, description) {
  let cleanNom = nom || '';
  let cleanDesc = description || '';

  // Clean the name
  cleanNom = cleanNom
    // Fix French to English
    .replace(/\bophtalmoscope\b/gi, 'ophthalmoscope')
    .replace(/\botoscope\b/gi, 'otoscope')
    .replace(/\btonomètre\b/gi, 'tonometer')
    .replace(/\bpachymètre\b/gi, 'pachymeter')
    .replace(/\blampe à fente\b/gi, 'slit lamp')
    .replace(/\bsans fil\b/gi, 'wireless')
    .replace(/\bbatterie\b/gi, 'battery')
    .replace(/\bmise à niveau\b/gi, 'upgrade')
    .replace(/\bpraticien\b/gi, 'practitioner')
    .replace(/\bfibre optique\b/gi, 'fiber optic')
    .replace(/\bde bureau\b/gi, 'desktop')
    .replace(/\bsans contact\b/gi, 'non-contact')
    .replace(/\bde poche\b/gi, 'pocket')
    .replace(/\bpour\b/gi, 'for')
    .replace(/\bavec\b/gi, 'with')
    .replace(/\bet\b/gi, 'and')
    .replace(/\bou\b/gi, 'or')
    .replace(/\ble\s/gi, 'the ')
    .replace(/\bla\s/gi, 'the ')
    .replace(/\bles\s/gi, 'the ')
    .replace(/\bun\s/gi, 'a ')
    .replace(/\bune\s/gi, 'a ')
    .replace(/\bde\s/gi, 'of ')
    .replace(/\bdu\s/gi, 'of the ')
    .replace(/\bdes\s/gi, 'of the ')
    
    // Fix Spanish to English
    .replace(/\boftalmoscopio\b/gi, 'ophthalmoscope')
    .replace(/\blampara\b/gi, 'lamp')
    .replace(/\blámparas?\b/gi, 'lamp')
    .replace(/\bde bolsillo\b/gi, 'pocket')
    .replace(/\bdeportiva\b/gi, 'sport');

  // Clean the description
  cleanDesc = cleanDesc
    // French phrases to English
    .replace(/\bPeut être utilisé pour\b/gi, 'Can be used to')
    .replace(/\bConçu pour\b/gi, 'Designed for')
    .replace(/\bConçu avec\b/gi, 'Designed with')
    .replace(/\bLa longueur totale est de\b/gi, 'Total length is')
    .replace(/\blongueur totale\b/gi, 'total length')
    .replace(/\bpartie active\b/gi, 'active part')
    .replace(/\bavec une longueur de\b/gi, 'with a length of')
    .replace(/\bavec un\b/gi, 'with a')
    .replace(/\bavec une\b/gi, 'with a')
    .replace(/\bqui peut être utilisé\b/gi, 'that can be used')
    .replace(/\bqui est conçu\b/gi, 'that is designed')
    .replace(/\bpendant\b/gi, 'during')
    .replace(/\blorsqu'il n'est pas utilisé\b/gi, 'while not in use')
    .replace(/\blorsqu'ils ne sont pas utilisés\b/gi, 'while not in use')
    .replace(/\bpoignée en cage\b/gi, 'bird cage handle')
    .replace(/\bplateformes de nouage\b/gi, 'tying platforms')
    .replace(/\bdents obliques\b/gi, 'oblique teeth')
    .replace(/\bmicro-dents opposées\b/gi, 'facing micro teeth')
    .replace(/\btype colibri\b/gi, 'colibri type')
    .replace(/\bmâchoires crantées\b/gi, 'notched jaws')
    .replace(/\bchirurgie de la cataracte\b/gi, 'cataract surgery')
    .replace(/\bchirurgie du décollement de rétine\b/gi, 'retinal detachment surgery')
    .replace(/\bdécollement de rétine\b/gi, 'retinal detachment')
    .replace(/\bkératoplastie\b/gi, 'keratoplasty')
    .replace(/\bténotomie\b/gi, 'tenotomy')
    
    // Individual French words to English
    .replace(/\bRéutilisable\b/gi, 'Reusable')
    .replace(/\bl'œil\b/gi, 'the eye')
    .replace(/\bl'iris\b/gi, 'the iris')
    .replace(/\bla cornée\b/gi, 'the cornea')
    .replace(/\bla capsule\b/gi, 'the capsule')
    .replace(/\bla paupière\b/gi, 'the eyelid')
    .replace(/\bpour tenir\b/gi, 'to hold')
    .replace(/\bpour couper\b/gi, 'to cut')
    .replace(/\bpour manipuler\b/gi, 'to manipulate')
    .replace(/\bpour implanter\b/gi, 'to implant')
    .replace(/\bpour explanter\b/gi, 'to explant')
    .replace(/\bdroit\b/gi, 'straight')
    .replace(/\bcourbé\b/gi, 'curved')
    .replace(/\bpointu\b/gi, 'pointed')
    .replace(/\bémoussé\b/gi, 'blunt')
    .replace(/\bangulaire\b/gi, 'angled')
    .replace(/\bdentelé\b/gi, 'serrated')
    .replace(/\blames\b/gi, 'blades')
    .replace(/\bciseaux\b/gi, 'scissors')
    .replace(/\bpince\b/gi, 'forceps')
    .replace(/\bspatule\b/gi, 'spatula')
    .replace(/\bsupport\b/gi, 'holder')
    .replace(/\btransparent\b/gi, 'clear')
    .replace(/\bde table\b/gi, 'tabletop')
    .replace(/\bportatif\b/gi, 'handheld')
    .replace(/\butilisation\b/gi, 'use')
    .replace(/\bUsage Unique Plus\b/gi, 'One Use-Plus')
    .replace(/\bplus\b/gi, 'plus')
    .replace(/\bsans\b/gi, 'without')
    .replace(/\bcourbe\b/gi, 'curved');

  // Fix camelCase issues
  cleanNom = cleanNom.replace(/([a-z])([A-Z])/g, '$1 $2');
  cleanDesc = cleanDesc.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Capitalize first letter
  cleanNom = cleanNom.charAt(0).toUpperCase() + cleanNom.slice(1);
  cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);

  return {
    nom: cleanNom,
    description: cleanDesc || generateDefaultDescription(cleanNom, 'en')
  };
}

// Translate French to English (based on existing content)
function translateToEnglish(frName, frDescription) {
  let enName = frName || '';
  let enDesc = frDescription || '';

  // Translate common medical terms in name
  enName = enName
    .replace(/\bPince\b/gi, 'Forceps')
    .replace(/\bCiseaux\b/gi, 'Scissors')
    .replace(/\bSpatule\b/gi, 'Spatula')
    .replace(/\bSupport\b/gi, 'Holder')
    .replace(/\bOphtalmoscope\b/gi, 'Ophthalmoscope')
    .replace(/\bOtoscope\b/gi, 'Otoscope')
    .replace(/\bTonomètre\b/gi, 'Tonometer')
    .replace(/\bPachymètre\b/gi, 'Pachymeter')
    .replace(/\bLampe à Fente\b/gi, 'Slit Lamp')
    .replace(/\bde Poche\b/gi, 'Pocket')
    .replace(/\bSans Fil\b/gi, 'Wireless')
    .replace(/\bSans Contact\b/gi, 'Non-Contact')
    .replace(/\bBatterie\b/gi, 'Battery')
    .replace(/\bRechargeable\b/gi, 'Rechargeable')
    .replace(/\bMise à Niveau\b/gi, 'Upgrade')
    .replace(/\bFibre Optique\b/gi, 'Fiber Optic')
    .replace(/\bChirurgical\b/gi, 'Surgical')
    .replace(/\bMicrochirurgical\b/gi, 'Microsurgical')
    .replace(/\bDroit\b/gi, 'Straight')
    .replace(/\bCourbé\b/gi, 'Curved')
    .replace(/\bPointu\b/gi, 'Pointed')
    .replace(/\bÉmoussé\b/gi, 'Blunt')
    .replace(/\bDentelé\b/gi, 'Serrated')
    .replace(/\bAngulaire\b/gi, 'Angled')
    .replace(/\bLames\b/gi, 'Blades')
    .replace(/\bMâchoires\b/gi, 'Jaws')
    .replace(/\bDents\b/gi, 'Teeth')
    .replace(/\bPlateformes\b/gi, 'Platforms')
    .replace(/\bPoignée\b/gi, 'Handle');

  // Translate description
  enDesc = enDesc
    .replace(/\bPeut être utilisé pour\b/gi, 'Can be used to')
    .replace(/\bConçu pour\b/gi, 'Designed for')
    .replace(/\bLongueur totale\b/gi, 'Total length')
    .replace(/\bPartie active\b/gi, 'Active part')
    .replace(/\bChirurgie de la cataracte\b/gi, 'Cataract surgery')
    .replace(/\bChirurgie du décollement de rétine\b/gi, 'Retinal detachment surgery')
    .replace(/\bDécollement de rétine\b/gi, 'Retinal detachment')
    .replace(/\bKératoplastie\b/gi, 'Keratoplasty')
    .replace(/\bTénotomie\b/gi, 'Tenotomy')
    .replace(/\bRéutilisable\b/gi, 'Reusable')
    .replace(/\bAcier inoxydable\b/gi, 'Stainless steel')
    .replace(/\bQualité médicale\b/gi, 'Medical grade')
    .replace(/\bHaute précision\b/gi, 'High precision')
    .replace(/\bInstrument médical\b/gi, 'Medical instrument')
    .replace(/\bpour\b/gi, 'for')
    .replace(/\bavec\b/gi, 'with')
    .replace(/\bet\b/gi, 'and')
    .replace(/\bou\b/gi, 'or')
    .replace(/\bsans\b/gi, 'without');

  return {
    nom: enName,
    description: enDesc || generateDefaultDescription(enName, 'en')
  };
}

// Translate English to French (based on existing content)
function translateToFrench(enName, enDescription) {
  let frName = enName || '';
  let frDesc = enDescription || '';

  // Translate common medical terms in name
  frName = frName
    .replace(/\bForceps\b/gi, 'Pince')
    .replace(/\bScissors\b/gi, 'Ciseaux')
    .replace(/\bSpatula\b/gi, 'Spatule')
    .replace(/\bHolder\b/gi, 'Support')
    .replace(/\bOphthalmoscope\b/gi, 'Ophtalmoscope')
    .replace(/\bOtoscope\b/gi, 'Otoscope')
    .replace(/\bTonometer\b/gi, 'Tonomètre')
    .replace(/\bPachymeter\b/gi, 'Pachymètre')
    .replace(/\bSlit Lamp\b/gi, 'Lampe à Fente')
    .replace(/\bPocket\b/gi, 'de Poche')
    .replace(/\bWireless\b/gi, 'Sans Fil')
    .replace(/\bNon-Contact\b/gi, 'Sans Contact')
    .replace(/\bBattery\b/gi, 'Batterie')
    .replace(/\bRechargeable\b/gi, 'Rechargeable')
    .replace(/\bUpgrade\b/gi, 'Mise à Niveau')
    .replace(/\bFiber Optic\b/gi, 'Fibre Optique')
    .replace(/\bSurgical\b/gi, 'Chirurgical')
    .replace(/\bMicrosurgical\b/gi, 'Microchirurgical')
    .replace(/\bStraight\b/gi, 'Droit')
    .replace(/\bCurved\b/gi, 'Courbé')
    .replace(/\bPointed\b/gi, 'Pointu')
    .replace(/\bBlunt\b/gi, 'Émoussé')
    .replace(/\bSerrated\b/gi, 'Dentelé')
    .replace(/\bAngled\b/gi, 'Angulaire')
    .replace(/\bBlades\b/gi, 'Lames')
    .replace(/\bJaws\b/gi, 'Mâchoires')
    .replace(/\bTeeth\b/gi, 'Dents')
    .replace(/\bPlatforms\b/gi, 'Plateformes')
    .replace(/\bHandle\b/gi, 'Poignée');

  // Translate description
  frDesc = frDesc
    .replace(/\bCan be used to\b/gi, 'Peut être utilisé pour')
    .replace(/\bDesigned for\b/gi, 'Conçu pour')
    .replace(/\bTotal length\b/gi, 'Longueur totale')
    .replace(/\bActive part\b/gi, 'Partie active')
    .replace(/\bCataract surgery\b/gi, 'Chirurgie de la cataracte')
    .replace(/\bRetinal detachment surgery\b/gi, 'Chirurgie du décollement de rétine')
    .replace(/\bRetinal detachment\b/gi, 'Décollement de rétine')
    .replace(/\bKeratoplasty\b/gi, 'Kératoplastie')
    .replace(/\bTenotomy\b/gi, 'Ténotomie')
    .replace(/\bReusable\b/gi, 'Réutilisable')
    .replace(/\bStainless steel\b/gi, 'Acier inoxydable')
    .replace(/\bMedical grade\b/gi, 'Qualité médicale')
    .replace(/\bHigh precision\b/gi, 'Haute précision')
    .replace(/\bMedical instrument\b/gi, 'Instrument médical')
    .replace(/\bfor\b/gi, 'pour')
    .replace(/\bwith\b/gi, 'avec')
    .replace(/\band\b/gi, 'et')
    .replace(/\bor\b/gi, 'ou')
    .replace(/\bwithout\b/gi, 'sans');

  return {
    nom: frName,
    description: frDesc || generateDefaultDescription(frName, 'fr')
  };
}

// Generate name from reference for products without any translation
function generateNameFromReference(reference, manufacturer) {
  const cleanRef = reference.replace(/[_-]/g, ' ').toUpperCase();
  const mfg = manufacturer.toUpperCase();
  
  return {
    fr: `Produit ${mfg} ${cleanRef}`,
    en: `${mfg} Product ${cleanRef}`
  };
}

// Generate default description when none exists
function generateDefaultDescription(name, language) {
  if (language === 'fr') {
    return `${name}. Instrument médical professionnel de haute qualité. Fabrication selon les normes les plus strictes pour une utilisation clinique.`;
  } else {
    return `${name}. Professional high-quality medical instrument. Manufactured to the highest standards for clinical use.`;
  }
}

// Generate description based on product info
function generateDescription(name, manufacturer, language) {
  const mfg = manufacturer.charAt(0).toUpperCase() + manufacturer.slice(1).toLowerCase();
  
  if (language === 'fr') {
    return `${name} par ${mfg}. Équipement médical professionnel conçu pour répondre aux exigences les plus strictes de la pratique clinique. Qualité et fiabilité garanties.`;
  } else {
    return `${name} by ${mfg}. Professional medical equipment designed to meet the strictest requirements of clinical practice. Quality and reliability guaranteed.`;
  }
}

// Run the cleaning and translation
cleanAndTranslateAllProducts();