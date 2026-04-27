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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // The cards themselves:
  // "bg-white border md:text-3xl font-bold" -> sometimes text-white needs removing
  
  // Convert standard text-white headings that were inside gradient boxes
  content = content.replace(/className="text-lg font-semibold text-white"/g, 'className="text-lg font-semibold text-slate-900"');
  content = content.replace(/className="text-xl font-bold text-white mb-2"/g, 'className="text-xl font-bold text-slate-900 mb-2"');
  content = content.replace(/className="text-2xl md:text-3xl font-bold text-white"/g, 'className="text-2xl md:text-3xl font-bold text-slate-900"');
  
  // Dashboard title headers:
  content = content.replace(/className="text-3xl md:text-4xl font-bold text-white mb-4"/g, 'className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"');
  content = content.replace(/className="text-2xl md:text-3xl font-bold text-white mb-4"/g, 'className="text-2xl md:text-3xl font-bold text-slate-900 mb-4"');
  content = content.replace(/className="text-purple-100 text-lg/g, 'className="text-slate-500 text-lg');

  // Any remaining h1/h2 tags that explicitly have text-white
  content = content.replace(/<h1 className="text-([0-9A-Za-z\-]+) font-([A-Za-z\-]+) text-white/g, '<h1 className="text-$1 font-$2 text-slate-900');
  content = content.replace(/<h2 className="text-([0-9A-Za-z\-]+) font-([A-Za-z\-]+) text-white/g, '<h2 className="text-$1 font-$2 text-slate-900');
  content = content.replace(/<h3 className="text-([0-9A-Za-z\-]+) font-([A-Za-z\-]+) text-white/g, '<h3 className="text-$1 font-$2 text-slate-900');

  // Convert translucent white badges to slate badges
  content = content.replace(/className="px-2 py-1 bg-white bg-opacity-20 text-white/g, 'className="px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200');

  // Replace text-purple-100/text-blue-100 anywhere inside these files
  content = content.replace(/text-purple-100/g, 'text-slate-500');
  content = content.replace(/text-purple-200/g, 'text-slate-400');
  content = content.replace(/text-blue-100/g, 'text-slate-500');

  // Subtitle variants 
  content = content.replace(/className="text-white mt-1/g, 'className="text-slate-500 mt-1');
  
  // Replace dashboard icons that are "bg-white bg-opacity-20"
  content = content.replace(/className="p-3 bg-white bg-opacity-20/g, 'className="p-3 bg-slate-100 border border-slate-200');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Fixed text colors in', file);
  }
});
