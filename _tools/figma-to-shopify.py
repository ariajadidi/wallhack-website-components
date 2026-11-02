#!/usr/bin/env python3
"""Figma page export -> Shopify JSON templates for the WH theme.

The translation is DATA only: each Figma section component maps to a fixed theme section,
its fields map to settings, and slot items map to blocks. No CSS is generated here.

Usage:  python3 _tools/figma-to-shopify.py [_content/figma-export.json] [--only <page-key> ...]
Writes: templates/<entry "template">, e.g. page.wh-k002.json for a live page (see HANDOFF.md).
        Test pages without a "template" go to templates/index.<page-key>.json (dev store only).
"""
import html, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILE = "shopify://shop_images/{}"

# Figma image fill hash (SHA-1 of the image) -> uploaded file in Content > Files
IMAGES = {
    "9d4655b14c604095fc43300fa9a666babdc07783": "wh-cover-sp005.jpg",
    "34e00e1d9ca38e1ffccc252a8f132773e8a558de": "wh-text-media-spill.jpg",
    "27d4ad4eb310349face8f62bd2ece79e08142355": "wh-split-precision.jpg",
    "d2bee6b488686cff48ed26bdb5651f6a1c8277af": "wh-image-k001.jpg",
    "a21e0747fe84c1de04b1fff0f5f478145fee1965": "wh-compare-surface.jpg",
    "538b5aed78c1798e6922dc222c86ceac11528249": "wh-card-ks-tr-light.png",
    "bd77829cddb416ee4e5df93d21a93ef94a5f9ec0": "wh-card-ks-tr-medium.png",
    "47391fb2c5f76f7da2aab35025abd7ab21e2b1f0": "wh-card-ks-tr-heavy.png",
    "6f39cdda56f8d676e5a8aa95c5b7c494df26af5a": "wh-text-media-test-1.jpg",
    "ada9b2c3a5918f92040c5357847a10593034044f": "wh-text-media-test-2.jpg",
    "670ec1e69318d675b110e2202484e84c22285c9c": "wh-image-test-2.jpg",
    "9708bcc06216727085c78969b7cba36908e2bec0": "wh-cover-test-2.jpg",
    # Product Header gallery (M-001): transparent PNG cut-outs (_content/upload-v5). Shopify can't use AVIF as a theme image
    # (Files stores it as a plain file); its CDN serves these PNGs as WebP with transparency, resized per screen.
    "bc0faba3beae0c3ac2ccb6daa8b0719ad8a1f5e3": "wh-pdp-m001-1.png",
    "5f71ee3554eeade0b5545171a675048835a1d10a": "wh-pdp-m001-2.png",
    "33a98240293e05353a5de3fd6e131a1b8b2f3c5d": "wh-pdp-m001-3.png",
    "5d3cd058923472eddfdf7cba001101b50eebea38": "wh-split-m001.jpg",
}
# Campaign photos (archive conversions): Figma image hash -> uploaded file, kept in a JSON file (_content/upload-v6)
IMAGES.update(json.load(open(ROOT / "_content/image-map-campaigns.json")))

# Figma Library component -> uploaded SVG
ICONS = {
    "USP/General/3MM": "wh-usp-3mm-v2.svg", "USP/Random/Random": "wh-usp-random-v2.svg", "USP/General/CNDEdge": "wh-usp-cnd-edge-v2.svg",
    "USP/General/LaserEtched": "wh-usp-laser-etched-v2.svg", "USP/General/TemperedGlass": "wh-usp-tempered-glass-v2.svg",
    "Drawing/Skates/Dot-Skates": "wh-drawing-dot-skates-v2.svg", "Drawing/Skates/Pill-Skates": "wh-drawing-pill-skates-v2.svg",
    "Contents/K001/K001Box": "wh-contents-k001-box-v2.svg", "Contents/K001/K001": "wh-contents-k001-v2.svg", "Contents/K001/USBa-USBc": "wh-contents-usba-usbc-v2.svg",
    "Contents/K001/KeyswitchPuller": "wh-contents-keyswitch-puller-v2.svg", "Contents/K001/KeycapPuller": "wh-contents-keycap-puller-v2.svg",
    "Contents/K001/4DRiser": "wh-contents-4d-riser-v2.svg", "Contents/K001/7DRiser": "wh-contents-7d-riser-v2.svg",
    "Contents/K001/4DScrews": "wh-contents-4d-screws-v2.svg", "Contents/K001/7DScrews": "wh-contents-7d-screws-v2.svg", "Contents/K001/Screwdriver": "wh-contents-screwdriver-v2.svg",
    "Contents/M001/M001Box": "wh-contents-m001-box.svg", "Contents/M001/M001": "wh-contents-m001.svg", "Contents/M001/M001-Receiver": "wh-contents-m001-receiver.svg",
    "Contents/M001/USBa-USBc": "wh-contents-m001-usba-usbc.svg", "Contents/M001/M001Battery": "wh-contents-m001-battery.svg",
}
# Line drawing set -> (desktop art, mobile art or None)
DRAWINGS = {"Line drawing/SP005": ("wh-drawing-sp005-desktop-v2.svg", "wh-drawing-sp005-mobile-v2.svg"),
            "Line drawing/K001 Top-Down": ("wh-drawing-k001-top-down.svg", None),
            "Line drawing/K001 Front": ("wh-drawing-k001-front.svg", None), "Line drawing/M001 Side": ("wh-drawing-m001-side.svg", None),
            "Line drawing/M001 Receiver": ("wh-drawing-m001-receiver.svg", None),
            "Line drawing/Pro Sleeve": ("wh-drawing-pro-sleeve.svg", None)}

def img(hashes):
    return FILE.format(IMAGES[hashes[0]]) if hashes and hashes[0] in IMAGES else ""

def icon(name):
    return FILE.format(ICONS[name]) if name in ICONS else ""

def rich(text):
    """Figma line breaks = paragraphs (spacing comes from the P1/P2 paragraph-spacing tokens)."""
    # A soft line break (Shift+Enter in Figma, U+2028) stays inside the paragraph as <br>; two in a row leave an empty line.
    paras = [p.strip() for p in (text or "").split("\n") if p.strip()]
    return "".join("<p>" + "<br>".join(html.escape(l.strip(), quote=False) for l in p.split("\u2028")) + "</p>" for p in paras)

def line(text):
    """Single-line settings: manual line breaks are not translatable copy, so they become spaces."""
    return re.sub(r"\s*[\n\u2028]\s*", " ", text or "").strip()

PAGE_MODE = "Light"   # set per page from the frame's Color mode; sections without their own mode inherit it

def head(text):
    """Headings keep deliberate line breaks from Figma (rendered with newline_to_br); stray spaces around them are trimmed."""
    return re.sub(r"[ \t]*[\n\u2028][ \t]*", "\n", text or "").strip()

def media_opts(s):
    """Media/Image options from Figma: phone photo, photo fades, gradient behind the photo."""
    return {"image_mobile": img(s.get("imageMobile")), "image_fade": s.get("imageFade", "none"),
            "image_fade_mobile": s.get("imageFadeMobile", "same"), "image_background": s.get("imageBackground") or ("gradient" if s.get("imageGradient") else "solid"),
            "image_mobile_shape": (shape_of(s.get("imageMobileRatio"))[0] or "") if s.get("imageMobile") else "",
            "image_fit": s.get("imageFit", "fill"),
            "image_fit_mobile": s["imageFitMobile"] if s.get("imageMobile") and s.get("imageFitMobile") and s.get("imageFitMobile") != s.get("imageFit", "fill") else "same",
            **({"custom_gradient_end": s["gradientEnd"]} if s.get("gradientEnd") else {})}

def phone_opts(i):
    """Separate phone photo on a card / Compare column (Figma Mobile image=Separate)."""
    if not i.get("imageMobile"): return {}
    return {"image_mobile": img(i["imageMobile"]), "image_mobile_shape": shape_of(i.get("imageMobileRatio"))[0] or "",
            "image_fit_mobile": i["imageFitMobile"] if i.get("imageFitMobile") and i["imageFitMobile"] != i.get("imageFit", "fill") else "same"}

def scheme(s):
    return (s.get("colorMode") or PAGE_MODE).lower()

def blocks(items):
    out, order = {}, []
    for i, (btype, settings, kids) in enumerate(items, 1):
        key = f"{btype.replace('wh-', '').replace('-', '_')}_{i}"
        out[key] = {"type": btype, "settings": settings}
        if kids:
            out[key]["blocks"], out[key]["block_order"] = blocks(kids)
        order.append(key)
    return out, order

def section(stype, settings, items=None):
    d = {"type": stype, "settings": settings}
    if items is not None:
        d["blocks"], d["block_order"] = blocks(items)
    return d

def convert(s):
    c, p, sl = s["component"], s.get("props", {}), s.get("slots", {})
    if c == "Section/Cover":
        return section("wh-cover", {"heading": head(p["heading"]), "subheading": line(p["subheading"]), "show_subheading": p["show_subheading"],
            "subtitle_position": p["Subtitle position"].lower(), "image": img(s.get("images")), "image_ratio": s.get("imageRatio"), **media_opts(s), "color_scheme": scheme(s)})
    if c == "Section/Intro + USPs":
        return section("wh-intro-usps", {"heading": head(p["heading"]), "body": rich(p["body"]), "show_cta": p["show_cta"], "cta_label": line(s.get("ctaLabel")) or "Choose your pad", "color_scheme": scheme(s)},
            [("wh-usp", {"icon": icon(n)}, None) for n in sl.get("usp-row", [])])
    if c == "Section/Text + Media":
        return section("wh-text-media", {"no_space_top": bool(s.get("noSpaceTop")), "no_space_bottom": bool(s.get("noSpaceBottom")), "show_heading": p["show_heading"], "heading": head(p["heading"]), "body": rich(p["body"]), "image": img(s.get("images")), "image_ratio": s.get("imageRatio"), **media_opts(s), "color_scheme": scheme(s)})
    if c == "Section/Split":
        return section("wh-split", {"image_side": p["Image side"].lower(), "heading": head(p["heading"]), "body": rich(p["body"]), "image": img(s.get("images")), "image_ratio": s.get("imageRatio"), **media_opts(s), "color_scheme": scheme(s)})
    if c == "Section/Text":
        return section("wh-text", {"columns": p["Columns"], "show_heading": p["show_heading"], "heading": head(p["heading"]),
            "body": rich(p.get("body")), "body_1": rich(p.get("body_1")), "body_2": rich(p.get("body_2")), "color_scheme": scheme(s)})
    if c == "Section/Image":
        return section("wh-image", {"image": img(s.get("images")), "image_ratio": s.get("imageRatio"), **media_opts(s), "color_scheme": scheme(s)})
    if c == "Section/Compare":
        return section("wh-compare", {"heading": head(p["heading"]), "body": rich(p["body"]), "color_scheme": scheme(s)},
            [("wh-compare-item", {"name": line(i["props"]["name"]), "show_tags": i["props"].get("show_tags", True), "suitable_label": line(i["props"]["suitable_label"]), "description": rich(i["props"]["description"]), "image": img(i.get("images")), "image_ratio": i.get("imageRatio"), "image_fit": i.get("imageFit", "fill"), "image_background": i.get("imageBackground", "solid"), **phone_opts(i)},
              [("wh-compare-tag", {"label": t}, None) for t in (i.get("tags", []) if i["props"].get("show_tags", True) else [])]) for i in sl.get("items", [])])
    if c == "Section/Cards":
        return section("wh-cards", {"show_heading": p["show_heading"], "heading": head(p["heading"]), "show_intro": p["show_intro"],
            "intro_1": rich(p["intro_1"]), "intro_2": rich(p["intro_2"]), "color_scheme": scheme(s)},
            [("wh-card", {"name": line(i["name"]), "description": rich(i["description"]), "image": img(i.get("images")), "image_ratio": i.get("imageRatio"), "image_fit": i.get("imageFit", "fill"), "image_background": i.get("imageBackground", "solid"), **phone_opts(i)}, None) for i in sl.get("cards", [])])
    if c == "Section/Text Cards":
        return section("wh-text-cards", {"color_scheme": scheme(s)},
            [("wh-text-card", {"name": line(i["name"]), "description": rich(i["description"])}, None) for i in sl.get("cards", [])])
    if c == "Section/Comparison Timeline":
        return section("wh-comparison-timeline", {"show_scale": p["Scale"] == "On", "scale_start": p["scale_start"], "scale_end": p["scale_end"], "color_scheme": scheme(s)},
            [("wh-variant-card", {"name": line(i["name"]), "icon": icon(i["icon"])},
              [("wh-variant-attribute", {"label": a.strip(), "value": v.strip()}, None) for a, v in i.get("attributes", [])]) for i in sl.get("cards", [])])
    if c == "Section/Drawing + callouts":
        desk, mob = DRAWINGS.get(p["drawing"], ("", None))
        d = section("wh-drawing-callouts", {"layout": "illustration" if p.get("Type") == "Illustration" else "callouts",   # Figma Type=Illustration: drawing only
                                            "drawing": FILE.format(desk) if desk else "", "drawing_mobile": FILE.format(mob) if mob else "", "color_scheme": scheme(s)})
        items = [(pos, co) for pos in ("top", "bottom") for co in sl.get(f"callouts-{pos}", [])]
        d["blocks"] = {f"callout_{n}": {"type": "callout", "settings": {"text": rich(co["text"]) or "<p></p>", "position": pos, "type": co["Type"].lower()}} for n, (pos, co) in enumerate(items, 1)}
        d["block_order"] = list(d["blocks"])
        return d
    if c == "Section/Spec row":   # consecutive Spec rows are merged into one Spec sheet below
        pairs = s.get("pairs", [])
        st = {"specs": p["Specs"], "label_1": line(pairs[0]["label"]), "value_1": line(pairs[0]["value"])}
        if len(pairs) > 1:
            st.update(label_2=line(pairs[1]["label"]), value_2=line(pairs[1]["value"]))
        return ("SPEC_ROW", scheme(s), ("wh-spec-row", st, None))
    if c == "Section/Spec sheet":
        rows = []
        for ln in s.get("lines", []):
            pr = ln["pairs"]; st = {"specs": ln["specs"], "label_1": line(pr[0]["label"]), "value_1": line(pr[0]["value"])}
            if len(pr) > 1: st.update(label_2=line(pr[1]["label"]), value_2=line(pr[1]["value"]))
            rows.append(("wh-spec-row", st, None))
        return section("wh-spec-sheet", {"color_scheme": scheme(s)}, rows)
    if c == "Section/Specs + Contents":
        d = section("wh-specs-contents", {"label": line(p.get("label") or s.get("label", "")), "color_scheme": scheme(s)})
        items = [("item", {"icon": icon(i["icon"]), "caption": line(i["caption"])}) for i in sl.get("items", [])]
        for ln in s.get("lines", []):
            pr = ln["pairs"]; st = {"specs": ln["specs"], "label_1": line(pr[0]["label"]), "value_1": line(pr[0]["value"])}
            if len(pr) > 1: st.update(label_2=line(pr[1]["label"]), value_2=line(pr[1]["value"]))
            items.append(("spec_row", st))
        d["blocks"] = {f"{t}_{n}": {"type": t, "settings": st} for n, (t, st) in enumerate(items, 1)}
        d["block_order"] = list(d["blocks"])
        return d
    if c == "Section/Contents":
        return section("wh-contents", {"label": line(p["label"]), "color_scheme": scheme(s)},
            [("wh-contents-item", {"icon": icon(i["icon"]), "caption": line(i["caption"])}, None) for i in sl.get("items", [])])
    if c == "Section/Size table":
        d = section("wh-size-table", {"sizes": ", ".join(x.upper() for x in s["sizes"]), "color_scheme": scheme(s)})
        d["blocks"] = {f"row_{n}": {"type": "row", "settings": {"label": r["label"], "letter": r["letter"].upper(), "values": ", ".join(r["values"])}} for n, r in enumerate(s["rows"], 1)}
        d["block_order"] = list(d["blocks"])
        return d
    if c == "Section/FAQ":
        return section("wh-faq", {"color_scheme": scheme(s)}, [("wh-faq-item", {"question": line(i["question"]), "answer": rich(i["answer"])}, None) for i in sl.get("items", [])])
    if c == "Section/Product Header":   # two Shopify sections: the top bar is its own (sticky) section, then gallery + info
        return [section("wh-top-bar", {"breadcrumbs": line(s.get("breadcrumbs")), "color_scheme": scheme(s)}),
            section("wh-product-header", {"title": line(p["product title"]), "description": rich(p["description"]),
            "show_reviews": p["show_reviews"], "review_count": line(p["review count"]), "reviews_link": line(p["reviews link"]), "color_scheme": scheme(s)},
            [("photo", {"image": img(g.get("images")), "shape": g.get("ratio") or "1:1"}, None) for g in sl.get("gallery", [])])]
    if c == "Menu/Top Bar":   # placed straight on a page (campaign pages): the sticky top bar with breadcrumbs + close
        return section("wh-top-bar", {"breadcrumbs": line(p.get("breadcrumbs")), "color_scheme": scheme(s)})
    if c == "Section/Content Frame":
        return section("wh-content-frame", {"orientation": p["Orientation"].lower(), "image": img(s.get("images")), "image_mobile": img(s.get("imageMobile")) if s.get("imageMobile") else "", "background_gradient": bool(p.get("gradient")), "color_scheme": scheme(s)})
    raise ValueError(f"No theme section for Figma component {c!r}")


# ---------- Element-level colours (case-by-case overrides) → Shopify section Custom CSS ----------
# Section-level text fields → selector inside the section
SECTION_FIELDS = {
    "heading": ".wh-h1", "subheading": ".wh-cover__title-block .wh-p1, .wh-cover__sub",
    "body": ".wh-intro__body, .wh-text-media__body, .wh-split__text .wh-p1, .wh-compare__body, .wh-text__body",
    "body_1": ".wh-text__columns > :nth-child(1)", "body_2": ".wh-text__columns > :nth-child(2)",
    "intro_1": ".wh-cards__intro > :nth-child(1)", "intro_2": ".wh-cards__intro > :nth-child(2)",
    "scale_start": ".wh-timeline__scale > :first-child, .wh-timeline__scale-mobile > :first-child",
    "scale_end": ".wh-timeline__scale > :last-child, .wh-timeline__scale-mobile > :last-child",
    "label": ".wh-contents__label, .wh-contents__label-top", "cta_label": ".wh-button",
}
SECTION_LAYERS = {"cta": ".wh-button", "line": ".wh-timeline__scale hr", "line (mobile)": ".wh-timeline__scale-mobile hr"}
# Text fields inside a block → selector inside that block ("" = the block element itself)
BLOCK_FIELDS = {
    "name": ".wh-h5, .wh-h2", "description": ".wh-p1", "question": ".wh-p1-bold", "answer": ".wh-p2",
    "suitable_label": ".wh-compare-item__tags-block > .wh-p2", "text": ".wh-callout__text", "caption": ".wh-h4",
    "value": "span:last-child, .wh-spec__value",
}
def block_key(component, slot, index, s):
    sl = s.get("slots", {})
    simple = {("Section/Intro + USPs", "usp-row"): "usp", ("Section/Compare", "items"): "compare_item", ("Section/Compare", "tags"): "compare_tag",
              ("Section/Cards", "cards"): "card", ("Section/Text Cards", "cards"): "text_card", ("Section/Comparison Timeline", "cards"): "variant_card",
              ("Section/FAQ", "items"): "faq_item", ("Section/Contents", "items"): "contents_item", ("Section/Spec sheet", "lines"): "spec_row",
              ("Section/Specs + Contents", "items"): "item", ("Section/Size table", "rows"): "row", ("Section/Drawing + callouts", "callouts-top"): "callout"}
    if (component, slot) in simple: return f"{simple[(component, slot)]}_{index + 1}"
    if (component, slot) == ("Section/Specs + Contents", "lines"): return f"spec_row_{len(sl.get('items', [])) + index + 1}"
    if (component, slot) == ("Section/Drawing + callouts", "callouts-bottom"): return f"callout_{len(sl.get('callouts-top', [])) + index + 1}"
    return None

def element_rules(s):
    rules, comp = [], s["component"]
    for c in s.get("elementColors", []):
        path, field, role, hexv = c["path"], c.get("field"), c["role"], c["hex"]
        decl = f"--wh-color-{role.replace('_', '-')}: {hexv};"
        if role == "foreground": decl += f" color: {hexv};"
        if role == "background" and path: decl += f" background-color: {hexv};"
        if path:
            keys = [block_key(comp, p["slot"], p["index"], s) for p in path]
            if None in keys:
                print(f"  ⚠ {comp}: {c['layer']} {hexv} — no matching Shopify block for slot {path}; not carried over"); continue
            # theme blocks get a section prefix in block.id (“…__card_2”); section-defined blocks keep the plain key (“callout_1”)
            local = comp in ("Section/Drawing + callouts", "Section/Size table", "Section/Specs + Contents")
            base = " ".join((f'[data-wh-block="{k}"]' if local else f'[data-wh-block$="__{k}"]') for k in keys)
            if field and field.startswith("value_"): sub = f"td:nth-of-type({field.split('_')[1]})"
            elif field == "label": sub = "span:first-child, .wh-spec__label, th" if comp != "Section/Compare" else ""
            elif field: sub = BLOCK_FIELDS.get(field)
            else: sub = ""            # a fill/stroke on the block itself → recolour that role inside the block
            if sub is None:
                print(f"  ⚠ {comp}: field “{field}” {hexv} — no selector known; not carried over"); continue
            sel = ", ".join(f"{base} {x.strip()}" for x in sub.split(",")) if sub else base
        else:
            sel = SECTION_FIELDS.get(field) if field else SECTION_LAYERS.get(c["layer"])
            if not sel:
                print(f"  ⚠ {comp}: {c['layer']} {hexv} — no selector known; not carried over"); continue
        rules.append(f"{sel} {{ {decl} }}")
    return rules

def apply_colors(sec, s):
    """One-off colour overrides from Figma (collaboration pages) → the section's custom colour fields."""
    for role, value in (s.get("colors") or {}).items():
        sec["settings"]["custom_" + role] = value
    css = element_rules(s)
    if css: sec["custom_css"] = css
    for w in s.get("warnings", []):
        print(f"  ⚠ {s['component']}: {w}")
    return sec

def shape_of(ratio):
    """Figma Media container ratio → Shopify image_shape (+ custom ratio)."""
    if ratio is None: return None, None
    for shape, r in (("21:9", 21 / 9), ("2:1", 2.0), ("16:9", 16 / 9), ("3:2", 1.5), ("4:3", 4 / 3), ("1:1", 1.0), ("4:5", 0.8), ("2:3", 2 / 3), ("9:16", 9 / 16)):
        if abs(ratio - r) < 0.01: return shape, None
    return "custom", ratio

def _shape(settings):
    if "image_ratio" in settings:
        shape, custom = shape_of(settings.pop("image_ratio"))
        if shape: settings["image_shape"] = shape
        if custom: settings["image_ratio"] = custom

def _clean(sec):
    """Remove empty image_ratio settings (section and blocks) so the theme uses the component's default shape."""
    if isinstance(sec, dict):
        _shape(sec.setdefault("settings", {}))
        for b in (sec.get("blocks") or {}).values(): _clean(b)
    return sec

SPACING_DEFAULT = {"wh-split": "regular"}   # Figma default spacing per section when the designer didn't change it (Split = Regular since 2026-10-28)
LARGE_SPACING = {"wh-text-media", "wh-split", "wh-compare", "wh-cards", "wh-text-cards", "wh-comparison-timeline"}   # sections with Spacing Large/Regular

def page(entry):
    global PAGE_MODE
    sections = entry["sections"] if isinstance(entry, dict) else entry
    PAGE_MODE = entry.get("frameMode", "Light") if isinstance(entry, dict) else "Light"
    out, order, n = {}, [], 0
    standalone_keys, standalone = [], []
    for s in sections:
        r = convert(s)
        if isinstance(r, dict) and r.get("type") in LARGE_SPACING: r["settings"]["spacing"] = s.get("spacing", SPACING_DEFAULT.get(r["type"], "large"))
        if isinstance(r, list):          # one Figma component → several sections (Product Header → top bar + header)
            *extra, r = r
            apply_colors(_clean(r), s)
            for x in extra:
                x["settings"].update({k: v for k, v in r["settings"].items() if k in ("custom_background", "custom_foreground", "custom_border")})
                n += 1; key = f"{x['type'].replace('wh-', '').replace('-', '_')}_{n}"; out[key] = x; order.append(key)
        elif isinstance(r, dict): apply_colors(_clean(r), s)
        if isinstance(r, tuple) and r[0] == "SPEC_ROW":
            if order and out[order[-1]]["type"] == "wh-spec-sheet":
                sheet = out[order[-1]]
            else:
                n += 1; key = f"spec_sheet_{n}"; order.append(key)
                sheet = out[key] = {"type": "wh-spec-sheet", "settings": {"color_scheme": r[1]}, "blocks": {}, "block_order": []}
            k = f"spec_row_{len(sheet['block_order']) + 1}"
            sheet["blocks"][k] = {"type": r[2][0], "settings": r[2][1]}; sheet["block_order"].append(k)
            continue
        n += 1; key = f"{r['type'].replace('wh-', '').replace('-', '_')}_{n}"
        out[key] = r; order.append(key)
        if s["component"] == "Menu/Top Bar": standalone_keys.append(key); standalone.append(s)
        if s["component"] == "Section/Product Header" and str(entry.get("template", "") if isinstance(entry, dict) else "").startswith("product."):
            # product pages: the floating buy button (WH Product Bar = Figma Menu Mobile/Product Bar — name, price, Add to Cart from the
            # product). It floats over the page, so it isn't on the page frame in Figma; it gets the defaults and the page's colour mode.
            n += 1; key = f"product_bar_{n}"; order.append(key)
            out[key] = {"type": "wh-product-bar", "settings": {"title": r["settings"].get("title", ""), "color_scheme": r["settings"].get("color_scheme", "light")}}   # name = the Product Header's product title
    bg = entry.get("frameBackground") if isinstance(entry, dict) else None
    if bg:   # the page's own background colour for sections that have none of their own (the top bar has no fill in Figma)
        for key, s in zip(standalone_keys, standalone):   # only top bars placed straight on the page (Menu/Top Bar), not the Product Header's own
            out[key]["settings"].setdefault("custom_background", bg)
    return {"sections": out, "order": order}

if __name__ == "__main__":
    args = sys.argv[1:]
    only = args[args.index("--only") + 1:] if "--only" in args else None     # --only <page-key> [...]: convert just these pages
    if "--only" in args: args = args[:args.index("--only")]
    data = json.load(open(args[0] if args else ROOT / "_content/figma-export.json"))["pages"]
    # Test-store templates (dev theme only). For a live page, give its export entry a "template", e.g. "page.wh-k002.json".
    targets = {"starter-product-launch": "index.json", "starter-basic": "index.basic.json", "starter-accessory": "index.accessory.json"}
    for name in data:
        if only and name not in only: continue
        fn = data[name].get("template") if isinstance(data[name], dict) and data[name].get("template") else targets.get(name, f"index.{name}.json")
        t = page(data[name])
        (ROOT / "templates" / fn).write_text(json.dumps(t, indent=2, ensure_ascii=False))
        print(f"{name:24} -> templates/{fn:22} {len(t['order'])} sections")
