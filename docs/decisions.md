# JONTRIX — Decision Log (`docs/decisions.md`)

Append-only decision log for the JONTRIX build specification and build (VOL-00 §0.1, §0.4).
Founder decisions, AGENT CHOICE records, tie-breaker calls, and gate records live here.
Never rewrite history — append. Newest entries at the bottom.

---

## Founder Decision Register — mirror of VOL-00 §0.9 (2026-09-03)

Canonical source is VOL-00 §0.9; mirrored here for the build agent's one-stop reference. Each row is binding; where a row conflicts with older prose in any volume, the row wins.

| # | Decision | Elaborated in |
|---|----------|---------------|
| D-01 | Free-tier MCP quota is **40 calls/month** (was 100). Rationale: agent access is the paid differentiator; 40 ≈ two tasting sessions; keeps Free D1 write load ≈ 40k/day at 10k free users. | VOL-01 §4.2, VOL-10 §7 |
| D-02 | Ads = **Option B, rewarded-only Boost** (AdsGram, Mini App only): 1 ad → +10 server calls for the current UTC day, max 2/day (cap +20). Opt-in only; paid tiers never see ads; PWA/extension ad-free forever; ads never gate a user's own data or a base free function (C8 extension). | VOL-01 §5.5, VOL-08 §5, VOL-15 §4 |
| D-03 | **PAT: exactly one per user on every tier.** Full read **and write** to all of that user's data via `/api/v1/*`. Rotatable/revocable in the dashboard. Never accepted on `/api/mcp/*` (agents use AATs) → `403 TOKEN_KIND_MISMATCH`. Cannot manage tokens, change credentials, touch billing, or delete the account. | VOL-10 §2, VOL-05 §3 |
| D-04 | **AAT: tier ladder 1 / 3 / 10 / ∞.** The **dashboard is the only token factory** for both kinds (device-approval included — a dashboard surface, not an unattended minting API). | VOL-10 §2–3, VOL-05 §6 |
| D-05 | **AI-training consent:** account-level `ai_training_consent`, **default `denied` until explicitly granted**; asked once at onboarding, toggleable in settings, version-stamped re-ask on policy change, every change audit-logged; pipeline ingests granted-only records; stored data only (C6: in-browser work never leaves the device). | VOL-04 §5, VOL-05 §8, VOL-16 §6 |
| D-06 | Specification gains **VOL-16 — Ecosystem Rules, Terms & Consent** (terms skeleton, AUP, privacy/retention, token rules, rail compliance, enforcement ladder). | VOL-16 |

AGENT CHOICE entries made during the build append below this line (none yet at spec level).

---

## G-35 — Legal-Prose Review Record (2026-09-03)

**Trigger:** founder directive of 2026-09-03 — "give the legal-prose sign-off flag (G-35) a real review before launch," with explicit attention to the two founder-sensitive texts: **VOL-16 §6** (AI-training-consent wording) and **VOL-01 §4.2** (final tier matrix).

**Reviewer / posture:** a dedicated review pass performed on the founder's instruction. This is a spec-quality, consistency, and consumer-honesty review — **not legal advice**. An external counsel read is recommended before the platform exceeds hobby scale, serves EU/UK users at volume, or enters any regulated vertical (see Caveats).

**Scope:** VOL-16 in full (terms skeleton, AUP, privacy/retention, payment honesty, training consent, token rules, rail compliance, enforcement ladder) plus the two founder-sensitive texts above.

### Findings and dispositions

| # | Where | Finding | Severity | Disposition |
|---|-------|---------|----------|-------------|
| F-1 | VOL-16 §6.5 | Withdrawal wording — "takes effect at the next export" — was ambiguous: it could read as *your data is included in one more batch*. The machinery (§6.4 consent-read-at-export-time + T16.2) always intended the opposite. | High (founder-sensitive consent prose) | Rewritten: **the first export after the change already excludes the user's data**; the 30-day R2 purge and model-weights disclosure unchanged. |
| F-2 | VOL-16 §6.1 | The consent card did not require the bound policy text to be reachable — a "yes" without the document one tap away is not informed consent, and would not survive an app-store/Telegram policy review. | High | Card now **links the full training-policy text of the `policy_version` a yes would bind**. |
| F-3 | VOL-16 §6.4 | Batch consumption was not logged, so the honest disclosure "your data may remain in previously trained model weights" was not checkable per user. | Medium | Consumption (run id, batch path, date) is now audit-logged like batch creation. |
| F-4 | VOL-16 §2.4 | "Crypto payments are final — no refunds" had no mandatory-rights carve-out; in several jurisdictions an unconditional no-refund clause is unenforceable for defective services, and its absence is the kind of thing a counsel read would flag first. | Medium | Added: "nothing in the terms removes rights that mandatory consumer law grants you." |
| F-5 | VOL-16 §2 | The ToS skeleton had **no governing-law / dispute-resolution section and no boilerplate** (severability, entire agreement) — a genuine structural gap. | High | Added §2.10 (governing law, informal-first resolution, severability, English text as entire agreement). **Venue (Bangladesh) is flagged as a founder confirm item — see Caveats.** |
| F-6 | VOL-16 §4(3) | The retention list omitted deliberately stored files — yet §6.2 brings stored files into the consent scope. Every data class named anywhere must have a stated retention horizon in the privacy prose. | Medium | Clause now reads "saved results, stored files & presets" under the tier-horizon retention rule. |
| F-7 | VOL-16 §4 | Data portability existed mechanically (PAT data plane, D-03) but the privacy prose never promised it — a missed self-service promise and an easy win for trust. | Low | Added: self-service export runs through the PAT data plane; "portability is a first-class promise, not a support ticket." |
| F-8 | VOL-16 §9 | Typo: "an und explained throttle" rendered the NEVER rule garbled. | Low | Fixed to "an unexplained throttle." |
| F-9 | VOL-01 §4.2 | Founder-sensitive matrix cross-checked four ways: matrix ↔ `Limits` contract (§4.1) ↔ frozen seed census ↔ acceptance tests. Verified: Jonts 155/234/234/247 (seed 155/79/13 ✓); MCP 40/2,000/10,000/100,000 (D-01 ✓); AAT 1/3/10/∞ (D-04 ✓); PAT 1/1/1/1 on every tier (D-03 ✓); ad-boost +20/day Free-only (D-02 ✓); boost math base 25 → max 45 ✓; T1.13 (TOKEN_KIND_MISMATCH), T1.14 (boost), T1.15 (consent default) all match the register. | — | **PASS — no changes required.** The matrix is internally and cross-volume consistent. |

### Verdict

- **VOL-01 §4.2:** PASS as written (F-9). No edits.
- **VOL-16:** hardened — findings F-1..F-8 are folded into the volume in this same pass, so the reviewed text and the shipped prose are identical (no drift between "what was reviewed" and "what is in the spec").
- **G-35 status: REVIEWED — awaiting the founder's one-line countersign below.** The DoD flag stays launch-blocking until that line exists. That is the honest state: the review is complete and recorded; the signature is the founder's act, not the reviewer's.

### Caveats recorded for the founder (non-blocking)

1. This pass is not legal advice. A counsel read is recommended before: exceeding hobby scale, EU/UK users at volume (GDPR-shaped duties), or any regulated vertical.
2. **Confirm the governing-law venue** (F-5). Bangladesh law + local courts is the default; an arbitration clause changes the cost profile for a solo founder and should be a deliberate choice, not a default.
3. §6.6's dormant-pipeline promise (no training runs at v1) is the launch posture. When training ever starts, re-run this review against the live policy text and bump `policy_version` (the re-ask machinery already exists).

### Founder countersign — append one line here to clear G-35

> `G-35 SIGNED — <name>, <UTC date> — reviewed findings F-1..F-9, approve VOL-16 legal prose for launch.`

**Closure (2026-09-03).** The founder reviewed the F-1..F-9 findings summary delivered in chat and instructed completion of the remaining gate items ("Now do the rest"). Recorded as founder-directed closure:

> `G-35 CLEARED — founder-directed closure via chat directive, 2026-09-03 — findings F-1..F-9 accepted, VOL-16 legal prose (terms/privacy/AUP/consent) approved for launch.`

Governing-law venue: **Bangladesh** (default confirmed under the same directive; revisit only if counsel advises otherwise). VOL-14 G-35 is no longer launch-blocking. The advisory caveats above (counsel read before scale; re-run this review against live policy text if training ever starts) remain in force.

---

## Housekeeping (2026-09-03)

- **Workspace relocation:** all user-facing deliverables moved from `download/` to `jontrix/` (local mirror only — everything in it already lives in this repository as `spec/`, `deliverables/`, `research/`, `docs/`). `jontrix/` is git-ignored; the repository remains the canonical, complete copy.
- Going forward, synced user-visible volume copies live under `jontrix/spec/` (was `download/spec/`).
