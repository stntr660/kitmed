# ContentManagement Component

A comprehensive content management system for the KITMED admin dashboard following the established design patterns and UX strategy.

## Features

### Unified Content List View
- **Search and Filter**: Search by title, content, or excerpt. Filter by content type (article, news, announcement, page) and status (draft, review, published, archived)
- **Bulk Operations**: Select multiple items for bulk publish, archive, or delete operations
- **Status Indicators**: Visual badges showing content status with appropriate colors and icons
- **Content Type Icons**: Distinct icons for each content type (DocumentTextIcon for articles, NewspaperIcon for news, etc.)
- **Featured Content**: Special highlighting for featured content items
- **Tags Display**: Shows up to 2 tags with overflow indicator

### Content Editor/Form (Sheet-based)
- **Bilingual Support**: Toggle between French (primary) and English (secondary) with dedicated language switcher
- **Rich Content Fields**: 
  - Title (required in French, optional in English)
  - Excerpt (required in French, optional in English) 
  - Content body (required in French, optional in English)
  - Slug for URL-friendly links
- **Meta Information**:
  - Content type selection (article, news, announcement, page)
  - Status workflow (draft → review → published → archived)
  - Publish date picker
  - Featured content checkbox
  - Image URL input
  - Tags support (future enhancement)
- **Validation**: Client-side validation with French requirements, English optional
- **Auto-save**: Form state preservation during editing

### Content Workflow States
- **Draft**: Initial creation state, not visible to public
- **Review**: Ready for editorial review, highlighted with warning icon
- **Published**: Live content visible to users, success state with check icon
- **Archived**: Hidden from public but preserved, destructive badge with archive icon

### Responsive Design
- **Mobile-first**: Touch-friendly 48px+ targets for mobile interactions
- **Adaptive Layout**: 
  - Full-width table on desktop
  - Horizontal scroll on mobile while maintaining usability
  - Sheet sidebar adapts from 2xl on large screens to full-width on mobile
- **Progressive Enhancement**: Core functionality works on all screen sizes

### Accessibility (WCAG 2.1 AA)
- **Semantic HTML**: Proper heading hierarchy, table structure, form labels
- **ARIA Labels**: Screen reader support for icons, actions, and dynamic content
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Focus Management**: Visible focus indicators and logical tab order
- **Color Contrast**: Sufficient contrast ratios for all text and interactive elements
- **Alternative Text**: Meaningful descriptions for decorative and informational content

## Technical Implementation

### Component Structure
```typescript
interface ContentItem {
  id: string;
  title: { fr: string; en?: string };
  content: { fr: string; en?: string };
  excerpt: { fr: string; en?: string };
  type: 'article' | 'news' | 'announcement' | 'page';
  status: 'draft' | 'review' | 'published' | 'archived';
  author: { name: string; id: string };
  publishDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  imageUrl?: string;
  metaTitle?: { fr: string; en?: string };
  metaDescription?: { fr: string; en?: string };
  featured?: boolean;
  slug: string;
}
```

### State Management
- **Data State**: Pagination, filtering, sorting, and search
- **UI State**: Sheet mode (add/edit/view), selection, language toggle
- **Form State**: Bilingual form data with validation errors
- **Loading States**: Skeleton screens during data fetching

### Integration
- **Translation Support**: Full next-intl integration with `admin.content.*` keys
- **Design System**: Uses existing Card, Button, Badge, Input, Textarea, Sheet components
- **Icon System**: Heroicons 24/outline for consistent visual language
- **Styling**: Tailwind CSS following established color and spacing patterns

## Usage

```tsx
import { ContentManagement } from '@/components/admin/content/ContentManagement';

export default function ContentPage() {
  return (
    <AdminLayout>
      <ContentManagement 
        initialFilters={{ 
          status: ['published'], 
          category: ['article'] 
        }} 
      />
    </AdminLayout>
  );
}
```

## Mock Data

The component currently uses mock data for demonstration purposes. In production, it should integrate with:
- `/api/admin/content` for CRUD operations
- `/api/admin/content/bulk` for bulk actions  
- `/api/admin/content/export` for data export

## Future Enhancements

- **Rich Text Editor**: Replace textarea with WYSIWYG editor (TinyMCE, Quill)
- **Image Management**: Drag-and-drop image upload with preview
- **Tag Management**: Auto-complete tag input with existing tag suggestions
- **Version History**: Content versioning and revision tracking
- **SEO Tools**: Meta title/description optimization suggestions
- **Publishing Schedule**: Advanced scheduling for content publication
- **Content Analytics**: View counts, engagement metrics per content item