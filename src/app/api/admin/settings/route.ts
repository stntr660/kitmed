import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { z } from 'zod';

// Simplified settings schema matching the frontend interface
const settingsSchema = z.object({
  siteName: z.string().min(1),
  defaultLanguage: z.enum(['fr', 'en']),
  emailFromAddress: z.string().email(),
  emailFromName: z.string(),
  maintenanceMode: z.boolean(),
});

// Mock settings store (in production, this would be in database)
let currentSettings: z.infer<typeof settingsSchema> = {
  siteName: 'KITMED Pro',
  defaultLanguage: 'fr',
  emailFromAddress: 'noreply@kitmed.fr',
  emailFromName: 'KITMED Support',
  maintenanceMode: false,
};

async function getSettings() {
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

async function updateSettings(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Settings update request:', body);
    
    // Validate the settings data
    const validatedSettings = settingsSchema.parse(body);
    console.log('Validated settings:', validatedSettings);
    
    // Update settings (in production, save to database)
    currentSettings = validatedSettings;
    
    console.log('Settings updated successfully:', currentSettings);
    return NextResponse.json({
      success: true,
      data: currentSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Settings update error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.issues);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid settings data', 
          details: error.issues 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update settings' 
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getSettings, {
  roles: ['admin', 'editor'],
});

export const PUT = withAuth(updateSettings, {
  roles: ['admin'],
});