import { parse } from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { Readable } from 'stream';
import { join } from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';
import type { Product, Category, Partner, RFPRequest } from '@prisma/client';
import type { CSVImportResult, CSVImportError, CSVImportWarning } from '@/types/admin';

const CSV_DIR = join(process.cwd(), 'temp', 'csv');

// Ensure CSV directory exists
async function ensureCSVDir(): Promise<void> {
  await mkdir(CSV_DIR, { recursive: true });
}

// Product CSV import/export
export const productCSV = {
  // Define CSV headers for products
  headers: [
    { id: 'sku', title: 'SKU' },
    { id: 'name_en', title: 'Name (EN)' },
    { id: 'name_fr', title: 'Name (FR)' },
    { id: 'short_description_en', title: 'Short Description (EN)' },
    { id: 'short_description_fr', title: 'Short Description (FR)' },
    { id: 'long_description_en', title: 'Long Description (EN)' },
    { id: 'long_description_fr', title: 'Long Description (FR)' },
    { id: 'category_slug', title: 'Category Slug' },
    { id: 'status', title: 'Status' },
    { id: 'is_featured', title: 'Featured' },
    { id: 'sort_order', title: 'Sort Order' },
    { id: 'meta_title_en', title: 'Meta Title (EN)' },
    { id: 'meta_title_fr', title: 'Meta Title (FR)' },
    { id: 'meta_description_en', title: 'Meta Description (EN)' },
    { id: 'meta_description_fr', title: 'Meta Description (FR)' },
  ],

  // Export products to CSV
  async export(products: any[], filename?: string): Promise<string> {
    await ensureCSVDir();

    const exportFilename = filename || `products-export-${Date.now()}.csv`;
    const filePath = join(CSV_DIR, exportFilename);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: this.headers,
    });

    const records = products.map(product => ({
      sku: product.sku,
      name_en: product.translations?.find((t: any) => t.languageCode === 'en')?.name || product.name,
      name_fr: product.translations?.find((t: any) => t.languageCode === 'fr')?.name || '',
      short_description_en: product.translations?.find((t: any) => t.languageCode === 'en')?.shortDescription || product.shortDescription || '',
      short_description_fr: product.translations?.find((t: any) => t.languageCode === 'fr')?.shortDescription || '',
      long_description_en: product.translations?.find((t: any) => t.languageCode === 'en')?.longDescription || product.longDescription || '',
      long_description_fr: product.translations?.find((t: any) => t.languageCode === 'fr')?.longDescription || '',
      category_slug: product.category?.slug || '',
      status: product.status,
      is_featured: product.isFeatured ? 'Yes' : 'No',
      sort_order: product.sortOrder || 0,
      meta_title_en: product.translations?.find((t: any) => t.languageCode === 'en')?.metaTitle || product.metaTitle || '',
      meta_title_fr: product.translations?.find((t: any) => t.languageCode === 'fr')?.metaTitle || '',
      meta_description_en: product.translations?.find((t: any) => t.languageCode === 'en')?.metaDescription || product.metaDescription || '',
      meta_description_fr: product.translations?.find((t: any) => t.languageCode === 'fr')?.metaDescription || '',
    }));

    await csvWriter.writeRecords(records);
    return filePath;
  },

  // Import products from CSV
  async import(file: File): Promise<CSVImportResult> {
    const results: any[] = [];
    const errors: CSVImportError[] = [];
    const warnings: CSVImportWarning[] = [];
    let rowNumber = 0;

    return new Promise((resolve, reject) => {
      const stream = Readable.from(file.stream());

      stream
        .pipe(parse({ headers: true }))
        .on('data', (row: any) => {
          rowNumber++;

          try {
            // Validate required fields
            if (!row.sku || !row.name_en) {
              errors.push({
                row: rowNumber,
                field: !row.sku ? 'sku' : 'name_en',
                value: !row.sku ? row.sku : row.name_en,
                message: 'Required field is missing',
              });
              return;
            }

            // Validate status
            const validStatuses = ['active', 'inactive', 'discontinued'];
            if (row.status && !validStatuses.includes(row.status)) {
              warnings.push({
                row: rowNumber,
                field: 'status',
                message: `Invalid status "${row.status}", defaulting to "active"`,
              });
              row.status = 'active';
            }

            // Transform the row data
            const productData = {
              sku: row.sku.trim(),
              name: row.name_en.trim(),
              slug: row.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              shortDescription: row.short_description_en?.trim() || null,
              longDescription: row.long_description_en?.trim() || null,
              status: row.status || 'active',
              isFeatured: ['yes', 'true', '1'].includes(row.is_featured?.toLowerCase() || 'no'),
              sortOrder: parseInt(row.sort_order) || 0,
              metaTitle: row.meta_title_en?.trim() || null,
              metaDescription: row.meta_description_en?.trim() || null,
              translations: [
                {
                  languageCode: 'en',
                  name: row.name_en.trim(),
                  shortDescription: row.short_description_en?.trim() || null,
                  longDescription: row.long_description_en?.trim() || null,
                  metaTitle: row.meta_title_en?.trim() || null,
                  metaDescription: row.meta_description_en?.trim() || null,
                },
                ...(row.name_fr ? [{
                  languageCode: 'fr',
                  name: row.name_fr.trim(),
                  shortDescription: row.short_description_fr?.trim() || null,
                  longDescription: row.long_description_fr?.trim() || null,
                  metaTitle: row.meta_title_fr?.trim() || null,
                  metaDescription: row.meta_description_fr?.trim() || null,
                }] : []),
              ],
              categorySlug: row.category_slug?.trim(),
            };

            results.push(productData);
          } catch (error) {
            errors.push({
              row: rowNumber,
              field: 'general',
              value: JSON.stringify(row),
              message: `Processing error: ${error.message}`,
            });
          }
        })
        .on('end', () => {
          resolve({
            success: results.length,
            failed: errors.length,
            errors,
            warnings,
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  },

  // Get sample CSV template
  getSampleData(): any[] {
    return [
      {
        sku: 'PROD-001',
        name_en: 'Sample Product',
        name_fr: 'Produit Exemple',
        short_description_en: 'A sample medical device',
        short_description_fr: 'Un dispositif médical exemple',
        long_description_en: 'Detailed description of the sample medical device...',
        long_description_fr: 'Description détaillée du dispositif médical exemple...',
        category_slug: 'ophthalmology',
        status: 'active',
        is_featured: 'No',
        sort_order: '0',
        meta_title_en: 'Sample Product - Medical Equipment',
        meta_title_fr: 'Produit Exemple - Équipement Médical',
        meta_description_en: 'High-quality medical device for healthcare professionals',
        meta_description_fr: 'Dispositif médical de haute qualité pour les professionnels de la santé',
      },
    ];
  },
};

// Partner CSV import/export
export const partnerCSV = {
  headers: [
    { id: 'name', title: 'Name' },
    { id: 'slug', title: 'Slug' },
    { id: 'description_en', title: 'Description (EN)' },
    { id: 'description_fr', title: 'Description (FR)' },
    { id: 'website_url', title: 'Website URL' },
    { id: 'logo_url', title: 'Logo URL' },
    { id: 'is_featured', title: 'Featured' },
    { id: 'sort_order', title: 'Sort Order' },
    { id: 'status', title: 'Status' },
  ],

  async export(partners: any[], filename?: string): Promise<string> {
    await ensureCSVDir();

    const exportFilename = filename || `partners-export-${Date.now()}.csv`;
    const filePath = join(CSV_DIR, exportFilename);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: this.headers,
    });

    const records = partners.map(partner => ({
      name: partner.name,
      slug: partner.slug,
      description_en: partner.translations?.find((t: any) => t.languageCode === 'en')?.description || partner.description || '',
      description_fr: partner.translations?.find((t: any) => t.languageCode === 'fr')?.description || '',
      website_url: partner.websiteUrl || '',
      logo_url: partner.logoUrl || '',
      is_featured: partner.isFeatured ? 'Yes' : 'No',
      sort_order: partner.sortOrder || 0,
      status: partner.status,
    }));

    await csvWriter.writeRecords(records);
    return filePath;
  },

  async import(file: File): Promise<CSVImportResult> {
    const results: any[] = [];
    const errors: CSVImportError[] = [];
    const warnings: CSVImportWarning[] = [];
    let rowNumber = 0;

    return new Promise((resolve, reject) => {
      const stream = Readable.from(file.stream());

      stream
        .pipe(parse({ headers: true }))
        .on('data', (row: any) => {
          rowNumber++;

          try {
            if (!row.name) {
              errors.push({
                row: rowNumber,
                field: 'name',
                value: row.name,
                message: 'Name is required',
              });
              return;
            }

            const partnerData = {
              name: row.name.trim(),
              slug: row.slug?.trim() || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              description: row.description_en?.trim() || null,
              websiteUrl: row.website_url?.trim() || null,
              logoUrl: row.logo_url?.trim() || null,
              isFeatured: ['yes', 'true', '1'].includes(row.is_featured?.toLowerCase() || 'no'),
              sortOrder: parseInt(row.sort_order) || 0,
              status: row.status || 'active',
              translations: [
                ...(row.description_en ? [{
                  languageCode: 'en',
                  name: row.name.trim(),
                  description: row.description_en.trim(),
                }] : []),
                ...(row.description_fr ? [{
                  languageCode: 'fr',
                  name: row.name.trim(),
                  description: row.description_fr.trim(),
                }] : []),
              ],
            };

            results.push(partnerData);
          } catch (error) {
            errors.push({
              row: rowNumber,
              field: 'general',
              value: JSON.stringify(row),
              message: `Processing error: ${error.message}`,
            });
          }
        })
        .on('end', () => {
          resolve({
            success: results.length,
            failed: errors.length,
            errors,
            warnings,
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  },
};

// RFP CSV export
export const rfpCSV = {
  headers: [
    { id: 'reference_number', title: 'Reference Number' },
    { id: 'status', title: 'Status' },
    { id: 'customer_name', title: 'Customer Name' },
    { id: 'customer_email', title: 'Customer Email' },
    { id: 'customer_phone', title: 'Customer Phone' },
    { id: 'company_name', title: 'Company Name' },
    { id: 'company_address', title: 'Company Address' },
    { id: 'contact_person', title: 'Contact Person' },
    { id: 'urgency_level', title: 'Urgency Level' },
    { id: 'item_count', title: 'Item Count' },
    { id: 'total_quantity', title: 'Total Quantity' },
    { id: 'quote_amount', title: 'Quote Amount' },
    { id: 'created_at', title: 'Created At' },
    { id: 'updated_at', title: 'Updated At' },
  ],

  async export(rfpRequests: any[], filename?: string): Promise<string> {
    await ensureCSVDir();

    const exportFilename = filename || `rfp-requests-export-${Date.now()}.csv`;
    const filePath = join(CSV_DIR, exportFilename);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: this.headers,
    });

    const records = rfpRequests.map(rfp => ({
      reference_number: rfp.referenceNumber,
      status: rfp.status,
      customer_name: rfp.customerName,
      customer_email: rfp.customerEmail,
      customer_phone: rfp.customerPhone || '',
      company_name: rfp.companyName || '',
      company_address: rfp.companyAddress || '',
      contact_person: rfp.contactPerson || '',
      urgency_level: rfp.urgencyLevel,
      item_count: rfp.items?.length || 0,
      total_quantity: rfp.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      quote_amount: rfp.quoteAmount || '',
      created_at: rfp.createdAt?.toISOString() || '',
      updated_at: rfp.updatedAt?.toISOString() || '',
    }));

    await csvWriter.writeRecords(records);
    return filePath;
  },
};

// Category CSV import/export
export const categoryCSV = {
  headers: [
    { id: 'name_en', title: 'Name (EN)' },
    { id: 'name_fr', title: 'Name (FR)' },
    { id: 'slug', title: 'Slug' },
    { id: 'description_en', title: 'Description (EN)' },
    { id: 'description_fr', title: 'Description (FR)' },
    { id: 'parent_slug', title: 'Parent Slug' },
    { id: 'sort_order', title: 'Sort Order' },
    { id: 'is_active', title: 'Active' },
    { id: 'image_url', title: 'Image URL' },
  ],

  async export(categories: any[], filename?: string): Promise<string> {
    await ensureCSVDir();

    const exportFilename = filename || `categories-export-${Date.now()}.csv`;
    const filePath = join(CSV_DIR, exportFilename);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: this.headers,
    });

    const records = categories.map(category => ({
      name_en: category.translations?.find((t: any) => t.languageCode === 'en')?.name || category.name,
      name_fr: category.translations?.find((t: any) => t.languageCode === 'fr')?.name || '',
      slug: category.slug,
      description_en: category.translations?.find((t: any) => t.languageCode === 'en')?.description || category.description || '',
      description_fr: category.translations?.find((t: any) => t.languageCode === 'fr')?.description || '',
      parent_slug: category.parent?.slug || '',
      sort_order: category.sortOrder || 0,
      is_active: category.isActive ? 'Yes' : 'No',
      image_url: category.imageUrl || '',
    }));

    await csvWriter.writeRecords(records);
    return filePath;
  },

  async import(file: File): Promise<CSVImportResult> {
    const results: any[] = [];
    const errors: CSVImportError[] = [];
    const warnings: CSVImportWarning[] = [];
    let rowNumber = 0;

    return new Promise((resolve, reject) => {
      const stream = Readable.from(file.stream());

      stream
        .pipe(parse({ headers: true }))
        .on('data', (row: any) => {
          rowNumber++;

          try {
            if (!row.name_en || !row.slug) {
              errors.push({
                row: rowNumber,
                field: !row.name_en ? 'name_en' : 'slug',
                value: !row.name_en ? row.name_en : row.slug,
                message: 'Required field is missing',
              });
              return;
            }

            const categoryData = {
              name: row.name_en.trim(),
              slug: row.slug.trim(),
              description: row.description_en?.trim() || null,
              sortOrder: parseInt(row.sort_order) || 0,
              isActive: ['yes', 'true', '1'].includes(row.is_active?.toLowerCase() || 'yes'),
              imageUrl: row.image_url?.trim() || null,
              parentSlug: row.parent_slug?.trim() || null,
              translations: [
                {
                  languageCode: 'en',
                  name: row.name_en.trim(),
                  description: row.description_en?.trim() || null,
                },
                ...(row.name_fr ? [{
                  languageCode: 'fr',
                  name: row.name_fr.trim(),
                  description: row.description_fr?.trim() || null,
                }] : []),
              ],
            };

            results.push(categoryData);
          } catch (error) {
            errors.push({
              row: rowNumber,
              field: 'general',
              value: JSON.stringify(row),
              message: `Processing error: ${error.message}`,
            });
          }
        })
        .on('end', () => {
          resolve({
            success: results.length,
            failed: errors.length,
            errors,
            warnings,
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  },
};

// Utility functions
export const csvUtils = {
  // Generate sample CSV file
  async generateSample(type: 'products' | 'categories' | 'partners'): Promise<string> {
    await ensureCSVDir();

    const filename = `${type}-sample-template.csv`;
    const filePath = join(CSV_DIR, filename);

    let headers: any[] = [];
    let sampleData: any[] = [];

    switch (type) {
      case 'products':
        headers = productCSV.headers;
        sampleData = productCSV.getSampleData();
        break;
      case 'categories':
        headers = categoryCSV.headers;
        sampleData = [{
          name_en: 'Sample Category',
          name_fr: 'Catégorie Exemple',
          slug: 'sample-category',
          description_en: 'A sample medical category',
          description_fr: 'Une catégorie médicale exemple',
          parent_slug: '',
          sort_order: '0',
          is_active: 'Yes',
          image_url: '',
        }];
        break;
      case 'partners':
        headers = partnerCSV.headers;
        sampleData = [{
          name: 'Sample Partner',
          slug: 'sample-partner',
          description_en: 'A sample medical partner',
          description_fr: 'Un partenaire médical exemple',
          website_url: 'https://example.com',
          logo_url: '',
          is_featured: 'No',
          sort_order: '0',
          status: 'active',
        }];
        break;
    }

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    await csvWriter.writeRecords(sampleData);
    return filePath;
  },

  // Clean up temporary CSV files
  async cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    const { readdir, stat, unlink } = await import('fs/promises');

    try {
      const files = await readdir(CSV_DIR);
      const now = Date.now();

      for (const file of files) {
        const filePath = join(CSV_DIR, file);
        const stats = await stat(filePath);

        if (stats.isFile() && (now - stats.mtime.getTime()) > maxAgeMs) {
          await unlink(filePath);
        }
      }
    } catch (error) {
      console.error('CSV cleanup failed:', error);
    }
  },
};