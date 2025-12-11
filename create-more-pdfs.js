const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const pdfs = [
  {
    filename: 'keeler-ophthalmology-catalog.pdf',
    title: 'KEELER Ophthalmic Instruments',
    subtitle: '2024 Product Range',
    description: 'Premium diagnostic and surgical equipment for eye care professionals',
    categories: ['Slit Lamps', 'Ophthalmoscopes', 'Tonometers', 'Surgical Microscopes']
  },
  {
    filename: 'moria-surgical-catalog.pdf',
    title: 'MORIA Surgical',
    subtitle: 'Precision Instruments Catalog',
    description: 'Advanced microkeratomes and surgical instruments',
    categories: ['Microkeratomes', 'Disposable Blades', 'Surgical Tools', 'Maintenance Kits']
  },
  {
    filename: 'nidek-diagnostic-systems.pdf',
    title: 'NIDEK Diagnostic Systems',
    subtitle: 'Complete Eye Care Solutions',
    description: 'State-of-the-art diagnostic and refractive equipment',
    categories: ['Auto Refractors', 'OCT Systems', 'Fundus Cameras', 'Perimeters']
  }
];

pdfs.forEach(pdfInfo => {
  const doc = new PDFDocument();
  const outputPath = path.join(__dirname, 'public/uploads/brochures', pdfInfo.filename);
  
  doc.pipe(fs.createWriteStream(outputPath));
  
  // Add content
  doc.fontSize(24).text(pdfInfo.title, 100, 100);
  doc.fontSize(18).text(pdfInfo.subtitle, 100, 140);
  
  doc.moveDown();
  doc.fontSize(12).text(pdfInfo.description, 100, 200);
  
  doc.moveDown();
  doc.text('Product Categories:', 100, 250);
  doc.list(pdfInfo.categories, 120, 280);
  
  doc.moveDown();
  doc.fontSize(10);
  doc.text('For detailed specifications and pricing, please contact your local representative.', 100, 400);
  doc.text('© 2024 - All rights reserved', 100, 450);
  
  doc.end();
  console.log('✅ Created:', pdfInfo.filename);
});

console.log('\n✨ All PDF catalogs created successfully!');