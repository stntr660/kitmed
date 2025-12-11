-- Migration 001: Create Disciplines Table and Related Structures
-- This migration creates the new disciplines table while maintaining existing categories
-- PHASE 1: Non-breaking schema changes

-- Create disciplines table
CREATE TABLE IF NOT EXISTS disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    color_hex VARCHAR(7),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create discipline translations table
CREATE TABLE IF NOT EXISTS discipline_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(discipline_id, language_code)
);

-- Create product-disciplines junction table
CREATE TABLE IF NOT EXISTS product_disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, discipline_id)
);

-- Create product-categories junction table (for future many-to-many support)
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, category_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_disciplines_slug ON disciplines(slug);
CREATE INDEX IF NOT EXISTS idx_disciplines_active ON disciplines(is_active);
CREATE INDEX IF NOT EXISTS idx_disciplines_sort ON disciplines(sort_order);

CREATE INDEX IF NOT EXISTS idx_discipline_translations_discipline ON discipline_translations(discipline_id);
CREATE INDEX IF NOT EXISTS idx_discipline_translations_lang ON discipline_translations(language_code);

CREATE INDEX IF NOT EXISTS idx_product_disciplines_product ON product_disciplines(product_id);
CREATE INDEX IF NOT EXISTS idx_product_disciplines_discipline ON product_disciplines(discipline_id);
CREATE INDEX IF NOT EXISTS idx_product_disciplines_primary ON product_disciplines(is_primary);

CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_primary ON product_categories(is_primary);

-- Create updated_at trigger for disciplines table
CREATE OR REPLACE FUNCTION update_disciplines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_disciplines_updated_at
    BEFORE UPDATE ON disciplines
    FOR EACH ROW
    EXECUTE FUNCTION update_disciplines_updated_at();

-- Create updated_at trigger for discipline_translations table  
CREATE OR REPLACE FUNCTION update_discipline_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_discipline_translations_updated_at
    BEFORE UPDATE ON discipline_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_discipline_translations_updated_at();

-- Add comment to track migration
COMMENT ON TABLE disciplines IS 'Medical disciplines separated from categories - Migration 001';
COMMENT ON TABLE discipline_translations IS 'Discipline translations - Migration 001';
COMMENT ON TABLE product_disciplines IS 'Product-Discipline many-to-many relationships - Migration 001';
COMMENT ON TABLE product_categories IS 'Product-Category many-to-many relationships - Migration 001';