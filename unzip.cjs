import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log("Unzipping...");
execSync('npx -y extract-zip-cli skill-swap-hub-main.zip -d extracted', { stdio: 'inherit' });
