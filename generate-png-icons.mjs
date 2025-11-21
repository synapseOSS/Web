import { writeFileSync } from 'fs';
import { createCanvas, loadImage } from 'canvas';

const sizes = [192, 512];

// SVG content for Synapse logo
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#grad)"/>
  <circle cx="256" cy="180" r="40" fill="white" opacity="0.9"/>
  <circle cx="180" cy="280" r="35" fill="white" opacity="0.8"/>
  <circle cx="332" cy="280" r="35" fill="white" opacity="0.8"/>
  <circle cx="256" cy="360" r="30" fill="white" opacity="0.7"/>
  <line x1="256" y1="220" x2="180" y2="245" stroke="white" stroke-width="8" opacity="0.6"/>
  <line x1="256" y1="220" x2="332" y2="245" stroke="white" stroke-width="8" opacity="0.6"/>
  <line x1="180" y1="315" x2="256" y2="330" stroke="white" stroke-width="6" opacity="0.5"/>
  <line x1="332" y1="315" x2="256" y2="330" stroke="white" stroke-width="6" opacity="0.5"/>
</svg>
`;

async function generatePNGIcons() {
  console.log('🎨 Generating PNG icons for PWA...\n');

  for (const size of sizes) {
    try {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      // Load SVG as image
      const svgBuffer = Buffer.from(svgContent);
      const img = await loadImage(svgBuffer);
      
      ctx.drawImage(img, 0, 0, size, size);

      // Save as PNG
      const buffer = canvas.toBuffer('image/png');
      const filename = `public/icons/icon-${size}x${size}.png`;
      writeFileSync(filename, buffer);
      
      console.log(`✅ Generated: ${filename}`);
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size}:`, error.message);
    }
  }

  console.log('\n✨ Done! Your PWA icons are ready.');
  console.log('\nNext steps:');
  console.log('1. Restart your dev server');
  console.log('2. Open Chrome DevTools > Application > Manifest');
  console.log('3. Check for any remaining issues');
}

generatePNGIcons().catch(console.error);
