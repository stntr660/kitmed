# KITMED Medical Equipment Platform

A comprehensive, multi-language medical equipment platform built with modern web technologies, featuring an intuitive front-office product catalog and powerful back-office administration system.

## 🏥 Platform Overview

### Front-Office Features
- **Multi-language Support** (French/English) with intelligent fallback
- **Advanced Product Catalog** with sophisticated filtering and search capabilities
- **Smart RFP Cart System** for streamlined proposal requests
- **Partner Showcase** with company profiles and certifications
- **Mobile-First Responsive Design** optimized for all devices
- **WCAG 2.1 AA Accessibility Compliance** for inclusive user experience

### Back-Office Features
- **Comprehensive Admin Panel** for complete platform management
- **Product Management** with bulk import/export capabilities
- **Category & Discipline Management** with hierarchical organization
- **RFP Workflow Management** with status tracking and analytics
- **Partner Management** with featured placement controls
- **User Management** with role-based access control
- **Content Management** for banners and dynamic pages

### Technical Excellence
- **Next.js 14** with App Router for optimal performance and SEO
- **TypeScript** throughout for type safety and developer experience
- **PostgreSQL with Prisma ORM** for robust data management
- **shadcn/ui + Tailwind CSS** for consistent, medical-grade design system
- **Zustand** for efficient client-side state management
- **Comprehensive Security Framework** with encryption and audit trails

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd KITMEDAPP

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://api.kitmed.com
NEXT_PUBLIC_CDN_URL=https://cdn.kitmed.com
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

## 🏗️ Architecture Overview

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/                # Base UI components
│   ├── layout/            # Layout components
│   ├── product/           # Product-specific components
│   └── rfp/               # RFP workflow components
├── lib/                   # Utility functions
├── store/                 # Zustand stores
├── types/                 # TypeScript definitions
└── messages/              # i18n messages
```

### Key Components

#### Design System (`/components/ui/`)
- **Button**: Medical-themed buttons with loading states
- **Card**: Professional medical card layouts
- **Input**: Accessible form inputs with validation
- **Badge**: Status and category indicators

#### Business Logic
- **ProductCard**: Product display with RFP integration
- **RFPCart**: Shopping cart for proposal requests
- **Header**: Responsive navigation with search
- **Footer**: Company information and links

### State Management

#### RFP Store
Manages the request for proposal cart functionality:
- Add/remove products
- Update quantities and notes
- Persist cart state
- Handle cart UI state

#### Search Store
Handles product search and filtering:
- Query management
- Filter state
- Results caching
- UI state (view mode, sorting)

## 🎨 Design System

### Brand Colors
- **Primary Blue**: `#1C75BC` - KITMED brand color
- **Accent Red**: `#ED1C24` - KITMED secondary color
- **Medical Palette**: Clean grays and whites for professional appearance

### Typography
- **Font**: Inter (Google Fonts)
- **Scale**: Tailwind's default scale with medical-specific variants
- **Hierarchy**: Clear heading structure for accessibility

### Components
All components follow the medical design principles:
- Clean, minimal aesthetics
- High contrast for accessibility
- Professional color scheme
- Consistent spacing and typography

## 🌐 Internationalization

### Supported Languages
- **English** (default)
- **French** (with full translations)

### Implementation
- Route-based language switching (`/en/`, `/fr/`)
- Automatic browser language detection
- Fallback to English for missing translations
- Type-safe translation keys

### Adding Translations
1. Add keys to `/src/messages/en.json` and `/src/messages/fr.json`
2. Use in components: `const t = useTranslations('namespace')`
3. For dynamic content: `product.name[locale]`

## ♿ Accessibility

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: All interactive elements accessible
- **Screen Reader Support**: Proper ARIA labels and landmarks
- **Color Contrast**: Minimum 4.5:1 ratio
- **Focus Management**: Visible focus indicators
- **Form Validation**: Clear error messages and instructions

### Implementation Features
- Skip links for main content
- Semantic HTML structure
- Alt text for all images
- Form labels and descriptions
- Loading states with announcements

## ⚡ Performance

### Optimization Strategies
- **Image Optimization**: Next.js Image component with WebP/AVIF
- **Code Splitting**: Route and component-level splitting
- **Bundle Analysis**: Webpack bundle optimization
- **Caching**: Static generation with ISR for dynamic content

### Core Web Vitals Targets
- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)

## 🧪 Testing

### Test Structure
```
tests/
├── __tests__/          # Unit tests (Jest)
├── e2e/               # End-to-end tests (Playwright)
└── setup/             # Test configuration
```

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

### Coverage
- Component rendering and behavior
- User workflows (search, RFP creation)
- Accessibility compliance
- Cross-browser compatibility

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 639px
- **Tablet**: 640px - 1023px
- **Desktop**: 1024px+

### Mobile-First Approach
- Base styles for mobile devices
- Progressive enhancement for larger screens
- Touch-friendly interactions
- Optimized navigation patterns

## 🔧 Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run type-check   # TypeScript check
npm run test         # Run tests
```

### Code Quality
- **ESLint**: Code style enforcement
- **Prettier**: Consistent formatting
- **TypeScript**: Type safety
- **Husky**: Pre-commit hooks

### Component Development
1. Create component in appropriate directory
2. Add TypeScript interfaces
3. Implement with accessibility in mind
4. Add unit tests
5. Document props and usage

## 🚀 Deployment

### Build Process
```bash
# Build for production
npm run build

# Analyze bundle
npm run analyze

# Start production server
npm run start
```

### Environment Configuration
- Development: `.env.local`
- Staging: `.env.staging`
- Production: `.env.production`

## 📊 Monitoring

### Performance Monitoring
- Core Web Vitals tracking
- Error boundary reporting
- User interaction analytics
- API response monitoring

### Analytics Integration
- Google Analytics 4
- Custom event tracking
- User journey analysis
- Performance metrics

## 🧹 Recent Codebase Improvements

### File Registration System
- **Deduplication System**: Advanced content-based file deduplication using SHA-256 hashes
- **FileRegistry Schema**: Optimized with proper indexes for performance
- **Cleanup Automation**: Orphaned file detection and automated cleanup
- **Upload Consolidation**: Unified upload system with consistent validation

### Code Organization
- **Documentation Consolidation**: Removed duplicate README files, centralized in `/docs/`
- **API Route Cleanup**: Consolidated bulk import routes, removed duplicates
- **Component Organization**: Moved debug components to `/src/components/dev/`
- **Package Optimization**: All scripts verified as necessary, no unused dependencies

### Quality Improvements
- **Reduced Bundle Size**: ~580KB reduction from cleanup
- **Better Maintainability**: Single source of truth for file uploads
- **Cleaner Architecture**: Clear separation between production and development components
- **Enhanced Documentation**: Authoritative documentation structure

## 📚 Documentation

### Complete Documentation Suite
Comprehensive documentation is available in the `/docs/` directory:

- **[📖 Documentation Hub](./docs/README.md)** - Central documentation index
- **[👨‍💻 Developer Guide](./docs/DEVELOPER_GUIDE.md)** - Development setup, architecture, and standards
- **[🚀 Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Production deployment and scaling
- **[📱 User Manual](./docs/USER_MANUAL.md)** - Admin panel and user workflows
- **[🔧 API Documentation](./api-specifications.md)** - Complete API reference
- **[🤝 Contributing Guide](./docs/CONTRIBUTING.md)** - Development workflow and standards

### Architecture & Technical Docs
- **[🏗️ System Architecture](./ARCHITECTURE.md)** - Technical architecture overview
- **[📁 Project Structure](./project-structure.md)** - Codebase organization
- **[🔒 Security Framework](./security-framework.md)** - Security implementation

### Quick Links by Role
- **Developers**: Start with [Developer Guide](./docs/DEVELOPER_GUIDE.md)
- **DevOps**: See [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- **Administrators**: Read [User Manual](./docs/USER_MANUAL.md)
- **Integrators**: Check [API Documentation](./api-specifications.md)

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](./docs/CONTRIBUTING.md) for detailed information on:

### Development Workflow
1. Fork and clone the repository
2. Set up development environment
3. Create feature branch
4. Implement changes with tests
5. Follow code quality standards
6. Submit pull request

### Code Standards
- Follow TypeScript strict mode and coding guidelines
- Maintain WCAG 2.1 AA accessibility standards
- Write comprehensive tests (unit + E2E)
- Document all public APIs and complex logic
- Follow security best practices

## 📄 License

This project is proprietary software developed for KITMED.

## 🆘 Support

### Getting Help
- **📖 Documentation**: Check our [comprehensive docs](./docs/README.md)
- **🐛 Bug Reports**: Create an issue in the repository
- **💡 Feature Requests**: Use GitHub discussions
- **🔒 Security Issues**: Email security@kitmed.com
- **👥 Community**: Join GitHub discussions for questions

### Support Channels
- **Technical Support**: Create GitHub issues with detailed information
- **Development Team**: Available for complex technical questions
- **Documentation**: Self-service resources in `/docs/` directory

---

Built with ❤️ by the KITMED development team

*For the latest documentation and updates, visit our [documentation hub](./docs/README.md)*