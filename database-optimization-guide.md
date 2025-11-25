# Database Optimization Guide: Medical Equipment Platform

## Overview

This document outlines the indexing strategy and performance optimizations for the new discipline/category architecture designed for the medical equipment platform.

## Schema Design Decisions

### 1. Discipline vs Category Separation

**Previous Structure:**
```sql
Category {
  type: 'discipline' | 'equipment'  -- Mixed responsibilities
  parentId: nullable                -- Self-referencing hierarchy
}
```

**New Structure:**
```sql
Discipline {
  specialtyCode: unique             -- Medical specialty identification
  colorCode, iconCode              -- UI theming
}

Category {
  disciplineId: required           -- Clear ownership
  level: integer                   -- Hierarchical depth
  safetyClass: varchar            -- Medical device classification
}
```

**Benefits:**
- Clear domain separation
- Medical industry compliance
- Better query performance
- Simplified relationship management

### 2. Multi-Tenant Architecture Support

The schema is designed for horizontal scaling and tenant isolation:

```sql
-- Future tenant isolation (when needed)
ALTER TABLE disciplines ADD COLUMN tenant_id UUID;
ALTER TABLE categories ADD COLUMN tenant_id UUID;
ALTER TABLE products ADD COLUMN tenant_id UUID;
```

## Indexing Strategy

### Primary Indexes

#### Disciplines Table
```sql
-- Performance-critical indexes
CREATE INDEX idx_disciplines_slug ON disciplines(slug);                    -- URL routing
CREATE INDEX idx_disciplines_specialty_code ON disciplines(specialty_code); -- Medical standards
CREATE INDEX idx_disciplines_active_sort ON disciplines(is_active, sort_order); -- Listing queries
CREATE INDEX idx_disciplines_featured_active ON disciplines(is_featured, is_active); -- Homepage
```

#### Categories Table
```sql
-- Multi-column indexes for common query patterns
CREATE INDEX idx_categories_discipline_active ON categories(discipline_id, is_active);
CREATE INDEX idx_categories_discipline_sort ON categories(discipline_id, sort_order);
CREATE INDEX idx_categories_parent_sort ON categories(parent_id, sort_order);
CREATE INDEX idx_categories_level_active ON categories(level, is_active);
```

#### Products Table
```sql
-- Enhanced product indexing
CREATE INDEX idx_products_discipline_active ON products(discipline_id, is_active);
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_products_device_class ON products(device_class);
CREATE INDEX idx_products_constructor ON products(constructeur);
CREATE INDEX idx_products_status_featured ON products(status, is_featured);
```

### Translation Tables
```sql
-- Language-specific indexes
CREATE INDEX idx_discipline_translations_lang ON discipline_translations(language_code);
CREATE INDEX idx_category_translations_lang ON category_translations(language_code);
```

## Query Optimization Patterns

### 1. Discipline Listing with Categories

**Optimized Query:**
```sql
-- Get disciplines with their category counts
SELECT d.*, dt.name as localized_name, COUNT(c.id) as category_count
FROM disciplines d
JOIN discipline_translations dt ON d.id = dt.discipline_id 
LEFT JOIN categories c ON d.id = c.discipline_id AND c.is_active = true
WHERE d.is_active = true AND dt.language_code = 'fr'
GROUP BY d.id, dt.name
ORDER BY d.sort_order;
```

**Index Usage:** `idx_disciplines_active_sort` + `idx_discipline_translations_lang`

### 2. Category Hierarchy by Discipline

**Optimized Query:**
```sql
-- Get category hierarchy for a specific discipline
WITH RECURSIVE category_tree AS (
  -- Base case: top-level categories
  SELECT c.*, ct.name as localized_name, 1 as depth
  FROM categories c
  JOIN category_translations ct ON c.id = ct.category_id
  WHERE c.discipline_id = $1 
    AND c.parent_id IS NULL 
    AND c.is_active = true
    AND ct.language_code = $2
  
  UNION ALL
  
  -- Recursive case: child categories
  SELECT c.*, ct.name as localized_name, depth + 1
  FROM categories c
  JOIN category_translations ct ON c.id = ct.category_id
  JOIN category_tree ct_parent ON c.parent_id = ct_parent.id
  WHERE c.is_active = true AND ct.language_code = $2
)
SELECT * FROM category_tree ORDER BY depth, sort_order;
```

**Index Usage:** `idx_categories_discipline_active` + `idx_categories_parent_sort`

### 3. Products by Discipline with Filters

**Optimized Query:**
```sql
-- Products within a discipline with filters
SELECT p.*, pt.nom as localized_name, c.name as category_name, d.name as discipline_name
FROM products p
JOIN product_translations pt ON p.id = pt.product_id
JOIN categories c ON p.category_id = c.id
JOIN disciplines d ON p.discipline_id = d.id
WHERE p.discipline_id = $1
  AND p.status = 'active'
  AND pt.language_code = $2
  AND ($3 IS NULL OR p.device_class = $3)  -- Optional device class filter
  AND ($4 IS NULL OR p.constructeur ILIKE $4)  -- Optional manufacturer filter
ORDER BY p.is_featured DESC, p.sort_order ASC
LIMIT $5 OFFSET $6;
```

**Index Usage:** `idx_products_discipline_active` + `idx_products_device_class`

### 4. Medical Device Search with Specialty Filter

**Optimized Query:**
```sql
-- Full-text search within medical specialties
SELECT p.*, pt.nom, d.name as discipline_name, d.specialty_code
FROM products p
JOIN product_translations pt ON p.id = pt.product_id
JOIN disciplines d ON p.discipline_id = d.id
WHERE d.specialty_code = ANY($1)  -- Array of specialty codes
  AND (
    pt.nom ILIKE '%' || $2 || '%' 
    OR pt.description ILIKE '%' || $2 || '%'
    OR p.constructeur ILIKE '%' || $2 || '%'
  )
  AND p.status = 'active'
  AND pt.language_code = $3
ORDER BY 
  CASE WHEN p.is_featured THEN 0 ELSE 1 END,
  ts_rank_cd(
    setweight(to_tsvector('french', pt.nom), 'A') ||
    setweight(to_tsvector('french', COALESCE(pt.description, '')), 'B'),
    plainto_tsquery('french', $2)
  ) DESC;
```

## Performance Monitoring

### Key Metrics to Track

1. **Query Performance:**
   ```sql
   -- Monitor slow queries
   SELECT query, calls, total_time, mean_time, rows
   FROM pg_stat_statements 
   WHERE query LIKE '%disciplines%' OR query LIKE '%categories%'
   ORDER BY total_time DESC;
   ```

2. **Index Usage:**
   ```sql
   -- Check index effectiveness
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
   FROM pg_stat_user_indexes 
   WHERE tablename IN ('disciplines', 'categories', 'products')
   ORDER BY idx_scan DESC;
   ```

3. **Table Statistics:**
   ```sql
   -- Monitor table growth and vacuum needs
   SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, 
          last_vacuum, last_autovacuum, last_analyze
   FROM pg_stat_user_tables 
   WHERE tablename IN ('disciplines', 'categories', 'products');
   ```

### Maintenance Recommendations

1. **Regular VACUUM ANALYZE:**
   ```sql
   VACUUM ANALYZE disciplines;
   VACUUM ANALYZE categories;
   VACUUM ANALYZE products;
   ```

2. **Monitor Index Bloat:**
   ```sql
   -- Check for index bloat
   SELECT schemaname, tablename, indexname,
          pg_size_pretty(pg_relation_size(indexname::regclass)) as size
   FROM pg_indexes 
   WHERE tablename IN ('disciplines', 'categories', 'products')
   ORDER BY pg_relation_size(indexname::regclass) DESC;
   ```

## Scaling Strategies

### Horizontal Scaling Options

1. **Read Replicas:** For product catalog queries
2. **Partitioning:** By discipline_id for very large datasets
3. **Sharding:** By tenant_id for multi-tenant growth

### Caching Strategy

1. **Application-Level Caching:**
   - Discipline list (24h TTL)
   - Category hierarchy (12h TTL)
   - Featured products (1h TTL)

2. **Database-Level Caching:**
   - Materialized views for complex aggregations
   - Prepared statements for frequent queries

### Connection Pooling

```javascript
// Recommended PgBouncer configuration
{
  "pool_mode": "transaction",
  "max_client_conn": 100,
  "default_pool_size": 20,
  "server_reset_query": "DISCARD ALL"
}
```

## Medical Industry Compliance

### Data Integrity Constraints

```sql
-- Medical device classification validation
ALTER TABLE categories 
ADD CONSTRAINT chk_safety_class 
CHECK (safety_class IN ('Class I', 'Class II', 'Class III', 'Unclassified'));

-- Specialty code format validation
ALTER TABLE disciplines 
ADD CONSTRAINT chk_specialty_code_format 
CHECK (specialty_code ~ '^[A-Z]{3,4}-[0-9]{2}$');

-- Warranty period validation
ALTER TABLE products 
ADD CONSTRAINT chk_warranty_months 
CHECK (warranty_months IS NULL OR warranty_months BETWEEN 0 AND 240);
```

### Audit Trail Requirements

```sql
-- Enable row-level security for audit compliance
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Track all changes to medical devices
CREATE TABLE product_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Migration Best Practices

### Pre-Migration Checklist

1. ✅ Backup existing data
2. ✅ Test migration on staging environment  
3. ✅ Validate data integrity post-migration
4. ✅ Update application code
5. ✅ Monitor performance after deployment

### Rollback Strategy

1. **Immediate Rollback:** Keep old schema columns until migration validated
2. **Data Recovery:** Backup files stored in `backups/` directory
3. **Application Rollback:** Feature flags for new vs old schema usage

This optimized structure provides a solid foundation for scaling your medical equipment platform while maintaining performance and compliance with medical industry standards.