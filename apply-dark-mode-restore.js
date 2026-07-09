const fs = require('fs');
const files = [
  'components/ResultPostCard.tsx',
  'components/TimeAgo.tsx',
  'components/RippleLink.tsx'
];

const reps = [
  [/(?<![a-z:-])bg-white(?![\w])/g, 'bg-white dark:bg-black'],
  [/(?<![a-z:-])border-white(?![\w])/g, 'border-white dark:border-black'],
  [/(?<![a-z:-])text-black(?![\/a-z0-9])/g, 'text-black dark:text-white'],
  [/(?<![a-z:-])text-black\/([0-9]+)/g, 'text-black/$1 dark:text-white/$1'],
  [/(?<![a-z:-])bg-black(?![\/a-z0-9])/g, 'bg-black dark:bg-white'],
  [/(?<![a-z:-])bg-black\/([0-9]+)/g, 'bg-black/$1 dark:bg-white/$1'],
  [/(?<![a-z:-])border-black(?![\/a-z0-9])/g, 'border-black dark:border-white'],
  [/(?<![a-z:-])border-black\/([0-9]+)/g, 'border-black/$1 dark:border-white/$1'],
  [/(?<![a-z:-])bg-gray-50(?![0-9])/g, 'bg-gray-50 dark:bg-gray-950'],
  [/(?<![a-z:-])bg-gray-100(?![0-9])/g, 'bg-gray-100 dark:bg-gray-900'],
  [/(?<![a-z:-])bg-gray-200(?![0-9])/g, 'bg-gray-200 dark:bg-gray-800'],
  [/(?<![a-z:-])bg-gray-300(?![0-9])/g, 'bg-gray-300 dark:bg-gray-700'],
  [/(?<![a-z:-])bg-gray-400(?![0-9])/g, 'bg-gray-400 dark:bg-gray-600'],
  [/(?<![a-z:-])bg-gray-800(?![0-9])/g, 'bg-gray-800 dark:bg-gray-200'],
  [/(?<![a-z:-])bg-gray-900(?![0-9])/g, 'bg-gray-900 dark:bg-gray-100'],
  [/(?<![a-z:-])text-gray-400(?![0-9])/g, 'text-gray-400 dark:text-gray-600'],
  [/(?<![a-z:-])text-gray-500(?![0-9])/g, 'text-gray-500 dark:text-gray-400'],
  [/(?<![a-z:-])text-gray-600(?![0-9])/g, 'text-gray-600 dark:text-gray-400'],
  [/(?<![a-z:-])text-gray-700(?![0-9])/g, 'text-gray-700 dark:text-gray-300'],
  [/(?<![a-z:-])text-gray-800(?![0-9])/g, 'text-gray-800 dark:text-gray-200'],
  [/(?<![a-z:-])text-gray-900(?![0-9])/g, 'text-gray-900 dark:text-gray-100'],
  [/(?<![a-z:-])border-gray-200(?![0-9])/g, 'border-gray-200 dark:border-gray-800'],
  [/(?<![a-z:-])border-gray-300(?![0-9])/g, 'border-gray-300 dark:border-gray-700'],
  [/(?<![a-z:-])border-gray-400(?![0-9])/g, 'border-gray-400 dark:border-gray-600'],
  [/(?<![a-z:-])divide-gray-200(?![0-9])/g, 'divide-gray-200 dark:divide-gray-800'],
  [/(?<![a-z:-])divide-gray-300(?![0-9])/g, 'divide-gray-300 dark:divide-gray-700'],
  [/(?<![a-z:-])divide-gray-400(?![0-9])/g, 'divide-gray-400 dark:divide-gray-600'],
  [/(?<![a-z:-])hover:bg-gray-50(?![0-9])/g, 'hover:bg-gray-50 dark:hover:bg-gray-900'],
  [/(?<![a-z:-])hover:bg-gray-100(?![0-9])/g, 'hover:bg-gray-100 dark:hover:bg-gray-800'],
  [/(?<![a-z:-])hover:bg-gray-200(?![0-9])/g, 'hover:bg-gray-200 dark:hover:bg-gray-700'],
  [/(?<![a-z:-])hover:bg-gray-300(?![0-9])/g, 'hover:bg-gray-300 dark:hover:bg-gray-600'],
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Apply regex
    for (const [regex, replacement] of reps) {
      content = content.replace(regex, replacement);
    }
    
    fs.writeFileSync(file, content);
    console.log('Processed', file);
  } else {
    console.log('Not found', file);
  }
}
