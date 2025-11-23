'use client';

import { useIsHydrated } from '@/components/ui/hydration-safe';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { DynamicBanner } from '@/components/banners/DynamicBanner';
import { ComplianceBadges } from '@/components/ui/compliance-badges';

export default function TestHydrationPage() {
  const isHydrated = useIsHydrated();
  const locale = useHydrationSafeLocale();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Hydration Test Page</h1>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Hydration Status:</span>
              <span className={`px-2 py-1 rounded text-sm ${isHydrated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {isHydrated ? 'Hydrated' : 'Hydrating...'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Current Locale:</span>
              <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                {locale}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Client/Server Match:</span>
              <span className={`px-2 py-1 rounded text-sm ${isHydrated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {isHydrated ? 'Matched' : 'Checking...'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Component Tests</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Compliance Badges (Image Loading Test)</h3>
              <ComplianceBadges variant="inline" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Dynamic Banner Test</h2>
          <div className="h-64 overflow-hidden rounded-lg">
            <DynamicBanner position="test" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="text-green-800 font-medium">Success Criteria</h3>
          <ul className="text-green-700 text-sm mt-2 space-y-1">
            <li>✓ Page loads without hydration errors in console</li>
            <li>✓ Images render correctly with fallbacks</li>
            <li>✓ Animation states don't cause mismatches</li>
            <li>✓ Locale detection works consistently</li>
            <li>✓ No "Text content does not match" errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}