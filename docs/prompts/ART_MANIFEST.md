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
| `chassis_outrider_129_whippet_mk2` | motor | 4:3 | Outrider 129 Whippet, Mk II |
| `chassis_knife_136_ferret_mk3` | motor | 4:3 | Knife 136 Ferret, Mk III |
| `chassis_hundredweight_141_line_crawler` | motor | 4:3 | Hundredweight 141 Line Crawler |
| `chassis_verdict_144_levy_crawler` | motor | 4:3 | Verdict 144 Levy Crawler |
| `chassis_tollgate_147_knotwork_crawler_mk2` | motor | 4:3 | Tollgate 147 Knotwork Crawler, Mk II |
| `chassis_grimwold_138_breaker_mk3` | motor | 4:3 | Grimwold 138 Breaker, Mk III |
| `chassis_forgeworks_152_cinderhead` | motor | 4:3 | Forgeworks 152 Cinderhead |
| `chassis_grimwold_156_lockjaw_mk1` | motor | 4:3 | Grimwold 156 Lockjaw, Mk I |
| `chassis_drover_134_provender_carrier` | motor | 4:3 | Drover 134 Provender Carrier |
| `chassis_seamfire_143_burnwagon` | motor | 4:3 | Seamfire 143 Burnwagon |
| `chassis_dustpromise_131_courier_mk2` | motor | 4:3 | Dustpromise 131 Courier, Mk II |
| `chassis_copperline_139_beacon_car` | motor | 4:3 | Copperline 139 Beacon Car |
| `chassis_sledge_145_pit_gun` | motor | 4:3 | Sledge 145 Pit Gun |
| `chassis_harrow_149_slaghound_mk2` | motor | 4:3 | Harrow 149 Slaghound, Mk II |
| `chassis_crossloom_128_field_carriage` | motor | 4:3 | Crossloom 128 Field Carriage |
| `chassis_punt_137_shoalcutter` | motor | 4:3 | Punt 137 Shoalcutter |
| `chassis_reliquary_124_monitor_mk2` | motor | 4:3 | Reliquary 124 Monitor, Mk II |
| `chassis_kestrel_150_lofter_mk2` | motor | 4:3 | Kestrel 150 Lofter, Mk II |
| `chassis_adjudicated_142_writhawk` | motor | 4:3 | Adjudicated 142 Writhawk |
| `chassis_longshadow_154_span_mk1` | motor | 4:3 | Longshadow 154 Span, Mk I |
| `plant_hw_flatbed_diesel_60` | motor | 4:3 | Hundredweight Flatbed Diesel, 60 hp |
| `plant_rs_levy_diesel_95` | motor | 4:3 | State Levy Diesel, 95 hp |
| `plant_cl_knotwork_diesel_140` | motor | 4:3 | Knotwork Governed Diesel, 140 hp |
| `plant_em_anvilgate_diesel_240` | motor | 4:3 | Anvilgate Twin-Bank Diesel, 240 hp |
| `plant_em_forgeworks_diesel_460` | motor | 4:3 | Forgeworks Gallery Diesel, 460 hp |
| `plant_tp_seamfire_flash_boiler_180` | motor | 4:3 | Seamfire Flash Boiler, 180 hp |
| `plant_ow_courier_alcohol_75` | motor | 4:3 | Courier Alcohol Burner, 75 hp |
| `plant_kh_boneyard_pieced_diesel_120` | motor | 4:3 | Boneyard Pieced Diesel, 120 hp |
| `plant_rw_shoal_marine_diesel_310` | motor | 4:3 | Shoalworks Marine Diesel, 310 hp |
| `plant_as_beacon_turbine_540` | motor | 4:3 | Beacon Gas Turbine, 540 hp |
| `plant_ls_lofter_radial_620` | motor | 4:3 | Lofter Radial, 620 hp |
| `plant_fs_reliquary_cell_800` | motor | 4:3 | Reliquary Cell, 800 hp |
| `refit_ap_gun_shield` | motor | 1:1 | Gun-Shield & Trail Plate |
| `refit_ap_seat_and_sump` | motor | 1:1 | Seat-Back & Sump Plate |
| `refit_ap_sandbag_stowage` | motor | 1:1 | Sandbag & Spare-Track Stowage |
| `refit_ap_overhead_grillage` | motor | 1:1 | Overhead Grillage |
| `refit_ap_spaced_screens` | motor | 1:1 | Spaced Screens |
| `refit_ap_bolted_salvage` | motor | 1:1 | Bolted Salvage Plate |
| `refit_ap_rolled_plate_suit` | motor | 1:1 | Rolled Plate Suit |
| `refit_ap_cast_glacis` | motor | 1:1 | Cast Glacis |
| `refit_ap_sealed_fume_hull` | motor | 1:1 | Sealed Fume Hull |
| `refit_ap_face_hardened_belt` | motor | 1:1 | Face-Hardened Belt |
| `refit_ap_breakthrough_carapace` | motor | 1:1 | Breakthrough Carapace |
| `refit_ap_relic_alloy_skin` | motor | 1:1 | Relic-Alloy Skin |
| `refit_ap_fortress_courses` | motor | 1:1 | Fortress Courses |
| `refit_sus_line_tread` | motor | 1:1 | Line Tread |
| `refit_sus_wide_girder_tread` | motor | 1:1 | Wide-Girder Tread |
| `refit_sus_half_track_bogie` | motor | 1:1 | Half-Track Bogie |
| `refit_sus_road_wheels` | motor | 1:1 | Road Wheels |
| `refit_sus_walker_legs` | motor | 1:1 | Walker Legs |
| `refit_sus_twin_screw` | motor | 1:1 | Twin Screw |
| `refit_sus_plenum_skirt` | motor | 1:1 | Plenum Skirt |
| `refit_sus_flight_gear` | motor | 1:1 | Flight Gear |
| `refit_sus_split_trail` | motor | 1:1 | Split Trail |
| `refit_mnt_fixed_bow` | motor | 1:1 | Fixed Bow Plate |
| `refit_mnt_casemate_box` | motor | 1:1 | Casemate Box |
| `refit_mnt_howitzer_cradle` | motor | 1:1 | Howitzer Cradle |
| `refit_mnt_wing_battery` | motor | 1:1 | Wing Battery |
| `refit_mnt_open_pintle_ring` | motor | 1:1 | Open Pintle Ring |
| `refit_mnt_shielded_ring` | motor | 1:1 | Shielded Ring Mount |
| `refit_mnt_enclosed_turret` | motor | 1:1 | Enclosed Turret |
| `refit_mnt_twin_cradle` | motor | 1:1 | Twin Cradle |
| `refit_mnt_sponson_pair` | motor | 1:1 | Sponson Pair |
| `refit_mnt_barbette_tier` | motor | 1:1 | Tiered Barbette |
| `refit_vm_governor_removed` | motor | 1:1 | Governor Removed |
| `refit_vm_forced_induction` | motor | 1:1 | Forced Induction Pack |
| `refit_vm_radiator_gallery` | motor | 1:1 | Radiator Gallery |
| `refit_vm_low_compression_rebuild` | motor | 1:1 | Low-Compression Rebuild |
| `refit_vm_relic_cell_governor` | motor | 1:1 | Relic-Cell Governor |
| `refit_vm_track_skirts` | motor | 1:1 | Track Skirts |
| `refit_vm_spall_liner` | motor | 1:1 | Spall Liner |
| `refit_vm_belly_plate` | motor | 1:1 | Belly Plate |
| `refit_vm_mantlet_collar` | motor | 1:1 | Mantlet Collar |
| `refit_vm_reinforced_bogies` | motor | 1:1 | Reinforced Bogies |
| `refit_vm_wide_grousers` | motor | 1:1 | Wide Grousers |
| `refit_vm_shock_dampers` | motor | 1:1 | Shock Dampers |
| `refit_vm_dozer_blade` | motor | 1:1 | Dozer Blade |
| `refit_vm_power_traverse` | motor | 1:1 | Power Traverse |
| `refit_vm_long_barrel_gun` | motor | 1:1 | Long-Barrel Fitting |
| `refit_vm_cupola_ring` | motor | 1:1 | Commander's Cupola |
| `refit_vm_turret_basket` | motor | 1:1 | Turret Basket |
| `refit_vm_smoke_dischargers` | motor | 1:1 | Smoke Dischargers |
| `refit_vm_coaxial_pintle` | motor | 1:1 | Coaxial Pintle |
| `refit_vm_ready_racks` | motor | 1:1 | Ready Racks |
| `refit_vm_muzzle_brake_collar` | motor | 1:1 | Muzzle Brake Collar |
| `refit_vm_range_drum_sight` | motor | 1:1 | Range-Drum Sight |
| `refit_vm_night_lamp_set` | motor | 1:1 | Night Lamp Set |
| `refit_vm_stereo_rangefinder` | motor | 1:1 | Stereo Rangefinder |
| `refit_vm_command_set` | motor | 1:1 | Command Wireless Set |
| `refit_vm_signals_relay` | motor | 1:1 | Signals Relay |
| `refit_vm_direction_finder` | motor | 1:1 | Direction Finder |
| `refit_vm_external_fuel_drums` | motor | 1:1 | External Fuel Drums |
| `refit_vm_spare_link_bins` | motor | 1:1 | Spare-Link Bins |
| `refit_vm_deck_cargo_rails` | motor | 1:1 | Deck Cargo Rails |
| `refit_vm_asbestos_suits` | motor | 1:1 | Fireproofed Crew Suits |
| `refit_vm_medical_locker` | motor | 1:1 | Medical Locker |
| `refit_vm_escape_hatch_cut` | motor | 1:1 | Cut Escape Hatch |
| `refit_vm_ventilation_fans` | motor | 1:1 | Ventilation Fans |
| `maker_mw_grimwold_treadworks` | motor | 1:1 | Grimwold Treadworks |
| `maker_mw_chandlery_carriageworks` | motor | 1:1 | Chandlery Carriageworks |
| `maker_mw_kettleharrow_boneyard` | motor | 1:1 | Kettleharrow Boneyard |
| `maker_mw_longshadow_aeroworks` | motor | 1:1 | Longshadow Aeroworks |
| `maker_mw_redwater_hullyards` | motor | 1:1 | Redwater Hullyards |
| `unit_stormtroops_token` | units | 1:1 | Stormtroops — Token |
| `unit_sappers_token` | units | 1:1 | Sappers — Token |
| `unit_ski_troops_token` | units | 1:1 | Ski Troops — Token |
| `unit_digger_corps_token` | units | 1:1 | Digger Corps — Token |
| `unit_pilgrim_levy_token` | units | 1:1 | Pilgrim Levy — Token |
| `unit_provost_token` | units | 1:1 | Provost Section — Token |
| `unit_marksmen_token` | units | 1:1 | Marksmen — Token |
| `unit_flame_team_token` | units | 1:1 | Flame Team — Token |
| `unit_autocar_scouts_token` | units | 1:1 | Autocar Scouts — Token |
| `unit_siege_mortar_token` | units | 1:1 | Siege Mortar — Token |
| `unit_land_dreadnought_token` | units | 1:1 | Land Dreadnought — Token |
| `unit_autocar_scouts_action` | units | 16:9 | Autocar Scouts — Action Plate |
| `unit_siege_mortar_action` | units | 16:9 | Siege Mortar — Action Plate |
| `unit_land_dreadnought_action` | units | 16:9 | Land Dreadnought — Action Plate |
| `kit_marksman_pattern` | gear | 1:1 | Kit — Marksman Pattern |
| `kit_drum_magazines` | gear | 1:1 | Kit — Drum Magazines |
| `kit_gas_shells` | gear | 1:1 | Kit — Gas Shells |
| `kit_radio_pack` | gear | 1:1 | Kit — Radio Pack |
| `design_dispersed` | designs | 1:1 | Formation — Dispersed Order |
| `design_echelon` | designs | 1:1 | Formation — Echelon Refused |
| `design_automatics` | designs | 1:1 | Kit — Automatic Rifles |
| `design_long_rifles` | designs | 1:1 | Kit — Long Rifles |
| `design_shaped_charges` | designs | 1:1 | Kit — Shaped Charges |
| `design_entrenching` | designs | 1:1 | Armor — Entrenching Issue |
| `design_sealed_hoods` | designs | 1:1 | Armor — Sealed Hoods |
| `design_light_order` | designs | 1:1 | Armor — Light Marching Order |
| `design_heavy_plate` | designs | 1:1 | Armor — Siege Harness |
| `design_chaplaincy` | designs | 1:1 | Support — Chaplaincy Detachment |
| `design_observers` | designs | 1:1 | Support — Observation Section |
| `house_kessel_crest` | houses | 1:1 | The Kessel Pact — Crest |
| `keel_debt_of_ash` | houses | 4:3 | Keel — 'the Debt of Ash' |
| `house_ironsynod_crest` | houses | 1:1 | The Iron Synod — Crest |
| `keel_ledger_of_brass` | houses | 4:3 | Keel — 'the Ledger of Brass' |
| `house_grauwall_crest` | houses | 1:1 | The Grauwall Marches — Crest |
| `keel_verdict_of_stone` | houses | 4:3 | Keel — 'the Verdict of Stone' |
| `perk_draught_columns` | perks | 1:1 | Perk — Draught Column Circuit |
| `perk_boarding_parties` | perks | 1:1 | Perk — Boarding Parties |
| `perk_field_refit_train` | perks | 1:1 | Perk — Field Refit Train |
| `perk_ranging_batteries` | perks | 1:1 | Perk — Ranging Batteries |
| `perk_swath_bound` | perks | 1:1 | Perk — Swath-Bound |
| `perk_stripped_escorts` | perks | 1:1 | Perk — Stripped Escorts |
| `perk_tribute_graze` | perks | 1:1 | Perk — Tribute Graze |
| `perk_exposed_batteries` | perks | 1:1 | Perk — Exposed Batteries |
| `chapter_standard` | lifepath | 1:1 | Chapter VI — The Standard |

## Status — 278 requested, 689 already delivered

The content lanes registered **278** new placeholder plates across waves 1-4 (table above). The Base44
session has already generated and delivered **689** entries into `src/lib/imagePlates.js`, including all
105 arms plates. `getImage(key)` resolves a delivered URL and returns `null` otherwise, and every
component falls back to an icon or text, so an undelivered plate is always safe to ship.

**A note for whoever generates the rest.** A plate is a REQUEST (`url: null`) that the platform turns into
a delivery by adding its key to `PLATE_URLS` — `P()` resolves `url` from there. Lane I originally asserted
`url === null` for every one of its plates, which forbade delivery outright; the suite went red the first
time art actually landed. Any new plate gate must read *"the lane shipped no visual"* (`url` is null **or**
equals `PLATE_URLS[key]`), never *"no art exists"*.

| Lane | Plate families | Count |
| --- | --- | --- |
| **I** Arms | `arms_*` 49 patterns, `maker_*` 9, `mod_kit_*` 47 | 105 |
| **J** Motor Pool | `chassis_*`, `plant_*`, `refit_*` | 103 |
| **G** Doctrine | `tech_*` 16, `decree_*` 9, relic | 26 |
| **F** Units | `unit_*_token` / `unit_*_action`, design + gear patterns | 29 |
| **H** Houses | `house_*_crest`, `keel_*`, `perk_*`, `chapter_standard` | 15 |

## Expected volume by lane

| Lane | Plate families | Rough count |
| --- | --- | --- |
| F | `unit_<key>_token` per squad type, `unit_<key>_action` for vehicles | ~16–25 |
| G | `tech_<key>` per tech, `decree_<key>` per decree, relic-project plates | ~30+ |
| H | `house_<key>_crest` + `keel_<key>` per house, settlement + ideology + `std_*` plates | ~35+ |
| I | `arms_<key>` per pattern (≥40), `maker_<key>` per manufacturer (≥8), `mod_kit_<key>` per mod (≥25) | ~75+ |
| J | `chassis_<key>` (≥18), `plant_<key>` (≥8), `refit_<key>` per package/mod (≥35) | ~60+ |
