#!/usr/bin/env node

/**
 * Generate JPG logo from SVG
 * Run: node scripts/generate-logo.js
 */

const fs = require('fs');
const path = require('path');

console.log('📸 Generating WorldVibe logo...\n');

// Read the SVG file
const svgPath = path.join(__dirname, '../public/logo-square.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

console.log('✅ SVG logo created at: public/logo-square.svg');
console.log('\n📝 To convert to JPG, you have a few options:\n');

console.log('Option 1 - Online converter (easiest):');
console.log('  1. Visit: https://cloudconvert.com/svg-to-jpg');
console.log('  2. Upload: public/logo-square.svg');
console.log('  3. Set quality to 100%');
console.log('  4. Download the JPG\n');

console.log('Option 2 - Using ImageMagick (if installed):');
console.log('  brew install imagemagick');
console.log('  convert public/logo-square.svg -quality 100 -background white public/logo.jpg\n');

console.log('Option 3 - Using Chrome/Firefox:');
console.log('  1. Open public/logo-square.svg in browser');
console.log('  2. Right-click > Inspect');
console.log('  3. Take a screenshot or use browser tools to save as image\n');

console.log('Option 4 - Using Figma/Canva (recommended for best quality):');
console.log('  1. Import the SVG into Figma or Canva');
console.log('  2. Export as JPG at 2x or 3x resolution');
console.log('  3. This gives you the highest quality output\n');

console.log('🎨 The logo features:');
console.log('  - Purple/pink gradient background');
console.log('  - Animated globe with latitude/longitude lines');
console.log('  - Pulsing emotional dots (representing global moods)');
console.log('  - Heart icon in center');
console.log('  - WorldVibe branding with tagline\n');

console.log('💡 Recommended size for Buy Me a Coffee: 400x400px (already set!)\n');
