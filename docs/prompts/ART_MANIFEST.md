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

---

## Lane G — doctrine, decrees & relic projects (26 plates)

Registered as one banner-commented tail block in `src/lib/imageLibrary.js`
(`// ——— LANE G: doctrine, decrees & relic projects ———`), every row `url: null`. **No new
`IMAGE_CATEGORIES` key** — `doctrine`, `decrees`, `relics` and `fortress` all already existed. Every
prompt describes subject and composition only; none restates `HOUSE_STYLE`, and
`test/catalog-mirror.test.js` asserts both the coverage and the no-house-style rule.

Register conventions, matched to the neighbouring plates in each section: `doctrine` reads *"Research
dossier plate: … blueprint annotations"*; `decrees` reads *"Wartime propaganda poster: … stencil
lettering, aged paper"*; the relic plate reads as a discovery-scale plate.

| Key | Category | Aspect | Subject (one line) | Lane |
| --- | --- | --- | --- | --- |
| `tech_boarding_doctrine` | doctrine | 4:3 | Storm parties drilling with cutting bars in the gutted corridor of a scrapped keel | G |
| `tech_saturation_barrage` | doctrine | 4:3 | Massed batteries firing in timed ripple across a fire-plan grid, cases heaped to the axles | G |
| `tech_bonded_manifests` | doctrine | 4:3 | Clerks stamping bonded salvage manifests at a transfer gantry between two keels | G |
| `tech_continuous_casting` | doctrine | 4:3 | An unbanked furnace line pouring an endless glowing strand into rolling stands | G |
| `tech_grand_quartermastery` | doctrine | 4:3 | A vast manifest office of ledger desks and pneumatic tubes above a forward depot | G |
| `tech_red_traffic_discipline` | doctrine | 4:3 | A signaller reading clipped call-signs from a cipher card, chatter logs struck through in red | G |
| `tech_listening_posts` | doctrine | 4:3 | Wire crews raising a lattice aerial mast over a dug-in listening dugout | G |
| `tech_traffic_analysis` | doctrine | 4:3 | Analysts plotting message volume and bearing on a wall chart, cipher slips stacked unread | G |
| `tech_vigil_watch` | doctrine | 4:3 | A mast crew keeping night watch on the sky between two moons, devotional roll pinned to the frame | G |
| `tech_intercept_bureau` | doctrine | 4:3 | A windowless plotting room where every listening post reports, forecasting enemy movement | G |
| `tech_survey_cadres` | doctrine | 4:3 | Prospectors probing a precursor floor that is a lid, red flag planted at the seal | G |
| `tech_assay_procedure` | doctrine | 4:3 | A pit-head assay bench sorting fragments into four labelled class trays | G |
| `tech_sealing_protocols` | doctrine | 4:3 | A crew welding a precursor door shut and posting a warning flag, nobody looking inside | G |
| `tech_deep_shaft_works` | doctrine | 4:3 | Headframe winch and sump pumps over a deep dig, a standing shift camp at the pit head | G |
| `tech_stripping_yards` | doctrine | 4:3 | An intact Object cradled in breaking gantries, cut into classed fragments and scrap | G |
| `tech_pattern_book` | doctrine | 4:3 | An indexed pattern book open on a lectern, smudged copies pinned beside their originals | G |
| `decree_emergency_powers_act` | decrees | 4:3 | An assembly chamber emptying as a marshal's gauntlet closes over the gavel — ONE VOICE UNTIL VICTORY | G |
| `decree_sealed_sites_order` | decrees | 4:3 | A welded precursor door under a ministry seal, warning flag before it — LEAVE IT SHUT | G |
| `decree_standing_corps_act` | decrees | 4:3 | One veteran regular in immaculate kit as a ragged levy column thins away — A TRADE NOT A DUTY | G |
| `decree_charter_of_passage` | decrees | 4:3 | Chartered freight houses stamping a sealed passage contract over a loading ramp — PASSAGE IS BOUGHT | G |
| `decree_reliquary_act` | decrees | 4:3 | A consecration canopy raised over a find still in the ground, chimneys cold — LEAVE IT WHOLE | G |
| `decree_writ_of_consecration` | decrees | 4:3 | An Object entered by hand onto a great roll of names beneath an empty sky — HELD AGAINST THE DAY | G |
| `decree_breaking_yards_act` | decrees | 4:3 | Cutting crews opening a precursor hull under floodlights — WE OWE THEIR GEAR NOTHING | G |
| `decree_ordinance_common_metal` | decrees | 4:3 | A relic on a foundry weighbridge priced as plain tonnage, assayers waved aside — ALL OF IT IS METAL | G |
| `decree_wakewatch_act` | decrees | 4:3 | Chartered salvage crews stalking a still-running precursor machine, core cradles ready — PAID BY THE CORE | G |
| `relic_lance_carriage` | relics | 4:3 | A salvaged precursor lance cradled on a riveted rail carriage, traversed outward over a fortified line | G |

### What Lane G deliberately did NOT register — do not generate these twice

The catalog needs **57** distinct plates — 25 techs · 15 modules · 13 decrees · 4 relic projects (the
`relic_project` armory row and its `RELIC_PROJECTS` twin share one key and therefore one plate). Only
26 are new; the other 31 already exist in `IMAGE_LIBRARY`, and the mirror test proves all 57 resolve:

- **All 9 legacy `tech_*` plates** and **all 3 legacy `mod_*` plates** already match the convention.
- **All 12 new fortress modules were keyed to plates that already existed** under `fortress`:
  `mod_field_assay`, `mod_cipher_hall`, `mod_muster_decks`, `mod_launch_rails`, `mod_sortie_gates`,
  `mod_granary_decks`, `mod_assembly_hall`, `mod_pilgrim_berths`, `mod_march_klaxons`,
  `mod_ministry_mast`, `mod_sloped_casemates`, `mod_pattern_shop`. The module **keys were chosen to fit
  the plates**, not the other way round — renaming any of those armory keys silently orphans its plate,
  and a duplicate-plate-key assertion now guards the file.
- **Four legacy plate keys predate the `<kind>_<key>` convention and must not be renamed or
  duplicated.** `test/catalog-mirror.test.js` resolves through this exact alias map:

  | Catalog key | Existing plate key |
  | --- | --- |
  | `war_bonds_decree` | `decree_war_bonds` |
  | `fuel_ration_act` | `decree_fuel_ration` |
  | `hearth_and_bulwark` | `decree_hearth_bulwark` |
  | `the_new_ignition` | `relic_new_ignition` |

- `decree_universal_levy`, `relic_land_dreadnought` and `relic_the_beacon` already match the convention.
  **`relic_lance_carriage` is therefore the only relic plate this lane authored.**
- **Aspect exception:** `the_beacon` and `the_new_ignition` ship as `16:9`, not the `4:3` the convention
  asks for. Both are pre-existing and pre-convention; the test exempts exactly those two by name rather
  than restating the aspect, and category is asserted for every row regardless. **Do not "fix" them to
  4:3** — a live plate would be regenerated at the wrong ratio for no gain.
