const fs = require('fs');
const path = require('path');

// Create a simple canvas-based icon generator
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  
  // Inner white rectangle
  ctx.fillStyle = '#ffffff';
  const padding = size * 0.125;
  ctx.fillRect(padding, padding, size - 2 * padding, size - 2 * padding);
  
  // Currency symbol
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${size * 0.15}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', size / 2, size * 0.4);
  
  // Spark effect
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = size * 0.02;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const sparkPoints = [
    [size * 0.4, size * 0.55],
    [size * 0.47, size * 0.47],
    [size * 0.43, size * 0.63],
    [size * 0.55, size * 0.55],
    [size * 0.51, size * 0.7],
    [size * 0.63, size * 0.63]
  ];
  
  ctx.beginPath();
  ctx.moveTo(sparkPoints[0][0], sparkPoints[0][1]);
  for (let i = 1; i < sparkPoints.length; i++) {
    ctx.lineTo(sparkPoints[i][0], sparkPoints[i][1]);
  }
  ctx.stroke();
  
  // Graph lines
  ctx.lineWidth = size * 0.01;
  const graphY = size * 0.78;
  const graphHeight = size * 0.15;
  
  // First line
  ctx.beginPath();
  ctx.moveTo(size * 0.23, graphY);
  ctx.lineTo(size * 0.31, graphY - graphHeight * 0.3);
  ctx.lineTo(size * 0.39, graphY - graphHeight * 0.2);
  ctx.lineTo(size * 0.47, graphY - graphHeight * 0.5);
  ctx.lineTo(size * 0.55, graphY - graphHeight * 0.4);
  ctx.lineTo(size * 0.63, graphY - graphHeight * 0.6);
  ctx.lineTo(size * 0.71, graphY - graphHeight * 0.3);
  ctx.lineTo(size * 0.78, graphY - graphHeight * 0.7);
  ctx.stroke();
  
  // Second line
  ctx.beginPath();
  ctx.moveTo(size * 0.23, graphY + graphHeight * 0.3);
  ctx.lineTo(size * 0.31, graphY + graphHeight * 0.1);
  ctx.lineTo(size * 0.39, graphY + graphHeight * 0.2);
  ctx.lineTo(size * 0.47, graphY);
  ctx.lineTo(size * 0.55, graphY + graphHeight * 0.1);
  ctx.lineTo(size * 0.63, graphY - graphHeight * 0.1);
  ctx.lineTo(size * 0.71, graphY + graphHeight * 0.1);
  ctx.lineTo(size * 0.78, graphY);
  ctx.stroke();
  
  return canvas.toBuffer('image/png');
}

async function generateAllIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  for (const size of sizes) {
    const iconBuffer = generateIcon(size);
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filepath, iconBuffer);
    console.log(`Generated ${filename}`);
  }
  
  // Generate shortcut icons
  const shortcuts = ['dashboard', 'exchange', 'customers', 'wallet'];
  for (const shortcut of shortcuts) {
    const iconBuffer = generateIcon(96);
    const filename = `${shortcut}-96x96.png`;
    const filepath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filepath, iconBuffer);
    console.log(`Generated ${filename}`);
  }
}

generateAllIcons().catch(console.error);
