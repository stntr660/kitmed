const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedNewStructure() {
  console.log('🌱 Seeding new discipline/category structure...');
  
  try {
    // Step 1: Create Medical Disciplines
    const disciplines = [
      {
        id: 'cardiology-disc',
        name: 'Cardiologie',
        slug: 'cardiology',
        description: 'Équipements cardiovasculaires de pointe pour le diagnostic et traitement des maladies cardiaques',
        specialtyCode: 'CARD-01',
        colorCode: '#e74c3c',
        iconCode: 'heart',
        sortOrder: 1,
        isActive: true,
        isFeatured: true,
        metaTitle: 'Équipements de Cardiologie',
        metaDescription: 'Découvrez notre gamme complète d\'équipements cardiovasculaires de haute technologie'
      },
      {
        id: 'radiology-disc',
        name: 'Radiologie',
        slug: 'radiology',
        description: 'Imagerie médicale haute définition pour diagnostics précis',
        specialtyCode: 'RADI-01',
        colorCode: '#3498db',
        iconCode: 'xray',
        sortOrder: 2,
        isActive: true,
        isFeatured: true,
        metaTitle: 'Équipements de Radiologie',
        metaDescription: 'Solutions d\'imagerie médicale avancée pour tous types de diagnostics'
      },
      {
        id: 'surgery-disc',
        name: 'Chirurgie',
        slug: 'surgery',
        description: 'Instruments chirurgicaux précis pour interventions optimales',
        specialtyCode: 'SURG-01',
        colorCode: '#2ecc71',
        iconCode: 'scalpel',
        sortOrder: 3,
        isActive: true,
        isFeatured: true,
        metaTitle: 'Instruments de Chirurgie',
        metaDescription: 'Instruments chirurgicaux de qualité supérieure pour toutes spécialités'
      },
      {
        id: 'laboratory-disc',
        name: 'Laboratoire',
        slug: 'laboratory',
        description: 'Analyses et diagnostics avancés avec précision garantie',
        specialtyCode: 'LAB-01',
        colorCode: '#f39c12',
        iconCode: 'microscope',
        sortOrder: 4,
        isActive: true,
        isFeatured: true,
        metaTitle: 'Équipements de Laboratoire',
        metaDescription: 'Solutions complètes pour analyses médicales et diagnostics de laboratoire'
      },
      {
        id: 'emergency-disc',
        name: 'Urgences',
        slug: 'emergency',
        description: 'Solutions d\'urgence et réanimation pour soins critiques',
        specialtyCode: 'EMER-01',
        colorCode: '#e67e22',
        iconCode: 'ambulance',
        sortOrder: 5,
        isActive: true,
        isFeatured: true,
        metaTitle: 'Équipements d\'Urgence',
        metaDescription: 'Matériel d\'urgence et de réanimation pour interventions vitales'
      },
      {
        id: 'icu-disc',
        name: 'Soins Intensifs',
        slug: 'icu',
        description: 'Technologies de soins critiques pour patients en état grave',
        specialtyCode: 'ICU-01',
        colorCode: '#9b59b6',
        iconCode: 'monitor',
        sortOrder: 6,
        isActive: true,
        isFeatured: true,
        metaTitle: 'Équipements de Soins Intensifs',
        metaDescription: 'Technologies avancées pour unités de soins intensifs'
      },
      {
        id: 'ophthalmology-disc',
        name: 'Ophtalmologie',
        slug: 'ophthalmology',
        description: 'Équipements de diagnostic et chirurgie oculaire',
        specialtyCode: 'OPHT-01',
        colorCode: '#1abc9c',
        iconCode: 'eye',
        sortOrder: 7,
        isActive: true,
        isFeatured: false,
        metaTitle: 'Équipements d\'Ophtalmologie',
        metaDescription: 'Solutions complètes pour diagnostic et chirurgie oculaire'
      },
      {
        id: 'orthopedics-disc',
        name: 'Orthopédie',
        slug: 'orthopedics',
        description: 'Équipements orthopédiques et prothèses',
        specialtyCode: 'ORTH-01',
        colorCode: '#34495e',
        iconCode: 'bone',
        sortOrder: 8,
        isActive: true,
        isFeatured: false,
        metaTitle: 'Équipements d\'Orthopédie',
        metaDescription: 'Matériel orthopédique et solutions prothétiques avancées'
      },
      {
        id: 'neurology-disc',
        name: 'Neurologie',
        slug: 'neurology',
        description: 'Équipements neurologiques et neurochirurgie',
        specialtyCode: 'NEUR-01',
        colorCode: '#8e44ad',
        iconCode: 'brain',
        sortOrder: 9,
        isActive: true,
        isFeatured: false,
        metaTitle: 'Équipements de Neurologie',
        metaDescription: 'Technologies avancées pour neurologie et neurochirurgie'
      },
      {
        id: 'anesthesia-disc',
        name: 'Anesthésie',
        slug: 'anesthesia',
        description: 'Équipements d\'anesthésie et monitoring',
        specialtyCode: 'ANES-01',
        colorCode: '#95a5a6',
        iconCode: 'mask',
        sortOrder: 10,
        isActive: true,
        isFeatured: false,
        metaTitle: 'Équipements d\'Anesthésie',
        metaDescription: 'Solutions complètes pour anesthésie et surveillance peropératoire'
      }
    ];

    // Create disciplines
    for (const discipline of disciplines) {
      await prisma.discipline.upsert({
        where: { id: discipline.id },
        update: discipline,
        create: discipline,
      });
      console.log(`✅ Discipline "${discipline.name}" created`);
    }

    // Step 2: Create Discipline Translations
    const disciplineTranslations = [
      // French translations
      { disciplineId: 'cardiology-disc', languageCode: 'fr', name: 'Cardiologie', description: 'Équipements cardiovasculaires de pointe pour le diagnostic et traitement des maladies cardiaques', metaTitle: 'Équipements de Cardiologie', metaDescription: 'Découvrez notre gamme complète d\'équipements cardiovasculaires de haute technologie' },
      { disciplineId: 'radiology-disc', languageCode: 'fr', name: 'Radiologie', description: 'Imagerie médicale haute définition pour diagnostics précis', metaTitle: 'Équipements de Radiologie', metaDescription: 'Solutions d\'imagerie médicale avancée pour tous types de diagnostics' },
      { disciplineId: 'surgery-disc', languageCode: 'fr', name: 'Chirurgie', description: 'Instruments chirurgicaux précis pour interventions optimales', metaTitle: 'Instruments de Chirurgie', metaDescription: 'Instruments chirurgicaux de qualité supérieure pour toutes spécialités' },
      { disciplineId: 'laboratory-disc', languageCode: 'fr', name: 'Laboratoire', description: 'Analyses et diagnostics avancés avec précision garantie', metaTitle: 'Équipements de Laboratoire', metaDescription: 'Solutions complètes pour analyses médicales et diagnostics de laboratoire' },
      { disciplineId: 'emergency-disc', languageCode: 'fr', name: 'Urgences', description: 'Solutions d\'urgence et réanimation pour soins critiques', metaTitle: 'Équipements d\'Urgence', metaDescription: 'Matériel d\'urgence et de réanimation pour interventions vitales' },
      { disciplineId: 'icu-disc', languageCode: 'fr', name: 'Soins Intensifs', description: 'Technologies de soins critiques pour patients en état grave', metaTitle: 'Équipements de Soins Intensifs', metaDescription: 'Technologies avancées pour unités de soins intensifs' },

      // English translations
      { disciplineId: 'cardiology-disc', languageCode: 'en', name: 'Cardiology', description: 'Advanced cardiovascular equipment for heart disease diagnosis and treatment', metaTitle: 'Cardiology Equipment', metaDescription: 'Discover our complete range of high-tech cardiovascular equipment' },
      { disciplineId: 'radiology-disc', languageCode: 'en', name: 'Radiology', description: 'High-definition medical imaging for precise diagnostics', metaTitle: 'Radiology Equipment', metaDescription: 'Advanced medical imaging solutions for all types of diagnostics' },
      { disciplineId: 'surgery-disc', languageCode: 'en', name: 'Surgery', description: 'Precise surgical instruments for optimal interventions', metaTitle: 'Surgical Instruments', metaDescription: 'Superior quality surgical instruments for all specialties' },
      { disciplineId: 'laboratory-disc', languageCode: 'en', name: 'Laboratory', description: 'Advanced analysis and diagnostics with guaranteed precision', metaTitle: 'Laboratory Equipment', metaDescription: 'Complete solutions for medical analysis and laboratory diagnostics' },
      { disciplineId: 'emergency-disc', languageCode: 'en', name: 'Emergency', description: 'Emergency and resuscitation solutions for critical care', metaTitle: 'Emergency Equipment', metaDescription: 'Emergency and resuscitation equipment for life-saving interventions' },
      { disciplineId: 'icu-disc', languageCode: 'en', name: 'Intensive Care', description: 'Critical care technologies for critically ill patients', metaTitle: 'ICU Equipment', metaDescription: 'Advanced technologies for intensive care units' }
    ];

    for (const translation of disciplineTranslations) {
      await prisma.disciplineTranslation.upsert({
        where: {
          disciplineId_languageCode: {
            disciplineId: translation.disciplineId,
            languageCode: translation.languageCode
          }
        },
        update: translation,
        create: translation,
      });
    }
    console.log('✅ Discipline translations created');

    // Step 3: Create Equipment Categories
    const categories = [
      // Cardiology categories
      {
        id: 'card-monitors',
        name: 'Moniteurs Cardiaques',
        slug: 'cardiac-monitors',
        description: 'Moniteurs de surveillance cardiaque et ECG',
        disciplineId: 'cardiology-disc',
        level: 2,
        sortOrder: 1,
        isActive: true,
        safetyClass: 'Class II'
      },
      {
        id: 'card-defib',
        name: 'Défibrillateurs',
        slug: 'defibrillators',
        description: 'Défibrillateurs automatiques et semi-automatiques',
        disciplineId: 'cardiology-disc',
        level: 2,
        sortOrder: 2,
        isActive: true,
        safetyClass: 'Class III'
      },
      {
        id: 'card-echo',
        name: 'Échographes Cardiaques',
        slug: 'cardiac-ultrasound',
        description: 'Échographes spécialisés en cardiologie',
        disciplineId: 'cardiology-disc',
        level: 2,
        sortOrder: 3,
        isActive: true,
        safetyClass: 'Class II'
      },

      // Radiology categories
      {
        id: 'rad-xray',
        name: 'Radiologie Conventionnelle',
        slug: 'conventional-xray',
        description: 'Appareils de radiologie standard',
        disciplineId: 'radiology-disc',
        level: 2,
        sortOrder: 1,
        isActive: true,
        safetyClass: 'Class II'
      },
      {
        id: 'rad-ct',
        name: 'Scanner CT',
        slug: 'ct-scanners',
        description: 'Tomodensitomètres et scanners CT',
        disciplineId: 'radiology-disc',
        level: 2,
        sortOrder: 2,
        isActive: true,
        safetyClass: 'Class II'
      },
      {
        id: 'rad-mri',
        name: 'IRM',
        slug: 'mri-systems',
        description: 'Systèmes d\'imagerie par résonance magnétique',
        disciplineId: 'radiology-disc',
        level: 2,
        sortOrder: 3,
        isActive: true,
        safetyClass: 'Class II'
      },

      // Surgery categories
      {
        id: 'surg-instruments',
        name: 'Instruments Chirurgicaux',
        slug: 'surgical-instruments',
        description: 'Instruments de base pour chirurgie générale',
        disciplineId: 'surgery-disc',
        level: 2,
        sortOrder: 1,
        isActive: true,
        safetyClass: 'Class I'
      },
      {
        id: 'surg-laser',
        name: 'Chirurgie Laser',
        slug: 'laser-surgery',
        description: 'Équipements de chirurgie laser',
        disciplineId: 'surgery-disc',
        level: 2,
        sortOrder: 2,
        isActive: true,
        safetyClass: 'Class III'
      },
      {
        id: 'surg-endo',
        name: 'Endoscopie',
        slug: 'endoscopy',
        description: 'Équipements d\'endoscopie et laparoscopie',
        disciplineId: 'surgery-disc',
        level: 2,
        sortOrder: 3,
        isActive: true,
        safetyClass: 'Class II'
      },

      // Laboratory categories
      {
        id: 'lab-analyzers',
        name: 'Analyseurs',
        slug: 'laboratory-analyzers',
        description: 'Analyseurs automatisés de laboratoire',
        disciplineId: 'laboratory-disc',
        level: 2,
        sortOrder: 1,
        isActive: true,
        safetyClass: 'Class I'
      },
      {
        id: 'lab-micro',
        name: 'Microbiologie',
        slug: 'microbiology',
        description: 'Équipements de microbiologie',
        disciplineId: 'laboratory-disc',
        level: 2,
        sortOrder: 2,
        isActive: true,
        safetyClass: 'Class I'
      },
      {
        id: 'lab-hema',
        name: 'Hématologie',
        slug: 'hematology',
        description: 'Équipements d\'analyse sanguine',
        disciplineId: 'laboratory-disc',
        level: 2,
        sortOrder: 3,
        isActive: true,
        safetyClass: 'Class I'
      }
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: category,
        create: category,
      });
      console.log(`✅ Category "${category.name}" created`);
    }

    // Step 4: Create Category Translations
    const categoryTranslations = [
      // French translations
      { categoryId: 'card-monitors', languageCode: 'fr', name: 'Moniteurs Cardiaques', description: 'Surveillance continue des paramètres cardiaques' },
      { categoryId: 'card-defib', languageCode: 'fr', name: 'Défibrillateurs', description: 'Équipements de défibrillation d\'urgence' },
      { categoryId: 'card-echo', languageCode: 'fr', name: 'Échographes Cardiaques', description: 'Imagerie échographique cardiaque avancée' },
      { categoryId: 'rad-xray', languageCode: 'fr', name: 'Radiologie Conventionnelle', description: 'Systèmes de radiographie standard' },
      { categoryId: 'rad-ct', languageCode: 'fr', name: 'Scanner CT', description: 'Imagerie tomodensitométrique haute résolution' },
      { categoryId: 'rad-mri', languageCode: 'fr', name: 'IRM', description: 'Imagerie par résonance magnétique' },

      // English translations
      { categoryId: 'card-monitors', languageCode: 'en', name: 'Cardiac Monitors', description: 'Continuous monitoring of cardiac parameters' },
      { categoryId: 'card-defib', languageCode: 'en', name: 'Defibrillators', description: 'Emergency defibrillation equipment' },
      { categoryId: 'card-echo', languageCode: 'en', name: 'Cardiac Ultrasound', description: 'Advanced cardiac ultrasound imaging' },
      { categoryId: 'rad-xray', languageCode: 'en', name: 'Conventional X-Ray', description: 'Standard radiography systems' },
      { categoryId: 'rad-ct', languageCode: 'en', name: 'CT Scanners', description: 'High-resolution computed tomography' },
      { categoryId: 'rad-mri', languageCode: 'en', name: 'MRI Systems', description: 'Magnetic resonance imaging' }
    ];

    for (const translation of categoryTranslations) {
      await prisma.categoryTranslation.upsert({
        where: {
          categoryId_languageCode: {
            categoryId: translation.categoryId,
            languageCode: translation.languageCode
          }
        },
        update: translation,
        create: translation,
      });
    }
    console.log('✅ Category translations created');

    console.log('🎉 New structure seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding new structure:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  seedNewStructure()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedNewStructure };