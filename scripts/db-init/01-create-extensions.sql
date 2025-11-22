-- PostgreSQL extensions for KITMED platform
-- This script creates necessary extensions for enhanced functionality

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable advanced text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable performance monitoring
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Enable advanced indexing
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gin_product_search ON products USING gin(to_tsvector('french', constructeur));
CREATE INDEX IF NOT EXISTS idx_gin_category_search ON categories USING gin(to_tsvector('french', name));

-- Set default permissions
GRANT USAGE ON SCHEMA public TO kitmed_admin;
GRANT CREATE ON SCHEMA public TO kitmed_admin;