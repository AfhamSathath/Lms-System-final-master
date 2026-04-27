const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
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

const targetDir = path.join(__dirname, 'src', 'pages');
const files = getFiles(targetDir);
console.log(`Found ${files.length} jsx files to scan.`);

let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace gradient background of headers with white
  content = content.replace(/bg-gradient-to-[a-z]+ from-purple-600 to-pink-600/g, 'bg-white border border-slate-200');
  content = content.replace(/bg-gradient-to-[a-z]+ from-blue-600 to-purple-600/g, 'bg-white border border-slate-200');

  // Fix text colors in these converted white boxes
  content = content.replace(/className="bg-white border border-slate-200 ([^"]*)text-white/g, 'className="bg-white border border-slate-200 $1text-slate-900');
  content = content.replace(/className={\`bg-white border border-slate-200 ([^`]*?)text-white/g, 'className={`bg-white border border-slate-200 $1text-slate-900');

  // Subtitle colors generally attached near headers
  content = content.replace(/text-purple-100/g, 'text-slate-500');
  content = content.replace(/text-blue-100/g, 'text-slate-500');
  
  // Also replace some nested text-white elements that are now inside the white box 
  // (We'll do a broader pass for specific elements we saw)
  content = content.replace(/className="text-white text-opacity-90/g, 'className="text-slate-500');
  
  // Specific fix for timetable cards which might be individual card elements
  content = content.replace(/bg-gradient-to-r from-purple-600 to-pink-[A-Za-z0-9-]+/g, 'bg-white border border-slate-200');
  content = content.replace(/bg-gradient-to-r from-blue-600 to-purple-[A-Za-z0-9-]+/g, 'bg-white border border-slate-200');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
    updatedCount++;
  }
});

console.log(`Finished processing. Updated ${updatedCount} files.`);
