const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create a document
const doc = new PDFDocument();

// Pipe its output to a file
const outputPath = path.join(__dirname, 'public/uploads/brochures/phaco-knife-6-20-spec.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Add content
doc.fontSize(20)
   .text('Phaco Sapphire Knife', 100, 100);

doc.fontSize(14)
   .text('Model: 6-20 (6SK-146)', 100, 140);

doc.moveDown();
doc.fontSize(12)
   .text('Technical Specifications', 100, 180, { underline: true });

doc.moveDown();
doc.text('Product Details:', 100, 220);
doc.list([
  'Blade Width: 1.80mm - 2.40mm',
  'Length: 135mm',
  'Material: Sapphire blade with titanium handle',
  'Type: Trapezoidal blade',
  'Angle: Precision angular cut',
  'Sterilization: Autoclavable'
], 120, 250);

doc.moveDown();
doc.text('Features:', 100, 380);
doc.list([
  'Superior sharpness and edge retention',
  'Excellent tissue penetration',
  'Minimal trauma to ocular tissues',
  'Ergonomic titanium handle',
  'Reusable design'
], 120, 410);

doc.moveDown();
doc.text('Applications:', 100, 520);
doc.text('Ideal for phacoemulsification procedures and clear corneal incisions.', 120, 540);

// Finalize PDF file
doc.end();

console.log('✅ Product PDF created at:', outputPath);