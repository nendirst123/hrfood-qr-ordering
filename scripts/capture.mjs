import puppeteer from 'puppeteer-core';
import path from 'path';

const outDir = '/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c';

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 820 },
  });

  const page = await browser.newPage();

  try {
    // 1. KDS & Modal Thermal Receipt
    console.log('Navigating to Kitchen...');
    await page.goto('https://cafe-qr-ordering-mauve.vercel.app/kitchen', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));

    // Klik tombol cetak pada kartu pertama jika ada
    const printButtons = await page.$$('button[title*="Cetak"]');
    if (printButtons.length > 0) {
      console.log('Clicking print button to open Thermal Receipt Modal...');
      await printButtons[0].click();
      await new Promise(r => setTimeout(r, 1500));
    }

    await page.screenshot({ path: path.join(outDir, 'screenshot_thermal_modal.png') });
    console.log('Saved screenshot_thermal_modal.png');

    // 2. Admin POS & Modal Pengaturan Toko
    console.log('Navigating to Admin POS...');
    await page.goto('https://cafe-qr-ordering-mauve.vercel.app/admin', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));

    // Klik tombol Toko Buka / Tutup di header
    const storeBtn = await page.$('button[title*="Jam Operasional"]');
    if (storeBtn) {
      console.log('Clicking Store Config button...');
      await storeBtn.click();
      await new Promise(r => setTimeout(r, 1500));
    }

    await page.screenshot({ path: path.join(outDir, 'screenshot_admin_store_modal.png') });
    console.log('Saved screenshot_admin_store_modal.png');

    // 3. Menu Pemesanan Tamu
    console.log('Navigating to Customer Menu...');
    await page.setViewport({ width: 430, height: 880 }); // Mobile view
    await page.goto('https://cafe-qr-ordering-mauve.vercel.app/?table=02', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outDir, 'screenshot_menu_customer.png') });
    console.log('Saved screenshot_menu_customer.png');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();
