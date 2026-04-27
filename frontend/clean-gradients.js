const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'sidebar.jsx') continue;
    
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

  // General catch all for gradients in classNames
  // We want to replace "bg-gradient-to-[a-z]+ from-[a-z]+-[0-9]+ to-[a-z]+-[0-9]+ text-white" with "bg-white border border-slate-200 text-slate-900"
  // But regex for that is tricky with varying number of classes.
  
  // Registrar Dashboard
  content = content.replace(/bg-gradient-to-r from-purple-600 via-pink-600 to-red-600([^"]*) text-white/g, 'bg-white border border-slate-200$1 text-slate-900');
  
  // HOD Dashboard
  content = content.replace(/bg-gradient-to-r from-purple-600 to-indigo-600([^"]*) text-white/g, 'bg-white border border-slate-200$1 text-slate-900');
  
  // Students ones
  content = content.replace(/bg-gradient-to-r from-blue-600 to-indigo-700([^"]*) text-white/g, 'bg-white border border-slate-200$1 text-slate-900');
  content = content.replace(/bg-gradient-to-r from-emerald-600 to-teal-700([^"]*) text-white/g, 'bg-white border border-slate-200$1 text-slate-900');
  content = content.replace(/bg-gradient-to-r from-indigo-100 to-fuchsia-100/g, 'bg-white border border-slate-200');
  content = content.replace(/bg-gradient-to-r from-slate-800 to-slate-900/g, 'bg-white border-b border-slate-200');
  
  // Others
  content = content.replace(/bg-gradient-to-r from-blue-600 to-blue-800([^"]*) text-white/g, 'bg-white border border-slate-200$1 text-slate-900');
  content = content.replace(/bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700/g, 'bg-white border border-slate-200');
  content = content.replace(/bg-gradient-to-r from-indigo-600 to-purple-700([^"]*) text-white/g, 'bg-white border border-slate-200$1 text-slate-900');
  content = content.replace(/bg-gradient-to-r from-purple-600 to-pink-600/g, 'bg-white border border-slate-200');
  
  // Clean up any stray `text-white` on these blocks that might be on h1 tags
  if (content.includes('Welcome back,') && content.includes('text-3xl font-bold text-white')) {
      content = content.replace(/text-3xl font-bold text-white/g, 'text-3xl font-bold text-slate-900');
  }

  // Check if anything was replaced
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Removed gradients from', file);
    updatedCount++;
  }
});

console.log(`Updated ${updatedCount} files.`);
