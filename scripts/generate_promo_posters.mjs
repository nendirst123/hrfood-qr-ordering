import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = '/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c';
const photoPath = path.join(outDir, 'telor_krispi_photo_1790437370104.jpg');
const logoPath = path.resolve('public/hrfood-full-logo.png');

// Convert to Base64 to ensure instant synchronous load in browser
const photoBase64 = `data:image/jpeg;base64,${fs.readFileSync(photoPath).toString('base64')}`;
const logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;

const htmlStory = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    body {
      width: 1080px;
      height: 1920px;
      position: relative;
      overflow: hidden;
      background-color: #111;
    }

    /* Background Food Photo */
    .bg-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transform: scale(1.03);
    }

    /* Cinematic Overlays */
    .overlay-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 520px;
      background: linear-gradient(180deg, rgba(12, 10, 9, 0.92) 0%, rgba(12, 10, 9, 0.7) 50%, rgba(12, 10, 9, 0) 100%);
      z-index: 2;
    }

    .overlay-bottom {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 780px;
      background: linear-gradient(0deg, rgba(15, 10, 8, 0.98) 0%, rgba(15, 10, 8, 0.85) 45%, rgba(15, 10, 8, 0.4) 75%, rgba(15, 10, 8, 0) 100%);
      z-index: 2;
    }

    /* Content Wrapper */
    .content {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 80px 60px 70px 60px;
    }

    /* Header Section */
    .header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .logo-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      padding: 18px 36px;
      border-radius: 28px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
      border: 2px solid rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-img {
      height: 64px;
      width: auto;
      object-fit: contain;
    }

    .badge-coming-soon {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%);
      color: #FFFFFF;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 3px;
      text-transform: uppercase;
      padding: 12px 32px;
      border-radius: 999px;
      box-shadow: 0 8px 30px rgba(239, 68, 68, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    .badge-sparkle {
      font-size: 24px;
      animation: pulse 1.5s infinite;
    }

    /* Center Focus Accent (Subtle) */
    .center-tag {
      align-self: flex-start;
      margin-top: 180px;
      background: rgba(234, 88, 12, 0.9);
      backdrop-filter: blur(8px);
      color: white;
      padding: 10px 24px;
      border-radius: 16px;
      font-weight: 800;
      font-size: 22px;
      letter-spacing: 1px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      border-left: 6px solid #FDE047;
    }

    /* Bottom Info Card */
    .footer {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .title-group {
      text-align: left;
    }

    .sub-headline {
      color: #FBBF24;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 4px;
      text-transform: uppercase;
      display: block;
      margin-bottom: 8px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
    }

    .main-title {
      font-size: 78px;
      font-weight: 900;
      line-height: 1.05;
      color: #FFFFFF;
      letter-spacing: -1px;
      text-shadow: 0 4px 24px rgba(0, 0, 0, 0.9);
    }

    .main-title span {
      background: linear-gradient(135deg, #FDE047 0%, #F59E0B 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 4px 14px rgba(245, 158, 11, 0.4));
    }

    .desc-text {
      color: #E2E8F0;
      font-size: 26px;
      font-weight: 600;
      line-height: 1.4;
      margin-top: 14px;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
    }

    /* Feature Pills */
    .features-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .feature-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 12px 24px;
      border-radius: 999px;
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 700;
    }

    /* Bottom Action Bar */
    .cta-card {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(185, 28, 28, 0.95) 100%);
      border: 2px solid rgba(255, 255, 255, 0.25);
      border-radius: 32px;
      padding: 24px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 20px 50px rgba(220, 38, 38, 0.4);
    }

    .cta-info h4 {
      color: #FFFFFF;
      font-size: 26px;
      font-weight: 800;
    }

    .cta-info p {
      color: #FECACA;
      font-size: 19px;
      font-weight: 600;
      margin-top: 4px;
    }

    .cta-tag {
      background: #FFFFFF;
      color: #DC2626;
      font-size: 20px;
      font-weight: 900;
      padding: 14px 28px;
      border-radius: 20px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <!-- Food Photo -->
  <img src="${photoBase64}" class="bg-image" />

  <!-- Gradients -->
  <div class="overlay-top"></div>
  <div class="overlay-bottom"></div>

  <!-- Content -->
  <div class="content">
    <!-- Top Header -->
    <div class="header">
      <div class="logo-container">
        <img src="${logoBase64}" class="logo-img" />
      </div>
      <div class="badge-coming-soon">
        <span class="badge-sparkle">✨</span>
        <span>COMING SOON</span>
        <span class="badge-sparkle">✨</span>
      </div>
    </div>

    <!-- Center Floating Pill -->
    <div class="center-tag">
      🍳 100% Telur Segar Pilihan • Renda Krispi Maksimal!
    </div>

    <!-- Bottom Footer Area -->
    <div class="footer">
      <div class="title-group">
        <span class="sub-headline">Sensasi Baru Masakan Rumahan</span>
        <h1 class="main-title">
          TELUR DADAR<br>
          <span>KRISPI BARENDO</span>
        </h1>
        <p class="desc-text">
          Pinggiran renda keriting yang super renyah & mekar gurih, berpadu irisan daun bawang wangi plus cocolan sambal segar khas HR FOOD!
        </p>
      </div>

      <!-- Feature Badges -->
      <div class="features-row">
        <div class="feature-pill">
          <span>⚡</span>
          <span>Kriuk Tahan Lama</span>
        </div>
        <div class="feature-pill">
          <span>🌿</span>
          <span>Daun Bawang Harum</span>
        </div>
        <div class="feature-pill">
          <span>🌶️</span>
          <span>Cocol Sambal Ulek</span>
        </div>
      </div>

      <!-- CTA Box -->
      <div class="cta-card">
        <div class="cta-info">
          <h4>Segera Hadir di HR FOOD!</h4>
          <p>Makan Enak, Mood Naik! • Dine-in & Delivery WhatsApp</p>
        </div>
        <div class="cta-tag">
          Nantikan! 🔥
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  await page.setContent(htmlStory, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  const storyPath = path.join(outDir, 'promosi_telor_krispi_story.png');
  await page.screenshot({ path: storyPath });
  console.log(`Saved story poster: ${storyPath}`);

  // Also create Square 1:1 Version (1080x1080) for Instagram Feed / WA Profile / FB
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
  
  const htmlSquare = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    body {
      width: 1080px;
      height: 1080px;
      position: relative;
      overflow: hidden;
      background-color: #111;
    }

    .bg-image {
      position: absolute;
      top: -160px;
      left: 0;
      width: 100%;
      height: 1400px;
      object-fit: cover;
      object-position: center;
    }

    .overlay-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 280px;
      background: linear-gradient(180deg, rgba(12, 10, 9, 0.9) 0%, rgba(12, 10, 9, 0.5) 60%, rgba(12, 10, 9, 0) 100%);
      z-index: 2;
    }

    .overlay-bottom {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 480px;
      background: linear-gradient(0deg, rgba(15, 10, 8, 0.98) 0%, rgba(15, 10, 8, 0.85) 50%, rgba(15, 10, 8, 0) 100%);
      z-index: 2;
    }

    .content {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 48px;
    }

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo-container {
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(10px);
      padding: 14px 28px;
      border-radius: 20px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.4);
    }

    .logo-img {
      height: 48px;
      width: auto;
      object-fit: contain;
    }

    .badge-coming-soon {
      background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%);
      color: #FFFFFF;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 10px 24px;
      border-radius: 999px;
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .bottom-box {
      background: rgba(20, 16, 14, 0.88);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 28px;
      padding: 32px 36px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .title-area h3 {
      color: #FBBF24;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .title-area h1 {
      color: #FFFFFF;
      font-size: 42px;
      font-weight: 900;
      line-height: 1.1;
    }

    .title-area h1 span {
      color: #FDE047;
    }

    .title-area p {
      color: #CBD5E1;
      font-size: 17px;
      font-weight: 600;
      margin-top: 8px;
      max-width: 620px;
    }

    .action-tag {
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: #FFFFFF;
      padding: 16px 28px;
      border-radius: 20px;
      text-align: center;
      font-weight: 900;
      font-size: 18px;
      white-space: nowrap;
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .action-tag small {
      display: block;
      font-size: 12px;
      font-weight: 600;
      opacity: 0.9;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <img src="${photoBase64}" class="bg-image" />
  <div class="overlay-top"></div>
  <div class="overlay-bottom"></div>

  <div class="content">
    <div class="top-bar">
      <div class="logo-container">
        <img src="${logoBase64}" class="logo-img" />
      </div>
      <div class="badge-coming-soon">
        ✨ COMING SOON ✨
      </div>
    </div>

    <div class="bottom-box">
      <div class="title-area">
        <h3>Menu Baru Segera Hadir</h3>
        <h1>TELUR DADAR <span>KRISPI BARENDO</span></h1>
        <p>Sensasi renyah renda keriting gurih bertabur daun bawang harum & cocolan sambal segar khas HR FOOD! Tanpa tandingan!</p>
      </div>
      <div class="action-tag">
        Nantikan! 🔥
        <small>DI HR FOOD</small>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await page.setContent(htmlSquare, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  const squarePath = path.join(outDir, 'promosi_telor_krispi_square.png');
  await page.screenshot({ path: squarePath });
  console.log(`Saved square poster: ${squarePath}`);

  await browser.close();
}

main().catch(err => {
  console.error('Error rendering posters:', err);
  process.exit(1);
});
