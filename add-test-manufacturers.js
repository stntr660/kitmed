// Quick script to add test manufacturers
// Run with: node add-test-manufacturers.js

const manufacturers = [
  {
    nom: { fr: "Philips Healthcare Manufacturer", en: "Philips Healthcare Manufacturer" },
    description: { fr: "Fabricant d'équipements médicaux", en: "Medical equipment manufacturer" },
    websiteUrl: "https://www.philips.com/healthcare",
    status: "active",
    featured: false
  },
  {
    nom: { fr: "GE Healthcare Manufacturer", en: "GE Healthcare Manufacturer" },
    description: { fr: "Fabricant de technologies médicales", en: "Medical technology manufacturer" },
    websiteUrl: "https://www.gehealthcare.com",
    status: "active",
    featured: true
  },
  {
    nom: { fr: "Siemens Healthineers Fabricant", en: "Siemens Healthineers Manufacturer" },
    description: { fr: "Solutions médicales innovantes", en: "Innovative medical solutions" },
    websiteUrl: "https://www.siemens-healthineers.com",
    status: "active",
    featured: false
  }
];

// Function to add manufacturers via API
async function addManufacturers() {
  console.log('Adding test manufacturers...');
  
  try {
    for (const manufacturer of manufacturers) {
      const response = await fetch('http://localhost:3000/api/admin/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manufacturer)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Added: ${manufacturer.nom.fr}`);
      } else {
        const error = await response.json();
        console.error(`❌ Failed to add ${manufacturer.nom.fr}:`, error.error?.message);
      }
    }
    
    console.log('\n🎉 Test manufacturers added successfully!');
    
    // Test the manufacturer filter
    console.log('\nTesting manufacturer filter...');
    const testResponse = await fetch('http://localhost:3000/api/admin/partners?type=manufacturer');
    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log(`Found ${result.data.total} manufacturers:`);
      result.data.items.forEach(item => {
        console.log(`  - ${item.nom.fr || item.name}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the function
addManufacturers();