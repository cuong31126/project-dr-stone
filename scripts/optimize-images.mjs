import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function getAllImageFiles(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files = files.concat(getAllImageFiles(full));
    } else if (/\.(jpe?g|png)$/i.test(item)) {
      files.push(full);
    }
  }
  return files;
}

async function optimizeImage(filePath) {
  const stat = fs.statSync(filePath);
  const sizeBeforeKB = stat.size / 1024;
  if (sizeBeforeKB < 150) {
    return null; // Skip already small images
  }

  const ext = path.extname(filePath).toLowerCase();

  try {
    const inputBuffer = fs.readFileSync(filePath);
    let pipeline = sharp(inputBuffer);
    const meta = await pipeline.metadata();

    let maxW = 1600;
    if (meta.width && meta.width > maxW) {
      pipeline = pipeline.resize({ width: maxW, withoutEnlargement: true });
    }

    let outputBuffer;
    if (ext === '.png') {
      outputBuffer = await pipeline.png({ quality: 82, compressionLevel: 8 }).toBuffer();
    } else {
      outputBuffer = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    }

    const sizeAfterKB = outputBuffer.length / 1024;

    if (outputBuffer.length < inputBuffer.length) {
      fs.writeFileSync(filePath, outputBuffer);
      console.log(`✅ [${filePath}] ${(sizeBeforeKB).toFixed(1)} KB -> ${(sizeAfterKB).toFixed(1)} KB (-${(100 - (sizeAfterKB/sizeBeforeKB)*100).toFixed(0)}%)`);
      return { filePath, before: sizeBeforeKB, after: sizeAfterKB };
    }
    return null;
  } catch (err) {
    console.error(`❌ Error optimizing ${filePath}:`, err.message);
    return null;
  }
}

async function run() {
  console.log('🚀 Chạy tối ưu hóa hình ảnh đợt 2 (buffer memory)...');
  const files = getAllImageFiles('assets');
  let count = 0;
  for (const file of files) {
    const res = await optimizeImage(file);
    if (res) count++;
  }
  console.log(`\n🎉 Đã nén thêm ${count} ảnh còn lại.`);
}

run();
