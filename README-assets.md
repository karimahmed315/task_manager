# ManageMe / The Manager — Assets Checklist

This file lists marketing, product, technical, legal, and hardware assets required for the project. Place finalized assets under the `/assets/` folder and mark their status.

## How to use
- Save actual files under the assets directories shown below.
- Update the `Status` column to `ready` / `pending` / `in-review` and add a short `Notes` entry.

## Asset index (canonical names + specs)

### Branding
- logo_primary.svg — Vector SVG, full-color. Status: pending. Notes:
- logo_primary_mono.svg — Vector SVG monochrome. Status: pending.
- favicon.ico, favicon-32.png — 32x32/16x16. Status: pending.
- brand-colors.json / css-vars.css — Hex palette and usage. Status: pending.

### Marketing hero
- hero_desktop_v1.webp — 1920x1080, WebP/JPG, <400KB. Status: pending.
- hero_mobile_v1.webp — 1125x800, <200KB. Status: pending.
- promo_1080p_v1.mp4 — MP4 H.264, <=60s, captions (VTT). Status: pending.

### Product screenshots & UI
- screenshot_desktop_v1.png — 1440x900 annotated. Status: pending.
- screenshot_tablet_v1.png — 1024x768. Status: pending.
- screenshot_mobile_v1.png — 390x844. Status: pending.
- icons/icon_<name>.svg — Feature icons, consistent style. Status: pending.

### Technical & integration
- .env.example — Contains variable names only (no keys). Status: ready.
- analytics-snippet.txt — Copy for site header + consent text. Status: pending.
- stripe-test-keys-instructions.md — How to configure webhooks locally. Status: pending.
- sample_db_seed.json — Sample tasks and users for dev. Status: pending.

### Hardware (for Kickstarter / future)
- prototype-photo_1.jpg — High-res photo of Pi prototype. Status: pending.
- BOM_v1.csv — Part, supplier, part number, qty, unit cost, lead time. Status: pending.
- wiring_diagram.svg — Wiring and block diagram. Status: pending.

### Legal & compliance
- privacy_policy.md — Plain text privacy policy. Status: pending.
- terms_of_service.md — TOS draft. Status: pending.
- cookie_consent_text.md — Consent wording for analytics/voice. Status: pending.

### Testing & credentials
- test_accounts.md — Dev/backer/admin credentials (store secrets off-repo). Status: pending.
- qa_checklist.md — QA test cases for voice, calendar, snooze, SSE. Status: pending.

## Recommended asset storage layout
```
/assets/
  marketing/
    hero_desktop_v1.webp
    hero_mobile_v1.webp
    promo_1080p_v1.mp4
  ui/
    logo_primary.svg
    favicon.ico
    icons/
      icon_calendar.svg
      icon_voice.svg
  hardware/
    prototype-photo_1.jpg
    BOM_v1.csv
  seeds/
    sample_db_seed.json
```

## README-assets tracking table (CSV friendly)
| Path | Filename | Type | Spec / Notes | Status | Owner |
|---|---|---|---|---|---|
| /assets/marketing | hero_desktop_v1.webp | image | 1920x1080 WebP <400KB | pending | Designer |
| /assets/marketing | promo_1080p_v1.mp4 | video | MP4 H.264 1080p <=60s + VTT captions | pending | Designer |
| /assets/ui | logo_primary.svg | vector | SVG, transparent bg | pending | Designer |
| /assets/hardware | BOM_v1.csv | csv | BOM with supplier links | pending | Hardware |

---

If you want, I can also commit these files to git and create a lightweight issue template that references `README-assets.md` entries. Tell me if you want a CSV exported as an actual `.csv` (done) and whether to commit these files to the repo HEAD.
