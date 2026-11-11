# Sapa Food – PRD

## Original problem statement (summary)
Complete redesign of https://www.sapa-food.cz/ (Vietnamese restaurant, Vodičkova 699/28, Praha 1). FARM stack (FastAPI + React + MongoDB), /api prefix, /api/openapi.json reachable. CZ default + EN. Phase 1: new public website + admin for regular menu & daily menu. Content scraped from the current site (no invented dishes/prices/allergens, no AI food photos). Dishoom/Bao-inspired warm editorial design, mobile-first, sticky bottom bar. Hero video (swap-ready), same URL paths, SEO (hreflang, OG, JSON-LD, sitemap, robots). Admin with JWT httpOnly login, daily menu editor, regular menu editor, photo upload, Czech validation.
Future phases: 2 reservations + GoSMS, 3 pickup ordering, 4 Teya payments, 5 deploy to domain.

## User choices
Custom JWT (httpOnly cookie) auth; Emergent Object Storage for admin uploads; scraped photos stored locally; admin admin@sapa-food.cz; design exactly per brief.

## Architecture
- Backend: server.py (app, validation handler, static mount /api/static), auth.py, routes_public.py, routes_admin.py, models.py (PyObjectId/BaseDocument), seed.py + seed/seed.json (scraped), storage.py (Emergent object storage).
- Collections: categories, menu_items (variants, allergens, image, visible, featured, sort_order), daily_menus (date unique, published, note, items), users, login_attempts, files.
- Frontend: React 19 (native <title>/<meta> hoisting), routes CZ/EN in App.js, config/hero.js (hero video swap), config/site.js (contact, gallery), lib/i18n.js (texts, routes, allergens).

## Implemented (2026-09-28)
- Scraped 53 items / 10 categories (categories derived from item numbering), 44 dish photos (webp), 8 gallery photos, hero poster, favicon, contact/IČO/DIČ, daily menu for 2026-09-29.
- Public pages: /, /menu/, /denni-menu/, /o-nas/, /kontakt/ + /en/ equivalents; /kosik/ redirects; language switcher; mobile bottom bar; hero video with fallbacks; sitemap/robots/JSON-LD.
- Admin: login/logout/change password, brute-force lockout, daily menu editor (copy previous, publish), menu editor (categories CRUD/reorder, items CRUD, variants, allergens, veg/vegan, featured, visibility, reorder, photo upload).
- Tested: iteration_1 – backend 30/30, frontend all critical flows pass.

## Typography switch (2026-09-29)
- Google fonts removed; global stack via CSS vars --font-display ("Helvetica Now Display") / --font-text ("Helvetica Now Text") → Helvetica Neue, Helvetica, Arial. Tailwind: display/sans/mono.
- Headings 700, -0.025em, lh 1.05; body 400, lh 1.5; serif italics/drop cap removed.
- Self-host slot: /app/frontend/public/fonts/helvetica-now.css + commented <link> in public/index.html (uncomment after dropping 10 files).
- Backend tests made date-independent (dynamic Europe/Prague today, today's menu backed up and restored).

## Hero video (2026-09-30)
- Source 0929.mp4 (38 s, 3840x2160, 60 fps, 238 MB, silent AAC track) kept in /app/media_src (gitignored, not public).
- Full-length encodes, no audio, 30 fps: hero.mp4 1080p 14 MB, hero.webm 1080p 12 MB, hero-720.mp4 5.5 MB, hero-720.webm 4.9 MB; poster = frame at 1.2 s.
- Wired via src/config/hero.js; phones load only the 720p files (JS width detection).

## Online ordering patch (2026-11-11)
- Applied owner's online-ordering.patch (git apply --3way, all 30 files clean): ordering.py, teya_client.py, gosms.py, order/terms/privacy pages CZ+EN, CartContext/CartBar, Vietnamese admin + "Đơn hàng" tab, Vietnamese admin/auth errors.
- httpx added. Tests updated for Vietnamese messages (30/30 pass).
- Pending: TEYA_* / GOSMS_* / ORDER_SMS_TO secrets in backend/.env → then accepting=true.

## Pay-at-pickup + customer e-mail (2026-11-11)
- Applied update-pay-at-pickup-and-email.patch cleanly (9 files): mailer.py (SMTP), payment card/store, pay_store setting, contact e-mail lecongdiencz@gmail.com. Commit 208f5a1.
- SMTP secrets are process env vars. Gmail SMTP AUTH is dropped from the preview pod (even dummy credentials) → login unverified here.

## Order lookup token + pre-publish (2026-11-11)
- Orders get `token` (secrets.token_urlsafe(24)); Teya return URLs, done page (?t=) and /api/orders/status/{key} use it; legacy orders without token still by ref. Tests: tests/test_order_token.py (fakes for Teya/GoSMS/SMTP), 35/35 pass.
- Seeding from backend/seed/snapshot.json (current preview menu, 10 cats/53 items, same ids), only into an empty DB, replica-safe (settings marker "seed_menu"); admin seeded via upsert.
- .gitignore no longer blocks .env files; canonical/hreflang/og use SITE.url = https://www.sapa-food.cz. Deployment check: PASS.

## Needs owner review
- Story/about text (neutral food text, not from site), category names (site had none), featured dish selection, EN names/descriptions with typos copied from the site.

## Backlog
- P1: Phase 2 reservations + GoSMS; hero video swap when received (config/hero.js).
- P2: Phase 3 pickup ordering, Phase 4 Teya payments, Phase 5 deploy (update sitemap domain if different), prerender/SSR for SEO.
