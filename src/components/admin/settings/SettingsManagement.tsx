'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  CogIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MaintenanceButton } from '@/components/admin/MaintenanceButton';
import { ImageUploadBox } from '@/components/ui/image-upload-box';

// Simplified settings interface
interface SystemSettings {
  siteName: string;
  defaultLanguage: 'fr' | 'en';
  timezone: string;
  logoUrl: string;
  emailFromAddress: string;
  emailFromName: string;
  emailNotificationsEnabled: boolean;
  sessionTimeout: '30' | '60' | '120' | '240';
  twoFactorAuthEnabled: boolean;
  maxLoginAttempts: '3' | '5' | '10';
  maintenanceMode: boolean;
  autoUpdates: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

export function SettingsManagement() {
  const t = useTranslations();

  // State management
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add a timeout to prevent hanging on slow API calls
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/admin/settings', {
        signal: controller.signal,
        cache: 'no-cache', // Ensure fresh data
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
    timezone: 'Europe/Paris',
    logoUrl: '/images/logos/kitmed-logo-original.png',
    emailFromAddress: 'noreply@kitmed.fr',
    emailFromName: 'KITMED Support',
    emailNotificationsEnabled: true,
    sessionTimeout: '60',
    twoFactorAuthEnabled: true,
    maxLoginAttempts: '5',
    maintenanceMode: false,
    autoUpdates: false,
    backupFrequency: 'daily',
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

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setHasChanges(false);
        // Show success message - could add toast here
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Test email configuration
  const testEmailConfiguration = async () => {
    if (!settings) return;

    try {
      setTestingEmail(true);
      
      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromEmail: settings.emailFromAddress,
          fromName: settings.emailFromName,
        }),
      });

      if (response.ok) {
        alert(t('admin.settings.emailTestSuccess'));
      } else {
        throw new Error('Email test failed');
      }
    } catch (err) {
      console.error('Email test failed:', err);
      alert(t('admin.settings.emailTestFailed'));
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('admin.settings.title')}</h1>
          <p className="mt-2 text-gray-600">{t('admin.settings.subtitle')}</p>
        </div>
        <LoadingSpinner size="lg" text={t('common.loading')} />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('admin.settings.title')}</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || t('errors.loadFailed')}</p>
            <Button onClick={loadSettings} className="mt-4" variant="outline">
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('admin.settings.title')}</h1>
        <p className="mt-2 text-gray-600">{t('admin.settings.subtitle')}</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Site Configuration */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <CogIcon className="h-5 w-5" />
              </div>
              <span>{t('admin.settings.siteConfiguration')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('admin.settings.siteName')}
                value={settings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
                placeholder="KITMED Pro"
                className="min-h-[48px]"
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('admin.settings.defaultLanguage')}
                </label>
                <select 
                  value={settings.defaultLanguage} 
                  onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}
                  className="min-h-[48px] w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('admin.settings.timezone')}
                value={settings.timezone}
                onChange={(e) => handleSettingChange('timezone', e.target.value)}
                placeholder="Europe/Paris"
                className="min-h-[48px]"
              />
              <div>
                <ImageUploadBox
                  label={t('admin.settings.siteLogo')}
                  value={settings.logoUrl}
                  onChange={(url) => handleSettingChange('logoUrl', url)}
                  preset="avatar"
                  placeholder="Télécharger le logo du site"
                  maxSize={1}
                  aspectRatio="square"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <EnvelopeIcon className="h-5 w-5" />
              </div>
              <span>{t('admin.settings.emailNotifications')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('admin.settings.fromEmail')}
                type="email"
                value={settings.emailFromAddress}
                onChange={(e) => handleSettingChange('emailFromAddress', e.target.value)}
                placeholder="noreply@kitmed.fr"
                className="min-h-[48px]"
              />
              <Input
                label={t('admin.settings.fromName')}
                value={settings.emailFromName}
                onChange={(e) => handleSettingChange('emailFromName', e.target.value)}
                placeholder="KITMED Support"
                className="min-h-[48px]"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <div className="font-medium text-blue-800">{t('admin.settings.enableEmailNotifications')}</div>
                <div className="text-sm text-blue-600">{t('admin.settings.emailNotificationsDesc')}</div>
              </div>
              <Switch
                checked={settings.emailNotificationsEnabled}
                onCheckedChange={(checked) => handleSettingChange('emailNotificationsEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <h3 className="font-medium text-gray-900">{t('admin.settings.testEmailConfiguration')}</h3>
                <p className="text-sm text-gray-600">{t('admin.settings.sendTestEmailDesc')}</p>
              </div>
              <Button
                onClick={testEmailConfiguration}
                loading={testingEmail}
                variant="outline"
                className="min-h-[48px] px-6"
              >
                {testingEmail ? t('admin.settings.testing') : t('admin.settings.sendTest')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <span>{t('admin.settings.securityBasics')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('admin.settings.sessionTimeout')}
                </label>
                <select 
                  value={settings.sessionTimeout} 
                  onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                  className="min-h-[48px] w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="30">{t('admin.settings.minutes30')}</option>
                  <option value="60">{t('admin.settings.hour1')}</option>
                  <option value="120">{t('admin.settings.hours2')}</option>
                  <option value="240">{t('admin.settings.hours4')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('admin.settings.maxLoginAttempts')}
                </label>
                <select 
                  value={settings.maxLoginAttempts} 
                  onChange={(e) => handleSettingChange('maxLoginAttempts', e.target.value)}
                  className="min-h-[48px] w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="3">3 {t('admin.settings.attempts')}</option>
                  <option value="5">5 {t('admin.settings.attempts')}</option>
                  <option value="10">10 {t('admin.settings.attempts')}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <div className="font-medium text-green-800">{t('admin.settings.twoFactorAuthentication')}</div>
                <div className="text-sm text-green-600">{t('admin.settings.twoFactorDesc')}</div>
              </div>
              <Switch
                checked={settings.twoFactorAuthEnabled}
                onCheckedChange={(checked) => handleSettingChange('twoFactorAuthEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gray-50 text-gray-600">
                <WrenchScrewdriverIcon className="h-5 w-5" />
              </div>
              <span>{t('admin.settings.systemMaintenance')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <MaintenanceButton
                currentMaintenanceMode={settings.maintenanceMode}
                onMaintenanceModeChange={(enabled) => handleSettingChange('maintenanceMode', enabled)}
              />

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <div className="font-medium text-blue-800">{t('admin.settings.automaticUpdates')}</div>
                  <div className="text-sm text-blue-600">{t('admin.settings.autoUpdatesDesc')}</div>
                </div>
                <Switch
                  checked={settings.autoUpdates}
                  onCheckedChange={(checked) => handleSettingChange('autoUpdates', checked)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('admin.settings.dataBackupFrequency')}
                </label>
                <select 
                  value={settings.backupFrequency} 
                  onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                  className="min-h-[48px] w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="daily">{t('admin.settings.daily')}</option>
                  <option value="weekly">{t('admin.settings.weekly')}</option>
                  <option value="monthly">{t('admin.settings.monthly')}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
            className="min-h-[48px] px-8 bg-primary-600 hover:bg-primary-700"
          >
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-4 w-4" />
              <span>{saving ? t('common.saving') : t('common.saveSettings')}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}