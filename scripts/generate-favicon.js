/**
 * Favicon Generator Script
 * 
 * Generates favicon.ico, apple-touch-icon.png, and various PNG sizes from SVG sources.
 * 
 * Usage:
 *   node scripts/generate-favicon.js
 */

const { Resvg } = require('@resvg/resvg-js');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

function renderSvgToPng(svgPath, size) {
  const svg = fs.readFileSync(svgPath, 'utf-8');
  const opts = {
    fitTo: {
      mode: 'width',
      value: size,
    },
    font: {
      loadSystemFonts: true,
    },
  };
  const resvg = new Resvg(svg, opts);
  const pngData = resvg.render();
  return pngData.asPng();
}

async function generateFavicons() {
  console.log('🎨 Generating favicons...\n');

  const faviconSvgPath = path.join(publicDir, 'favicon.svg');
  const appleTouchSvgPath = path.join(publicDir, 'apple-touch-icon.svg');
  const logoSvgPath = path.join(publicDir, 'logo.svg');

  // Generate PNG versions for ICO (16, 32, 48)
  const icoSizes = [16, 32, 48];
  const icoPngPaths = [];
  
  for (const size of icoSizes) {
    const outputPath = path.join(publicDir, `favicon-${size}x${size}.png`);
    const pngBuffer = renderSvgToPng(faviconSvgPath, size);
    fs.writeFileSync(outputPath, pngBuffer);
    icoPngPaths.push(outputPath);
    console.log(`  ✓ Generated favicon-${size}x${size}.png`);
  }

  // Generate apple-touch-icon.png (180x180)
  const appleTouchPng = renderSvgToPng(appleTouchSvgPath, 180);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchPng);
  console.log('  ✓ Generated apple-touch-icon.png (180x180)');

  // Generate additional sizes for web manifest
  const additionalSizes = [192, 512];
  for (const size of additionalSizes) {
    const pngBuffer = renderSvgToPng(logoSvgPath, size);
    fs.writeFileSync(path.join(publicDir, `icon-${size}x${size}.png`), pngBuffer);
    console.log(`  ✓ Generated icon-${size}x${size}.png`);
  }

  // Generate favicon.ico from the PNG files (using file paths)
  console.log('\n  ⏳ Generating favicon.ico...');
  try {
    const icoBuffer = await pngToIco.default(icoPngPaths);
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
    console.log('  ✓ Generated favicon.ico');
  } catch (err) {
    console.log('  ⚠ Could not generate favicon.ico:', err.message);
    console.log('  → Using favicon.svg as primary (supported by modern browsers)');
  }

  // Clean up intermediate PNG files used for ICO
  for (const pngPath of icoPngPaths) {
    fs.unlinkSync(pngPath);
  }
  console.log('  ✓ Cleaned up intermediate files');

  console.log('\n✅ All favicons generated successfully!');
  console.log('\nGenerated files in public/:');
  console.log('  • favicon.svg (vector, for modern browsers)');
  console.log('  • favicon.ico (multi-size, for legacy browsers)');
  console.log('  • apple-touch-icon.png (180x180, for iOS)');
  console.log('  • icon-192x192.png (for web manifest)');
  console.log('  • icon-512x512.png (for web manifest)');
  console.log('  • logo.svg (full logo)\n');
}

generateFavicons().catch(console.error);
