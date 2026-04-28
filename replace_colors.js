/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      content = content.replace(/#FF8C42/gi, 'var(--color-primary)');
      content = content.replace(/#F27E33/gi, 'var(--color-primary-hover)');
      content = content.replace(/#FFF6EE/gi, 'var(--color-primary-light)');
      content = content.replace(/#F8F9FA/gi, 'var(--color-background)');
      
      content = content.replace(/<input([^>]*?)className="([^"]*?)"/gi, (match, p1, p2) => {
        let newClasses = p2.replace(/text-(?:gray|slate|zinc|neutral|stone|black|white)(?:-\d+)?/g, '').replace(/\s+/g, ' ').trim();
        newClasses += ' text-[var(--color-text-input)]';
        return `<input${p1}className="${newClasses}"`;
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated ' + fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'app'));
processDir(path.join(__dirname, 'components'));
