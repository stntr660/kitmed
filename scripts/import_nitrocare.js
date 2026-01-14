const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// English to French translation dictionary for medical/hospital terms
const translations = {
  // Bed types
  'ICU Bed': 'Lit de Soins Intensifs',
  'Patient Bed': 'Lit Patient',
  'Hospital Bed': 'Lit Hopital',
  'Home Care Bed': 'Lit de Soins a Domicile',
  'Care Patient Bed': 'Lit de Soins Patient',
  'Bariatric ICU Bed': 'Lit de Soins Intensifs Bariatrique',
  'Bariatric Hospital Bed': 'Lit Hopital Bariatrique',
  'Weight Scale ICU Bed': 'Lit de Soins Intensifs avec Balance',
  'Lowbed': 'Lit Bas',

  // Stretchers
  'Stretcher': 'Brancard',
  'Patient Treatment Stretcher': 'Brancard de Traitement Patient',
  'Emergency Stretcher': 'Brancard Urgence',
  'Transfer Stretcher': 'Brancard de Transfert',
  'MRI Stretcher': 'Brancard IRM',
  'Hydraulic Stretcher': 'Brancard Hydraulique',
  'Ambulance Stretcher': 'Brancard Ambulance',

  // Chairs
  'Transport Chair': 'Chaise de Transport',
  'Dialysis Chair': 'Fauteuil de Dialyse',
  'Blood Donor Chair': 'Fauteuil Donneur de Sang',
  'Blood Collection Chair': 'Fauteuil de Prelevement Sanguin',
  'Geriatric Chair': 'Fauteuil Geriatrique',
  'Blood Transfusion Chair': 'Fauteuil de Transfusion Sanguine',
  'Chemotherapy Chair': 'Fauteuil de Chimiotherapie',
  'Treatment Chair': 'Fauteuil de Traitement',

  // Tables
  'Examination Table': 'Table Examen',
  'Gynecological Examination Table': 'Table Examen Gynecologique',
  'Autopsy Table': 'Table Autopsie',
  'Operating Table': 'Table Operation',
  'Overbed Table': 'Table de Lit',

  // Trolleys and Carts
  'Trolley': 'Chariot',
  'Cart': 'Chariot',
  'Emergency Trolley': 'Chariot Urgence',
  'Dressing Cart': 'Chariot de Pansement',
  'Medicine Cart': 'Chariot a Medicaments',
  'Instrument Trolley': 'Chariot a Instruments',
  'Anesthesia Trolley': 'Chariot Anesthesie',
  'Laundry Trolley': 'Chariot a Linge',
  'Cleaning Cart': 'Chariot de Nettoyage',
  'Food Transport Trolley': 'Chariot Transport Repas',
  'Waste Trolley': 'Chariot a Dechets',
  'Linen Trolley': 'Chariot a Linge',
  'File Trolley': 'Chariot Dossiers',
  'Drug Trolley': 'Chariot a Medicaments',

  // Cabinets
  'Bedside Cabinet': 'Table de Chevet',
  'Cabinet': 'Armoire',
  'Instrument Cabinet': 'Armoire a Instruments',
  'Medicine Cabinet': 'Armoire a Pharmacie',
  'Locker': 'Casier',

  // Baby/Pediatric
  'Baby Cot': 'Berceau Bebe',
  'Infant Warmer': 'Table Chauffante Nourrisson',
  'Phototherapy': 'Phototherapie',
  'Bassinet': 'Berceau',

  // Others
  'IV Stand': 'Pied a Perfusion',
  'Screen': 'Paravent',
  'Folding Screen': 'Paravent Pliable',
  'Patient Screen': 'Paravent Patient',
  'Mayo Table': 'Table Mayo',
  'Kick Bucket': 'Seau a Roulettes',
  'Step Stool': 'Marchepied',
  'Platform Scale': 'Balance Plateforme',
  'Wheelchair Scale': 'Balance Fauteuil Roulant',
  'Baby Scale': 'Pese-Bebe',
  'Hamper Stand': 'Porte-Sac a Linge',
  'Walker': 'Deambulateur',
  'Crutches': 'Bequilles',
  'Wheelchair': 'Fauteuil Roulant',

  // Motor terms
  'Four Motors': 'Quatre Moteurs',
  'Three Motors': 'Trois Moteurs',
  'Five Motors': 'Cinq Moteurs',
  'Two Motors': 'Deux Moteurs',

  // General terms
  'Column Model': 'Modele Colonne',
  'Lateral': 'Lateral',
  'Weight Scale': 'Balance',
  'Electric': 'Electrique',
  'Hydraulic': 'Hydraulique',
  'Manual': 'Manuel',
  'Foldable': 'Pliable',
  'Mobile': 'Mobile',
  'Stainless Steel': 'Acier Inoxydable',
  'With': 'Avec',
  'And': 'Et',
};

// Translate product name from English to French
function translateToFrench(englishName) {
  let frenchName = englishName;

  // Keep the NITRO prefix and model number
  // Replace common terms with French equivalents

  // Sort by length (longest first) to avoid partial replacements
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

  for (const eng of sortedKeys) {
    const fr = translations[eng];
    const regex = new RegExp(eng, 'gi');
    frenchName = frenchName.replace(regex, fr);
  }

  return frenchName;
}

// Generate slug from product name and reference
function generateSlug(name, reference) {
  const base = name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 70);
  const refSlug = reference.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
  return `${base}-${refSlug}`;
}

// Generate unique ID
function generateId() {
  return `nitro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function importProducts() {
  const excelPath = '/Users/mac/Documents/Catalogue_Nitrocare.xlsx';

  // Read Excel file
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const records = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${records.length} Nitrocare products to import\n`);

  const partnerId = 'c3f28667-b7f2-496b-9ff6-967d179cd47b'; // NITROCARE
  const categoryId = 'hospital-furniture';

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const reference = record['Référence']?.trim();
      const productNameEn = record['Nom du Produit']?.trim();
      const productUrl = record['URL Page Produit']?.trim();

      if (!reference || !productNameEn) {
        console.log(`Skipping: Missing reference or name`);
        skipped++;
        continue;
      }

      const slug = generateSlug(productNameEn, reference);

      // Check if product already exists
      const existing = await prisma.products.findFirst({
        where: {
          OR: [
            { reference_fournisseur: reference },
            { slug: slug }
          ]
        }
      });

      if (existing) {
        console.log(`Skipping: "${productNameEn}" already exists`);
        skipped++;
        continue;
      }

      const productId = generateId();
      const productNameFr = translateToFrench(productNameEn);

      // Create product
      await prisma.products.create({
        data: {
          id: productId,
          reference_fournisseur: reference,
          category_id: categoryId,
          constructeur: 'nitrocare',
          slug: slug,
          status: 'active',
          is_featured: false,
          sort_order: 0,
          partner_id: partnerId,
          updated_at: new Date(),
        }
      });

      // Create translations
      await prisma.product_translations.createMany({
        data: [
          {
            id: `${productId}-en`,
            product_id: productId,
            language_code: 'en',
            nom: productNameEn,
            description: `Professional hospital equipment from Nitrocare. Reference: ${reference}`,
          },
          {
            id: `${productId}-fr`,
            product_id: productId,
            language_code: 'fr',
            nom: productNameFr,
            description: `Equipement hospitalier professionnel de Nitrocare. Reference: ${reference}`,
          }
        ]
      });

      console.log(`Imported: "${productNameEn}"`);
      console.log(`  French: "${productNameFr}"`);
      imported++;

    } catch (error) {
      console.error(`Error importing:`, error.message);
      errors++;
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Errors: ${errors}`);

  // Show final counts
  const count = await prisma.products.count({
    where: { partner_id: partnerId }
  });
  console.log(`\nTotal Nitrocare products in database: ${count}`);

  await prisma.$disconnect();
}

importProducts().catch(console.error);
