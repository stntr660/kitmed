const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSampleProducts() {
  console.log('🌱 Seeding sample products...');
  
  const sampleProducts = [
    {
      id: 'product-1',
      referenceFournisseur: 'REF001',
      constructeur: 'Medtronic',
      categoryId: 'cardiology',
      slug: 'moniteur-cardiaque-pro',
      pdfBrochureUrl: null,
      status: 'active',
      isFeatured: true,
      translations: {
        create: [
          {
            languageCode: 'fr',
            nom: 'Moniteur Cardiaque Pro X1',
            description: 'Moniteur cardiaque avancé avec écran haute résolution, surveillance continue et alertes intelligentes pour un diagnostic précis.',
            ficheTechnique: 'Écran 15 pouces • Résolution 1920x1080 • Connectivité Wi-Fi • Batterie 12h • Certification CE/FDA'
          },
          {
            languageCode: 'en',
            nom: 'Cardiac Monitor Pro X1',
            description: 'Advanced cardiac monitor with high-resolution display, continuous monitoring and smart alerts for precise diagnosis.',
            ficheTechnique: '15-inch display • 1920x1080 resolution • Wi-Fi connectivity • 12h battery • CE/FDA certification'
          }
        ]
      }
    },
    {
      id: 'product-2',
      referenceFournisseur: 'REF002',
      constructeur: 'Philips',
      categoryId: 'radiology',
      slug: 'scanner-irm-ultra',
      pdfBrochureUrl: null,
      status: 'active',
      isFeatured: false,
      translations: {
        create: [
          {
            languageCode: 'fr',
            nom: 'Scanner IRM Ultra 3T',
            description: 'Scanner IRM haute performance pour imagerie médicale précise avec technologie de pointe.',
            ficheTechnique: 'Puissance 3T • Résolution submillimétrique • Acquisition rapide • Contraste avancé'
          },
          {
            languageCode: 'en',
            nom: 'Ultra MRI Scanner 3T',
            description: 'High-performance MRI scanner for precise medical imaging with cutting-edge technology.',
            ficheTechnique: '3T power • Submillimeter resolution • Rapid acquisition • Advanced contrast'
          }
        ]
      }
    },
    {
      id: 'product-3',
      referenceFournisseur: 'REF003',
      constructeur: 'GE Healthcare',
      categoryId: 'surgery',
      slug: 'table-chirurgicale-elite',
      pdfBrochureUrl: null,
      status: 'active',
      isFeatured: true,
      translations: {
        create: [
          {
            languageCode: 'fr',
            nom: 'Table Chirurgicale Elite',
            description: 'Table chirurgicale robotisée pour interventions de précision avec contrôle numérique avancé.',
            ficheTechnique: 'Positionnement automatique • Contrôle numérique • Stérilisation UV • Charge 300kg'
          },
          {
            languageCode: 'en',
            nom: 'Elite Surgical Table',
            description: 'Robotic surgical table for precision interventions with advanced digital control.',
            ficheTechnique: 'Automatic positioning • Digital control • UV sterilization • 300kg load capacity'
          }
        ]
      }
    },
    {
      id: 'product-4',
      referenceFournisseur: 'REF004',
      constructeur: 'Siemens',
      categoryId: 'laboratory',
      slug: 'analyseur-sanguin-auto',
      pdfBrochureUrl: null,
      status: 'active',
      isFeatured: false,
      translations: {
        create: [
          {
            languageCode: 'fr',
            nom: 'Analyseur Sanguin Automatisé',
            description: 'Analyseur sanguin entièrement automatisé pour laboratoires avec haute précision.',
            ficheTechnique: 'Capacité 500 tests/h • Précision 99.8% • Interface numérique • Maintenance automatique'
          },
          {
            languageCode: 'en',
            nom: 'Automated Blood Analyzer',
            description: 'Fully automated blood analyzer for laboratories with high precision results.',
            ficheTechnique: '500 tests/h capacity • 99.8% precision • Digital interface • Automatic maintenance'
          }
        ]
      }
    }
  ];

  for (const productData of sampleProducts) {
    try {
      const product = await prisma.product.upsert({
        where: { id: productData.id },
        update: {
          referenceFournisseur: productData.referenceFournisseur,
          constructeur: productData.constructeur,
          categoryId: productData.categoryId,
          slug: productData.slug,
          status: productData.status,
          isFeatured: productData.isFeatured,
        },
        create: {
          id: productData.id,
          referenceFournisseur: productData.referenceFournisseur,
          constructeur: productData.constructeur,
          categoryId: productData.categoryId,
          slug: productData.slug,
          pdfBrochureUrl: productData.pdfBrochureUrl,
          status: productData.status,
          isFeatured: productData.isFeatured,
          translations: productData.translations
        },
        include: {
          translations: true,
        },
      });

      console.log(`✅ Product "${productData.translations.create[0].nom}" seeded`);

      // Add sample media for each product
      const sampleImages = [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop'
      ];

      for (let i = 0; i < sampleImages.length; i++) {
        try {
          await prisma.media.upsert({
            where: {
              url: sampleImages[i]
            },
            update: {},
            create: {
              productId: product.id,
              type: 'image',
              url: sampleImages[i],
              sortOrder: i,
              isPrimary: i === 0,
              altText: `${productData.translations.create[0].nom} - Image ${i + 1}`,
              title: productData.translations.create[0].nom,
            }
          });
        } catch (mediaError) {
          // Skip if media already exists
        }
      }

    } catch (error) {
      console.error(`❌ Error seeding product "${productData.translations.create[0].nom}":`, error);
    }
  }
  
  console.log('✅ Sample products seeded successfully!');
}

seedSampleProducts()
  .catch((e) => {
    console.error('❌ Error seeding products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });