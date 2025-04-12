const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 }
];

async function generateFavicons() {
  // Create an SVG buffer
  const svgBuffer = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <text x="50" y="70" font-size="80" text-anchor="middle" fill="black">♠</text>
    </svg>
  `);

  // Generate each size
  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, '../public', name));
  }

  // Generate ICO file (combining 16x16 and 32x32)
  const icoSizes = [16, 32];
  const icoBuffers = await Promise.all(
    icoSizes.map(size =>
      sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  // Save ICO file
  await sharp(icoBuffers[0])
    .resize(16, 16)
    .toFile(path.join(__dirname, '../public/favicon.ico'));
}

generateFavicons().catch(console.error); 