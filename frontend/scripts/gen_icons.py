"""Genera los icons de la PWA (fondo brand-bg + mancuerna brand-accent)."""
from PIL import Image, ImageDraw

BG = (18, 18, 18, 255)       # #121212
ACCENT = (34, 197, 94, 255)  # #22c55e

OUT_DIR = "public/icons"


def draw_dumbbell(draw: ImageDraw.ImageDraw, size: int, scale: float):
    """Dibuja una mancuerna simple centrada, ocupando `scale` del ancho."""
    w = size * scale
    cx, cy = size / 2, size / 2
    bar_h = size * 0.09
    plate_w = size * 0.11
    plate_h = size * 0.34
    gap = w * 0.5 - plate_w

    # Barra central
    draw.rounded_rectangle(
        [cx - gap, cy - bar_h / 2, cx + gap, cy + bar_h / 2],
        radius=bar_h / 2,
        fill=ACCENT,
    )
    # Discos (izquierda y derecha, dos tamaños simulando pesas)
    for sign in (-1, 1):
        x_outer = cx + sign * (w / 2)
        x_inner = cx + sign * (w / 2 - plate_w)
        left = min(x_outer, x_inner)
        right = max(x_outer, x_inner)
        draw.rounded_rectangle(
            [left, cy - plate_h / 2, right, cy + plate_h / 2],
            radius=plate_w * 0.3,
            fill=ACCENT,
        )


def make_icon(size: int, path: str, padding_ratio: float = 0.0):
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)
    scale = 0.62 * (1 - padding_ratio)
    draw_dumbbell(draw, size, scale)
    img.save(path)
    print("Generado:", path)


if __name__ == "__main__":
    make_icon(192, f"{OUT_DIR}/icon-192.png")
    make_icon(512, f"{OUT_DIR}/icon-512.png")
    # Maskable: el sistema recorta un circulo central, dejamos mas margen
    make_icon(512, f"{OUT_DIR}/icon-maskable-512.png", padding_ratio=0.28)
    make_icon(180, f"{OUT_DIR}/apple-touch-icon.png")
