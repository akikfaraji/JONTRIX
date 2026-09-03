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
