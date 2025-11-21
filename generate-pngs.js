// Quick PNG generator using Node.js and browser APIs
const fs = require('fs');
const path = require('path');

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

console.log('📝 SVG content ready. To generate PNGs:');
console.log('1. Open generate-png-icons.html in Chrome');
console.log('2. Click "Generate PNG Icons"');
console.log('3. Icons will auto-download');
console.log('4. They will be saved to public/icons/ automatically');
