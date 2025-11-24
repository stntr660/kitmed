'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  CogIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MaintenanceButton } from '@/components/admin/MaintenanceButton';
import { getAdminToken } from '@/lib/auth-utils';

// Simplified essential settings only
interface SystemSettings {
  siteName: string;
  defaultLanguage: 'fr' | 'en';
  emailFromAddress: string;
  emailFromName: string;
  maintenanceMode: boolean;
}

export function SettingsManagement() {
  const t = useTranslations();

  // State management
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAdminToken();
      if (!token) {
        setError('Authentication required');
        setSettings(getMockSettings());
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/admin/settings', {
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        console.warn('Settings API returned error, using mock data');
        setSettings(getMockSettings());
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Settings API request timed out, using mock data');
      } else {
        console.error('Failed to load settings:', err);
      }
      setSettings(getMockSettings());
    } finally {
      setLoading(false);
    }
  };

  const getMockSettings = (): SystemSettings => ({
    siteName: 'KITMED Pro',
    defaultLanguage: 'fr',
    emailFromAddress: 'noreply@kitmed.fr',
    emailFromName: 'KITMED Support',
    maintenanceMode: false,
  });

  // Handle setting changes
  const handleSettingChange = (field: keyof SystemSettings, value: any) => {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      [field]: value
    };

    setSettings(updatedSettings);
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    if (!settings || !hasChanges) return;

    try {
      setSaving(true);
      setError(null);

      const token = getAdminToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      console.log('Saving settings:', settings);

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      console.log('Save response:', result);

      if (response.ok && result.success) {
        setHasChanges(false);
        setSuccessMessage(t('admin.settings.saveSuccess'));
        setError(null);
        
        // Check if language was changed
        const languageChanged = settings.defaultLanguage !== result.data.defaultLanguage;
        
        // Update the settings state with the returned data
        setSettings(result.data);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
        
        console.log('Settings saved successfully');
        
        // If language was changed, reload page to apply new language
        if (languageChanged) {
          setTimeout(() => {
            window.location.reload();
          }, 1500); // Give time for success message to show
        }
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(t('admin.settings.saveFailed') || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">{t('admin.settings.title')}</h1>
          <p className="mt-2 text-gray-600">{t('admin.settings.description')}</p>
        </div>
        <LoadingSpinner size="lg" text={t('common.loading')} />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">{t('admin.settings.title')}</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || t('common.loadError')}</p>
            <Button onClick={loadSettings} className="mt-4" variant="outline">
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium text-gray-900">{t('admin.settings.title')}</h1>
        <p className="mt-2 text-gray-600">{t('admin.settings.description')}</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Site Configuration */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <CogIcon className="h-5 w-5" />
              </div>
              <span>{t('admin.settings.general')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('admin.settings.siteName')}
                value={settings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
                placeholder="KITMED Pro"
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('admin.settings.language')}
                </label>
                <select 
                  value={settings.defaultLanguage} 
                  onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="fr">{t('admin.settings.french')}</option>
                  <option value="en">{t('admin.settings.english')}</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('admin.settings.emailAddress')}
                type="email"
                value={settings.emailFromAddress}
                onChange={(e) => handleSettingChange('emailFromAddress', e.target.value)}
                placeholder="noreply@kitmed.fr"
              />
              <Input
                label={t('admin.settings.emailName')}
                value={settings.emailFromName}
                onChange={(e) => handleSettingChange('emailFromName', e.target.value)}
                placeholder="KITMED Support"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <span>{t('admin.settings.security')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="font-medium text-green-800">Paramètres de sécurité</div>
              <div className="text-sm text-green-600 mt-1">
                Les paramètres de sécurité sont configurés automatiquement pour une protection optimale.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gray-50 text-gray-600">
                <CogIcon className="h-5 w-5" />
              </div>
              <span>{t('admin.settings.maintenance')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <MaintenanceButton
              currentMaintenanceMode={settings.maintenanceMode}
              onMaintenanceModeChange={(enabled) => handleSettingChange('maintenanceMode', enabled)}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
            className="px-8 bg-blue-600 hover:bg-blue-700"
          >
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-4 w-4" />
              <span>{saving ? t('common.saving') : t('admin.settings.saveSettings')}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}