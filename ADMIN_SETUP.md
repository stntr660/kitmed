# KITMED Admin Panel - Setup Guide

This document provides comprehensive setup instructions for the KITMED back-office admin panel system.

## 🏗️ Architecture Overview

The admin panel is built with:
- **Frontend**: Next.js 14 with TypeScript and shadcn/ui components
- **Backend**: Next.js API routes with PostgreSQL database
- **Authentication**: JWT-based with role-based permissions
- **File Handling**: Image optimization with Sharp, CSV import/export
- **Database**: Prisma ORM with PostgreSQL

## 📋 Features Implemented

### ✅ Core Admin Features
- **Dashboard**: Real-time stats, recent activity, quick actions
- **Product Management**: CRUD operations, bulk import/export, media uploads
- **Category Management**: Hierarchical structure with translations
- **Partner Management**: Logo uploads, descriptions, contact info
- **RFP Dashboard**: Request management, status tracking, export capabilities
- **Content Management**: Banners, pages, homepage content
- **User Management**: Role-based access control, activity logging
- **File Upload System**: Image optimization, multiple formats, validation

### 🔐 Security & Authentication
- JWT-based authentication with secure HTTP-only cookies
- Role-based permissions (Admin, Editor, Viewer)
- Rate limiting for login attempts
- Activity logging and audit trails
- Password strength validation
- Session management

### 📊 Data Management
- CSV import/export for products, categories, partners
- Bulk operations for product management
- Advanced search and filtering
- Pagination and sorting
- Data validation with Zod schemas

## 🚀 Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/kitmed_db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"

# File Upload
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="10485760"

# Admin Settings
ADMIN_EMAIL="admin@kitmed.ma"
ADMIN_PASSWORD="admin123"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed initial data (optional)
npx prisma db seed
```

### 4. Create Upload Directories

```bash
mkdir -p public/uploads/products
mkdir -p public/uploads/partners
mkdir -p public/uploads/banners
mkdir -p public/uploads/documents
mkdir -p public/uploads/avatars
mkdir -p temp/csv
```

### 5. Start Development Server

```bash
npm run dev
```

The admin panel will be available at: `http://localhost:3000/admin`

## 👥 Default User Accounts

### Development Accounts
- **Admin**: admin@kitmed.ma / admin123
- **Editor**: editor@kitmed.ma / editor123
- **Viewer**: viewer@kitmed.ma / viewer123

## 🗂️ File Structure

```
src/
├── app/
│   ├── admin/                     # Admin pages
│   │   ├── page.tsx              # Dashboard
│   │   ├── login/page.tsx        # Login page
│   │   ├── products/page.tsx     # Product management
│   │   └── rfp-requests/page.tsx # RFP management
│   └── api/
│       └── admin/                # Admin API routes
│           ├── auth/             # Authentication
│           ├── products/         # Product management
│           ├── dashboard/        # Dashboard data
│           └── upload/           # File uploads
├── components/
│   ├── admin/                    # Admin components
│   │   ├── layout/              # Layout components
│   │   ├── dashboard/           # Dashboard widgets
│   │   ├── products/            # Product management
│   │   ├── rfp/                 # RFP management
│   │   ├── auth/                # Authentication forms
│   │   └── shared/              # Reusable components
│   └── ui/                      # Base UI components
├── lib/                         # Utility libraries
│   ├── auth.ts                  # Authentication logic
│   ├── database.ts              # Database utilities
│   ├── upload.ts                # File upload handling
│   ├── csv.ts                   # CSV import/export
│   └── utils.ts                 # General utilities
├── types/                       # TypeScript definitions
│   ├── index.ts                 # Core types
│   └── admin.ts                 # Admin-specific types
└── hooks/                       # React hooks
    └── useAdminAuth.ts          # Authentication hook
```

## 🔧 Configuration

### Upload Settings

Modify upload configurations in `src/lib/upload.ts`:

```typescript
export const uploadPresets = {
  productImage: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    generateThumbnail: true,
    optimizeImage: true,
  },
  // ... other presets
};
```

### Permission System

Configure permissions in `src/lib/auth.ts`:

```typescript
export const getDefaultPermissions = (role: string) => {
  switch (role) {
    case 'admin':
      return [/* full permissions */];
    case 'editor':
      return [/* limited permissions */];
    // ...
  }
};
```

## 📊 Admin Panel Features

### Dashboard
- Real-time statistics for products, RFPs, partners
- Recent activity feed
- Quick action buttons
- Performance metrics

### Product Management
- **List View**: Searchable, filterable product grid
- **CRUD Operations**: Create, read, update, delete products
- **Bulk Operations**: Mass update status, delete multiple items
- **CSV Import**: Bulk product import with validation
- **CSV Export**: Export filtered product data
- **Media Management**: Upload and manage product images/documents
- **Multilingual**: Support for EN/FR translations

### RFP Management
- **Request Dashboard**: View all customer requests
- **Status Tracking**: Pending, Processing, Responded, Closed
- **Response System**: Create quotes and proposals
- **Export Functionality**: Generate reports for analysis
- **Customer Communication**: Track interaction history

### Partner Management
- **Partner Profiles**: Company information and logos
- **Contact Management**: Store partner contact details
- **Status Control**: Active/inactive partner management
- **Logo Upload**: Image optimization and thumbnail generation

### Content Management
- **Banner System**: Homepage and category banners
- **Page Editor**: Create and edit static pages
- **SEO Management**: Meta titles, descriptions, keywords
- **Multilingual Content**: Support for multiple languages

### User Management
- **Role-Based Access**: Admin, Editor, Viewer roles
- **Permission System**: Granular resource and action permissions
- **Activity Logging**: Track all user actions
- **Session Management**: Secure login/logout handling

## 🛡️ Security Features

### Authentication
- JWT tokens with secure HTTP-only cookies
- Password strength validation
- Rate limiting on login attempts
- Session timeout and cleanup

### Authorization
- Role-based access control
- Resource-level permissions
- Action-specific permissions (create, read, update, delete)
- Protected API routes

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention with Prisma
- XSS protection with sanitized inputs
- CSRF protection with SameSite cookies

## 🔄 CSV Import/Export

### Product Import
1. Download CSV template from admin panel
2. Fill in product data following the format
3. Upload CSV file through the import interface
4. Review validation errors and warnings
5. Confirm import to add products to database

### Export Functionality
- Export filtered product lists
- Export RFP request data
- Export partner information
- Customizable field selection
- Date range filtering

## 📈 Performance Optimization

### Database
- Indexed queries for fast search
- Pagination for large datasets
- Connection pooling
- Query optimization with Prisma

### File Handling
- Image optimization with Sharp
- Thumbnail generation
- Progressive JPEG encoding
- File size validation

### Frontend
- Component lazy loading
- Efficient state management
- Debounced search inputs
- Optimistic UI updates

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check DATABASE_URL in .env.local
   # Ensure PostgreSQL is running
   npx prisma db push
   ```

2. **File Upload Failures**
   ```bash
   # Check upload directory permissions
   chmod 755 public/uploads
   # Verify MAX_FILE_SIZE setting
   ```

3. **Authentication Issues**
   ```bash
   # Verify JWT_SECRET is set
   # Check cookie settings in browser
   # Clear browser cache/cookies
   ```

4. **Import/Export Errors**
   ```bash
   # Check CSV format matches template
   # Verify file encoding (UTF-8)
   # Check required fields are present
   ```

## 🔄 Development Workflow

### Adding New Features
1. Create types in `src/types/admin.ts`
2. Add database models in `prisma/schema.prisma`
3. Create API routes in `src/app/api/admin/`
4. Build UI components in `src/components/admin/`
5. Add pages in `src/app/admin/`

### Testing
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests (if configured)
npm run test
```

## 🚀 Production Deployment

### Environment Setup
```env
# Production environment variables
NODE_ENV=production
DATABASE_URL="postgresql://prod_user:prod_pass@prod_host:5432/kitmed_prod"
JWT_SECRET="production-secure-secret-key"
UPLOAD_DIR="/app/uploads"
```

### Build Process
```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Security Checklist
- [ ] Strong JWT secret key
- [ ] Secure database credentials
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] File upload restrictions
- [ ] Regular security updates

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/admin/auth/login` - User login
- `GET /api/admin/auth/me` - Get current user
- `POST /api/admin/auth/logout` - User logout

### Product Endpoints
- `GET /api/admin/products` - List products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product
- `POST /api/admin/products/import` - Import CSV
- `POST /api/admin/products/export` - Export CSV

### File Upload Endpoints
- `POST /api/admin/upload` - Upload files
- `DELETE /api/admin/upload/[id]` - Delete file

This admin panel provides a comprehensive solution for managing the KITMED medical equipment catalog with modern security, performance, and user experience standards.