-- KITMED Database Schema
-- PostgreSQL 15+ compatible schema design

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- CATEGORY HIERARCHY SYSTEM
-- ===================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    meta_title VARCHAR(255),
    meta_description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical disciplines (top level)
-- Ophthalmology, Cardiology, ENT, Neurology, etc.

-- Category translations for i18n
CREATE TABLE category_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL, -- 'fr', 'en'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    UNIQUE(category_id, language_code)
);

-- ===================================
-- PRODUCT CATALOG SYSTEM
-- ===================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description TEXT,
    long_description TEXT,
    specifications JSONB, -- Flexible product specs
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, discontinued
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product translations
CREATE TABLE product_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL,
    name VARCHAR(255) NOT NULL,
    short_description TEXT,
    long_description TEXT,
    specifications JSONB,
    meta_title VARCHAR(255),
    meta_description TEXT,
    UNIQUE(product_id, language_code)
);

-- Product media (images, documents, videos)
CREATE TABLE product_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- image, document, video
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    title VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product attributes (flexible key-value pairs)
CREATE TABLE product_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text', -- text, number, boolean, date
    sort_order INTEGER DEFAULT 0
);

-- ===================================
-- RFP (REQUEST FOR PROPOSAL) SYSTEM
-- ===================================

CREATE TABLE rfp_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(20) UNIQUE NOT NULL, -- Auto-generated: RFP-YYYY-NNNN
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, quoted, closed
    
    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    company_name VARCHAR(255),
    company_address TEXT,
    contact_person VARCHAR(255),
    
    -- Request details
    message TEXT,
    urgency_level VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    preferred_contact_method VARCHAR(20) DEFAULT 'email', -- email, phone, both
    
    -- Internal tracking
    assigned_to VARCHAR(255), -- Sales rep email/ID
    notes TEXT, -- Internal notes
    quote_amount DECIMAL(10,2),
    quote_valid_until DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFP items (products requested in each RFP)
CREATE TABLE rfp_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfp_id UUID NOT NULL REFERENCES rfp_requests(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    special_requirements TEXT,
    quoted_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- PARTNER MANAGEMENT SYSTEM
-- ===================================

CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    website_url VARCHAR(500),
    logo_url VARCHAR(500),
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner translations
CREATE TABLE partner_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    UNIQUE(partner_id, language_code)
);

-- ===================================
-- CONTENT MANAGEMENT SYSTEM
-- ===================================

-- Dynamic content pages
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'published', -- draft, published, archived
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_homepage BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page translations
CREATE TABLE page_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    UNIQUE(page_id, language_code)
);

-- Banner system for homepage/marketing
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    image_url VARCHAR(500),
    cta_text VARCHAR(100), -- Call to action text
    cta_url VARCHAR(500), -- Call to action URL
    position VARCHAR(50) DEFAULT 'homepage', -- homepage, category, product
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banner translations
CREATE TABLE banner_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    banner_id UUID NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    cta_text VARCHAR(100),
    UNIQUE(banner_id, language_code)
);

-- ===================================
-- USER MANAGEMENT & AUTHENTICATION
-- ===================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'editor', -- admin, editor, viewer
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for authentication
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- AUDIT & ANALYTICS
-- ===================================

-- Activity logs for admin actions
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- create, update, delete, login, etc.
    resource_type VARCHAR(50) NOT NULL, -- product, category, rfp, etc.
    resource_id UUID,
    details JSONB, -- Additional context
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page views and analytics (optional)
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_path VARCHAR(500) NOT NULL,
    referrer VARCHAR(500),
    user_agent TEXT,
    ip_address INET,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

-- Category indexes
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_category_translations_category_id ON category_translations(category_id);
CREATE INDEX idx_category_translations_language ON category_translations(language_code);

-- Product indexes
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_product_translations_product_id ON product_translations(product_id);
CREATE INDEX idx_product_translations_language ON product_translations(language_code);
CREATE INDEX idx_product_media_product_id ON product_media(product_id);
CREATE INDEX idx_product_attributes_product_id ON product_attributes(product_id);

-- RFP indexes
CREATE INDEX idx_rfp_requests_status ON rfp_requests(status);
CREATE INDEX idx_rfp_requests_created_at ON rfp_requests(created_at);
CREATE INDEX idx_rfp_requests_reference ON rfp_requests(reference_number);
CREATE INDEX idx_rfp_items_rfp_id ON rfp_items(rfp_id);
CREATE INDEX idx_rfp_items_product_id ON rfp_items(product_id);

-- Partner indexes
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_slug ON partners(slug);

-- Content indexes
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_banners_position ON banners(position);
CREATE INDEX idx_banners_active_dates ON banners(is_active, start_date, end_date);

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Analytics indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX idx_page_views_path ON page_views(page_path);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);

-- ===================================
-- FUNCTIONS & TRIGGERS
-- ===================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfp_requests_updated_at BEFORE UPDATE ON rfp_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate RFP reference numbers
CREATE OR REPLACE FUNCTION generate_rfp_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL THEN
        NEW.reference_number := 'RFP-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                               LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM 'RFP-\d{4}-(\d+)') AS INTEGER)), 0) + 1 
                                    FROM rfp_requests 
                                    WHERE reference_number LIKE 'RFP-' || TO_CHAR(NOW(), 'YYYY') || '-%')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_rfp_reference_trigger BEFORE INSERT ON rfp_requests FOR EACH ROW EXECUTE FUNCTION generate_rfp_reference();

-- ===================================
-- SAMPLE DATA (Development)
-- ===================================

-- Insert root categories
INSERT INTO categories (name, slug, description) VALUES
('Ophthalmology', 'ophthalmology', 'Eye care and vision equipment'),
('Cardiology', 'cardiology', 'Heart and cardiovascular equipment'),
('ENT', 'ent', 'Ear, nose, and throat equipment'),
('Neurology', 'neurology', 'Neurological and brain monitoring equipment'),
('Surgery', 'surgery', 'Surgical instruments and equipment');

-- Insert category translations
INSERT INTO category_translations (category_id, language_code, name, description) 
SELECT id, 'fr', 
    CASE name 
        WHEN 'Ophthalmology' THEN 'Ophtalmologie'
        WHEN 'Cardiology' THEN 'Cardiologie'
        WHEN 'ENT' THEN 'ORL'
        WHEN 'Neurology' THEN 'Neurologie'
        WHEN 'Surgery' THEN 'Chirurgie'
    END,
    CASE name 
        WHEN 'Ophthalmology' THEN 'Équipement de soins oculaires et de vision'
        WHEN 'Cardiology' THEN 'Équipement cardiaque et cardiovasculaire'
        WHEN 'ENT' THEN 'Équipement oreille, nez et gorge'
        WHEN 'Neurology' THEN 'Équipement neurologique et de surveillance cérébrale'
        WHEN 'Surgery' THEN 'Instruments et équipement chirurgicaux'
    END
FROM categories;

-- Insert admin user (password: admin123 - should be hashed in production)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@kitmed.ma', '$2b$10$example.hash.here', 'Admin', 'User', 'admin');

-- ===================================
-- VIEWS FOR COMMON QUERIES
-- ===================================

-- Product catalog view with category info
CREATE VIEW product_catalog_view AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.slug,
    p.short_description,
    p.status,
    p.is_featured,
    c.name as category_name,
    c.slug as category_slug,
    (SELECT url FROM product_media WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.status = 'active';

-- RFP dashboard view
CREATE VIEW rfp_dashboard_view AS
SELECT 
    r.id,
    r.reference_number,
    r.status,
    r.customer_name,
    r.customer_email,
    r.company_name,
    r.urgency_level,
    r.quote_amount,
    r.created_at,
    COUNT(ri.id) as item_count,
    SUM(ri.quantity) as total_quantity
FROM rfp_requests r
LEFT JOIN rfp_items ri ON r.id = ri.rfp_id
GROUP BY r.id, r.reference_number, r.status, r.customer_name, r.customer_email, r.company_name, r.urgency_level, r.quote_amount, r.created_at;