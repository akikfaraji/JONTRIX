#!/usr/bin/env python3
"""GEN_CATALOG — long-tail tool catalog generated under the 'One Product, Many
Tools' directive: every tool, even <=1 use/month, ships inside the platform.
Evidence level for generated rows = E3 (pattern-inherited from research parent).

Tuple fields:
(fam, title, seo_query, parent_id, audience, freq, sev, auto_class, ai, effort_h,
 role, tier, d, p, f_, a, m, di, c, ie, e, de)
dims: demand, pain, frequency, automation, monetization, distribution,
      competition(high=low rivalry), infra_econ, ecosystem, defensibility
auto_class: client | server | hybrid | ai
"""

FAM_META = {
    "JSON": ("Developer Tools", "DevTools & Data"),
    "CSV":  ("Data & File Repair", "Data & Repair"),
    "PDF":  ("Data & File Repair", "Data & Repair"),
    "SUB":  ("Data & File Repair", "Subtitles & Text Media"),
    "FIN":  ("Data & File Repair", "Finance Docs"),
    "MKT":  ("E-commerce & SMB Ops", "E-commerce"),
    "OPS":  ("E-commerce & SMB Ops", "E-commerce / BD Local"),
    "API":  ("Developer Tools", "API & Webhooks"),
    "SQL":  ("Developer Tools", "Database"),
    "CFG":  ("Developer Tools", "Config & DevOps"),
    "TXT":  ("Web & Text Utilities", "Webmaster / Text"),
    "SEC":  ("Web & Text Utilities", "Encoding & Security"),
    "IMG":  ("Media & Image", "Media"),
    "EDU":  ("Weird Gold / Education", "Education"),
    "WG":   ("Weird Gold / Education", "Weird Gold"),
    "TG":   ("Telegram / BD", "BD / Telegram"),
}

GEN_ROWS = [
# ---------------- JSON family ----------------
("JSON","JSON Formatter & Validator","json formatter online","DV-B1","Developers (global)","daily",4,"client",0,6,"HOOK","FREE",8,4,9,10,4,8,3,10,7,3),
("JSON","JSON Diff Checker","json diff online","DV-B1","Developers, data engineers","weekly",5,"client",0,10,"HOOK","FREE",7,5,7,10,5,8,4,10,6,4),
("JSON","JSON Minify / Beautify","json minify online","DV-B1","Developers","daily",3,"client",0,4,"HOOK","FREE",7,3,8,10,3,8,3,10,6,3),
("JSON","JSON Escape / Unescape","json escape online","DV-B20","API developers","weekly",5,"client",0,5,"GLUE","FREE",6,5,7,10,4,8,5,10,6,3),
("JSON","JSON to CSV (flatten, arrays-safe)","json to csv converter","DV-B2","Data analysts, backend devs","weekly",6,"client",0,12,"PRO","PRO",8,6,7,10,5,9,4,10,8,4),
("JSON","CSV to JSON","csv to json converter","DV-B2","Developers, analysts","weekly",5,"client",0,8,"HOOK","FREE",8,5,7,10,4,9,4,10,7,4),
("JSON","JSONPath / JMESPath Query Tester","jsonpath tester online","DV-B1","Backend devs, QA","weekly",5,"client",0,14,"GLUE","FREE",5,5,6,10,5,7,6,10,6,5),
("JSON","JSON to TypeScript / Go / Java Types","json to typescript","DV-B14","API devs, frontend devs","weekly",5,"client",0,16,"HOOK","FREE",7,5,6,10,5,8,6,10,7,3),
("JSON","NDJSON / JSONL Stream Splitter","split jsonl files","DV-B2","ML/data engineers","monthly",4,"client",0,5,"GLUE","FREE",5,4,5,10,4,7,5,10,6,3),
("JSON","JSON Schema Instance Validator","json schema validator online","DV-B14","OpenAPI authors","weekly",5,"client",0,12,"GLUE","FREE",5,5,6,10,5,7,6,10,6,4),
("JSON","JSON Repair / Error Fixer","fix invalid json online","DV-B20","Developers","weekly",7,"hybrid",1,10,"PRO","PRO",7,7,6,10,5,8,5,10,7,4),
# ---------------- CSV/XLSX family ----------------
("CSV","CSV Delimiter Fixer","csv wrong delimiter fix","DR-A1","Office workers, analysts","weekly",7,"client",0,8,"PRO","PRO",7,7,6,10,5,9,5,10,8,4),
("CSV","CSV Encoding Converter (UTF-8/GBK/1252)","convert csv encoding utf-8","DR-A2","Importers, analysts","weekly",7,"client",0,10,"PRO","PRO",7,7,5,10,5,9,5,10,7,4),
("CSV","CSV Splitter (rows / file size)","split large csv files","DR-B2","Data workers hitting Excel 1,048,576 limit","monthly",8,"client",0,8,"PRO","PRO",8,8,5,10,6,9,5,10,7,4),
("CSV","CSV Merger / Concatenator","merge csv files online","DR-B2","Analysts, sellers","monthly",5,"client",0,8,"HOOK","FREE",7,5,5,10,4,9,5,10,8,4),
("CSV","Duplicate Row Finder (exact + fuzzy)","find duplicate rows csv","DR-F1","Sellers, mailing-list owners","weekly",7,"client",0,14,"PRO","PRO",7,7,5,10,6,8,6,10,7,5),
("CSV","Leading-Zero & Date Guard (CSV open protector)","excel removes leading zeros fix","DR-A2","Anyone opening CSVs in Excel","weekly",8,"client",0,10,"PRO","PRO",8,8,6,10,5,9,5,10,7,4),
("CSV","CSV Column Remover / Reorderer","delete columns csv online","DR-A1","Analysts, sellers","monthly",5,"client",0,8,"GLUE","FREE",6,5,5,10,4,8,5,10,7,3),
("CSV","CSV Cleaner (trim/quotes/blank rows)","clean csv data online","DR-A1","Importers","monthly",6,"client",0,12,"PRO","PRO",6,6,5,10,5,8,6,10,7,3),
("CSV","CSV to SQL INSERT Generator","csv to sql insert","DR-B1","Developers, DBAs","monthly",5,"client",0,10,"GLUE","FREE",6,5,5,10,5,8,5,10,7,4),
("CSV","XLSX to CSV / CSV to XLSX","xlsx to csv converter","DR-A1","Office workers","daily",5,"client",0,10,"HOOK","FREE",8,5,7,10,4,9,4,10,6,3),
("CSV","TSV / PSV / CSV Cross-Converter","tsv to csv converter","DR-A1","Developers","monthly",4,"client",0,4,"GLUE","FREE",5,4,4,10,3,8,5,10,6,3),
("CSV","Universal CSV Pre-flight Validator","csv validator online","DR-A1","Platform importers (any CMS)","weekly",6,"client",0,18,"PRO","PRO",7,6,6,10,6,9,6,10,9,5),
# ---------------- PDF family ----------------
("PDF","PDF Merge","merge pdf online free","DR-C1","Everyone (consumers+office)","daily",4,"client",0,8,"HOOK","FREE",9,4,7,10,4,9,2,8,5,2),
("PDF","PDF Split / Extract Range","split pdf online free","DR-C1","Everyone","daily",4,"client",0,8,"HOOK","FREE",9,4,6,10,4,9,2,8,5,2),
("PDF","PDF Compressor","compress pdf online free","DR-C1","Everyone, students","daily",5,"client",0,12,"HOOK","FREE",9,5,6,10,5,9,2,8,5,2),
("PDF","PDF Form Flattener","flatten pdf form online","DR-C4","Office workers, accountants","monthly",7,"client",0,10,"PRO","PRO",6,7,4,10,6,8,5,8,7,4),
("PDF","Images to PDF / PDF to Images","jpg to pdf converter","DR-C1","Students, office","daily",4,"client",0,8,"HOOK","FREE",7,4,5,10,4,9,3,8,5,2),
("PDF","PDF Page Organizer (rotate/reorder/delete)","rearrange pdf pages","DR-C1","Office workers","weekly",5,"client",0,14,"HOOK","FREE",7,5,5,10,4,9,3,8,5,2),
("PDF","PDF Metadata Scrubber (privacy)","remove pdf metadata","DR-C4","Privacy-conscious, lawyers","monthly",5,"client",0,6,"GLUE","FREE",5,5,3,10,4,8,5,9,6,4),
("PDF","PDF Table Extractor to CSV (text-layer)","extract tables from pdf to csv","DR-C2","Analysts, accountants","weekly",8,"client",0,40,"LTV","PRO",9,8,5,9,7,9,6,7,8,5),
("PDF","PDF Owner-Password Remover","remove pdf password online","DR-C4","Office workers","weekly",6,"client",0,8,"PRO","FREE",7,6,4,10,4,8,4,8,5,3),
# ---------------- Subtitle family ----------------
("SUB","SRT to VTT Converter","srt to vtt converter","DR-S1","Video editors, course creators","weekly",6,"client",0,5,"GLUE","FREE",6,6,4,10,4,9,4,10,7,4),
("SUB","VTT to SRT Converter","vtt to srt converter","DR-S1","Video editors","weekly",5,"client",0,4,"GLUE","FREE",5,5,4,10,4,9,4,10,6,3),
("SUB","SRT Offset / Timeshift Tool","shift srt subtitles","DR-S2","Subtitle editors","monthly",7,"client",0,6,"GLUE","FREE",6,7,4,10,4,9,4,10,7,4),
("SUB","Subtitle CPS / Line-Length QC Checker","subtitle line length checker","DR-S3","Pro subtitlers, agencies","monthly",6,"client",0,12,"PRO","PRO",4,6,4,10,5,7,7,10,6,5),
("SUB","Duplicate Subtitle Remover (VTT/SRT)","remove duplicate subtitles","DR-S4","Course creators","monthly",6,"client",0,8,"GLUE","FREE",4,6,3,10,4,7,7,10,6,5),
("SUB","Subtitle Encoding Fixer (mojibake)","fix subtitle encoding","DR-S2","Fansubbers, archivists","monthly",6,"client",0,8,"GLUE","FREE",5,6,3,10,4,8,6,10,7,4),
# ---------------- Finance docs family ----------------
("FIN","OFX / QBO to CSV Converter","convert qbo to csv","DR-D1","Accountants, bookkeepers","monthly",7,"client",0,30,"LTV","PRO",5,7,3,9,7,8,6,8,7,5),
("FIN","CSV to QBO / OFX (import prep)","csv to qbo converter","DR-D1","Bookkeepers","monthly",7,"client",0,40,"LTV","PRO",5,7,3,8,7,8,6,7,7,5),
("FIN","MT940 / SWIFT to CSV","mt940 to csv","DR-D1","Accountants (corporate)","monthly",6,"client",0,25,"LTV","PRO",3,6,2,9,7,7,7,8,6,5),
("FIN","Receipt / Expense Line Extractor","receipt to csv","DR-D2","SMB owners, freelancers","weekly",7,"ai",1,40,"LTV","PRO",6,7,4,6,7,8,6,6,7,5),
("FIN","Multi-Bank Statement Merger & Deduper","merge bank statements","DR-D1","Accountants","monthly",6,"client",0,20,"LTV","PRO",4,6,3,9,6,7,8,8,7,5),
# ---------------- Marketplace family ----------------
("MKT","Shopify Product CSV Pre-flight Validator","shopify csv import errors","EC-C1","Shopify sellers, agencies","weekly",8,"hybrid",1,30,"LTV","PRO",7,8,5,9,7,9,6,8,8,5),
("MKT","Amazon Flat File Pre-flight (8541 etc.)","amazon flat file errors","EC-C9","Amazon FBA sellers","weekly",8,"hybrid",1,35,"LTV","PRO",6,8,4,9,7,8,6,8,8,5),
("MKT","Etsy to Shopify Migration Fixer (variants)","etsy to shopify migration","EC-C3","Migrating sellers","episodic",7,"client",0,20,"PRO","PRO",4,7,2,9,6,8,7,8,7,5),
("MKT","eBay CSV Template Validator","ebay file exchange errors","EC-C9","eBay sellers","monthly",6,"client",0,18,"PRO","PRO",4,6,3,9,5,7,7,8,6,4),
("MKT","Walmart Feed Validator","walmart feed errors","EC-C9","Walmart marketplace sellers","monthly",6,"client",0,18,"PRO","PRO",3,6,3,9,5,7,7,8,6,4),
("MKT","TikTok Shop Upload Fixer","tiktok shop upload error","EC-C9","TikTok sellers","monthly",6,"client",0,18,"PRO","PRO",4,6,3,9,5,8,7,8,6,4),
("MKT","Google Merchant Feed Fixer","google merchant center disapproved","EC-C15","E-com marketers","weekly",7,"hybrid",1,30,"LTV","PRO",5,7,4,8,6,8,6,7,7,4),
("MKT","Meta Catalog Validator","meta catalog upload error","EC-C15","E-com marketers","monthly",6,"client",0,20,"PRO","PRO",4,6,4,8,5,7,6,7,6,4),
("MKT","Supplier Price-List to Shopify Mapper","supplier csv to shopify mapping","EC-C1","Dropshippers, resellers","weekly",8,"hybrid",1,50,"LTV","PRO",4,8,3,7,8,7,8,7,8,6),
("MKT","Marketplace Image Requirements Resizer","amazon image requirements resizer","EC-C10","Marketplace sellers","weekly",5,"client",0,10,"GLUE","FREE",5,5,4,10,4,8,6,9,7,4),
("MKT","Product Listing Translator (EN to AR/BN/ES)","translate product listings","EC-C13","Cross-border sellers","monthly",5,"ai",1,25,"PRO","PRO",5,5,3,6,6,7,6,5,6,3),
# ---------------- E-com ops / BD local family ----------------
("OPS","Order Deduper across Channels","dedupe orders shopify whatsapp","EC-C7","Multichannel sellers","weekly",6,"client",0,18,"PRO","PRO",3,6,4,9,6,6,8,8,7,4),
("OPS","Per-SKU Profit Margin Calculator","ecommerce profit calculator","EC-C7","Sellers, resellers","weekly",4,"client",0,8,"GLUE","FREE",6,4,6,10,4,8,5,10,6,3),
("OPS","SKU Code Generator","sku generator online","EC-C6","Sellers, warehouse staff","monthly",3,"client",0,5,"GLUE","FREE",4,3,4,10,3,8,5,10,5,2),
("OPS","Barcode / Label Sheet Generator (PDF)","generate barcode labels pdf","EC-C6","SMB retailers","monthly",5,"client",0,20,"PRO","FREE",5,5,4,10,5,8,5,8,6,4),
("OPS","Inventory Two-File Diff Checker","compare inventory files","EC-C7","Sellers, ops","monthly",6,"client",0,12,"PRO","PRO",4,6,4,10,5,7,7,9,7,4),
("OPS","VAT / Mushak 6.3 Invoice Generator (BD)","mushak 6.3 format online","EC-C27","BD VAT-registered businesses","monthly",6,"client",0,30,"LTV","PRO",3,6,3,9,6,7,9,8,8,7),
("OPS","Taka Amount-in-Words (Bangla)","amount in words taka bangla","EC-C27","BD accountants","monthly",4,"client",0,4,"GLUE","FREE",4,4,4,10,3,7,9,10,6,6),
("OPS","bKash / Nagad Fee Calculator","bkash send money fee calculator","EC-C28","BD consumers + merchants","weekly",3,"client",0,4,"HOOK","FREE",4,3,5,10,3,7,9,10,6,6),
("OPS","English to Bangla Date Converter","english to bangla date converter","EC-C27","BD offices, form-fillers","monthly",3,"client",0,6,"GLUE","FREE",4,3,4,10,3,7,9,10,6,6),
("OPS","Payment Screenshot to Ledger Entry (BD)","bkash statement to ledger","EC-C28","BD micro-merchants","weekly",6,"ai",1,35,"LTV","PRO",3,6,4,6,5,6,9,5,7,6),
# ---------------- API / webhooks family ----------------
("API","Webhook Replay Tool","replay webhook requests","DV-B7","Backend integrators","weekly",6,"server",0,30,"PRO","MAX",5,6,4,9,6,7,6,6,7,4),
("API","Ephemeral Request Bin (abuse-capped)","free request bin","DV-B7","Backend integrators","weekly",6,"server",0,40,"PRO","MAX",6,6,4,9,5,8,6,5,7,3),
("API","HTTP Status Code Explainer (pSEO)","http 418 meaning","DV-B4","All developers","daily",3,"client",0,8,"HOOK","FREE",7,3,5,10,3,9,4,10,6,3),
("API","HTTP Header Parser / Beautifier","parse http headers online","DV-B4","Backend devs","weekly",4,"client",0,8,"GLUE","FREE",5,4,5,10,4,8,5,10,6,3),
("API","User-Agent String Parser","user agent parser online","DV-B4","Analysts, devs","monthly",3,"client",0,6,"GLUE","FREE",5,3,4,10,3,8,5,10,5,3),
("API","Static JSON Mock API Server","fake rest api online","DV-B17","Frontend devs, testers","weekly",5,"server",0,40,"PRO","MAX",6,5,4,9,6,8,6,5,7,4),
("API","Rate-Limit Retry Planner (calculator)","api rate limit calculator","DV-B17","Integration engineers","monthly",4,"client",0,8,"GLUE","FREE",3,4,2,10,3,6,8,10,5,3),
("API","MCP Server Config Validator","mcp server config validator","DV-B12","AI-native developers","weekly",6,"hybrid",1,30,"LTV","PRO",3,6,3,8,5,6,9,8,9,7),
("API","Webhook Signature Tester (HMAC)","test webhook signature","DV-B7","Backend integrators","monthly",6,"client",0,10,"GLUE","FREE",4,6,3,10,4,7,6,10,7,4),
# ---------------- SQL / DB family ----------------
("SQL","PostgreSQL to MySQL Converter","postgresql to mysql converter","DV-B10","Backend devs, DBAs","episodic",7,"client",0,40,"LTV","PRO",4,7,2,8,7,8,7,8,7,5),
("SQL","SQL Formatter / Beautifier","sql formatter online","DV-B10","Developers","daily",4,"client",0,10,"HOOK","FREE",7,4,7,10,3,9,4,10,6,3),
("SQL","SQL to ORM Model (Prisma/SQLAlchemy)","sql to prisma schema","DV-B10","Backend devs","monthly",5,"client",0,35,"PRO","PRO",4,5,3,8,5,7,7,9,6,4),
("SQL","SQL Query Explainer (AI)","explain sql query online","DV-B10","Junior devs, analysts","weekly",5,"ai",1,20,"PRO","PRO",6,5,4,6,5,8,6,6,6,4),
("SQL","Schema Diff (two DDL files)","compare database schemas online","DV-B10","DBAs, backend devs","monthly",6,"client",0,30,"PRO","PRO",5,6,3,9,6,7,7,9,7,5),
("SQL","Epoch / ISO / Timezone Batch Converter","convert epoch batch","DV-B15","Backend devs, log analysts","weekly",5,"client",0,8,"GLUE","FREE",6,5,5,10,4,9,5,10,7,3),
# ---------------- Config / DevOps family ----------------
("CFG","Cron Explainer (human-readable)","cron expression meaning","DV-B11","DevOps, no-code users","weekly",4,"client",0,8,"HOOK","FREE",6,4,6,10,3,8,4,10,7,3),
("CFG","Timezone-aware Cron Preview (next runs)","cron next run time preview","DV-B11","DevOps across timezones","weekly",5,"client",0,12,"GLUE","FREE",4,5,4,10,4,8,7,10,7,5),
("CFG","Natural Language to Cron (AI)","create cron from english","DV-B11","No-code users","monthly",4,"ai",1,10,"GLUE","FREE",4,4,3,6,4,7,7,6,6,3),
("CFG",".env to JSON / Docker env_file","convert env to json","DV-B18","Serverless devs","monthly",5,"client",0,8,"GLUE","FREE",4,5,4,10,4,8,6,10,6,3),
("CFG","YAML to JSON to TOML Converter","yaml to json toml converter","DV-B19","DevOps, CI users","weekly",5,"client",0,14,"HOOK","FREE",6,5,5,10,4,9,5,10,7,3),
("CFG","Docker Compose Validator / Linter","docker compose validator online","DV-B19","DevOps","weekly",5,"client",0,16,"GLUE","FREE",5,5,4,10,4,8,6,9,6,4),
("CFG",".gitignore Generator (stack-aware)","gitignore generator","DV-B18","Developers","monthly",3,"client",0,6,"HOOK","FREE",5,3,3,10,2,8,5,10,4,2),
("CFG","Changelog Generator from git log","generate changelog from git","DV-B18","OSS maintainers","monthly",4,"server",0,14,"GLUE","FREE",4,4,3,8,4,7,6,8,6,3),
("CFG","OSS License / Notice File Generator","open source license generator","DV-B18","Developers","monthly",2,"client",0,4,"HOOK","FREE",4,2,2,10,2,8,5,10,4,2),
("CFG","Nginx / Apache Config Tester-Generator","nginx config generator","DV-B19","Server admins","monthly",5,"client",0,20,"PRO","PRO",4,5,3,9,5,7,7,9,6,4),
# ---------------- Text / webmaster family ----------------
("TXT","Word / Character Counter + Density","word counter","WG-G3","Students, writers, SEOs","daily",3,"client",0,6,"HOOK","FREE",8,3,7,10,3,9,3,10,5,2),
("TXT","Case Converter (sentence/title/camel)","case converter","WG-G3","Writers, devs","daily",2,"client",0,3,"HOOK","FREE",7,2,5,10,2,9,3,10,4,1),
("TXT","Unicode-aware Slug Generator","slug generator online","WG-G3","Bloggers, SEOs","weekly",3,"client",0,4,"GLUE","FREE",4,3,4,10,2,8,5,10,4,2),
("TXT","Text Diff Checker","text diff online","WG-G3","Writers, devs, lawyers","weekly",5,"client",0,10,"HOOK","FREE",7,5,5,10,3,9,4,10,5,2),
("TXT","Markdown to HTML / Live Preview","markdown to html","WG-G3","Bloggers, devs","weekly",4,"client",0,8,"HOOK","FREE",6,4,5,10,3,9,4,10,6,2),
("TXT","HTML Entity Encoder / Decoder","html entity encoder","WG-G3","Web devs","monthly",3,"client",0,4,"GLUE","FREE",4,3,4,10,2,8,5,10,5,2),
("TXT","Whitespace / Empty-line Cleaner","remove empty lines online","WG-G3","Data pasters, writers","weekly",3,"client",0,3,"GLUE","FREE",4,3,4,10,2,8,5,10,4,1),
("TXT","Line Sorter / Deduper","sort lines alphabetically online","WG-G3","Devs, list-makers","weekly",3,"client",0,3,"GLUE","FREE",5,3,4,10,2,8,5,10,4,1),
("TXT","Regex Tester + Multi-language Export","regex tester online","DV-B9","Developers","weekly",5,"client",0,14,"GLUE","FREE",7,5,6,10,3,7,2,10,6,2),
("TXT","Batch Find & Replace (files)","find and replace text online","WG-G3","Writers, devs","monthly",4,"client",0,8,"GLUE","FREE",5,4,4,10,3,8,5,10,5,2),
("TXT","Reading Time / Grade-level Checker","reading level checker","WG-G3","Teachers, writers","monthly",2,"client",0,4,"GLUE","FREE",4,2,3,10,2,7,6,10,5,2),
("TXT","Lorem / Placeholder Text Generator","lorem ipsum generator","WG-G3","Designers, devs","monthly",2,"client",0,3,"HOOK","FREE",4,2,3,10,2,8,4,10,4,1),
# ---------------- Encoding / security family ----------------
("SEC","Base64 Encoder / Decoder (+files)","base64 encode online","DV-B20","Developers","daily",4,"client",0,6,"HOOK","FREE",8,4,6,10,3,9,3,10,5,2),
("SEC","URL Encoder / Decoder","url encode online","DV-B20","Developers, marketers","daily",3,"client",0,4,"HOOK","FREE",7,3,5,10,2,9,3,10,5,2),
("SEC","Hash Generator (MD5/SHA family)","sha256 hash generator","DV-B20","Developers, IT","weekly",3,"client",0,5,"HOOK","FREE",6,3,5,10,3,9,4,10,5,2),
("SEC","HMAC Signature Generator / Tester","hmac generator online","SEC","API integrators","monthly",5,"client",0,6,"GLUE","FREE",4,5,3,10,4,7,6,10,6,3),
("SEC","UUID v4 / Bulk Generator","uuid generator online","DV-B20","Developers","weekly",2,"client",0,3,"HOOK","FREE",5,2,4,10,2,9,4,10,4,1),
("SEC","Password Generator (offline, strength)","strong password generator","DV-B20","Everyone","weekly",2,"client",0,4,"HOOK","FREE",8,2,5,10,3,9,3,10,5,2),
("SEC","JWT Decoder (ecosystem glue)","jwt decoder online","DV-B13","Auth developers","weekly",3,"client",0,6,"GLUE","FREE",6,3,5,10,2,8,2,10,6,2),
("SEC","QR Code Generator (logo + batch)","qr code generator free","DV-B20","SMBs, marketers","weekly",3,"client",0,16,"HOOK","FREE",9,3,5,10,5,9,2,9,6,2),
("SEC","EXIF Scrubber (privacy)","remove exif data online","DV-B20","Photographers, privacy-minded","monthly",5,"client",0,8,"PRO","FREE",6,5,3,10,4,8,4,9,6,4),
# ---------------- Image family ----------------
("IMG","Image Compressor (WASM mozjpeg/avif)","compress jpeg online","EC-C10","Sellers, bloggers","daily",4,"client",0,25,"HOOK","FREE",9,4,6,10,5,9,2,8,5,2),
("IMG","Batch Image Resizer","batch resize images online","EC-C10","Sellers, photographers","weekly",4,"client",0,20,"HOOK","FREE",7,4,5,10,4,9,3,8,5,2),
("IMG","Image Format Converter (WebP/AVIF/PNG)","png to webp converter","EC-C10","Webmasters","weekly",3,"client",0,15,"HOOK","FREE",7,3,5,10,4,9,3,8,5,2),
("IMG","Favicon Generator (all sizes zip)","favicon generator","EC-C10","Webmasters","monthly",3,"client",0,10,"HOOK","FREE",5,3,3,10,3,9,4,10,5,2),
("IMG","Placeholder Image Generator","placeholder image generator","EC-C10","Designers, devs","monthly",2,"client",0,6,"GLUE","FREE",4,2,3,10,2,8,5,10,5,2),
("IMG","Batch Watermark Adder","add watermark to photos online","EC-C10","Photographers, sellers","weekly",5,"client",0,18,"PRO","FREE",6,5,4,10,5,8,4,8,6,3),
("IMG","Color Palette Extractor from Image","extract colors from image","EC-C10","Designers","monthly",3,"client",0,8,"GLUE","FREE",5,3,3,10,3,8,5,9,5,2),
# ---------------- Education family ----------------
("EDU","Flashcard Converter (Quizlet to Anki/CSV)","export quizlet to anki","WG-G2","Students migrating off Quizlet","weekly",5,"client",0,14,"PRO","FREE",6,5,4,10,4,8,5,10,7,4),
("EDU","Quiz Generator from Notes (AI)","make quiz from my notes","WG-G1","Students, teachers","weekly",5,"ai",1,30,"PRO","PRO",7,5,4,5,6,8,5,5,6,4),
("EDU","Citation Formatter (APA/MLA, no-signup)","citation generator apa","WG-G3","Students (global)","weekly",5,"hybrid",1,20,"HOOK","FREE",8,5,5,9,3,9,5,7,5,2),
("EDU","GPA / CGPA Calculator (BD scales)","bd university gpa calculator","WG-G3","BD/IN students","monthly",3,"client",0,8,"GLUE","FREE",5,3,3,10,3,8,6,10,6,4),
("EDU","Print-perfect Worksheet Generator","worksheet generator printable","WG-G13","Teachers","weekly",4,"ai",1,30,"PRO","PRO",4,4,4,6,5,7,6,6,6,3),
("EDU","Seating Chart / Random Group Maker","seating chart maker free","WG-G14","Teachers","monthly",4,"client",0,10,"GLUE","FREE",4,4,3,10,3,7,6,10,6,3),
("EDU","League Fixture Scheduler (round-robin + standings)","sports league schedule generator","WG-G12","Volunteer league organizers","monthly",5,"client",0,25,"GLUE","FREE",3,5,3,9,4,6,8,10,6,4),
("EDU","AI Code Review Linter (pre-PR check)","ai code review checklist","WG-G7","Dev teams using AI codegen","daily",6,"hybrid",1,30,"PRO","PRO",5,6,5,7,6,7,7,7,7,4),
("EDU","Question Bank Shuffler / Merger","shuffle question bank","WG-G17","Teachers, coaching centers","monthly",4,"client",0,8,"GLUE","FREE",3,4,3,10,4,6,8,10,6,3),
("EDU","MCQ Practice Web App + Telegram Bot","bcs question bank online","WG-G17","BD exam aspirants","daily",6,"server",0,60,"LTV","PRO",7,6,7,7,6,8,6,6,8,6),
("EDU","Spaced-Repetition Flashcard Mini App","free flashcard app","WG-G1","Students (global)","weekly",4,"server",0,50,"PRO","PRO",6,4,6,7,5,7,5,6,7,4),
("EDU","Assignment Deadline / Study Planner","study planner online free","WG-G1","Students","weekly",3,"client",0,15,"GLUE","FREE",5,3,5,9,3,7,6,9,6,3),
# ---------------- Weird Gold extensions ----------------
("WG","Wedding Planner Mini-Suite (guest/RSVP/budget)","wedding guest list spreadsheet","WG-G15","Engaged couples","weekly",4,"server",0,40,"PRO","FREE",5,4,3,8,5,7,6,7,6,3),
("WG","Podcast Show Notes Generator (AI)","podcast show notes generator","WG-G16","Indie podcasters","weekly",6,"ai",1,25,"PRO","PRO",4,6,4,5,6,7,6,5,6,4),
("WG","Event Announcement Slide Generator","church announcement slides","WG-G11","Church/mosque volunteers","weekly",6,"hybrid",1,30,"GLUE","FREE",3,6,4,8,4,6,8,7,7,5),
("WG","AI-slop Text Linter","ai slop checker","WG-G6","Editors, bloggers","weekly",5,"hybrid",1,20,"GLUE","FREE",4,5,4,7,4,7,8,8,7,5),
("WG","ChatGPT Export Cleaner","clean chatgpt export","WG-G8","AI power users","monthly",5,"client",0,10,"GLUE","FREE",4,5,3,10,4,7,8,10,6,4),
("WG","Embeddable Review Widget (credit-linked)","free google review widget","WG-G21","Small businesses, agencies","monthly",5,"server",0,35,"PRO","MAX",4,5,2,8,5,7,6,6,8,5),
("WG","Gig-Driver Earnings Tracker (BD)","pathao foodpanda earnings tracker","WG-G24","BD/IN gig riders","daily",5,"server",0,35,"PRO","FREE",3,5,5,8,4,6,8,6,7,5),
("WG","Prayer-time / Ramadan Schedule Images","ramadan schedule generator","WG-G22","Mosques, Muslim families","monthly",4,"client",0,15,"GLUE","FREE",4,4,5,9,3,7,8,9,7,6),
("WG","Bijoy to Unicode Converter","bijoy to unicode converter","WG-G23","BD publishers, typists","monthly",5,"client",0,10,"GLUE","FREE",3,5,3,10,4,7,9,10,6,6),
("WG","Vibe-coder Code Error Fixer (AI)","fix my code error online","WG-G25","Non-dev AI coders","daily",6,"ai",1,30,"PRO","PRO",6,6,5,5,6,8,6,5,7,4),
("WG","PTA / Club Attendance & Dues Tracker","pta attendance tracking","WG-G19","PTA/volunteer treasurers","monthly",4,"server",0,30,"PRO","FREE",2,4,3,8,4,5,8,7,5,3),
# ---------------- Telegram-native family ----------------
("TG","Telegram Mini App Shell (Stars-native checkout)","telegram mini app tools","platform","Telegram users (BD/IN/global)","daily",5,"server",0,60,"LTV","MAX",8,5,7,7,7,8,5,6,9,6),
("TG","Telegram Bot: File-to-Tool Bridge","telegram bot convert files","platform","Telegram users","daily",5,"server",0,40,"LTV","PRO",6,5,6,7,6,8,6,5,8,5),
("TG","Telegram Post Formatter (unicode bold)","telegram bold text generator","TG","Channel admins","weekly",4,"client",0,8,"GLUE","FREE",5,4,5,10,3,8,5,10,6,3),
("TG","Telegram Group Export Analyzer","telegram group export analytics","TG","Community managers","monthly",5,"server",0,25,"PRO","MAX",4,5,3,8,5,7,6,6,6,4),
]

if __name__ == "__main__":
    print(f"GEN_ROWS: {len(GEN_ROWS)} generated tool rows")
    fams = {}
    for r in GEN_ROWS:
        fams[r[0]] = fams.get(r[0], 0) + 1
    for k, v in sorted(fams.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")
