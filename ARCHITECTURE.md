# KITMED Frontend Architecture

## Overview

KITMED is a medical equipment platform built with modern web technologies, focusing on performance, accessibility, and user experience. The frontend is designed as a multi-language, server-side rendered application with comprehensive state management and component reusability.

## 🏗️ Architecture Principles

### Core Pillars
1. **Performance First**: SSR/SSG, image optimization, bundle splitting
2. **Accessibility Compliance**: WCAG 2.1 AA standards throughout
3. **Mobile-First Design**: Responsive layouts for all device types
4. **Professional Medical Aesthetic**: Clean, trustworthy, minimal design
5. **Multi-Language Support**: French/English with automatic fallback

### Technical Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand with persistence
- **Internationalization**: next-intl
- **Animations**: Framer Motion (selective usage)
- **Type Safety**: TypeScript throughout
- **Testing**: Jest + Playwright for E2E

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── layout.tsx     # Locale-specific layout
│   │   ├── page.tsx       # Homepage
│   │   ├── products/      # Product catalog
│   │   ├── rfp/           # RFP workflow
│   │   ├── admin/         # Admin panel
│   │   └── ...
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── layout/            # Layout components
│   ├── product/           # Product-specific components
│   ├── rfp/               # RFP workflow components
│   ├── admin/             # Admin interface components
│   ├── forms/             # Form components
│   └── common/            # Shared components
├── lib/                   # Utility functions
├── hooks/                 # Custom React hooks
├── store/                 # Zustand stores
├── types/                 # TypeScript type definitions
├── utils/                 # Helper utilities
├── styles/                # Global styles
├── config/                # Configuration files
└── messages/              # Internationalization messages
    ├── en.json
    └── fr.json
```

## 🎨 Design System

### Brand Colors
```css
/* Primary Brand Colors */
--primary: #1C75BC        /* KITMED Blue */
--accent: #ED1C24         /* KITMED Red */

/* Medical UI Palette */
--medical-bg: #FAFBFC     /* Background */
--medical-surface: #FFFFFF /* Surface */
--medical-border: #E5E7EB  /* Borders */
```

### Component Hierarchy

#### Base Components (`/ui`)
- **Button**: Medical-specific variants with accessibility
- **Card**: Medical card styling with hover effects
- **Input**: Form inputs with validation states
- **Badge**: Status and category indicators
- **Sheet**: Slide-out panels (RFP cart, filters)

#### Composite Components
- **ProductCard**: Product display with RFP integration
- **Header**: Navigation with search and cart
- **Footer**: Company info and certifications
- **RFPCart**: Shopping cart for proposals

#### Layout Components
- **Header**: Responsive navigation with mobile menu
- **Footer**: Multi-column footer with newsletter
- **Sidebar**: Admin and filter sidebars

## 🔄 State Management

### Zustand Stores

#### RFP Store (`rfp-store.ts`)
```typescript
interface RFPStore {
  cart: RFPCart;
  isOpen: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  // ... other methods
}
```

#### Search Store (`search-store.ts`)
```typescript
interface SearchStore {
  query: string;
  filters: SearchFilters;
  results: SearchResult<Product> | null;
  isLoading: boolean;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  // ... other methods
}
```

### Persistence Strategy
- **RFP Cart**: LocalStorage with automatic sync
- **User Preferences**: Language, theme, view preferences
- **Search State**: Session-based, no persistence

## 🌐 Internationalization

### Structure
- **Messages**: JSON files in `/messages/` directory
- **Routing**: `/[locale]/` dynamic segments
- **Fallback**: English as default with graceful degradation
- **Content**: All user-facing text externalized

### Implementation
```typescript
// Usage in components
const t = useTranslations('navigation');
const productName = product.name[locale]; // Type-safe locale access
```

## 📱 Responsive Design Strategy

### Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet portrait */
lg: 1024px  /* Tablet landscape */
xl: 1280px  /* Desktop */
2xl: 1536px /* Large desktop */
```

### Mobile-First Approach
- Base styles for mobile
- Progressive enhancement for larger screens
- Touch-friendly interactions
- Optimized navigation patterns

### Grid Systems
```css
.grid-products {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}
```

## ♿ Accessibility Implementation

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: All interactive elements accessible
- **Screen Reader Support**: Proper ARIA labels and landmarks
- **Color Contrast**: 4.5:1 minimum ratio
- **Focus Management**: Visible focus indicators
- **Form Validation**: Clear error messages

### Implementation Details
```typescript
// Example: Accessible button with loading state
<Button 
  loading={isSubmitting}
  aria-disabled={isSubmitting}
  aria-describedby="button-helper"
>
  {isSubmitting ? 'Submitting...' : 'Submit RFP'}
</Button>
```

## ⚡ Performance Optimization

### Core Web Vitals Targets
- **LCP**: < 2.5s (First meaningful paint)
- **FID**: < 100ms (Input responsiveness)
- **CLS**: < 0.1 (Layout stability)

### Optimization Strategies

#### Image Optimization
```typescript
// Next.js Image component with optimization
<Image
  src={productImage.url}
  alt={productImage.alt[locale]}
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

#### Code Splitting
- Route-based splitting (automatic with App Router)
- Component-level lazy loading
- Vendor bundle optimization

#### Caching Strategy
- Static generation for product pages
- ISR for dynamic content
- Client-side caching for API responses

## 🔗 API Integration Points

### Backend Integration
```typescript
// API client structure
interface ApiClient {
  products: {
    list(filters: SearchFilters): Promise<SearchResult<Product>>;
    get(id: string): Promise<Product>;
    // ...
  };
  rfp: {
    create(request: RFPRequest): Promise<RFPRequest>;
    submit(id: string): Promise<void>;
    // ...
  };
}
```

### Data Flow
1. **SSR/SSG**: Initial data fetched server-side
2. **Client-side**: Interactive updates via API
3. **Real-time**: WebSocket for admin notifications
4. **Offline**: Service worker for core functionality

## 🧪 Testing Strategy

### Unit Testing (Jest)
- Component rendering and behavior
- Utility function validation
- Store state management
- Form validation logic

### Integration Testing (Playwright)
- User workflows (product search, RFP creation)
- Multi-language functionality
- Accessibility compliance
- Cross-browser compatibility

### Testing Structure
```
tests/
├── __tests__/          # Unit tests
├── e2e/               # End-to-end tests
├── setup/             # Test configuration
└── fixtures/          # Test data
```

## 🚀 Development Workflow

### Component Development
1. **Design**: Create in Storybook
2. **Build**: Implement with TypeScript
3. **Test**: Unit and accessibility tests
4. **Document**: Props and usage examples

### Code Quality
- **ESLint**: Code style enforcement
- **Prettier**: Consistent formatting
- **TypeScript**: Type safety
- **Husky**: Pre-commit hooks

### Build Process
```bash
# Development
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Testing
npm run test
npm run test:e2e
```

## 📊 Monitoring & Analytics

### Performance Monitoring
- Core Web Vitals tracking
- Error boundary reporting
- User interaction analytics
- API response monitoring

### Accessibility Monitoring
- axe-core integration
- Lighthouse CI
- Manual accessibility audits
- User feedback collection

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.kitmed.com
NEXT_PUBLIC_CDN_URL=https://cdn.kitmed.com
NEXT_PUBLIC_ANALYTICS_ID=GA_MEASUREMENT_ID
```

### Feature Flags
- A/B testing capabilities
- Gradual feature rollouts
- Environment-specific features
- Emergency toggles

## 📈 Future Enhancements

### Planned Features
1. **Real-time Chat**: Customer support integration
2. **AR Product Viewer**: 3D product visualization
3. **Advanced Analytics**: User behavior tracking
4. **PWA Support**: Offline functionality
5. **Voice Search**: Accessibility enhancement

### Technical Debt
- Component library extraction
- Performance optimization review
- Accessibility audit completion
- Test coverage improvement

## 🎯 Key Performance Indicators

### Technical Metrics
- Bundle size < 250KB (gzipped)
- Time to Interactive < 3s
- Accessibility score > 95%
- Test coverage > 80%

### User Experience Metrics
- Cart abandonment rate
- RFP completion rate
- Search success rate
- Mobile usability score

## 🔒 Security Considerations

### Client-Side Security
- XSS prevention
- CSRF protection
- Content Security Policy
- Secure data handling

### Data Protection
- GDPR compliance
- User data encryption
- Secure API communication
- Privacy-first design

---

This architecture provides a solid foundation for KITMED's medical equipment platform, ensuring scalability, maintainability, and excellent user experience across all devices and use cases.