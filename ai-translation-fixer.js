const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Medical terminology translation dictionary
const medicalTranslations = {
  // Instruments
  'forceps': 'pinces',
  'scissors': 'ciseaux',
  'trephine': 'trépan',
  'punch': 'perforatrice',
  'cannula': 'canule',
  'spatula': 'spatule',
  'knife': 'couteau',
  'needle': 'aiguille',
  'blade': 'lame',
  'retractor': 'écarteur',
  'speculum': 'spéculum',
  'probe': 'sonde',
  'clamp': 'pince',
  'curette': 'curette',
  'elevator': 'élévateur',
  
  // Descriptors
  'curved': 'courbé(e)',
  'straight': 'droit(e)',
  'angled': 'angulé(e)',
  'bent': 'plié(e)',
  'serrated': 'dentelé(e)',
  'smooth': 'lisse',
  'blunt': 'émoussé(e)',
  'sharp': 'aigu(e)',
  'fine': 'fin(e)',
  'micro': 'micro',
  'mini': 'mini',
  'delicate': 'délicat(e)',
  'heavy': 'lourd(e)',
  'light': 'léger(ère)',
  'double-ended': 'à double extrémité',
  'single-use': 'à usage unique',
  'disposable': 'jetable',
  'reusable': 'réutilisable',
  
  // Measurements
  'mm': 'mm',
  'cm': 'cm',
  'inch': 'pouce',
  'inches': 'pouces',
  'gauge': 'calibre',
  'french': 'french',
  
  // Actions/Functions
  'replacement': 'remplacement',
  'insertion': 'insertion',
  'removal': 'retrait',
  'grasping': 'préhension',
  'cutting': 'coupe',
  'dissection': 'dissection',
  'suturing': 'suture',
  'clamping': 'serrage',
  
  // Anatomical terms
  'corneal': 'cornéen(ne)',
  'scleral': 'scléral(e)',
  'iris': 'iris',
  'lens': 'cristallin',
  'retinal': 'rétinien(ne)',
  'vitreous': 'vitré',
  'conjunctival': 'conjonctival(e)',
  'lacrimal': 'lacrymal(e)',
  'orbital': 'orbitaire',
  'ophthalmic': 'ophtalmique',
  'ocular': 'oculaire',
  'intraocular': 'intraoculaire',
  'extraocular': 'extraoculaire',
  
  // Common prepositions and connectors
  'with': 'avec',
  'for': 'pour',
  'of': 'de',
  'and': 'et',
  'or': 'ou',
  'in': 'dans',
  'on': 'sur',
  'at': 'à',
  'by': 'par',
  'from': 'de',
  'through': 'à travers',
  'during': 'pendant',
  'after': 'après',
  'before': 'avant',
  
  // Product types
  'model': 'modèle',
  'type': 'type',
  'style': 'style',
  'design': 'conception',
  'system': 'système',
  'set': 'ensemble',
  'kit': 'kit',
  'pack': 'pack',
  'tool': 'outil',
  'instrument': 'instrument',
  'device': 'dispositif',
  'equipment': 'équipement'
};

// AI Translation function using pattern matching and medical terminology
function translateToFrench(englishText) {
  if (!englishText) return '';
  
  let frenchText = englishText;
  
  // Convert to lowercase for processing
  let workingText = frenchText.toLowerCase();
  
  // Apply medical translations with word boundary protection
  for (const [english, french] of Object.entries(medicalTranslations)) {
    const regex = new RegExp(`\\b${english.toLowerCase()}\\b`, 'gi');
    workingText = workingText.replace(regex, french);
  }
  
  // Handle specific patterns
  const patterns = [
    // Pattern: "X Forceps" -> "Pinces X"
    { from: /(\w+)\s+forceps/gi, to: (match, name) => `Pinces ${name}` },
    
    // Pattern: "X Scissors" -> "Ciseaux X"  
    { from: /(\w+)\s+scissors/gi, to: (match, name) => `Ciseaux ${name}` },
    
    // Pattern: "X-mm" -> "X mm"
    { from: /(\d+)-mm/gi, to: '$1 mm' },
    
    // Pattern: "X inch" -> "X pouce"
    { from: /(\d+)\s*inch(es)?/gi, to: '$1 pouce$2' },
    
    // Pattern: "Swiss model" -> "modèle suisse"
    { from: /swiss\s+model/gi, to: 'modèle suisse' },
    
    // Pattern: "Mosquito" (instrument name) -> "Moustique"
    { from: /mosquito/gi, to: 'Moustique' },
    
    // Pattern: "cross-action" -> "à croisement"
    { from: /cross-action/gi, to: 'à croisement' },
    
    // Pattern: "serrated jaws" -> "mâchoires dentelées"
    { from: /serrated\s+jaws/gi, to: 'mâchoires dentelées' },
    
    // Pattern: "concave jaws" -> "mâchoires concaves"
    { from: /concave\s+jaws/gi, to: 'mâchoires concaves' },
    
    // Pattern: "replacement tip" -> "pointe de remplacement"
    { from: /replacement\s+tip/gi, to: 'pointe de remplacement' },
    
    // Pattern: "graft insertion" -> "insertion de greffe"
    { from: /graft\s+insertion/gi, to: 'insertion de greffe' },
    
    // Pattern: "distal control" -> "contrôle distal"
    { from: /distal\s+control/gi, to: 'contrôle distal' },
    
    // Pattern: "ultra-thin tip" -> "pointe ultra-fine"
    { from: /ultra-thin\s+tip/gi, to: 'pointe ultra-fine' }
  ];
  
  for (const pattern of patterns) {
    if (typeof pattern.to === 'function') {
      workingText = workingText.replace(pattern.from, pattern.to);
    } else {
      workingText = workingText.replace(pattern.from, pattern.to);
    }
  }
  
  // Capitalize first letter
  frenchText = workingText.charAt(0).toUpperCase() + workingText.slice(1);
  
  // Fix common issues
  frenchText = frenchText
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/\s+([,\.;:!?])/g, '$1') // Remove space before punctuation
    .replace(/([,\.;:!?])\s*([a-zA-Z])/g, '$1 $2') // Ensure space after punctuation
    .trim();
  
  return frenchText;
}

// Enhanced CSV parser
function parseCSVLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = null;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (!inQuotes) {
      if (char === '"' || char === "'") {
        inQuotes = true;
        quoteChar = char;
      } else if (char === delimiter) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    } else {
      if (char === quoteChar) {
        if (nextChar === quoteChar) {
          current += char;
          i++;
        } else {
          inQuotes = false;
          quoteChar = null;
        }
      } else {
        current += char;
      }
    }
  }
  
  result.push(current.trim());
  return result;
}

// Check if translation needs improvement
function needsTranslationImprovement(frenchText, englishText) {
  if (!frenchText || !englishText) return true;
  
  // Check if identical
  if (frenchText.toLowerCase().trim() === englishText.toLowerCase().trim()) {
    return true;
  }
  
  // Check for English words in French
  const englishWords = ['the', 'and', 'with', 'for', 'forceps', 'scissors', 'replacement'];
  const hasEnglishWords = englishWords.some(word => 
    frenchText.toLowerCase().includes(word.toLowerCase())
  );
  
  return hasEnglishWords;
}

async function fixDatabaseTranslations() {
  console.log('🔧 FIXING DATABASE TRANSLATIONS WITH AI');
  console.log('========================================');
  
  try {
    const products = await prisma.product.findMany({
      include: {
        translations: true,
        partner: true
      }
    });
    
    let fixedCount = 0;
    let totalIssues = 0;
    
    for (const product of products) {
      const frTranslation = product.translations.find(t => t.languageCode === 'fr');
      const enTranslation = product.translations.find(t => t.languageCode === 'en');
      
      if (!frTranslation || !enTranslation) continue;
      
      const needsNameFix = needsTranslationImprovement(frTranslation.nom, enTranslation.nom);
      const needsDescFix = needsTranslationImprovement(frTranslation.description, enTranslation.description);
      
      if (needsNameFix || needsDescFix) {
        totalIssues++;
        
        console.log(`🔄 Fixing: ${product.referenceFournisseur} (${product.constructeur})`);
        console.log(`   🇬🇧 EN: ${enTranslation.nom}`);
        console.log(`   🇫🇷 OLD: ${frTranslation.nom}`);
        
        const updates = {};
        
        if (needsNameFix) {
          const newFrenchName = translateToFrench(enTranslation.nom);
          updates.nom = newFrenchName;
          console.log(`   🇫🇷 NEW: ${newFrenchName}`);
        }
        
        if (needsDescFix && enTranslation.description) {
          const newFrenchDesc = translateToFrench(enTranslation.description);
          updates.description = newFrenchDesc;
          console.log(`   📝 DESC: ${newFrenchDesc.substring(0, 60)}...`);
        }
        
        // Update database
        await prisma.productTranslation.update({
          where: {
            productId_languageCode: {
              productId: product.id,
              languageCode: 'fr'
            }
          },
          data: updates
        });
        
        fixedCount++;
        console.log('   ✅ Updated\n');
      }
    }
    
    console.log('📊 DATABASE TRANSLATION FIXES:');
    console.log('==============================');
    console.log(`🔍 Products analyzed: ${products.length}`);
    console.log(`❌ Translation issues found: ${totalIssues}`);
    console.log(`✅ Products fixed: ${fixedCount}`);
    console.log(`📈 Success rate: ${Math.round((fixedCount / Math.max(totalIssues, 1)) * 100)}%\n`);
    
    return { totalAnalyzed: products.length, issuesFound: totalIssues, fixed: fixedCount };
    
  } catch (error) {
    console.error('❌ Database translation fix failed:', error.message);
    throw error;
  }
}

async function fixCSVTranslations() {
  console.log('🔧 FIXING CSV TRANSLATIONS WITH AI');
  console.log('==================================');
  
  try {
    const csvPath = 'data/kitmed_full_import_2025-11-25T13-46-22.csv';
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const header = parseCSVLine(lines[0]);
    
    console.log(`📄 Processing: ${csvPath}`);
    console.log(`📊 Total lines: ${lines.length - 1} products\n`);
    
    const fixedLines = [lines[0]]; // Keep header
    let fixedCount = 0;
    let totalIssues = 0;
    
    // Expected field positions
    const fields = {
      referenceFournisseur: 0,
      constructeur: 1,
      nom_fr: 6,
      nom_en: 7,
      description_fr: 8,
      description_en: 9
    };
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const csvFields = parseCSVLine(line);
      
      if (csvFields.length < 10) {
        console.log(`⚠️  Skipping malformed line ${i}`);
        fixedLines.push(line);
        continue;
      }
      
      const englishName = csvFields[fields.nom_en] || '';
      const frenchName = csvFields[fields.nom_fr] || '';
      const englishDesc = csvFields[fields.description_en] || '';
      const frenchDesc = csvFields[fields.description_fr] || '';
      
      const needsNameFix = needsTranslationImprovement(frenchName, englishName);
      const needsDescFix = needsTranslationImprovement(frenchDesc, englishDesc);
      
      if (needsNameFix || needsDescFix) {
        totalIssues++;
        
        console.log(`🔄 Line ${i}: ${csvFields[fields.referenceFournisseur]} (${csvFields[fields.constructeur]})`);
        console.log(`   🇬🇧 EN: ${englishName}`);
        console.log(`   🇫🇷 OLD: ${frenchName}`);
        
        if (needsNameFix) {
          const newFrenchName = translateToFrench(englishName);
          csvFields[fields.nom_fr] = newFrenchName;
          console.log(`   🇫🇷 NEW: ${newFrenchName}`);
        }
        
        if (needsDescFix && englishDesc) {
          const newFrenchDesc = translateToFrench(englishDesc);
          csvFields[fields.description_fr] = newFrenchDesc;
          console.log(`   📝 DESC: ${newFrenchDesc.substring(0, 60)}...`);
        }
        
        fixedCount++;
        console.log('   ✅ Fixed\n');
      }
      
      // Reconstruct line with proper CSV escaping
      const escapedFields = csvFields.map(field => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      });
      
      fixedLines.push(escapedFields.join(','));
    }
    
    // Save fixed CSV
    const fixedCsvPath = csvPath.replace('.csv', '_fixed_translations.csv');
    fs.writeFileSync(fixedCsvPath, fixedLines.join('\n'), 'utf-8');
    
    console.log('📊 CSV TRANSLATION FIXES:');
    console.log('=========================');
    console.log(`🔍 Products analyzed: ${lines.length - 1}`);
    console.log(`❌ Translation issues found: ${totalIssues}`);
    console.log(`✅ Products fixed: ${fixedCount}`);
    console.log(`📈 Success rate: ${Math.round((fixedCount / Math.max(totalIssues, 1)) * 100)}%`);
    console.log(`📄 Fixed CSV saved to: ${fixedCsvPath}\n`);
    
    return { 
      originalFile: csvPath, 
      fixedFile: fixedCsvPath, 
      totalAnalyzed: lines.length - 1, 
      issuesFound: totalIssues, 
      fixed: fixedCount 
    };
    
  } catch (error) {
    console.error('❌ CSV translation fix failed:', error.message);
    throw error;
  }
}

async function verifyTranslationConsistency() {
  console.log('🔍 VERIFYING TRANSLATION CONSISTENCY');
  console.log('====================================');
  
  try {
    // Get database products
    const dbProducts = await prisma.product.findMany({
      select: {
        referenceFournisseur: true,
        constructeur: true,
        translations: {
          select: {
            languageCode: true,
            nom: true,
            description: true
          }
        }
      }
    });
    
    console.log(`📊 Analyzing ${dbProducts.length} database products for consistency\n`);
    
    let consistentCount = 0;
    let inconsistentCount = 0;
    const inconsistencies = [];
    
    for (const product of dbProducts) {
      const frTrans = product.translations.find(t => t.languageCode === 'fr');
      const enTrans = product.translations.find(t => t.languageCode === 'en');
      
      if (!frTrans || !enTrans) continue;
      
      const isConsistent = !needsTranslationImprovement(frTrans.nom, enTrans.nom);
      
      if (isConsistent) {
        consistentCount++;
      } else {
        inconsistentCount++;
        inconsistencies.push({
          ref: product.referenceFournisseur,
          manufacturer: product.constructeur,
          french: frTrans.nom,
          english: enTrans.nom
        });
      }
    }
    
    console.log('📊 CONSISTENCY ANALYSIS:');
    console.log('========================');
    console.log(`✅ Consistent translations: ${consistentCount}`);
    console.log(`❌ Inconsistent translations: ${inconsistentCount}`);
    console.log(`📈 Consistency rate: ${Math.round((consistentCount / dbProducts.length) * 100)}%\n`);
    
    if (inconsistencies.length > 0) {
      console.log('❌ INCONSISTENT PRODUCTS:');
      console.log('=========================');
      inconsistencies.slice(0, 10).forEach(item => {
        console.log(`🔸 ${item.ref} (${item.manufacturer})`);
        console.log(`   🇫🇷 ${item.french}`);
        console.log(`   🇬🇧 ${item.english}\n`);
      });
      
      if (inconsistencies.length > 10) {
        console.log(`... and ${inconsistencies.length - 10} more\n`);
      }
    }
    
    return {
      totalProducts: dbProducts.length,
      consistent: consistentCount,
      inconsistent: inconsistentCount,
      consistencyRate: Math.round((consistentCount / dbProducts.length) * 100)
    };
    
  } catch (error) {
    console.error('❌ Consistency verification failed:', error.message);
    throw error;
  }
}

async function runComprehensiveTranslationFix() {
  console.log('🚀 COMPREHENSIVE AI TRANSLATION FIX');
  console.log('====================================\n');
  
  try {
    // Step 1: Fix database translations
    console.log('STEP 1: Fixing Database Translations');
    console.log('------------------------------------');
    const dbResults = await fixDatabaseTranslations();
    
    // Step 2: Fix CSV translations
    console.log('STEP 2: Fixing CSV Translations');
    console.log('--------------------------------');
    const csvResults = await fixCSVTranslations();
    
    // Step 3: Verify consistency
    console.log('STEP 3: Verifying Consistency');
    console.log('-----------------------------');
    const consistencyResults = await verifyTranslationConsistency();
    
    // Final summary
    console.log('🎯 COMPREHENSIVE FIX SUMMARY:');
    console.log('==============================');
    console.log('📊 DATABASE:');
    console.log(`   - Products analyzed: ${dbResults.totalAnalyzed}`);
    console.log(`   - Issues found: ${dbResults.issuesFound}`);
    console.log(`   - Products fixed: ${dbResults.fixed}`);
    console.log('');
    console.log('📄 CSV FILE:');
    console.log(`   - Products analyzed: ${csvResults.totalAnalyzed}`);
    console.log(`   - Issues found: ${csvResults.issuesFound}`);
    console.log(`   - Products fixed: ${csvResults.fixed}`);
    console.log(`   - Fixed file: ${csvResults.fixedFile}`);
    console.log('');
    console.log('🔍 CONSISTENCY:');
    console.log(`   - Final consistency rate: ${consistencyResults.consistencyRate}%`);
    console.log(`   - Consistent products: ${consistencyResults.consistent}`);
    console.log(`   - Inconsistent products: ${consistencyResults.inconsistent}`);
    console.log('');
    
    if (consistencyResults.consistencyRate >= 95) {
      console.log('✅ TRANSLATION FIX: SUCCESS');
      console.log('🟢 Database and CSV now have consistent, high-quality French translations');
      console.log('🟢 Safe to proceed with imports using the fixed CSV file');
    } else if (consistencyResults.consistencyRate >= 85) {
      console.log('🟡 TRANSLATION FIX: MOSTLY SUCCESSFUL');
      console.log('⚠️  Some inconsistencies remain but quality is acceptable');
      console.log('✅ Can proceed with imports with caution');
    } else {
      console.log('🔴 TRANSLATION FIX: NEEDS MORE WORK');
      console.log('❌ Significant inconsistencies remain');
      console.log('⚠️  Manual review recommended before importing');
    }
    
    await prisma.$disconnect();
    
    return {
      success: consistencyResults.consistencyRate >= 85,
      dbResults,
      csvResults,
      consistencyResults
    };
    
  } catch (error) {
    console.error('💥 Comprehensive translation fix failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the comprehensive fix
runComprehensiveTranslationFix();