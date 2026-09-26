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
    console.log('Navigating to Customer App...');
    await page.goto('https://cafe-qr-ordering-mauve.vercel.app/?table=05', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Klik kartu menu pertama
    console.log('Clicking first menu item...');
    await page.evaluate(() => {
      const card = document.querySelector('div.bg-white.rounded-2xl');
      if (card) card.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Klik tombol tambah di modal
    console.log('Clicking modal add button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent && (b.textContent.includes('Tambah ke') || b.textContent.includes('Keranjang')));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Klik tombol "Lanjut Pesan"
    console.log('Clicking Lanjut Pesan button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const lanjutBtn = btns.find(b => b.textContent && b.textContent.includes('Lanjut Pesan'));
      if (lanjutBtn) lanjutBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Ketik kode promo WARGABARU
    console.log('Typing coupon code WARGABARU...');
    await page.type('input[placeholder*="kode kupon"]', 'WARGABARU');
    await new Promise(r => setTimeout(r, 500));

    // Klik tombol Pakai
    console.log('Clicking Pakai button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const pakaiBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Pakai');
      if (pakaiBtn) pakaiBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll down to see Rincian Biaya
    await page.evaluate(() => {
      const scrollable = document.querySelector('div.bg-white.w-full.max-w-md div.overflow-y-auto');
      if (scrollable) scrollable.scrollTop = 380;
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(outDir, 'screenshot_cart_coupon_applied.png') });
    console.log('Saved screenshot_cart_coupon_applied.png');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();
