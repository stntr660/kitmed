-- Migration 002: Migrate Discipline Data
-- This migration safely extracts discipline data from categories table
-- PHASE 2: Data migration with validation

-- First, let's backup the current state
CREATE TABLE IF NOT EXISTS migration_backup_categories AS 
SELECT * FROM categories WHERE type = 'discipline';

CREATE TABLE IF NOT EXISTS migration_backup_category_translations AS
SELECT ct.* FROM category_translations ct
JOIN categories c ON c.id = ct.category_id
WHERE c.type = 'discipline';

-- Migrate disciplines from categories table
INSERT INTO disciplines (
    id, name, slug, description, sort_order, is_active, 
    meta_title, meta_description, created_at, updated_at
)
SELECT 
    id, name, slug, description, sort_order, is_active,
    meta_title, meta_description, created_at, updated_at
FROM categories 
WHERE type = 'discipline'
ON CONFLICT (id) DO NOTHING;

-- Migrate discipline translations
INSERT INTO discipline_translations (
    discipline_id, language_code, name, description, 
    meta_title, meta_description
)
SELECT 
    ct.category_id as discipline_id,
    ct.language_code,
    ct.name,
    ct.description,
    ct.meta_title,
    ct.meta_description
FROM category_translations ct
JOIN categories c ON c.id = ct.category_id
WHERE c.type = 'discipline'
ON CONFLICT (discipline_id, language_code) DO NOTHING;

-- Create product-discipline relationships for existing products
-- This maintains current product-category relationships where category is a discipline
INSERT INTO product_disciplines (product_id, discipline_id, is_primary)
SELECT DISTINCT
    p.id as product_id,
    c.id as discipline_id,
    true as is_primary
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE c.type = 'discipline'
ON CONFLICT (product_id, discipline_id) DO NOTHING;

-- Create product-category relationships for existing products
-- This handles products linked to equipment categories
INSERT INTO product_categories (product_id, category_id, is_primary)
SELECT DISTINCT
    p.id as product_id,
    c.id as category_id,
    true as is_primary
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE c.type = 'equipment' OR c.type IS NULL OR c.type = ''
ON CONFLICT (product_id, category_id) DO NOTHING;

-- Data validation queries
-- These will help us verify the migration was successful

-- Check if all discipline categories were migrated
CREATE TEMP VIEW discipline_migration_check AS
SELECT 
    'disciplines' as table_name,
    COUNT(*) as migrated_count
FROM disciplines
UNION ALL
SELECT 
    'original_disciplines' as table_name,
    COUNT(*) as original_count
FROM categories 
WHERE type = 'discipline';

-- Check if all discipline translations were migrated
CREATE TEMP VIEW discipline_translation_check AS
SELECT 
    'discipline_translations' as table_name,
    COUNT(*) as migrated_count
FROM discipline_translations
UNION ALL
SELECT 
    'original_discipline_translations' as table_name,
    COUNT(*) as original_count
FROM category_translations ct
JOIN categories c ON c.id = ct.category_id
WHERE c.type = 'discipline';

-- Check product relationships
CREATE TEMP VIEW product_relationship_check AS
SELECT 
    'product_disciplines' as relationship_type,
    COUNT(*) as count
FROM product_disciplines
UNION ALL
SELECT 
    'product_categories' as relationship_type,
    COUNT(*) as count
FROM product_categories
UNION ALL
SELECT 
    'original_product_category_links' as relationship_type,
    COUNT(*) as count
FROM products p
JOIN categories c ON c.id = p.category_id;

-- Log migration results
INSERT INTO activity_logs (action, resource_type, details, created_at)
VALUES (
    'discipline_migration_completed',
    'migration',
    jsonb_build_object(
        'migration_id', '002',
        'disciplines_migrated', (SELECT COUNT(*) FROM disciplines),
        'translations_migrated', (SELECT COUNT(*) FROM discipline_translations),
        'product_disciplines_created', (SELECT COUNT(*) FROM product_disciplines),
        'product_categories_created', (SELECT COUNT(*) FROM product_categories)
    ),
    CURRENT_TIMESTAMP
);

-- Add constraints and validation
-- Ensure product_disciplines relationships are valid
ALTER TABLE product_disciplines 
ADD CONSTRAINT check_product_disciplines_valid 
CHECK (product_id IS NOT NULL AND discipline_id IS NOT NULL);

-- Ensure product_categories relationships are valid
ALTER TABLE product_categories 
ADD CONSTRAINT check_product_categories_valid 
CHECK (product_id IS NOT NULL AND category_id IS NOT NULL);

-- Add comment to track migration completion
COMMENT ON TABLE migration_backup_categories IS 'Backup of discipline categories before migration 002';
COMMENT ON TABLE migration_backup_category_translations IS 'Backup of discipline translations before migration 002';