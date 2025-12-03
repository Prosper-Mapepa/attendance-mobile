// Logo Conversion Script
// Converts logo.svg to required PNG formats for mobile app
// Install sharp: npm install sharp

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'splash-icon.png', size: 2048 },
  { name: 'favicon.png', size: 48 }
];

const svgPath = path.join(__dirname, 'assets', 'logo.svg');
const outputDir = path.join(__dirname, 'assets');

async function convertLogo() {
  console.log('🎨 Converting AttendIQ logo to PNG formats with color #8F1A27...\n');

  // Check if logo.svg exists
  if (!fs.existsSync(svgPath)) {
    console.error('❌ Error: logo.svg not found in assets folder');
    process.exit(1);
  }

  for (const { name, size } of sizes) {
    try {
      const outputPath = path.join(outputDir, name);
      
      await sharp(svgPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message);
    }
  }

  console.log('\n🎉 Logo conversion complete!');
  console.log('📱 Your PNG files are ready in the assets folder.');
}

convertLogo();