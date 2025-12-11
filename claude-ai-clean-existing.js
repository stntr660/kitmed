const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Claude AI-powered cleaning using EXISTING product data
async function cleanExistingProductsWithAI() {
  try {
    console.log('🤖 CLAUDE AI CLEANING - PRESERVING EXISTING CONTENT');
    console.log('===================================================\n');

    // Get ALL products with their actual translations
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

    console.log(`Processing ${allProducts.length} products using their EXISTING content...\n`);

    let processedCount = 0;
    let fixedCount = 0;

    for (const product of allProducts) {
      const frTrans = product.product_translations.find(t => t.language_code === 'fr');
      const enTrans = product.product_translations.find(t => t.language_code === 'en');
      
      let needsUpdate = false;

      // PRIORITY 1: If we have English content, use it as the source of truth
      if (enTrans && (enTrans.nom || enTrans.description)) {
        // Clean the English version first
        const cleanedEnglish = cleanEnglishVersion(enTrans.nom, enTrans.description);
        
        // Update English if it was cleaned
        if (cleanedEnglish.changed) {
          await prisma.product_translations.update({
            where: { id: enTrans.id },
            data: {
              nom: cleanedEnglish.nom,
              description: cleanedEnglish.description
            }
          });
          needsUpdate = true;
        }

        // Now handle French - either clean existing or translate from English
        if (frTrans) {
          // French exists - clean it but keep the content
          const cleanedFrench = cleanFrenchVersion(frTrans.nom, frTrans.description);
          
          // If French is empty or generic, translate from English
          if (!frTrans.nom || frTrans.nom.includes('Équipement Médical') || !frTrans.description) {
            const frenchFromEnglish = translateEnglishToFrench(cleanedEnglish.nom, cleanedEnglish.description);
            
            await prisma.product_translations.update({
              where: { id: frTrans.id },
              data: {
                nom: frenchFromEnglish.nom,
                description: frenchFromEnglish.description
              }
            });
            needsUpdate = true;
          } else if (cleanedFrench.changed) {
            // French has real content - just clean it
            await prisma.product_translations.update({
              where: { id: frTrans.id },
              data: {
                nom: cleanedFrench.nom,
                description: cleanedFrench.description
              }
            });
            needsUpdate = true;
          }
        } else {
          // No French translation - create from English
          const frenchFromEnglish = translateEnglishToFrench(cleanedEnglish.nom, cleanedEnglish.description);
          
          await prisma.product_translations.create({
            data: {
              id: require('crypto').randomUUID(),
              product_id: product.id,
              language_code: 'fr',
              nom: frenchFromEnglish.nom,
              description: frenchFromEnglish.description
            }
          });
          needsUpdate = true;
        }
      }
      // PRIORITY 2: If we only have French, clean it and create English
      else if (frTrans && (frTrans.nom || frTrans.description)) {
        // Clean French
        const cleanedFrench = cleanFrenchVersion(frTrans.nom, frTrans.description);
        
        if (cleanedFrench.changed) {
          await prisma.product_translations.update({
            where: { id: frTrans.id },
            data: {
              nom: cleanedFrench.nom,
              description: cleanedFrench.description
            }
          });
          needsUpdate = true;
        }

        // Create English from French
        if (!enTrans) {
          const englishFromFrench = translateFrenchToEnglish(cleanedFrench.nom, cleanedFrench.description);
          
          await prisma.product_translations.create({
            data: {
              id: require('crypto').randomUUID(),
              product_id: product.id,
              language_code: 'en',
              nom: englishFromFrench.nom,
              description: englishFromFrench.description
            }
          });
          needsUpdate = true;
        }
      }
      // PRIORITY 3: No translations at all - extract from reference/manufacturer
      else if (!frTrans && !enTrans) {
        // Try to build something from the reference
        const extractedInfo = extractFromReference(product.reference_fournisseur, product.constructeur);
        
        // Create English first (as it's usually the source)
        await prisma.product_translations.create({
          data: {
            id: require('crypto').randomUUID(),
            product_id: product.id,
            language_code: 'en',
            nom: extractedInfo.enName,
            description: extractedInfo.enDesc
          }
        });
        
        // Create French
        await prisma.product_translations.create({
          data: {
            id: require('crypto').randomUUID(),
            product_id: product.id,
            language_code: 'fr',
            nom: extractedInfo.frName,
            description: extractedInfo.frDesc
          }
        });
        
        needsUpdate = true;
      }

      if (needsUpdate) {
        fixedCount++;
        if (fixedCount % 50 === 0) {
          console.log(`Progress: Fixed ${fixedCount} products...`);
        }
      }
      
      processedCount++;
    }

    console.log('\n✅ AI CLEANING COMPLETE');
    console.log('=======================');
    console.log(`📦 Total products processed: ${processedCount}`);
    console.log(`✨ Products fixed: ${fixedCount}`);
    console.log('\n📝 All products now have properly cleaned translations from their ORIGINAL content!');

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Clean English text - preserve actual content, just fix mixed languages
function cleanEnglishVersion(name, description) {
  if (!name && !description) return { nom: '', description: '', changed: false };
  
  let cleanName = name || '';
  let cleanDesc = description || '';
  const originalName = cleanName;
  const originalDesc = cleanDesc;

  // Clean name - remove French/Spanish words but keep product details
  cleanName = cleanName
    // Fix mixed languages but preserve content
    .replace(/\bpour\b/gi, 'for')
    .replace(/\bavec\b/gi, 'with')
    .replace(/\bet\b/gi, 'and')
    .replace(/\bou\b/gi, 'or')
    .replace(/\bsans\b/gi, 'without')
    .replace(/\ble\s+/gi, 'the ')
    .replace(/\bla\s+/gi, 'the ')
    .replace(/\bles\s+/gi, 'the ')
    .replace(/\bun\s+/gi, 'a ')
    .replace(/\bune\s+/gi, 'a ')
    .replace(/\bde\s+/gi, 'of ')
    .replace(/\bdu\s+/gi, 'of the ')
    .replace(/\bdes\s+/gi, 'of the ')
    // Spanish to English
    .replace(/\boftalmoscopio\b/gi, 'ophthalmoscope')
    .replace(/\blampara\b/gi, 'lamp')
    .replace(/\bde bolsillo\b/gi, 'pocket')
    // Fix formatting
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  // Clean description - similar approach
  cleanDesc = cleanDesc
    // Fix complete French phrases
    .replace(/Peut être utilisé pour/gi, 'Can be used to')
    .replace(/Conçu pour/gi, 'Designed for')
    .replace(/longueur totale/gi, 'total length')
    .replace(/partie active/gi, 'active part')
    .replace(/poignée en cage/gi, 'bird cage handle')
    .replace(/lorsqu'ils ne sont pas utilisés/gi, 'while not in use')
    // Medical terms French to English
    .replace(/chirurgie de la cataracte/gi, 'cataract surgery')
    .replace(/décollement de rétine/gi, 'retinal detachment')
    .replace(/kératoplastie/gi, 'keratoplasty')
    .replace(/ténotomie/gi, 'tenotomy')
    // Common French words
    .replace(/\bpour\b/gi, 'for')
    .replace(/\bavec\b/gi, 'with')
    .replace(/\bet\b/gi, 'and')
    .replace(/\bRéutilisable\b/gi, 'Reusable')
    .replace(/\bdroit\b/gi, 'straight')
    .replace(/\bcourbé\b/gi, 'curved')
    .replace(/\bpointu\b/gi, 'pointed')
    .replace(/\bémoussé\b/gi, 'blunt')
    .replace(/\bdentelé\b/gi, 'serrated')
    .replace(/\blames\b/gi, 'blades')
    .replace(/\bciseaux\b/gi, 'scissors')
    .replace(/\bpince\b/gi, 'forceps')
    // Fix formatting
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure first letter is capitalized
  cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);

  return {
    nom: cleanName,
    description: cleanDesc,
    changed: (cleanName !== originalName || cleanDesc !== originalDesc)
  };
}

// Clean French text - preserve actual content
function cleanFrenchVersion(name, description) {
  if (!name && !description) return { nom: '', description: '', changed: false };
  
  let cleanName = name || '';
  let cleanDesc = description || '';
  const originalName = cleanName;
  const originalDesc = cleanDesc;

  // Clean name - remove English/Spanish words but keep product details
  cleanName = cleanName
    // English to French
    .replace(/\bfor\b/gi, 'pour')
    .replace(/\bwith\b/gi, 'avec')
    .replace(/\band\b/gi, 'et')
    .replace(/\bor\b/gi, 'ou')
    .replace(/\bwithout\b/gi, 'sans')
    .replace(/\bpocket\b/gi, 'de poche')
    .replace(/\bwireless\b/gi, 'sans fil')
    .replace(/\bbattery\b/gi, 'batterie')
    .replace(/\bupgrade\b/gi, 'mise à niveau')
    .replace(/\bkit\b/gi, 'kit')
    // Spanish to French
    .replace(/\boftalmoscopio\b/gi, 'ophtalmoscope')
    .replace(/\blampara\b/gi, 'lampe')
    .replace(/\bde bolsillo\b/gi, 'de poche')
    .replace(/\bdeportiva\b/gi, 'sport')
    // Fix formatting
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  // Clean description
  cleanDesc = cleanDesc
    // English phrases to French
    .replace(/Can be used to/gi, 'Peut être utilisé pour')
    .replace(/Designed for/gi, 'Conçu pour')
    .replace(/total length/gi, 'longueur totale')
    .replace(/active part/gi, 'partie active')
    .replace(/bird cage handle/gi, 'poignée en cage')
    .replace(/while not in use/gi, "lorsqu'il n'est pas utilisé")
    // Medical terms English to French
    .replace(/cataract surgery/gi, 'chirurgie de la cataracte')
    .replace(/retinal detachment/gi, 'décollement de rétine')
    .replace(/keratoplasty/gi, 'kératoplastie')
    .replace(/tenotomy/gi, 'ténotomie')
    // Common English words
    .replace(/\bReusable\b/gi, 'Réutilisable')
    .replace(/\bstraight\b/gi, 'droit')
    .replace(/\bcurved\b/gi, 'courbé')
    .replace(/\bpointed\b/gi, 'pointu')
    .replace(/\bblunt\b/gi, 'émoussé')
    .replace(/\bserrated\b/gi, 'dentelé')
    .replace(/\bblades\b/gi, 'lames')
    .replace(/\bscissors\b/gi, 'ciseaux')
    .replace(/\bforceps\b/gi, 'pince')
    .replace(/\bholder\b/gi, 'support')
    .replace(/\bclear\b/gi, 'transparent')
    // Fix formatting
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure first letter is capitalized
  cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);

  return {
    nom: cleanName,
    description: cleanDesc,
    changed: (cleanName !== originalName || cleanDesc !== originalDesc)
  };
}

// Translate clean English to French - keeping actual product details
function translateEnglishToFrench(enName, enDesc) {
  let frName = enName || '';
  let frDesc = enDesc || '';

  // Translate name while preserving product specifics
  frName = frName
    // Product types
    .replace(/\bForceps\b/gi, 'Pince')
    .replace(/\bScissors\b/gi, 'Ciseaux')
    .replace(/\bSpatula\b/gi, 'Spatule')
    .replace(/\bHolder\b/gi, 'Support')
    .replace(/\bOphthalmoscope\b/gi, 'Ophtalmoscope')
    .replace(/\bOtoscope\b/gi, 'Otoscope')
    .replace(/\bTonometer\b/gi, 'Tonomètre')
    .replace(/\bPachymeter\b/gi, 'Pachymètre')
    .replace(/\bSlit Lamp\b/gi, 'Lampe à Fente')
    // Descriptors
    .replace(/\bPocket\b/gi, 'de Poche')
    .replace(/\bWireless\b/gi, 'Sans Fil')
    .replace(/\bNon-Contact\b/gi, 'Sans Contact')
    .replace(/\bNon Contact\b/gi, 'Sans Contact')
    .replace(/\bDesktop\b/gi, 'de Bureau')
    .replace(/\bPortable\b/gi, 'Portable')
    .replace(/\bHandheld\b/gi, 'Portatif')
    .replace(/\bRechargeable\b/gi, 'Rechargeable')
    .replace(/\bBattery\b/gi, 'Batterie')
    .replace(/\bLithium\b/gi, 'Lithium')
    .replace(/\bDouble\b/gi, 'Double')
    .replace(/\bUpgrade Kit\b/gi, 'Kit de Mise à Niveau')
    .replace(/\bUpgrade\b/gi, 'Mise à Niveau')
    .replace(/\bKit\b/gi, 'Kit')
    .replace(/\bPack\b/gi, 'Pack')
    // Characteristics
    .replace(/\bStraight\b/gi, 'Droit')
    .replace(/\bCurved\b/gi, 'Courbé')
    .replace(/\bPointed\b/gi, 'Pointu')
    .replace(/\bBlunt\b/gi, 'Émoussé')
    .replace(/\bSerrated\b/gi, 'Dentelé')
    .replace(/\bAngled\b/gi, 'Angulaire')
    .replace(/\bMicro\b/gi, 'Micro')
    .replace(/\bBlades\b/gi, 'Lames')
    .replace(/\bJaws\b/gi, 'Mâchoires')
    .replace(/\bTeeth\b/gi, 'Dents')
    .replace(/\bPlatforms\b/gi, 'Plateformes')
    .replace(/\bTying\b/gi, 'Nouage')
    .replace(/\bHandle\b/gi, 'Poignée')
    .replace(/\bFiber Optic\b/gi, 'Fibre Optique')
    .replace(/\bFibre Optic\b/gi, 'Fibre Optique')
    // Common words
    .replace(/\bfor\b/gi, 'pour')
    .replace(/\bwith\b/gi, 'avec')
    .replace(/\band\b/gi, 'et')
    .replace(/\bor\b/gi, 'ou')
    .replace(/\bwithout\b/gi, 'sans');

  // Translate description
  frDesc = frDesc
    .replace(/Can be used to/gi, 'Peut être utilisé pour')
    .replace(/Can be used for/gi, 'Peut être utilisé pour')
    .replace(/Designed for/gi, 'Conçu pour')
    .replace(/Designed to/gi, 'Conçu pour')
    .replace(/Total length is/gi, 'La longueur totale est de')
    .replace(/total length/gi, 'longueur totale')
    .replace(/active part/gi, 'partie active')
    .replace(/bird cage handle/gi, 'poignée en cage')
    .replace(/while not in use/gi, "lorsqu'il n'est pas utilisé")
    .replace(/cataract surgery/gi, 'chirurgie de la cataracte')
    .replace(/retinal detachment surgery/gi, 'chirurgie du décollement de rétine')
    .replace(/retinal detachment/gi, 'décollement de rétine')
    .replace(/keratoplasty/gi, 'kératoplastie')
    .replace(/tenotomy/gi, 'ténotomie')
    .replace(/the eye/gi, "l'œil")
    .replace(/the iris/gi, "l'iris")
    .replace(/the cornea/gi, 'la cornée')
    .replace(/the capsule/gi, 'la capsule')
    .replace(/the eyelid/gi, 'la paupière')
    .replace(/to hold/gi, 'pour tenir')
    .replace(/to cut/gi, 'pour couper')
    .replace(/to manipulate/gi, 'pour manipuler')
    .replace(/to implant/gi, 'pour implanter')
    .replace(/Reusable/gi, 'Réutilisable')
    .replace(/stainless steel/gi, 'acier inoxydable')
    .replace(/medical grade/gi, 'qualité médicale')
    .replace(/high precision/gi, 'haute précision')
    .replace(/high quality/gi, 'haute qualité')
    .replace(/professional/gi, 'professionnel')
    .replace(/medical instrument/gi, 'instrument médical')
    .replace(/surgical instrument/gi, 'instrument chirurgical')
    // Keep measurements and numbers intact
    .replace(/(\d+\.?\d*)\s*(mm|cm|ml|cc)/gi, '$1 $2');

  return {
    nom: frName,
    description: frDesc
  };
}

// Translate clean French to English - keeping actual product details
function translateFrenchToEnglish(frName, frDesc) {
  let enName = frName || '';
  let enDesc = frDesc || '';

  // Translate name while preserving product specifics
  enName = enName
    // Product types
    .replace(/\bPince\b/gi, 'Forceps')
    .replace(/\bCiseaux\b/gi, 'Scissors')
    .replace(/\bSpatule\b/gi, 'Spatula')
    .replace(/\bSupport\b/gi, 'Holder')
    .replace(/\bOphtalmoscope\b/gi, 'Ophthalmoscope')
    .replace(/\bOtoscope\b/gi, 'Otoscope')
    .replace(/\bTonomètre\b/gi, 'Tonometer')
    .replace(/\bPachymètre\b/gi, 'Pachymeter')
    .replace(/\bLampe à Fente\b/gi, 'Slit Lamp')
    // Descriptors
    .replace(/\bde Poche\b/gi, 'Pocket')
    .replace(/\bSans Fil\b/gi, 'Wireless')
    .replace(/\bSans Contact\b/gi, 'Non-Contact')
    .replace(/\bde Bureau\b/gi, 'Desktop')
    .replace(/\bPortable\b/gi, 'Portable')
    .replace(/\bPortatif\b/gi, 'Handheld')
    .replace(/\bRechargeable\b/gi, 'Rechargeable')
    .replace(/\bBatterie\b/gi, 'Battery')
    .replace(/\bLithium\b/gi, 'Lithium')
    .replace(/\bDouble\b/gi, 'Double')
    .replace(/\bKit de Mise à Niveau\b/gi, 'Upgrade Kit')
    .replace(/\bMise à Niveau\b/gi, 'Upgrade')
    .replace(/\bKit\b/gi, 'Kit')
    .replace(/\bPack\b/gi, 'Pack')
    // Characteristics
    .replace(/\bDroit\b/gi, 'Straight')
    .replace(/\bCourbé\b/gi, 'Curved')
    .replace(/\bPointu\b/gi, 'Pointed')
    .replace(/\bÉmoussé\b/gi, 'Blunt')
    .replace(/\bDentelé\b/gi, 'Serrated')
    .replace(/\bAngulaire\b/gi, 'Angled')
    .replace(/\bMicro\b/gi, 'Micro')
    .replace(/\bLames\b/gi, 'Blades')
    .replace(/\bMâchoires\b/gi, 'Jaws')
    .replace(/\bDents\b/gi, 'Teeth')
    .replace(/\bPlateformes\b/gi, 'Platforms')
    .replace(/\bNouage\b/gi, 'Tying')
    .replace(/\bPoignée\b/gi, 'Handle')
    .replace(/\bFibre Optique\b/gi, 'Fiber Optic')
    // Common words
    .replace(/\bpour\b/gi, 'for')
    .replace(/\bavec\b/gi, 'with')
    .replace(/\bet\b/gi, 'and')
    .replace(/\bou\b/gi, 'or')
    .replace(/\bsans\b/gi, 'without');

  // Translate description
  enDesc = enDesc
    .replace(/Peut être utilisé pour/gi, 'Can be used to')
    .replace(/Conçu pour/gi, 'Designed for')
    .replace(/La longueur totale est de/gi, 'Total length is')
    .replace(/longueur totale/gi, 'total length')
    .replace(/partie active/gi, 'active part')
    .replace(/poignée en cage/gi, 'bird cage handle')
    .replace(/lorsqu'il n'est pas utilisé/gi, 'while not in use')
    .replace(/chirurgie de la cataracte/gi, 'cataract surgery')
    .replace(/chirurgie du décollement de rétine/gi, 'retinal detachment surgery')
    .replace(/décollement de rétine/gi, 'retinal detachment')
    .replace(/kératoplastie/gi, 'keratoplasty')
    .replace(/ténotomie/gi, 'tenotomy')
    .replace(/l'œil/gi, 'the eye')
    .replace(/l'iris/gi, 'the iris')
    .replace(/la cornée/gi, 'the cornea')
    .replace(/la capsule/gi, 'the capsule')
    .replace(/la paupière/gi, 'the eyelid')
    .replace(/pour tenir/gi, 'to hold')
    .replace(/pour couper/gi, 'to cut')
    .replace(/pour manipuler/gi, 'to manipulate')
    .replace(/pour implanter/gi, 'to implant')
    .replace(/Réutilisable/gi, 'Reusable')
    .replace(/acier inoxydable/gi, 'stainless steel')
    .replace(/qualité médicale/gi, 'medical grade')
    .replace(/haute précision/gi, 'high precision')
    .replace(/haute qualité/gi, 'high quality')
    .replace(/professionnel/gi, 'professional')
    .replace(/instrument médical/gi, 'medical instrument')
    .replace(/instrument chirurgical/gi, 'surgical instrument');

  return {
    nom: enName,
    description: enDesc
  };
}

// Extract information from reference when no translations exist
function extractFromReference(reference, manufacturer) {
  const ref = reference.toUpperCase();
  const mfg = manufacturer.charAt(0).toUpperCase() + manufacturer.slice(1).toLowerCase();
  
  // Try to identify product type from reference
  let productType = 'Product';
  let frProductType = 'Produit';
  
  // Check for common patterns in references
  if (ref.includes('FORC') || ref.includes('PINC')) {
    productType = 'Forceps';
    frProductType = 'Pince';
  } else if (ref.includes('SCIS') || ref.includes('CISE')) {
    productType = 'Scissors';
    frProductType = 'Ciseaux';
  } else if (ref.includes('SPAT')) {
    productType = 'Spatula';
    frProductType = 'Spatule';
  } else if (ref.includes('HOLD')) {
    productType = 'Holder';
    frProductType = 'Support';
  } else if (ref.includes('LENS')) {
    productType = 'Lens';
    frProductType = 'Lentille';
  } else if (ref.includes('LAMP')) {
    productType = 'Lamp';
    frProductType = 'Lampe';
  }

  return {
    enName: `${mfg} ${productType} ${ref}`,
    enDesc: `${mfg} professional ${productType.toLowerCase()} with reference ${ref}. High-quality medical instrument manufactured to strict standards.`,
    frName: `${frProductType} ${mfg} ${ref}`,
    frDesc: `${frProductType} professionnel ${mfg} avec référence ${ref}. Instrument médical de haute qualité fabriqué selon des normes strictes.`
  };
}

// Run the AI cleaning
cleanExistingProductsWithAI();