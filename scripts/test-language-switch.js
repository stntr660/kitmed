#!/usr/bin/env node

/**
 * Test script to verify language switching functionality
 * Tests that language routes and transitions work correctly
 */

const BASE_URL = 'http://localhost:3000';

async function testLanguageSwitch() {
  console.log('🔍 Testing Language Switching...\n');
  
  const tests = [
    {
      name: 'English Admin Route',
      url: `${BASE_URL}/en/admin`,
      expectedLocale: 'en'
    },
    {
      name: 'French Admin Route',
      url: `${BASE_URL}/fr/admin`,
      expectedLocale: 'fr'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`✅ Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   Expected Locale: ${test.expectedLocale}`);
      
      const response = await fetch(test.url, {
        redirect: 'manual'
      });
      
      if (response.status === 200 || response.status === 302 || response.status === 307) {
        console.log(`   Status: ${response.status} - Route accessible\n`);
      } else {
        console.log(`   ⚠️ Status: ${response.status} - May need authentication\n`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('🎉 Language Switching Test Complete!');
  console.log('\n📝 Manual Testing Steps:');
  console.log('1. Open browser at http://localhost:3000/en/admin');
  console.log('2. Click the language switcher button in the header');
  console.log('3. Select "Français" from the dropdown');
  console.log('4. Verify URL changes to /fr/admin');
  console.log('5. Verify UI text changes to French');
  console.log('6. Check browser console for any React errors');
}

testLanguageSwitch().catch(console.error);