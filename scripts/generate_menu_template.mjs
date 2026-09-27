import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = '/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c';
const projectDir = '/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering';
const logoPath = path.join(projectDir, 'public/hrfood-full-logo.png');
const logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;

// Format currency to Indonesian Rupiah
function formatRupiah(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

// Function to generate HTML template for any menu item
function renderMenuTemplate({
  titleMain = 'TELUR DADAR',
  titleHighlight = 'KRISPI BARENDO',
  subtitle = 'MENU SPESIAL HR FOOD',
  description = 'Sensasi renyah renda keriting gurih bertabur daun bawang harum & cocolan sambal segar khas HR FOOD! Tanpa tandingan!',
  price = 4000,
  photoBase64,
  categoryBadge = '', // optional top-right badge if needed, default empty (coming soon removed)
}) {
  return `
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

    /* Food Photo Background */
    .bg-image {
      position: absolute;
      top: -160px;
      left: 0;
      width: 100%;
      height: 1400px;
      object-fit: cover;
      object-position: center;
    }

    /* Cinematic Overlays */
    .overlay-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 280px;
      background: linear-gradient(180deg, rgba(12, 10, 9, 0.88) 0%, rgba(12, 10, 9, 0.45) 60%, rgba(12, 10, 9, 0) 100%);
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
      display: block;
    }

    .top-tag {
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(12px);
      color: #F8FAFC;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 10px 22px;
      border-radius: 999px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* Bottom Information Box */
    .bottom-box {
      background: rgba(20, 16, 14, 0.90);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 28px;
      padding: 32px 36px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .title-area {
      flex: 1;
    }

    .title-area h3 {
      color: #FBBF24;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .title-area h1 {
      color: #FFFFFF;
      font-size: 40px;
      font-weight: 900;
      line-height: 1.15;
    }

    .title-area h1 span {
      color: #FDE047;
    }

    .title-area p {
      color: #CBD5E1;
      font-size: 17px;
      font-weight: 600;
      margin-top: 8px;
      max-width: 660px;
      line-height: 1.4;
    }

    /* Modern Price Badge (replacing "Nantikan!") */
    .price-badge {
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: #FFFFFF;
      padding: 16px 28px;
      border-radius: 22px;
      text-align: center;
      box-shadow: 0 10px 28px rgba(239, 68, 68, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.3);
      white-space: nowrap;
      min-width: 170px;
    }

    .price-badge small {
      display: block;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #FEE2E2;
      margin-bottom: 2px;
      opacity: 0.9;
    }

    .price-badge span {
      display: block;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #FFFFFF;
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
      ${categoryBadge ? `<div class="top-tag">${categoryBadge}</div>` : ''}
    </div>

    <div class="bottom-box">
      <div class="title-area">
        <h3>${subtitle}</h3>
        <h1>${titleMain} <span>${titleHighlight}</span></h1>
        <p>${description}</p>
      </div>
      <div class="price-badge">
        <small>Harga Menu</small>
        <span>${formatRupiah(price)}</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1080, height: 1080, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();

  // 1. Generate clean template for TELUR DADAR KRISPI BARENDO (Exact requested image with Coming Soon and Nantikan removed)
  const eggPhotoPath = path.join(projectDir, 'public/menu/telur-dadar-barendo.jpg');
  const eggPhotoBase64 = `data:image/jpeg;base64,${fs.readFileSync(eggPhotoPath).toString('base64')}`;

  const htmlEggClean = renderMenuTemplate({
    titleMain: 'TELUR DADAR',
    titleHighlight: 'KRISPI BARENDO',
    subtitle: 'MENU SPESIAL HR FOOD',
    description: 'Sensasi renyah renda keriting gurih bertabur daun bawang harum & cocolan sambal segar khas HR FOOD! Tanpa tandingan!',
    price: 4000,
    photoBase64: eggPhotoBase64,
    categoryBadge: '', // Empty: Clean top right (coming soon completely removed)
  });

  await page.setContent(htmlEggClean, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  const eggCleanPath = path.join(outDir, 'template_telur_krispi_clean.png');
  await page.screenshot({ path: eggCleanPath });
  console.log(`Saved clean egg template: ${eggCleanPath}`);

  // Copy to public folder
  fs.copyFileSync(eggCleanPath, path.join(projectDir, 'public/template_telur_krispi_clean.png'));

  // 2. Also generate PAKET SAHABAT DOMPET version (Rp 9.000)
  const htmlPaketDompet = renderMenuTemplate({
    titleMain: 'PAKET SAHABAT',
    titleHighlight: 'DOMPET',
    subtitle: 'PAKET HEMAT KENYANG',
    description: 'Nasi pulen hangat + Telur Dadar Krispi Barendo mekar gurih + Lalapan segar + Pilihan Sambal & Level pedas.',
    price: 9000,
    photoBase64: eggPhotoBase64,
    categoryBadge: '⭐ FAVORIT',
  });

  await page.setContent(htmlPaketDompet, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  const paketDompetPath = path.join(outDir, 'template_paket_sahabat_dompet.png');
  await page.screenshot({ path: paketDompetPath });
  console.log(`Saved paket sahabat dompet template: ${paketDompetPath}`);

  // 3. Generate AYAM GORENG KREMES template
  const ayamPhotoPath = path.join(projectDir, 'public/menu/ayam-goreng-besar.jpg');
  if (fs.existsSync(ayamPhotoPath)) {
    const ayamPhotoBase64 = `data:image/jpeg;base64,${fs.readFileSync(ayamPhotoPath).toString('base64')}`;
    const htmlAyam = renderMenuTemplate({
      titleMain: 'AYAM GORENG',
      titleHighlight: 'KREMES BESAR',
      subtitle: 'AYAM & BEBEK',
      description: 'Potongan ayam ukuran besar dengan taburan kremes renyah gurih meresap hingga ke tulang plus lalapan dan sambal.',
      price: 15000,
      photoBase64: ayamPhotoBase64,
      categoryBadge: '🔥 BEST SELLER',
    });

    await page.setContent(htmlAyam, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    const ayamPath = path.join(outDir, 'template_ayam_kremes.png');
    await page.screenshot({ path: ayamPath });
    console.log(`Saved ayam kremes template: ${ayamPath}`);
  }

  // 4. Generate LELE GORENG CRISPY template
  const lelePhotoPath = path.join(projectDir, 'public/menu/lele-goreng.jpg');
  if (fs.existsSync(lelePhotoPath)) {
    const lelePhotoBase64 = `data:image/jpeg;base64,${fs.readFileSync(lelePhotoPath).toString('base64')}`;
    const htmlLele = renderMenuTemplate({
      titleMain: 'LELE GORENG',
      titleHighlight: 'CRISPY GURIH',
      subtitle: 'IKAN & SEAFOOD',
      description: 'Ikan lele segar pilihan digoreng renyah dengan bumbu rempah kuning gurih, bebas bau tanah, nikmat tiada tara.',
      price: 10000,
      photoBase64: lelePhotoBase64,
      categoryBadge: '🐟 SEGAR GURIH',
    });

    await page.setContent(htmlLele, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    const lelePath = path.join(outDir, 'template_lele_crispy.png');
    await page.screenshot({ path: lelePath });
    console.log(`Saved lele crispy template: ${lelePath}`);
  }

  await browser.close();
  console.log('All menu templates generated successfully!');
}

main().catch(err => {
  console.error('Error generating templates:', err);
  process.exit(1);
});
