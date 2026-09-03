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
