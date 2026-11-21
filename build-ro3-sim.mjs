#!/usr/bin/env node
/**
 * Refreshes the generated regions of ro3-damage-sim.html:
 *   ENGINE - the browser-safe part of ro3-damage-optimizer.mjs (everything before "7. Self-Test")
 *   DATA   - a compact snapshot of the exported game config (jobs, skill trees, skills, buffs, monsters, base tables, the fight pets,
 *            professions with their job resonance lineups and the game's suggested pets, cards and stat priorities, the Equipment
 *            Resonance tiers, the cards with their stars, level attributes and special effects in English) plus the
 *            hit/interrupt timing of the skills' client templates (ro3-skill-timing.json, made by extract-skill-timing.mjs)
 * then proves the bundle matches the Node engine on the raw config (identical expected damage, skill by skill), audits the
 * engine's damage per cast against the in-game skill texts (SKILL_MODEL must reproduce them at every level) and checks every
 * pet effect, the Warg Hunter kit, the resonance tiers and the modeled card effects against their texts.
 *
 * Usage: node build-ro3-sim.mjs [--config <config dir>] [--html <file>]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CONFIG_DIR, Ro3DataStore, TOTEM_CAST_STACKS, simulateRotation, simulateDistribution, evaluateSkillDamage, buildCharacterStats, CLASS_PROFILES, SKILL_MODEL, SKILL_MODIFIER_FIELDS, FOLLOW_UPS, PERIODIC_BUFFS, KING_OF_THE_PACK, COOLDOWN_RESETS, MOUNTED_ONLY, RIDING_BUFF_ONLY, RIDING_PASSIVES, SEASON_BUFFS, SEASON_MODE_GROUPS, GALE_BEAT, skillMode, hitsOf, PET_EFFECTS, petEffects, PET_STAT_ATTRS as ENGINE_PET_ATTRS, petSlotStats, petStats, resonanceEffects, CARD_BUFFS, cardEffects, cardParts, gearParts, gearEffects, rollQuantile, talentWalk, talentEffects, talentOptions, talentPick, talentMax, ASPD_EXCESS } from './ro3-damage-optimizer.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback);
const configDir = arg('--config', DEFAULT_CONFIG_DIR);
const htmlFile = path.resolve(here, arg('--html', 'ro3-damage-sim.html'));
const enginePath = path.join(here, 'ro3-damage-optimizer.mjs');

const load = (name) => JSON.parse(fs.readFileSync(path.join(configDir, `${name}.json`), 'utf8'));
const rowsOf = (t) => (Array.isArray(t) ? t : Object.values(t));
const pick = (row, keys) => Object.fromEntries(keys.filter((k) => k in row).map((k) => [k, row[k]]));
// The client exports empty lists as `{}`; the engine treats both the same, `[]` keeps the field present like the raw row.
const asList = (v) => (Array.isArray(v) ? v : []);
const keyed = (list, fn) => Object.fromEntries(list.map((r) => [String(r._iID), fn(r)]));

// ---------------------------------------------------------------- data snapshot
const L = load('Localization_en');
const loc = (key) => (key == null ? undefined : L[String(key)]?._kDes);

const jobConfig = load('JobConfig');
const treeRows = rowsOf(load('SkillTreeConfig')).sort((a, b) => a._iJob - b._iJob || a._iY - b._iY);
const treeGroups = new Set(treeRows.flatMap((t) => [1, 2, 3, 4, 5, 6, 7].map((i) => t[`_iX${i}`]).filter(Boolean)));
const treeJobIds = new Set(treeRows.map((t) => t._iJob));
const normalAttackIds = new Set(rowsOf(jobConfig).flatMap((j) => asList(j._kSkillNormalID)));

const SKILL_NUM = ['_iID', '_iSkillID', '_iLevel', '_iMaxLevel', '_iMode', '_iJob', '_iBasicType', '_iDmgType', '_iEleType', '_iDistanceType',
  '_iSkillHit', '_iSkillCri', '_iCD', '_iActionTime', '_iActionTimeInfluence', '_iChantFix', '_iChantVar', '_iScriptShow'];
const SKILL_LIST = ['_kDamageParam1', '_kDamageParam2', '_kBuff1', '_kCost', '_kLogicData', '_kAttri', '_kHitRecoverEnergy', '_kPreSkillRequired', '_kSkillCategory', '_kSkilltag', '_kDamageParamExtra', '_kDamageFormulaExtra'];
// Skills have variant rows sharing group + level (e.g. 1330505 base vs 1330515 "while Unlimited Shooting"); the engine and
// its class profiles use the base row (lowest id: group * 100 + level), so keep exactly one row per group + level.
// A FOLLOW_UPS mode is not the skill you cast (Warg Strike mode 0 is the 30% hit Focused Arrow Strike triggers, mode 1 the Charge):
// those rows stay out of the skill list and ride along flagged `_bAlt`, which the engine reads by id.
const followMode = new Map(Object.values(FOLLOW_UPS).map((f) => [f.group, f.mode]));
const isFollowRow = (r) => followMode.get(r._iSkillID) === (r._iMode | 0);
// King of the Wargs' rows the engine reads by id too: Enhanced Warg Hunt (skill mode 1) and the wolf followers (groups of their own).
const isKingRow = (r) => r._iLevel > 0 && ((KING_OF_THE_PACK.enhance[r._iSkillID] !== undefined && (r._iMode | 0) === KING_OF_THE_PACK.enhance[r._iSkillID])
  || (Object.values(KING_OF_THE_PACK.extras).includes(r._iSkillID) && !(r._iMode | 0)));
// Season buffs switch skill modes, and Gale Beat sends its own enhanced skills. Include ordinary Unlimited Shooting's FAS mode too:
// it has no Season flag, but must be available when the four Season skills are off. These rows stay out of the picker via `_bAlt`.
const buffRows = rowsOf(load('BuffConfig'));
const seasonBuffTargets = Object.values(SEASON_BUFFS).flatMap((id) => asList(buffRows.find((b) => b._iID === id)?._kSkillAttributeList).filter((t) => Array.isArray(t) && +t[2] === 15).map((t) => +t[1]));
assert.ok(seasonBuffTargets.every((g) => SEASON_MODE_GROUPS.has(g)), 'a Season buff switches the mode of a skill SEASON_MODE_GROUPS does not list');
const isSeasonRow = (r) => r._iLevel > 0 && ((SEASON_MODE_GROUPS.has(r._iSkillID) && (r._iMode | 0) > 0) || GALE_BEAT.enhanced.includes(r._iSkillID));
const baseRows = new Map();
const allSkillRows = rowsOf(load('SkillConfig')).sort((a, b) => a._iID - b._iID);
for (const r of allSkillRows) {
  const key = `${r._iSkillID}:${r._iLevel}`;
  if (treeGroups.has(r._iSkillID) && !isFollowRow(r) && !baseRows.has(key)) baseRows.set(key, r);
}
const skills = [...baseRows.values(), ...allSkillRows.filter((r) => normalAttackIds.has(r._iID) && !baseRows.has(`${r._iSkillID}:${r._iLevel}`)), ...allSkillRows.filter((r) => treeGroups.has(r._iSkillID) && isFollowRow(r)), ...allSkillRows.filter(isKingRow), ...allSkillRows.filter(isSeasonRow)]
  .map((r) => {
    const o = pick(r, SKILL_NUM);
    for (const k of SKILL_LIST) if (k in r) o[k] = asList(r[k]);
    o._kScriptLogic = r._kScriptLogic ?? '';
    o.name = loc(r._iName?.[0]) ?? (o._kScriptLogic || `Skill ${r._iID}`);
    if (isFollowRow(r) || isKingRow(r) || isSeasonRow(r)) o._bAlt = 1;
    return o;
  });

const buffIds = new Set(skills.flatMap((s) => asList(s._kBuff1).map((t) => Number(t?.[0])).filter((id) => id > 0)));
for (const p of Object.values(PERIODIC_BUFFS)) buffIds.add(p.buff); // a periodic buff comes from a skill the tree does not list
for (const id of Object.values(SEASON_BUFFS)) buffIds.add(id); // so does a Season skill's buff (the Season rows' own buffs come with them)
for (const family of Object.values(RIDING_PASSIVES)) for (let lv = 1; lv <= 10; lv++) buffIds.add(family * 100 + lv); // Wolf's Fang, applied while riding
// The totem skills' opcode-2 passives (their chance, cooldown and stack duration) and the stack buffs they put on you.
const totemSpecIds = new Set(rowsOf(load('TotemSkillConfig')).flatMap((r) => asList(r._kSpecialAttribute)));
for (const r of rowsOf(load('SpecialEffectConfig'))) if (totemSpecIds.has(r._iID)) for (const op of asList(r._kSpecialEffect)) if (op?.[0] === 2 && op.length === 2) buffIds.add(op[1]);
for (const id of Object.values(TOTEM_CAST_STACKS)) buffIds.add(id);
const BUFF_LIST = ['_kChangeAttri', '_kSkillAttributeList', '_kBuffCategory', '_kLogicData', '_kDescData'];
const slimBuff = (r) => {
  const o = pick(r, ['_iID', '_iMaxStack']);
  for (const k of BUFF_LIST) if (k in r) o[k] = asList(r[k]);
  return o;
};
const buffs = rowsOf(load('BuffConfig')).filter((r) => buffIds.has(r._iID)).map(slimBuff);

// Primary Battle uses the owner-scaled Protection skill, NOT the pet-stat AI attack in _kActiveSkill[1].
const allBuffs = new Map(rowsOf(load('BuffConfig')).map((b) => [b._iID, b]));
const skillById = new Map(allSkillRows.map((r) => [r._iID, r]));
const cleanTpl = (key) => String(loc(key) ?? '').replace(/\^\{\d+\}/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const PET_TYPE_TAGS = { 3000: 'offense', 3001: 'buff', 3002: 'debuff', 3003: 'recovery', 3004: 'shield', 3005: 'control', 3006: 'immunity', 3007: 'dispel' };
const petAlt = (r) => asList(r?._iDescription).slice(1).filter((v) => /^-?\d+(?:\.\d+)?$/.test(String(v))).map(Number);
const petText = (r) => cleanTpl(r?._iDescription?.[0]).replace(/\$\{(\d+)\}/g, (_, n) => r._kDescData[n - 1]).replace(/@\{(\d+)\}/g, (_, n) => petAlt(r)[n - 1]);
const timingRows = JSON.parse(fs.readFileSync(path.join(here, 'ro3-skill-timing.json'), 'utf8'));
const petPoints = (r) => [...new Set(asList(timingRows[r?._iScriptShow]?.[3]).map((t) => Math.round(t * 1000)))].sort((a, b) => a - b);
const petDamageRow = (r, text) => ({
  ...pick(r, ['_iDmgType', '_iSkillHit', '_iSkillCri']),
  _iID: r._iID, _iSkillID: r._iSkillID, _iBasicType: 1, _iActionTime: 0, _iEleType: 1,
  // A few exported distance fields disagree with the owner-skill text (notably Garm's melee breath).
  _iDistanceType: /\bmelee\b/i.test(text) ? 1 : 2,
});
function petPrimary(parent) {
  const text = petText(parent);
  const children = asList(parent._kLogicData).map((g) => skillById.get(g * 100 + parent._iLevel)).filter((r) => r?._iSkillID >= 23000 && r._iSkillID < 23700);
  const child = children.find((r) => asList(r._kDamageParam1).length) ?? children[0];
  const points = petPoints(child);
  const out = {
    id: parent._iID, cd: parent._iCD, hits: [], buffs: [], notes: [],
  };
  for (const r of children) for (const tuple of asList(r._kBuff1)) {
    const attrs = asList(allBuffs.get(tuple[0])?._kChangeAttri).filter((p) => Array.isArray(p) && p.length === 2);
    if (attrs.length && tuple[2] > 0) out.buffs.push({ attrs, durMs: tuple[2], firstMs: petPoints(r)[0] ?? 0 });
  }
  if (!child || !/\bdeal(?:s|ing)?\b.*\b(?:damage|DMG)\b/i.test(text)) return out; // Shield/heal ratios are not damage.
  const raw = asList(child._kDamageParam1).map(Number);
  if (!raw.length) return out;
  const n = asList(parent._kDescData).map(Number);
  const group = parent._iSkillID;
  let ratios, at;
  if ([23444, 23373, 23060].includes(group)) { // Garm / Ferus / Medusa: each native marker deals the listed amount.
    ratios = points.map(() => raw[0]); at = points;
  } else if (group === 23113) { // Owl Baron: five separate strikes, not a single 400% hit.
    ratios = Array.from({ length: n[4] }, () => n[5] * 100);
    at = ratios.map((_, i) => (points[0] ?? 0) + Math.round(i * n[1] * 1000));
  } else if (group === 23082) { // Incubus: the child installs an aura; its placeholder damage is never an attack.
    ratios = Array.from({ length: Math.floor(n[1] / n[6]) }, () => n[2] * 100);
    at = ratios.map((_, i) => Math.round((i + 1) * n[6] * 1000));
    out.tickMs = Math.round(n[6] * 1000);
  } else if (group === 23140) { // Aliot's second parameter is healing; five 140% damage strikes total 700%.
    ratios = Array.from({ length: 5 }, () => raw[0]); at = points;
  } else if (group === 23274) {
    ratios = Array.from({ length: 3 }, () => raw[0] / 3); at = points.slice(-3);
  } else if (group === 23341) {
    ratios = Array.from({ length: petAlt(parent)[0] }, () => raw[0]); at = points.slice(0, ratios.length);
  } else if (group === 23032) {
    ratios = [raw[0], raw[0]]; at = points;
  } else if (group === 23100) {
    ratios = Array.from({ length: petAlt(parent)[0] }, () => raw[0]); at = points;
  } else if (group === 23291) {
    const count = petAlt(parent)[1];
    ratios = points.flatMap(() => Array.from({ length: count }, () => raw[0] / count));
    at = points.flatMap((t) => Array.from({ length: count }, () => t));
  } else if (group === 23503) {
    ratios = [raw[0]]; at = points.slice(-1);
    out.notes.push('Bongun Poison damage-over-time is not simulated.');
  } else if (group === 23332) {
    // ponytail: this script synthesizes its storm ticks outside the animation markers. Do not invent hit times; export its runtime events to add it.
    out.notes.push('Bloody Butterfly storm/final-hit damage is not simulated yet; its Primary cast still triggers cast-based passives.');
    return out;
  } else {
    const multi = [23013, 23312, 23151, 23362, 23250].includes(group);
    ratios = multi ? raw : [raw[0]];
    at = points.slice(-ratios.length);
  }
  assert.ok(ratios.length && ratios.length === at.length, `Primary ${parent._iID}: unresolved damage markers`);
  out.row = petDamageRow(group === 23082 ? skillById.get(2308600 + parent._iLevel) : child, text);
  out.hits = ratios.map((ratio, i) => ({ at: at[i], ratio }));
  if (points.length > at.length) out.notes.push('Damage uses the exported branches; impact timing is approximated where the template includes extra markers.');
  if ([23032, 23013, 23121, 23341, 23262, 23274].includes(group)) out.notes.push('Conditional owner on-hit/kill effects are not included in this Primary skill model.');
  if (/\b(?:reduces?|reducing)\b.*\bDEF\b/i.test(text)) out.notes.push('Target DEF reduction is not simulated.');
  return out;
}
const petStarRows = rowsOf(load('PetStarConfig')).filter((r) => (r._iStage | 0) === 0);
const PetDigest = Object.fromEntries(rowsOf(load('PetBaseConfig')).map((b) => {
  const stars = [1, 2, 3, 4, 5, 6].map((s) => petStarRows.find((r) => r._iPetID === b._iID && r._iStar === s));
  assert.ok(stars.every(Boolean), `pet ${b._iID}: a star row is missing`);
  const mains = stars.map((r) => skillById.get(r._iProtectSkill));
  const pass = stars.map((r) => skillById.get(r._iPassiveMain));
  const cores = stars.map((r) => (r._iCorePassiveSkill ? skillById.get(r._iCorePassiveSkill) : null));
  assert.ok(mains.every(Boolean) && pass.every(Boolean), `pet ${b._iID}: a skill row is missing`);
  const top = mains[5];
  return [b._iID, {
    _iID: b._iID,
    name: loc(b._iName?.[0]),
    g: b._iQuality * 10 + b._iCamp, // its growth group (PetGrowth): rank (3 B, 4 A, 5 S) and faction (1 Destiny .. 4 Perception)
    cd: top._iCD,
    types: asList(top._kSkilltag).flatMap((t) => PET_TYPE_TAGS[t] ?? []),
    main: { name: loc(top._iName?.[0]), tpl: cleanTpl(top._iDescription?.[0]) },
    pas: { name: loc(pass[5]._iName?.[0]), tpl: cleanTpl(pass[5]._iDescription?.[0]) },
    core: cores[5] ? { name: loc(cores[5]._iName?.[0]), tpl: cleanTpl(cores[5]._iDescription?.[0]) } : null,
    star: stars.map((_, i) => {
      const primary = petPrimary(mains[i]);
      return {
        m: asList(mains[i]._kDescData).map(String),
        ma: petAlt(mains[i]), primary,
        p: asList(pass[i]._kDescData).map(String),
        pa: petAlt(pass[i]),
        passiveRow: PET_EFFECTS[b._iID]?.passive?.damageGroup ? pick(skillById.get(PET_EFFECTS[b._iID].passive.damageGroup * 100 + i + 1), ['_iSkillHit', '_iSkillCri']) : null,
        c: asList(cores[i]?._kDescData).map(String),
        ca: petAlt(cores[i]),
      };
    }),
  }];
}));

// Cards, as the engine's cardEffects reads them: the card items (name, slot part, quality, unique flag), their four stars (CardConfig),
// the attributes of every level (CardUpgradeConfig) and the special effects they carry (SpecialEffectConfig), each effect with its
// English text (`tx`, from its own description or from the buff / skill it grants) for the Cards window. The Collection (foil) version of
// a purple, gold or red card adds `_kFlashAttribute`: effect rows of plain `[1, attribute, value]` ops with no text of their own.
const cardItems = rowsOf(load('ItemConfig')).filter((r) => r._iType === 4 && r._iSubType === 400);
const cardIds = new Set(cardItems.map((r) => r._iID));
const cardTierRows = rowsOf(load('CardConfig')).filter((r) => cardIds.has(r._iCardID));
const effectIds = new Set(cardTierRows.flatMap((r) => [...asList(r._kSkillAttribute), ...asList(r._kFlashAttribute)]));
const effectRows = rowsOf(load('SpecialEffectConfig')).filter((r) => effectIds.has(r._iID));
// `${n}` and `@{n}` take the n-th number; a granted skill's level is left out ("Allows use of Hiding Lv. ?" -> "Allows use of Hiding").
const fillText = (tpl, nums, alt = []) => String(tpl ?? '')
  .replace(/\$\{(\d+)\}|@\{(\d+)\}/g, (_, a, b) => nums?.[(a ?? b) - 1] ?? alt[a ?? b] ?? '?')
  .replace(/\^\{\d+\}|<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/ Lv\.(?= and\b)| Lv\. ?\??(?=\.)/g, '').trim();
const effectText = (r) => {
  const [kind, id] = asList(r._kOtherDesc);
  const from = r._iIsOtherDesc && kind === 2 ? allBuffs.get(id) : r._iIsOtherDesc && kind === 3 ? skillById.get(id) : null;
  if (from) return fillText(loc(asList(from._iDescription)[0]), asList(from._kDescData), asList(from._iDescription));
  return fillText(loc(asList(r._iEffectDesc)[0]), asList(r._kDescData));
};
const cardTables = {
  ItemConfig: keyed(cardItems, (r) => ({ ...pick(r, ['_iID', '_iCardPart', '_iQuality', '_iIfSameCard']), name: loc(r._iName?.[0]) })),
  CardConfig: keyed(cardTierRows, (r) => ({ ...pick(r, ['_iID', '_iCardID', '_iTier', '_iLevel']), _kBasicAttribute: asList(r._kBasicAttribute), _kSkillAttribute: asList(r._kSkillAttribute), _kFlashAttribute: asList(r._kFlashAttribute) })),
  CardUpgradeConfig: keyed(rowsOf(load('CardUpgradeConfig')), (r) => ({ ...pick(r, ['_iID', '_iParts', '_iQuality', '_iLevel']), _iAttr: asList(r._iAttr) })),
  SpecialEffectConfig: keyed(effectRows, (r) => ({ _iID: r._iID, _kSpecialEffect: asList(r._kSpecialEffect), tx: effectText(r) })),
};
// The buffs of the effects CARD_BUFFS models (Drake) join the embedded buffs: the engine reads their value from `_kLogicData`.
for (const r of effectRows) {
  for (const op of asList(r._kSpecialEffect)) {
    if (op[0] === 2 && CARD_BUFFS[Math.floor(op[1] / 100)] && !buffIds.has(op[1])) {
      buffIds.add(op[1]);
      buffs.push(slimBuff(allBuffs.get(op[1])));
    }
  }
}

// Gear (tier 5-7 equipment), as the engine's gearParts reads it: the items (slot part, quality, level and class needs, English name), their
// EquipConfig rows (base ranges, the affix group, the stunt pools), those pools, the entry counts by quality and the grid tables (StrengthenTable,
// RefiningTable). Arena items (id >= 9000000) and the tiers nobody can wear yet (level 999) are left out. Every stunt comes with its English text.
const equipRows = new Map(rowsOf(load('EquipConfig')).map((r) => [r._iID, r]));
const GEAR_RANKS = [5, 6, 7];
const GEAR_GRID = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6 }; // item part (1 two-hander, 2 one-hander, 3 shield, 4 armor, 5 cloak, 6 shoes, 7 accessory) -> grid
const gearItems = rowsOf(load('ItemConfig')).filter((r) => r._iType === 5 && r._iID < 9000000 && r._iLevelNeed < 999 && r._iQuality >= 3 && GEAR_RANKS.includes(equipRows.get(r._iEquipId)?._iRank));
const gearEquip = gearItems.map((r) => equipRows.get(r._iEquipId));
const gearAttrGroups = new Set(gearEquip.map((e) => e._iEntries).filter((g) => g > 0));
const gearStuntGroups = new Set(gearEquip.flatMap((e) => asList(e._kSpecial).map((d) => d[0])));
const stuntPoolRows = rowsOf(load('EquipSpecialGroupConfig')).filter((r) => gearStuntGroups.has(r._iGroup));
// The stunts the game recommends are written in one tier's ids (mostly T5); the Gear window matches them to the pools of any tier by what they do.
const recommendedStunts = rowsOf(load('ProfessBuildSuggConfig')).flatMap((s) => asList(s._kEquipSpecial));
const stuntIds = new Set([...stuntPoolRows.map((r) => r._iSpecialID), ...gearEquip.flatMap((e) => asList(e._kFixedSpecialAttribute)), ...recommendedStunts]);
const stuntRows = rowsOf(load('SpecialEffectConfig')).filter((r) => stuntIds.has(r._iID));
const gearTables = {
  EquipConfig: keyed(gearEquip, (r) => ({ ...pick(r, ['_iID', '_iRank', '_iEntries']), _kBasicAttribute: asList(r._kBasicAttribute), _kFixedEntries: asList(r._kFixedEntries), _kSpecial: asList(r._kSpecial), _kFixedSpecialAttribute: asList(r._kFixedSpecialAttribute) })),
  EquipAttriGroupConfig: keyed(rowsOf(load('EquipAttriGroupConfig')).filter((r) => gearAttrGroups.has(r._iGroup)), (r) => pick(r, ['_iID', '_iGroup', '_iAttriID', '_iMin', '_iMax', '_iWeight'])),
  EquipSpecialGroupConfig: keyed(stuntPoolRows, (r) => pick(r, ['_iID', '_iGroup', '_iSpecialID', '_iWeight'])),
  EquipEntryRandom: keyed(rowsOf(load('EquipEntryRandom')), (r) => pick(r, ['_iID', '_iNum', '_iQuality', '_iWeight'])),
  StrengthenTable: keyed(rowsOf(load('StrengthenTable')), (r) => ({ ...pick(r, ['_iID', '_iEquipType', '_iStrengthenInterval', '_iLev']), _kAttr: asList(r._kAttr) })),
  RefiningTable: keyed(rowsOf(load('RefiningTable')), (r) => ({ ...pick(r, ['_iID', '_iEquipType', '_iRefiningInterval', '_iLev']), _kAttr: asList(r._kAttr) })),
};
const gearItemRows = keyed(gearItems, (r) => ({ ...pick(r, ['_iID', '_iType', '_iEquipId', '_iEquipPart', '_iSubType', '_iQuality', '_iLevelNeed']), _kJobNeed: asList(r._kJobNeed), name: loc(r._iName?.[0]) }));
const gearEffectRows = keyed(stuntRows, (r) => ({ _iID: r._iID, _kSpecialEffect: asList(r._kSpecialEffect), tx: effectText(r) }));
// Where in the roll range a Low / Mid / High item sits: the 25th, 50th and 75th percentile of each quality's rolls (EquipAttriRandom).
const gearRolls = Object.fromEntries([3, 4, 5, 6].map((q) => [q, [0.25, 0.5, 0.75].map((p) => rollQuantile(q, p, new Ro3DataStore(configDir)))]));

// Professions (the game's job resonance: each profession of a class has a lineup of skills and a resonance type) with what the game suggests
// for them: pets, cards ([basic, advanced] lists) and the stat priorities (`_KAttr`, attribute ids) and recommended stat pair (`stat`).
const resonanceType = new Map(rowsOf(load('JobResonanceConfig')).map((r) => [r._iJobResonanceId, loc(r._iName) ?? String(r._iName)]));
const resonanceOf = new Map(rowsOf(load('JobResonanceActiveConfig')).map((a) => [a._iJobProfess, a]));
const professionRows = new Map(rowsOf(load('JobProfessConfig')).map((p) => [p._iID, p]));
const suggested = rowsOf(load('ProfessBuildSuggConfig'));
const groupOf = (rowId) => Math.floor(Number(rowId) / 100);

// Hit points and interrupt frame of the skill templates the embedded skills play (digest made by extract-skill-timing.mjs).
const timingAll = JSON.parse(fs.readFileSync(path.join(here, 'ro3-skill-timing.json'), 'utf8'));
const attriMonster = new Map(rowsOf(load('AttriMonsterConfig')).map((r) => [r._iID, r]));

// What a pet gives its master (the engine's petStats, after the client's Stat Bonus Overview). PetGrowth: the pets' own stats (HP, SP,
// P.ATK, M.ATK, P.DEF, M.DEF) at levels 1..99, one curve per growth group = rank x faction (AttriMonsterConfig row `variation * 1000 +
// level` of the pet's NPC; every pet of a group shares its variation). PetRules: the rank step of every star and stage (PetStarConfig
// `_iBaseAttr`, one curve for all pets), the share of each slot (PetSetLimitConfig) and the per-rank scales, slot unlock levels (PublicParamConfig).
const PET_STAT_ATTRS = ENGINE_PET_ATTRS; // the order of a growth row's levels: the engine reads the digest by it
const petStarAll = rowsOf(load('PetStarConfig'));
const PetGrowth = {};
{
  const npcById = new Map(rowsOf(load('NPCConfig')).map((n) => [n._iID, n]));
  for (const b of rowsOf(load('PetBaseConfig'))) {
    const g = b._iQuality * 10 + b._iCamp;
    const v = npcById.get(b._iMonster)?._iAttributeVariated;
    assert.ok(v, `pet ${b._iID}: its NPC has no stat variation`);
    PetGrowth[g] ??= {
      _iID: g, q: b._iQuality, camp: b._iCamp, v,
      lv: Array.from({ length: 99 }, (_, i) => {
        const m = new Map(asList(attriMonster.get(v * 1000 + i + 1)?._kAttri));
        assert.equal([...m.keys()].sort().join(), PET_STAT_ATTRS.join(), `variation ${v} level ${i + 1}: HP, SP, P.ATK, M.ATK, P.DEF, M.DEF only`);
        return PET_STAT_ATTRS.map((a) => m.get(a));
      }),
    };
    assert.equal(PetGrowth[g].v, v, `pet ${b._iID}: growth group ${g} is one stat curve`);
  }
}
const publicParams = load('PublicParamConfig');
const PetRules = (() => {
  const stars = petStarAll;
  const curve = [];
  for (let s = 1; s <= 6; s++) {
    for (let st = 0; st <= (s === 6 ? 0 : 3); st++) {
      const steps = new Set(stars.filter((r) => r._iStar === s && r._iStage === st).map((r) => r._iBaseAttr));
      assert.equal(steps.size, 1, `star ${s} stage ${st}: one rank step for every pet`);
      curve.push([...steps][0]);
    }
  }
  const limits = rowsOf(load('PetSetLimitConfig')).sort((a, b) => a._iID - b._iID);
  const scale = (k) => Object.fromEntries(asList(publicParams[k]));
  return {
    1: {
      _iID: 1, curve, fight: limits.map((l) => l._iFightAttrAddition), assist: limits.map((l) => l._iAssistAttrAddition),
      fightScale: scale('PetFightAttrAdditionScale'), assistScale: scale('PetAssistAttrAdditionScale'),
      notAdd: { fight: asList(publicParams.PetFightAttrNotAddition), assist: asList(publicParams.PetAssistAttrNotAddition) },
      fightLv: asList(publicParams.PetFightFieldUnlockLv), assistLv: asList(publicParams.PetAssistFieldUnlockLv), maxLv: 99,
    },
  };
})();
// Season Talents, as the engine's talentWalk / talentEffects read them (the engine's "6e. Season Talents" says how the system works). Per tree: when it opens
// (SeasonTalentTreeConfig + LC_ConditionList: job rank 1019 and base level 1002, the Talent Lv it needs) and its chain of nodes from the start point: stat
// nodes (type 1 and 2) and branch points (type 5). Per stat group: what a level gives and costs (SeasonTalentEffectConfig; linear in the level, audited
// below). Per branch point: its job talent clusters (type 6) with their talents (type 7), a row per job family and profession set with its English text, the
// attributes it adds (`a`; `c` once a skill has the level) and the buffs it applies (`b`: BuffConfig rows whose skill modifiers and attributes the engine
// reads). `sim`: 2 all of it is simulated, 1 part of it, 0 none (extra hits, areas, durations, procs, modifiers of other buffs).
const TALENT_MATS = 1250900; // Talent Remnant
const TALENT_COIN = 2; // Minted Coin
const talentSimJobs = new Set(rowsOf(jobConfig).filter((j) => treeJobIds.has(j._iID) && j._iJobRank >= 2).map((j) => j._iID));
const talentNodes = rowsOf(load('SeasonTalentConfig'));
const talentEffectRows = new Map();
for (const r of rowsOf(load('SeasonTalentEffectConfig'))) (talentEffectRows.get(r._iGroup) ?? talentEffectRows.set(r._iGroup, []).get(r._iGroup)).push(r);
for (const list of talentEffectRows.values()) list.sort((a, b) => a._iLevel - b._iLevel);
const TalentDigest = (() => {
  const nodeById = new Map(talentNodes.map((n) => [n._iId, n]));
  const conditions = load('LC_ConditionList');
  const specials = new Map(rowsOf(load('SpecialEffectConfig')).map((r) => [r._iID, r]));
  const itemName = new Map(rowsOf(load('ItemConfig')).filter((i) => [TALENT_MATS, TALENT_COIN].includes(i._iID)).map((i) => [i._iID, loc(asList(i._iName)[0])]));
  const branches = {};
  const trees = rowsOf(load('SeasonTalentTreeConfig')).sort((a, b) => a._iNeedLevel - b._iNeedLevel).map((t) => {
    const subs = conditions[t._iTreeCondition].m_kSubConditionList;
    assert.ok(subs.every((s) => !s.m_bInverse && [1019, 1002].includes(s.m_kData[0])), `tree ${t._iId}: its open condition is a job rank and a base level`);
    const want = (kind) => Number(subs.find((s) => s.m_kData[0] === kind)?.m_kData[1] ?? 0);
    const start = talentNodes.filter((n) => n._iTalentTreeID === t._iId && n._iIsStartPoint);
    assert.equal(start.length, 1, `tree ${t._iId}: one start point`);
    const chain = [];
    for (let n = start[0]; n;) {
      const after = asList(n._kAfterids).map((id) => nodeById.get(id));
      if (n._iType === 5) branches[n._iId] = after.filter((c) => c._iType === 6).map((c) => ({ n: c._iId, kids: asList(c._kAfterids) }));
      chain.push({ n: n._iId, ty: n._iType, max: n._iMaxLevel, g: n._iType === 5 ? 0 : n._iLevelGroupId });
      const next = after.filter((c) => c._iType <= 2 || c._iType === 5);
      assert.ok(next.length <= 1, `node ${n._iId}: one way on`);
      [n] = next;
    }
    return { id: t._iId, name: fillText(loc(t._iTreeName[0]), t._iTreeName.slice(1)).replace('+-', '+'), need: t._iNeedLevel, rank: want(1019), lv: want(1002), chain };
  });
  // What a level of a stat node gives (linear: level L is L times level 1) and costs (the same at every level).
  const groups = {};
  for (const tree of trees) {
    for (const node of tree.chain.filter((n) => n.ty !== 5)) {
      const rows = talentEffectRows.get(node.g);
      assert.ok(rows && rows.length >= node.max, `node ${node.n}: effect rows for its ${node.max} levels`);
      const per = asList(rows[0]._kAttrs).map(([a, v]) => [a, v]);
      const cost = asList(rows[0]._kCosts);
      assert.deepEqual(cost.map((c) => c[0]), [TALENT_MATS, TALENT_COIN], `group ${node.g}: costs Talent Remnants and Minted Coins`);
      groups[node.g] ??= { name: loc(asList(rows[0]._iName)[0]), per, cost: cost.map((c) => c[1]) };
      assert.deepEqual(groups[node.g].per, per, `group ${node.g}: the same attributes in every tree`);
      for (let lv = 1; lv <= node.max; lv++) {
        assert.equal(rows[lv - 1]._iLevel, lv, `group ${node.g}: level ${lv} exists`);
        assert.deepEqual(asList(rows[lv - 1]._kAttrs), per.map(([a, v]) => [a, v * lv]), `group ${node.g} level ${lv}: linear in the level`);
        assert.deepEqual(asList(rows[lv - 1]._kCosts), cost, `group ${node.g} level ${lv}: the same cost at every level`);
      }
    }
  }
  // What a buff does that the engine applies: the skill modifiers of its types (SKILL_MODIFIER_FIELDS) and its attribute changes; the rest (extra hits
  // and areas, `_kLogicData`, modifiers of other buffs, `_kBuffAttributeList`) is counted as left out.
  const modifier = (t) => Array.isArray(t) && t.length >= 5;
  const applied = (t) => Number(t[2]) in SKILL_MODIFIER_FIELDS && [1, 2, 5].includes(Number(t[3]));
  const buffParts = (b) => {
    const tuples = asList(b._kSkillAttributeList).filter(modifier);
    const done = tuples.filter(applied).length + asList(b._kChangeAttri).length;
    return { done, left: tuples.length - tuples.filter(applied).length + (asList(b._kLogicData).length ? 1 : 0) + asList(b._kBuffAttributeList).filter((t) => Array.isArray(t) && t.length).length };
  };
  const jobRow = (r) => {
    const row = { jobs: asList(r._iJobId), profs: asList(r._kProfessionID), name: loc(asList(r._iName)[0]), text: '', sim: 0, a: [], b: [], c: [] };
    let done = 0;
    let left = 0;
    const texts = [];
    for (const id of asList(r._kSpecialEffectList)) {
      const special = specials.get(id);
      assert.ok(special, `talent effect ${r._iId}: special effect ${id} exists`);
      texts.push(effectText(special));
      for (const op of asList(special._kSpecialEffect)) {
        if (op[0] === 1) { row.a.push([op[1], op[2]]); done++; } // [1, attribute, value]
        else if (op[0] === 19) { row.c.push([op[1], op[2], op[3], op[4]]); done++; } // [19, skill group, skill level, attribute, value]
        else if (op[0] === 20 && op[1] === 3) { row.a.push([op[2], op[3]]); done++; } // [20, 3, attribute, value]: "while fighting alongside the Falcon" (assumed true)
        else if (op[0] === 2) { // [2, buff]
          const parts = buffParts(allBuffs.get(op[1]));
          if (parts.done) row.b.push(op[1]);
          done += parts.done;
          left += parts.left;
        } else left++;
      }
    }
    row.text = texts.join(' ');
    row.sim = done && !left ? 2 : done ? 1 : 0;
    return row;
  };
  const jobs = {};
  for (const node of talentNodes.filter((n) => n._iType === 6 || n._iType === 7)) {
    const rows = talentEffectRows.get(node._iLevelGroupId) ?? [];
    assert.ok(rows.every((r) => r._iLevel === 1 && asList(r._iJobId).length), `job talent ${node._iId}: one level, per job family`);
    jobs[node._iId] = rows.filter((r) => asList(r._iJobId).some((j) => talentSimJobs.has(j))).map(jobRow);
  }
  return { _iID: 1, items: [itemName.get(TALENT_MATS), itemName.get(TALENT_COIN)], trees, groups, branches, jobs };
})();
// The buffs the talents apply join the embedded buffs (the engine reads the skill modifiers and attribute changes from them).
for (const id of new Set(Object.values(TalentDigest.jobs).flat().flatMap((r) => r.b))) {
  if (!buffIds.has(id)) {
    buffIds.add(id);
    buffs.push(slimBuff(allBuffs.get(id)));
  }
}
const tables = {
  AttributeConfig: keyed(rowsOf(load('AttributeConfig')), (r) => pick(r, ['_iID', '_iPreAttri', '_iCalculateType', '_iDataType'])),
  AttributeConversionConfig: keyed(rowsOf(load('AttributeConversionConfig')), (r) => pick(r, ['_iID', '_kAttribute1', '_kAttribute2'])),
  BasePointConfig: keyed(rowsOf(load('BasePointConfig')), (r) => pick(r, ['_iID', '_iStatusPoint'])),
  BaseLvConfig: keyed(rowsOf(load('BaseLvConfig')), (r) => pick(r, ['_iID', '_iStatusPoint'])),
  EleConfig: keyed(rowsOf(load('EleConfig')), (r) => r),
  JobConfig: keyed(rowsOf(jobConfig), (r) => ({ ...pick(r, ['_iID', '_iDistanceType', '_iJobRank']), _kAttri: asList(r._kAttri), _kSkillNormalID: asList(r._kSkillNormalID) })),
  AttriBaseLvConfig: keyed(rowsOf(load('AttriBaseLvConfig')), (r) => ({ _iID: r._iID, _kAttri: asList(r._kAttri) })),
  SkillConfig: keyed(skills, (r) => r),
  SkillTiming: Object.fromEntries([...new Set(skills.map((s) => s._iScriptShow))].filter((id) => timingAll[id]).map((id) => [id, timingAll[id]])),
  BuffConfig: keyed(buffs, (r) => r),
  // Equipment Resonance tiers: with all 7 equipment grids at `_kRequest[1]` the row's `_kEffect` applies.
  RefiningEffectTable: keyed(rowsOf(load('RefiningEffectTable')), (r) => pick(r, ['_iID', '_iEffectLev', '_kEffect', '_kRequest'])),
  StrengthenEffectTable: keyed(rowsOf(load('StrengthenEffectTable')), (r) => pick(r, ['_iID', '_iEffectLev', '_kEffect', '_kRequest'])),
  PetDigest,
  PetGrowth,
  PetRules,
  PetCollection: Object.fromEntries(rowsOf(load('PetStarConfig')).map((r) =>
    [`${r._iPetID}:${r._iStar}:${r._iStage}`, { attrs: asList(r._kCollectAttr) }])),
  TotemLvConfig: Object.fromEntries(rowsOf(load('TotemLvConfig')).map((r) =>
    [r._iLv, pick(r, ['_iLv', '_iExp', '_iAttributeEnhance'])])),
  TotemSkillConfig: keyed(rowsOf(load('TotemSkillConfig')), (r) =>
    ({ ...pick(r, ['_iID', '_iSuperiorSkillID', '_iIsCoexist']), _kBasicAttribute: asList(r._kBasicAttribute), _kSpecialAttribute: asList(r._kSpecialAttribute) })),
  TalentDigest: { 1: TalentDigest },
  ...cardTables,
  ...gearTables,
  // Cards and gear share these two tables: the cards are told apart by `_iCardPart`, the equipment by `_iType` 5.
  ItemConfig: { ...cardTables.ItemConfig, ...gearItemRows },
  SpecialEffectConfig: { ...cardTables.SpecialEffectConfig, ...gearEffectRows },
};
const totemEffects = new Set(Object.values(tables.TotemSkillConfig).flatMap((r) => r._kSpecialAttribute));
for (const r of rowsOf(load('SpecialEffectConfig')).filter((r) => totemEffects.has(r._iID)))
  tables.SpecialEffectConfig[r._iID] = { _iID: r._iID, _kSpecialEffect: asList(r._kSpecialEffect) };

// Monsters exactly as MonsterService.Build derives them: AttriMonsterConfig x NPCConfig._kAttriScale / 10000. The last two columns are
// race and size (NPCConfig), which the cards' "Damage to <race> Race" and "DMG vs <size> Enemies" bonuses ask for.
const seen = new Set();
const monsters = [];
for (const n of rowsOf(load('NPCConfig'))) {
  const name = loc(n._kName?.[0]);
  const am = attriMonster.get(n._iAttribute || n._iAttributeVariated * 1000 + n._iLevel);
  if (n._iNPCType !== 1 || !name || !am) continue;
  const attr = Object.fromEntries(asList(am._kAttri));
  for (const [id, scale] of asList(n._kAttriScale)) if (id in attr) attr[id] = (attr[id] * scale) / 10000;
  const A = (id) => Math.round(attr[id] ?? 0);
  const m = [n._iID, name, n._iLevel, Math.max(1, A(101)), A(105), A(106), 109 in attr ? A(109) : n._iLevel + 1, 110 in attr ? A(110) : n._iLevel, n._iElement, n._iNPCSubType];
  const key = m.slice(1).join('|');
  if (!seen.has(key)) {
    seen.add(key);
    monsters.push([...m, n._iRace | 0, n._iSize | 0]);
  }
}
monsters.sort((a, b) => a[2] - b[2] || a[1].localeCompare(b[1]));

const ui = {
  jobs: rowsOf(jobConfig)
    .filter((j) => treeJobIds.has(j._iID) && j._iJobRank >= 2)
    .map((j) => ({ id: j._iID, name: loc(j._iName?.[0]) ?? String(j._iID), parent: j._iParentId, rank: j._iJobRank, ranged: j._iDistanceType === 2 }))
    .sort((a, b) => a.id - b.id),
  trees: {},
  monsters,
};
for (const t of treeRows) (ui.trees[t._iJob] ??= []).push([1, 2, 3, 4, 5, 6, 7].map((i) => t[`_iX${i}`] || 0));
// ui.profs[job] = the class's professions: { id, name, title, main / minor skill groups, resonance type + lineup groups, the game's suggested
// pets and cards ([basic, advanced] lists of ids), stat priorities (`prio`, [basic, advanced] lists of attribute ids), recommended stat
// pair (`stat`: [[1 STR .. 6 LUK, weight]]), recommended gear affixes (`aff`: [basic, advanced] lists of STR..LUK ids) and stunts (`spe`:
// [basic, advanced] lists of SpecialEffectConfig ids) }. The lineup (the skills that make up the profession's job resonance) exists for
// 4th-job classes only.
ui.profs = {};
for (const j of ui.jobs) {
  const list = asList(rowsOf(jobConfig).find((x) => x._iID === j.id)?._kProfessionID).map((pid) => {
    const p = professionRows.get(pid);
    const active = resonanceOf.get(pid);
    if (!p) return null;
    const sugg = [0, 1].map((type) => suggested.find((s) => s._iProfessionID === pid && s._iSuggestionType === type));
    const pets = sugg.map((s) => asList(s?._kPet).filter((id) => PetDigest[id]));
    return {
      id: pid, name: loc(p._iName?.[0]) ?? String(pid), title: loc(p._iTitle?.[0]) ?? '',
      main: asList(p._kSkillMain).map(groupOf), minor: asList(p._kSkillMinor).map(groupOf),
      res: active ? resonanceType.get(active._iJobResonanceId) ?? '' : '', lineup: asList(active?._iJobResonanceSkills).map(groupOf), pets,
      cards: sugg.map((s) => asList(s?._kCard).filter((id) => cardIds.has(id))), prio: sugg.map((s) => [...new Set(asList(s?._KAttr))]), stat: asList(p._kAttri),
      aff: sugg.map((s) => asList(s?._kEquipEntries)), spe: sugg.map((s) => asList(s?._kEquipSpecial)),
    };
  }).filter(Boolean);
  if (list.length) ui.profs[j.id] = list;
}
ui.rolls = gearRolls;
const echoItems = rowsOf(load('ItemConfig')).filter((r) => r._iType === 8 && r._iSubType === 800);
const echoLevels = rowsOf(load('EmblemLvConfig')).flat();
const echoConfig = new Map(rowsOf(load('EmblemConfig')).flat().map((r) => [r._iID, r]));
const echoAttrs = new Set([
  ...[...echoConfig.values()].flatMap((r) => asList(r._kPrimaryAttribute).map(([a]) => a)),
  ...rowsOf(load('EmblemSubAttriGroupConfig')).flat().map((r) => r._iSubAttriID),
]);
ui.echoes = Object.fromEntries(echoItems.map((r) => [r._iID, {
  name: loc(r._iName?.[0]) ?? `Soul Echo ${r._iID}`,
  q: r._iQuality,
  icon: Number(/^item_(\d+)/.exec(r._kIcon)?.[1] ?? r._iID),
  maxLv: Math.max(0, ...echoLevels.filter((lv) => lv._iQuality === r._iQuality).map((lv) => lv._iLv)),
  markLevels: asList(echoConfig.get(r._iID)?._kInitialMark).map(([lv]) => lv),
}]));
ui.echoAttrs = [...echoAttrs].sort((a, b) => a - b);
// Divine Totems for the manual editor: the totem's quality, rolled base attributes [attr, min, max] and born skills; the learnable skills by name.
const itemRows = new Map(rowsOf(load('ItemConfig')).map((r) => [r._iID, r]));
ui.totems = Object.fromEntries(rowsOf(load('TotemConfig')).map((r) => {
  const item = itemRows.get(r._iID);
  return [r._iID, { name: loc(item?._iName?.[0]) ?? `Totem ${r._iID}`, q: item?._iQuality ?? 0, icon: Number(/^item_(\d+)/.exec(item?._kIcon)?.[1] ?? r._iID),
    attrs: asList(r._kBasicAttribute), born: asList(r._kBornSkill).map(([id]) => id) }];
}));
ui.totemSkills = Object.fromEntries(rowsOf(load('TotemSkillConfig')).map((r) => [r._iID, { name: loc(r._iName?.[0]) ?? `Totem skill ${r._iID}`, q: r._iQuality }]));
ui.totemSkillMax = Object.fromEntries(asList(load('PublicParamConfig').TotemSkillInitMax)); // quality -> learned-skill cap (blue: none)
// English names of the attributes cards, gear (and the suggested stat priorities) talk about, without the trailing "%" the percent ones carry.
{
  const attrRows = new Map(rowsOf(load('AttributeConfig')).map((r) => [r._iID, r]));
  // The attributes a stunt's ops name (op 1: attr; 4: per-count attr; 5: per-refine attr; 8: source, target; 14: two sources, target).
  const opAttrs = (op) => ({ 1: [op[1]], 4: [op[3]], 5: [op[2]], 8: [op[1], op[3]], 14: [op[1], op[2], op[4]] })[op[0]] ?? [];
  const ids = new Set([
    ...echoAttrs,
    ...Object.values(ui.totems).flatMap((t) => t.attrs.map(([a]) => a)),
    ...Array.from({ length: 10 }, (_, i) => 301 + i),
    ...Array.from({ length: 10 }, (_, i) => 321 + i),
    ...Array.from({ length: 10 }, (_, i) => 401 + i),
    501, 503, 505,
    ...cardTierRows.flatMap((r) => asList(r._kBasicAttribute).map((p) => p[0])),
    ...rowsOf(load('CardUpgradeConfig')).flatMap((r) => asList(r._iAttr).map((p) => p[0])),
    ...effectRows.filter((r) => cardTierRows.some((t) => asList(t._kFlashAttribute).includes(r._iID))).flatMap((r) => asList(r._kSpecialEffect).map((o) => o[1])),
    ...Object.values(CARD_BUFFS).flat(),
    ...Object.values(ui.profs).flat().flatMap((p) => p.prio.flat()),
    ...gearEquip.flatMap((e) => [...asList(e._kBasicAttribute), ...asList(e._kFixedEntries)].map((p) => p[0])),
    ...Object.values(gearTables.EquipAttriGroupConfig).map((r) => r._iAttriID),
    ...[...Object.values(gearTables.StrengthenTable), ...Object.values(gearTables.RefiningTable)].flatMap((r) => r._kAttr.map((p) => p[0])),
    ...stuntRows.flatMap((r) => asList(r._kSpecialEffect).flatMap(opAttrs)),
    ...Object.values(TalentDigest.groups).flatMap((g) => g.per.map((p) => p[0])),
    ...Object.values(TalentDigest.jobs).flat().flatMap((r) => [...r.a.map((p) => p[0]), ...r.c.map((p) => p[2])]),
  ]);
  ui.attrNames = Object.fromEntries([...ids].map((id) => [id, loc(asList(attrRows.get(id)?._iName)[0] ?? attrRows.get(id)?._iName)?.replace(/\s*%$/, '')]).filter(([, n]) => n).sort((a, b) => a[0] - b[0]));
}

// ---------------------------------------------------------------- engine bundle
const engineSrc = fs.readFileSync(enginePath, 'utf8');
const marker = engineSrc.indexOf('// 7. Self-Test');
assert.ok(marker > 0, 'Anchor "// 7. Self-Test" not found in ro3-damage-optimizer.mjs');
const engine = engineSrc
  .slice(0, engineSrc.lastIndexOf('// ====', marker))
  .replace(/^#!.*\r?\n/, '')
  .replace(/^import .*;\r?\n/gm, '')
  .replace(/^export const DEFAULT_CONFIG_DIR = .*;$/m, "export const DEFAULT_CONFIG_DIR = '';")
  .replace(/^export const DEFAULT_TIMING_FILE = .*;$/m, "export const DEFAULT_TIMING_FILE = '';");
assert.ok(!/\bprocess\.|import\.meta|\brequire\(/.test(engine), 'Browser bundle still references Node-only globals');

// ---------------------------------------------------------------- fidelity: bundle + compact data == Node engine + raw config
{
  const api = vm.runInNewContext(
    `${engine.replace(/^export /gm, '')}\n;({ Ro3MemoryDataStore, simulateRotation, simulateDistribution, evaluateSkillDamage, solveAttributeBonus, buildCharacterStats, petStats, cardEffects, cardParts, gearParts, gearEffects, talentWalk, talentEffects, talentOptions, talentPick, talentMax })`,
    { structuredClone },
  );
  const rawData = new Ro3DataStore(configDir);
  const memData = new api.Ro3MemoryDataStore(JSON.parse(JSON.stringify(tables)));
  const defender = { level: 50, maxHp: 1e6, def: 900, mdef: 900, flee: 60, hit: 50, resCri: 0, element: 3 };
  const maxRow = new Map();
  for (const s of skills) if (!maxRow.has(s._iSkillID) || s._iLevel > maxRow.get(s._iSkillID)._iLevel) maxRow.set(s._iSkillID, s);
  const isDamage = (r) => r._iBasicType === 1 && r._kDamageParam1?.length > 0;
  let rowsChecked = 0;
  let simsChecked = 0;

  for (const job of ui.jobs) {
    const build = { career: job.id, level: 60, stats: [30, 30, 30, 30, 30, 30], equipmentAttrs: [[103, 500], [104, 500]] };
    const owned = [...maxRow.values()].filter((r) => r._iJob === job.id);
    build.passiveSkills = owned.filter((r) => r._iBasicType === 0 && r._kAttri?.length).map((r) => r._iID);
    for (const r of skills.filter((s) => s._iJob === job.id && isDamage(s))) {
      const a = evaluateSkillDamage(build, defender, rawData.row('SkillConfig', r._iID), {}, rawData);
      const b = api.evaluateSkillDamage(build, defender, memData.row('SkillConfig', r._iID), {}, memData);
      for (const k of ['expectedPerAttempt', 'normalHitMin', 'normalHitMax', 'critHitMax', 'hitRate', 'critRate']) assert.equal(b[k], a[k], `${r.name} (${r._iID}) ${k}`);
      assert.equal(JSON.stringify(b.timing), JSON.stringify(a.timing), `${r.name} (${r._iID}) timing`);
      rowsChecked++;
    }
    const rotation = owned.filter((r) => r._iBasicType === 1 && (isDamage(r) || r._kBuff1?.length)).map((r) => r._iID).slice(0, 12);
    const a = simulateRotation(build, defender, rotation, 20000, rawData);
    const b = api.simulateRotation(build, defender, rotation, 20000, memData);
    assert.equal(b.totalExpectedDamage, a.totalExpectedDamage, `${job.name} full-tree rotation`);
    simsChecked++;
  }
  for (const [key, profile] of Object.entries(CLASS_PROFILES)) {
    for (const rot of profile.candidateRotations) {
      const build = { ...profile, level: 60, stats: [20, 20, 20, 20, 20, 20] };
      const a = simulateRotation(build, defender, rot.skills, 20000, rawData).totalExpectedDamage;
      assert.equal(api.simulateRotation(build, defender, rot.skills, 20000, memData).totalExpectedDamage, a, `${key}: ${rot.name}`);
      simsChecked++;
    }
  }
  console.log(`fidelity OK: ${rowsChecked} damaging skill rows and ${simsChecked} rotations identical on compact data`);
  // Typed final values must land exactly in the browser bundle too (compact data, no Node globals).
  for (const job of ui.jobs.filter((j) => [1200, 2200, 3400, 5400, 6400].includes(j.id))) {
    const build = { career: job.id, level: 72, stats: [20, 20, 20, 20, 20, 20] };
    for (const [attr, target] of [[1, 99], [103, 4671], [104, 3617], [109, 307], [110, 129], [111, 1640], [115, 314], [101, 176086], [105, 1340], [107, 797]]) {
      const bonus = api.solveAttributeBonus(build, attr, target, memData);
      assert.equal(api.buildCharacterStats({ ...build, equipmentAttrs: [[attr, bonus]] }, memData)[attr], target, `${job.name}: attribute ${attr} reaches ${target}`);
    }
  }
  console.log('typed final values exact in the browser bundle');
  // Unlimited Shooting's +50% targets a skill category (`_kSkillCategory`), so the compact data must carry it for the bundle to apply it.
  const usBuild = { career: 3400, level: 60, stats: [20, 20, 20, 20, 20, 20], activeBuffs: [{ id: 1330205 }] };
  assert.equal(api.evaluateSkillDamage(usBuild, defender, memData.row('SkillConfig', 1330505), {}, memData).p1, 9000, 'Unlimited Shooting boosts Focused Arrow Strike in the browser bundle');
  // Fear Breeze's triggered hits need the skill tags and buff data in the compact snapshot as well (and must actually add damage).
  const breeze = { career: 3400, level: 60, stats: [20, 20, 20, 20, 20, 20], activeBuffs: [{ id: 1330105 }] };
  const breezeRaw = simulateRotation(breeze, defender, [1330505], 10000, rawData).totalExpectedDamage;
  assert.equal(api.simulateRotation(breeze, defender, [1330505], 10000, memData).totalExpectedDamage, breezeRaw, 'Fear Breeze procs are identical in the browser bundle');
  assert.ok(breezeRaw > simulateRotation({ ...breeze, activeBuffs: [] }, defender, [1330505], 10000, rawData).totalExpectedDamage * 1.1, 'Fear Breeze adds damage');
  // Template timing and follow-ups need the compact data too: Warg Strike (mode 0 row) follows Focused Arrow Strike once per 2.5 s,
  // and the Wolf Taming howl (buff 1332501, in the compact buffs only because PERIODIC_BUFFS asks for it) lifts the hits it covers.
  const warg = { career: 3400, level: 60, stats: [20, 20, 20, 20, 20, 20], skillLevels: { 13312: 3, 13310: 1 } };
  for (const [cancelBackswing, periodicStartMs] of [[false, 0], [true, 10000]]) {
    const b = { ...warg, cancelBackswing, periodicStartMs };
    const a = simulateRotation(b, defender, [1332005, 1330505], 20000, rawData);
    const m = api.simulateRotation(b, defender, [1332005, 1330505], 20000, memData);
    assert.equal(m.totalExpectedDamage, a.totalExpectedDamage, `timing, follow-ups and periodic buffs are identical in the browser bundle (cancel ${cancelBackswing}, howl at ${periodicStartMs} ms)`);
    // Raw config rows have no localized name; everything else of the cast log must match.
    const unnamed = (log) => JSON.stringify(log.map(({ name, ...c }) => c));
    assert.ok(unnamed(m.castLog) === unnamed(a.castLog), `cast log is identical in the browser bundle (cancel ${cancelBackswing}, howl at ${periodicStartMs} ms)`);
  }
  const howlOn = api.simulateRotation(warg, defender, [1332005, 1330505], 20000, memData).totalExpectedDamage;
  assert.ok(howlOn > api.simulateRotation({ ...warg, periodicOff: true }, defender, [1332005, 1330505], 20000, memData).totalExpectedDamage * 1.01, 'the Warg Howl adds damage in the browser bundle');
  const follows = simulateRotation(warg, defender, [1330505], 20000, rawData).castLog.filter((c) => c.kind === 'follow').map((c) => c.t);
  assert.ok(follows.length >= 7 && follows.every((t, i) => !i || t - follows[i - 1] >= 2500), 'Warg Strike follows Focused Arrow Strike at most once per 2.5 s');
  // Pets, Equipment Resonance and the Warg Hunter kit (King of the Wargs, riding, Wolf's Fang) need their tables in the compact data too.
  // The raw config has no pet digests, so the raw engine gets the same ones.
  const petTables = { PetDigest: tables.PetDigest, PetGrowth: tables.PetGrowth, PetRules: tables.PetRules };
  const rawPets = Object.assign(Object.create(rawData), { table: (n) => petTables[n] ?? rawData.table(n) });
  const kit = { career: 3400, level: 60, stats: [20, 20, 20, 20, 20, 20], skillLevels: { 13312: 3, 13310: 1, 13311: 10, 13322: 5, 13323: 5, 13325: 5 }, ridden: true, periodicOff: true,
    activeBuffs: [{ id: 1331210 }], resonance: { refine: 18, enhance: 100 }, pets: [{ id: 30001, star: 3 }, { id: 30401, star: 3 }, { id: 30005, star: 3 }, { id: 32401, star: 3 }] };
  const kitRot = [1332205, 1331213, 1332505, 1332305, 1330505];
  const kitRaw = simulateRotation(kit, defender, kitRot, 30000, rawPets);
  const kitMem = api.simulateRotation(kit, defender, kitRot, 30000, memData);
  assert.equal(kitMem.totalExpectedDamage, kitRaw.totalExpectedDamage, 'pets, resonance and the Warg Hunter kit are identical in the browser bundle');
  const unnamed = (log) => JSON.stringify(log.map(({ name, ...c }) => c));
  assert.ok(unnamed(kitMem.castLog) === unnamed(kitRaw.castLog), 'the kit cast log is identical in the browser bundle');
  const bare = { ...kit, pets: [], resonance: undefined };
  assert.ok(kitRaw.totalExpectedDamage > simulateRotation(bare, defender, kitRot, 30000, rawPets).totalExpectedDamage * 1.1, 'pets and resonance add damage');
  assert.ok(kitMem.castLog.some((c) => c.kind === 'follow' && c.hits.length === 4) && kitMem.castLog.some((c) => c.kind === 'pet' && c.name.includes(PetDigest[30001].main.name)), 'King of the Wargs followers and the Primary pet casts are in the bundle');
  // Pet stats read the growth tables of the compact data: the same stats, sheet and damage as the Node engine on the raw config.
  const petBuild = { ...kit, level: 72, pets: [{ id: 30001, star: 3, stage: 2, lv: 60 }, { id: 30401, star: 6, lv: 99 }, { id: 32401, star: 1, lv: 20 }, { id: 31003, star: 5, stage: 3, lv: 72 }],
    assistPets: [{ g: 51, star: 2, stage: 1, lv: 50 }, { g: 54, star: 1, lv: 72 }, null, { g: 31, star: 4, stage: 2, lv: 33 }, { g: 42, star: 6, lv: 99 }] };
  assert.equal(JSON.stringify(api.petStats(petBuild.pets, petBuild.assistPets, 72, memData)), JSON.stringify(petStats(petBuild.pets, petBuild.assistPets, 72, rawPets)), 'pet stats are identical in the browser bundle');
  const petSheetRaw = buildCharacterStats(petBuild, rawPets);
  const petSheetMem = api.buildCharacterStats(petBuild, memData);
  for (const id of [101, 102, 103, 104, 105, 106, 109, 110, 111, 115, 1031]) assert.equal(petSheetMem[id], petSheetRaw[id], `attribute ${id} with pets is identical in the browser bundle`);
  assert.ok(petSheetRaw[103] > buildCharacterStats({ ...petBuild, pets: [], assistPets: [] }, rawPets)[103] + 300, 'pets add attack');
  assert.equal(api.simulateRotation(petBuild, defender, kitRot, 30000, memData).totalExpectedDamage, simulateRotation(petBuild, defender, kitRot, 30000, rawPets).totalExpectedDamage, 'damage with pet stats is identical in the browser bundle');
  // Cards need their tables in the compact data too: the stars and levels, Phreeoni's HIT conversion, Drake's buff value, the Collection
  // attributes and the bonuses against the target's element, race and size.
  const cardBuild = { career: 3400, level: 72, stats: [20, 20, 20, 20, 89, 53], equipmentAttrs: [[103, 3023], [109, 84]],
    cards: [1460100, 1450100, 1460101, 1460300, 1440603, 1440702, 1440804, 1440902, 1430612].map((id, i) => ({ id, star: 3, level: 15, flash: i % 2 === 0 })) };
  const cardTarget = { ...defender, race: 3, size: 3, element: 1 };
  const cardsRaw = simulateRotation(cardBuild, cardTarget, [1330505], 20000, rawData);
  assert.equal(api.simulateRotation(cardBuild, cardTarget, [1330505], 20000, memData).totalExpectedDamage, cardsRaw.totalExpectedDamage, 'cards are identical in the browser bundle');
  assert.equal(JSON.stringify(api.cardEffects(cardBuild.cards, memData)), JSON.stringify(cardEffects(cardBuild.cards, rawData)), 'the card attributes and conversions are identical in the browser bundle');
  const cardRolls = { runs: 64, seed: 9137, captureRun: true };
  const rawRolls = simulateDistribution(cardBuild, cardTarget, [1330505], 10000, cardRolls, rawData);
  const memRolls = api.simulateDistribution(cardBuild, cardTarget, [1330505], 10000, cardRolls, memData);
  assert.deepEqual([...memRolls.totals], [...rawRolls.totals], 'Shadow Drake rolls are identical in the browser bundle');
  assert.ok(memRolls.sampleRun.some((e) => e.sizeProc), 'Shadow Drake produces actual boosted hits, not only an average panel bonus');
  for (const c of cardBuild.cards) assert.equal(JSON.stringify(api.cardParts(c, memData), (k, v) => (k === 'item' ? v?._iID : v)), JSON.stringify(cardParts(c, rawData), (k, v) => (k === 'item' ? v?._iID : v)), `card ${c.id} parts are identical in the browser bundle`);
  assert.ok(cardsRaw.totalExpectedDamage > simulateRotation({ ...cardBuild, cards: [] }, cardTarget, [1330505], 20000, rawData).totalExpectedDamage * 1.05, 'cards add damage');
  assert.ok(cardsRaw.totalExpectedDamage > simulateRotation({ ...cardBuild, cards: cardBuild.cards.map((c) => ({ ...c, flash: false })) }, cardTarget, [1330505], 20000, rawData).totalExpectedDamage, 'Collection cards add damage');
  for (const drake of [1460100, 1450100]) {
    const universalSizeBuild = { ...cardBuild, cards: [drake, 1440113, 1440113, 1440113].map(id => ({ id, star: 1, level: 0, flash: false })) };
    const sizeTotals = [1, 2, 3].map(size => {
      const target = { ...cardTarget, size };
      const raw = simulateRotation(universalSizeBuild, target, [1330505], 20000, rawData).totalExpectedDamage;
      assert.equal(api.simulateRotation(universalSizeBuild, target, [1330505], 20000, memData).totalExpectedDamage, raw, 'Drake size-ignore is identical in the browser bundle');
      return raw;
    });
    assert.equal(new Set(sizeTotals).size, 1, 'either Drake enables the Wolf bonuses against all three sizes');
  }
  // Gear needs the equipment tables in the compact data too: every tier 5-7 item at three rolls (base ranges, affix pool, stunt pools,
  // grid tables), and a full set through the sheet and the damage.
  const gearJson = (v) => JSON.stringify(v, (k, x) => (k === 'item' || k === 'eq' ? x?._iID : k === 'pool' ? x.map((r) => [r._iAttriID, r._iMin, r._iMax]) : Object.prototype.toString.call(x) === '[object Set]' ? [...x] : x));
  const firstStunt = (group) => stuntPoolRows.find((r) => r._iGroup === group)?._iSpecialID ?? 0;
  gearItems.forEach((it, n) => {
    const stunts = asList(gearEquip[n]._kSpecial).map((d) => firstStunt(d[0]));
    for (const roll of [0, 5050, 10000]) {
      const g = { grid: GEAR_GRID[it._iEquipPart], id: it._iID, roll, affixes: [5, 2], stunts, refine: 15, enhance: 70 };
      assert.equal(gearJson(api.gearParts(g, memData)), gearJson(gearParts(g, rawData)), `gear ${it._iID} (${loc(it._iName?.[0])}) at roll ${roll} is identical in the browser bundle`);
    }
  });
  const gearBuild = { career: 3400, level: 72, stats: [20, 20, 20, 20, 89, 53], equipmentAttrs: [[109, 84]],
    gear: [[1, 2110660, [10010601, 10020607]], [3, 2550660, [10010603, 10020605]], [4, 2600660, [10010606, 10020601]], [5, 2650660, [10010601, 0]], [6, 2700660, [10010606, 10020603]], [7, 2700660, [10010601, 10020607]]]
      .map(([grid, id, stunts], i) => ({ grid, id, roll: 3000 + 1000 * i, affixes: [5, 2], stunts, refine: 12 + (i % 4), enhance: 60 + i })) };
  assert.equal(gearJson(api.gearEffects(gearBuild.gear, memData)), gearJson(gearEffects(gearBuild.gear, rawData)), 'the gear attributes and stunts are identical in the browser bundle');
  for (const id of [1, 2, 5, 101, 103, 104, 105, 106, 109, 111, 209, 218, 1033]) assert.equal(api.buildCharacterStats(gearBuild, memData)[id], buildCharacterStats(gearBuild, rawData)[id], `gear sheet attribute ${id} is identical in the browser bundle`);
  const gearRaw = simulateRotation(gearBuild, cardTarget, [1330505], 20000, rawData);
  assert.equal(api.simulateRotation(gearBuild, cardTarget, [1330505], 20000, memData).totalExpectedDamage, gearRaw.totalExpectedDamage, 'gear is identical in the browser bundle');
  assert.ok(gearRaw.totalExpectedDamage > simulateRotation({ ...gearBuild, gear: [] }, cardTarget, [1330505], 20000, rawData).totalExpectedDamage * 1.2, 'gear adds damage');
  // Season Talents need their digest, the job ranks and the talent buffs in the compact data too: the same walk, options, attributes, buffs, sheet and damage as
  // the Node engine on the raw config (which has no digest; it gets the same one) for every Ranger profession at several Talent Lv.
  const talentTables = { TalentDigest: tables.TalentDigest };
  const rawTalents = Object.assign(Object.create(rawData), { table: (n) => talentTables[n] ?? rawData.table(n) });
  const talentRotation = [1320410, 1330505]; // the first skill without a cooldown is the one cast: Sharp Shooting (13204), the one the talents change
  let talentChecks = 0;
  for (const prof of [302, 304, 305, 306]) {
    for (const lv of [0, 1, 39, 40, 125, 126, 330, 500, 865, 99999]) {
      const picks = { 10102003: [10102105, 10102107], 10103005: [10103101, 10103103] };
      const tb = { career: 3400, level: 72, stats: [20, 20, 20, 20, 89, 53], equipmentAttrs: [[103, 3023], [109, 84]], talents: { lv, prof, picks, skills: { 13102: 5 } } };
      const a = talentEffects(tb, rawTalents);
      const b = api.talentEffects(tb, memData);
      assert.equal(JSON.stringify(b), JSON.stringify(a), `talents at Lv ${lv}, profession ${prof}: the same walk, attributes and buffs in the browser bundle`);
      assert.equal(api.talentMax(tb, memData), talentMax(tb, rawTalents), 'the same most Talent Lv in the browser bundle');
      for (const id of [1, 5, 6, 101, 103, 104, 105, 106, 109, 111, 112, 115, 116]) assert.equal(api.buildCharacterStats(tb, memData)[id], buildCharacterStats(tb, rawTalents)[id], `talent sheet attribute ${id} at Lv ${lv} is identical in the browser bundle`);
      const sim = { ...tb, activeBuffs: a.buffs.map((id) => ({ id })) };
      assert.equal(api.simulateRotation(sim, defender, talentRotation, 20000, memData).totalExpectedDamage, simulateRotation(sim, defender, talentRotation, 20000, rawTalents).totalExpectedDamage, `damage with the talents of Lv ${lv}, profession ${prof} is identical in the browser bundle`);
      talentChecks++;
    }
    for (const branch of Object.keys(TalentDigest.branches)) assert.equal(JSON.stringify(api.talentOptions(Number(branch), 3400, prof, memData)), JSON.stringify(talentOptions(Number(branch), 3400, prof, rawTalents)), `the job talents of branch point ${branch}, profession ${prof}`);
  }
  const talentStrike = { career: 3400, level: 72, stats: [20, 20, 20, 20, 89, 53], equipmentAttrs: [[103, 3023], [109, 84]], talents: { lv: 500, prof: 304 } };
  const talentOn = talentEffects(talentStrike, rawTalents);
  assert.ok(talentOn.buffs.includes(1323101) && talentOn.attrs.some(([a]) => a === 101), 'Lv 500 Sharpshooting reaches Enhanced Sharp Shooting (II+1) and its stat nodes');
  const strikeBase = simulateRotation(talentStrike, defender, talentRotation, 20000, rawTalents).totalExpectedDamage;
  const strikeWith = simulateRotation({ ...talentStrike, activeBuffs: talentOn.buffs.map((id) => ({ id })) }, defender, talentRotation, 20000, rawTalents).totalExpectedDamage;
  assert.ok(strikeBase > simulateRotation({ ...talentStrike, talents: undefined }, defender, talentRotation, 20000, rawTalents).totalExpectedDamage, 'the talents\' stats add damage');
  assert.ok(strikeWith > strikeBase, 'the job talents that change skills add damage');
  // Perfect Shot (SkillCriticalProb) raises the crit chance of its skill in the bundle, and only of that skill.
  const perfect = { ...talentStrike, activeBuffs: [{ id: 1323201 }] };
  const crit = (b, id) => api.evaluateSkillDamage(b, defender, memData.row('SkillConfig', id), {}, memData).critRate;
  assert.ok(crit(perfect, 1320410) > crit(talentStrike, 1320410) + 0.3 && crit(perfect, 1330505) === crit(talentStrike, 1330505), 'Perfect Shot adds crit chance to Sharp Shooting only');
  console.log(`talents identical in the browser bundle: ${talentChecks} levels x professions (walk, attributes, buffs, sheet, damage) and the job talent options of every branch point`);
  // An ASPD past the cap (the talents' +150 gets there) converts into P.ATK % in the bundle too, and slows nothing down further.
  const fast = { career: 3400, level: 72, stats: [20, 20, 20, 20, 89, 53], equipmentAttrs: [[103, 3023], [114, 450]] };
  const fastSheet = api.buildCharacterStats(fast, memData);
  const slowSheet = api.buildCharacterStats({ ...fast, equipmentAttrs: [[103, 3023]] }, memData);
  assert.ok(fastSheet[115] > ASPD_EXCESS.cap && slowSheet[115] <= ASPD_EXCESS.cap && fastSheet[1031] - slowSheet[1031] === Math.min((fastSheet[115] - ASPD_EXCESS.cap) * ASPD_EXCESS.bpPerPoint, ASPD_EXCESS.maxBp), 'ASPD over 500% turns into P.ATK % in the browser bundle');
  for (const id of [103, 115, 1031]) assert.equal(fastSheet[id], buildCharacterStats(fast, rawData)[id], `attribute ${id} past the ASPD cap is identical in the browser bundle`);
  assert.equal(api.simulateRotation(fast, defender, talentRotation, 20000, memData).totalExpectedDamage, simulateRotation(fast, defender, talentRotation, 20000, rawData).totalExpectedDamage, 'damage past the ASPD cap is identical in the browser bundle');
  const missing = Object.entries(CLASS_PROFILES).flatMap(([key, p]) => [...p.candidateRotations.flatMap((r) => r.skills), ...(p.passiveSkills ?? [])].filter((id) => !tables.SkillConfig[id]).map((id) => `${key}:${id}`));
  if (missing.length) console.warn(`warning: class-profile skill ids missing from the embedded data (the UI cannot load them): ${missing.join(', ')}`);
}

// ---------------------------------------------------------------- audit: engine damage per cast vs the in-game skill text
{
  const fill = (tpl, d) => String(tpl ?? '').replace(/\$\{(\d+)\}/g, (_, i) => d?.[i - 1] ?? '?').replace(/@\{\d+\}/g, '@').replace(/\^\{\d+\}/g, '').replace(/<[^>]+>/g, '');
  const rowsByGroup = new Map();
  for (const r of baseRows.values()) {
    if (r._iBasicType !== 1 || !asList(r._kDamageParam1).length) continue;
    if (!rowsByGroup.has(r._iSkillID)) rowsByGroup.set(r._iSkillID, []);
    rowsByGroup.get(r._iSkillID).push(r);
  }
  let verified = 0;
  const open = [];
  for (const [group, rows] of rowsByGroup) {
    const model = SKILL_MODEL[group];
    const hits = model?.hits ?? [0];
    let reason = '';
    for (const r of rows) {
      const text = fill(loc(r._iDescription?.[0]), r._kDescData);
      const pct = /ATK\s*\*?\s*(\d+(?:\.\d+)?)%/i.exec(text);
      if (!pct) { reason = 'the text gives no ATK multiplier'; break; }
      const flat = /%\s*\+\s*\*?(\d+)(?![\d%])/.exec(text);
      const asTotal = /total|continuous/i.test(text);
      const instances = asTotal ? 1 : Number(/(\d+)\s+(?:hits?|instances)/i.exec(text)?.[1] ?? 1);
      const d1 = asList(r._kDamageParam1);
      const d2 = asList(r._kDamageParam2);
      const ratio = hits.reduce((s, b) => s + (d1[b] ?? 0) / 100, 0);
      const wantRatio = Number(pct[1]) * instances;
      const flatSum = hits.reduce((s, b) => s + (d2[b] ?? 0), 0);
      if (Math.abs(ratio - wantRatio) > Math.max(0.51, wantRatio * 0.004)) { reason = `Lv ${r._iLevel}: text ${+wantRatio.toFixed(1)}% vs engine ${+ratio.toFixed(1)}%`; break; }
      if (flat && flatSum !== Number(flat[1]) * instances) { reason = `Lv ${r._iLevel}: text +${flat[1] * instances} vs engine +${flatSum}`; break; }
      if (model?.both && !/Magic ATK/i.test(text)) { reason = 'SKILL_MODEL.both but the text has no Magic ATK'; break; }
      if (model?.vsMonster !== undefined && (!/Monster/i.test(text) || !(d1[model.vsMonster] > d1[0]))) { reason = 'SKILL_MODEL.vsMonster is not backed by the text or data'; break; }
    }
    const name = loc(rows[0]._iName?.[0]) ?? String(group);
    if (!reason) verified++;
    else open.push(`${name} (${group}): ${reason}`);
    if (model) assert.ok(!reason, `SKILL_MODEL ${group} ${name} disagrees with the in-game text: ${reason}`);
  }
  console.log(`skill text audit: ${verified}/${rowsByGroup.size} damage skills reproduce their in-game text at every level (${Object.keys(SKILL_MODEL).length} through SKILL_MODEL)`);
  if (open.length) console.log(`  not reproduced (text unclear, multi-stage or not modeled): ${open.join(' | ')}`);
  // FOLLOW_UPS must say what the text says: "every 2.5 seconds, using Focused Arrow Strike casts this skill ... dealing PATK * 30%".
  for (const [trigger, f] of Object.entries(FOLLOW_UPS)) {
    const triggerName = loc(allSkillRows.find((r) => r._iSkillID === Number(trigger))?._iName?.[0]);
    for (const r of allSkillRows.filter((x) => x._iSkillID === f.group && (x._iMode | 0) === f.mode && x._iLevel > 0)) {
      const m = /every (\d+(?:\.\d+)?) seconds?, using ([^,]+?) casts this skill[^%]*?ATK\s*\*\s*(\d+(?:\.\d+)?)%/i.exec(fill(loc(r._iDescription?.[0]), r._kDescData));
      assert.ok(m, `FOLLOW_UPS ${f.group} Lv ${r._iLevel}: the text no longer describes a follow-up`);
      assert.deepEqual([Number(m[1]) * 1000, m[2], Number(m[3])], [f.icdMs, triggerName, asList(r._kDamageParam1)[0] / 100], `FOLLOW_UPS ${f.group} Lv ${r._iLevel} disagrees with the in-game text`);
    }
  }
  console.log(`follow-ups match their in-game text: ${Object.values(FOLLOW_UPS).map((f) => loc(allSkillRows.find((r) => r._iSkillID === f.group)._iName[0])).join(', ')}`);
  // PERIODIC_BUFFS must say what the text says ("it howls every 30 sec, increasing the Ranger's Physical ATK by 5% for 10 sec")
  // and what the rows say: the buff changes P.ATK by that percent and the skill that applies it lasts that long.
  for (const [group, p] of Object.entries(PERIODIC_BUFFS)) {
    const buff = rowsOf(load('BuffConfig')).find((b) => b._iID === p.buff);
    const caster = allSkillRows.find((r) => asList(r._kBuff1).some((t) => t[0] === p.buff));
    assert.ok(buff && caster, `PERIODIC_BUFFS ${group}: buff ${p.buff} or the skill applying it is missing from the config`);
    for (const r of allSkillRows.filter((x) => x._iSkillID === Number(group) && x._iLevel > 0)) {
      const m = /it howls every (\d+(?:\.\d+)?) sec[^,]*, increasing the Ranger's Physical ATK by (\d+(?:\.\d+)?)% for (\d+(?:\.\d+)?) sec/i.exec(fill(loc(r._iDescription?.[0]), r._kDescData));
      assert.ok(m, `PERIODIC_BUFFS ${group} Lv ${r._iLevel}: the text no longer describes a periodic buff`);
      assert.deepEqual([Number(m[1]) * 1000, Number(m[3]) * 1000, Number(m[2]) * 100], [p.periodMs, p.durMs, asList(buff._kChangeAttri)[0]?.[1]], `PERIODIC_BUFFS ${group} Lv ${r._iLevel} disagrees with the in-game text and buff row`);
    }
    assert.equal(asList(caster._kBuff1).find((t) => t[0] === p.buff)[2], p.durMs, `PERIODIC_BUFFS ${group}: the skill applies the buff for another duration`);
    console.log(`periodic buffs match their in-game text: ${p.name} (${caster._kScriptLogic}, skill cooldown ${caster._iCD / 1000} s; the text's ${p.periodMs / 1000} s is the cadence used)`);
  }

  // The Warg Hunter kit says what the texts say: King of the Wargs (6 s, Warg Hunt becomes Enhanced, followers on Charge and Bite),
  // the cooldown reset, the mounted-only skills, Warg Charge's ride-only 10% Physical DMG and Wolf's Fang.
  {
    const textOf = (r) => fill(loc(r._iDescription?.[0]), r._kDescData);
    const rowsOfGroup = (g, mode = 0) => allSkillRows.filter((x) => x._iSkillID === g && (x._iMode | 0) === mode && x._iLevel > 0);
    const total = (r) => asList(r._kDamageParam1).reduce((s, v) => s + v / 100, 0);
    for (const r of rowsOfGroup(KING_OF_THE_PACK.group)) {
      const m = /state for (\d+) sec.*?(\d+) Extra hits.*?ATK\*(\d+(?:\.\d+)?)%.*?(\d+) hits of .*?ATK\*(\d+(?:\.\d+)?)%.*?becomes 【Enhanced Warg Hunt】/s.exec(textOf(r));
      assert.ok(m, `King of the Wargs Lv ${r._iLevel}: the text no longer describes the kit`);
      const buff = allBuffs.get(asList(r._kBuff1)[0][0]);
      const [charge, bite] = [KING_OF_THE_PACK.extras[13312], KING_OF_THE_PACK.extras[13325]].map((g) => allSkillRows.find((x) => x._iID === g * 100 + r._iLevel));
      assert.deepEqual([Number(m[1]) * 1000, Number(m[2]), Number(m[3]), Number(m[5])],
        [asList(r._kBuff1)[0][2], SKILL_MODEL[13327].hits.length, total(charge) * SKILL_MODEL[13327].hits.length, total(bite)], `King of the Wargs Lv ${r._iLevel} disagrees with its text`);
      assert.equal(Math.floor(buff._iID / 100), KING_OF_THE_PACK.family, 'the King of the Wargs buff family');
      assert.ok(asList(buff._kSkillAttributeList).some((t) => Number(t[1]) === 13323 && Number(t[2]) === 15 && Number(t[4]) === KING_OF_THE_PACK.enhance[13323]), 'the buff switches Warg Hunt to skill mode 1');
    }
    for (const [mode, hits, top] of [[0, 3, 150], [1, 5, 310]]) {
      for (const r of rowsOfGroup(13323, mode)) {
        const m = /(\d+) hits of .*?ATK\*(\d+)%/.exec(textOf(r));
        assert.deepEqual([Number(m?.[1]), Number(m?.[2])], [hits, total(r)], `Warg Hunt mode ${mode} Lv ${r._iLevel}: ${hits} hits totaling what the row holds`);
        if (r._iLevel === 5) assert.equal(total(r), top, `Warg Hunt mode ${mode} Lv 5 is ${top}%`);
      }
    }
    for (const r of rowsOfGroup(13325)) {
      assert.deepEqual([/resetting the Cooldown of 【Warg Hunt】/.test(textOf(r)), COOLDOWN_RESETS[13325]], [true, [13323]], 'Warg Bite resets Warg Hunt');
      assert.equal(total(r), Number(/ATK\*(\d+)%/.exec(textOf(r))[1]), 'Warg Bite damage');
    }
    for (const g of MOUNTED_ONLY) assert.ok(rowsOfGroup(g).every((r) => /Can only be used .*?while mounted on the Demonic Wolf/.test(textOf(r))), `skill ${g} is mounted-only`);
    for (const r of allSkillRows.filter((x) => RIDING_BUFF_ONLY.has(x._iSkillID) && x._iLevel > 0 && x._iMode === 1)) {
      const m = /If you are riding the Demonic Wolf, inflicts .*?grants you a (\d+)% Physical DMG Bonus/.exec(textOf(r));
      assert.ok(m, `Warg Charge Lv ${r._iLevel}: the ride-only bonus is in the text`);
      assert.equal(asList(allBuffs.get(asList(r._kBuff1)[0][0])._kChangeAttri)[0][1], Number(m[1]) * 100, `Warg Charge Lv ${r._iLevel}: the buff is the text's Physical DMG (1211)`);
    }
    for (const [group, family] of Object.entries(RIDING_PASSIVES)) {
      for (const r of rowsOfGroup(Number(group))) {
        const buff = allBuffs.get(family * 100 + r._iLevel);
        const m = /While mounted on the Demonic Wolf, Physical ATK increases by (\d+)%.*?increase by (\d+)%/.exec(textOf(r));
        assert.deepEqual([Number(m?.[1]), Number(m?.[2])], [r._iLevel, r._iLevel], `Wolf's Fang Lv ${r._iLevel}: ${r._iLevel}% in the text`);
        assert.deepEqual([asList(buff?._kChangeAttri)[0], asList(buff?._kSkillAttributeList)[0]?.map(Number)], [[1032, r._iLevel * 100], [1, 3103, 29, 5, r._iLevel * 100]], `Wolf's Fang Lv ${r._iLevel}: P.ATK and the skill damage`);
      }
    }
    console.log('Warg Hunter kit matches its in-game text: King of the Wargs, Enhanced Warg Hunt, Warg Bite reset, mounted-only skills, Warg Charge ride buff, Wolf\'s Fang');
  }

  // The Season Ranger skills say what the texts say, and the rows behind them are the ones the engine reads: each text number is a number of a row.
  {
    const textOf = (r) => fill(loc(r._iDescription?.[0]), r._kDescData);
    const row = (g, mode = 0, lv = 1) => allSkillRows.find((x) => x._iSkillID === g && (x._iMode | 0) === mode && x._iLevel === lv);
    const buffOf = (id) => ({ id, _kSkillAttributeList: allBuffs.get(id)._kSkillAttributeList });
    const p1 = (r) => asList(r._kDamageParam1);
    const [rhythm, rhapsody, gale, celestial] = [113360, 113361, 113362, 113363].map((g) => textOf(row(g)));
    const bd = (g) => allBuffs.get(SEASON_BUFFS[g]);
    const buffTuples = (id) => asList(allBuffs.get(id)._kSkillAttributeList).filter((t) => Array.isArray(t) && t.length >= 5).map((t) => t.map(Number));
    const m = {
      rhythm: /damage multiplier increases by (\d+)%/.exec(rhythm), rhapsody: /deals (\d+) hits? of (\d+)% Neutral Physical/.exec(rhapsody),
      gale: /Casting .*? (\d+) times will Enhance .*?deal (\d+)% Neutral Physical/.exec(gale), celestial: /duration increases by (\d+) seconds?.*?(\d+)% Neutral Physical/.exec(celestial),
    };
    assert.ok(Object.values(m).every(Boolean), 'the Season Ranger skill texts changed');
    // Rhythmic Arrow: +3% on the multiplier of Focused Arrow Strike's category, in mode 2 (and Unlimited Shooting in mode 1).
    assert.deepEqual(buffTuples(SEASON_BUFFS[113360]).find((t) => t[2] === 29)?.slice(1, 5), [3105, 29, 1, Number(m.rhythm[1]) * 100], 'Rhythmic Arrow: the buff adds the text\'s %');
    // Infinite Rhapsody: Unlimited Shooting's mode 1 + 1 = 2, whose buff puts Focused Arrow Strike in mode 4: a 60% hit and the text's 15% one.
    const ul2 = row(13307, 2, 5);
    assert.equal(skillMode(13307, [113360, 113361].map((g) => buffOf(SEASON_BUFFS[g])), null), 2, 'Rhythmic Arrow + Infinite Rhapsody put Unlimited Shooting in mode 2');
    assert.equal(skillMode(13305, asList(ul2._kBuff1).map((t) => buffOf(t[0])), null), 4, 'Unlimited Shooting mode 2 sets Focused Arrow Strike to mode 4');
    const fas4 = row(13305, 4, 5);
    assert.deepEqual([hitsOf(fas4).length - 1, p1(fas4)[1] / 100], [Number(m.rhapsody[1]), Number(m.rhapsody[2])], 'Infinite Rhapsody: the extra hit of Focused Arrow Strike mode 4');
    assert.equal(skillMode(13305, [buffOf(SEASON_BUFFS[113360])], null), 2, 'Rhythmic Arrow puts Focused Arrow Strike in mode 2');
    // Gale Beat: the 4th cast enhances the next (stack buff 11330401, max 4) into the enhanced skill with the text's %, and 113303 also has the 15% hit.
    assert.equal(allBuffs.get(11330401)._iMaxStack, GALE_BEAT.casts, 'Gale Beat: the stack buff counts the text\'s casts');
    assert.deepEqual([GALE_BEAT.casts, p1(row(GALE_BEAT.enhanced[0], 0, 5))[0] / 100, p1(row(GALE_BEAT.enhanced[1], 0, 5)).join()], [Number(m.gale[1]), Number(m.gale[2]), `${Number(m.gale[2]) * 100},${p1(fas4)[1]}`], 'Gale Beat: the enhanced skills');
    // Celestial Symphony: Myriad Stars in mode 1 has the text's 150% as its last instance after 10 of 200%, one per template point.
    const myriad1 = row(13320, 1, 5);
    const tpl = timingAll[myriad1._iScriptShow];
    const points = tpl[3].slice(tpl[3].findIndex((p) => p > 0.02));
    assert.equal(skillMode(13320, [buffOf(SEASON_BUFFS[113363])], null), 1, 'Celestial Symphony puts Myriad Stars in mode 1');
    assert.deepEqual([hitsOf(myriad1).length, points.length, p1(myriad1)[1] / 100, hitsOf(myriad1).at(-1)], [points.length, 11, Number(m.celestial[2]), 1], 'Celestial Symphony: 10 hits and the 150% one, one per template point');
    for (const id of [1330545, 1330525, 1330535, 1330715, 1330725, 1332015, 11330205, 11330305]) assert.ok(skills.some((s) => s._iID === id && s._bAlt), `Season row ${id} is embedded`);
    console.log('Season Ranger skills match their in-game text: Rhythmic Arrow, Infinite Rhapsody, Gale Beat, Celestial Symphony (modes, hits and templates)');
  }

  // Model the owner-scaled Primary family at every star, and audit each Utility rule against its actual trigger text.
  {
    const TYPE_WORD = { offense: 'Offensive-type', debuff: 'Debuff-type', buff: 'Buff-type', control: 'Control-type', recovery: 'Recovery-type' };
    const HIT_SAYS = {
      32401: ($) => [`Adaptive Attack*${$(3)}%`, 'melee'],
      30004: ($) => [`Adaptive Attack*${$(1)}%`, 'Fire Ranged'],
      30002: ($) => [`${$(4)} Lightning Strikes in total`, `Adaptive Attack*${$(5)}%`, 'Ranged'],
      20001: ($) => [`${$(1)} Extra hits of Fire melee`, `Adaptive Attack*${$(2)}%`],
      31003: ($) => [`for ${$(1)} sec`, `every ${$(3)} sec`, `Adaptive Attack${$(6)}%`, 'melee'],
      32002: ($) => [`Adaptive Attack*${$(2)}%`, `Cooldown: ${$(3)} sec`, 'Normal Attacks and skills'],
    };
    let checked = 0;
    for (const [id, fx] of Object.entries(PET_EFFECTS)) {
      const pet = PetDigest[id];
      assert.ok(pet, `PET_EFFECTS ${id}: no such pet`);
      pet.star.forEach((st, i) => {
        const where = `${pet.name} star ${i + 1}`;
        for (const [kind, key] of [['passive', 'p'], ['core', 'c']]) {
          const e = fx[kind];
          if (!e) continue;
          const text = fill(pet[kind === 'core' ? 'core' : 'pas'].tpl, st[key]);
          const $ = (n) => Number(st[key][n - 1]);
          if (e.on === 'any') assert.ok(/any type of Primary Battle Skill/.test(text), `${where} ${kind}: triggers on any type`);
          else for (const t of e.on) assert.ok(text.includes(TYPE_WORD[t]), `${where} ${kind}: triggers on ${TYPE_WORD[t]}`);
          if (e.attr) {
            assert.ok(text.includes(`${$(e.pct)}%`) && new RegExp(`${$(e.sec)} sec`).test(text), `${where} ${kind}: ${$(e.pct)}% for ${$(e.sec)} s in the text: ${text}`);
          } else if (e.extend) {
            assert.ok(text.includes(`duration of Buff-type Primary Battle Skills by ${$(e.extend)} sec`), `${where}: extends the real buff duration`);
          } else if (e.multiplier) {
            assert.ok(text.includes(`${$(e.multiplier)}%`) && /(?:damage|Damage|Multiplier)/.test(text), `${where}: the Primary damage multiplier is in its text`);
          } else if (e.hit) {
            for (const phrase of HIT_SAYS[id]($)) assert.ok(text.includes(phrase), `${where} ${kind}: "${phrase}" in the text: ${text}`);
            assert.ok(e.hit($, st.pa) > 0, `${where}: the individual hit is worth something`);
          }
          if (e.when === 'hit') assert.ok(/\b(?:hits|Deals DMG)\b/.test(text), `${where}: this passive waits for Primary damage`);
          if (e.share) assert.deepEqual(st.ca, [1, 40], `${where}: core adds 40% of actual Primary damage, without another attack/crit roll`);
        }
        checked++;
      });
    }
    for (const b of rowsOf(load('PetBaseConfig'))) for (let i = 0; i < 6; i++) {
      const star = petStarRows.find((r) => r._iPetID === b._iID && r._iStar === i + 1);
      const st = PetDigest[b._iID].star[i];
      assert.equal(st.primary.id, star._iProtectSkill, `${b._iID} star ${i + 1}: uses Protection, not the pet's AI attack`);
      assert.equal(st.primary.cd, skillById.get(star._iProtectSkill)._iCD, 'Primary cooldown comes from its own row');
    }
    assert.ok(['offense', 'buff'].every((t) => PetDigest[30001].types.includes(t)) && PetDigest[10001].types.join() === 'buff', 'pet skill types');
    assert.deepEqual(PetDigest[22002].types, ['control'], 'Garm deals damage but is NOT an Offensive-type Primary');
    assert.equal(PetDigest[22002].star[5].primary.cd, 30000);
    assert.deepEqual(PetDigest[22002].star[5].primary.hits, [417, 617, 817, 1017, 1217, 1417, 1617].map((at) => ({ at, ratio: 32000 })));
    assert.equal(PetDigest[22002].star[5].primary.row._iDistanceType, 1, 'owner Frost Breath is melee');
    assert.deepEqual(PetDigest[10001].star[5].primary.buffs[0].attrs, [[114, 20]], 'Choco grants ASPD, not the unrelated pet AI ATK buff');
    for (const id of [11001, 13001, 21001, 21002, 21003, 22004, 23001, 23002, 23003, 31201, 31301, 33003, 33005, 33101, 33102, 33401]) {
      assert.equal(PetDigest[id].star[5].primary.hits.length, 0, `${id}: healing/shield/control-only fields cannot create phantom damage`);
    }
    console.log(`pet effects match their in-game text: ${Object.keys(PET_EFFECTS).length} pets x 6 stars (${checked} checks), ${Object.keys(PetDigest).length} pets in the picker`);
  }
  // Equipment Resonance: tiers ask for all 7 grids at rising levels, and the attribute the simulation uses grows with every tier.
  for (const table of ['RefiningEffectTable', 'StrengthenEffectTable']) {
    const rows = rowsOf(load(table)).sort((a, b) => a._iEffectLev - b._iEffectLev);
    assert.ok(rows.every((r, i) => r._kRequest[0] === 7 && (!i || r._kRequest[1] > rows[i - 1]._kRequest[1])), `${table}: 7 grids, rising levels`);
    const attr = (r, id) => asList(r._kEffect).find((p) => p[0] === id)?.[1] ?? 0;
    assert.ok(rows.every((r, i) => !i || attr(r, table.startsWith('R') ? 215 : 235) > attr(rows[i - 1], table.startsWith('R') ? 215 : 235)), `${table}: the damage-relevant attribute grows with the tier`);
  }
  console.log('equipment resonance tiers: 7 grids, rising levels, growing Damage Increase / Elemental Counter Ignore');

  // Cards. The engine applies every op 8 effect a card carries (Phreeoni's HIT conversion) and the CARD_BUFFS families (Drake's size bonus),
  // so those must say what their texts say; the level attributes must grow linearly (the Cards window shows them per level) and the stars
  // must cap at Lv 5 / 10 / 15 / 15 (`_iLevel` 0 means no further cap).
  {
    const text = (r) => cardTables.SpecialEffectConfig[r._iID].tx;
    const conversions = effectRows.filter((r) => asList(r._kSpecialEffect).some((o) => o[0] === 8));
    assert.equal(conversions.length, 8, 'only Phreeoni and Shadow Phreeoni carry a conversion (one effect per star)');
    for (const r of conversions) {
      const m = /^Every (\d+) HIT increases Physical damage by ([\d.]+)%, up to ([\d.]+)%\.$/.exec(text(r));
      assert.ok(m, `the op 8 effect ${r._iID} no longer reads "Every N HIT increases Physical damage by x%, up to y%": ${text(r)}`);
      assert.deepEqual(r._kSpecialEffect[0], [8, 109, Number(m[1]), 1304, Math.round(m[2] * 100), Math.round(m[3] * 100)], `Phreeoni's conversion disagrees with "${text(r)}"`);
    }
    const sized = effectRows.filter((r) => asList(r._kSpecialEffect).some((o) => o[0] === 2 && CARD_BUFFS[Math.floor(o[1] / 100)]));
    assert.equal(sized.length, 8, 'only Drake and Shadow Drake carry these size bonuses (one effect per star)');
    for (const r of sized) {
      const id = r._kSpecialEffect[0][1];
      const logic = asList(allBuffs.get(id)._kLogicData);
      const proc = Math.floor(id / 100) === 20500;
      const m = (proc
        ? /has a ([\d.]+)% Chance to increase damage against Small, Medium, and Large monsters by ([\d.]+)%/
        : /Damage against Small, Medium, and Large monsters \+([\d.]+)%/).exec(text(r));
      assert.ok(m && JSON.stringify(m.slice(1).map((v) => Math.round(Number(v) * 100))) === JSON.stringify(logic), `Drake's buff ${id} disagrees with "${text(r)}"`);
    }
    const byPart = new Map();
    for (const r of rowsOf(load('CardUpgradeConfig'))) (byPart.get(`${r._iParts}:${r._iQuality}`) ?? byPart.set(`${r._iParts}:${r._iQuality}`, []).get(`${r._iParts}:${r._iQuality}`)).push(r);
    for (const [key, rows] of byPart) {
      rows.sort((a, b) => a._iLevel - b._iLevel);
      const step = asList(rows[1]._iAttr);
      assert.ok(rows.length === 16 && rows.every((r) => JSON.stringify(asList(r._iAttr)) === JSON.stringify(r._iLevel ? step.map(([id, v]) => [id, v * r._iLevel]) : [])), `card level attributes of part:quality ${key} are not linear in the level`);
    }
    for (const r of cardTierRows) assert.equal(r._iLevel, [5, 10, 15, 0][r._iTier], `card ${r._iCardID} star ${r._iTier}: level cap`);
    assert.ok(cardTierRows.length === cardItems.length * 4 && cardItems.every((r) => r._iIfSameCard === (r._iQuality >= 5 ? 1 : 0)), 'every card has four stars; the unique ones are the quality 5 and 6 cards');
    // The Collection (foil) version: only purple, gold and red cards have one, its attributes are plain [1, attribute, value] ops that are
    // the same at every star, grow with the quality and come in an offensive (weapon, accessory) and a defensive (other slots) twin.
    {
      const flashOf = new Map();
      for (const t of cardTierRows) {
        const q = cardItems.find((c) => c._iID === t._iCardID)._iQuality;
        assert.equal(asList(t._kFlashAttribute).length > 0, q >= 4, `card ${t._iCardID} star ${t._iTier}: a Collection version exists exactly for quality 4 and up`);
        const key = `${t._iCardID}`;
        flashOf.set(key, [...(flashOf.get(key) ?? []), JSON.stringify(t._kFlashAttribute)]);
      }
      assert.ok([...flashOf.values()].every((l) => new Set(l).size === 1), 'the Collection attributes of a card are the same at every star');
      const rowOf = new Map(effectRows.map((r) => [r._iID, r]));
      const grant = (q, part) => {
        const t = cardTierRows.find((x) => x._iTier === 0 && cardItems.find((c) => c._iID === x._iCardID)._iQuality === q && cardItems.find((c) => c._iID === x._iCardID)._iCardPart === part && asList(x._kFlashAttribute).length);
        return Object.fromEntries(asList(t._kFlashAttribute).flatMap((id) => asList(rowOf.get(id)._kSpecialEffect).map((o) => { assert.ok(o.length === 3 && o[0] === 1, `Collection effect ${id}: only [1, attribute, value] ops`); return [o[1], o[2]]; })));
      };
      for (const [part, names] of [[1, [209, 215, 221]], [3, [210, 216, 223]]]) {
        const [q4, q5, q6] = [4, 5, 6].map((q) => grant(q, part));
        for (const g of [q4, q5, q6]) assert.ok(Object.keys(g).every((a) => names.includes(Number(a))), `Collection attributes of part ${part} are among ${names}`);
        assert.ok(names.slice(1).every((a) => q4[a] < q5[a] && q5[a] < q6[a]), `Collection attributes of part ${part} grow with the quality`);
      }
    }
    const suggestedCards = Object.values(ui.profs).flat().flatMap((p) => p.cards.flat());
    console.log(`cards match their in-game text: ${cardItems.length} cards x 4 stars, Phreeoni HIT conversion and Drake / Shadow Drake size damage modeled (of ${effectRows.length} special effects), level attributes linear, Collection attributes of ${cardItems.filter((c) => c._iQuality >= 4).length} cards, ${suggestedCards.length} suggested cards in ${Object.values(ui.profs).flat().length} professions`);
  }
}

// ---------------------------------------------------------------- audit: gear vs the wiki and the in-game texts
{
  const need = { 5: 50, 6: 70, 7: 90 }; // tier -> required base level (the wiki: "Tier 6 ... Required level 70")
  const rankOf = (it) => equipRows.get(it._iEquipId)._iRank;
  for (const it of gearItems) assert.equal(it._iLevelNeed, need[rankOf(it)], `${it._iID}: tier ${rankOf(it)} needs level ${need[rankOf(it)]}`);
  // 17 items for every tier and quality: 12 weapons, a shield, armor, a cloak, shoes and an accessory (T5 Red also has the fixed-affix armor variants)
  for (const rank of GEAR_RANKS) for (const q of [3, 4, 5, 6]) {
    const list = gearItems.filter((it) => rankOf(it) === rank && it._iQuality === q && it._iID % 10 === 0);
    assert.equal(list.length, 17, `tier ${rank} quality ${q}`);
    assert.deepEqual([3, 4, 5, 6, 7].map((part) => list.filter((it) => it._iEquipPart === part).length), [1, 1, 1, 1, 1], `tier ${rank} quality ${q}: one shield, armor, cloak, shoes and accessory`);
    assert.equal(list.filter((it) => it._iEquipPart <= 2).length, 12, `tier ${rank} quality ${q}: 12 weapons`);
  }
  // Base attributes: Max HP, P.ATK, M.ATK, P.DEF, M.DEF in a range; a weapon's P.ATK and M.ATK share it
  for (const [n, e] of gearEquip.entries()) {
    for (const [a, min, max = min] of asList(e._kBasicAttribute)) assert.ok([101, 103, 104, 105, 106].includes(a) && min <= max && min > 0, `${gearItems[n]._iID}: base attribute ${a} ${min}-${max}`);
    const [p, m] = [103, 104].map((a) => JSON.stringify(asList(e._kBasicAttribute).find((r) => r[0] === a)));
    assert.equal(p?.slice(5), m?.slice(5), `${gearItems[n]._iID}: P.ATK and M.ATK roll over the same range`);
  }
  // The wiki's Rudra Bow page (wiki.ro3.cc/en/equip/2110660, 2026-10-15): Tier 6 Red, Lv 70, HP 3420-4560, P.ATK / M.ATK 428-570, entries STR..LUK 12-20
  const bow = gearParts({ grid: 1, id: 2110660, roll: 0 }, new Ro3DataStore(configDir));
  assert.deepEqual([bow.rank, bow.item._iLevelNeed, bow.item._iQuality, bow.item._iEquipPart], [6, 70, 6, 1]);
  assert.deepEqual(bow.base.map((b) => [b.attr, b.min, b.max]), [[101, 3420, 4560], [103, 428, 570], [104, 428, 570]]);
  assert.deepEqual(bow.pool.map((r) => [r._iAttriID, r._iMin, r._iMax]), [1, 2, 3, 4, 5, 6].map((a) => [a, 12, 20]));
  assert.deepEqual(bow.pools.map((p) => p.length), [4, 3], 'the wiki lists 4 stunts in group 60201 and 3 in 60203');
  // Entries: STR..LUK only, with the same range for each; the group of every item exists; the stunt pools too
  for (const g of gearAttrGroups) {
    const rows = Object.values(gearTables.EquipAttriGroupConfig).filter((r) => r._iGroup === g);
    assert.deepEqual(rows.map((r) => r._iAttriID), [1, 2, 3, 4, 5, 6], `entry group ${g}: STR..LUK`);
    assert.equal(new Set(rows.map((r) => `${r._iMin}-${r._iMax}`)).size, 1, `entry group ${g}: one range`);
  }
  for (const g of gearStuntGroups) assert.ok(stuntPoolRows.some((r) => r._iGroup === g), `stunt group ${g} has stunts`);
  // Grid tables: every grid has levels 0..150 (enhance) and 0..18 (refine), and the totals never go down
  for (const [table, key, top] of [['StrengthenTable', '_iStrengthenInterval', 150], ['RefiningTable', '_iRefiningInterval', 18]]) {
    for (let grid = 1; grid <= 7; grid++) {
      const rows = Object.values(gearTables[table]).filter((r) => r._iEquipType === grid).sort((a, b) => a[key] - b[key]);
      assert.deepEqual(rows.map((r) => r[key]), Array.from({ length: top + 1 }, (_, i) => i), `${table} grid ${grid}: levels 0..${top}`);
      for (let i = 1; i < rows.length; i++) for (const [a, v] of rows[i - 1]._kAttr) assert.ok((rows[i]._kAttr.find((p) => p[0] === a)?.[1] ?? 0) >= v, `${table} grid ${grid} level ${i}: attribute ${a} must not drop`);
    }
  }
  // The stunts say what their texts say: the numbers of ops 1, 4, 5 and 8 against the in-game English (op 14 Max HP, potion, evade, revive
  // and regeneration texts have no stat the damage uses; they only need a known op)
  const byName = { 'Physical ATK': 103, 'Magic ATK': 104, 'Max Life': 101 };
  const hundredths = (s) => Math.round(Number(s) * 100);
  const stuntText = (r) => gearEffectRows[r._iID].tx;
  // The one stunt whose op disagrees with its own text (T5 shield: "Max Life +60" per refine, the op says 120; Max HP only): the sheet uses the op, like the server
  const knownOff = { 10050501: [5, 1, 101, 120] };
  let checked = 0;
  const loose = [];
  for (const r of stuntRows) {
    const [tx, ops] = [stuntText(r), asList(r._kSpecialEffect)];
    assert.ok(tx && !/\?/.test(tx), `stunt ${r._iID} has an English text: "${tx}"`);
    const is = (...op) => {
      if (knownOff[r._iID]) { assert.deepEqual(ops, [knownOff[r._iID]], `stunt ${r._iID} "${tx}" changed`); assert.notDeepEqual(ops, [op], `stunt ${r._iID} now agrees with its text: drop it from knownOff`); return; }
      assert.deepEqual(ops, [op], `stunt ${r._iID} "${tx}"`);
      checked++;
    };
    let m;
    if ((m = /^For every \+1 Refine, (Physical ATK|Magic ATK|Max Life) \+(\d+)$/.exec(tx))) is(5, 1, byName[m[1]], +m[2]);
    else if ((m = /^For every \+1 Refine, CRIT \+([\d.]+)$/.exec(tx))) is(5, 1, 111, hundredths(m[1]));
    else if ((m = /^For every \+1 Refine, CRIT DMG \+([\d.]+)%$/.exec(tx))) is(5, 1, 209, hundredths(m[1]));
    else if ((m = /^For every 1 Stunts on equipped gear, (Physical ATK|Magic ATK|Max Life) \+(\d+) \(up to 10 Stunts\)$/.exec(tx))) is(4, 1, 10, byName[m[1]], +m[2]);
    else if ((m = /^For every 1 Stunts on equipped gear, CRIT \+([\d.]+) \(up to 10 Stunts\)$/.exec(tx))) is(4, 1, 10, 111, hundredths(m[1]));
    else if ((m = /^For every 1 Stunts on equipped gear, CRIT DMG \+([\d.]+)% \(up to 10 Stunts\)$/.exec(tx))) is(4, 1, 10, 209, hundredths(m[1]));
    else if ((m = /^Increases (PATK|MATK) by (\d+)% of (MATK|PATK), up to (\d+)\.$/.exec(tx))) is(8, m[3] === 'MATK' ? 104 : 103, Math.ceil(100 / m[2]), m[1] === 'PATK' ? 1033 : 1043, 1, +m[4]);
    else if ((m = /^Ignores (\d+)% of the target's (Physical|Magic) DEF$/.exec(tx))) is(1, m[2] === 'Physical' ? 218 : 220, m[1] * 100);
    else {
      assert.ok(ops.every((op) => [1, 13, 14].includes(op[0])), `stunt ${r._iID} "${tx}": op ${JSON.stringify(ops)} is unknown`);
      loose.push(r._iID);
    }
  }
  // The op-1 stunts the engine drops are exactly the stand-ins [1, 103, 1] of the proc effects (evade, revive); the rest name a real attribute
  for (const r of stuntRows.filter((x) => asList(x._kSpecialEffect).some((op) => op[0] === 1))) {
    const [op] = asList(r._kSpecialEffect);
    assert.ok((op[1] === 103 && op[2] === 1) || [218, 220, 254, 1071].includes(op[1]), `stunt ${r._iID} "${stuntText(r)}": op ${JSON.stringify(op)}`);
    if (op[1] === 103) assert.ok(/Chance to evade|Revive/.test(stuntText(r)), `stunt ${r._iID}: the [1, 103, 1] stand-in belongs to a proc effect: "${stuntText(r)}"`);
  }
  // The game's recommended stunts are written in tier 5 ids; the Gear window finds their equivalents in the other tiers by what they do (the
  // text without its numbers), so every one must have such an equivalent in the stunt pools of every tier
  const kindOf = (id) => gearEffectRows[id].tx.replace(/\d+(\.\d+)?/g, '#');
  const kindsOfTier = (rank) => new Set(stuntPoolRows.filter((r) => Math.floor(r._iGroup / 10000) === rank).map((r) => kindOf(r._iSpecialID)));
  for (const id of new Set(recommendedStunts.filter((x) => Math.floor(x / 100) % 100 === 5))) {
    for (const rank of GEAR_RANKS) assert.ok(kindsOfTier(rank).has(kindOf(id)), `recommended stunt ${id} "${gearEffectRows[id].tx}" has no equivalent in the tier ${rank} stunt pools`);
  }
  // The game's recommended affixes are STR..LUK, its stunts have a text, and every profession has a gear recommendation or none at all
  for (const p of Object.values(ui.profs).flat()) {
    assert.ok(p.aff.flat().every((a) => a >= 1 && a <= 6), `${p.name}: recommended affixes are STR..LUK`);
    assert.ok(p.spe.flat().every((id) => gearEffectRows[id]?.tx), `${p.name}: recommended stunts have a text`);
  }
  console.log(`gear matches the wiki and the in-game texts: ${gearItems.length} items in tiers ${GEAR_RANKS.join('/')} (${gearItems.filter((it) => it._iID % 10 === 0).length / 4 / GEAR_RANKS.length} per tier and quality), ${stuntRows.length} stunts (${checked} texts checked against their ops, ${loose.length} without a stat the sheet uses), grid tables to enhance 150 and refine 18`);
}

// ---------------------------------------------------------------- audit: pet stats vs the raw config and the client's formula
{
  // UI_Sys_Pet_GrowthPreviewPanelCtrl._processPetAttributes, recomputed here from the raw rows only (not from the digest): the pet's
  // AttriMonsterConfig row at its level x PetStarConfig._iBaseAttr / 10000 x the rank scale / 10000 x the slot's share / 10000, rounded up.
  const petRaw = Object.assign(Object.create(new Ro3DataStore(configDir)), { table: (n) => ({ PetDigest: tables.PetDigest, PetGrowth: tables.PetGrowth, PetRules: tables.PetRules })[n] ?? new Ro3DataStore(configDir).table(n) });
  const npcById = new Map(rowsOf(load('NPCConfig')).map((n) => [n._iID, n]));
  const starRow = new Map(petStarAll.map((r) => [`${r._iPetID}:${r._iStar}:${r._iStage}`, r]));
  const limits = rowsOf(load('PetSetLimitConfig')).sort((a, b) => a._iID - b._iID);
  const scale = (k) => Object.fromEntries(asList(publicParams[k]));
  assert.equal(limits.length, 5, 'PetSetLimitConfig: 5 slot rows');
  assert.deepEqual(limits.map((l) => l._iFightAttrAddition), [10000, 10000, 10000, 10000, 0], 'deployed slots 1-4 share 100%, the fifth row is support-only');
  assert.ok(limits.every((l) => l._iAssistAttrAddition === 3000), 'all five support slots share 30%');
  assert.equal(asList(publicParams.PetFightFieldUnlockLv).length, 4, '4 deployed slots');
  assert.equal(asList(publicParams.PetAssistFieldUnlockLv).length, 5, '5 support slots');
  assert.deepEqual(asList(publicParams.PetNotImproveBaseAttr), [0], 'every stat grows with the rank');
  assert.equal(petStarAll.filter((r) => asList(r._kStageSkill).length).length, 0, 'the data has no stage skill attributes (the engine does not read _kStageSkill)');
  assert.equal(petStarAll.filter((r) => asList(r._kAssistSkill).length).length, 0, 'the data has no support-slot attribute table (the client does not read it either)');
  let checks = 0;
  for (const b of rowsOf(load('PetBaseConfig'))) {
    const v = npcById.get(b._iMonster)._iAttributeVariated;
    for (let star = 1; star <= 6; star++) {
      for (const stage of star === 6 ? [0] : [0, 1, 2, 3]) {
        const row = starRow.get(`${b._iID}:${star}:${stage}`);
        assert.ok(row, `pet ${b._iID}: star ${star} stage ${stage} exists`);
        for (const lv of [1, 2, 33, 60, 72, 99]) {
          const attrs = new Map(asList(attriMonster.get(v * 1000 + lv)._kAttri));
          for (const [kind, i] of [['fight', 0], ['fight', 3], ['assist', 0], ['assist', 4]]) {
            const share = kind === 'fight' ? limits[i]._iFightAttrAddition : limits[i]._iAssistAttrAddition;
            const rankScale = scale(kind === 'fight' ? 'PetFightAttrAdditionScale' : 'PetAssistAttrAdditionScale')[b._iQuality];
            const want = ENGINE_PET_ATTRS.map((a) => [a, Math.ceil(attrs.get(a) * (row._iBaseAttr / 10000) * (rankScale / 10000) * (share / 10000))]).filter(([, x]) => x > 0);
            const slot = kind === 'fight' ? { id: b._iID, star, stage, lv } : { g: b._iQuality * 10 + b._iCamp, star, stage, lv };
            assert.deepEqual(petSlotStats(slot, kind, i, 99, petRaw), want, `pet ${b._iID} star ${star}.${stage} level ${lv} ${kind} slot ${i + 1}`);
            checks++;
          }
        }
      }
    }
  }
  console.log(`pet stats match the client's formula on the raw config: ${rowsOf(load('PetBaseConfig')).length} pets in ${Object.keys(PetGrowth).length} growth groups, every star and stage, 6 levels, deployed and support slots (${checks} checks)`);
}

// ---------------------------------------------------------------- audit: season talents vs the raw config and the game's rules
{
  const D = TalentDigest;
  const byNumber = (a, b) => a - b;
  // The chains hold every stat node and branch point of the trees once, the job talents hang off the branch points, and nothing is left over but the PvP node.
  assert.deepEqual(D.trees.flatMap((t) => t.chain.map((n) => n.n)).sort(byNumber), talentNodes.filter((n) => [1, 2, 5].includes(n._iType)).map((n) => n._iId).sort(byNumber), 'every stat node and branch point is in exactly one chain');
  assert.deepEqual(talentNodes.filter((n) => n._iType === 3).map((n) => n._iId), [], 'there are no Large nodes');
  assert.deepEqual(talentNodes.filter((n) => n._iType === 4).map((n) => n._iId), [10100000], 'the Battle Pledge (PvP) node is the only one left out');
  const clusters = Object.values(D.branches).flat();
  assert.deepEqual(clusters.map((c) => c.n).sort(byNumber), talentNodes.filter((n) => n._iType === 6).map((n) => n._iId).sort(byNumber), 'every job talent cluster hangs off a branch point');
  assert.deepEqual(clusters.flatMap((c) => c.kids).sort(byNumber), talentNodes.filter((n) => n._iType === 7).map((n) => n._iId).sort(byNumber), 'and every job talent off a cluster');
  assert.ok(Object.values(D.branches).every((b) => b.length === 3 && b.every((c) => c.kids.length === 3)), '3 clusters of 3 talents at every branch point');
  assert.deepEqual(Object.values(D.branches).map((b) => b.length).length, 5, 'five branch points: three in tree II, one in II+1 and one in II+2');
  // Each tree opens at the Talent Lv the trees before it add up to: their levels plus one pick for every branch point (tree II: 80 + 3 + 3 = 86).
  const cap = (t) => t.chain.reduce((s, n) => s + n.max + (n.ty === 5 ? 1 : 0), 0);
  assert.equal(D.trees[0].need, 0);
  D.trees.forEach((t, i) => { if (i) assert.equal(t.need, D.trees[i - 1].need + cap(D.trees[i - 1]), `tree ${t.name} opens at the Talent Lv the trees before it add up to`); });
  assert.deepEqual(D.trees.map((t) => [t.rank, t.lv]), [[2, 20], [3, 30], [4, 40], [4, 46], [5, 50], [5, 60], [5, 70], [5, 80], [5, 80], [5, 90], [5, 90]], 'job rank and base level of the trees (LC_ConditionList 80000000-80000010)');
  // Completing everything, from the raw rows alone: levels, costs and the stats the trees give.
  const total = new Map();
  let [levels, mats, coin] = [0, 0, 0];
  for (const n of talentNodes.filter((x) => x._iType === 1 || x._iType === 2)) {
    const row = talentEffectRows.get(n._iLevelGroupId)[n._iMaxLevel - 1];
    for (const [a, v] of asList(row._kAttrs)) total.set(a, (total.get(a) ?? 0) + v);
    const [m, c] = asList(row._kCosts).map((x) => x[1]);
    levels += n._iMaxLevel;
    mats += m * n._iMaxLevel;
    coin += c * n._iMaxLevel;
  }
  const full = { 101: 43000, 103: 860, 104: 860, 105: 430, 106: 430, 112: 1020, 114: 150, 116: 150, 1011: 5200 };
  assert.deepEqual(Object.fromEntries([...total].sort(([a], [b]) => a - b)), full, 'the whole tree: HP +43,000, P.ATK / M.ATK +860, P.DEF / M.DEF +430, Crit RES +1,020, ASPD / Cast Speed +150, Max HP +52%');
  assert.deepEqual([levels, mats, coin], [1940, 135400, 194000], 'the whole tree: 1,940 stat levels, 135,400 Talent Remnants, 194,000 Minted Coins');
  // The engine on the digest reaches the same totals, and the same walk by class: a Lv 72 Ranger opens trees I to III-2.
  const raw = new Ro3DataStore(configDir);
  const own = (jobs) => Object.assign(Object.create(raw), { table: (n) => (n === 'TalentDigest' ? { 1: { ...D, jobs } } : raw.table(n)) });
  const everything = talentEffects({ career: 3400, level: 99, talents: { lv: 99999, prof: 304 } }, own({}));
  assert.deepEqual(Object.fromEntries(everything.attrs.sort(([a], [b]) => a - b)), full, 'the engine walk gives the totals of the raw rows');
  assert.equal(everything.walk.total, D.trees.reduce((s, t) => s + cap(t), 0), 'all 1,950 Talent Lv (1,940 stat levels + 5 branch points + 5 picks)');
  assert.deepEqual([everything.walk.cost.mats, everything.walk.cost.coin], [mats, coin]);
  const at72 = talentWalk({ career: 3400, level: 72, talents: { lv: 99999, prof: 304 } }, own({}));
  assert.deepEqual(at72.trees.map((t) => t.state).join(), 'open,open,open,open,open,open,open,locked,locked,locked,locked', 'a Lv 72 Ranger: trees I to III-2');
  assert.equal(talentMax({ career: 3400, level: 72 }, own({})), 870, 'and 870 Talent Lv in all');
  assert.equal(talentMax({ career: 3300, level: 72 }, own({})), 40 + 86 + 102 + 102, 'a Sniper (job rank 4) has no tree III');
  assert.equal(talentMax({ career: 3100, level: 72 }, own({})), 40, 'a 2nd job has tree I only');
  // The job talents: English names and texts, the buffs exist in the compact data, and what the sim applies says what its text says.
  const rows = Object.values(D.jobs).flat();
  assert.ok(rows.every((r) => r.name && r.text && !/\?/.test(r.text)), 'every job talent has an English name and text');
  assert.ok(rows.flatMap((r) => r.b).every((id) => tables.BuffConfig[id]), 'every buff the talents apply is in the compact data');
  let said = 0;
  const hasPct = (text, pct) => new RegExp(`(?:^|[^\\d.])${pct}%`).test(text);
  const hasNum = (text, n) => new RegExp(`(?:^|[^\\d.])${n}(?!\\d|\\.\\d|%)`).test(text);
  for (const r of rows.filter((x) => x.b.length)) {
    for (const b of r.b) {
      const tuples = asList(tables.BuffConfig[b]._kSkillAttributeList).filter((t) => Array.isArray(t) && t.length >= 5).map((t) => t.slice(2, 5).map(Number));
      const first = (type) => tuples.find((t) => t[0] === type);
      const checks = [[29, 1, (v) => hasPct(r.text, v / 100)], [30, 1, (v) => hasNum(r.text, v)], [10, 1, (v) => hasPct(r.text, v / 100)], ...[21, 23, 24].map((type) => [type, 5, (v) => hasPct(r.text, Math.abs(v) / 100)])];
      for (const [type, op, ok] of checks) {
        const t = first(type);
        if (!t || t[1] !== op) continue;
        assert.ok(ok(t[2]), `${r.name}: the text "${r.text}" says another number than its buff ${b} (type ${type}, value ${t[2]})`);
        said++;
      }
    }
  }
  assert.ok(said >= 40, `the talents that change a skill say what their buffs do (${said} numbers checked)`);
  const sim = [0, 1, 2].map((s) => rows.filter((r) => r.sim === s).length);
  const ranger = rows.filter((r) => r.jobs.includes(3400));
  console.log(`season talents match the raw config: ${D.trees.length} trees, ${Object.keys(D.groups).length} stat groups, ${levels} stat levels (HP +${full[101]}, P.ATK / M.ATK +${full[103]}, Max HP +${full[1011] / 100}%), thresholds add up to ${cap(D.trees.at(-1)) + D.trees.at(-1).need}; ${rows.length} job talents (${ranger.length} for Rangers): ${sim[2]} simulated, ${sim[1]} partly, ${sim[0]} listed only; ${said} numbers of the texts checked against their buffs`);
  // The talents' ASPD takes a build past the cap: the engine's ASPD_EXCESS says what the game's own tip of ASPD (attribute 115) says, and the talents' unit is the
  // same as the other ASPD % sources ("Attack Speed increased by 30%" is +30 of attribute 114).
  const aspdTip = asList(rowsOf(load('AttributeConfig')).find((r) => r._iID === 115)._kTips);
  assert.match(loc(aspdTip[0]), /Max: @\{1\}%\)\s*Excess ASPD: \$\{2\}\s*Every @\{2\} excess ASPD is converted to @\{3\}% Physical ATK \(Max: @\{4\}%\)/, 'the ASPD tip still describes a cap and a conversion to P.ATK');
  assert.deepEqual(aspdTip.slice(1).map(Number), [ASPD_EXCESS.cap, 1, ASPD_EXCESS.bpPerPoint / 100, ASPD_EXCESS.maxBp / 100], 'the cap (500%), the excess per step (1), the P.ATK % per step (0.1) and its cap (20)');
  assert.equal(asList(allBuffs.get(1112501)._kChangeAttri)[0].join(), '114,30', 'a buff that says "Attack Speed increased by 30%" gives 30 of attribute 114');
  console.log(`ASPD cap: ${ASPD_EXCESS.cap}% (the game's tip), every point over it is worth +${ASPD_EXCESS.bpPerPoint / 100}% P.ATK up to +${ASPD_EXCESS.maxBp / 100}%`);
}

// ---------------------------------------------------------------- write HTML regions
const splice = (text, begin, end, body) => {
  const i = text.indexOf(begin);
  const j = text.indexOf(end);
  assert.ok(i >= 0 && j > i, `Markers ${begin} / ${end} not found in ${path.basename(htmlFile)}`);
  return text.slice(0, i + begin.length) + body + text.slice(j);
};
let html = fs.readFileSync(htmlFile, 'utf8');
html = splice(html, '/* @@ENGINE-BEGIN */', '/* @@ENGINE-END */', `\n${engine}\n`);
const blob = JSON.stringify({ generated: new Date().toISOString().slice(0, 10), tables, ui });
const packed = zlib.gzipSync(blob, { level: 9 }).toString('base64');
assert.equal(zlib.gunzipSync(Buffer.from(packed, 'base64')).toString('utf8'), blob, 'Data blob must survive the gzip round trip');
html = splice(html, '<!-- @@DATA-BEGIN -->', '<!-- @@DATA-END -->', `<script type="text/plain" id="ro3-data">${packed}</script>`);
// The Import window hands out the Unity Explorer export script: ro3-export-character.cs is its source, this copy is spliced in (so it also works from a file or the web).
const exporter = fs.readFileSync(path.resolve(here, 'ro3-export-character.cs'), 'utf8');
assert.ok(exporter.length < 16000 && !/<\/script/i.test(exporter), 'the export script fits the Unity Explorer console (16,000 characters) and can sit inside a script tag');
html = splice(html, '<!-- @@EXPORTER-BEGIN -->', '<!-- @@EXPORTER-END -->', `<script type="text/plain" id="ro3-export">${exporter}</script>`);
fs.writeFileSync(htmlFile, html);
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`wrote ${path.basename(htmlFile)}: ${kb(Buffer.byteLength(html))} (engine ${kb(engine.length)}, data ${kb(packed.length)} packed / ${kb(blob.length)} raw: ${skills.length} skill rows, ${buffs.length} buffs, ${monsters.length} monsters, ${ui.jobs.length} jobs)`);
