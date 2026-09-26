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
RAW_VIDEO = os.path.join(OUT_DIR, "raw_video.mp4")

# Load Assets
LOGO_PATH = "/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/public/hrfood-full-logo.png"
EMBLEM_PATH = "/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/public/hrfood-emblem.png"
MENU_PATH = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/hrfood_menu_upgraded.png"
QR_PATH = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/hrfood_qr_upgraded.png"
KITCHEN_PATH = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/screenshot_kitchen_kds.png"

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

font_huge = get_font(72, bold=True)
font_large = get_font(52, bold=True)
font_med = get_font(36, bold=True)
font_reg = get_font(32, bold=False)
font_small = get_font(26, bold=True)

# Generate Background with warm vignette & particles
np.random.seed(42)
particles = [{"x": np.random.randint(0, WIDTH), "y": np.random.randint(0, HEIGHT), "r": np.random.randint(4, 12), "speed": np.random.uniform(1.0, 2.5), "alpha": np.random.randint(60, 180)} for _ in range(35)]

def draw_background(t):
    # Radial Gradient Simulation
    bg = Image.new("RGBA", (WIDTH, HEIGHT), (120, 15, 15, 255))
    draw = ImageDraw.Draw(bg)
    
    # Gradient bands
    steps = 10
    for i in range(steps):
        r_step = int(120 + i * 4)
        alpha = int(255 - i * 12)
        color = (min(200, 140 + i * 5), max(10, 18 + i * 2), max(10, 18 + i * 2), alpha)
        pad = i * 40
        draw.ellipse([-pad, -pad, WIDTH + pad, HEIGHT + pad], outline=color, width=45)
    
    # Floating sparkles
    for p in particles:
        py = (p["y"] - int(t * p["speed"] * 40)) % HEIGHT
        draw.ellipse([p["x"] - p["r"], py - p["r"], p["x"] + p["r"], py + p["r"]], fill=(255, 235, 150, p["alpha"]))
        
    return bg

def draw_phone_mockup(base_img, inner_content, center_x, center_y, scale=1.0, shadow=True):
    pw = int(620 * scale)
    ph = int(1240 * scale)
    x0 = int(center_x - pw // 2)
    y0 = int(center_y - ph // 2)
    
    if shadow:
        sh = Image.new("RGBA", (pw + 60, ph + 60), (0,0,0,0))
        sh_draw = ImageDraw.Draw(sh)
        sh_draw.rounded_rectangle([30, 30, pw + 30, ph + 30], radius=int(60*scale), fill=(0,0,0,130))
        sh = sh.filter(ImageFilter.GaussianBlur(radius=int(22*scale)))
        base_img.paste(sh, (x0 - 30, y0 - 15), sh)

    phone_layer = Image.new("RGBA", (pw, ph), (0,0,0,0))
    pdraw = ImageDraw.Draw(phone_layer)
    radius = int(55 * scale)
    pdraw.rounded_rectangle([0, 0, pw, ph], radius=radius, fill=(18, 18, 22, 255), outline=(100, 100, 120, 255), width=int(6*scale))

    border = int(14 * scale)
    sw = pw - border * 2
    sh = ph - border * 2
    if inner_content:
        sc = inner_content.resize((sw, sh), Image.Resampling.LANCZOS)
        mask = Image.new("L", (sw, sh), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.rounded_rectangle([0, 0, sw, sh], radius=int(45*scale), fill=255)
        phone_layer.paste(sc, (border, border), mask)
        
    # Dynamic Island
    pdraw.rounded_rectangle([pw//2 - int(70*scale), border + int(6*scale), pw//2 + int(70*scale), border + int(24*scale)], radius=int(10*scale), fill=(10,10,12,255))
    base_img.paste(phone_layer, (x0, y0), phone_layer)

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(RAW_VIDEO, fourcc, FPS, (WIDTH, HEIGHT))

print("Rendering frames...")

for frame_idx in range(TOTAL_FRAMES):
    t = frame_idx / FPS
    frame_img = draw_background(t)
    draw = ImageDraw.Draw(frame_img)
    
    # -------------------------------------------------------------
    # SCENE 1: HOOK TEASER (0.0s - 4.5s)
    # "Bosen antre panjang cuma buat pesan makan? Di HR Food..."
    # -------------------------------------------------------------
    if t < 4.5:
        progress = min(1.0, t / 1.0)
        # Emblem bounce in
        bounce_scale = 0.4 + 0.6 * (1 - math.exp(-4 * progress) * math.cos(6 * progress))
        ew = int(240 * bounce_scale)
        eh = int(240 * bounce_scale)
        if img_emblem and ew > 0 and eh > 0:
            e_resized = img_emblem.resize((ew, eh), Image.Resampling.LANCZOS)
            frame_img.paste(e_resized, (WIDTH//2 - ew//2, 380 - eh//2), e_resized)
            
        # Hook badge
        draw.rounded_rectangle([WIDTH//2 - 260, 560, WIDTH//2 + 260, 630], radius=35, fill=(254, 240, 138, 255))
        draw.text((WIDTH//2, 595), "PERNAH ALAMIN INI? 🤔", font=font_med, fill=(185, 28, 28), anchor="mm")
        
        # Big Questions
        q1_alpha = min(1.0, max(0.0, (t - 0.8) / 0.5))
        if q1_alpha > 0:
            draw.text((WIDTH//2, 750), "Bosen Antre Panjang?", font=font_huge, fill=(255, 255, 255), anchor="mm")
            
        q2_alpha = min(1.0, max(0.0, (t - 1.8) / 0.5))
        if q2_alpha > 0:
            draw.text((WIDTH//2, 870), "Nunggu Pelayan Lama", font=font_large, fill=(254, 202, 202), anchor="mm")
            draw.text((WIDTH//2, 940), "Cuma Buat Pesan Makan?", font=font_large, fill=(254, 202, 202), anchor="mm")
            
        # Solution tease
        sol_alpha = min(1.0, max(0.0, (t - 2.8) / 0.5))
        if sol_alpha > 0:
            draw.rounded_rectangle([WIDTH//2 - 380, 1150, WIDTH//2 + 380, 1380], radius=24, fill=(0, 0, 0, 150), outline=(254, 240, 138, 255), width=3)
            draw.text((WIDTH//2, 1210), "DI HR FOOD, SEKARANG", font=font_med, fill=(254, 240, 138), anchor="mm")
            draw.text((WIDTH//2, 1280), "GAK PAKE RIBET! 🔥", font=font_huge, fill=(255, 255, 255), anchor="mm")

    # -------------------------------------------------------------
    # SCENE 2: LANGKAH 1 - SCAN QR CODE MEJA (4.5s - 9.0s)
    # "Cukup duduk manis di meja, lalu scan barcode di atas meja kamu..."
    # -------------------------------------------------------------
    elif t < 9.0:
        st = t - 4.5
        # Top banner
        draw.rounded_rectangle([WIDTH//2 - 380, 120, WIDTH//2 + 380, 240], radius=24, fill=(254, 240, 138, 255))
        draw.text((WIDTH//2, 160), "LANGKAH 1", font=font_med, fill=(185, 28, 28), anchor="mm")
        draw.text((WIDTH//2, 205), "DUDUK & SCAN BARCODE MEJA", font=font_large, fill=(15, 23, 42), anchor="mm")
        
        # QR Acrylic stand on the table (bottom)
        if img_qr:
            qr_w, qr_h = 560, 720
            qr_resized = img_qr.resize((qr_w, qr_h), Image.Resampling.LANCZOS)
            frame_img.paste(qr_resized, (WIDTH//2 - qr_w//2, 1020), qr_resized)
            
        # Phone scanning down animation
        phone_y = int(720 + math.sin(st * 3) * 15)
        draw_phone_mockup(frame_img, img_menu, WIDTH//2, phone_y, scale=0.88)
        
        # Laser scanner animation
        laser_y = int(phone_y - 280 + ((st * 2) % 1.0) * 560)
        draw.line([(WIDTH//2 - 220, laser_y), (WIDTH//2 + 220, laser_y)], fill=(239, 68, 68, 255), width=8)
        draw.line([(WIDTH//2 - 220, laser_y), (WIDTH//2 + 220, laser_y)], fill=(254, 240, 138, 220), width=3)
        
        # Success badge after 2 seconds
        if st > 2.0:
            badge_alpha = min(1.0, (st - 2.0) * 3)
            draw.rounded_rectangle([WIDTH//2 - 280, 840, WIDTH//2 + 280, 940], radius=20, fill=(34, 197, 94, 255), outline=(255, 255, 255, 255), width=4)
            draw.text((WIDTH//2, 890), "✓ MEJA 02 TERHUBUNG!", font=font_large, fill=(255, 255, 255), anchor="mm")

    # -------------------------------------------------------------
    # SCENE 3: LANGKAH 2 - PILIH LAUK & 3 SAMBAL JUARA (9.0s - 16.0s)
    # "Pilih lauk favorit, varian sambal, dan level pedas sesuka hati..."
    # -------------------------------------------------------------
    elif t < 16.0:
        st = t - 9.0
        # Header
        draw.rounded_rectangle([WIDTH//2 - 400, 100, WIDTH//2 + 400, 230], radius=24, fill=(254, 240, 138, 255))
        draw.text((WIDTH//2, 140), "LANGKAH 2", font=font_med, fill=(185, 28, 28), anchor="mm")
        draw.text((WIDTH//2, 190), "PILIH LAUK & ANEKA SAMBAL", font=font_large, fill=(15, 23, 42), anchor="mm")
        
        # Big Phone center view
        draw_phone_mockup(frame_img, img_menu, WIDTH//2, 980, scale=1.02)
        
        # Sambal Selection Pop-up overlay
        if st > 1.2:
            pop_scale = min(1.0, (st - 1.2) * 3.5)
            pw, ph = int(820 * pop_scale), int(540 * pop_scale)
            if pw > 0 and ph > 0:
                px = WIDTH//2 - pw//2
                py = 880 - ph//2
                pop_card = Image.new("RGBA", (pw, ph), (255, 255, 255, 250))
                cdraw = ImageDraw.Draw(pop_card)
                cdraw.rounded_rectangle([0, 0, pw, ph], radius=28, fill=(255, 255, 255, 250), outline=(185, 28, 28, 255), width=5)
                
                if pop_scale >= 0.95:
                    cdraw.text((pw//2, 50), "PILIH 3 SAMBAL JUARA 🔥", font=font_large, fill=(185, 28, 28), anchor="mm")
                    
                    # 3 Sambal choices
                    cdraw.rounded_rectangle([40, 90, pw - 40, 170], radius=14, fill=(254, 242, 242), outline=(239, 68, 68), width=3)
                    cdraw.text((70, 130), "🌶️ Sambal Terasi (Klasik & Nagih)", font=font_med, fill=(15, 23, 42), anchor="lm")
                    
                    cdraw.rounded_rectangle([40, 185, pw - 40, 265], radius=14, fill=(254, 252, 232), outline=(234, 179, 8), width=3)
                    cdraw.text((70, 225), "🧄 Sambal Bawang (Segar & Pedas)", font=font_med, fill=(15, 23, 42), anchor="lm")

                    cdraw.rounded_rectangle([40, 280, pw - 40, 360], radius=14, fill=(240, 253, 244), outline=(34, 197, 94), width=3)
                    cdraw.text((70, 320), "🟢 Sambal Cabe Ijo (Pedas Mantap)", font=font_med, fill=(15, 23, 42), anchor="lm")
                    
                    # Quick tags
                    cdraw.text((pw//2, 410), "LEVEL PEDAS: [Level 1]  [Level 2]  [Level 3 🔥]", font=font_reg, fill=(100, 116, 139), anchor="mm")
                    cdraw.rounded_rectangle([60, 445, pw - 60, 510], radius=12, fill=(34, 197, 94, 255))
                    cdraw.text((pw//2, 478), "+ REQUEST: GORENG GARING ✓", font=font_med, fill=(255, 255, 255), anchor="mm")
                    
                frame_img.paste(pop_card, (px, py), pop_card)

    # -------------------------------------------------------------
    # SCENE 4: LANGKAH 3 - INSTAN KE DAPUR (16.0s - 20.5s)
    # "Pesanan kamu langsung terkirim ke dapur, cepat, panas, dan siap santap..."
    # -------------------------------------------------------------
    elif t < 20.5:
        st = t - 16.0
        # Header
        draw.rounded_rectangle([WIDTH//2 - 400, 100, WIDTH//2 + 400, 230], radius=24, fill=(254, 240, 138, 255))
        draw.text((WIDTH//2, 140), "LANGKAH 3", font=font_med, fill=(185, 28, 28), anchor="mm")
        draw.text((WIDTH//2, 190), "LANGSUNG MASUK KE DAPUR", font=font_large, fill=(15, 23, 42), anchor="mm")
        
        # Kitchen KDS view
        if img_kitchen:
            kw, kh = 960, 600
            k_resized = img_kitchen.resize((kw, kh), Image.Resampling.LANCZOS)
            frame_img.paste(k_resized, (WIDTH//2 - kw//2, 380), k_resized)
            
        # Hot Frying & Delivery highlights
        draw.rounded_rectangle([WIDTH//2 - 420, 1050, WIDTH//2 + 420, 1550], radius=28, fill=(0, 0, 0, 170), outline=(254, 240, 138, 255), width=4)
        
        # Chime alert pulse
        bell_rot = math.sin(st * 10) * 15
        draw.text((WIDTH//2, 1150), "🔔 ALARM BEL DAPUR BUNYI!", font=font_large, fill=(254, 240, 138), anchor="mm")
        draw.text((WIDTH//2, 1250), "✓ Koki Langsung Masak", font=font_med, fill=(255, 255, 255), anchor="mm")
        draw.text((WIDTH//2, 1330), "✓ Tanpa Salah Dengar Catatan", font=font_med, fill=(255, 255, 255), anchor="mm")
        draw.text((WIDTH//2, 1410), "✓ Makanan Diantar Panas-Panas 🔥", font=font_large, fill=(239, 68, 68), anchor="mm")

    # -------------------------------------------------------------
    # SCENE 5: OUTRO - COMING SOON (20.5s - 25.4s)
    # "Coming soon, pengalaman baru di HR Food. Makan Enak, Mood Naik!"
    # -------------------------------------------------------------
    else:
        st = t - 20.5
        # Big Logo Center
        if img_logo:
            lw, lh = 680, 280
            l_resized = img_logo.resize((lw, lh), Image.Resampling.LANCZOS)
            frame_img.paste(l_resized, (WIDTH//2 - lw//2, 360), l_resized)
            
        # Pulsing COMING SOON Badge
        pulse = 1.0 + 0.05 * math.sin(st * 6)
        bw = int(760 * pulse)
        bh = int(140 * pulse)
        bx0 = WIDTH//2 - bw//2
        by0 = 740 - bh//2
        draw.rounded_rectangle([bx0, by0, bx0 + bw, by0 + bh], radius=bh//2, fill=(254, 240, 138, 255), outline=(255, 255, 255), width=6)
        draw.text((WIDTH//2, 740), "✨ COMING SOON ✨", font=font_huge, fill=(185, 28, 28), anchor="mm")
        
        # Subtitles & Motto
        draw.text((WIDTH//2, 940), "PENGALAMAN MAKAN BARU", font=font_large, fill=(255, 255, 255), anchor="mm")
        draw.text((WIDTH//2, 1020), "DI RESTORAN HR FOOD", font=font_large, fill=(254, 202, 202), anchor="mm")
        
        draw.rounded_rectangle([WIDTH//2 - 380, 1140, WIDTH//2 + 380, 1260], radius=20, fill=(0, 0, 0, 180), outline=(254, 240, 138, 255), width=3)
        draw.text((WIDTH//2, 1200), "“Makan Enak, Mood Naik!”", font=font_large, fill=(254, 240, 138), anchor="mm")
        
        # WhatsApp Hotline
        draw.rounded_rectangle([WIDTH//2 - 320, 1350, WIDTH//2 + 320, 1450], radius=50, fill=(37, 211, 102, 255))
        draw.text((WIDTH//2, 1400), "WhatsApp: 0838-3843-2860", font=font_med, fill=(255, 255, 255), anchor="mm")
        
        draw.text((WIDTH//2, 1560), "Segera Hadir di Meja Anda!", font=font_med, fill=(255, 255, 255), anchor="mm")

    # Convert PIL Image to OpenCV BGR
    cv_frame = cv2.cvtColor(np.array(frame_img), cv2.COLOR_RGBA2BGR)
    out.write(cv_frame)
    
    if frame_idx % 60 == 0:
        print(f"Rendered frame {frame_idx}/{TOTAL_FRAMES} ({(frame_idx/TOTAL_FRAMES)*100:.1f}%)")

out.release()
print("Raw video rendering finished!")
