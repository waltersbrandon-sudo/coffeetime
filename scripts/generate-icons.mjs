import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

// Coffee cup icon as SVG - minimal design with coffee cup on dark background
const createCoffeeIconSvg = (size) => {
  const padding = size * 0.15;
  const cupWidth = size * 0.45;
  const cupHeight = size * 0.4;
  const cupX = (size - cupWidth) / 2;
  const cupY = size * 0.35;
  const handleWidth = size * 0.12;
  const handleHeight = size * 0.2;
  const steamHeight = size * 0.12;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark background -->
  <rect width="${size}" height="${size}" fill="#0A0A0B"/>

  <!-- Coffee cup body -->
  <path d="
    M ${cupX} ${cupY}
    L ${cupX + cupWidth * 0.08} ${cupY + cupHeight}
    Q ${cupX + cupWidth * 0.08} ${cupY + cupHeight + size * 0.05} ${cupX + cupWidth * 0.2} ${cupY + cupHeight + size * 0.05}
    L ${cupX + cupWidth * 0.8} ${cupY + cupHeight + size * 0.05}
    Q ${cupX + cupWidth * 0.92} ${cupY + cupHeight + size * 0.05} ${cupX + cupWidth * 0.92} ${cupY + cupHeight}
    L ${cupX + cupWidth} ${cupY}
    Z
  " fill="#D4A574"/>

  <!-- Cup rim highlight -->
  <rect x="${cupX}" y="${cupY}" width="${cupWidth}" height="${size * 0.03}" rx="${size * 0.01}" fill="#E8C9A0"/>

  <!-- Handle -->
  <path d="
    M ${cupX + cupWidth} ${cupY + cupHeight * 0.2}
    Q ${cupX + cupWidth + handleWidth} ${cupY + cupHeight * 0.2} ${cupX + cupWidth + handleWidth} ${cupY + cupHeight * 0.5}
    Q ${cupX + cupWidth + handleWidth} ${cupY + cupHeight * 0.8} ${cupX + cupWidth} ${cupY + cupHeight * 0.8}
  " stroke="#D4A574" stroke-width="${size * 0.04}" fill="none" stroke-linecap="round"/>

  <!-- Steam lines -->
  <path d="M ${size * 0.38} ${cupY - steamHeight * 0.3} Q ${size * 0.36} ${cupY - steamHeight * 0.8} ${size * 0.38} ${cupY - steamHeight * 1.2}"
        stroke="#D4A574" stroke-width="${size * 0.015}" fill="none" stroke-linecap="round" opacity="0.6"/>
  <path d="M ${size * 0.5} ${cupY - steamHeight * 0.5} Q ${size * 0.52} ${cupY - steamHeight} ${size * 0.5} ${cupY - steamHeight * 1.4}"
        stroke="#D4A574" stroke-width="${size * 0.015}" fill="none" stroke-linecap="round" opacity="0.7"/>
  <path d="M ${size * 0.62} ${cupY - steamHeight * 0.3} Q ${size * 0.64} ${cupY - steamHeight * 0.8} ${size * 0.62} ${cupY - steamHeight * 1.2}"
        stroke="#D4A574" stroke-width="${size * 0.015}" fill="none" stroke-linecap="round" opacity="0.6"/>
</svg>`;
};

async function generateIcons() {
  // Ensure icons directory exists
  await mkdir(iconsDir, { recursive: true });

  const sizes = [
    { name: 'icon-72x72.png', size: 72 },
    { name: 'icon-96x96.png', size: 96 },
    { name: 'icon-128x128.png', size: 128 },
    { name: 'icon-144x144.png', size: 144 },
    { name: 'icon-152x152.png', size: 152 },
    { name: 'icon-180x180.png', size: 180 },
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-384x384.png', size: 384 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { name, size } of sizes) {
    const svg = createCoffeeIconSvg(size);
    const outputPath = join(iconsDir, name);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`Generated: ${name}`);
  }

  // Also save the SVG for reference
  const { writeFile } = await import('fs/promises');
  await writeFile(
    join(iconsDir, 'icon.svg'),
    createCoffeeIconSvg(512)
  );
  console.log('Generated: icon.svg');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
