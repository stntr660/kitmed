-- Migration 001: Create Disciplines and Separate Categories
-- This migration creates the new discipline/category structure and migrates existing data

-- Step 1: Create disciplines table
CREATE TABLE disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL UNIQUE,
    description TEXT,
    specialty_code VARCHAR UNIQUE,
    certification_requirements TEXT,
    color_code VARCHAR(7), -- hex color
    icon_code VARCHAR,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR,
    meta_description TEXT,
    image_url VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create discipline translations table
CREATE TABLE discipline_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discipline_id UUID NOT NULL,
    language_code VARCHAR(5) NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    meta_title VARCHAR,
    meta_description TEXT,
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE,
    UNIQUE(discipline_id, language_code)
);

-- Step 3: Insert medical disciplines based on existing category data
INSERT INTO disciplines (id, name, slug, description, specialty_code, color_code, icon_code, sort_order, is_active, is_featured, image_url) VALUES
('cardiology-disc', 'Cardiologie', 'cardiology', 'Équipements cardiovasculaires de pointe', 'CARD-01', '#e74c3c', 'heart', 1, true, true, NULL),
('radiology-disc', 'Radiologie', 'radiology', 'Imagerie médicale haute définition', 'RADI-01', '#3498db', 'xray', 2, true, true, NULL),
('surgery-disc', 'Chirurgie', 'surgery', 'Instruments chirurgicaux précis', 'SURG-01', '#2ecc71', 'scalpel', 3, true, true, NULL),
('laboratory-disc', 'Laboratoire', 'laboratory', 'Analyses et diagnostics avancés', 'LAB-01', '#f39c12', 'microscope', 4, true, true, NULL),
('emergency-disc', 'Urgences', 'emergency', 'Solutions d''urgence et réanimation', 'EMER-01', '#e67e22', 'ambulance', 5, true, true, NULL),
('icu-disc', 'Soins Intensifs', 'icu', 'Technologies de soins critiques', 'ICU-01', '#9b59b6', 'monitor', 6, true, true, NULL),
('ophthalmology-disc', 'Ophtalmologie', 'ophthalmology', 'Équipements de diagnostic et chirurgie oculaire', 'OPHT-01', '#1abc9c', 'eye', 7, true, false, NULL),
('orthopedics-disc', 'Orthopédie', 'orthopedics', 'Équipements orthopédiques et prothèses', 'ORTH-01', '#34495e', 'bone', 8, true, false, NULL),
('neurology-disc', 'Neurologie', 'neurology', 'Équipements neurologiques et neurochirurgie', 'NEUR-01', '#8e44ad', 'brain', 9, true, false, NULL),
('anesthesia-disc', 'Anesthésie', 'anesthesia', 'Équipements d''anesthésie et monitoring', 'ANES-01', '#95a5a6', 'mask', 10, true, false, NULL);

-- Step 4: Insert discipline translations (French and English)
INSERT INTO discipline_translations (discipline_id, language_code, name, description, meta_title, meta_description) VALUES
-- French translations
('cardiology-disc', 'fr', 'Cardiologie', 'Équipements cardiovasculaires de pointe pour le diagnostic et traitement des maladies cardiaques', 'Équipements de Cardiologie', 'Découvrez notre gamme complète d''équipements cardiovasculaires de haute technologie'),
('radiology-disc', 'fr', 'Radiologie', 'Imagerie médicale haute définition pour diagnostics précis', 'Équipements de Radiologie', 'Solutions d''imagerie médicale avancée pour tous types de diagnostics'),
('surgery-disc', 'fr', 'Chirurgie', 'Instruments chirurgicaux précis pour interventions optimales', 'Instruments de Chirurgie', 'Instruments chirurgicaux de qualité supérieure pour toutes spécialités'),
('laboratory-disc', 'fr', 'Laboratoire', 'Analyses et diagnostics avancés avec précision garantie', 'Équipements de Laboratoire', 'Solutions complètes pour analyses médicales et diagnostics de laboratoire'),
('emergency-disc', 'fr', 'Urgences', 'Solutions d''urgence et réanimation pour soins critiques', 'Équipements d''Urgence', 'Matériel d''urgence et de réanimation pour interventions vitales'),
('icu-disc', 'fr', 'Soins Intensifs', 'Technologies de soins critiques pour patients en état grave', 'Équipements de Soins Intensifs', 'Technologies avancées pour unités de soins intensifs'),

-- English translations
('cardiology-disc', 'en', 'Cardiology', 'Advanced cardiovascular equipment for heart disease diagnosis and treatment', 'Cardiology Equipment', 'Discover our complete range of high-tech cardiovascular equipment'),
('radiology-disc', 'en', 'Radiology', 'High-definition medical imaging for precise diagnostics', 'Radiology Equipment', 'Advanced medical imaging solutions for all types of diagnostics'),
('surgery-disc', 'en', 'Surgery', 'Precise surgical instruments for optimal interventions', 'Surgical Instruments', 'Superior quality surgical instruments for all specialties'),
('laboratory-disc', 'en', 'Laboratory', 'Advanced analysis and diagnostics with guaranteed precision', 'Laboratory Equipment', 'Complete solutions for medical analysis and laboratory diagnostics'),
('emergency-disc', 'en', 'Emergency', 'Emergency and resuscitation solutions for critical care', 'Emergency Equipment', 'Emergency and resuscitation equipment for life-saving interventions'),
('icu-disc', 'en', 'Intensive Care', 'Critical care technologies for critically ill patients', 'ICU Equipment', 'Advanced technologies for intensive care units');

-- Step 5: Add discipline_id column to categories table
ALTER TABLE categories ADD COLUMN discipline_id UUID;
ALTER TABLE categories ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE categories ADD COLUMN safety_class VARCHAR;
ALTER TABLE categories ADD COLUMN regulatory_notes TEXT;

-- Step 6: Map existing categories to disciplines and update
UPDATE categories SET 
    discipline_id = 'cardiology-disc',
    level = 1
WHERE slug = 'cardiology';

UPDATE categories SET 
    discipline_id = 'radiology-disc',
    level = 1
WHERE slug = 'radiology';

UPDATE categories SET 
    discipline_id = 'surgery-disc',
    level = 1
WHERE slug = 'surgery';

UPDATE categories SET 
    discipline_id = 'laboratory-disc',
    level = 1
WHERE slug = 'laboratory';

UPDATE categories SET 
    discipline_id = 'emergency-disc',
    level = 1
WHERE slug = 'emergency';

UPDATE categories SET 
    discipline_id = 'icu-disc',
    level = 1
WHERE slug = 'icu';

-- Step 7: Add foreign key constraint
ALTER TABLE categories 
ADD CONSTRAINT fk_categories_discipline 
FOREIGN KEY (discipline_id) REFERENCES disciplines(id);

-- Step 8: Remove the old 'type' column (after confirming migration success)
-- ALTER TABLE categories DROP COLUMN type;

-- Step 9: Update products table to include discipline_id
ALTER TABLE products ADD COLUMN discipline_id UUID;
ALTER TABLE products ADD COLUMN device_class VARCHAR;
ALTER TABLE products ADD COLUMN certification_numbers TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN warranty_months INTEGER;
ALTER TABLE products ADD COLUMN maintenance_level VARCHAR;
ALTER TABLE products ADD COLUMN installation_level VARCHAR;

-- Step 10: Update products with discipline_id based on their category
UPDATE products SET discipline_id = c.discipline_id 
FROM categories c 
WHERE products.category_id = c.id;

-- Step 11: Add foreign key constraint for products
ALTER TABLE products 
ADD CONSTRAINT fk_products_discipline 
FOREIGN KEY (discipline_id) REFERENCES disciplines(id);

-- Step 12: Create optimized indexes for performance
CREATE INDEX idx_disciplines_slug ON disciplines(slug);
CREATE INDEX idx_disciplines_specialty_code ON disciplines(specialty_code);
CREATE INDEX idx_disciplines_active_sort ON disciplines(is_active, sort_order);
CREATE INDEX idx_disciplines_featured_active ON disciplines(is_featured, is_active);

CREATE INDEX idx_discipline_translations_lang ON discipline_translations(language_code);

CREATE INDEX idx_categories_discipline_active ON categories(discipline_id, is_active);
CREATE INDEX idx_categories_discipline_sort ON categories(discipline_id, sort_order);
CREATE INDEX idx_categories_parent_sort ON categories(parent_id, sort_order);
CREATE INDEX idx_categories_level_active ON categories(level, is_active);

CREATE INDEX idx_products_discipline_active ON products(discipline_id, is_active);
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_products_device_class ON products(device_class);
CREATE INDEX idx_products_constructor ON products(constructeur);

-- Step 13: Create update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_disciplines_updated_at 
    BEFORE UPDATE ON disciplines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 14: Add check constraints for data integrity
ALTER TABLE disciplines ADD CONSTRAINT chk_disciplines_sort_order CHECK (sort_order >= 0);
ALTER TABLE categories ADD CONSTRAINT chk_categories_level CHECK (level > 0 AND level <= 5);
ALTER TABLE categories ADD CONSTRAINT chk_categories_sort_order CHECK (sort_order >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_warranty CHECK (warranty_months IS NULL OR warranty_months >= 0);

-- Step 15: Insert sample equipment categories for each discipline
INSERT INTO categories (id, name, slug, description, discipline_id, level, sort_order, is_active, safety_class) VALUES
-- Cardiology equipment categories
('card-monitors', 'Moniteurs Cardiaques', 'cardiac-monitors', 'Moniteurs de surveillance cardiaque et ECG', 'cardiology-disc', 2, 1, true, 'Class II'),
('card-defib', 'Défibrillateurs', 'defibrillators', 'Défibrillateurs automatiques et semi-automatiques', 'cardiology-disc', 2, 2, true, 'Class III'),
('card-echo', 'Échographes Cardiaques', 'cardiac-ultrasound', 'Échographes spécialisés en cardiologie', 'cardiology-disc', 2, 3, true, 'Class II'),

-- Radiology equipment categories  
('rad-xray', 'Radiologie Conventionnelle', 'conventional-xray', 'Appareils de radiologie standard', 'radiology-disc', 2, 1, true, 'Class II'),
('rad-ct', 'Scanner CT', 'ct-scanners', 'Tomodensitomètres et scanners CT', 'radiology-disc', 2, 2, true, 'Class II'),
('rad-mri', 'IRM', 'mri-systems', 'Systèmes d''imagerie par résonance magnétique', 'radiology-disc', 2, 3, true, 'Class II'),

-- Surgery equipment categories
('surg-instruments', 'Instruments Chirurgicaux', 'surgical-instruments', 'Instruments de base pour chirurgie générale', 'surgery-disc', 2, 1, true, 'Class I'),
('surg-laser', 'Chirurgie Laser', 'laser-surgery', 'Équipements de chirurgie laser', 'surgery-disc', 2, 2, true, 'Class III'),
('surg-endo', 'Endoscopie', 'endoscopy', 'Équipements d''endoscopie et laparoscopie', 'surgery-disc', 2, 3, true, 'Class II'),

-- Laboratory equipment categories
('lab-analyzers', 'Analyseurs', 'laboratory-analyzers', 'Analyseurs automatisés de laboratoire', 'laboratory-disc', 2, 1, true, 'Class I'),
('lab-micro', 'Microbiologie', 'microbiology', 'Équipements de microbiologie', 'laboratory-disc', 2, 2, true, 'Class I'),
('lab-hema', 'Hématologie', 'hematology', 'Équipements d''analyse sanguine', 'laboratory-disc', 2, 3, true, 'Class I');

-- Add translations for new categories (French)
INSERT INTO category_translations (category_id, language_code, name, description) VALUES
('card-monitors', 'fr', 'Moniteurs Cardiaques', 'Surveillance continue des paramètres cardiaques'),
('card-defib', 'fr', 'Défibrillateurs', 'Équipements de défibrillation d''urgence'),
('card-echo', 'fr', 'Échographes Cardiaques', 'Imagerie échographique cardiaque avancée'),
('rad-xray', 'fr', 'Radiologie Conventionnelle', 'Systèmes de radiographie standard'),
('rad-ct', 'fr', 'Scanner CT', 'Imagerie tomodensitométrique haute résolution'),
('rad-mri', 'fr', 'IRM', 'Imagerie par résonance magnétique'),
('surg-instruments', 'fr', 'Instruments Chirurgicaux', 'Instruments de chirurgie générale'),
('surg-laser', 'fr', 'Chirurgie Laser', 'Technologies laser pour chirurgie'),
('surg-endo', 'fr', 'Endoscopie', 'Équipements d''exploration endoscopique'),
('lab-analyzers', 'fr', 'Analyseurs', 'Systèmes d''analyse automatisée'),
('lab-micro', 'fr', 'Microbiologie', 'Diagnostic microbiologique'),
('lab-hema', 'fr', 'Hématologie', 'Analyse des paramètres sanguins');

-- Add English translations for new categories
INSERT INTO category_translations (category_id, language_code, name, description) VALUES
('card-monitors', 'en', 'Cardiac Monitors', 'Continuous monitoring of cardiac parameters'),
('card-defib', 'en', 'Defibrillators', 'Emergency defibrillation equipment'),
('card-echo', 'en', 'Cardiac Ultrasound', 'Advanced cardiac ultrasound imaging'),
('rad-xray', 'en', 'Conventional X-Ray', 'Standard radiography systems'),
('rad-ct', 'en', 'CT Scanners', 'High-resolution computed tomography'),
('rad-mri', 'en', 'MRI Systems', 'Magnetic resonance imaging'),
('surg-instruments', 'en', 'Surgical Instruments', 'General surgery instruments'),
('surg-laser', 'en', 'Laser Surgery', 'Laser technology for surgery'),
('surg-endo', 'en', 'Endoscopy', 'Endoscopic exploration equipment'),
('lab-analyzers', 'en', 'Laboratory Analyzers', 'Automated analysis systems'),
('lab-micro', 'en', 'Microbiology', 'Microbiological diagnostics'),
('lab-hema', 'en', 'Hematology', 'Blood parameter analysis');

COMMIT;