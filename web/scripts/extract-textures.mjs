#!/usr/bin/env node
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ZIP_PATH = join(
  __dirname,
  '../../../test-server/resource-pack-host/Slimefun 1.21.5+ v2.2_fixed.zip'
);
const OUT_DIR = join(__dirname, '../public/textures');
const PS1_PATH = join(__dirname, 'extract-textures.ps1');

console.log('Extracting Slimefun resource pack textures...');

execFileSync(
  'pwsh',
  ['-ExecutionPolicy', 'Bypass', '-File', PS1_PATH, '-ZipPath', ZIP_PATH, '-OutDir', OUT_DIR],
  { stdio: 'inherit' }
);
