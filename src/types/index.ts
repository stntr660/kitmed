// Core Types
export type Locale = 'en' | 'fr';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Product Types
export interface Product extends BaseEntity {
  referenceFournisseur: string; // Référence fournisseur (Ref frs)
  constructeur: string; // Constructeur (Nom du fabricant ou de la marque)
  slug: string;
  categoryId: string;
  status: 'active' | 'inactive' | 'discontinued';
  featured: boolean;
  pdfBrochureUrl?: string; // PDF brochure téléchargeable
  
  // Multilingual fields via translations
  nom: Record<Locale, string>; // Nom du produit (FR / EN)
  description?: Record<Locale, string>; // Description (FR / EN)
  ficheTechnique?: Record<Locale, string>; // Fiche technique (FR / EN)
  
  // Relations
  category: Category;
  images: ProductImage[];
  documents: ProductDocument[];
  translations: ProductTranslation[];
  media: ProductMedia[];
  attributes: ProductAttribute[];
  
  seo?: SEOData;
}

export interface ProductTranslation {
  id: string;
  productId: string;
  languageCode: string;
  nom: string; // Nom du produit (FR / EN)
  description?: string; // Description (FR / EN)
  ficheTechnique?: string; // Fiche technique (FR / EN)
  metaTitle?: string;
  metaDescription?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: Record<Locale, string>;
  width: number;
  height: number;
  isPrimary: boolean;
  order: number;
}

export interface ProductSpecification {
  id: string;
  name: Record<Locale, string>;
  value: Record<Locale, string>;
  unit?: string;
  category: string;
  order: number;
}

export interface ProductDocument {
  id: string;
  name: Record<Locale, string>;
  description?: Record<Locale, string>;
  url: string;
  type: 'manual' | 'brochure' | 'specification' | 'certificate' | 'other';
  size: number;
  mimeType: string;
}

// Category & Classification Types
export interface Category extends BaseEntity {
  name: Record<Locale, string>;
  description?: Record<Locale, string>;
  slug: string;
  parentId?: string;
  children?: Category[];
  image?: string;
  order: number;
  isActive: boolean;
}

export interface Manufacturer extends BaseEntity {
  name: string;
  description?: Record<Locale, string>;
  logo?: string;
  website?: string;
  country: string;
  isActive: boolean;
}

export interface Discipline extends BaseEntity {
  name: Record<Locale, string>;
  description?: Record<Locale, string>;
  slug: string;
  color: string;
  icon: string;
  order: number;
  isActive: boolean;
}

// RFP (Request for Proposal) Types
export interface RFPItem {
  productId: string;
  product: Product;
  quantity: number;
  notes?: string;
  specifications?: Record<string, string>;
  addedAt: Date;
}

export interface RFPCart {
  items: RFPItem[];
  updatedAt: Date;
}

export interface RFPRequest extends BaseEntity {
  requestNumber: string;
  company: CompanyInfo;
  contact: ContactInfo;
  items: RFPItem[];
  message?: string;
  urgency: 'low' | 'medium' | 'high';
  budget?: {
    min?: number;
    max?: number;
    currency: string;
  };
  deliveryRequirements?: string;
  status: 'draft' | 'submitted' | 'processing' | 'responded' | 'closed';
  submittedAt?: Date;
  respondedAt?: Date;
  response?: RFPResponse;
}

export interface RFPResponse {
  id: string;
  requestId: string;
  message: string;
  documents: RFPDocument[];
  validUntil?: Date;
  createdAt: Date;
  createdBy: string;
}

// Partner Management
export interface Partner {
  id: string;
  slug: string;
  nom: {
    fr: string;
    en?: string;
  };
  description?: {
    fr?: string;
    en?: string;
  };
  websiteUrl?: string;
  logoUrl?: string;
  status: 'active' | 'inactive';
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  translations?: PartnerTranslation[];
}

export interface PartnerTranslation {
  id: string;
  partnerId: string;
  languageCode: 'fr' | 'en';
  name: string;
  description?: string;
}

export interface RFPDocument {
  id: string;
  name: string;
  description?: string;
  url: string;
  type: 'quote' | 'proposal' | 'specification' | 'other';
  size: number;
  mimeType: string;
}

// Company & Contact Types
export interface CompanyInfo {
  name: string;
  type: 'hospital' | 'clinic' | 'laboratory' | 'distributor' | 'other';
  address: Address;
  phone?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// Partner Types
export interface Partner extends BaseEntity {
  name: string;
  description?: Record<Locale, string>;
  logo?: string;
  website?: string;
  type: 'distributor' | 'manufacturer' | 'service' | 'technology';
  country: string;
  regions: string[];
  contact: ContactInfo;
  featured: boolean;
  order: number;
  isActive: boolean;
}

// Content Management Types
export interface Page extends BaseEntity {
  title: Record<Locale, string>;
  slug: string;
  content: Record<Locale, string>;
  excerpt?: Record<Locale, string>;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  seo?: SEOData;
  type: 'page' | 'article' | 'news';
}

export interface SEOData {
  title?: Record<Locale, string>;
  description?: Record<Locale, string>;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

// User & Admin Types
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  isActive: boolean;
  lastLoginAt?: Date;
  
  // Contact information
  phone?: string;
  department?: string;
  avatarUrl?: string;
  
  // Security features
  twoFactorEnabled: boolean;
  loginAttempts: number;
  lastLoginIP?: string;
  accountLockedUntil?: Date;
  passwordLastChanged?: Date;
  mustChangePassword?: boolean;
  
  // Activity tracking
  sessionCount?: number;
  totalLoginTime?: number; // in minutes
  lastActiveAt?: Date;
  
  // Permissions
  permissions?: UserPermission[];
  customPermissions?: UserPermission[];
  
  // Preferences
  preferences?: UserPreferences;
}

export interface UserPermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'export' | 'import')[];
  conditions?: Record<string, any>; // For conditional permissions
}

export interface UserActivity extends BaseEntity {
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface UserSession extends BaseEntity {
  userId: string;
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  loginAt: Date;
  lastActiveAt: Date;
  logoutAt?: Date;
  isActive: boolean;
  duration?: number; // in minutes
}

export interface UserPreferences {
  language: Locale;
  timezone: string;
  notifications: {
    email: boolean;
    browser: boolean;
  };
}

// Search & Filter Types
export interface SearchFilters {
  query?: string;
  categories?: string[];
  manufacturers?: string[];
  disciplines?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  featured?: boolean;
  inStock?: boolean;
}

export interface SearchResult<T = Product> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets?: SearchFacets;
}

export interface SearchFacets {
  categories: FacetItem[];
  manufacturers: FacetItem[];
  disciplines: FacetItem[];
  priceRanges: FacetItem[];
}

export interface FacetItem {
  value: string;
  label: Record<Locale, string>;
  count: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    version: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

// Form Types
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  privacy: boolean;
}

export interface RFPFormData {
  company: CompanyInfo;
  contact: ContactInfo;
  message?: string;
  urgency: 'low' | 'medium' | 'high';
  budget?: {
    min?: number;
    max?: number;
    currency: string;
  };
  deliveryRequirements?: string;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ImageProps extends BaseComponentProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}