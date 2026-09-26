import puppeteer from 'puppeteer-core';
import path from 'path';

const outDir = '/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c';

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 430, height: 920 },
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to local app...');
    await page.goto('http://localhost:3005/?table=01', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Klik tab "Paket Hemat"
    console.log('Clicking Paket Hemat tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find(b => b.textContent && b.textContent.includes('Paket Hemat'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Scroll to see the items
    await page.evaluate(() => {
      window.scrollTo(0, 320);
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: path.join(outDir, 'screenshot_new_catalog_paket.png') });
    console.log('Saved screenshot_new_catalog_paket.png');

    // 2. Klik tab "Sayur & Pelengkap"
    console.log('Clicking Sayur & Pelengkap tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find(b => b.textContent && b.textContent.includes('Sayur & Pelengkap'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({ path: path.join(outDir, 'screenshot_new_catalog_sayur.png') });
    console.log('Saved screenshot_new_catalog_sayur.png');

    // 3. Klik tab "Nasi & Minuman"
    console.log('Clicking Nasi & Minuman tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find(b => b.textContent && b.textContent.includes('Nasi & Minuman'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({ path: path.join(outDir, 'screenshot_new_catalog_minuman.png') });
    console.log('Saved screenshot_new_catalog_minuman.png');

    // 4. Admin Dashboard Catalog view (Desktop)
    console.log('Navigating to Admin Catalog...');
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto('http://localhost:3005/admin', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Klik tab "Kelola Menu (Owner)"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find(b => b.textContent && b.textContent.includes('Kelola Menu'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(outDir, 'screenshot_new_admin_catalog.png') });
    console.log('Saved screenshot_new_admin_catalog.png');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();
