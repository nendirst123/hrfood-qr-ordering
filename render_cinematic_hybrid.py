import os
import math
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH = 1080
HEIGHT = 1920
FPS = 30
TOTAL_DURATION = 25.4
TOTAL_FRAMES = int(TOTAL_DURATION * FPS)

OUT_DIR = "/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/video_output"
os.makedirs(OUT_DIR, exist_ok=True)
RAW_CINEMATIC = os.path.join(OUT_DIR, "raw_cinematic.mp4")

# Cinematic Assets
CHICKEN_PATH = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/cinematic_fried_chicken_1789996004110.jpg"
CUSTOMER_PATH = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/customer_scan_table_1789996022978.jpg"
SAMBAL_PATH = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/macro_spicy_sambal_1789996046204.jpg"

LOGO_PATH = "/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/public/hrfood-full-logo.png"
EMBLEM_PATH = "/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/public/hrfood-emblem.png"
MENU_PATH = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/hrfood_menu_upgraded.png"
QR_PATH = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/hrfood_qr_upgraded.png"
KITCHEN_PATH = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/screenshot_kitchen_kds.png"

img_chicken = Image.open(CHICKEN_PATH).convert("RGBA")
img_customer = Image.open(CUSTOMER_PATH).convert("RGBA")
img_sambal = Image.open(SAMBAL_PATH).convert("RGBA")

img_logo = Image.open(LOGO_PATH).convert("RGBA") if os.path.exists(LOGO_PATH) else None
img_emblem = Image.open(EMBLEM_PATH).convert("RGBA") if os.path.exists(EMBLEM_PATH) else None
img_menu = Image.open(MENU_PATH).convert("RGBA") if os.path.exists(MENU_PATH) else None
img_qr = Image.open(QR_PATH).convert("RGBA") if os.path.exists(QR_PATH) else None
img_kitchen = Image.open(KITCHEN_PATH).convert("RGBA") if os.path.exists(KITCHEN_PATH) else None

def get_font(size, bold=False):
    font_paths = [
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/TTF/DejaVuSans.ttf",
        "/usr/share/fonts/noto/NotoSans-Bold.ttf" if bold else "/usr/share/fonts/noto/NotoSans-Regular.ttf",
    ]
    for p in font_paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

font_huge = get_font(74, bold=True)
font_large = get_font(54, bold=True)
font_med = get_font(38, bold=True)
font_reg = get_font(32, bold=False)
font_small = get_font(26, bold=True)

# Helper: Ken-Burns Camera Motion (slow zoom & pan on high-res images)
def render_ken_burns(img, progress, zoom_start=1.0, zoom_end=1.12, pan_x=0, pan_y=-30):
    cur_zoom = zoom_start + (zoom_end - zoom_start) * progress
    cur_w = int(WIDTH * cur_zoom)
    cur_h = int(HEIGHT * cur_zoom)
    
    # Resize high quality
    resized = img.resize((cur_w, cur_h), Image.Resampling.LANCZOS)
    
    # Calculate crop center with slight pan
    cx = cur_w // 2 + int(pan_x * progress)
    cy = cur_h // 2 + int(pan_y * progress)
    
    x0 = max(0, min(cur_w - WIDTH, cx - WIDTH // 2))
    y0 = max(0, min(cur_h - HEIGHT, cy - HEIGHT // 2))
    
    cropped = resized.crop((x0, y0, x0 + WIDTH, y0 + HEIGHT))
    
    # Subtle dark vignette for cinematic focus
    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    vdraw.rectangle([0, 0, WIDTH, 350], fill=(0, 0, 0, 160))
    vdraw.rectangle([0, HEIGHT - 450, WIDTH, HEIGHT], fill=(0, 0, 0, 180))
    vignette = vignette.filter(ImageFilter.GaussianBlur(radius=60))
    cropped.paste(vignette, (0, 0), vignette)
    
    return cropped

def draw_phone_mockup(base_img, inner_content, center_x, center_y, scale=1.0, shadow=True):
    pw = int(580 * scale)
    ph = int(1160 * scale)
    x0 = int(center_x - pw // 2)
    y0 = int(center_y - ph // 2)
    
    if shadow:
        sh = Image.new("RGBA", (pw + 50, ph + 50), (0,0,0,0))
        sh_draw = ImageDraw.Draw(sh)
        sh_draw.rounded_rectangle([25, 25, pw + 25, ph + 25], radius=int(55*scale), fill=(0,0,0,160))
        sh = sh.filter(ImageFilter.GaussianBlur(radius=int(20*scale)))
        base_img.paste(sh, (x0 - 25, y0 - 15), sh)

    phone_layer = Image.new("RGBA", (pw, ph), (0,0,0,0))
    pdraw = ImageDraw.Draw(phone_layer)
    radius = int(50 * scale)
    pdraw.rounded_rectangle([0, 0, pw, ph], radius=radius, fill=(15, 15, 18, 255), outline=(140, 140, 160, 255), width=int(5*scale))

    border = int(12 * scale)
    sw = pw - border * 2
    sh = ph - border * 2
    if inner_content:
        sc = inner_content.resize((sw, sh), Image.Resampling.LANCZOS)
        mask = Image.new("L", (sw, sh), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.rounded_rectangle([0, 0, sw, sh], radius=int(40*scale), fill=255)
        phone_layer.paste(sc, (border, border), mask)
        
    # Dynamic Island
    pdraw.rounded_rectangle([pw//2 - int(60*scale), border + int(6*scale), pw//2 + int(60*scale), border + int(22*scale)], radius=int(8*scale), fill=(10,10,12,255))
    base_img.paste(phone_layer, (x0, y0), phone_layer)

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(RAW_CINEMATIC, fourcc, FPS, (WIDTH, HEIGHT))

print("Rendering cinematic frames...")

for frame_idx in range(TOTAL_FRAMES):
    t = frame_idx / FPS
    
    # -------------------------------------------------------------
    # SCENE 1: HOOK SINEMATIK AYAM GORENG PANAS (0.0s - 4.5s)
    # "Bosen antre panjang cuma buat pesan makan? Di HR Food..."
    # -------------------------------------------------------------
    if t < 4.5:
        p = t / 4.5
        frame_img = render_ken_burns(img_chicken, p, zoom_start=1.02, zoom_end=1.14, pan_y=-40)
        draw = ImageDraw.Draw(frame_img)
        
        # Logo & Emblem Top
        if img_logo:
            lw, lh = 540, 220
            l_resized = img_logo.resize((lw, lh), Image.Resampling.LANCZOS)
            # Add subtle dark backing for logo readability
            frame_img.paste(l_resized, (WIDTH//2 - lw//2, 120), l_resized)
            
        # Animated Question Card
        draw.rounded_rectangle([WIDTH//2 - 420, 1350, WIDTH//2 + 420, 1680], radius=28, fill=(0, 0, 0, 185), outline=(254, 240, 138, 255), width=3)
        draw.text((WIDTH//2, 1420), "BOSEN ANTRE PANJANG? 🤔", font=font_large, fill=(254, 240, 138), anchor="mm")
        draw.text((WIDTH//2, 1500), "Mau pesan makan gak pake ribet?", font=font_med, fill=(255, 255, 255), anchor="mm")
        draw.text((WIDTH//2, 1580), "Kini Hadir di Restoran HR Food! 🔥", font=font_large, fill=(239, 68, 68), anchor="mm")

    # -------------------------------------------------------------
    # SCENE 2: SCAN BARCODE MEJA (LIFESTYLE RESTO) (4.5s - 9.0s)
    # "Cukup duduk manis di meja, lalu scan barcode di atas meja kamu..."
    # -------------------------------------------------------------
    elif t < 9.0:
        st = t - 4.5
        p = st / 4.5
        frame_img = render_ken_burns(img_customer, p, zoom_start=1.05, zoom_end=1.16, pan_x=20, pan_y=-20)
        draw = ImageDraw.Draw(frame_img)
        
        # Top Step Badge
        draw.rounded_rectangle([WIDTH//2 - 380, 100, WIDTH//2 + 380, 240], radius=24, fill=(185, 28, 28, 240), outline=(254, 240, 138, 255), width=3)
        draw.text((WIDTH//2, 145), "LANGKAH 1 📱", font=font_med, fill=(254, 240, 138), anchor="mm")
        draw.text((WIDTH//2, 195), "DUDUK & SCAN BARCODE MEJA", font=font_large, fill=(255, 255, 255), anchor="mm")
        
        # Phone Overlay on the right/center
        phone_scale = 0.85
        phone_y = int(1050 + math.sin(st * 3) * 12)
        draw_phone_mockup(frame_img, img_menu, WIDTH - 340, phone_y, scale=phone_scale)
        
        # Laser scanning line over the phone screen
        laser_y = int(phone_y - 200 + ((st * 2.2) % 1.0) * 400)
        draw.line([(WIDTH - 500, laser_y), (WIDTH - 180, laser_y)], fill=(239, 68, 68, 255), width=8)
        draw.line([(WIDTH - 500, laser_y), (WIDTH - 180, laser_y)], fill=(254, 240, 138, 240), width=3)
        
        # Success Badge
        if st > 1.8:
            draw.rounded_rectangle([100, 1480, 680, 1600], radius=24, fill=(34, 197, 94, 245), outline=(255, 255, 255), width=3)
            draw.text((390, 1540), "✓ MEJA 02 TERHUBUNG!", font=font_large, fill=(255, 255, 255), anchor="mm")

    # -------------------------------------------------------------
    # SCENE 3: SENSASI SAMBAL & PILIH MENU (9.0s - 16.0s)
    # "Pilih lauk favorit, varian sambal, dan level pedas sesuka hati..."
    # -------------------------------------------------------------
    elif t < 16.0:
        st = t - 9.0
        p = st / 7.0
        frame_img = render_ken_burns(img_sambal, p, zoom_start=1.03, zoom_end=1.18, pan_y=-35)
        draw = ImageDraw.Draw(frame_img)
        
        # Top Step Badge
        draw.rounded_rectangle([WIDTH//2 - 400, 100, WIDTH//2 + 400, 230], radius=24, fill=(185, 28, 28, 240), outline=(254, 240, 138, 255), width=3)
        draw.text((WIDTH//2, 140), "LANGKAH 2 🌶️", font=font_med, fill=(254, 240, 138), anchor="mm")
        draw.text((WIDTH//2, 190), "PILIH LAUK & 3 SAMBAL JUARA", font=font_large, fill=(255, 255, 255), anchor="mm")
        
        # Sambal Selection Pop-up overlay
        pop_scale = min(1.0, st * 2.5)
        pw, ph = int(880 * pop_scale), int(560 * pop_scale)
        if pw > 0 and ph > 0:
            px = WIDTH//2 - pw//2
            py = 1100 - ph//2
            pop_card = Image.new("RGBA", (pw, ph), (255, 255, 255, 250))
            cdraw = ImageDraw.Draw(pop_card)
            cdraw.rounded_rectangle([0, 0, pw, ph], radius=28, fill=(255, 255, 255, 250), outline=(185, 28, 28, 255), width=6)
            
            if pop_scale >= 0.95:
                cdraw.text((pw//2, 50), "3 PILIHAN SAMBAL KHAS HR FOOD 🔥", font=font_large, fill=(185, 28, 28), anchor="mm")
                
                # 3 Sambal choices
                cdraw.rounded_rectangle([40, 90, pw - 40, 175], radius=14, fill=(254, 242, 242), outline=(239, 68, 68), width=3)
                cdraw.text((70, 132), "🌶️ Sambal Terasi (Klasik & Nagih)", font=font_med, fill=(15, 23, 42), anchor="lm")
                
                cdraw.rounded_rectangle([40, 190, pw - 40, 275], radius=14, fill=(254, 252, 232), outline=(234, 179, 8), width=3)
                cdraw.text((70, 232), "🧄 Sambal Bawang (Segar & Pedas)", font=font_med, fill=(15, 23, 42), anchor="lm")

                cdraw.rounded_rectangle([40, 290, pw - 40, 375], radius=14, fill=(240, 253, 244), outline=(34, 197, 94), width=3)
                cdraw.text((70, 332), "🟢 Sambal Cabe Ijo (Pedas Mantap)", font=font_med, fill=(15, 23, 42), anchor="lm")
                
                # Quick tags
                cdraw.text((pw//2, 425), "LEVEL PEDAS: [Sedang]  [Pedas]  [Ekstra Pedas 🔥]", font=font_reg, fill=(100, 116, 139), anchor="mm")
                cdraw.rounded_rectangle([60, 465, pw - 60, 530], radius=12, fill=(34, 197, 94, 255))
                cdraw.text((pw//2, 498), "+ REQUEST: GORENG GARING ✓", font=font_med, fill=(255, 255, 255), anchor="mm")
                
            frame_img.paste(pop_card, (px, py), pop_card)

    # -------------------------------------------------------------
    # SCENE 4: DAPUR LANGSUNG MASAK (16.0s - 20.5s)
    # "Pesanan kamu langsung terkirim ke dapur, cepat, panas, dan siap santap..."
    # -------------------------------------------------------------
    elif t < 20.5:
        st = t - 16.0
        p = st / 4.5
        # Use Chicken photo as sizzling kitchen background
        frame_img = render_ken_burns(img_chicken, 0.4 + p * 0.4, zoom_start=1.12, zoom_end=1.22, pan_y=20)
        draw = ImageDraw.Draw(frame_img)
        
        # Header
        draw.rounded_rectangle([WIDTH//2 - 400, 100, WIDTH//2 + 400, 230], radius=24, fill=(185, 28, 28, 240), outline=(254, 240, 138, 255), width=3)
        draw.text((WIDTH//2, 140), "LANGKAH 3 🍳", font=font_med, fill=(254, 240, 138), anchor="mm")
        draw.text((WIDTH//2, 190), "LANGSUNG MASUK KE DAPUR", font=font_large, fill=(255, 255, 255), anchor="mm")
        
        # Kitchen KDS preview card
        if img_kitchen:
            kw, kh = 880, 520
            k_resized = img_kitchen.resize((kw, kh), Image.Resampling.LANCZOS)
            frame_img.paste(k_resized, (WIDTH//2 - kw//2, 420), k_resized)
            
        # Hot Highlights Box
        draw.rounded_rectangle([WIDTH//2 - 420, 1060, WIDTH//2 + 420, 1540], radius=28, fill=(0, 0, 0, 195), outline=(254, 240, 138, 255), width=4)
        draw.text((WIDTH//2, 1150), "🔔 ALARM DAPUR BERBUNYI!", font=font_large, fill=(254, 240, 138), anchor="mm")
        draw.text((WIDTH//2, 1250), "✓ Koki Langsung Menggoreng Panas", font=font_med, fill=(255, 255, 255), anchor="mm")
        draw.text((WIDTH//2, 1330), "✓ Tanpa Salah Dengar Catatan Sambal", font=font_med, fill=(255, 255, 255), anchor="mm")
        draw.text((WIDTH//2, 1420), "✓ Cepat, Panas & Siap Santap! 🔥", font=font_large, fill=(239, 68, 68), anchor="mm")

    # -------------------------------------------------------------
    # SCENE 5: OUTRO - COMING SOON (20.5s - 25.4s)
    # "Coming soon, pengalaman baru di HR Food. Makan Enak, Mood Naik!"
    # -------------------------------------------------------------
    else:
        st = t - 20.5
        p = st / 4.9
        # Background: Customer & Food warm atmosphere
        frame_img = render_ken_burns(img_customer, 0.5 + p * 0.3, zoom_start=1.15, zoom_end=1.25, pan_y=-30)
        draw = ImageDraw.Draw(frame_img)
        
        # Full dark overlay
        overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 150))
        frame_img.paste(overlay, (0, 0), overlay)
        draw = ImageDraw.Draw(frame_img)
        
        # Big Logo Center
        if img_logo:
            lw, lh = 680, 280
            l_resized = img_logo.resize((lw, lh), Image.Resampling.LANCZOS)
            frame_img.paste(l_resized, (WIDTH//2 - lw//2, 280), l_resized)
            
        # Pulsing COMING SOON Badge
        pulse = 1.0 + 0.05 * math.sin(st * 6)
        bw = int(780 * pulse)
        bh = int(140 * pulse)
        bx0 = WIDTH//2 - bw//2
        by0 = 680 - bh//2
        draw.rounded_rectangle([bx0, by0, bx0 + bw, by0 + bh], radius=bh//2, fill=(254, 240, 138, 255), outline=(255, 255, 255), width=6)
        draw.text((WIDTH//2, 680), "✨ COMING SOON ✨", font=font_huge, fill=(185, 28, 28), anchor="mm")
        
        # Subtitles & Motto
        draw.text((WIDTH//2, 880), "PENGALAMAN MAKAN BARU", font=font_large, fill=(255, 255, 255), anchor="mm")
        draw.text((WIDTH//2, 960), "DI RESTORAN HR FOOD", font=font_large, fill=(254, 202, 202), anchor="mm")
        
        draw.rounded_rectangle([WIDTH//2 - 400, 1080, WIDTH//2 + 400, 1220], radius=24, fill=(185, 28, 28, 240), outline=(254, 240, 138, 255), width=3)
        draw.text((WIDTH//2, 1150), "“Makan Enak, Mood Naik!”", font=font_large, fill=(254, 240, 138), anchor="mm")
        
        # WhatsApp Hotline
        draw.rounded_rectangle([WIDTH//2 - 340, 1320, WIDTH//2 + 340, 1430], radius=50, fill=(37, 211, 102, 255))
        draw.text((WIDTH//2, 1375), "WhatsApp: 0838-3843-2860", font=font_med, fill=(255, 255, 255), anchor="mm")
        
        draw.text((WIDTH//2, 1540), "Segera Hadir di Meja Anda!", font=font_med, fill=(255, 255, 255), anchor="mm")

    # Convert to OpenCV BGR
    cv_frame = cv2.cvtColor(np.array(frame_img), cv2.COLOR_RGBA2BGR)
    out.write(cv_frame)
    
    if frame_idx % 60 == 0:
        print(f"Cinematic frame {frame_idx}/{TOTAL_FRAMES} ({(frame_idx/TOTAL_FRAMES)*100:.1f}%)")

out.release()
print("Cinematic raw video rendering complete!")
