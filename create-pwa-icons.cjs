const fs = require('fs');
const { exec } = require('child_process');

// Check if ImageMagick or similar is available
console.log('🎨 Creating PWA Icons...\n');

const svgFile = 'public/icons/icon-192x192.svg';
const sizes = [192, 512];

console.log('⚠️  PNG icons are required for Chrome PWA installation.\n');
console.log('Option 1: Use online converter');
console.log('  1. Go to https://cloudconvert.com/svg-to-png');
console.log('  2. Upload public/icons/icon-192x192.svg');
console.log('  3. Convert to 192x192 PNG and 512x512 PNG');
console.log('  4. Save as icon-192x192.png and icon-512x512.png in public/icons/\n');

console.log('Option 2: Use generate-png-icons.html');
console.log('  1. Open generate-png-icons.html in Chrome');
console.log('  2. Click "Generate PNG Icons"');
console.log('  3. Move downloaded files to public/icons/\n');

console.log('Option 3: Install sharp package');
console.log('  npm install sharp');
console.log('  Then run this script again\n');

// Try to use sharp if available
try {
  const sharp = require('sharp');
  
  console.log('✅ Sharp found! Generating icons...\n');
  
  const svgBuffer = fs.readFileSync(svgFile);
  
  sizes.forEach(async (size) => {
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(`public/icons/icon-${size}x${size}.png`);
      console.log(`✅ Generated icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`❌ Error generating ${size}x${size}:`, err.message);
    }
  });
  
  console.log('\n✨ Done! Restart your dev server.');
} catch (e) {
  console.log('ℹ️  Sharp not installed. Use one of the options above.');
}
