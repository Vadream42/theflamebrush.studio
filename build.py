#!/usr/bin/env python3
"""
The Flame Brush — collection builder.

Scans ./images/<collection-slug>/ for image files and writes
./data/collections.json so the site can render them.

Each collection folder may include an optional `meta.json`:

    {
      "title": "Stillwater",
      "season": "Winter 2025",
      "tagline": "Cobalt, ash, and the long blue dusk.",
      "blurb": "A study in patience...",
      "cover": "01-stillwater-no-1.jpg",
      "order": 1,
      "pieces": {
        "01-stillwater-no-1.jpg": {
          "title": "Stillwater, no. 1",
          "size": "6½″ × 4″",
          "year": "2025",
          "price": 240,
          "edition": "1/1"
        }
      }
    }

Everything in `meta.json` is optional. If omitted, sensible
defaults are inferred from the folder name and filenames.

Usage:
    python3 build.py
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path

# ------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent
IMAGES_DIR = ROOT / "images"
DATA_DIR = ROOT / "data"
OUT_FILE = DATA_DIR / "collections.json"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def titlecase(slug: str) -> str:
    """'coral-burst' -> 'Coral Burst'."""
    words = re.split(r"[-_\s]+", slug)
    return " ".join(w.capitalize() for w in words if w)


def piece_title_from_filename(filename: str) -> str:
    """'02-stillwater-no-1.jpg' -> 'Stillwater no 1'."""
    stem = Path(filename).stem
    # strip leading "01-", "001-", etc.
    stem = re.sub(r"^\d+[-_]?", "", stem)
    return titlecase(stem) if stem else Path(filename).stem


def load_meta(folder: Path) -> dict:
    meta_path = folder / "meta.json"
    if meta_path.exists():
        try:
            return json.loads(meta_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"  ! meta.json in {folder.name} is invalid JSON ({e}); ignoring", file=sys.stderr)
    return {}


def gather_images(folder: Path) -> list[Path]:
    """Return image files sorted by filename (so '01-foo.jpg' < '02-bar.jpg')."""
    files = [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS]
    return sorted(files, key=lambda p: p.name.lower())


def build_collection(folder: Path) -> dict | None:
    slug = folder.name
    images = gather_images(folder)
    if not images:
        print(f"  ! skipping {slug}: no images found")
        return None

    meta = load_meta(folder)
    title = meta.get("title") or titlecase(slug)
    season = meta.get("season", "")
    tagline = meta.get("tagline", "")
    blurb = meta.get("blurb", "")
    order = meta.get("order", 9999)
    piece_meta = meta.get("pieces", {}) or {}

    # cover image
    cover_name = meta.get("cover")
    if cover_name:
        candidate = folder / cover_name
        cover_path = candidate if candidate.exists() else images[0]
    else:
        cover_path = images[0]
    cover_rel = f"images/{slug}/{cover_path.name}"

    pieces = []
    for idx, img in enumerate(images, start=1):
        pm = piece_meta.get(img.name, {}) if isinstance(piece_meta, dict) else {}
        piece = {
            "id": f"{slug}-{idx:02d}",
            "title": pm.get("title", piece_title_from_filename(img.name)),
            "photo": f"images/{slug}/{img.name}",
        }
        for k in ("size", "year", "price", "edition", "note", "materials", "process"):
            if k in pm and pm[k] not in (None, ""):
                piece[k] = pm[k]
        pieces.append(piece)

    print(f"  + {slug}: {len(pieces)} pieces")
    return {
        "id": slug,
        "title": title,
        "season": season,
        "tagline": tagline,
        "blurb": blurb,
        "cover": cover_rel,
        "order": order,
        "pieces": pieces,
    }


def main() -> int:
    print(f"Scanning {IMAGES_DIR.relative_to(ROOT)}/ ...")
    if not IMAGES_DIR.exists():
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        print(f"  ! created empty images/ — nothing to do yet")

    collections: list[dict] = []
    for folder in sorted(IMAGES_DIR.iterdir(), key=lambda p: p.name.lower()):
        if not folder.is_dir():
            continue
        if folder.name.startswith("."):
            continue
        result = build_collection(folder)
        if result:
            collections.append(result)

    # sort by `order` then title
    collections.sort(key=lambda c: (c.get("order", 9999), c.get("title", "")))

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = {"collections": collections}
    OUT_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"\nWrote {len(collections)} collection(s) to {OUT_FILE.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
