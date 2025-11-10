# Bulk Upload Strategy for KITMED Products

## 🎯 Overview

Strategy for handling bulk product uploads with multiple images and PDFs, focusing on server-based storage and link-based references.

## 📂 File Organization Structure

```
/public/uploads/
├── products/
│   ├── images/
│   │   ├── product-name-timestamp-uuid.jpg
│   │   └── thumb-product-name-timestamp-uuid.jpg
│   └── documents/
│       └── product-name-timestamp-uuid.pdf
├── partners/
│   └── logos/
├── categories/
│   └── images/
└── temp/
    └── bulk-uploads/
        ├── batch-uuid/
        │   ├── images/
        │   └── documents/
        └── processed/
```

## 🚀 Bulk Upload Workflows

### Option 1: ZIP-Based Upload (Recommended)
1. **User uploads ZIP** containing:
   - CSV file with product data
   - `/images/` folder with product images
   - `/documents/` folder with PDFs
   
2. **Server processing**:
   - Extract ZIP to temp directory
   - Parse CSV for product metadata
   - Move files to organized structure
   - Generate database records with file URLs
   
3. **File naming convention**:
   ```
   Original: "product-abc.jpg"
   Final: "product-abc-1699123456-a1b2c3.jpg"
   URL: "/uploads/products/images/product-abc-1699123456-a1b2c3.jpg"
   ```

### Option 2: Multi-Step Upload
1. **Step 1**: Upload CSV with product data including image/document names
2. **Step 2**: Upload images/PDFs in batches
3. **Step 3**: Auto-match files to products by naming convention

### Option 3: Link-Only (Current Hybrid)
Keep current system where CSV contains URLs to external images/documents, but allow users to choose between upload or URL.

## 🎨 UI Components

### 1. Bulk Product Upload Component
```tsx
<BulkProductUpload
  onComplete={(results) => refreshProductList()}
  supportedFormats={['zip', 'csv']}
  maxFileSize="50MB"
  maxProducts={1000}
/>
```

### 2. File Mapping Interface
```tsx
<FileMapper
  csvData={products}
  uploadedFiles={files}
  onMappingComplete={(mappedData) => processProducts()}
/>
```

### 3. Upload Progress Tracker
```tsx
<UploadProgress
  current={45}
  total={100}
  stage="Processing images..."
  eta="2 minutes remaining"
/>
```

## 📋 CSV Structure for Bulk Upload

```csv
nom_fr,nom_en,description_fr,description_en,prix,images,documents,categories
"Stéthoscope Digital","Digital Stethoscope","Description FR","Description EN",299.99,"stethoscope-1.jpg,stethoscope-2.jpg","stethoscope-manual.pdf","cardiologie,diagnostic"
"Scanner Portable","Portable Scanner","Description FR","Description EN",15000,"scanner-main.jpg,scanner-detail.jpg,scanner-mobile.jpg","scanner-manual.pdf,scanner-specs.pdf","radiologie"
```

## 💾 Server Storage Implementation

### 1. Storage Service
```typescript
interface StorageService {
  uploadFile(file: File, options: UploadOptions): Promise<UploadResult>
  uploadBatch(files: File[], batchId: string): Promise<BatchResult>
  moveTempToFinal(tempPath: string, finalPath: string): Promise<string>
  generateThumbnails(imagePath: string): Promise<string[]>
  deleteFile(path: string): Promise<void>
  cleanupTempFiles(olderThan: Date): Promise<void>
}
```

### 2. Batch Processing
```typescript
interface BatchUploadService {
  processBulkUpload(zipFile: File): Promise<BulkUploadResult>
  extractZip(file: File, targetDir: string): Promise<ExtractResult>
  parseCsv(csvContent: string): Promise<ProductRecord[]>
  matchFilesToProducts(products: ProductRecord[], files: FileInfo[]): Promise<MappedProduct[]>
  createProducts(mappedProducts: MappedProduct[]): Promise<CreateResult[]>
}
```

### 3. File URL Generation
```typescript
// Generate stable URLs for database storage
function generateFileUrl(file: UploadedFile): string {
  return `/uploads/${file.category}/${file.folder}/${file.filename}`
}

// Example outputs:
"/uploads/products/images/stethoscope-1699123456-a1b2c3.jpg"
"/uploads/products/documents/manual-1699123456-b4c5d6.pdf"
```

## 📊 Database Schema Updates

### Product Media Table
```sql
CREATE TABLE product_media (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  type ENUM('image', 'document', 'video'),
  url VARCHAR(500) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  alt_text VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Bulk Upload Jobs Table
```sql
CREATE TABLE bulk_upload_jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  total_records INTEGER NOT NULL,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  uploaded_files JSONB, -- Array of uploaded file info
  error_log JSONB, -- Array of errors encountered
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

## 🔧 Implementation Steps

### Phase 1: Basic Multi-File Support
- [x] Create ImageUploadBox component
- [x] Replace URL inputs in forms with upload boxes
- [x] Keep CSV uploads with URL references
- [ ] Add MultipleImageUploadBox to product forms

### Phase 2: Bulk ZIP Upload
- [ ] Create BulkProductUpload component
- [ ] Implement ZIP extraction service
- [ ] Create file mapping interface
- [ ] Add batch processing API endpoints

### Phase 3: Enhanced Storage
- [ ] Implement file deduplication
- [ ] Add file compression/optimization
- [ ] Create automatic cleanup services
- [ ] Add file backup/sync options

## 🌐 File Access Strategies

### 1. Direct Server Storage (Current)
- **Pros**: Simple, fast access, full control
- **Cons**: Server disk space limitations, no CDN
- **Best for**: Development, small scale

### 2. Cloud Storage Integration
```typescript
interface CloudStorage {
  provider: 'aws-s3' | 'google-cloud' | 'azure-blob'
  bucket: string
  region: string
  cdnUrl?: string
}
```

### 3. Hybrid Approach
- Small files (< 1MB): Local storage
- Large files (> 1MB): Cloud storage
- Thumbnails: Always local for speed

## 📈 Performance Considerations

### File Processing
- **Image optimization**: Auto-resize, convert to WebP
- **Thumbnail generation**: 300x300, 150x150, 50x50
- **PDF processing**: Extract first page as preview image
- **Batch processing**: Process max 10 files concurrently

### Storage Limits
- **Max file size**: 20MB per file
- **Bulk upload limit**: 50MB total ZIP
- **Concurrent uploads**: 3 uploads per user
- **Disk space monitoring**: Alert at 80% capacity

## 🔍 File Matching Logic

### Automatic Matching
```typescript
function matchFileToProduct(filename: string, products: Product[]): Product | null {
  // 1. Exact product ID match: "product-123.jpg" -> product.id = 123
  // 2. SKU match: "SKU-ABC-001.jpg" -> product.sku = "SKU-ABC-001"
  // 3. Name similarity: "stethoscope-digital.jpg" -> fuzzy match product name
  // 4. Manual mapping required if no match
}
```

### Manual Mapping Interface
- Drag-and-drop file assignment
- Bulk selection tools
- Preview thumbnails
- Conflict resolution

## 🚨 Error Handling

### Common Scenarios
- **Duplicate files**: Auto-rename or merge
- **Missing files**: Mark as missing, continue processing
- **Corrupt files**: Skip and log error
- **Size exceeded**: Compress or reject
- **Invalid format**: Convert or reject

### Recovery Options
- **Partial success**: Save completed products, retry failures
- **Rollback**: Undo entire batch if critical errors
- **Manual correction**: Edit individual items post-upload

## 📋 User Interface Flow

### 1. Upload Selection
```
Choose upload method:
○ Individual product (current form)
○ Bulk CSV with URLs (current CSV)
○ Bulk ZIP with files (new feature)
```

### 2. File Upload Progress
```
Uploading... 📁 products-batch-01.zip (45/50 MB)
├─ Extracting files... ✓
├─ Parsing CSV... ✓
├─ Processing images... ⏳ (15/47)
├─ Processing documents... ⏳ (3/12)
└─ Creating products... ⏳ (8/20)
```

### 3. Results Summary
```
Bulk Upload Results ✅

✓ 18 products created successfully
⚠️ 2 products with warnings
❌ 1 product failed

View Details | Download Error Report | Try Again
```

This strategy provides a comprehensive approach to handling bulk uploads while maintaining the existing link-based system for CSV imports.