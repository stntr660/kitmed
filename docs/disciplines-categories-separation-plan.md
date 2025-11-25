# Disciplines-Categories Separation Plan

## Overview
This document outlines the safe migration strategy to separate medical disciplines from equipment categories in the KITMED platform.

## Current State Analysis

### Current Schema Structure
- **categories** table with `type` field (`"discipline"` or `"equipment"`)
- Products linked via `category_id` to categories
- Hierarchical structure with `parent_id` support
- Multi-language support via `category_translations`

### Current Issues
- Mixed disciplines and categories in single table
- Unclear semantic separation
- Potential confusion in product classification
- Complex querying for distinct discipline vs category operations

## Target State Architecture

### New Schema Design
1. **disciplines** table - Medical specialties (Cardiology, Radiology, etc.)
2. **categories** table - Equipment types (Monitors, Scanners, etc.)
3. **product_disciplines** junction table - Many-to-many relationship
4. **product_categories** junction table - Many-to-many relationship

### Benefits
- Clear semantic separation
- Products can belong to multiple disciplines
- Equipment can be categorized independently
- Improved search and filtering capabilities
- Better data integrity

## Migration Strategy

### Phase 1: Schema Preparation (Non-Breaking)
1. Create new `disciplines` table
2. Create junction tables (`product_disciplines`, `product_categories`)
3. Add indexes for performance
4. Keep existing `categories` table intact

### Phase 2: Data Migration (Safe)
1. Extract discipline data from categories where `type = 'discipline'`
2. Extract category data from categories where `type = 'equipment'`
3. Create relationships in junction tables
4. Validate data integrity

### Phase 3: API Adaptation (Backward Compatible)
1. Update API endpoints to support both old and new formats
2. Add feature flags for gradual rollout
3. Implement fallback mechanisms
4. Add deprecation warnings for old endpoints

### Phase 4: Frontend Updates (Progressive)
1. Update admin interfaces with feature flags
2. Implement new discipline/category selectors
3. Maintain backward compatibility
4. Progressive enhancement approach

### Phase 5: Cleanup (Final)
1. Remove old `type` field from categories
2. Drop deprecated API endpoints
3. Remove feature flags
4. Clean up legacy code

## Implementation Details

### New Tables Structure

```sql
-- Disciplines Table
CREATE TABLE disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR,
    color_hex VARCHAR(7),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    meta_title VARCHAR,
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discipline Translations
CREATE TABLE discipline_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discipline_id UUID REFERENCES disciplines(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    meta_title VARCHAR,
    meta_description TEXT,
    UNIQUE(discipline_id, language_code)
);

-- Product-Discipline Junction
CREATE TABLE product_disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    discipline_id UUID REFERENCES disciplines(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, discipline_id)
);

-- Product-Category Junction
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, category_id)
);
```

### Migration Scripts

#### 1. Data Extraction
```sql
-- Extract disciplines from categories
INSERT INTO disciplines (id, name, slug, description, sort_order, is_active, meta_title, meta_description, created_at, updated_at)
SELECT id, name, slug, description, sort_order, is_active, meta_title, meta_description, created_at, updated_at
FROM categories
WHERE type = 'discipline';

-- Extract discipline translations
INSERT INTO discipline_translations (discipline_id, language_code, name, description, meta_title, meta_description)
SELECT category_id, language_code, name, description, meta_title, meta_description
FROM category_translations ct
JOIN categories c ON c.id = ct.category_id
WHERE c.type = 'discipline';
```

#### 2. Junction Table Population
```sql
-- Create product-discipline relationships
INSERT INTO product_disciplines (product_id, discipline_id, is_primary)
SELECT p.id, c.id, true
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE c.type = 'discipline';

-- Create product-category relationships (for equipment categories)
INSERT INTO product_categories (product_id, category_id, is_primary)
SELECT p.id, c.id, true
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE c.type = 'equipment';
```

### Rollback Strategy

1. **Immediate Rollback**: Use database backup created before migration
2. **Partial Rollback**: Drop new tables and restore junction relationships
3. **Data Rollback**: Restore category relationships from backup data

### Feature Flags

```javascript
const FEATURE_FLAGS = {
  SEPARATE_DISCIPLINES_CATEGORIES: process.env.FEATURE_SEPARATE_DISCIPLINES === 'true',
  NEW_DISCIPLINE_API: process.env.FEATURE_NEW_DISCIPLINE_API === 'true',
  LEGACY_CATEGORY_SUPPORT: process.env.FEATURE_LEGACY_CATEGORIES === 'true'
};
```

### API Endpoint Changes

#### New Endpoints
- `GET /api/disciplines` - List all medical disciplines
- `GET /api/disciplines/{id}` - Get specific discipline
- `GET /api/categories` - Equipment categories only
- `GET /api/products/{id}/disciplines` - Product's disciplines
- `GET /api/products/{id}/categories` - Product's categories

#### Backward Compatibility
- Maintain existing `/api/categories` with type filtering
- Add deprecation headers to legacy endpoints
- Provide migration path documentation

### Testing Strategy

1. **Unit Tests**: Test all data migration functions
2. **Integration Tests**: Verify API compatibility
3. **Performance Tests**: Ensure query performance
4. **Rollback Tests**: Validate rollback procedures
5. **Data Integrity Tests**: Check referential integrity

### Monitoring and Validation

1. **Data Validation Queries**: Check for orphaned records
2. **Performance Monitoring**: Track query performance
3. **Error Logging**: Monitor API errors during transition
4. **User Feedback**: Track admin interface usage

## Risk Assessment

### High Risk
- Data loss during migration
- API breaking changes
- Performance degradation

### Medium Risk  
- Frontend compatibility issues
- Search functionality disruption
- Translation inconsistencies

### Low Risk
- Minor UI adjustments needed
- Documentation updates required

## Success Criteria

1. All existing products maintain their relationships
2. No data loss during migration
3. API performance remains stable
4. Admin interface functions correctly
5. Search and filtering work as expected
6. All tests pass after migration

## Timeline

- **Week 1**: Schema preparation and testing
- **Week 2**: Data migration and validation  
- **Week 3**: API updates and testing
- **Week 4**: Frontend updates and rollout
- **Week 5**: Cleanup and optimization

## Communication Plan

1. **Stakeholder Notification**: Before starting migration
2. **Progress Updates**: Daily during migration week
3. **Issue Escalation**: Immediate for critical problems
4. **Completion Report**: Detailed post-migration analysis