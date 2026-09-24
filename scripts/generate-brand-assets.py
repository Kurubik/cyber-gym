#!/usr/bin/env python3
"""Generates Cyber Gym (Blackwall) brand raster assets.

Original artwork: a chamfered HUD panel containing a stylised barbell, a magenta
core hub and cyan end plates. Everything is drawn from the same primitives so the
PWA icon, the native launcher icons, the splash screens and the social banner all
carry the same mark. Run from the repository root:

    python3 scripts/generate-brand-assets.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

FONT_MONO_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
FONT_MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'

BG = (4, 6, 13, 255)
BG_EL = (9, 16, 24, 255)
CYAN = (0, 229, 255, 255)
CYAN_DIM = (0, 229, 255, 90)
MAGENTA = (255, 43, 214, 255)
AMBER = (255, 176, 0, 255)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def chamfer(d, box, cut, **kw):
    x0, y0, x1, y1 = box
    d.polygon([(x0 + cut, y0), (x1 - cut, y0), (x1, y0 + cut), (x1, y1 - cut),
               (x1 - cut, y1), (x0 + cut, y1), (x0, y1 - cut), (x0, y0 + cut)], **kw)


def draw_glyph(d, S, cx=256, cy=256, scale=1.0, frame=True):
    """Draws the mark into a 512-unit coordinate space scaled by S=size/512."""
    def R(v):
        return v * S * scale

    def pt(x, y):
        return (cx * S + (x - 256) * S * scale, cy * S + (y - 256) * S * scale)

    def rect(x0, y0, x1, y1, fill):
        d.rectangle([pt(x0, y0), pt(x1, y1)], fill=fill)

    if frame:
        chamfer(d, [pt(40, 40)[0], pt(40, 40)[1], pt(472, 472)[0], pt(472, 472)[1]],
                R(58), outline=CYAN_DIM, width=max(1, int(R(5))))

    # barbell bar
    rect(92, 246, 420, 266, CYAN)
    # end plates
    rect(92, 200, 122, 312, CYAN)
    rect(128, 220, 148, 292, CYAN)
    rect(390, 200, 420, 312, CYAN)
    rect(364, 220, 384, 292, CYAN)
    # collar ticks
    rect(154, 238, 166, 274, CYAN)
    rect(346, 238, 358, 274, CYAN)
    # core hub (magenta, chamfered)
    chamfer(d, [pt(234, 228)[0], pt(228 - 0, 234)[1], pt(278, 284)[0], pt(284, 278)[1]],
            R(10), fill=MAGENTA)
    # scan accent
    rect(198, 292, 314, 298, AMBER)


def icon(size, maskable=False):
    img = Image.new('RGB', (size, size), BG[:3])
    d = ImageDraw.Draw(img)
    S = size / 512
    draw_glyph(d, S, scale=0.82 if maskable else 0.92)
    return img


def splash(w, h):
    img = Image.new('RGB', (w, h), BG[:3])
    d = ImageDraw.Draw(img)
    size = max(64, int(min(w, h) * 0.42))
    mark = icon(size, maskable=True)
    img.paste(mark, ((w - size) // 2, (h - size) // 2))
    # subtle scanlines
    for y in range(0, h, 5):
        d.line([(0, y), (w, y)], fill=(0, 60, 80, 255) if y % 15 else (0, 90, 110, 255), width=1)
    img.paste(mark, ((w - size) // 2, (h - size) // 2))
    return img


def banner(w=1280, h=640):
    img = Image.new('RGB', (w, h), BG[:3])
    d = ImageDraw.Draw(img)
    # grid
    for x in range(0, w, 40):
        d.line([(x, 0), (x, h)], fill=(9, 22, 32, 255))
    for y in range(0, h, 40):
        d.line([(0, y), (w, y)], fill=(9, 22, 32, 255))
    size = int(h * 0.62)
    mark = icon(size, maskable=True)
    mx, my = int(w * 0.07), (h - size) // 2
    img.paste(mark, (mx, my))
    # wordmark
    fs = int(h * 0.115)
    f = ImageFont.truetype(FONT_MONO_BOLD, fs)
    tx = mx + size + int(w * 0.045)
    ty = h // 2 - fs
    d.text((tx, ty), 'CYBER', font=f, fill=(232, 246, 255))
    wlen = d.textlength('CYBER', font=f)
    d.text((tx + wlen, ty), '//', font=f, fill=MAGENTA[:3])
    wlen2 = d.textlength('CYBER//', font=f)
    d.text((tx + wlen2, ty), 'GYM', font=f, fill=(232, 246, 255))
    fs2 = int(h * 0.04)
    f2 = ImageFont.truetype(FONT_MONO, fs2)
    d.text((tx + 4, ty + int(fs * 1.35)), 'B L A C K W A L L   C O N T R O L   S Y S T E M', font=f2, fill=CYAN[:3])
    d.rectangle([tx, ty + int(fs * 1.9), tx + int(w * 0.42), ty + int(fs * 1.9) + 3], fill=CYAN[:3])
    # accent rule under the mark
    d.rectangle([mx, my + size + 34, mx + size, my + size + 41], fill=CYAN[:3])
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
