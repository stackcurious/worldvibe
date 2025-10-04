#!/usr/bin/env node

/**
 * Convert SVG to PNG using sharp
 * Run: npm install --save-dev sharp
 * Then: node scripts/convert-svg-to-png.js
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// Check if sharp is installed
try {
  const sharp = require('sharp');

  console.log('Converting SVG to PNG...\n');

  // Convert OG Image
  sharp(path.join(publicDir, 'og-image.svg'))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, 'og-image.png'))
    .then(() => {
      console.log('✅ Created /public/og-image.png (1200x630)');
    })
    .catch(err => {
      console.error('❌ Error creating og-image.png:', err.message);
    });

  // Convert Logo
  sharp(path.join(publicDir, 'logo.svg'))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'logo.png'))
    .then(() => {
      console.log('✅ Created /public/logo.png (512x512)');
    })
    .catch(err => {
      console.error('❌ Error creating logo.png:', err.message);
    });

} catch (error) {
  console.log('❌ Sharp not installed. Install it with:');
  console.log('   npm install --save-dev sharp\n');
  console.log('Or use an online converter:');
  console.log('   - https://cloudconvert.com/svg-to-png');
  console.log('   - https://svgtopng.com/\n');
  console.log('SVG files are already available in /public/ and work for most use cases.');
}
