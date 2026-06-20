const { Jimp, rgbaToInt, intToRGBA } = require('jimp');

async function fixIcon(imagePath, targetPath) {
  try {
    const image = await Jimp.read(imagePath);
    const color = image.getPixelColor(512, 10);
    
    // Create a solid background
    const bg = new Jimp({ width: 1024, height: 1024, color });
    
    // Composite original on top
    bg.composite(image, 0, 0);
    
    await bg.write(targetPath);
    console.log(`Successfully processed ${targetPath}`);
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error);
  }
}

async function run() {
  console.log('Fixing Provider icon...');
  await fixIcon('./assets/icon.png', './assets/icon.png');
  await fixIcon('./assets/adaptive-icon.png', './assets/adaptive-icon.png');
  
  console.log('Fixing Customer icon...');
  await fixIcon('../customer-mobile/assets/icon.png', '../customer-mobile/assets/icon.png');
  await fixIcon('../customer-mobile/assets/adaptive-icon.png', '../customer-mobile/assets/adaptive-icon.png');
}

run();
