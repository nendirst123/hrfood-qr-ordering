import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = '/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c';
const projectDir = '/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering';
const logoPath = path.join(projectDir, 'public/hrfood-full-logo.png');
const logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;

// Function to generate clean HTML template for any menu item (ONLY LOGO + NARASI)
function renderMenuTemplate({
  titleMain = 'TELUR DADAR',
  titleHighlight = 'KRISPI BARENDO',
  subtitle = 'MENU SPESIAL HR FOOD',
  description = 'Sensasi renyah renda keriting gurih bertabur daun bawang harum & cocolan sambal segar khas HR FOOD! Tanpa tandingan!',
  photoBase64,
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

    /* Cinematic Dark Overlays */
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

    /* Top Bar: Hanya Logo Resmi HR Food */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: flex-start;
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

    /* Bottom Box: Hanya Narasi Menu */
    .bottom-box {
      background: rgba(20, 16, 14, 0.88);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 28px;
      padding: 36px 44px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
    }

    .title-area h3 {
      color: #FBBF24;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .title-area h1 {
      color: #FFFFFF;
      font-size: 46px;
      font-weight: 900;
      line-height: 1.15;
    }

    .title-area h1 span {
      color: #FDE047;
    }

    .title-area p {
      color: #CBD5E1;
      font-size: 20px;
      font-weight: 600;
      margin-top: 10px;
      max-width: 950px;
      line-height: 1.45;
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
    </div>

    <div class="bottom-box">
      <div class="title-area">
        ${subtitle ? `<h3>${subtitle}</h3>` : ''}
        <h1>${titleMain} <span>${titleHighlight}</span></h1>
        <p>${description}</p>
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

  // 1. TELUR DADAR KRISPI BARENDO (Murni hanya Logo + Narasi)
  const eggPhotoPath = path.join(projectDir, 'public/menu/telur-dadar-barendo.jpg');
  const eggPhotoBase64 = `data:image/jpeg;base64,${fs.readFileSync(eggPhotoPath).toString('base64')}`;

  const htmlEggClean = renderMenuTemplate({
    titleMain: 'TELUR DADAR',
    titleHighlight: 'KRISPI BARENDO',
    subtitle: 'MENU SPESIAL HR FOOD',
    description: 'Sensasi renyah renda keriting gurih bertabur daun bawang harum & cocolan sambal segar khas HR FOOD! Tanpa tandingan!',
    photoBase64: eggPhotoBase64,
  });

  await page.setContent(htmlEggClean, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  const eggCleanPath = path.join(outDir, 'template_telur_krispi_clean.png');
  await page.screenshot({ path: eggCleanPath });
  console.log(`Saved clean egg template: ${eggCleanPath}`);
  fs.copyFileSync(eggCleanPath, path.join(projectDir, 'public/template_telur_krispi_clean.png'));

  // 2. PAKET SAHABAT DOMPET
  const htmlPaketDompet = renderMenuTemplate({
    titleMain: 'PAKET SAHABAT',
    titleHighlight: 'DOMPET',
    subtitle: 'PAKET HEMAT RUMAHAN',
    description: 'Nasi pulen hangat + Telur Dadar Krispi Barendo mekar gurih + Lalapan segar + Pilihan Sambal & Level pedas khas HR Food.',
    photoBase64: eggPhotoBase64,
  });

  await page.setContent(htmlPaketDompet, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  const paketDompetPath = path.join(outDir, 'template_paket_sahabat_dompet.png');
  await page.screenshot({ path: paketDompetPath });
  console.log(`Saved paket sahabat dompet template: ${paketDompetPath}`);
  fs.copyFileSync(paketDompetPath, path.join(projectDir, 'public/template_paket_sahabat_dompet.png'));

  // 3. AYAM GORENG KREMES BESAR
  const ayamPhotoPath = path.join(projectDir, 'public/menu/ayam-goreng-besar.jpg');
  if (fs.existsSync(ayamPhotoPath)) {
    const ayamPhotoBase64 = `data:image/jpeg;base64,${fs.readFileSync(ayamPhotoPath).toString('base64')}`;
    const htmlAyam = renderMenuTemplate({
      titleMain: 'AYAM GORENG',
      titleHighlight: 'KREMES BESAR',
      subtitle: 'AYAM & BEBEK',
      description: 'Potongan ayam ukuran besar dengan taburan kremes renyah gurih meresap hingga ke tulang plus lalapan dan sambal segar.',
      photoBase64: ayamPhotoBase64,
    });

    await page.setContent(htmlAyam, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    const ayamPath = path.join(outDir, 'template_ayam_kremes.png');
    await page.screenshot({ path: ayamPath });
    console.log(`Saved ayam kremes template: ${ayamPath}`);
    fs.copyFileSync(ayamPath, path.join(projectDir, 'public/template_ayam_kremes.png'));
  }

  // 4. LELE GORENG CRISPY
  const lelePhotoPath = path.join(projectDir, 'public/menu/lele-goreng.jpg');
  if (fs.existsSync(lelePhotoPath)) {
    const lelePhotoBase64 = `data:image/jpeg;base64,${fs.readFileSync(lelePhotoPath).toString('base64')}`;
    const htmlLele = renderMenuTemplate({
      titleMain: 'LELE GORENG',
      titleHighlight: 'CRISPY GURIH',
      subtitle: 'IKAN & SEAFOOD',
      description: 'Ikan lele segar pilihan digoreng renyah dengan bumbu rempah kuning gurih, bebas bau tanah, nikmat tiada tara.',
      photoBase64: lelePhotoBase64,
    });

    await page.setContent(htmlLele, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    const lelePath = path.join(outDir, 'template_lele_crispy.png');
    await page.screenshot({ path: lelePath });
    console.log(`Saved lele crispy template: ${lelePath}`);
    fs.copyFileSync(lelePath, path.join(projectDir, 'public/template_lele_crispy.png'));
  }

  await browser.close();
  console.log('All menu templates (Logo + Narasi only) generated successfully!');
}

main().catch(err => {
  console.error('Error generating templates:', err);
  process.exit(1);
});
