const fs = require('fs');
const content = fs.readFileSync('app/venue/[id]/page.tsx', 'utf8');

['Xでポスト', '審査員として投票', '審査員モード', 'border-l-2', 'border-black'].forEach(q => {
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes(q)) {
      console.log('Line ' + (i + 1) + ': ' + line.trim());
    }
  });
});
