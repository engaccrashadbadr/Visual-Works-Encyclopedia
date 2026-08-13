from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

out = Path(__file__).resolve().parent.parent / "assets"
out.mkdir(parents=True, exist_ok=True)

# App icon: deep navy tile with a violet layered encyclopedia mark.
size = 1024
img = Image.new("RGBA", (size, size), (10, 9, 24, 255))
d = ImageDraw.Draw(img)
d.rounded_rectangle((64, 64, 960, 960), radius=190, fill=(116, 78, 255, 255))
d.rounded_rectangle((174, 218, 850, 796), radius=70, fill=(19, 16, 43, 255), outline=(198, 183, 255, 255), width=14)
for y, alpha in [(330, 255), (430, 215), (530, 175)]:
    d.rounded_rectangle((250, y, 774, y + 82), radius=28, fill=(143, 112, 255, alpha), outline=(231, 225, 255, 255), width=8)
img.save(out / "icon.png")

# Splash: same identity, centered mark and readable title.
sw, sh = 1600, 2560
splash = Image.new("RGBA", (sw, sh), (10, 9, 24, 255))
sd = ImageDraw.Draw(splash)
sd.rounded_rectangle((sw//2-260, sh//2-430, sw//2+260, sh//2+90), radius=110, fill=(116, 78, 255, 255))
sd.rounded_rectangle((sw//2-190, sh//2-340, sw//2+190, sh//2+20), radius=46, fill=(19, 16, 43, 255), outline=(231, 225, 255, 255), width=10)
for y in [sh//2-235, sh//2-170, sh//2-105]:
    sd.rounded_rectangle((sw//2-135, y, sw//2+135, y+42), radius=15, fill=(174, 151, 255, 255))
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 64)
    small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 34)
except OSError:
    font = None
    small = None
text = "Visual Works"
sub = "ENCYCLOPEDIA"
bbox = sd.textbbox((0, 0), text, font=font)
sd.text(((sw-(bbox[2]-bbox[0]))/2, sh//2+210), text, fill=(245, 243, 255, 255), font=font)
sbox = sd.textbbox((0, 0), sub, font=small)
sd.text(((sw-(sbox[2]-sbox[0]))/2, sh//2+300), sub, fill=(184, 173, 231, 255), font=small)
splash.save(out / "splash.png")
print(out / "icon.png")
print(out / "splash.png")
