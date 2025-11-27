/**
 * Script para generar iconos PWA desde el SVG base
 * Genera icon-192.png y icon-512.png para el manifest.json
 */

const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

// SVG base con el logo de Chronos (fondo oscuro con logo claro)
const createSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="50%" style="stop-color:#1e1b4b"/>
      <stop offset="100%" style="stop-color:#0c0a09"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#clip0)">
    <rect width="180" height="180" rx="37" fill="url(#bgGradient)"/>
    <g style="transform: scale(95%); transform-origin: center">
      <path fill="white"
        d="M101.141 53H136.632C151.023 53 162.689 64.6662 162.689 79.0573V112.904H148.112V79.0573C148.112 78.7105 148.098 78.3662 148.072 78.0251L112.581 112.898C112.701 112.902 112.821 112.904 112.941 112.904H148.112V126.672H112.941C98.5504 126.672 86.5638 114.891 86.5638 100.5V66.7434H101.141V100.5C101.141 101.15 101.191 101.792 101.289 102.422L137.56 66.7816C137.255 66.7563 136.945 66.7434 136.632 66.7434H101.141V53Z"/>
      <path fill="white"
        d="M65.2926 124.136L14 66.7372H34.6355L64.7495 100.436V66.7372H80.1365V118.47C80.1365 126.278 70.4953 129.958 65.2926 124.136Z"/>
    </g>
  </g>
  <defs>
    <clipPath id="clip0">
      <rect width="180" height="180" fill="white"/>
    </clipPath>
  </defs>
</svg>`;

const sizes = [192, 512];

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  for (const size of sizes) {
    const svg = createSVG(size);
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: size,
      },
    });
    
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    
    const outputPath = path.join(publicDir, `icon-${size}.png`);
    fs.writeFileSync(outputPath, pngBuffer);
    
    console.log(`✅ Generado: icon-${size}.png (${pngBuffer.length} bytes)`);
  }
  
  console.log('\n🎉 Todos los iconos han sido generados correctamente');
}

generateIcons().catch(err => {
  console.error('❌ Error generando iconos:', err);
  process.exit(1);
});
