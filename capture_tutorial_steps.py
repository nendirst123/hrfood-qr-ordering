import asyncio
import os
from playwright.async_api import async_playwright

async def capture_tutorial():
    out_dir = "/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/public/tutorial"
    os.makedirs(out_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path="/usr/bin/google-chrome-stable",
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )
        
        # 1. Mobile Phone Customer View (iPhone 13 / Android size: 390x844)
        context_mobile = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2
        )
        page_mobile = await context_mobile.new_page()
        
        # Step 1 & 2: Mobile Menu
        await page_mobile.goto("http://localhost:3005/?table=02", wait_until="networkidle")
        await page_mobile.wait_for_timeout(1000)
        await page_mobile.screenshot(path=f"{out_dir}/step1_mobile_menu.png")
        print("Captured: step1_mobile_menu.png")
        
        # Step 2: Open Sambal & Customization Modal (click first Add button)
        buttons = await page_mobile.query_selector_all("button")
        for btn in buttons:
            txt = await btn.inner_text()
            if "Tambah" in txt:
                await btn.click()
                break
        await page_mobile.wait_for_timeout(1000)
        await page_mobile.screenshot(path=f"{out_dir}/step2_modal_sambal.png")
        print("Captured: step2_modal_sambal.png")
        
        # Click "+ Tambah ke Pesanan" in modal
        modal_btn = await page_mobile.query_selector("div.fixed button:has-text('Tambah ke Pesanan')")
        if modal_btn:
            await modal_btn.click()
            await page_mobile.wait_for_timeout(500)
            
        # Open Cart / Checkout
        cart_btn = await page_mobile.query_selector("button:has-text('Lihat Pesanan')")
        if cart_btn:
            await cart_btn.click()
            await page_mobile.wait_for_timeout(500)
            await page_mobile.screenshot(path=f"{out_dir}/step3_cart_checkout.png")
            print("Captured: step3_cart_checkout.png")
            
        # 2. Desktop KDS View (Kitchen)
        context_desktop = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            device_scale_factor=2
        )
        page_desktop = await context_desktop.new_page()
        await page_desktop.goto("http://localhost:3005/kitchen", wait_until="networkidle")
        await page_desktop.wait_for_timeout(1000)
        await page_desktop.screenshot(path=f"{out_dir}/step4_kitchen_kds.png")
        print("Captured: step4_kitchen_kds.png")

        # 3. QR Stand Meja View
        await page_desktop.goto("http://localhost:3005/qr-generator", wait_until="networkidle")
        await page_desktop.wait_for_timeout(1000)
        await page_desktop.screenshot(path=f"{out_dir}/step5_qr_stand.png")
        print("Captured: step5_qr_stand.png")

        await browser.close()
        print("All tutorial screenshots successfully captured!")

asyncio.run(capture_tutorial())
