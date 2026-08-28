"""Generate branded SVG product placeholders into ../frontend/public/products/.

Draws minimal ceramic silhouettes (mug / ashtray / spice jar / canister) over
soft kiln-toned backgrounds so the storefront demo looks intentional without
depending on external image hosts.
"""

from pathlib import Path

OUT_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "products"

# Palette echoes the Phase 4 design system (glaze / clay / kiln tones).
PALETTES = [
    {"bg": "#EDEAE3", "glaze": "#31547A", "dark": "#26415F", "accent": "#C8B79B"},
    {"bg": "#EFE9E0", "glaze": "#7A9E93", "dark": "#5E7D74", "accent": "#D9CBB4"},
    {"bg": "#EEE7DC", "glaze": "#B0764F", "dark": "#8F5C3B", "accent": "#E3D3BC"},
    {"bg": "#EBE8E4", "glaze": "#8A8FA3", "dark": "#6B7085", "accent": "#D6CFc4"},
    {"bg": "#F0EBE2", "glaze": "#9C6B5E", "dark": "#7C5147", "accent": "#DECDB6"},
    {"bg": "#E9ECE7", "glaze": "#5F7360", "dark": "#49594A", "accent": "#D2CBBA"},
]


def mug(p, i):
    return f"""
<ellipse cx="400" cy="700" rx="240" ry="34" fill="#00000012"/>
<path d="M250 300 L550 300 C565 480 555 620 520 700 L280 700 C245 620 235 480 250 300 Z"
      fill="{p['glaze']}"/>
<path d="M270 330 C280 470 285 560 305 675" stroke="{p['dark']}" stroke-width="16"
      fill="none" stroke-linecap="round" opacity="0.55"/>
<path d="M550 340 C660 330 690 420 660 500 C635 565 570 585 535 585"
      stroke="{p['glaze']}" stroke-width="42" fill="none" stroke-linecap="round"/>
<ellipse cx="400" cy="300" rx="150" ry="30" fill="{p['accent']}"/>
<ellipse cx="400" cy="300" rx="118" ry="20" fill="{p['dark']}" opacity="0.85"/>
<circle cx="400" cy="470" r="46" fill="{p['accent']}" opacity="0.9"/>
"""


def ashtray(p, i):
    return f"""
<ellipse cx="400" cy="700" rx="260" ry="32" fill="#00000012"/>
<path d="M180 430 C180 590 270 680 400 680 C530 680 620 590 620 430 L600 430
         C600 420 560 380 400 380 C240 380 200 420 200 430 Z" fill="{p['glaze']}"/>
<ellipse cx="400" cy="430" rx="200" ry="52" fill="{p['dark']}"/>
<ellipse cx="400" cy="418" rx="170" ry="40" fill="{p['bg']}" opacity="0.25"/>
<circle cx="330" cy="445" r="17" fill="{p['accent']}"/>
<circle cx="470" cy="445" r="17" fill="{p['accent']}"/>
<path d="M225 500 C260 600 320 645 400 655" stroke="{p['dark']}" stroke-width="14"
      fill="none" stroke-linecap="round" opacity="0.4"/>
"""


def spice_jar(p, i):
    return f"""
<ellipse cx="400" cy="700" rx="210" ry="30" fill="#00000012"/>
<rect x="360" y="220" width="80" height="70" rx="10" fill="{p['dark']}"/>
<path d="M340 290 L460 290 L460 320 C520 350 545 420 545 500 C545 620 490 690 400 690
         C310 690 255 620 255 500 C255 420 280 350 340 320 Z" fill="{p['glaze']}"/>
<rect x="330" y="205" width="140" height="34" rx="12" fill="{p['dark']}"/>
<circle cx="400" cy="470" r="60" fill="{p['accent']}"/>
<circle cx="400" cy="470" r="60" fill="none" stroke="{p['dark']}" stroke-width="6" opacity="0.5"/>
<g fill="{p['dark']}">
  <circle cx="385" cy="455" r="7"/><circle cx="415" cy="450" r="6"/>
  <circle cx="398" cy="480" r="7"/>
  <circle cx="376" cy="486" r="6"/><circle cx="422" cy="484" r="6"/>
</g>
"""


def canister(p, i):
    return f"""
<ellipse cx="400" cy="700" rx="230" ry="30" fill="#00000012"/>
<path d="M270 320 L530 320 C555 420 555 580 530 680 L270 680 C245 580 245 420 270 320 Z"
      fill="{p['glaze']}"/>
<ellipse cx="400" cy="320" rx="130" ry="26" fill="{p['dark']}"/>
<rect x="330" y="230" width="140" height="66" rx="14" fill="{p['dark']}"/>
<ellipse cx="400" cy="232" rx="76" ry="16" fill="{p['accent']}"/>
<rect x="285" y="440" width="230" height="110" rx="8" fill="{p['accent']}"/>
<text x="400" y="512" font-family="sans-serif" font-size="64" fill="{p['dark']}"
      text-anchor="middle">☕</text>
<path d="M295 350 C300 480 305 570 320 650" stroke="{p['dark']}" stroke-width="12"
      fill="none" stroke-linecap="round" opacity="0.35"/>
"""


SHAPES = {
    "mug": mug,
    "ashtray": ashtray,
    "spice_jar": spice_jar,
    "canister": canister,
}


def svg_doc(shape: str, palette_index: int, label: str) -> str:
    p = PALETTES[palette_index % len(PALETTES)]
    body = SHAPES[shape](p, palette_index)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"
              width="800" height="800">
<defs>
  <linearGradient id="bkg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{p['bg']}"/>
    <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.35"/>
  </linearGradient>
</defs>
<rect width="800" height="800" fill="url(#bkg)"/>
<circle cx="640" cy="160" r="120" fill="{p['accent']}" opacity="0.35"/>
{body}
<text x="400" y="770" font-family="Tahoma, sans-serif" font-size="30"
      fill="#00000066" text-anchor="middle">{label}</text>
</svg>"""


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # 4 categories x 6 products = 24 hero images (+2 gallery angles each)
    shapes = ["mug", "ashtray", "spice_jar", "canister"]
    count = 0
    for cat_idx, shape in enumerate(shapes):
        for prod_idx in range(6):
            for angle in range(3):
                name = f"{shape}-{prod_idx + 1}-{angle + 1}"
                path = OUT_DIR / f"{name}.svg"
                path.write_text(
                    svg_doc(shape, cat_idx * 2 + prod_idx % 2 + angle, ""), encoding="utf-8"
                )
                count += 1
    print(f"wrote {count} SVG placeholders to {OUT_DIR}")


if __name__ == "__main__":
    main()
