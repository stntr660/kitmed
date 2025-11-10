# Settings Management Component

A comprehensive system settings management interface for the KITMED admin dashboard.

## Features

### 📋 **Categorized Settings Interface**
- **General Settings**: Site configuration, branding, language, timezone
- **Security Settings**: 2FA, password policies, session management, IP restrictions
- **Email Settings**: SMTP configuration with testing capabilities  
- **Backup Settings**: Automated backup scheduling and manual backup/restore
- **Maintenance Settings**: Maintenance mode, cache, debugging, auto-updates
- **Medical Settings**: Regulatory compliance, certifications, audit logs

### 🎨 **Design & UX**
- **Responsive Design**: Mobile-first approach with proper touch targets (48px+)
- **Tabbed Interface**: Left sidebar navigation with visual indicators
- **Real-time Feedback**: Form validation and unsaved changes detection
- **Loading States**: Skeleton screens and progress indicators
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels

### 🔧 **Functionality**
- **Form Management**: Real-time validation with error handling
- **Save/Reset**: Confirmation dialogs for destructive actions
- **Test Email**: SMTP configuration testing functionality
- **Mock Data**: Comprehensive fallback data for development
- **Translation Support**: Full i18n with French and English

## Component Structure

```tsx
SettingsManagement/
├── SettingsManagement.tsx     # Main component
├── SettingsManagement.test.tsx # Test suite
├── index.ts                   # Export file
└── README.md                  # This documentation
```

## Usage

```tsx
import { SettingsManagement } from '@/components/admin/settings';

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <SettingsManagement />
    </AdminLayout>
  );
}
```

## API Integration

The component expects the following API endpoints:

### GET `/api/admin/settings`
Returns current system settings:
```json
{
  "settings": {
    "general": { "siteName": "...", ... },
    "security": { "twoFactorAuth": true, ... },
    "email": { "smtpHost": "...", ... },
    "backup": { "enabled": true, ... },
    "maintenance": { "enableMaintenance": false, ... },
    "medical": { "enableRegulatory": true, ... }
  }
}
```

### PUT `/api/admin/settings`
Updates system settings with the full settings object.

### POST `/api/admin/settings/test-email`
Tests email configuration by sending a test email.

## Translation Keys

All text is externalized using next-intl. Key structure:

```json
{
  "admin": {
    "settings": {
      "title": "System Settings",
      "subtitle": "Configure your platform and preferences",
      "general": "General",
      "security": "Security",
      // ... all other keys
    }
  }
}
```

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and visible focus indicators
- **High Contrast**: Compatible with high contrast mode
- **Responsive Text**: Scales properly with user font size preferences

## Medical Industry Specific Features

- **Regulatory Compliance**: Enable/disable regulatory features
- **Certification Management**: Require certifications for equipment
- **Audit Logging**: Comprehensive activity logging
- **Data Retention**: Medical data retention policies
- **Compliance Standards**: Support for CE, FDA, ISO 13485, MDR

## State Management

The component manages complex state including:
- Settings data for all categories
- Form validation states
- Loading and saving states  
- Change detection for save/reset functionality
- Error handling and recovery

## Performance Considerations

- **Lazy Loading**: Category content is rendered on demand
- **Debounced Saving**: Prevents excessive API calls
- **Optimistic Updates**: UI updates immediately for better UX
- **Error Boundaries**: Graceful error handling and recovery

## Testing

Comprehensive test suite covering:
- Component rendering and interactions
- Accessibility compliance
- Keyboard navigation
- Form validation
- Error states and recovery

Run tests with:
```bash
npm test SettingsManagement
```

## Mock Data

When API endpoints are not available, the component automatically falls back to comprehensive mock data that demonstrates all features and settings categories.

## Future Enhancements

Potential areas for expansion:
- **Import/Export**: Settings backup and migration
- **Version Control**: Settings change history
- **Role-Based Access**: Different settings access per user role
- **Advanced Validation**: Complex validation rules
- **Settings Templates**: Pre-configured setting sets