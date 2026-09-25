#!/usr/bin/env python3
"""Generates Cyber Gym brand raster assets.

Original artwork: the DAEMON CRT launcher sigil is an angular ``D`` aperture cut
by a cold telemetry beam inside an oxblood control frame. Everything is drawn from
the same primitives so the PWA icon, native launcher icons, splash screens and
repository artwork stay reproducible. Run from the repository root:

    python3 scripts/generate-brand-assets.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

FONT_MONO_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
FONT_MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'

BG = (8, 2, 4, 255)
BG_EL = (20, 4, 8, 255)
RED = (255, 23, 63, 255)
RED_DIM = (139, 0, 28, 255)
CYAN = (98, 221, 232, 255)
TEXT = (234, 221, 224, 255)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def chamfer(d, box, cut, **kw):
    x0, y0, x1, y1 = box
    d.polygon([(x0 + cut, y0), (x1 - cut, y0), (x1, y0 + cut), (x1, y1 - cut),
               (x1 - cut, y1), (x0 + cut, y1), (x0, y1 - cut), (x0, y0 + cut)], **kw)


def draw_glyph(d, S, cx=256, cy=256, scale=1.0, frame=True):
    """Draws the DAEMON sigil in a 512-unit coordinate space."""
    def R(v):
        return v * S * scale

    def pt(x, y):
        return (cx * S + (x - 256) * S * scale, cy * S + (y - 256) * S * scale)

    def rect(x0, y0, x1, y1, fill):
        d.rectangle([pt(x0, y0), pt(x1, y1)], fill=fill)

    if frame:
        chamfer(d, [pt(40, 40)[0], pt(40, 40)[1], pt(472, 472)[0], pt(472, 472)[1]],
                R(58), outline=RED_DIM, width=max(1, int(R(6))))

        # Broken circuit rails make the frame read as a control surface, not a badge.
        d.line([pt(40, 156), pt(68, 156), pt(82, 142), pt(126, 142)],
               fill=RED, width=max(1, int(R(4))))
        d.line([pt(386, 370), pt(430, 370), pt(444, 356), pt(472, 356)],
               fill=RED, width=max(1, int(R(4))))

    # Angular D aperture. It survives Android's circle/squircle masks and remains
    # identifiable at ldpi, unlike the previous detailed barbell pictogram.
    outer = [pt(146, 116), pt(302, 116), pt(382, 196), pt(382, 316),
             pt(302, 396), pt(146, 396)]
    inner = [pt(208, 180), pt(278, 180), pt(320, 222), pt(320, 290),
             pt(278, 332), pt(208, 332)]
    d.polygon(outer, fill=RED)
    d.polygon(inner, fill=BG_EL)

    # Cold telemetry beam doubles as the training/load axis without reverting to
    # a cartoon dumbbell. Terminal nodes stay red; cyan is reserved for live data.
    rect(106, 248, 406, 264, CYAN)
    rect(106, 224, 132, 288, RED)
    rect(380, 224, 406, 288, RED)
    rect(238, 238, 274, 274, TEXT)
    chamfer(d, [pt(244, 244)[0], pt(244, 244)[1], pt(268, 268)[0], pt(268, 268)[1]],
            R(5), fill=RED)

    # Three terse status bars; deliberately chunky enough to survive 36 px ldpi.
    rect(208, 354, 242, 362, RED_DIM)
    rect(248, 354, 282, 362, RED)
    rect(288, 354, 322, 362, RED_DIM)


def icon(size, maskable=False):
    img = Image.new('RGB', (size, size), BG[:3])
    d = ImageDraw.Draw(img)
    S = size / 512
    # Maskable artwork keeps the complete sigil inside Android/PWA safe zones.
    draw_glyph(d, S, scale=0.78 if maskable else 0.92)
    return img


def splash(w, h):
    img = Image.new('RGB', (w, h), BG[:3])
    d = ImageDraw.Draw(img)
    size = max(64, int(min(w, h) * 0.42))
    mark = icon(size, maskable=True)
    img.paste(mark, ((w - size) // 2, (h - size) // 2))
    # Subtle red phosphor scanlines.
    for y in range(0, h, 5):
        d.line([(0, y), (w, y)], fill=(45, 2, 10, 255) if y % 15 else (72, 3, 16, 255), width=1)
    img.paste(mark, ((w - size) // 2, (h - size) // 2))
    return img


def banner(w=1280, h=640):
    """Repository/social banner: a sparse DAEMON CRT control surface."""
    daemon_bg = (8, 2, 4)
    daemon_panel = (20, 4, 8)
    daemon_red = (255, 23, 63)
    daemon_red_dim = (139, 0, 28)
    daemon_cyan = (98, 221, 232)
    daemon_text = (234, 221, 224)
    daemon_muted = (140, 105, 114)
    img = Image.new('RGB', (w, h), daemon_bg)
    d = ImageDraw.Draw(img)

    # Oxblood tube falloff and technical grid.
    for y in range(h):
        edge = abs((y / max(1, h - 1)) - 0.5) * 2
        shade = int(8 * (1 - edge))
        d.line([(0, y), (w, y)], fill=(daemon_panel[0] + shade, 4, 8))
    grid = max(24, int(w / 40))
    for x in range(0, w, grid):
        d.line([(x, 0), (x, h)], fill=(54, 6, 17))
    for y in range(0, h, grid):
        d.line([(0, y), (w, y)], fill=(54, 6, 17))

    rail = max(2, int(h * 0.003))
    d.line([(24, 24), (int(w * .27), 24), (int(w * .29), 46), (int(w * .45), 46),
            (int(w * .47), 28), (int(w * .67), 28)], fill=daemon_red_dim, width=rail)
    d.line([(24, h - 24), (int(w * .2), h - 24), (int(w * .22), h - 42),
            (int(w * .43), h - 42), (int(w * .45), h - 24), (w - 24, h - 24)],
           fill=daemon_red_dim, width=rail)
    d.line([(24, 24), (24, h - 24)], fill=daemon_red_dim, width=rail)
    d.line([(58, 24), (58, int(h * .26)), (76, int(h * .29)), (76, int(h * .67)),
            (58, int(h * .7)), (58, h - 24)], fill=daemon_red_dim, width=rail)

    tx = int(w * 0.085)
    f_title = ImageFont.truetype(FONT_MONO_BOLD, int(h * 0.13))
    f_kicker = ImageFont.truetype(FONT_MONO, int(h * 0.024))
    f_sub = ImageFont.truetype(FONT_MONO, int(h * 0.038))
    f_data = ImageFont.truetype(FONT_MONO, int(h * 0.02))
    d.text((tx, int(h * .18)), 'TRAINING CONTROL NODE / 09', font=f_kicker, fill=daemon_muted)
    y_title = int(h * .34)
    d.text((tx, y_title), 'CYBER', font=f_title, fill=daemon_text)
    title_w = d.textlength('CYBER', font=f_title)
    d.text((tx + title_w, y_title), '//', font=f_title, fill=daemon_red)
    title_w2 = d.textlength('CYBER//', font=f_title)
    d.text((tx + title_w2, y_title), 'GYM', font=f_title, fill=daemon_text)
    d.text((tx, int(h * .52)), 'D A E M O N   C R T', font=f_sub, fill=daemon_red)
    d.text((tx, int(h * .6)), 'PROTOCOL ACTIVE  /  LOCAL DATA  /  ZERO TELEMETRY', font=f_data, fill=daemon_muted)
    d.rectangle([tx, int(h * .66), int(w * .58), int(h * .665)], fill=daemon_red_dim)
    d.rectangle([tx, int(h * .66), int(w * .24), int(h * .67)], fill=daemon_red)

    # Sparse telemetry: one ring, one trace, one bar bank.
    cx, cy, radius = int(w * .76), int(h * .41), int(h * .14)
    d.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=(71, 16, 27), width=max(4, rail * 4))
    d.arc([cx - radius, cy - radius, cx + radius, cy + radius], 38, 302, fill=daemon_cyan, width=max(4, rail * 4))
    d.text((cx - int(radius * .48), cy - int(h * .025)), '78.7', font=f_sub, fill=daemon_text)
    d.text((cx - int(radius * .15), cy + int(h * .035)), 'KG', font=f_data, fill=daemon_muted)
    gx0, gy0, gx1 = int(w * .86), int(h * .28), int(w * .97)
    for idx in range(4):
        gy = gy0 + idx * int(h * .075)
        d.line([(gx0, gy), (gx1, gy)], fill=(93, 19, 34))
    trace = [(gx0, int(h * .56)), (gx0 + 18, int(h * .54)), (gx0 + 34, int(h * .49)),
             (gx0 + 52, int(h * .52)), (gx0 + 70, int(h * .42)), (gx0 + 88, int(h * .51)),
             (gx0 + 108, int(h * .34)), (gx0 + 126, int(h * .54)), (gx1, int(h * .5))]
    d.line(trace, fill=daemon_cyan, width=max(2, rail))
    for idx, height in enumerate((18, 30, 42, 26, 52)):
        x = gx0 + idx * int(w * .025)
        d.rectangle([x, int(h * .71) - height, x + int(w * .018), int(h * .71)], fill=daemon_red)

    d.text((tx, int(h * .86)), 'SYNC 100%  /  PHOSPHOR STABLE  /  USER SOVEREIGN', font=f_data, fill=daemon_cyan)
    for y in range(3, h, 4):
        d.line([(0, y), (w, y)], fill=(0, 0, 0), width=1)
    return img


def save(img, path):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    if path.endswith('.jpg'):
        img.convert('RGB').save(full, quality=90)
    else:
        img.save(full)
    print('wrote', path, img.size)


def main():
    # Web app / PWA
    save(icon(180), 'frontend/public/icon-180.png')
    save(icon(512, maskable=True), 'frontend/public/icon-512.png')
    save(icon(192), 'frontend/public/icon-192.png')
    save(icon(1024, maskable=True), 'frontend/resources/icon.png')

    # Android launcher icons
    launcher = {'ldpi': 36, 'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
    fg = {'ldpi': 54, 'mdpi': 72, 'hdpi': 108, 'xhdpi': 144, 'xxhdpi': 216, 'xxxhdpi': 288}
    for dens, size in launcher.items():
        base = f'frontend/android/app/src/main/res/mipmap-{dens}'
        save(icon(size), f'{base}/ic_launcher.png')
        save(icon(size), f'{base}/ic_launcher_round.png')
        save(icon(size), f'{base}/ic_launcher_background.png')
        save(icon(fg[dens], maskable=True), f'{base}/ic_launcher_foreground.png')

    # Android splash screens
    port = {'ldpi': (200, 320), 'mdpi': (320, 480), 'hdpi': (480, 800),
            'xhdpi': (720, 1280), 'xxhdpi': (960, 1600), 'xxxhdpi': (1280, 1920)}
    for dens, (w, h) in port.items():
        save(splash(w, h), f'frontend/android/app/src/main/res/drawable-port-{dens}/splash.png')
        save(splash(w, h), f'frontend/android/app/src/main/res/drawable-port-night-{dens}/splash.png')
        save(splash(h, w), f'frontend/android/app/src/main/res/drawable-land-{dens}/splash.png')
        save(splash(h, w), f'frontend/android/app/src/main/res/drawable-land-night-{dens}/splash.png')
    save(splash(480, 320), 'frontend/android/app/src/main/res/drawable/splash.png')
    save(splash(480, 320), 'frontend/android/app/src/main/res/drawable-night/splash.png')

    # iOS
    ios = 'frontend/ios/App/App/Assets.xcassets'
    save(icon(1024), f'{ios}/AppIcon.appiconset/AppIcon-512@2x.png')
    for name, size in [('Default@1x~universal~anyany.png', 320),
                       ('Default@2x~universal~anyany.png', 640),
                       ('Default@3x~universal~anyany.png', 960),
                       ('Default@1x~universal~anyany-dark.png', 320),
                       ('Default@2x~universal~anyany-dark.png', 640),
                       ('Default@3x~universal~anyany-dark.png', 960)]:
        save(splash(size, int(size * 1.35)), f'{ios}/Splash.imageset/{name}')
    save(splash(2732, 2732), f'{ios}/Splash.imageset/splash-2732x2732.png')
    save(splash(2732, 2732), f'{ios}/Splash.imageset/splash-2732x2732-1.png')
    save(splash(2732, 2732), f'{ios}/Splash.imageset/splash-2732x2732-2.png')

    # Repository assets
    save(banner(), 'assets/banner.png')
    save(banner(1200, 630), 'assets/social.jpg')


if __name__ == '__main__':
    main()
