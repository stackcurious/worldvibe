#!/usr/bin/env node

/**
 * Generate OG Image and Logo for WorldVibe
 *
 * This script creates:
 * - /public/og-image.png (1200x630 for social media)
 * - /public/logo.png (512x512 square logo)
 *
 * Uses HTML Canvas API to generate images programmatically
 */

const fs = require('fs');
const path = require('path');

// Helper to create SVG as data URL
function createOGImageSVG() {
  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <!-- Background gradient -->
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e1b4b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#312e81;stop-opacity:1" />
        </linearGradient>

        <!-- Glow effect -->
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg)"/>

      <!-- Globe representation -->
      <circle cx="850" cy="315" r="200" fill="none" stroke="#4f46e5" stroke-width="2" opacity="0.3"/>
      <circle cx="850" cy="315" r="150" fill="none" stroke="#6366f1" stroke-width="2" opacity="0.4"/>
      <circle cx="850" cy="315" r="100" fill="none" stroke="#818cf8" stroke-width="2" opacity="0.5"/>

      <!-- Emotion dots -->
      <circle cx="750" cy="200" r="8" fill="#FFB800" filter="url(#glow)"/>
      <circle cx="920" cy="280" r="6" fill="#4CAF50" filter="url(#glow)"/>
      <circle cx="850" cy="400" r="7" fill="#2196F3" filter="url(#glow)"/>
      <circle cx="950" cy="350" r="5" fill="#FF9800" filter="url(#glow)"/>

      <!-- Main text -->
      <text x="80" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="96" font-weight="bold" fill="#ffffff">
        WorldVibe
      </text>

      <!-- Subtitle -->
      <text x="80" y="310" font-family="system-ui, -apple-system, sans-serif" font-size="36" fill="#a5b4fc">
        Global Emotional Check-In Platform
      </text>

      <!-- Tagline -->
      <text x="80" y="390" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#e0e7ff">
        Share your feelings. Explore the world's pulse.
      </text>

      <!-- Stats -->
      <g opacity="0.8">
        <text x="80" y="500" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#c7d2fe">
          🌍 Real-time emotions from around the world
        </text>
        <text x="80" y="540" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#c7d2fe">
          🔒 100% Anonymous · Privacy-First
        </text>
      </g>
    </svg>
  `.trim();
}

function createLogoSVG() {
  return `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <defs>
        <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
        </linearGradient>

        <filter id="logoGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Rounded background -->
      <rect width="512" height="512" rx="80" fill="url(#logoBg)"/>

      <!-- Globe circles -->
      <circle cx="256" cy="256" r="140" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.3"/>
      <circle cx="256" cy="256" r="100" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.5"/>
      <circle cx="256" cy="256" r="60" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.7"/>

      <!-- Emotion dots -->
      <circle cx="180" cy="180" r="12" fill="#FFB800" filter="url(#logoGlow)"/>
      <circle cx="330" cy="220" r="10" fill="#4CAF50" filter="url(#logoGlow)"/>
      <circle cx="256" cy="340" r="11" fill="#2196F3" filter="url(#logoGlow)"/>
      <circle cx="350" cy="300" r="9" fill="#FF9800" filter="url(#logoGlow)"/>
      <circle cx="200" cy="320" r="10" fill="#10B981" filter="url(#logoGlow)"/>

      <!-- Center icon -->
      <circle cx="256" cy="256" r="30" fill="#ffffff" opacity="0.9"/>
      <text x="256" y="276" font-family="system-ui" font-size="40" text-anchor="middle" fill="#4f46e5">
        🌍
      </text>

      <!-- Text (optional - can be removed for icon-only logo) -->
      <text x="256" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">
        WorldVibe
      </text>
    </svg>
  `.trim();
}

// Save SVG files
const publicDir = path.join(__dirname, '../public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Save OG Image as SVG (browsers support SVG in og:image)
fs.writeFileSync(
  path.join(publicDir, 'og-image.svg'),
  createOGImageSVG()
);

// Save Logo as SVG
fs.writeFileSync(
  path.join(publicDir, 'logo.svg'),
  createLogoSVG()
);

console.log('✅ Generated /public/og-image.svg (1200x630)');
console.log('✅ Generated /public/logo.svg (512x512)');
console.log('');
console.log('📝 Next steps:');
console.log('1. SVG images are ready to use immediately');
console.log('2. To convert to PNG, use an online tool like:');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - https://svgtopng.com/');
console.log('3. Or install sharp/canvas and run:');
console.log('   npm install --save-dev sharp');
console.log('   node scripts/convert-svg-to-png.js');
console.log('');
console.log('🎨 Customize the design by editing scripts/generate-images.js');
