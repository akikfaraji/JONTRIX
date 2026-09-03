#!/usr/bin/env python3
"""Create PDF-specific diagram variants (bigger fonts, narrower canvas) so that
embedded text meets A4 PDF minimums (node title >=10pt, desc >=8pt, label >=7pt
effective at ~465pt embed width)."""
import re

def patch(src, dst, overrides):
    html = open(src, encoding='utf-8').read()
    css = "\n  /* PDF variant overrides */\n" + "\n".join(overrides) + "\n"
    html = html.replace("</style>", css + "</style>")
    open(dst, 'w', encoding='utf-8').write(html)
    print("wrote", dst)

patch("/home/z/my-project/scripts/diagram_ai_router.html",
      "/home/z/my-project/scripts/diagram_ai_router_pdf.html",
      ["#root { min-width: 780px; max-width: 780px; padding: 40px 36px; }",
       ".flow-title { font-size: 26px; }",
       ".flow-subtitle { font-size: 15px; }",
       ".phase-title { font-size: 18px; }",
       ".phase-step { font-size: 15px; }",
       ".phase-step .tag { font-size: 13px; }",
       ".phase-step .step-num { width: 24px; height: 24px; line-height: 24px; font-size: 13px; }",
       ".footnote { font-size: 13px; }"])

patch("/home/z/my-project/scripts/diagram_ecosystem.html",
      "/home/z/my-project/scripts/diagram_ecosystem_pdf.html",
      ["#root { min-width: 940px; max-width: 1000px; padding: 40px 36px; }",
       ".flow-title { font-size: 26px; }",
       ".flow-subtitle { font-size: 16px; }",
       ".layer-title { font-size: 19px; }",
       ".card { font-size: 15px; }",
       ".card b { font-size: 17px; }",
       ".card span { font-size: 15px; }",
       ".chip { font-size: 15px; }",
       ".chip small { font-size: 14px; }",
       ".tier h4 { font-size: 18px; }",
       ".tier .price { font-size: 22px; }",
       ".tier p { font-size: 15px; }",
       ".footnote { font-size: 13px; }"])
