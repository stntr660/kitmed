const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create a document
const doc = new PDFDocument();

// Pipe its output to a file
const outputPath = path.join(__dirname, 'public/uploads/brochures/rumex-2024-catalog.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Add content
doc.fontSize(24)
   .text('RUMEX Instruments', 100, 100);

doc.fontSize(18)
   .text('2024 Product Catalog', 100, 140);

doc.moveDown();
doc.fontSize(12)
   .text('High-Quality Ophthalmic Surgical Instruments', 100, 200);

doc.moveDown();
doc.text('This is a sample catalog for RUMEX surgical instruments.', 100, 250);
doc.text('Our products include:', 100, 280);
doc.list([
  'Phaco knives and blades',
  'Microsurgical forceps',
  'Ophthalmic scissors',
  'Speculum and retractors',
  'Cannulas and needles'
], 120, 310);

doc.moveDown();
doc.text('For more information, please contact your local distributor.', 100, 450);

// Finalize PDF file
doc.end();

console.log('✅ Sample PDF created at:', outputPath);