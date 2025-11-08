#!/usr/bin/env node

/**
 * ERD Generator for KITMED Database Schema
 * Generates Entity Relationship Diagram from Prisma schema
 */

const fs = require('fs');
const path = require('path');

// Read the Prisma schema file
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Parse models from schema
function parseModels(content) {
  const models = [];
  const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
  let match;

  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    
    const fields = [];
    const relationships = [];
    
    // Parse fields
    const fieldLines = modelBody.split('\n').filter(line => line.trim() && !line.trim().startsWith('//'));
    
    for (const line of fieldLines) {
      const trimmedLine = line.trim();
      
      // Skip relation fields and @@map directives
      if (trimmedLine.startsWith('@@') || trimmedLine.includes('@relation')) {
        if (trimmedLine.includes('@relation')) {
          // Extract relationship info
          const fieldName = trimmedLine.split(/\s+/)[0];
          const relationType = trimmedLine.includes('[]') ? 'one-to-many' : 'many-to-one';
          relationships.push({ field: fieldName, type: relationType });
        }
        continue;
      }
      
      // Parse regular fields
      const fieldMatch = trimmedLine.match(/^(\w+)\s+([^\s@]+)/);
      if (fieldMatch) {
        const [, fieldName, fieldType] = fieldMatch;
        const isOptional = fieldType.includes('?');
        const isArray = fieldType.includes('[]');
        const isPrimaryKey = trimmedLine.includes('@id');
        const isUnique = trimmedLine.includes('@unique');
        
        fields.push({
          name: fieldName,
          type: fieldType.replace(/[\?\[\]]/g, ''),
          optional: isOptional,
          array: isArray,
          primaryKey: isPrimaryKey,
          unique: isUnique
        });
      }
    }
    
    models.push({
      name: modelName,
      fields,
      relationships
    });
  }
  
  return models;
}

// Generate Mermaid ERD
function generateMermaidERD(models) {
  let mermaid = `erDiagram\n\n`;
  
  // Add entities
  for (const model of models) {
    mermaid += `    ${model.name} {\n`;
    
    for (const field of model.fields) {
      let line = `        ${field.type} ${field.name}`;
      
      if (field.primaryKey) line += ' PK';
      if (field.unique) line += ' UK';
      if (field.optional) line += ' "nullable"';
      
      mermaid += line + '\n';
    }
    
    mermaid += `    }\n\n`;
  }
  
  // Add relationships
  const relationshipMap = {
    'Product': ['Category', 'RFPItem'],
    'Category': ['Category'],
    'RFPRequest': ['RFPItem'],
    'Partner': ['PartnerTranslation'],
    'Page': ['PageTranslation'],
    'Banner': ['BannerTranslation'],
    'User': ['UserSession', 'ActivityLog'],
    'ProductTranslation': ['Product'],
    'CategoryTranslation': ['Category'],
    'ProductMedia': ['Product'],
    'ProductAttribute': ['Product']
  };
  
  // Define relationships
  mermaid += `    %% Relationships\n`;
  mermaid += `    Category ||--o{ Product : "categorizes"\n`;
  mermaid += `    Category ||--o{ Category : "parent-child"\n`;
  mermaid += `    Product ||--o{ ProductTranslation : "translates"\n`;
  mermaid += `    Product ||--o{ ProductMedia : "has media"\n`;
  mermaid += `    Product ||--o{ ProductAttribute : "has attributes"\n`;
  mermaid += `    Product ||--o{ RFPItem : "requested in"\n`;
  mermaid += `    RFPRequest ||--o{ RFPItem : "contains"\n`;
  mermaid += `    Partner ||--o{ PartnerTranslation : "translates"\n`;
  mermaid += `    Page ||--o{ PageTranslation : "translates"\n`;
  mermaid += `    Banner ||--o{ BannerTranslation : "translates"\n`;
  mermaid += `    User ||--o{ UserSession : "has sessions"\n`;
  mermaid += `    User ||--o{ ActivityLog : "logs activity"\n`;
  mermaid += `    Category ||--o{ CategoryTranslation : "translates"\n`;
  
  return mermaid;
}

// Generate simple ASCII ERD
function generateASCIIERD(models) {
  let ascii = `
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                              KITMED DATABASE SCHEMA                                  ║
║                           Entity Relationship Diagram                               ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

📋 CORE ENTITIES:
`;

  const coreEntities = ['Category', 'Product', 'RFPRequest', 'Partner', 'User'];
  const supportEntities = models.filter(m => !coreEntities.includes(m.name));

  for (const model of models.filter(m => coreEntities.includes(m.name))) {
    ascii += `\n┌─ ${model.name.toUpperCase()} `;
    ascii += '─'.repeat(50 - model.name.length);
    ascii += '┐\n';
    
    const pkField = model.fields.find(f => f.primaryKey);
    if (pkField) {
      ascii += `│ 🔑 ${pkField.name} (${pkField.type})\n`;
    }
    
    const mainFields = model.fields.filter(f => !f.primaryKey && !f.name.includes('At') && !f.name.includes('Id')).slice(0, 4);
    for (const field of mainFields) {
      const indicator = field.unique ? '🔸' : field.optional ? '◦' : '●';
      ascii += `│ ${indicator} ${field.name} (${field.type})\n`;
    }
    
    ascii += '└' + '─'.repeat(52) + '┘\n';
  }

  ascii += `\n📋 TRANSLATION & SUPPORT ENTITIES:\n`;
  for (const model of supportEntities) {
    ascii += `\n• ${model.name}: ${model.fields.length} fields`;
    if (model.name.includes('Translation')) {
      ascii += ' (Multi-language support)';
    }
  }

  ascii += `\n\n🔗 KEY RELATIONSHIPS:
• Category → Product (One-to-Many)
• Product → RFPItem (One-to-Many) 
• RFPRequest → RFPItem (One-to-Many)
• Product → ProductTranslation (One-to-Many)
• Category → CategoryTranslation (One-to-Many)
• Partner → PartnerTranslation (One-to-Many)
• User → UserSession (One-to-Many)

💡 FEATURES:
• Multi-language support for all content
• Hierarchical category system
• RFP (Request for Proposal) workflow
• Complete audit trail
• Partner management system
• Content management (Pages, Banners)
• User authentication & sessions
`;

  return ascii;
}

// Generate detailed schema documentation
function generateSchemaDoc(models) {
  let doc = `# KITMED Database Schema Documentation

## Overview
This document describes the complete database schema for the KITMED medical equipment platform.

## Entities Summary
Total Models: ${models.length}

`;

  for (const model of models) {
    doc += `### ${model.name}\n`;
    doc += `Fields: ${model.fields.length}\n`;
    
    if (model.name.includes('Translation')) {
      doc += `**Type**: Translation table for multi-language support\n`;
    } else if (['Category', 'Product', 'RFPRequest', 'Partner', 'User'].includes(model.name)) {
      doc += `**Type**: Core entity\n`;
    } else {
      doc += `**Type**: Support/Junction table\n`;
    }
    
    doc += `\n**Fields:**\n`;
    for (const field of model.fields.slice(0, 8)) {
      let desc = `- \`${field.name}\` (${field.type})`;
      if (field.primaryKey) desc += ' **[Primary Key]**';
      if (field.unique) desc += ' **[Unique]**';
      if (field.optional) desc += ' *[Optional]*';
      doc += desc + '\n';
    }
    
    if (model.fields.length > 8) {
      doc += `- ... and ${model.fields.length - 8} more fields\n`;
    }
    
    doc += '\n---\n\n';
  }

  return doc;
}

// Main execution
function main() {
  console.log('🔍 Parsing Prisma schema...');
  const models = parseModels(schemaContent);
  
  console.log(`✅ Found ${models.length} models`);
  
  // Generate outputs
  const mermaidERD = generateMermaidERD(models);
  const asciiERD = generateASCIIERD(models);
  const schemaDoc = generateSchemaDoc(models);
  
  // Create output directory
  const outputDir = path.join(__dirname, '../docs/database');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write files
  fs.writeFileSync(path.join(outputDir, 'schema.mermaid'), mermaidERD);
  fs.writeFileSync(path.join(outputDir, 'schema-erd.txt'), asciiERD);
  fs.writeFileSync(path.join(outputDir, 'schema-documentation.md'), schemaDoc);
  
  console.log('📊 Generated ERD files:');
  console.log('  • docs/database/schema.mermaid (Mermaid diagram)');
  console.log('  • docs/database/schema-erd.txt (ASCII visualization)');
  console.log('  • docs/database/schema-documentation.md (Complete documentation)');
  
  // Display ASCII ERD
  console.log('\n' + asciiERD);
}

if (require.main === module) {
  main();
}

module.exports = { parseModels, generateMermaidERD, generateASCIIERD, generateSchemaDoc };