#!/usr/bin/env python3
"""Parse the 4 problem-row research files into research/base_rows.json.
Handles two formats:
  A) Block format: "ID: X\nField: value..."  (data-repair, ecom-smb, devtools)
  B) Bold-heading format: "**G1. Title**" + "- Field: value" bullets (distribution-weird)
Output: one JSON array of 104 rows with normalized fields + stream prefix.
"""
import json, re, os

RESEARCH = "/home/z/my-project/research"
OUT = os.path.join(RESEARCH, "base_rows.json")

FIELDS = ["Problem", "Audience", "Evidence", "EvidenceLevel", "Sources", "Frequency",
          "Severity", "Workaround", "Existing", "Complaints", "Automation",
          "Distribution", "Notes", "Title"]

def split_urls(s):
    if not s:
        return []
    urls = re.findall(r'https?://[^\s\)\];,]+', s)
    # dedupe preserving order
    seen, out = set(), []
    for u in urls:
        u = u.rstrip('.,;')
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out

def sev_num(s):
    if not s:
        return None
    m = re.match(r'\s*(\d+(?:\.\d+)?)', str(s))
    if m:
        return float(m.group(1))
    m2 = re.search(r'Severity:\s*(\d+(?:\.\d+)?)', str(s))
    return float(m2.group(1)) if m2 else None

FIELD_ALIAS = {
    "existing+price": "Existing",
    "evidence (meta)": "Evidence",
    "distribution fit": "Distribution",
    "existing tools+price": "Existing",
}

def norm_field(name):
    n = name.strip().lower()
    return FIELD_ALIAS.get(n, name.strip())

def ev_norm(level):
    if not level:
        return "E3"
    s = str(level)
    if "E1" in s:
        return "E1"
    if "E2" in s:
        return "E2"
    return "E3"

def split_combined_ev(rec):
    """Handle 'EvidenceLevel: E1 | Frequency: ... | Severity: ...' combined lines."""
    ev = rec.get("EvidenceLevel") or ""
    if "|" not in ev:
        return
    parts = [p.strip() for p in ev.split("|") if p.strip()]
    first = parts[0] if parts else ""
    if ":" not in first:
        rec["EvidenceLevel"] = first
    else:
        m = re.match(r'EvidenceLevel\s*:\s*(.+)', first)
        rec["EvidenceLevel"] = m.group(1).strip() if m else None
    for p in parts:
        fm = re.match(r'(Frequency|Severity)\s*:\s*(.+)', p)
        if fm:
            key = fm.group(1)
            if not rec.get(key):
                rec[key] = fm.group(2).strip()
    # severity might be embedded like 'Severity: 9 (academic misconduct risk)'
    if rec.get("Severity") and not sev_num(rec.get("Severity")):
        pass

def parse_block_format(path, prefix, cluster_name):
    """data-repair / ecom-smb / devtools block format."""
    rows = []
    with open(path, encoding='utf-8') as f:
        text = f.read()
    # Cut off at FACTS or CLUSTER or PATTERN sections
    for stop in ["## FACTS", "## CLUSTER", "## PATTERN", "## METHOD"]:
        idx = text.find(stop)
        if idx != -1:
            text = text[:idx]
    blocks = re.split(r'\n(?=ID: )', text)
    for b in blocks:
        m = re.match(r'ID:\s*(\S+)', b)
        if not m:
            continue
        raw_id = m.group(1)
        rec = {k: None for k in FIELDS}
        rec["raw_id"] = raw_id
        # fields start at line beginnings "Field: value" (value may span lines until next field)
        lines = b.split('\n')
        cur = None
        buf = []
        for ln in lines[1:]:
            fm = re.match(r'^([A-Za-z][A-Za-z0-9 \-]+):\s?(.*)$', ln)
            known = fm and norm_field(fm.group(1)) in FIELDS
            if known:
                if cur:
                    rec[cur] = ' '.join(x.strip() for x in buf if x.strip())
                cur = norm_field(fm.group(1))
                buf = [fm.group(2)]
            elif cur is not None:
                buf.append(ln)
        if cur:
            rec[cur] = ' '.join(x.strip() for x in buf if x.strip())
        title = (rec.get("Problem") or "").split('. ')[0].split('. ')[0]
        if len(title) > 110:
            title = title[:107] + "..."
        rows.append({
            "id": f"{prefix}-{raw_id}",
            "title": title,
            "problem": rec.get("Problem"),
            "audience": rec.get("Audience"),
            "evidence": rec.get("Evidence"),
            "evidence_level": rec.get("EvidenceLevel"),
            "ev_norm": ev_norm(rec.get("EvidenceLevel")),
            "sources": split_urls(rec.get("Sources") or rec.get("Evidence") or ""),
            "frequency": rec.get("Frequency"),
            "severity": sev_num(rec.get("Severity")),
            "severity_note": rec.get("Severity"),
            "workaround": rec.get("Workaround"),
            "existing": rec.get("Existing"),
            "complaints": rec.get("Complaints"),
            "automation": rec.get("Automation"),
            "distribution": rec.get("Distribution"),
            "notes": rec.get("Notes"),
            "cluster": cluster_name,
            "origin": "research",
        })
    return rows

def parse_bold_format(path, prefix, cluster_name):
    """distribution-weird **G1. Title** bullet format."""
    rows = []
    with open(path, encoding='utf-8') as f:
        text = f.read()
    idx = text.find("## STREAM A")
    if idx != -1:
        text = text[:idx] + text[text.find("## STREAM B"):] if text.find("## STREAM B") != -1 else text[:idx]
        # keep only stream B
        bidx = text.find("## STREAM B")
        text = text[bidx:] if bidx != -1 else text
    # end at any trailing synthesis section
    for stop in ["## CROSS-CUTTING", "## SYNTHESIS", "## NOTES"]:
        i2 = text.find(stop)
        if i2 != -1:
            text = text[:i2]
    blocks = re.split(r'\n(?=\*\*G\d+\.)', text)
    for b in blocks:
        m = re.match(r'\*\*(G\d+)\.\s*(.+?)\*\*', b)
        if not m:
            continue
        raw_id, title = m.group(1), m.group(2).strip()
        rec = {k: None for k in FIELDS}
        lines = b.split('\n')
        cur = None
        buf = []
        for ln in lines[1:]:
            fm = re.match(r'^-\s*([A-Za-z][A-Za-z0-9 \-/()+]+?):\s?(.*)$', ln)
            known = fm and norm_field(fm.group(1)) in FIELDS
            if known:
                if cur:
                    rec[cur] = ' '.join(x.strip() for x in buf if x.strip())
                cur = norm_field(fm.group(1))
                buf = [fm.group(2)]
            elif cur is not None and ln.startswith('- '):
                buf.append(ln[2:])
            elif cur is not None:
                buf.append(ln)
        if cur:
            rec[cur] = ' '.join(x.strip() for x in buf if x.strip())
        split_combined_ev(rec)
        # single-line hypothesis rows (G22-G25): '**G2x. Title** — trailing text'
        if not any(rec.get(k) for k in ["Evidence", "Audience", "Problem"]):
            tail = ""
            m2 = re.search(r'\*\*G\d+\.[^*]+\*\*[ ]?—(.*)', b, re.S)
            if m2:
                tail = m2.group(1).strip().replace('\n', ' ')
            if tail:
                rec["Problem"] = tail.split('; validate')[0].strip()
                rec["Notes"] = (rec.get("Notes") or "") + " | " + tail
            rec["EvidenceLevel"] = "E3"  # declared by section: 'Explicit E3 hypotheses'
        rows.append({
            "id": f"{prefix}-{raw_id}",
            "title": title,
            "problem": rec.get("Problem") or rec.get("Evidence"),
            "audience": rec.get("Audience"),
            "evidence": rec.get("Evidence"),
            "evidence_level": rec.get("EvidenceLevel"),
            "ev_norm": ev_norm(rec.get("EvidenceLevel")),
            "sources": split_urls(rec.get("Evidence") or ""),
            "frequency": rec.get("Frequency"),
            "severity": sev_num(rec.get("Severity")),
            "severity_note": rec.get("Severity"),
            "workaround": rec.get("Workaround"),
            "existing": rec.get("Existing"),
            "complaints": rec.get("Complaints"),
            "automation": rec.get("Automation"),
            "distribution": rec.get("Distribution"),
            "notes": rec.get("Notes"),
            "cluster": cluster_name,
            "origin": "research",
        })
    return rows

def main():
    all_rows = []
    all_rows += parse_block_format(f"{RESEARCH}/data-repair.md", "DR", "Data & File Repair")
    all_rows += parse_block_format(f"{RESEARCH}/ecom-smb.md", "EC", "E-commerce & SMB Ops")
    all_rows += parse_block_format(f"{RESEARCH}/devtools.md", "DV", "Developer Tools")
    all_rows += parse_bold_format(f"{RESEARCH}/distribution-weird.md", "WG", "Weird Gold / Education")
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(all_rows, f, ensure_ascii=False, indent=1)
    # report
    from collections import Counter
    c = Counter(r["cluster"] for r in all_rows)
    e = Counter(r["evidence_level"] for r in all_rows)
    print(f"TOTAL ROWS: {len(all_rows)}")
    for k, v in c.items():
        print(f"  {k}: {v}")
    print("Evidence:", dict(e))
    missing = [r["id"] for r in all_rows if not r["problem"]]
    print("Rows missing problem text:", missing)
    missing_ev = [r["id"] for r in all_rows if not r["evidence_level"]]
    print("Rows missing evidence level:", missing_ev)

if __name__ == "__main__":
    main()
