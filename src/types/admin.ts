// Admin Panel Types
import { BaseEntity, Product, Category, Partner, RFPRequest, User, Locale } from './index';

// Authentication Types
export interface AdminUser extends User {
  permissions: AdminPermission[];
  lastLoginAt?: Date;
  loginHistory: LoginHistory[];
}

export interface AdminPermission {
  resource: AdminResource;
  actions: AdminAction[];
}

export type AdminResource = 
  | 'products' 
  | 'categories' 
  | 'partners' 
  | 'rfp_requests' 
  | 'users' 
  | 'content' 
  | 'analytics'
  | 'settings';

export type AdminAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'import';

export interface LoginHistory {
  id: string;
  loginAt: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}

// Dashboard Types
export interface AdminDashboardStats {
  products: {
    total: number;
    active: number;
    featured: number;
    recentlyAdded: number;
  };
  rfpRequests: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
  };
  partners: {
    total: number;
    active: number;
    featured: number;
  };
  categories: {
    total: number;
    active: number;
    withProducts: number;
  };
}

// Product Management Types
export interface ProductFormData {
  referenceFournisseur: string; // Référence fournisseur (Ref frs)
  constructeur: string; // Constructeur (Nom du fabricant ou de la marque)
  categoryId: string; // Catégorie / Discipline
  nom: Record<Locale, string>; // Nom du produit (FR / EN)
  description?: Record<Locale, string>; // Description (FR / EN)
  ficheTechnique?: Record<Locale, string>; // Fiche technique (FR / EN)
  pdfBrochureUrl?: string; // PDF brochure téléchargeable
  status: 'active' | 'inactive' | 'discontinued';
  featured: boolean;
  seo?: SEOFormData;
}

export interface ProductSpecificationInput {
  name: Record<Locale, string>;
  value: Record<Locale, string>;
  unit?: string;
  category: string;
  order: number;
}

export interface SEOFormData {
  title?: Record<Locale, string>;
  description?: Record<Locale, string>;
  keywords?: string[];
  canonical?: string;
  noIndex?: boolean;
}

// File Upload Types
export interface FileUploadResult {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  alt?: Record<Locale, string>;
  width?: number;
  height?: number;
}

export interface BulkUploadResult {
  success: number;
  failed: number;
  errors: BulkUploadError[];
  results: FileUploadResult[];
}

export interface BulkUploadError {
  row: number;
  field: string;
  message: string;
}

// CSV Import/Export Types
export interface CSVImportResult {
  success: number;
  failed: number;
  errors: CSVImportError[];
  warnings: CSVImportWarning[];
}

export interface CSVImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface CSVImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface CSVExportOptions {
  format: 'products' | 'rfp_requests' | 'partners';
  filters?: Record<string, any>;
  fields?: string[];
  includeTranslations?: boolean;
}

// Category Management Types
export interface CategoryFormData {
  name: Record<Locale, string>;
  description?: Record<Locale, string>;
  slug: string;
  parentId?: string;
  image?: string;
  order: number;
  isActive: boolean;
  seo?: SEOFormData;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  level: number;
  productCount: number;
}

// Partner Management Types
export interface PartnerFormData {
  name: string;
  description?: Record<Locale, string>;
  website?: string;
  type: 'distributor' | 'manufacturer' | 'service' | 'technology';
  country: string;
  regions: string[];
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    position?: string;
  };
  featured: boolean;
  order: number;
  isActive: boolean;
}

// RFP Management Types
export interface RFPRequestWithDetails extends RFPRequest {
  itemCount: number;
  totalQuantity: number;
  estimatedValue?: number;
  lastActivity?: Date;
  assignedTo?: AdminUser;
}

export interface RFPResponseData {
  message: string;
  attachments: FileUploadResult[];
  validUntil?: Date;
  itemResponses: RFPItemResponse[];
}

export interface RFPItemResponse {
  itemId: string;
  quotedPrice?: number;
  availability: 'in-stock' | 'on-order' | 'discontinued' | 'custom';
  leadTime?: string;
  notes?: string;
}

// Content Management Types
export interface BannerFormData {
  title: Record<Locale, string>;
  subtitle?: Record<Locale, string>;
  image?: string;
  ctaText?: Record<Locale, string>;
  ctaUrl?: string;
  position: 'homepage' | 'category' | 'product';
  order: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface PageFormData {
  title: Record<Locale, string>;
  slug: string;
  content: Record<Locale, string>;
  excerpt?: Record<Locale, string>;
  status: 'draft' | 'published' | 'archived';
  type: 'page' | 'article' | 'news';
  seo?: SEOFormData;
}

// Analytics Types
export interface AnalyticsData {
  pageViews: {
    total: number;
    unique: number;
    change: number;
  };
  topPages: Array<{
    path: string;
    views: number;
    change: number;
  }>;
  rfpConversion: {
    requests: number;
    responses: number;
    rate: number;
  };
  productPerformance: Array<{
    productId: string;
    name: string;
    views: number;
    rfpRequests: number;
    conversionRate: number;
  }>;
}

// Search and Filtering Types
export interface AdminSearchFilters {
  query?: string;
  status?: string[];
  category?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface AdminSearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: AdminSearchFilters;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  userId: string;
  user: AdminUser;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Settings Types
export interface AdminSettings {
  site: {
    name: Record<Locale, string>;
    description: Record<Locale, string>;
    logo?: string;
    favicon?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  rfp: {
    autoAssignment: boolean;
    defaultAssignee?: string;
    responseTimeLimit: number; // hours
    requiredFields: string[];
  };
  uploads: {
    maxFileSize: number; // bytes
    allowedImageTypes: string[];
    allowedDocumentTypes: string[];
    storageProvider: 'local' | 's3' | 'cloudinary';
    storageConfig: Record<string, any>;
  };
}

// Form Validation Types
export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormFieldError[];
}

// Table/Grid Types
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export interface TableAction<T = any> {
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive' | 'outline';
  onClick: (item: T) => void;
  disabled?: (item: T) => boolean;
  visible?: (item: T) => boolean;
}

// Navigation Types
export interface AdminNavItem {
  id: string;
  label: Record<Locale, string>;
  icon: string;
  href?: string;
  children?: AdminNavItem[];
  permission?: AdminResource;
  badge?: {
    text: string;
    variant: 'default' | 'destructive' | 'secondary';
  };
}

// Notification Types
export interface AdminNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}