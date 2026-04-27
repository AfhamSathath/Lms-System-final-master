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

  // Replace light gray/slate borders with dark black borders
  content = content.replace(/border-gray-[12345]00/g, 'border-black');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated gray borders in', file);
    updatedCount++;
  }
});

console.log(`Updated ${updatedCount} files to dark black borders.`);
