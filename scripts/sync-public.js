// scripts/sync-public.js — Syncs assets, data, and js into public/ before Vite build
import fs from 'fs';
import path from 'path';

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('🔄 Syncing assets, data, and js into public/ for Vercel/Vite build...');
copyRecursiveSync('assets', 'public/assets');
copyRecursiveSync('data', 'public/data');
copyRecursiveSync('js', 'public/js');
console.log('✅ Sync complete! All static assets ready for build.');
