# ART MANIFEST — placeholder plates awaiting generation

Every placeholder plate registered by a content lane in `src/lib/imageLibrary.js` with `url: null`.
The Base44 session batch-generates these and delivers the URLs into `src/lib/imagePlates.js`.

**Rules that produced this list** (§6.10): content lanes ship **no visuals** — no image files, no SVG art,
no `PLATE_URLS` entries, no `UnitSprite.jsx` edits. A plate is `P(key, category, title, desc, prompt, aspect)`
with `url` null. The prompt must **not** restate `HOUSE_STYLE` — it is prepended at generation time, and
repeating it doubles the style clause.

New `IMAGE_CATEGORIES` keys introduced by this plan: `arms` (Lane I), `motor` (Lane J).

| Key | Category | Aspect | Subject (one line) |
| --- | --- | --- | --- |
| `arms_hw166_bottoms_pit_revolver_mk1` | arms | 16:9 | Bottoms 166 Pit Revolver, Mk I |
| `arms_sy214_writ_yard_automatic_mk3` | arms | 16:9 | Writ 214 Yard Automatic, Mk III |
| `arms_fs188_reliquary_officers_sidearm_mk2` | arms | 16:9 | Reliquary 188 Officer's Sidearm, Mk II |
| `arms_ow197_courier_dust_carbine_mk2` | arms | 16:9 | Courier 197 Dust Carbine, Mk II |
| `arms_hw203_sledge_short_rifle_mk1` | arms | 16:9 | Sledge 203 Short Rifle, Mk I |
| `arms_rs241_unity_column_carbine_mk4` | arms | 16:9 | Unity 241 Column Carbine, Mk IV |
| `arms_hw141_levy_rifle_mk2` | arms | 16:9 | Hundredweight 141 Levy Rifle, Mk II |
| `arms_rs229_verdict_service_rifle_mk3` | arms | 16:9 | Verdict 229 Service Rifle, Mk III |
| `arms_cl252_waymark_pattern_rifle_mk1` | arms | 16:9 | Waymark 252 Pattern Rifle, Mk I |
| `arms_as268_copperline_long_rifle_mk2` | arms | 16:9 | Copperline 268 Long Rifle, Mk II |
| `arms_em276_cinder_breaching_rifle_mk1` | arms | 16:9 | Cinder 276 Breaching Rifle, Mk I |
| `arms_ow311_dustpromise_field_rifle_mk2` | arms | 16:9 | Dustpromise 311 Field Rifle, Mk II |
| `arms_fs159_ninefold_vigil_rifle_mk1` | arms | 16:9 | Ninefold 159 Vigil Rifle, Mk I |
| `arms_rs236_levy_trench_automatic_mk2` | arms | 16:9 | Levy 236 Trench Automatic, Mk II |
| `arms_sy288_knife_room_gun_mk5` | arms | 16:9 | Knife 288 Room Gun, Mk V |
| `arms_ow259_skimline_saddle_gun_mk1` | arms | 16:9 | Skimline 259 Saddle Gun, Mk I |
| `arms_hw184_combine_squad_automatic_mk3` | arms | 16:9 | Combine 184 Squad Automatic, Mk III |
| `arms_rs257_ironworks_belt_gun_mk2` | arms | 16:9 | Ironworks 257 Belt Gun, Mk II |
| `arms_cl274_knotwork_light_gun_mk1` | arms | 16:9 | Knotwork 274 Light Gun, Mk I |
| `arms_cl206_tollgate_sustained_gun_mk2` | arms | 16:9 | Tollgate 206 Sustained Gun, Mk II |
| `arms_em233_anvilgate_heavy_gun_mk1` | arms | 16:9 | Anvilgate 233 Heavy Gun, Mk I |
| `arms_rs299_state_pintle_gun_mk4` | arms | 16:9 | State 299 Pintle Gun, Mk IV |
| `arms_sy245_bailiff_boarding_gun_mk2` | arms | 16:9 | Bailiff 245 Boarding Gun, Mk II |
| `arms_hw218_sledge_trench_sweeper_mk1` | arms | 16:9 | Sledge 218 Trench Sweeper, Mk I |
| `arms_fs171_ferryman_watch_rifle_mk2` | arms | 16:9 | Ferryman 171 Watch Rifle, Mk II |
| `arms_as294_longear_ranging_rifle_mk1` | arms | 16:9 | Longear 294 Ranging Rifle, Mk I |
| `arms_hw262_bottoms_selected_rifle_mk3` | arms | 16:9 | Bottoms 262 Selected Rifle, Mk III |
| `arms_em214_winter_anti_crawler_rifle_mk2` | arms | 16:9 | Winter 214 Anti-Crawler Rifle, Mk II |
| `arms_cl281_openhand_shaped_lance_mk1` | arms | 16:9 | Openhand 281 Shaped Lance, Mk I |
| `arms_hw302_sledge_shoulder_gun_mk1` | arms | 16:9 | Sledge 302 Shoulder Gun, Mk I |
| `arms_tp226_seamfire_trench_projector_mk2` | arms | 16:9 | Seamfire 226 Trench Projector, Mk II |
| `arms_tp305_slagline_hull_projector_mk1` | arms | 16:9 | Slagline 305 Hull Projector, Mk I |
| `arms_hw249_bottoms_gallery_burner_mk1` | arms | 16:9 | Bottoms 249 Gallery Burner, Mk I |
| `arms_cl221_crossloom_light_mortar_mk2` | arms | 16:9 | Crossloom 221 Light Mortar, Mk II |
| `arms_rs263_verdict_commune_mortar_mk3` | arms | 16:9 | Verdict 263 Commune Mortar, Mk III |
| `arms_rs278_state_concussion_mortar_mk2` | arms | 16:9 | State 278 Concussion Mortar, Mk II |
| `arms_em239_forgeworks_battalion_mortar_mk1` | arms | 16:9 | Forgeworks 239 Battalion Mortar, Mk I |
| `arms_tp313_firetongue_incendiary_mortar_mk1` | arms | 16:9 | Firetongue 313 Incendiary Mortar, Mk I |
| `arms_tp317_tarpool_fume_mortar_mk1` | arms | 16:9 | Tarpool 317 Fume Mortar, Mk I |
| `arms_em247_emberwright_hull_gun_mk2` | arms | 16:9 | Emberwright 247 Hull Gun, Mk II |
| `arms_sy277_prizeyard_turret_gun_mk3` | arms | 16:9 | Prizeyard 277 Turret Gun, Mk III |
| `arms_em291_forgeworks_breakthrough_gun_mk1` | arms | 16:9 | Forgeworks 291 Breakthrough Gun, Mk I |
| `arms_cl318_tollgate_casemate_gun_mk1` | arms | 16:9 | Tollgate 318 Casemate Gun, Mk I |
| `arms_cl235_crossloom_field_piece_mk2` | arms | 16:9 | Crossloom 235 Field Piece, Mk II |
| `arms_as256_beacon_ranging_gun_mk1` | arms | 16:9 | Beacon 256 Ranging Gun, Mk I |
| `arms_em284_anvilgate_siege_howitzer_mk2` | arms | 16:9 | Anvilgate 284 Siege Howitzer, Mk II |
| `arms_fs198_reliquary_keel_gun_mk1` | arms | 16:9 | Reliquary 198 Keel Gun, Mk I |
| `arms_as272_antenna_wing_cannon_mk2` | arms | 16:9 | Antenna 272 Wing Cannon, Mk II |
| `arms_sy296_adjudicated_nose_battery_mk1` | arms | 16:9 | Adjudicated 296 Nose Battery, Mk I |
| `maker_hundredweight_works` | arms | 1:1 | The Hundredweight Combine Works |
| `maker_reclamation_state_arsenal` | arms | 1:1 | The State Arsenal of the Reclamation |
| `maker_emberwright_foundries` | arms | 1:1 | The Emberwright Union Foundries |
| `maker_ferrymen_shrine_armoury` | arms | 1:1 | The Ferrymen's Shrine-Armoury |
| `maker_salvage_court_prize_yard` | arms | 1:1 | The Prize Yard of the Salvage Court |
| `maker_crossloom_pattern_house` | arms | 1:1 | The Crossloom Pattern House |
| `maker_ascendancy_signal_works` | arms | 1:1 | The Signal Works of the Ascendancy |
| `maker_outrider_wheelwrights` | arms | 1:1 | The Outrider Wheelwrights |
| `maker_tarpool_burnworks` | arms | 1:1 | The Tarpool Burnworks |
| `mod_kit_barrel_long_pattern` | arms | 1:1 | Long-Pattern Barrel Assembly |
| `mod_kit_barrel_cut_down` | arms | 1:1 | Cut-Down Barrel |
| `mod_kit_barrel_heavy_profile` | arms | 1:1 | Heavy-Profile Barrel |
| `mod_kit_barrel_chrome_bore` | arms | 1:1 | Chrome-Lined Bore |
| `mod_kit_barrel_quick_change` | arms | 1:1 | Quick-Change Barrel Sleeve |
| `mod_kit_barrel_yard_relined` | arms | 1:1 | Prize-Yard Re-Lining |
| `mod_kit_barrel_seam_bored` | arms | 1:1 | Seam-Bored Projector Tube |
| `mod_kit_optic_ranging_telescope` | arms | 1:1 | Ranging Telescope |
| `mod_kit_optic_open_battle_sight` | arms | 1:1 | Open Battle Sight |
| `mod_kit_optic_ministry_rangefinder` | arms | 1:1 | Ministry Coincidence Rangefinder |
| `mod_kit_optic_dark_run_prism` | arms | 1:1 | Dark-Run Prism |
| `mod_kit_optic_ghost_ring` | arms | 1:1 | Ghost-Ring Aperture |
| `mod_kit_magazine_drum` | arms | 1:1 | Drum Magazine |
| `mod_kit_magazine_extended_box` | arms | 1:1 | Extended Box Magazine |
| `mod_kit_magazine_stripper_guide` | arms | 1:1 | Stripper-Clip Guide |
| `mod_kit_magazine_belt_feed` | arms | 1:1 | Disintegrating Belt Feed |
| `mod_kit_magazine_ready_rack` | arms | 1:1 | Ready-Rack Cradle |
| `mod_kit_magazine_lightened_follower` | arms | 1:1 | Lightened Follower Set |
| `mod_kit_stock_bipod` | arms | 1:1 | Folding Bipod |
| `mod_kit_stock_fitted_cheekpiece` | arms | 1:1 | Fitted Cheekpiece |
| `mod_kit_stock_folding` | arms | 1:1 | Folding Stock Assembly |
| `mod_kit_stock_recoil_pad` | arms | 1:1 | Sprung Recoil Pad |
| `mod_kit_stock_harness_frame` | arms | 1:1 | Carrying-Harness Frame |
| `mod_kit_stock_shoulder_brace` | arms | 1:1 | Heavy Shoulder Brace |
| `mod_kit_muzzle_brake` | arms | 1:1 | Slotted Muzzle Brake |
| `mod_kit_muzzle_flash_hider` | arms | 1:1 | Cone Flash Hider |
| `mod_kit_muzzle_ported_compensator` | arms | 1:1 | Ported Compensator |
| `mod_kit_muzzle_grenade_cup` | arms | 1:1 | Muzzle Grenade Cup |
| `mod_kit_muzzle_blast_diffuser` | arms | 1:1 | Blast Diffuser Shroud |
| `mod_kit_bayonet_socket_blade` | arms | 1:1 | Socket Blade |
| `mod_kit_bayonet_trench_knife_lug` | arms | 1:1 | Trench-Knife Lug |
| `mod_kit_bayonet_sword_pattern` | arms | 1:1 | Sword-Pattern Bayonet |
| `mod_kit_bayonet_pioneer_spade` | arms | 1:1 | Pioneer Spade Fitting |
| `mod_kit_ammo_hardened_core` | arms | 1:1 | Hardened-Core Lot |
| `mod_kit_ammo_hollow_base` | arms | 1:1 | Hollow-Base Lot |
| `mod_kit_ammo_shaped_charge` | arms | 1:1 | Shaped-Charge Lot |
| `mod_kit_ammo_case_filled` | arms | 1:1 | Case-Filled Lot |
| `mod_kit_ammo_thickened_charge` | arms | 1:1 | Thickened-Charge Lot |
| `mod_kit_ammo_fume_filling` | arms | 1:1 | Fume Filling |
| `mod_kit_ammo_proof_lot` | arms | 1:1 | Proof-House Lot |
| `mod_kit_ammo_reduced_charge` | arms | 1:1 | Reduced-Charge Lot |
| `mod_kit_ammo_overpressure_lot` | arms | 1:1 | Overpressure Lot |
| `mod_kit_mount_pintle` | arms | 1:1 | Pintle Mounting |
| `mod_kit_mount_sprung_cradle` | arms | 1:1 | Sprung Recoil Cradle |
| `mod_kit_mount_traversing_ring` | arms | 1:1 | Traversing Ring Mounting |
| `mod_kit_mount_dug_in_platform` | arms | 1:1 | Dug-In Platform Bed |
| `mod_kit_mount_casemate_trunnion` | arms | 1:1 | Casemate Trunnion Block |
| `tech_boarding_doctrine` | doctrine | 4:3 | Boarding Doctrine |
| `tech_saturation_barrage` | doctrine | 4:3 | Saturation Barrage |
| `tech_bonded_manifests` | doctrine | 4:3 | Bonded Manifests |
| `tech_continuous_casting` | doctrine | 4:3 | Continuous Casting Order |
| `tech_grand_quartermastery` | doctrine | 4:3 | Grand Quartermastery |
| `tech_red_traffic_discipline` | doctrine | 4:3 | Red-Traffic Discipline |
| `tech_listening_posts` | doctrine | 4:3 | Listening Posts |
| `tech_traffic_analysis` | doctrine | 4:3 | Traffic Analysis |
| `tech_vigil_watch` | doctrine | 4:3 | The Vigil Watch |
| `tech_intercept_bureau` | doctrine | 4:3 | The Intercept Bureau |
| `tech_survey_cadres` | doctrine | 4:3 | Survey Cadres |
| `tech_assay_procedure` | doctrine | 4:3 | Assay Procedure |
| `tech_sealing_protocols` | doctrine | 4:3 | Sealing Protocols |
| `tech_deep_shaft_works` | doctrine | 4:3 | Deep-Shaft Works |
| `tech_stripping_yards` | doctrine | 4:3 | The Stripping Yards |
| `tech_pattern_book` | doctrine | 4:3 | The Pattern Book |
| `decree_emergency_powers_act` | decrees | 4:3 | The Emergency Powers Act |
| `decree_sealed_sites_order` | decrees | 4:3 | The Sealed-Sites Order |
| `decree_standing_corps_act` | decrees | 4:3 | The Standing Corps Act |
| `decree_charter_of_passage` | decrees | 4:3 | The Charter of Passage |
| `decree_reliquary_act` | decrees | 4:3 | The Reliquary Act |
| `decree_writ_of_consecration` | decrees | 4:3 | The Writ of Consecration |
| `decree_breaking_yards_act` | decrees | 4:3 | The Breaking-Yards Act |
| `decree_ordinance_common_metal` | decrees | 4:3 | The Ordinance of Common Metal |
| `decree_wakewatch_act` | decrees | 4:3 | The Wakewatch Act |
| `relic_lance_carriage` | relics | 4:3 | Relic Project — the Lance Carriage |

## Expected volume by lane

| Lane | Plate families | Rough count |
| --- | --- | --- |
| F | `unit_<key>_token` per squad type, `unit_<key>_action` for vehicles | ~16–25 |
| G | `tech_<key>` per tech, `decree_<key>` per decree, relic-project plates | ~30+ |
| H | `house_<key>_crest` + `keel_<key>` per house, settlement + ideology + `std_*` plates | ~35+ |
| I | `arms_<key>` per pattern (≥40), `maker_<key>` per manufacturer (≥8), `mod_kit_<key>` per mod (≥25) | ~75+ |
| J | `chassis_<key>` (≥18), `plant_<key>` (≥8), `refit_<key>` per package/mod (≥35) | ~60+ |
