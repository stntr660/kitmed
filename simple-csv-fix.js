const fs = require('fs');

function simpleCSVFix(filePath) {
  console.log('🔧 Simple CSV fix - removing nested quotes...');
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Simple fix: replace problematic nested quotes with single quotes
  content = content
    .replace(/"utility"/g, "'utility'")
    .replace(/"Utility"/g, "'Utility'")
    .replace(/"colibri"/g, "'colibri'")
    // Fix any other nested quote patterns by converting inner quotes to single quotes
    .replace(/"([^"]*)"([^"]*)"([^"]*)"([^"]*)",/g, '"$1\'$2\'$3\'$4",')
    .replace(/"([^"]*)"([^"]*)"([^"]*)",/g, '"$1\'$2\'$3",')
    .replace(/"([^"]*)"([^"]*)",/g, '"$1\'$2",');
  
  const fixedPath = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_4_FINAL_simple_fix.csv';
  fs.writeFileSync(fixedPath, content);
  
  console.log('✅ CSV simply fixed and saved as:', fixedPath);
  return fixedPath;
}

// Fix the original CSV
const inputFile = '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_4_FINAL.csv';
simpleCSVFix(inputFile);