import puppeteer from 'puppeteer-core';
import path from 'path';

const outDir = '/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c';

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();
  
  // 1. Visit Customer Ordering Page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Dismiss modal meja jika muncul
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Mulai Pesan Menu')) {
      await btn.click();
      console.log('Dismissed Table Modal');
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }

  // Find and click "Paket Hemat" category button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Paket Hemat')) {
      await btn.click();
      console.log('Clicked Paket Hemat category button');
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));

  const screenshot1 = path.join(outDir, 'screenshot_paket_hemat_catalog.png');
  await page.screenshot({ path: screenshot1 });
  console.log(`Saved screenshot 1: ${screenshot1}`);

  // Click on "Paket Sahabat Dompet" card to open customize modal
  const cards = await page.$$('div, button');
  for (const c of cards) {
    const text = await page.evaluate(el => el.textContent, c);
    if (text && text.includes('Paket Sahabat Dompet') && text.includes('Rp 9.000')) {
      await c.click();
      console.log('Clicked Paket Sahabat Dompet');
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));

  const screenshot2 = path.join(outDir, 'screenshot_paket_sahabat_dompet_modal.png');
  await page.screenshot({ path: screenshot2 });
  console.log(`Saved screenshot 2: ${screenshot2}`);

  // 2. Visit Admin Catalog
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Click on "Katalog Menu" tab
  const adminButtons = await page.$$('button');
  for (const btn of adminButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Kelola Menu')) {
      await btn.click();
      console.log('Clicked Kelola Menu tab in Admin');
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));

  const screenshot3 = path.join(outDir, 'screenshot_admin_paket_catalog.png');
  await page.screenshot({ path: screenshot3 });
  console.log(`Saved screenshot 3: ${screenshot3}`);

  await browser.close();
  console.log('Browser verification completed successfully.');
}

main().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
