"""Builds the extension and Chrome Web Store icons from GlobTrek's existing app icon (app/icon.png).

Run with: python3 extension/scripts/make-icons.py  (needs Pillow)
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "app" / "icon.png"
OUT = ROOT / "extension" / "static" / "icons"
STORE = ROOT / "extension" / "store-assets"


def rounded(image: Image.Image, radius_ratio: float = 0.2) -> Image.Image:
    size = image.size[0]
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * radius_ratio), fill=255)
    out = image.convert("RGBA")
    out.putalpha(mask)
    return out


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)
    STORE.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 128):
        rounded(source.resize((size, size), Image.LANCZOS), 0.18 if size > 16 else 0.12).save(OUT / f"icon-{size}.png", optimize=True)
    # Store icon: 96x96 artwork centered on a 128x128 transparent canvas, per Chrome Web Store guidance.
    canvas = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    canvas.paste(rounded(source.resize((96, 96), Image.LANCZOS)), (16, 16))
    canvas.save(STORE / "store-icon-128.png", optimize=True)


if __name__ == "__main__":
    main()
