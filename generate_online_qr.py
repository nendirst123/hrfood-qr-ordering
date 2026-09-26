import qrcode
from PIL import Image, ImageDraw, ImageFont
import os

target_url = "https://education-clicking-evanescence-declaration.trycloudflare.com/?table=02"
out_path_1 = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/scan_meja_02_online.png"
out_path_2 = "/run/media/zabirru/BEBAS SIH/2026/PROJECT HR FOOD/SCAN_MEJA_02_ONLINE.png"

# Generate QR
qr = qrcode.QRCode(
    version=2,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=12,
    border=2,
)
qr.add_data(target_url)
qr.make(fit=True)
qr_img = qr.make_image(fill_color="#0f172a", back_color="white").convert("RGBA")

# Card Canvas
CARD_W = 600
CARD_H = 850
card = Image.new("RGBA", (CARD_W, CARD_H), (255, 255, 255, 255))
draw = ImageDraw.Draw(card)

# Red Header
draw.rectangle([0, 0, CARD_W, 160], fill=(185, 28, 28, 255))

# Fonts
def get_font(size, bold=True):
    paths = [
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/TTF/DejaVuSans.ttf",
        "/usr/share/fonts/noto/NotoSans-Bold.ttf" if bold else "/usr/share/fonts/noto/NotoSans-Regular.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

font_title = get_font(34, bold=True)
font_sub = get_font(20, bold=False)
font_table = get_font(42, bold=True)
font_step = get_font(18, bold=True)
font_tiny = get_font(14, bold=False)

# Header Text
draw.text((CARD_W//2, 55), "HR FOOD", font=font_title, fill=(255, 255, 255), anchor="mm")
draw.text((CARD_W//2, 105), "“Makan Enak, Mood Naik!”", font=font_sub, fill=(254, 240, 138), anchor="mm")

# Table Badge
draw.rounded_rectangle([CARD_W//2 - 130, 180, CARD_W//2 + 130, 245], radius=16, fill=(254, 242, 242), outline=(239, 68, 68), width=3)
draw.text((CARD_W//2, 212), "MEJA 02", font=font_table, fill=(185, 28, 28), anchor="mm")

# Paste QR
qr_w, qr_h = qr_img.size
qx = CARD_W//2 - qr_w//2
qy = 270
card.paste(qr_img, (qx, qy), qr_img)

# Center Logo in QR
emblem_path = "/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/public/hrfood-emblem.png"
if os.path.exists(emblem_path):
    emblem = Image.open(emblem_path).convert("RGBA").resize((70, 70), Image.Resampling.LANCZOS)
    draw.ellipse([CARD_W//2 - 42, qy + qr_h//2 - 42, CARD_W//2 + 42, qy + qr_h//2 + 42], fill=(255, 255, 255), outline=(185, 28, 28), width=3)
    card.paste(emblem, (CARD_W//2 - 35, qy + qr_h//2 - 35), emblem)

# Instructions Footer
draw.rounded_rectangle([40, 700, CARD_W - 40, 780], radius=14, fill=(248, 250, 252), outline=(203, 213, 225), width=2)
draw.text((CARD_W//2, 725), "📱 Arahkan Kamera HP ke QR Code Ini", font=font_step, fill=(15, 23, 42), anchor="mm")
draw.text((CARD_W//2, 755), "Menu Otomatis Terbuka di HP & Langsung Terhubung ke Dapur", font=font_tiny, fill=(100, 116, 139), anchor="mm")

# Save
card.save(out_path_1)
card.save(out_path_2)
print("QR Code Meja 02 Online successfully generated!")
