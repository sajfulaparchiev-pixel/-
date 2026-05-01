const fs = require('fs');
const { execSync } = require('child_process');
execSync('npx -y extract-zip-cli skill-swap-hub-main.zip .', { stdio: 'inherit' });
