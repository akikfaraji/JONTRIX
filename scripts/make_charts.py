#!/usr/bin/env python3
"""FRAZIYM data charts (matplotlib) — English labels, 200 DPI, constrained_layout."""
import json, os
import matplotlib
import matplotlib.font_manager as fm
for f in ['/usr/share/fonts/truetype/chinese/NotoSansSC-Regular.ttf',
          '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
    if os.path.exists(f):
        fm.fontManager.addfont(f)
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams.update({
    'font.sans-serif': ['DejaVu Sans', 'Noto Sans SC'],
    'axes.unicode_minus': False,
    'figure.facecolor': '#FFFFFF', 'axes.facecolor': '#FFFFFF',
    'axes.edgecolor': '#E5E7EB', 'axes.linewidth': 0.8,
    'axes.spines.top': False, 'axes.spines.right': False,
    'axes.grid': False,
    'xtick.major.size': 0, 'ytick.major.size': 0,
    'xtick.labelsize': 9, 'ytick.labelsize': 9,
    'axes.labelsize': 10, 'axes.titlesize': 15, 'axes.titleweight': 'bold',
    'axes.titlepad': 16,
    'legend.frameon': False, 'legend.fontsize': 9,
    'figure.dpi': 200, 'savefig.dpi': 200, 'savefig.facecolor': '#FFFFFF',
})

C_BLUE = '#3B82F6'
G900, G700, G500, G400, G300, G200, G50 = '#111827', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F9FAFB'
POS, NEG, AMB = '#22C55E', '#EF4444', '#F59E0B'
OUT = "/home/z/my-project/download/charts"
os.makedirs(OUT, exist_ok=True)

ROWS = json.load(open("/home/z/my-project/research/opportunities.json", encoding="utf-8"))

def save(fig, path):
    fig.savefig(path, dpi=200, facecolor='white')
    plt.close(fig)
    print(f"OK {path} ({os.path.getsize(path)/1024:.0f}KB)")

def clean_axis(ax, grid=True):
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    if grid:
        ax.yaxis.grid(True, alpha=0.08, color=G300)
        ax.set_axisbelow(True)

# ---------------------------------------------------------------- 1 Top 20 ranking
top = ROWS[:20]
labels, values = [], []
for r in top:
    t = r['title'] if len(r['title']) <= 58 else r['title'][:55] + '...'
    labels.append(f"{r['id']}  {t}")
    values.append(r['composite'])
pairs = sorted(zip(labels, values), key=lambda x: x[1])
labels_s, values_s = zip(*pairs)
from matplotlib.colors import to_rgba
fig, ax = plt.subplots(figsize=(11.5, 9), constrained_layout=True)
n = len(labels_s)
colors = [G200] * n
for i in range(n - 3, n):
    prog = (i - (n - 3)) / 2
    colors[i] = to_rgba(C_BLUE, 0.45 + 0.55 * prog)
bars = ax.barh(range(n), values_s, color=colors, height=0.62, zorder=3,
               edgecolor='white', linewidth=0.3)
for i, (bar, val) in enumerate(zip(bars, values_s)):
    is_top = i >= n - 3
    ax.text(bar.get_width() + max(values_s) * 0.012, bar.get_y() + bar.get_height() / 2,
            f'{val:.2f}', va='center', fontsize=9,
            color=G900 if is_top else G400, fontweight='bold' if is_top else 'normal')
ax.set_yticks(range(n))
ax.set_yticklabels(labels_s, fontsize=8.5)
ax.set_xlim(0, max(values_s) * 1.09)
ax.set_title('Top 20 opportunities by weighted score (0-10 scale)', loc='left')
ax.spines['bottom'].set_visible(False)
ax.xaxis.set_visible(False)
save(fig, f"{OUT}/top20_ranking.png")

# ---------------------------------------------------------------- 2 Zone stats
zones = {}
for r in ROWS:
    zones.setdefault(r['zone'], []).append(r)
stats = [(z, sum(x['composite'] for x in recs) / len(recs), len(recs))
         for z, recs in zones.items()]
stats.sort(key=lambda x: x[1])
labels = [f"{z}  (n={n})" for z, _, n in stats]
vals = [v for _, v, _ in stats]
fig, ax = plt.subplots(figsize=(10, 5.4), constrained_layout=True)
colors = [to_rgba(C_BLUE, 0.35 + 0.65 * (v - min(vals)) / (max(vals) - min(vals))) for v in vals]
bars = ax.barh(range(len(vals)), vals, color=colors, height=0.58, zorder=3,
               edgecolor='white', linewidth=0.3)
for bar, val in zip(bars, vals):
    ax.text(bar.get_width() + max(vals) * 0.012, bar.get_y() + bar.get_height() / 2,
            f'{val:.2f}', va='center', fontsize=9.5, color=G700, fontweight='bold')
ax.set_yticks(range(len(vals)))
ax.set_yticklabels(labels, fontsize=9.5)
ax.set_xlim(0, max(vals) * 1.12)
ax.set_title('Average opportunity score by product zone (247 tools)', loc='left')
ax.spines['bottom'].set_visible(False)
ax.xaxis.set_visible(False)
save(fig, f"{OUT}/zone_stats.png")

# ---------------------------------------------------------------- 3 Revenue scenarios
scen = ['A\nFirst blood\n(~day 30)', 'B\n$1/day\n(~day 45)', 'C\n$3/day\n(~day 60)',
        'D\n$10/day\n(~day 90)', 'E\n$30/day\n(month 5-6)']
target = [0.17, 1.0, 3.0, 10.0, 30.0]
subs_only = [0.16, 0.82, 2.95, 8.70, 24.95]
ads_topup = [t - s for t, s in zip(target, subs_only)]
x = np.arange(len(scen))
w = 0.36
fig, ax = plt.subplots(figsize=(11, 5.8), constrained_layout=True)
b1 = ax.bar(x - w / 2, subs_only, width=w, color=C_BLUE, zorder=3,
            edgecolor='white', linewidth=0.4, label='Subscription MRR (net of fees)')
b2 = ax.bar(x - w / 2, ads_topup, width=w, bottom=subs_only, color='#93C5FD', zorder=3,
            edgecolor='white', linewidth=0.4, label='Ads + affiliate top-up')
b3 = ax.bar(x + w / 2, target, width=w, color=G300, zorder=3,
            edgecolor='white', linewidth=0.4, label='Scenario target')
for xi, v in zip(x, target):
    ax.text(xi + w / 2, v + 0.5, f'${v:g}', ha='center', va='bottom', fontsize=9, color=G500)
for xi, v in zip(x, subs_only):
    ax.text(xi - w / 2, v + 0.5, f'${v:g}', ha='center', va='bottom', fontsize=9,
            color=G900, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(scen, fontsize=9.5)
ax.set_ylabel('USD per day')
ax.set_ylim(0, 36)
ax.set_title('Revenue scenarios: subscriber math vs targets (infra cost = $0)', loc='left')
ax.legend(loc='upper left')
clean_axis(ax)
save(fig, f"{OUT}/revenue_scenarios.png")

# ---------------------------------------------------------------- 4 Pricing value anchors
tools = [
    ('MoneyThumb (bank statement converter)', 299.95),
    ('DocuClipper (bank statement converter)', 49.95),
    ('DataFeedWatch (product feeds)', 59.0),
    ('Dext (receipt OCR)', 20.50),
    ('Postman (API client, per user)', 14.0),
    ('FRAZIYM MAX (whole toolbox, 3 seats)', 19.99),
    ('FRAZIYM STUDIO (whole toolbox + AI)', 9.99),
    ('FRAZIYM PRO (whole toolbox)', 4.99),
    ('iLovePDF Premium (PDF-only)', 6.0),
    ('Matrixify (Shopify import)', 20.0),
]
tools.sort(key=lambda t: t[1])
labels = [t[0] for t in tools]
vals = [t[1] for t in tools]
fig, ax = plt.subplots(figsize=(11, 6), constrained_layout=True)
colors = [C_BLUE if l.startswith('FRAZIYM') else G300 for l in labels]
bars = ax.barh(range(len(vals)), vals, color=colors, height=0.6, zorder=3,
               edgecolor='white', linewidth=0.3)
for bar, val, lab in zip(bars, vals, labels):
    ax.text(bar.get_width() + max(vals) * 0.012, bar.get_y() + bar.get_height() / 2,
            f'${val:g}/mo', va='center', fontsize=9,
            color=G900 if lab.startswith('FRAZIYM') else G500,
            fontweight='bold' if lab.startswith('FRAZIYM') else 'normal')
ax.set_yticks(range(len(vals)))
ax.set_yticklabels(labels, fontsize=9)
ax.set_xlim(0, max(vals) * 1.14)
ax.set_title('Anti-underpricing: one plan replaces a niche subscription', loc='left')
ax.spines['bottom'].set_visible(False)
ax.xaxis.set_visible(False)
save(fig, f"{OUT}/pricing_value.png")

print("done")
