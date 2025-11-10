import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { SettingsManagement } from './SettingsManagement';

// Mock messages for testing
const messages = {
  common: {
    loading: 'Loading...',
    save: 'Save',
    reset: 'Reset',
    cancel: 'Cancel',
    retry: 'Retry',
    saving: 'Saving...',
  },
  admin: {
    settings: {
      title: 'System Settings',
      subtitle: 'Configure your platform and preferences',
      categories: 'Categories',
      general: 'General',
      security: 'Security',
      email: 'Email',
      backup: 'Backup',
      maintenance: 'Maintenance',
      medical: 'Medical',
      generalDesc: 'Basic site configuration and branding',
      securityDesc: 'Authentication and security policies',
      emailDesc: 'SMTP configuration and email settings',
      backupDesc: 'Automated backup and restore options',
      maintenanceDesc: 'System maintenance and debugging',
      medicalDesc: 'Medical equipment regulatory settings',
      resetConfirm: 'Reset Settings',
      resetWarning: 'Are you sure you want to reset all changes?',
      general_settings: {
        siteName: 'Site Name',
        siteDescription: 'Site Description',
        defaultLanguage: 'Default Language',
        timezone: 'Timezone',
        dateFormat: 'Date Format',
        currency: 'Currency',
      },
      security_settings: {
        twoFactorAuth: 'Two-Factor Authentication',
        sessionTimeout: 'Session Timeout',
        passwordPolicy: 'Password Policy',
      },
      twoFactorDesc: 'Require two-factor authentication for enhanced security',
      minutes: 'minutes',
    },
  },
  errors: {
    loadFailed: 'Failed to load settings',
  },
};

// Mock fetch globally
global.fetch = jest.fn();

const MockComponent = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
);

describe('SettingsManagement', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(
      <MockComponent>
        <SettingsManagement />
      </MockComponent>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('renders settings categories navigation', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(
      <MockComponent>
        <SettingsManagement />
      </MockComponent>
    );

    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Backup')).toBeInTheDocument();
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
      expect(screen.getByText('Medical')).toBeInTheDocument();
    });
  });

  it('switches between categories when clicked', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(
      <MockComponent>
        <SettingsManagement />
      </MockComponent>
    );

    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });

    // Click on Security category
    const securityButton = screen.getByText('Security');
    fireEvent.click(securityButton);

    // Should show security-related content
    await waitFor(() => {
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    });
  });

  it('shows save and reset buttons when changes are made', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(
      <MockComponent>
        <SettingsManagement />
      </MockComponent>
    );

    await waitFor(() => {
      expect(screen.getByText('Site Name')).toBeInTheDocument();
    });

    // Make a change to trigger hasChanges state
    const siteNameInput = screen.getByDisplayValue('KITMED Pro');
    fireEvent.change(siteNameInput, { target: { value: 'New Site Name' } });

    // Should show save and reset buttons
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(
      <MockComponent>
        <SettingsManagement />
      </MockComponent>
    );

    await waitFor(() => {
      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Check for proper button roles
      const categoryButtons = screen.getAllByRole('button');
      expect(categoryButtons.length).toBeGreaterThan(0);
      
      // Check for proper navigation structure
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  it('shows error state when loading fails', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <MockComponent>
        <SettingsManagement />
      </MockComponent>
    );

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(
      <MockComponent>
        <SettingsManagement />
      </MockComponent>
    );

    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });

    const securityButton = screen.getByText('Security');
    
    // Focus the button
    securityButton.focus();
    expect(document.activeElement).toBe(securityButton);
    
    // Test Enter key activation
    fireEvent.keyDown(securityButton, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    });
  });
});