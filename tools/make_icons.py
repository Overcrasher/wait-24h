#!/usr/bin/env python3
"""Generates icons/icon{16,32,48,128}.png: white hourglass on a rounded indigo square.
Stdlib only (zlib + struct). Run from anywhere: python3 tools/make_icons.py"""
import os, struct, zlib

BG = (79, 70, 229)
FG = (255, 255, 255)
SS = 4  # supersampling per axis


def inside_square(x, y):
    r = 0.22
    cx = min(max(x, r), 1 - r)
    cy = min(max(y, r), 1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def inside_glass(x, y):
    # caps
    if 0.2 <= y <= 0.27 and 0.27 <= x <= 0.73:
        return True
    if 0.73 <= y <= 0.8 and 0.27 <= x <= 0.73:
        return True
    # two triangles meeting at the middle
    if 0.27 < y <= 0.5:
        half = 0.21 * (0.5 - y) / 0.23 + 0.02
        return abs(x - 0.5) <= half
    if 0.5 < y < 0.73:
        half = 0.21 * (y - 0.5) / 0.23 + 0.02
        return abs(x - 0.5) <= half
    return False


def render(size):
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            sq = gl = 0
            for sy in range(SS):
                for sx in range(SS):
                    x = (px + (sx + 0.5) / SS) / size
                    y = (py + (sy + 0.5) / SS) / size
                    if inside_square(x, y):
                        sq += 1
                        if inside_glass(x, y):
                            gl += 1
            n = SS * SS
            if sq == 0:
                row += bytes([0, 0, 0, 0])
                continue
            t = gl / sq
            col = [round(BG[i] * (1 - t) + FG[i] * t) for i in range(3)]
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
