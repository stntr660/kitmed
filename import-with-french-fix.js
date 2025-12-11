const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Enhanced French translation function with medical terminology
const medicalTermsMap = {
  // Basic terms
  'forceps': 'pinces',
  'scissors': 'ciseaux', 
  'curved': 'courbes',
  'straight': 'droites',
  'blunt': 'émoussées',
  'sharp': 'tranchantes',
  'reusable': 'réutilisables',
  'length': 'longueur',
  'total length': 'longueur totale',
  'active part': 'partie active',
  'platforms': 'plateformes',
  'teeth': 'dents',
  'jaws': 'mâchoires',
  'tip': 'pointe',
  'handle': 'manche',
  'serrated': 'dentelées',
  'smooth': 'lisses',
  'cross-action': 'à action croisée',
  'double-ended': 'à double extrémité',
  'angled': 'angulées',
  
  // Medical procedures  
  'ophthalmic surgery': 'chirurgie ophtalmique',
  'cornea': 'cornée',
  'eye': 'œil',
  'eyeball': 'globe oculaire',
  'iris': 'iris',
  
  // Actions
  'can be used': 'peut être utilisé',
  'used to': 'utilisé pour',
  'used for': 'utilisé pour',
  'hold': 'maintenir',
  'cut': 'couper',
  'manipulate': 'manipuler',
  'grasp': 'saisir',
  'with': 'avec'
};

function translateToFrench(englishText) {
  if (!englishText) return '';
  
  let frenchText = englishText.toLowerCase();
  
  // Apply medical terminology mapping
  Object.entries(medicalTermsMap).forEach(([english, french]) => {
    const regex = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'gi');
    frenchText = frenchText.replace(regex, french);
  });
  
  // Capitalize first letter
  frenchText = frenchText.charAt(0).toUpperCase() + frenchText.slice(1);
  
  return frenchText;
}

async function importWithFrenchFix(csvFile, batchSize = 50, startRow = 1) {
  try {
    console.log('📦 IMPORT CSV AVEC TRADUCTIONS FRANÇAISES AMÉLIORÉES');
    console.log('===================================================');
    console.log(`📁 Fichier: ${csvFile}`);
    console.log(`📊 Taille lot: ${batchSize}`);
    console.log(`🎯 Ligne de départ: ${startRow}`);
    
    // Read CSV file
    const csvContent = fs.readFileSync(csvFile, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    const header = lines[0];
    
    console.log(`\n📋 Total lignes: ${lines.length}`);
    console.log(`📋 En-tête: ${header}`);
    
    // Get available partners
    const partners = await prisma.partner.findMany({
      where: { status: 'active' },
      select: { id: true, name: true }
    });
    const partnerMap = new Map(partners.map(p => [p.name.toLowerCase(), p]));
    
    // Get available categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true }
    });
    
    console.log(`\n🏭 Partenaires disponibles: ${partners.length}`);
    console.log(`📂 Catégories disponibles: ${categories.length}`);
    
    let importCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // Process lines in batch
    const endRow = Math.min(startRow + batchSize, lines.length - 1);
    
    for (let i = startRow; i <= endRow; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      try {
        // Parse CSV line (simple parsing - adjust if needed)
        const fields = line.split(',');
        
        if (fields.length < 13) {
          console.log(`⚠️ Ligne ${i}: Nombre de champs insuffisant`);
          errorCount++;
          continue;
        }
        
        const productData = {
          referenceFournisseur: fields[0]?.replace(/"/g, '').trim(),
          constructeur: fields[1]?.replace(/"/g, '').trim(),
          slug: fields[2]?.replace(/"/g, '').trim(),
          categoryId: fields[3]?.replace(/"/g, '').trim(),
          status: fields[4]?.replace(/"/g, '').trim() || 'active',
          isFeatured: fields[5]?.replace(/"/g, '').trim() === 'true',
          nom_fr: fields[6]?.replace(/"/g, '').trim(),
          nom_en: fields[7]?.replace(/"/g, '').trim(),
          description_fr: fields[8]?.replace(/"/g, '').trim(),
          description_en: fields[9]?.replace(/"/g, '').trim(),
          ficheTechnique_fr: fields[10]?.replace(/"/g, '').trim(),
          ficheTechnique_en: fields[11]?.replace(/"/g, '').trim(),
          imageUrl: fields[12]?.replace(/"/g, '').trim()
        };
        
        // Check if product already exists
        const existingProduct = await prisma.product.findUnique({
          where: { referenceFournisseur: productData.referenceFournisseur }
        });
        
        if (existingProduct) {
          console.log(`⏭️ Ligne ${i}: Produit ${productData.referenceFournisseur} existe déjà`);
          skipCount++;
          continue;
        }
        
        // Find partner
        const partner = partnerMap.get(productData.constructeur.toLowerCase());
        if (!partner) {
          console.log(`❌ Ligne ${i}: Partenaire '${productData.constructeur}' non trouvé`);
          errorCount++;
          continue;
        }
        
        // Improve French translations if they appear to be in English
        let frenchDescription = productData.description_fr;
        let frenchSpec = productData.ficheTechnique_fr;
        
        // Check if French description looks like English and fix it
        const hasEnglishWords = /\b(the|and|with|can|be|used|to|for|in|at|by)\b/.test(frenchDescription.toLowerCase());
        const hasFrenchWords = /\b(le|la|les|et|avec|peut|être|utilisé|pour)\b/.test(frenchDescription.toLowerCase());
        
        if (hasEnglishWords && !hasFrenchWords && frenchDescription.length > 10) {
          console.log(`   🔧 Translation automatique FR pour ${productData.referenceFournisseur}`);
          frenchDescription = translateToFrench(productData.description_en);
          frenchSpec = translateToFrench(productData.ficheTechnique_en);
        }
        
        // Generate slug
        const slug = `${productData.nom_en}-${productData.referenceFournisseur}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50);
        
        // Create product
        const createdProduct = await prisma.product.create({
          data: {
            referenceFournisseur: productData.referenceFournisseur,
            constructeur: productData.constructeur,
            slug: slug,
            categoryId: productData.categoryId,
            status: productData.status,
            isFeatured: productData.isFeatured,
            partnerId: partner.id,
            
            translations: {
              create: [
                {
                  languageCode: 'fr',
                  nom: productData.nom_fr,
                  description: frenchDescription,
                  ficheTechnique: frenchSpec
                },
                {
                  languageCode: 'en',
                  nom: productData.nom_en,
                  description: productData.description_en,
                  ficheTechnique: productData.ficheTechnique_en
                }
              ]
            },
            
            media: productData.imageUrl ? {
              create: [{
                type: 'image',
                url: productData.imageUrl,
                isPrimary: true,
                sortOrder: 0,
                altText: productData.nom_en
              }]
            } : undefined
          }
        });
        
        console.log(`✅ Ligne ${i}: Créé ${productData.referenceFournisseur} (${productData.constructeur})`);
        importCount++;
        
      } catch (error) {
        console.log(`❌ Ligne ${i}: Erreur - ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 RÉSUMÉ IMPORT:`);
    console.log(`✅ Créés: ${importCount}`);
    console.log(`⏭️ Ignorés (existants): ${skipCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📋 Traité: lignes ${startRow} à ${endRow}`);
    
    // Check next batch
    if (endRow < lines.length - 1) {
      console.log(`\n🔄 Prochaine commande pour continuer:`);
      console.log(`DATABASE_URL="..." node import-with-french-fix.js "${csvFile}" ${batchSize} ${endRow + 1}`);
    } else {
      console.log(`\n🎉 IMPORT TERMINÉ! Tous les produits ont été traités.`);
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    await prisma.$disconnect();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const csvFile = args[0] || 'data/kitmed_full_import_2025-11-25T13-46-22.csv';
const batchSize = parseInt(args[1]) || 50;
const startRow = parseInt(args[2]) || 64; // Start after already imported products

importWithFrenchFix(csvFile, batchSize, startRow);