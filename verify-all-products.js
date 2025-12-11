const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Comprehensive verification functions
const verificationCriteria = {
  // French translation quality
  frenchQuality: (frText, enText) => {
    if (!frText || !enText) return { score: 0, issues: ['Missing translation'] };
    
    const issues = [];
    let score = 100;
    
    // Check if French is identical to English (bad)
    if (frText.toLowerCase() === enText.toLowerCase()) {
      issues.push('French identical to English');
      score -= 50;
    }
    
    // Check for English words in French text
    const englishWords = ['the', 'and', 'with', 'for', 'replacement', 'tip', 'forceps', 'scissors'];
    const foundEnglish = englishWords.filter(word => 
      frText.toLowerCase().includes(word.toLowerCase())
    );
    if (foundEnglish.length > 0) {
      issues.push(`English words in French: ${foundEnglish.join(', ')}`);
      score -= foundEnglish.length * 10;
    }
    
    // Check for proper French medical terms
    const frenchMedicalTerms = ['pinces', 'ciseaux', 'trépan', 'perforatrice', 'canule', 'spatule'];
    const hasProperFrench = frenchMedicalTerms.some(term => 
      frText.toLowerCase().includes(term)
    );
    if (hasProperFrench) score += 10;
    
    // Check capitalization
    if (frText[0] !== frText[0].toUpperCase()) {
      issues.push('No capital letter at start');
      score -= 5;
    }
    
    return { score: Math.max(0, score), issues };
  },
  
  // Product name formatting
  nameFormatting: (name) => {
    const issues = [];
    let score = 100;
    
    if (!name) return { score: 0, issues: ['No name provided'] };
    
    // Check for incomplete parentheses
    const openParens = (name.match(/\(/g) || []).length;
    const closeParens = (name.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push('Unmatched parentheses');
      score -= 20;
    }
    
    // Check for trailing punctuation issues
    if (name.endsWith(',') || name.endsWith('(')) {
      issues.push('Improper ending punctuation');
      score -= 15;
    }
    
    // Check for excessive length
    if (name.length > 150) {
      issues.push('Name too long (>150 chars)');
      score -= 10;
    }
    
    // Check for minimal content
    if (name.length < 5) {
      issues.push('Name too short (<5 chars)');
      score -= 30;
    }
    
    return { score: Math.max(0, score), issues };
  },
  
  // Medical terminology accuracy
  medicalTerminology: (frName, enName) => {
    const issues = [];
    let score = 100;
    
    const translations = {
      'forceps': 'pinces',
      'scissors': 'ciseaux',
      'trephine': 'trépan', 
      'punch': 'perforatrice',
      'cannula': 'canule',
      'spatula': 'spatule',
      'curved': 'courbes',
      'straight': 'droites',
      'replacement': 'remplacement',
      'tip': 'pointe',
      'for': 'pour',
      'with': 'avec'
    };
    
    for (const [english, french] of Object.entries(translations)) {
      const hasEnglish = enName.toLowerCase().includes(english);
      const hasFrench = frName.toLowerCase().includes(french);
      
      if (hasEnglish && !hasFrench) {
        issues.push(`Missing French translation: ${english} should be ${french}`);
        score -= 15;
      }
    }
    
    return { score: Math.max(0, score), issues };
  },
  
  // Image quality verification
  imageQuality: (mediaArray) => {
    const issues = [];
    let score = 100;
    
    if (!mediaArray || mediaArray.length === 0) {
      return { score: 0, issues: ['No images'] };
    }
    
    mediaArray.forEach((media, index) => {
      // Check URL validity
      if (!media.url.startsWith('http') && !media.url.startsWith('/')) {
        issues.push(`Image ${index + 1}: Invalid URL format`);
        score -= 25;
      }
      
      // Check for manufacturer domain (quality indicator)
      const goodDomains = ['moria-surgical.com', 'keelerglobal.com'];
      const hasGoodDomain = goodDomains.some(domain => media.url.includes(domain));
      if (!hasGoodDomain && media.url.startsWith('http')) {
        issues.push(`Image ${index + 1}: Not from official manufacturer domain`);
        score -= 10;
      }
      
      // Check for primary image
      if (index === 0 && !media.isPrimary) {
        issues.push('First image should be marked as primary');
        score -= 5;
      }
    });
    
    return { score: Math.max(0, score), issues };
  }
};

async function verifyAllProducts() {
  try {
    console.log('🔍 COMPREHENSIVE PRODUCT VERIFICATION');
    console.log('====================================');
    
    // Get all remaining products
    const products = await prisma.product.findMany({
      include: {
        translations: true,
        media: true,
        partner: true,
        category: {
          include: { translations: true }
        }
      },
      orderBy: { referenceFournisseur: 'asc' }
    });
    
    console.log(`📊 Verifying ${products.length} products...\n`);
    
    const verificationResults = {
      excellent: [], // 90-100 score
      good: [],      // 70-89 score  
      poor: [],      // 50-69 score
      critical: []   // <50 score
    };
    
    const detailedReport = [];
    
    for (const product of products) {
      const frTranslation = product.translations.find(t => t.languageCode === 'fr');
      const enTranslation = product.translations.find(t => t.languageCode === 'en');
      
      if (!frTranslation || !enTranslation) {
        verificationResults.critical.push({
          ref: product.referenceFournisseur,
          issue: 'Missing translations'
        });
        continue;
      }
      
      // Run all verifications
      const frQuality = verificationCriteria.frenchQuality(frTranslation.nom, enTranslation.nom);
      const frNameFormat = verificationCriteria.nameFormatting(frTranslation.nom);
      const enNameFormat = verificationCriteria.nameFormatting(enTranslation.nom);
      const terminology = verificationCriteria.medicalTerminology(frTranslation.nom, enTranslation.nom);
      const imageQuality = verificationCriteria.imageQuality(product.media);
      
      // Calculate overall score
      const weights = {
        frenchQuality: 0.3,
        frNameFormat: 0.15,
        enNameFormat: 0.15,
        terminology: 0.25,
        imageQuality: 0.15
      };
      
      const overallScore = Math.round(
        frQuality.score * weights.frenchQuality +
        frNameFormat.score * weights.frNameFormat +
        enNameFormat.score * weights.enNameFormat +
        terminology.score * weights.terminology +
        imageQuality.score * weights.imageQuality
      );
      
      // Collect all issues
      const allIssues = [
        ...frQuality.issues.map(i => `French Quality: ${i}`),
        ...frNameFormat.issues.map(i => `FR Format: ${i}`),
        ...enNameFormat.issues.map(i => `EN Format: ${i}`),
        ...terminology.issues.map(i => `Terminology: ${i}`),
        ...imageQuality.issues.map(i => `Image: ${i}`)
      ];
      
      const productResult = {
        referenceFournisseur: product.referenceFournisseur,
        constructeur: product.constructeur,
        frenchName: frTranslation.nom,
        englishName: enTranslation.nom,
        overallScore,
        issues: allIssues,
        imageCount: product.media.length,
        hasCategory: !!product.category,
        hasPartner: !!product.partner,
        categoryName: product.category?.translations?.find(t => t.languageCode === 'fr')?.name || 'No category'
      };
      
      detailedReport.push(productResult);
      
      // Categorize by score
      if (overallScore >= 90) {
        verificationResults.excellent.push(productResult);
      } else if (overallScore >= 70) {
        verificationResults.good.push(productResult);
      } else if (overallScore >= 50) {
        verificationResults.poor.push(productResult);
      } else {
        verificationResults.critical.push(productResult);
      }
      
      // Display result
      const scoreColor = overallScore >= 90 ? '🟢' : overallScore >= 70 ? '🟡' : overallScore >= 50 ? '🟠' : '🔴';
      console.log(`${scoreColor} ${product.referenceFournisseur} (Score: ${overallScore})`);
      console.log(`   🇫🇷 ${frTranslation.nom}`);
      console.log(`   🇬🇧 ${enTranslation.nom}`);
      
      if (allIssues.length > 0) {
        console.log(`   ❌ Issues (${allIssues.length}):`);
        allIssues.slice(0, 3).forEach(issue => {
          console.log(`      - ${issue}`);
        });
        if (allIssues.length > 3) {
          console.log(`      ... and ${allIssues.length - 3} more issues`);
        }
      }
      console.log('');
    }
    
    // Summary
    console.log('📊 VERIFICATION SUMMARY:');
    console.log('========================');
    console.log(`🟢 Excellent (90-100): ${verificationResults.excellent.length} products`);
    console.log(`🟡 Good (70-89): ${verificationResults.good.length} products`);
    console.log(`🟠 Poor (50-69): ${verificationResults.poor.length} products`);
    console.log(`🔴 Critical (<50): ${verificationResults.critical.length} products`);
    
    const averageScore = Math.round(
      detailedReport.reduce((sum, p) => sum + p.overallScore, 0) / detailedReport.length
    );
    console.log(`📈 Average Score: ${averageScore}%`);
    
    // Critical issues that need immediate attention
    if (verificationResults.critical.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
      console.log('=================================================');
      verificationResults.critical.forEach(product => {
        console.log(`❌ ${product.referenceFournisseur}:`);
        product.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      });
    }
    
    // Save detailed report
    fs.writeFileSync('product-verification-report.json', JSON.stringify({
      summary: {
        totalProducts: products.length,
        averageScore,
        distribution: {
          excellent: verificationResults.excellent.length,
          good: verificationResults.good.length,
          poor: verificationResults.poor.length,
          critical: verificationResults.critical.length
        }
      },
      products: detailedReport,
      criticalIssues: verificationResults.critical,
      poorQuality: verificationResults.poor
    }, null, 2));
    
    console.log('\n📄 Detailed report saved to: product-verification-report.json');
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    
    if (verificationResults.critical.length > 0) {
      console.log('🔴 CRITICAL: Fix critical issues before any new imports');
    }
    
    if (verificationResults.poor.length > 0) {
      console.log('🟠 MEDIUM: Improve poor quality products');
    }
    
    if (averageScore >= 80) {
      console.log('✅ GOOD: Quality is acceptable for new imports');
    } else {
      console.log('⚠️  WARNING: Improve existing quality before importing more');
    }
    
    await prisma.$disconnect();
    
    return {
      shouldProceedWithImports: verificationResults.critical.length === 0 && averageScore >= 75,
      averageScore,
      summary: verificationResults
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run verification
verifyAllProducts().then(result => {
  if (result.shouldProceedWithImports) {
    console.log('\n🟢 ✅ QUALITY CHECK PASSED - SAFE TO PROCEED WITH NEW IMPORTS');
  } else {
    console.log('\n🔴 ❌ QUALITY CHECK FAILED - DO NOT IMPORT UNTIL ISSUES ARE FIXED');
  }
});