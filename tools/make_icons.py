#!/usr/bin/env python3
"""Generates icons/icon{16,32,48,128}.png: cream hourglass with amber sand on a rounded teal square.
Stdlib only (zlib + struct). Run from anywhere: python3 tools/make_icons.py"""
import os, struct, zlib

BG_TOP = (27, 149, 136)
BG_BOT = (11, 94, 87)
GLASS = (255, 248, 236)
SAND = (244, 183, 64)
SS = 4  # supersampling per axis (SS*SS samples per pixel)


def inside_square(x, y):
    r = 0.24
    cx = min(max(x, r), 1 - r)
    cy = min(max(y, r), 1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def half_width(y, margin=0.0):
    """Half-width of the glass at height y (None outside the bulbs). Symmetric around y=0.5."""
    d = abs(y - 0.5)
    if d > 0.26:
        return None
    t = d / 0.26                      # 0 at neck, 1 at the cap
    hw = 0.035 + (0.2 - 0.035) * (t ** 0.75)
    hw -= margin
    return hw if hw > 0 else None


def in_round_bar(x, y, x0, x1, y0, y1, r):
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    return x0 <= x <= x1 and y0 <= y <= y1 and (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def inside_glass(x, y):
    if in_round_bar(x, y, 0.23, 0.77, 0.16, 0.24, 0.04):
        return True
    if in_round_bar(x, y, 0.23, 0.77, 0.76, 0.84, 0.04):
        return True
    hw = half_width(y)
    return hw is not None and abs(x - 0.5) <= hw


def inside_sand(x, y):
    hw = half_width(y, 0.05)
    if hw is None:
        return False
    if y > 0.62:                      # pile in the bottom bulb
        return abs(x - 0.5) <= hw or (y > 0.72 and abs(x - 0.5) <= hw)
    if 0.35 < y < 0.46:               # remaining sand in the top bulb
        return abs(x - 0.5) <= hw
    return abs(x - 0.5) <= 0.012 and y > 0.46  # thin falling stream


def render(size):
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            sq = gl = sd = 0
            for sy in range(SS):
                for sx in range(SS):
                    x = (px + (sx + 0.5) / SS) / size
                    y = (py + (sy + 0.5) / SS) / size
                    if inside_square(x, y):
                        sq += 1
                        if inside_glass(x, y):
                            if size >= 32 and inside_sand(x, y):
                                sd += 1
                            else:
                                gl += 1
            n = SS * SS
            if sq == 0:
                row += bytes([0, 0, 0, 0])
                continue
            yy = (py + 0.5) / size
            bg = [BG_TOP[i] * (1 - yy) + BG_BOT[i] * yy for i in range(3)]
            tg, ts = gl / sq, sd / sq
            col = [round(bg[i] * (1 - tg - ts) + GLASS[i] * tg + SAND[i] * ts) for i in range(3)]
            row += bytes(col + [round(255 * sq / n)])
        rows.append(bytes(row))
    return b"".join(rows)


def png(size):
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", zlib.compress(render(size), 9)) + chunk(b"IEND", b""))


out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons")
os.makedirs(out, exist_ok=True)
for s in (16, 32, 48, 128):
    with open(os.path.join(out, "icon%d.png" % s), "wb") as f:
        f.write(png(s))
    print("wrote icon%d.png" % s)
