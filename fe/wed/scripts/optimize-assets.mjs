import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');
const imagesDir = path.join(publicDir, 'images');

const assetsToOptimize = [
  {
    input: path.join(imagesDir, 'service_cleaning.png'),
    output: path.join(imagesDir, 'service_cleaning.webp'),
    width: 600, // Resize ảnh fallback về kích thước hợp lý cho card
  },
  {
    input: path.join(imagesDir, 'service_repair.png'),
    output: path.join(imagesDir, 'service_repair.webp'),
    width: 600,
  },
  {
    input: path.join(imagesDir, 'hero_bg.png'),
    output: path.join(imagesDir, 'hero_bg.webp'),
    width: 1440, // Resize background hero về kích thước màn hình phổ biến
  }
];

async function optimize() {
  console.log('--- Bắt đầu tối ưu hóa hình ảnh tĩnh ---');
  for (const asset of assetsToOptimize) {
    if (!fs.existsSync(asset.input)) {
      console.warn(`File không tồn tại: ${asset.input}`);
      continue;
    }
    
    try {
      console.log(`Đang tối ưu: ${path.basename(asset.input)}...`);
      await sharp(asset.input)
        .resize({ width: asset.width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(asset.output);
        
      const origSize = fs.statSync(asset.input).size;
      const optSize = fs.statSync(asset.output).size;
      const reduction = ((origSize - optSize) / origSize * 100).toFixed(1);
      
      console.log(`=> Đã tạo: ${path.basename(asset.output)}`);
      console.log(`   Dung lượng: ${(origSize / 1024).toFixed(1)} KB -> ${(optSize / 1024).toFixed(1)} KB (Giảm ${reduction}%)`);
    } catch (error) {
      console.error(`Lỗi khi tối ưu file ${asset.input}:`, error);
    }
  }
  console.log('--- Hoàn tất tối ưu hóa hình ảnh ---');
}

optimize();
