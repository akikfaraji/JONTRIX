#!/usr/bin/env python3
"""Build the FRAZIYM opportunities database.
Merges 104 research-backed rows (base_rows.json) + generated long-tail catalog
(gen_catalog.GEN_ROWS), scores all rows on the 10 weighted dimensions, assigns
platform_role + tier_fit under the One-Product-Many-Tools subscription model.

Output: research/opportunities.json  (target 200+ rows, 36+ fields each)
"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from gen_catalog import GEN_ROWS, FAM_META

BASE = "/home/z/my-project/research/base_rows.json"
OUT = "/home/z/my-project/research/opportunities.json"

W = {"demand": 0.20, "pain": 0.15, "frequency": 0.10, "automation": 0.15,
     "monetization": 0.10, "distribution": 0.10, "competition": 0.05,
     "infra_econ": 0.05, "ecosystem": 0.05, "defensibility": 0.05}

CLAMP = lambda x: max(1.0, min(10.0, round(float(x), 1)))

# ---------------- heuristics for base rows ----------------
FREQ_MAP = [("daily", 9), ("constant", 8), ("continuous", 8), ("evergreen", 8),
            ("weekly", 7), ("seasonal", 5), ("spike", 5), ("episodic", 4.5),
            ("growing", 5), ("term", 4), ("monthly", 4), ("each", 5), ("per ", 5)]

def score_base(r):
    txt_auto = (r.get("automation") or "").lower()
    txt_exist = ((r.get("existing") or "") + " " + (r.get("complaints") or "")).lower()
    txt_dist = (r.get("distribution") or "").lower()
    txt_aud = (r.get("audience") or "").lower()
    txt_prob = (r.get("problem") or "").lower()
    txt_notes = (r.get("notes") or "").lower()
    all_txt = " ".join([txt_prob, txt_exist, txt_dist, txt_auto, txt_notes])
    ev = r.get("ev_norm", "E3")
    sev = r.get("severity") or 5.0
    freq = (r.get("frequency") or "").lower()

    # demand
    d = 5.0
    if any(b in txt_aud for b in ["all developers", "everyone", "students", "teachers",
        "sellers", "small businesses", "freelancers", "landlords", "couples",
        "podcasters", "writers", "drivers", "global"]): d += 2
    if any(b in txt_aud for b in ["accountant", "dba", "backend", "api", "ecommerce",
        "shopify", "amazon", "data engineer", "devops", "agency", "bookkeeper"]): d += 1
    d += {"E1": 1.5, "E2": 0.5, "E3": -1.0}[ev]

    # pain = severity
    p = CLAMP(sev)

    # frequency
    f = 5.0
    for k, v in FREQ_MAP:
        if k in freq:
            f = v; break

    # automation
    if "100% deterministic" in txt_auto or "fully deterministic" in txt_auto:
        a = 10.0
    elif "deterministic" in txt_auto and ("small" in txt_auto or "optional" in txt_auto or "assist" in txt_auto or "explainer" in txt_auto or "summar" in txt_auto):
        a = 8.0
    elif "deterministic" in txt_auto:
        a = 8.5
    elif "needs-ai" in txt_auto or "needs ai" in txt_auto or " ai" in txt_auto or txt_auto.startswith("ai"):
        a = 5.5
    else:
        a = 6.5

    # monetization
    m = 5.0
    if re.search(r'\$\d+', txt_exist): m += 2
    if any(k in txt_exist for k in ["subscription", "/mo", "per month", "paid", "pricing", "price"]): m += 1
    if any(k in txt_aud + txt_prob for k in ["accountant", "dba", "agency", "seller", "ecommerce", "landlord", "business", "marketer"]): m += 1
    if any(k in all_txt for k in ["saturated", "category king", "dominant", "free for a decade"]): m -= 2.5
    if "monetiz" in txt_notes and "weak" in txt_notes: m -= 1

    # distribution
    di = 5.0
    if "seo" in txt_dist: di += 2
    if "long-tail" in txt_dist or "long tail" in txt_dist: di += 1
    if "programmatic" in txt_dist: di += 1
    if any(k in txt_dist for k in ["saturated", "head query", "taken", "regex101"]): di -= 2.5
    if any(k in txt_dist for k in ["telegram", "reddit", "facebook", "github", "directories"]): di += 1
    if "viral" in txt_dist or "watermark" in txt_dist or ("output" in txt_dist and "share" in txt_dist): di += 1

    # competition (high = low rivalry)
    c = 5.0
    if any(k in txt_exist for k in ["saturated", "category king", "dominant", "the standard", "de-facto", "moat"]): c -= 3.5
    if ("free" in txt_exist or "open-source" in txt_exist or "oss" in txt_exist) and "no dominant" not in txt_exist: c -= 1.5
    if any(k in txt_exist for k in ["no dominant", "no free incumbent", "no standard", "fragmented", "no dedicated", "none single"]): c += 3
    if (r.get("existing") or "").strip().lower().startswith("none"): c += 2.5

    # infra-econ
    if "client-side" in all_txt or "wasm" in all_txt: ie = 9.5
    elif "tunnel" in all_txt or "bandwidth cost" in all_txt: ie = 3.0
    elif "storage" in all_txt or "history caps" in all_txt: ie = 6.5
    elif "needs-ai" in txt_auto or "ai" in txt_auto: ie = 6.0
    else: ie = 7.5

    # ecosystem
    e = 4.5
    if any(k in all_txt for k in ["pairs", "bundle", "ecosystem", "glue", "feeds", "cluster", "workspace"]): e += 2.5
    if any(k in txt_notes for k in ["wedge", "glue", "ecosystem", "umbrella"]): e += 1.0

    # defensibility
    de = 4.0
    if any(k in all_txt for k in ["client-side", "privacy", "never leaves", "trust wedge", "files never"]): de += 2
    if any(k in all_txt for k in ["early", "new market", "standards still settling", "explosive upside"]): de += 1.5
    if any(k in txt_exist for k in ["category king", "dominant", "free for a decade"]): de -= 1.5
    if any(k in all_txt for k in ["bangla", "bangladesh", " bd ", "corridor"]): de += 1.5

    return {k: CLAMP(v) for k, v in
            dict(demand=d, pain=p, frequency=f, automation=a, monetization=m,
                 distribution=di, competition=c, infra_econ=ie, ecosystem=e,
                 defensibility=de).items()}

# ---------------- curated overrides (research-informed) ----------------
# NOTE: DR-* mapping verified against base_rows.json titles:
#   F-cluster = bank/finance docs; D1 = FBI converter fear; D2 = tool-stitching meta-pain;
#   C1 = PDF->Excel scrambles; C2 = scanned OCR; C3 = Acrobat subscription outrage; H1 = manual entry
OVERRIDES = {
    # BANK/FINANCE cluster (flagship LTV): $40-300/mo price umbrella, sev-9 desperation
    "DR-F1": {"demand": 8.5, "pain": 9.5, "monetization": 9, "competition": 6, "infra_econ": 6.5, "ecosystem": 8, "defensibility": 6},
    "DR-F2": {"demand": 7, "pain": 8.5, "monetization": 8, "distribution": 7.5, "ecosystem": 8},
    "DR-F4": {"demand": 8, "pain": 8.5, "monetization": 8.5, "competition": 7, "ecosystem": 8},
    "DR-F3": {"demand": 6.5, "pain": 8, "monetization": 8, "competition": 7.5, "infra_econ": 5.5},
    "DR-H1": {"demand": 8, "pain": 8, "monetization": 7.5, "competition": 6.5, "ecosystem": 7},
    # tool-stitching meta-pain = THE one-product toolbox thesis evidence
    "DR-D2": {"demand": 9, "pain": 8, "monetization": 5, "distribution": 8, "ecosystem": 10, "defensibility": 5},
    # FBI/Malwarebytes converter fear = platform-wide client-side trust wedge
    "DR-D1": {"demand": 8, "pain": 7, "monetization": 6, "defensibility": 8, "ecosystem": 9, "distribution": 8},
    # Acrobat subscription-only outrage = pay-per-use vs subscription thesis evidence
    "DR-C3": {"demand": 9, "pain": 7, "monetization": 6, "distribution": 9, "ecosystem": 9, "competition": 4.5},
    # PDF family
    "DR-C1": {"demand": 9, "pain": 8.5, "monetization": 7, "distribution": 8.5},
    "DR-C2": {"demand": 8.5, "pain": 8, "monetization": 6.5, "competition": 6, "infra_econ": 5},
    "DR-C4": {"demand": 7, "pain": 7.5, "monetization": 6.5, "competition": 5.5},
    # CSV/Excel family
    "DR-A3": {"demand": 8, "pain": 7.5, "distribution": 9},
    "DR-A4": {"demand": 7.5, "pain": 7.5},
    "DR-B3": {"demand": 8, "pain": 8, "monetization": 6, "ecosystem": 7},
    "DR-G1": {"demand": 7, "pain": 7.5, "monetization": 6.5},
    "DR-G2": {"demand": 8, "pain": 7.5},
    "DR-G3": {"demand": 8, "pain": 6.5, "frequency": 8},
    "DR-S3": {"demand": 6, "pain": 7.5},
    "DR-S4": {"demand": 4.5, "pain": 7, "monetization": 6.5},
    "DR-F5": {"demand": 6, "pain": 7.5, "monetization": 6.5},
    # hallucinated citation verifier (weird gold #1, sev 9, no free incumbent)
    "WG-G4": {"demand": 8, "pain": 9.5, "frequency": 6, "monetization": 7.5, "competition": 9, "infra_econ": 6, "ecosystem": 7, "defensibility": 7},
    # AI-detector false-positive provenance trail (weird gold #3)
    "WG-G5": {"demand": 8.5, "pain": 9.5, "competition": 8.5, "monetization": 6.5, "ecosystem": 7, "distribution": 6.5},
    # irregular-payment rent ledger + court-ready PDF (weird gold #2)
    "WG-G9": {"demand": 7, "pain": 8.5, "monetization": 7.5, "competition": 8.5, "ecosystem": 6},
    # BCS Telegram quiz bot
    "WG-G17": {"demand": 8.5, "pain": 6, "frequency": 8, "monetization": 6, "competition": 6, "distribution": 8, "ecosystem": 8},
    # Bangla typing / Bijoy (zero-competition language moat)
    "WG-G18": {"demand": 6, "pain": 5, "competition": 9, "defensibility": 7, "ecosystem": 6},
    # WhatsApp order chaos
    "EC-C29": {"demand": 7.5, "pain": 8.5, "monetization": 7, "competition": 8.5, "ecosystem": 8, "defensibility": 4},
    # subset-sum invoice matcher
    "EC-C21": {"demand": 6.5, "pain": 9, "monetization": 8, "competition": 9, "ecosystem": 8, "defensibility": 6},
    # Stripe/processor reconciliation
    "EC-C22": {"demand": 6.5, "pain": 8, "monetization": 7.5, "competition": 7},
    # supplier CSV -> Shopify hell
    "EC-C1": {"demand": 7.5, "pain": 8.5, "monetization": 7.5, "distribution": 8.5},
    "EC-C2": {"demand": 6.5, "pain": 7.5, "monetization": 6},
    "EC-C3": {"demand": 7.5, "pain": 8, "monetization": 6.5},
    "EC-C4": {"demand": 6.5, "pain": 7.5, "monetization": 6.5},
    "EC-C5": {"demand": 6.5, "pain": 7.5, "monetization": 6.5, "competition": 6},
    "EC-C6": {"demand": 6, "pain": 7.5, "monetization": 6.5, "competition": 7},
    # Amazon flat file hell + 8541
    "EC-C8": {"demand": 6.5, "pain": 8, "monetization": 6, "competition": 6},
    "EC-C9": {"demand": 7, "pain": 8.5, "monetization": 7.5, "competition": 6.5},
    "EC-C10": {"demand": 6, "pain": 7.5, "monetization": 6.5, "competition": 6.5},
    # Etsy->Shopify variant pricing loss (actual row = C11)
    "EC-C11": {"demand": 5, "pain": 8, "monetization": 6, "competition": 7.5},
    "EC-C12": {"demand": 5.5, "pain": 7.5, "monetization": 5.5},
    "EC-C13": {"demand": 5, "pain": 7.5, "monetization": 5.5},
    "EC-C14": {"demand": 5.5, "pain": 7, "monetization": 5.5},
    # GMC mass disapprovals
    "EC-C15": {"demand": 6.5, "pain": 8, "monetization": 7, "competition": 6.5},
    "EC-C16": {"demand": 6, "pain": 7, "monetization": 6},
    # feed-tool price umbrella
    "EC-C17": {"demand": 6.5, "pain": 7, "monetization": 7, "competition": 6},
    "EC-C18": {"demand": 7.5, "pain": 7, "monetization": 6, "competition": 5},
    "EC-C19": {"demand": 6, "pain": 7, "monetization": 6},
    "EC-C20": {"demand": 6, "pain": 7, "monetization": 6.5, "competition": 6.5},
    "EC-C23": {"demand": 7, "pain": 7, "monetization": 6},
    "EC-C24": {"demand": 7, "pain": 7.5, "monetization": 7},
    "EC-C25": {"demand": 5.5, "pain": 7, "monetization": 7, "competition": 7},
    "EC-C27": {"demand": 7, "pain": 7.5, "monetization": 6, "competition": 5.5},
    # BD micro-sellers (E3-labeled but strategically key)
    "EC-C28": {"demand": 8, "pain": 7, "competition": 8.5, "defensibility": 6},
    "EC-C30": {"demand": 5.5, "pain": 7, "monetization": 7, "competition": 6.5},
    "EC-C31": {"demand": 7, "pain": 6.5, "monetization": 6.5, "ecosystem": 9},
    # multichannel overselling
    "EC-C7": {"demand": 6.5, "pain": 8, "monetization": 7, "competition": 5.5},
    # Postman migration window (timed)
    "DV-B6": {"demand": 8, "pain": 8, "distribution": 9, "monetization": 6, "competition": 6, "ecosystem": 8},
    # large JSON WASM viewer
    "DV-B1": {"demand": 7.5, "pain": 7, "monetization": 6.5, "competition": 6, "distribution": 8, "infra_econ": 10},
    # SQL dialect conversion (rev-max)
    "DV-B10": {"demand": 6.5, "pain": 8, "monetization": 8, "competition": 6.5, "distribution": 8, "infra_econ": 9},
    # API error explainer (AI-gateway native, pSEO)
    "DV-B4": {"demand": 8, "pain": 7, "distribution": 8.5, "competition": 8, "ecosystem": 8, "infra_econ": 6},
    # MCP tooling gap (early explosive)
    "DV-B12": {"demand": 5, "pain": 6, "competition": 9, "defensibility": 7, "ecosystem": 8, "distribution": 6},
    # CORS (huge traffic pool, weak direct $)
    "DV-B3": {"demand": 9, "pain": 8, "frequency": 9, "distribution": 9, "monetization": 4.5, "competition": 5, "ecosystem": 8},
    # webhook testing workspace
    "DV-B7": {"demand": 6.5, "pain": 6, "monetization": 6.5, "competition": 5.5, "infra_econ": 6, "ecosystem": 8},
    # tunnels: bandwidth cost - hard downgrade
    "DV-B8": {"demand": 5, "pain": 5, "monetization": 3, "infra_econ": 3, "competition": 5},
    # regex head-on: moat
    "DV-B9": {"demand": 7, "pain": 6, "competition": 2, "monetization": 3, "distribution": 4},
    # JWT saturated
    "DV-B13": {"demand": 6, "pain": 4, "competition": 2, "monetization": 2},
    # cron saturated
    "DV-B11": {"demand": 6.5, "pain": 4, "competition": 2.5, "monetization": 3},
    # Quizlet paywall betrayal
    "WG-G1": {"demand": 8.5, "pain": 7, "frequency": 7.5, "competition": 6, "ecosystem": 7},
    # spreadsheet meta-pattern
    "WG-G20": {"demand": 8, "pain": 5, "monetization": 6.5, "competition": 6, "ecosystem": 9, "distribution": 8},
}

def assign_role(dims, role_hint=None, is_gen=False):
    if role_hint:
        return role_hint
    m, di, e, comp = dims["monetization"], dims["distribution"], dims["ecosystem"], dims["competition"]
    if m >= 7 and comp >= 6: return "LTV"
    if m >= 6.5: return "PRO"
    if di >= 8 and dims["demand"] >= 7.5: return "HOOK"
    if e >= 7: return "GLUE"
    return "GLUE"

def tier_for(role, dims, auto_class):
    if role == "HOOK": return "FREE"
    if auto_class == "ai" and dims["infra_econ"] <= 6: return "MAX" if dims["monetization"] >= 7 else "PRO"
    if auto_class == "server" and dims["infra_econ"] <= 6: return "MAX"
    if role == "LTV": return "PRO"
    if role == "PRO": return "PRO"
    return "FREE"

def effort_for(auto_class, dims, override=None):
    if override: return override
    base = {"client": 12, "server": 35, "hybrid": 22, "ai": 40}[auto_class]
    if dims["automation"] >= 9: base *= 0.8
    if dims["automation"] <= 6: base *= 1.3
    return int(round(base / 2) * 2)

MAINT = {"client": 10, "server": 30, "hybrid": 25, "ai": 45}

# canonical coarse zones so research + generated rows share one taxonomy
ZONE_CANON = {
    "DevTools & Data": "DevTools & Data", "Data & Repair": "Data & Repair",
    "Subtitles & Text Media": "Data & Repair", "Finance Docs": "Data & Repair",
    "E-commerce": "E-commerce & SMB", "E-commerce / BD Local": "E-commerce & SMB",
    "API & Webhooks": "DevTools & Data", "Database": "DevTools & Data",
    "Config & DevOps": "DevTools & Data", "Webmaster / Text": "Web & Text Utilities",
    "Encoding & Security": "Web & Text Utilities", "Media": "Media & Image",
    "Education": "Education & Weird Gold", "Weird Gold": "Education & Weird Gold",
    "BD / Telegram": "BD & Telegram", "Data & File Repair": "Data & Repair",
    "E-commerce & SMB Ops": "E-commerce & SMB", "Developer Tools": "DevTools & Data",
    "Weird Gold / Education": "Education & Weird Gold",
}

def classify_auto_base(r):
    t = (r.get("automation") or "").lower()
    if "needs-ai" in t: return "ai"
    if "ai" in t and "deterministic" not in t: return "ai"
    if "client-side" in t or "wasm" in t: return "client"
    if "deterministic" in t: return "client"
    return "server"

def ai_required_base(r):
    t = (r.get("automation") or "").lower()
    return ("needs-ai" in t) or (" ai" in t and "optional" not in t and "deterministic" not in t)

def pricing_note(r):
    blob = " ".join([r.get("existing") or "", r.get("evidence") or "", r.get("complaints") or ""])
    hits = re.findall(r'[^\s]*\$\d[\d,.]*[^\s]*', blob)
    return "; ".join(hits[:6]) if hits else None

def main():
    base_rows = json.load(open(BASE, encoding="utf-8"))
    recs = []

    for r in base_rows:
        if r["id"] == "DV-B16":
            continue  # meta row (launch-playbook evidence), not an opportunity
        dims = score_base(r)
        ovr = OVERRIDES.get(r["id"], {})
        for k, v in ovr.items():
            dims[k] = CLAMP(v)
        # row DR-B2 (large files crash editors) — big office+dev population pain
        if r["id"] == "DR-B2":
            dims["demand"] = CLAMP(9); dims["pain"] = CLAMP(8.5); dims["distribution"] = CLAMP(9)
        if r["id"] == "DR-A2":
            dims["demand"] = CLAMP(9); dims["pain"] = CLAMP(8); dims["distribution"] = CLAMP(9)
        auto_class = classify_auto_base(r)
        ai = ai_required_base(r)
        comp = sum(W[k] * dims[k] for k in W)
        role = assign_role(dims)
        tier = tier_for(role, dims, auto_class)
        recs.append({
            "id": r["id"], "title": r["title"], "problem": r.get("problem"),
            "audience": r.get("audience"),
            "cluster": r["cluster"],
            "zone": ZONE_CANON[r["cluster"]],
            "evidence_level": r.get("evidence_level"), "ev_norm": r.get("ev_norm"),
            "evidence_summary": (r.get("evidence") or "")[:600] or None,
            "sources": r.get("sources") or [],
            "frequency_raw": r.get("frequency"),
            "severity": r.get("severity"),
            "workaround": r.get("workaround"),
            "existing_tools": r.get("existing"),
            "existing_pricing_note": pricing_note(r),
            "complaints": r.get("complaints"),
            "automation_class": auto_class,
            "automation_note": r.get("automation"),
            "ai_required": ai,
            "client_side": auto_class == "client",
            "distribution_raw": r.get("distribution"),
            "seo_query": None,
            "build_effort_h": effort_for(auto_class, dims),
            "maintenance_min_wk": MAINT[auto_class],
            "dims": dims,
            "composite": round(comp, 2),
            "platform_role": role,
            "tier_fit": tier,
            "origin": "research",
            "notes": r.get("notes"),
        })

    # generated long-tail rows
    for t in GEN_ROWS:
        (fam, title, seo, parent, audience, freq, sev, auto_class, ai, effort,
         role, tier, d, p, f_, a, m, di, c, ie, e, de) = t
        cluster, zone = FAM_META[fam]
        dims = dict(demand=d, pain=p, frequency=f_, automation=a, monetization=m,
                    distribution=di, competition=c, infra_econ=ie, ecosystem=e, defensibility=de)
        dims = {k: CLAMP(v) for k, v in dims.items()}
        comp = sum(W[k] * dims[k] for k in W)
        recs.append({
            "id": f"GT-{fam}-{seo.split()[0].lower()}-{parent}",
            "title": title, "problem": f"Long-tail tool instance: {title}. Pattern-inherited pain evidence from {parent} cluster; ships as part of the mega-toolbox catalog (<=1 use/month tools included by directive).",
            "audience": audience, "cluster": cluster, "zone": ZONE_CANON[zone],
            "evidence_level": "E3 (pattern-inherited)", "ev_norm": "E3",
            "evidence_summary": f"Inherits demand pattern from research row {parent} (see {parent} for E1/E2 evidence).",
            "sources": [], "frequency_raw": freq, "severity": sev,
            "workaround": None, "existing_tools": None, "existing_pricing_note": None,
            "complaints": None,
            "automation_class": auto_class,
            "automation_note": {"client": "100% deterministic client-side", "server": "Deterministic server-lite (metered)",
                                 "hybrid": "Deterministic core + small-model assist (cached)", "ai": "AI-required via multi-provider gateway"}[auto_class],
            "ai_required": bool(ai), "client_side": auto_class == "client",
            "distribution_raw": None, "seo_query": seo,
            "build_effort_h": effort, "maintenance_min_wk": MAINT[auto_class],
            "dims": dims, "composite": round(comp, 2),
            "platform_role": role, "tier_fit": tier,
            "origin": "generated-longtail", "notes": f"parent={parent}; fam={fam}",
        })

    # dedupe ids
    seen = set()
    dedup = []
    for r in recs:
        if r["id"] in seen:
            r["id"] = r["id"] + "-2"
        seen.add(r["id"])
        dedup.append(r)
    recs = dedup
    recs.sort(key=lambda x: -x["composite"])

    json.dump(recs, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # ------- report -------
    from collections import Counter
    print(f"TOTAL: {len(recs)} rows  ->  {OUT}")
    print("Origin:", dict(Counter(r["origin"] for r in recs)))
    print("Evidence:", dict(Counter(r["ev_norm"] for r in recs)))
    print("Role:", dict(Counter(r["platform_role"] for r in recs)))
    print("Tier:", dict(Counter(r["tier_fit"] for r in recs)))
    print("\n=== TOP 40 BY COMPOSITE ===")
    for r in recs[:40]:
        d = r["dims"]
        print(f"{r['composite']:5.2f}  {r['id']:<22} {r['platform_role']:<5} {r['tier_fit']:<5} "
              f"D{d['demand']:.0f} P{d['pain']:.0f} F{d['frequency']:.0f} A{d['automation']:.0f} "
              f"M{d['monetization']:.0f} Di{d['distribution']:.0f} C{d['competition']:.0f} "
              f"I{d['infra_econ']:.0f} E{d['ecosystem']:.0f} Df{d['defensibility']:.0f}  "
              f"{r['title'][:60]}")
    print("\n=== CLUSTER AVERAGES ===")
    byc = {}
    for r in recs:
        byc.setdefault(r["cluster"], []).append(r["composite"])
    for k, v in sorted(byc.items(), key=lambda x: -sum(x[1]) / len(x[1])):
        print(f"  {k:<28} n={len(v):<3} avg={sum(v)/len(v):.2f} max={max(v):.2f}")

if __name__ == "__main__":
    main()
