# ART MANIFEST — placeholder plates awaiting generation

Every placeholder plate registered by a content lane in `src/lib/imageLibrary.js` with `url: null`.
The Base44 session batch-generates these and delivers the URLs into `src/lib/imagePlates.js`.

**Rules that produced this list** (§6.10): content lanes ship **no visuals** — no image files, no SVG art,
no `PLATE_URLS` entries, no `UnitSprite.jsx` edits. A plate is `P(key, category, title, desc, prompt, aspect)`
with `url` null. The prompt must **not** restate `HOUSE_STYLE` — it is prepended at generation time, and
repeating it doubles the style clause.

New `IMAGE_CATEGORIES` keys introduced by this plan: `arms` (Lane I), `motor` (Lane J).

| Key | Category | Aspect | Subject (one line) | Lane |
| --- | --- | --- | --- | --- |
| *(pending — lanes append their rows here as they merge)* | | | | |

## Expected volume by lane

| Lane | Plate families | Rough count |
| --- | --- | --- |
| F | `unit_<key>_token` per squad type, `unit_<key>_action` for vehicles | ~16–25 |
| G | `tech_<key>` per tech, `decree_<key>` per decree, relic-project plates | ~30+ |
| H | `house_<key>_crest` + `keel_<key>` per house, settlement + ideology + `std_*` plates | ~35+ |
| I | `arms_<key>` per pattern (≥40), `maker_<key>` per manufacturer (≥8), `mod_kit_<key>` per mod (≥25) | ~75+ |
| J | `chassis_<key>` (≥18), `plant_<key>` (≥8), `refit_<key>` per package/mod (≥35) | ~60+ |
