# Testing Product Form Improvements

## Changes Made ✅

1. **Upload Component Save Message**: Updated ImageUploadBox to show "Veuillez d'abord enregistrer le produit pour télécharger des images" for new products
2. **Manufacturer Dropdown**: Changed "Marque" to "Manufacturer" with dropdown from partners (filtered by type)
3. **Brochure PDF Upload**: Moved from bottom of form to product details section, uses ImageUploadBox with PDF support
4. **Manufacturer API Filter**: Added type filter to partners API to find manufacturers

## Test Scenarios

### 1. New Product Creation
- [ ] Navigate to Products > Add New Product
- [ ] Check that image upload shows save-first message
- [ ] Check that manufacturer dropdown loads partners with "Manufacturer" or "Fabricant" in name
- [ ] Check that PDF brochure upload is in product details section
- [ ] Check that PDF upload shows save-first message for new products
- [ ] Create a test product and verify all fields save correctly

### 2. Edit Existing Product
- [ ] Edit an existing product
- [ ] Check that image uploads work normally (no save-first message)
- [ ] Check that manufacturer dropdown populates with current value
- [ ] Check that PDF brochure upload works normally
- [ ] Update values and verify changes save

### 3. Manufacturer API
- [ ] Test `/api/admin/partners?type=manufacturer` endpoint
- [ ] Verify it returns only partners with manufacturer keywords
- [ ] Create test partners with "Manufacturer" and "Fabricant" in names
- [ ] Verify they appear in product form dropdown

### 4. PDF Upload Functionality
- [ ] Test PDF upload with valid PDF file
- [ ] Test file size limits (10MB max)
- [ ] Test invalid file types
- [ ] Verify PDF URLs save to database

## Implementation Notes

**Temporary Solution**: The manufacturer filter uses pattern matching on partner names/descriptions containing "Manufacturer" or "Fabricant" keywords. This is a temporary solution until we add a proper `type` field to the partner schema.

**Future Improvement**: Add a `type` enum field to the Partner model in Prisma schema with values like 'manufacturer', 'distributor', 'service', etc.