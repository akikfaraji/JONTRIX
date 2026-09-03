#!/usr/bin/env python3
"""FRAZIYM Executive Report — ReportLab body builder + cover merge.
Follows pdf skill report brief: Template 07 Crystal Blue body palette,
TocDocTemplate + multiBuild, safe tables/figures, symmetric margins,
roman TOC footer + arabic body footer, cover merged as page 0 via pypdf.
"""
import sys, os, json, hashlib
PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, "scripts"))
sys.path.insert(0, "/home/z/my-project/scripts")

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,
                                Table, TableStyle, Image, KeepTogether, CondPageBreak,
                                HRFlowable)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from PIL import Image as PILImage

# ---------------------------------------------------------------- fonts
FONT_DIR = "/usr/share/fonts"
pdfmetrics.registerFont(TTFont("NotoSerifSC", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSerifSC-Bold", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
for name, path in [("Noto Sans SC", f"{FONT_DIR}/truetype/chinese/NotoSansSC[wght].ttf"),
                   ("Noto Sans SC Bold", f"{FONT_DIR}/truetype/chinese/NotoSansSC[wght].ttf")]:
    try:
        pdfmetrics.registerFont(TTFont(name, path))
    except Exception as e:
        print(f"skip {name}: {e}")
pdfmetrics.registerFont(TTFont("FreeSerif", f"{FONT_DIR}/truetype/freefont/FreeSerif.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Bold", f"{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Italic", f"{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-BoldItalic", f"{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSans", f"{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf"))
registerFontFamily("NotoSerifSC", normal="NotoSerifSC", bold="NotoSerifSC-Bold")
try:
    registerFontFamily("Noto Sans SC", normal="Noto Sans SC", bold="Noto Sans SC Bold")
except Exception:
    pass
registerFontFamily("FreeSerif", normal="FreeSerif", bold="FreeSerif-Bold",
                   italic="FreeSerif-Italic", boldItalic="FreeSerif-BoldItalic")
registerFontFamily("DejaVuSans", normal="DejaVuSans", bold="DejaVuSans")
from pdf import install_font_fallback
install_font_fallback()

# ---------------------------------------------------------------- palette (Template 07 Crystal Blue body — fixed)
PAGE_BG      = colors.HexColor("#f5f8fc")
SECTION_BG   = colors.HexColor("#edf2f9")
CARD_BG      = colors.HexColor("#e4ecf5")
TABLE_STRIPE = colors.HexColor("#eef3fa")
HEADER_FILL  = colors.HexColor("#1a4a7a")
BORDER       = colors.HexColor("#c0d0e2")
ACCENT       = colors.HexColor("#2d7ab3")
TEXT_PRIMARY = colors.HexColor("#142840")
TEXT_MUTED   = colors.HexColor("#5a7a96")

# ---------------------------------------------------------------- layout consts
MARGIN = 0.9 * inch
TOP_M, BOT_M = 0.95 * inch, 0.9 * inch
PAGE_W, PAGE_H = A4
AVAIL_W = PAGE_W - 2 * MARGIN
AVAIL_H = PAGE_H - TOP_M - BOT_M
H1_THRESHOLD = AVAIL_H * 0.25
MAX_KEEP = PAGE_H * 0.4
TOC_PAGES = 1  # front-matter length (roman numbering zone)

# ---------------------------------------------------------------- styles
st_body = ParagraphStyle("Body", fontName="FreeSerif", fontSize=10.5, leading=17,
                         alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY, spaceAfter=10)
st_h1 = ParagraphStyle("H1", fontName="FreeSerif", fontSize=21, leading=26,
                       textColor=HEADER_FILL, spaceBefore=16, spaceAfter=4)
st_h2 = ParagraphStyle("H2", fontName="FreeSerif", fontSize=14, leading=19,
                       textColor=HEADER_FILL, spaceBefore=12, spaceAfter=6)
st_caption = ParagraphStyle("Caption", fontName="FreeSerif", fontSize=8.5, leading=12,
                            alignment=TA_CENTER, textColor=TEXT_MUTED)
st_stat = ParagraphStyle("Stat", fontName="FreeSerif", fontSize=19, leading=23,
                         alignment=TA_CENTER, textColor=ACCENT)
st_stat_lbl = ParagraphStyle("StatLbl", fontName="FreeSerif", fontSize=8, leading=11,
                             alignment=TA_CENTER, textColor=TEXT_MUTED)
st_quote = ParagraphStyle("Quote", fontName="FreeSerif-Italic", fontSize=11.5, leading=18,
                          leftIndent=24, textColor=TEXT_MUTED, spaceBefore=6, spaceAfter=10)
st_ref = ParagraphStyle("Ref", fontName="FreeSerif", fontSize=8.2, leading=11.5,
                        leftIndent=18, firstLineIndent=-18, textColor=TEXT_PRIMARY,
                        spaceAfter=2, wordWrap="CJK")
st_th = ParagraphStyle("TH", fontName="FreeSerif", fontSize=8.6, leading=11.5,
                       alignment=TA_CENTER, textColor=colors.white)
st_td = ParagraphStyle("TD", fontName="FreeSerif", fontSize=8.6, leading=11.5,
                       alignment=TA_LEFT, textColor=TEXT_PRIMARY)
st_td_c = ParagraphStyle("TDC", parent=st_td, alignment=TA_CENTER)
st_toc_title = ParagraphStyle("TocTitle", fontName="FreeSerif", fontSize=20, leading=26,
                              textColor=HEADER_FILL, spaceAfter=14)

# ---------------------------------------------------------------- doc template
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, "bookmark_name"):
            level = getattr(flowable, "bookmark_level", 0)
            text = getattr(flowable, "bookmark_text", "")
            key = getattr(flowable, "bookmark_key", "")
            # display numbering: body starts at 1 after TOC front-matter
            self.notify("TOCEntry", (level, text, self.page - TOC_PAGES, key))

ROMAN = {1: "i", 2: "ii", 3: "iii", 4: "iv", 5: "v"}
DOC_TITLE = "FRAZIYM — One Product, Many Tools"

def on_page(canvas, doc):
    canvas.saveState()
    # page background (Template 07 light-blue body)
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # header
    canvas.setFont("FreeSerif", 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(MARGIN, PAGE_H - 0.55 * inch, DOC_TITLE.upper())
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.2)
    canvas.line(MARGIN, PAGE_H - 0.62 * inch, PAGE_W - MARGIN, PAGE_H - 0.62 * inch)
    # footer
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN, 0.62 * inch, PAGE_W - MARGIN, 0.62 * inch)
    canvas.setFont("FreeSerif", 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(MARGIN, 0.45 * inch, "FRAZIYM Research · Founder Edition")
    if doc.page <= TOC_PAGES:
        num = ROMAN.get(doc.page, str(doc.page))
    else:
        num = str(doc.page - TOC_PAGES)
    canvas.drawRightString(PAGE_W - MARGIN, 0.45 * inch, num)
    canvas.restoreState()

# ---------------------------------------------------------------- helpers
def add_heading(text, style, level=0):
    key = "h_" + hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph(f'<a name="{key}"/><b>{text}</b>', style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def safe_keep(elements):
    total = 0
    for el in elements:
        w, h = el.wrap(AVAIL_W, PAGE_H)
        total += h
    if total <= MAX_KEEP:
        return [KeepTogether(elements)]
    if len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    return list(elements)

def embed_image(path, max_width=None, max_height=None):
    max_width = max_width or AVAIL_W
    max_height = max_height or PAGE_H * 0.35
    pil = PILImage.open(path)
    ow, oh = pil.size
    ratio = min(max_width / ow if ow > max_width else 1.0,
                max_height / oh if oh > max_height else 1.0)
    return Image(path, width=ow * ratio, height=oh * ratio)

def make_table(spec, header_style=st_th, cell_style=st_td, center_cols=()):
    headers, ratios, rows = spec["headers"], spec["ratios"], spec["rows"]
    widths = [r * AVAIL_W * 0.98 for r in ratios]
    assert sum(widths) <= AVAIL_W + 0.5, "table exceeds available width"
    data = [[Paragraph(f"<b>{h}</b>", header_style) for h in headers]]
    for row in rows:
        cells = []
        for j, v in enumerate(row):
            stl = st_td_c if j in center_cols else cell_style
            cells.append(Paragraph(str(v), stl))
        data.append(cells)
    t = Table(data, colWidths=widths, hAlign="CENTER", repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_FILL),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    for i in range(1, len(data)):
        style.append(("BACKGROUND", (0, i), (-1, i),
                      colors.white if i % 2 == 1 else TABLE_STRIPE))
    t.setStyle(TableStyle(style))
    return t

def callout_block(stats):
    n = len(stats)
    cw = AVAIL_W * 0.96 / n
    cells = []
    for val, label in stats:
        inner = Table([[Paragraph(f"<b>{val}</b>", st_stat)],
                       [Paragraph(label, st_stat_lbl)]], colWidths=[cw - 10])
        inner.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
            ("BOX", (0, 0), (-1, -1), 1, ACCENT),
            ("TOPPADDING", (0, 0), (-1, 0), 8),
            ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        cells.append(inner)
    outer = Table([cells], colWidths=[cw] * n, hAlign="CENTER")
    outer.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    return outer

# ---------------------------------------------------------------- data
from pdf_content import S1, S2, S3, S4, S5, S6, S7, S8, S9
from pdf_content2 import SECTIONS2, TABLES, REFERENCES
SECTIONS = [S1, S2, S3, S4, S5, S6, S7, S8, S9] + SECTIONS2

ROWS = json.load(open("/home/z/my-project/research/opportunities.json", encoding="utf-8"))

# typography fix: prevent em-dash from starting a line (bind dash to previous word)
def _fix_dash(obj):
    if isinstance(obj, str):
        return obj.replace(" \u2014 ", "\u00a0\u2014 ").replace(" \u2014", "\u00a0\u2014")
    if isinstance(obj, list):
        return [_fix_dash(x) for x in obj]
    if isinstance(obj, tuple):
        return tuple(_fix_dash(x) for x in obj)
    if isinstance(obj, dict):
        return {k: _fix_dash(v) for k, v in obj.items()}
    return obj

SECTIONS = _fix_dash(SECTIONS)
TABLES = _fix_dash(TABLES)
REFERENCES = _fix_dash(REFERENCES)
from collections import Counter, defaultdict

zones = defaultdict(list)
for r in ROWS:
    zones[r["zone"]].append(r)
zrows = []
for z, recs in sorted(zones.items(), key=lambda kv: -sum(x["composite"] for x in kv[1]) / len(kv[1])):
    role = Counter(x["platform_role"] for x in recs)
    zrows.append([z, str(len(recs)),
                  f"{sum(x['composite'] for x in recs)/len(recs):.2f}",
                  f"{max(x['composite'] for x in recs):.2f}",
                  f"{role['LTV']}/{role['PRO']}/{role['HOOK']}/{role['GLUE']}",
                  str(sum(1 for x in recs if x["ev_norm"] == "E1"))])
TABLES["T_zones"] = {
    "headers": ["Zone", "Tools", "Avg score", "Max", "LTV/PRO/HOOK/GLUE", "E1 rows"],
    "ratios": [0.28, 0.10, 0.13, 0.10, 0.24, 0.15], "rows": zrows}

t20 = []
for i, r in enumerate(ROWS[:20], 1):
    t20.append([str(i), r["id"], r["title"][:70], f"{r['composite']:.2f}",
                r["platform_role"], r["tier_fit"]])
TABLES["T_top20"] = {
    "headers": ["#", "ID", "Tool / opportunity", "Score", "Role", "Tier"],
    "ratios": [0.05, 0.17, 0.52, 0.09, 0.08, 0.09], "rows": t20}

# ---------------------------------------------------------------- story
BASE = "/home/z/my-project/download"
story = []

toc = TableOfContents()
toc.levelStyles = [ParagraphStyle("TOC1", fontName="FreeSerif", fontSize=10.5,
                                  leading=16, leftIndent=14, textColor=TEXT_PRIMARY)]
story.append(Paragraph("<b>Table of Contents</b>", st_toc_title))
story.append(HRFlowable(width="100%", color=ACCENT, thickness=1.2, spaceAfter=10))
story.append(toc)
story.append(PageBreak())

for sec in SECTIONS:
    h1 = add_heading(f"{sec['num']}. {sec['title']}", st_h1, level=0)
    rule = HRFlowable(width="100%", color=ACCENT, thickness=1.2,
                      spaceBefore=0, spaceAfter=10)
    story.append(CondPageBreak(H1_THRESHOLD))
    first = sec["blocks"][0]
    head_group = [h1, rule]
    if first[0] == "p":
        head_group.append(Paragraph(first[1], st_body))
        rest = sec["blocks"][1:]
    else:
        rest = sec["blocks"]
    story.extend(safe_keep(head_group))
    for kind, payload in rest:
        if kind == "p":
            story.append(Paragraph(payload, st_body))
        elif kind == "h2":
            story.extend(safe_keep([Paragraph(f"<b>{payload}</b>", st_h2)]))
        elif kind == "callouts":
            story.append(Spacer(1, 8))
            story.append(callout_block(payload))
            story.append(Spacer(1, 12))
        elif kind == "quote":
            q = Table([[Paragraph(payload, st_quote)]], colWidths=[AVAIL_W * 0.96])
            q.setStyle(TableStyle([
                ("LINEBEFORE", (0, 0), (0, -1), 2, ACCENT),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(q)
        elif kind == "table":
            spec = TABLES[payload]
            center_cols = {j for j, h in enumerate(spec["headers"])
                           if h.lower() in {"#", "score", "tools", "avg score", "max",
                                            "e1 rows", "tier", "role", "price", "mrr",
                                            "net $/day", "severity", "evidence"}
                           or h.startswith("LTV")}
            tbl = make_table(spec, center_cols=center_cols)
            note = Paragraph(f"Table {sec['num']} — {sec['title']} (source: research/opportunities.json;"
                             " verified URLs in Section 18)", st_caption)
            story.append(Spacer(1, 8))
            if len(spec["rows"]) <= 12:
                story.extend(safe_keep([tbl, Spacer(1, 6), note]))
            else:
                story.append(tbl)
                story.append(Spacer(1, 6))
                story.append(note)
            story.append(Spacer(1, 14))
        elif kind == "fig":
            rel, note = payload
            img = embed_image(os.path.join(BASE, rel),
                              max_width=AVAIL_W,
                              max_height=430 if "pdf.png" in rel or "ranking" in rel else PAGE_H * 0.34)
            cap = Paragraph(note, st_caption)
            story.append(Spacer(1, 12))
            story.extend(safe_keep([img, Spacer(1, 6), cap]))
            story.append(Spacer(1, 14))
        elif kind == "refs":
            for i, ref in enumerate(REFERENCES, 1):
                story.append(Paragraph(f"[{i}] {ref}", st_ref))

# ---------------------------------------------------------------- build body
BODY = "/home/z/my-project/scripts/pdf_body.pdf"
doc = TocDocTemplate(BODY, pagesize=A4,
                     leftMargin=MARGIN, rightMargin=MARGIN,
                     topMargin=TOP_M, bottomMargin=BOT_M,
                     title="FRAZIYM One Product Many Tools - Executive Report",
                     author="Z.ai", creator="Z.ai",
                     subject="$1/day autonomous ecosystem: research, scoring, pricing and roadmap")
doc.multiBuild(story, onFirstPage=on_page, onLaterPages=on_page)
print("body built:", BODY)

# ---------------------------------------------------------------- merge cover
from pypdf import PdfReader, PdfWriter
A4_W, A4_H = 595.28, 841.89

def normalize(page):
    w, h = float(page.mediabox.width), float(page.mediabox.height)
    if abs(w - A4_W) > 0.1 or abs(h - A4_H) > 0.1:
        page.scale_to(A4_W, A4_H)
        page.mediabox.lower_left = (0, 0)
        page.mediabox.upper_right = (A4_W, A4_H)
    return page

writer = PdfWriter()
writer.add_page(normalize(PdfReader("/home/z/my-project/scripts/pdf_cover.pdf").pages[0]))
for p in PdfReader(BODY).pages:
    writer.add_page(normalize(p))
writer.add_metadata({"/Title": "FRAZIYM One Product Many Tools - Executive Report",
                     "/Author": "Z.ai", "/Creator": "Z.ai",
                     "/Subject": "$1/day autonomous ecosystem: research, scoring, pricing and roadmap"})
OUT = "/home/z/my-project/download/FRAZIYM_Executive_Report.pdf"
with open(OUT, "wb") as f:
    writer.write(f)
print("final:", OUT, f"{os.path.getsize(OUT)/1024:.0f}KB, pages={len(writer.pages)}")
