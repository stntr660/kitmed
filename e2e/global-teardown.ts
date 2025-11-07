import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');

  try {
    // Clean up auth files
    const authFiles = [
      './e2e/fixtures/admin-auth.json',
      './e2e/fixtures/user-auth.json',
    ];

    for (const authFile of authFiles) {
      try {
        await fs.unlink(authFile);
        console.log(`✅ Cleaned up auth file: ${authFile}`);
      } catch (error) {
        // File might not exist, which is fine
        if ((error as any).code !== 'ENOENT') {
          console.warn(`⚠️ Could not clean up auth file: ${authFile}`, error);
        }
      }
    }

    // Clean up any temporary test files
    const tempDir = './e2e/test-results/temp';
    try {
      await fs.rmdir(tempDir, { recursive: true });
      console.log('✅ Cleaned up temporary test files');
    } catch (error) {
      // Directory might not exist, which is fine
      if ((error as any).code !== 'ENOENT') {
        console.warn('⚠️ Could not clean up temp directory:', error);
      }
    }

    // You could add additional cleanup here, such as:
    // - Cleaning up test database records
    // - Resetting application state
    // - Cleaning up uploaded test files

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;