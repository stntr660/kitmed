const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

/**
 * Preprocess CSV to fix remaining manufacturer issues:
 * 1. Split products with multiple references into individual products
 * 2. Generate safe filenames and slugs
 * 3. Handle special characters and length limits
 */

function splitMultipleReferences(referenceFournisseur, nom_fr, nom_en, description_fr, description_en) {
  // Handle comma-separated references like "S1.7309, S1.7409, S1.7310..."
  if (referenceFournisseur.includes(',') && referenceFournisseur.split(',').length > 3) {
    const references = referenceFournisseur.split(',').map(ref => ref.trim());
    return references.map(ref => ({
      referenceFournisseur: ref,
      nom_fr: `${nom_fr} - ${ref}`,
      nom_en: `${nom_en} - ${ref}`,
      description_fr: description_fr || '',
      description_en: description_en || ''
    }));
  }
  
  // Single product
  return [{
    referenceFournisseur,
    nom_fr,
    nom_en,
    description_fr,
    description_en
  }];
}

function generateSafeSlug(nom, reference, manufacturer) {
  // Create base slug from product name
  let slug = nom
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '');
  
  // If slug is generic or too long, use reference-based approach
  if (slug.length > 40 || slug.length < 3 || slug === 'instrument' || slug === 'equipment') {
    const cleanRef = reference.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Take first few words of name for context
    const nameWords = nom.split(' ').slice(0, 2).join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, '-');
    
    slug = `${manufacturer}-${cleanRef}-${nameWords}`;
  }
  
  return slug.substring(0, 60); // Database limit
}

function generateSafeFilename(reference, manufacturer, suffix = '') {
  // Create safe filename from reference
  const cleanRef = reference
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  
  const cleanMfg = manufacturer
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .substring(0, 15); // Limit manufacturer part
  
  const baseName = `${cleanMfg}-${cleanRef}`;
  
  // If still too long, truncate intelligently
  if (baseName.length > 50) {
    const shortRef = cleanRef.substring(0, 20);
    return `${cleanMfg}-${shortRef}${suffix}`;
  }
  
  return `${baseName}${suffix}`;
}

function preprocessRemainingManufacturers() {
  try {
    console.log('🔧 PREPROCESSING REMAINING MANUFACTURERS CSV');
    console.log('===========================================');
    
    // Read batch 1 CSV which contains the problematic manufacturers
    const csvPath = './kitmed_batch_1_FINAL.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📊 Total records in batch 1: ${records.length}`);
    
    // Filter for the target manufacturers
    const targetManufacturers = ['haag-streit', 'heine', 'johnson---johnson'];
    const targetRecords = records.filter(record => 
      targetManufacturers.includes(record.constructeur)
    );
    
    console.log(`📋 Records for target manufacturers: ${targetRecords.length}`);
    
    const processedProducts = [];
    
    targetRecords.forEach((record, index) => {
      const manufacturer = record.constructeur;
      
      console.log(`\n📦 Processing: ${record.referenceFournisseur} (${manufacturer})`);
      
      // Split multiple references if needed
      const productVariants = splitMultipleReferences(
        record.referenceFournisseur,
        record.nom_fr,
        record.nom_en,
        record.description_fr,
        record.description_en
      );
      
      productVariants.forEach((variant, variantIndex) => {
        // Generate safe slug
        const safeSlug = generateSafeSlug(
          variant.nom_fr || variant.referenceFournisseur,
          variant.referenceFournisseur,
          manufacturer
        );
        
        // Process image URLs with safe filenames
        let processedImageUrls = '';
        if (record.imageUrls) {
          const imageUrls = record.imageUrls.split('|').map(url => url.trim()).filter(url => url);
          
          // Generate safe filenames for each media URL
          const safeImageUrls = imageUrls.map((url, urlIndex) => {
            const isImage = !url.toLowerCase().endsWith('.pdf');
            const suffix = urlIndex === 0 ? '-primary' : `-gallery-${urlIndex + 1}`;
            const ext = isImage ? '.jpg' : '.pdf';
            
            const safeFilename = generateSafeFilename(
              variant.referenceFournisseur,
              manufacturer,
              suffix + ext
            );
            
            // Return original URL for now - we'll handle download mapping separately
            return url;
          });
          
          processedImageUrls = safeImageUrls.join(' | ');
        }
        
        // Create processed product
        processedProducts.push({
          referenceFournisseur: variant.referenceFournisseur,
          constructeur: manufacturer,
          categoryId: record.categoryId || 'surgery-instruments',
          nom_fr: variant.nom_fr || variant.referenceFournisseur,
          nom_en: variant.nom_en || variant.nom_fr || variant.referenceFournisseur,
          description_fr: variant.description_fr || '',
          description_en: variant.description_en || variant.description_fr || '',
          ficheTechnique_fr: record.ficheTechnique_fr || '',
          ficheTechnique_en: record.ficheTechnique_en || '',
          pdfBrochureUrl: record.pdfBrochureUrl || '',
          imageUrls: processedImageUrls,
          status: 'active',
          featured: 'false',
          // Add metadata for processing
          originalReference: record.referenceFournisseur,
          processedSlug: safeSlug,
          variantIndex: variantIndex
        });
        
        console.log(`  ✅ Created variant: ${variant.referenceFournisseur} (slug: ${safeSlug.substring(0, 30)}...)`);
      });
    });
    
    // Generate output CSV
    const outputCsv = stringify(processedProducts, {
      header: true,
      columns: [
        'referenceFournisseur', 'constructeur', 'categoryId', 'nom_fr', 'nom_en',
        'description_fr', 'description_en', 'ficheTechnique_fr', 'ficheTechnique_en',
        'pdfBrochureUrl', 'imageUrls', 'status', 'featured',
        'originalReference', 'processedSlug', 'variantIndex'
      ]
    });
    
    const outputPath = './kitmed_remaining_manufacturers_PREPROCESSED.csv';
    fs.writeFileSync(outputPath, outputCsv);
    
    console.log(`\n✅ PREPROCESSING COMPLETE!`);
    console.log(`📦 Original products: ${targetRecords.length}`);
    console.log(`📦 Processed products: ${processedProducts.length}`);
    console.log(`💾 Output saved: ${outputPath}`);
    
    // Statistics by manufacturer
    const statsByMfg = {};
    processedProducts.forEach(p => {
      statsByMfg[p.constructeur] = (statsByMfg[p.constructeur] || 0) + 1;
    });
    
    console.log(`\n📊 Products by manufacturer:`);
    Object.entries(statsByMfg).forEach(([mfg, count]) => {
      console.log(`  ${mfg}: ${count} products`);
    });
    
    console.log(`\n🚀 Ready for upload with enhanced-csv-uploader!`);
    console.log(`\nNext step: Run the enhanced CSV uploader on the preprocessed file`);
    
    return outputPath;
    
  } catch (error) {
    console.error('❌ Preprocessing error:', error.message);
    throw error;
  }
}

// Run the preprocessing
preprocessRemainingManufacturers().then((outputPath) => {
  console.log(`\n✅ SUCCESS: Preprocessed file ready at ${outputPath}`);
}).catch(error => {
  console.error('❌ Preprocessing failed:', error.message);
  process.exit(1);
});