# FRAZIYM $1/DAY ECOSYSTEM — PHASE 1 RESEARCH EXPORT
**Export date:** 2026-09-02 · **Status:** Interim (6 of 7 research streams complete; developer-tooling stream pending)
**Client constraints:** $0 budget · Android/Termux · no bank/card · bKash/Nagad/Rocket/crypto in · no client work · <10 min/week maintenance · $1/day within ~1 month target

**Evidence legend:** E1 = direct community post/issue (strongest) · E2 = verified product/pricing/docs fact · E3 = reasonable inference (must be validated before building)

**Streams in this export:**
1. Data & File Repair Pain (2-a) — 28 problems, 18 facts
2. Free AI Provider Free Tiers (2-d) — 15 providers verified 2026-09-02
3. Free Infrastructure (2-e) — full $0 stack verified
4. Distribution + Weird Markets (2-g) — 25 pain rows, 10 distribution facts
5. E-commerce + SMB Documents (2-c) — 31 problems, 14 facts
6. Bangladesh Payment Rails (2-f) — 12-rail ledger, fee chains
7. Developer Tooling (2-b) — 20 problems, 14 facts

---


# SECTION 1 — DATA & FILE REPAIR PAIN (Task 2-a)

# Research Task 2-a: File/Data/Document Repair & Conversion — Real User Pain

Agent: research-data-repair | Date: 2026 context | Client profile: solo dev, Bangladesh, free infra, passive revenue goal.

Method: web_search via z-ai CLI (Reddit-first queries + pricing/limits verification). Evidence levels: E1 = direct community post/issue found; E2 = product/pricing/docs page fact; E3 = reasonable inference from patterns.

---

## PROBLEM ROWS

### Cluster A — Broken / messy CSV

ID: A1
Problem: Excel silently truncates/mangles big CSVs and strips leading zeros + rewrites dates, so re-imports into other systems fail.
Audience: Office workers, data analysts, ecommerce sellers re-importing data.
Evidence: r/excel threads: "all leading zero's are removed" after save/reopen; "CSV auto converts date on load... The other system only accepts dates in DD/MM/YYYY"; "Help with a .csv file that has had zeroes stripped... Short of a backup or a reimport, there is no 'quick' fix" (r/excel 4rf9gt).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/excel/comments/1cbzdxc/ ; https://www.reddit.com/r/excel/comments/1ke7a0e/ ; https://www.reddit.com/r/excel/comments/4rf9gt/
Frequency: daily
Severity: 7 — data is silently corrupted; discovered only at import time; requires re-export cycles.
Workaround: rename CSV to .txt to force Excel import wizard, set column type to Text; Power Query with "Changed Type" step deleted; manual re-formatting.
Existing: Excel import wizard (built-in), Power Query (free), various "CSV fixer" sites (unknown quality).
Complaints: Workarounds are multi-step and users can't discover them; fix is per-import, not persistent.
Automation: deterministic (typed column inference + re-emit CSV). Fully automatable, no AI needed.
Distribution: SEO ("csv leading zeros"), r/excel, Google from ERP help forums.

ID: A2
Problem: CSVs open with all data in one column or split wrongly because the delimiter is comma vs semicolon (European locale) or SEP= line missing.
Audience: European Excel users, anyone exchanging CSVs cross-border.
Evidence: r/excel 1bp287r: "CSV File Entries not Getting Separated in Columns" — top fix is literally "add a new line at the top. SEP=; or SEP=," ; rowtidy.com blog (Nov 2025): "How do I fix CSV columns in wrong place? Use Import Wizard, select correct delimiter (comma, semicolon, tab)".
EvidenceLevel: E1
Sources: https://www.reddit.com/r/excel/comments/1bp287r/ ; https://rowtidy.com/blog/why-csv-file-not-displaying-correctly-in-excel
Frequency: daily
Severity: 6 — blocks the user entirely on first open, but fix is learnable; recurring for every new file.
Workaround: Excel From Text/CSV import, manually pick delimiter; prepend SEP=; hack.
Existing: Excel wizard, LibreOffice (free), many delimiter-converter web tools (unverified).
Complaints: Users don't know why it happens; every fresh file repeats the dance.
Automation: deterministic — delimiter sniffing (frequency analysis of , ; \t |) + re-emit with chosen delimiter.
Distribution: SEO massive ("csv opens in one column"), r/excel.

ID: A3
Problem: CSV files with wrong/legacy encoding (Windows-1252, Latin-1, MacRoman) show mojibake ("Ã©", "â€™") downstream and break imports.
Audience: Developers, analysts, game modders, anyone moving CSVs between Excel and web apps.
Evidence: r/django lt8qji: "If the CSV file is encoded in an 8-bit encoding like ISO-8859-1 or Windows 1252, then you aren't handling that upon import"; r/learnpython g8ppgj "Encoding problems with Windows-1252"; r/shopify 1pax6pn: "Finally figured out why Shopify CSV imports fail... manually select UTF-8" (encoding is a named cause of Shopify import failures).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/django/comments/lt8qji/ ; https://www.reddit.com/r/learnpython/comments/g8ppgj/ ; https://www.reddit.com/r/shopify/comments/1pax6pn/
Frequency: weekly
Severity: 6 — corrupts content invisibly until after upload; affects names/addresses (real business data).
Workaround: open in Notepad/VS Code, "Save with encoding UTF-8"; Python `chardet` + re-encode.
Existing: VS Code/Notepad++ (free), iconv, chardet libs; no dominant one-click web fixer (unknown).
Complaints: Even after "converting to UTF-8" users still see wrong chars because the *detected* source encoding was wrong (r/PleX 9irsay for SRT analog: "I converted a srt to UTF 8 but still showing strange characters?").
Automation: deterministic + heuristic — encoding detection then normalization; edge cases need care but no AI.
Distribution: SEO ("csv shows Ã©"), Stack Overflow, dev subreddits.

ID: A4
Problem: CSVs with ragged/uneven rows (extra commas in unquoted fields, shifted columns) can't be loaded by pandas/R/ETL and are rebuilt by hand.
Audience: Learner-programmers, analysts, data cleaning freelancers.
Evidence: r/learnpython 18ofrj8 "how to clean messy csv files with uneven columns" — rows have different field counts; r/excel j6cay2: "Super frustrating, as I can't fix these files as far as I know, so I need to rebuild them manually"; r/excel 1d4hocf: "data moving columns and shifting important data out of alignment. Can this be fixed without getting a..."
EvidenceLevel: E1
Sources: https://www.reddit.com/r/learnpython/comments/18ofrj8/ ; https://www.reddit.com/r/excel/comments/j6cay2/ ; https://www.reddit.com/r/excel/comments/1d4hocf/
Frequency: weekly
Severity: 8 — complete blocker; manual rebuild costs hours; errors propagate silently.
Workaround: open in text editor and hand-fix rows; write bespoke Python; re-export from source.
Existing: unknown dominant tool; Python csv libs (free) — requires skill.
Complaints: "I can't fix these files as far as I know" — no tool awareness.
Automation: mostly deterministic (quote-aware parse, row-length mode detection, column-count repair heuristics); ambiguous cases could use AI assist.
Distribution: Reddit + SO + SEO.

ID: A5
Problem: Marketplace/platform CSV imports (Shopify) fail on supplier CSVs because quoting, encoding, and column order don't match Shopify's template.
Audience: Shopify merchants, dropshippers, store managers.
Evidence: r/SideProject 1oco9qg "CSV import hell - do all Shopify merchants deal with this?": "Every time I update inventory from my supplier's CSV, I spend 2-3 hours fixing errors: 'Illegal quoting...'"; r/shopify 1qbnbgk: "Shopify requires you keep all columns... ASCII errors from Excel"; r/shopify t84gth "Validation failed: The variant 'Default Title' already exists".
EvidenceLevel: E1
Sources: https://www.reddit.com/r/SideProject/comments/1oco9qg/ ; https://www.reddit.com/r/shopify/comments/1qbnbgk/ ; https://www.reddit.com/r/shopify/comments/t84gth/
Frequency: weekly (per merchant, on every supplier catalog update)
Severity: 8 — 2-3 hours per update cycle per merchant; huge audience (millions of Shopify stores).
Workaround: spreadsheet surgery, mapping supplier columns to Shopify template by hand, Notepad UTF-8 re-save.
Existing: Matrixify (Shopify app, paid, ~$20-100/mo unverified), generic ETL (unverified).
Complaints: "Illegal quoting" errors; imports silently no-op ("file imported but you don't see any products").
Automation: deterministic mapping engine + validation pre-flight per platform template; per-platform templates are static so very automatable.
Distribution: r/shopify, Shopify Community forums, SEO ("shopify csv import error").

ID: A6
Problem: Files >1M rows can't be opened in Excel — users need to split huge CSVs and don't know how.
Audience: Analysts, marketers, devs receiving big exports (logs, Shopify orders, ad data).
Evidence: r/excel 17s4t5a "How to open large .CSV file? (2GB)"; r/excel 1t75erz "1.4GB CSV and the 1048576 row limit in 2026": "Excel still caps out at 1,048,576 rows and just dumps the rest of the data"; r/excel 983r6b "How can I cut up a csv file that has more than 1048576 rows?"
EvidenceLevel: E1
Sources: https://www.reddit.com/r/excel/comments/17s4t5a/ ; https://www.reddit.com/r/excel/comments/1t75erz/ ; https://www.reddit.com/r/excel/comments/983r6b/
Frequency: weekly
Severity: 7 — silent data loss risk (rest of file dumped); blocking for non-technical users.
Workaround: Power Query with row filtering, command-line `split`, ask dev friend.
Existing: CSV Splitter tools (assorted, unknown), Power Query (free, hard for novices).
Complaints: "your data has grown too big for your tool" — resignment; novices don't know splitting is a thing.
Automation: 100% deterministic — chunk CSV on row boundaries, emit N files (optionally with header repeated).
Distribution: SEO ("split large csv", "excel 1 million row limit"), r/excel.

### Cluster B — Broken / hostile JSON

ID: B1
Problem: LLM-generated and human-edited JSON breaks parsers on trailing commas, single quotes, comments, unquoted keys — users hunt the offending char manually.
Audience: Developers, LLM-app builders, students.
Evidence: r/vscode 1oxegcb "Removing Trailing Commas in JSON" (user built regex voodoo to strip them); r/webdev 17cqj65 "Automatically repairing JSON: We've all been there—trying to find that one missing comma"; r/n8n 1r9ba8a builds one-click "invalid JSON repair... single quotes, trailing commas, JS-style comments"; r/LLMDevs 1trvkb0 "why LLMs produce 'almost valid' JSON... trailing commas (valid js, invalid json) — the most [common]".
EvidenceLevel: E1
Sources: https://www.reddit.com/r/vscode/comments/1oxegcb/ ; https://www.reddit.com/r/webdev/comments/17cqj65/ ; https://www.reddit.com/r/LLMDevs/comments/1trvkb0/ ; https://www.reddit.com/r/n8n/comments/1r9ba8a/
Frequency: daily
Severity: 6 — time sink, blocks pipelines; LLM boom is *increasing* malformed-JSON volume.
Workaround: jsonlint.com paste, regex find/replace, ask Claude/ChatGPT to fix.
Existing: jsonlint.com (free, paste-based, size-limited), jsonrepair libs (free, dev-only), n8n++ Chrome ext.
Complaints: jsonlint just points at error, doesn't repair; paste tools have size limits.
Automation: deterministic + heuristics (jsonrepair-style) — highly automatable; huge files need streaming (free infra friendly: client-side JS).
Distribution: SEO ("fix invalid json", "json repair"), dev subreddits, GitHub.

ID: B2
Problem: Multi-hundred-MB/GB JSON & JSONL files crash or freeze editors (VS Code 5MB JSON mode limit; 700MB jsonlines crashes VS Code).
Audience: Devs, ML engineers (training data), data engineers.
Evidence: VS Code issue: "Unable to open file in the JSON editor because it exceeds the 5 MB limit. Opening as plain text instead" (developercommunity.visualstudio.com, 2017); GitHub vscode issue #196510: "editor has started crashing when a large file is selected, ie. I have a 700mb jsonlines file"; Sublime forum: opening 2GB JSON "takes nearly 4 hours".
EvidenceLevel: E1
Sources: https://developercommunity.visualstudio.com/content/problem/22670/large-json-files-do-not-open.html ; https://github.com/microsoft/vscode/issues/196510 ; https://forum.sublimetext.com/t/extreamly-slow-while-handling-large-data/17957
Frequency: weekly
Severity: 7 — cannot inspect data at all; forces writing custom scripts.
Workaround: jq CLI (devs), Dadroit/Janice viewers (desktop apps), `head -c` sampling.
Existing: Dadroit (free viewer, commercial product), Janice (free desktop), jq (free CLI).
Complaints: All mainstream editors fail; desktop viewers are niche and OS-bound.
Automation: deterministic — streaming JSONL↔JSONL query/split/sample tool can run client-side or on free-tier server.
Distribution: GitHub, SO, dev Reddit; ML boom keeps it fresh.

ID: B3
Problem: JSON↔CSV conversion of nested data is "almost impossible" for practitioners — array-of-struct nesting flattens wrong, columns explode.
Audience: Data analysts, data engineers, no-code users.
Evidence: r/datascience 197ftrq: "I had extremely nested files with array-struct-array nests and flattening it out fully was almost impossible"; r/data r/data 15h7u5x "Help converting large (2GB) JSON file into CSV"; r/dataengineering w8vsz9 "Flatten a massive json file... 80 gb json file".
EvidenceLevel: E1
Sources: https://www.reddit.com/r/datascience/comments/197ftrq/ ; https://www.reddit.com/r/data/comments/15h7u5x/ ; https://www.reddit.com/r/dataengineering/comments/w8vsz9/
Frequency: weekly
Severity: 7 — blocks reporting/BI tasks; requires coding skill most analysts lack.
Workaround: pandas json_normalize + explode, jq, write custom script, hand-copy small parts.
Existing: ConvertJSON/Klipfolio-type converters (simple cases only), pandas (free, code).
Complaints: Simple online converters choke on nesting; code is a barrier.
Automation: heuristic flattening is deterministic-ish; picking the *right* flatten strategy can be AI-assisted or preview-driven (choose columns interactively).
Distribution: SEO ("json to csv"), r/datascience, SO.

### Cluster C — PDF pain

ID: C1
Problem: PDF→Excel conversion scrambles tables (merged cells, no grid lines, spanning headers) and users spend hours cleaning.
Audience: Accountants, ops staff, analysts, small-business owners.
Evidence: r/dataanalysis 1l69u3l "Converting Messy PDF Data to Excel... formatting is giving me a serious headache"; r/smallbusiness 1rscqjw "How do you extract table data from PDFs?" (biz owner suddenly drowning in PDFs); r/excel jn9dze: 2000-page PDF with 2500 tables needs programmatic extraction.
EvidenceLevel: E1
Sources: https://www.reddit.com/r/dataanalysis/comments/1l69u3l/ ; https://www.reddit.com/r/smallbusiness/comments/1rscqjw/ ; https://www.reddit.com/r/excel/comments/jn9dze/
Frequency: daily
Severity: 8 — extremely common knowledge-work task; hours lost per document; recurring.
Workaround: Adobe export, Power Query PDF connector, Tabula (free, Java), retype.
Existing: Adobe Acrobat Pro ($19.99-29.99/mo unverified), Able2Extract (paid, ~$150/yr unverified), PDFTables (25 pages free tier per r/excel 4p6z9f), PDFgear (free).
Complaints: Output needs manual cleanup; per-page costs for big docs; tools miss columns.
Automation: needs-AI for messy layouts (layout detection); pure vector tables can be rule-based. Hybrid = opportunity.
Distribution: SEO ("pdf table to excel"), r/excel, r/pdf, r/dataanalysis.

ID: C2
Problem: Scanned PDFs have no text layer / OCR errors — users can't search, copy, or correct the text.
Audience: Offices, librarians, students, genealogists, legal.
Evidence: r/pdf 1rr9bv9 "Turn scanned PDFs into searchable text and fix OCR [mistakes] — I built a small free web tool after dealing with a lot of scanned PDFs that were hard to search, full of OCR mistakes"; r/pdf 12ixhss "scanned pdf too messy for automatic OCR"; r/techsupport 16ol8ny "applied an OCR scan, but that did not fix" search failures.
EvidenceLevel: E1
Sources: https://www.reddit.com/r/pdf/comments/1rr9bv9/ ; https://www.reddit.com/r/pdf/comments/12ixhss/ ; https://www.reddit.com/r/techsupport/comments/16ol8ny/
Frequency: daily
Severity: 6 — document unusable as data; correction of OCR errors is the unsolved half.
Workaround: Adobe OCR, free OCR sites, manual transcription (r/pdf 12ixhss literally transcribes by hand).
Existing: Adobe Acrobat (paid), OCRmyPDF (free CLI), SearchablePDF.org etc. (freemium web).
Complaints: OCR output full of errors; no easy way to *fix* text inside PDF afterwards.
Automation: needs-AI (OCR/vision); post-OCR dictionary-based correction is deterministic. Free infra hard but batch offline possible (tesseract).
Distribution: SEO ("make pdf searchable"), r/pdf.

ID: C3
Problem: Adobe Acrobat's subscription-only pricing outrages buyers who need occasional PDF editing/merging/forms.
Audience: Small businesses, sysadmins, individuals.
Evidence: r/software pln0g1 "I can't afford Adobe Acrobat... It's mind blowing to me that the only option out there is a subscription"; r/sysadmin 1ejk1gc: "We used to pay $400 once for the perpetual license of Acrobat Standard 2020... then ride it out"; r/sysadmin 1sqshzs "cheapest adobe reader subscription to JUST edit PDF's? I got 7 folks"; r/Acrobat 1p6kfzk "subscription price 2025 just wrecked our [budget]".
EvidenceLevel: E1
Sources: https://www.reddit.com/r/software/comments/pln0g1/ ; https://www.reddit.com/r/sysadmin/comments/1ejk1gc/ ; https://www.reddit.com/r/sysadmin/comments/1sqshzs/ ; https://www.reddit.com/r/Acrobat/comments/1p6kfzk/
Frequency: daily (perennial)
Severity: 6 — cost pain + vendor distrust; creates demand for cheap one-shot tools.
Workaround: free viewers + online tools (iLovePDF/Smallpdf free tiers), Foxit/PDFgear, Sejda.
Existing: iLovePDF (free tier w/ file-size caps; Premium $5/mo annual, $9/mo monthly — ilovepdf.com/pricing), Smallpdf (free 2 tasks/day-ish trial behavior; Pro $12/mo or $108/yr — ihatepdf comparison + smallpdf pricing page), PDF24 (free desktop).
Complaints: Subscriptions, task caps, upload privacy fears (see D1).
Automation: merge/split/rotate/flattening = 100% deterministic, client-side (pdf-lib.js) — perfect for free static hosting.
Distribution: SEO dominated by converter sites; users compare 5 tools before choosing.

ID: C4
Problem: Filled PDF form data disappears when printing/emailing/saving (form fields not flattened), and users don't know the term or the fix.
Audience: Admin staff, HR, print shops, anyone dealing with government/tax forms.
Evidence: r/pdf 120khso: "Trying to print an interactive PDF but all entered data is [missing]" — top comment: "Printing companies the world over have this issue. I know Acrobat can do this, it's called 'Flatten Form Fields'"; r/mpmb futjc4: "A lot of data not showing up when emailing the completed [PDF]... The only work-around I can find is to open it up in a graphics app like Gimp, then export it as another pdf"; r/pdf b4dw98 "PDF not printing filled in fields?"; r/PDFgear 1lw16lk "How to Flatten PDF for Free".
EvidenceLevel: E1
Sources: https://www.reddit.com/r/pdf/comments/120khso/ ; https://www.reddit.com/r/mpmb/comments/futjc4/ ; https://www.reddit.com/r/pdf/comments/b4dw98/ ; https://www.reddit.com/r/PDFgear/comments/1lw16lk/
Frequency: weekly
Severity: 5 — data silently invisible to the recipient; embarrassing/blocked submissions; fix is one click away but unknown.
Workaround: Acrobat "Flatten Form Fields", Gimp re-export, print-to-PDF from browser.
Existing: PDFtk (free CLI), qpdf, iLovePDF flatten (free tier), PDFgear.
Complaints: Users hit it repeatedly and re-derive the workaround each time; browsers/preview apps show data but recipients' apps don't.
Automation: 100% deterministic (pdftk/qpdf/pdfrw client-side).
Distribution: SEO ("flatten pdf form", "pdf fields not printing"), r/pdf.

### Cluster D — Trust & fragmentation of converters

ID: D1
Problem: Users are now *afraid* of free online converters — FBI + Malwarebytes confirm converter sites push malware/ransomware; privacy of sensitive docs is the blocker.
Audience: Everyone converting docs, esp. business/financial docs.
Evidence: FBI Denver PSA (fbi.gov, Mar 7 2025): "warning that agents are increasingly seeing a scam involving free online document converter tools"; Malwarebytes blog (Mar 17 2025): "free file converters that are up to no good and can lead to ransomware and identity theft"; r/cybersecurity 1jio0le "FBI warnings are true—fake file converters do push malware".
EvidenceLevel: E1 + E2
Sources: https://www.fbi.gov/contact-us/field-offices/denver/news/fbi-denver-warns-of-online-file-converter-scam ; https://www.malwarebytes.com/blog/news/2025/03/warning-over-free-online-file-converters-that-actually-install-malware ; https://www.reddit.com/r/cybersecurity/comments/1jio0le/
Frequency: episodic spikes (news-driven) but trust damage is persistent
Severity: 8 — safety fear = biggest *distribution wedge*: "client-side, files never leave your browser" is a differentiator users actively seek.
Workaround: desktop tools (PDF24), shady-but-known brands, asking IT friends.
Existing: reputable web converters (iLovePDF/Smallpdf upload files to servers!), desktop PDF24.
Complaints: "Do they store my files?" anxiety everywhere in converter UX.
Automation: WASM/JS client-side conversion is deterministic and *answers the trust objection directly*.
Distribution: News mentions + SEO ("is X safe", "convert without uploading").

ID: D2
Problem: One conversion job requires stitching 3-5 different single-purpose sites/tools; users lose track and hit each tool's free caps.
Audience: Regular users with occasional multi-step jobs (e.g., HEIC→JPG→resize→PDF).
Evidence: r/pdf 1ugyrdh / r/software 160i6b5 threads show users shopping across many tools for basic edit features; Smallpdf's free tier is capped (2 tasks/day per pdftechno/ihatepdf comparisons), iLovePDF caps file size on free.
EvidenceLevel: E1 (tool-shopping threads) + E2 (caps verified)
Sources: https://www.reddit.com/r/pdf/comments/1ugyrdh/ ; https://www.reddit.com/r/software/comments/160i6b5/ ; https://www.pdftechno.com/blogs/ilovepdf-vs-smallpdf-vs-pdftechno-which-one-makes-the-most-sense ; https://smallpdf.com/pricing
Frequency: weekly
Severity: 5 — friction + cap-rage; each cap is a churn moment.
Workaround: install desktop freebie (PDF24), pay subscription for one task.
Existing: iLovePDF (free caps, Premium $5/mo annual per pricing page), Smallpdf (Pro $12/mo, $108/yr), Adobe online.
Complaints: caps, watermarks, ads, forced signups on free tiers (widely reported in comparisons).
Automation: deterministic chains (pipeline presets) — automatable fully client-side.
Distribution: SEO comparisons; users already search "X vs Y".

### Cluster E — Subtitles (SRT/VTT)

ID: S1
Problem: Downloaded subtitles are out of sync by a fixed offset (or drift due to FPS mismatch) and casual users can't fix them.
Audience: Plex/Jellyfin/Kodi/Stremio home-media users; anime/foreign-film watchers.
Evidence: r/PleX 1rhybi6: "Most of my media comes with subtitles already but I would say 80% of the time it's never in sync"; r/PleX nebi3a: offset direction confusion "driving me bonkers for years"; r/VLC sh656k: "you have to find the offset at 10 points in the movie and keep re-adjusting".
EvidenceLevel: E1
Sources: https://www.reddit.com/r/PleX/comments/1rhybi6/ ; https://www.reddit.com/r/PleX/comments/nebi3a/ ; https://www.reddit.com/r/VLC/comments/sh656k/
Frequency: daily (home-media hobbyist staple)
Severity: 6 — ruins viewing; confusion is high (sign/direction of offset).
Workaround: VLC H/J/K hotkeys per session, Subtitle Edit (free desktop), re-download subs from OpenSubtitles.
Existing: Subtitle Edit (free, open source), Aegisub (free), online sync shifters (unverified).
Complaints: Players only shift *playback* not the file; users want a saved fixed .srt.
Automation: fully deterministic (offset shift; drift via two-point linear rescale; FPS ratio). A "paste offsets → get fixed srt" web tool is trivial.
Distribution: r/PleX, r/VLC, r/kodi, SEO ("srt sync fix online").

ID: S2
Problem: Subtitle files show garbage characters (Ã©, boxes) due to encoding mismatch between file and player/device.
Audience: Home-media users, projector users, translators.
Evidence: r/PleX 10axriw (Spanish subs with stray chars), r/techsupport 1c0eo0e "Subtitles show up as symbols & characters on my projector", r/emby 1sp4yah: "corrupted characters (e.g., 'vocÃª'...) — clearly an encoding problem", r/handbrake 1fonzcq Hebrew → "random symbols and empty boxes".
EvidenceLevel: E1
Sources: https://www.reddit.com/r/PleX/comments/10axriw/ ; https://www.reddit.com/r/techsupport/comments/1c0eo0e/ ; https://www.reddit.com/r/emby/comments/1sp4yah/ ; https://www.reddit.com/r/handbrake/comments/1fonzcq/
Frequency: weekly
Severity: 5 — cosmetic-to-blocking; confuses non-technical users completely.
Workaround: open in Notepad/Sublime, guess-convert encoding, save as UTF-8; players' encoding menus.
Existing: Subtitle Edit (free), Notepad++ (free), iconv.
Complaints: "I converted to UTF-8 but still showing strange characters" — wrong source encoding guessed (r/PleX 9irsay).
Automation: deterministic — detect-then-normalize to UTF-8; BOM handling; huge SEO surface.
Distribution: SEO ("subtitle encoding fix"), Plex/Emby/Jellyfin forums.

ID: S3
Problem: YouTube auto-generated VTT subs convert to SRT with the same line repeated 2-4x and inline timestamps — converters break.
Audience: Content creators, researchers, transcribers, language learners.
Evidence: r/youtubedl pyl6rg: "vtt to srt doesn't work properly for auto-generated subs... The generated subs will have the same text repeating 2-4 times... I've tried several programs"; r/youtubedl jvn6jx "how to convert vtt subtitles into human readable files?"; r/ffmpeg pglq03: naive `ffmpeg -i input.vtt output.srt` fails expectations.
EvidenceLevel: E1
Sources: https://www.reddit.com/r/youtubedl/comments/pyl6rg/ ; https://www.reddit.com/r/youtubedl/comments/jvn6jx/ ; https://www.reddit.com/r/ffmpeg/comments/pglq03/
Frequency: weekly
Severity: 5 — niche but recurring; no mainstream tool handles dedup well.
Workaround: yt-dlp with postprocessor, custom scripts, manual dedup.
Existing: yt-dlp (free CLI), assorted web converters that fail on auto-subs.
Complaints: "I've tried several programs" — none handle it.
Automation: 100% deterministic (VTT dedup algorithm is well-known). Perfect micro-tool.
Distribution: r/youtubedl, GitHub, SEO ("vtt to srt").

ID: S4
Problem: Subtitle freelancers must satisfy platform QC rules (CPS 15-25, line length 37/42 chars) and check manually per style guide.
Audience: Freelance subtitlers, translation agencies.
Evidence: Smartcat docs: "CPS... Keep within the configured limit (typically 15-25 CPS)"; r/TranslationStudies 1hv8jam "What is QC for subtitling after all?" (freelancer repeatedly QC-rejected); multiple free checkers exist (GoLocalise, voicedeck CPL vs "Netflix 42, BBC 37"), indicating real demand.
EvidenceLevel: E1 + E2 (docs)
Sources: https://help.smartcat.com/subtitle-editor-guide-for-marketplace-suppliers ; https://www.reddit.com/r/TranslationStudies/comments/1hv8jam/ ; https://voicedeck.io/tools/cpl-line-length-checker
Frequency: weekly (per job)
Severity: 4-5 — professional time sink; rejections cost money.
Workaround: Subtitle Edit built-in checks, paste-into-checker web tools, spreadsheets.
Existing: Subtitle Edit (free), Ooona/CaptionHub (enterprise, paid), free single-purpose checkers.
Complaints: Checks scattered across tools; platform-specific rule sets differ.
Automation: deterministic validation (CPS/CPL/overlap/gaps) — trivial to automate; enforcement platform-specific.
Distribution: r/TranslationStudies, agency docs, SEO.

### Cluster F — Accounting data (bank statements, invoices)

ID: F1
Problem: Bookkeepers cannot import bank transactions from PDF statements — QuickBooks Online users beg for PDF→CSV/QBO conversion and are desperate when banks close online history.
Audience: Bookkeepers, small business owners, accountants.
Evidence: r/QuickBooks 1k5xmjj "Desperate Help Needed Can't Extract PDF Bank Statement to CSV, Bank Closed My Account"; r/Bookkeeping wdpsud "PDF Bank Statements to QBO File" ("I don't think there's a way" — until converters); r/Bookkeeping 17k718p "Converting pdf bank statements to csv... Any tool which you guys would recommend"; r/Bookkeeping 1mfrvpd multi-year import walkthroughs.
EvidenceLevel: E1
Sources: https://www.reddit.com/r/QuickBooks/comments/1k5xmjj/ ; https://www.reddit.com/r/Bookkeeping/comments/wdpsud/ ; https://www.reddit.com/r/Bookkeeping/comments/17k718p/
Frequency: weekly/monthly (recurring per client + tax season spikes)
Severity: 9 — books are incomplete without it; "bank closed my account" = deadline pressure; people pay for this.
Workaround: manual re-typing of transactions, retainer of conversion services, generic PDF→Excel then hand-map columns.
Existing: DocuClipper (from $39.95-$49.95/mo for 20 conversions per docuclipper blog — verified on their blog), MoneyThumb 2qbo Convert Pro+ ($299.95 — capyparse review), ProperSoft ProperConvert (desktop, one-time, price on purchase page unverified in this pass), Supaclerk/Docuclipper/SmartClerk (AI startups, free trials).
Complaints: metered "per conversion" pricing stings; AI tools misread rows; desktop tools ugly but trusted.
Automation: needs-AI for PDF layout understanding (statement layouts are semi-structured); output QBO/OFX/CSV emission is deterministic. AI cost is the moat problem for a $0-budget dev.
Distribution: r/QuickBooks, r/Bookkeeping, SEO ("pdf bank statement to qbo") — extremely high commercial intent.

ID: F2
Problem: CSV→QBO/OFX conversions fail validator checks (bank IDs, dates, amounts) and accounting software silently rejects or duplicates imports.
Audience: Bookkeepers, users of Quicken/Xero/QBO.
Evidence: r/QuickBooks 1tmdh5l "Tired of QuickBooks bank feeds missing transactions — built a tool that converts PDF bank statements directly into QBO files for QuickBooks Web Connect import" (builder-validated pain); r/pdf 1ltwm3h recommends Docuclipper specifically because "QBO lets you upload excel/csv files" but format rules trip users.
EvidenceLevel: E1 + E3 (validator specifics inferred from workaround culture)
Sources: https://www.reddit.com/r/QuickBooks/comments/1tmdh5l/ ; https://www.reddit.com/r/pdf/comments/1ltwm3h/
Frequency: weekly
Severity: 7 — failed imports = wasted hours; duplicates = reconciliation nightmare.
Workaround: ProperSoft desktop converters, IIF workarounds, manual journal entries.
Existing: ProperSoft ProperConvert (paid one-time; exact price unverified this pass), MoneyThumb ($299.95 top tier), countless free OFX generators of dubious quality.
Complaints: "missing transactions" in bank feeds is the trigger for building whole tools.
Automation: deterministic emission (QBO/OFX/QIF are text formats); column mapping UI needed. Fully automatable *given* clean CSV.
Distribution: r/QuickBooks, SEO, accounting forums.

ID: F4
Problem: Banks simply don't offer CSV/data downloads for business accounts — statements are PDF-only — so conversion is forced on every bookkeeper.
Audience: Bookkeepers, accountants serving SMB clients.
Evidence: r/Bookkeeping 1coe2v9 "Bank wont provide CSV": "I am trying to download bank statements for a client from their M&T bank business checking. I can only pull PDF files. has anyone..."; a whole subreddit exists for this: r/AccountingFiles (created ~Nov 2025) — "Need help converting accounting files? This subreddit covers OFX, QFX, QBO, QIF, IIF, CSV, Excel, PDFs" with recurring "fix import errors" posts.
EvidenceLevel: E1
Sources: https://www.reddit.com/r/Bookkeeping/comments/1coe2v9/ ; https://www.reddit.com/r/AccountingFiles/
Frequency: monthly per bookkeeper (every new client/bank combo)
Severity: 8 — structural (no workaround on bank side); every affected accountant needs a converter forever.
Workaround: converter tools (see F1/F2 pricing), ask bank for archived files, manual entry.
Existing: see F1/F2 (DocuClipper $49.95+/mo, MoneyThumb $299.95, ProperSoft desktop).
Complaints: price metering (per-conversion), accuracy of AI extraction.
Automation: needs-AI for PDFs (layout variety); deterministic for CSV→QBO/OFX.
Distribution: r/Bookkeeping, r/QuickBooks, r/AccountingFiles, SEO — highest-intent cluster found.

ID: F5
Problem: WooCommerce product CSV imports fail on image URLs ("unable to use image"), server limits, and Excel-mangled files.
Audience: WooCommerce store owners, WordPress freelancers.
Evidence: r/woocommerce 1gh0d3i: "CSV imports fail for products with images, giving the error 'unable to use image'"; r/woocommerce 14bx94x: "1080 product .CSV is getting hung up and will only upload a few"; r/woocommerce 1hxb31o: "large imports fail because they're too big for the server... Try splitting your export file into smaller chunks"; r/woocommerce 1lmz2sa: Excel involvement in import errors.
EvidenceLevel: E1
Sources: https://www.reddit.com/r/woocommerce/comments/1gh0d3i/ ; https://www.reddit.com/r/woocommerce/comments/14bx94x/ ; https://www.reddit.com/r/woocommerce/comments/1hxb31o/
Frequency: weekly
Severity: 7 — catalog launches blocked; devs charge for this.
Workaround: chunk CSVs by hand, pre-upload images to Media Library, PHP settings changes.
Existing: Product Import built into WooCommerce (free, flaky), third-party import plugins (paid, unverified).
Complaints: error messages opaque; splitting files manual.
Automation: deterministic — CSV validation + chunking + image URL reachability pre-flight.
Distribution: r/woocommerce, WordPress forums, SEO.

ID: F3
Problem: Invoice/receipt data extraction tools are priced for enterprises ($500-$1,500/mo floors), locking out small businesses who just have a folder of PDFs.
Audience: Small businesses, freelancers, bookkeepers.
Evidence: Docsumo's own comparison: "Rossum (starts at $1,500/month)"; docsumo blog: "Docsumo is pretty much clear on the baseline budget of $500"; grooper 2026 analysis: Rossum "entry points around $1,500 a month, roughly $0.30 per page"; Parseur "$39/month for 100 pages (annual)"; Lido "starting at $29/month".
EvidenceLevel: E2 (pricing pages/comparisons)
Sources: https://www.docsumo.com/compare/rossum-alternative-docsumo ; https://www.docsumo.com/blog/rossum-vs-docsumo ; https://grooper.com/blog_posts/rossum-vs-nanonets-vs-docsumo ; https://parseur.com/compare-to/docsumo-alternative ; https://www.lido.app/blog/rossum-alternative
Frequency: weekly
Severity: 6 — cost wall, not capability wall; per-page metering punishes growth.
Workaround: manual entry, Excel templates, avoid automation altogether.
Existing: Rossum (~$1,500/mo entry, per comparisons), Docsumo ($500+ baseline), Parseur ($39/mo for 100 pages), Lido ($29/mo), Nanonets (paid).
Complaints: opaque pricing, per-page compounding (sensible.so pitch); r/Accounting 1nu7wj5: "instead of doing data entry; you are reading all the automation outputs and making sure they are correct" (verification burden just moves); r/business 1lnhesy asks how much time businesses spend on manual invoice entry — demand framing.
Automation: needs-AI (vision/LLM) — but volume for small users is low; pay-per-use via cheap LLM APIs could undercut floors. Budget risk for $0-infra dev.
Distribution: comparison SEO ("rossum alternative"), Capterra/G2, word of mouth, r/business.

ID: H1
Problem: SMBs and individuals still spend hours monthly on manual invoice/receipt data entry and want any automation that actually works.
Audience: Small business owners, freelancers, personal-finance enthusiasts.
Evidence: r/business 1lnhesy: "I'm curious to learn more about the time it takes for your business to deal with manual invoice entry on a day to day basis"; r/Accounting 1nu7wj5 "How can we eliminate manual data entry from invoices, forms, and..."; r/PersonalFinanceCanada 14i62si: "looking for a way to track all my expenses without manually typing everything into an Excel sheet each month"; r/GnuCash mugurm asks for automatic receipt OCR into GnuCash.
EvidenceLevel: E1
Sources: https://www.reddit.com/r/business/comments/1lnhesy/ ; https://www.reddit.com/r/Accounting/comments/1nu7wj5/ ; https://www.reddit.com/r/PersonalFinanceCanada/comments/14i62si/ ; https://www.reddit.com/r/GnuCash/comments/mugurm/
Frequency: daily (per business)
Severity: 6 — recurring hours; willingness to pay exists but incumbents priced for enterprise (see F3).
Workaround: Expensify/Itemize (per r/Business_Ideas rmmm6a), spreadsheets, part-time bookkeepers.
Existing: Expensify (freemium, price unverified), Dext (paid, unverified), DIY OCR scripts.
Complaints: verification burden moves to reviewing automation output (r/Accounting 1nu7wj5).
Automation: needs-AI for raw receipts; deterministic for structured invoices with known templates.
Distribution: r/business, r/Accounting, r/tax, SEO.

### Cluster G — Spreadsheet cleanup

ID: G1
Problem: Fuzzy duplicate removal (same company with typos/abbreviations) is beyond Excel's exact-match Remove Duplicates.
Audience: Sales/ops/marketing people cleaning lead lists.
Evidence: r/excel sciney "Find duplicate values that are slightly different"; r/excel d2bwgj "Data Cleaning 2000+ entries (Removing Duplicate Company Names)" — substitute/hack formulas; r/excel 1us4by4 flagging risky duplicate leads; Excel Tips thread "can someone save me a few long days?"
EvidenceLevel: E1
Sources: https://www.reddit.com/r/excel/comments/sciney/ ; https://www.reddit.com/r/excel/comments/d2bwgj/ ; https://www.reddit.com/r/excel/comments/1us4by4/
Frequency: weekly
Severity: 6 — hours of eyeballing; revenue impact (dupe leads).
Workaround: Power Query fuzzy merge (Excel 365 only), SUBSTITUTE/TRIM formula hacks, VBA, manual review.
Existing: Power Query fuzzy matching (free, 365-only), third-party dedupe add-ins (paid, unverified).
Complaints: Fuzzy match not available in Remove Duplicates tool; threshold tuning is arcane.
Automation: hybrid — normalization (case, punctuation, legal suffixes) deterministic; true fuzzy matching can use simple algorithms (Levenshtein) client-side, no AI needed for most cases.
Distribution: r/excel, SEO ("find fuzzy duplicates excel").

ID: G2
Problem: Merged cells destroy sort/filter/pivot operations; analysts inherit "pretty" reports and must un-merge + backfill.
Audience: Analysts receiving reports, data cleaning freelancers.
Evidence: r/excel 31xcvz "What's your biggest Excel pet peeve... Merged cells, color coded areas, blank rows... nightmare for data analysts"; r/excel 1udsck7 "Cleaning merged/messy data for pivot tables/charts... Merged cells is the litmus test for excel proficiency".
EvidenceLevel: E1
Sources: https://www.reddit.com/r/excel/comments/31xcvz/ ; https://www.reddit.com/r/excel/comments/1udsck7/
Frequency: weekly
Severity: 5 — blocks pivots/sorts; un-merge+fill is tedious and error-prone.
Workaround: Find & Select unmerge, Go To Special blanks + fill down, Power Query.
Existing: Power Query (free), VBA snippets.
Complaints: Multi-step ritual repeated on every file.
Automation: 100% deterministic (unmerge + forward-fill blanks) — trivial micro-tool (xlsx input/output).
Distribution: r/excel, SEO.

ID: G3
Problem: PDF-pasted or exported text arrives with broken line breaks/mid-word wraps, and cleaning it into one-row-per-record is manual.
Audience: Researchers, students, ops people copying from PDFs/systems.
Evidence: (Inference anchored on C1/C2 PDF-paste complaints; rowtidy/systools cleanup content; r/dataanalysis formatting threads.) Direct quote not captured this pass.
EvidenceLevel: E3
Sources: https://rowtidy.com/blog/why-csv-file-not-displaying-correctly-in-excel ; https://www.reddit.com/r/dataanalysis/comments/1l69u3l/
Frequency: weekly
Severity: 4 — time sink; low-stakes but very common.
Workaround: Notepad join tricks, Word ^p replace, TextEdit.
Existing: random "remove line breaks" sites (unknown quality).
Automation: 100% deterministic text transforms.
Distribution: SEO.

---

## FACTS (verified competitor pricing/limits, with sources & date seen)

1. Adobe Acrobat is subscription-only; sysadmins report a former ~$400 perpetual license path (Acrobat Standard 2020) now gone. Source: r/sysadmin 1ejk1gc (seen 2026 session). E1.
2. iLovePDF pricing page: Premium from $5/mo billed annually ($60/yr) or $9/mo monthly; free plan exists with per-task file-size caps (no daily task cap per third-party comparison). Sources: https://www.ilovepdf.com/pricing ; https://www.pdftechno.com/blogs/ilovepdf-vs-smallpdf-vs-pdftechno-which-one-makes-the-most-sense (seen 2026 session). E2.
3. Smallpdf pricing page: Pro billed $12/mo monthly or $108/yr (third parties also cite $9-15/mo tiers); free tier limited (commonly described as 2 tasks/day trial-like behavior). Sources: https://smallpdf.com/pricing ; https://www.ihatepdf.cv/blog/ihatepdf-vs-ilovepdf-vs-smallpdf-vs-adobe (seen 2026 session). E2.
4. PDFTables (PDF→Excel): 25 pages free without signup (per r/excel 4p6z9f recommendation thread). Source: reddit (seen 2026 session). E1 (need pricing-page re-verify before quoting as fact).
5. Parseur: starts $39/mo for 100 pages (annual billing) or $49/mo monthly; $99/mo for 1,000 pages. Source: https://parseur.com/compare-to/docsumo-alternative (seen 2026 session). E2.
6. Rossum: entry around $1,500/month per multiple third-party comparisons (~$0.30/page usage tiers also cited). Sources: https://www.docsumo.com/compare/rossum-alternative-docsumo ; https://grooper.com/blog_posts/rossum-vs-nanonets-vs-docsumo (seen 2026 session). E2 (third-party; vendor opaque).
7. Docsumo: baseline budget cited as $500 (usage-based) per Docsumo's own blog. Source: https://www.docsumo.com/blog/rossum-vs-docsumo (seen 2026 session). E2.
8. Lido (document extraction): from $29/month, no annual contracts. Source: https://www.lido.app/blog/rossum-alternative (seen 2026 session). E2.
9. DocuClipper (PDF→QBO): Standard $49.95/mo for 20 conversions ($2.50/conv), Pro $99.95/mo for 60 conversions ($1.67/conv) per DocuClipper's own blog. Source: https://www.docuclipper.com/blog/best-pdf-to-qbo-converters (seen 2026 session). E2.
10. MoneyThumb 2qbo Convert Pro+ : $299.95 (OCR included) per CapyParse review. Source: https://capyparse.com/blog/moneythumb-review (seen 2026 session). E2 (review, not vendor page — re-verify).
11. ProperSoft ProperConvert: desktop one-time-purchase converter for PDF/CSV→QBO/QIF/OFX across QuickBooks/Quicken/Xero/Sage; exact price not captured (purchase page found, numbers unverified). Source: https://www.propersoft.net/purchase/ (seen 2026 session). E2 (existence), price unverified.
12. Sublime Text took ~4 hours to open a 2GB JSON (user report, 2016); VS Code refuses JSON highlighting >5MB ("Unable to open file in the JSON editor because it exceeds the 5 MB limit"). Sources: sublime forum 17957; developercommunity.visualstudio.com 22670 (seen 2026 session). E1.
13. Dadroit markets 1GB+ JSON viewing; Janice (open-source) claims up to 2.5GB desktop viewing. Sources: https://dadroit.com/blog/open-big-json ; r/golang 1elqrit (seen 2026 session). E2.
14. Smartcat subtitle QC docs: CPS limits "typically 15-25 CPS" enforced in their editor; Netflix-style CPL limits (42/37) referenced by free checkers (voicedeck). Sources: https://help.smartcat.com/subtitle-editor-guide-for-marketplace-suppliers ; https://voicedeck.io/tools/cpl-line-length-checker (seen 2026 session). E2.
15. Subtitle Edit and Aegisub are free tools delivering "professional QA capabilities" for solo creators (third-party roundup). Source: https://www.opus.pro/blog/best-subtitle-qa-verification-tools (seen 2026 session). E2.
16. FBI Denver Field Office (Mar 7, 2025) publicly warned about free online document converter scams distributing malware; Malwarebytes covered it Mar 17, 2025. Sources: fbi.gov Denver news page; malwarebytes.com blog (seen 2026 session). E2.
17. r/AccountingFiles is a dedicated subreddit (active as of Nov-Dec 2025) for OFX/QFX/QBO/QIF/IIF/CSV/PDF accounting-file conversion help — existence itself signals an underserved, recurring help-demand niche. Source: https://www.reddit.com/r/AccountingFiles/ (seen 2026 session). E1.
18. ProperSoft markets ProperConvert as "Convert PDF, CSV and bank transaction files into clean data for QuickBooks, Quicken, Xero, Sage and Excel—privately on your computer" (desktop = privacy angle already being sold as a feature). Source: https://www.propersoft.net/ (seen 2026 session). E2.

---

## METHOD NOTE
- Searches run: 20 web_search queries via z-ai CLI (2 rate-limited retries). Query families: CSV breakage/encoding/limits, Shopify & WooCommerce imports, JSON repair/large-JSON, PDF tables/OCR/forms/price, subtitle sync/encoding/VTT/QC, bank-statement & OFX/QIF conversion, invoice extraction pricing, converter safety (FBI), duplicate/fuzzy cleanup, merged cells, JSON↔CSV flattening, receipt entry.

---

## PATTERN NOTES (for synthesis agent)

- Highest commercial-intent cluster: bank statement PDF→CSV/QBO (F1/F2). Crowded with new AI startups (Supaclerk, Docuclipper, Smart Clerk, money-thumb) but demand posts keep appearing monthly; price umbrella $40-300/mo leaves room for a cheap/free one-shot web tool with paid exports.
- Highest-volume, zero-cost-to-serve cluster: deterministic text-format fixes (CSV delimiter/encoding/row-split, JSON repair, VTT dedup, SRT offset). All can run client-side (WASM/JS) on free static hosting — aligns perfectly with $0 infra + the FBI-driven "don't upload my files" trust wedge (D1).
- LLM boom is a new demand engine for JSON repair (B1) and JSONL inspection (B2) — query volume growing.
- Distribution is overwhelmingly SEO + Reddit (r/excel, r/shopify, r/QuickBooks, r/PleX, r/youtubedl). Programmatic SEO per error-message ("[exact error text] fix") looks like the highest-leverage channel.
- Avoid: AI-dependent document AI at scale (cost can't be $0); generic PDF-suite clones (saturated).

---

# SECTION 2 — FREE AI PROVIDERS (Task 2-d)

# Free AI Inference Providers — Verified Research (Task 2-d)

**Checked: 2026-09-02 (UTC).** For a $0-budget, Bangladesh-based developer building a multi-provider AI routing gateway.
Confidence levels: `verified-official` = read directly from provider's official docs/pricing page on the date above; `secondary-source` = multiple consistent third-party reports (2026-dated); `unverified` = could not confirm — do not quote numbers.

> **⚠️ Caveat for the report:** The 2025 free-tier landscape has changed significantly. Three big shifts: (1) Google slashed Gemini free RPD ~90-98% in Dec 2025, (2) Cerebras and Together AI killed their permanently-free tiers (now credits-only), (3) **GitHub Models was fully retired July 30, 2026**. Do not republish 2025-era numbers.

---

## 1. Google AI Studio / Gemini API — verified-official
- **What's free:** "Free — for developers and small projects": limited access to certain models, free input & output tokens, AI Studio access. API key via AI Studio, no credit card required for free tier.
- **Free models (per official pricing page, Sept 2026):** Gemini 3.7 Flash, 3.5 Flash, 3.5 Flash-Lite, 3.1 Flash-Lite, 3 Flash Preview, 2.5 Pro, 2.5 Flash, 2.5 Flash-Lite show "Free of charge" columns. Pro/Omni/image-gen models show "Not available" on free.
- **Rate limits:** Google no longer publishes the per-model free-tier table on the docs page — it now says "View your active rate limits in AI Studio" (limits are per-project, per-model; RPD resets midnight Pacific). **Community-verified (Dec 2025 onward):** Flash-class free RPD was slashed ~250→20 RPD (forum threads + Reddit + LinkedIn concur; ~98% cut on 2.5 Flash). Treat free Gemini as ~20 RPD/model until checked in AI Studio. Mark exact RPD: **unverified-publicly** (account-specific).
- **Data condition (key!):** Free tier = "Content used to improve our products: **Yes**". Paid = No. (verified-official)
- **Card required?** No (billing setup only for paid tiers).
- **Context:** 1M tokens on Flash-class (well-established; secondary).
- **Sources:** https://ai.google.dev/gemini-api/docs/rate-limits (updated 2026-08-18), https://ai.google.dev/gemini-api/docs/pricing
- **Confidence:** verified-official (tier structure, data condition, model availability); secondary-source (20 RPD cut); unverified (exact current per-model RPD).

## 2. Groq — verified-official (best $0 anchor provider)
- **What's free:** Permanent Free Plan, **no credit card** (card only needed to upgrade to Developer tier per Billing FAQs). All current models on LPU hardware.
- **Free Plan limits (official table, checked 2026-09-02):**
  | Model | RPM | RPD | TPM | TPD |
  |---|---|---|---|---|
  | groq/compound & compound-mini (agentic) | 30 | 250 | 70K | – |
  | openai/gpt-oss-120b | 30 | 1K | 8K | 200K |
  | openai/gpt-oss-20b | 30 | 1K | 8K | 200K |
  | openai/gpt-oss-safeguard-20b | 30 | 1K | 8K | 200K |
  | qwen/qwen3.6-27b, qwen/qwen3.8-27b | 30 | 1K | 8K | 200K |
  | meta-llama/llama-prompt-guard-2 (22m/86m) | 30 | 14.4K | 15K | 500K |
  | whisper-large-v3 / whisper-large-v3-turbo (STT) | 20 | 2K | – | – (7.2K audio-sec/hr, 28.8K audio-sec/day) |
  | canopylabs/orpheus TTS | 10 | 100 | 1.2K | 3.6K |
- **Notes:** Cached tokens do NOT count against rate limits (prompt caching = free throughput). Limits at organization level. Rate-limit headers exposed. Free STT file limit 25MB. **Llama chat models no longer in the free table** — 2025 blogs citing "Llama 3.3 70B, 30 RPM/30K TPM/14.4K RPD" are stale; don't quote.
- **ToS:** Groq Services Agreement (2026-06-22): "Groq has no obligation to provide multiple accounts" — multi-accounting not sanctioned.
- **Sources:** https://console.groq.com/docs/rate-limits ; https://console.groq.com/docs/billing-faqs ; https://console.groq.com/docs/legal/services-agreement
- **Confidence:** verified-official.

## 3. OpenRouter (:free models) — verified-official
- **What's free:** ~dozens of `:free` model variants (incl. DeepSeek, Qwen, Llama, gpt-oss lineups) routed through one OpenAI-compatible API. No card needed.
- **Rate limits (official):** Free models: **20 RPM always**; **50 RPD** if lifetime credits < $10; **1,000 RPD** once you've ever purchased ≥ $10 credits (one-time unlock, credits never expire).
- **BYOK:** bring your own provider keys — $25,000/month list-price inference included free on Pay-as-you-go; 5% fee above that.
- **ToS/data:** OpenRouter doesn't log prompts unless you enable logging; but free/stealth models may use inputs for training — OpenRouter privacy policy (2026-07-06): "If you do not want your Inputs used for model training, select a Model or Model Provider that commits to not using your data." Anti-multi-account: "Making additional accounts or API keys will not affect your rate limits, as we govern capacity globally."
- **Sources:** https://openrouter.ai/docs/api_reference/limits ; https://openrouter.ai/docs/faq ; https://openrouter.ai/privacy
- **Confidence:** verified-official.

## 4. Cerebras — verified-official (⚠️ no longer permanently free)
- **What's free:** **"Is there a permanently free tier? No."** Free Trial = **$5 credits that expire 30 days** after grant; access to all Cerebras models, no card stated.
- **Free Trial limits (official):** gpt-oss-120b: 5 RPM, 30K TPM, 1M TPH, 1M TPD; gemma-4-31b: 5 RPM, 30K TPM, 1M TPH, 1M TPD (footnote: images 2/req, 4MB).
- **Paid:** Developer from $10 (10x limits: gpt-oss-120b 1K RPM/1M TPM). Dual-bucket rate limiting (uncached + total tokens) — prompt caching multiplies effective throughput.
- **Sources:** https://inference-docs.cerebras.ai/support/pricing ; https://inference-docs.cerebras.ai/support/rate-limits
- **Confidence:** verified-official.

## 5. Together AI — mostly secondary (⚠️ free tier effectively dead)
- **What's free:** $25 signup credit retired (July 2025, per pricepertoken). Official docs: "Access to the Together platform requires a minimum $5 credit purchase. Together AI is fully prepaid." → **no $0 starting path** except: one free serverless model found in official table: **Prism-ML/Ternary-Bonsai-27B** (262K ctx, Free in/out); plus invite-only Research Credits Program and startup grants ($15k–$50k, not for individuals).
- **Old free endpoints** (`meta-llama/Llama-3.3-70B-Instruct-Turbo-Free`, Llama-Vision-Free, R1-distill-free): the official model page now says Llama-3.3-70B-Turbo-Free "is not available on Together's Serverless API" — treat as retired.
- **Sources:** https://docs.together.ai/docs/serverless/models ; https://www.together.ai/models/llama-3-3-70b-free ; https://docs.together.ai/docs/credits ; pricepertoken.com
- **Confidence:** docs table verified-official (free Ternary-Bonsai-27B; retired free-Llama); credits history secondary-source.

## 6. Hugging Face Inference Providers — verified-official
- **What's free (official pricing page):** Monthly credits for **every** account: Free users **$0.10/month** ("subject to change"), PRO $2.00/month, Team/Enterprise $2.00/seat/month. Credits auto-apply to 200+ models routed through HF (Groq, Cerebras, Together, DeepInfra, Novita, OVH, Scaleway, etc.), no HF markup. Extra usage = pay-as-you-go (credits purchase required beyond free credits).
- **Note:** This is a big downgrade vs the 2024-25 "free serverless inference" era — $0.10/mo ≈ a handful of requests on 8B models. Useful mainly as a unified fallback and for rare/long-tail models.
- **Card required?** No for the free monthly credits.
- **Source:** https://huggingface.co/docs/inference-providers/pricing
- **Confidence:** verified-official (credits table); per-provider sub-limits unverified (depend on underlying provider).

## 7. Cloudflare Workers AI — verified-official
- **What's free:** **10,000 Neurons/day** free allocation (on Workers Free plan AND as the free allowance on Workers Paid). Resets daily 00:00 UTC. No card on Workers Free.
- **Overage:** $0.011 per 1,000 Neurons.
- **Models:** llama-3.2-1b (2,457 neurons/M in ⇒ ≈4M input tok/day free), llama-3.2-3b, llama-3.1-8b-fp8-fast, llama-3.2-11b-vision, llama-3.1/3.3-70b-fp8-fast, DeepSeek-R1-distill-32b, Whisper, embeddings, image models. ⚠️ Frontier models (kimi-k2.6/2.7, glm-5.2/5.3/5.3-flash, deepseek-v4-*) require Workers Paid or prepaid AI Gateway credits.
- **Example paid price:** llama-3.1-8b-fast $0.045/M in, $0.384/M out; llama-3.3-70b $0.293/$2.253.
- **Source:** https://developers.cloudflare.com/workers-ai/platform/pricing/
- **Confidence:** verified-official.

## 8. Mistral (La Plateforme) — secondary-source
- **What's free:** "Experiment" free API tier: **~1 billion tokens/month**, rate-limited (~1 req/sec), **no billing card required**, intended for evaluation/training data caveats apply.
- **Notes:** Consistent across 2026 secondary sources (help.mistral.ai article "Why am I hitting API rate limits" confirms limits measured in RPS + tokens/min + tokens/month; exact per-workspace numbers shown in console). Paid "Build" tier details: unverified this session.
- **Sources:** help.mistral.ai (rate-limits article, updated 2026-08-12); amnic.com (Jun 2026); pricepertoken.com; rapidevelopers.com (Jul 2026).
- **Confidence:** secondary-source (official article confirmed structure; the ~1B tok/mo number from multiple secondary sources).

## 9. GitHub Models — verified-official (⚠️ RETIRED)
- **GitHub Models was fully retired as of July 30, 2026** — playground, model catalog, inference API, and BYOK "no longer available to any customer." Separate from GitHub Copilot. Successor path for free model access: Azure AI Foundry (model catalog) or GitHub Copilot.
- **Impact:** Any 2025 plan that lists GitHub Models as a free-tier provider is obsolete. Remove from the router lineup.
- **Source:** https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models
- **Confidence:** verified-official.

## 10. NVIDIA NIM / build.nvidia.com — secondary-source (official-forum corroborated)
- **What's free:** Free API key via NVIDIA Developer Program (no card): **~1,000 API credits on signup** (1 credit ≈ 1 API call), raiseable to ~5,000 on request; **~40 RPM** free-tier rate limit. Production usage requires paid deployment of NIM microservices.
- **Notes:** Official 2024 forum post states the trial catalog grants 1,000 credits (5,000 possible); 2026 forum threads show NVIDIA actively enforcing/limiting free-tier abuse (e.g., banning "OpenClaw-style" agentic abuse, May 2026).
- **Sources:** https://build.nvidia.com ; forums.developer.nvidia.com/t/api-credits-for-build-nvidia-com/306633 ; /376049 ; decodethefuture.org guide (May 2026); sidsaladi.substack.com.
- **Confidence:** secondary-source (numbers consistent; build.nvidia.com page itself is JS-rendered, not directly parsed).

## 11. Cohere — verified-official
- **What's free:** Trial API keys (free, no card) — **1,000 API calls/month** total (also applies to prod keys on newest model variants).
- **Trial rate limits (official):** Chat 20 req/min per model (Command A/A+/Reasoning/Vision/Translate, Command R/R+/R7B, North Mini Code); Audio transcriptions 5 req/min; Embed 2,000 inputs/min (images 5/min); EmbedJob 5 req/min; Rerank 10 req/min; Parse 500 req/min; default 500 req/min.
- **Sources:** https://docs.cohere.com/docs/rate-limits
- **Confidence:** verified-official. (Card-free signup per trial-key design — standard; not explicitly stated on the page: minor caveat.)

## 12. SambaNova Cloud — verified-official
- **What's free:** **Free Tier = account with NO payment method linked** (card optional!). Official limits, production models (DeepSeek-V3.1, Meta-Llama-3.3-70B-Instruct, gpt-oss-120b): **20 RPM / 20 RPD / 200K TPD**. Preview models (DeepSeek-V3.2, gemma-4-31B-it): same 20/20/200K.
- **Developer tier** (payment method linked): 60 RPM / 12,000 RPD (Llama-3.3-70B: 240 RPM / 48,000 RPD), capped 20M tokens/day across all models.
- **Sources:** https://docs.sambanova.ai/docs/en/models/rate-limits ; https://cloud.sambanova.ai/plans
- **Confidence:** verified-official. (Tiny RPD but 200K TPD + no-card = real $0 fallback; 20 req/day is the binding constraint.)

## 13. Local inference (llama.cpp / Ollama on Android Termux) — secondary-source
- **Feasibility (2026 evidence):** Works. llama.cpp compiles/runs natively in Termux; Ollama available via community Termux builds. Qwen-class 0.5B–1.5B quantized (Q4) fit in ~1GB; 2B-3B (Gemma, Qwen) comfortable on 6–8GB-RAM phones; measured 6–25 tok/s on Snapdragon 8 Gen 1 (Qwen3-class). Aug 2026 demos: Qwen3.8 ~1GB weights, 262K ctx loaded in Termux on Android.
- **Constraints:** RAM is the binding limit (Android kills background processes); thermal throttling; no GPU acceleration in Termux (CPU-only llama.cpp; Vulkan experimental). Serve to localhost apps via Ollama's OpenAI-compatible API (127.0.0.1:11434) or llama.cpp server — perfect for an offline-fallback route in the gateway.
- **$0 cloud fallback:** Oracle Cloud Always Free VM (2026 update: 2 CPU / 12 GB RAM ARM) can host small models 24/7.
- **Sources:** yutori.com scouts summary; ai.gopubby.com (Jun 2026); scribd Android-LLM report; Facebook/Termux demo posts (Aug 2026); r/oraclecloud Always Free thread (Jun 2026).
- **Confidence:** secondary-source (feasible; exact tok/s varies by device). Recommended pilot models: qwen2.5/qwen3 0.5B–1.5B, gemma-2-2b, SmolLM2-360M.

## 14. Whisper-class speech-to-text, free — verified-official (Groq) + secondary (local)
- **Groq (best free STT):** whisper-large-v3 & whisper-large-v3-turbo on free tier: **20 RPM, 2,000 RPD, 7,200 audio-sec/hour, 28,800 audio-sec/day (~8 hours of audio/day)**, 25MB/file. Verified in official rate-limits table. Paid comparison: Whisper v3 Turbo $0.04/hour vs OpenAI ~$0.36/hour.
- **Local:** whisper.cpp with tiny/base quantized models runs real-time on desktop CPUs and high-end Android (Termux); tiny.en ≈ <1GB RAM. Feasible offline fallback; exact speeds device-dependent (secondary-source).
- **Also free-ish:** Hugging Face Inference Providers $0.10/mo credits can route STT models; Cloudflare Workers AI includes Whisper under the 10k Neurons/day free allocation.
- **Confidence:** Groq verified-official; local secondary-source.

## 15. ToS red flags / compliance notes for a $0 router
- **Multi-accounting:** Prohibited/futile across the board. OpenRouter: extra accounts/API keys don't change limits ("we govern capacity globally"). Groq: "no obligation to provide multiple accounts" (Services Agreement, 2026-06-22). NVIDIA bans abusive free-tier automation patterns (forum enforcement, May 2026). Generic AI-API ToS language: multiple accounts to circumvent limits = grounds for ban. → **Design the router to aggregate MANY providers with ONE account each.**
- **Data training opt-out:** Gemini free tier = data IS used to improve products (official). OpenRouter free models = may train on inputs; choose zero-retention providers via provider-preference settings. Groq/Cerebras/Together paid = no training on API data (industry standard); Groq free-tier training policy page didn't load this session (unverified).
- **Reselling:** No explicit "reselling prohibited" clause captured for these free tiers this session — **unverified**; check each provider's terms before exposing the gateway as a public product. (OpenRouter has a separate provider/partner program for reselling inference.)
- **Caching:** Allowed and even rewarded: Groq explicitly excludes cached tokens from rate limits; Cerebras dual-bucket favors cache hits; Gemini paid has context caching (50% cheaper... free tier: caching free-of-charge row exists). No provider found that prohibits client-side response caching, but don't serve one user another user's cached PII (unverified-generalization, flag in report).
- **Stability risk:** Free tiers change without notice (Gemini cut Dec 2025 with no email; GitHub Models retired Jul 2026; Cerebras/Together free tiers ended). → Router MUST treat every free provider as disposable, with health checks + graceful failover.

---

## Cost economics of cheap paid tiers (per 1M tokens, for the pay-per-use case)
Checked 2026-09-02.

| Model / Provider | Input $/1M | Output $/1M | Confidence |
|---|---|---|---|
| DeepSeek V4 Flash (1M ctx, off-peak) | $0.22 ($0.014 cache-hit) | $0.66 | verified-official (api-docs.deepseek.com) |
| Gemini 3.1 Flash-Lite | $0.25 | $1.50 | verified-official (ai.google.dev/pricing) |
| Gemini 2.5 Flash / 3.5 Flash-Lite | $0.30 | $2.50 | verified-official |
| Gemini 3.7 Flash (until Dec 31 2026; 2x in 2027) | $0.75 | $3.75 | verified-official |
| Gemini 3.5 Flash | $1.50 | $9.00 | verified-official |
| Cloudflare Workers AI llama-3.1-8b-fast | $0.045 | $0.384 | verified-official |
| Cloudflare Workers AI llama-3.3-70b-fast | $0.293 | $2.253 | verified-official |
| OpenAI GPT-4o-mini | $0.15 | $0.60 | secondary-source (stable since 2024; openai pricing page JS-blocked) |
| OpenAI GPT-5 nano | ~$0.05 | ~$0.40 | secondary-source (benchlm.ai, Sep 2026) |
| Claude Haiku 4.5 (200K ctx) | $1.00 | $5.00 | secondary-source (multi-source consistent) |
| Claude Sonnet 5 | $2.00–$3.00 | $10–$15 | secondary-source (conflicting reports; verify) |

**Business-case framing:** A $0 multi-provider stack (Groq 1K RPD + Gemini ~20 RPD + OpenRouter 50–1,000 RPD + SambaNova 200K TPD + Cloudflare 10k Neurons + Mistral ~1B tok/mo) covers prototype/MVP traffic; the moment a customer pays anything, DeepSeek V4 Flash or Gemini 2.5 Flash-Lite at $0.2–0.3/M input / $0.7–2.5/M output caps worst-case COGS at ~1–5% of revenue for typical chat workloads.

## Free-tier capacity math (per single accounts, per day, rough)
- Text gen: Groq gpt-oss/qwen 8K TPM×30 RPM (200K TPD) + Gemini Flash ~20 RPD + OpenRouter 50 RPD (1,000 RPD w/ $10 unlock) + SambaNova 200K TPD (20 RPD) + Cloudflare ~0.5M output tok/day (1b model) ⇒ comfortably ~500–2,000 requests/day of mixed small-model traffic at $0.
- STT: Groq whisper 28.8K audio-sec/day (≈8 h/day) at $0.
- Fallback/eval: Mistral ~1B tok/month; HF $0.10/mo credits; NVIDIA ~1,000 one-off calls.

*End of file. All official pages re-readable at the source URLs above.*

---

# SECTION 3 — FREE INFRASTRUCTURE (Task 2-e)

# Free Infrastructure Tiers — Verification Report (Task 2-e)

**Prepared:** 2026-09-02 · **Method:** Official docs/pricing pages + corroborating sources via web search (~30 queries)
**Context:** $0-budget solo dev in Bangladesh building micro web tools + APIs + Telegram bots.

Confidence: ✅ = verified against official docs/pricing page · 🟡 = multiple credible secondary sources, official page not directly fetched · ⚠️ = changed recently / contested.

---

## 1. Cloudflare (Workers / Pages / KV / D1 / R2 / Queues / Cron)

| Item | What's free | Limits | Card required? | Gotchas |
|---|---|---|---|---|
| **Workers Free** | 100,000 requests/day (reset 00:00 UTC), 10ms CPU per invocation, 128MB memory, up to 100 Worker scripts | Daily hard cap — after exceeding, requests fail (HTTP 429-ish errors) until reset | ❌ No card | 10ms CPU is strict; DB/network I/O doesn't count but JSON parsing/crypto does. No Cron triggers quotas issue (see below); no Durable Objects w/ SQLite? (DO limited). Subrequest limits (50/req on Free). |
| **Pages** | Unlimited static requests/bandwidth; 500 builds/month, 1 concurrent build; Functions share Workers Free 100k req/day | 100 projects/account, 20k files, 25MB/file | ❌ No card | 500 builds/mo is the real constraint for CI-heavy workflows. Unlimited *bandwidth* officially (ToS §2.8 no video/proxy abuse). New users: Pages & Workers merged in dashboard. |
| **Workers KV** | 1,000 writes/day, 100,000 reads/day, 1GB storage (Free plan) | Daily resets | ❌ | Extremely low write allotment (1k/day) — never use KV for counters/state churn. |
| **D1 (SQLite)** | 5M rows read/day, 100k rows written/day, 5GB total storage/account (500MB per-DB max noted in some sources) | Daily resets | ❌ | JOINS multiply "rows read" fast — users have hit 5M/day just browsing their own site (Reddit). Design around single-row PK lookups. |
| **R2** | 10GB storage/mo, 1M Class A ops (writes/list)/mo, 10M Class B ops (reads)/mo, **$0 egress** | Free tier applies to Standard storage only | ❌ | Best free object storage anywhere due to zero egress; need card? No — but R2 requires enabling via dashboard with a payment method on some account states (🟡 verify at signup). |
| **Cron Triggers** | Included on Workers Free | Each run consumes the 100k req/day | ❌ | Minute-level granularity, reliable (unlike GH Actions cron). | 
| **Queues** ⚠️ UPDATED | **NOW FREE as of Feb 4, 2026**: 10,000 operations/day on Workers Free (was paid-only until then) | 10k ops/day; Paid: 1M ops/mo + $0.40/M | ❌ | Official changelog Feb 4, 2026. Before that (and per June 2025 community posts) Queues required Workers Paid — old blog posts are outdated. |
| **Web Analytics** | Free, unlimited, cookieless, no card | — | ❌ | Requires a JS beacon or CF proxy. No UTM-level funnels; basic but fine for micro-tools. |

**Sources:** developers.cloudflare.com/workers/platform/limits (checked 2026-09-02, doc dated Jul 2026); developers.cloudflare.com/d1/platform/pricing & /limits (Apr 2026); developers.cloudflare.com/r2/pricing (Aug 2026); developers.cloudflare.com/kv/platform/pricing & /limits (Apr 2026); developers.cloudflare.com/changelog/post/2026-02-04-queues-free-plan (Queues on Free!); cloudflare.com/plans/developer-platform; blazingcdn.com 2026 breakdown; eastondev.com CF checklist (May 2026); zerocoststartup.com (Oct 2025).

---

## 2. Vercel (Hobby)

| Item | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Hobby plan** | 100GB bandwidth/mo; 1M function invocations/mo (new "Custom Function Invocations" model); ~4 active CPU-hours; 1M edge requests; 360 GB-hr provisioned memory | Monthly | ❌ No card | **Non-commercial use only** — ToS forbids commercial projects on Hobby (they do enforce for obvious commercial sites). |
| **Cron Jobs** | Included but **Hobby: max once per day — hourly/minute expressions fail** (official docs, Jul 2026) | 2 cron jobs | ❌ | For sub-daily crons use GitHub Actions or external cron hitting a Worker/endpoint. |
| Deploy limits | 100MB max source upload via CLI (Hobby), 6000 deployments... build concurrency 1 | — | ❌ | Fluid Compute default now; invocations billing changed 2025. |

**Sources:** vercel.com/pricing; vercel.com/docs/plans/hobby (Aug 2026); vercel.com/docs/cron-jobs/usage-and-pricing (Jul 2026); temps.sh Vercel 2026; schematichq.com (Mar 2026). **Date checked:** 2026-09-02. ✅/🟡

---

## 3. Render / Fly.io / Railway (long-running app hosts)

| Service | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Render** | 750 free instance-hours/mo/workspace; free web services (512MB RAM, 0.1 CPU); free static sites; free Postgres **expires after 30 days** | Bandwidth on free tier cut to ~5GB/mo (2026 change ⚠️) | ❌ | **Spin-down after 15 min idle → cold start ~30-60s+**; free Postgres is throwaway (30-day expiry). Reddit: some free apps permanently suspended for low usage. |
| **Fly.io** | **No free tier** (removed 2024). New orgs = Pay As You Go; brief trial (🟡 ~2h trial compute or a small trial period) then billing | — | ✅ Card required for continued use | Effectively out of a $0 stack. Docs still reference legacy free allowances — ignore. |
| **Railway** | Trial: one-time **$5 credit / 30 days**, then must upgrade to Hobby ($5/mo) to deploy (trial reverts to limited Free plan without deployments) | ~500 execution hours equivalent; 512MB RAM/vCPU-shared services | ❌ no card for trial | Not sustainable free — good for 1-month burst only. |

**Sources:** render.com/docs/free; render.com pricing; render.com "real free tier" blog (Apr 2026); codecapsules.io Render 2026 changes (Jun 2026); fly.io/docs/about/pricing; community.fly.io threads; docs.railway.com/pricing/free-trial; railway.com/pricing; temps.sh Railway 2026. **Date checked:** 2026-09-02.

---

## 4. Serverless Databases

| Service | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Supabase** | 2 active projects; 500MB DB; 5GB egress; 50k MAU auth; 1GB file storage; 2 free edge-function invocations... | **Pause after 7 days of inactivity** (API requests reset the clock; paused projects keep data, manual restore) | ❌ | Biggest operational trap: a quiet side-project goes dark weekly. Fix: GitHub Actions heartbeat every ~3 days (officially acknowledged pattern). Paused projects don't count toward the 2-project limit. |
| **Neon** | ~100 CU-hrs/mo per project (doubled from 50 in Oct 2025), 0.5GB storage/project, up to ~10 projects, autoscale to 2 CU | **Autosuspend after 5 min inactivity → ~500ms-2s cold start** | ❌ | 0.25 CU × 24/7 ≈ 180 CU-hrs — a 24/7 always-on small instance **exceeds** 100 CU-hr allotment; keep autosuspend on, only pay compute while awake. GitHub discussion: compute not always fully zero when suspended. |
| **Turso** | 100 databases, 5GB total storage, **500M row reads/mo, 10M row writes/mo** (generous); 3 locations/DB | Monthly | ❌ | March 2025 "Developer plan" post kept free tier at 500M reads/10M writes. Some third-party 2026 pages show conflicting higher numbers (9GB/1B reads) — trust turso.tech/pricing: 100 DBs / 5GB / 500M reads / 10M writes. |
| **MongoDB Atlas M0** | Permanently free shared cluster: **512MB storage**, shared vCPU/RAM, up to 500 connections, 500 collections/100 DBs, 10GB-in/10GB-out rate limit window | No time limit, no pause | ❌ No card | No automated backups on M0; shared tier is slow under load; ops limits (~100 ops/sec practical on shared). |
| **Cloudflare Hyperdrive** | Included free with Workers (caching/pooling for external Postgres) | — | ❌ | Pairs well: Neon free + Hyperdrive from Workers. |

**Sources:** supabase.com/pricing; supabase.com/docs/guides/platform/free-project-pausing; neon.com/docs/introduction/plans; simplyblock.io Neon pricing (Jun 2026); turso.tech/pricing + turso blog (Mar 2025); mongodb.com/pricing + mongodb.com/docs/atlas/reference/free-shared-limitations; oneuptime.com (Mar 2026). **Date checked:** 2026-09-02.

---

## 5. GitHub (Actions / Pages / raw / API / Codespaces)

| Item | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Actions** | Public repos: **unlimited** minutes (standard runners). Private: **2,000 min/mo** (Free plan) | Linux 1x multiplier; macOS 10x, Windows 2x burn minutes faster | ❌ | 2026 change: $0.002/min platform fee on **self-hosted** runners (irrelevant at $0 scale). Scheduled workflows = free compute/cron engine for public repos. |
| **Actions as cron** | schedule: cron syntax, min interval **5 minutes** | ⚠️ OFFICIAL docs: schedule event "can be delayed during periods of high loads... high load times include the start of every hour." Community: 20-40 min delays common, drops & 8-14h drift reported; public-repo schedules disabled after 60 days of repo inactivity | ❌ | Best-effort only. Avoid :00 timestamps (offset crons), add retry/jitter; never use for precision (Telegram bots should use webhooks, not polling loops). |
| **Pages** | Free static hosting from repo: 1GB site, **100GB/mo soft bandwidth**, 10 builds/hr soft | Public repos free; private needs Pro | ❌ | "Soft" limits = email warning before throttle. Can't run server-side; use for docs/landing/tools. |
| **raw.githubusercontent.com** | Free file/JSON hosting w/ correct content-type issues (text/plain default — use jsDelivr CDN for proper types) | Rate limits apply to raw domain (🟡 dynamic/undocumented); jsDelivr (free, unlimited-ish, serves npm/GitHub w/ 50MB file cap) is the reliable front | ❌ | Don't build an API on raw — it's a file server, not a CDN API. |
| **REST API** | Unauthenticated: **60 req/hr per IP**; authenticated (PAT): **5,000 req/hr**; GitHub Apps: 15,000/hr (org) | Search API much lower (10/min auth) | ❌ | 60/hr unauth is brutal — always ship a PAT for backend scripts. |
| **Codespaces** | **120 core-hours/mo** (= 60 hrs on 2-core) + **15GB-month storage** for personal accounts | Storage billed while stopped | ❌ | Stops auto after 30 min idle; delete idle codespaces to save storage quota. |
| **Bot APIs / secrets** | Actions secrets, dependabot, issue bots free on public repos | — | ❌ | — |

**Sources:** docs.github.com/en/billing/concepts/product-billing/github-actions; github.com/pricing; github.blog changelog (Dec 16, 2025 — self-hosted runner fee Mar 1, 2026); docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits; docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api; docs.github.com/billing/.../about-billing-for-github-codespaces; github.com/features/codespaces. **Date checked:** 2026-09-02. ✅

---

## 6. Static Hosting (others)

| Service | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Netlify** ⚠️ | **300 credits/mo** (changed from legacy 100GB/300 build-min model). Bandwidth = 20 credits/GB → **~15GB effective bandwidth**; ~20 deploys | **Hard limit — sites pause/suspend when credits exhausted** until next cycle | ❌ | Major 2026 downgrade (netli.fyi Jul 2026; official docs "How credits work" Aug 2026). Users report sites staying paused even after reset. No longer viable as primary host for anything with real traffic. Legacy "100GB free" claims are outdated. |
| **Cloudflare Pages** | Unlimited bandwidth, unlimited requests (static), 500 builds/mo | See §1 | ❌ | Best free static host right now. |
| **GitHub Pages** | 100GB soft bandwidth | 1GB site | ❌ | Fine secondary. |
| **surge.sh** | Free unlimited publishes incl. custom domains on surge subdomain | SSL on custom domains paid; service in "limited preview" mode for pro ($30/mo) | ❌ | Long-neglected product; fine as a quick-deploy utility, not a pillar. |
| **itch.io** | Free game hosting — **not** suitable for web tools (games-focused, no custom domains) | — | ❌ | Skip. |

**Sources:** netlify.com/pricing; docs.netlify.com "How credits work" (Aug 2026); netli.fyi (Jul 2026); flexprice.io (Aug 2026); answers.netlify.com suspension threads (Jun-Jul 2026); surge.sh. **Date checked:** 2026-09-02.

---

## 7. Transactional Email

| Service | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Resend** | **3,000 emails/mo, 100/day**, 1 custom domain (🟡 some pages say 3 domains), 1 webhook | Daily cap is the real constraint | ❌ | Best DX for devs; onboarding/verification emails fit easily in 100/day. |
| **Brevo (ex-Sendinblue)** | **300 emails/day** (~9,000/mo), unlimited contacts | Daily only, no rollover | ❌ | Marketing+transactional in one; higher volume ceiling than Resend but weaker API/SMTP reputation historically. |
| **SendGrid** | ⚠️ **FREE PLAN RETIRED July 26-27, 2025** (was 100/day). Now 60-day trial only | — | ✅ | Legacy blog posts still recommending it are wrong. |
| **Mailgun** | ⚠️ Free tier (5000/mo legacy) discontinued for new signups; 30-day trial; from $15/mo | — | ✅ | Skip for $0 stack. |
| **EmailJS** | Free: **200 requests/mo, 2 templates** (client-side send, no server needed) | Small | ❌ | Only for static-site contact forms; not an API workhorse. |
| **SMTP2GO** | Free: 1,000 emails/mo, 200/day (their 2025 pitch as SendGrid replacement) | — | ❌ | 🟡 Decent backup sender. |
| **Amazon SES** | 3,000 msgs/mo free for 12 months from EC2/Lambda; otherwise $0.10/1k | Needs AWS account + card | ✅ card | Not truly $0-forever after 12 months, but effectively free for year 1. |

**Sources:** resend.com/pricing + resend.com/docs/knowledge-base/account-quotas-and-limits; help.brevo.com Free plan FAQ; twilio.com changelog (SendGrid free plan retirement, May 27, 2025 announcement; ended Jul 26-27 2025); mailercloud.com; lemmalegal.com (Aug 2025); smtp2go.com blog (Sep 2025). **Date checked:** 2026-09-02.

---

## 8. Cron / Scheduling

| Service | What's free | Limits | Gotchas |
|---|---|---|---|
| **GitHub Actions schedule** | Unlimited on public repos; 5-min min interval | High-load delays/drops; disabled after 60d repo inactivity; min 5 min | The best free cron for public repos; wrap critical jobs in retry + external watchdog. |
| **Cloudflare Cron Triggers** | Included free with Workers | Consumes the 100k req/day | Reliable (Cloudflare infra), minute-level. Preferred over GH Actions for bot heartbeats. |
| **cron-job.org** | Free: **unlimited number of cronjobs**, up to **once per minute** (official FAQ) | HTTP GET/POST to any URL | Beloved free external cron — good as an independent watchdog pinging your Workers. |
| **Upstash QStash** | Free: **1,000 messages/day** (raised 500→1000 at GA, Oct 2025 official blog); max 7-day delay on free | Scheduling + retries + callbacks as a service | The missing "queue/cron-as-API-call" for serverless. Some Apr 2026 articles still say 500/day — official GA blog says 1000. |
| **Vercel Cron** | Hobby: **once per day max** | 2 cron jobs | Too weak for real scheduling. |

**Sources:** docs.github.com/actions/using-workflows/events-that-trigger-workflows (schedule delay caveat); cron-job.org/en/faq; upstash.com/blog/qstash-qa (Oct 2025); upstash.com/blog/redis-new-pricing (Mar 2025); vercel.com/docs/cron-jobs/usage-and-pricing (Jul 2026). **Date checked:** 2026-09-02. ✅

---

## 9. Monitoring / Uptime

| Service | What's free | Limits | Gotchas |
|---|---|---|---|
| **UptimeRobot** | **50 monitors, 5-min interval**, HTTP/keyword/ping/port, status pages, no card | ✅ verified | ⚠️ Free plan positioned for "hobby and non-profit" — non-commercial wording (like Vercel). |
| **Better Stack** | **10 monitors**, free status page (pricing page verified) | ✅ | Nicer UI, fewer monitors. |
| **healthchecks.io** | **20 checks free**; Business plan free for OSS/nonprofits | ✅ | *Inverse* uptime (dead-man's switch): alerts when YOUR cron silently dies — pairs with GH Actions cron. |

**Sources:** uptimerobot.com/pricing + help.uptimerobot.com (Jun 2026); betterstack.com/pricing; healthchecks.io/pricing. **Date checked:** 2026-09-02. ✅

---

## 10. Auth

| Service | What's free | Limits | Gotchas |
|---|---|---|---|
| **Clerk** | **10,000 MAU free** (stable since Nov 2023; a Feb 2026 report claims 50k MAU free — 🟡 unconfirmed, treat 10k as safe planning number) | Pro $25/mo then $0.02/MAU | Best DX, generous free; verify current MAU at signup. |
| **Auth0** | **25,000 MAU free** (raised from 7,500 in Sep 2024, official blog) | Custom domains need card verification | Historically volatile pricing — re-check before committing. |
| **Supabase Auth** | **50,000 MAU** on free tier | Included with project (2 projects) | Best bundled value; shares the 7-day-pause gotcha. |
| **Firebase Auth** | **50,000 MAU free** (email/social/anonymous; Spark & Blaze) | Phone/SMS auth billed | Rock solid, forever-free, no pause risk; Google-backed. |

**Sources:** clerk.com pricing announcement (Nov 2023; saasprices.net Feb 2026 claims 50k); auth0.com/pricing + auth0.com/blog Sep 24, 2024; firebase.google.com/pricing + blog.logto.io (Jul 2026); supabase.com/pricing. **Date checked:** 2026-09-02. ✅/🟡(Clerk)

---

## 11. Analytics

| Service | What's free | Limits | Gotchas |
|---|---|---|---|
| **Cloudflare Web Analytics** | Free unlimited page views, cookieless | — | One beacon script per site; zero effort if already on CF. |
| **Google Analytics 4** | Free (360 is the paid tier) | — | GDPR/adblock friction; fine for BD audience. |
| **PostHog** | **1M analytics events/mo free** + 5,000 session replays + 1M feature-flag requests + 1,500 survey responses (official pricing page) | ✅ | Generous; usage-based after. |
| **Umami** | Self-host free (on Vercel/CF + free Postgres/MySQL) | Your infra's limits | Great GA alternative at $0; beware DB row limits (Neon 0.5GB / Supabase pause). |
| **Plausible** | ❌ No free tier (starts ~$9/mo) | — | Skip at $0. |

**Sources:** posthog.com/pricing; userpilot.com (Aug 2026); flexprice.io (Aug 2026). **Date checked:** 2026-09-02. ✅

---

## 12. Domains & DNS

| Option | Cost | Notes |
|---|---|---|
| **eu.org** | Free subdomain (yourname.eu.org) | Long-running, respected; approval takes **weeks-months**. |
| **is-a.dev** | Free subdomain via GitHub PR | Community-run, popular with devs; ~200k+ registrations. |
| **js.org** | Free subdomain for JS projects | Requires a real project/site first; manual review. |
| **DigitalPlat FreeDomain** (.dpdns.org / .us.kg / .qzz.io / .xx.kg) | **Free, open-source domain registry**, works with Cloudflare DNS (verified Aug-Oct 2025 buzz + Cloudflare community) | us.kg was shut down to new registrations at one point, then relaunched under domain.digitalplat.org. GitHub-profile KYC required. Reports of intermittent DNS delegation issues (May 2026). **Treat as bonus, never load-bearing.** |
| **.xyz / .top / .sbs first-year promos** | **~$1-2 first year**, then $10-15/yr renewal | Cheapest credible path: pay ~$1-2/yr; renewal is the real cost. |
| **Cloudflare Registrar** | At-cost (≈$10/yr .com) — no markup, **free DNS forever on any plan** | Requires using CF nameservers; card needed to buy, not to use DNS. |
| **SEO/trust risk of free subdomains?** | Minor for tools audience | Free subdomains (is-a.dev etc.) occasionally flagged in spam filters & some APIs reject them; **custom domain strongly recommended for anything handling OAuth callbacks, email sending (SPF/DKIM), or ad networks.** Email senders MUST have own domain (Resend/Brevo require custom domain for decent deliverability). |

**Sources:** domain.digitalplat.org; w3era.com (Aug 2025); themenonlab.blog (Jul 2026); community.cloudflare.com dpdns delegation thread (May 2026); reddit (Aug 2025). **Date checked:** 2026-09-02. 🟡

---

## 13. Telegram Bot API

| Item | What's free | Limits | Notes |
|---|---|---|---|
| **Bot API** | 100% free, no card, unlimited bots | **Official FAQ: ~30 messages/sec broadcast to different chats; 20 messages/min per group; 1 msg/sec per private chat** (429 + retry_after when hit) | Official core.telegram.org/bots/faq, stable for years. Note: one tdlib maintainer disputes a hard "30/sec" — treat as pacing guidance, honor retry_after. |
| **File API** | Download up to **20MB** via standard Bot API | Bots can't download >20MB (upload to bots 50MB) | For bigger files: proxy via R2 or use MTProto (user sessions). |
| **Webhooks vs polling** | Both free | Webhook needs HTTPS endpoint (CF Worker/Pages Function = perfect, free SSL); polling needs an always-on process — bad fit for serverless | Webhook on a Cloudflare Worker = the canonical $0 Telegram bot stack. |
| **Mini Apps** | Free; **HTTPS static hosting is sufficient** (initData validated client-side + server signature check) | — | Host Mini App frontends on CF Pages; validate Telegram initData HMAC in a Worker. |
| **Payments/stars** | Free to integrate | Revenue share on Stars | — |

**Sources:** core.telegram.org/bots/faq (official, checked 2026-09-02); grammy.dev flood-limit guide (Nov 2024). Confidence: high (limits stable for years). ✅

---

## 14. Edge data / queues (Upstash, CF)

| Service | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Upstash Redis** | Free: **500,000 commands/month** (changed Mar 2025 from 10k/day), 256MB, 1 region, 10GB bandwidth | Monthly cap ≈ 16k commands/day avg | ❌ | Official blog Mar 2025. Cache-friendly design required; use CF KV for read-heavy, Redis for rate-limits/locks. |
| **Upstash Kafka** | Free tier exists (🟡 limited topics/partitions) | Small | ❌ | Rarely needed at $0 scale; QStash simpler. |
| **Upstash QStash** | Free: **1,000 messages/day** (GA Oct 2025), 7-day max delay | Schedules + retries + callbacks | ❌ | The missing "queue" for serverless. |
| **Cloudflare Queues** | ✅ **FREE since Feb 4, 2026**: 10,000 ops/day | Paid: 1M ops/mo included | ❌ | Verified via official changelog. |
| **Durable Objects** | Free tier includes DOs w/ SQLite storage (limited) 🟡 | — | ❌ | Great for rate limiters/coordination. |

---

## The $0 Reference Stack (synthesis)

- **Compute/API/Bots:** Cloudflare Workers (100k req/day) + Cron Triggers; GitHub Actions for heavy batch (public repos, unlimited).
- **Static/Mini Apps:** Cloudflare Pages (unlimited bandwidth) + GitHub Pages fallback.
- **DB:** D1 (5M reads/day) for edge SQL · Turso (500M reads/mo) for scale · Neon for real Postgres · Supabase only if auth+storage bundle needed (heartbeat cron mandatory) · Atlas M0 for Mongo.
- **Email:** Resend (100/day) + Brevo (300/day) as overflow — both need a custom domain for deliverability.
- **Cron:** CF Cron (reliable) > cron-job.org (external watchdog) > GH Actions scheduled (best-effort, unreliable timing).
- **Monitoring:** UptimeRobot (50 monitors, out) + healthchecks.io (20 checks, in, dead-man switch).
- **Queue:** CF Queues (10k ops/day, NEW free Feb 2026) or QStash (1k msgs/day).
- **Auth:** Supabase Auth (50k MAU) or Firebase Auth; Clerk for polish.
- **Analytics:** CF Web Analytics + self-hosted Umami.
- **Domain:** spend the $1-2/yr on a .xyz/.top — it unlocks email deliverability + OAuth + trust.

---
## Verification Ledger (searches run 2026-09-02)

| # | Topic | Status |
|---|---|---|
| 1 | Cloudflare Workers/Pages/KV/D1/R2/Queues/Cron/Web Analytics | ✅ official docs verified |
| 2 | Vercel Hobby (invocations, 100GB bw, cron 1/day, non-commercial) | ✅ |
| 3 | Render 750h/15-min spin-down/5GB bw (2026) / Fly no-free / Railway $5-30d trial | ✅ |
| 4 | Supabase (2 projects, 500MB, 7-day pause) / Neon (100 CU-hr, 5-min autosuspend) / Turso (500M reads, 10M writes, 5GB) / Atlas M0 (512MB, no card) | ✅ |
| 5 | GitHub Actions 2000 min private/unlimited public; schedule delays (official docs); Pages 100GB soft; API 60/5000 per hr; Codespaces 120 core-hrs + 15GB | ✅ |
| 6 | Netlify 300-credit hard cap (~15GB) ⚠️ / surge.sh free / CF Pages best | ✅ |
| 7 | Resend 100/day+3000/mo; Brevo 300/day; SendGrid free RETIRED Jul 2025; Mailgun trial-only; EmailJS 200/mo; SMTP2GO 1000/mo | ✅ |
| 8 | GH Actions cron unreliable; cron-job.org unlimited jobs/1-min; QStash 1000/day; Vercel cron 1/day | ✅ |
| 9 | UptimeRobot 50×5min; Better Stack 10; healthchecks.io 20 | ✅ |
| 10 | Clerk 10k MAU (50k claim 🟡); Auth0 25k; Supabase 50k; Firebase 50k | ✅/🟡 |
| 11 | CF Web Analytics free; PostHog 1M events; GA free; Umami self-host; Plausible paid-only | ✅ |
| 12 | DigitalPlat (.dpdns.org/.us.kg) free w/ Cloudflare; eu.org slow; is-a.dev/js.org; .xyz/.top $1-2 yr-1; CF registrar at-cost | 🟡 |
| 13 | Telegram: 30 msg/sec broadcast, 20/min group, 20MB bot download, webhook on Workers, Mini Apps = HTTPS static OK | ✅ |
| 14 | Upstash Redis 500k cmd/mo (Mar 2025 change); QStash 1000/day; CF Queues FREE 10k ops/day (Feb 2026) | ✅ |

*(~30 web searches; 3 failed/retried due to API 429 rate-limiting mid-session. All numbers dated 2026-09-02.)*

---

# SECTION 4 — DISTRIBUTION + WEIRD MARKETS (Task 2-g)

# Research 2-g: Distribution Channels + Weird/Neglected Markets
Agent: research-distribution-weird | Budget context: $0, solo dev, Bangladesh, ecosystem of tiny automated web tools / Telegram bots, passive revenue.
Method: 30 web searches (z-ai web_search; ~5 extra attempts failed with 429 rate-limits and were retried after cooldown). All claims below are traceable to a URL found in search. Nothing invented; where evidence is weak it is marked E3 and flagged "validate".

Evidence levels: **E1** = direct community complaint / first-hand case data (multiple sources or strong single source). **E2** = single community mention, product-page claim, or indirect but concrete. **E3** = inference/hypothesis — validate before building.

---

## STREAM A — DISTRIBUTION CHANNELS (facts, with URLs)

### A1. Programmatic SEO for tool sites — works, but slow and riskier since 2024
- Reality: Case studies confirm large organic gains from template pages at scale. Suso Digital: SaaS client grew 1,920 → 9,571 users/mo (+398%) in 18 months via pSEO (https://susodigital.com/work/saas-programmatic-seo-case-study). Omnius: AI client 67 → 2,100 monthly signups in 10 months (https://www.omnius.so/blog/programmatic-seo-case-study). Canonical players: Zapier, Canva, G2, Tripadvisor templates (https://seomatic.ai/blog/programmatic-seo-examples, https://discoveredlabs.com/blog/programmatic-seo-examples-10-real-world-templates-that-drive-organic-growth).
- Timeline: New domains: 3–6 months to meaningful traction, 6–12+ months common (https://www.lucatagliaferro.com/how-long-does-seo-take, https://seosherpa.com/how-long-does-seo-take-to-work, r/DigitalMarketingHack Oct 2025: https://www.reddit.com/r/DigitalMarketingHack/comments/1nwz59r/). Indexing: 24–48h for established sites vs days for new (https://whitehat-seo.co.uk/blog/how-long-does-it-take-to-rank-on-google).
- Risks: March 2024 core update merged Helpful Content into core ranking; "very low-value, third-party content produced primarily for ranking purposes" targeted (https://blog.google/products-and-platforms/products/search/google-search-update-march-2024). Site Reputation Abuse policy (Nov 2024 update: https://developers.google.com/search/blog/2024/11/site-reputation-abuse) enforced May 5, 2024 (https://impact.com/affiliate/googles-updated-site-reputation-abuse-policy-on-affiliate-marketers). Real deindexing thread for "thin content with little or no added value" (Google support, Oct 2024: https://support.google.com/webmasters/thread/303787486/).
- Verdict: viable but must be *genuinely useful per-page* (real computation, unique data), not doorway templates. Target long-tail "X to Y converter"-class queries with near-zero competition; expect 6–12 months, not weeks.

### A2. Product Hunt — free, one-day spike, weak retention
- Reality: Good launches still produce numbers: one indie report: 5k unique visitors, 1,000+ signups in a day (https://www.indiehackers.com/post/so-i-guess-the-product-hunt-launch-is-still-worth-it-heres-why-and-how-b4757a04ab); another: 120+ signups + ongoing trickle (https://www.indiehackers.com/post/getting-to-the-top-on-product-hunt-detailed-and-honest-guide-after-3-failures-60bba547c9). Counterweight: "I analyzed 500 Product Hunt SaaS launches. 487 are dead" — PH is a marketing moment, not a growth engine (https://www.reddit.com/r/SaaS/comments/1mnc3nu/). Launch-day tactics (day-of-week matters) documented (https://www.indiehackers.com/post/product-hunt-launch-day-saturday-vs-tuesday-thursday-results-stats-0283f12ebb). Free alternatives with real traffic: Uneed, Peerlist, Indie Hackers, AlternativeTo, SaaSHub (https://www.reddit.com/r/GrowthHacking/comments/1tggcwt/; https://getlaunchlist.com/blog/product-hunt-alternatives).
- Requirements: free to launch; needs assets (gallery, one-line pitch, demo); even <20 upvotes forces positioning clarity (https://www.indiehackers.com:8443/post/launching-on-producthunt-what-do-people-experience-c417c35d73).

### A3. Tool directories — 260+ free listings, SEO backlinks, modest recurring traffic
- Reality: Curated lists of free directories: 260+ (https://www.position.digital/blog/saas-directories), 43 free B2B no-fee (https://blastra.io/directories/free-b2b-saas-directories), 700+ index (https://submitsaas.com/best-saas-directories), community-made 300+ list (https://www.indiehackers.com/post/i-made-a-list-of-300-software-submission-directories-to-submit-your-saas-38b080943a). Recommended starter set: Product Hunt, Indie Hackers, Peerlist, Uneed, AlternativeTo, SaaSHub (https://www.reddit.com/r/GrowthHacking/comments/1tggcwt/). AI-tool dirs (OpenFuture AI etc.) accept free submissions with "high-traffic" claims (https://aiso.blog/best-directories-ai-tools).
- Reality check: most directories = one-time backlink + long-tail referrer; AlternativeTo is the one general directory with real ongoing consumer search traffic. Time cost: ~2–5 min per listing; automatable batch. Free tier only.

### A4. Chrome Web Store — free listing, slow review, weak internal discovery
- Reality: Publish free; review takes "a few hours to several days" officially (https://dev.to/artem_turlenko/how-to-publish-your-chrome-extension-on-the-chrome-web-store-3p3e), but devs report multi-day "Pending Review" (https://www.reddit.com/r/chrome_extensions/comments/1h099ur/) and Google admitted surge-related delays (https://groups.google.com/a/chromium.org/g/chromium-extensions/c/VJ6DcpEn51Y/m/yuxvHWdwCAAJ). Featured status is evaluated *after* publishing, doesn't speed review (https://extensionbooster.net/blog/chrome-web-store-extension-review-time-2026-how-long-guide). Post-launch reality from 185,000-extension analysis: installs are usually low without external traffic (https://exstats.com/blog/published-first-chrome-extension-now-what).
- Verdict: treat CWS as a free secondary storefront + trust badge; drive traffic from the web tool itself ("Get the Chrome extension").

### A5. Telegram Mini Apps — real money rails (Stars + official ads), crypto-games cautionary tale
- Reality: Q1 2025: 75,000+ active Mini Apps, +200% YoY (https://www.linkedin.com/pulse/why-telegram-mini-apps-ads-skyrocketed-2025-dmytro-bandurenko--kwege). Mini Apps generated >$1B transaction volume in 2025, mostly gaming tokens/tap-to-earn (https://grambase.ai/blog/telegram-mini-apps-2026). Monetization options: Telegram Stars IAP, ads, subscriptions (https://omisoft.net/blog/how-to-monetize-telegram-mini-app). AdsGram = Telegram's official rewarded-ad network for TMAs (https://adsgram.ai/blog/adsgram/introduction-to-telegram-mini-apps-and-monetization-opportunities); Monetag SDK monetizes TMAs, $5 min payout (https://monetag.com/blog/telegram-mini-app-monetization-faq). Builder with 5M+ TMA users: "major apps make money through ads, Telegram sharing 50% of ad revenue in $TON" (https://www.blackhatworld.com/seo/key-insights-from-building-telegram-mini-apps-5m-users.1642231). Case study: $35k profit in 30 days on a TMA (vendor marketing, E3: https://richads.com/blog/how-to-create-telegram-mini-app-35k-profit-case-study).
- Tap-to-earn lesson: Hamster Kombat hit 300M players (https://www.wired.com) then suffered "dramatic user decline" once token rewards collapsed (https://coinmarketcap.com) → mercenary reward-farming traffic churns; utility tools retain better. Discovery inside Telegram remains weak (no evidence of an effective official catalog in results) → grow via channels (Channels/groups cross-promo, shareable bot outputs), not store-browse.
- Fit: exceptionally high for a Bangladesh dev — Telegram is dominant in BD/IND/RU/IRAN corridors; Stars handles payments where Stripe/PayPal can't.

### A6. GitHub — free hosting + discovery via trending/topics/awesome-lists
- Reality: Discovery surfaces: Topics pages (https://github.com/topics/open-source-project), Awesome lists index (https://github.com/sindresorhus/awesome) — getting into a topic-appropriate awesome list = permanent referral; niche example: Awesome-for-beginners invites maintainers to list projects (https://github.com/mungell/awesome-for-beginners). GitHub Pages hosts static tools free (md8-habibullah demo: https://md8-habibullah.github.io/top-github-repos-list). HN norms doc useful for Show HN launches (https://github.com/minimaxir/hacker-news-undocumented).
- License note: results didn't surface an MIT-vs-unlicensed traffic effect; keep MIT for tool repos (default). E3.

### A7. Reddit — 9:1 rule, per-sub rules, r/InternetIsBeautiful-style launches
- Reality: Site-wide guideline: "For every 1 self-promotional post, 9 other posts/comments should not be self-promotional" (official clarification: https://www.reddit.com/r/modnews/comments/2oamgp/; guide: https://www.reddit.com/r/reddit.com/wiki/selfpromotion). Sub-specific rules vary widely — some mods allow labeled self-promo from active members (https://www.reddit.com/r/rpg/comments/1mms2yu/), others ban it (https://www.reddit.com/r/ModSupport/comments/1rm7665/). Practitioner guides: 90/10 + shadowban warnings (https://redship.io/blog/reddit-self-promotion-rules, https://www.conbersa.ai/learn/reddit-self-promotion-rules). HN: Show HN works for dev tools if free/no-signup demo (https://www.markepear.dev/blog/dev-tool-hacker-news-launch; https://syften.com/blog/hacker-news-marketing).
- Fit: sustainable only with a value-first account (answer "how do I X" threads where the tool is the answer). Zero cost.

### A8. Viral output pattern — watermark-on-export is a documented growth loop
- Case study: Kapwing published "VIRAL: How We Used Watermarks to Grow our Startup" — every free export carried their brand into social feeds (https://www.kapwing.com/blog/viral-how-we-used-watermarks-to-grow-a-startup). Modern pricing confirms the free tier still watermark-gates (https://www.kapwing.com/pricing; https://piktochart.com/piktochart-video-vs-kapwing). remove.bg-style free-with-limits tools dominate comparison content (https://remove-bg.io/blog/best-free-background-removers-compared-2026).
- Fit: any tool whose output gets posted (slides, badges, schedules, memes, charts) should stamp a subtle "made with X" + URL. Costs nothing; compounds.

### A9. Embeddable widgets — other sites embed → passive backlinks + distribution
- Reality: Keywords Everywhere lets any webmaster embed 41 free SEO tools on their own site (live example of embed-as-distribution: https://keywordseverywhere.com/tools/embed). Free review-widget market exists (https://www.review-widget.net; demand thread: https://www.reddit.com/r/divi/comments/1dcy87b/). SEO mechanics of iframe embeds discussed (https://webmasters.stackexchange.com/questions/101410/; https://semanticmastery.com/iframe-backlinks-advanced-strategies-for-seo-success; Moz on widget backlinks: https://moz.com/blog/backlinks-maximize-benefits-avoid-problems-whiteboard-friday).
- Fit: build calculators/counters/widgets with an "Embed this" button + visible credit link. Passive, compounding.

### A10. Student/teacher word-of-mouth — free + no-signup wins classrooms
- Reality: Teachers actively push free tools to students in Facebook groups: "Scribbr's Citation Generators are 100% free, and no registration is required" (https://www.facebook.com/groups/418098809407362/posts/809523470264892); librarians champion the ad-free option MyBib (https://www.librarianinthemiddle.com/blog/the-best-free-citation-generator-for-students). Scribbr ships a Chrome extension for in-page capture (https://chromewebstore.google.com/detail/scribbr-citation-generato/epbobagokhieoonfplomdklollconnkl). Free seating-chart tools advertise "no login required" and no-signup as core features (https://www.schoolgpt.app/seating-chart-generator; https://openeducat.org/tools/seating-chart-maker).
- Lesson: for school markets, "free, no signup, works on a Chromebook, prints clean" beats features. Word-of-mouth via teacher groups = zero-CAC channel.

---

## STREAM B — WEIRD / NEGLECTED PAIN (evidence-locked rows)

### Cluster 1: Education & study tools (post-Quizlet-payworld, AI-conflict era)

**G1. Quizlet paywall betrayal — teachers can't assign study modes anymore**
- Audience: teachers (middle/high school, languages), students.
- Evidence: r/Teachers: "I rely heavily on Quizlet but now its main mode is no longer free so I can't expect students to use it" (https://www.reddit.com/r/Teachers/comments/x3a1lg/); r/quizlet: "extremely disappointed and saddened... two of their most essential learning tools locked behind a paywall" (https://www.reddit.com/r/quizlet/comments/w4hj5w/); teacher-alternatives threads (https://www.reddit.com/r/Teachers/comments/wz08g8/); Facebook parent groups asking for replacements (https://www.facebook.com/groups/142521982451528/posts/4451397564897260).
- EvidenceLevel: E1 | Frequency: seasonal spikes (every school year) | Severity: 7
- Workaround: Knowt (free, imports Quizlet sets), Cram, NoteKnight, StudyKit.
- Existing tools+price: Quizlet Plus subscription; Knowt free; Cram free-ish.
- Complaints: paywall moved core Learn/Test modes; students won't pay.
- Automation: flashcard app = pure CRUD + spaced repetition; trivial to automate; CSV/import-export.
- Distribution fit: r/Teachers (value-first), teacher FB groups, PH, "quizlet alternative" long-tail SEO.

**G2. Flashcard data portability — getting sets OUT of Quizlet**
- Audience: students migrating off Quizlet.
- Evidence: alternatives marketed on "import your existing Quizlet sets, so switching is easy" (https://kvistly.com/blog/best-quizlet-alternatives; https://studygenie.io/blog/quizlet-alternatives) — implies export friction is the switching barrier.
- EvidenceLevel: E2 | Frequency: constant during migrations | Severity: 5
- Workaround: manual copy-paste; per-tool importers.
- Existing: Knowt importer (free), Quizlet export gated.
- Complaints: export blocked/awkward since paywall.
- Automation: paste Quizlet set URL → parse → CSV/Anki/JSON. Small scraper tool.
- Distribution fit: "export quizlet to anki/csv" long-tail SEO; student word-of-mouth.

**G3. Citation formatting pain (students)**
- Audience: students, researchers.
- Evidence: Scribbr/EasyBib/MyBib compete on free formatting; teacher FB groups share "100% free, no registration" (https://www.facebook.com/groups/418098809407362/posts/809523470264892); librarian recommends MyBib for "FREE, no advertising sidebar, pop-up absent" (https://www.librarianinthemiddle.com/blog/the-best-free-citation-generator-for-students) — the complaint encoded there: existing free tools are ad-saturated.
- EvidenceLevel: E1 | Frequency: every assignment cycle | Severity: 5
- Workaround: manual style guides; ad-heavy free generators.
- Existing+price: Scribbr free (upsells), EasyBib (ads/paid tiers), MyBib free.
- Complaints: ads, popups, signup walls, paywalled export.
- Automation: pure formatting logic — ideal micro-tool; niche styles (Bangladesh university formats, Bangla-language sources) underserved.
- Distribution fit: massive evergreen search volume; embeddable; school word-of-mouth.

**G4. Hallucinated citations — verifying AI-generated references**
- Audience: students, professors, researchers, editors.
- Evidence: Nature-linked analysis: "Tens of thousands of publications from 2025 might include invalid references generated by AI" (r/technology thread: https://www.reddit.com/r/technology/comments/1sd0khs/); study: ChatGPT false-citation rates 6%–60% by domain (https://www.psypost.org/chatgpt-hallucinates-fake-but-plausible-scientific-citations-at-a-staggering-rate-study-finds); r/Professors: "My suspicion is that the references are AI hallucinations. But some seem partly real" (https://www.reddit.com/r/Professors/comments/1jsfh1d/; also https://www.reddit.com/r/Professors/comments/1nr0si7/); writers: "Got fake citations from Claude and ChatGPT. How do you handle?" (https://www.reddit.com/r/WritingWithAI/comments/1r9t75e/); LANL research library warning page (https://researchlibrary.lanl.gov/posts/beware-of-chat-gpt-generated-citations).
- EvidenceLevel: E1 | Frequency: rising with AI-assisted writing | Severity: 9 (academic misconduct risk)
- Workaround: manual DOI/Crossref/Google Scholar checking, one by one.
- Existing+price: Sourcely et al. push paid "verify sources" SaaS (https://www.sourcely.net/resources/ai-hallucinated-citations-spot-fake-sources-before-submit); no dominant free batch-verifier found in results.
- Complaints: checking is tedious; professors have no fast triage tool.
- Automation: paste reference list → resolve DOIs/ISBN/titles via Crossref/OpenLibrary/CrossRef APIs → ✅/⚠️ report. Batch, free, no signup. STRONG weird-gold.
- Distribution fit: r/Professors, r/GradSchool, HN Show HN, "check if citation is real" long-tail SEO.

**G5. AI-detector false positives — students need a provenance trail**
- Audience: students (esp. ESL/neurodivergent), teachers, districts.
- Evidence: r/Teachers: "False positives from AI detection in education destroyed my [relationship with students]... One of them cried in my office" (https://www.reddit.com/r/Teachers/comments/1oqozxw/); districts face lawsuits over false accusations (https://www.reddit.com/r/TexasTeachers/comments/1gbyvn6/); Turnitin revised FP rate 1%→4% after deployment; ESL students over-flagged (https://litero.ai/blog/visual-breakdown-false-positives-in-ai-detection-are-hitting-students-hard; https://www.linkedin.com/news/story/when-ai-cheat-detection-goes-wrong-6200812); student: "falsely accused... twice now in one class" (https://www.reddit.com/r/ChatGPT/comments/1d45xdo/); best detectors 85–90% accurate (https://www.reddit.com/r/Professors/comments/1g734zp/).
- EvidenceLevel: E1 | Frequency: constant since 2023 | Severity: 9
- Workaround: keeping Google Docs version history as evidence; screenshot drafts.
- Existing+price: AI detectors (Turnitin institutional, GPTZero etc.) — none serve the *defense* side well.
- Automation: "writing provenance" tool: timestamped draft snapshots / paste-doc → shareable evidence page. (NOT a "humanizer" — ethical line.) 
- Distribution fit: student word-of-mouth is explosive here; r/Teachers careful value-first post; PH.

**G6. De-slopping AI text (writers/marketers)**
- Audience: content marketers, copywriters, editors.
- Evidence: "the actual job became editing AI drafts and nobody warned me the editing is harder than the writing" (https://www.reddit.com/r/content_marketing/comments/1v39e5a/); "HOW TO REMOVE AI SLOP FROM YOUR WRITING" guides (https://www.reddit.com/r/WritingWithAI/comments/1toi0v2/); "AI slop is when you hand AI a topic, copy whatever it gives you, and post it" (https://www.reddit.com/r/DigitalMarketing/comments/1vsoipa/); cleanup guidance content (https://www.louisbouchard.ai/ai-editing).
- EvidenceLevel: E1 | Frequency: daily for AI-using writers | Severity: 6
- Workaround: manual line-editing against slop checklists.
- Existing+price: paid AI-humanizer/detector-evasion SaaS (sketchy); no respected free "slop linter" surfaced.
- Complaints: AI voice (em-dashes, "delve", symmetric sections, list bloat) is recognizable and embarrassing.
- Automation: paste text → static heuristic linter flags slop markers + suggests concrete fixes (no LLM cost). 
- Distribution fit: r/WritingWithAI, r/content_marketing (careful), HN, long-tail "AI words to avoid" SEO; output shareable.

**G7. AI code-slop review fatigue (dev teams)**
- Audience: senior devs / team leads.
- Evidence: "AI Slop PR's are burning me and my team out hard" (https://www.reddit.com/r/ExperiencedDevs/comments/1kr8clp/); "The one AI code review tool I saw was shockingly good at approving AI-generated slop" (same thread).
- EvidenceLevel: E1 | Frequency: daily in AI-using teams | Severity: 7
- Workaround: human review discipline; none good.
- Existing+price: AI code-review bots (paid) — ironically approve slop.
- Complaints: volume + plausible-but-wrong diffs.
- Automation: speculative (E3 on tool shape): diff simplifier / "smell checker" for AI PRs. Validate demand before building.
- Distribution fit: HN, r/ExperiencedDevs.

**G8. ChatGPT conversation export / backup mess**
- Audience: heavy ChatGPT users, prompt hoarders.
- Evidence: r/ChatGPTPro megathread on the many hacky export paths ("exports JSON and HTML files via email download") (https://www.reddit.com/r/ChatGPTPro/comments/1pe3rhn/); OpenAI community thread asking for full-thread export (https://community.openai.com/t/is-there-a-way-i-can-export-every-detail/1068326); genai.stackexchange: "save conversations as well-formatted PDFs... keeping code blocks, tables, and lists readable" (https://genai.stackexchange.com/questions/2810/); multiple third-party guides/extensions filling the gap (https://chromewebstore.google.com/detail/chatgpt-exporter-chatgpt/ilmdofdhpnhffldihboadndccenlnfll; https://tactiq.io/learn/export-chatgpt-conversation).
- EvidenceLevel: E1 | Frequency: ongoing; spikes when users hit context/plan limits | Severity: 5
- Workaround: print-to-PDF, browser extensions, copy-paste.
- Existing+price: several Chrome extensions (free/freemium).
- Complaints: formatting loss (code blocks, tables), JSON useless to non-devs.
- Automation: paste URL/JSON → clean Markdown/PDF. Also Claude/Gemini variants.
- Distribution fit: genai.stackexchange/Reddit answers, CWS extension, long-tail SEO.

### Cluster 2: Money-tracking micro-markets (spreadsheets that should be apps)

**G9. Landlord rent ledgers — especially IRREGULAR payments**
- Audience: small landlords (1–5 units), tenant screening disputes.
- Evidence: r/Landlord: "Can anyone suggest a basic and FREE software" (https://www.reddit.com/r/Landlord/comments/13rft38/); r/Landlord: income/expense tracking "starting to get overwhelming" (https://www.reddit.com/r/Landlord/comments/1hwh9u1/); r/AusPropertyChat: "tracking with a spreadsheet but because it's irregular payments it's difficult to work out what day they are paid up to" (https://www.reddit.com/r/AusPropertyChat/comments/1hy5dv3/); r/shitrentals DIY ledger formulas (https://www.reddit.com/r/shitrentals/comments/1cdgdfq/). People literally BUY tenant-ledger spreadsheets on Etsy (https://www.etsy.com/market/tenant_ledger_spreadsheet).
- EvidenceLevel: E1 | Frequency: monthly forever | Severity: 6
- Workaround: hand-built spreadsheets; bought templates; big property SaaS.
- Existing+price: Stessa free ledger template (lead-gen for SaaS: https://www.stessa.com/blog/rent-ledger-template), Obie template (https://www.obieinsurance.com/blog/fillable-rent-ledger-template), paid property mgmt SaaS.
- Complaints: SaaS is overkill for 2 units; spreadsheets break on arrears/partial payments.
- Automation: rent-ledger generator: rent amount + payment log → running "paid-to date", arrears, printable court-ready PDF. THE killer feature = irregular payments (evidence above).
- Distribution fit: r/Landlord value posts, "rent ledger template" SEO (proven search demand — everyone publishes templates), Etsy-style demand proves payment.

**G10. Gig-driver income/expense/mileage tracking**
- Audience: Uber/DoorDash/Instacart/Pathao drivers.
- Evidence: r/GigWork: "how do you keep track of how much you're making vs. what you're spending?" (https://www.reddit.com/r/GigWork/comments/1id6uyo/); a dev built MileLog "after getting tired of messy spreadsheets" and launched free on r/uberdrivers (https://www.reddit.com/r/uberdrivers/comments/1v023n5/); drivers share community-built spreadsheets tracking $/hour, $/mile, taxes, gas (https://www.reddit.com/r/DoorDashDrivers/comments/199idff/); app-roundups stress IRS-compliant reports (https://gridwise.io/blog/best-mileage-tracker-app).
- EvidenceLevel: E1 | Frequency: daily logging, tax-season spike | Severity: 6
- Workaround: spreadsheets; Stride (free mileage, US); Gridwise/Everlance (freemium).
- Existing+price: Stride free (US-centric), Gridwise/Everlance subscriptions.
- Complaints: US-only apps, over-featured, battery-hungry GPS; spreadsheets manual.
- Automation: $/hour-after-expenses calculator + CSV export; no-GPS manual entry web tool (works on any phone incl. BD riders — Angle: Pathao/foodpanda riders have NO tooling; validate, E3).
- Distribution fit: r/GigWork ecosystem already tolerates free tool launches (MileLog precedent), Telegram bots for rider groups in BD.

### Cluster 3: Community/volunteer ops (the "boring Sunday-night jobs")

**G11. Church announcement slides — rebuilt by hand every single week**
- Audience: church tech volunteers, small churches.
- Evidence: r/churchtech: "I started helping with the projection slides at our parish... honestly, it's way harder than it looks" (https://www.reddit.com/r/churchtech/comments/1qfu2fu/); small-church media FB groups discussing slide workflows (https://www.facebook.com/groups/Smallchurchmedia/posts/3295392383975837); vendor claims traditional approach takes "1–2 hours" weekly (https://gamma.app/explore/content/guides/best-tool-for-making-church-presentations); a paid SaaS exists purely to auto-generate announcement slides — proof of pain (https://tentapps.com/worship-announcement-slides); guide content ecosystem (https://localchurchmedia.com/blogs/local-church-media-blog/church-announcement-slides-that-people-actually-read).
- EvidenceLevel: E1 | Frequency: weekly, perpetual | Severity: 6
- Workaround: PowerPoint/Canva rebuilds; paid church presentation suites (ProPresenter/MediaShout class: https://www.renewedvision.com/blog/church-visual-software-your-guide-to-enhanced-services).
- Existing+price: Tent Apps (paid auto-gen), church presentation software ($$).
- Complaints: volunteer time; suites too complex/expensive for small parishes.
- Automation: paste announcement list → auto-styled 16:9 loop (HTML→PNG/PPTX), free tier with subtle credit. Outputs are projected publicly = built-in virality.
- Distribution fit: r/churchtech, FB small-church-media groups, church-tech directories.
- Adjacent hypothesis (E3, validate): mosques/Islamic centers (jummah announcement slides, prayer timetables, Ramadan schedules) — likely same pain, less tooling; BD-relevant.

**G12. Sports league scheduling for volunteers**
- Audience: rec-league organizers, school clubs.
- Evidence: many free generators already exist (LeagueLobster LITE: https://scheduler.leaguelobster.com; PlayPass: https://playpass.com/sports-software/league-scheduler; SportSchedulerPro: https://sportschedulerpro.com; bracketmaker.app) and r/ultimate still asks for open-source options (https://www.reddit.com/r/ultimate/comments/8a9add/). Market content war (https://www.fastbreak.ai/blog/best-sports-scheduling-software).
- EvidenceLevel: E2 | Frequency: seasonal | Severity: 4
- Verdict: crowded at the "generate round-robin" layer; differentiation must be standings+comms (WhatsApp/Telegram group export). Lower priority.

**G13. Worksheet / rubric generation for teachers**
- Audience: K-12 teachers.
- Evidence: AI worksheet generators now blanket the space (EssayGrader free worksheet maker: https://www.essaygrader.ai; FormsWrite marketing "stop spending hours creating practice materials": https://formswrite.com); rubric time-saving content: "make free rubrics by using editable online templates or free rubric-generator tools to do the heavy lifting" (https://www.kuraplan.com).
- EvidenceLevel: E2 | Frequency: weekly during term | Severity: 5
- Verdict: AI-generic worksheet gen is CROWDED (E2). Open angle: print-perfect, no-signup, *specific curriculum* generators (e.g., BD NCTB-aligned English/math worksheets, Bangla medium) — E3 to validate.
- Distribution fit: teacher FB groups, Pinterest/printable SEO, directories.

**G14. Seating charts / random group makers**
- Audience: K-12 teachers.
- Evidence: demand visible via competition + teacher asks: "Does anyone know of an AI tool for creating seating plans" (FB group, Dec 2024: https://www.facebook.com/groups/149348298190053/posts/389197830871764); "Trusted by 2000+ teachers" on a freemium tool (https://seatingchartmaker.app); an indie launched a free no-login GDPR-friendly generator on r/teachingresources (https://www.reddit.com/r/teachingresources/comments/1rbvuq3/); free no-signup tools proliferating (https://www.schoolgpt.app/seating-chart-generator; https://openeducat.org/tools/seating-chart-maker; https://classroomscreen.com/templates/seating-chart-maker; https://www.gradewithai.com/free-tools/seating-chart-generator).
- EvidenceLevel: E1 (demand proven) but semi-crowded | Frequency: each term/reshuffle | Severity: 4–5
- Automation: roster paste → constraints → printable chart; group randomizer with "no-repeat partner" logic.
- Distribution fit: teacher FB groups + "seating chart maker" SEO (competitive but long-tail constraints winnable).

**G15. Wedding planning spreadsheets (guest list hell)**
- Audience: couples on budgets.
- Evidence: r/weddingplanning constantly exchanges/begs for spreadsheets: template thread (https://www.reddit.com/r/weddingplanning/comments/1bz4g8n/), "Struggling with how to even start making a guest list" using Excel columns (https://www.reddit.com/r/weddingplanning/comments/1cn6i6p/), "Anyone have a wedding excel sheet organizer?" (https://www.reddit.com/r/weddingplanning/comments/l4y0lf/), a shared 36-page Google Sheets workbook (https://www.reddit.com/r/weddingplanning/comments/17qbrhh/), and a whole wiki page of curated spreadsheets on r/Weddingsunder35k (https://www.reddit.com/r/Weddingsunder35k/wiki/weddingplanningspreadsheets).
- EvidenceLevel: E1 | Frequency: evergreen (new cohort every year) | Severity: 5
- Workaround: inherited 36-tab spreadsheets.
- Existing+price: The Knot etc. (US-centric, signup-walled); Excel templates.
- Complaints: spreadsheet formulas break; RSVP tracking chaos.
- Automation: guest-list + RSVP + budget mini-app w/ printable exports; or gorgeous free spreadsheet templates as email-capture/SEO bait.
- Distribution fit: r/weddingplanning (template shares are culturally allowed), Pinterest, long-tail SEO.

### Cluster 4: Creators

**G16. Podcast show notes — "one of the most hated steps of podcasting"**
- Audience: indie podcasters.
- Evidence: School of Podcasting: "One of the most hated steps of podcasting is writing show notes" (https://www.schoolofpodcasting.com/tackling-show-notes-how-long-should-my-notes-be); r/podcasting thread on show-notes time sinks (https://www.reddit.com/r/podcasting/comments/1jf2kkn/); FB podcast groups polling time-to-write (https://www.facebook.com/groups/PodcastCommunity/posts/24891633817141919); AI generators exist but SaaS-priced (Castmagic/Podium/Swell AI head-to-head: https://thepodcasttechstack.substack.com/p/show-notes-generators-tested-which).
- EvidenceLevel: E1 | Frequency: weekly per show | Severity: 6
- Workaround: writing manually; paying SaaS subscriptions.
- Complaints: existing AI tools = another monthly subscription for hobbyists.
- Automation: paste transcript → timestamps + summary + title options + chapter marks, free single-episode tier.
- Distribution fit: r/podcasting, podcast FB groups, "show notes generator" SEO; output includes backlink.

### Cluster 5: Bangladesh / Global South specifics

**G17. BCS & competitive-exam prep: question banks exist, access costs**
- Audience: BD government-job aspirants (BCS, bank jobs, primary teacher).
- Evidence: scale of demand: Ogroshor claims "1,600,847+ questions" practice bank (https://ogroshor.com); Studypress markets "All BCS 10th–45th questions and solutions" (https://studypress.org); Android apps with 100k+ MCQs (https://play.google.com/store/apps/details?id=com.bcsprostuti.tanim.bcsprostuti; https://play.google.com/store/apps/details?id=com.onlineschool.bcsquestionbank). Direct pain quote: "I'm a graduate and willing to sit for the next BCS. Not in a position to afford coaching fees and multiple books right now. Please help me choosing the best question bank" (BCS is Fun FB group: https://www.facebook.com/groups/bcsisfun/posts/1075857126861748).
- EvidenceLevel: E2 | Frequency: continuous; huge population | Severity: 6
- Workaround: coaching centers, books, freemium apps.
- Existing+price: Ogroshor/Studypress/apps — freemium/paid tiers.
- Complaints: cost + app quality; fragmentation of past papers.
- Automation: free past-paper MCQ practice web app / Telegram quiz bot (Bangla UI), ads-monetized. Telegram = massive BD student usage.
- Distribution fit: Telegram channels (BCS prep channels are huge), FB groups, Play-store-free-web angle.

**G18. Bangla typing / Unicode on the web**
- Audience: BD/Indian Bengali writers, students, officials.
- Evidence: Avro Keyboard is the de-facto standard but is Windows-desktop (https://www.omicronlab.com/avro-keyboard.html; https://en.wikipedia.org/wiki/Avro_Keyboard); users hit broken-Unicode problems (Avro's own FB troubleshooting posts: https://www.facebook.com/avrokeyboard/posts/10152303772742286; Microsoft Q&A: "Problem with Unicode Typing" resolved via Avro: https://learn.microsoft.com/en-us/answers/questions/4174073/); OpenBangla Keyboard is the OSS alternative (https://github.com/codayon/openbangla-keyboard). Gap visible in results: no dominant *web-based* Avro-style phonetic transliterator surfaced; long-tail Bangla typing content farms exist (https://bangla.arifulsh.com/avro-keyboard-download/index.html).
- EvidenceLevel: E2 (ecosystem evidence; direct complaint threads thin) | Severity: 5
- Automation: web phonetic Bangla transliteration (client-side JS), Unicode↔Bijoy/legacy conversion (E3 hypothesis — legacy Bijoy→Unicode conversion is a known BD publishing need; validate), Bangla OCR for scanned question papers (E3).
- Distribution fit: Bangla long-tail SEO is nearly empty; BD FB groups; zero-competition advantage.

**G19. PTA / school-committee tracking (weak signal — validate)**
- Audience: PTA treasurers/volunteers.
- Evidence: only one strong artifact found: JP "PTA hell" attendance-tracking template post — "Saving you from the hell of PTA attendance tracking... Google Forms, Sheets and Apps Script" (https://note.com/s0uh3y/n/nc6552a14074b) (Japanese market, translated relevance).
- EvidenceLevel: E3 | Severity: 4 | Frequency: term-based
- Automation: attendance/dues tracker, fundraiser thermometers.
- Verdict: park until better evidence; likely subsumed by G11/G15-style volunteer pain.

### Cluster 6: The Excel meta-pattern (multiple rows above are the same disease)

**G20. Spreadsheets-as-products: people repeatedly ask "how do I build X in Excel/Sheets" — and PAY for templates**
- Audience: everyone above (landlords, gig drivers, couples, PTA).
- Evidence (meta): tenant-ledger spreadsheets are SOLD on Etsy (https://www.etsy.com/market/tenant_ledger_spreadsheet); gig drivers maintain community spreadsheets (https://www.reddit.com/r/DoorDashDrivers/comments/199idff/; https://www.facebook.com/groups/1457430271994284/posts/1695867808150528); wedding wiki curates spreadsheets (https://www.reddit.com/r/Weddingsunder35k/wiki/weddingplanningspreadsheets); landlords trade formula advice (https://www.reddit.com/r/shitrentals/comments/1cdgdfq/).
- EvidenceLevel: E1 (pattern-level) | Severity: 5 | Frequency: continuous
- Insight: every recurring spreadsheet request = a micro-tool spec with validated demand AND proven willingness to pay (template sales). Build the tool, give the spreadsheet away free for SEO/email capture.
- Distribution fit: exactly the long-tail "rent ledger template"-style queries; embeddable outputs.

**G21. Free review widgets for small-business sites (embed-distribution wedge)**
- Audience: small businesses/agencies.
- Evidence: r/divi: "Does anyone have recommendations for a free google review widget?" (https://www.reddit.com/r/divi/comments/1dcy87b/); free offerings compete on "100% free... 2 minutes, no coding" (https://www.review-widget.net; https://www.sociablekit.com/tutorials/embed-google-reviews-iframe); commercial leaders upsell hard (https://embedsocial.com/google-reviews-widget).
- EvidenceLevel: E2 | Severity: 4
- Automation: Google Places API → embeddable iframe/JS widget w/ credit link (A9 pattern).
- Distribution fit: widget embeds = compounding backlinks; WordPress/Wix tutorial SEO.

### Cluster 7: Explicit E3 hypotheses (no direct evidence found in this run — listed for follow-up validation only)
**G22. Mosque/Islamic-center tooling (announcement slides, prayer-time images, Ramadan schedule generators)** — adjacent to G11 evidence; BD-relevant. Validate in BD/UK Muslim FB groups.
**G23. Bijoy↔Unicode Bangla text conversion** — adjacent to G18 (legacy publishing in BD still uses Bijoy encoding); validate demand volume in BD publisher/typist groups.
**G24. BD gig-economy rider tooling (Pathao/foodpanda earnings + mileage)** — adjacent to G10; US apps don't cover BD; validate in rider FB groups.
**G25. "AI-generated code that doesn't run" fixer for non-devs (vibe-coders)** — adjacent to G7; validate in r/ChatGPTCoding-class communities (not searched this run).

---

## TOP SYNTHESIS (for the $0 BD solo dev)

**Distribution stack (in order of expected ROI/effort):**
1. **Embeddable widgets + watermark/credit on every output** (A8, A9) — passive, compounding, free.
2. **Tool directories batch-submit + Product Hunt one-shot** (A2, A3) — one weekend of work, permanent backlinks.
3. **Long-tail programmatic-ish SEO on zero-competition queries** (A1) — especially Bangla-language queries (G18: almost no competition); expect 6–12 months.
4. **Telegram-native tools/bots with Stars + AdsGram** (A5) — BD-audience-native, payment rails that actually work from Bangladesh.
5. **Value-first Reddit/HN answers** (A7) — the tool IS the answer to the exact complaint threads catalogued above.
6. **GitHub Pages + awesome-list placement** (A6) as free hosting/secondary surface; **CWS extensions** (A4) as free trust-badge storefronts.

**Weird-gold shortlist (evidence-weighted):**
1. **G4 citation-verify** (batch hallucination checker) — E1 pain, severity 9, no free incumbent, pure API automation.
2. **G9 irregular-payment rent ledger → court-ready PDF** — E1 pain + proven template purchases (G20).
3. **G5 student provenance/evidence trail vs AI-detector false positives** — E1, severity 9, explosive student word-of-mouth.
4. **G11 announcement-slide generator (church first, mosque adjacent)** — weekly recurring pain, projected output = free advertising (A8 loop).
5. **G17 Telegram BCS quiz bot** — massive BD audience, weak incumbents on Telegram specifically.
6. **G6 slop-linter** — zero-cost static heuristics, shareable output, HN-friendly.
7. **G8 chat-export cleaner** — proven multi-format demand; CWS + web.

---

# SECTION 5 — E-COMMERCE + SMB DOCUMENTS (Task 2-c)

# Research Task 2-c: E-Commerce Product Data & SMB Document Workflows — Real User Pain

Agent: research-ecom-smb | Date context: 2026 | Client profile: solo dev in Bangladesh, $0 budget, free infra, passive-revenue micro-tools.

Method: 23 web_search calls via z-ai CLI (0 permanent failures; searches spanned Reddit/forums/official docs/pricing pages). Evidence levels: **E1** = direct community post found; **E2** = official product/pricing/docs fact; **E3** = inference (labeled). Prices not verified on the vendor's own page are marked "reported". Cross-ref: task 2-a already covered bank-statement PDF→CSV depth; row C26 only adds the new trust angle.

---

## PART 1 — E-COMMERCE PRODUCT DATA (C1–C20)

### Cluster A — Shopify CSV / supplier feeds

ID: C1
Problem: "Supplier CSV import hell" — every supplier catalog update requires hours of manual fixing before Shopify accepts it: merged columns, wrong headers, images not importing, variants scrambled, "illegal quoting" errors.
Audience: Shopify dropshippers, small brands restocking from supplier spreadsheets (100–1000+ SKUs).
Evidence: r/SideProject: "I run a Shopify store with 800+ products. Every time I update inventory from my supplier's CSV, I spend 2-3 hours fixing errors: 'Illegal quoting…'" (E1). r/dropshipping: "Spent 4 hours yesterday fixing a stupid supplier CSV for Shopify — columns randomly merged, images not importing, variants all over the place" (E1). r/ShopifyeCommerce, r/InventoryManagement repeat the same question ("when a supplier sends you a messy CSV, what's your workflow?").
EvidenceLevel: E1
Sources: https://www.reddit.com/r/SideProject/comments/1oco9qg/ ; https://www.reddit.com/r/dropshipping/comments/1sijsa8/ ; https://www.reddit.com/r/ShopifyeCommerce/comments/1q7kpr2/ ; https://www.reddit.com/r/InventoryManagement/comments/1ucceuk/
Frequency: weekly per merchant (each restock); massive aggregate volume.
Severity: 8 — recurring hours lost on every restock cycle; blocks listing fresh stock.
Workaround: manual Excel cleanup, test-import 1 row first, Matrixify (see FACTS F5), paid mapping apps.
Existing: Portaim (AI supplier-CSV→Shopify importer, new), Matrixify $20–200/mo, syncX Stock Sync free–$7/mo, Excel wrangling.
Complaints: Apps are priced per-store monthly (painful at hobby scale); AI importers are new and untrusted; native importer is strict (see C3/C4).
Automation: MOSTLY DETERMINISTIC — header synonym mapping (Title/Name/Item → Handle+Title), price/stock column coercion, delimiter/encoding repair, image-URL extraction. AI only as optional fallback for weird headers.
Distribution: SEO on "supplier csv to shopify", r/dropshipping, r/shopify; Facebook Shopify-seller groups.

ID: C2
Problem: Shopify CSV image import fails silently at scale: ~half of image URLs "fail media", Dropbox/Google Drive share links don't import, multiple URLs in one cell break, and re-imports duplicate every image with new filenames.
Audience: Shopify merchants importing supplier catalogs or migrating from other platforms.
Evidence: r/shopify: "When I import the CSV file, around 50% of the images pull in OK, the rest give failed media errors" (E1). r/shopify: "my supplier sent me a dropbox link… I had to change the column to Image Src but the images don't import" (E1). r/shopify: "the CSV upload has repeated each image again and again with unique filenames" (E1). r/shopify: multi-image URLs "in one cell separated by…" (E1).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/shopify/comments/1j91yuv/ ; https://www.reddit.com/r/shopify/comments/ta9bsp/ ; https://www.reddit.com/r/shopify/comments/1gbcgx7/ ; https://www.reddit.com/r/shopify/comments/1tmkd3r/ ; https://www.reddit.com/r/shopify/comments/1pfb0yp/
Frequency: every bulk import; recurring.
Severity: 7 — products go live with missing images (lost sales); image duplication pollutes the Files library.
Workaround: host images on public HTTP URLs, one row per image, re-import. Shopify's own docs say images must be at publicly accessible https URLs (F1).
Existing: No dominant fixer; sheetimagedownloader.com (niche tool) writes about prepping URLs — space is open.
Complaints: Shopify gives no per-row reason for failed media; errors are discovered only after import.
Automation: DETERMINISTIC — validate URLs (HEAD request, content-type check, auth-wall detection e.g. dropbox.com→dl=1 conversion, split multi-URL cells, dedupe). Pure fetch logic, no AI.
Distribution: SEO "shopify csv images not importing", r/shopify.

ID: C3
Problem: Shopify rejects CSVs for invisible format reasons: non-UTF-8 encoding, illegal characters, wrong quoting — error messages are cryptic.
Audience: Non-technical merchants (the majority of complainers).
Evidence: Shopify's own help page "Solutions to common product CSV import problems" exists precisely because "this error is caused when there is an illegal character… your CSV file must be UTF-8" (E2). Third-party guide covers "10 most common Shopify CSV import errors, from UTF-8 encoding failures and broken…" (E2). r/shopify user "finally figured out why Shopify CSV imports fail… manually select UTF-8" (E1, also logged by task 2-a row A3).
EvidenceLevel: E2 (docs) + E1 (community)
Sources: https://help.shopify.com (Solutions to common product CSV import problems) ; https://biscuitsbundles.com/de/blogs/learn/shopify-csv-product-import-how-to-fix-the-10-most-common-errors-variants-images-encoding-and-more ; https://www.reddit.com/r/shopify/comments/1pax6pn/
Frequency: daily across merchants.
Severity: 6 — total blocker until fixed, but quick once diagnosed; diagnosis is the pain.
Workaround: Notepad "Save as UTF-8", avoid Excel re-saves, use Google Sheets export.
Existing: catalog-optimizer.com already sells a "Shopify CSV Import Error Fixer" — proof of WTP, but appears low-profile.
Complaints: Errors don't say which row/character; merchants loop on re-imports.
Automation: FULLY DETERMINISTIC — encoding detection, quote repair, illegal-char scrub, pre-flight validator that mimics Shopify's parser and reports row numbers.
Distribution: SEO on exact error strings (programmatic SEO goldmine per task 2-a pattern).

ID: C4
Problem: Shopify CSV variant semantics are unforgiving: sorting rows breaks variant↔image links, duplicate option values error out, one image per variant limit, Handle/Variant-ID bookkeeping overwrites or duplicates products.
Audience: Merchants with variant-heavy catalogs (apparel, sizes/colors).
Evidence: Shopify Community: "Variant image column ignored in CSV import… commonly occurs when someone sorts the CSV columns or rows before importing" (E1). Guide: "This error happens when a product has duplicate options… two variants of the same product have identical option values" (E2). Shopify Community: "Shopify supports multiple images per product, but each variant may have only 1" (E1). Shopify help: "Importing a CSV file that has been sorted by a spreadsheet editor might cause your products to be removed from their relevant image links" (E2).
EvidenceLevel: E1+E2
Sources: https://community.shopify.com/t/variant-image-column-ignored-in-csv-import/285604 ; https://biscuitsbundles.com (10 most common errors) ; https://community.shopify.com/t/csv-import-question-how-to-upload-multiple-variants-with-multiple-choices-with-multiple-pictures/172412 ; https://help.shopify.com/en/manual/products/import-export/import-products
Frequency: every variant-heavy import.
Severity: 7 — silent data corruption (wrong variant images/prices) worse than outright failure.
Workaround: never sort the export; keep Handle+Variant ID columns locked; Matrixify exports.
Complaints: "Why would sorting break it?" — semantics undocumented until damage done.
Automation: DETERMINISTIC — row-integrity validator (Handle continuity, variant-row grouping, option-value uniqueness, image-row adjacency) with a human-readable fix report.
Distribution: SEO, Shopify Community answers.

ID: C5
Problem: Shopify still has NO native way to import/edit metafields via product CSV — users resort to third-party apps and call it crazy.
Audience: Advanced Shopify sellers (B2B/wholesale/SEO fields), developers.
Evidence: r/shopify: "Unfortunately, there is no way to import metafields in a CSV file. You will need to manually set the metafield data" (E1). r/shopify: "I use Metafields Guru app… Drives me nuts that simple things like this aren't supported by Shopify" (E1). r/shopifyDev: "Quite painful to update metafields of thousands of variants; tried a few apps, they only take care of product metafields" (E1). Shopify dev community (Oct 2025): "there isn't a view where you can bulk update product variant metafields directly" (E1).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/shopify/comments/108mun8/ ; https://www.reddit.com/r/shopify/comments/19bwkh2/ ; https://www.reddit.com/r/shopifyDev/comments/1mmgjri/ ; https://community.shopify.dev/t/how-to-bulk-edit-product-variant-metafields-in-shopify/23443
Frequency: constant demand; recurring threads 2023→2025.
Severity: 7 — for catalog-heavy B2B sellers this is hundreds of manual edits.
Workaround: Metafields Guru (app), Matrixify export/import dance (community's top answer).
Complaints: Variant-level metafields especially unsupported; apps charge monthly.
Automation: DETERMINISTIC — CSV→Admin API mapper (metafields are typed key/value; no AI needed). Needs a Shopify store connection (OAuth app) — infra cost near zero.
Distribution: Shopify Community, r/shopifyDev, SEO "import metafields csv shopify".

ID: C6
Problem: Supplier price/stock scheduled sync: tiny dropshippers must periodically re-pull supplier CSV/FTP feeds and update Shopify price+inventory; manual process causes stale stock and overselling.
Audience: 1-person dropship operations with 1–5 suppliers.
Evidence: r/ShopifyeCommerce: "I source products from two different suppliers. Right now, when a customer places an order, I have to…" (manual chain, E1). Shopify Community: "What reliable app can replace Stock Sync for dropship stock updates?" (E1). syncX: Stock Sync markets exactly this ("scheduled updates from suppliers, warehouses, drop-shippers", E2).
EvidenceLevel: E1+E2
Sources: https://www.reddit.com/r/ShopifyeCommerce/comments/1m36clz/ ; https://community.shopify.com/t/what-reliable-app-can-replace-stock-sync-for-dropship-stock-updates/192086 ; https://help.stock-sync.com/en/article/understanding-stock-sync-hakupj
Frequency: daily/weekly per store.
Severity: 7 — overselling = refunds + bad reviews; stale prices = margin loss.
Workaround: manual weekly CSV imports; Stock Sync/syncX (free plan manual-only, paid from ~$5–7/mo, reported); Syncio (multi-store, ~$ free–paid tiers).
Complaints: Stock Sync free tier lacks automation (Shopify blog, E2); users complain apps "take care of product metafield only" or misfire on supplier format changes.
Automation: HYBRID — deterministic fetch+differential update; needs cron + Shopify API (fits free infra: CF Workers cron). AI not needed.
Distribution: Shopify app store SEO, r/dropshipping.

### Cluster B — Multichannel inventory & marketplace formats

ID: C7
Problem: Multichannel inventory sync (Shopify+Etsy+eBay+Amazon+POS) for tiny sellers = overselling risk; enterprise sync tools are overkill/too pricey, so sellers juggle spreadsheets.
Audience: Sellers on 2–4 channels, 50–500 SKUs (the "too small for Cin7" tier).
Evidence: r/woocommerce: "How are you handling inventory sync across multiple sales [channels]?" (E1). r/ecommerce: "One of the biggest challenges I'm facing is…" (E1). r/eCommerceSEO: 500 orders/month, 200 SKUs seller asks how to avoid overselling expanding to Shopify (E1). r/InventoryManagement: "Trying to keep each channel in sync directly is where the pain starts. Had a client selling handmade goods using Shopify POS in-…" (E1). Building-inventory-software market-research post r/ecommerce 103po0m attracted dozens of "yes this hurts" replies (E1).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/woocommerce/comments/1rrm4zl/ ; https://www.reddit.com/r/ecommerce/comments/s5d516/ ; https://www.reddit.com/r/eCommerceSEO/comments/1r9uzj6/ ; https://www.reddit.com/r/InventoryManagement/comments/1qucj8y/ ; https://www.reddit.com/r/ecommerce/comments/103po0m/
Frequency: daily; growing as sellers add channels.
Severity: 8 — overselling → cancellations → marketplace account penalties; emotional stress quoted repeatedly.
Workaround: buffer stock (under-list quantity), one channel as master, manual sync, Sellbrite/Cin7 (paid).
Existing: Cin7 Core, Linnworks, Sellbrite (all $$$/mo); no credible $0 tier for tiny sellers.
Complaints: "All the tools want $50+/mo or enterprise demo calls."
Automation: HYBRID — API polling/order-webhook sync is deterministic; needs API keys per channel (cost: free tiers of marketplaces; infra via CF Workers cron). High value, medium build complexity.
Distribution: r/EtsySellers, r/Flipping, r/ecommerce, SEO "sync inventory between etsy and shopify free".

ID: C8
Problem: Amazon error 8541 ("single matching error") blocks listing/edits when product ID matches an existing ASIN with conflicting attributes; fix workflow is arcane (flat file partial update, product ID toggling).
Audience: Amazon FBA/private-label sellers.
Evidence: Amazon Seller Forums: "This error is commonly referred to as a 'single matching error'…" (E1). r/FulfillmentByAmazon: "8541 Error? Anyone had this when editing their own [listing]… spelled the 'Scent' attribute incorrectly" (E1). LinkedIn consultant post: resolved "with Flat File and Seller [Support]" after title-catalog conflict (E1). Official help page G200692330 exists (E2).
EvidenceLevel: E1+E2
Sources: https://sellercentral.amazon.com/help/hub/reference/external/G200692330 ; https://sellercentral.amazon.com/seller-forums/discussions/t/f828dda0-136c-4bcb-9854-c4cedfcafdc4 ; https://www.reddit.com/r/FulfillmentByAmazon/comments/162acr8/ ; https://salesduo.com/blog/fix-amazon-error-8541
Frequency: extremely common Amazon listing error (multiple evergreen guides).
Severity: 8 — listing stuck = zero sales for that SKU; support tickets take days.
Workaround: flat-file partial update (Update column), correct brand/UPC fields, open case with catalog team.
Existing: Agency services (My Amazon Guy etc.) charge hundreds; no self-serve free tool.
Complaints: Amazon support gives copy-paste answers; sellers pay agencies to fix a 15-minute data problem.
Automation: DETERMINISTIC — 8541 flat-file generator: take ASIN + conflicting attribute → emit partial-update flat file. Template logic only.
Distribution: SEO "error 8541 fix", Seller Central forums, YouTube comments.

ID: C9
Problem: "Amazon flat file formatting is hell": category templates keep changing, one blank required field fails the whole row, Data Definitions tab archaeology, character limits per field.
Audience: All Amazon sellers doing bulk ops (even mid-size).
Evidence: r/FulfillmentByAmazon thread literally titled "Amazon flat file formatting is hell. Here are the field…" — top advice: "keep a 'clean master template' instead" (E1). Seller Forums: "If even one required field is left blank, the entire row will error out. Fix: Check the 'Data Definitions' tab… character limits on each field. Use your spreadsheet's LEN function to count characters" (E1). Official "Build your inventory file" doc G581 (E2).
EvidenceLevel: E1+E2
Sources: https://www.reddit.com/r/FulfillmentByAmazon/comments/1sjyubb/ ; https://sellercentral.amazon.com/seller-forums/discussions/t/fecb25a1-1dbc-4786-8d73-3482edc2a46e ; https://sellercentral.amazon.com/seller-forums/discussions/t/6535b2a6f779cc979f32206176bd964a ; https://sellercentral.amazon.com/help/hub/reference/external/G581
Frequency: every bulk upload; template churn adds spikes.
Severity: 8 — entire upload batches bounce; days of iteration.
Workaround: master template discipline, LEN() checks, category template diffing.
Existing: epinium/sellersprite SaaS (paid); no free validator.
Complaints: Templates differ per category AND per marketplace (US/IN/EU) and change without notice.
Automation: DETERMINISTIC — parse the category template's Data Definitions tab → generate a validator (required fields, max-length, enum lists). Fully scriptable; templates are xlsx.
Distribution: SEO "flat file error checker", r/FulfillmentByAmazon, seller forums.

ID: C10
Problem: Etsy has no real CSV import for listing edits; sellers enter variants by hand or pay for limited uploaders; Etsy's native CSV upload is new-listing-only and variant-awkward.
Audience: Etsy sellers (digital products, POD, vintage) with many variations.
Evidence: r/EtsySellers: "Entering variants by hand is AWFUL (CSV upload or copy…)" (E1). r/EtsySellers: "Etsy does not allow the importation of info into listings. Easy Listing Uploader is $6.99 per month but only works for same price variations" (E1). r/Etsy: "I want to upload multiple digital products… is there a way such as creating excel to do a mass upload?" (E1). Facebook Etsy-SEO group: "Anyone else spend way too much time manually uploading…" (E1).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/EtsySellers/comments/1ocj29p/ ; https://www.reddit.com/r/EtsySellers/comments/13nvswu/ ; https://www.reddit.com/r/Etsy/comments/1ru3at8/ ; https://www.facebook.com/groups/etsyseo/posts/1854155202140392
Frequency: every multi-variant listing; digital sellers batch-upload dozens.
Severity: 7 — hours per batch; $6.99/mo tool with narrow scope shows WTP.
Workaround: duplicate-listing copy trick (only works for identical variant sets), Exty.app/MyDesigns (paid), Etsy native "Upload Listings via CSV" for new listings.
Complaints: Uploaders choke on per-variant prices/files; digital-file attach still manual.
Automation: DETERMINISTIC — CSV→Etsy listing-API mapper (Etsy API v3 open). Needs OAuth but API free.
Distribution: r/EtsySellers, SEO "etsy bulk upload variations".

ID: C11
Problem: Etsy→Shopify migration silently loses variant pricing: Etsy CSV exports don't include variant prices, and Shopify's own migration path "messes up variant pricing".
Audience: Etsy sellers graduating to Shopify (classic growth path).
Evidence: r/Etsy: "Shopify's free migration tool seems to mess up variant pricing. CSV exports from Etsy don't include variant prices. Third-party apps are hit or…" (E1). r/Etsy: "we have over 500 listings and it would be extremely time consuming to upload each listing individually" (E1). r/printful: "I am finding this is AMAZINGLY tedious (I have around 300 products to move)" (E1). Shopify docs confirm the Etsy-export→CSV path exists (E2).
EvidenceLevel: E1+E2
Sources: https://www.reddit.com/r/Etsy/comments/1q7njlj/ ; https://www.reddit.com/r/Etsy/comments/lxq53t/ ; https://www.reddit.com/r/printful/comments/13zq84i/ ; https://help.shopify.com/en/manual/migrating-to-shopify/migrating-from-etsy
Frequency: every week some seller migrates; recurring thread pattern.
Severity: 7 — wrong prices on live store = immediate money loss/embarrassment.
Workaround: manual variant re-pricing; LitExtension/Cart2Cart (paid).
Complaints: The official free tool's biggest gap is exactly variant data.
Automation: DETERMINISTIC — Etsy CSV + (optional) Etsy API join to recover variant prices → emit Shopify-format CSV. Template transform, no AI.
Distribution: SEO "etsy to shopify migration variant prices", r/Etsy.

ID: C12
Problem: eBay bulk CSV (File Exchange/Seller Hub Reports) is finicky: misleading template labels (e.g., template column mislabeled "Originating Postal Code"), silent errors, Bulk Listing Editor bugs requiring cut/paste workarounds.
Audience: High-volume eBay sellers (flippers, media sellers with thousands of items).
Evidence: eBay Community: "Listings uploads require a Postal Code. The template you download from eBay incorrectly labels that column 'Originating Postal Code' and that error is repeated" (E1). r/Flipping: "Bulk upload is a pain to get going but once you do it's a bloody fast way" (E1). r/eBaySellers: "I keep getting error messages, and I'm honestly stuck… What would really help me is a working CSV template" (E1). r/Ebay: Bulk Listing Editor bug workaround via delete-save-paste (E1).
EvidenceLevel: E1
Sources: https://community.ebay.com/forum/seller-tools-57919/topic/ebay-reportsfile-exchange-bulk-upload-change-action-from-add-to-draft-template-107344 ; https://www.reddit.com/r/Flipping/comments/1jbg7bu/ ; https://www.reddit.com/r/eBaySellers/comments/1gwfxwd/ ; https://www.reddit.com/r/Ebay/comments/q1ekv6/
Frequency: every bulk session for media sellers.
Severity: 6 — friction is front-loaded (template learning), then OK; stuck users abandon bulk flow.
Workaround: community-shared working templates, Seller Hub single edits.
Complaints: eBay's own template is wrong; support answers are circular.
Automation: DETERMINISTIC — corrected template + validator + eBay CSV generator from any seller spreadsheet.
Distribution: eBay Community, r/Flipping, SEO "ebay csv template working".

ID: C13
Problem: Walmart Marketplace feed submissions are error-ridden and opaque: image links accepted one day, rejected the next; "missing attribute metadata" template errors; COMP errors unresolved for weeks.
Audience: Walmart marketplace sellers (growing channel for Amazon refugees).
Evidence: r/WalmartSellers: "My other problems are with my error-ridden feed submissions. One day Walmart will accept my image links and then the next day they'll reject…" (E1). r/WalmartSellers: "whenever I try to upload a footwear template I receive the error: Your file is missing an attribute metadata in Footwear tab. Please download…" (E1). r/WalmartSellers: "COMP error… two weeks now since I submitted a case, and Walmart support is still…" (E1). Sellenvo built an entire business post decoding "every Walmart rejection message" (E2 market signal).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/WalmartSellers/comments/cjwkmy/ ; https://www.reddit.com/r/WalmartSellers/comments/o17n0a/ ; https://www.reddit.com/r/WalmartSellers/comments/1mfvq4s/ ; https://sellenvo.com/why-walmart-listings-rejected
Frequency: recurring per seller; each template update re-breaks things.
Severity: 7 — items unlisted = no revenue; support black hole.
Workaround: re-download templates, clear sample data carefully, keep template versions.
Automation: DETERMINISTIC — Walmart item-spec template validator (schema in template's own Define Fields tab); error-code explainer lookup table.
Distribution: r/WalmartSellers, SEO "walmart feed error".

ID: C14
Problem: TikTok Shop bulk upload template is rigid ("Do not add or delete any rows or columns… will cause your upload to fail" — official) and TikTok↔Shopify product sync is manual/error-prone.
Audience: TikTok Shop sellers (fast-growing, often smallest/most non-technical sellers).
Evidence: TikTok Seller Central official bulk-listing doc (E2). r/TikTokshop: "I manually synced 10 items… with some mapping errors on a few of them" (E1). r/TikTokshop: registration/permission errors blocking product adds (E1).
EvidenceLevel: E1+E2
Sources: https://seller-us.tiktok.com (Add products via bulk listing) ; https://www.reddit.com/r/TikTokshop/comments/1mjaqmj/ ; https://www.reddit.com/r/TikTokshop/comments/1dxkhef/
Frequency: recurring; TikTok commerce still scaling.
Severity: 6 — friction but smaller catalogs typically.
Workaround: manual entry; Shopify TikTok app (1-way-ish).
Complaints: Template failures give little diagnostic info.
Automation: DETERMINISTIC — any-shopify-export → TikTok template converter; strict column guard rails.
Distribution: r/TikTokshop, TikTok-seller Facebook groups (they live there).

### Cluster C — Advertising feeds & product media

ID: C15
Problem: Google Merchant Center disapprovals spike suddenly and in bulk: price-mismatch, missing GTIN, misclassified policy flags (e.g., 530 products flagged "Alcoholic drinks" wrongly); fixes require per-attribute edits across the feed.
Audience: Any merchant running Shopping ads (incl. Shopify+Google-feed app users).
Evidence: r/PPC: "530 products disapproved because of Alcoholic drinks which they are not. MTN or GTIN. The best option would be to edit…" (E1). r/PPC: products "suddenly disapproved because of 'Violation of Shopping ads policy'" (E1). r/shopify: Google-feed errors when using Bold Discounts app (E1). Official: "Products with incorrect or missing GTIN… are disapproved" (E2). r/ecommerce classic: identifier_exists=FALSE workaround for no-GTIN products (E1).
EvidenceLevel: E1+E2
Sources: https://www.reddit.com/r/PPC/comments/15hfk1u/ ; https://www.reddit.com/r/PPC/comments/bjzj9j/ ; https://www.reddit.com/r/shopify/comments/1lm0acv/ ; https://support.google.com/merchants/answer/13693497 ; https://www.reddit.com/r/ecommerce/comments/3nzvfe/
Frequency: constant; disapproval waves on policy updates.
Severity: 8 — ads off = revenue off, immediately.
Workaround: Diagnostics tab CSV download + spreadsheet edits; identifier_exists patch; DataFeedWatch rules (paid).
Existing: DataFeedWatch from ~$59–64/mo (F6); feed tools price out micro-sellers.
Complaints: Bulk-fix UX is poor; merchants patch 500 rows by hand in spreadsheets.
Automation: DETERMINISTIC — diagnostics-CSV → fix-patch generator (add identifier_exists, correct price/availability, strip disallowed chars). No AI for 90% of error classes.
Distribution: r/PPC, r/googleads, SEO "merchant center disapproval fix".

ID: C16
Problem: Meta (Facebook/Instagram) catalog feeds fail with "missing or invalid" fields for half the catalog; duplicate IDs, invalid categories, blocked URLs; debugging inside Meta's UI is notoriously buggy.
Audience: SMBs running catalog/IG Shopping ads.
Evidence: r/ecommerce: "I have linked my catalogue from Shopify to Facebook. But half of my products are showing errors saying that I have missing or invalid…" (E1). AdNabu maintains "15+ Common Facebook Product Feed Errors And Their Fixes" (E2 signal of volume). r/FacebookAds: catalog-ads glitches requiring objective-switch workarounds (E1).
EvidenceLevel: E1+E2
Sources: https://www.reddit.com/r/ecommerce/comments/10jelm7/ ; https://blog.adnabu.com/facebook/common-facebook-product-feed-errors ; https://www.reddit.com/r/FacebookAds/comments/1ojzvu0/
Frequency: recurring per catalog refresh.
Severity: 6 — partial catalog live; time sink.
Workaround: Shopify feed apps (free tiers exist but push upsells), manual re-uploads.
Complaints: Meta error names ≠ actual causes.
Automation: DETERMINISTIC — pre-upload feed validator + error-code explainer (static mapping).
Distribution: r/FacebookAds, SEO "facebook catalog feed error".

ID: C17
Problem: Product-feed management tools price out tiny sellers: feed optimization starts ~$59–64/mo while small sellers just need error fixes + a few field rules.
Audience: Sub-$10k/mo merchants on Shopping ads.
Evidence: DataFeedWatch "starting at $59/mo" (own comparison page, E2) and $64/mo on BigCommerce app listing (E2); r/PPC thread hunting for cheaper feed optimization (E1). pricefy.io lists alternatives "from $39/mo" (E2).
EvidenceLevel: E2+E1
Sources: https://www.datafeedwatch.com/comparison/datafeedwatch-vs-feedonomics ; https://www.bigcommerce.com/apps/datafeedwatch ; https://www.reddit.com/r/PPC/comments/1n29u5a/
Frequency: every feed-tool evaluation.
Severity: 6 — not a blocker, but a permanent tax; users defer fixing feed errors.
Automation: deterministic rules engine (rename/strip/exclude/conditional fields) — this is literally what those tools do.
Distribution: comparison SEO ("datafeedwatch alternative free") — high-intent queries.

ID: C18
Problem: Bulk product-photo background removal & processing costs anger small catalogs: outsourcing $2–7/image, per-image SaaS fees ($0.20–$1.50) "add up extremely fast"; sellers want bulk/one-time/local processing.
Audience: Shopify/Etsy/Amazon sellers shooting their own products.
Evidence: r/productphotography: "I would consider outsourcing but the cost can be quite expensive… I can't afford $2-$7 an image" (E1). r/shopify: "$1.50 per image, is a bit too expensive" (E1). r/alternativeto: "$0.02 per image adds up extremely fast. So I built…" (E1 — builders keep entering because of price anger). r/shopify: "Product images are slowly killing my mojo. I need bulk…" (E1).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/productphotography/comments/1mg6ffw/ ; https://www.reddit.com/r/shopify/comments/kqs4a8/ ; https://www.reddit.com/r/alternativeto/comments/1q66787/ ; https://www.reddit.com/r/shopify/comments/1ulhbw3/
Frequency: per new collection/season.
Severity: 6 — money + tedium; 200-image catalog at $0.20 = $40/upload cycle.
Workaround: remove.bg ($12/40 credits, reported — F13), Canva Pro, Photoshop actions, Shopify free tools (limited).
Existing: remove.bg, Photoroom API, localbg.app (local processing — validates the local/deterministic angle).
Complaints: per-credit pricing; watermarks on free tiers; inconsistent cutouts need manual review anyway.
Automation: DETERMINISTIC RESIZE/TRIM/CROP + AI for cutouts. NOTE: cutout AI = paid API cost → violates $0-infra constraint for the AI part; resize/rename/format-convert/square-pad is 100% client-side and the actual bulk need.
Distribution: r/shopify, r/productphotography, SEO "bulk background removal free".

ID: C19
Problem: Cross-border listing localization: naive machine translation of listings wastes months (wrong frame: needs units, sizes, tone, compliance); human translation unaffordable; sellers are unsure if auto-translation is "enough".
Audience: Shopify/Amazon sellers expanding FR/DE/ES/LatAm.
Evidence: r/growmybusiness: "Translation is the wrong frame for this, and getting that wrong cost me about two months" (E1). r/ecommerce: "Should I translate or fully localize Shopify product content… tone, examples, units?" (E1). r/shopify: "Are you just auto-translating product descriptions, or…?" (E1). r/ecommerce: "Is auto-translating product pages enough to expand?" (E1).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/growmybusiness/comments/1vsuqnl/ ; https://www.reddit.com/r/ecommerce/comments/1nbov6i/ ; https://www.reddit.com/r/shopify/comments/1mks8pm/ ; https://www.reddit.com/r/ecommerce/comments/1j1afq3/
Frequency: per expansion (one-time-ish, high stakes).
Severity: 6 — costly mistakes, but episodic not daily.
Workaround: Shopify Translate & Adapt (free, needs review), Weglot (~$15+/mo, reported), DeepL DIY.
Complaints: AI translation is cheap now; the pain is *workflow* (CSV of 500 SKUs → translated → re-imported consistently with units/formats).
Automation: HYBRID — this one genuinely benefits from LLM, but glossary+units+format rules are deterministic wrapper. Cost: free-tier LLM APIs (see task 2-d findings) can serve small batches.
Distribution: r/ecommerce, SEO "translate product listings csv".

ID: C20
Problem: WooCommerce import monopoly pricing: WP All Import is "massive price tag" ($99–229/yr, reported) and users can't find decent alternatives; built-in Woo importer lacks scheduling/field-mapping power.
Audience: WooCommerce store owners importing supplier feeds.
Evidence: r/Wordpress: "WP All Import is consistently the most recommended… I can't find any decent alternatives. Is the massive price tag…" (E1). Breakdance review: free core, "starts at $99/year… $229" (E2, reported). WP Zinc competitor: "plans start around $199/year" (E2, reported).
EvidenceLevel: E1+E2
Sources: https://www.reddit.com/r/Wordpress/comments/1m1mu3l/ ; https://breakdance.com/import-woocommerce-products-from-excel ; https://www.wpzinc.com/wp-all-import-alternative
Frequency: evergreen evaluations.
Severity: 5 — cost grudge, not blocker; alternative-seeking is constant (SEO opportunity).
Automation: deterministic mapping plugin/CLI; distribution via wordpress.org free plugin + paid Pro.
Distribution: "wp all import alternative" SERP is full of competitors — proves search demand.

---

## PART 2 — SMB DOCUMENT WORKFLOWS (C21–C31)

### Cluster D — Money-in reconciliation & invoicing

ID: C21
Problem: Manually matching bank/UPI payments to invoices/orders — sellers literally work out "which combinations of invoice amounts add up to each payment amount" on weekends; UPI/direct-transfer payments arrive with no references.
Audience: Micro-businesses paid via bank transfer/UPI (India, BD, similar markets), service SMBs.
Evidence: r/smallbusiness: "Spent my Saturday manually matching 47 invoices to bank [transfers]… sitting there with a calculator trying to figure out which combinations of invoice amounts add up to each payment amount, it's ridiculous" (E1). r/smallbusiness: "We get a lot of payments directly into the bank (UPI / transfers)…" messy reconciliation (E1). r/smallbusiness: mother's business "manually compares supplier invoices against purchase orders and delivery receipts before paying them. Occasionally…" (E1).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/smallbusiness/comments/1qat837/ ; https://www.reddit.com/r/smallbusiness/comments/1sergd6/ ; https://www.reddit.com/r/smallbusiness/comments/1u265e4/
Frequency: weekly/monthly ritual.
Severity: 8 — hours of unpaid mental math; errors = real money lost.
Workaround: Excel VLOOKUP marathons, asking customers to resend references, tallying by hand.
Existing: accounting suites assume bank-feed auto-match (needs QBO/Xero + connected bank — unavailable for UPI/BD bank setups).
Complaints: No tool handles "one payment covers 3 invoices + rounding" subset-sum reality.
Automation: DETERMINISTIC ALGORITHM — fuzzy match on amount/date/reference + subset-sum for combos. This is a classic solver problem, zero AI. Killer free-tool candidate.
Distribution: r/smallbusiness, r/Bookkeeping, India/BD business communities; SEO "match payments to invoices excel".

ID: C22
Problem: Reconciling Stripe/PayPal/processor CSVs against bank settlements: fees, refunds, and payout netting make rows not line up; month-end becomes a "nightmare".
Audience: Online sellers/freelancers stacking 2–3 payment processors.
Evidence: r/smallbusiness: "How do you manage reconciliation between Stripe, PayPal…" — top answer: tool "lets me upload CSVs, then automatically matches deposits, refunds… flagging duplicates" (E1). r/smallbusiness: "Most people try to reconcile at month end which is why it compounds into a nightmare. The fix we use… is a Make.com scenario" (E1). r/fintech: "processor reports, bank settlements, and internal…" (E1).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/smallbusiness/comments/1l7sqqb/ ; https://www.reddit.com/r/smallbusiness/comments/1tq42ul/ ; https://www.reddit.com/r/fintech/comments/1t3w29b/
Frequency: monthly, compounding.
Severity: 7 — every unexplained cent costs time; bookkeeper fees.
Workaround: Make.com/Zapier scenarios (build skill required), spreadsheets.
Existing: Synder, Conductor etc. (paid SaaS).
Automation: DETERMINISTIC — fee/refund/net-amount math per processor CSV schema; pure transforms.
Distribution: r/smallbusiness, SEO "stripe payout reconciliation free".

ID: C23
Problem: Chasing unpaid invoices is socially awkward and un-systematized for freelancers: "I usually give a week's grace… then start contacting every day"; automated escalating reminders are the stated fix.
Audience: Freelancers/micro-agencies globally.
Evidence: r/freelancing: "How do you guys handle late invoice follow-ups?… I'll leave it another week, then start contacting every day" (E1). r/Freelancers: "What helped me was setting up automated reminders that escalate in tone the longer an invoice goes unpaid" (E1). r/Freelancers: "Chase them every 3 days… late payment increments" (E1). r/indiehackers: "automatic reminders, pause clause…" (E1).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/freelancing/comments/1uf2emx/ ; https://www.reddit.com/r/Freelancers/comments/1ta7ubl/ ; https://www.reddit.com/r/Freelancers/comments/1sj14r0/ ; https://www.reddit.com/r/indiehackers/comments/1ua99nn/
Frequency: per overdue invoice; chronic.
Severity: 7 — cash-flow + emotional drain; awkwardness causes under-chasing.
Workaround: calendar reminders, copy-paste email templates (many template blog posts = demand signal).
Existing: RemindFox (new niche product), invoicing-suite built-ins (but suite costs money & is overkill).
Complaints: Invoicing suites bundle reminders into $15+/mo plans; freelancers want standalone.
Automation: DETERMINISTIC — schedule + email templates + escalation ladder; cron + Resend/Brevo free tiers fit perfectly (task 2-e stack).
Distribution: r/freelance, r/indiehackers, SEO "polite invoice reminder template".

ID: C24
Problem: Monthly bookkeeping grind for micro-businesses: shoebox receipts, "lose their mind doing bookkeeping every month", accountants receiving piles of paper receipts.
Audience: Solo businesses, esp. cash-heavy and marketplace sellers.
Evidence: r/smallbusiness: "Anyone else lose their mind doing bookkeeping every month?… Seriously considering just becoming a cash-only business and keeping receipts in a shoebox at this point" (E1). r/smallbusiness: "Does anyone here do the shoebox method or just give [the accountant] receipts? That seems insane…" (E1). r/smallbusiness classic: "Help Handling All these F#@$&%# Receipts" — tried Entryless, "SO CLOSE! But they could not…" (E1).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/smallbusiness/comments/1noa6lt/ ; https://www.reddit.com/r/smallbusiness/comments/1pxatl0/ ; https://www.reddit.com/r/smallbusiness/comments/ezh7vx/
Frequency: monthly.
Severity: 7 — compliance risk + dread; "drowning" language.
Workaround: Shoeboxed (paid), Dext (see C25), accountant data-entry fees.
Automation: HYBRID — OCR needs AI (cost), but receipt rename/organize/date-sort + expense-CSV structuring is deterministic. AI-OCR at tiny volumes possible on free LLM vision tiers (task 2-d).
Distribution: r/smallbusiness, r/Bookkeeping.

ID: C25
Problem: Dext (receipt OCR incumbent) is "strictly pay-to-play" and overkill for tiny volumes: solo freelancers with 5–10 receipts/mo won't pay $13–27/mo; bookkeepers pay $200/mo tiers; overage fees per document.
Audience: Solo freelancers + small bookkeeping firms.
Evidence: Official pricing: "From $20.50 per month. From $13.00 per month. Or pay-as-you-go from $0.32/document" (E2). r/FreelancerAccounting: "Dext is strictly pay-to-play. For a solo freelancer with ten receipts a month, it's overkill and probably too expensive" (E1). r/Bookkeeping: "Are you buying it as a bookkeeper ($200/mo for 10) or business ($30/mo)? I exceed 250 receipts, they charge $.75 per extra" (E1). r/Bookkeeping: "Dext is too expensive for them… once you stop using their software you need to find a way to migrate your data" (E1).
EvidenceLevel: E2+E1
Sources: https://dext.com/us/business/pricing ; https://www.reddit.com/r/FreelancerAccounting/comments/1r44dtt/ ; https://www.reddit.com/r/Bookkeeping/comments/1j70bf9/ ; https://www.reddit.com/r/Bookkeeping/comments/1n0s0va/
Frequency: constant evaluation; per-receipt pain.
Severity: 6 — price umbrella leaves the 5-receipts/mo tier unserved.
Workaround: Hubdoc (free w/ Xero, being sunset in some regions — reported), manual entry.
Automation: HYBRID — receipt → structured CSV needs vision OCR; at 10 docs/mo free-tier vision LLMs cover it (see task 2-d: Groq/Gemini free vision quotas).
Distribution: r/Bookkeeping, "dext alternative free" SEO.

ID: C26
Problem: Bank-statement PDF→CSV: bookkeepers refuse "shady websites that claim to convert while also storing the data" — trust/privacy is the wedge (complements task 2-a's price-umbrella finding: DocuClipper ~$49.95/mo, MoneyThumb ~$299.95).
Audience: Bookkeepers/accountants (also freelancers for loan applications).
Evidence: r/Bookkeeping: "Is there a safe way to generate csv from these pdfs without using some shady websites that claim to convert while also storing the data?" (E1). r/QuickBooks: "Which online PDF to CSV website [do you use]" — endless tool-shopping (E1). r/Bookkeeping: AutoEntry recommended (paid, credits-based) (E1).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/Bookkeeping/comments/1pjdfab/ ; https://www.reddit.com/r/QuickBooks/comments/1iqyabi/ ; https://www.reddit.com/r/Bookkeeping/comments/1elodv8/
Frequency: every client onboarding (statement-heavy practices: weekly).
Severity: 8 — see task 2-a row set; the trust angle means "files never leave your browser" is a differentiator already proven by 2-a's FBI-warning finding.
Automation: HYBRID — client-side parsing for text PDFs (deterministic, private); OCR fallback needs AI.
Distribution: r/Bookkeeping; cross-sell with 2-a's converter plan.

ID: C27
Problem: QuickBooks Online hatred + pricing churn: "I hate QBO with every ounce of my being" (export/lock-in/price-hike complaints); sick-of-QB threads recur monthly; tiny businesses just need invoices+basic tracking, not $30+/mo suites.
Audience: Micro-businesses priced-out or burned by QBO.
Evidence: r/smallbusiness: "I hate QBO with every ounce of my being. The final straw was finding out yesterday that QBO can't simply export data into TurboTax" (E1). r/smallbusiness: "I'm sick of it. I'm constantly…" (cleaning company, E1). r/smallbusiness: "We are a small sole proprietorship. We need the basics, invoicing, estimates, AP/AR" (E1).
EvidenceLevel: E1
Sources: https://www.reddit.com/r/smallbusiness/comments/11h1ct1/ ; https://www.reddit.com/r/smallbusiness/comments/1r8c2ou/ ; https://www.reddit.com/r/smallbusiness/comments/1lm9h74/
Frequency: perpetual; every price hike spikes threads.
Severity: 6 — churn-seeking = openings for micro-tools at the edges (invoices, quotes, reminders) not a full-suite clone.
Workaround: Wave (free, US/CA only — gap elsewhere), Zoho Invoice (free — see F11), spreadsheets.
Complaints: price hikes + data hostage-taking + missing exports.
Automation: n/a — market context row.
Distribution: r/smallbusiness.

ID: C28
Problem: (Developing-market angle, partially inferred) Bangladesh/South-Asia micro-sellers keep records in manual khata notebooks or Excel; local-language/local-format accounting software is thin; bKash/wallet payment trails live in SMS and screenshots, not ledgers.
Audience: BD/IN/NG/ID micro-retailers, F-commerce (Facebook/WhatsApp) sellers.
Evidence: hishab.com.bd markets "Manual Khata vs Excel vs Business Software for Bangladeshi SMEs" (E2 — local vendor validating the market). accoru.com: "Best Accounting Software for Small Business in Bangladesh — from spreadsheets to local software" (E2). NBcTribe FB group sells spreadsheet-recordkeeping courses to small-business owners (E1 — demand for even spreadsheet skills). E3: no direct "bKash tracking tool" complaint thread found in this run.
EvidenceLevel: E2 + E3 (gap inferred)
Sources: https://www.hishab.com.bd/manual-vs-business-software-bangladesh ; https://accoru.com/blog/accounting-software-small-business-bangladesh ; https://www.facebook.com/groups/nbctribe/posts/1456173896123006
Frequency: daily practice.
Severity: 6 — tax/compliance (VAT/Mushak) + cash-blindness; but WTP low, distribution hard.
Automation: DETERMINISTIC — bKash/Upay SMS-log → ledger CSV; Mushak-format invoice PDF. Free tools + local SEO/Bengali content = distribution edge for a BD-based dev (language moat).
Distribution: Facebook groups (F-commerce lives there), Bengali SEO, bKash merchant communities.

ID: C29
Problem: WhatsApp-order chaos: sellers take 20–30 orders/day as chat messages; tracking in notebook/Excel/memory; no order numbers, missed orders, no payment status.
Audience: F-commerce/WhatsApp sellers in Global South (BD, IN, ID, LATAM, Africa).
Evidence: Facebook sellers group: "How do you all manage your WhatsApp orders? I see many sellers getting 20–30 messages a day. Do you use notebook / excel / just DMs?" (E1). r/StartUpIndia: "turning WhatsApp into a no-effort order management system with absolutely zero setup… but I…" (E1 — builders eyeing it). Porsa: "WhatsApp Business is perfect for conversations, but not for running a full ecommerce operation. Here's what breaks at scale" (E2). orders.app markets "reads every WhatsApp order out of the chat… Free to get" (E2).
EvidenceLevel: E1+E2
Sources: https://www.facebook.com/groups/1132272081049490/posts/1922621232014567 ; https://www.reddit.com/r/StartUpIndia/comments/1osphbp/ ; https://porsa.io/articles/whatsapp-business-commerce ; https://orders.app/whatsapp-order-management
Frequency: daily, all day.
Severity: 8 — direct revenue loss (missed/unfulfilled orders) at the heart of their business.
Workaround: notebooks, Google Forms links, WhatsApp Business catalog + labels (partial), manual copy-paste.
Existing: orders.app, Porsa, neartail (order forms) — emerging, mostly paid/free-试用 tiers; no dominant free tool.
Complaints: Official WhatsApp Business API pricing/approval scares micro-sellers; unofficial-API tools risk bans.
Automation: HYBRID — message→order structuring benefits from LLM, but WhatsApp export/chat-log → orders CSV can be deterministic (no API needed: parse exported chat .txt = zero ban risk, zero infra). STRONG free-tool candidate.
Distribution: WhatsApp/FB groups, Google Play, r/StartUpIndia.

ID: C30
Problem: Quotes/estimates for trades & service micro-biz: Jobber/Housecall Pro are priced for teams, not solo handymen; sellers cobble quotes in Word/Canva; follow-up on unaccepted quotes is manual.
Audience: Solo tradespeople (cleaners, handymen, tutors, photographers) incl. Global South freelancers.
Evidence: r/Contractor: "Does anyone use Jobber?… Used jobber for a year. Switched to Housecall Pro because it allows me to send multiple options on the same quote" (E1 — feature gap pain). r/handyman: "looking for a solid alternative to Jobber that's more affordable, check out FocusedQ" (E1). Long "15 Best Jobber Alternatives" listicles (E2 — churn signal). Jobber pricing not verified this run (reported ~$9–200/mo tiers by review sites).
EvidenceLevel: E1+E2
Sources: https://www.reddit.com/r/Contractor/comments/1s4e3wt/ ; https://www.reddit.com/r/handyman/comments/1cdpqmx/ ; https://www.getonecrew.com/post/jobber-alternative
Frequency: per job.
Severity: 5 — annoyance + lost follow-ups; WTP exists but low at solo tier.
Automation: DETERMINISTIC — quote PDF generator + status tracking + auto follow-up email (pairs with C23 engine).
Distribution: r/handyman, r/Contractor, local trades FB groups.

ID: C31
Problem: Spreadsheet-as-order/inventory-system ceiling: tiny sellers run entire ops on Excel/Google Sheets until it breaks (no multi-user, broken formulas, no audit trail) — they ask Reddit for "what do you actually use" rather than adopt paid suites.
Audience: Sub-100-orders/month sellers everywhere.
Evidence: r/ecommerce 103po0m: sellers describing spreadsheet-based multi-channel ops while a dev scouts building software (E1). r/InventoryManagement 1qfqhmd: "You want inventory, sales, returns, and stock levels to flow in real time across Shopify, Etsy, eBay… [most don't have it]" (E1). InvoiceSimple stat: "Roughly 30% of businesses still use spreadsheet software like Excel to keep track of business expenses" (E2).
EvidenceLevel: E1+E2
Sources: https://www.reddit.com/r/ecommerce/comments/103po0m/ ; https://www.reddit.com/r/InventoryManagement/comments/1qfqhmd/ ; https://www.invoicesimple.com/blog/how-to-keep-track-of-business-expenses
Frequency: universal at micro scale.
Severity: 6 — errors are small but constant; growth cliff.
Automation: n/a meta-row: every C-row above can be delivered as "fixes your spreadsheet workflow" — sheet-in/CSV-out is the right interface for this audience.
Distribution: all channels above.

---

## FACTS — verified/pricing references (F1–F14)

- F1. Shopify CSV rules (official): images "must be uploaded to a publicly accessible URL… https:// protocol with no password protection"; multiple images = one row per image; sorted CSVs can break image links; Handle is the primary key. https://help.shopify.com/en/manual/products/import-export/using-csv ; https://help.shopify.com/en/manual/products/import-export/import-products
- F2. Shopify official troubleshooting page for CSV imports (illegal character → must be UTF-8; image URL must start with http(s) and be publicly accessible). https://help.shopify.com (Solutions to common product CSV import problems)
- F3. Amazon Error 8541 = "single matching error" (Product ID matches existing ASIN w/ conflict); official fix doc. https://sellercentral.amazon.com/help/hub/reference/external/G200692330
- F4. Amazon flat files: category templates with "Data Definitions" tab; one blank required field fails the whole row; per-field character limits; Update/Delete column controls row behavior. https://sellercentral.amazon.com/help/hub/reference/external/G581 ; https://sellercentral.amazon.com/seller-forums/discussions/t/fecb25a1-1dbc-4786-8d73-3482edc2a46e
- F5. Matrixify (top Shopify bulk import/export app) pricing: free Demo plan + paid tiers $20 / $50 / $200 per month (reported by appstoreresearch Jul 2026; primary = https://matrixify.app/pricing).
- F6. DataFeedWatch pricing: "starting at $59/mo" (own comparison page) / $64/mo (BigCommerce app listing); 15-day free trial. https://www.datafeedwatch.com/comparison/datafeedwatch-vs-feedonomics ; https://www.bigcommerce.com/apps/datafeedwatch
- F7. Etsy: no import of info into EXISTING listings; "Easy Listing Uploader is $6.99 per month but only works for same price variations" (community-reported). Native CSV upload (Shop Manager → Settings) covers NEW listings incl. variations. https://www.reddit.com/r/EtsySellers/comments/13nvswu/ ; https://mydesigns.io/blog/how-to-bulk-upload-products-to-etsy
- F8. Etsy CSV export lacks variant prices; Shopify's free Etsy migration "messes up variant pricing" (user-reported). https://www.reddit.com/r/Etsy/comments/1q7njlj/
- F9. WP All Import: free core plugin; paid from ~$99/yr up to $229 (review sites; exact tiering unverified). https://wordpress.org/plugins/wp-all-import ; https://breakdance.com/import-woocommerce-products-from-excel
- F10. Dext pricing (official): from $13–$20.50/mo, or pay-as-you-go $0.32/document. https://dext.com/us/business/pricing
- F11. Zoho Invoice: completely free forever ("no credit cards, no ads, no hidden fees"). https://www.zoho.com/us/invoice/pricing — implication: generic invoice GENERATION is a saturated free market; only format-specific/localized angles (VAT/Mushak/GST, e-invoice XML) differentiate.
- F12. Wave (US/CA): Starter free unlimited invoicing; Pro $19/mo (reported by checkthat.ai 2026; waveapps.com primary). Wave unavailability outside US/CA = gap for BD/IN micro-sellers.
- F13. remove.bg: $0.195–$1.00 per credit depending on plan (competitor analysis, Feb 2026); ~$12/mo for 40 credits elsewhere reported. Mark: reported, not vendor-verified this run. https://www.simplypng.app/en/alternatives/remove-bg ; https://kamero.ai/resources/stop-paying-for-background-removal
- F14. TikTok Shop bulk listing (official): template rows/columns must not be added/deleted or the upload fails; failed-entries report returned. https://seller-us.tiktok.com

---

## CROSS-CUTTING PATTERNS (for synthesis agent)

1. **Strict-format gatekeepers create a validator/fixer economy.** Shopify, Amazon, Walmart, TikTok, Google, Meta each ship a rigid template + cryptic errors. Every platform spawns "10 most common errors" guides (demand proof) and a couple of paid fixer SaaS. A single client-side "feed pre-flight validator" engine with per-platform profiles (Shopify/Amazon/Walmart/TikTok/GMC/Meta) is one codebase, many SEO landing pages.
2. **Deterministic > AI for 80% of these pains**: template transforms, encoding/URL/variant validation, subset-sum payment matching, fee-aware reconciliation. AI is genuinely needed only for: OCR receipts (C24/C25), WhatsApp message→order structuring (C29), translation (C19) — all servable on free-tier LLMs per task 2-d.
3. **Price umbrellas everywhere**: DataFeedWatch $59+, Matrixify $20+, WP All Import $99+, Dext $13+, DocuClipper $49.95+ (2-a). The "free forever, client-side, files-never-uploaded" wedge is validated by the r/Bookkeeping "shady websites" quote (C26).
4. **Trust + privacy is a marketable feature** (C26; also 2-a FBI finding). Client-side WASM/JS processing is the differentiator, not just price.
5. **Global-South distribution edge for a BD dev**: WhatsApp-order tools (C29), UPI/bKash reconciliation (C21), Bengali/local-format invoicing (C28) — incumbents ignore these; Facebook-group/word-of-mouth distribution (task 2-g) applies.
6. **Cross-row combos**: C23+C30 share one reminder engine; C1+C4+C5 share one Shopify-CSV engine; C7+C22 share one CSV-matching engine; C15+C16+C17 share one feed-fix engine.

## HONESTY NOTES
- Prices marked "reported" came from review/competitor sites, not vendor pages (F9, F12, F13, part of F5).
- C28 gap is E3 (inference) — no direct complaint thread found for bKash tracking in this run.
- Reddit thread URLs cited at comment-ID level from search results; quotes are from search snippets (same practice as prior agents). Dates absent where platforms didn't expose them.
- Overlap: C26 overlaps task 2-a's bank-statement cluster (kept for the new trust evidence only).

---

# SECTION 6 — BANGLADESH PAYMENT RAILS (Task 2-f)

# PAYMENTS RESEARCH — BD dev, no bank account, no card (bKash / Nagad / Rocket / crypto only)

Task ID: 2-f | Agent: research-payments | Date of research: 2026-09-02
Scope: which revenue rails actually work end-to-end (earn → cash to hand) for a Bangladesh-based solo dev of free web micro-tools + Telegram bots/mini-apps, with NO bank account and NO card. Can receive: bKash, Nagad, Rocket, TON/GRAM, BTC, USDT.
Evidence tags: E1 = official/first-party doc (priced/dated), E2 = reputable secondary, E3 = community report/anecdote. All URLs checked via live web search on 2026-09-02 (recency filters used for policy questions).

---

## 0. LEGAL BASELINE — CRYPTO IN BANGLADESH (read first)

- Bangladesh Bank (central bank) 2017 notice: cryptocurrencies are NOT legal tender; transactions "not authorized" under Foreign Exchange Regulation Act 1947 and Money Laundering Prevention Act. Reaffirmed in 2022 FX regulations ("virtual currencies not permitted"). [E2: lightspark.com "Is Crypto Legal in Bangladesh" Aug 2025; freemanlaw.com; en.wikipedia.org Legality_of_cryptocurrency; disruptionbanking.com Dec 2025]
- No specific criminal statute bans individual possession/holding; it is a "legal grey zone" — no licensing, no consumer protection, and P2P crypto trading is nonetheless widespread and booming (The Financial Express column, Jan 2026; TBS News "How crypto thrives in Bangladesh's legal grey zone"). [E2]
- Practical risks: (a) receiving money into bKash/Nagad from many unknown P2P counterparties can trigger AML flags/freezes on the MFS wallet — this is the real enforcement surface, not criminal prosecution of holding; (b) zero legal recourse in P2P scams; (c) policy could harden at any time.
- NET: holding/receiving crypto = grey zone, common, but treat as legally fragile; never flaunt, use one trusted counterparty where possible. [Confidence: HIGH on status; the operational risk is wallet freezes + scams]

Token note: Toncoin (TON) was renamed **GRAM (GRAM)** 1:1 effective 2026-06-15 after community vote (81% support). Blockchain still "The Open Network". All old "TON" payout literature now refers to GRAM. [E1: x.com/ton_blockchain Jun 9 2026; crypto.news Jun 26 2026; Binance Academy Jun 22 2026]

---

## 1. RAIL LEDGER

Format: Rail / Works for BD (no bank, no card)? / What's needed / Minimums / Fees / Timeline / Risk-Legality / Sources / Confidence

### R1. Telegram Stars (bot & mini-app paid features) → withdraw via Fragment → GRAM
- Works for BD: YES (payout to self-custody TON wallet; geography-independent).
- Needed: Telegram bot/mini-app with Stars-enabled paid features; connect Fragment payout to a TON wallet (Tonkeeper / Wallet in Telegram / TON Space).
- Minimums: 1,000 Stars minimum withdrawal (~US$13 at payout rate). 21-day hold per Star from receipt. [E2: grambase.ai Stars Guide Apr 2026; incrypted.com Jul 2026; web3.bitget.com academy Sep 2025; starsearn.com 2026]
- Fees/rates: payout pegged ≈ **$0.013 per Star** in GRAM via Fragment (users pay $0.02 in-app; ~$0.0133 via web) → embedded haircut vs in-app price ≈ 35%; Fragment market spread 2–3%; Fragment itself charges no additional withdrawal fee. [E2: popsters/Telegram announcement; tribute.top Aug 2026; telestars.io; starsearn.com]
- KYC: Mixed evidence. Fragment made KYC mandatory for PURCHASES Nov 2024 (dropstab.com Apr 2026). For WITHDRAWALS: starsearn 2026 says no KYC to a self-custody wallet; but multiple 2025 Reddit reports say Fragment/Telegram Wallet prompted KYC during withdrawal (r/Telegram "solved after I completed KYC… once for the wallet, once for the fragment"). Custodial Wallet-in-Telegram always requires KYC. Assume: possible KYC prompt; passport/NID suffices. [E2+E3]
- Timeline: 21-day hold → withdraw same day → GRAM in wallet in minutes.
- Risk: crypto legality grey zone (§0); rate tied to GRAM price until swapped.
- Sources: grambase.ai/blog/telegram-stars-guide-2026; incrypted.com/en/telegram-stars; help.wallet.tg/article/632; reddit r/Telegram threads (Aug 2025, Oct 2025). Confidence: HIGH on mechanics/MIN; MEDIUM on KYC.

### R2. Telegram channel Ads revenue share (Telegram Ad Platform → payout in GRAM via Fragment)
- Mechanics: public channels ≥1,000 subscribers that show Telegram sponsored ads keep 50% of ad revenue; payout in Toncoin (GRAM) via Fragment, same 1,000-min & 21-day style rules as Stars. Launched Mar 2024 in "nearly 100 countries". [E1: telegram.org/blog/monetization-for-channels Mar 31 2024; E2: theblock.co Feb 2024; scrile.com Aug 2026; autogram.ninja Apr 2026]
- BD eligibility: NOT explicitly confirmed in any official country list found. The monetization toggle appears in channel settings per-country. Action: check Statistics → Monetization in a BD account. AdsGram (R3) is the documented BD-safe alternative. Confidence: MEDIUM-LOW (works in many countries incl. South Asia; BD unconfirmed).

### R3. AdsGram — ads inside Telegram mini-apps/bots (TON Foundation-backed)
- Works for BD: YES — pays in **USDT on TON network** by default (also USDT TRC20 / fiat).
- Minimum: **$100** withdrawal; requests processed within 24h weekdays / 48h weekends; one smaller withdrawal per month allowed. [E1: adsgram.ai/monetization; adsgram.ai blog Aug 2026 comparisons]
- Fees: network fee only on payout; no stated commission (rev-share implied in CPM).
- Risk: crypto grey zone; $100 trapped until threshold. Confidence: HIGH.

### R4. USDT / GRAM → BDT off-ramp via P2P marketplaces (THE core off-ramp)
- Venues live for BD (all verified serving BDT):
  - **OKX P2P**: "Sell USDT to BDT — bKash, Nagad, Rocket" listed; "P2P trading on OKX is free" (0% platform fee). [E1: okx.com/p2p-markets/bdt/sell-usdt]
  - **Bybit P2P**: USDT/BTC↔BDT with bKash + Nagad payment methods; "Zero platform fees", escrow. [E1: bybit.com/en/p2p/sell/USDT/BDT; /en/p2p/buy/USDT/BDT]
  - **Binance P2P**: live bKash / Nagad / Rocket / bKash-Agent BDT markets (p2p.binance.com/en/trade/bkash etc.). BUT: Binance lists Bangladesh among restricted countries (leodex.io Jun 2026; datawallet.com Jul 2026); Mar 2025 policy: P2P Cash Zone closed, stricter P2P KYC. [E1 platform pages + E2 restrictions lists]
  - **NoOnes**: bKash-funded USDT P2P. [E2]
- KYC: exchange account requires full KYC (NID/passport) before P2P (Binance mandatory ID for trading/withdrawal — datawallet Jul 2026). Receiving crypto to a self-custody wallet needs no KYC; the EXCHANGE off-ramp does.
- Spreads/pricing: USDT ≈ BDT 122.7 (Coinbase converter Sep 2026) vs official interbank ≈ BDT 119.9/USD (Xoom) → selling USDT nets a **2–3.5% FX premium over the official rate** (this is the market rate; the "cost" vs your USD value is ~0 if sold at market, plus bKash receive is free).
- Scam risks: only trade inside escrow; never release crypto before bKash money lands IN YOUR WALLET (screenshot forgery is the classic BD P2P scam); prefer high-completion vendors; keep trade amounts modest to avoid AML flags.
- Risk-legality: grey zone (§0); Binance-BD restricted-country mismatch = platform risk.
- Confidence: HIGH (official P2P pages) / MEDIUM on longevity.

### R5. Direct international remittance → MFS wallet (bKash / Nagad / Rocket) WITHOUT a bank
- bKash: official "Money Transfer Service" — remittance from **150+ countries direct to a bKash wallet, 24/7, no bank account needed**; Western Union → bKash direct (westernunion.com/it/en/providers/bkash.html); remittance-flagged funds cash out from ATMs at **৳7 per ৳1,000 (0.7%)** (vs 1.49% normal ATM). [E1: bkash.com/en/products-services/money-transfer-service]
- Government incentive: **+2.5% cash incentive** on remittances received through legal channels into bank account or mobile wallet (bKash official; Taptap Send & WU pages confirm, Aug 2026). [E1/E2]
- Rocket (Dutch-Bangla): foreign remittance credited to Rocket account within 24–72h (DBBL Exchange House ~24h); WorldRemit and ACE Money Transfer support Rocket wallet. [E1: dutchbanglabank.com/rocket/foreign-remittance.html; worldremit Oct 2017; ACE Sep 2025]
- Nagad: MFS remains operational (received BB licence for interoperable payment system after the 2024 Nagad Digital Bank licence saga); MFS inward-remittance volumes tracked by BB. Use bKash as primary; Nagad as backup. [E2: TBS/Daily Star/Medium BD 2025-2026]
- Use case for the dev: a foreign client can pay you person-to-person via WU/MoneyGram/ACE/Taptap online → funds land in your bKash wallet in BDT. Legal channel, +2.5% incentive, 0.7% cash-out.
- Gotchas: sender fees + FX margin (~1.5–3.5% baked into WU/ACE rates); name on transfer must match bKash KYC; small frequent transfers invite questions; this is remittance — technically for family support, receiving client fees this way is a compliance grey area (though it's the legal rail most BD freelancers used pre-Payoneer).
- Confidence: HIGH on rails (official pages); MEDIUM on tax/compliance posture.

### R6. Payoneer → bKash (the "no-bank" fiat rail for global platforms)
- Official partnership: Payoneer ↔ bKash direct withdrawal, **min BDT 1,000, max BDT 250,000 per transaction**, "zero additional paperwork"; funds land in bKash in seconds; ATM cash-out of these remittance funds at ৳7/৳1,000 (0.7%). [E1: bkash.com/en/products-services/remittance/payoneer; payoneer.com/resources/business/weve-partnered-with-bkash; nsave.com Apr 2026]
- Fee: **Payoneer charges 3% conversion fee + $1 per withdrawal** (bKash official page); context: Payoneer's Mar 2025 fee restructuring put BD bank-withdrawal fee at ~3% too (community reports); receiving USD from marketplaces/platforms is free. [E1 bKash page + E3 FB groups]
- Account opening: NID/passport based (BD freelancer tutorials use NID); a local bank is NOT required if you withdraw to bKash; Payoneer also issues virtual Mastercard for online payments. [E2: LinkedIn NID tutorial; payoneer resources; Medium]
- Also: Payoneer card ATM withdrawal in BD possible ("withdraw at any ATM" — payoneer.com BD contractor page).
- Fee chain total to hand: ~3% + $1 (conversion) + 0.7% (cash-out) ≈ **3.7–4% per dollar** (+$29.95/yr account fee if not waived; receiving is free from partner platforms).
- Confidence: HIGH (first-party pages on both sides).

### R7. Crypto-native ad networks
- **Adsterra**: YES crypto payout — **USDT (TRC20/ERC20) & BTC via INXY payments**, minimum **$100**, ~1–2 business days, fee 1% + network (BTC) per Apr 2026 payout-terms summary; other methods: WebMoney/Paxum min **$5**, PayPal $100, local-currency payouts min $25 (Apr 2026 blog). The "$5 minimum" is WebMoney/Paxum ONLY — NOT crypto. [E2: adsterra.com/blog/payouts-in-local-currency Apr 27 2026; affiliatebooster; gologin; facebook groups Apr 2026; blackhatworld Nov 2024 (INXY USDT $100)]. Cashing WMZ/Paxum in BD is impractical → crypto USDT $100 min is the real rail. Confidence: HIGH.
- **A-Ads / AADS (aads.com)**: crypto-native, **no KYC**, pays daily-ish in BTC, min withdrawal **0.001 BTC** (~$110 at 2026 prices; historically lower — check live). Pays directly to your BTC wallet, no bank/exchange needed to RECEIVE. [E2: coinbound.io A-Ads review Dec 2025; blockchain-ads.com; bitmedia.io May 2025]. Confidence: MEDIUM-HIGH (legacy network, low CPMs).
- **PropellerAds**: min $5–$20 but methods = PayPal / Payoneer / Skrill / wire ($500–550 min); **NO crypto payouts** → for BD viable only via Payoneer (then bKash). [E2: propellerads blog Nov 2018 ($5); help.propellerads.com Jul 2026; payoneer.com/resources/business/propellerads (≥$20, wire $550)]. Confidence: HIGH.
- **Monetag** (PropellerAds sister for web/app): weekly payouts, min **$5**, PayPal/Payoneer/Skrill/wire → Payoneer path works for BD. [E2: hilltopads blog Mar 2026]. Confidence: MEDIUM.
- **Ezoic**: min **$20** (default; user-adjustable), methods PayPal / Payoneer / wire; no traffic minimum to join. PayPal unavailable BD → Payoneer path. PayPal route charges ~3.2%. NET ~30. [E1: support.ezoic.com KB "Ezoic Payments"; E2 buildersociety]. Confidence: HIGH.
- **Monumetric**: 10,000 pageviews/mo minimum to join; Net-60 payouts; not relevant for a new micro-tool site. [E2: bloggingguide.com Jan 2023; monumetric.com]. Confidence: MEDIUM.

### R8. Google AdSense
- Minimum payout **$100**; payment issued between the 21st–26th of the month AFTER threshold + no holds; first payout realistically 1–3 months after crossing $100 (plus 2–4 weeks for first-time PIN/address verification). [E1: support.google.com/adsense/answer/7164703; /answer/1709858]
- BD payment method: **wire transfer to a bank account** (support.google.com/adsense/answer/3372975). Western Union Quick Cash discontinued (legacy support page remains; WU removal confirmed by publishers ~2020–2021). Checks discontinued long ago.
- **Verdict: NOT viable without a bank account.** (Indirect hack = AdSense→someone else's/relative's bank, or via Wise/WorldFirst receiving account — WorldFirst markets AdSense receiving, but BD onboarding unclear + adds ToS risk. Not recommended.) [E1/E2]. Confidence: HIGH.

### R9. Digital-product platforms (sell templates/tools/ebooks)
- **Gumroad**: payouts = bank deposit OR PayPal ("For countries where bank deposits are not available, we offer PayPal…"; Payoneer/TransferWise explicitly NOT supported). **BD bank deposits were added** (community reports late 2024: "Gumroad now accepts direct bank transfer payout to Bangladesh"). Without a bank: PayPal is absent in BD → **blocked**. [E1: gumroad.com/help/article/13-getting-paid; E3: FB group Gumroad Bangladesh; LinkedIn Arshil Haque Dec 2024]. Confidence: HIGH.
- **Payhip**: pays via PayPal or Stripe only → **both unavailable BD → blocked**. [E1: payhip.com docs/blog]. HIGH.
- **Ko-fi**: "paid instantly into your own PayPal or Stripe account" → **blocked for BD**. [E1: help.ko-fi.com Jan 2025 + ko-fi.com]. HIGH.
- **Buy Me a Coffee**: payouts via Stripe Connect; supported-countries page (updated Aug 2026) = Stripe-availability list; BD not Stripe-supported → **blocked**. BD devs confirm (r/Dhaka: BMC, Ko-fi, Patreon "don't work in Bangladesh", 2025). [E1: help.buymeacoffee.com Aug 2026; E3 reddit]. HIGH.
- **Lemon Squeezy**: "You can sell if you can get paid into a bank or PayPal account in one of our supported countries" (bank payouts 79 countries + 200+ PayPal countries). BD has neither → **blocked** (unless BD is in the 79 bank countries — not evidenced; and you have no bank anyway). [E1: docs.lemonsqueezy.com/help/getting-started/getting-paid + /supported-countries]. HIGH.
- **Paddle** (Merchant of Record): payouts to sellers via **Payoneer** (documented how-tos; Reddit notes ~$15 payout charge) / bank / PayPal. MoR model means Paddle handles VAT/sales tax and accepts cards worldwide on your behalf. **BD sellers CAN route payouts to Payoneer → bKash.** Gate: Paddle seller verification (KYB: ID + website review; some BD devs report approval friction/delays). This is the only mainstream SaaS-checkout that plausibly works for you. [E2: wpsmartpay.com Feb 2025; reddit r/SaaS; paddle.com/help "When and how do I get paid"]. Confidence: MEDIUM (Payoneer payout well-attested; BD seller acceptance anecdotal).

### R10. Accepting payments FROM users globally (payment processors)
- **Stripe**: NOT available in Bangladesh (46 fully-supported countries as of Dec 2025; BD on Asia unsupported lists). [E2: redstagfulfillment Dec 2025; foundeck; cs-cart Apr 2026]. Confidence: HIGH.
- **PayPal**: Bangladesh not on PayPal's supported-countries list (personal receive/withdraw unavailable). [E2: chinaitechpay 2026 list; cs-cart Feb 2026]. Confidence: HIGH.
- **NOWPayments** (crypto gateway, 200+ coins): fees **0.5% service (single-currency) / +0.5% exchange if converting / total up to 1.5%**, **0% withdrawal fee** from custody, min payment ~$2–5 per pair, no fixed min/max balances; settles in USDT to your wallet. Non-custodial API + widgets; works for BD (sign-up free). [E1: nowpayments.io/pricing; /help; tradingview/chainwire Feb 2026 (0% network fee USDT-TRC20 promo)]. Confidence: HIGH.
- **CoinGate**: flat **1%** processing, free crypto withdrawals, settlements 180+ countries; merchant KYB required. [E1: coingate.com/pricing]. Confidence: HIGH. (NOWPayments simpler for a solo dev; CoinGate fine too.)
- **BTCPay Server**: free, open-source, **self-hosted**, zero processing fees (only BTC/LN network fees + your VPS ~$5/mo or a free-ish Cloudflare-Tunnel + home/small VPS setup); BTC + Lightning only (no native USDT). Best fee profile, worst setup cost; fits $0-budget poorly unless paired with the infra stack. [E1: btcpayserver.org]. Confidence: HIGH.
- Choice: **NOWPayments → USDT (TRC20/TON) → P2P → bKash** is the practical "accept money from anyone on earth" rail for BD.

### R11. Crypto-exchange affiliate programs (pay in USDT, no bank)
- **Binance Affiliates**: up to **50%** commission on referral trading fees (spot ~41–45%; co-invite cap 45%); settled hourly/real-time; postaffiliatepro lists "no minimum payout". Payout credited to exchange balance (crypto/USDT-convertible). KYC required; BD on restricted list → account risk. [E1: binance.com/en/events/affiliate; FAQ Oct 2025; E2 creator-hero May 2026]. Confidence: HIGH on terms / MEDIUM on BD durability.
- **OKX Affiliates**: default **30%**, upgradeable to 50%; **paid in USDT** monthly. [E1: okx.com/affiliates; okx rules Aug 2026]. Confidence: HIGH.
- **Bybit Affiliates**: 30% base → up to 50% of trading fees (+5% Earn, +10% sub-affiliate); **payouts default to USDT, daily by ~04:00 UTC**, no meaningful minimum. [E2: strackr Feb 2026; whaleportal; bitdegree May 2026]. Confidence: HIGH.
- These pay YOU in USDT inside the exchange → withdraw via exchange P2P (R4) → bKash. Cheapest chain of all (R12, Chain C).

### R12. Telegram Stars wedge — buying Stars cheap (meta-note)
Fragment KYC exists for buying; third-party top-ups (MyStars etc.) advertise no-KYC, but the DEV-side rail that matters (withdrawal) is R1. No action needed.

---

## 12b. FEE CHAINS (per $100 of gross, realistic 2026 numbers)

**Chain A — Telegram Stars (bot paid feature) → cash in hand**
1. User buys Stars in-app: $0.02/Star (Apple/Google take up to 30% upstream of you) or $0.0133 via web/Fragment.
2. You withdraw at ≈$0.013/Star → vs $0.02: −35% already gone; vs web price: −2.3%.
3. Fragment→GRAM: no fee, but 2–3% market spread on the way out if you swap instantly.
4. GRAM→USDT on Bybit/OKX: 0.1% spot + ~$0.01 network ≈ 0.15%.
5. USDT→BDT P2P (sell at market 122–124 BDT): ~0% vs market (you actually net +2–3.5% vs the official 119.9 rate).
6. bKash cash-out: 1.395% (Priyo agent) – 1.85% (agent); ATM 1.49%. (0.7% only for remittance-flagged funds.)
- **Total: ~4–5% below web-price value** (but ~35% below iOS sticker price). Latency: 21-day hold + 1–2 days. Min: $13 (1,000 Stars).

**Chain B — Adsterra USDT payout (web ad revenue)**
Payout USDT-TRC20, fee 1% + ~$1 network, min $100 → P2P sell ~0% (+2–3.5% FX-rate bonus vs official) → bKash cash-out 1.395–1.85%.
- **Total: ~2.5–3% + $100 threshold latency.** Latency: Adsterra NET-... (bi-monthly ~1st/16th, 1–2 days processing).

**Chain C — Bybit/OKX/Binance affiliate USDT (referral commissions)**
USDT daily (Bybit) / hourly (Binance) / monthly (OKX) → exchange P2P → bKash.
- **Total: ~1.4–2% + 2–3.5% FX bonus vs official rate → effectively cheapest rail (~2% or less net). No minimum worth mentioning. Cheapest verified chain.**

**Chain D — Any Payoneer-paying platform (Paddle / PropellerAds / Ezoic / freelance marketplaces)**
Platform → Payoneer free → withdraw-to-bKash 3% + $1 → cash-out 0.7–1.85%.
- **Total: ~3.7–4.9% + $1/tx**, min BDT 1,000 (≈$8), cap BDT 250,000/tx. Latency: platform NET terms + minutes.

**Chain E — Foreign client pays via WU/MoneyGram/ACE/Taptap → your bKash (remittance rail)**
Sender fee ~$0–4 + embedded FX margin 1.5–3.5% → you get BDT in wallet → +2.5% govt incentive → ATM cash-out 0.7%.
- **Total: ~1–3% net of incentive (sometimes ≈0 or positive).** Latency: minutes–24h. Legality: fully legal channel; compliance caveat (it's "remittance", not invoiced export income).

**Chain F — Google AdSense** → BROKEN (needs bank wire). 100% blocked, not merely costly.

---

## 13. RANKED VERDICT (BD, no bank, no card)

WORKS END-TO-END (ranked by fee efficiency × reliability):
1. **Crypto affiliate commissions (Bybit/OKX/Binance) → exchange P2P → bKash** — ~2% total, paid in USDT, no minimum, fastest settlement. Needs exchange KYC (NID/passport). Risk: BD-restricted listing on Binance; grey-zone legality.
2. **Telegram Stars (bot/mini-app monetization) → Fragment → GRAM → USDT → P2P → bKash** — ~4–5% total, 21-day hold, 1,000-Star min. The only native monetization inside Telegram itself; pair with AdsGram ads.
3. **AdsGram (mini-app ads) → USDT-TON → P2P → bKash** — ~3%, $100 min, 24h payouts.
4. **Adsterra (web tools) → USDT-TRC20 → P2P → bKash** — ~3%, $100 min; the "$5 min" is WebMoney/Paxum only, not crypto.
5. **Paddle (sell software/licences as Merchant of Record) → Payoneer → bKash** — ~4–5% + $1/tx; only mainstream SaaS checkout open to you; seller-approval friction.
6. **Payoneer as universal receiver** (PropellerAds/Ezoic/freelance marketplaces) → bKash — ~4% + $1/tx; NID-based signup, no bank needed.
7. **NOWPayments (accept crypto payments from users) → USDT → P2P → bKash** — 0.5–1.5% gateway + ~2% off-ramp; min charge ~$2–5. BTCPay = free-but-BTC-only alternative.
8. **Direct MTO remittance (WU/MoneyGram/ACE/Taptap → bKash/Rocket wallet)** — cheapest per-dollar (net ~1–3% after +2.5% incentive) but only if you have a foreign payer willing to use an MTO; compliance grey area for client fees.

DOES NOT WORK (no bank/card):
- **Google AdSense** (wire-to-bank only in BD; WU Quick Cash dead) — $100 threshold moot.
- **Gumroad** (needs BD bank or PayPal), **Payhip / Ko-fi / Buy Me a Coffee / Patreon** (Stripe/PayPal only), **Lemon Squeezy** (bank/PayPal in supported countries), **Stripe** (BD unsupported), **PayPal** (BD unsupported), **PropellerAds crypto route** (none exists — Payoneer only), **Payoneer→bank** (no bank).
- Nagad/Rocket: receive-side only (P2P vendors + remittance) — fine, but bKash is the deepest-liquidity off-ramp (most P2P vendors, official Payoneer + WU + MoneyGram integrations).

BIGGEST GOTCHAS
1. Crypto = grey zone in BD (BB 2017 notice + FERA 1947): the risk is MFS-wallet freezes from many small P2P credits + zero scam recourse — not prosecution for holding.
2. Binance lists BD as restricted (Mar 2025: stricter P2P KYC, Cash Zone closed); Bybit/OKX P2P pages actively market bKash/Nagad/Rocket — prefer them for longevity.
3. Fragment (Stars) added mandatory KYC for purchases Nov 2024; withdrawal KYC reports are mixed — assume KYC-able (passport/NID) before scaling.
4. Every "$5 minimum" you'll read (Adsterra WM/Paxum, PropellerAds, Monetag) is a NON-crypto, BD-unusable method; crypto min is $100 (Adsterra/AdsGram).
5. Toncoin is now GRAM (June 2026) — old tutorials saying "withdraw TON" still apply 1:1.
6. Telegram channel-ads 50% revenue share (1,000+ subs) is NOT officially confirmed for BD — check the in-app monetization toggle; AdsGram is the guaranteed fallback.

---

# SECTION 7 — DEVELOPER TOOLING (Task 2-b)

# Research Task 2-b: Developer Micro-Tooling — Real User Pain

Agent: main (Super Z, direct execution after 2 subagent attempts failed on turn limits) | Date: 2026-09-02.
Method: 17 web_search queries via z-ai CLI (Reddit, Stack Overflow, HN, product docs, pricing pages). Evidence levels: E1 = direct community post found; E2 = product/pricing/docs page fact; E3 = reasonable inference (labeled, needs validation).

---

## PROBLEM ROWS

ID: B1
Problem: JSON viewers/editors crash or freeze on large (100MB–1GB+) JSON files, so devs fall back to command-line jq or buy specialized viewers.
Audience: Backend devs, data engineers, anyone inspecting API dumps / ML datasets / logs.
Evidence: Dadroit markets "1GB+ JSON files with instant tree" as its core value prop; UltraEdit publishes "How to edit large JSON files without crashing" guide — both monetize the crash pain (dadroit.com; ultraedit.com).
EvidenceLevel: E1
Sources: https://dadroit.com ; https://www.ultraedit.com
Frequency: weekly
Severity: 7 — blocking workflow when it hits, but rare for average dev.
Workaround: jq/streaming parsers, splitting files, VS Code + extensions (still chokes).
Existing: Dadroit (commercial, price unverified), UltraEdit, jq (free CLI).
Complaints: CLI tools have no visual tree; GUI tools choke or cost money.
Automation: fully deterministic, client-side streaming parse (WebAssembly/chunked).
Distribution: SEO ("open large json", "json viewer big file"), GitHub.
Notes: strong free-tool wedge with clear upgrade path (browser WASM = differentiator "file never leaves your machine").

ID: B2
Problem: JSON ↔ JSONL (JSON Lines) conversion confusion — devs routinely ask how to convert arrays to JSONL and back for ML training data, logs, and APIs.
Audience: ML/AI practitioners, data engineers, backend devs.
Evidence: Multiple recurring Stack Overflow questions (e.g. stackoverflow.com/questions/64398842; tagged/jsonlines stream); multiple free microsites already compete for the exact query (merge-json-files.com/jsonl-to-json, convex.dev guide, scrapfly explainer).
EvidenceLevel: E1
Sources: https://stackoverflow.com/questions/64398842/how-to-convert-json-to-json-lines ; https://stack.convex.dev/json-array-to-json-lines-jsonl ; https://scrapfly.io/blog/posts/jsonl-vs-json
Frequency: weekly (spikes with AI training-data work)
Severity: 6 — annoying friction, easy to solve but people don't want to write jq one-liners.
Workaround: jq one-liners, python snippets copy-pasted from SO.
Existing: merge-json-files.com, various micro converters (free).
Complaints: converter sites are ad-farm quality, upload limits, privacy worries.
Automation: 100% deterministic client-side.
Distribution: SEO exact-match ("json to jsonl"), SO answers.
Notes: validated demand + fragmented low-trust supply = classic micro-tool opening.

ID: B3
Problem: CORS errors remain a top chronic frustration — devs don't understand why requests fail and the error masks the real problem.
Audience: Frontend devs, full-stack beginners, API integrators.
Evidence: r/reactjs "What is CORS and why is it so annoying… 9 million bugs regarding cors"; r/webdev "I hate CORS" + advice threads; Medium "Resolve CORS Errors Once and For All".
EvidenceLevel: E1
Sources: https://www.reddit.com/r/reactjs/comments/11cyejn/ ; https://www.reddit.com/r/webdev/comments/1gyj8u7/i_hate_cors ; https://medium.com/@stephen.biston/resolve-cors-errors-once-and-for-all-three-methods-d821c258d025
Frequency: daily (across the dev population)
Severity: 8 — hours lost per incident, hits beginners constantly.
Workaround: devtools network tab spelunking, copy-pasting middleware snippets, disabling security.
Existing: MDN docs, test-cors.org, browser extensions.
Complaints: none single dominant tool; docs are abstract, errors are misleading.
Automation: header-diagnosis is rule-based (deterministic decision tree) + explainer text (small LLM optional).
Distribution: SEO ("cors error fix"), SO, Reddit.
Notes: huge traffic pool; monetize via related dev-tool bundle rather than the checker itself.

ID: B4
Problem: Cryptic API error responses cost hours — teams build tribal knowledge around undocumented 4xx/5xx bodies.
Audience: Backend devs, integration engineers, DevOps.
Evidence: dev.to war story "our API threw an error that took me forty-five minutes to understand from the logs alone" (Jan 2026); Postman community threads on error-handling for complex API calls.
EvidenceLevel: E1
Sources: https://dev.to/rohit_gavali_0c2ad84fe4e0/how-production-logs-forced-me-to-simplify-api-error-handlin ; https://community.postman.com/t/error-handling-and-debugging-tips-for-complex-api-calls/66163
Frequency: weekly
Severity: 7 — recurring time sink; high willingness to pay for "make it make sense".
Workaround: Google the error string, paste into ChatGPT, grep logs.
Existing: no dominant dedicated tool; general LLM chat does this ad hoc.
Automation: needs-AI (error explanation), but caching + provider router keeps cost near zero.
Distribution: SEO per-error-string pages (programmatic, e.g. "error 401 vs 403 api"), dev communities.
Notes: pairs naturally with AI gateway (B-row feeds router usage).

ID: B5
Problem: Converting curl commands (copied from docs/DevTools) into Python/JS/PHP code is a standing need — proven by an entire category of converter sites.
Audience: API integrators, scrapers, backend devs.
Evidence: curlconverter.com is the established leader; ScrapingBee, SOAX, HasData each built their own curl→Python converter (acquisition play); SO question from 2013 still referenced (stackoverflow.com/questions/20461194).
EvidenceLevel: E2
Sources: https://curlconverter.com ; https://www.scrapingbee.com/curl-converter/python ; https://stackoverflow.com/questions/20461194
Frequency: daily
Severity: 5 — friction, not agony; but universal.
Workaround: manual translation, curlconverter.com.
Existing: curlconverter.com (free, open source), ScrapingBee/SOAX/HasData converters (lead magnets).
Complaints: edge cases in flag translation; converters miss auth quirks.
Automation: deterministic parser (curlconverter's lib is open source — MIT-style, embeddable).
Distribution: SEO, dev docs.
Notes: entering head-on = fighting free incumbents; differentiation must come from bundle/ecosystem (e.g. curl → replayable request bin link).

ID: B6
Problem: Postman gutted its free plan (Feb–Mar 2026: 1 user only, collaboration features removed, $14/mo/member) — active anger window and migration search traffic.
Audience: Indie devs, students, small teams, API tutorial writers.
Evidence: r/Backend "Postman now appears to cap the Free plan at one user" (Feb 5, 2026); r/webdev "RIP Postman free tier" open-source alternative launch (Feb 8, 2026); dev.to "Postman Killed Free Team Collaboration" (Feb 5, 2026); pricing complaints thread "$14 / team member per month".
EvidenceLevel: E1
Sources: https://www.reddit.com/r/Backend/comments/1qwefiy/ ; https://www.reddit.com/r/webdev/comments/1qyi3wz/ ; https://dev.to/therealmrmumba/postman-just-killed-the-free-plan-for-teams-here-are-real-alternatives ; https://www.reddit.com/r/webdev/comments/1gr8r7q/looking_for_a_postman_alternative
Frequency: episodic (migration wave over months)
Severity: 8 for affected teams (budget + workflow disruption).
Workaround: migrate to Hoppscotch/Bruno/Insomnia/HTTPie, curl scripts.
Existing: Hoppscotch, Bruno, Insomnia, HTTPie (mostly free/open-source).
Complaints: existing alternatives = desktop installs or self-host friction.
Automation: deterministic (HTTP client) — but full client is a big build.
Distribution: the migration search wave is live NOW ("postman alternative").
Notes: build SMALL wedge not full client: "paste curl → get shareable request + response inspector, no install". Timeliness flagged.

ID: B7
Problem: Webhook testing requires a public URL + request inspection — existing free tools have limits and the workflow spans 3+ tools (tunnel + bin + replayer).
Audience: Backend devs integrating Stripe/Shopify/Telegram webhooks.
Evidence: r/PHP RequestBin usage thread; Hookdeck's comparison page lists Console/Webhook.site/RequestBin/Beeceptor as the standard kit; deliciousbrains guide for local testing.
EvidenceLevel: E1
Sources: https://www.reddit.com/r/PHP/comments/63rwdw/ ; https://hookdeck.com/webhooks/platforms/best-webhook-testing-tools-inspecting-debugging ; https://deliciousbrains.com/test-webhooks-public-apis-local
Frequency: weekly
Severity: 6 — recurring setup friction per integration.
Workaround: webhook.site free URLs, RequestBin, self-run ngrok + local listener.
Existing: webhook.site (free basic), Beeceptor, Hookdeck (freemium), Pipedream bins.
Complaints: retention limits on free bins, payload history caps, no replay in free tiers (varies).
Automation: fully deterministic; storage is the cost driver (cap history; R2 free tier fits).
Distribution: SEO ("test webhook online"), integration docs backlinks.
Notes: pairs with B8 (tunnels) into one "webhook workspace" micro-product.

ID: B8
Problem: ngrok's free plan restricts (1GB/mo outbound data, fewer tunnels/domains), pushing devs to hunt alternatives.
Audience: Backend devs testing webhooks/demos locally.
Evidence: ngrok official docs: free data transfer out 1 GB/month (ngrok.com/docs/pricing-limits); LocalTonet's "Best Ngrok Alternatives in 2026" listing Cloudflare Tunnel/Pinggy/Playit.gg — the comparison-content niche is actively monetized.
EvidenceLevel: E2
Sources: https://ngrok.com/docs/pricing-limits ; https://localtonet.com/blog/best-ngrok-alternatives
Frequency: episodic
Severity: 5 — workaround exists (Cloudflare Tunnel free).
Existing: ngrok, Cloudflare Tunnel, LocalTonet, Pinggy, Tailscale Funnel.
Complaints: free-tier friction (interstitial pages, domain churn).
Automation: N/A — running tunnels = bandwidth cost, NOT a $0-infra fit.
Distribution: SEO comparison content only.
Notes: DO NOT build a tunnel service on free infra; at most build the "tunnel chooser" SEO page feeding ecosystem. Downgraded to content play.

ID: B9
Problem: Regular expressions are widely feared/misunderstood — writing, reading, and explaining regex is a persistent pain point.
Audience: All developers, data analysts, students.
Evidence: HN discussion "Why are regular expressions difficult?" (2022); stackexchange historical mega-thread; jhall.io "Regular expressions are confusing… hard to read"; dev.to power-vs-pitfall pieces.
EvidenceLevel: E1
Sources: https://news.ycombinator.com/item?id=32155436 (thread 2022-07-20) ; https://jhall.io/posts/regex-pain ; https://softwareengineering.stackexchange.com/questions/28939
Frequency: daily (population-wide)
Severity: 6 — friction, not blocking; educational traffic is enormous.
Workaround: regex101.com (free, dominant), copy-paste from SO.
Existing: regex101 (free, ad-supported, the category king), regexr, RegExr alternatives.
Complaints: regex101 covers testing but not "write it for me"; AI chat does it generically.
Automation: deterministic matcher + small-model explainer (cacheable per-pattern).
Distribution: SEO is saturated by regex101 — head-on = bad idea; long-tail per-task pages ("regex for email validation in python") feasible.
Notes: monetization weak (regex101 free for a decade) — bundle play only.

ID: B10
Problem: MySQL→PostgreSQL (and reverse) migrations require manual SQL dialect rewrites — type mappings, quote styles, function differences — and simple converter tools are asked for repeatedly.
Audience: Backend devs, DBAs, agencies doing platform migrations.
Evidence: Stack Overflow "Is there a simple tool to convert mysql to postgresql syntax?" (closed as resource-seeking but heavily visited); PostgreSQL wiki converter list; BigDataBoutique + dbconvert 2026 migration guides monetize tooling; SchemaLens free client-side schema diff launched on r/PostgreSQL (community validation of client-side DB tools).
EvidenceLevel: E1
Sources: https://stackoverflow.com/questions/92043/is-there-a-simple-tool-to-convert-mysql-to-postgresql ; https://wiki.postgresql.org/wiki/Converting_from_other_Databases_to_PostgreSQL ; https://www.reddit.com/r/PostgreSQL/comments/1szqe85/
Frequency: episodic per user, continuous across population
Severity: 8 — migrations are high-stakes; errors = data corruption.
Workaround: pgloader (CLI, finicky), dbconvert (paid), manual rewrite.
Existing: pgloader (free OSS), dbconvert.com (commercial), SQLines (free-ish).
Complaints: pgloader setup pain; commercial tools pricey (dbconvert pricing unverified).
Automation: mostly deterministic (type maps + grammar rules) with small-model assist for edge cases.
Distribution: SEO ("convert mysql to postgresql online"), r/PostgreSQL.
Notes: paying audience + client-side feasible = strong rev-max candidate; correctness must be excellent.

ID: B11
Problem: Cron syntax is not human-readable — every "every 15 minutes" question spawns generator sites; devs still guess.
Audience: Backend devs, DevOps, no-code users configuring schedulers.
Evidence: crontab.guru ("cron job every 15 minutes" landing page) is the category king; at least 4 competitor generators build SEO pages on the same query (onlineornot.com, beekeeperstudio.io/tools, tool.crontap.com); recurring SO question (stackoverflow.com/questions/13782749).
EvidenceLevel: E2
Sources: https://crontab.guru/every-15-minutes ; https://stackoverflow.com/questions/13782749 ; https://onlineornot.com/cron-jobs/crontab/every-fifteen-minutes
Frequency: weekly (population-wide)
Severity: 4 — mild but universal and recurring.
Workaround: crontab.guru, generators.
Existing: crontab.guru (free), Cronitor tools, many clones.
Complaints: none major — saturated market.
Automation: 100% deterministic.
Distribution: SEO — proven traffic, but head query is taken; long-tail (timezone preview, "cron every business day") possible.
Notes: zero-cost build, good ecosystem glue (feeds scheduler products), weak standalone revenue.

ID: B12
Problem: MCP (Model Context Protocol) developer tooling is immature — server authors lack testing/debugging utilities; one identified gap: durable proof/logging of what an agent session actually did.
Audience: AI-native developers building MCP servers/agents.
Evidence: GitHub community discussion: "One practical gap I keep seeing in MCP developer workflows is not tool access itself, but durable proof of what the human/agent work session did" (Sep 2025); awesome-mcp-devtools list explicitly catalogs "the tooling gap" (Mar 2026); Chrome DevTools MCP launch shows platform momentum.
EvidenceLevel: E1
Sources: https://github.com/orgs/community/discussions/174921 ; https://www.reddit.com/r/modelcontextprotocol/comments/1s4r7fx/ ; https://developer.chrome.com/blog/chrome-devtools-mcp
Frequency: growing (new market)
Severity: 6 — early ecosystem pain, standards still settling.
Workaround: hand-rolled logging, console MCP inspectors.
Existing: MCP Inspector (official, basic), chrome-devtools-mcp, early startups.
Complaints: tooling fragmented; no standard session-audit tool.
Automation: deterministic logging/validation + AI summarization.
Distribution: GitHub (awesome lists, r/modelcontextprotocol) — fast discovery, low SEO value yet.
Notes: high upside + high uncertainty; watch-and-build-wedge candidate (MCP server config validator / session receipt generator).

ID: B13
Problem: JWT debugging (decode/verify/expiry checks) — fully saturated: jwt.io plus at least 4 clones (token.dev, jwt.is, FusionAuth, SuperTokens decoders).
Audience: Backend/auth devs.
Evidence: jwt.io official debugger; token.dev, jwt.is, fusionauth.io/docs/dev-tools/jwt-decoder, supertokens.com/jwt-encoder-decoder all free.
EvidenceLevel: E2
Sources: https://jwt.io ; https://token.dev ; https://jwt.is ; https://supertokens.com/jwt-encoder-decoder
Frequency: weekly
Severity: 4 — solved problem.
Existing: saturated free supply.
Notes: only useful as ecosystem glue (auth-debug bundle), not a standalone bet. Downgraded.

ID: B14
Problem: JSON ↔ JSON Schema generation and schema→sample-data — validated recurring need with multiple free incumbents competing on quality.
Audience: API devs, OpenAPI authors, test-data generators.
Evidence: transform.tools/json-to-json-schema; jsonlint.com/json-schema-generator; liquid-technologies free converter; nextjson.com schema→data; long-lived SO recommendation question (stackoverflow.com/questions/7341537).
EvidenceLevel: E2
Sources: https://transform.tools/json-to-json-schema ; https://jsonlint.com/json-schema-generator ; https://stackoverflow.com/questions/7341537
Frequency: weekly
Severity: 5 — friction; high-intent traffic.
Workaround: transform.tools, quicktype.
Existing: transform.tools, Liquid Technologies, quicktype (OSS).
Complaints: inference quality varies (optional/nullable detection).
Automation: deterministic inference algorithms.
Distribution: SEO + OpenAPI community.
Notes: bundle candidate for the API-tools cluster; differentiation via better inference + OpenAPI round-trip.

ID: B15
Problem: Unix timestamp/timezone conversion errors — devs repeatedly confuse epoch vs local time, DST edges, and language-specific parsing (TZ env pitfalls).
Audience: All developers; heavy in backend/logging.
Evidence: epochconverter.com's enduring dominance; r/ExperiencedDevs "Timestamps: my strong opinion" debate; SO "Do UNIX timestamps change across timezones?"; berthub.eu deep-dive on epoch-from-UTC-string pitfalls (Jan 2025).
EvidenceLevel: E2
Sources: https://www.epochconverter.com ; https://www.reddit.com/r/ExperiencedDevs/comments/187qg93/ ; https://stackoverflow.com/questions/23062515 ; https://berthub.eu/articles/posts/how-to-get-a-unix-epoch-from-a-utc-date-time-string
Frequency: weekly
Severity: 5 — silent bugs when wrong (prod incidents).
Existing: epochconverter.com (free, huge SEO moat).
Complaints: epochconverter UI is dated; no batch/CLI-friendly UX (gap).
Automation: 100% deterministic.
Distribution: long-tail only; head query taken.
Notes: batch timestamp→human-readable converter + timezone-aware cron preview = ecosystem glue.

ID: B16
Problem (META — distribution evidence): Indie devs report building is easy, first-10-users is the bottleneck; simple free tools CAN reach 50 users in a week via r/SideProject + directories.
Audience: Builders (meta).
Evidence: r/SideProject "How did you get your first 10 real users?"; "I've got my first 50 users (1 week after launch)"; invoice-tool launch thread ("built it because it was a pain to create an invoice that was actually simple").
EvidenceLevel: E1
Sources: https://www.reddit.com/r/SideProject/comments/1rmhedl/ ; https://www.reddit.com/r/SideProject/comments/1b9235f/ ; https://www.reddit.com/r/SideProject/comments/1rj2wrq/
Frequency: continuous
Severity: N/A (meta)
Notes: confirms launch playbook: launch each micro-tool on r/SideProject + directories + SO/Reddit answers; expect modest spikes, SEO compounds later.

ID: B17
Problem: Online API testing tools' free tiers restrict request rate/payload/history — devs hit walls during debugging sessions.
Audience: Backend devs, QA.
Evidence: ReqBin free plan limits + Premium "higher request rate and larger payloads, unlimited cloud projects" (reqbin.com/premium); webhook.site free unique URLs model; ReqBin = product of HTTP Debugger team (15 yrs).
EvidenceLevel: E2
Sources: https://reqbin.com/premium ; https://reqbin.com ; https://webhook.site
Frequency: weekly
Severity: 5.
Existing: ReqBin (freemium), webhook.site (freemium), Hoppscotch.
Complaints: signup walls, project limits.
Automation: deterministic; abuse-control needed (rate limiting).
Distribution: SEO ("test api online").
Notes: free-tier UX gaps = wedge; must engineer hard abuse caps on $0 infra.

ID: B18
Problem: .env/config conversion for serverless deploys (env→JSON, dotenv→Docker env_file, cross-format) — devs hand-mangle variables between platforms.
Audience: DevOps, serverless devs.
Evidence: E3 — inferred from transform.tools category breadth + recurring config-format questions; not directly evidenced this session. NEEDS VERIFICATION.
EvidenceLevel: E3
Sources: (inference from https://transform.tools category pattern)
Frequency: weekly (inferred)
Severity: 4 (inferred)
Automation: 100% deterministic.
Notes: candidate row — validate before committing build slot.

ID: B19
Problem: YAML ↔ JSON ↔ TOML conversion for CI pipelines and configs — GitHub Actions/K8s YAML is the recurring offender.
Audience: DevOps, backend devs.
Evidence: E3 — inferred from B11/B18 pattern + docker-compose validation pain cluster; direct community evidence not captured this session. NEEDS VERIFICATION.
EvidenceLevel: E3
Sources: (inference)
Frequency: weekly (inferred)
Severity: 5 (inferred)
Automation: 100% deterministic (round-trip parsers).
Notes: pairs with Docker/CI config validators; SEO long-tail.

ID: B20
Problem: JSON escaping/debugging (string escape/unescape, embedded JSON in JSON, base64-encoded JSON payloads) — frequent source of "invalid string" errors.
Audience: API devs, integration engineers.
Evidence: E3 — inferred from B1/B2 cluster + SO error patterns; not directly captured this session. NEEDS VERIFICATION.
EvidenceLevel: E3
Sources: (inference)
Frequency: weekly (inferred)
Severity: 4 (inferred)
Automation: 100% deterministic.
Notes: micro-wedge inside the JSON Doctor bundle.

---

## FACTS (verified product/pricing anchors)

F1. ngrok Free: 1 GB/month outbound data, per official pricing-limits docs (checked 2026-09-02). [E2] https://ngrok.com/docs/pricing-limits
F2. Postman Free plan: capped at 1 user; collaboration features removed (Feb 2026); paid ~$14/user/mo — the anger window is fresh. [E1/E2] reddit r/Backend 1qwefiy; dev.to therealmrmumba.
F3. webhook.site: free unique URLs + email inboxes for request inspection. [E2] https://webhook.site
F4. ReqBin: free online API client; Premium sells higher rate/size limits + unlimited cloud projects. [E2] https://reqbin.com/premium
F5. crontab.guru: free cron editor, dominant SEO position for cron queries (Cronitor property). [E2] https://crontab.guru
F6. curlconverter.com: free, open-source curl→code converter; multiple companies (ScrapingBee, SOAX, HasData) run clone converters as lead magnets — proven acquisition channel. [E2] https://curlconverter.com
F7. jwt.io debugger: free, category standard; clones exist at token.dev, jwt.is, fusionauth.io, supertokens.com. [E2]
F8. JSON↔Schema converters: free at transform.tools, jsonlint.com, liquid-technologies.com. [E2]
F9. Dadroit: commercial viewer for 1GB+ JSON (crash-pain monetized). [E2] https://dadroit.com
F10. epochconverter.com: free, dominant timestamp utility. [E2]
F11. MCP: open standard; official Inspector exists; Chrome DevTools MCP shipped Sep 2025; awesome-mcp-devtools catalogs the tooling gap (Mar 2026). [E2]
F12. SchemaLens: free browser-based Postgres schema diff tool launched via r/PostgreSQL — proof that client-side DB tools earn community traction. [E1] reddit 1szqe85.
F13. pgloader: free OSS MySQL→Postgres loader (CLI, setup pain = wedge). [E2] pgloader wiki listing.
F14. dbconvert.com: commercial SQL migration tooling (price unverified). [E2] https://dbconvert.com/blog/how-to-migrate-mysql-to-postgresql

## CLUSTER SYNTHESIS (for scoring phase)

- STRONGEST rev-max candidates: B10 (SQL dialect conversion — paying, high-stakes), B1 (large JSON — clear wedge, client-side WASM), B6 (Postman-migration wedge — timed window), B4 (API error explainer — AI-gateway native).
- Traffic glue (weak $, strong ecosystem): B11 cron, B15 timestamps, B13 JWT, B14 schema, B2 JSONL.
- Explicit downgrades: B8 tunnels (bandwidth cost ≠ $0), B9 regex head-on (regex101 moat).
- Fresh/explosive upside: B12 MCP tooling (early, GitHub discovery).
- Meta: B16 confirms launch playbook; F2 confirms timing-sensitive opportunities exist in dev tools post-2026 free-tier contractions.
