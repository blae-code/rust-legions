# Rust Legions — The Roster (Major & Minor Factions)

> **Status: PROPOSED CANON** (tracker §2.8 / L-12). Extends `docs/LORE.md` §7 from three houses to
> ten, and names ten minor polities built on the locked settlement cultures (LORE §6). On
> ratification, houses 4–10 and all minors fold into LORE.md; until then nothing here ships.
> **Design intent:** every major is expressible as a Five Chapters lifepath build
> (`LIFEPATH_DESIGN.md` §1.1) — prebuilts and player-made factions are the same data (§3 below).
> Ideology seeds use VISION §6 axes: Authority / Economy / Creed / Mobilization, each −3…+3.
> **LORE v2 alignment (2026-07-16):** all "restoration" goals now read as bids for **the Key** — the
> way off the dead world (LORE §2–§3, §7): each house's theory column maps to a Departure reading
> (Ferrymen→the Recall, No-Patron→the Discarding, Warden→the Flight, agnostic→the Finished Ledger,
> Experiment→the Recall — house 5 addresses the Absent and demands an answer, which LORE §7 already
> reads as an appeal). **The Departure a house holds is not stored anywhere; it is DERIVED from its
> Creed seed** — see §6 and `DEPARTURE_BY_CREED_SEED` in `src/lib/presetFactions.js`.

## 1. The Ten Houses (major factions)

Coverage by design: all four theories represented (LORE §2), all three AI doctrines used (aggressive
×4, economic ×4, defensive ×2), and no two houses sharing both a doctrine and a creed.

> **Correction (Lane H, 2026-09-02).** This sentence read “aggressive ×4, economic ×3, defensive ×3”
> while the ten per-house **Doctrine** lines below read 4 / 4 / 2. The per-house lines govern and are
> unchanged; the summary was the error. `test/presets.test.js` now parses those ten lines and asserts
> each against its preset’s `doctrine`, so the two cannot drift apart again in silence. Counting the
> three legacy presets as well, the shipped thirteen are aggressive ×5, economic ×5, defensive ×3 —
> a figure recomputed from `PRESET_FACTIONS`, not typed here twice.

### 1. The Iron Reclamation — *canon (LORE §7)*
**Doctrine** aggressive · **Theory** No-Patron · **Seeds** Auth +2, Econ 0, Creed −2, Mob −1 · **Keel** *the Iron Verdict*, First Sledge of the Reclamation
Restoration is earned through unification by force. Conscription, censorship, burning sincerity. Playstyle: mass levy offensives, administration of everything it touches. Herald: numbered Bulletins.

### 2. The Charter Combine — *canon (LORE §7)*
**Doctrine** economic · **Theory** agnostic ("we insure against theology") · **Seeds** Auth −1, Econ +2, Creed 0, Mob 0 · **Keel** *the Vow of Coal*, Third Keel of the Combine
Restoration is bought. Contracts, credit, dependency. Playstyle: trade circuits seeking Meets, harvest contracts everywhere, the black market. Herald: Advisories.

### 3. The Bastion Synod — *canon (LORE §7)*
**Doctrine** defensive · **Theory** Ferrymen · **Seeds** Auth −1, Econ 0, Creed +2, Mob +1 · **Keel** *the Reliquary Adamant*, Keel-Shrine of the Synod
Restoration is preserved. Hoard, shelter, outlast. Playstyle: max lab and armor, Cipher bounties, parish covenants, sits on the Restoration Works. Herald: the Preservation Roll.

### 4. The Covenant of Locks — *new*
**Doctrine** aggressive · **Theory** Warden · **Seeds** Auth +1, Econ −1, Creed −1*, Mob +1 · **Keel** *the Vigil of Chains*, Warding Keel of the Covenant
The world is a prison and the vaults are its machinery — every dig is a hand on a lock nobody can read. The Covenant marches to *close* excavations: filling shafts, dynamiting Anchor Field approaches, executing "keyturners." The only house whose war aim is that nobody wins the prize. Playstyle: interception and dig-denial; low relic economy by conviction, terrifying conventional army. *(Creed axis note: mechanically Reclaimer-side — they reject the inheritance — but for opposite reasons; decree text should distinguish.)* Herald: sparse, dated warnings — "the lock at {site} held today. See that it holds tomorrow."

### 5. The Signal Ascendancy — *new*
**Doctrine** economic · **Theory** Experiment · **Seeds** Auth +1, Econ +1, Creed +1, Mob 0 · **Keel** *the Testimony of Copper*, Broadcasting Keel of the Ascendancy
They never left; they only stopped answering — so make them answer. The Ascendancy performs: monument works, spectacle battles, ceaseless transmission skyward. Playstyle: signals supremacy — Cipher hunger, intercept warfare, probe range, the Long Ear Array as a holy grail. Herald: addresses the Absent directly, copying all humanity — unsettling, grandiose, occasionally beautiful.

### 6. The Commonweal March — *new*
**Doctrine** defensive · **Theory** No-Patron (communal) · **Seeds** Auth −3, Econ −2, Creed −2, Mob −2 · **Keel** *the Bond of Bread*, First Keel of the Commonweal
A marching republic — federated communes that pooled their levies and built a keel by subscription. Nobody saves humanity; humanity saves each other, one shared harvest at a time. Playstyle: commune pacts everywhere, deep manpower, citizen armies that defend like bedrock and advance like a committee. The bloc system at its most alive — Assembly sessions are their national sport. Herald: minutes of the open Assembly, motions carried and defeated, read aloud.

### 7. The Salvage Court — *new*
**Doctrine** aggressive · **Theory** agnostic (cynical) · **Seeds** Auth +1, Econ +2, Creed 0, Mob +1 · **Keel** *the Writ of Knives*, Adjudicating Keel of the Court
A pirate house wearing a courtroom. The Court holds that all property in motion or abandonment is contestable salvage, and issues itself writs to seize it. Lives off other keels' swaths, convoys, and depots. Playstyle: raiding, interception, draught-column predation, ransom via the Envoy Desk; weak grazing economy — they eat what you carry. Herald: legal notices of "adjudicated salvage," served after the fact, in perfect form.

### 8. The Emberwright Union — *new*
**Doctrine** economic · **Theory** No-Patron (technical) · **Seeds** Auth 0, Econ −1, Creed −2, Mob +1 · **Keel** *the Debt of Winters*, Foundry Keel of the Union
Engineers of the still-city exodus — Rent-scarred, methodical, carrying the ash of dead cities in their family names. Their heresy: the Rent can be *beaten*, and the New Ignition will prove it. Playstyle: industry-maximal, pattern research bonuses, strips relics for parts without flinching (the Reliquary Lobby barely exists aboard). The Reclaimer victory path made civilian. Herald: engineering circulars — tolerances, test results, and once in a while, quiet awe.

### 9. The Long Procession — *new*
**Doctrine** aggressive · **Theory** Ferrymen (militant) · **Seeds** Auth +2, Econ −1, Creed +3, Mob −2 · **Keel** *the Burden of Bells*, Pilgrim Keel of the Procession
Where the Synod hoards the inheritance, the Procession *liberates* it — a pilgrim horde on treads, crusading to take relics out of unworthy hands, including yours. Masses of devout levy infantry around a core of relic-bearing shrine-wagons. Playstyle: creed warfare — dispositions swing hard by ideology distance; unstoppable when a holy dig is contested, aimless when none is. Herald: processional liturgy on the march — station by station, bell by bell.

### 10. The Outrider Compact — *new*
**Doctrine** economic · **Theory** Warden (folk-superstitious) · **Seeds** Auth −2, Econ +1, Creed −1, Mob +2 · **Keel** *the Promise of Dust*, Swift Keel of the Compact
Herders, scouts, and couriers of the open ground — the smallest, fastest keel on the Ground, ringed by outrider columns. They graze wide, dig never ("leave the doors shut and the dead paid"), and sell what they see. Playstyle: speed — interception dominance, skim-heavy migration economy, intel brokerage rivaling the waystations; fragile if ever pinned. Herald: rider reports — terse, positional, always accurate, always for sale.

## 2. The Ten Grounds (minor factions / notable settlements)

Placeable instances of the locked settlement cultures; each carries disposition seeds, a creed lean,
and hooks into shipped/planned systems. Map and graph editors treat these as templates.

1. **Hundredweight Bottoms** *(mining combine)* — the ore town at the site of the Siege of 141 F.I., where the First Keel was born. Proud beyond its tonnage; every house courts the prestige of its friendship. Hates sieges on principle. *Hooks: history codex unlocks; heavy Steel deposits; grudge events.*
2. **The Nine Cradles** *(scrap-parish, Anchor Field)* — the largest known Anchor Field and the seat of Ferrymen orthodoxy (LORE §3 hymn). Cipher-rich ground it will not let Reclaimer creeds touch. *Hooks: TECH victory geography; Procession/Synod rivalry over its favor.*
3. **Tarpool** *(burn-town)* — a great seam, a fire that never quite goes out, and prices to match demand. Sells to all sides simultaneously and considers this a moral position. *Hooks: fuel economy; seam-fire crisis; Combine contracts.*
4. **The Gray Commons** *(farm commune federation)* — provender grounds feeding half a region. Pacifist, patient, unforgiving of broken levy pacts. *Hooks: manpower economy; Commonweal warmth; famine crises.*
5. **Crossloom** *(waystation)* — where the great routes knot. THE customary Meet-ground; its neutrality is older than any living house and enforced by universal self-interest. *Hooks: trade Meets; intel market; truce venue events.*
6. **Vault-of-Winters** *(still-city, living)* — walled, lamplit, and lying. A fixed city that should have died of the Rent generations ago and conspicuously hasn't. Nobody is allowed below its third cellar. *Hooks: mystery arc; gate tolls; a Cipher rumor that never quite confirms.*
7. **The Chandlery** *(waystation-provisioner)* — a refit town that outfits keels: victuals, tread-plate, lamp-oil, crews. Serves anyone, remembers everything, and its ledgers are the closest thing the Ground has to a census of the houses. *Hooks: refit discounts; draught-column recruitment; espionage events.*
8. **Redwater Digs** *(independent digger camp)* — freelance excavators squatting a contested site, selling fragments to whoever arrives first and running a book on which house it'll be. Doomed, cheerful, useful. *Hooks: fragment market; Wake escalation ground zero; evacuation events.*
9. **The Quiet Parish** *(scrap-parish, Warden creed)* — the Nine Cradles' dark mirror: a congregation that seals vaults and pays for closures. Will fund any house — even an enemy — to collapse a dig. *Hooks: Covenant warmth; dig-denial contracts; creed-conflict decrees.*
10. **Kettleharrow** *(still-city rim)* — scavengers living on the lip of a dead city, harvesting its bones and losing a few people a year to its interior. Cheap salvage, honest warnings, short life expectancy. *Hooks: rich Cache/fragment ground; rot-count hazards; guide-for-hire events.*

## 3. Customization Architecture (players build their own)

The roster and the wizard are one system, not two:

- **A major faction is a data record:** Five Chapters selections + ideology seeds + doctrine
  assignment + keel name + herald voice key + LLM lore text. Every house above is (and must remain)
  reproducible inside the creation wizard — prebuilts are *saved lifepaths*, nothing more privileged.
  Acceptance test: rebuild the Long Procession in the wizard and the seeds match.
- **Custom majors:** players run the Five Chapters, point-buy perks/flaws, get LLM-synthesized lore
  (shipped), pick or generate a keel name (LORE §8 pattern), and choose a herald voice pack (one of
  the ten, or "ministry default" until custom voices exist). Saved to their account; assignable to
  any slot on a custom map.
- **Custom minors:** the map/graph editor places settlement templates — culture type, creed lean,
  disposition seeds, deposit attachments — with the ten Grounds above as prefilled examples. Custom
  minors are the same template with player-authored names and blurbs.
- **NPC play:** any roster or custom major is NPC-playable via its doctrine assignment; houses 4–10
  reuse the three shipped doctrine AIs with per-house parameter flavor (e.g., Salvage Court =
  aggressive doctrine, target-preference weighted to convoys/depots). Whether any house eventually
  needs a *fourth* doctrine AI is an open question below.

## 4. Open Questions

1. Doctrine AI stretch: do the Covenant (dig-denial) and Salvage Court (convoy predation) read as
   themselves under the three shipped doctrines with parameter tweaks, or do they need new AI
   behaviors? (Leaning: parameters first; new behaviors only if playtests read them as generic.)
2. Standard map counts: how many roster majors/minors seed a default 2–4 player game?
3. Herald voices for houses 4–10: seven new packs extend `HERALD_VOICES.md` — write all seven now,
   or on ratification per-house? (Sketch lines above are the seeds.)
4. Should custom factions be shareable between players (export/import codes), and do custom herald
   voices ever open up (LLM-synthesized style guides from a player prompt)?
5. The Outrider Compact's "smallest, fastest keel" implies per-house keel stat variance — currently
   keels differ by modules only. Worth a base-chassis stat, or express it purely as starting modules?

---

## 5. Unit Access — Tactical Squads & Kits [PROPOSED]

*Signature, not exclusive.* A house's signatures are what its muster leans on and what Lane H's
`uniqueRoster` draws from — they are **not** locks. Only a `creedLock` or `factionLock` on the row
itself restricts who may field a type, and the whole roster carries one (below). Every key in this
table is live in `SQUAD_TYPES` or `UPGRADES`, and every signature kit fits at least one of the
house's own signature squads — `test/gear-points-audit.test.js` parses this table and asserts both,
so a renamed key or a kit whose `appliesTo` narrows turns the suite red here rather than in play.

| House | Signature squad type(s) | Signature upgrade kit(s) | Note |
| --- | --- | --- | --- |
| The Iron Reclamation | `stormtroops`, `riflemen` | `radio_pack`, `sapper_plate` | Restoration by force: the Guard-flagged assault company off the front of a conscript line, and a wire back to it so the whole administration hears the same order. |
| The Charter Combine | `autocar_scouts`, `provost` | `armor_skirts`, `drum_magazines` | A house that insures. It buys wheels to see the convoy first and revolvers to keep the yard quiet, and it plates both because a written-off asset is a written-off contract. |
| The Bastion Synod | `marksmen`, `pioneers` | `marksman_pattern`, `wire_spades` | Preservation is a firing lane and a finished revetment. The Synod outlasts, at reach, from behind something it built the season before. |
| The Covenant of Locks | `sappers`, `flame_team` | `sapper_plate`, `storm_hoods` | The only war aim on the Ground that is a closing. Breaching men to reach a shaft and the projector to make sure nobody comes back up it, hooded against their own fume. |
| The Signal Ascendancy | `siege_mortar`, `marksmen` | `gas_shells`, `radio_pack` | War as transmission. Everything is fired on a map reference and a ciphered warrant; nothing the Ascendancy shoots at is ever in sight of the thing shooting. |
| The Commonweal March | `digger_corps`, `provost` | `wire_spades`, `marksman_pattern` | Federated levies who dig before they fight and vote on the rest. Bedrock on the defence, a committee on the advance, and a spade issued to every hand. |
| The Salvage Court | `autocar_scouts`, `assault` | `mine_flails`, `drum_magazines` | Property in motion is contestable. The Court arrives on wheels, through the belt, and settles the argument at a range where drums beat aim. |
| The Emberwright Union | `land_dreadnought`, `sappers` | `armor_skirts`, `sapper_plate` | The house that fields two hulls is the house that built one. Union engineers put the relic on the ground and walk in beside it in siege plate. |
| The Long Procession | `pilgrim_levy`, `flame_team` | `wire_spades`, `storm_hoods` | The one house whose creed opens the levy: `pilgrim_levy` carries `creedLock: recall`, and the Recall is Procession orthodoxy (LORE §2). Mass on the march, hooded, with a spade each. |
| The Outrider Compact | `ski_troops`, `autocar_scouts` | `ski_conversions`, `radio_pack` | Speed and nothing else. Boards for the men, forward skis for the running gear, and a set on every column so what it sees is worth selling before it is stale. |

### Locks used by this lane — for Lanes G and H

**One lock in the whole append, of a budget of two.** `pilgrim_levy` carries
`creedLock: 'recall'` — The Recall, whose holders LORE §2 names as the Synod, the Procession and
the parishes, and which Lane G already ships as a `CREEDS` key. No other new squad type, specialist
or upgrade kit in this lane carries a `creedLock` or a `factionLock`.

`land_dreadnought` is deliberately **unlocked** and is the second budgeted lock deliberately left
unspent: Lane G gates it as a `RELIC_PROJECTS` row on `prereq: ['continuous_casting', 'pattern_book']`
with no creed at all, so a `creedLock` here would contradict the project that builds the machine.
The two rows are one Object — same key, same `tier: 'III'`, and a squad-cost `pts` basis on this side
rather than a per-figure one.

No `factionLock` is used anywhere in this lane, so no id from `src/lib/presetFactions.js` is claimed
and Lane H is free to assign every house above without reconciling against a lock.


---

## 6. Reconciliation — the key register [Lane H, 2026-09-02]

*This section is the record the platform lane reads. Every table in it is asserted against
`src/lib/presetFactions.js` and the live catalogs by `test/presets.test.js`: a key renamed upstream,
or a row edited here without the data moving with it, is a red test rather than a stale document.*

### 6.1 House, keel and herald keys

`house` is the plate stem (`house_<house>_crest`). `heraldVoice` always equals `house`. There is **no
`keel` field on the row** — §4 amendment Q3b — and the keel slug is looked up from `house` through
`KEEL_BY_HOUSE`. `departure` is not stored either: it is derived from the Creed seed by
`DEPARTURE_BY_CREED_SEED`, and is shown here so the derivation can be read at a glance.

| Faction | `id` | `house` | keel slug | `heraldVoice` | Creed seed | Departure |
| --- | --- | --- | --- | --- | --- | --- |
| The Kessel Pact | `kessel_pact` | `kessel` | `debt_of_ash` | `kessel` | -2 | `discarding` |
| The Iron Synod | `iron_synod` | `ironsynod` | `ledger_of_brass` | `ironsynod` | 0 | `finished_ledger` |
| The Grauwall Marches | `grauwall_marches` | `grauwall` | `verdict_of_stone` | `grauwall` | 0 | `finished_ledger` |
| The Iron Reclamation | `iron_reclamation` | `reclamation` | `iron_verdict` | `reclamation` | -2 | `discarding` |
| The Charter Combine | `charter_combine` | `combine` | `vow_of_coal` | `combine` | 0 | `finished_ledger` |
| The Bastion Synod | `bastion_synod` | `synod` | `reliquary_adamant` | `synod` | 2 | `recall` |
| The Covenant of Locks | `covenant_of_locks` | `covenant` | `vigil_of_chains` | `covenant` | -1 | `flight` |
| The Signal Ascendancy | `signal_ascendancy` | `ascendancy` | `testimony_of_copper` | `ascendancy` | 1 | `recall` |
| The Commonweal March | `commonweal_march` | `commonweal` | `bond_of_bread` | `commonweal` | -2 | `discarding` |
| The Salvage Court | `salvage_court` | `salvage` | `writ_of_knives` | `salvage` | 0 | `finished_ledger` |
| The Emberwright Union | `emberwright_union` | `emberwright` | `debt_of_winters` | `emberwright` | -2 | `discarding` |
| The Long Procession | `long_procession` | `procession` | `burden_of_bells` | `procession` | 3 | `recall` |
| The Outrider Compact | `outrider_compact` | `outrider` | `promise_of_dust` | `outrider` | -1 | `flight` |

**⚠ Two plate-key facts a later lane will trip over.** §4's Q3b amendment says the keel plate "is keyed
off the existing `house` value (`keel_<houseKey>`)". The plates an earlier lane actually shipped are
keyed by **keel slug** — `keel_iron_verdict`, not `keel_reclamation`. Existing catalog keys are never
renamed and no plate is duplicated under a second key, so `KEEL_BY_HOUSE` is what reconciles the
amendment's intent with the shipped art. Second: the ten roster houses' twenty crest/keel plates
already existed; the **six** plates for the three legacy presets are new in this lane and sit in the
`LANE H` tail block of `src/lib/imageLibrary.js`, not in the `THE GREAT HOUSES` block.

### 6.2 The Creed axis decides the Departure

The mapping is a table over the **whole** legal domain of the axis, not a rule with a default, so
there is no seed value it silently fails to answer for:

| Creed seed | Departure | Reading (LORE §2) |
| --- | --- | --- |
| +1 … +3 | `recall` | preserve the works, light the signal; the Key is an appeal |
| 0 | `finished_ledger` | nobody is coming; passage is bought or built |
| −1 | `flight` | they *fled*; the Key must never be turned |
| −2 … −3 | `discarding` | we were equipment; we climb on our own hull |

`CREEDS[k].axisLean` **cannot** carry this on its own, and `PLATFORM_HANDOFF.md` G4 slightly overstates
it when it says the Departure "can be derived from its axis position" by that field: `flight` and
`finished_ledger` both lean `0`, so the lean is 2-to-1 ambiguous and only the seed distinguishes them.
The −1 band is the Flight because LORE §2 calls the Flight "the axis's dark orthogonal" — its holders
read Reclaimer-side because they reject the inheritance, but they reject it in order to **seal** it,
not to smelt it. That is exactly what house 4's own asterisk (`Creed −1*`) was flagging. Every one of
the ten houses resolves to the Departure LORE §7 already gives it; the table was read off §7 and the
seeds, not fitted to them afterwards.

**One seed was corrected to make that true, and it is the only number in §1 this lane changed.** The
Commonweal March's Creed seed read **−1**, which the table above would make the Flight. LORE §2 names
"much of the Commonweal" among the holders of **the Discarding**, LORE §7 gives it "a people who cannot
feed each other have no business among stars", and its own entry above reads *No-Patron (communal)* —
all three are the Discarding. The seed is now **−2**. Nothing else in §1 moved.

**Still open, for the LORE owner — not fixed here, because §3 does not assign this lane LORE §2.**
LORE §2's "Who holds it" column lists **the Emberwrights** under *The Finished Ledger*. The roster gives
that house *No-Patron (technical)* at Creed **−2**, LORE §7 gives it "beat the Rent and build the New
Ignition", and Lane G's `the_new_ignition` relic project carries `creedLock: 'discarding'` — so the
Emberwright Union ships as **the Discarding** and LORE §2's holder list is the stale line. It is a
one-cell edit in a section this lane may not touch. Flagged, not made.

### 6.3 Which Lane F / G / I keys each house claims

`uniqueRoster.squads` and `.upgrades` are the house's **signature** pair from §5 above — signature,
never exclusive; only a row's own `creedLock` / `factionLock` restricts who may field it, and §5 spends
exactly one such lock (`pilgrim_levy`, `creedLock: 'recall'`, on the Procession, whose derived Departure
is `recall`). `.patterns` are Lane I `WEAPON_PATTERNS`; `.decree` is a Lane G `ARMORY_ITEMS` row with
`kind: 'decree'`.

| `house` | squads (Lane F) | upgrade kits (Lane F) | decree (Lane G) | weapon patterns (Lane I) |
| --- | --- | --- | --- | --- |
| `kessel` | `assault`, `flame_team` | `storm_hoods`, `drum_magazines` | `universal_levy` | `tp226_seamfire_trench_projector_mk2`, `hw302_sledge_shoulder_gun_mk1` |
| `ironsynod` | `crawler`, `gunners` | `armor_skirts`, `drum_magazines` | `war_bonds_decree` | `cl206_tollgate_sustained_gun_mk2`, `hw184_combine_squad_automatic_mk3` |
| `grauwall` | `riflemen`, `pioneers` | `wire_spades`, `sapper_plate` | `fuel_ration_act` | `hw141_levy_rifle_mk2`, `cl221_crossloom_light_mortar_mk2` |
| `reclamation` | `stormtroops`, `riflemen` | `radio_pack`, `sapper_plate` | `emergency_powers_act` | `rs229_verdict_service_rifle_mk3`, `rs236_levy_trench_automatic_mk2`, `rs257_ironworks_belt_gun_mk2` |
| `combine` | `autocar_scouts`, `provost` | `armor_skirts`, `drum_magazines` | `charter_of_passage` | `cl252_waymark_pattern_rifle_mk1`, `cl274_knotwork_light_gun_mk1`, `sy277_prizeyard_turret_gun_mk3` |
| `synod` | `marksmen`, `pioneers` | `marksman_pattern`, `wire_spades` | `reliquary_act` | `fs171_ferryman_watch_rifle_mk2`, `fs159_ninefold_vigil_rifle_mk1`, `fs188_reliquary_officers_sidearm_mk2` |
| `covenant` | `sappers`, `flame_team` | `sapper_plate`, `storm_hoods` | `sealed_sites_order` | `em276_cinder_breaching_rifle_mk1`, `cl281_openhand_shaped_lance_mk1`, `hw249_bottoms_gallery_burner_mk1` |
| `ascendancy` | `siege_mortar`, `marksmen` | `gas_shells`, `radio_pack` | `wakewatch_act` | `as294_longear_ranging_rifle_mk1`, `as256_beacon_ranging_gun_mk1`, `as268_copperline_long_rifle_mk2` |
| `commonweal` | `digger_corps`, `provost` | `wire_spades`, `marksman_pattern` | `hearth_and_bulwark` | `hw203_sledge_short_rifle_mk1`, `hw218_sledge_trench_sweeper_mk1`, `hw166_bottoms_pit_revolver_mk1` |
| `salvage` | `autocar_scouts`, `assault` | `mine_flails`, `drum_magazines` | `ordinance_common_metal` | `sy288_knife_room_gun_mk5`, `sy245_bailiff_boarding_gun_mk2`, `sy277_prizeyard_turret_gun_mk3` |
| `emberwright` | `land_dreadnought`, `sappers` | `armor_skirts`, `sapper_plate` | `breaking_yards_act` | `em291_forgeworks_breakthrough_gun_mk1`, `em214_winter_anti_crawler_rifle_mk2`, `tp305_slagline_hull_projector_mk1` |
| `procession` | `pilgrim_levy`, `flame_team` | `wire_spades`, `storm_hoods` | `writ_of_consecration` | `fs159_ninefold_vigil_rifle_mk1`, `tp313_firetongue_incendiary_mortar_mk1`, `rs263_verdict_commune_mortar_mk3` |
| `outrider` | `ski_troops`, `autocar_scouts` | `ski_conversions`, `radio_pack` | `standing_corps_act` | `ow197_courier_dust_carbine_mk2`, `ow311_dustpromise_field_rifle_mk2`, `ow259_skimline_saddle_gun_mk1` |

Three properties of that table are gated in `test/presets.test.js` rather than asserted here in prose:

1. **Every key exists** in the live `SQUAD_TYPES`, `UPGRADES`, `ARMORY_ITEMS` and `WEAPON_PATTERNS`,
   read out of `base44/shared/*.ts` at test time — not out of a copy.
2. **Every kit and every pattern fits at least one of that house's own signature squads**
   (`appliesTo` ∩ `squads` ≠ ∅). A gun the house's men cannot carry is not a signature.
3. **The thirteen decrees are distinct** — one act of the Assembly per house — and where a decree
   carries a `creedLock`, the lock **equals** the house's derived Departure. Four of the thirteen are
   creed-locked and all four land on a house that holds that creed: `charter_of_passage`
   (`finished_ledger`) → the Combine, `sealed_sites_order` (`flight`) → the Covenant,
   `breaking_yards_act` (`discarding`) → the Emberwrights, `writ_of_consecration` (`recall`) → the
   Procession.

**Keys requested for reconciliation: none.** Every key this lane wanted exists upstream; nothing was
dropped, and nothing was invented.

**Two notes for Lane I's owner, neither of them a defect.** `Manufacturer.access` is keyed by the ten
roster `house` stems, which match this lane's exactly — no renaming was needed anywhere. It carries no
entry for the three legacy stems (`kessel`, `ironsynod`, `grauwall`), so those three houses' patterns
are chosen on `appliesTo` fit alone; if access is ever consulted for a preset, those three need rows.
And the Covenant of Locks has **no native weapon maker** among the nine that build `WEAPON_PATTERNS`
(its native maker, `mw_grimwold_treadworks`, is a Lane J chassis house), so its three signature patterns
are licensed ones — which is in character for a house that buys its tools and buries what it finds.

### 6.4 Contract questions this lane found and did **not** re-litigate

- **A preset's `lore` is required to be 120–180 words, and the three legacy rows are required to be
  byte-identical. They are 62, 61 and 64 words.** Both requirements are in the Lane H brief and they
  cannot both hold. Byte-identity governs — live saves reference those rows — so the word-count gate is
  scoped **by id**, to the ten houses this lane authors, and the three frozen rows are excluded by name
  rather than by position. Recorded here so the exclusion is a decision and not an oversight.
- **A `netPoints` of `−1` is legal and three houses ship one.** The contract is `netPoints <= 0`, not
  `=== 0`, and the shipped `grauwall_marches` ledger has been `−1` since before this lane. The
  Commonweal, the Emberwrights and the Compact each leave a point unspent, in character; the test
  asserts the contract, not a stricter reading of it.
- **`module` certification grants nothing** (orchestrator ruling 2, 2026-09-02). No preset's lore,
  trait or decree implies a house-wide bonus from unlocking a `kind: 'module'` row; a module's effects
  apply on fit, in its bay, and nowhere else.

### 6.5 The nomad-keel requisitions, Chapter VI and the thirteen herald packs [Lane H, step 2]

**Eight new point-buy perks** (`src/lib/pointBuy.js` + `base44/shared/perkMods.ts`) — four assets, four
liabilities, all tied to the March itself rather than to a capital that sits: the graze, the swath, the
draught columns and the boarding deck (`ECONOMY_DESIGN` §§2–5, `VISION` §3).

| id | cat | `pts` | compiled effect | the shipped rows that price it |
| --- | --- | --- | --- | --- |
| `draught_columns` | asset | 1 | +1 Steel income, −1 Fuel income | `industrial_base` (+3), `fuel_shortage` (−2) |
| `boarding_parties` | asset | 1 | riflemen attack +1, riflemen cost +1 Manpower | `veteran_corps` (+3), `rusting_arsenal` (−2) |
| `field_refit_train` | asset | 2 | crawler cost −1 Steel | `conscription` (+2) |
| `ranging_batteries` | asset | 3 | artillery attack +1 | `veteran_corps` (+3) |
| `swath_bound` | liability | −2 | −1 Manpower income | `fuel_shortage` (−2) |
| `stripped_escorts` | liability | −1 | crawler defense −1, crawler cost −1 Steel | `green_recruits` (−3), `conscription` (+2) |
| `tribute_graze` | liability | −3 | −1 Fuel income, −10 disposition | `fuel_shortage` (−2), `pariah_state` (−1) |
| `exposed_batteries` | liability | −3 | artillery defense −1 | `green_recruits` (−3) |

**No `pts` above is an opinion.** Each is the sum of its own `PERK_MODS` steps under a schedule with one
shipped anchor per step, and `test/presets.test.js` recomputes **all fifteen** shipped asset/liability
rows *and* all eight of these from that schedule before asserting the published figure. A lever/sign
combination no shipped row anchors — positive `disposition`, negative `capitalDefense` — has no entry and
the pricer **throws** on it, so the schedule cannot be quietly extended by a row that needs an invented
step. The five `cat: "upgrade"` rows are the one exemption and it is **measured, not explained**: kits
depart from the schedule in *both* directions (`naval_rams` and `drop_tanks` a point under it,
`flame_projectors` two points over), so the test pins all five deltas individually rather than calling
it a discount.

`ranging_batteries` and `exposed_batteries` name **`artillery`** — a legal `UNIT_TYPES` key that not one
of the twenty shipped perks had ever touched. A lane that had read the shipped rows as the permitted set
would have concluded it was off-limits; the suite asserts both that no shipped perk uses it and that
this one does, so the next reader cannot make that mistake either.

**Three arithmetic corrections, all against figures published in the Lane H brief.**

1. **Check 14's `PERKS.length >= 29` ("21 shipped + 8 new") is unsatisfiable.** `main` ships **20**
   perks, not 21. With "exactly 4 new assets and exactly 4 new liabilities" also binding, the catalog
   can only reach **28**. Rather than pad it with a ninth perk to reach a false number, the count is
   asserted from the two id lists it is actually made of — the twenty shipped ids by name, plus this
   lane's eight by name — so a later Field Amendment may append a twenty-ninth without touching a line.
2. **Work item 2's "register the 8 plates in the `POINT-BUY REQUISITIONS` block" is overridden by the
   shared-file protocol**, which requires one contiguous tail block at the very end of the array. The
   eight `perk_*` plates carry `category: "perks"`, which is what files them beside the shipped
   requisition tokens; their position in the array does not.
3. **`docs/TECH_DESIGN.md` §7 Q5 is NOT edited by this lane.** §3 does not assign that file to Lane H
   and file ownership is absolute, so the ruling is encoded where this lane *does* own the surface —
   Shared Rule 7 of `HERALD_VOICES.md`, and one intercept in each of the thirteen packs — and the §7 Q5
   closure itself is reported to the orchestrator for the doc's owner to make. Recorded here rather than
   made, on the same footing as LORE §2's Emberwright cell in §6.2.

**Lifepath Chapter VI — The Standard.** Four options mapping one-to-one onto the four `std_*` plates that
already exist; no new plate is registered. `column` → `attack_bonus`/riflemen, `reliquary` →
`defense_bonus`/riflemen, `black` → `defense_bonus`/crawler, `first_keel` → `income_flat`; every effect
`value: 1`, in the `synthesizeFaction` schema. **`unit_discount` is deliberately unused** — the chapter is
data, not a closed set, and no gate here forbids a later amendment from spending it. The four shipped
chapters are deep-equalled against a fixture in the suite, which is what proves this is an addition.

**Thirteen herald packs.** `docs/HERALD_VOICES.md` goes from 3 packs to **13** — 3 moods × 3 samples =
**117** intercepts, with the canon sample lines of the Reclamation, Combine and Synod redistributed
across the moods and asserted still present by opening phrase, never deleted. Pack keys are the `house`
stems of §6.1. The file is parsed by the suite with each pack bounded from its own `## ` heading to the
**next** one rather than to end-of-file: Lane H is last today, Field Amendments append after it, and a
slice that ran to EOF would swallow them.

**The relic-project loss, in thirteen registers.** Operator ruling: on capture the captor loots the
running project's unspent **materials**; the project, its progress and its housed-Object requirement are
**lost**. It is written into Shared Rule 7 and into one intercept per pack, and the suite asserts both
that every register reports it and that **no register reports a captured works as an inheritance** —
because no house ever inherits one. The Reclamation concludes it, the Combine writes it off as a
non-transferable total loss, the Synod enters it in the Roll as a housing that cannot travel, the
Covenant is *glad* of the rule, the Court finds that it drafted the rule itself and dislikes reading it
from this side, and the Compact says it warned the Compact.

**One ledger correction and seven rewrites.** Content nothing picks is not shipped content, so seven of
the ten authored houses now spend at least one new perk; every rewrite is a swap inside a still-legal
ledger, because eight of the thirteen were already at the three-liability cap. The full list, with
reasons, is in the header comment of `src/lib/presetFactions.js`. Two notes worth having here: the
Reclamation's `fuel_shortage` + `pariah_state` became the single act `tribute_graze`, which **compiles
identically** and frees a liability slot; and the Compact's `rusting_arsenal` → `stripped_escorts` moved
that ledger from −1 to **0**. The three legacy ledgers are untouched and the suite asserts they pick no
new perk. Three ledgers still ship at `netPoints === −1` — `charter_combine`, `commonweal_march` and the
long-shipped `grauwall_marches` — which the contract permits (`<= 0`, not `=== 0`).
