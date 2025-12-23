const { Resvg } = require('@resvg/resvg-js');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

function renderSvgToPng(svgPath, size) {
  const svg = fs.readFileSync(svgPath, 'utf-8');
  const opts = {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: true },
  };
  const resvg = new Resvg(svg, opts);
  return resvg.render().asPng();
}

async function generateFavicons() {
  console.log('🎨 Generating favicons...\n');

  const faviconSvgPath = path.join(publicDir, 'favicon.svg');
  const appleTouchSvgPath = path.join(publicDir, 'apple-touch-icon.svg');
  const logoSvgPath = path.join(publicDir, 'logo.svg');

  const icoSizes = [16, 32, 48];
  const icoPngPaths = [];
  
  for (const size of icoSizes) {
    const outputPath = path.join(publicDir, `favicon-${size}x${size}.png`);
    const pngBuffer = renderSvgToPng(faviconSvgPath, size);
    fs.writeFileSync(outputPath, pngBuffer);
    icoPngPaths.push(outputPath);
    console.log(`  ✓ Generated favicon-${size}x${size}.png`);
  }

  const appleTouchPng = renderSvgToPng(appleTouchSvgPath, 180);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchPng);
  console.log('  ✓ Generated apple-touch-icon.png (180x180)');

  const additionalSizes = [192, 512];
  for (const size of additionalSizes) {
    const pngBuffer = renderSvgToPng(logoSvgPath, size);
    fs.writeFileSync(path.join(publicDir, `icon-${size}x${size}.png`), pngBuffer);
    console.log(`  ✓ Generated icon-${size}x${size}.png`);
  }

  console.log('\n  ⏳ Generating favicon.ico...');
  try {
    const icoBuffer = await pngToIco.default(icoPngPaths);
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
    console.log('  ✓ Generated favicon.ico');
  } catch (err) {
    console.log('  ⚠ Could not generate favicon.ico:', err.message);
    console.log('  → Using favicon.svg as primary (supported by modern browsers)');
  }

  for (const pngPath of icoPngPaths) {
    fs.unlinkSync(pngPath);
  }
  console.log('  ✓ Cleaned up intermediate files');

  console.log('\n✅ All favicons generated successfully!\n');
}

generateFavicons().catch(console.error);
