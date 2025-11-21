const fs = require('fs');
const sharp = require('sharp');

const sizes = [192, 512];
const svgFile = 'public/icons/icon-192x192.svg';

console.log('🎨 Generating PNG icons for PWA...\n');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgFile);
  
  for (const size of sizes) {
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(`public/icons/icon-${size}x${size}.png`);
      console.log(`✅ Generated icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`❌ Error generating ${size}x${size}:`, err.message);
    }
  }
  
  console.log('\n✨ Done! PNG icons created.');
  console.log('📱 Restart your dev server to enable PWA installation.');
}

generateIcons().catch(console.error);
