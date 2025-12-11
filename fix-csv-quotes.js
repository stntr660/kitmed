const fs = require('fs');

function fixCSVQuotes(filePath) {
  console.log('🔧 Fixing CSV quote issues...');
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the specific problematic quote patterns
  content = content
    // Fix the utility quote pattern
    .replace(/"Castroviejo "utility" /g, '"Castroviejo \\"utility\\" ')
    .replace(/"Castroviejo"Utility"/g, '"Castroviejo\\"Utility\\"')
    // Fix any other patterns with nested quotes
    .replace(/"([^"]*)"([^"]*)"([^"]*)"([^"]*)",/g, '"$1\\"$2\\"$3\\"$4",')
    .replace(/"([^"]*)"([^"]*)"([^"]*)",/g, '"$1\\"$2\\"$3",')
    .replace(/"([^"]*)"([^"]*)",/g, '"$1\\"$2",');
  
  const fixedPath = filePath.replace('.csv', '_fixed.csv');
  fs.writeFileSync(fixedPath, content);
  
  console.log('✅ CSV quotes fixed and saved as:', fixedPath);
  return fixedPath;
}

// Fix the cleaned CSV
const inputFile = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_4_FINAL_cleaned.csv';
fixCSVQuotes(inputFile);