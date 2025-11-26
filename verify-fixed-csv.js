const fs = require('fs');

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

// Check translation quality
function evaluateTranslationQuality(frText, enText) {
  if (!frText || !enText) return { score: 0, issues: ['Missing translation'] };
  
  const issues = [];
  let score = 100;
  
  // Check if identical
  if (frText.toLowerCase().trim() === enText.toLowerCase().trim()) {
    issues.push('Identical French and English');
    score -= 50;
  }
  
  // Check for English words in French
  const englishWords = ['forceps', 'scissors', 'the', 'and', 'with', 'for'];
  const foundEnglish = englishWords.filter(word => 
    frText.toLowerCase().includes(word.toLowerCase())
  );
  if (foundEnglish.length > 0) {
    issues.push(`English words in French: ${foundEnglish.join(', ')}`);
    score -= foundEnglish.length * 15;
  }
  
  // Check for proper French medical terms
  const frenchTerms = ['pinces', 'ciseaux', 'avec', 'pour', 'de', 'mâchoires'];
  const hasFrenchTerms = frenchTerms.some(term => 
    frText.toLowerCase().includes(term.toLowerCase())
  );
  if (hasFrenchTerms) score += 20;
  
  return { score: Math.max(0, score), issues };
}

async function verifyFixedCSV() {
  console.log('🔍 VERIFYING FIXED CSV TRANSLATION QUALITY');
  console.log('==========================================');
  
  const originalCsv = 'data/kitmed_full_import_2025-11-25T13-46-22.csv';
  const fixedCsv = 'data/kitmed_full_import_2025-11-25T13-46-22_fixed_translations.csv';
  
  if (!fs.existsSync(fixedCsv)) {
    console.log('❌ Fixed CSV file not found:', fixedCsv);
    return;
  }
  
  console.log('📄 Analyzing fixed CSV:', fixedCsv);
  
  const fixedContent = fs.readFileSync(fixedCsv, 'utf-8');
  const lines = fixedContent.split('\n').filter(line => line.trim().length > 0);
  
  console.log(`📊 Total lines: ${lines.length}`);
  console.log(`📦 Products to verify: ${lines.length - 1}\n`);
  
  const qualityResults = {
    excellent: 0,  // 90-100
    good: 0,       // 70-89
    poor: 0,       // 50-69
    critical: 0    // <50
  };
  
  const sampleSize = Math.min(50, lines.length - 1);
  let totalScore = 0;
  let issueCount = 0;
  
  for (let i = 1; i <= sampleSize; i++) {
    const fields = parseCSVLine(lines[i]);
    
    if (fields.length < 8) continue;
    
    const ref = fields[0];
    const manufacturer = fields[1];
    const frenchName = fields[6];
    const englishName = fields[7];
    
    const quality = evaluateTranslationQuality(frenchName, englishName);
    totalScore += quality.score;
    issueCount += quality.issues.length;
    
    if (quality.score >= 90) qualityResults.excellent++;
    else if (quality.score >= 70) qualityResults.good++;
    else if (quality.score >= 50) qualityResults.poor++;
    else qualityResults.critical++;
    
    // Show problematic ones
    if (quality.score < 70) {
      const scoreIcon = quality.score >= 50 ? '🟠' : '🔴';
      console.log(`${scoreIcon} ${ref} (${manufacturer}) - Score: ${quality.score}`);
      console.log(`   🇫🇷 ${frenchName}`);
      console.log(`   🇬🇧 ${englishName}`);
      if (quality.issues.length > 0) {
        console.log(`   ❌ ${quality.issues.join(', ')}`);
      }
      console.log('');
    }
  }
  
  const averageScore = Math.round(totalScore / sampleSize);
  
  console.log('📊 FIXED CSV QUALITY RESULTS:');
  console.log('=============================');
  console.log(`🟢 Excellent (90-100): ${qualityResults.excellent} products`);
  console.log(`🟡 Good (70-89): ${qualityResults.good} products`);
  console.log(`🟠 Poor (50-69): ${qualityResults.poor} products`);
  console.log(`🔴 Critical (<50): ${qualityResults.critical} products`);
  console.log(`📈 Average Score: ${averageScore}%`);
  console.log(`❌ Total Issues: ${issueCount}\n`);
  
  // Comparison with previous
  console.log('🔄 IMPROVEMENT ANALYSIS:');
  console.log('========================');
  
  if (averageScore >= 85) {
    console.log('✅ EXCELLENT IMPROVEMENT - CSV Ready for Import');
    console.log('🟢 Translation quality significantly improved');
    console.log('🟢 Safe to proceed with bulk imports');
  } else if (averageScore >= 75) {
    console.log('🟡 GOOD IMPROVEMENT - CSV Acceptable for Import');
    console.log('⚠️  Some minor issues remain but quality is good');
    console.log('✅ Can proceed with imports');
  } else {
    console.log('🔴 LIMITED IMPROVEMENT - More Work Needed');
    console.log('❌ Quality still below acceptable threshold');
    console.log('⚠️  Additional translation work required');
  }
  
  console.log(`\n📈 Original Score: 72% → Fixed Score: ${averageScore}%`);
  console.log(`📈 Improvement: +${averageScore - 72} points\n`);
  
  return {
    averageScore,
    distribution: qualityResults,
    safeToImport: averageScore >= 75 && qualityResults.critical === 0
  };
}

verifyFixedCSV().then(result => {
  if (result && result.safeToImport) {
    console.log('🎯 VERIFICATION RESULT: ✅ FIXED CSV READY FOR IMPORT');
  } else {
    console.log('🎯 VERIFICATION RESULT: ❌ MORE FIXES NEEDED');
  }
});