const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');
const png2icons = require('png2icons');

const rootDir = path.resolve(__dirname, '..');
const assetsDir = path.join(rootDir, 'assets');
const sourcePng = path.join(assetsDir, 'icon.png');
const icoPath = path.join(assetsDir, 'icon.ico');
const icnsPath = path.join(assetsDir, 'icon.icns');

if (!fs.existsSync(sourcePng)) {
  console.error(`Missing source icon at ${sourcePng}`);
  process.exit(1);
}

const pngBuffer = fs.readFileSync(sourcePng);

// Generate ICO (Windows)
pngToIco(pngBuffer)
  .then((icoBuffer) => {
    fs.writeFileSync(icoPath, icoBuffer);
    console.log(`Wrote ${icoPath}`);
  })
  .catch((err) => {
    console.error('Failed to generate ICO:', err);
    process.exit(1);
  });

// Generate ICNS (macOS)
try {
  const icnsBuffer = png2icons.createICNS(pngBuffer, png2icons.BEZIER, 0);
  if (!icnsBuffer) {
    throw new Error('png2icons returned empty ICNS buffer');
  }
  fs.writeFileSync(icnsPath, icnsBuffer);
  console.log(`Wrote ${icnsPath}`);
} catch (err) {
  console.error('Failed to generate ICNS:', err);
  process.exit(1);
}
