const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'skill-swap-hub-main');
const destDir = __dirname;

const files = fs.readdirSync(srcDir);
for (const file of files) {
  fs.renameSync(path.join(srcDir, file), path.join(destDir, file));
}
fs.rmdirSync(srcDir);
