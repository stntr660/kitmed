const fs = require('fs');
const path = require('path');

function cleanCSVData(filePath) {
  console.log('🧹 Cleaning CSV data...');
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Clean problematic characters
  content = content
    // Fix unmatched quotes
    .replace(/""utility""/g, '"utility"')
    .replace(/""Utility""/g, '"Utility"')
    // Clean any other problematic unicode characters
    .replace(/[^\x00-\x7F]/g, function(match) {
      // Replace non-ASCII characters with their closest ASCII equivalent or remove
      const charCode = match.charCodeAt(0);
      if (charCode === 0x2019) return "'"; // Right single quotation mark
      if (charCode === 0x201C || charCode === 0x201D) return '"'; // Smart quotes
      if (charCode >= 0x00C0 && charCode <= 0x00FF) return match; // Keep accented characters
      return ''; // Remove other problematic characters
    });
  
  // Write cleaned content
  const cleanedPath = filePath.replace('.csv', '_cleaned.csv');
  fs.writeFileSync(cleanedPath, content);
  
  console.log('✅ CSV cleaned and saved as:', cleanedPath);
  return cleanedPath;
}

// Clean the batch 4 CSV
const inputFile = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_4_FINAL.csv';
cleanCSVData(inputFile);