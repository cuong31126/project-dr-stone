import fs from 'fs';
import path from 'path';

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n========================================`);
  console.log(`FILE: ${filePath} (${(content.length / 1024).toFixed(1)} KB)`);
  console.log(`========================================`);

  // CDNs and scripts
  const scripts = [...content.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
  const links = [...content.matchAll(/<link[^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
  const imgs = [...content.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);

  console.log('Scripts:', scripts);
  console.log('Links:', links);
  console.log(`Images (${imgs.length}):`, imgs.slice(0, 10), imgs.length > 10 ? `...and ${imgs.length - 10} more` : '');
}

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
htmlFiles.forEach(f => analyzeFile(f));

// Also check data directory (episodes.json, characters.json, etc.)
if (fs.existsSync('data')) {
  const dataFiles = fs.readdirSync('data');
  console.log('\n========================================');
  console.log('DATA FILES:', dataFiles);
  dataFiles.forEach(df => {
    const p = path.join('data', df);
    const stat = fs.statSync(p);
    console.log(`- ${p}: ${(stat.size / 1024).toFixed(1)} KB`);
    if (df.endsWith('.json')) {
      try {
        const json = JSON.parse(fs.readFileSync(p, 'utf8'));
        console.log(`  Items count: ${Array.isArray(json) ? json.length : Object.keys(json).length}`);
        // Check for image URLs
        const str = JSON.stringify(json);
        const externalImages = str.match(/https?:\/\/[^"'\\]+\.(jpg|jpeg|png|webp|gif|avif)/gi) || [];
        console.log(`  External images in JSON: ${externalImages.length}`);
        if (externalImages.length > 0) {
          console.log(`  Sample external images:`, externalImages.slice(0, 5));
        }
      } catch (e) {
        console.error(`  Error parsing JSON:`, e.message);
      }
    }
  });
}

// Check total size of assets directory
function getDirSize(dir) {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      total += getDirSize(full);
    } else {
      total += stat.size;
    }
  }
  return total;
}

console.log('\n========================================');
console.log('ASSETS SIZE:');
console.log('assets/:', (getDirSize('assets') / 1024 / 1024).toFixed(2), 'MB');
console.log('public/:', (getDirSize('public') / 1024 / 1024).toFixed(2), 'MB');
console.log('dist/:', (getDirSize('dist') / 1024 / 1024).toFixed(2), 'MB');
console.log('cactapss3/:', (getDirSize('cactapss3') / 1024 / 1024).toFixed(2), 'MB');
