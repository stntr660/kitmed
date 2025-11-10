import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Settings schema for validation
const settingsSchema = z.object({
  siteName: z.string().min(1),
  defaultLanguage: z.enum(['fr', 'en']),
  timezone: z.string(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  emailFromAddress: z.string().email(),
  emailFromName: z.string(),
  emailNotificationsEnabled: z.boolean(),
  sessionTimeout: z.enum(['30', '60', '120', '240']),
  twoFactorAuthEnabled: z.boolean(),
  maxLoginAttempts: z.enum(['3', '5', '10']),
  maintenanceMode: z.boolean(),
  autoUpdates: z.boolean(),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
});

// Mock settings store (in production, this would be in database)
let currentSettings: z.infer<typeof settingsSchema> = {
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
};

export async function GET() {
  try {
    return NextResponse.json(currentSettings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the settings data
    const validatedSettings = settingsSchema.parse(body);
    
    // Update settings (in production, save to database)
    currentSettings = validatedSettings;
    
    return NextResponse.json(currentSettings);
  } catch (error) {
    console.error('Settings update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid settings data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}