const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPartnerTranslations() {
  try {
    // Define proper translations
    const translations = [
      {
        slug: 'unique-technologie',
        fr: {
          name: 'UNIQUE TECHNOLOGIE',
          description: 'Entreprise de technologie médicale fournissant des solutions d\'équipements de soins de santé innovants.'
        },
        en: {
          name: 'UNIQUE TECHNOLOGIE',
          description: 'Medical technology company providing innovative healthcare equipment solutions.'
        }
      },
      {
        slug: 'ufsk',
        fr: {
          name: 'UFSK',
          description: 'Fabricant allemand de mobilier médical et d\'équipements pour les établissements de soins de santé.'
        },
        en: {
          name: 'UFSK',
          description: 'German manufacturer of medical furniture and equipment for healthcare facilities.'
        }
      },
      {
        slug: 'this-ag-sophi',
        fr: {
          name: 'THIS AG (SOPHI)',
          description: 'Entreprise suisse de technologie médicale fournissant des équipements et des solutions de soins de santé.'
        },
        en: {
          name: 'THIS AG (SOPHI)',
          description: 'Swiss medical technology company providing healthcare equipment and solutions.'
        }
      },
      {
        slug: 'surgicon-ag',
        fr: {
          name: 'SURGICON AG',
          description: 'Fabricant suisse d\'équipements médicaux spécialisé dans les instruments et dispositifs chirurgicaux.'
        },
        en: {
          name: 'SURGICON AG',
          description: 'Swiss medical equipment manufacturer specializing in surgical instruments and devices.'
        }
      },
      {
        slug: 'sturdy',
        fr: {
          name: 'STURDY',
          description: 'Fabricant d\'équipements médicaux fournissant des produits de santé durables.'
        },
        en: {
          name: 'STURDY',
          description: 'Medical equipment manufacturer providing durable healthcare products.'
        }
      },
      {
        slug: 'startip',
        fr: {
          name: 'STARTIP',
          description: 'Fabricant d\'équipements médicaux proposant des solutions de santé innovantes.'
        },
        en: {
          name: 'STARTIP',
          description: 'Medical equipment manufacturer providing innovative healthcare solutions.'
        }
      },
      {
        slug: 'siem-biomedical',
        fr: {
          name: 'SIEM BIOMEDICAL',
          description: 'Fournisseur d\'équipements biomédicaux et pharmaceutiques pour les applications de soins de santé.'
        },
        en: {
          name: 'SIEM BIOMEDICAL',
          description: 'Biomedical and pharmaceutical equipment supplier for healthcare applications.'
        }
      },
      {
        slug: 'rheon',
        fr: {
          name: 'RHEON',
          description: 'Fabricant d\'équipements médicaux proposant des solutions technologiques de soins de santé.'
        },
        en: {
          name: 'RHEON',
          description: 'Medical equipment manufacturer providing healthcare technology solutions.'
        }
      },
      {
        slug: 'ray-vision',
        fr: {
          name: 'RAY VISION',
          description: 'Fabricant d\'équipements ophtalmiques spécialisé dans les solutions de soins de la vision.'
        },
        en: {
          name: 'RAY VISION',
          description: 'Ophthalmic equipment manufacturer specializing in vision care solutions.'
        }
      },
      {
        slug: 'prim',
        fr: {
          name: 'PRIM',
          description: 'Fabricant espagnol d\'équipements orthopédiques et médicaux pour les établissements de soins de santé.'
        },
        en: {
          name: 'PRIM',
          description: 'Spanish manufacturer of orthopedic and medical equipment for healthcare facilities.'
        }
      },
      {
        slug: 'omni',
        fr: {
          name: 'OMNI',
          description: 'Fabricant et fournisseur d\'équipements médicaux pour le secteur de la santé.'
        },
        en: {
          name: 'OMNI',
          description: 'Medical equipment manufacturer and supplier for healthcare sector.'
        }
      },
      {
        slug: 'novamedtek',
        fr: {
          name: 'NOVAMEDTEK',
          description: 'Fournisseur de technologies pharmaceutiques et médicales pour les applications de soins de santé.'
        },
        en: {
          name: 'NOVAMEDTEK',
          description: 'Pharmaceutical and medical technology provider for healthcare applications.'
        }
      },
      {
        slug: 'nitrocare',
        fr: {
          name: 'NITROCARE',
          description: 'Fabricant d\'équipements médicaux spécialisé dans les solutions technologiques de soins de santé.'
        },
        en: {
          name: 'NITROCARE',
          description: 'Medical equipment manufacturer specializing in healthcare technology solutions.'
        }
      },
      {
        slug: 'mediworks',
        fr: {
          name: 'MEDIWORKS',
          description: 'Fournisseur d\'équipements médicaux et pharmaceutiques pour les professionnels de la santé.'
        },
        en: {
          name: 'MEDIWORKS',
          description: 'Medical and pharmaceutical equipment supplier for healthcare professionals.'
        }
      },
      {
        slug: 'medicel',
        fr: {
          name: 'MEDICEL',
          description: 'Fournisseur de produits pharmaceutiques et d\'équipements médicaux pour le secteur de la santé.'
        },
        en: {
          name: 'MEDICEL',
          description: 'Pharmaceutical products and medical equipment provider for healthcare sector.'
        }
      },
      {
        slug: 'lumed',
        fr: {
          name: 'LUMED',
          description: 'Fournisseur d\'équipements pharmaceutiques et médicaux pour les applications de soins de santé.'
        },
        en: {
          name: 'LUMED',
          description: 'Pharmaceutical and medical equipment supplier for healthcare applications.'
        }
      },
      {
        slug: 'led',
        fr: {
          name: 'LED',
          description: 'Fournisseur d\'éclairage médical LED et d\'équipements de diagnostic.'
        },
        en: {
          name: 'LED',
          description: 'Provider of LED-based medical lighting and diagnostic equipment.'
        }
      },
      {
        slug: 'la-retine',
        fr: {
          name: 'LA RETINE',
          description: 'Spécialiste des instruments et équipements de chirurgie vitréorétinienne.'
        },
        en: {
          name: 'LA RETINE',
          description: 'Specialist in vitreoretinal surgery instruments and equipment.'
        }
      },
      {
        slug: 'l-instrumentation',
        fr: {
          name: 'L\'INSTRUMENTATION',
          description: 'Spécialiste de l\'instrumentation et des équipements chirurgicaux ophtalmiques.'
        },
        en: {
          name: 'L\'INSTRUMENTATION',
          description: 'Specialist in ophthalmic surgical instrumentation and equipment.'
        }
      },
      {
        slug: 'intermedic',
        fr: {
          name: 'INTERMEDIC',
          description: 'Distributeur d\'équipements pharmaceutiques et médicaux pour les établissements de soins de santé.'
        },
        en: {
          name: 'INTERMEDIC',
          description: 'Pharmaceutical and medical equipment distributor serving healthcare facilities.'
        }
      },
      {
        slug: 'inophta',
        fr: {
          name: 'INOPHTA',
          description: 'Fournisseur spécialisé de produits et instruments chirurgicaux ophtalmiques pour les professionnels des soins oculaires.'
        },
        en: {
          name: 'INOPHTA',
          description: 'Specialized provider of ophthalmic surgical products and instruments for eye care professionals.'
        }
      },
      {
        slug: 'foshan',
        fr: {
          name: 'FOSHAN',
          description: 'Fabricant chinois d\'équipements médicaux et dentaires pour les établissements de soins de santé.'
        },
        en: {
          name: 'FOSHAN',
          description: 'Chinese manufacturer of medical and dental equipment for healthcare facilities.'
        }
      },
      {
        slug: 'fe-group',
        fr: {
          name: 'FE-GROUP',
          description: 'Fabricant et distributeur d\'équipements médicaux pour le secteur de la santé.'
        },
        en: {
          name: 'FE-GROUP',
          description: 'Medical equipment manufacturer and distributor for healthcare sector.'
        }
      },
      {
        slug: 'espansione-marketing',
        fr: {
          name: 'ESPANSIONE MARKETING',
          description: 'Distributeur et promoteur italien de solutions ophtalmiques et d\'équipements médicaux.'
        },
        en: {
          name: 'ESPANSIONE MARKETING',
          description: 'Italian distributor and marketer of ophthalmic and medical equipment solutions.'
        }
      },
      {
        slug: 'eryigit',
        fr: {
          name: 'ERYIGIT',
          description: 'Fabricant turc d\'équipements et dispositifs médicaux pour les établissements de soins de santé.'
        },
        en: {
          name: 'ERYIGIT',
          description: 'Turkish manufacturer of medical equipment and devices for healthcare facilities.'
        }
      },
      {
        slug: 'coswel',
        fr: {
          name: 'COSWEL',
          description: 'Fabricant d\'équipements médicaux au service des professionnels de la santé.'
        },
        en: {
          name: 'COSWEL',
          description: 'Medical equipment manufacturer serving healthcare professionals.'
        }
      },
      {
        slug: 'ceracarta',
        fr: {
          name: 'CERACARTA',
          description: 'Fournisseur d\'équipements médicaux et de produits de soins de santé.'
        },
        en: {
          name: 'CERACARTA',
          description: 'Provider of medical equipment and healthcare products.'
        }
      },
      {
        slug: 'aktive',
        fr: {
          name: 'AKTIVE',
          description: 'Fabricant d\'équipements et dispositifs médicaux pour les applications de soins de santé.'
        },
        en: {
          name: 'AKTIVE',
          description: 'Manufacturer of medical equipment and devices for healthcare applications.'
        }
      },
      {
        slug: 'pukang',
        fr: {
          name: 'PUKANG',
          description: 'Fabricant d\'équipements médicaux proposant des solutions de santé.'
        },
        en: {
          name: 'PUKANG',
          description: 'Medical equipment manufacturer providing healthcare solutions.'
        }
      },
      {
        slug: 'foshan-kaiyang',
        fr: {
          name: 'Foshan Kaiyang',
          description: 'Fabricant d\'équipements médicaux.'
        },
        en: {
          name: 'Foshan Kaiyang',
          description: 'Medical equipment manufacturer.'
        }
      },
      {
        slug: 'esensa',
        fr: {
          name: 'ESENSA',
          description: 'Fabricant d\'équipements médicaux proposant des solutions de santé.'
        },
        en: {
          name: 'ESENSA',
          description: 'Medical equipment manufacturer providing healthcare solutions.'
        }
      },
      {
        slug: 'regensight',
        fr: {
          name: 'REGENSIGHT',
          description: 'Fabricant d\'équipements médicaux spécialisé dans les solutions ophtalmiques et régénératives.'
        },
        en: {
          name: 'REGENSIGHT',
          description: 'Medical equipment manufacturer focused on ophthalmic and regenerative solutions.'
        }
      }
    ];

    for (const partnerData of translations) {
      // Find the partner
      const partner = await prisma.partners.findUnique({
        where: { slug: partnerData.slug }
      });

      if (!partner) {
        console.log(`Partner not found: ${partnerData.slug}`);
        continue;
      }

      // Update French translation
      await prisma.partner_translations.updateMany({
        where: {
          partner_id: partner.id,
          language_code: 'fr'
        },
        data: {
          name: partnerData.fr.name,
          description: partnerData.fr.description
        }
      });

      // Update English translation
      await prisma.partner_translations.updateMany({
        where: {
          partner_id: partner.id,
          language_code: 'en'
        },
        data: {
          name: partnerData.en.name,
          description: partnerData.en.description
        }
      });

      console.log(`✅ Updated translations for: ${partnerData.slug}`);
    }

    console.log('\n✅ All partner translations have been fixed!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error fixing translations:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixPartnerTranslations();