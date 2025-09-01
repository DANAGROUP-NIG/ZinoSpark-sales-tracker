const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

function generateScreenshot(width, height, isMobile = false) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);
  
  // Header
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, 80);
  
  // Logo
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('ZinoSpark', 20, 50);
  
  // Navigation
  if (!isMobile) {
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.fillText('Dashboard', 200, 50);
    ctx.fillText('Customers', 300, 50);
    ctx.fillText('Exchanges', 400, 50);
    ctx.fillText('Wallet', 500, 50);
  }
  
  // Content area
  const contentY = 100;
  const contentHeight = height - contentY - 40;
  
  // Title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Dashboard', 20, contentY + 40);
  
  // Subtitle
  ctx.fillStyle = '#666666';
  ctx.font = '16px Arial';
  ctx.fillText('Overview of your currency exchange operations', 20, contentY + 70);
  
  // Metrics cards
  const cardWidth = isMobile ? width - 40 : 200;
  const cardHeight = 120;
  const cardsPerRow = isMobile ? 1 : 4;
  const cardSpacing = 20;
  
  const metrics = [
    { title: 'Total Wallet Balance', value: '$125,750.50', color: '#10b981' },
    { title: 'Active Customers', value: '48', color: '#3b82f6' },
    { title: 'Pending Exchanges', value: '7', color: '#f59e0b' },
    { title: 'Recent Transactions', value: '23', color: '#8b5cf6' }
  ];
  
  for (let i = 0; i < metrics.length; i++) {
    const row = Math.floor(i / cardsPerRow);
    const col = i % cardsPerRow;
    const x = 20 + col * (cardWidth + cardSpacing);
    const y = contentY + 100 + row * (cardHeight + cardSpacing);
    
    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, cardWidth, cardHeight);
    
    // Card border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cardWidth, cardHeight);
    
    // Metric title
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.fillText(metrics[i].title, x + 15, y + 25);
    
    // Metric value
    ctx.fillStyle = metrics[i].color;
    ctx.font = 'bold 24px Arial';
    ctx.fillText(metrics[i].value, x + 15, y + 55);
    
    // Icon placeholder
    ctx.fillStyle = metrics[i].color;
    ctx.fillRect(x + cardWidth - 35, y + 15, 20, 20);
  }
  
  // Quick actions section
  const actionsY = contentY + 100 + Math.ceil(metrics.length / cardsPerRow) * (cardHeight + cardSpacing) + 40;
  
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('Quick Actions', 20, actionsY);
  
  const actionButtons = ['New Exchange', 'Add Customer', 'View Wallet', 'View Reports'];
  const buttonWidth = isMobile ? width - 40 : 150;
  const buttonHeight = 50;
  const buttonsPerRow = isMobile ? 1 : 4;
  
  for (let i = 0; i < actionButtons.length; i++) {
    const row = Math.floor(i / buttonsPerRow);
    const col = i % buttonsPerRow;
    const x = 20 + col * (buttonWidth + cardSpacing);
    const y = actionsY + 30 + row * (buttonHeight + 10);
    
    // Button background
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, buttonWidth, buttonHeight);
    
    // Button text
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(actionButtons[i], x + buttonWidth / 2, y + 32);
  }
  
  return canvas.toBuffer('image/png');
}

async function generateScreenshots() {
  const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');
  
  // Ensure screenshots directory exists
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Generate desktop screenshot
  const desktopBuffer = generateScreenshot(1280, 720, false);
  fs.writeFileSync(path.join(screenshotsDir, 'desktop-dashboard.png'), desktopBuffer);
  console.log('Generated desktop-dashboard.png');
  
  // Generate mobile screenshot
  const mobileBuffer = generateScreenshot(390, 844, true);
  fs.writeFileSync(path.join(screenshotsDir, 'mobile-dashboard.png'), mobileBuffer);
  console.log('Generated mobile-dashboard.png');
}

generateScreenshots().catch(console.error);
