import fs from 'fs';

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let count = 0;

  let updated = content.replace(/<img\b([^>]*?)>/gi, (match) => {
    let res = match;
    if (!/loading=/i.test(match)) {
      res = res.replace(/<img\b/i, '<img loading="lazy"');
      count++;
    }
    if (!/decoding=/i.test(match)) {
      res = res.replace(/<img\b/i, '<img decoding="async"');
      count++;
    }
    return res;
  });

  if (updated !== content) {
    fs.writeFileSync(file, updated);
    console.log(`✅ [${file}] Updated ${count} img attributes.`);
  } else {
    console.log(`ℹ️ [${file}] No img updates needed.`);
  }
});
