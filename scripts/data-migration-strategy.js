/**
 * Data Migration Strategy for Disciplines-Categories Separation
 * 
 * This script handles the safe migration of existing data from the unified
 * categories table to the new separated structure.
 */

const { PrismaClient } = require('@prisma/client');

class DataMigrationStrategy {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = console;
    this.dryRun = process.env.DRY_RUN === 'true';
    this.batchSize = parseInt(process.env.BATCH_SIZE || '100');
  }

  /**
   * Main migration execution
   */
  async execute() {
    try {
      this.log('🚀 Starting Data Migration Strategy');
      this.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
      this.log(`Batch Size: ${this.batchSize}`);

      // Step 1: Analyze current data
      await this.analyzeCurrentData();

      // Step 2: Validate migration prerequisites
      await this.validatePrerequisites();

      // Step 3: Execute migration phases
      if (!this.dryRun) {
        await this.executeMigrationPhases();
      } else {
        await this.simulateMigrationPhases();
      }

      // Step 4: Validate migration results
      await this.validateMigrationResults();

      this.log('✅ Data Migration Strategy completed successfully');

    } catch (error) {
      this.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Analyze current data structure
   */
  async analyzeCurrentData() {
    this.log('📊 Analyzing current data structure...');

    const analysis = {
      categories: {
        total: await this.prisma.category.count(),
        disciplines: await this.prisma.category.count({ where: { type: 'discipline' } }),
        equipment: await this.prisma.category.count({ where: { type: { in: ['equipment', null] } } }),
        withProducts: await this.prisma.category.count({
          where: {
            products: { some: {} }
          }
        })
      },
      products: {
        total: await this.prisma.product.count(),
        withDisciplineCategory: await this.prisma.product.count({
          where: {
            category: { type: 'discipline' }
          }
        }),
        withEquipmentCategory: await this.prisma.product.count({
          where: {
            category: { type: { in: ['equipment', null] } }
          }
        })
      },
      translations: {
        categoryTranslations: await this.prisma.categoryTranslation.count(),
        disciplineTranslations: await this.prisma.categoryTranslation.count({
          where: {
            category: { type: 'discipline' }
          }
        })
      }
    };

    this.log('📈 Data Analysis Results:', JSON.stringify(analysis, null, 2));
    return analysis;
  }

  /**
   * Validate migration prerequisites
   */
  async validatePrerequisites() {
    this.log('🔍 Validating migration prerequisites...');

    // Check if new tables exist
    const tables = await this.prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('disciplines', 'discipline_translations', 'product_disciplines', 'product_categories')
    `;

    const tableNames = tables.map(t => t.table_name);
    const requiredTables = ['disciplines', 'discipline_translations', 'product_disciplines', 'product_categories'];

    for (const table of requiredTables) {
      if (!tableNames.includes(table)) {
        throw new Error(`Required table '${table}' does not exist. Run schema migration first.`);
      }
    }

    // Check for data integrity
    const orphanedProducts = await this.prisma.product.count({
      where: { categoryId: { not: null }, category: null }
    });

    if (orphanedProducts > 0) {
      this.warn(`Found ${orphanedProducts} products with invalid category references`);
    }

    this.log('✅ Prerequisites validation passed');
  }

  /**
   * Execute migration phases
   */
  async executeMigrationPhases() {
    this.log('🔄 Executing migration phases...');

    // Phase 1: Migrate disciplines
    await this.migrateDisciplines();

    // Phase 2: Migrate discipline translations
    await this.migrateDisciplineTranslations();

    // Phase 3: Create product-discipline relationships
    await this.createProductDisciplineRelationships();

    // Phase 4: Create product-category relationships
    await this.createProductCategoryRelationships();

    // Phase 5: Update categories table (remove disciplines)
    await this.cleanupCategoriesTable();
  }

  /**
   * Simulate migration phases (dry run)
   */
  async simulateMigrationPhases() {
    this.log('🧪 Simulating migration phases (dry run)...');

    // Simulate each phase
    await this.simulateDisciplinesMigration();
    await this.simulateDisciplineTranslationsMigration();
    await this.simulateProductRelationships();
    await this.simulateCategoriesCleanup();
  }

  /**
   * Migrate disciplines from categories
   */
  async migrateDisciplines() {
    this.log('📋 Migrating disciplines...');

    const disciplineCategories = await this.prisma.category.findMany({
      where: { type: 'discipline' },
      orderBy: { createdAt: 'asc' }
    });

    let processed = 0;
    for (const batch of this.createBatches(disciplineCategories, this.batchSize)) {
      const disciplineData = batch.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt
      }));

      await this.prisma.discipline.createMany({
        data: disciplineData,
        skipDuplicates: true
      });

      processed += batch.length;
      this.log(`  ✅ Migrated ${processed}/${disciplineCategories.length} disciplines`);
    }
  }

  /**
   * Migrate discipline translations
   */
  async migrateDisciplineTranslations() {
    this.log('🌐 Migrating discipline translations...');

    const disciplineTranslations = await this.prisma.categoryTranslation.findMany({
      where: {
        category: { type: 'discipline' }
      },
      include: { category: true }
    });

    let processed = 0;
    for (const batch of this.createBatches(disciplineTranslations, this.batchSize)) {
      const translationData = batch.map(trans => ({
        disciplineId: trans.categoryId,
        languageCode: trans.languageCode,
        name: trans.name,
        description: trans.description,
        metaTitle: trans.metaTitle,
        metaDescription: trans.metaDescription
      }));

      await this.prisma.disciplineTranslation.createMany({
        data: translationData,
        skipDuplicates: true
      });

      processed += batch.length;
      this.log(`  ✅ Migrated ${processed}/${disciplineTranslations.length} discipline translations`);
    }
  }

  /**
   * Create product-discipline relationships
   */
  async createProductDisciplineRelationships() {
    this.log('🔗 Creating product-discipline relationships...');

    const productsWithDisciplines = await this.prisma.product.findMany({
      where: {
        category: { type: 'discipline' }
      },
      select: { id: true, categoryId: true }
    });

    let processed = 0;
    for (const batch of this.createBatches(productsWithDisciplines, this.batchSize)) {
      const relationshipData = batch.map(prod => ({
        productId: prod.id,
        disciplineId: prod.categoryId,
        isPrimary: true
      }));

      await this.prisma.productDiscipline.createMany({
        data: relationshipData,
        skipDuplicates: true
      });

      processed += batch.length;
      this.log(`  ✅ Created ${processed}/${productsWithDisciplines.length} product-discipline relationships`);
    }
  }

  /**
   * Create product-category relationships for equipment
   */
  async createProductCategoryRelationships() {
    this.log('🔧 Creating product-category relationships...');

    const productsWithCategories = await this.prisma.product.findMany({
      where: {
        OR: [
          { category: { type: 'equipment' } },
          { category: { type: null } },
          { categoryId: null }
        ]
      },
      include: { category: true }
    });

    // Filter out products that don't have valid categories
    const validProducts = productsWithCategories.filter(prod => 
      prod.categoryId && prod.category
    );

    let processed = 0;
    for (const batch of this.createBatches(validProducts, this.batchSize)) {
      const relationshipData = batch.map(prod => ({
        productId: prod.id,
        categoryId: prod.categoryId,
        isPrimary: true
      }));

      await this.prisma.productCategory.createMany({
        data: relationshipData,
        skipDuplicates: true
      });

      processed += batch.length;
      this.log(`  ✅ Created ${processed}/${validProducts.length} product-category relationships`);
    }
  }

  /**
   * Clean up categories table (remove discipline entries)
   */
  async cleanupCategoriesTable() {
    this.log('🧹 Cleaning up categories table...');

    // First, update products that reference discipline categories
    const productsToUpdate = await this.prisma.product.findMany({
      where: {
        category: { type: 'discipline' }
      },
      select: { id: true }
    });

    if (productsToUpdate.length > 0) {
      this.log(`  ⚠️  Updating ${productsToUpdate.length} product references...`);
      
      // Set categoryId to null for products that were linked to disciplines
      await this.prisma.product.updateMany({
        where: {
          id: { in: productsToUpdate.map(p => p.id) }
        },
        data: { categoryId: null }
      });
    }

    // Remove discipline categories
    const disciplineCount = await this.prisma.category.count({
      where: { type: 'discipline' }
    });

    if (disciplineCount > 0) {
      this.log(`  🗑️  Removing ${disciplineCount} discipline categories...`);
      
      // Delete discipline translations first
      await this.prisma.categoryTranslation.deleteMany({
        where: {
          category: { type: 'discipline' }
        }
      });

      // Delete discipline categories
      await this.prisma.category.deleteMany({
        where: { type: 'discipline' }
      });
    }

    this.log('  ✅ Categories table cleanup completed');
  }

  /**
   * Validate migration results
   */
  async validateMigrationResults() {
    this.log('✔️  Validating migration results...');

    const validation = {
      disciplines: {
        count: await this.prisma.discipline.count(),
        withTranslations: await this.prisma.discipline.count({
          where: { translations: { some: {} } }
        })
      },
      productDisciplines: {
        count: await this.prisma.productDiscipline.count(),
        primaryRelationships: await this.prisma.productDiscipline.count({
          where: { isPrimary: true }
        })
      },
      productCategories: {
        count: await this.prisma.productCategory.count(),
        primaryRelationships: await this.prisma.productCategory.count({
          where: { isPrimary: true }
        })
      },
      remainingCategories: {
        total: await this.prisma.category.count(),
        disciplines: await this.prisma.category.count({ where: { type: 'discipline' } }),
        equipment: await this.prisma.category.count({ where: { type: { in: ['equipment', null] } } })
      },
      orphanedProducts: await this.prisma.product.count({
        where: {
          AND: [
            {
              OR: [
                { categoryId: null },
                { category: null }
              ]
            },
            {
              AND: [
                { productDisciplines: { none: {} } },
                { productCategories: { none: {} } }
              ]
            }
          ]
        }
      })
    };

    this.log('📊 Migration Validation Results:', JSON.stringify(validation, null, 2));

    // Validate critical requirements
    if (validation.remainingCategories.disciplines > 0) {
      throw new Error(`Migration incomplete: ${validation.remainingCategories.disciplines} discipline categories still exist`);
    }

    if (validation.orphanedProducts > 0) {
      this.warn(`Found ${validation.orphanedProducts} orphaned products without any relationships`);
    }

    this.log('✅ Migration validation passed');
    return validation;
  }

  /**
   * Simulation methods for dry run
   */
  async simulateDisciplinesMigration() {
    const count = await this.prisma.category.count({ where: { type: 'discipline' } });
    this.log(`  🧪 Would migrate ${count} disciplines`);
  }

  async simulateDisciplineTranslationsMigration() {
    const count = await this.prisma.categoryTranslation.count({
      where: { category: { type: 'discipline' } }
    });
    this.log(`  🧪 Would migrate ${count} discipline translations`);
  }

  async simulateProductRelationships() {
    const disciplineProducts = await this.prisma.product.count({
      where: { category: { type: 'discipline' } }
    });
    const categoryProducts = await this.prisma.product.count({
      where: { category: { type: { in: ['equipment', null] } } }
    });
    
    this.log(`  🧪 Would create ${disciplineProducts} product-discipline relationships`);
    this.log(`  🧪 Would create ${categoryProducts} product-category relationships`);
  }

  async simulateCategoriesCleanup() {
    const disciplineCount = await this.prisma.category.count({ where: { type: 'discipline' } });
    this.log(`  🧪 Would remove ${disciplineCount} discipline categories`);
  }

  /**
   * Utility methods
   */
  createBatches(array, size) {
    const batches = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }

  log(message, data = null) {
    if (data) {
      this.logger.log(message, data);
    } else {
      this.logger.log(message);
    }
  }

  warn(message) {
    this.logger.warn(`⚠️  ${message}`);
  }

  error(message, error = null) {
    if (error) {
      this.logger.error(message, error);
    } else {
      this.logger.error(message);
    }
  }
}

// Script execution
if (require.main === module) {
  const migration = new DataMigrationStrategy();
  migration.execute().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = DataMigrationStrategy;