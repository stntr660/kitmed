const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .trim();
}

async function seedManufacturers() {
  try {
    console.log('Starting manufacturer seeding...');

    // Read the manufacturer data
    const manufacturersData = JSON.parse(fs.readFileSync('./manufacturers-database.json', 'utf-8'));
    
    console.log(`Found ${manufacturersData.length} manufacturers to seed`);

    let successCount = 0;
    let errorCount = 0;

    for (const manufacturer of manufacturersData) {
      try {
        const slug = await generateSlug(manufacturer.name);
        
        // Check if partner already exists
        const existingPartner = await prisma.partner.findUnique({
          where: { slug }
        });

        if (existingPartner) {
          console.log(`Partner ${manufacturer.name} already exists, skipping...`);
          continue;
        }

        // Create the partner
        const partner = await prisma.partner.create({
          data: {
            name: manufacturer.name,
            slug,
            description: manufacturer.descriptions.en,
            websiteUrl: manufacturer.website,
            logoUrl: manufacturer.logoUrl,
            isFeatured: ['HAAG-STREIT', 'JOHNSON & JOHNSON VISION', 'NIDEK', 'KEELER', 'MORIA'].includes(manufacturer.name),
            sortOrder: 0,
            status: 'active'
          }
        });

        console.log(`Created partner: ${partner.name} (${partner.id})`);

        // Create translations for English and French
        await prisma.partnerTranslation.createMany({
          data: [
            {
              partnerId: partner.id,
              languageCode: 'en',
              name: manufacturer.name,
              description: manufacturer.descriptions.en
            },
            {
              partnerId: partner.id,
              languageCode: 'fr',
              name: manufacturer.name,
              description: manufacturer.descriptions.fr
            }
          ]
        });

        console.log(`Created translations for ${manufacturer.name}`);
        successCount++;

      } catch (error) {
        console.error(`Error creating partner ${manufacturer.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== SEEDING SUMMARY ===');
    console.log(`Successfully created: ${successCount} partners`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log(`Total processed: ${successCount + errorCount}`);

    // Get final count of partners
    const totalPartners = await prisma.partner.count();
    console.log(`Total partners in database: ${totalPartners}`);

  } catch (error) {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Additional function to add missing manufacturers from CSV
async function addMissingManufacturers() {
  try {
    console.log('\n=== ADDING MISSING MANUFACTURERS ===');
    
    const missingManufacturers = [
      {
        name: 'ERYIGIT',
        descriptions: {
          en: 'Turkish medical device company specializing in ophthalmic equipment and surgical instruments for eye care professionals.',
          fr: 'Entreprise turque de dispositifs médicaux spécialisée dans les équipements ophtalmiques et les instruments chirurgicaux pour les professionnels des soins oculaires.'
        },
        website: 'https://www.eryigit.com/',
        logoUrl: 'https://via.placeholder.com/300x120/1E40AF/FFFFFF?text=ERYIGIT',
        category: 'Medical Equipment',
        country: 'Turkey'
      },
      {
        name: 'FE-GROUP',
        descriptions: {
          en: 'International medical technology group providing innovative solutions for ophthalmic and surgical applications.',
          fr: 'Groupe international de technologie médicale fournissant des solutions innovantes pour les applications ophtalmiques et chirurgicales.'
        },
        website: 'https://fegroup.com/',
        logoUrl: 'https://via.placeholder.com/300x120/059669/FFFFFF?text=FE-GROUP',
        category: 'Medical Technology',
        country: 'International'
      },
      {
        name: 'LA RETINE',
        descriptions: {
          en: 'Specialized manufacturer focusing on retinal care solutions and advanced ophthalmic technologies for vision preservation.',
          fr: 'Fabricant spécialisé axé sur les solutions de soins rétiniens et les technologies ophtalmiques avancées pour la préservation de la vision.'
        },
        website: 'https://laretine.com/',
        logoUrl: 'https://via.placeholder.com/300x120/7C3AED/FFFFFF?text=LA+RETINE',
        category: 'Retinal Care',
        country: 'France'
      },
      {
        name: 'LUMED',
        descriptions: {
          en: 'Medical device manufacturer providing LED-based lighting solutions and equipment for surgical and diagnostic applications.',
          fr: 'Fabricant de dispositifs médicaux fournissant des solutions d\'éclairage à base de LED et des équipements pour les applications chirurgicales et de diagnostic.'
        },
        website: 'https://lumed.com/',
        logoUrl: 'https://via.placeholder.com/300x120/DC2626/FFFFFF?text=LUMED',
        category: 'Medical Lighting',
        country: 'International'
      },
      {
        name: 'NOVAMEDTEK',
        descriptions: {
          en: 'Innovative medical technology company developing cutting-edge solutions for modern healthcare and surgical applications.',
          fr: 'Entreprise de technologie médicale innovante développant des solutions de pointe pour les soins de santé modernes et les applications chirurgicales.'
        },
        website: 'https://novamedtek.com/',
        logoUrl: 'https://via.placeholder.com/300x120/059669/FFFFFF?text=NOVAMEDTEK',
        category: 'Medical Technology',
        country: 'International'
      },
      {
        name: 'PUKANG MEDICAL',
        descriptions: {
          en: 'Chinese medical equipment manufacturer specializing in ophthalmic devices and innovative eye care solutions.',
          fr: 'Fabricant chinois d\'équipements médicaux spécialisé dans les appareils ophtalmiques et les solutions innovantes de soins oculaires.'
        },
        website: 'https://www.pukangmedical.com/',
        logoUrl: 'https://via.placeholder.com/300x120/DC2626/FFFFFF?text=PUKANG',
        category: 'Ophthalmic Equipment',
        country: 'China'
      },
      {
        name: 'RAY VISION',
        descriptions: {
          en: 'Advanced vision technology company providing innovative optical solutions and diagnostic equipment for eye care professionals.',
          fr: 'Entreprise de technologie de vision avancée fournissant des solutions optiques innovantes et des équipements de diagnostic pour les professionnels des soins oculaires.'
        },
        website: 'https://www.rayvision.com/',
        logoUrl: 'https://via.placeholder.com/300x120/1E40AF/FFFFFF?text=RAY+VISION',
        category: 'Vision Technology',
        country: 'International'
      },
      {
        name: 'REGENSIGHT',
        descriptions: {
          en: 'Biotechnology company focused on regenerative medicine and innovative treatments for vision restoration and eye health.',
          fr: 'Entreprise de biotechnologie axée sur la médecine régénérative et les traitements innovants pour la restauration de la vision et la santé oculaire.'
        },
        website: 'https://regensight.com/',
        logoUrl: 'https://via.placeholder.com/300x120/7C3AED/FFFFFF?text=REGENSIGHT',
        category: 'Biotechnology',
        country: 'France'
      },
      {
        name: 'RHEON MEDICAL',
        descriptions: {
          en: 'Medical device company developing innovative solutions for ophthalmic surgery and advanced eye care technologies.',
          fr: 'Entreprise de dispositifs médicaux développant des solutions innovantes pour la chirurgie ophtalmique et les technologies avancées de soins oculaires.'
        },
        website: 'https://www.rheon.com/',
        logoUrl: 'https://via.placeholder.com/300x120/059669/FFFFFF?text=RHEON',
        category: 'Medical Devices',
        country: 'International'
      },
      {
        name: 'SIEM BIOMEDICAL',
        descriptions: {
          en: 'German biomedical company specializing in advanced medical technologies and innovative solutions for healthcare applications.',
          fr: 'Entreprise biomédicale allemande spécialisée dans les technologies médicales avancées et les solutions innovantes pour les applications de soins de santé.'
        },
        website: 'https://www.siem.de/',
        logoUrl: 'https://via.placeholder.com/300x120/DC2626/FFFFFF?text=SIEM',
        category: 'Biomedical Technology',
        country: 'Germany'
      },
      {
        name: 'STARTIP',
        descriptions: {
          en: 'French technology company providing innovative solutions and equipment for medical and ophthalmic applications.',
          fr: 'Entreprise technologique française fournissant des solutions et équipements innovants pour les applications médicales et ophtalmiques.'
        },
        website: 'https://startip.fr/',
        logoUrl: 'https://via.placeholder.com/300x120/1E40AF/FFFFFF?text=STARTIP',
        category: 'Medical Technology',
        country: 'France'
      },
      {
        name: 'STURDY MEDICAL',
        descriptions: {
          en: 'Medical equipment manufacturer providing durable and reliable solutions for surgical and diagnostic applications.',
          fr: 'Fabricant d\'équipements médicaux fournissant des solutions durables et fiables pour les applications chirurgicales et de diagnostic.'
        },
        website: 'https://sturdymedical.com/',
        logoUrl: 'https://via.placeholder.com/300x120/059669/FFFFFF?text=STURDY',
        category: 'Medical Equipment',
        country: 'USA'
      },
      {
        name: 'UFSK INTERNATIONAL',
        descriptions: {
          en: 'International medical technology company specializing in ophthalmic equipment and innovative eye care solutions.',
          fr: 'Entreprise internationale de technologie médicale spécialisée dans les équipements ophtalmiques et les solutions innovantes de soins oculaires.'
        },
        website: 'https://www.ufsk.com/',
        logoUrl: 'https://via.placeholder.com/300x120/7C3AED/FFFFFF?text=UFSK',
        category: 'Ophthalmic Equipment',
        country: 'International'
      }
    ];

    let addedCount = 0;
    for (const manufacturer of missingManufacturers) {
      try {
        const slug = await generateSlug(manufacturer.name);
        
        // Check if partner already exists
        const existingPartner = await prisma.partner.findUnique({
          where: { slug }
        });

        if (existingPartner) {
          console.log(`Partner ${manufacturer.name} already exists, skipping...`);
          continue;
        }

        // Create the partner
        const partner = await prisma.partner.create({
          data: {
            name: manufacturer.name,
            slug,
            description: manufacturer.descriptions.en,
            websiteUrl: manufacturer.website,
            logoUrl: manufacturer.logoUrl,
            isFeatured: false,
            sortOrder: 100 + addedCount,
            status: 'active'
          }
        });

        // Create translations
        await prisma.partnerTranslation.createMany({
          data: [
            {
              partnerId: partner.id,
              languageCode: 'en',
              name: manufacturer.name,
              description: manufacturer.descriptions.en
            },
            {
              partnerId: partner.id,
              languageCode: 'fr',
              name: manufacturer.name,
              description: manufacturer.descriptions.fr
            }
          ]
        });

        console.log(`✅ Added ${manufacturer.name}`);
        addedCount++;

      } catch (error) {
        console.error(`❌ Error adding ${manufacturer.name}:`, error.message);
      }
    }

    console.log(`\nAdded ${addedCount} additional manufacturers`);

  } catch (error) {
    console.error('Error adding missing manufacturers:', error);
  }
}

async function main() {
  console.log('🚀 Starting manufacturer database seeding...\n');
  
  await seedManufacturers();
  await addMissingManufacturers();
  
  console.log('\n✅ Manufacturer seeding completed!');
  console.log('\nRun the following to view your partners:');
  console.log('npm run dev');
  console.log('Then visit: http://localhost:3001/fr/admin/partners');
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});