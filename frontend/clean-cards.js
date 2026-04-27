const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'sidebar.jsx') continue; // Do not touch sidebar!
    
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getFiles(path.join(dir, file), fileList);
    } else {
      if (file.endsWith('.jsx')) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

const targetDir = path.join(__dirname, 'src');
const files = getFiles(targetDir);

let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Change bgColor props on StatCards etc
  content = content.replace(/bgColor="bg-[a-z]+-[1-9]00"/g, 'bgColor="bg-white border border-slate-200"');
  
  // Change classes on actual divs/elements
  // We want to target bg-colors that are not white/transparent/slate that are acting as cards or badges
  // It's safe to turn all bg-[color]-50 and bg-[color]-100 into bg-white or bg-slate-50
  // since the request is "all pages colours and cards colours into white"
  
  // Specific pattern for large container backgrounds (e.g. bg-gray-50 from body wrappers if any)
  content = content.replace(/className="([^"]*)bg-gray-50([^"]*)"/g, 'className="$1bg-white$2"');
  content = content.replace(/className="([^"]*)bg-slate-50([^"]*)"/g, 'className="$1bg-white$2"');
  content = content.replace(/className="([^"]*)bg-zinc-50([^"]*)"/g, 'className="$1bg-white$2"');
  content = content.replace(/className="([^"]*)bg-purple-50([^"]*)"/g, 'className="$1bg-white border border-slate-100$2"');
  
  // Pattern for the colorful stat cards which are usually like bg-blue-100
  const colors = ['blue', 'green', 'purple', 'pink', 'yellow', 'indigo', 'red', 'orange', 'teal', 'cyan'];
  colors.forEach(c => {
     // replace bg-{color}-100 with bg-white + border if it's rounded (likely a card or badge)
     // To avoid double borders, we just add it gently
     const regex100 = new RegExp(`bg-${c}-100`, 'g');
     content = content.replace(regex100, `bg-white border border-slate-200`);
     
     const regex200 = new RegExp(`bg-${c}-200`, 'g');
     content = content.replace(regex200, `bg-white border border-slate-200`);
  });

  // Since we replaced a bunch of bg-[color]-100 with borders, we might have added `border border-slate-200` multiple times if the string had it
  content = content.replace(/(border border-slate-[0-9]+ )+/g, 'border border-slate-200 ');
  content = content.replace(/bg-white bg-white/g, 'bg-white');

  // Convert text-colors inside these badges if they rely on text-[color]-800 to text-slate-800
  colors.forEach(c => {
     const textReg800 = new RegExp(`text-${c}-800`, 'g');
     content = content.replace(textReg800, 'text-slate-800');
     const textReg700 = new RegExp(`text-${c}-700`, 'g');
     content = content.replace(textReg700, 'text-slate-700');
  });

  // What about the "primary" dashboard components? 
  // Let's strip bg-purple-600, bg-blue-600 if they are used as primary buttons to bg-slate-900 or bg-red-900?
  // We'll leave buttons for now unless they specifically ask, the user said "cards colours and all pages colours into white".
  // Let's also check for any inline background strings inside template literals (like getGradeColor or getYearBadge)
  // Our regex above will catch it if it was e.g. 'bg-green-100 text-green-800' -> 'bg-white border border-slate-200 text-slate-800'
  // That actually works perfectly to turn colorful badges into monochrome outlined badges!
  
  // Dashboard overall view container that might be bg-gray-100
  content = content.replace(/bg-gray-100/g, 'bg-white border border-slate-100');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Whitewashed', file);
    updatedCount++;
  }
});

console.log(`Whitewashed ${updatedCount} files.`);
