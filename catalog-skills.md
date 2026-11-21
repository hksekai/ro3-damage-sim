# RO3 Complete Skill Catalog

All skills exported from `SkillConfig.json` + `SkillTreeConfig.json`.
- **Castable Skill IDs (`_iID`)**: `GroupID * 100 + Level` (e.g., Group `11001` Lv1 = `1100101`, Lv10 = `1100110`).
- Full TSV (including monster/system skills): `catalog-skills.tsv` (3353 skill groups).

## Unassigned / Extra Player Skills

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 10010 | `1001001` | `1001001` (Lv1) | Basic Attack | Active | Physical | 0 | 1200 | 100% | 1 | 50% -> 50% |
| 10011 | `1001101` | `1001101` (Lv1) | Basic Attack | Active | Physical | 0 | 1200 | 100% | 1 | 50% -> 50% |
| 10012 | `1001201` | `1001201` (Lv1) | Basic Attack | Active | Physical | 0 | 1200 | 100% | 1 | 50% -> 50% |
| 10013 | `1001301` | `1001301` (Lv1) | Basic Attack | Active | Physical | 0 | 1200 | 100% | 1 | 50% -> 50% |
| 10014 | `1001401` | `1001401` (Lv1) | Basic Attack | Active | Physical | 0 | 1200 | 100% | 1 | 50% -> 50% |
| 10032 | `1003201` | `1003201` (Lv1) | Warg Strike | Active | Physical | 0 | 600 | 0% | 1 | 50% -> 50% |
| 10050 | `1005001` | `1005001` (Lv1) | Basic Attack | Active | Physical | 0 | 1200 | 100% | 1 | 50% -> 50% |
| 10051 | `1005101` | `1005101` (Lv1) | Basic Attack | Active | Physical | 0 | 1200 | 100% | 1 | 50% -> 50% |
| 10052 | `1005201` | `1005201` (Lv1) | Basic Attack | Active | Physical | 0 | 1200 | 100% | 1 | 50% -> 50% |
| 11000 | `1100001` | `1100001` (Lv1) | Basic Attack | Active | Physical | 0 | 1000 | 100% | 1 | 50% -> 50% |
| 11099 | `1109901` | `1109901` (Lv1) | Sword Smash | Active | Physical | 7000 | 1300 | 0% | 1 | 35% -> 35% |
| 11102 | `1110201` | `1110205` (Lv5) | Spear Expert | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11106 | `1110601` | `1110610` (Lv10) | Auto Counter | Active | Physical | 0 | 0 | 0% | 0 | 55% -> 100% |
| 11121 | `1112101` | `1112101` (Lv1) | Rapid Pierce | Active | Physical | 0 | 500 | 0% | 0 | 20% -> 20% |
| 11122 | `1112201` | `1112201` (Lv1) | Piercing Blast | Active | Physical | 0 | 500 | 0% | 0 | 10% -> 10% |
| 11123 | `1112301` | `1112301` (Lv1) | Power Slash | Active | Physical | 0 | 500 | 0% | 0 | 5% -> 5% |
| 11124 | `1112401` | `1112401` (Lv1) | Heavy Blow | Active | Physical | 0 | 500 | 0% | 0 | 50% -> 50% |
| 11125 | `1112501` | `1112501` (Lv1) | Triple Slash | Active | Physical | 0 | 500 | 0% | 0 | 50% -> 50% |
| 11126 | `1112601` | `1112601` (Lv1) | Greatsword Sweep Attack | Active | Physical | 0 | 500 | 0% | 0 | 30% -> 30% |
| 11127 | `1112701` | `1112710` (Lv10) | Double Counter | Active | Physical | 10000 | 1000 | 0% | 0 | 90% -> 180% |
| 11211 | `1121101` | `1121110` (Lv10) | Auto Counter | Active | Physical | 0 | 0 | 0% | 0 | 12% -> 30% |
| 11317 | `1131701` | `1131701` (Lv1) | Hundred Spears Stack Monitor | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11318 | `1131801` | `1131801` (Lv1) | Slash Monitor | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11381 | `1138101` | `1138105` (Lv5) | Death Bound | Active | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11382 | `1138201` | `1138201` (Lv1) | Burn | Active | Physical | 0 | 1000 | 0% | 0 | 120% -> 120% |
| 11399 | `1139901` | `1139901` (Lv1) | Skill Bar | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 11400 | `1140001` | `1140001` (Lv1) | Basic Attack | Active | Physical | 0 | 1000 | 100% | 1 | 50% -> 50% |
| 11402 | `1140201` | `1140210` (Lv10) | Increased Spear Attack Speed | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11419 | `1141901` | `1141910` (Lv10) | Shield Reflect Auto Counter | Active | Physical | 1000 | 500 | 0% | 0 | 11% -> 20% |
| 11420 | `1142001` | `1142001` (Lv1) | Recoil Auto Counter | Active | Physical | 1000 | 500 | 0% | 0 | 0% -> 0% |
| 11422 | `1142201` | `1142205` (Lv5) | Cross Blast | Active | Physical | 0 | 200 | 0% | 0 | 20% -> 25% |
| 11423 | `1142301` | `1142305` (Lv5) | Cross Thrust | Active | Physical | 0 | 200 | 0% | 0 | 50% -> 25% |
| 11424 | `1142401` | `1142405` (Lv5) | Absolute Judex | Active | Physical | 5000 | 200 | 0% | 0 | 40% -> 25% |
| 11425 | `1142501` | `1142505` (Lv5) | Shield Boomerang Combo | Active | Physical | 0 | 200 | 0% | 0 | 10% -> 25% |
| 11426 | `1142601` | `1142605` (Lv5) | Double Pressure | Active | Physical | 0 | 200 | 0% | 0 | 100% -> 25% |
| 11427 | `1142701` | `1142705` (Lv5) | Divine Punishment | Active | Physical | 0 | 200 | 0% | 0 | 80% -> 25% |
| 11428 | `1142801` | `1142805` (Lv5) | Shield Pursuit | Active | Physical | 0 | 200 | 0% | 0 | 10% -> 25% |
| 11430 | `1143001` | `1143001` (Lv1) | Skill Bar | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 11600 | `1160001` | `1160001` (Lv1) | Skill Bar | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 11603 | `1160301` | `1160305` (Lv5) | Pinpoint Attack | Active | Physical | 10000 | 500 | 0% | 0 | 36% -> 60% |
| 11605 | `1160501` | `1160505` (Lv5) | Moon Slasher | Active | Physical | 8000 | 500 | 0% | 0 | 80% -> 120% |
| 11606 | `1160601` | `1160605` (Lv5) | Sniping Shot | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11610 | `1161001` | `1161005` (Lv5) | Shield Cast | Active | Physical | 10000 | 500 | 0% | 0 | 60% -> 100% |
| 11618 | `1161801` | `1161805` (Lv5) | Thorn | Active | Physical | 0 | 500 | 0% | 0 | 20% -> 40% |
| 11619 | `1161901` | `1161905` (Lv5) | Shield Break | Active | Physical | 1000 | 500 | 0% | 0 | 60% -> 100% |
| 11620 | `1162001` | `1162005` (Lv5) | Reflect Damage Passive | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11621 | `1162101` | `1162105` (Lv5) | Spear Auto Counter | Active | Physical | 400 | 500 | 0% | 0 | 60% -> 100% |
| 11622 | `1162201` | `1162205` (Lv5) | Charge Up Strike | Active | Physical | 0 | 500 | 0% | 0 | 30% -> 50% |
| 11623 | `1162301` | `1162301` (Lv1) | Shield Bash Enhance | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11625 | `1162501` | `1162501` (Lv1) | Earthshaker | Active | Physical | 10000 | 2500 | 0% | 0 | 100% -> 100% |
| 11641 | `1164101` | `1164101` (Lv1) | Block Impact | Active | Physical | 0 | 500 | 0% | 0 | 0% -> 0% |
| 12099 | `1209901` | `1209901` (Lv1) | Spell Smash | Active | Physical | 7000 | 1500 | 0% | 1 | 35% -> 35% |
| 12300 | `1230001` | `1230001` (Lv1) | Skill Bar | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 12317 | `1231701` | `1231701` (Lv1) | Reading Spellbook | Active | Physical | 20000 | 500 | 0% | 1 | 0% -> 0% |
| 12321 | `1232101` | `1232105` (Lv5) | Jack Frost (Copy) | Active | Magic | 5000 | 500 | 0% | 0 | 200% -> 360% |
| 12322 | `1232201` | `1232205` (Lv5) | Earth Strain (Copy) | Active | Magic | 5000 | 500 | 0% | 0 | 200% -> 360% |
| 12323 | `1232301` | `1232305` (Lv5) | Crimson Rock (Copy) | Active | Magic | 5000 | 500 | 0% | 0 | 200% -> 360% |
| 12324 | `1232401` | `1232405` (Lv5) | Thunderclap (Copy) | Active | Magic | 5000 | 500 | 0% | 0 | 200% -> 360% |
| 12325 | `1232501` | `1232505` (Lv5) | Comet (Copy) | Active | Magic | 8000 | 1000 | 0% | 0 | 220% -> 420% |
| 12326 | `1232601` | `1232605` (Lv5) | Tetra Vortex (Copy) | Active | Magic | 12000 | 800 | 0% | 0 | 80% -> 140% |
| 12328 | `1232801` | `1232810` (Lv10) | Soul Expansion (Copy) | Active | Magic | 500 | 1100 | 0% | 1 | 40% -> 85% |
| 12329 | `1232901` | `1232901` (Lv1) | Spellbook Page Passive | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 12334 | `1233401` | `1233401` (Lv1) | Meteor | Active | Magic | 1000 | 1000 | 0% | 0 | 45% -> 45% |
| 12335 | `1233501` | `1233501` (Lv1) | Meteor (Copy) | Active | Magic | 1000 | 1000 | 0% | 0 | 50% -> 50% |
| 12336 | `1233601` | `1233601` (Lv1) | White Imprison Trigger | Active | Magic | 100 | 1000 | 0% | 0 | 100% -> 100% |
| 12345 | `1234501` | `1234510` (Lv10) | Psychokinetic Astral Body | Active | Magic | 0 | 1000 | 0% | 0 | 55% -> 100% |
| 12347 | `1234701` | `1234710` (Lv10) | Gravitational Impact (Copy) | Active | Magic | 15000 | 1500 | 0% | 0 | 67% -> 170% |
| 12348 | `1234801` | `1234810` (Lv10) | Psychokinetic Astral Body | Active | Magic | 0 | 0 | 0% | 0 | 55% -> 100% |
| 12350 | `1235001` | `1235001` (Lv1) | Meteor | Active | Magic | 0 | 500 | 0% | 1 | 108% -> 108% |
| 12352 | `1235201` | `1235201` (Lv1) | Remix Resonance | Active | Magic | 0 | 500 | 0% | 0 | 17% -> 17% |
| 12353 | `1235301` | `1235301` (Lv1) | Ice Blast | Active | Magic | 0 | 500 | 0% | 1 | 108% -> 108% |
| 12354 | `1235401` | `1235401` (Lv1) | Thunder Blast | Active | Magic | 0 | 500 | 0% | 1 | 108% -> 108% |
| 12355 | `1235501` | `1235501` (Lv1) | Earth Blast | Active | Magic | 0 | 500 | 0% | 1 | 108% -> 108% |
| 12400 | `1240001` | `1240001` (Lv1) | Skill Bar | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 12403 | `1240301` | `1240301` (Lv1) | Elemental Pursuit | Active | Magic | 0 | 0 | 0% | 1 | 10% -> 10% |
| 12404 | `1240401` | `1240401` (Lv1) | Elemental Shock | Active | Magic | 0 | 0 | 0% | 1 | 5% -> 5% |
| 12423 | `1242301` | `1242301` (Lv1) | Fireball Burst | Active | Magic | 0 | 0 | 0% | 1 | 50% -> 50% |
| 12432 | `1243201` | `1243201` (Lv1) | Ice Spike | Active | Magic | 0 | 1000 | 0% | 1 | 50% -> 50% |
| 12433 | `1243301` | `1243301` (Lv1) | Thunderbolt | Active | Magic | 0 | 1000 | 0% | 1 | 80% -> 80% |
| 12442 | `1244201` | `1244201` (Lv1) | Fire Explosion | Active | Magic | 0 | 1000 | 0% | 1 | 40% -> 40% |
| 12443 | `1244301` | `1244301` (Lv1) | Ember Zone | Active | Magic | 0 | 1000 | 0% | 1 | 5% -> 5% |
| 12452 | `1245201` | `1245201` (Lv1) | Frost Explosion | Active | Magic | 0 | 1000 | 0% | 1 | 50% -> 50% |
| 12482 | `1248201` | `1248201` (Lv1) | Spatial Distortion | Active | Magic | 0 | 1000 | 0% | 1 | 100% -> 100% |
| 12999 | `1299901` | `1299901` (Lv1) | Basic Attack | Active | Physical | 0 | 1200 | 100% | 1 | 50% -> 50% |
| 13000 | `1300001` | `1300001` (Lv1) | Arrow Attack | Active | Physical | 0 | 1000 | 100% | 1 | 50% -> 50% |
| 13099 | `1309901` | `1309901` (Lv1) | Arrow Smash | Active | Physical | 7000 | 1500 | 0% | 1 | 35% -> 35% |
| 13110 | `1311001` | `1311005` (Lv5) | Blitz Beat | Active | Physical | 10000 | 500 | 0% | 1 | 3% -> 5% |
| 13111 | `1311101` | `1311105` (Lv5) | Blitz Beat | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 13210 | `1321001` | `1321001` (Lv1) | Rapid Combo | Active | Physical | 0 | 500 | 0% | 1 | 10% -> 10% |
| 13211 | `1321101` | `1321101` (Lv1) | Chain Lightning | Active | Physical | 0 | 500 | 0% | 1 | 5% -> 5% |
| 13212 | `1321201` | `1321201` (Lv1) | Triple Strafe | Active | Physical | 0 | 500 | 0% | 1 | 10% -> 10% |
| 13213 | `1321301` | `1321301` (Lv1) | Explosive Arrow | Active | Physical | 0 | 500 | 0% | 1 | 30% -> 30% |
| 13214 | `1321401` | `1321401` (Lv1) | Falcon Strike | Active | Physical | 0 | 500 | 0% | 1 | 15% -> 15% |
| 13215 | `1321501` | `1321501` (Lv1) | Meteor Arrow Shower | Active | Physical | 0 | 500 | 0% | 1 | 40% -> 40% |
| 13216 | `1321601` | `1321601` (Lv1) | Falcon Rush | Active | Physical | 0 | 500 | 0% | 1 | 150% -> 150% |
| 13304 | `1330401` | `1330405` (Lv5) | Fear Breeze | Active | Physical | 0 | 600 | 0% | 1 | 42% -> 50% |
| 13317 | `1331701` | `1331703` (Lv3) | Warg Strike | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 13321 | `1332101` | `1332101` (Lv1) | Warg Howl | Active | Physical | 10000 | 500 | 0% | 0 | 0% -> 0% |
| 13324 | `1332401` | `1332401` (Lv1) | SkillGroup#13324 | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 13327 | `1332701` | `1332705` (Lv5) | Warg Companion (Warg Strike) | Active | Physical | 0 | 2667 | 0% | 1 | 72% -> 80% |
| 13328 | `1332801` | `1332805` (Lv5) | Warg Companion (Warg Bite) | Active | Physical | 0 | 1200 | 0% | 1 | 200% -> 240% |
| 13329 | `1332901` | `1332905` (Lv5) | Warg Hunt (Melee) | Active | Physical | 0 | 1000 | 0% | 1 | 110% -> 150% |
| 13330 | `1333001` | `1333005` (Lv5) | Warg Hunt (Ranged) | Active | Physical | 0 | 1200 | 0% | 1 | 110% -> 150% |
| 13331 | `1333101` | `1333102` (Lv2) | SkillGroup#13331 | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 13400 | `1340001` | `1340001` (Lv1) | Warg Strike | Active | Physical | 0 | 500 | 0% | 1 | 100% -> 100% |
| 13401 | `1340101` | `1340101` (Lv1) | Warg Strike | Active | Physical | 1 | 500 | 0% | 1 | 30% -> 30% |
| 13999 | `1399901` | `1399901` (Lv1) | Skill Bar | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 14000 | `1400001` | `1400001` (Lv1) | Skill Bar | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 14006 | `1400601` | `1400601` (Lv1) | Ruwach | Active | Magic | 0 | 0 | 0% | 0 | 120% -> 120% |
| 14050 | `1405001` | `1405001` (Lv1) | Temporary Revive | Active | Physical | 30000 | 500 | 0% | 0 | 0% -> 0% |
| 14099 | `1409901` | `1409901` (Lv1) | Staff Smash | Active | Physical | 7000 | 1500 | 0% | 1 | 35% -> 35% |
| 14100 | `1410001` | `1410001` (Lv1) | Skill Bar | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 14208 | `1420801` | `1420801` (Lv1) | Radiant Resurrection | Active | Magic | 0 | 1000 | 0% | 0 | 5% -> 5% |
| 14209 | `1420901` | `1420901` (Lv1) | Holy Cross Judgment | Active | Magic | 0 | 1000 | 0% | 0 | 5% -> 5% |
| 14210 | `1421001` | `1421001` (Lv1) | Turn Undead【Extra Trigger】 | Active | Magic | 0 | 1000 | 0% | 0 | 40% -> 40% |
| 14211 | `1421101` | `1421101` (Lv1) | Radiant Sanctuary | Active | Magic | 0 | 1000 | 0% | 0 | 5% -> 5% |
| 14212 | `1421201` | `1421201` (Lv1) | Divine Light Strike | Active | Magic | 0 | 1000 | 0% | 0 | 10% -> 10% |
| 14213 | `1421301` | `1421301` (Lv1) | Holy Light Bludgeon | Active | Magic | 0 | 1000 | 0% | 0 | 5% -> 5% |
| 14214 | `1421401` | `1421401` (Lv1) | Holy Light Resurrection | Active | Magic | 0 | 1000 | 0% | 0 | 5% -> 5% |
| 14215 | `1421501` | `1421501` (Lv1) | Purifying Light Orbit | Active | Magic | 0 | 1000 | 0% | 0 | 5% -> 5% |
| 14216 | `1421601` | `1421601` (Lv1) | Sacred Divine Light | Active | Magic | 0 | 1000 | 0% | 0 | 5% -> 5% |
| 14300 | `1430001` | `1430001` (Lv1) | Skill Bar | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 14308 | `1430801` | `1430801` (Lv1) | Respawn | Active | Physical | 0 | 1500 | 0% | 0 | 0% -> 0% |
| 14316 | `1431601` | `1431605` (Lv5) | Double Holy Light: Physical | Active | Physical | 0 | 0 | 0% | 0 | 18% -> 30% |
| 14317 | `1431701` | `1431705` (Lv5) | Double Holy Light: Magic | Active | Magic | 0 | 0 | 0% | 0 | 18% -> 30% |
| 14350 | `1435001` | `1435040` (Lv40) | Coming Soon | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14351 | `1435101` | `1435101` (Lv1) | Coming Soon | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14352 | `1435201` | `1435201` (Lv1) | Coming Soon | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14353 | `1435301` | `1435301` (Lv1) | Coming Soon | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14354 | `1435401` | `1435401` (Lv1) | Coming Soon | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14355 | `1435501` | `1435501` (Lv1) | Coming Soon | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14395 | `1439501` | `1439501` (Lv1) | Respawn | Active | Physical | 0 | 1500 | 0% | 0 | 0% -> 0% |
| 14400 | `1440001` | `1440001` (Lv1) | Skill Bar | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 14998 | `1499801` | `1499801` (Lv1) | Basic Attack | Active | Physical | 0 | 1200 | 100% | 1 | 50% -> 50% |
| 14999 | `1499901` | `1499901` (Lv1) | Basic Attack | Active | Physical | 0 | 1200 | 100% | 1 | 50% -> 50% |
| 15000 | `1500001` | `1500001` (Lv1) | Normal Attack | Active | Physical | 0 | 1000 | 100% | 1 | 50% -> 50% |
| 15004 | `1500401` | `1500410` (Lv10) | Steal | Active | Physical | 5000 | 500 | 100% | 1 | 42% -> 70% |
| 15008 | `1500801` | `1500801` (Lv1) | Special Dual-Wield Logic | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 15009 | `1500901` | `1500901` (Lv1) | Skill Bar | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 15099 | `1509901` | `1509901` (Lv1) | Blade Smash | Active | Physical | 7000 | 1000 | 0% | 1 | 35% -> 35% |
| 15108 | `1510801` | `1510801` (Lv1) | Envenom | Passive | Physical | 0 | 0 | 100% | 0 | 0% -> 0% |
| 15113 | `1511301` | `1511310` (Lv10) | Venom Splasher | Active | Physical | 19000 | 500 | 0% | 0 | 65% -> 110% |
| 15114 | `1511401` | `1511401` (Lv1) | Assassin Normal Attack | Active | Physical | 0 | 670 | 100% | 0 | 25% -> 25% |
| 15115 | `1511501` | `1511501` (Lv1) | Double Attack | Active | Physical | 0 | 1340 | 100% | 0 | 50% -> 50% |
| 15116 | `1511601` | `1511610` (Lv10) | Poisoned | Active | Physical | 0 | 0 | 0% | 0 | 20% -> 20% |
| 15204 | `1520401` | `1520410` (Lv10) | Shadow Step | Active | Physical | 12000 | 500 | 0% | 1 | 0% -> 0% |
| 15209 | `1520901` | `1520901` (Lv1) | Assassin Cross Normal Attack | Active | Physical | 0 | 670 | 100% | 0 | 17% -> 17% |
| 15212 | `1521201` | `1521205` (Lv5) | Create Deadly Poison | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 15213 | `1521301` | `1521305` (Lv5) | Advanced Soul Destroyer | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 15219 | `1521901` | `1521910` (Lv10) | Cross Impact | Passive | Physical | 0 | 0 | 0% | 0 | 146% -> 200% |
| 15221 | `1522101` | `1522110` (Lv10) | Shadow Strike | Active | Physical | 0 | 500 | 100% | 0 | 37% -> 50% |
| 15222 | `1522201` | `1522210` (Lv10) | Cross Impact | Active | Physical | 0 | 500 | 100% | 0 | 146% -> 200% |
| 15230 | `1523001` | `1523010` (Lv10) | Venom Sting | Active | Physical | 0 | 0 | 0% | 0 | 25% -> 25% |
| 15231 | `1523101` | `1523101` (Lv1) | Blade Dance | Active | Physical | 0 | 500 | 0% | 0 | 30% -> 30% |
| 15232 | `1523201` | `1523201` (Lv1) | Opening | Active | Physical | 0 | 500 | 0% | 0 | 20% -> 20% |
| 15233 | `1523301` | `1523301` (Lv1) | Chain Reaction | Active | Physical | 0 | 500 | 0% | 0 | 10% -> 10% |
| 15234 | `1523401` | `1523401` (Lv1) | Shadow Fang | Active | Physical | 0 | 500 | 0% | 0 | 60% -> 60% |
| 15235 | `1523501` | `1523501` (Lv1) | Sneak Attack | Active | Physical | 0 | 500 | 0% | 0 | 120% -> 120% |
| 15236 | `1523601` | `1523601` (Lv1) | Triple Slash | Active | Physical | 0 | 500 | 0% | 0 | 30% -> 30% |
| 15237 | `1523701` | `1523701` (Lv1) | Poisoned to the Core | Active | Physical | 0 | 500 | 0% | 0 | 40% -> 40% |
| 15238 | `1523801` | `1523801` (Lv1) | Toxic Rampage | Active | Physical | 0 | 500 | 0% | 0 | 30% -> 30% |
| 15239 | `1523901` | `1523901` (Lv1) | Spreading Shockwave | Active | Physical | 0 | 500 | 0% | 0 | 20% -> 20% |
| 15240 | `1524001` | `1524001` (Lv1) | Advanced Soul Destroyer | Active | Physical | 0 | 600 | 0% | 1 | 85% -> 85% |
| 15241 | `1524101` | `1524101` (Lv1) | Hidden Blade | Active | Physical | 0 | 500 | 0% | 0 | 100% -> 100% |
| 15314 | `1531401` | `1531410` (Lv10) | Antidote | Active | Physical | 10000 | 500 | 0% | 1 | 0% -> 0% |
| 15320 | `1532001` | `1532010` (Lv10) | Shadow Loop | Active | Physical | 100 | 700 | 0% | 1 | 105% -> 150% |
| 15322 | `1532201` | `1532210` (Lv10) | Thousand Shadows | Active | Physical | 100 | 500 | 0% | 1 | 75% -> 120% |
| 15325 | `1532501` | `1532501` (Lv1) | Passive | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 15327 | `11532701` | `11532710` (Lv10) | Enhance Cloaking | Active | Physical | 15000 | 600 | 0% | 1 | 38% -> 38% |
| 15328 | `1532801` | `1532801` (Lv1) | Black Phantom Passive | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 15330 | `1533001` | `1533005` (Lv5) | Move back Shadow Echo | Active | Physical | 10000 | 300 | 0% | 0 | 0% -> 0% |
| 16000 | `1600001` | `1600001` (Lv1) | Basic Attack | Active | Physical | 0 | 1200 | 100% | 1 | 50% -> 50% |
| 16009 | `1600901` | `1600901` (Lv1) | Money Throw | Active | Physical | 0 | 1000 | 0% | 1 | 20% -> 20% |
| 16010 | `1601001` | `1601001` (Lv1) | Gunpowder Throw | Active | Physical | 0 | 1000 | 0% | 1 | 10% -> 10% |
| 16099 | `1609901` | `1609901` (Lv1) | Battle Axe Smash | Active | Physical | 7000 | 1566 | 0% | 1 | 35% -> 35% |
| 16108 | `1610801` | `1610801` (Lv1) | Earth Spike | Active | Physical | 0 | 1000 | 0% | 1 | 20% -> 20% |
| 16205 | `1620501` | `1620501` (Lv1) | Explosive Strike | Active | Physical | 0 | 1000 | 0% | 1 | 20% -> 20% |
| 16206 | `1620601` | `1620601` (Lv1) | Cart Clash | Active | Physical | 0 | 1000 | 0% | 1 | 60% -> 60% |
| 16310 | `1631001` | `1631001` (Lv1) | Normal Punch | Active | Physical | 100 | 1000 | 0% | 1 | 50% -> 50% |
| 16350 | `1635001` | `1635001` (Lv1) | High-Energy Pulse | Active | Physical | 0 | 417 | 0% | 1 | 200% -> 200% |
| 16352 | `1635201` | `1635201` (Lv1) | Energy Release | Active | Physical | 0 | 500 | 0% | 1 | 2200% -> 2200% |
| 16399 | `1639901` | `1639901` (Lv1) | Fast Travel | Active | Physical | 10000 | 500 | 0% | 1 | 0% -> 0% |
| 16999 | `1699901` | `1699901` (Lv1) | Skill Bar | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |

## Novice (Job ID 1000)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 10000 | `1000001` | `1000001` (Lv1) | Normal Attack | Active | Physical | 0 | 1000 | 100% | 1 | 50% -> 50% |
| 10002 | `1000201` | `1000201` (Lv1) | Smite | Active | Physical | 7000 | 1000 | 0% | 0 | 35% -> 35% |
| 10003 | `1000301` | `1000301` (Lv1) | First Aid | Active | Physical | 10000 | 500 | 0% | 0 | 0% -> 0% |

## Swordsman (Job ID 1100)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 11001 | `1100101` | `1100110` (Lv10) | Bash | Active | Physical | 0 | 1000 | 0% | 0 | 46% -> 55% |
| 11002 | `1100201` | `1100210` (Lv10) | Magnum Break | Active | Physical | 8000 | 500 | 0% | 0 | 51% -> 60% |
| 11003 | `1100301` | `1100301` (Lv1) | Fatal Blow | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11004 | `1100401` | `1100410` (Lv10) | Provoke | Active | Physical | 10000 | 500 | 0% | 0 | 42% -> 60% |
| 11005 | `1100501` | `1100510` (Lv10) | Endure | Active | Physical | 15000 | 500 | 0% | 0 | 0% -> 0% |
| 11006 | `1100601` | `1100610` (Lv10) | Increase Recuperative Power | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11009 | `1100901` | `1100910` (Lv10) | Sword Mastery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |

## Knight (Job ID 1200)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 11101 | `1110101` | `1110110` (Lv10) | Spear Mastery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11103 | `1110301` | `1110310` (Lv10) | Sword Quicken | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11104 | `1110401` | `1110410` (Lv10) | Bowling Bash | Active | Physical | 10000 | 500 | 0% | 0 | 90% -> 180% |
| 11105 | `1110501` | `1110510` (Lv10) | Auto Counter | Active | Physical | 10000 | 1500 | 0% | 0 | 0% -> 0% |
| 11107 | `1110701` | `1110701` (Lv1) | Riding | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11108 | `1110801` | `1110810` (Lv10) | Brandish Spear | Active | Physical | 0 | 1000 | 0% | 0 | 47% -> 65% |
| 11109 | `1110901` | `1110910` (Lv10) | Spear Stab | Active | Physical | 10000 | 500 | 0% | 0 | 35% -> 80% |
| 11110 | `1111001` | `1111005` (Lv5) | Spear Throw | Active | Physical | 10000 | 500 | 0% | 0 | 40% -> 80% |
| 11112 | `1111201` | `1111210` (Lv10) | Charge Attack | Active | Physical | 15000 | 500 | 0% | 0 | 15% -> 60% |
| 11120 | `1112001` | `1112010` (Lv10) | Pierce | Active | Physical | 0 | 1000 | 0% | 0 | 42% -> 60% |

## Crusader (Job ID 1210)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 11401 | `1140101` | `1140110` (Lv10) | Spear Mastery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11403 | `1140301` | `1140310` (Lv10) | Angel Strike | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11404 | `1140401` | `1140410` (Lv10) | Angel Protection | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11405 | `1140501` | `1140510` (Lv10) | Heal | Active | Magic | 500 | 500 | 0% | 1 | 90% -> 100% |
| 11406 | `1140601` | `1140601` (Lv1) | Healing Skills | Active | Physical | 15000 | 600 | 0% | 0 | 0% -> 0% |
| 11407 | `1140701` | `1140701` (Lv1) | Riding | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11408 | `1140801` | `1140810` (Lv10) | Auto Guard | Active | Physical | 5000 | 500 | 0% | 1 | 0% -> 0% |
| 11409 | `1140901` | `1140905` (Lv5) | Smite | Active | Physical | 0 | 500 | 0% | 0 | 45% -> 65% |
| 11410 | `1141001` | `1141010` (Lv10) | Shield Reflect | Active | Physical | 5000 | 500 | 0% | 1 | 0% -> 0% |
| 11411 | `1141101` | `1141110` (Lv10) | Holy Cross | Active | Physical | 0 | 1200 | 100% | 0 | 51% -> 60% |
| 11412 | `1141201` | `1141210` (Lv10) | Grand Cross | Active | Physical | 6000 | 600 | 0% | 0 | 75% -> 120% |
| 11413 | `1141301` | `1141305` (Lv5) | Devotion | Active | Physical | 15000 | 500 | 0% | 0 | 0% -> 0% |
| 11414 | `1141401` | `1141405` (Lv5) | Providence | Active | Physical | 5000 | 500 | 0% | 1 | 0% -> 0% |
| 11415 | `1141501` | `1141505` (Lv5) | Defending Aura | Active | Physical | 5000 | 500 | 0% | 1 | 0% -> 0% |
| 11416 | `1141601` | `1141601` (Lv1) | Recoil | Active | Physical | 5000 | 500 | 0% | 1 | 0% -> 0% |
| 11417 | `1141701` | `1141710` (Lv10) | Faith | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11418 | `1141801` | `1141805` (Lv5) | Shield Boomerang | Active | Physical | 3000 | 500 | 0% | 0 | 60% -> 80% |
| 11421 | `1142101` | `1142101` (Lv1) | Monster Resistance | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |

## Lord Knight (Job ID 1300)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 11201 | `1120101` | `1120110` (Lv10) | Aura Blade | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 11202 | `1120201` | `1120210` (Lv10) | Head Crush | Active | Physical | 10000 | 500 | 0% | 0 | 110% -> 200% |
| 11207 | `1120701` | `1120710` (Lv10) | Tension Relax | Active | Physical | 20000 | 1000 | 0% | 0 | 0% -> 0% |
| 11208 | `1120801` | `1120805` (Lv5) | Concentration | Active | Physical | 5000 | 1000 | 0% | 0 | 0% -> 0% |
| 11210 | `1121001` | `1121010` (Lv10) | Parry | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 11213 | `1121301` | `1121305` (Lv5) | Spiral Pierce | Active | Physical | 0 | 1000 | 0% | 0 | 72% -> 80% |
| 11214 | `1121401` | `1121410` (Lv10) | Berserk | Active | Physical | 20000 | 500 | 0% | 0 | 0% -> 0% |
| 11221 | `1122101` | `1122110` (Lv10) | Joint Beat | Active | Physical | 5000 | 500 | 0% | 0 | 62% -> 80% |

## Paladin (Job ID 1310)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 11501 | `1150101` | `1150110` (Lv10) | Gloria Domini | Active | Physical | 5000 | 500 | 0% | 0 | 155% -> 200% |
| 11502 | `1150201` | `1150210` (Lv10) | Sacrifice | Active | Physical | 5000 | 500 | 0% | 1 | 0% -> 0% |
| 11503 | `1150301` | `1150310` (Lv10) | Battle Chant | Active | Physical | 5000 | 500 | 0% | 1 | 0% -> 0% |
| 11504 | `1150401` | `1150410` (Lv10) | Rapid Smiting | Active | Physical | 0 | 500 | 0% | 0 | 55% -> 100% |
| 11506 | `1150601` | `1150610` (Lv10) | Fountain of Life | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11507 | `1150701` | `1150710` (Lv10) | Crest of Light | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11508 | `1150801` | `1150801` (Lv1) | Advanced Monster Resistance | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |

## Rune Knight (Job ID 1400)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 11301 | `1130101` | `1130105` (Lv5) | Rift Impact | Active | Physical | 12000 | 1000 | 0% | 0 | 150% -> 250% |
| 11302 | `1130201` | `1130205` (Lv5) | Cleaving Slash | Active | Physical | 0 | 1600 | 15% | 0 | 34% -> 50% |
| 11303 | `1130301` | `1130305` (Lv5) | Wind-Pressure Blade | Active | Physical | 14000 | 800 | 0% | 0 | 0% -> 0% |
| 11304 | `1130401` | `1130405` (Lv5) | Dragon Breath (Fire) | Active | Physical | 8000 | 1200 | 0% | 0 | 120% -> 200% |
| 11305 | `1130501` | `1130505` (Lv5) | Dragon Breath (Water) | Active | Physical | 8000 | 1200 | 0% | 0 | 120% -> 200% |
| 11306 | `1130601` | `1130602` (Lv2) | Dragon Howling | Active | Physical | 20000 | 800 | 0% | 0 | 0% -> 0% |
| 11307 | `1130701` | `1130703` (Lv3) | Dragon Training | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11308 | `1130801` | `1130805` (Lv5) | Phantom Thrust | Active | Physical | 20000 | 800 | 0% | 0 | 200% -> 400% |
| 11309 | `1130901` | `1130905` (Lv5) | Sonic Wave | Active | Physical | 10000 | 600 | 0% | 0 | 220% -> 300% |
| 11310 | `1131001` | `1131005` (Lv5) | Rain of Spears | Active | Physical | 500 | 1200 | 0% | 0 | 110% -> 150% |
| 11311 | `1131101` | `1131105` (Lv5) | Death Bound | Active | Physical | 20000 | 500 | 0% | 0 | 0% -> 0% |
| 11312 | `1131201` | `1131202` (Lv2) | Vivify | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11313 | `1131301` | `1131303` (Lv3) | Enchant Blade | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11314 | `1131401` | `1131405` (Lv5) | Rune Mastery | Active | Physical | 5000 | 800 | 0% | 0 | 0% -> 0% |
| 11315 | `1131501` | `1131505` (Lv5) | Precision Thrust | Active | Physical | 400 | 1000 | 0% | 0 | 110% -> 150% |
| 11316 | `1131601` | `1131605` (Lv5) | Sonic Burst | Active | Physical | 16000 | 800 | 0% | 0 | 300% -> 500% |

## Royal Guard (Job ID 1410)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 11601 | `1160101` | `1160105` (Lv5) | Banishing Thrust | Active | Physical | 0 | 2350 | 48% | 0 | 34% -> 50% |
| 11602 | `1160201` | `1160205` (Lv5) | Heavy Cannon Shot | Active | Physical | 8000 | 1200 | 0% | 0 | 80% -> 160% |
| 11604 | `1160401` | `1160405` (Lv5) | Spear Formation - Blood Cross | Active | Physical | 0 | 2350 | 48% | 0 | 35% -> 55% |
| 11607 | `1160701` | `1160710` (Lv10) | Twilight | Active | Physical | 15000 | 1050 | 0% | 0 | 120% -> 210% |
| 11608 | `1160801` | `1160805` (Lv5) | Shield Press | Active | Physical | 8000 | 800 | 0% | 0 | 120% -> 200% |
| 11609 | `1160901` | `1160905` (Lv5) | Reflect Damage | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 11611 | `1161101` | `1161105` (Lv5) | Earth Drive | Active | Physical | 12000 | 800 | 0% | 0 | 150% -> 350% |
| 11612 | `1161201` | `1161205` (Lv5) | King's Grace | Active | Physical | 25000 | 500 | 0% | 0 | 0% -> 0% |
| 11613 | `1161301` | `1161305` (Lv5) | Shield Defense | Active | Physical | 20000 | 5000 | 0% | 0 | 100% -> 100% |
| 11614 | `1161401` | `1161401` (Lv1) | Union | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11615 | `1161501` | `1161501` (Lv1) | Piety | Active | Physical | 40000 | 500 | 0% | 0 | 0% -> 0% |
| 11616 | `1161601` | `1161605` (Lv5) | Divine Insight | Active | Physical | 20000 | 500 | 0% | 0 | 0% -> 0% |
| 11624 | `1162401` | `1162405` (Lv5) | Fearless Charge | Active | Physical | 10000 | 2000 | 0% | 0 | 30% -> 50% |
| 11628 | `1162801` | `1162805` (Lv5) | Spear Formation - Crescent Moon | Active | Physical | 8000 | 800 | 0% | 0 | 30% -> 50% |
| 11636 | `1163601` | `1163605` (Lv5) | Powerful Shield Bash | Active | Physical | 500 | 500 | 0% | 0 | 100% -> 180% |
| 11637 | `1163701` | `1163701` (Lv1) | Advanced Monster Resistance | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 11638 | `1163801` | `1163805` (Lv5) | Shield Block | Active | Physical | 10000 | 1550 | 0% | 0 | 0% -> 0% |

## Mage (Job ID 2100)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 12001 | `1200101` | `1200105` (Lv5) | Increase SP Recovery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 12002 | `1200201` | `1200201` (Lv1) | Sight | Active | Physical | 10000 | 500 | 0% | 0 | 120% -> 120% |
| 12003 | `1200301` | `1200301` (Lv1) | Energy Coat | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 12004 | `1200401` | `1200410` (Lv10) | Fire Bolt | Active | Magic | 500 | 500 | 0% | 1 | 55% -> 100% |
| 12005 | `1200501` | `1200510` (Lv10) | Lightning Bolt | Active | Magic | 500 | 500 | 0% | 1 | 55% -> 100% |
| 12006 | `1200601` | `1200610` (Lv10) | Cold Bolt | Active | Magic | 500 | 500 | 0% | 1 | 55% -> 100% |
| 12008 | `1200801` | `1200810` (Lv10) | Soul Strike | Active | Magic | 5000 | 500 | 0% | 1 | 70% -> 160% |
| 12010 | `1201001` | `1201010` (Lv10) | Fire Wall | Active | Magic | 10000 | 420 | 0% | 0 | 22% -> 40% |
| 12011 | `1201101` | `1201105` (Lv5) | Safety Wall | Active | Physical | 20000 | 420 | 0% | 0 | 0% -> 0% |
| 12012 | `1201201` | `1201210` (Lv10) | Fire Ball | Active | Magic | 5000 | 300 | 0% | 0 | 60% -> 150% |
| 12013 | `1201301` | `1201310` (Lv10) | Thunderstorm | Active | Magic | 5000 | 300 | 0% | 1 | 60% -> 150% |
| 12014 | `1201401` | `1201410` (Lv10) | Frost Diver | Active | Magic | 5000 | 300 | 0% | 0 | 75% -> 120% |
| 12015 | `1201501` | `1201510` (Lv10) | Stone Curse | Active | Physical | 5000 | 300 | 0% | 0 | 0% -> 0% |
| 12016 | `1201601` | `1201610` (Lv10) | Mind Blast | Active | Magic | 500 | 500 | 0% | 0 | 55% -> 100% |

## Wizard (Job ID 2200)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 12100 | `1210001` | `1210005` (Lv5) | Earth Spike | Active | Magic | 500 | 500 | 0% | 1 | 60% -> 100% |
| 12101 | `1210101` | `1210110` (Lv10) | Sightrasher | Active | Magic | 10000 | 420 | 0% | 1 | 55% -> 100% |
| 12102 | `1210201` | `1210210` (Lv10) | Jupitel Thunder | Active | Magic | 10000 | 420 | 0% | 1 | 60% -> 150% |
| 12103 | `1210301` | `1210310` (Lv10) | Frost Nova | Active | Magic | 8000 | 420 | 0% | 1 | 105% -> 150% |
| 12104 | `1210401` | `1210405` (Lv5) | Quagmire | Active | Magic | 8000 | 420 | 0% | 0 | 0% -> 0% |
| 12105 | `1210501` | `1210510` (Lv10) | Fire Pillar | Active | Magic | 5000 | 420 | 0% | 0 | 6% -> 10% |
| 12106 | `1210601` | `1210610` (Lv10) | Meteor Storm | Active | Magic | 8000 | 420 | 0% | 0 | 6% -> 10% |
| 12107 | `1210701` | `1210710` (Lv10) | Lord of Vermilion | Active | Magic | 8000 | 420 | 0% | 0 | 6% -> 10% |
| 12108 | `1210801` | `1210810` (Lv10) | Storm Gust | Active | Magic | 8000 | 420 | 0% | 0 | 6% -> 10% |
| 12109 | `1210901` | `1210905` (Lv5) | Heaven's Drive | Active | Magic | 8000 | 420 | 0% | 0 | 70% -> 150% |
| 12110 | `1211001` | `1211001` (Lv1) | Sight Sprout | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |

## High Wizard (Job ID 2300)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 12201 | `1220101` | `1220101` (Lv1) | Magic Crasher | Active | Physical | 0 | 500 | 50% | 1 | 60% -> 60% |
| 12203 | `1220301` | `1220310` (Lv10) | Mystical Amplification | Active | Physical | 5000 | 500 | 0% | 1 | 0% -> 0% |
| 12209 | `1220901` | `1220910` (Lv10) | Soul Drain | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 12210 | `1221001` | `1221010` (Lv10) | Napalm Vulcan | Active | Magic | 500 | 500 | 0% | 1 | 68% -> 140% |
| 12212 | `1221201` | `1221210` (Lv10) | Gravitation Field | Active | Magic | 8000 | 420 | 0% | 0 | 6% -> 10% |
| 12213 | `1221301` | `1221301` (Lv1) | Ganbantein | Active | Physical | 20000 | 500 | 0% | 0 | 0% -> 0% |

## Warlock (Job ID 2400)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 12302 | `1230201` | `1230210` (Lv10) | Soul Expansion | Active | Magic | 500 | 1100 | 0% | 1 | 40% -> 85% |
| 12303 | `1230301` | `1230301` (Lv1) | White Imprison | Active | Magic | 20000 | 500 | 0% | 0 | 400% -> 400% |
| 12304 | `1230401` | `1230405` (Lv5) | Intense Telekinesis | Active | Physical | 30000 | 500 | 0% | 1 | 0% -> 0% |
| 12305 | `1230501` | `1230505` (Lv5) | Magic Frost | Active | Magic | 10000 | 500 | 0% | 0 | 120% -> 120% |
| 12306 | `1230601` | `1230601` (Lv1) | Element Control | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 12307 | `1230701` | `1230705` (Lv5) | Ice Fog | Active | Magic | 500 | 500 | 0% | 0 | 115% -> 215% |
| 12308 | `1230801` | `1230805` (Lv5) | Jack Frost | Active | Magic | 5000 | 500 | 0% | 0 | 200% -> 360% |
| 12309 | `1230901` | `1230905` (Lv5) | Petrify Curse | Active | Magic | 500 | 500 | 0% | 0 | 115% -> 215% |
| 12310 | `1231001` | `1231005` (Lv5) | Earth Strain | Active | Magic | 5000 | 500 | 0% | 0 | 200% -> 360% |
| 12311 | `1231101` | `1231105` (Lv5) | Destructive Flame | Active | Magic | 500 | 500 | 0% | 0 | 115% -> 215% |
| 12312 | `1231201` | `1231205` (Lv5) | Crimson Rock | Active | Magic | 5000 | 500 | 0% | 0 | 200% -> 360% |
| 12313 | `1231301` | `1231305` (Lv5) | Chain Lightning | Active | Magic | 500 | 500 | 0% | 0 | 115% -> 215% |
| 12314 | `1231401` | `1231405` (Lv5) | Thunderclap | Active | Magic | 5000 | 500 | 0% | 0 | 200% -> 360% |
| 12315 | `1231501` | `1231505` (Lv5) | Comet | Active | Magic | 8000 | 1000 | 0% | 0 | 220% -> 420% |
| 12316 | `1231601` | `1231605` (Lv5) | Tetra Vortex | Active | Magic | 12000 | 800 | 0% | 0 | 80% -> 140% |
| 12319 | `1231901` | `1231901` (Lv1) | Reading Spellbook | Active | Physical | 500 | 500 | 0% | 1 | 0% -> 0% |
| 12330 | `1233001` | `1233001` (Lv1) | Psychic Mastery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 12342 | `1234201` | `1234210` (Lv10) | Gravitational Impact | Active | Magic | 15000 | 1500 | 0% | 0 | 67% -> 170% |
| 12343 | `1234301` | `1234310` (Lv10) | Psychokinetic Astral Body | Passive | Magic | 0 | 0 | 0% | 0 | 0% -> 0% |

## Archer (Job ID 3100)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 13001 | `1300101` | `1300110` (Lv10) | Owl's Eye | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 13002 | `1300201` | `1300210` (Lv10) | Vulture's Eye | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 13003 | `1300301` | `1300310` (Lv10) | Double Strafe | Active | Physical | 0 | 800 | 0% | 1 | 55% -> 100% |
| 13004 | `1300401` | `1300410` (Lv10) | Arrow Shower | Active | Physical | 5000 | 870 | 0% | 0 | 20% -> 65% |
| 13005 | `1300501` | `1300501` (Lv1) | Charge Arrow | Active | Physical | 10000 | 1430 | 100% | 1 | 80% -> 80% |
| 13006 | `1300601` | `1300610` (Lv10) | Steady Focus | Active | Physical | 10000 | 500 | 0% | 1 | 0% -> 0% |

## Hunter (Job ID 3200)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 13101 | `1310101` | `1310101` (Lv1) | Falconry Mastery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 13102 | `1310201` | `1310205` (Lv5) | Blitz Beat | Active | Physical | 10000 | 500 | 0% | 1 | 60% -> 100% |
| 13103 | `1310301` | `1310304` (Lv4) | Detecting | Active | Physical | 20000 | 500 | 0% | 1 | 0% -> 0% |
| 13104 | `1310401` | `1310410` (Lv10) | Beastbane | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 13105 | `1310501` | `1310510` (Lv10) | Steel Crow | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 13106 | `1310601` | `1310610` (Lv10) | Anklesnare | Active | Physical | 12000 | 500 | 0% | 0 | 22% -> 40% |
| 13107 | `1310701` | `1310710` (Lv10) | Claymore Trap | Active | Physical | 12000 | 500 | 0% | 0 | 32% -> 50% |
| 13108 | `1310801` | `1310810` (Lv10) | Freezing Trap | Active | Physical | 12000 | 500 | 0% | 0 | 22% -> 40% |
| 13109 | `1310901` | `1310910` (Lv10) | Flasher | Active | Physical | 12000 | 500 | 0% | 0 | 22% -> 40% |

## Sniper (Job ID 3300)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 13201 | `1320101` | `1320110` (Lv10) | Wind Walker | Active | Physical | 15000 | 500 | 0% | 1 | 0% -> 0% |
| 13202 | `1320201` | `1320210` (Lv10) | Falcon Assault | Active | Physical | 10000 | 500 | 0% | 1 | 50% -> 140% |
| 13203 | `1320301` | `1320310` (Lv10) | True Sight | Active | Physical | 10000 | 500 | 0% | 1 | 0% -> 0% |
| 13204 | `1320401` | `1320410` (Lv10) | Sharp Shooting | Active | Physical | 0 | 1500 | 100% | 1 | 46% -> 55% |

## Ranger (Job ID 3400)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 13301 | `1330101` | `1330110` (Lv10) | Ranger's Resolve | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 13302 | `1330201` | `1330205` (Lv5) | Arrow Storm | Active | Physical | 8000 | 800 | 0% | 0 | 372% -> 420% |
| 13303 | `1330301` | `1330305` (Lv5) | Fear Breeze | Active | Physical | 10000 | 600 | 0% | 1 | 0% -> 0% |
| 13305 | `1330501` | `1330505` (Lv5) | Focused Arrow Strike | Active | Physical | 0 | 1200 | 100% | 1 | 56% -> 60% |
| 13307 | `1330701` | `1330705` (Lv5) | Unlimited Shooting | Active | Physical | 30000 | 600 | 0% | 1 | 0% -> 0% |
| 13309 | `1330901` | `1330901` (Lv1) | Keen Senses | Active | Physical | 20000 | 600 | 0% | 1 | 0% -> 0% |
| 13310 | `1331001` | `1331001` (Lv1) | Wolf Taming | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 13311 | `1331101` | `1331110` (Lv10) | Wolf's Fang | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 13312 | `1331201` | `1331203` (Lv3) | Warg Strike | Active | Physical | 12000 | 400 | 0% | 1 | 20% -> 30% |
| 13320 | `1332001` | `1332005` (Lv5) | Myriad Stars Chase the Moon | Active | Physical | 20000 | 2370 | 0% | 1 | 160% -> 200% |
| 13322 | `1332201` | `1332205` (Lv5) | King of the Wargs | Active | Physical | 24000 | 800 | 0% | 1 | 0% -> 0% |
| 13323 | `1332301` | `1332305` (Lv5) | Warg Hunt | Active | Physical | 2500 | 600 | 0% | 1 | 110% -> 150% |
| 13325 | `1332501` | `1332505` (Lv5) | Warg Bite | Active | Physical | 3000 | 500 | 0% | 1 | 110% -> 150% |
| 13326 | `1332601` | `1332602` (Lv2) | Swift Warg | Active | Physical | 12000 | 383 | 0% | 1 | 0% -> 0% |

## Acolyte (Job ID 4100)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 14001 | `1400101` | `1400110` (Lv10) | Blessing | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 14002 | `1400201` | `1400210` (Lv10) | Signum Crucis | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14005 | `1400501` | `1400501` (Lv1) | Ruwach | Active | Physical | 10000 | 500 | 0% | 0 | 0% -> 0% |
| 14007 | `1400701` | `1400710` (Lv10) | Heal | Active | Magic | 500 | 500 | 0% | 1 | 90% -> 100% |
| 14010 | `1401001` | `1401010` (Lv10) | Increase AGI | Active | Physical | 5000 | 1000 | 0% | 0 | 0% -> 0% |
| 14011 | `1401101` | `1401110` (Lv10) | Holy Light | Active | Magic | 500 | 1000 | 0% | 0 | 112% -> 130% |
| 14012 | `1401201` | `1401210` (Lv10) | Angel Strike | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14013 | `1401301` | `1401310` (Lv10) | Angel Protection | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14014 | `1401401` | `1401401` (Lv1) | Healing Skills | Active | Physical | 20000 | 600 | 0% | 0 | 0% -> 0% |
| 14015 | `1401501` | `1401505` (Lv5) | Angelus | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 14016 | `1401601` | `1401601` (Lv1) | Slow | Active | Physical | 10000 | 1000 | 0% | 0 | 0% -> 0% |
| 14017 | `1401701` | `1401701` (Lv1) | Pneuma | Active | Physical | 20000 | 500 | 0% | 0 | 0% -> 0% |

## Priest (Job ID 4200)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 14101 | `1410101` | `1410110` (Lv10) | Mace Mastery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14102 | `1410201` | `1410201` (Lv1) | Lex Aeterna | Active | Magic | 20000 | 600 | 0% | 0 | 0% -> 0% |
| 14103 | `1410301` | `1410305` (Lv5) | Increase SP Recovery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14104 | `1410401` | `1410401` (Lv1) | Recovery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14105 | `1410501` | `1410505` (Lv5) | Magnificat | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 14106 | `1410601` | `1410610` (Lv10) | Gloria | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 14109 | `1410901` | `1410910` (Lv10) | Magnus Exorcismus | Active | Magic | 5000 | 500 | 0% | 0 | 5% -> 10% |
| 14112 | `1411201` | `1411204` (Lv4) | Resurrection | Active | Physical | 30000 | 500 | 0% | 0 | 0% -> 0% |
| 14113 | `1411301` | `1411301` (Lv1) | Aspersio | Active | Physical | 20000 | 500 | 0% | 0 | 0% -> 0% |
| 14115 | `1411501` | `1411510` (Lv10) | Sanctuary | Active | Magic | 5000 | 500 | 0% | 0 | 5% -> 10% |
| 14117 | `1411701` | `1411705` (Lv5) | Kyrie Eleison | Active | Magic | 10000 | 500 | 0% | 0 | 0% -> 0% |
| 14118 | `1411801` | `1411810` (Lv10) | Turn Undead | Active | Magic | 500 | 1000 | 0% | 0 | 112% -> 130% |
| 14119 | `1411901` | `1411910` (Lv10) | Impositio Manus | Active | Physical | 10000 | 500 | 0% | 0 | 0% -> 0% |
| 14121 | `1412101` | `1412105` (Lv5) | Lex Divina | Active | Magic | 20000 | 1000 | 0% | 0 | 60% -> 100% |
| 14122 | `1412201` | `1412205` (Lv5) | Safety Wall | Active | Physical | 20000 | 500 | 0% | 0 | 0% -> 0% |
| 14123 | `1412301` | `1412305` (Lv5) | Suffragium | Active | Physical | 10000 | 500 | 0% | 0 | 0% -> 0% |

## High Priest (Job ID 4300)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 14201 | `1420101` | `1420110` (Lv10) | Assumptio | Active | Physical | 10000 | 1000 | 0% | 0 | 0% -> 0% |
| 14203 | `1420301` | `1420310` (Lv10) | Meditatio | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14204 | `1420401` | `1420410` (Lv10) | Mana Recharge | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14206 | `1420601` | `1420610` (Lv10) | Basilica | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 14207 | `1420701` | `1420710` (Lv10) | Arcane Mastery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |

## Archbishop (Job ID 4400)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 14301 | `1430101` | `1430110` (Lv10) | Highness Heal | Active | Magic | 500 | 500 | 0% | 1 | 95% -> 140% |
| 14302 | `1430201` | `1430201` (Lv1) | Hymn of the Lamb | Active | Physical | 15000 | 1000 | 0% | 1 | 0% -> 0% |
| 14303 | `1430301` | `1430310` (Lv10) | Radiant Holy Light | Active | Magic | 30000 | 1000 | 0% | 1 | 550% -> 1000% |
| 14304 | `1430401` | `1430410` (Lv10) | Sacred Lily | Active | Physical | 5000 | 1000 | 0% | 1 | 0% -> 0% |
| 14305 | `1430501` | `1430501` (Lv1) | Prayer of the Holy Spirit | Active | Physical | 60000 | 1500 | 0% | 0 | 0% -> 0% |
| 14306 | `1430601` | `1430603` (Lv3) | Prayer of Gratitude | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14307 | `1430701` | `1430701` (Lv1) | Wood Spirit's Blessing | Passive | Magic | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14309 | `1430901` | `1430910` (Lv10) | Judex | Active | Magic | 500 | 500 | 0% | 1 | 80% -> 170% |
| 14310 | `1431001` | `1431005` (Lv5) | Holy Reckoning | Active | Magic | 10000 | 1000 | 0% | 0 | 120% -> 200% |
| 14311 | `1431101` | `1431105` (Lv5) | Double Holy Light | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 14312 | `1431201` | `1431201` (Lv1) | Holy Spirit Surge | Active | Physical | 20000 | 1000 | 0% | 0 | 0% -> 0% |
| 14313 | `1431301` | `1431305` (Lv5) | Divine Retribution | Active | Magic | 8000 | 1000 | 0% | 1 | 180% -> 300% |
| 14314 | `1431401` | `1431410` (Lv10) | Holy Stigma | Active | Magic | 200 | 1000 | 0% | 0 | 220% -> 400% |
| 14315 | `1431501` | `1431504` (Lv4) | Hymn of Devotion | Active | Magic | 10000 | 1000 | 0% | 0 | 0% -> 0% |

## Thief (Job ID 5100)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 15001 | `1500101` | `1500110` (Lv10) | Increase Dodge | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 15002 | `1500201` | `1500210` (Lv10) | Double Attack | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 15003 | `1500301` | `1500305` (Lv5) | Hiding | Active | Physical | 15000 | 500 | 100% | 0 | 0% -> 0% |
| 15005 | `1500501` | `1500510` (Lv10) | Envenom | Active | Physical | 5000 | 1000 | 0% | 1 | 62% -> 80% |
| 15006 | `1500601` | `1500610` (Lv10) | Sand Puff | Active | Physical | 0 | 1000 | 0% | 1 | 46% -> 55% |
| 15007 | `1500701` | `1500701` (Lv1) | Detoxify | Active | Physical | 5000 | 500 | 0% | 0 | 0% -> 0% |
| 15104 | `1510401` | `1510405` (Lv5) | Back Slide | Active | Physical | 15000 | 300 | 0% | 0 | 0% -> 0% |

## Assassin (Job ID 5200)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 15101 | `1510101` | `1510110` (Lv10) | Katar Mastery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 15102 | `1510201` | `1510210` (Lv10) | Sonic Blow | Active | Physical | 0 | 1200 | 0% | 1 | 76% -> 85% |
| 15103 | `1510301` | `1510310` (Lv10) | Supersonic Blow | Passive | Physical | 0 | 0 | 100% | 0 | 0% -> 0% |
| 15105 | `1510501` | `1510510` (Lv10) | Envenomed Blade | Active | Physical | 0 | 1000 | 0% | 1 | 42% -> 60% |
| 15106 | `1510601` | `1510610` (Lv10) | Virus Spread | Active | Physical | 9500 | 500 | 0% | 0 | 52% -> 70% |
| 15107 | `1510701` | `1510710` (Lv10) | Dual-Wield Mastery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 15109 | `1510901` | `1510910` (Lv10) | Grimtooth | Active | Physical | 8000 | 500 | 0% | 1 | 55% -> 100% |
| 15110 | `1511001` | `1511010` (Lv10) | Venom Splasher | Active | Physical | 19000 | 500 | 0% | 1 | 65% -> 110% |
| 15111 | `1511101` | `1511110` (Lv10) | Envenom | Active | Physical | 20000 | 500 | 0% | 0 | 0% -> 0% |
| 15112 | `1511201` | `1511205` (Lv5) | Disguise | Active | Physical | 15000 | 600 | 0% | 0 | 0% -> 0% |
| 15117 | `1511701` | `1511701` (Lv1) | Dual-Wield Mastery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |

## Assassin Cross (Job ID 5300)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 15210 | `1521001` | `1521010` (Lv10) | Soul Destroyer | Active | Physical | 0 | 600 | 0% | 1 | 41% -> 50% |
| 15211 | `1521101` | `1521110` (Lv10) | Deadly Poison | Active | Physical | 20000 | 500 | 0% | 0 | 0% -> 0% |
| 15220 | `1522001` | `1522010` (Lv10) | Advanced Katar Mastery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 15229 | `1522901` | `1522910` (Lv10) | Meteor Assault | Active | Physical | 10000 | 400 | 0% | 1 | 75% -> 120% |

## Guillotine Cross (Job ID 5400)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 15301 | `1530101` | `1530105` (Lv5) | Dark Illusion | Active | Physical | 250 | 200 | 0% | 1 | 260% -> 380% |
| 15302 | `1530201` | `1530205` (Lv5) | Cross Ripper Slasher | Active | Physical | 10000 | 500 | 0% | 1 | 32% -> 40% |
| 15303 | `1530301` | `1530310` (Lv10) | Rolling Cutter | Active | Physical | 0 | 370 | 0% | 1 | 23% -> 32% |
| 15304 | `1530401` | `1530410` (Lv10) | Enhance Cloaking | Active | Physical | 15000 | 600 | 0% | 1 | 0% -> 0% |
| 15305 | `1530501` | `1530505` (Lv5) | Fatal Claw Marks | Active | Physical | 300 | 500 | 0% | 1 | 110% -> 150% |
| 15306 | `1530601` | `1530610` (Lv10) | Evil Spirit Threat | Active | Physical | 8000 | 500 | 0% | 1 | 130% -> 220% |
| 15316 | `1531601` | `1531610` (Lv10) | Prey on the Weak | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 15321 | `1532101` | `1532110` (Lv10) | Flowing Shadow | Active | Physical | 10000 | 500 | 0% | 1 | 11% -> 20% |
| 15323 | `1532301` | `1532310` (Lv10) | Shadow Guard | Active | Physical | 7000 | 500 | 0% | 1 | 55% -> 100% |
| 15324 | `1532401` | `1532410` (Lv10) | Shadow Break | Active | Physical | 0 | 500 | 0% | 1 | 31% -> 40% |
| 15326 | `1532601` | `1532605` (Lv5) | Piercing Shadow | Active | Physical | 18000 | 1000 | 0% | 1 | 110% -> 150% |
| 15329 | `1532901` | `1532905` (Lv5) | Move back Shadow Echo | Active | Physical | 10000 | 300 | 0% | 0 | 0% -> 0% |

## Merchant (Job ID 6100)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 16001 | `1600101` | `1600110` (Lv10) | Discount | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 16002 | `1600201` | `1600210` (Lv10) | Overcharge | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 16003 | `1600301` | `1600301` (Lv1) | Cart Use | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 16004 | `1600401` | `1600401` (Lv1) | Cart Remodeling | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 16005 | `1600501` | `1600503` (Lv3) | Vending | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 16006 | `1600601` | `1600610` (Lv10) | Cart Revolution | Active | Physical | 100 | 1000 | 0% | 1 | 47% -> 65% |
| 16007 | `1600701` | `1600705` (Lv5) | Mammonite | Active | Physical | 100 | 1000 | 0% | 1 | 2% -> 10% |
| 16008 | `1600801` | `1600810` (Lv10) | Crazy Uproar | Active | Physical | 10000 | 500 | 0% | 1 | 0% -> 0% |

## Blacksmith (Job ID 6200)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 16101 | `1610101` | `1610105` (Lv5) | Hilt Binding | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 16102 | `1610201` | `1610205` (Lv5) | Weaponry Research | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 16103 | `1610301` | `1610305` (Lv5) | Skin Tempering | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 16104 | `1610401` | `1610410` (Lv10) | Hammer Fall | Active | Physical | 5000 | 1500 | 0% | 1 | 55% -> 100% |
| 16105 | `1610501` | `1610505` (Lv5) | Adrenaline Rush | Active | Physical | 10000 | 600 | 0% | 1 | 0% -> 0% |
| 16106 | `1610601` | `1610610` (Lv10) | Power Thrust | Active | Physical | 10000 | 600 | 0% | 1 | 0% -> 0% |
| 16107 | `1610701` | `1610710` (Lv10) | Maximize Power | Active | Physical | 10000 | 600 | 0% | 1 | 0% -> 0% |

## Mastersmith (Job ID 6300)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 16201 | `1620101` | `1620110` (Lv10) | Cart Boost | Active | Physical | 10000 | 600 | 0% | 1 | 0% -> 0% |
| 16202 | `1620201` | `1620210` (Lv10) | High Speed Cart Ram | Active | Physical | 200 | 833 | 0% | 1 | 50% -> 95% |
| 16203 | `1620301` | `1620310` (Lv10) | Melt Down | Active | Physical | 10000 | 600 | 0% | 1 | 0% -> 0% |
| 16204 | `1620401` | `1620410` (Lv10) | Maximum Over Thrust | Active | Physical | 10000 | 600 | 0% | 1 | 0% -> 0% |

## Mechanic (Job ID 6400)

| Group | Lv1 ID | Max ID (Lv) | Name | Type | DmgType | CD (ms) | Action (ms) | ASPD Inf% | CancelCast | Lv1->Max Ratio% |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| 16301 | `1630101` | `1630105` (Lv5) | Fire and Earth Research | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 16302 | `1630201` | `1630205` (Lv5) | Axe Mastery | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 16303 | `1630301` | `1630305` (Lv5) | Emergency Treatment | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 16304 | `1630401` | `1630405` (Lv5) | Axe Tornado | Active | Physical | 8000 | 3900 | 0% | 1 | 100% -> 167% |
| 16305 | `1630501` | `1630505` (Lv5) | Heavy Axe Smash | Active | Physical | 0 | 1167 | 0% | 1 | 90% -> 130% |
| 16306 | `1630601` | `1630605` (Lv5) | Spinning Axe | Active | Physical | 12000 | 800 | 0% | 1 | 60% -> 100% |
| 16307 | `1630701` | `1630705` (Lv5) | High-Energy Impact | Active | Physical | 15000 | 5000 | 0% | 1 | 320% -> 400% |
| 16308 | `1630801` | `1630805` (Lv5) | Crescent Wheel | Active | Physical | 12000 | 1033 | 0% | 1 | 200% -> 600% |
| 16309 | `1630901` | `1630901` (Lv1) | Madogear Pilot | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |
| 16311 | `1631101` | `1631105` (Lv5) | Knuckle Boost | Active | Physical | 0 | 933 | 0% | 1 | 17% -> 25% |
| 16312 | `1631201` | `1631205` (Lv5) | Arm Cannon | Active | Physical | 7000 | 800 | 0% | 1 | 20% -> 40% |
| 16313 | `1631301` | `1631305` (Lv5) | Vulcan Arm | Active | Physical | 0 | 800 | 0% | 1 | 30% -> 70% |
| 16314 | `1631401` | `1631403` (Lv3) | Pile Bunker | Active | Physical | 10000 | 800 | 0% | 1 | 80% -> 100% |
| 16315 | `1631501` | `1631505` (Lv5) | Flame Launcher | Active | Physical | 9000 | 800 | 0% | 1 | 400% -> 600% |
| 16316 | `1631601` | `1631601` (Lv1) | High-Speed Propulsion | Active | Physical | 10000 | 500 | 0% | 0 | 0% -> 0% |
| 16317 | `1631701` | `1631701` (Lv1) | Energy Release | Active | Physical | 180000 | 800 | 0% | 1 | 2200% -> 2200% |
| 16318 | `1631801` | `1631803` (Lv3) | Aerial Bombardment | Active | Physical | 20000 | 3667 | 0% | 1 | 260% -> 300% |
| 16351 | `1635101` | `1635101` (Lv1) | Kinetic Battle Axe Assembly | Passive | Physical | 0 | 0 | 0% | 0 | 0% -> 0% |

