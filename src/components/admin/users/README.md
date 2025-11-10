# User Management Components

This directory contains a comprehensive user management system for the KITMED admin dashboard, implementing enterprise-level user administration with advanced security features.

## Components Overview

### 1. UsersManagement.tsx
**Main component** providing the complete user management interface with list view, filtering, and CRUD operations.

**Key Features:**
- Responsive data table with sorting and filtering
- Role-based filtering (admin, manager, editor, viewer)
- Status-based filtering (active, inactive, pending, suspended)
- Search by name, email, or department
- Bulk operations (activate, deactivate, delete, reset 2FA)
- CSV export functionality
- Security indicators (2FA status, login attempts)
- Mock data integration with realistic user profiles

**Props:**
- `initialFilters?: Partial<AdminSearchFilters>` - Optional initial filter state

### 2. UserDrawer.tsx
**Side panel component** for creating, editing, and viewing user details.

**Key Features:**
- Three modes: add, edit, view
- Form validation with error handling
- Security settings (2FA, password requirements)
- Contact information management
- Role and permission assignment
- Real-time form state management
- Responsive design for mobile devices

**Props:**
- `open: boolean` - Controls drawer visibility
- `onOpenChange: (open: boolean) => void` - Drawer state handler
- `user: User | null` - User data for edit/view modes
- `mode: 'add' | 'edit' | 'view'` - Component operation mode
- `onSave: (userData: Partial<User>) => Promise<void>` - Save handler

### 3. UserQuickView.tsx
**Modal component** for rapid user information viewing with security assessment.

**Key Features:**
- Contact information display
- Account activity overview
- Security risk assessment
- Permission summary
- Login history and session details
- Visual security indicators
- Quick edit access

**Props:**
- `open: boolean` - Controls modal visibility
- `onOpenChange: (open: boolean) => void` - Modal state handler
- `user: User | null` - User data to display
- `onEdit?: () => void` - Optional edit handler

### 4. PermissionMatrix.tsx
**Permission management component** for visualizing and configuring role-based access control.

**Key Features:**
- Interactive permission grid
- Role-based permission templates
- Resource-level permission control
- Action-level granularity (create, read, update, delete, export, import)
- Permission inheritance visualization
- Bulk permission management
- Real-time permission summary

**Props:**
- `open: boolean` - Controls matrix visibility
- `onOpenChange: (open: boolean) => void` - Matrix state handler

## Data Structure

### Enhanced User Interface
```typescript
interface User extends BaseEntity {
  // Basic Information
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  avatarUrl?: string;

  // Role & Status
  role: 'admin' | 'manager' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  isActive: boolean;

  // Security Features
  twoFactorEnabled: boolean;
  loginAttempts: number;
  lastLoginIP?: string;
  accountLockedUntil?: Date;
  passwordLastChanged?: Date;
  mustChangePassword?: boolean;

  // Activity Tracking
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  sessionCount?: number;
  totalLoginTime?: number;

  // Permissions
  permissions?: UserPermission[];
  customPermissions?: UserPermission[];
  preferences?: UserPreferences;
}
```

### Permission System
```typescript
interface UserPermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'export' | 'import')[];
  conditions?: Record<string, any>;
}
```

## Translation Support

### English (en.json)
Complete translation coverage under `admin.users.*` namespace:
- Form labels and placeholders
- Status and role descriptions
- Validation messages
- Security indicators
- Action buttons and confirmations

### French (fr.json)
Full French localization with medical industry terminology:
- Professional medical context translations
- Form validation in French
- Security terminology
- Action confirmations

## Security Features

### Two-Factor Authentication
- Visual 2FA status indicators
- Bulk 2FA reset operations
- Security risk assessment
- Account lockout prevention

### Account Security
- Failed login attempt tracking
- IP address logging
- Session management
- Password policy enforcement
- Account suspension capabilities

### Audit Trail
- User activity logging
- Permission change tracking
- Login/logout events
- Administrative actions

## Design Patterns

### Responsive Design
- Mobile-first approach with 48px+ touch targets
- Collapsible table columns for mobile devices
- Adaptive navigation and filtering
- Touch-friendly interaction areas

### Accessibility (WCAG 2.1 AA)
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- High contrast color schemes
- Focus management

### User Experience
- Progressive disclosure of information
- Contextual help and tooltips
- Loading states and error handling
- Confirmation dialogs for destructive actions
- Empty states with actionable guidance

## Integration

### API Integration Points
```typescript
// User management endpoints
GET /api/admin/users - List users with filtering
POST /api/admin/users - Create new user
PUT /api/admin/users/:id - Update user
DELETE /api/admin/users/:id - Delete user
POST /api/admin/users/bulk - Bulk operations

// Permission management
GET /api/admin/permissions/matrix - Get permission matrix
PUT /api/admin/permissions/matrix - Update permissions

// Activity tracking
GET /api/admin/users/:id/activity - User activity log
GET /api/admin/users/:id/sessions - User sessions
```

### State Management
- Local component state for form management
- Global state compatibility (Redux, Zustand)
- Real-time updates support
- Optimistic UI updates

## Performance Considerations

### Data Loading
- Pagination for large user lists
- Debounced search input
- Cached filter results
- Lazy loading for user details

### Component Optimization
- React.memo for pure components
- Callback memoization
- Virtualized lists for large datasets
- Code splitting for permission matrix

## Usage Examples

### Basic Usage
```tsx
import { UsersManagement } from '@/components/admin/users';

export function AdminUsersPage() {
  return (
    <div className="p-6">
      <UsersManagement />
    </div>
  );
}
```

### With Initial Filters
```tsx
<UsersManagement 
  initialFilters={{ 
    status: ['active'], 
    role: ['manager', 'editor'] 
  }} 
/>
```

### Standalone Components
```tsx
import { UserDrawer, UserQuickView } from '@/components/admin/users';

function CustomUserManagement() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <>
      <UserDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        user={selectedUser}
        mode="edit"
        onSave={handleSave}
      />
      <UserQuickView
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        user={selectedUser}
        onEdit={() => setDrawerOpen(true)}
      />
    </>
  );
}
```

## File Structure
```
src/components/admin/users/
├── UsersManagement.tsx    # Main management component
├── UserDrawer.tsx         # User creation/editing form
├── UserQuickView.tsx      # User details modal
├── PermissionMatrix.tsx   # Permission management
├── index.ts              # Component exports
└── README.md             # This documentation
```

## Development Notes

### Testing Strategy
- Unit tests for form validation
- Integration tests for CRUD operations
- Accessibility testing with screen readers
- Security testing for permission validation

### Future Enhancements
- Advanced filtering options
- User import/export functionality
- Role templates and presets
- Activity analytics dashboard
- Single sign-on integration
- Multi-tenant support

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Graceful degradation for older browsers
- Progressive enhancement approach