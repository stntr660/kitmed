const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// MORIA-style description patterns for high-quality translations
async function applyMoriaStyleTranslations() {
  try {
    console.log('🎯 APPLYING MORIA-STYLE HIGH-QUALITY TRANSLATIONS');
    console.log('================================================\n');

    // Get all products grouped by manufacturer
    const manufacturers = ['nidek-japon', 'rumex', 'surgicon-ag', 'KEELER', 'heine', 'haag-streit-u-k'];
    
    let totalProcessed = 0;
    let totalFixed = 0;

    for (const manufacturer of manufacturers) {
      console.log(`\n📦 Processing ${manufacturer.toUpperCase()} products...`);
      console.log('----------------------------------------');
      
      const products = await prisma.products.findMany({
        where: { constructeur: manufacturer },
        include: { product_translations: true },
        orderBy: { reference_fournisseur: 'asc' }
      });

      let fixedCount = 0;

      for (const product of products) {
        const frTrans = product.product_translations.find(t => t.language_code === 'fr');
        const enTrans = product.product_translations.find(t => t.language_code === 'en');
        
        if (!frTrans || !enTrans) continue;

        // Check quality score
        const qualityScore = calculateQualityScore(frTrans, enTrans);
        
        if (qualityScore < 90) { // Only fix if below 90% quality
          const improved = generateMoriaStyleDescriptions(product, frTrans, enTrans);
          
          // Update French translation
          if (improved.french.changed) {
            await prisma.product_translations.update({
              where: { id: frTrans.id },
              data: {
                nom: improved.french.nom,
                description: improved.french.description
              }
            });
          }

          // Update English translation
          if (improved.english.changed) {
            await prisma.product_translations.update({
              where: { id: enTrans.id },
              data: {
                nom: improved.english.nom,
                description: improved.english.description
              }
            });
          }

          if (improved.french.changed || improved.english.changed) {
            fixedCount++;
            console.log(`✅ ${product.reference_fournisseur}: ${improved.french.nom}`);
          }
        }
        
        totalProcessed++;
      }

      console.log(`   Fixed: ${fixedCount}/${products.length} products`);
      totalFixed += fixedCount;
    }

    console.log('\n🎉 MORIA-STYLE TRANSFORMATION COMPLETE');
    console.log('=====================================');
    console.log(`Total processed: ${totalProcessed} products`);
    console.log(`Total improved: ${totalFixed} products`);
    console.log(`Success rate: ${Math.round((totalFixed / totalProcessed) * 100)}%`);

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Calculate quality score (0-100)
function calculateQualityScore(frTrans, enTrans) {
  let score = 100;
  
  const frText = `${frTrans.nom || ''} ${frTrans.description || ''}`.toLowerCase();
  const enText = `${enTrans.nom || ''} ${enTrans.description || ''}`.toLowerCase();
  
  // Check for mixed languages in French
  if (/\b(the|with|for|and|of|to|system|holder|clear)\b/.test(frText)) {
    score -= 30;
  }
  
  // Check for mixed languages in English
  if (/\b(pour|avec|le|la|les|un|une|et|ou|sans|système)\b/.test(enText)) {
    score -= 30;
  }
  
  // Check for generic content
  if (frText.includes('équipement médical de précision') || 
      enText.includes('precision medical equipment')) {
    score -= 20;
  }
  
  // Check for specific details (positive points)
  if (frText.includes('mm') || enText.includes('mm')) score += 10;
  if (frText.includes('°') || enText.includes('°')) score += 10;
  if (frText.includes('chirurgie') || enText.includes('surgery')) score += 10;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// Generate MORIA-style descriptions with specific details
function generateMoriaStyleDescriptions(product, frTrans, enTrans) {
  const ref = product.reference_fournisseur;
  const manufacturer = product.constructeur.toUpperCase();
  
  // Extract key information from reference
  const productInfo = extractProductInfo(ref, frTrans.nom, enTrans.nom);
  
  // Generate French version
  let frenchName = generateFrenchName(productInfo, manufacturer);
  let frenchDesc = generateFrenchDescription(productInfo, manufacturer);
  
  // Generate English version
  let englishName = generateEnglishName(productInfo, manufacturer);
  let englishDesc = generateEnglishDescription(productInfo, manufacturer);
  
  return {
    french: {
      nom: frenchName,
      description: frenchDesc,
      changed: frenchName !== frTrans.nom || frenchDesc !== frTrans.description
    },
    english: {
      nom: englishName,
      description: englishDesc,
      changed: englishName !== enTrans.nom || englishDesc !== enTrans.description
    }
  };
}

// Extract product information from reference and existing names
function extractProductInfo(reference, frName, enName) {
  const info = {
    type: '',
    subtype: '',
    measurements: [],
    angle: null,
    material: '',
    feature: '',
    procedure: ''
  };
  
  // Combine all text for analysis
  const combinedText = `${reference} ${frName || ''} ${enName || ''}`.toLowerCase();
  
  // Identify product type
  if (combinedText.includes('forceps') || combinedText.includes('pince')) {
    info.type = 'forceps';
    if (combinedText.includes('capsulorhexis')) info.subtype = 'capsulorhexis';
    else if (combinedText.includes('tying')) info.subtype = 'tying';
    else if (combinedText.includes('colibri')) info.subtype = 'colibri';
  } else if (combinedText.includes('scissors') || combinedText.includes('ciseaux')) {
    info.type = 'scissors';
    if (combinedText.includes('vannas')) info.subtype = 'vannas';
    else if (combinedText.includes('westcott')) info.subtype = 'westcott';
    else if (combinedText.includes('iris')) info.subtype = 'iris';
  } else if (combinedText.includes('knife') || combinedText.includes('couteau')) {
    info.type = 'knife';
    if (combinedText.includes('crescent')) info.subtype = 'crescent';
    else if (combinedText.includes('slit')) info.subtype = 'slit';
    else if (combinedText.includes('phaco')) info.subtype = 'phaco';
  } else if (combinedText.includes('spatula') || combinedText.includes('spatule')) {
    info.type = 'spatula';
    if (combinedText.includes('iris')) info.subtype = 'iris';
    else if (combinedText.includes('nucleus')) info.subtype = 'nucleus';
  } else if (combinedText.includes('hook') || combinedText.includes('crochet')) {
    info.type = 'hook';
    if (combinedText.includes('iris')) info.subtype = 'iris';
    else if (combinedText.includes('sinsky')) info.subtype = 'sinsky';
  } else if (combinedText.includes('cannula') || combinedText.includes('canule')) {
    info.type = 'cannula';
    if (combinedText.includes('hydrodissection')) info.subtype = 'hydrodissection';
    else if (combinedText.includes('irrigation')) info.subtype = 'irrigation';
  } else if (combinedText.includes('marker') || combinedText.includes('marqueur')) {
    info.type = 'marker';
    if (combinedText.includes('axis')) info.subtype = 'axis';
    else if (combinedText.includes('toric')) info.subtype = 'toric';
  } else if (combinedText.includes('caliper') || combinedText.includes('compas')) {
    info.type = 'caliper';
    if (combinedText.includes('castroviejo')) info.subtype = 'castroviejo';
  } else if (combinedText.includes('speculum')) {
    info.type = 'speculum';
    if (combinedText.includes('barraquer')) info.subtype = 'barraquer';
    else if (combinedText.includes('lieberman')) info.subtype = 'lieberman';
  } else if (combinedText.includes('ophthalmoscope') || combinedText.includes('ophtalmoscope')) {
    info.type = 'ophthalmoscope';
    if (combinedText.includes('pocket')) info.subtype = 'pocket';
    else if (combinedText.includes('wireless')) info.subtype = 'wireless';
  } else if (combinedText.includes('otoscope')) {
    info.type = 'otoscope';
    if (combinedText.includes('fiber')) info.subtype = 'fiber-optic';
  } else if (combinedText.includes('tonometer') || combinedText.includes('tonomètre')) {
    info.type = 'tonometer';
    if (combinedText.includes('non-contact')) info.subtype = 'non-contact';
    else if (combinedText.includes('applanation')) info.subtype = 'applanation';
  } else if (combinedText.includes('slit lamp') || combinedText.includes('lampe')) {
    info.type = 'slit-lamp';
    if (combinedText.includes('portable')) info.subtype = 'portable';
  }
  
  // Extract measurements (look for patterns like 12.5mm, 10cm, etc.)
  const measurementPattern = /(\d+(?:\.\d+)?)\s?(mm|cm|ml|cc|gauge|g)/gi;
  let match;
  while ((match = measurementPattern.exec(combinedText)) !== null) {
    info.measurements.push(`${match[1]}${match[2]}`);
  }
  
  // Extract angles (look for patterns like 45°, 90 degrees)
  const anglePattern = /(\d+)\s?(?:°|deg|degrees)/gi;
  if ((match = anglePattern.exec(combinedText)) !== null) {
    info.angle = match[1] + '°';
  }
  
  // Identify material
  if (combinedText.includes('titanium') || combinedText.includes('titane')) {
    info.material = 'titanium';
  } else if (combinedText.includes('stainless') || combinedText.includes('inox')) {
    info.material = 'stainless-steel';
  }
  
  // Identify key features
  if (combinedText.includes('curved') || combinedText.includes('courbé')) {
    info.feature = 'curved';
  } else if (combinedText.includes('straight') || combinedText.includes('droit')) {
    info.feature = 'straight';
  } else if (combinedText.includes('angled') || combinedText.includes('angulé')) {
    info.feature = 'angled';
  } else if (combinedText.includes('serrated') || combinedText.includes('dentelé')) {
    info.feature = 'serrated';
  }
  
  // Identify procedure
  if (combinedText.includes('cataract') || combinedText.includes('cataracte')) {
    info.procedure = 'cataract';
  } else if (combinedText.includes('vitrectomy') || combinedText.includes('vitrectomie')) {
    info.procedure = 'vitrectomy';
  } else if (combinedText.includes('retinal') || combinedText.includes('rétine')) {
    info.procedure = 'retinal';
  } else if (combinedText.includes('corneal') || combinedText.includes('cornée')) {
    info.procedure = 'corneal';
  } else if (combinedText.includes('glaucoma') || combinedText.includes('glaucome')) {
    info.procedure = 'glaucoma';
  }
  
  return info;
}

// Generate French name in MORIA style
function generateFrenchName(info, manufacturer) {
  let name = '';
  
  // Product type translations
  const typeTranslations = {
    'forceps': 'Pince',
    'scissors': 'Ciseaux',
    'knife': 'Couteau',
    'spatula': 'Spatule',
    'hook': 'Crochet',
    'cannula': 'Canule',
    'marker': 'Marqueur',
    'caliper': 'Compas',
    'speculum': 'Spéculum',
    'ophthalmoscope': 'Ophtalmoscope',
    'otoscope': 'Otoscope',
    'tonometer': 'Tonomètre',
    'slit-lamp': 'Lampe à Fente'
  };
  
  // Subtype translations
  const subtypeTranslations = {
    'capsulorhexis': 'à Capsulorhexis',
    'tying': 'de Nouage',
    'colibri': 'Type Colibri',
    'vannas': 'de Vannas',
    'westcott': 'de Westcott',
    'iris': 'à Iris',
    'crescent': 'Croissant',
    'slit': 'à Fente',
    'phaco': 'pour Phacoémulsification',
    'nucleus': 'à Noyau',
    'sinsky': 'de Sinsky',
    'hydrodissection': 'pour Hydrodissection',
    'irrigation': 'd\'Irrigation',
    'axis': 'de Marquage d\'Axe',
    'toric': 'Torique',
    'castroviejo': 'de Castroviejo',
    'barraquer': 'de Barraquer',
    'lieberman': 'de Lieberman',
    'pocket': 'de Poche',
    'wireless': 'Sans Fil',
    'fiber-optic': 'à Fibre Optique',
    'non-contact': 'Sans Contact',
    'applanation': 'à Aplanation',
    'portable': 'Portable'
  };
  
  // Feature translations
  const featureTranslations = {
    'curved': 'Courbé',
    'straight': 'Droit',
    'angled': 'Angulé',
    'serrated': 'Dentelé'
  };
  
  // Build the name
  if (info.type) {
    name = typeTranslations[info.type] || 'Instrument';
    
    if (info.subtype) {
      name += ' ' + (subtypeTranslations[info.subtype] || info.subtype);
    }
    
    if (info.feature) {
      name += ' ' + (featureTranslations[info.feature] || info.feature);
    }
    
    if (info.measurements.length > 0) {
      name += ' ' + info.measurements[0];
    }
    
    if (info.angle) {
      name += ' ' + info.angle;
    }
  } else {
    // Fallback to generic naming
    name = `Instrument ${manufacturer}`;
  }
  
  return name;
}

// Generate English name in MORIA style
function generateEnglishName(info, manufacturer) {
  let name = '';
  
  // Product type names
  const typeNames = {
    'forceps': 'Forceps',
    'scissors': 'Scissors',
    'knife': 'Knife',
    'spatula': 'Spatula',
    'hook': 'Hook',
    'cannula': 'Cannula',
    'marker': 'Marker',
    'caliper': 'Caliper',
    'speculum': 'Speculum',
    'ophthalmoscope': 'Ophthalmoscope',
    'otoscope': 'Otoscope',
    'tonometer': 'Tonometer',
    'slit-lamp': 'Slit Lamp'
  };
  
  // Subtype names
  const subtypeNames = {
    'capsulorhexis': 'Capsulorhexis',
    'tying': 'Tying',
    'colibri': 'Colibri Type',
    'vannas': 'Vannas',
    'westcott': 'Westcott',
    'iris': 'Iris',
    'crescent': 'Crescent',
    'slit': 'Slit',
    'phaco': 'Phaco',
    'nucleus': 'Nucleus',
    'sinsky': 'Sinsky',
    'hydrodissection': 'Hydrodissection',
    'irrigation': 'Irrigation',
    'axis': 'Axis Marking',
    'toric': 'Toric',
    'castroviejo': 'Castroviejo',
    'barraquer': 'Barraquer',
    'lieberman': 'Lieberman',
    'pocket': 'Pocket',
    'wireless': 'Wireless',
    'fiber-optic': 'Fiber Optic',
    'non-contact': 'Non-Contact',
    'applanation': 'Applanation',
    'portable': 'Portable'
  };
  
  // Feature names
  const featureNames = {
    'curved': 'Curved',
    'straight': 'Straight',
    'angled': 'Angled',
    'serrated': 'Serrated'
  };
  
  // Build the name
  if (info.type) {
    let parts = [];
    
    if (info.subtype) {
      parts.push(subtypeNames[info.subtype] || info.subtype);
    }
    
    if (info.feature) {
      parts.push(featureNames[info.feature] || info.feature);
    }
    
    parts.push(typeNames[info.type] || 'Instrument');
    
    if (info.measurements.length > 0) {
      parts.push(info.measurements[0]);
    }
    
    if (info.angle) {
      parts.push(info.angle);
    }
    
    name = parts.join(' ');
  } else {
    // Fallback to generic naming
    name = `${manufacturer} Instrument`;
  }
  
  return name;
}

// Generate French description in MORIA style
function generateFrenchDescription(info, manufacturer) {
  let desc = '';
  
  // Procedure descriptions
  const procedureDescriptions = {
    'cataract': 'Instrument essentiel pour la chirurgie de la cataracte',
    'vitrectomy': 'Conçu spécifiquement pour la vitrectomie',
    'retinal': 'Utilisé dans la chirurgie du décollement de rétine',
    'corneal': 'Idéal pour la chirurgie cornéenne et la kératoplastie',
    'glaucoma': 'Instrument spécialisé pour le traitement du glaucome'
  };
  
  // Material descriptions
  const materialDescriptions = {
    'titanium': 'Fabriqué en titane de haute qualité pour une durabilité maximale',
    'stainless-steel': 'En acier inoxydable chirurgical de qualité supérieure'
  };
  
  // Build description
  if (info.procedure) {
    desc = procedureDescriptions[info.procedure] + '. ';
  }
  
  // Add measurements if available
  if (info.measurements.length > 0) {
    desc += `Longueur totale de ${info.measurements[0]}`;
    if (info.measurements.length > 1) {
      desc += ` avec partie active de ${info.measurements[1]}`;
    }
    desc += '. ';
  }
  
  // Add angle if available
  if (info.angle) {
    desc += `Angle de ${info.angle} pour un accès optimal. `;
  }
  
  // Add material information
  if (info.material) {
    desc += materialDescriptions[info.material] + '. ';
  }
  
  // Add feature-specific description
  if (info.feature === 'serrated') {
    desc += 'Mâchoires dentelées pour une prise sûre. ';
  } else if (info.feature === 'curved') {
    desc += 'Conception courbée pour une manipulation précise. ';
  } else if (info.feature === 'angled') {
    desc += 'Design angulaire pour un accès facilité. ';
  }
  
  // Add manufacturer quality statement
  desc += `Qualité ${manufacturer} garantie pour une performance chirurgicale optimale.`;
  
  return desc;
}

// Generate English description in MORIA style
function generateEnglishDescription(info, manufacturer) {
  let desc = '';
  
  // Procedure descriptions
  const procedureDescriptions = {
    'cataract': 'Essential instrument for cataract surgery',
    'vitrectomy': 'Specifically designed for vitrectomy procedures',
    'retinal': 'Used in retinal detachment surgery',
    'corneal': 'Ideal for corneal surgery and keratoplasty',
    'glaucoma': 'Specialized instrument for glaucoma treatment'
  };
  
  // Material descriptions
  const materialDescriptions = {
    'titanium': 'Made from high-quality titanium for maximum durability',
    'stainless-steel': 'Premium surgical stainless steel construction'
  };
  
  // Build description
  if (info.procedure) {
    desc = procedureDescriptions[info.procedure] + '. ';
  }
  
  // Add measurements if available
  if (info.measurements.length > 0) {
    desc += `Total length of ${info.measurements[0]}`;
    if (info.measurements.length > 1) {
      desc += ` with ${info.measurements[1]} active part`;
    }
    desc += '. ';
  }
  
  // Add angle if available
  if (info.angle) {
    desc += `${info.angle} angle for optimal access. `;
  }
  
  // Add material information
  if (info.material) {
    desc += materialDescriptions[info.material] + '. ';
  }
  
  // Add feature-specific description
  if (info.feature === 'serrated') {
    desc += 'Serrated jaws for secure grip. ';
  } else if (info.feature === 'curved') {
    desc += 'Curved design for precise manipulation. ';
  } else if (info.feature === 'angled') {
    desc += 'Angled design for improved access. ';
  }
  
  // Add manufacturer quality statement
  desc += `${manufacturer} quality guaranteed for optimal surgical performance.`;
  
  return desc;
}

// Run the transformation
applyMoriaStyleTranslations();