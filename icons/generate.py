"""Generate Malaware icons at 16/32/48/128 px.

Run from this folder:
    python3 generate.py

Produces icon-16.png, icon-32.png, icon-48.png, icon-128.png.
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

SIZES = (16, 32, 48, 128)
BG = (198, 40, 40, 255)         # #c62828 — matches popup primary button
INNER = (255, 255, 255, 255)
SHADOW = (0, 0, 0, 60)
OUT_DIR = Path(__file__).parent


def find_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/TTF/LiberationSans-Bold.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def shield(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = max(1, size // 16)
    radius = max(2, size // 5)

    # Rounded background.
    draw.rounded_rectangle(
        (pad, pad, size - pad - 1, size - pad - 1),
        radius=radius,
        fill=BG,
    )

    # White letter "M".
    target_height = int(size * 0.62)
    font_size = target_height
    font = find_font(font_size)
    text = "M"
    while font_size > 4:
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        if w <= size * 0.72 and h <= size * 0.72:
            break
        font_size -= 1
        font = find_font(font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) / 2 - bbox[0]
    y = (size - h) / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=INNER)

    return img


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        img = shield(size)
        out = OUT_DIR / f"icon-{size}.png"
        img.save(out, "PNG")
        print(f"wrote {out}")


if __name__ == "__main__":
    main()
