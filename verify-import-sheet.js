const fs = require('fs');
const path = require('path');

// Enhanced CSV Parser for complex quoted fields
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
          // Escaped quote
          current += char;
          i++; // Skip next character
        } else {
          // End of quoted string
          inQuotes = false;
          quoteChar = null;
        }
      } else {
        current += char;
      }
    }
  }
  
  // Add the last field
  result.push(current.trim());
  return result;
}

// Quality assessment functions
const qualityChecks = {
  // Check if text looks like it's in the right language
  languageCheck: (text, expectedLang) => {
    if (!text) return { valid: false, issues: ['Empty text'] };
    
    const issues = [];
    const englishWords = ['the', 'and', 'with', 'for', 'replacement', 'tip', 'forceps', 'scissors', 'curved', 'straight'];
    const frenchWords = ['le', 'la', 'les', 'et', 'avec', 'pour', 'pointe', 'pinces', 'ciseaux', 'courbes', 'droites'];
    const spanishWords = ['para', 'con', 'que', 'una', 'del', 'por', 'sistema'];
    
    const englishCount = englishWords.filter(word => text.toLowerCase().includes(word)).length;
    const frenchCount = frenchWords.filter(word => text.toLowerCase().includes(word)).length;
    const spanishCount = spanishWords.filter(word => text.toLowerCase().includes(word)).length;
    
    if (expectedLang === 'fr') {
      if (englishCount >= 2 && frenchCount === 0) {
        issues.push(`French text appears to be in English (${englishCount} English words found)`);
      }
      if (spanishCount >= 2) {
        issues.push(`French text appears to be in Spanish (${spanishCount} Spanish words found)`);
      }
    }
    
    if (expectedLang === 'en') {
      if (frenchCount >= 2 && englishCount === 0) {
        issues.push(`English text appears to be in French (${frenchCount} French words found)`);
      }
      if (spanishCount >= 2) {
        issues.push(`English text appears to be in Spanish (${spanishCount} Spanish words found)`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
      detectedLanguage: englishCount > frenchCount ? 'en' : frenchCount > spanishCount ? 'fr' : 'unknown'
    };
  },
  
  // Check URL validity
  urlCheck: (url) => {
    if (!url || url.trim() === '') {
      return { valid: false, issues: ['Empty URL'] };
    }
    
    const issues = [];
    
    // Check if it's actually a URL
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      issues.push('Not a valid URL format');
    }
    
    // Check for suspicious content (descriptions instead of URLs)
    const suspiciousPatterns = [
      /\b(forceps|scissors|replacement|tip|blade|curved|straight)\b/i,
      /\b(pinces|ciseaux|remplacement|pointe|lame|courbes|droites)\b/i,
      /\d+\s*(mm|cm|inches?)/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(url))) {
      issues.push('URL appears to contain product description text instead of a URL');
    }
    
    // Check length (URLs shouldn't be extremely long descriptive text)
    if (url.length > 200) {
      issues.push('URL suspiciously long - might be descriptive text');
    }
    
    return { valid: issues.length === 0, issues };
  },
  
  // Check if French and English are identical (bad translation)
  translationCheck: (frText, enText) => {
    if (!frText || !enText) {
      return { valid: false, issues: ['Missing translation'] };
    }
    
    const issues = [];
    
    if (frText.toLowerCase().trim() === enText.toLowerCase().trim()) {
      issues.push('French and English texts are identical - missing translation');
    }
    
    // Check if they're too similar (>80% match)
    const similarity = calculateSimilarity(frText, enText);
    if (similarity > 0.8 && frText !== enText) {
      issues.push(`Texts are ${Math.round(similarity * 100)}% similar - possible poor translation`);
    }
    
    return { valid: issues.length === 0, issues };
  },
  
  // Check reference format
  referenceCheck: (ref) => {
    if (!ref || ref.trim() === '') {
      return { valid: false, issues: ['Empty reference'] };
    }
    
    const issues = [];
    
    // Check for basic format
    if (!/^[A-Z0-9\-]+$/i.test(ref)) {
      issues.push('Reference contains invalid characters');
    }
    
    if (ref.length > 50) {
      issues.push('Reference too long');
    }
    
    if (ref.length < 2) {
      issues.push('Reference too short');
    }
    
    return { valid: issues.length === 0, issues };
  }
};

// Calculate text similarity
function calculateSimilarity(str1, str2) {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

async function verifyImportSheet() {
  try {
    console.log('🔍 VERIFYING CSV IMPORT SHEET QUALITY');
    console.log('====================================');
    
    const csvPath = 'data/kitmed_full_import_2025-11-25T13-46-22.csv';
    
    if (!fs.existsSync(csvPath)) {
      console.log(`❌ CSV file not found: ${csvPath}`);
      console.log('📁 Looking for CSV files in data directory...');
      
      if (fs.existsSync('data')) {
        const csvFiles = fs.readdirSync('data').filter(f => f.endsWith('.csv'));
        if (csvFiles.length > 0) {
          console.log('📋 Found CSV files:');
          csvFiles.forEach(file => console.log(`   - ${file}`));
        } else {
          console.log('❌ No CSV files found in data directory');
        }
      }
      return;
    }
    
    console.log(`📄 Analyzing: ${csvPath}`);
    
    // Read CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    
    console.log(`📊 Total lines: ${lines.length}`);
    console.log(`📦 Products to analyze: ${lines.length - 1}\n`);
    
    // Parse header
    const header = parseCSVLine(lines[0]);
    console.log('📋 CSV Structure:');
    header.forEach((col, i) => console.log(`   ${i}: ${col}`));
    console.log('');
    
    // Expected structure
    const expectedFields = [
      'referenceFournisseur', 'constructeur', 'slug', 'categoryId', 'status', 'isFeatured',
      'nom_fr', 'nom_en', 'description_fr', 'description_en', 'ficheTechnique_fr', 'ficheTechnique_en', 'imageUrl'
    ];
    
    // Quality assessment
    const qualityResults = {
      excellent: [], // 90-100 score
      good: [],      // 70-89 score
      poor: [],      // 50-69 score  
      critical: [],  // <50 score
      totalIssues: 0,
      duplicateRefs: new Set(),
      invalidUrls: [],
      languageIssues: [],
      translationProblems: []
    };
    
    const seenReferences = new Set();
    
    // Analyze first 50 lines (representative sample)
    const sampleSize = Math.min(50, lines.length - 1);
    console.log(`🔍 Analyzing sample of ${sampleSize} products...\n`);
    
    for (let i = 1; i <= sampleSize; i++) {
      const line = lines[i];
      const fields = parseCSVLine(line);
      
      if (fields.length < expectedFields.length) {
        qualityResults.critical.push({
          line: i,
          ref: fields[0] || 'Unknown',
          issue: `Insufficient fields: ${fields.length}/${expectedFields.length}`
        });
        continue;
      }
      
      const productData = {};
      expectedFields.forEach((field, index) => {
        productData[field] = fields[index] || '';
      });
      
      const issues = [];
      let score = 100;
      
      // Check reference
      const refCheck = qualityChecks.referenceCheck(productData.referenceFournisseur);
      if (!refCheck.valid) {
        issues.push(...refCheck.issues.map(i => `Reference: ${i}`));
        score -= 20;
      }
      
      // Check for duplicates
      if (seenReferences.has(productData.referenceFournisseur)) {
        issues.push('Duplicate reference');
        qualityResults.duplicateRefs.add(productData.referenceFournisseur);
        score -= 30;
      }
      seenReferences.add(productData.referenceFournisseur);
      
      // Check translations
      const frLangCheck = qualityChecks.languageCheck(productData.nom_fr, 'fr');
      const enLangCheck = qualityChecks.languageCheck(productData.nom_en, 'en');
      const transCheck = qualityChecks.translationCheck(productData.nom_fr, productData.nom_en);
      
      if (!frLangCheck.valid) {
        issues.push(...frLangCheck.issues.map(i => `French Name: ${i}`));
        qualityResults.languageIssues.push(productData.referenceFournisseur);
        score -= 25;
      }
      
      if (!enLangCheck.valid) {
        issues.push(...enLangCheck.issues.map(i => `English Name: ${i}`));
        score -= 15;
      }
      
      if (!transCheck.valid) {
        issues.push(...transCheck.issues.map(i => `Translation: ${i}`));
        qualityResults.translationProblems.push(productData.referenceFournisseur);
        score -= 20;
      }
      
      // Check image URL
      const urlCheck = qualityChecks.urlCheck(productData.imageUrl);
      if (!urlCheck.valid) {
        issues.push(...urlCheck.issues.map(i => `Image URL: ${i}`));
        qualityResults.invalidUrls.push(productData.referenceFournisseur);
        score -= 15;
      }
      
      // Check manufacturer
      if (!productData.constructeur || productData.constructeur.trim() === '') {
        issues.push('Missing manufacturer');
        score -= 20;
      }
      
      const finalScore = Math.max(0, score);
      qualityResults.totalIssues += issues.length;
      
      const result = {
        line: i,
        ref: productData.referenceFournisseur,
        manufacturer: productData.constructeur,
        frName: productData.nom_fr.substring(0, 50) + (productData.nom_fr.length > 50 ? '...' : ''),
        enName: productData.nom_en.substring(0, 50) + (productData.nom_en.length > 50 ? '...' : ''),
        score: finalScore,
        issues
      };
      
      // Categorize by score
      if (finalScore >= 90) {
        qualityResults.excellent.push(result);
      } else if (finalScore >= 70) {
        qualityResults.good.push(result);
      } else if (finalScore >= 50) {
        qualityResults.poor.push(result);
      } else {
        qualityResults.critical.push(result);
      }
      
      // Show progress for critical issues
      if (finalScore < 70) {
        const scoreColor = finalScore >= 50 ? '🟠' : '🔴';
        console.log(`${scoreColor} Line ${i}: ${productData.referenceFournisseur} (Score: ${finalScore})`);
        console.log(`   🇫🇷 ${result.frName}`);
        console.log(`   🇬🇧 ${result.enName}`);
        if (issues.length > 0) {
          console.log(`   ❌ Issues:`);
          issues.slice(0, 2).forEach(issue => console.log(`      - ${issue}`));
          if (issues.length > 2) console.log(`      ... and ${issues.length - 2} more`);
        }
        console.log('');
      }
    }
    
    // Calculate statistics
    const total = qualityResults.excellent.length + qualityResults.good.length + 
                 qualityResults.poor.length + qualityResults.critical.length;
    const averageScore = total > 0 ? Math.round(
      (qualityResults.excellent.reduce((sum, p) => sum + p.score, 0) +
       qualityResults.good.reduce((sum, p) => sum + p.score, 0) +
       qualityResults.poor.reduce((sum, p) => sum + p.score, 0) +
       qualityResults.critical.reduce((sum, p) => sum + p.score, 0)) / total
    ) : 0;
    
    console.log('📊 CSV QUALITY ASSESSMENT RESULTS:');
    console.log('==================================');
    console.log(`🟢 Excellent (90-100): ${qualityResults.excellent.length} products`);
    console.log(`🟡 Good (70-89): ${qualityResults.good.length} products`);
    console.log(`🟠 Poor (50-69): ${qualityResults.poor.length} products`);
    console.log(`🔴 Critical (<50): ${qualityResults.critical.length} products`);
    console.log(`📈 Average Score: ${averageScore}%`);
    console.log(`❌ Total Issues: ${qualityResults.totalIssues}`);
    console.log('');
    
    // Detailed issue breakdown
    console.log('🔍 DETAILED ISSUE ANALYSIS:');
    console.log('===========================');
    console.log(`📋 Duplicate references: ${qualityResults.duplicateRefs.size}`);
    console.log(`🖼️  Invalid image URLs: ${qualityResults.invalidUrls.length}`);
    console.log(`🌍 Language issues: ${qualityResults.languageIssues.length}`);
    console.log(`🔤 Translation problems: ${qualityResults.translationProblems.length}`);
    
    // Critical issues that must be fixed
    if (qualityResults.critical.length > 0) {
      console.log('\\n🚨 CRITICAL ISSUES (MUST FIX BEFORE IMPORT):');
      console.log('============================================');
      qualityResults.critical.forEach(product => {
        console.log(`❌ Line ${product.line}: ${product.ref}`);
        product.issues.forEach(issue => console.log(`   - ${issue}`));
      });
    }
    
    // Final recommendation
    console.log('\\n💡 IMPORT RECOMMENDATION:');
    console.log('=========================');
    
    const criticalCount = qualityResults.critical.length;
    const poorCount = qualityResults.poor.length;
    
    if (criticalCount > 0) {
      console.log('🔴 ❌ DO NOT IMPORT - Critical issues must be resolved first');
      console.log(`   Fix ${criticalCount} critical products before proceeding`);
    } else if (poorCount > total * 0.3) {
      console.log('🟠 ⚠️  CAUTION - High number of poor quality products');
      console.log(`   Consider fixing ${poorCount} poor quality products`);
    } else if (averageScore >= 75) {
      console.log('🟢 ✅ SAFE TO IMPORT - Quality acceptable');
      console.log(`   Average score of ${averageScore}% meets quality standards`);
    } else {
      console.log('🟡 ⚠️  MARGINAL - Consider quality improvements before import');
      console.log(`   Average score of ${averageScore}% is below recommended 75%`);
    }
    
    // Save report
    const report = {
      filename: csvPath,
      analyzedLines: sampleSize,
      totalLines: lines.length - 1,
      qualityDistribution: {
        excellent: qualityResults.excellent.length,
        good: qualityResults.good.length,
        poor: qualityResults.poor.length,
        critical: qualityResults.critical.length
      },
      averageScore,
      issues: {
        duplicateReferences: Array.from(qualityResults.duplicateRefs),
        invalidUrls: qualityResults.invalidUrls,
        languageIssues: qualityResults.languageIssues,
        translationProblems: qualityResults.translationProblems
      },
      criticalProducts: qualityResults.critical,
      poorQualityProducts: qualityResults.poor
    };
    
    fs.writeFileSync('csv-quality-report.json', JSON.stringify(report, null, 2));
    console.log('\\n📄 Detailed CSV quality report saved to: csv-quality-report.json');
    
    return {
      safeToImport: criticalCount === 0 && averageScore >= 75,
      averageScore,
      issues: qualityResults
    };
    
  } catch (error) {
    console.error('❌ CSV verification failed:', error.message);
    return { safeToImport: false, error: error.message };
  }
}

verifyImportSheet().then(result => {
  if (result.safeToImport) {
    console.log('\\n🎯 CSV VERIFICATION: ✅ PASSED');
  } else {
    console.log('\\n🎯 CSV VERIFICATION: ❌ FAILED');
  }
});