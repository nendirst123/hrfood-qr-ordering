import os
import math
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH = 1080
HEIGHT = 1920
FPS = 30
TOTAL_DURATION = 25.5
TOTAL_FRAMES = int(TOTAL_DURATION * FPS)

OUT_DIR = "/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/video_output"
os.makedirs(OUT_DIR, exist_ok=True)
RAW_VIDEO = os.path.join(OUT_DIR, "raw_video.mp4")
FINAL_VIDEO = "/run/media/zabirru/BEBAS SIH/2026/PROJECT HR FOOD/HR_FOOD_Coming_Soon_Animation.mp4"
ARTIFACT_VIDEO = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/HR_FOOD_Coming_Soon_Animation.mp4"

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

# Fonts
def get_font(size, bold=False):
    # Try system fonts
    font_paths = [
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/TTF/DejaVuSans.ttf",
        "/usr/share/fonts/noto/NotoSans-Bold.ttf" if bold else "/usr/share/fonts/noto/NotoSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in font_paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

font_title = get_font(52, bold=True)
font_large = get_font(68, bold=True)
font_huge = get_font(88, bold=True)
font_sub = get_font(38, bold=False)
font_bold = get_font(38, bold=True)
font_tag = get_font(28, bold=True)

# Helper easing
def ease_out_back(t):
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * math.pow(t - 1, 3) + c1 * math.pow(t - 1, 2)

def ease_out_quad(t):
    return 1 - (1 - t) * (1 - t)

def ease_in_out(t):
    return 0.5 * (1 - math.cos(math.pi * t))

# Draw phone frame
def draw_phone_mockup(base_img, inner_content, center_x, center_y, scale=1.0, shadow=True):
    pw = int(600 * scale)
    ph = int(1200 * scale)
    x0 = center_x - pw // 2
    y0 = center_y - ph // 2
    
    # Shadow
    if shadow:
        sh = Image.new("RGBA", (pw + 60, ph + 60), (0,0,0,0))
        sh_draw = ImageDraw.Draw(sh)
        sh_draw.rounded_rectangle([30, 30, pw + 30, ph + 30], radius=int(60*scale), fill=(0,0,0,140))
        sh = sh.filter(ImageFilter.GaussianBlur(radius=int(25*scale)))
        base_img.paste(sh, (x0 - 30, y0 - 15), sh)

    # Phone body (Dark titanium)
    phone_layer = Image.new("RGBA", (pw, ph), (0,0,0,0))
    pdraw = ImageDraw.Draw(phone_layer)
    radius = int(55 * scale)
    pdraw.rounded_rectangle([0, 0, pw, ph], radius=radius, fill=(20, 20, 24, 255), outline=(90, 90, 105, 255), width=int(6*scale))

    # Inner Screen
    border = int(14 * scale)
    sw = pw - border * 2
    sh = ph - border * 2
    if inner_content:
        sc = inner_content.resize((sw, sh), Image.Resampling.LANCZOS)
        # Mask with rounded corners
        mask = Image.new("L", (sw, sh), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.rounded_rectangle([0, 0, sw, sh], radius=int(45*scale), fill=255)
        phone_layer.paste(sc, (border, border), mask)
        
    # Dynamic Island / Speaker notch
    pdraw.rounded_rectangle([pw//2 - int(70*scale), border + int(6*scale), pw//2 + int(70*scale), border + int(24*scale)], radius=int(10*scale), fill=(10,10,12,255))
    
    base_img.paste(phone_layer, (x0, y0), phone_layer)

print("Setup complete. Ready to render frames.")
