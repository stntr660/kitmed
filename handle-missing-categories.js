const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Strategy for handling missing categories
const categoryMappingStrategy = {
  // Direct mappings to existing categories
  'ENT → Examination Devices': 'surgery-instruments',
  'ENT → EXAMINATION DEVICES': 'surgery-instruments',
  'Ophthalmology → Treatment Devices': 'ophthalmology-surgical',
  'Ophthalmology → Surgical Instruments': 'ophthalmology-surgical',
  'Ophthalmology → Diagnostic Equipment': 'ophthalmology-diagnostic',
  'Medical Equipment': 'surgery-instruments', // General fallback
  'Pain Management → Topical Treatments': 'pharmaceutique', // Maps to pharma
  
  // Fallback strategy for unknown categories
  'DEFAULT_SURGICAL': 'surgery-instruments',
  'DEFAULT_OPHTHALMOLOGY': 'ophthalmology-surgical'
};

// Categories to auto-create if missing
const categoriesToCreate = [
  {
    slug: 'ent-examination',
    name: 'Dispositifs d\'Examen ORL',
    name_en: 'ENT Examination Devices',
    type: 'equipment',
    parent_discipline: 'surgery'
  },
  {
    slug: 'pain-management-topical',
    name: 'Traitements Topiques Antidouleur',
    name_en: 'Pain Management Topical Treatments', 
    type: 'equipment',
    parent_discipline: 'pharmaceutique'
  }
];

async function handleMissingCategories(csvPath) {
  try {
    console.log('🔍 Analyzing categories in CSV...');
    
    // Read CSV and extract all unique categories
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const categories = new Set();
    
    lines.slice(1).forEach(line => {
      if (line.trim()) {
        const parts = line.split(',');
        const category = parts[2]?.replace(/"/g, '').trim();
        if (category && category !== 'categoryId') {
          categories.add(category);
        }
      }
    });
    
    console.log(`Found ${categories.size} unique categories in CSV:`);
    Array.from(categories).forEach(cat => console.log(`- ${cat}`));
    
    // Get existing categories from database
    const existingCategories = await prisma.categories.findMany({
      select: { id: true, slug: true, name: true }
    });
    
    console.log('\n📊 Category Analysis:');
    
    const analysis = {
      mapped: [],
      missing: [],
      needsCreation: []
    };
    
    Array.from(categories).forEach(csvCategory => {
      if (categoryMappingStrategy[csvCategory]) {
        const mappedId = categoryMappingStrategy[csvCategory];
        const exists = existingCategories.find(c => c.id === mappedId);
        if (exists) {
          analysis.mapped.push({ csv: csvCategory, mapped: mappedId, name: exists.name });
        } else {
          analysis.missing.push({ csv: csvCategory, mapped: mappedId });
        }
      } else {
        analysis.needsCreation.push(csvCategory);
      }
    });
    
    // Report analysis
    console.log('\n✅ MAPPED CATEGORIES:');
    analysis.mapped.forEach(item => {
      console.log(`  ${item.csv} → ${item.mapped} (${item.name})`);
    });
    
    console.log('\n❌ MISSING CATEGORIES (mapped but target doesn\'t exist):');
    analysis.missing.forEach(item => {
      console.log(`  ${item.csv} → ${item.mapped} (TARGET MISSING!)`);
    });
    
    console.log('\n🆕 UNMAPPED CATEGORIES (need creation or mapping):');
    analysis.needsCreation.forEach(cat => {
      console.log(`  ${cat}`);
    });
    
    // Generate strategy recommendations
    console.log('\n📋 RECOMMENDED ACTIONS:');
    
    if (analysis.missing.length > 0) {
      console.log('\n1. Fix mapping - these targets don\'t exist:');
      analysis.missing.forEach(item => {
        console.log(`   - Update mapping for "${item.csv}" to valid category`);
      });
    }
    
    if (analysis.needsCreation.length > 0) {
      console.log('\n2. Handle unmapped categories:');
      analysis.needsCreation.forEach(cat => {
        // Smart suggestions based on category name
        let suggestion = 'surgery-instruments'; // Default fallback
        
        if (cat.toLowerCase().includes('ophthalmology') || cat.toLowerCase().includes('eye')) {
          suggestion = 'ophthalmology-surgical';
        } else if (cat.toLowerCase().includes('pain') || cat.toLowerCase().includes('pharma')) {
          suggestion = 'pharmaceutique';
        } else if (cat.toLowerCase().includes('ent') || cat.toLowerCase().includes('ear')) {
          suggestion = 'surgery-instruments';
        }
        
        console.log(`   - "${cat}" → Suggest mapping to: ${suggestion}`);
        console.log(`     OR create new category with ID: ${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
      });
    }
    
    // Generate updated mapping strategy
    const updatedMapping = { ...categoryMappingStrategy };
    analysis.needsCreation.forEach(cat => {
      if (!updatedMapping[cat]) {
        // Smart auto-mapping
        if (cat.toLowerCase().includes('ophthalmology')) {
          updatedMapping[cat] = 'ophthalmology-surgical';
        } else if (cat.toLowerCase().includes('pain') || cat.toLowerCase().includes('pharma')) {
          updatedMapping[cat] = 'pharmaceutique';
        } else {
          updatedMapping[cat] = 'surgery-instruments'; // Safe fallback
        }
      }
    });
    
    console.log('\n🔧 UPDATED MAPPING STRATEGY:');
    Object.entries(updatedMapping).forEach(([csv, mapped]) => {
      if (!categoryMappingStrategy[csv]) {
        console.log(`  "${csv}": "${mapped}", // AUTO-MAPPED`);
      }
    });
    
    await prisma.$disconnect();
    return updatedMapping;
    
  } catch (error) {
    console.error('Error analyzing categories:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the analysis
handleMissingCategories('/Users/mac/Downloads/kitmed agent/kitmed_batch_5_of_5.csv');