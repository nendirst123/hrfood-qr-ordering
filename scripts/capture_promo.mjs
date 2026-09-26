import puppeteer from 'puppeteer-core';
import path from 'path';

const outDir = '/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c';

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 430, height: 920 }, // Mobile screen for customer
  });

  const page = await browser.newPage();

  try {
    // 1. Buka Customer App dan Tambah Item ke Cart
    console.log('Navigating to Customer Ordering Page...');
    await page.goto('https://cafe-qr-ordering-mauve.vercel.app/?table=03', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Klik tombol tambah menu pertama
    const addBtns = await page.$$('button');
    let clickedItem = false;
    for (const btn of addBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Tambah') || text.includes('+')) {
        await btn.click();
        clickedItem = true;
        break;
      }
    }

    if (clickedItem) {
      await new Promise(r => setTimeout(r, 1000));
      // Klik tombol "Tambah ke Pesanan" di modal produk
      const modalBtns = await page.$$('button');
      for (const btn of modalBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Tambah ke Pesanan')) {
          await btn.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    // Buka Keranjang (Klik floating cart bar)
    const cartBar = await page.$('button.fixed, div.fixed button');
    if (cartBar) {
      await cartBar.click();
      await new Promise(r => setTimeout(r, 1500));
    }

    // Klik "Pilih Kupon" untuk buka daftar voucher tersedia
    const promoListBtns = await page.$$('button');
    for (const btn of promoListBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Pilih Kupon')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({ path: path.join(outDir, 'screenshot_promo_picker.png') });
    console.log('Saved screenshot_promo_picker.png');

    // Klik tombol "Pakai" pada kupon pertama yang tersedia (misal HEMAT5K)
    const pakaiBtns = await page.$$('button');
    for (const btn of pakaiBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.trim() === 'Pakai') {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(outDir, 'screenshot_promo_applied.png') });
    console.log('Saved screenshot_promo_applied.png');

    // 2. Admin Dashboard - Tab Promo & Kupon
    console.log('Navigating to Admin Dashboard Promo Tab...');
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto('https://cafe-qr-ordering-mauve.vercel.app/admin', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));

    // Klik tab "Promo & Kupon"
    const tabs = await page.$$('button');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.includes('Promo & Kupon')) {
        await tab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(outDir, 'screenshot_admin_promo_tab.png') });
    console.log('Saved screenshot_admin_promo_tab.png');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();
