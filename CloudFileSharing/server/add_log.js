const fs = require('fs');
const path = 'c:/Pranav/Project/CloudFileSharing/server/controllers/fileController.js';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  'file.viewCount += 1;',
  'console.log([View Tracking] Incrementing view count for file: \);\n    file.viewCount += 1;'
);
fs.writeFileSync(path, content, 'utf8');
console.log('Added log to getFile');