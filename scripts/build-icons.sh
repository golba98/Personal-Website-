#!/usr/bin/env bash
# Regenerates the raster icons from public/favicon.svg. The PNGs are committed
# because there is no image step in the Vite build; run this after editing the
# SVG. Requires rsvg-convert (librsvg).
set -euo pipefail
cd "$(dirname "$0")/.."

rsvg-convert -w 32 -h 32 public/favicon.svg -o public/favicon-32.png
rsvg-convert -w 16 -h 16 public/favicon.svg -o public/favicon-16.png

# iOS ignores prefers-color-scheme and applies its own rounded mask, so the
# touch icon is a separate flat render: full-bleed black, square corners.
sed -e 's/rx="7"//' \
    -e '/@media (prefers-color-scheme: dark)/,+3d' \
    public/favicon.svg > /tmp/apple-touch-src.svg
rsvg-convert -w 180 -h 180 /tmp/apple-touch-src.svg -o public/apple-touch-icon.png
rm -f /tmp/apple-touch-src.svg

echo "icons written to public/"
