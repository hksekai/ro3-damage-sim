#!/usr/bin/env node
/**
 * RO3 Damage Calculator, Combat Timeline Simulator & Maximum-Damage Build Optimizer
 * Standalone, zero-dependency ES module faithful to `ro3emu-server` (`StatCalculator.cs`,
 * `CharacterService.EntityData.cs`, `CharacterService.Progression.cs`, `CombatService.cs`,
 * `CombatService.Casting.cs`, `CombatService.Effects.cs`, `SkillParameterRules.cs`,
 * `EquipmentStunts.cs`, `TotemEffects.cs`, `DungeonService.Bonds.cs`).
 *
 * Usage:
 *   node ro3-damage-optimizer.mjs --self-test
 *   node ro3-damage-optimizer.mjs --class swordman --level 50 --target baphomet --window 30
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

export const DEFAULT_CONFIG_DIR = process.env.RO3_CONFIG_DIR ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'ro3emu-server', 'data', 'config');
// Client skill templates boiled down by extract-skill-timing.mjs: { scriptShow: [chant, end, interrupt, [hit points]] } (seconds).
export const DEFAULT_TIMING_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ro3-skill-timing.json');
const asArray = (v) => (Array.isArray(v) ? v : []);
const asPairs = (v) => (Array.isArray(v) ? v.filter((p) => Array.isArray(p) && p.length >= 2) : []);

// ============================================================================
// 1. Built-in Fallback GameData (extracted from RO3 client DataConfig tables)
// ============================================================================

const FALLBACK_TABLES = {
  AttributeConfig: {
    1: { _iID: 1, _iPreAttri: 1, _iCalculateType: 1, _iDataType: 0, _iPower: 50, name: 'STR' },
    2: { _iID: 2, _iPreAttri: 2, _iCalculateType: 1, _iDataType: 0, _iPower: 50, name: 'AGI' },
    3: { _iID: 3, _iPreAttri: 3, _iCalculateType: 1, _iDataType: 0, _iPower: 50, name: 'VIT' },
    4: { _iID: 4, _iPreAttri: 4, _iCalculateType: 1, _iDataType: 0, _iPower: 50, name: 'INT' },
    5: { _iID: 5, _iPreAttri: 5, _iCalculateType: 1, _iDataType: 0, _iPower: 50, name: 'DEX' },
    6: { _iID: 6, _iPreAttri: 6, _iCalculateType: 1, _iDataType: 0, _iPower: 50, name: 'LUK' },
    11: { _iID: 11, _iPreAttri: 1, _iCalculateType: 2, _iDataType: 1, _iPower: 50 },
    12: { _iID: 12, _iPreAttri: 2, _iCalculateType: 2, _iDataType: 1, _iPower: 50 },
    13: { _iID: 13, _iPreAttri: 3, _iCalculateType: 2, _iDataType: 1, _iPower: 50 },
    14: { _iID: 14, _iPreAttri: 4, _iCalculateType: 2, _iDataType: 1, _iPower: 50 },
    15: { _iID: 15, _iPreAttri: 5, _iCalculateType: 2, _iDataType: 1, _iPower: 50 },
    16: { _iID: 16, _iPreAttri: 6, _iCalculateType: 2, _iDataType: 1, _iPower: 50 },
    71: { _iID: 71, _iPreAttri: 1, _iCalculateType: 3, _iDataType: 0, _iPower: 50 },
    72: { _iID: 72, _iPreAttri: 2, _iCalculateType: 3, _iDataType: 0, _iPower: 50 },
    73: { _iID: 73, _iPreAttri: 3, _iCalculateType: 3, _iDataType: 0, _iPower: 50 },
    74: { _iID: 74, _iPreAttri: 4, _iCalculateType: 3, _iDataType: 0, _iPower: 50 },
    75: { _iID: 75, _iPreAttri: 5, _iCalculateType: 3, _iDataType: 0, _iPower: 50 },
    76: { _iID: 76, _iPreAttri: 6, _iCalculateType: 3, _iDataType: 0, _iPower: 50 },
    81: { _iID: 81, _iPreAttri: 1, _iCalculateType: 4, _iDataType: 1, _iPower: 50 },
    82: { _iID: 82, _iPreAttri: 2, _iCalculateType: 4, _iDataType: 1, _iPower: 50 },
    83: { _iID: 83, _iPreAttri: 3, _iCalculateType: 4, _iDataType: 1, _iPower: 50 },
    84: { _iID: 84, _iPreAttri: 4, _iCalculateType: 4, _iDataType: 1, _iPower: 50 },
    85: { _iID: 85, _iPreAttri: 5, _iCalculateType: 4, _iDataType: 1, _iPower: 50 },
    86: { _iID: 86, _iPreAttri: 6, _iCalculateType: 4, _iDataType: 1, _iPower: 50 },
    101: { _iID: 101, _iPreAttri: 101, _iCalculateType: 1, _iDataType: 0, _iPower: 0.25, name: 'MaxHP' },
    102: { _iID: 102, _iPreAttri: 102, _iCalculateType: 1, _iDataType: 0, _iPower: 0, name: 'MaxSP' },
    103: { _iID: 103, _iPreAttri: 103, _iCalculateType: 1, _iDataType: 0, _iPower: 5, name: 'P.ATK' },
    104: { _iID: 104, _iPreAttri: 104, _iCalculateType: 1, _iDataType: 0, _iPower: 5, name: 'M.ATK' },
    105: { _iID: 105, _iPreAttri: 105, _iCalculateType: 1, _iDataType: 0, _iPower: 5, name: 'P.DEF' },
    106: { _iID: 106, _iPreAttri: 106, _iCalculateType: 1, _iDataType: 0, _iPower: 5, name: 'M.DEF' },
    107: { _iID: 107, _iPreAttri: 107, _iCalculateType: 1, _iDataType: 0, _iPower: 1, name: 'HP Regen' },
    108: { _iID: 108, _iPreAttri: 108, _iCalculateType: 1, _iDataType: 0, _iPower: 0, name: 'SP Regen' },
    109: { _iID: 109, _iPreAttri: 109, _iCalculateType: 1, _iDataType: 0, _iPower: 20, name: 'HIT' },
    110: { _iID: 110, _iPreAttri: 110, _iCalculateType: 1, _iDataType: 0, _iPower: 20, name: 'FLEE' },
    111: { _iID: 111, _iPreAttri: 111, _iCalculateType: 1, _iDataType: 0, _iPower: 1, name: 'CRIT' },
    112: { _iID: 112, _iPreAttri: 112, _iCalculateType: 1, _iDataType: 0, _iPower: 1, name: 'Anti-CRIT' },
    113: { _iID: 113, _iPreAttri: 113, _iCalculateType: 1, _iDataType: 0, _iPower: 0, name: 'Move Speed' },
    114: { _iID: 114, _iPreAttri: 115, _iCalculateType: 2, _iDataType: 2, _iPower: 5, name: 'ASPD %' },
    115: { _iID: 115, _iPreAttri: 115, _iCalculateType: 1, _iDataType: 2, _iPower: 0, name: 'Final ASPD' },
    116: { _iID: 116, _iPreAttri: 116, _iCalculateType: 1, _iDataType: 0, _iPower: 5, name: 'Haste' },
    207: { _iID: 207, _iPreAttri: 207, _iCalculateType: 1, _iDataType: 1, _iPower: 1, name: 'Heal Bonus (bp)' },
    209: { _iID: 209, _iPreAttri: 209, _iCalculateType: 1, _iDataType: 1, _iPower: 1, name: 'Crit DMG Bonus (bp)' },
    210: { _iID: 210, _iPreAttri: 210, _iCalculateType: 1, _iDataType: 1, _iPower: 1, name: 'Crit DMG Reduc (bp)' },
    211: { _iID: 211, _iPreAttri: 211, _iCalculateType: 1, _iDataType: 1, _iPower: 2, name: 'P.DMG Bonus (bp)' },
    213: { _iID: 213, _iPreAttri: 213, _iCalculateType: 1, _iDataType: 1, _iPower: 2, name: 'M.DMG Bonus (bp)' },
    216: { _iID: 216, _iPreAttri: 216, _iCalculateType: 1, _iDataType: 1, _iPower: 2, name: 'DMG Reduc (bp)' },
    227: { _iID: 227, _iPreAttri: 227, _iCalculateType: 1, _iDataType: 1, _iPower: 2, name: 'Melee P.DMG (bp)' },
    229: { _iID: 229, _iPreAttri: 229, _iCalculateType: 1, _iDataType: 1, _iPower: 2, name: 'Ranged P.DMG (bp)' },
    304: { _iID: 304, _iPreAttri: 304, _iCalculateType: 1, _iDataType: 1, _iPower: 1, name: 'Fire DMG (bp)' },
    601: { _iID: 601, _iPreAttri: 601, _iCalculateType: 1, _iDataType: 1, _iPower: 0, name: 'Bond Boss DMG (bp)' },
    602: { _iID: 602, _iPreAttri: 602, _iCalculateType: 1, _iDataType: 1, _iPower: 0, name: 'Bond Boss Reduc (bp)' },
    1011: { _iID: 1011, _iPreAttri: 101, _iCalculateType: 2, _iDataType: 1, _iPower: 4, name: 'MaxHP % (BasePerAdd)' },
    1012: { _iID: 1012, _iPreAttri: 101, _iCalculateType: 4, _iDataType: 1, _iPower: 5.2, name: 'MaxHP % (BuffPerAdd)' },
    1013: { _iID: 1013, _iPreAttri: 101, _iCalculateType: 3, _iDataType: 0, _iPower: 0, name: 'MaxHP Flat (BuffValAdd)' },
    1021: { _iID: 1021, _iPreAttri: 102, _iCalculateType: 2, _iDataType: 1, _iPower: 0, name: 'MaxSP % (BasePerAdd)' },
    1022: { _iID: 1022, _iPreAttri: 102, _iCalculateType: 4, _iDataType: 1, _iPower: 0, name: 'MaxSP % (BuffPerAdd)' },
    1023: { _iID: 1023, _iPreAttri: 102, _iCalculateType: 3, _iDataType: 0, _iPower: 0, name: 'MaxSP Flat (BuffValAdd)' },
    1031: { _iID: 1031, _iPreAttri: 103, _iCalculateType: 2, _iDataType: 1, _iPower: 2, name: 'P.ATK % (BasePerAdd)' },
    1032: { _iID: 1032, _iPreAttri: 103, _iCalculateType: 4, _iDataType: 1, _iPower: 2.6, name: 'P.ATK % (BuffPerAdd)' },
    1033: { _iID: 1033, _iPreAttri: 103, _iCalculateType: 3, _iDataType: 0, _iPower: 0, name: 'P.ATK Flat (BuffValAdd)' },
    1034: { _iID: 1034, _iPreAttri: 103, _iCalculateType: 6, _iDataType: 1, _iPower: 0, name: 'P.ATK % (OtherPerAdd)' },
    1041: { _iID: 1041, _iPreAttri: 104, _iCalculateType: 2, _iDataType: 1, _iPower: 2, name: 'M.ATK % (BasePerAdd)' },
    1042: { _iID: 1042, _iPreAttri: 104, _iCalculateType: 4, _iDataType: 1, _iPower: 2.6, name: 'M.ATK % (BuffPerAdd)' },
    1043: { _iID: 1043, _iPreAttri: 104, _iCalculateType: 3, _iDataType: 0, _iPower: 0, name: 'M.ATK Flat (BuffValAdd)' },
    1044: { _iID: 1044, _iPreAttri: 104, _iCalculateType: 6, _iDataType: 1, _iPower: 0, name: 'M.ATK % (OtherPerAdd)' },
    1051: { _iID: 1051, _iPreAttri: 105, _iCalculateType: 2, _iDataType: 1, _iPower: 1.2 },
    1052: { _iID: 1052, _iPreAttri: 105, _iCalculateType: 4, _iDataType: 1, _iPower: 1.2 },
    1053: { _iID: 1053, _iPreAttri: 105, _iCalculateType: 3, _iDataType: 0, _iPower: 0 },
    1061: { _iID: 1061, _iPreAttri: 106, _iCalculateType: 2, _iDataType: 1, _iPower: 1.2 },
    1062: { _iID: 1062, _iPreAttri: 106, _iCalculateType: 4, _iDataType: 1, _iPower: 1.2 },
    1063: { _iID: 1063, _iPreAttri: 106, _iCalculateType: 3, _iDataType: 0, _iPower: 0 },
    1071: { _iID: 1071, _iPreAttri: 1071, _iCalculateType: 1, _iDataType: 1, _iPower: 16 },
    1081: { _iID: 1081, _iPreAttri: 1081, _iCalculateType: 1, _iDataType: 1, _iPower: 0 },
    1091: { _iID: 1091, _iPreAttri: 109, _iCalculateType: 2, _iDataType: 1, _iPower: 0.16 },
    1092: { _iID: 1092, _iPreAttri: 109, _iCalculateType: 4, _iDataType: 1, _iPower: 0.16 },
    1093: { _iID: 1093, _iPreAttri: 109, _iCalculateType: 3, _iDataType: 0, _iPower: 0 },
    1101: { _iID: 1101, _iPreAttri: 110, _iCalculateType: 2, _iDataType: 1, _iPower: 0.16 },
    1102: { _iID: 1102, _iPreAttri: 110, _iCalculateType: 4, _iDataType: 1, _iPower: 0.16 },
    1103: { _iID: 1103, _iPreAttri: 110, _iCalculateType: 3, _iDataType: 0, _iPower: 0 },
    1111: { _iID: 1111, _iPreAttri: 111, _iCalculateType: 2, _iDataType: 1, _iPower: 0.25 },
    1112: { _iID: 1112, _iPreAttri: 111, _iCalculateType: 4, _iDataType: 1, _iPower: 0.25 },
    1113: { _iID: 1113, _iPreAttri: 111, _iCalculateType: 3, _iDataType: 0, _iPower: 0 },
    1131: { _iID: 1131, _iPreAttri: 113, _iCalculateType: 2, _iDataType: 1, _iPower: 0 },
    1132: { _iID: 1132, _iPreAttri: 113, _iCalculateType: 4, _iDataType: 1, _iPower: 0 },
    1133: { _iID: 1133, _iPreAttri: 113, _iCalculateType: 3, _iDataType: 0, _iPower: 0 },
    1141: { _iID: 1141, _iPreAttri: 115, _iCalculateType: 4, _iDataType: 1, _iPower: 0, name: 'ASPD BuffPerAdd (bp)' },
    1142: { _iID: 1142, _iPreAttri: 115, _iCalculateType: 3, _iDataType: 2, _iPower: 0, name: 'ASPD BuffValAdd (%)' },
  },

  AttributeConversionConfig: {
    1: { _iID: 1, _kAttribute1: [[103, 1], [105, 0.5], [1031, 20]], _kAttribute2: [[105, 0.5]] },
    2: { _iID: 2, _kAttribute1: [[110, 1], [114, 2]], _kAttribute2: [[110, 1], [114, 2]] },
    3: { _iID: 3, _kAttribute1: [[101, 40], [1011, 20], [107, 3], [1071, 1]], _kAttribute2: [[101, 40], [1011, 20], [107, 3], [1071, 1]] },
    4: { _iID: 4, _kAttribute1: [[102, 5], [104, 1], [106, 0.5], [1021, 100], [1041, 20], [108, 0.2], [1081, 10]], _kAttribute2: [[102, 5], [104, 1], [106, 0.5], [1021, 100], [1041, 20], [108, 0.2], [1081, 10]] },
    5: { _iID: 5, _kAttribute1: [[109, 1], [116, 2]], _kAttribute2: [[103, 1], [109, 1], [1031, 20], [116, 2]] },
    6: { _iID: 6, _kAttribute1: [[109, 0.5], [110, 0.5], [111, 20]], _kAttribute2: [[109, 0.5], [110, 0.5], [111, 20]] },
  },

  BasePointConfig: Object.fromEntries(
    Array.from({ length: 100 }, (_, idx) => {
      const v = idx + 1;
      const cost = v === 1 ? 0 : v <= 12 ? 2 : v <= 22 ? 3 : 4;
      return [v, { _iID: v, _iStatusPoint: cost }];
    })
  ),

  BaseLvConfig: Object.fromEntries(
    Array.from({ length: 100 }, (_, idx) => {
      const lv = idx + 1;
      const pts = lv === 1 || lv === 100 ? 0 : lv <= 9 ? 2 : lv === 10 ? 4 : lv === 11 ? 16 : lv <= 16 ? 4 : 8;
      return [lv, { _iID: lv, _iStatusPoint: pts, _iBaseExp: lv === 100 ? 0 : lv * 100 }];
    })
  ),

  EleConfig: {
    1: { _iID: 1, _iNone: 0, _iWind: 0, _iEarth: 0, _iFire: 0, _iWater: 0, _iPoison: 0, _iHoly: 0, _iShadow: 0, _iGhost: -2500, _iUndead: 0 },
    2: { _iID: 2, _iNone: 0, _iWind: -5000, _iEarth: 5000, _iFire: 0, _iWater: -2500, _iPoison: 2500, _iHoly: 0, _iShadow: 0, _iGhost: 0, _iUndead: 0 },
    3: { _iID: 3, _iNone: 0, _iWind: -2500, _iEarth: -5000, _iFire: 5000, _iWater: 0, _iPoison: 2500, _iHoly: 0, _iShadow: 0, _iGhost: 0, _iUndead: 0 },
    4: { _iID: 4, _iNone: 0, _iWind: 0, _iEarth: -2500, _iFire: -5000, _iWater: 5000, _iPoison: 2500, _iHoly: 0, _iShadow: 0, _iGhost: 0, _iUndead: 0 },
    5: { _iID: 5, _iNone: 0, _iWind: 5000, _iEarth: 0, _iFire: -2500, _iWater: -5000, _iPoison: 2500, _iHoly: 0, _iShadow: 0, _iGhost: 0, _iUndead: 0 },
    6: { _iID: 6, _iNone: 0, _iWind: 0, _iEarth: 0, _iFire: 0, _iWater: 0, _iPoison: -5000, _iHoly: 0, _iShadow: -2500, _iGhost: 0, _iUndead: -2500 },
    7: { _iID: 7, _iNone: 0, _iWind: -5000, _iEarth: -5000, _iFire: -5000, _iWater: -5000, _iPoison: -5000, _iHoly: -5000, _iShadow: 5000, _iGhost: -5000, _iUndead: 5000 },
    8: { _iID: 8, _iNone: 0, _iWind: 0, _iEarth: 0, _iFire: 0, _iWater: 0, _iPoison: -2500, _iHoly: 2500, _iShadow: -5000, _iGhost: -2500, _iUndead: -5000 },
    9: { _iID: 9, _iNone: -2500, _iWind: 0, _iEarth: 0, _iFire: 0, _iWater: 0, _iPoison: 0, _iHoly: 0, _iShadow: 0, _iGhost: 2500, _iUndead: 0 },
    10: { _iID: 10, _iNone: 0, _iWind: 0, _iEarth: 0, _iFire: 2500, _iWater: 0, _iPoison: -5000, _iHoly: 5000, _iShadow: -5000, _iGhost: 2500, _iUndead: -5000 },
  },

  JobConfig: {
    1000: { _iID: 1000, name: 'Novice', _iParentId: 0, _iJobRank: 1, _iDistanceType: 1, _kSkillNormalID: [1000001], _kAttri: [[115, 100], [113, 700]] },
    1100: { _iID: 1100, name: 'Swordman', _iParentId: 1000, _iJobRank: 2, _iDistanceType: 1, _kSkillNormalID: [1100001], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
    1200: { _iID: 1200, name: 'Knight', _iParentId: 1100, _iJobRank: 3, _iDistanceType: 1, _kSkillNormalID: [1100001], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
    1300: { _iID: 1300, name: 'Lord Knight', _iParentId: 1200, _iJobRank: 4, _iDistanceType: 1, _kSkillNormalID: [1100001], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
    2100: { _iID: 2100, name: 'Mage', _iParentId: 1000, _iJobRank: 2, _iDistanceType: 1, _kSkillNormalID: [1200001], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
    2200: { _iID: 2200, name: 'Wizard', _iParentId: 2100, _iJobRank: 3, _iDistanceType: 1, _kSkillNormalID: [1200001], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
    3100: { _iID: 3100, name: 'Archer', _iParentId: 1000, _iJobRank: 2, _iDistanceType: 2, _kSkillNormalID: [1300001], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
    3200: { _iID: 3200, name: 'Hunter', _iParentId: 3100, _iJobRank: 3, _iDistanceType: 2, _kSkillNormalID: [1300001], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
    4100: { _iID: 4100, name: 'Acolyte', _iParentId: 1000, _iJobRank: 2, _iDistanceType: 1, _kSkillNormalID: [1499901], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
    4200: { _iID: 4200, name: 'Priest', _iParentId: 4100, _iJobRank: 3, _iDistanceType: 1, _kSkillNormalID: [1499901], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
    5100: { _iID: 5100, name: 'Thief', _iParentId: 1000, _iJobRank: 2, _iDistanceType: 1, _kSkillNormalID: [1500001], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
    5200: { _iID: 5200, name: 'Assassin', _iParentId: 5100, _iJobRank: 3, _iDistanceType: 1, _kSkillNormalID: [1500001], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
    6100: { _iID: 6100, name: 'Merchant', _iParentId: 1000, _iJobRank: 2, _iDistanceType: 1, _kSkillNormalID: [1600001], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
    6200: { _iID: 6200, name: 'Blacksmith', _iParentId: 6100, _iJobRank: 3, _iDistanceType: 1, _kSkillNormalID: [1600001], _kAttri: [[115, 100], [113, 700], [114, 50], [116, 50]] },
  },

  AttriBaseLvConfig: {
    1000001: { _iID: 1000001, _iJob: 1000, _iBaseLv: 1, _kAttri: [[101, 30], [102, 20], [103, 1], [104, 1], [105, 1], [106, 1], [107, 1], [108, 5]] },
    1000050: { _iID: 1000050, _iJob: 1000, _iBaseLv: 50, _kAttri: [[101, 3840], [102, 1000], [103, 96], [104, 96], [105, 80], [106, 80], [107, 202], [108, 100]] },
    1100050: { _iID: 1100050, _iJob: 1100, _iBaseLv: 50, _kAttri: [[101, 4224], [102, 1000], [103, 87], [104, 87], [105, 80], [106, 80], [107, 202], [108, 100]] },
    1200050: { _iID: 1200050, _iJob: 1200, _iBaseLv: 50, _kAttri: [[101, 4224], [102, 1000], [103, 87], [104, 87], [105, 80], [106, 80], [107, 202], [108, 100]] },
    2100050: { _iID: 2100050, _iJob: 2100, _iBaseLv: 50, _kAttri: [[101, 3264], [102, 1000], [103, 111], [104, 111], [105, 80], [106, 80], [107, 202], [108, 100]] },
    2200050: { _iID: 2200050, _iJob: 2200, _iBaseLv: 50, _kAttri: [[101, 3264], [102, 1000], [103, 111], [104, 111], [105, 80], [106, 80], [107, 202], [108, 100]] },
    3100050: { _iID: 3100050, _iJob: 3100, _iBaseLv: 50, _kAttri: [[101, 3264], [102, 1000], [103, 111], [104, 111], [105, 80], [106, 80], [107, 202], [108, 100]] },
    3200050: { _iID: 3200050, _iJob: 3200, _iBaseLv: 50, _kAttri: [[101, 3264], [102, 1000], [103, 111], [104, 111], [105, 80], [106, 80], [107, 202], [108, 100]] },
    4100050: { _iID: 4100050, _iJob: 4100, _iBaseLv: 50, _kAttri: [[101, 4416], [102, 1000], [103, 82], [104, 82], [105, 80], [106, 80], [107, 202], [108, 100]] },
    5100050: { _iID: 5100050, _iJob: 5100, _iBaseLv: 50, _kAttri: [[101, 3264], [102, 1000], [103, 111], [104, 111], [105, 80], [106, 80], [107, 202], [108, 100]] },
    5200050: { _iID: 5200050, _iJob: 5200, _iBaseLv: 50, _kAttri: [[101, 3264], [102, 1000], [103, 111], [104, 111], [105, 80], [106, 80], [107, 202], [108, 100]] },
    1100080: { _iID: 1100080, _iJob: 1100, _iBaseLv: 80, _kAttri: [[101, 8448], [102, 1600], [103, 173], [104, 173], [105, 160], [106, 160], [107, 620], [108, 160]] },
    2100080: { _iID: 2100080, _iJob: 2100, _iBaseLv: 80, _kAttri: [[101, 6528], [102, 1600], [103, 221], [104, 221], [105, 160], [106, 160], [107, 620], [108, 160]] },
    3100080: { _iID: 3100080, _iJob: 3100, _iBaseLv: 80, _kAttri: [[101, 6528], [102, 1600], [103, 221], [104, 221], [105, 160], [106, 160], [107, 620], [108, 160]] },
    5100080: { _iID: 5100080, _iJob: 5100, _iBaseLv: 80, _kAttri: [[101, 6528], [102, 1600], [103, 221], [104, 221], [105, 160], [106, 160], [107, 620], [108, 160]] },
  },

  SkillConfig: {
    // Normal Attacks
    1000001: { _iID: 1000001, name: 'Novice Normal Attack', _iSkillID: 10000, _iLevel: 1, _iMaxLevel: 1, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 1, _iSkillHit: 0, _iSkillCri: 10000, _iCD: 0, _iActionTime: 1000, _iActionTimeInfluence: 100, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [5000], _kDamageParam2: [10], _kScriptLogic: 'Attack' },
    1100001: { _iID: 1100001, name: 'Swordman Normal Attack', _iSkillID: 11000, _iLevel: 1, _iMaxLevel: 1, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 1, _iSkillHit: 0, _iSkillCri: 10000, _iCD: 0, _iActionTime: 1000, _iActionTimeInfluence: 100, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [5000], _kDamageParam2: [0], _kScriptLogic: 'AttackSword' },
    1200001: { _iID: 1200001, name: 'Mage Normal Attack', _iSkillID: 12000, _iLevel: 1, _iMaxLevel: 1, _iMode: 0, _iBasicType: 1, _iDmgType: 2, _iEleType: 1, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 0, _iCD: 0, _iActionTime: 1000, _iActionTimeInfluence: 100, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [5000], _kDamageParam2: [0], _kScriptLogic: 'MageAttack' },
    1300001: { _iID: 1300001, name: 'Archer Normal Attack', _iSkillID: 13000, _iLevel: 1, _iMaxLevel: 1, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 2, _iSkillHit: 0, _iSkillCri: 10000, _iCD: 0, _iActionTime: 1000, _iActionTimeInfluence: 100, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [5000], _kDamageParam2: [0], _kScriptLogic: 'HunterAttack' },
    1500001: { _iID: 1500001, name: 'Thief Normal Attack', _iSkillID: 15000, _iLevel: 1, _iMaxLevel: 1, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 1, _iSkillHit: 0, _iSkillCri: 10000, _iCD: 0, _iActionTime: 1000, _iActionTimeInfluence: 100, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [5000], _kDamageParam2: [0], _kScriptLogic: 'ThiefAttack' },
    // Swordman / Knight Skills
    1100101: { _iID: 1100101, name: 'Bash Lv1', _iSkillID: 11001, _iLevel: 1, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 1, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 0, _iActionTime: 1000, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [4600], _kDamageParam2: [26], _kCost: [[1, 2001, 0, 0]], _kScriptLogic: 'Bash' },
    1100110: { _iID: 1100110, name: 'Bash Lv10', _iSkillID: 11001, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 1, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 0, _iActionTime: 1000, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [5500], _kDamageParam2: [35], _kCost: [[1, 2001, 0, 0]], _kScriptLogic: 'Bash' },
    1100210: { _iID: 1100210, name: 'Magnum Break Lv10', _iSkillID: 11002, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 4, _iDistanceType: 1, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 8000, _iActionTime: 500, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [6000], _kDamageParam2: [50], _kBuff1: [[1100210, 10000, 8000]], _kCost: [[1, 2001, 0, 12]], _kScriptLogic: 'Magnum_Break' },
    1110410: { _iID: 1110410, name: 'Bowling Bash Lv10', _iSkillID: 11104, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 1, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 10000, _iActionTime: 500, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [18000], _kDamageParam2: [300], _kScriptLogic: 'Bowling_Bash' },
    1110810: { _iID: 1110810, name: 'Brandish Spear Lv10', _iSkillID: 11108, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 0, _iActionTime: 1000, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [6500], _kDamageParam2: [25], _kScriptLogic: 'Brandish_Spear' },
    1110910: { _iID: 1110910, name: 'Spear Stab Lv10', _iSkillID: 11109, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 10000, _iActionTime: 500, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [8000], _kDamageParam2: [100], _kScriptLogic: 'Spear_Stab' },
    1120110: { _iID: 1120110, name: 'Aura Blade Lv10', _iSkillID: 11201, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 0, _iEleType: 0, _iDistanceType: 0, _iSkillHit: 10000, _iSkillCri: 0, _iCD: 5000, _iActionTime: 500, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [], _kDamageParam2: [], _kBuff1: [[1120110, 10000, 120000]], _kCost: [[1, 2001, 0, 20]], _kScriptLogic: 'AuraBlade' },
    1120210: { _iID: 1120210, name: 'Traumatic Blow Lv10', _iSkillID: 11202, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 10000, _iActionTime: 500, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [20000], _kDamageParam2: [300], _kScriptLogic: 'TraumaticBlow' },
    // Mage / Wizard Skills
    1200401: { _iID: 1200401, name: 'Fire Bolt Lv1', _iSkillID: 12004, _iLevel: 1, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 2, _iEleType: 4, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 500, _iActionTime: 500, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 1000, _kDamageParam1: [5500], _kDamageParam2: [91], _kScriptLogic: 'Fire_Bolt' },
    1200410: { _iID: 1200410, name: 'Fire Bolt Lv10', _iSkillID: 12004, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 2, _iEleType: 4, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 500, _iActionTime: 500, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 1000, _kDamageParam1: [10000], _kDamageParam2: [100], _kScriptLogic: 'Fire_Bolt' },
    1201010: { _iID: 1201010, name: 'Fire Wall Lv10', _iSkillID: 12010, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 2, _iEleType: 4, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 10000, _iActionTime: 420, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 840, _kDamageParam1: [4000], _kDamageParam2: [20], _kLogicData: [1200004, 200, 5000], _kScriptLogic: 'Fire_Wall' },
    1201210: { _iID: 1201210, name: 'Fire Ball Lv10', _iSkillID: 12012, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 2, _iEleType: 4, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 5000, _iActionTime: 300, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 600, _kDamageParam1: [15000], _kDamageParam2: [200], _kScriptLogic: 'FireBall' },
    1210210: { _iID: 1210210, name: 'Jupitel Thunder Lv10', _iSkillID: 12102, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 2, _iEleType: 2, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 10000, _iActionTime: 420, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 840, _kDamageParam1: [15000], _kDamageParam2: [100], _kScriptLogic: 'Jupitel_Thunder' },
    1210810: { _iID: 1210810, name: 'Storm Gust Lv10', _iSkillID: 12108, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 2, _iEleType: 5, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 8000, _iActionTime: 420, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 840, _kDamageParam1: [1000], _kDamageParam2: [130], _kLogicData: [1200008, 500, 4500], _kScriptLogic: 'Storm_Gust' },
    1220910: { _iID: 1220910, name: 'Wizard Passive Lv10', _iSkillID: 12209, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 0, _kAttri: [[1021, 1000], [104, 10]] },
    // Archer / Hunter Skills
    1300110: { _iID: 1300110, name: 'Owl Eye Lv10', _iSkillID: 13001, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 0, _kAttri: [[103, 10], [5, 5]] },
    1300210: { _iID: 1300210, name: 'Vulture Eye Lv10', _iSkillID: 13002, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 0, _kAttri: [[103, 10], [2, 5], [114, 10]] },
    1300310: { _iID: 1300310, name: 'Double Strafe Lv10', _iSkillID: 13003, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 0, _iActionTime: 800, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [10000], _kDamageParam2: [75], _kScriptLogic: 'DoubleStrafe' },
    1300410: { _iID: 1300410, name: 'Arrow Shower Lv10', _iSkillID: 13004, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 5000, _iActionTime: 870, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [6500], _kDamageParam2: [85], _kScriptLogic: 'ArrowShower' },
    1300610: { _iID: 1300610, name: 'Attention Concentrate Lv10', _iSkillID: 13006, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 0, _iEleType: 0, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 0, _iCD: 10000, _iActionTime: 500, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [], _kDamageParam2: [], _kBuff1: [[1300210, 10000, 120000]], _kScriptLogic: 'XinShenNingJu' },
    1320210: { _iID: 1320210, name: 'Falcon Assault Lv10', _iSkillID: 13202, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 10000, _iActionTime: 500, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [14000], _kDamageParam2: [160], _kScriptLogic: 'FalconAssault' },
    1320410: { _iID: 1320410, name: 'Focused Arrow Strike Lv10', _iSkillID: 13204, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 0, _iActionTime: 1500, _iActionTimeInfluence: 100, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [5500], _kDamageParam2: [55], _kScriptLogic: 'RuiLiSheJi' },
    // Thief / Assassin Skills
    1500110: { _iID: 1500110, name: 'Improve Dodge Lv10', _iSkillID: 15001, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 0, _kAttri: [[110, 20], [1131, 500], [1033, 10]] },
    1500510: { _iID: 1500510, name: 'Envenom Lv10', _iSkillID: 15005, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 6, _iDistanceType: 1, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 5000, _iActionTime: 1000, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [8000], _kDamageParam2: [110], _kScriptLogic: 'Envenom' },
    1510210: { _iID: 1510210, name: 'Sonic Blow Lv10', _iSkillID: 15102, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 1, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 0, _iActionTime: 1200, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [8500], _kDamageParam2: [50], _kScriptLogic: 'SonicBlow' },
    1510910: { _iID: 1510910, name: 'Grimtooth Lv10', _iSkillID: 15109, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 1, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 8000, _iActionTime: 500, _iActionTimeInfluence: 0, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [10000], _kDamageParam2: [150], _kScriptLogic: 'Grimtooth' },
    1522210: { _iID: 1522210, name: 'Cross Impact Lv10', _iSkillID: 15222, _iLevel: 10, _iMaxLevel: 10, _iMode: 0, _iBasicType: 1, _iDmgType: 1, _iEleType: 1, _iDistanceType: 1, _iSkillHit: 10000, _iSkillCri: 10000, _iCD: 0, _iActionTime: 500, _iActionTimeInfluence: 100, _iChantFix: 0, _iChantVar: 0, _kDamageParam1: [20000], _kDamageParam2: [56], _kScriptLogic: 'shizizhan' },
  },

  BuffConfig: {
    1100301: { _iID: 1100301, _iBuffID: 11003, _iTime: 10000, _iStackType: 4, _iMaxStack: 1, _kChangeAttri: [], _kSkillAttributeList: [[0, 11001, 29, 5, 500]] },
    1100210: { _iID: 1100210, _iBuffID: 11002, _iTime: 8000, _iStackType: 4, _iMaxStack: 1, _kChangeAttri: [[304, 500]], _kSkillAttributeList: [] },
    1120110: { _iID: 1120110, _iBuffID: 11201, _iTime: 120000, _iStackType: 4, _iMaxStack: 1, _kChangeAttri: [], _kSkillAttributeList: [[0, 11000, 29, 5, 1500]] },
    1246101: { _iID: 1246101, _iBuffID: 12461, _iTime: 10000, _iStackType: 4, _iMaxStack: 1, _kChangeAttri: [], _kSkillAttributeList: [[0, 12201, 29, 1, 500, -1], [0, 12201, 30, 1, 10, -1]] },
    1300210: { _iID: 1300210, _iBuffID: 13002, _iTime: 120000, _iStackType: 4, _iMaxStack: 1, _kChangeAttri: [[2, 6], [5, 11]], _kSkillAttributeList: [] },
    1400110: { _iID: 1400110, _iBuffID: 14001, _iTime: 120000, _iStackType: 5, _iMaxStack: 1, _kChangeAttri: [[1, 10], [5, 10], [4, 10]], _kSkillAttributeList: [] },
    1401010: { _iID: 1401010, _iBuffID: 14010, _iTime: 120000, _iStackType: 4, _iMaxStack: 1, _kChangeAttri: [[2, 5], [1131, 500], [1141, 1000]], _kSkillAttributeList: [] },
    1410610: { _iID: 1410610, _iBuffID: 14106, _iTime: 120000, _iStackType: 4, _iMaxStack: 1, _kChangeAttri: [[6, 10]], _kSkillAttributeList: [] },
    1610610: { _iID: 1610610, _iBuffID: 16106, _iTime: 600000, _iStackType: 5, _iMaxStack: 1, _kChangeAttri: [[1033, 10]], _kSkillAttributeList: [] },
    2500101: { _iID: 2500101, _iBuffID: 25001, _iTime: 0, _iStackType: 4, _iMaxStack: 1, _kChangeAttri: [], _kBuffCategory: [4010, 4013, 4017], _kLogicData: [5000] },
    2500201: { _iID: 2500201, _iBuffID: 25002, _iTime: 0, _iStackType: 4, _iMaxStack: 1, _kChangeAttri: [], _kBuffCategory: [4010, 4012, 4017], _kLogicData: [5000] },
    2500301: { _iID: 2500301, _iBuffID: 25003, _iTime: 0, _iStackType: 7, _iMaxStack: 2, _kChangeAttri: [[1032, 200]], _kBuffCategory: [4001, 4003, 4006, 4007, 23] },
    2500401: { _iID: 2500401, _iBuffID: 25004, _iTime: 0, _iStackType: 7, _iMaxStack: 2, _kChangeAttri: [[1042, 200]], _kBuffCategory: [4001, 4002, 4006, 4007, 23] },
    2500501: { _iID: 2500501, _iBuffID: 25005, _iTime: 0, _iStackType: 4, _iMaxStack: 1, _kChangeAttri: [], _kBuffCategory: [4010, 4013, 4017], _kLogicData: [5000] },
    2500601: { _iID: 2500601, _iBuffID: 25006, _iTime: 0, _iStackType: 4, _iMaxStack: 1, _kChangeAttri: [], _kBuffCategory: [4010, 4012, 4017], _kLogicData: [5000] },
    2500701: { _iID: 2500701, _iBuffID: 25007, _iTime: 0, _iStackType: 7, _iMaxStack: 2, _kChangeAttri: [[211, 200]], _kBuffCategory: [4001, 4003, 4006, 4007, 23] },
    2500801: { _iID: 2500801, _iBuffID: 25008, _iTime: 0, _iStackType: 7, _iMaxStack: 2, _kChangeAttri: [[213, 200]], _kBuffCategory: [4001, 4002, 4006, 4007, 23] },
    2503001: { _iID: 2503001, _iBuffID: 25030, _iTime: 0, _iStackType: 0, _iMaxStack: 1, _kChangeAttri: [], _kBuffCategory: [4010, 4012], _kLogicData: [30, 213, 700] },
    2514301: { _iID: 2514301, _iBuffID: 25143, _iTime: 0, _iStackType: 0, _iMaxStack: 1, _kChangeAttri: [], _kBuffCategory: [4010, 4013], _kLogicData: [30, 211, 700] },
    2504001: { _iID: 2504001, _iBuffID: 25040, _iTime: 0, _iStackType: 0, _iMaxStack: 1, _kChangeAttri: [], _kBuffCategory: [4010, 4012], _kLogicData: [1500, 2504001], _kDescData: [15, 110, 5] },
    2515701: { _iID: 2515701, _iBuffID: 25157, _iTime: 0, _iStackType: 0, _iMaxStack: 1, _kChangeAttri: [], _kBuffCategory: [4010, 4013], _kLogicData: [1500, 2515701], _kDescData: [15, 110, 5] },
  },

  SpecialEffectConfig: {
    1: { _iID: 1, _iGroupID: 1, _kSpecialEffect: [[1, 1, 10]], _iPower: 100 },
    10010401: { _iID: 10010401, _iGroupID: 0, _kSpecialEffect: [[5, 1, 103, 2]], _iPower: 220 },
    10010404: { _iID: 10010404, _iGroupID: 0, _kSpecialEffect: [[4, 1, 10, 103, 3]], _iPower: 350 },
    10010505: { _iID: 10010505, _iGroupID: 0, _kSpecialEffect: [[5, 1, 209, 25]], _iPower: 350 },
    10020402: { _iID: 10020402, _iGroupID: 0, _kSpecialEffect: [[8, 104, 100, 1033, 1, 160]], _iPower: 350 },
    10020404: { _iID: 10020404, _iGroupID: 0, _kSpecialEffect: [[14, 103, 104, 10, 1013, 4, 4000]], _iPower: 350 },
    12400001: { _iID: 12400001, _iGroupID: 0, _kSpecialEffect: [[2, 2500201]], _iPower: 0 },
    12300007: { _iID: 12300007, _iGroupID: 0, _kSpecialEffect: [[10, 2, 1, 8000, 1043, 2, 20000]], _iPower: 0 },
    12400012: { _iID: 12400012, _iGroupID: 0, _kSpecialEffect: [[18, 4002, 1]], _iPower: 0 },
    12400011: { _iID: 12400011, _iGroupID: 0, _kSpecialEffect: [[1, 213, 100], [12, 1, 4002, 2, 1, 50, 5, 1]], _iPower: 0 },
    12400018: { _iID: 12400018, _iGroupID: 0, _kSpecialEffect: [[1, 216, 100], [12, 1, 4005, 2, 1, 50, 5, 1]], _iPower: 0 },
    12400021: { _iID: 12400021, _iGroupID: 0, _kSpecialEffect: [[1, 207, 100], [12, 1, 4004, 2, 1, 50, 5, 1]], _iPower: 0 },
    12400015: { _iID: 12400015, _iGroupID: 0, _kSpecialEffect: [[1, 229, 100], [12, 1, 4003, 2, 1, 50, 6, 1]], _iPower: 0 },
  },

  TotemSkillConfig: {
    10051001: { _iID: 10051001, _kBasicAttribute: [], _kSpecialAttribute: [12400001], _iSuperiorSkillID: 0, _iIsCoexist: 1, _iPower: 1500 },
    10052017: { _iID: 10052017, _kBasicAttribute: [], _kSpecialAttribute: [12300007], _iSuperiorSkillID: 10053017, _iIsCoexist: 0, _iPower: 1000 },
    10053001: { _iID: 10053001, _kBasicAttribute: [], _kSpecialAttribute: [12400012], _iSuperiorSkillID: 0, _iIsCoexist: 0, _iPower: 1250 },
    10053005: { _iID: 10053005, _kBasicAttribute: [], _kSpecialAttribute: [12400011], _iSuperiorSkillID: 0, _iIsCoexist: 0, _iPower: 1250 },
    10053010: { _iID: 10053010, _kBasicAttribute: [], _kSpecialAttribute: [12400018], _iSuperiorSkillID: 0, _iIsCoexist: 0, _iPower: 1250 },
    10053012: { _iID: 10053012, _kBasicAttribute: [], _kSpecialAttribute: [12400021], _iSuperiorSkillID: 0, _iIsCoexist: 0, _iPower: 1250 },
  },

  Monsters: {
    poring: { npcId: 5000001, name: 'Poring', level: 5, maxHp: 65, atk: 9, matk: 9, def: 100, mdef: 100, hit: 6, flee: 5, resCri: 0, element: 5, race: 4, size: 2 },
    chonchon: { npcId: 5000005, name: 'Chonchon', level: 21, maxHp: 447, atk: 140, matk: 140, def: 420, mdef: 420, hit: 22, flee: 21, resCri: 0, element: 2, race: 9, size: 1 },
    maya: { npcId: 5300006, name: 'Maya (Story L30)', level: 30, maxHp: 31458, atk: 143, matk: 143, def: 600, mdef: 600, hit: 31, flee: 30, resCri: 0, element: 4, race: 1, size: 3 },
    baphomet: { npcId: 5300003, name: 'Baphomet (Story L40)', level: 40, maxHp: 41258, atk: 236, matk: 236, def: 800, mdef: 800, hit: 41, flee: 40, resCri: 0, element: 4, race: 1, size: 3 },
    pharaoh: { npcId: 5300010, name: 'Pharaoh (Story L45)', level: 45, maxHp: 45536, atk: 260, matk: 260, def: 900, mdef: 900, hit: 46, flee: 45, resCri: 0, element: 3, race: 1, size: 2 },
    orc_hero: { npcId: 5020004, name: 'Orc Hero (MVP L48)', level: 48, maxHp: 23686236, atk: 3418, matk: 3418, def: 960, mdef: 960, hit: 49, flee: 48, resCri: 0, element: 3, race: 2, size: 3 },
    eddga: { npcId: 5020009, name: 'Eddga (MVP L59)', level: 59, maxHp: 90482296, atk: 11751, matk: 11751, def: 1180, mdef: 1180, hit: 60, flee: 59, resCri: 0, element: 4, race: 1, size: 3 },
    baphomet_mvp: { npcId: 5020013, name: 'Baphomet (MVP L83)', level: 83, maxHp: 210948480, atk: 31627, matk: 31627, def: 1660, mdef: 1660, hit: 84, flee: 83, resCri: 0, element: 8, race: 3, size: 3 },
  },
};

const GLOBAL_TABLE_CACHE = new Map();

export class Ro3DataStore {
  constructor(configDir = DEFAULT_CONFIG_DIR) {
    this.configDir = configDir;
    this.usingExportedJson = Boolean(configDir && fs.existsSync(configDir));
  }

  table(name) {
    const cacheKey = `${this.usingExportedJson ? this.configDir : 'fallback'}::${name}`;
    if (GLOBAL_TABLE_CACHE.has(cacheKey)) return GLOBAL_TABLE_CACHE.get(cacheKey);
    let loaded = FALLBACK_TABLES[name] ? structuredClone(FALLBACK_TABLES[name]) : {};
    // SkillTiming is not part of the server's config export: it comes from the template digest next to this file.
    const file = name === 'SkillTiming' ? DEFAULT_TIMING_FILE : this.usingExportedJson ? path.join(this.configDir, `${name}.json`) : '';
    if (file && fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(parsed)) {
        for (let idx = 0; idx < parsed.length; idx++) {
          const r = parsed[idx];
          const k = r && r._iID != null ? String(r._iID) : String(idx + 1);
          loaded[k] = { ...loaded[k], ...r };
        }
      } else if (parsed && typeof parsed === 'object') {
        for (const [k, r] of Object.entries(parsed)) {
          loaded[k] = loaded[k] ? { ...loaded[k], ...r } : r;
        }
      }
    }
    GLOBAL_TABLE_CACHE.set(cacheKey, loaded);
    return loaded;
  }

  row(tableName, id) {
    const tbl = this.table(tableName);
    return tbl[String(id)] ?? tbl[Number(id)] ?? null;
  }
}

/** Same fallback + overlay merge as Ro3DataStore, but over in-memory `{ TableName: { id: row } }` (browser build). */
export class Ro3MemoryDataStore extends Ro3DataStore {
  constructor(tables) {
    super(null);
    this.tables = tables;
    this.usingExportedJson = true;
    this.cache = new Map();
  }

  table(name) {
    if (this.cache.has(name)) return this.cache.get(name);
    const loaded = FALLBACK_TABLES[name] ? structuredClone(FALLBACK_TABLES[name]) : {};
    for (const [k, r] of Object.entries(this.tables[name] ?? {})) loaded[k] = loaded[k] ? { ...loaded[k], ...r } : r;
    this.cache.set(name, loaded);
    return loaded;
  }
}

// ============================================================================
// 2. Stat Point Costs & Character Attribute Pipeline (`StatCalculator.cs`)
// ============================================================================

export const STARTING_STAT_POINTS = 48;
export const MAX_STAT = 99;

export function totalStatPoints(level, bonusPoints = 0, data = new Ro3DataStore()) {
  let sum = STARTING_STAT_POINTS + bonusPoints;
  for (let lv = 2; lv <= level; lv++) {
    const row = data.row('BaseLvConfig', lv);
    sum += row ? Number(row._iStatusPoint || 0) : 0;
  }
  return sum;
}

export function statCost(value, data = new Ro3DataStore()) {
  const v = Math.max(1, Math.min(MAX_STAT, Math.trunc(value)));
  let sum = 0;
  for (let k = 2; k <= v; k++) {
    const row = data.row('BasePointConfig', k);
    sum += row ? Number(row._iStatusPoint || 0) : (k <= 12 ? 2 : k <= 22 ? 3 : 4);
  }
  return sum;
}

export function usedStatPoints(stats6, data = new Ro3DataStore()) {
  return stats6.reduce((acc, v) => acc + statCost(v, data), 0);
}

/**
 * Exact implementation of `StatCalculator.Compute(raw, data)` from `StatCalculator.cs`.
 * final = B1 * (1 + B2 + B6) * (1 + B4) + B3
 * Integer roots (dt == 0) use Math.ceil(final - 1e-6); scaled roots (dt == 1 or 2) use Math.round(unscale(final)).
 */
export function computeStatSheet(raw, data = new Ro3DataStore()) {
  const sheet = { data: {}, base: {} };
  const groups = new Map();

  const dataType = (id) => {
    const row = data.row('AttributeConfig', id);
    return row ? Number(row._iDataType || 0) : 0;
  };
  const scale = (dt, v) => (dt === 1 ? v / 10000 : dt === 2 ? v / 100 : v);
  const unscale = (dt, v) => (dt === 1 ? v * 10000 : dt === 2 ? v * 100 : v);

  for (const [key, val] of Object.entries(raw)) {
    const id = Number(key);
    const value = Number(val || 0);
    const row = data.row('AttributeConfig', id);
    const root = row ? Number(row._iPreAttri || 0) : 0;
    if (!row || root === 0) {
      sheet.data[id] = Math.round(value);
      sheet.base[id] = Math.floor(value);
      continue;
    }
    let calc = Number(row._iCalculateType || 1);
    if (calc < 1 || calc > 6 || calc === 5) calc = 1;
    let b = groups.get(root);
    if (!b) {
      b = [0, 0, 0, 0, 0, 0, 0];
      groups.set(root, b);
    }
    b[calc] += scale(dataType(id), value);
    if (id !== root) {
      sheet.data[id] = Math.floor(value);
      sheet.base[id] = Math.floor(value);
    }
  }

  for (const [root, b] of groups.entries()) {
    const finalVal = b[1] * (1 + b[2] + b[6]) * (1 + b[4]) + b[3];
    const dt = dataType(root);
    sheet.data[root] = dt === 0 ? Math.ceil(finalVal - 1e-6) : Math.round(unscale(dt, finalVal));
    sheet.base[root] = Math.floor(Number(raw[root] || 0));
  }

  return new Proxy(sheet, {
    get(target, prop) {
      if (prop in target) return target[prop];
      const num = Number(prop);
      if (!Number.isNaN(num)) return target.data[num] ?? 0;
      return undefined;
    },
  });
}

/**
 * Equipment Resonance (`CharacterService.Equipment.cs` ResonanceRow): the highest row of RefiningEffectTable / StrengthenEffectTable
 * whose `_kRequest` [grids, level] holds, i.e. at least `grids` of the 7 equipment grids are at `level` or more, adds its `_kEffect`.
 * `refine` / `enhance` are the level every grid has reached. Returns the rows reached and their attributes.
 */
export function resonanceEffects(refine = 0, enhance = 0, data = new Ro3DataStore()) {
  const tier = (table, level) => Object.values(data.table(table)).filter((r) => Number(r._kRequest?.[1]) <= level).sort((a, b) => b._iEffectLev - a._iEffectLev)[0] ?? null;
  const rows = { refine: tier('RefiningEffectTable', refine), enhance: tier('StrengthenEffectTable', enhance) };
  return { ...rows, attrs: [...asPairs(rows.refine?._kEffect), ...asPairs(rows.enhance?._kEffect)] };
}

/**
 * Cards. `build.cards` lists the cards in the sockets: [{ id, star, level, flash }], `id` the card's item id, `star` 0-3 its advancement
 * (the CardConfig tier) and `level` 0..the star's cap (5 / 10 / 15 / 15; a missing star or level means the maximum). A card gives the
 * basic attributes of its star plus the attributes of its level (CardUpgradeConfig by slot part and quality: P.ATK + M.ATK for weapon,
 * off-hand, accessory and mouth cards, HP for the others), like `CharacterService.EntityData`. A unique card (`_iIfSameCard`: the MVP
 * and shadow cards) counts once however often it is slotted. `flash` marks the Collection version of a purple, gold or red card (made by
 * Collection synthesis: "ornate card art and slightly enhanced effects"): it adds the card's `_kFlashAttribute` ("Collection
 * attributes" on the wiki: Crit DMG, Damage Increase and Bonus ATK for weapon and accessory cards, the defensive twins for the rest).
 * The server ignores the special effects (`_kSkillAttribute`) and the Collection attributes; these effects are modeled here:
 *   op 8  "Every 1 HIT increases Physical damage by 0.01%, up to 8.5%" (Phreeoni): the HIT conversion an equipment stunt has
 *   op 2  Drake's flat or Shadow Drake's chance-based damage against all sizes, applied in combat, not added to the panel's size stats
 * Both Drake variants make all offensive size bonuses eligible. Shadow's text separates size-ignore from its chance-based extra damage.
 * Proc effects (stun, curse, autocast skills), revive, reflect, "damage against all Orcs" and the like are not simulated.
 * `cardParts` splits one card into what the wiki lists separately (basic attributes of the star, the level bonus, the effect ids, the
 * Collection attributes); `cardEffects` adds their panel attributes, conversions and separate combat size modifiers.
 */
export const CARD_BUFFS = { 20500: [501, 503, 505], 20501: [501, 503, 505] };
// A table's rows by key (one key per table), built once: tableIndex = the row of a key, tableGroups = every row of a key, in table order.
const TABLE_INDEX = new WeakMap();
const tableIndex = (data, table, key) => {
  const rows = data.table(table);
  if (!TABLE_INDEX.has(rows)) TABLE_INDEX.set(rows, new Map(Object.values(rows).map((r) => [key(r), r])));
  return TABLE_INDEX.get(rows);
};
const TABLE_GROUPS = new WeakMap();
const tableGroups = (data, table, key) => {
  const rows = data.table(table);
  if (!TABLE_GROUPS.has(rows)) {
    const groups = new Map();
    for (const r of Object.values(rows)) groups.set(key(r), [...(groups.get(key(r)) ?? []), r]);
    TABLE_GROUPS.set(rows, groups);
  }
  return TABLE_GROUPS.get(rows);
};
export const cardTier = (data, id, star) => tableIndex(data, 'CardConfig', (r) => `${r._iCardID}:${r._iTier}`).get(`${id}:${star}`);
// Panel attributes, conversions and combat size modifiers of a card's special effects (`_kSkillAttribute` ids).
function cardEffectParts(effectIds, data) {
  const out = { attrs: [], stunts: [], sizeBonusBp: 0, sizeProc: null, ignoreSize: false };
  for (const fx of effectIds) {
    for (const op of asArray(data.row('SpecialEffectConfig', fx)?._kSpecialEffect)) {
      const family = Math.floor(op[1] / 100);
      if (op[0] === 8) out.stunts.push({ _kSpecialEffect: [op] });
      else if (op[0] === 2 && CARD_BUFFS[family]) {
        const logic = asArray(data.row('BuffConfig', op[1])?._kLogicData);
        const proc = family === 20500;
        if (logic.length !== (proc ? 2 : 1) || !logic.every((v) => Number.isFinite(v) && v >= 0) || (proc && logic[0] > 10000)) {
          throw new Error(`Invalid Drake buff parameters: ${op[1]}`);
        }
        out.ignoreSize = true;
        if (proc) out.sizeProc = { chanceBp: logic[0], bonusBp: logic[1] };
        else out.sizeBonusBp += logic[0];
      }
    }
  }
  return out;
}
export function cardParts(c, data = new Ro3DataStore()) {
  const item = c?.id ? data.row('ItemConfig', c.id) : null;
  const star = Math.max(0, Math.min(3, Math.trunc(c?.star ?? 3) || 0));
  const tier = item && cardTier(data, item._iID, star);
  if (!tier) return null;
  const level = Math.max(0, Math.min(tier._iLevel || 15, Math.trunc(c.level ?? 15) || 0));
  const upgrade = tableIndex(data, 'CardUpgradeConfig', (r) => `${r._iParts}:${r._iQuality}:${r._iLevel}`).get(`${item._iCardPart}:${item._iQuality}:${level}`);
  const collectionAttrs = asArray(tier._kFlashAttribute).flatMap((fx) => asArray(data.row('SpecialEffectConfig', fx)?._kSpecialEffect)
    .filter((op) => op.length === 3 && op[0] === 1).map(([, a, v]) => [a, v]));
  const effects = asArray(tier._kSkillAttribute);
  return { item, star, level, base: asPairs(tier._kBasicAttribute), levelAttrs: asPairs(upgrade?._iAttr), effects, modeled: cardEffectParts(effects, data), collectionAttrs };
}
export function cardEffects(cards, data = new Ro3DataStore()) {
  const out = { attrs: [], stunts: [], sizeBonusBp: 0, sizeProc: null, ignoreSize: false };
  const seen = new Set();
  for (const c of asArray(cards)) {
    const p = cardParts(c, data);
    if (!p || (p.item._iIfSameCard && seen.has(p.item._iID))) continue;
    seen.add(p.item._iID);
    out.attrs.push(...p.base, ...p.levelAttrs, ...(c.flash ? p.collectionAttrs : []), ...p.modeled.attrs);
    out.stunts.push(...p.modeled.stunts);
    out.sizeBonusBp += p.modeled.sizeBonusBp;
    out.ignoreSize ||= p.modeled.ignoreSize;
    // ponytail: only unique Shadow Drake has this proc; use independent proc states if another proc card is added.
    out.sizeProc = p.modeled.sizeProc ?? out.sizeProc;
  }
  return out;
}
/**
 * What the sheet adds against this target (`defender.element / race / size`), in basis points: "Damage to <element> Monsters" (321-330),
 * "Damage to <race> Race" (401-410) and "DMG vs Small / Medium / Large Enemies" (501 / 503 / 505). Without the target's element, race or
 * size that part is 0 (321 + 0 would be a different attribute). Either Drake enables all three offensive size attributes; its own flat or
 * chance-based combat bonus is separate from the panel's size attributes. Race and element conditions are unchanged.
 */
export function targetBonus(stats, defender, sizeBonusBp = 0, ignoreSize = false) {
  const [e, r, s] = [Number(defender.element), Number(defender.race), Number(defender.size)];
  return (Number.isInteger(e) && e >= 1 && e <= 10 ? stats[320 + e] : 0)
    + (Number.isInteger(r) && r >= 1 && r <= 10 ? stats[400 + r] : 0)
    + (Number.isInteger(s) && s >= 1 && s <= 3 ? (ignoreSize ? stats[501] + stats[503] + stats[505] : stats[499 + 2 * s]) + sizeBonusBp : 0);
}

// An entry's value at a roll position (0-10000): uniform whole numbers from min to max, like the server's draw.
export const affixValue = (min, max, ratio) => min + Math.min(max - min, Math.floor((ratio * (max - min + 1)) / 10000));
/**
 * Gear: tier 5-7 equipment. `build.gear` lists the worn items, one per equipment grid (1 weapon, 2 off-hand, 3 armor, 4 cloak, 5 shoes,
 * 6 and 7 accessories): [{ grid, id, roll, affixes, stunts, refine, enhance }].
 *   id       the item (ItemConfig; its `_iEquipId` joins EquipConfig, `_iRank` is the tier)
 *   roll     0-10000, where in its range the item rolled: the server draws one ratio per base attribute (EquipAttriRandom, by quality) and
 *            gives min + (max - min) * ratio / 10000; the random entries roll uniformly in their range, at the same position here
 *   affixes  the attributes of the random entries (STR..LUK of the item's EquipAttriGroupConfig pool): as many as EquipEntryRandom gives
 *            the quality (Purple 1, Gold up to 2, Red 2; Blue none), none twice
 *   stunts   one SpecialEffectConfig id per stunt pool of the item (`_kSpecial`: a common pool and a rare one); fixed stunts come with it
 *   refine / enhance  the levels of the grid (RefiningTable / StrengthenTable hold the totals at a level, counted for a worn grid)
 *   offRefine / offEnhance  on a two-handed weapon: the levels of the off-hand grid. The client lists such a weapon in both weapon grids and lets you
 *            strengthen and refine either (Equipment resonance needs all 7 grids), so its levels count too: Max HP only, as the off-hand rows hold nothing else
 * Stunts take the stunts path of buildCharacterStats: per refine of their grid (op 5), per stunt on the gear (op 4, all grids together)
 * and the conversions (ops 8 and 14). Effects that give no stat (revive, evade, potion boost) count as stunts but add nothing; the
 * `[1, 103, 1]` rows that stand in for them must not become +1 P.ATK. A weapon listed here replaces `weaponRefine` / `weaponStrengthen`.
 * `gearParts` is one item broken down the way the Gear window shows it, `gearEffects` the whole set as { attrs, stunts, count, grids }.
 */
export function gearParts(g, data = new Ro3DataStore()) {
  const item = g?.id ? data.row('ItemConfig', g.id) : null;
  const eq = item?._iEquipId ? data.row('EquipConfig', item._iEquipId) : null;
  if (!eq) return null;
  const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v)) || 0));
  const [grid, ratio, refine, enhance] = [int(g.grid, 0, 99), int(g.roll ?? 5000, 0, 10000), int(g.refine, 0, 99), int(g.enhance, 0, 999)];
  const base = asPairs(eq._kBasicAttribute).map(([attr, min, max = min]) => ({ attr, min, max, value: min + Math.trunc(((max - min) * ratio) / 10000) }));
  const entries = Number(eq._iEntries);
  const pool = entries > 0 ? (tableGroups(data, 'EquipAttriGroupConfig', (r) => r._iGroup).get(entries) ?? []).filter((r) => r._iWeight > 0 && r._iAttriID > 0 && r._iMax >= r._iMin) : [];
  const slots = pool.length ? Math.max(0, ...Object.values(data.table('EquipEntryRandom')).filter((r) => r._iQuality === item._iQuality && r._iWeight > 0).map((r) => r._iNum)) : 0;
  const affixes = [];
  for (const attr of asArray(g.affixes)) {
    const row = pool.find((r) => r._iAttriID === attr);
    if (!row || affixes.length >= slots || affixes.some((a) => a.attr === attr)) continue;
    affixes.push({ attr, min: row._iMin, max: row._iMax, value: affixValue(row._iMin, row._iMax, ratio) });
  }
  const directives = asArray(eq._kSpecial).filter(Array.isArray);
  const pools = directives.map(([group]) => (tableGroups(data, 'EquipSpecialGroupConfig', (r) => r._iGroup).get(group) ?? []).filter((r) => r._iWeight > 0).map((r) => r._iSpecialID));
  // A pool of one that always rolls (chance 10000) is a stunt the item always has
  const stunts = pools.map((p, i) => (p.length === 1 && directives[i][1] >= 10000 ? p[0] : p.includes(asArray(g.stunts)[i]) ? g.stunts[i] : 0));
  const refined = tableIndex(data, 'RefiningTable', (r) => `${r._iEquipType}:${r._iRefiningInterval}`).get(`${grid}:${refine}`);
  const enhanced = tableIndex(data, 'StrengthenTable', (r) => `${r._iEquipType}:${r._iStrengthenInterval}`).get(`${grid}:${enhance}`);
  return {
    item, eq, grid, ratio, rank: eq._iRank, base, fixed: asPairs(eq._kFixedEntries), pool, slots, affixes, pools, chances: directives.map((d) => d[1]), stunts,
    fixedStunts: asArray(eq._kFixedSpecialAttribute), refine, enhance, refineAttrs: asPairs(refined?._kAttr), enhanceAttrs: asPairs(enhanced?._kAttr),
  };
}
// The ops of a gear stunt the sheet can use (see above).
const gearStuntOps = (id, data) => asArray(data.row('SpecialEffectConfig', id)?._kSpecialEffect)
  .filter((op) => (op[0] === 1 ? op.length === 3 && !(op[1] === 103 && op[2] === 1) : [4, 5, 8, 14].includes(op[0])));
export function gearEffects(gear, data = new Ro3DataStore()) {
  const out = { attrs: [], stunts: [], count: 0, grids: new Set() };
  let twoHanded = null;
  for (const g of asArray(gear)) {
    const p = gearParts(g, data);
    if (!p || p.grid < 1 || p.grid > 7 || out.grids.has(p.grid)) continue;
    out.grids.add(p.grid);
    if (p.grid === 1 && p.item._iEquipPart === 1) twoHanded = g;
    out.attrs.push(...p.base.map((b) => [b.attr, b.value]), ...p.fixed, ...p.affixes.map((a) => [a.attr, a.value]), ...p.enhanceAttrs, ...p.refineAttrs);
    for (const id of [...p.fixedStunts, ...p.stunts].filter(Boolean)) {
      out.count++;
      const ops = gearStuntOps(id, data);
      if (ops.length) out.stunts.push({ _kSpecialEffect: ops, refine: p.refine });
    }
  }
  if (twoHanded && !out.grids.has(2)) out.attrs.push(...offHandLevelAttrs(twoHanded.offRefine, twoHanded.offEnhance, data));
  return out;
}
/** The off-hand grid's levels as attributes (StrengthenTable / RefiningTable rows of grid 2): Max HP only. See `offRefine` / `offEnhance` of `gearParts`. */
export function offHandLevelAttrs(refine, enhance, data = new Ro3DataStore()) {
  const at = (table, key, level) => asPairs(tableIndex(data, table, (r) => `${r._iEquipType}:${r[key]}`).get(`2:${Math.max(0, Math.round(Number(level)) || 0)}`)?._kAttr);
  return [...at('StrengthenTable', '_iStrengthenInterval', enhance), ...at('RefiningTable', '_iRefiningInterval', refine)];
}
/** The roll position (0-10000) at or below which a share `p` of the rolls of this quality fall (EquipAttriRandom weights): the Gear window's Low / Mid / High. */
export function rollQuantile(quality, p, data = new Ro3DataStore()) {
  const rows = Object.values(data.table('EquipAttriRandom')).filter((r) => r._iQuality === quality && r._iWeight > 0).sort((a, b) => a._iRatio - b._iRatio);
  const total = rows.reduce((s, r) => s + r._iWeight, 0);
  let sum = 0;
  for (const r of rows) if ((sum += r._iWeight) / total >= p - 1e-9) return r._iRatio;
  return rows.at(-1)?._iRatio ?? 5000;
}

// The weapon Refine +n of `build.weaponRefine` (flat P.ATK and M.ATK); the gear's grids use the RefiningTable instead.
const WEAPON_REFINE_BONUS = [0, 20, 41, 62, 85, 108, 132, 157, 184, 211, 240, 270, 301, 333, 366, 400];
/** The flat P.ATK and M.ATK that `weaponRefine` + `weaponStrengthen` add: what a saved simulator state that kept them as fields stood for. */
export const legacyWeaponFlat = (refine, strengthen) => strengthen * 2 + (WEAPON_REFINE_BONUS[refine] ?? refine * 24);

/**
 * The ASPD cap and what lies above it: "Every 1 excess ASPD is converted to 0.1% Physical ATK (Max: 20%)" past 500% (the tip of AttributeConfig 115, which
 * `node build-ro3-sim.mjs` checks). Basis points of P.ATK % (attribute 1031) per point of excess, and their cap.
 */
export const ASPD_EXCESS = { cap: 500, bpPerPoint: 10, maxBp: 2000 };

/**
 * Computes full character StatSheet matching `CharacterService.Stats(session)` + `EquipmentStunts.ApplyConversions`.
 */
export function buildCharacterStats(build, data = new Ro3DataStore(), skipTotemOp10 = false) {
  const career = build.career ?? 1100;
  const level = build.level ?? 50;
  const raw = {};
  const add = (id, v) => {
    raw[id] = (raw[id] ?? 0) + Number(v || 0);
  };

  const baseStats = [...(build.stats ?? [1, 1, 1, 1, 1, 1])];
  const addPreConversion = (id, v) => {
    const numId = Number(id);
    if (numId >= 1 && numId <= 6) baseStats[numId - 1] += Number(v || 0);
    else add(numId, v);
  };

  // Equipment base + affixes + enchants
  for (const [id, v] of build.equipmentAttrs ?? []) addPreConversion(id, v);
  for (const [id, v] of build.affixAttrs ?? []) addPreConversion(id, v);
  for (const [id, v] of build.enchantAttrs ?? []) addPreConversion(id, v);

  // Cards (see cardEffects); the op 8 conversions of their special effects run with the stunts' below
  const cardFx = cardEffects(build.cards, data);
  for (const [id, v] of cardFx.attrs) addPreConversion(id, v);

  // Gear (see gearEffects): base attributes, entries, grid levels; its stunts count with the stunts below
  const gearFx = gearEffects(build.gear, data);
  for (const [id, v] of gearFx.attrs) addPreConversion(id, v);

  // Pets (see petStats): the stats the deployed and support pets share with you
  for (const [id, v] of petStats(build.pets, build.assistPets, level, data)) addPreConversion(id, v);

  // EquipmentStunts.FlatAttributes (ops 1, 4, 5)
  const stunts = [...(build.stunts ?? []), ...gearFx.stunts, ...cardFx.stunts];
  const totalStuntCount = (build.stunts ?? []).length + gearFx.count;
  for (const st of stunts) {
    const row = typeof st === 'object' && st._kSpecialEffect ? st : data.row('SpecialEffectConfig', st.id ?? st);
    if (!row || !Array.isArray(row._kSpecialEffect)) continue;
    const gridRefine = st.refine ?? build.weaponRefine ?? 0;
    for (const op of row._kSpecialEffect) {
      if (op.length === 3 && op[0] === 1) addPreConversion(op[1], op[2]);
      else if (op.length === 5 && op[0] === 4 && op[1] > 0) {
        addPreConversion(op[3], Math.trunc(Math.min(totalStuntCount, op[2]) / op[1]) * op[4]);
      } else if (op.length === 4 && op[0] === 5 && op[1] > 0) {
        addPreConversion(op[2], Math.trunc(gridRefine / op[1]) * op[3]);
      }
    }
  }

  // Weapon & grid strengthen / refine bonuses (StrengthenTable / RefiningTable); a weapon in `build.gear` brings its own
  if (!gearFx.grids.has(1) && (build.weaponStrengthen ?? 0) > 0) {
    const sLv = build.weaponStrengthen;
    add(103, sLv * 2);
    add(104, sLv * 2);
  }
  if (!gearFx.grids.has(1) && (build.weaponRefine ?? 0) > 0) {
    const rBonus = WEAPON_REFINE_BONUS[build.weaponRefine] ?? build.weaponRefine * 24;
    add(103, rBonus);
    add(104, rBonus);
  }

  // Cards, Emblems, Season Talents, Passive Skills, Season Refine, Mount, Pets, Totems
  for (const [id, v] of build.cardAttrs ?? []) addPreConversion(id, v);
  for (const [id, v] of build.emblemAttrs ?? []) addPreConversion(id, v);
  for (const [id, v] of build.talentAttrs ?? []) addPreConversion(id, v);
  for (const [id, v] of talentEffects(build, data).attrs) addPreConversion(id, v); // the Season Talent tree (see talentEffects)
  for (const skillId of build.passiveSkills ?? []) {
    const sRow = data.row('SkillConfig', skillId);
    if (sRow && Number(sRow._iBasicType) === 0 && Array.isArray(sRow._kAttri)) {
      for (const [id, v] of sRow._kAttri) addPreConversion(id, v);
    }
  }
  for (const [id, v] of build.extraAttrs ?? []) addPreConversion(id, v);
  if (build.resonance) {
    // Every attribute of the reached rows, like the server: Damage Increase and Elemental Counter Ignore reach the damage, Max HP% the
    // sheet's HP; Healing Done, Damage Reduction and Counter Resist are panel numbers.
    for (const [id, v] of resonanceEffects(build.resonance.refine, build.resonance.enhance, data).attrs) addPreConversion(id, v);
  }

  // Deployed Totem attributes (TotemService.Attributes + TotemEffects.Attributes)
  for (const [id, v] of evaluateTotemAttributes(build, data, skipTotemOp10)) {
    addPreConversion(id, v);
  }

  for (let i = 0; i < 6; i++) add(i + 1, baseStats[i]);

  // Active Buffs (BuffService: b.Changes)
  for (const buff of asArray(build.activeBuffs)) {
    const bRow = typeof buff === 'object' && buff._kChangeAttri ? buff : data.row('BuffConfig', buff.id ?? buff);
    const piles = buff.piles ?? 1;
    for (const [id, v] of asPairs(bRow?._kChangeAttri)) {
      add(id, v * piles);
      // ponytail: STR..LUK from a buff also feed the per-point conversions below, like gear stats (the server code does not do this).
      if (id >= 1 && id <= 6) baseStats[id - 1] += v * piles;
    }
  }

  // AttriBaseLvConfig[career * 1000 + level] with Novice fallback
  const baseLvRow =
    data.row('AttriBaseLvConfig', career * 1000 + level) ??
    data.row('AttriBaseLvConfig', 1000 * 1000 + level) ??
    interpolateBaseLvRow(career, level, data);
  for (const [id, v] of asPairs(baseLvRow?._kAttri)) add(id, v);

  // JobConfig._kAttri
  const jobRow = data.row('JobConfig', career);
  for (const [id, v] of asPairs(jobRow?._kAttri)) add(id, v);

  // AttributeConversionConfig per point of STR..LUK
  const ranged = jobRow && Number(jobRow._iDistanceType) === 2;
  for (let stat = 1; stat <= 6; stat++) {
    const conv = data.row('AttributeConversionConfig', stat);
    if (!conv) continue;
    const list = ranged ? conv._kAttribute2 : conv._kAttribute1;
    for (const [id, perPoint] of asPairs(list)) add(id, perPoint * baseStats[stat - 1]);
  }

  if (raw[113] === undefined) raw[113] = 700;
  if (raw[115] === undefined) raw[115] = 100;

  // EquipmentStunts.ApplyConversions (ops 8 and 14 read one pre-conversion snapshot)
  let sheet = computeStatSheet(raw, data);
  let converted = false;
  for (const st of stunts) {
    const row = typeof st === 'object' && st._kSpecialEffect ? st : data.row('SpecialEffectConfig', st.id ?? st);
    if (!row || !Array.isArray(row._kSpecialEffect)) continue;
    for (const op of row._kSpecialEffect) {
      let source = 0, step = 0, target = 0, perStep = 0, cap = 0;
      if (op.length === 6 && op[0] === 8) {
        [source, step, target, perStep, cap] = [sheet[op[1]], op[2], op[3], op[4], op[5]];
      } else if (op.length === 7 && op[0] === 14) {
        [source, step, target, perStep, cap] = [sheet[op[1]] + sheet[op[2]], op[3], op[4], op[5], op[6]];
      } else continue;
      const val = step <= 0 ? 0 : Math.min(Math.floor(source / step) * perStep, cap);
      add(target, val);
      converted = true;
    }
  }
  const aspdExcess = sheet[115] - ASPD_EXCESS.cap;
  if (aspdExcess > 0) {
    add(1031, Math.min(aspdExcess * ASPD_EXCESS.bpPerPoint, ASPD_EXCESS.maxBp));
    converted = true;
  }
  if (converted) sheet = computeStatSheet(raw, data);
  // The panel's HP recover / SP Recovery are the flat value plus a share of Max HP / Max SP (Recovery % 1071 / 1081 in basis points, which VIT and INT
  // feed too: CombatService.RegenAsync), rounded up: a Lv 72 Ranger's 487 + 45 + 0.15% of 176,086 HP = 796.1 shows 797 in the game.
  sheet.data[107] = Math.ceil(sheet[107] + (sheet[101] * sheet[1071]) / 10000 - 1e-6);
  sheet.data[108] = Math.ceil(sheet[108] + (sheet[102] * sheet[1081]) / 10000 - 1e-6);
  sheet.data[2000] = Math.min(build.currentHp ?? sheet[101], sheet[101]);
  sheet.data[2001] = Math.min(build.currentSp ?? sheet[102], sheet[102]);
  sheet.data[2002] = level;
  return sheet;
}

/**
 * Where a number of the sheet comes from. `steps` lists the sources of `build` as [name, patch], `patch` being the build keys that source brings
 * (a source may redo a key an earlier one set: the gear without its Refine / Enhance levels, then with them); the base is `build` without any of
 * those keys. Returns the sheets as the sources join, [base, + step 1, + steps 1-2, ...]: what a source adds is the difference of two neighbours,
 * on top of the sources before it (a percent bonus lifts what came earlier and counts with the source that brings it), so the shares add up to
 * the last sheet, which is `build`'s own when the patches restore every key.
 */
export function sheetSteps(build, steps, data = new Ro3DataStore()) {
  let b = { ...build };
  for (const [, patch] of steps) for (const key of Object.keys(patch)) delete b[key];
  const sheets = [buildCharacterStats(b, data)];
  for (const [, patch] of steps) sheets.push(buildCharacterStats((b = { ...b, ...patch }), data));
  return sheets;
}

function interpolateBaseLvRow(career, level, data) {
  const ref50 = data.row('AttriBaseLvConfig', career * 1000 + 50) ?? data.row('AttriBaseLvConfig', 1000050);
  if (!ref50) return null;
  const ratio = level / 50;
  return {
    _kAttri: ref50._kAttri.map(([id, v]) => [id, Math.max(1, Math.round(v * ratio))]),
  };
}

// ============================================================================
// 3. Totem Effects & Skill Parameter Rules (`TotemEffects.cs`, `SkillParameterRules.cs`)
// ============================================================================

// The deployed totems' skills that take effect (TotemEffects.Effective): a skill is dropped when a superior one is deployed anywhere,
// and a non-coexisting skill counts once across the lineup. Yields { totem, skills (the totem's list), ops } per effective skill.
function* totemEffectiveSkills(build, data) {
  const totems = asArray(build.totems);
  const allSkills = new Set(totems.flatMap((t) => asArray(t.skills)));
  const used = new Set();
  for (const totem of totems) {
    const skills = asArray(totem.skills);
    for (const skillId of skills) {
      const row = data.row('TotemSkillConfig', skillId);
      if (!row) continue;
      let superior = row._iSuperiorSkillID, superseded = false;
      const seen = new Set();
      while (superior && !seen.has(superior)) {
        if (allSkills.has(superior)) { superseded = true; break; }
        seen.add(superior);
        superior = data.row('TotemSkillConfig', superior)?._iSuperiorSkillID;
      }
      if (superseded || !row._iIsCoexist && used.has(skillId)) continue;
      used.add(skillId);
      const opLists = asArray(row._kSpecialAttribute)
        .map((specId) => data.row('SpecialEffectConfig', specId)?._kSpecialEffect)
        .filter(Array.isArray)
        .map((list) => list.filter(Array.isArray));
      yield { totem, skills, row, opLists };
    }
  }
}

// Opcode-2 passive -> on-cast temporary stack buff (TotemEffects.CastStacks).
export const TOTEM_CAST_STACKS = { 2500101: 2500301, 2500201: 2500401, 2500501: 2500701, 2500601: 2500801, 2500901: 2501101, 2501001: 2501201, 2501301: 2501501, 2501401: 2501601 };
const TOTEM_EXTRA_HIT = { 2504001: true, 2514001: true, 2515701: false, 2507501: false }; // passive -> magic

/**
 * The deployed totems' combat passives (TotemEffects.OnCastAsync / StackCap / ExtraDamage):
 * castStacks [{ guid, buffId, durMs, cap }] and extraHits [{ guid, passiveId, magic }].
 * ponytail: the execute passives (below 30% target HP) are left out because the simulated target stays at full HP; 2501401 (healing
 * casts only) and the per-stack 2530401-2530701 bonuses are not modeled either.
 */
export function totemPassives(build, data = new Ro3DataStore()) {
  const perTotem = new Map();
  for (const { totem, opLists } of totemEffectiveSkills(build, data)) {
    const guid = totem.guid ?? 1;
    if (!perTotem.has(guid)) perTotem.set(guid, { passives: new Set(), maxStack: [] });
    const t = perTotem.get(guid);
    for (const op of opLists.flat()) {
      if (op.length === 2 && op[0] === 2) t.passives.add(op[1]);
      else if (op.length === 3 && op[0] === 18) t.maxStack.push([op[1], op[2]]);
    }
  }
  const castStacks = [], extraHits = [];
  for (const [guid, { passives, maxStack }] of perTotem) {
    for (const passiveId of passives) {
      if (passiveId in TOTEM_EXTRA_HIT) extraHits.push({ guid, passiveId, magic: TOTEM_EXTRA_HIT[passiveId] });
      const buffId = TOTEM_CAST_STACKS[passiveId];
      if (!buffId || passiveId === 2501401) continue;
      const durMs = Number(data.row('BuffConfig', passiveId)?._kLogicData?.[0] ?? 0);
      const active = data.row('BuffConfig', buffId);
      const cats = asArray(active?._kBuffCategory);
      const cap = Math.max(1, Number(active?._iMaxStack ?? 2)) + maxStack.filter(([cat]) => cats.includes(cat)).reduce((a, [, n]) => a + n, 0);
      if (durMs > 0) castStacks.push({ guid, buffId, durMs, cap });
    }
  }
  return { castStacks, extraHits };
}

export function evaluateTotemAttributes(build, data = new Ro3DataStore(), skipOp10 = false, precomputedMaxHp = null) {
  const out = [];
  const totems = asArray(build.totems);
  if (totems.length === 0) return out;
  for (const totem of totems) {
    const enhanceMult = 1 + (totem.enhanceBp ?? 0) / 10000;
    for (const [id, v] of asPairs(totem.attrs)) out.push([id, v * enhanceMult]);
  }
  for (const { totem, skills, row, opLists } of totemEffectiveSkills(build, data)) {
      for (const [id, v] of asPairs(row._kBasicAttribute)) out.push([id, v]);
      for (const ops of opLists) {
        for (const op of ops) {
          if (op.length === 3 && op[0] === 1) out.push([op[1], op[2]]);
          else if (op.length === 4 && op[0] === 7 && op[1] > 0) {
            out.push([op[2], Math.trunc(skills.length / op[1]) * op[3]]);
          } else if (op.length === 3 && op[0] === 9) {
            out.push([op[1], Math.floor((build.level ?? 50) * op[2] / 10000)]);
          } else if (op.length === 7 && op[0] === 10 && !skipOp10) {
            const maxHp = precomputedMaxHp ?? buildCharacterStats(build, data, true)[101];
            const hp = build.currentHp ?? maxHp;
            const q = op[2] === 1 ? (maxHp > 0 ? Math.floor((hp * 10000) / maxHp) : 0) : hp;
            const active =
              op[1] === 1 ? q > op[3] :
              op[1] === 2 ? q >= op[3] :
              op[1] === 3 ? q < op[3] :
              op[1] === 4 ? q <= op[3] :
              op[1] === 5 ? q === op[3] : false;
            if (active) {
              out.push([op[4], op[5] === 2 ? Math.floor((build.level ?? 50) * op[6] / 10000) : op[6]]);
            }
          } else if (op.length >= 8 && op[0] === 12 && op[1] === 1 && op[3] === 2) {
            const op1 = ops.find((x) => x.length === 3 && x[0] === 1);
            const attr = op1 ? op1[1] : 0;
            const floors = totemFloorStacks(build, totem.guid ?? 1, op[2], data);
            if (attr !== 0 && floors > 0) out.push([attr, floors * op[5]]);
          }
        }
      }
  }
  return out;
}

function totemFloorStacks(build, sourceGuid, category, data) {
  let sum = 0;
  for (const b of build.activeBuffs ?? []) {
    if (!b.isTotemOwned || b.isPassive || (b.sourceId ?? 1) !== sourceGuid) continue;
    const row = typeof b === 'object' && b._kBuffCategory ? b : data.row('BuffConfig', b.id ?? b);
    if (row && Array.isArray(row._kBuffCategory) && row._kBuffCategory.includes(category)) {
      sum += b.piles ?? 1;
    }
  }
  return sum;
}

/**
 * The skill fields a buff's `_kSkillAttributeList` [scope, selector, type, op, value] tuple can change, by its type (the protocol's SkillAffectValueType);
 * other types are not simulated. Type 10, SkillCriticalProb, adds crit chance to the skill: `_iCritAdd` (basis points) is read by `calcCritRate`.
 * ponytail: "gains 35% Crit Chance" is taken as +35 points of crit chance, not 35% more of the character's own (the exported rows give no scale).
 */
export const SKILL_MODIFIER_FIELDS = {
  0: '_iCD',
  10: '_iCritAdd',
  21: '_iActionTime',
  23: '_iChantFix',
  24: '_iChantVar',
  25: '_iDistanceMin',
  26: '_iDistanceMax',
  27: '_iTargetMax',
  29: '_kDamageParam1',
  30: '_kDamageParam2',
};

export function applySkillParameterRules(skillRow, activeBuffs = [], data = new Ro3DataStore()) {
  const group = Number(skillRow._iSkillID || 0);
  const categories = asArray(skillRow._kSkillCategory).map(Number);
  const modifiers = [];
  for (const buff of activeBuffs) {
    const bRow = typeof buff === 'object' && buff._kSkillAttributeList ? buff : data.row('BuffConfig', buff.id ?? buff);
    if (!bRow || !Array.isArray(bRow._kSkillAttributeList)) continue;
    const piles = buff.piles ?? 1;
    for (const tuple of bRow._kSkillAttributeList) {
      if (!Array.isArray(tuple) || tuple.length < 5) continue;
      // Scope 0 names a skill group. Scope 1 names a skill category (`_kSkillCategory`): Unlimited Shooting's
      // [1, 3105, 29, 5, 5000] is its "+50% Aimed Shot damage" and 3105 is in every Focused Arrow Strike row.
      const selector = Number(tuple[1]);
      if (Number(tuple[0]) === 0 ? selector !== group : Number(tuple[0]) !== 1 || selector <= 0 || !categories.includes(selector)) continue;
      const type = Number(tuple[2]);
      const op = Number(tuple[3]);
      const value = Number(tuple[4]);
      const index = tuple.length > 5 ? Number(tuple[5]) : 0;
      for (let i = 0; i < piles; i++) modifiers.push({ group, type, op, value, index });
    }
  }
  if (modifiers.length === 0) return skillRow;

  const applyOp = (val, mod) => {
    if (mod.op === 1) return val + mod.value;
    if (mod.op === 2) return mod.value;
    if (mod.op === 5) {
      // MidpointRounding.AwayFromZero
      const prod = val * (1 + mod.value / 10000);
      return prod >= 0 ? Math.floor(prod + 0.5) : Math.ceil(prod - 0.5);
    }
    return val;
  };

  const clone = { ...skillRow };
  for (const mod of modifiers) {
    const field = SKILL_MODIFIER_FIELDS[mod.type];
    if (!field) continue;
    if (mod.type === 29 || mod.type === 30) {
      if (!Array.isArray(clone[field])) continue;
      clone[field] = clone[field].slice();
      const first = mod.index < 0 ? 0 : mod.index;
      const end = mod.index < 0 ? clone[field].length : Math.min(clone[field].length, first + 1);
      for (let i = first; i < end; i++) {
        clone[field][i] = applyOp(Number(clone[field][i] || 0), mod);
      }
    } else {
      clone[field] = applyOp(Number(clone[field] || 0), mod);
    }
  }
  return clone;
}

// ============================================================================
// 3b. Skill damage the rows cannot express (verified against the in-game skill texts by `node build-ro3-sim.mjs`)
// ============================================================================

const repeat = (branch, n) => Array(n).fill(branch);

/**
 * Per-skill facts, keyed by skill group (`_iSkillID`). A row holds ONE damage instance's multiplier per branch
 * (`_kDamageParam1[branch]`, `_kDamageParam2[branch]`); the in-game text states the whole cast:
 *  hits      branch of every damage instance of one cast. Myriad Stars Chase the Moon: 7 x 200%, the text says 1400%.
 *  vsMonster branch used against monsters: "Against Monsters, the percentage DMG multiplier increases by X%".
 *  both      adds M.ATK to the P.ATK base: "Physical ATK*50% + Magic ATK*50% + 60".
 */
export const SKILL_MODEL = {
  13003: { hits: repeat(0, 2) }, // Double Strafe: 2 hits of 100% + 75
  // `modes` is the same per row of a skill mode (SEASON_BUFFS): Focused Arrow Strike in Unlimited Shooting with Infinite Rhapsody casts a 60% hit and a 15% one,
  // Myriad Stars with Celestial Symphony 10 hits of 200% and a 150% one at the end.
  13305: { modes: { 4: { hits: [0, 1] } } },
  113303: { hits: [0, 1] }, // Gale Beat's enhanced cast in that Unlimited Shooting mode: 75% and 15%
  13320: { hits: repeat(0, 7), modes: { 1: { hits: [...repeat(0, 10), 1] } } }, // Myriad Stars Chase the Moon
  15210: { both: true }, // Soul Destroyer
  15326: { hits: [0, 1] }, // Piercing Shadow: 150% + 150%
  16304: { hits: [...repeat(0, 6), 1] }, // Axe Tornado: 6 x 167% + a 250% finisher
  16306: { hits: repeat(0, 2) }, // Spinning Axe: 2 x 100%
  16312: { hits: repeat(0, 2) }, // Arm Cannon: 2 x 40%
  16318: { hits: repeat(0, 7) }, // Aerial Bombardment: 7 x 300%
  13327: { hits: repeat(0, 4) }, // Warg Companion (Warg Strike), King of the Wargs: 4 x 80%
  11608: { vsMonster: 1 }, // Shield Press: +100%
  11611: { vsMonster: 1 }, // Earth Drive: +100%
  11636: { vsMonster: 1 }, // Powerful Shield Bash: +50%
};

/**
 * Buff-triggered extra hits, keyed by buff family (`_iID / 100`). While the buff is up, every hit of a skill carrying `tag`
 * (SkillTagConfig 702 = Bow) has the buff's chance (`_kLogicData[0]`, basis points) to add hits that total `_kDescData[2]`% of
 * P.ATK as Neutral ranged Physical damage. Fear Breeze: "when a targeted bow skill hits, the target has a 30% Chance to be
 * struck by piercing arrows, taking 3 hits ... totaling Physical ATK*50%".
 */
export const BUFF_PROCS = { 13301: { tag: 702, name: 'Fear Breeze' } };

function buffProcRow(buffRow, rule) {
  return {
    _iID: -Number(buffRow._iID), _iSkillID: -Number(buffRow._iID), name: rule.name, _iBasicType: 1, _iDmgType: 1, _iEleType: 1,
    _iDistanceType: 2, _iSkillHit: 10000, _iSkillCri: 10000, _iActionTime: 0, _kDamageParam1: [Number(buffRow._kDescData?.[2] ?? 0) * 100],
  };
}

/**
 * A learned skill that casts itself when another skill is cast, at most once per `icdMs`. Warg Strike: "every 2.5 seconds, using
 * Focused Arrow Strike casts this skill on the target, dealing PATK * 30%". The follow-up is the skill's row of `mode` (row id =
 * group * 100 + mode * 10 + level; Warg Strike's mode 1 is the Charge you cast yourself). It needs `build.skillLevels[group] > 0`.
 * Confirmed by the player: it fires whether or not the Demonic Wolf is ridden, while the Falcon's Blitz Beat proc (basic attacks only)
 * does not fire from Focused Arrow Strike, so nothing models that proc.
 */
export const FOLLOW_UPS = { 13305: { group: 13312, mode: 0, icdMs: 2500 } };

/**
 * A buff a learned passive casts on you by itself, every `periodMs` while the passive is learned, each lasting `durMs`. Wolf Taming:
 * "When the Demonic Wolf is not mounted and follows the Ranger, it howls every 30 sec, increasing the Ranger's Physical ATK by 5% for
 * 10 sec". The wolf's WolfRoar skill (group 13321) applies buff 1332501 for those 10 s (Physical ATK +5% in the buff layer 1032).
 * ponytail: the cadence is the text's 30 s; the skill row's own cooldown says 10 s and nothing in the exported config schedules it.
 * Needs `build.skillLevels[group] > 0`. `build.periodicStartMs` is when the first one lands (default 0: the fight starts as the wolf
 * howls); `build.periodicOff` drops them all (the wolf is ridden, so it does not howl).
 */
export const PERIODIC_BUFFS = { 13310: { buff: 1332501, periodMs: 30000, durMs: 10000, name: 'Warg Howl' } };

/**
 * The Warg Hunter kit (Demonic Wolf). All of it is quoted from the in-game texts (`node build-ro3-sim.mjs` checks them):
 *  COOLDOWN_RESETS    Warg Bite "resets the Cooldown of Warg Hunt".
 *  MOUNTED_ONLY       King of the Wargs, Warg Hunt, Warg Bite and Swift Warg "can only be used while mounted on the Demonic Wolf".
 *  KING_OF_THE_PACK   For 6 s after King of the Wargs, Warg Hunt becomes Enhanced Warg Hunt (skill mode 1, 310% instead of 150%), and
 *                     casting Warg Charge or Warg Bite also sends the wolf followers (skill groups 13327: 4 hits totaling 320% and
 *                     13328: 3 hits totaling 240%, at King of the Wargs' level).
 * `build.ridden === false` (the wolf follows you instead) turns the mounted-only skills off, and Warg Charge then loses the 10% Physical
 * DMG it grants "if you are riding"; an unset `ridden` leaves everything allowed. ponytail: the 50% extra damage the mode-1 King of
 * the Wargs buff names for non-player enemies is not applied (its text row says so, the player-facing skill text does not).
 */
export const COOLDOWN_RESETS = { 13325: [13323] };
export const MOUNTED_ONLY = new Set([13322, 13323, 13325, 13326]);
export const RIDING_BUFF_ONLY = new Set([13312]);
export const KING_OF_THE_PACK = { group: 13322, family: 13326, enhance: { 13323: 1 }, extras: { 13312: 13327, 13325: 13328 } };
/**
 * Wolf's Fang (skill group 13311): "While mounted on the Demonic Wolf, Physical ATK increases by 10%, and the percentage damage
 * multipliers of Warg Charge, Warg Bite, and Warg Hunt increase by 10%". Its effect is the buff of the family below (buff id = family *
 * 100 + the skill's level: +P.ATK% and a +% to the damage of skill category 3103), which the caller adds to `activeBuffs` while riding.
 */
export const RIDING_PASSIVES = { 13311: 13312 };

/**
 * The Season (playbook 101) Ranger skills. Their rows carry no effect of their own: while one is learned the client keeps the "Shooting: BD" buff
 * of the same number on you (`SEASON_BUFFS`, skill group -> buff id), and a buff's skill attribute of type 15 changes the MODE of a skill (op 1 adds
 * to it, op 2 sets it), which is a row of its own: the row cast is group * 100 + mode * 10 + level (`skillMode`). Texts (`node build-ro3-sim.mjs` checks them):
 *  Rhythmic Arrow 113360      "Focused Arrow Strike's damage multiplier increases by 3%": its buff adds 300 to the multiplier, puts the skill in mode 2
 *                             (a quicker animation) and Unlimited Shooting in mode 1.
 *  Infinite Rhapsody 113361   "While Unlimited Shooting is active, Aimed Shot deals 1 hit of 15%": its buff adds 1 to Unlimited Shooting's mode, so with
 *                             Rhythmic Arrow it is mode 2, whose buff sets Focused Arrow Strike to mode 4 (a 60% hit and a 15% one).
 *  Gale Beat 113362           "Casting Focused Arrow Strike 4 times will Enhance the next one: 75%" (stack buff 11330401, max 4): `GALE_BEAT`. The enhanced
 *                             cast is skill 113302, or 113303 in Focused Arrow Strike's mode 4 (75% and the 15% hit). It follows up like Focused Arrow Strike.
 *  Celestial Symphony 113363  "Myriad Stars Chase the Moon's duration increases by 1 second. When it ends it deals one instance of 150%": its buff puts
 *                             the skill in mode 1, 10 hits of 200% and the 150% one over a 3.3 s animation (instead of 7 hits over 2.4 s).
 */
export const SEASON_BUFFS = { 113360: 11330101, 113361: 11330201, 113363: 11330701 };
export const GALE_BEAT = { group: 113362, trigger: 13305, casts: 4, enhanced: [113302, 113303] };
// The skills whose mode a Season buff switches. ponytail: other classes' mode buffs (talents, Warg Hunt) are not followed, so their results stay as they were.
export const SEASON_MODE_GROUPS = new Set([13305, 13307, 13320]);
const SKILL_MODE_ATTR = 15;

/** The mode `group` is cast in: the sum of the "add" buffs, or the value a "set" buff gives (a set wins). `buffs` are ids or { id, piles }. */
export function skillMode(group, buffs, data) {
  let add = 0;
  let set = null;
  for (const buff of buffs) {
    const row = typeof buff === 'object' && buff._kSkillAttributeList ? buff : data.row('BuffConfig', buff.id ?? buff);
    for (const t of asArray(row?._kSkillAttributeList)) {
      if (!Array.isArray(t) || Number(t[0]) !== 0 || Number(t[1]) !== group || Number(t[2]) !== SKILL_MODE_ATTR) continue;
      if (Number(t[3]) === 2) set = Number(t[4]);
      else if (Number(t[3]) === 1) add += Number(t[4]) * (buff.piles ?? 1);
    }
  }
  return set ?? add;
}

/** The branches of the damage instances one cast of this row lands (SKILL_MODEL), by its mode. */
export const hitsOf = (row) => {
  const model = SKILL_MODEL[Number(row._iSkillID)];
  return model?.modes?.[Number(row._iMode) | 0]?.hits ?? model?.hits ?? [undefined];
};

/**
 * Pets (1 Primary Battle slot + 3 Utility slots deployed, 5 Support slots). The pet in the Primary slot gives you its Primary Battle
 * Skill from _iProtectSkill, scaling off the OWNER, independently of the owner's rotation. Utility passives react either to its cast
 * or to its actual damage markers; they never react recursively to one another. Digest `star[].primary` carries damage markers and
 * owner buffs; p/c and pa/ca carry the ${n} and @{n} description numbers. Only the lowest Utility slot with a core activates that core.
 * ponytail: this is a stationary single-target model, without crowd control or pet actors. Unmodeled conditional effects are listed in
 * the pet window; Radiant Moon's target Ranged vulnerability still uses the existing owner Ranged-damage buff approximation.
 */
export const PET_EFFECTS = {
  30001: { passive: { on: ['offense'], when: 'hit', attr: 1229, pct: 2, sec: 1 } },
  30401: { passive: { on: 'any', attr: 1215, pct: 1, sec: 2 }, core: { on: 'any', attr: 1215, pct: 1, sec: 2, share: true } },
  30005: { passive: { on: ['offense', 'debuff'], attr: 1032, pct: 1, sec: 2 } },
  10001: { passive: { on: ['buff'], extend: 1 } },
  20003: { passive: { on: ['offense'], multiplier: 1 } },
  30101: { passive: { on: ['offense'], multiplier: 1 } },
  31002: { passive: { on: ['offense', 'recovery'], multiplier: 1 } },
  32401: { passive: { on: 'any', hit: ($) => $(3), damageGroup: 23176, melee: true, note: 'Slash damage is modeled; its target DEF reduction is not.' } },
  30004: { passive: { on: ['offense', 'debuff'], when: 'hit', hit: ($, a) => $(1) / a[0], count: ($, a) => a[0], damageGroup: 23347, ele: 4 } },
  30002: { passive: { on: ['offense', 'buff'], hit: ($) => $(5), count: ($) => $(4), step: ($) => $(1) * 1000, damageGroup: 23114 } },
  20001: { passive: { on: ['offense', 'control'], when: 'hit', icdMs: 200, hit: ($) => $(2), count: ($) => $(1), damageGroup: 23375, ele: 4, melee: true } },
  31003: { passive: { on: ['buff'], hit: ($) => $(6), count: ($) => Math.floor($(1) / $(3)), step: ($) => $(3) * 1000, delay: ($) => $(3) * 1000, damageGroup: 23087, melee: true } },
  32002: { passive: { on: ['debuff', 'control'], ownerHit: true, hit: ($) => $(2), sec: 1, icd: 3, damageGroup: 23276, melee: true } },
};

/** Relative events for one Primary cast, repeated on its cooldown without locking the character. */
export function petEffects(pets, data) {
  const out = { timedBuffs: [], hits: [], ownerHits: [], modifiers: [], notes: [], casts: [] };
  const slots = asArray(pets).map((p, i) => {
    const row = p?.id ? data.row('PetDigest', p.id) : null;
    return row ? { i, row, id: Number(row._iID), st: row.star[Math.max(1, Math.min(6, Math.trunc(p.star) || 1)) - 1] } : null;
  });
  const main = slots[0];
  if (!main) return out;
  const primary = main.st.primary;
  const periodMs = primary?.cd ?? main.row.cd;
  if (!(periodMs > 0)) return out;
  const types = new Set(main.row.types);
  const eligible = (e) => e.on === 'any' || e.on.some((t) => types.has(t));
  const utility = slots.slice(1, 4).filter(Boolean);
  const extension = utility.reduce((sum, s) => {
    const e = PET_EFFECTS[s.id]?.passive;
    if (!e?.extend || !eligible(e)) return sum;
    const extraMs = Number(s.st.p[e.extend - 1]) * 1000;
    out.modifiers.push({ slot: s.i, name: s.row.pas.name, extraMs });
    return sum + extraMs;
  }, 0);
  const multiplier = 1 + utility.reduce((sum, s) => {
    const e = PET_EFFECTS[s.id]?.passive;
    if (!e?.multiplier || !eligible(e)) return sum;
    const pct = Number(s.st.p[e.multiplier - 1]);
    out.modifiers.push({ slot: s.i, name: s.row.pas.name, pct });
    return sum + pct / 100;
  }, 0);
  for (const b of primary?.buffs ?? []) out.timedBuffs.push({ slot: 0, name: main.row.main.name, ...b, durMs: b.durMs + extension, periodMs });
  const primaryHits = [...(primary?.hits ?? [])];
  if (primary?.tickMs && extension > 0 && primaryHits.length) {
    const last = primaryHits.at(-1);
    for (let at = last.at + primary.tickMs; at <= last.at + extension; at += primary.tickMs) primaryHits.push({ ...last, at });
  }
  for (const [primaryIndex, h] of primaryHits.entries()) {
    const name = `${main.row.name}: ${main.row.main.name}`;
    const row = { ...primary.row, name, _kDamageParam1: [h.ratio * multiplier], _kDamageParam2: [] };
    out.hits.push({ slot: 0, name, pct: h.ratio * multiplier / 100, periodMs, firstMs: h.at, row, primary: true, primaryIndex });
  }
  out.casts.push({ id: primary?.id, name: `${main.row.name}: ${main.row.main.name}`, periodMs, firstMs: 0, hits: primaryHits.map((h) => h.at) });
  for (const text of primary?.notes ?? []) out.notes.push({ slot: 0, text });
  const coreSlot = utility.find((s) => s.row.core);
  for (const s of utility) {
    if (s.row.core && s !== coreSlot) out.notes.push({ slot: s.i, text: 'Core inactive: an earlier Utility slot already supplies the core.' });
    for (const kind of ['passive', 'core']) {
      const e = PET_EFFECTS[s.id]?.[kind];
      if (kind === 'core' && s !== coreSlot) continue;
      if (!e) {
        if (kind === 'core' && s.row.core) out.notes.push({ slot: s.i, text: 'This core effect is not simulated.' });
        continue;
      }
      if (!eligible(e) || e.extend || e.multiplier) continue;
      if (e.note) out.notes.push({ slot: s.i, text: e.note });
      const d = kind === 'core' ? s.st.c : s.st.p;
      const alt = (kind === 'core' ? s.st.ca : s.st.pa) ?? [];
      const $ = (n) => Number(d?.[n - 1]);
      const name = kind === 'core' ? s.row.core.name : s.row.pas.name;
      const triggers = e.when === 'hit' ? out.hits.filter((h) => h.primary).map((h) => ({ t: h.firstMs, index: h.primaryIndex })).sort((a, b) => a.t - b.t) : [{ t: 0 }];
      let ready = -Infinity;
      const offsets = triggers.filter(({ t }) => { if (t < ready) return false; ready = t + (e.icdMs ?? 0); return true; });
      if (e.attr) {
        if (e.when === 'hit' && primary?.row?._iSkillHit < 10000) {
          out.notes.push({ slot: s.i, text: 'This hit-triggered buff is not modeled for a Primary skill that can miss.' });
          continue;
        }
        const durMs = Math.round($(e.sec) * 1000);
        const windows = [];
        for (const { t } of offsets) {
          const prev = windows.at(-1);
          if (prev && t <= prev.firstMs + prev.durMs) prev.durMs = t + durMs - prev.firstMs;
          else windows.push({ firstMs: t, durMs });
        }
        for (const w of windows) out.timedBuffs.push({ slot: s.i, name, attrs: [[e.attr, Math.round($(e.pct) * 100)]], periodMs, afterHit: e.when === 'hit', ...w });
      }
      if (e.hit) {
        const pct = e.hit($, alt);
        const id = -(9000000 + s.id + (kind === 'core' ? 100000 : 0));
        const row = { _iID: id, _iSkillID: id, name: `${s.row.name}: ${name}`, _iBasicType: 1, _iDmgType: 4, _iEleType: e.ele ?? 1, _iDistanceType: e.melee ? 1 : 2,
          _iSkillHit: s.st.passiveRow?._iSkillHit ?? 10000, _iSkillCri: s.st.passiveRow?._iSkillCri ?? 10000, _iActionTime: 0, _kDamageParam1: [pct * 100] };
        if (e.ownerHit) out.ownerHits.push({ slot: s.i, name: row.name, pct, periodMs, firstMs: 0, durMs: $(e.sec) * 1000, icdMs: $(e.icd) * 1000, row });
        else for (const { t, index } of offsets) for (let i = 0; i < (e.count?.($, alt) ?? 1); i++) {
          out.hits.push({ slot: s.i, name: row.name, pct, periodMs, firstMs: t + (e.delay?.($) ?? 0) + i * (e.step?.($) ?? 0), row, requiresPrimary: index });
        }
      }
      if (e.share && primaryHits.length && alt[1] > 0) {
        out.hits.push({ slot: s.i, name: `${s.row.name}: ${name} (extra damage)`, periodMs, firstMs: Math.max(...primaryHits.map((h) => h.at)), sharePct: alt[1] / 100, id: -(9100000 + s.id) });
      }
    }
  }
  return out;
}

/**
 * The stats a pet shares with its master, as the client's "Stat Bonus Overview" adds them up (UI_Sys_Pet_GrowthPreviewPanelCtrl):
 * the pet's own stats at its level (`PetGrowth` row of its growth group: HP, SP, P.ATK, M.ATK, P.DEF, M.DEF, the stats the game says
 * "are determined by its level and growth rate"), times the rank step (`PetRules.curve`, PetStarConfig `_iBaseAttr` / 10000: 100% at
 * 1 star up to 200% at 6 stars, one curve for every pet), times the rank scale (100%), times the share of its slot (PetSetLimitConfig:
 * 100% for a deployed slot, 30% for a support slot), each attribute rounded up on its own. A pet's level cannot exceed the
 * adventurer's. `slot` is { id, star, stage, lv } for a deployed pet (`id`: a PetDigest pet) or { g, star, stage, lv } for a support
 * slot (`g`: a growth group, quality * 10 + faction: pets of one group have the same stats, and a support pet gives nothing else);
 * `stage` 0..3 is the rank-up progress inside a star (none at 6 stars). A slot without `lv` gives no stats.
 * ponytail: the faction bonus (3 deployed pets of one faction: +15% Max HP on them) and the codex bonuses of pets you own (PetStarConfig
 * `_kCollectAttr`, mostly PvP stats) are not added; the pet stage skills (`_kStageSkill`) are empty in the data.
 */
export const PET_STAT_ATTRS = [101, 102, 103, 104, 105, 106]; // the order of a PetGrowth row's `lv` entries
export function petSlotStats(slot, kind, index, level, data) {
  const rules = data.row('PetRules', 1);
  const g = kind === 'fight' ? data.row('PetDigest', slot?.id)?.g : slot?.g;
  const grow = g ? data.row('PetGrowth', g) : null;
  if (!rules || !grow || !(Number(slot?.lv) >= 1)) return [];
  const lv = Math.max(1, Math.min(Math.trunc(slot.lv), rules.maxLv, Math.trunc(level) || 1));
  const star = Math.max(1, Math.min(6, Math.trunc(slot.star) || 1));
  const step = rules.curve[(star - 1) * 4 + (star === 6 ? 0 : Math.max(0, Math.min(3, Math.trunc(slot.stage) || 0)))];
  const scale = (kind === 'fight' ? rules.fightScale : rules.assistScale)[grow.q] ?? 10000;
  const share = (kind === 'fight' ? rules.fight : rules.assist)[index] ?? 0;
  const skip = kind === 'fight' ? rules.notAdd.fight : rules.notAdd.assist;
  return PET_STAT_ATTRS.flatMap((a, i) => {
    const v = Math.ceil(grow.lv[lv - 1][i] * (step / 10000) * (scale / 10000) * (share / 10000)); // the client's order of multiplication
    return v > 0 && !skip.includes(a) ? [[a, v]] : [];
  });
}
/** All the stats of the deployed lineup `pets` (the slots of petEffects) and the support slots `assist`: [[attribute, value]]. */
export function petStats(pets, assist, level, data) {
  const sum = new Map();
  const add = (list) => { for (const [a, v] of list) sum.set(a, (sum.get(a) ?? 0) + v); };
  asArray(pets).forEach((p, i) => p && add(petSlotStats(p, 'fight', i, level, data)));
  asArray(assist).forEach((p, i) => p && add(petSlotStats(p, 'assist', i, level, data)));
  return [...sum];
}

/**
 * When the hits of one cast land and how long the cast locks the caster, from the client's skill template (SkillTiming row
 * [chant, end, interrupt, hit points], seconds). The template's [chant, end] span is stretched over the cast's real chant + action
 * time (ASPD included), like `CombatService.ImpactOffset`. A point within one frame of the start, followed by later ones, is the
 * cast's start marker and not a hit: Myriad Stars (a 0 s marker + its 7 hits) and Aerial Bombardment (0.017 s + 7) look like that.
 * The hits then take the next points in order; a skill with more points than hits uses the first ones (the server resolves a cast
 * at its first point) and one with fewer spreads the rest evenly to the end of the animation. `cancel` ends the lock at the
 * template's interrupt frame (the earliest moment another skill may be cast) instead of the end of the animation. No template:
 * first hit at 20% of the action, like the server.
 */
export function castTimes(data, row, timing, hitCount, cancel = false) {
  const [tChant, tEnd, tInterrupt, all] = data.row('SkillTiming', row._iScriptShow) ?? [0, 1, 0, []];
  const { chantMs, actionMs } = timing;
  const fullMs = chantMs + actionMs;
  const at = (p) => Math.round(p < tChant && tChant > 0 ? (p / tChant) * chantMs : chantMs + Math.min(1, Math.max(0, (p - tChant) / Math.max(0.001, tEnd - tChant))) * actionMs);
  const lead = all.findIndex((p) => p > 0.02); // 0.02 s: one frame at 60 fps
  const points = lead > 0 ? all.slice(lead) : all;
  const first = at(points[0] ?? 0.2);
  const hitAt = points.length >= hitCount
    ? points.slice(0, hitCount).map(at)
    : Array.from({ length: hitCount }, (_, h) => Math.round(first + (h * (fullMs - first)) / hitCount));
  const cancelAt = cancel && tInterrupt > 0 ? Math.min(fullMs, Math.max(at(tInterrupt), hitAt[hitCount - 1])) : fullMs;
  return { hitAt, fullMs, lockMs: Math.max(50, cancelAt) };
}

// ============================================================================
// 4. Exact Damage Formula (`CombatService.cs`, `TotemEffects.cs`)
// ============================================================================

const ELEMENT_COLUMNS = [
  '_iNone', '_iWind', '_iEarth', '_iFire', '_iWater',
  '_iPoison', '_iHoly', '_iShadow', '_iGhost', '_iUndead',
];

export function elementFactor(attackerEle, defenderEle, data = new Ro3DataStore()) {
  if (attackerEle < 1 || attackerEle > 10) return 0;
  const row = data.row('EleConfig', defenderEle);
  if (!row) return 0;
  return Number(row[ELEMENT_COLUMNS[attackerEle - 1]] || 0);
}

export function calcHitRate(attacker, defender, skillRow) {
  if (Number(skillRow._iSkillHit || 0) >= 10000) return 1.0;
  const flee = Number(defender.flee || 0);
  const hit = Number(attacker.hit || 0);
  const raw = 1 - flee / (flee + 600) + (hit / (hit + 600)) * 0.5;
  return Math.max(0.3, Math.min(1.0, raw));
}

export function calcCritRate(attacker, defender, skillRow) {
  const magic = Number(skillRow._iDmgType) === 2;
  if (magic) return 0;
  const cri = Math.max(0, Number(attacker.cri || 0) - Number(defender.resCri || 0)) / 10000;
  const skillCri = Number(skillRow._iSkillCri ?? 10000) / 10000;
  return Math.max(0, Math.min(1.0, cri * skillCri + Number(skillRow._iCritAdd || 0) / 10000));
}

function isCritPossible(magic) {
  return !magic;
}

export function calcSkillTimingMs(statsSheet, skillRow) {
  const aspd = Math.max(0.1, Math.min(ASPD_EXCESS.cap / 100, Number(statsSheet[115] || 100) / 100));
  const influence = Number(skillRow._iActionTimeInfluence || 0) / 100;
  const actionTime = Math.max(1, Number(skillRow._iActionTime || 1000));
  const actionMs = Math.round(actionTime / Math.max(0.1, 1 + (aspd - 1) * influence));
  const chantMs = Math.max(0, Number(skillRow._iChantFix || 0) + Number(skillRow._iChantVar || 0));
  const cdMs = Math.max(0, Number(skillRow._iCD || 0));
  return { chantMs, actionMs, castLockMs: chantMs + actionMs, cdMs };
}

export function totemOutgoingMultiplier(build, skillRow, isCrit, data = new Ro3DataStore(), precomputedMaxHp = null) {
  const totemAttrs = evaluateTotemAttributes(build, data, false, precomputedMaxHp);
  const bonusOf = (attrId) => {
    let sum = totemAttrs.filter(([id]) => Number(id) === attrId).reduce((a, [, v]) => a + v, 0);
    for (const b of asArray(build.activeBuffs)) {
      if (!b.isTotemOwned || b.isPassive) continue;
      const bRow = typeof b === 'object' && b._kChangeAttri ? b : data.row('BuffConfig', b.id ?? b);
      const piles = b.piles ?? 1;
      for (const [id, v] of asPairs(bRow?._kChangeAttri)) {
        if (Number(id) === attrId) sum += v * piles;
      }
    }
    return sum;
  };
  const magic = Number(skillRow._iDmgType) === 2;
  const distType = Number(skillRow._iDistanceType || 1);
  const dmgBonus = magic ? bonusOf(213) : bonusOf(211) + bonusOf(distType === 2 ? 229 : 227);
  let factor = Math.max(0, 1 + dmgBonus / 10000);
  if (isCrit) {
    factor *= Math.max(0, (15000 + bonusOf(209)) / 15000);
  }
  return factor;
}

/**
 * Computes full single-hit damage breakdown and expected value matching `CombatService.Damage` + `ApplyEffectsAsync`.
 */
export function evaluateSkillDamage(build, defender, rawSkillRow, options = {}, data = new Ro3DataStore()) {
  const stats = options.stats ?? buildCharacterStats(build, data);
  // `rulesApplied`: the caller already ran applySkillParameterRules on this row (simulateRotation freezes the modifiers at cast time).
  const skillRow = options.rulesApplied ? rawSkillRow : applySkillParameterRules(rawSkillRow, build.activeBuffs ?? [], data);
  const model = SKILL_MODEL[Number(skillRow._iSkillID)];
  const hitBranches = hitsOf(skillRow);
  const branch = skillRow._kScriptLogic === 'Heal' ? 1 : (options.branch ?? model?.vsMonster ?? 0);
  const magic = Number(skillRow._iDmgType) === 2 || (Number(skillRow._iDmgType) === 4 && stats[104] > stats[103]);
  const resolvedRow = Number(skillRow._iDmgType) === 4 ? { ...skillRow, _iDmgType: magic ? 2 : 1 } : skillRow;
  const ratios = Array.isArray(skillRow._kDamageParam1) ? skillRow._kDamageParam1 : [];
  const flats = Array.isArray(skillRow._kDamageParam2) ? skillRow._kDamageParam2 : [];
  let p1 = ratios.length > branch ? Number(ratios[branch]) : 10000;
  const p2 = flats.length > branch ? Number(flats[branch]) : 0;

  // Stat scaling in `_kDamageParamExtra`, named by `_kDamageFormulaExtra` and confirmed by the skill texts:
  //  T_AXadd0_etc[_withlimit] [1, bp, attr, (step), (limit)]  "Agility Resonance 0.1%": adds bp per step of attr (up to limit) to the ratio.
  //  AXaddBplus1[_withlimit]  [bp, attr, scale, (limit)]      "(1 + ASPD * 0.5%)": multiplies the damage.
  // With several tuples, tuple i belongs to damage branch i.
  let scale = 1;
  const formulas = asArray(skillRow._kDamageFormulaExtra);
  const extras = asArray(skillRow._kDamageParamExtra);
  extras.forEach((tuple, i) => {
    if (extras.length > 1 && i !== branch) return;
    const t = asArray(tuple).map(Number);
    const name = String(formulas[i] ?? '');
    const capped = name.endsWith('_withlimit');
    if (name.startsWith('T_AXadd0_etc') && t[0] === 1) {
      p1 += Math.floor(Math.min(stats[t[2]], capped ? t[t.length - 1] : Infinity) / (capped && t.length < 5 ? 1 : t[3] || 1)) * t[1];
    } else if (name.startsWith('AXaddBplus1')) {
      scale *= 1 + (Math.min(stats[t[1]], capped ? t[3] : Infinity) * t[0]) / t[2];
    }
  });

  // Bonus ATK / Bonus MATK (221 / 222, "an Extra attack that ignores DEF"; only the Collection cards give them) are added to the attack
  // like the server does (`CombatService.Effects`: new Fighter(P.ATK + 221, M.ATK + 222)). ponytail: the in-game text says the extra attack
  // ignores DEF, which the server's formula does not model either; the amounts are tiny (+16 of thousands).
  const atkStat = magic ? stats[104] + stats[222] : stats[103] + stats[221] + (model?.both ? stats[104] : 0);
  const rawSkillDmg = ((atkStat * p1) / 10000 + p2) * scale;

  const defStat = magic ? Number(defender.mdef || 0) : Number(defender.def || 0);
  // DEF cuts def / (def + 20 x a level). The emulator's server guesses that level is the defender's (`CombatService.Damage`, marked "inferred"); a
  // one-minute parse of a Lv 75 Ranger on the Lv 99 / DEF 1980 Dummy Challenge dummy says it is the attacker's: every skill without a bonus the model
  // lacks hit 0.84 +- 0.03 of the defender-level figure, and 1980 / (1980 + 20 x 75) takes 0.431 where 20 x 99 takes 0.5 (0.862). Equal for a same-level fight.
  // ponytail: one parse and one target, so the constant stays here: swap `attackerLevel` for `defender.level` to get the server's reading back.
  const attackerLevel = Math.max(1, Number(build.level || defender.level || 1));
  const defMitigation = 1 - defStat / (defStat + 20.0 * attackerLevel);

  const atkEle = Number(skillRow._iEleType) > 1 ? Number(skillRow._iEleType) : Number(build.element || 1);
  const defEle = Number(defender.element || 1);
  // Elemental Counter Ignore (235): "Increases damage dealt when your attack element is at a disadvantage". ponytail: read as cutting
  // that penalty by the percentage (the exported data names no formula).
  const ef = elementFactor(atkEle, defEle, data);
  const eleMod = Math.max(0.1, Math.min(10.0, 1 + (ef < 0 ? ef * Math.max(0, 1 - stats[235] / 10000) : ef) / 10000));

  const baseDamage = rawSkillDmg * defMitigation * eleMod;

  const attackerFighter = {
    atk: stats[103],
    matk: stats[104],
    hit: stats[109],
    cri: stats[111],
    level: build.level ?? 50,
    element: build.element ?? 1,
  };
  const hitRate = calcHitRate(attackerFighter, defender, skillRow);
  const critRate = calcCritRate(attackerFighter, defender, resolvedRow);

  // Post-hit adjusters: Bond (601), Totem execution (<30% HP), Totem OutgoingMultiplier, Totem ExtraDamage
  const bondBonusBp = Number(build.bondBonusBp || 0);
  const totemMultNormal = totemOutgoingMultiplier(build, resolvedRow, false, data, stats[101]);
  const totemMultCrit = isCritPossible(magic) ? totemOutgoingMultiplier(build, resolvedRow, true, data, stats[101]) : totemMultNormal;
  const ranged = Number(skillRow._iDistanceType || 1) === 2;
  // 215 "Damage Increase%" (Equipment Resonance) "affects the damage of the character's Damage Skills" like 211 / 213 / 227 / 229, so it
  // joins their bracket, and so do the card bonuses against the target's element, race and size (targetBonus, which the game's attribute
  // tips say "affect your damage against X monsters"). ponytail: the exported data does not give the game's bracket.
  // Skill-element bonuses (301-310) follow the resolved attack element, unlike bonuses against monster elements (321-330).
  const cardFx = cardEffects(build.cards, data);
  const size = Number(defender.size);
  const sizeProc = Number.isInteger(size) && size >= 1 && size <= 3 ? cardFx.sizeProc : null;
  const sizeProcChance = sizeProc ? sizeProc.chanceBp / 10000 : 0;
  const elementBonus = Number.isInteger(atkEle) && atkEle >= 1 && atkEle <= 10 ? stats[300 + atkEle] : 0;
  const extraSheetBonus = stats[215] + elementBonus + targetBonus(stats, defender, cardFx.sizeBonusBp, cardFx.ignoreSize)
    + (magic ? stats[213] : stats[211] + stats[ranged ? 229 : 227]);
  // 12xx are the buff layer of those damage bonuses (own pre-attributes, hidden from the panel): 1211 / 1213 Physical / Magic (True Sight,
  // Unlimited Shooting), 1215 all damage (pets' Esen's Execution), 1227 / 1229 melee / ranged Physical, 1250 / 1252 melee / ranged Magic.
  // ponytail: applied as a separate multiplier; the game's exact bracket is not in the exported data.
  const buffLayer = Math.max(0, 1 + (stats[1215] + (magic ? stats[1213] + stats[ranged ? 1252 : 1250] : stats[1211] + stats[ranged ? 1229 : 1227])) / 10000);

  const applyAdjusters = (dmgAfterFloatAndCrit, isCrit, targetHpRatio = 1.0, procBonusBp = 0) => {
    let amount = Math.max(1, Math.round(dmgAfterFloatAndCrit));
    if (bondBonusBp !== 0) {
      const prod = (amount * Math.max(0, 10000 + bondBonusBp)) / 10000;
      amount = Math.max(1, Math.floor(prod + 0.5));
    }
    if (targetHpRatio <= 0.30 && build.totemLowHpBonusBp > 0) {
      amount += Math.floor((amount * build.totemLowHpBonusBp) / 10000);
    }
    const totemMult = isCrit ? totemMultCrit : totemMultNormal;
    const bonus = extraSheetBonus + procBonusBp;
    const sheetMult =
      totemMult === 1 && (bonus !== 0 || (isCrit && stats[209] !== 0))
        ? Math.max(0, 1 + bonus / 10000) * (isCrit ? Math.max(0, (15000 + stats[209]) / 15000) : 1)
        : totemMult * (bonus !== 0 ? Math.max(0, 1 + bonus / 10000) : 1);
    amount = Math.floor(amount * sheetMult * buffLayer);
    return Math.max(1, amount);
  };

  const hpRatio = options.targetHpRatio ?? 1.0;
  const procBonusBp = sizeProc?.bonusBp ?? 0;
  const meanHit = (damage, crit) => {
    const plain = applyAdjusters(damage, crit, hpRatio);
    return sizeProcChance ? plain * (1 - sizeProcChance) + applyAdjusters(damage, crit, hpRatio, procBonusBp) * sizeProcChance : plain;
  };
  const normalHitMean = meanHit(baseDamage, false);
  const normalHitMin = applyAdjusters(baseDamage * 0.97, false, hpRatio, sizeProcChance === 1 ? procBonusBp : 0);
  const normalHitMax = applyAdjusters(baseDamage * 1.03, false, hpRatio, sizeProcChance > 0 ? procBonusBp : 0);
  const critHitMean = magic ? normalHitMean : meanHit(baseDamage * 1.5, true);
  const critHitMax = magic ? normalHitMax : applyAdjusters(baseDamage * 1.03 * 1.5, true, hpRatio, sizeProcChance > 0 ? procBonusBp : 0);

  const expectedPerAttempt =
    hitRate * ((1 - critRate) * normalHitMean + critRate * critHitMean);

  // A cast can land several instances (SKILL_MODEL.hits), each at its own branch: sum them for per-cast figures.
  let expectedPerCast = expectedPerAttempt;
  if (hitBranches.length > 1 && options.branch === undefined) {
    expectedPerCast = hitBranches.reduce((sum, b) => sum + (b === branch
      ? expectedPerAttempt
      : evaluateSkillDamage(build, defender, skillRow, { ...options, stats, rulesApplied: true, branch: b }, data).expectedPerAttempt), 0);
  }

  const timing = calcSkillTimingMs(stats, skillRow);
  return {
    // Exact damage for one rolled hit: base * float(0.97..1.03) [* 1.5 on a physical crit], then the same adjusters.
    damageAt: (floatRoll, isCrit, proc = sizeProcChance === 1) =>
      applyAdjusters(baseDamage * floatRoll * (isCrit && !magic ? 1.5 : 1), isCrit && !magic, hpRatio, proc && sizeProcChance > 0 ? procBonusBp : 0),
    skillId: skillRow._iID,
    skillName: skillRow.name || skillRow._kScriptLogic || `Skill ${skillRow._iID}`,
    magic,
    p1,
    p2,
    atkStat,
    defMitigation,
    eleMod,
    baseDamage,
    hitRate,
    critRate,
    sizeProcChance,
    normalHitMin,
    normalHitMean,
    normalHitMax,
    critHitMean,
    critHitMax,
    expectedPerAttempt,
    hitsPerCast: hitBranches.length,
    expectedPerCast,
    timing,
    instantDps: (expectedPerCast * 1000) / Math.max(1, timing.castLockMs),
  };
}

// ============================================================================
// 5. Multi-Second Skill Rotation & Auto-Attack Timeline Simulator
// ============================================================================

const GROUND_DOT_SCRIPTS = new Set([
  'Fire_Wall', 'Quagmire', 'Fire_Pillar', 'Meteor_Storm', 'Lord_of_Vermilion', 'Storm_Gust',
]);
const LOG_MS = 60000; // castLog covers the first minute

/**
 * Simulates a combat window (default 30,000 ms) with:
 * - Active skill priority list (casts highest-priority skill whose CD is ready)
 * - Auto-attack weaving whenever all priority skills are on CD
 * - Every cast locks the caster until its animation ends (`build.cancelBackswing`: until its interrupt frame); hits land at the
 *   client template's hit points (`castTimes`)
 * - Self-buff skills (`_kBuff1`) refreshing combat stats and dynamic skill parameters
 * - Multi-hit casts (`SKILL_MODEL.hits`), buff-triggered extra hits (`BUFF_PROCS`, e.g. Fear Breeze) and follow-up skills
 *   (`FOLLOW_UPS`, e.g. Warg Strike's hit on every Focused Arrow Strike once per 2.5 s; needs `build.skillLevels`)
 * - Periodic self-buffs (`PERIODIC_BUFFS`, e.g. the wolf's Warg Howl: +5% P.ATK for 10 s every 30 s) lifting the hits inside their windows
 * - Persistent ground DoT objects (`Fire_Wall`, `Storm_Gust`, etc.) ticking independently
 * - Totem on-cast floor stacks (`2500101`->`2500301`, `2500201`->`2500401`, etc.)
 * `castLog` lists every cast (start, lock, hit times) and trigger for timeline views.
 */
export function simulateRotation(build, defender, rotationSkillIds, durationMs = 30000, data = new Ro3DataStore(), trace = null) {
  const jobRow = data.row('JobConfig', build.career ?? 1100);
  const normalSkillId = build.normalAttackId ?? jobRow?._kSkillNormalID?.[0] ?? 1100001;
  const normalRow = data.row('SkillConfig', normalSkillId) ?? data.row('SkillConfig', 1000001);

  const activeBuffMap = new Map();
  const buffWindows = [];
  const setActiveBuff = (id, buff) => {
    const next = { startMs: 0, ...buff };
    const prev = activeBuffMap.get(id);
    if (prev) prev.expireMs = Math.min(prev.expireMs, next.startMs);
    activeBuffMap.set(id, next);
    buffWindows.push(next);
  };
  for (const b of build.activeBuffs ?? []) {
    const id = typeof b === 'object' ? b.id ?? b._iID : b;
    setActiveBuff(id, { id, expireMs: Infinity, piles: b.piles ?? 1, isTotemOwned: Boolean(b.isTotemOwned), sourceId: b.sourceId ?? 1 });
  }
  // A learned Season skill keeps its buff on you for the whole fight (SEASON_BUFFS); Gale Beat counts the trigger's casts instead.
  for (const [g, id] of Object.entries(SEASON_BUFFS)) {
    if (Number(build.skillLevels?.[g] ?? 0) > 0) setActiveBuff(id, { id, expireMs: Infinity, piles: 1, isTotemOwned: false, sourceId: 1 });
  }
  const galeOn = Number(build.skillLevels?.[GALE_BEAT.group] ?? 0) > 0;
  let galeStacks = 0;
  let cyclePtr = 0; // the game's auto-battle takes the next skill of its list after the one it cast

  const cdReadyAt = new Map();
  const groundObjects = [];
  const logEvents = [];
  const castLog = [];
  const nextFollowMs = new Map();
  const cancel = Boolean(build.cancelBackswing);
  // Timed buffs on you: the learned passives' periodic ones (the wolf's howl) and the pet lineup's (the Primary pet's cadence); each
  // is up while (t - firstMs) % periodMs < durMs. `build.timedBuffs` takes more ({ name, attrs: [[attribute, value]], periodMs, durMs }).
  const pet = petEffects(build.pets, data);
  const ownerHitEvents = [];
  const recordOwnerHit = (entry) => {
    if (pet.ownerHits.length) { entry.token = ownerHitEvents.length; ownerHitEvents.push(entry); }
    trace?.push(entry);
  };
  const periodic = [
    ...(build.periodicOff ? [] : Object.entries(PERIODIC_BUFFS)
      .filter(([group]) => Number(build.skillLevels?.[group] ?? 0) > 0)
      .map(([, p]) => ({ ...p, firstMs: Number(build.periodicStartMs ?? 0) }))),
    ...[...pet.timedBuffs, ...asArray(build.timedBuffs)].map((t, i) => ({ buff: 9e9 + i, firstMs: 0, ...t })),
  ];
  const periodicUp = (p, tMs) => tMs >= p.firstMs && (tMs - p.firstMs) % p.periodMs < p.durMs
    && (!p.afterHit || (tMs - p.firstMs) % p.periodMs > 0);
  let totalExpectedDamage = 0;
  let totalBurst5sDamage = 0;
  let casts = 0;
  let autoSwings = 0;
  let groundTicks = 0;

  let nowMs = 0;
  let nextAutoSwingMs = 0;
  // Totem combat passives: those of the deployed totems' skills plus the legacy single-id fields (profiles, tests).
  const totemFx = totemPassives(build, data);
  if (build.totemCastStackBuffId) {
    const cap = Math.max(1, Number(data.row('BuffConfig', build.totemCastStackBuffId)?._iMaxStack ?? 2)) + (build.totemExtraMaxStack ?? 0);
    totemFx.castStacks.push({ guid: 1, buffId: build.totemCastStackBuffId, durMs: 5000, cap });
  }
  if (build.totemExtraHitPassiveId) totemFx.extraHits.push({ guid: 1, passiveId: build.totemExtraHitPassiveId, magic: TOTEM_EXTRA_HIT[build.totemExtraHitPassiveId] ?? null });
  const nextTotemExtraProcMs = new Map(); // per (totem, passive), like TotemEffects.Proc's cooldown key
  const initStats = buildCharacterStats(build, data);
  let currentSp = build.currentSp ?? initStats[102];
  const energyLimit = build.energyLimit ?? 100;
  let currentEnergy = build.initialEnergy ?? energyLimit;
  const energyRecoverIntervalMs = build.energyRecoverIntervalMs ?? 0;
  const energyRecoverValue = build.energyRecoverValue ?? 0;
  let nextEnergyTickMs = energyRecoverIntervalMs > 0 ? energyRecoverIntervalMs : Infinity;

  // Helper to get live build snapshot with unexpired buffs + cached StatSheet
  const sheetByBuffSig = new Map();
  const currentBuildSnapshot = (tMs) => {
    let sig = '';
    const list = [];
    // Pet impacts are evaluated after the cast timeline is known. Reading a future timestamp must not erase earlier buff windows.
    for (const b of buffWindows) {
      if (b.startMs > tMs || b.expireMs <= tMs) continue;
      list.push(b);
      sig += `${b.id}:${b.piles},`;
    }
    for (const p of periodic) {
      if (!periodicUp(p, tMs)) continue;
      list.push({ id: p.buff, _kChangeAttri: p.attrs, expireMs: Infinity, piles: 1, isTotemOwned: false, sourceId: 0 });
      sig += `${p.buff}:1,`;
    }
    let cached = sheetByBuffSig.get(sig);
    if (!cached) {
      const snapBuild = { ...build, activeBuffs: list };
      cached = { snapBuild, stats: buildCharacterStats(snapBuild, data) };
      sheetByBuffSig.set(sig, cached);
    }
    return cached;
  };

  // Advance ground objects up to targetTimeMs
  const tickGroundObjectsUpTo = (limitMs) => {
    for (const obj of groundObjects) {
      while (obj.nextTickMs <= limitMs && obj.nextTickMs < obj.expiresMs && obj.nextTickMs <= durationMs) {
        const { snapBuild, stats } = currentBuildSnapshot(obj.nextTickMs);
        const evalRes = evaluateSkillDamage(snapBuild, defender, obj.skillRow, { stats, rulesApplied: true }, data);
        totalExpectedDamage += evalRes.expectedPerAttempt;
        recordOwnerHit({ t: obj.nextTickMs, kind: 'dot', ev: evalRes, proc: null });
        if (obj.nextTickMs <= 5000) totalBurst5sDamage += evalRes.expectedPerAttempt;
        groundTicks++;
        obj.nextTickMs += obj.intervalMs;
      }
    }
  };

  while (nowMs < durationMs) {
    while (nowMs >= nextEnergyTickMs) {
      currentEnergy = Math.min(energyLimit, currentEnergy + energyRecoverValue);
      nextEnergyTickMs += energyRecoverIntervalMs;
    }
    const { snapBuild: snap, stats } = currentBuildSnapshot(nowMs);

    // Helper to check & compute skill SP and Energy cost (_kCost types 1, 7, 8)
    const getSkillCost = (r) => {
      let spCost = 0;
      let energyCost = 0;
      for (const c of asArray(r._kCost)) {
        if (!Array.isArray(c) || c.length < 3) continue;
        if (c[0] === 1 && c.length >= 4 && Number(c[1]) === 2001) {
          spCost += Math.max(0, Number(c[3]) + Math.trunc((stats[102] * Number(c[2])) / 10000));
        } else if (c[0] === 7 && c.length >= 4 && Number(c[1]) === 2001) {
          spCost += Math.max(0, Math.trunc((stats[Number(c[2])] * Number(c[3])) / 10000));
        } else if (c[0] === 8 && c.length >= 4) {
          const pct = Math.ceil((energyLimit * Number(c[2])) / 10000);
          energyCost += Math.max(pct, Number(c[3]));
        }
      }
      return { spCost, energyCost };
    };

    // Pick the skill to cast: the first ready one of the priority list, or (build.rotationCycle, the game's auto-battle) the first ready one
    // from the skill after the last cast, so a skill with no cooldown does not starve the ones behind it.
    let chosenRow = null;
    let chosenCost = { spCost: 0, energyCost: 0 };
    let chosenAt = -1;
    let isAuto = false;
    const listLen = rotationSkillIds.length;
    for (let k = 0; k < listLen; k++) {
      const at = build.rotationCycle ? (cyclePtr + k) % listLen : k;
      const sid = rotationSkillIds[at];
      const r = data.row('SkillConfig', sid);
      if (!r || Number(r._iBasicType) !== 1) continue;
      const group = Number(r._iSkillID || sid);
      if ((cdReadyAt.get(group) ?? 0) > nowMs) continue;
      if (build.ridden === false && MOUNTED_ONLY.has(group)) continue;
      const cost = getSkillCost(r);
      if ((build.enforceSpCost && currentSp < cost.spCost) || currentEnergy < cost.energyCost) continue;
      // If it's a pure buff skill (_kDamageParam1 empty), only cast if buff is not already active
      const hasDmg = Array.isArray(r._kDamageParam1) && r._kDamageParam1.length > 0;
      const buff1 = Array.isArray(r._kBuff1) && r._kBuff1.length > 0 ? r._kBuff1[0][0] : 0;
      if (!hasDmg && buff1 && activeBuffMap.has(buff1) && activeBuffMap.get(buff1).expireMs > nowMs + 1000) {
        continue;
      }
      chosenRow = r;
      chosenCost = cost;
      chosenAt = at;
      break;
    }
    if (build.rotationCycle && chosenAt >= 0) cyclePtr = (chosenAt + 1) % listLen;

    if (!chosenRow) {
      if (nowMs < nextAutoSwingMs) {
        const earliestSkillReady = rotationSkillIds
          .map((sid) => cdReadyAt.get(Number(data.row('SkillConfig', sid)?._iSkillID || sid)) ?? Infinity)
          .reduce((a, b) => Math.min(a, b), Infinity);
        const jumpTo = Math.min(nextAutoSwingMs, earliestSkillReady, durationMs);
        if (jumpTo > nowMs) {
          tickGroundObjectsUpTo(jumpTo);
          nowMs = jumpTo;
          continue;
        }
      }
      chosenRow = normalRow;
      isAuto = true;
    }

    // King of the Wargs: while its buff lasts, Warg Hunt is cast in its Enhanced skill mode.
    const kingBuff = (tMs) => [...buffWindows].reverse().find((b) => Math.floor(Number(b.id) / 100) === KING_OF_THE_PACK.family && b.startMs <= tMs && b.expireMs > tMs);
    const enhanced = isAuto || !kingBuff(nowMs) ? undefined : KING_OF_THE_PACK.enhance[Number(chosenRow._iSkillID)];
    let castRow = enhanced === undefined ? chosenRow : data.row('SkillConfig', Number(chosenRow._iSkillID) * 100 + enhanced * 10 + Number(chosenRow._iLevel)) ?? chosenRow;
    if (!isAuto && enhanced === undefined) {
      // Season skills (SEASON_BUFFS): a buff can put the skill in another mode, and Gale Beat's fifth cast is the enhanced skill.
      const base = Number(chosenRow._iSkillID);
      const lv = Number(chosenRow._iLevel);
      const mode = SEASON_MODE_GROUPS.has(base) ? skillMode(base, snap.activeBuffs, data) : 0;
      const gale = galeOn && base === GALE_BEAT.trigger;
      const sent = gale && galeStacks >= GALE_BEAT.casts ? data.row('SkillConfig', GALE_BEAT.enhanced[mode === 4 ? 1 : 0] * 100 + lv) : null;
      if (gale) galeStacks = sent ? 0 : Math.min(GALE_BEAT.casts, galeStacks + 1);
      castRow = sent ?? (mode > 0 ? data.row('SkillConfig', base * 100 + mode * 10 + lv) : null) ?? castRow;
    }
    const effectiveRow = applySkillParameterRules(castRow, snap.activeBuffs, data);
    const timing = calcSkillTimingMs(stats, effectiveRow);
    const group = Number(effectiveRow._iSkillID || effectiveRow._iID);
    if (timing.cdMs > 0) cdReadyAt.set(group, nowMs + timing.cdMs);
    for (const g of COOLDOWN_RESETS[group] ?? []) cdReadyAt.delete(g);
    currentSp = Math.max(0, currentSp - chosenCost.spCost);
    currentEnergy = Math.max(0, currentEnergy - chosenCost.energyCost);

    // Hits land at the client template's hit points (CombatService.ImpactOffset); the cast locks the caster until its animation ends.
    const hitBranches = hitsOf(effectiveRow);
    const { hitAt, fullMs, lockMs } = castTimes(data, effectiveRow, timing, hitBranches.length, cancel);
    const impactMs = nowMs + hitAt[0];
    tickGroundObjectsUpTo(Math.min(impactMs, durationMs));
    if (nowMs < LOG_MS) castLog.push({ t: nowMs, kind: isAuto ? 'auto' : 'cast', id: effectiveRow._iID, name: effectiveRow.name || effectiveRow._kScriptLogic, lockMs, fullMs, hits: hitAt.map((x) => nowMs + x) });

    if (impactMs <= durationMs) {
      // Totem on-cast stacks (CastLanded), per source totem
      for (const { guid, buffId: bId, durMs, cap } of totemFx.castStacks) {
        const key = `totem:${guid}:${bId}`;
        const prev = activeBuffMap.get(key);
        setActiveBuff(key, {
          id: bId,
          startMs: impactMs,
          expireMs: impactMs + durMs,
          piles: Math.min(cap, (prev?.expireMs > impactMs ? prev.piles : 0) + 1),
          isTotemOwned: true,
          sourceId: guid,
        });
      }

      // Apply _kBuff1 self-buffs (Warg Charge's 10% Physical DMG needs the wolf ridden)
      if (Array.isArray(effectiveRow._kBuff1) && !(build.ridden === false && RIDING_BUFF_ONLY.has(group))) {
        for (const tuple of effectiveRow._kBuff1) {
          if (Array.isArray(tuple) && tuple.length >= 3 && tuple[0] > 0 && tuple[1] > 0) {
            const bId = Number(tuple[0]);
            const dur = Number(tuple[2]) > 0 ? Number(tuple[2]) : 60000;
            setActiveBuff(bId, { id: bId, startMs: impactMs, expireMs: impactMs + dur, piles: 1, isTotemOwned: false, sourceId: 0 });
          }
        }
      }

      const script = effectiveRow._kScriptLogic || '';
      const logic = Array.isArray(effectiveRow._kLogicData) ? effectiveRow._kLogicData : [];
      if (GROUND_DOT_SCRIPTS.has(script) && logic.length >= 3) {
        const intervalMs = Math.max(50, Number(logic[1]));
        const objDurMs = Math.max(1, Number(logic[2]));
        groundObjects.push({
          skillRow: effectiveRow,
          intervalMs,
          nextTickMs: impactMs,
          expiresMs: impactMs + objDurMs,
        });
        tickGroundObjectsUpTo(impactMs);
      } else if (Array.isArray(effectiveRow._kDamageParam1) && effectiveRow._kDamageParam1.length > 0) {
        // One cast can land several instances (SKILL_MODEL.hits), each at its template hit point.
        const skillTags = asArray(effectiveRow._kSkilltag);
        for (let h = 0; h < hitBranches.length; h++) {
          const hitMs = nowMs + hitAt[h];
          if (hitMs > durationMs) break;
          const { snapBuild: impactSnap, stats: impactStats } = currentBuildSnapshot(hitMs);
          const evalRes = evaluateSkillDamage(impactSnap, defender, effectiveRow, { stats: impactStats, rulesApplied: true, branch: hitBranches[h] }, data);
          let hitDmg = evalRes.expectedPerAttempt;
          let procEvent = null;
          // Totem ExtraHitDamage passive procs (2504001/2514001 magic, 2515701/2507501 physical: chance, 110% ATK/MATK, CD per totem)
          if (h === 0) for (const { guid, passiveId, magic } of totemFx.extraHits) {
            const key = `${guid}:${passiveId}`;
            if ((magic !== null && magic !== evalRes.magic) || hitMs < (nextTotemExtraProcMs.get(key) ?? 0)) continue;
            const pRow = data.row('BuffConfig', passiveId);
            const chanceBp = Number(pRow?._kLogicData?.[0] ?? 1500);
            const coeff = Number(pRow?._kDescData?.[1] ?? 110);
            const cdSec = Number(pRow?._kDescData?.[2] ?? 5);
            const extraHit = Math.floor(((evalRes.magic ? impactStats[104] : impactStats[103]) * coeff) / 100);
            const pProc = evalRes.hitRate * (chanceBp / 10000);
            hitDmg += pProc * extraHit;
            (procEvent ??= []).push({ p: pProc, dmg: extraHit });
            // Expected cooldown advancement under Bernoulli proc trials
            nextTotemExtraProcMs.set(key, hitMs + Math.round(pProc * cdSec * 1000));
          }
          totalExpectedDamage += hitDmg;
          if (hitMs <= 5000) totalBurst5sDamage += hitDmg;
          recordOwnerHit({ t: hitMs, kind: isAuto ? 'auto' : 'skill', ev: evalRes, proc: procEvent });
          // Buff-triggered extra hits (BUFF_PROCS): an expected-value event that happens with probability prob. Only the targeted instance
          // counts: the extra instances of a cast (a later branch: Focused Arrow Strike's 15% area hit) do not trigger it again.
          if (!(hitBranches[h] > 0)) for (const b of impactSnap.activeBuffs ?? []) {
            const rule = BUFF_PROCS[Math.floor(Number(b.id) / 100)];
            const bRow = rule && skillTags.includes(rule.tag) ? data.row('BuffConfig', b.id) : null;
            const chance = Number(bRow?._kLogicData?.[0] ?? 0) / 10000;
            if (!(chance > 0)) continue;
            const procRes = evaluateSkillDamage(impactSnap, defender, buffProcRow(bRow, rule), { stats: impactStats, rulesApplied: true }, data);
            const prob = evalRes.hitRate * chance;
            totalExpectedDamage += prob * procRes.expectedPerAttempt;
            if (hitMs <= 5000) totalBurst5sDamage += prob * procRes.expectedPerAttempt;
            trace?.push({ t: hitMs, kind: 'skill', ev: procRes, proc: null, prob });
            if (hitMs < LOG_MS) castLog.push({ t: hitMs, kind: 'proc', name: rule.name, prob, hits: [hitMs], lockMs: 0 });
          }
          if (h > 0) continue;
          // Energy recovery on hit (_kHitRecoverEnergy: [energyId, amount])
          if (Array.isArray(effectiveRow._kHitRecoverEnergy) && effectiveRow._kHitRecoverEnergy.length >= 2) {
            const eAmount = Number(effectiveRow._kHitRecoverEnergy[1] || 0);
            currentEnergy = Math.min(energyLimit, currentEnergy + eAmount);
          }
          if (logEvents.length < 12) {
            logEvents.push({
              timeMs: hitMs,
              skill: evalRes.skillName,
              expectedDmg: Math.round(hitDmg),
            });
          }
        }
      }
      // Extra skill rows cast along with this cast: a follow-up (FOLLOW_UPS) and King of the Wargs' wolf followers. Each damage instance
      // lands at its own template point and reads the buffs up at that moment.
      const landExtra = (xRow, label, kind) => {
        const fRow = applySkillParameterRules({ ...xRow, name: label }, snap.activeBuffs, data);
        const branches = hitsOf(fRow);
        const times = castTimes(data, fRow, calcSkillTimingMs(stats, fRow), branches.length).hitAt.map((x) => nowMs + x).filter((x) => x <= durationMs);
        times.forEach((fHitMs, i) => {
          const { snapBuild: fSnap, stats: fStats } = currentBuildSnapshot(fHitMs);
          const fRes = evaluateSkillDamage(fSnap, defender, fRow, { stats: fStats, rulesApplied: true, branch: branches[i] }, data);
          totalExpectedDamage += fRes.expectedPerAttempt;
          if (fHitMs <= 5000) totalBurst5sDamage += fRes.expectedPerAttempt;
          recordOwnerHit({ t: fHitMs, kind: 'skill', ev: fRes, proc: null });
        });
        if (times.length && times[0] < LOG_MS) castLog.push({ t: times[0], kind, name: fRow.name, hits: times, lockMs: 0 });
      };
      // Follow-up skills (FOLLOW_UPS): a cast of the trigger skill sends the follow-up row once per ICD, landing at its own hit point.
      // Gale Beat's enhanced cast is a Focused Arrow Strike for this too.
      const followGroup = GALE_BEAT.enhanced.includes(group) ? GALE_BEAT.trigger : group;
      const follow = FOLLOW_UPS[followGroup];
      const followLv = follow ? Number(build.skillLevels?.[follow.group] ?? 0) : 0;
      const followRow = followLv > 0 ? data.row('SkillConfig', follow.group * 100 + follow.mode * 10 + followLv) : null;
      if (followRow && nowMs >= (nextFollowMs.get(followGroup) ?? 0)) {
        nextFollowMs.set(followGroup, nowMs + follow.icdMs);
        landExtra(followRow, `${followRow.name || followRow._kScriptLogic} (follow-up)`, 'follow');
      }
      // King of the Wargs (a rider's casts only): Warg Charge and Warg Bite also send the wolf followers, at the level of the buff.
      const king = kingBuff(nowMs);
      const extraGroup = !isAuto && king ? KING_OF_THE_PACK.extras[group] : 0;
      const extraRow = extraGroup ? data.row('SkillConfig', extraGroup * 100 + (Number(king.id) % 100)) : null;
      if (extraRow) landExtra(extraRow, extraRow.name || extraRow._kScriptLogic, 'follow');
      if (isAuto) autoSwings++;
      else casts++;
    }

    const castEndMs = nowMs + lockMs;
    if (isAuto) nextAutoSwingMs = castEndMs;
    else nextAutoSwingMs = Math.max(nextAutoSwingMs, castEndMs);
    tickGroundObjectsUpTo(Math.min(castEndMs, durationMs));
    nowMs = castEndMs;
  }

  const petHitAt = pet.hits.flatMap((h) => {
    const ts = [];
    for (let cast = 0; cast * h.periodMs < durationMs; cast++) {
      const t = h.firstMs + cast * h.periodMs;
      if (t <= durationMs) ts.push({ t, h, cast });
    }
    return ts;
  }).sort((a, b) => a.t - b.t || Number(Boolean(a.h.sharePct)) - Number(Boolean(b.h.sharePct)));
  const primaryTotals = new Map();
  const primaryHitsByToken = new Map();
  for (const { t, h, cast } of petHitAt) {
    const token = h.primary ? `pet:${cast}:${h.primaryIndex}` : undefined;
    const requiresHit = h.requiresPrimary !== undefined ? `pet:${cast}:${h.requiresPrimary}` : undefined;
    const prob = requiresHit === undefined ? 1 : primaryHitsByToken.get(requiresHit).hitRate;
    let res;
    if (h.sharePct) {
      const source = primaryTotals.get(cast);
      if (!source) continue;
      const scale = (v) => Math.round(v * h.sharePct);
      res = {
        skillId: h.id, skillName: h.name, magic: false, hitRate: 1, critRate: 0,
        expectedPerAttempt: scale(source.mean),
        damageAt: (roll) => scale(roll < 1 ? source.lo : roll > 1 ? source.hi : source.mean),
      };
    } else {
      const { snapBuild, stats } = currentBuildSnapshot(t);
      res = evaluateSkillDamage({ ...snapBuild, element: 1 }, defender, h.row, { stats, rulesApplied: true }, data);
    }
    if (h.primary) {
      primaryHitsByToken.set(token, res);
      const sum = primaryTotals.get(cast) ?? { mean: 0, lo: 0, hi: 0 };
      sum.mean += res.expectedPerAttempt; sum.lo += res.normalHitMin; sum.hi += res.critRate > 0 ? res.critHitMax : res.normalHitMax;
      primaryTotals.set(cast, sum);
    }
    totalExpectedDamage += prob * res.expectedPerAttempt;
    if (t <= 5000) totalBurst5sDamage += prob * res.expectedPerAttempt;
    trace?.push({ t, kind: 'pet', ev: res, proc: null, prob, token, requiresHit, ...(h.primary ? { primaryCast: cast } : {}), ...(h.sharePct ? { shareCast: cast, sharePct: h.sharePct } : {}) });
    if (!h.primary && t < LOG_MS) castLog.push({ t, kind: 'proc', name: h.name, prob, hits: [t], lockMs: 0 });
  }
  for (const c of pet.casts) for (let t = c.firstMs; t < Math.min(durationMs, LOG_MS); t += c.periodMs) {
    castLog.push({ t, kind: 'pet', id: c.id, name: c.name, lockMs: 0, hits: c.hits.map((h) => t + h).filter((h) => h <= durationMs) });
  }
  // Owner-hit windows (e.g. Dullahan) see only real owner attacks, never damage from another pet proc.
  ownerHitEvents.sort((a, b) => a.t - b.t);
  for (const h of pet.ownerHits) {
    const recent = [];
    for (const e of ownerHitEvents) {
      if (!periodicUp(h, e.t)) continue;
      while (recent.length && recent[0].t + h.icdMs <= e.t) recent.shift();
      const prob = e.ev.hitRate * Math.max(0, 1 - recent.reduce((sum, p) => sum + p.prob, 0));
      recent.push({ t: e.t, prob });
      const { snapBuild, stats } = currentBuildSnapshot(e.t);
      const res = evaluateSkillDamage({ ...snapBuild, element: 1 }, defender, h.row, { stats, rulesApplied: true }, data);
      totalExpectedDamage += prob * res.expectedPerAttempt;
      if (e.t <= 5000) totalBurst5sDamage += prob * res.expectedPerAttempt;
      trace?.push({ t: e.t, kind: 'pet', ev: res, proc: null, prob, requiresHit: e.token, icdKey: h.row._iID, icdMs: h.icdMs });
      if (prob > 0 && e.t < LOG_MS) castLog.push({ t: e.t, kind: 'proc', name: h.name, prob, hits: [e.t], lockMs: 0 });
    }
  }

  // The windows of the periodic buffs, for the cast log (clipped to the fight and to the first minute).
  for (const p of periodic) {
    const attrs = p.attrs ?? asPairs(data.row('BuffConfig', p.buff)?._kChangeAttri);
    for (let t = p.firstMs; t < Math.min(durationMs, LOG_MS); t += Math.max(1, p.periodMs)) {
      const from = Math.max(0, t);
      const durMs = Math.min(t + p.durMs, durationMs) - from;
      if (durMs > 0) castLog.push({ t: from, kind: 'buff', name: p.name, durMs, attrs, hits: [], lockMs: 0 });
    }
  }

  return {
    durationMs,
    totalExpectedDamage,
    sustainedDps: (totalExpectedDamage * 1000) / durationMs,
    burst5sDps: (totalBurst5sDamage * 1000) / Math.min(5000, durationMs),
    casts,
    autoSwings,
    groundTicks,
    sampleTimeline: logEvents,
    castLog,
  };
}

// ============================================================================
// 6. Maximum-Damage Stat Allocation & Build/Affix Optimizer
// ============================================================================

/**
 * Solves for the exact stat allocation [STR, AGI, VIT, INT, DEX, LUK] in [1..99]^6
 * subject to sum(StatCost(s_i)) <= budget that maximizes the objective (burst or sustained DPS).
 *
 * Uses a hybrid solver:
 * 1. Exact 2D/3D grid sweep over the primary offensive stats for the job/skill family
 * 2. Multi-step coordinate ascent + pairwise 2-opt stat swaps across all 6 stats to handle
 *    stepped ceiling thresholds (`Math.ceil` in `StatCalculator`) and non-linear `StatCost` tiers.
 *
 * ponytail: 6D exhaustive search over 99^6 (~9.4e11 states) is pruned to active offensive axes +
 * multi-step coordinate ascent/2-opt; if a custom stunt ever couples all 6 stats non-monotonically,
 * upgrade to meet-in-the-middle pareto frontier DP over cost budgets [0..budget].
 */
export function optimizeStatAllocation(build, defender, options = {}, data = new Ro3DataStore()) {
  const level = build.level ?? 50;
  const budget = options.budget ?? totalStatPoints(level, build.bonusStatPoints ?? 0, data);
  const mode = options.mode ?? 'sustained'; // 'sustained' | 'burst'
  const rotation = options.rotation ?? [1100210, 1100110];
  const primarySkillRow = data.row('SkillConfig', rotation[0]) ?? data.row('SkillConfig', 1100110);

  const costTable = new Int32Array(MAX_STAT + 1);
  for (let v = 1; v <= MAX_STAT; v++) costTable[v] = statCost(v, data);

  const evalCache = new Map();
  const scoreStats = (stats6) => {
    const key = stats6.join(',');
    if (evalCache.has(key)) return evalCache.get(key);
    const candidateBuild = { ...build, stats: stats6 };
    let val;
    if (mode === 'burst') {
      val = evaluateSkillDamage(candidateBuild, defender, primarySkillRow, {}, data).expectedPerAttempt;
    } else {
      val = simulateRotation(candidateBuild, defender, rotation, options.windowMs ?? 20000, data).sustainedDps;
    }
    evalCache.set(key, val);
    return val;
  };

  let bestStats = [1, 1, 1, 1, 1, 1];
  let bestScore = scoreStats(bestStats);

  // Stage 1: Exact 2D grid sweep over top candidate pairs (STR/DEX/INT + LUK/AGI/DEX)
  const jobRow = data.row('JobConfig', build.career ?? 1100);
  const isRanged = jobRow && Number(jobRow._iDistanceType) === 2;
  const isMagic = Number(primarySkillRow?._iDmgType) === 2;
  const primaryIdx = isMagic ? 3 : isRanged ? 4 : 0; // INT(3), DEX(4), or STR(0)
  const secondaryIndices = isMagic ? [4, 1] : isRanged ? [5, 1] : [5, 4, 1];

  for (const secIdx of secondaryIndices) {
    for (let pVal = 1; pVal <= MAX_STAT; pVal += (pVal < 80 ? 4 : 1)) {
      const rem1 = budget - costTable[pVal];
      if (rem1 < 0) break;
      for (let sVal = 1; sVal <= MAX_STAT; sVal += (sVal < 60 ? 6 : 2)) {
        const rem2 = rem1 - costTable[sVal];
        if (rem2 < 0) break;
        const thirdIdx = [5, 1, 4].find((idx) => idx !== primaryIdx && idx !== secIdx) ?? 2;
        let tVal = 1;
        while (tVal < MAX_STAT && costTable[tVal + 1] <= rem2) tVal++;
        const cand = [1, 1, 1, 1, 1, 1];
        cand[primaryIdx] = pVal;
        cand[secIdx] = sVal;
        cand[thirdIdx] = tVal;
        const sc = scoreStats(cand);
        if (sc > bestScore) {
          bestScore = sc;
          bestStats = cand;
        }
      }
    }
  }

  // Stage 2: Multi-step coordinate ascent & pairwise 2-opt swaps over all 6 stats
  let improved = true;
  let iter = 0;
  while (improved && ++iter <= 15) {
    improved = false;
    const currentUsed = bestStats.reduce((a, v) => a + costTable[v], 0);
    const free = budget - currentUsed;

    // Try single-stat increments of +1..+5 within budget
    for (let i = 0; i < 6; i++) {
      for (let step = 1; step <= 5; step++) {
        if (bestStats[i] + step > MAX_STAT) break;
        const deltaCost = costTable[bestStats[i] + step] - costTable[bestStats[i]];
        if (deltaCost <= free) {
          const next = [...bestStats];
          next[i] += step;
          const sc = scoreStats(next);
          if (sc > bestScore + 1e-9) {
            bestScore = sc;
            bestStats = next;
            improved = true;
          }
        }
      }
    }

    // Try pairwise transfers: reduce stat i by 1..4, increase stat j as much as budget allows
    for (let i = 0; i < 6; i++) {
      if (bestStats[i] <= 1) continue;
      for (let drop = 1; drop <= Math.min(4, bestStats[i] - 1); drop++) {
        const baseCand = [...bestStats];
        baseCand[i] -= drop;
        const avail = budget - baseCand.reduce((a, v) => a + costTable[v], 0);
        for (let j = 0; j < 6; j++) {
          if (i === j || baseCand[j] >= MAX_STAT) continue;
          let targetJ = baseCand[j];
          while (targetJ < MAX_STAT && costTable[targetJ + 1] - costTable[baseCand[j]] <= avail) {
            targetJ++;
          }
          if (targetJ > baseCand[j]) {
            const next = [...baseCand];
            next[j] = targetJ;
            const sc = scoreStats(next);
            if (sc > bestScore + 1e-9) {
              bestScore = sc;
              bestStats = next;
              improved = true;
            }
          }
        }
      }
    }
  }

  const used = bestStats.reduce((a, v) => a + costTable[v], 0);
  const finalBuild = { ...build, stats: bestStats };
  return {
    budget,
    usedPoints: used,
    unspentPoints: budget - used,
    optimalStats: {
      STR: bestStats[0],
      AGI: bestStats[1],
      VIT: bestStats[2],
      INT: bestStats[3],
      DEX: bestStats[4],
      LUK: bestStats[5],
      raw: bestStats,
    },
    optimalScore: bestScore,
    statSheet: buildCharacterStats(finalBuild, data),
    rotationSimulation: simulateRotation(finalBuild, defender, rotation, options.windowMs ?? 20000, data),
  };
}

/**
 * The best split of the stat points between two stats: `pair` holds two 0-based indexes into [STR, AGI, VIT, INT, DEX, LUK], every other
 * stat stays at 1, and for each value of the first stat the second takes everything the budget still buys (up to 99). Scored like
 * `optimizeStatAllocation` (sustained DPS of `options.rotation`). ponytail: the sweep takes the first stat in steps of 4 and then every
 * value around the best step, so it assumes one DPS peak along the split.
 */
export function optimizeStatSplit(build, defender, pair, options = {}, data = new Ro3DataStore()) {
  const budget = options.budget ?? totalStatPoints(build.level ?? 50, build.bonusStatPoints ?? 0, data);
  const rotation = options.rotation ?? [];
  const cost = new Int32Array(MAX_STAT + 1);
  for (let v = 1; v <= MAX_STAT; v++) cost[v] = statCost(v, data);
  const [a, b] = pair;
  const splitAt = (va) => {
    if (cost[va] > budget) return null;
    let vb = 1;
    while (vb < MAX_STAT && cost[va] + cost[vb + 1] <= budget) vb++;
    const stats = [1, 1, 1, 1, 1, 1];
    stats[a] = va;
    stats[b] = vb;
    return stats;
  };
  const scores = new Map();
  const score = (va) => {
    if (!scores.has(va)) {
      const stats = splitAt(va);
      scores.set(va, stats ? simulateRotation({ ...build, stats }, defender, rotation, options.windowMs ?? 20000, data).sustainedDps : -Infinity);
    }
    return scores.get(va);
  };
  let best = 1;
  for (let va = 1; va <= MAX_STAT; va += 4) if (score(va) > score(best)) best = va;
  for (let va = Math.max(1, best - 3); va <= Math.min(MAX_STAT, best + 3); va++) if (score(va) > score(best)) best = va;
  const stats = splitAt(best);
  return { stats, dps: score(best), used: usedStatPoints(stats, data), budget };
}

/**
 * Evaluates candidate skill rotations and computes marginal affix weights at the optimal stat build.
 */
export function optimizeRotationAndAffixes(build, defender, candidateRotations, data = new Ro3DataStore()) {
  const rotationResults = candidateRotations.map((rot) => {
    const sim = simulateRotation(build, defender, rot.skills, 20000, data);
    return {
      name: rot.name,
      skills: rot.skills,
      sustainedDps: sim.sustainedDps,
      burst5sDps: sim.burst5sDps,
      casts: sim.casts,
      autoSwings: sim.autoSwings,
      groundTicks: sim.groundTicks,
    };
  });
  rotationResults.sort((a, b) => b.sustainedDps - a.sustainedDps);
  const bestRotation = rotationResults[0];

  const baseDps = bestRotation.sustainedDps;
  const probes = [
    { label: '+1 STR (Attr 1)', attr: [1, 1], powerCost: 50 },
    { label: '+1 AGI (Attr 2)', attr: [2, 1], powerCost: 50 },
    { label: '+1 INT (Attr 4)', attr: [4, 1], powerCost: 50 },
    { label: '+1 DEX (Attr 5)', attr: [5, 1], powerCost: 50 },
    { label: '+1 LUK (Attr 6)', attr: [6, 1], powerCost: 50 },
    { label: '+10 P.ATK (Attr 103)', attr: [103, 10], powerCost: 50 },
    { label: '+10 M.ATK (Attr 104)', attr: [104, 10], powerCost: 50 },
    { label: '+1% P.ATK (Attr 1031 = 100)', attr: [1031, 100], powerCost: 200 },
    { label: '+1% M.ATK (Attr 1041 = 100)', attr: [1041, 100], powerCost: 200 },
    { label: '+1% CRIT Rate (Attr 111 = 100)', attr: [111, 100], powerCost: 100 },
    { label: '+1% Crit DMG (Attr 209 = 100)', attr: [209, 100], powerCost: 100 },
    { label: '+1% P.DMG Bonus (Attr 211 = 100)', attr: [211, 100], powerCost: 200 },
    { label: '+1% M.DMG Bonus (Attr 213 = 100)', attr: [213, 100], powerCost: 200 },
  ];

  const affixWeights = probes.map((p) => {
    const modBuild = {
      ...build,
      affixAttrs: [...(build.affixAttrs ?? []), p.attr],
    };
    const newDps = simulateRotation(modBuild, defender, bestRotation.skills, 20000, data).sustainedDps;
    const deltaDps = newDps - baseDps;
    const pctGain = baseDps > 0 ? (deltaDps / baseDps) * 100 : 0;
    return {
      label: p.label,
      deltaDps,
      pctGain,
      dpsPer100Power: p.powerCost > 0 ? (deltaDps / p.powerCost) * 100 : 0,
    };
  });
  affixWeights.sort((a, b) => b.deltaDps - a.deltaDps);

  return { rotationResults, bestRotation, affixWeights };
}

// ============================================================================
// 6b. Monte Carlo Damage Distribution (`CombatService.Damage` rolls replayed over the simulated rotation)
// ============================================================================

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Runs `simulateRotation` once to collect its timed damage events, then replays them `options.runs` times with the
 * server's rolls: a miss when rand >= hitRate (no roll when the skill never misses), damage float uniform
 * [0.97, 1.03), physical crit when rand < critRate (x1.5).
 * Returns per-run totals, per-bucket cumulative damage (runs x (nBuckets + 1)), per-skill aggregates and per-hit histograms.
 * `captureRun` also retains the first run's actual rolled hits for visual playback without consuming additional randomness.
 *
 * ponytail: the cast timeline stays deterministic (exactly as in simulateRotation); only damage rolls are random, and
 * the totem extra-hit passive is a Bernoulli(p) per eligible event instead of simulating its cooldown. A buff-triggered
 * hit (trace event with `prob`) is drawn once per run, independent of the hit that triggers it.
 */
export function simulateDistribution(build, defender, rotationSkillIds, durationMs = 30000, options = {}, data = new Ro3DataStore()) {
  const bucketMs = options.bucketMs ?? 1000;
  const bins = options.bins ?? 48;
  const rng = mulberry32(options.seed ?? 1);
  const trace = [];
  const deterministic = simulateRotation(build, defender, rotationSkillIds, durationMs, data, trace);
  trace.sort((a, b) => a.t - b.t);
  // Cap runs x events so a long window of fast skills cannot freeze the page.
  const runs = Math.max(1, Math.min(Math.trunc(options.runs ?? 2000), Math.max(200, Math.floor(4e7 / Math.max(1, trace.length)))));
  const nBuckets = Math.max(1, Math.ceil(durationMs / bucketMs));

  const skills = [];
  const byId = new Map();
  const events = trace.map((e) => {
    let sk = byId.get(e.ev.skillId);
    if (!sk) {
      sk = {
        id: e.ev.skillId,
        name: e.ev.skillName,
        kind: e.kind === 'auto' ? 'auto' : e.kind === 'pet' ? 'pet' : 'skill',
        magic: e.ev.magic,
        events: 0,
        total: 0,
        hits: 0,
        crits: 0,
        misses: 0,
        lo: Infinity,
        hi: -Infinity,
        perBucket: new Float64Array(nBuckets),
        normalBins: null,
        critBins: null,
      };
      byId.set(sk.id, sk);
      skills.push(sk);
    }
    sk.magic &&= e.ev.magic;
    sk.events += e.prob ?? 1;
    sk.lo = Math.min(sk.lo, e.ev.damageAt(0.97, false, e.ev.sizeProcChance === 1));
    sk.hi = Math.max(sk.hi, e.ev.damageAt(1.03, e.ev.critRate > 0, e.ev.sizeProcChance > 0));
    return { t: e.t, kind: e.kind, sk, ev: e.ev, hitRate: e.ev.hitRate, critRate: e.ev.critRate, proc: e.proc, prob: e.prob ?? 1,
      token: e.token, requiresHit: e.requiresHit, icdKey: e.icdKey, icdMs: e.icdMs, primaryCast: e.primaryCast, shareCast: e.shareCast, sharePct: e.sharePct,
      bucket: Math.min(nBuckets - 1, Math.floor(e.t / bucketMs)) };
  });
  for (const sk of skills) {
    // Never more histogram bins than distinct integer damage values (tiny hits would otherwise alternate empty/full bins).
    const n = Math.max(1, Math.min(bins, Math.round(sk.hi - sk.lo) + 1));
    sk.normalBins = new Uint32Array(n);
    sk.critBins = new Uint32Array(n);
  }

  const totals = new Float64Array(runs);
  const cumulative = new Float64Array(runs * (nBuckets + 1));
  const perRunBucket = new Float64Array(nBuckets);
  const sampleRun = options.captureRun ? [] : null;
  for (let r = 0; r < runs; r++) {
    perRunBucket.fill(0);
    const landed = new Set(), procReady = new Map(), primaryDamage = new Map();
    let total = 0;
    for (const e of events) {
      if (e.requiresHit !== undefined) {
        if (!landed.has(e.requiresHit) || e.t < (procReady.get(e.icdKey) ?? 0)) continue;
        if (e.icdMs > 0) procReady.set(e.icdKey, e.t + e.icdMs);
      } else if (e.prob < 1 && rng() >= e.prob) continue;
      if (e.sharePct && !(primaryDamage.get(e.shareCast) > 0)) continue;
      const sk = e.sk;
      let dmg = 0, crit = false, miss = false, extraDamage = 0, sizeProc = false;
      if (e.hitRate < 1 && rng() >= e.hitRate) {
        sk.misses++;
        miss = true;
      } else {
        if (e.sharePct) dmg = Math.round((primaryDamage.get(e.shareCast) ?? 0) * e.sharePct);
        else {
          const roll = 0.97 + rng() * 0.06;
          crit = !e.ev.magic && rng() < e.critRate;
          // ponytail: Shadow Drake rolls per landed damage packet; share one cast roll if native server evidence establishes it.
          sizeProc = e.ev.sizeProcChance > 0 && rng() < e.ev.sizeProcChance;
          dmg = e.ev.damageAt(roll, crit, sizeProc);
        }
        const nb = sk.normalBins.length;
        const bin = Math.max(0, Math.min(nb - 1, Math.floor(((dmg - sk.lo) / (sk.hi - sk.lo + 1)) * nb)));
        if (crit) {
          sk.crits++;
          sk.critBins[bin]++;
        } else {
          sk.hits++;
          sk.normalBins[bin]++;
        }
      }
      for (const pr of e.proc ?? []) if (rng() < pr.p) { extraDamage += pr.dmg; dmg += pr.dmg; }
      if (!miss && e.token !== undefined) landed.add(e.token);
      if (e.primaryCast !== undefined) primaryDamage.set(e.primaryCast, (primaryDamage.get(e.primaryCast) ?? 0) + dmg);
      if (sampleRun && r === 0) sampleRun.push({ t: e.t, id: sk.id, name: sk.name, kind: e.kind, damage: dmg, crit, miss, extraDamage, ...(sizeProc ? { sizeProc: true } : {}) });
      total += dmg;
      perRunBucket[e.bucket] += dmg;
      sk.total += dmg;
      sk.perBucket[e.bucket] += dmg;
    }
    totals[r] = total;
    const base = r * (nBuckets + 1);
    for (let b = 0; b < nBuckets; b++) cumulative[base + b + 1] = cumulative[base + b] + perRunBucket[b];
  }
  for (const sk of skills) {
    sk.total /= runs;
    for (let b = 0; b < nBuckets; b++) sk.perBucket[b] /= runs;
  }

  return { runs, durationMs, bucketMs, nBuckets, bins, expectedTotal: deterministic.totalExpectedDamage, deterministic, totals, cumulative, skills, ...(sampleRun ? { sampleRun } : {}) };
}

// ============================================================================
// 6c. Class Profiles (sample gear + candidate rotations per career; used by the CLI report and the HTML simulator)
// ============================================================================

export const CLASS_PROFILES = {
  swordman: {
    name: 'Knight / Swordman (Physical Melee)',
    career: 1200,
    equipmentAttrs: [[103, 180], [1, 8], [5, 4]],
    weaponRefine: 6,
    weaponStrengthen: 10,
    stunts: [10010401, 10010404],
    totemCastStackBuffId: 2500701,
    candidateRotations: [
      { name: 'Bowling Bash + Magnum Break + Bash weave', skills: [1110410, 1100210, 1100110] },
      { name: 'Aura Blade + Bowling Bash + Auto-Attack', skills: [1120110, 1110410] },
      { name: 'Bash Spam Only (No Cooldown)', skills: [1100110] },
      { name: 'Normal Auto-Attack Only', skills: [] },
    ],
  },
  mage: {
    name: 'Wizard / Mage (Elemental Magic)',
    career: 2200,
    equipmentAttrs: [[104, 210], [4, 10], [5, 5]],
    weaponRefine: 6,
    weaponStrengthen: 10,
    passiveSkills: [1220910],
    totems: [{ guid: 1, skills: [10051001, 10053001, 10053005, 10052017] }],
    totemCastStackBuffId: 2500401,
    totemExtraMaxStack: 1,
    candidateRotations: [
      { name: 'Fire Wall (Ground DoT) + Fire Ball + Fire Bolt', skills: [1201010, 1201210, 1200410] },
      { name: 'Storm Gust (Ground DoT) + Jupitel Thunder + Fire Bolt', skills: [1210810, 1210210, 1200410] },
      { name: 'Fire Bolt Lv10 Spam Only', skills: [1200410] },
    ],
  },
  archer: {
    name: 'Hunter / Archer (Ranged Physical)',
    career: 3200,
    equipmentAttrs: [[103, 175], [5, 9], [2, 6]],
    weaponRefine: 6,
    weaponStrengthen: 10,
    passiveSkills: [1300110, 1300210],
    totemCastStackBuffId: 2500301,
    candidateRotations: [
      { name: 'Attention Concentrate + Falcon Assault + Double Strafe', skills: [1300610, 1320210, 1300310] },
      { name: 'Attention Concentrate + Focused Arrow Strike (ASPD Crit)', skills: [1300610, 1320410] },
      { name: 'Double Strafe Spam Only', skills: [1300310] },
    ],
  },
  thief: {
    name: 'Assassin / Thief (Crit & Burst Melee)',
    career: 5200,
    equipmentAttrs: [[103, 170], [1, 7], [2, 8], [6, 5]],
    weaponRefine: 6,
    weaponStrengthen: 10,
    passiveSkills: [1500110],
    totemCastStackBuffId: 2500701,
    candidateRotations: [
      { name: 'Cross Impact (ASPD-scaled) Spam', skills: [1522210] },
      { name: 'Grimtooth + Envenom + Sonic Blow', skills: [1510910, 1500510, 1510210] },
    ],
  },
  ranger: {
    name: 'Ranger (4th Job Ranged Physical - Bow / Warg)',
    career: 3400,
    equipmentAttrs: [[103, 280], [5, 14], [2, 10], [6, 8]],
    weaponRefine: 8,
    weaponStrengthen: 15,
    passiveSkills: [1300110, 1300210, 1310410, 1310510, 1330110, 1331110],
    totemCastStackBuffId: 2500301,
    candidateRotations: [
      { name: 'Unlimited + True Sight + Arrow Storm + Focused Arrow + Sharp Shooting', skills: [1330705, 1320310, 1300610, 1330205, 1330505, 1320410] },
      { name: 'Warg Build: King of Wargs + Warg Hunt + Warg Bite + Focused Arrow', skills: [1332205, 1320310, 1332305, 1332505, 1330505] },
      { name: 'ASPD Crit: Fear Breeze + True Sight + Focused Arrow Strike (0 CD, 100% ASPD)', skills: [1330305, 1320310, 1300610, 1330505] },
      { name: 'Myriad Stars + Arrow Storm + Double Strafe Weave', skills: [1332005, 1330205, 1300310] },
    ],
  },
  mechanic: {
    name: 'Mechanic (4th Job Physical - Battle Axe / Madogear)',
    career: 6400,
    equipmentAttrs: [[103, 310], [1, 15], [5, 8], [6, 6]],
    weaponRefine: 8,
    weaponStrengthen: 15,
    passiveSkills: [1610105, 1610205, 1630105, 1630205],
    totemCastStackBuffId: 2500701,
    candidateRotations: [
      { name: 'Madogear Burst: Energy Release (2200%) + Flame Launcher (600%) + Pile Bunker + Vulcan Arm', skills: [1620410, 1610505, 1631701, 1631505, 1631403, 1631305] },
      { name: 'Battle Axe: Max Over Thrust + Crescent Wheel (600%) + High-Energy Impact + Heavy Axe Smash', skills: [1620410, 1610505, 1630805, 1630705, 1630505] },
      { name: 'Axe Tornado AoE + Spinning Axe + Heavy Axe Smash (0 CD Filler)', skills: [1620410, 1630405, 1630605, 1630505] },
      { name: 'High Speed Cart Ram Spam (200ms CD, 833ms Action)', skills: [1620410, 1610505, 1620210] },
    ],
  },
  runeknight: {
    name: 'Rune Knight (4th Job Melee Physical)',
    career: 1400,
    equipmentAttrs: [[103, 290], [1, 14], [2, 8], [5, 8]],
    weaponRefine: 8,
    weaponStrengthen: 15,
    totemCastStackBuffId: 2500701,
    candidateRotations: [
      { name: 'Aura Blade + Hundred Spears + Ignition Break + Bowling Bash', skills: [1120110, 1130305, 1130405, 1110410] },
    ],
  },
  warlock: {
    name: 'Warlock (4th Job Elemental Magic)',
    career: 2400,
    equipmentAttrs: [[104, 310], [4, 15], [5, 10]],
    weaponRefine: 8,
    weaponStrengthen: 15,
    totemCastStackBuffId: 2500401,
    candidateRotations: [
      { name: 'Chain Lightning + Crimson Rock + Jack Frost + Soul Expansion', skills: [1231405, 1231105, 1230805, 1231505] },
    ],
  },
  guillotinecross: {
    name: 'Guillotine Cross (4th Job Crit / Poison Assassin)',
    career: 5400,
    equipmentAttrs: [[103, 285], [1, 12], [2, 12], [6, 10]],
    weaponRefine: 8,
    weaponStrengthen: 15,
    totemCastStackBuffId: 2500701,
    candidateRotations: [
      { name: 'Cross Impact (ASPD-scaled) + Rolling Cutter + Cross Ripper Slasher', skills: [1522210] },
    ],
  },
};

// ============================================================================
// 6d. Final-value calibration (type the number the game shows, get the bonus that produces it)
// ============================================================================

/**
 * Returns the flat bonus `v` to add to `build.equipmentAttrs` as `[attr, v]` (pre-multiplier, so percent bonuses keep scaling it)
 * so that `buildCharacterStats(build)[attr]` equals `target` exactly, through the percent groups and the ceil/round rules of
 * `computeStatSheet`. Throws when the attribute cannot reach the target (its multiplier is not positive).
 */
export function solveAttributeBonus(build, attr, target, data = new Ro3DataStore()) {
  const at = (v) => buildCharacterStats({ ...build, equipmentAttrs: [...(build.equipmentAttrs ?? []), [attr, v]] }, data)[attr];
  let v = 0;
  for (let i = 0; i < 12; i++) {
    const cur = at(v);
    if (cur === target) return Math.round(v) !== v && at(Math.round(v)) === target ? Math.round(v) : v;
    const slope = (at(v + 64) - cur) / 64;
    if (!(slope > 0.05)) throw new Error(`Attribute ${attr} cannot be moved to ${target} (multiplier ${slope.toFixed(2)})`);
    v += (target - cur) / slope;
  }
  // The ceil/round steps can leave the secant one step off; scan a small neighbourhood for the exact value.
  for (let k = -10; k <= 10; k++) if (at(v + k / 10) === target) return v + k / 10;
  throw new Error(`Attribute ${attr} did not converge on ${target}`);
}

/**
 * The hidden flat bonuses (a Map attribute -> value, the shape of `build.equipmentAttrs`) that make `build`'s sheet show `want` ({ attribute: final value }). The
 * build's own `equipmentAttrs` of other attributes stay as they are, those of the wanted ones are solved again; what is left is the part of the numbers that nothing
 * else in the build explains, so adding a source to the build and solving again shrinks it by what the source gives. Percent attributes go first (a typed P.ATK %
 * moves the P.ATK it multiplies), then the rest by id, so a base stat settles before the stats built from it; a few passes cover what is left. An attribute the
 * sheet cannot reach is left out.
 */
export function solveBonuses(build, want, data = new Ro3DataStore()) {
  const percent = (a) => (Number(data.row('AttributeConfig', a)?._iDataType) === 1 ? 0 : 1);
  const attrs = Object.keys(want).map(Number).sort((a, b) => percent(a) - percent(b) || a - b);
  const bonus = new Map((build.equipmentAttrs ?? []).filter(([a]) => !(a in want)));
  const show = () => buildCharacterStats({ ...build, equipmentAttrs: [...bonus] }, data);
  for (let pass = 0; pass < 4; pass++) {
    const now = show();
    const off = attrs.filter((a) => now[a] !== want[a]);
    if (!off.length) break;
    for (const a of off) {
      const others = [...bonus].filter(([k]) => k !== a);
      try {
        const v = solveAttributeBonus({ ...build, equipmentAttrs: others }, a, want[a], data);
        if (v) bonus.set(a, v);
        else bonus.delete(a);
      } catch { /* the sheet cannot reach it */ }
    }
  }
  return bonus;
}

// ============================================================================
// 6e. Season Talents (SeasonTalentTreeConfig / SeasonTalentConfig / SeasonTalentEffectConfig, digested by build-ro3-sim.mjs into `TalentDigest`)
// ============================================================================

/**
 * `build.talents` = { lv, picks, prof, skills }. The talent system is a chain of trees: in a tree every node opens when the one before it is at its maximum
 * ("Level-up is only available after all prerequisite talent nodes reach Max level"), and a tree opens when the job rank and base level of its condition are
 * met and the total Talent Lv reaches its `_iNeedLevel` ("Unlocks when total Talent Lv. reaches N"). The nodes are stat nodes (a fixed amount per level, paid in
 * Talent Remnants and Minted Coins) and branch points (the game's SkillPoint nodes, activated for free) where one job talent cluster is chosen, then one of its
 * talents ("Selecting class talents costs nothing, and they can be Replaced at any time").
 *   lv      the Talent Lv, the total the game shows: every stat level and every branch point counts 1, and so does the pick made at a branch point
 *   picks   { branch point: [cluster, talent] }; a missing or invalid pick takes the first option the job and profession have
 *   prof    the profession (JobProfessConfig id): a cluster lists the professions it suits
 *   skills  { skill group: learned level }, for the talents that need a skill level
 * `talentWalk` spends `lv` along the chain, `talentEffects` turns the result into attributes (stat nodes, job talents that add a stat) and buffs (job talents that
 * change a skill, applied while the simulation runs). ponytail: the 5 plans of the game are the simulator's tabs; the Battle Pledge (PvP) node and the
 * server-day part of the tree conditions are not simulated; the pick counts 1 once per branch point (the cluster and its talent both apply), because that is
 * how the trees add up: tree II needs 86 more levels, 80 stat levels + 3 branch points + 3 picks, and II+1 and II+2 need 102 = 100 + 1 + 1.
 */
const talentDigest = (data) => data.row('TalentDigest', 1) ?? null;
// The row of a job talent node for a job and profession: one row per job family (empty `jobs` = any job), narrowed by the professions it suits (empty = all).
// Without a profession (`prof` 0: a character that has not picked one, whose game offers every talent group) any row of the job fits.
function talentRow(node, career, prof, D) {
  const rows = asArray(D.jobs[node]);
  const fits = (r) => !prof || !r.profs.length || r.profs.includes(prof);
  return rows.find((r) => r.jobs.includes(career) && fits(r)) ?? rows.find((r) => !r.jobs.length && fits(r)) ?? null;
}
/** The clusters a branch point offers a job and profession, each with its talents: [{ id, name, text, sim, kids: [{ id, name, text, sim }] }] (`sim` 2 simulated, 1 partly, 0 not). */
export function talentOptions(branch, career, prof, data) {
  const D = talentDigest(data);
  return asArray(D?.branches[branch]).flatMap((b) => {
    const row = talentRow(b.n, career, prof, D);
    const kids = b.kids.flatMap((k) => { const r = talentRow(k, career, prof, D); return r ? [{ id: k, ...r }] : []; });
    return row ? [{ id: b.n, ...row, kids }] : [];
  });
}
/** The cluster and talent in effect at a branch point: [cluster, talent] (0 where the job has none). */
export function talentPick(talents, branch, career, data) {
  const options = talentOptions(branch, career, talents?.prof, data);
  const [c, k] = asArray(talents?.picks?.[branch]);
  const cluster = options.find((o) => o.id === c) ?? options[0];
  return [cluster?.id ?? 0, (cluster?.kids.find((x) => x.id === k) ?? cluster?.kids[0])?.id ?? 0];
}
/** Spends `build.talents.lv` along the chain: { trees: [{ id, name, need, rank, lv, cap, done, state }], nodes: [{ n, ty, max, g, tree, lv, picked }], reached: the branch points with their pick, cost: { mats, coin }, total, spare }. */
export function talentWalk(build, data) {
  const D = talentDigest(data);
  const out = { trees: [], nodes: [], reached: [], cost: { mats: 0, coin: 0 }, total: 0, spare: 0 };
  if (!D) return out;
  const t = build.talents ?? {};
  const rank = Number(data.row('JobConfig', build.career)?._iJobRank ?? 0);
  let left = Math.max(0, Math.trunc(Number(t.lv)) || 0);
  for (const tree of D.trees) {
    const state = rank < tree.rank || Number(build.level ?? 1) < tree.lv ? 'locked' : out.total < tree.need ? 'short' : 'open'; // class / base level, then Talent Lv
    const row = { id: tree.id, name: tree.name, need: tree.need, rank: tree.rank, lv: tree.lv, cap: tree.chain.reduce((s, n) => s + n.max + (n.ty === 5 ? 1 : 0), 0), done: 0, state };
    out.trees.push(row);
    for (const node of tree.chain) {
      const take = state === 'open' ? Math.min(node.max, left) : 0;
      const entry = { ...node, tree: tree.id, lv: take, picked: 0 };
      out.nodes.push(entry);
      left -= take;
      out.total += take;
      row.done += take;
      if (!take) continue;
      if (node.ty !== 5) {
        out.cost.mats += D.groups[node.g].cost[0] * take;
        out.cost.coin += D.groups[node.g].cost[1] * take;
      } else if (left > 0) { // the pick made at the branch point counts one more level
        left--;
        out.total++;
        row.done++;
        entry.picked = 1;
        out.reached.push(node.n);
      }
    }
  }
  out.spare = left;
  return out;
}
/** The most Talent Lv this job can have at this base level. */
export const talentMax = (build, data) => talentWalk({ ...build, talents: { ...build.talents, lv: Infinity } }, data).total;
/** What the talents give: { attrs: [[attribute, value]] for the sheet, buffs: [buff ids] for the simulation, walk }. */
export function talentEffects(build, data) {
  const D = talentDigest(data);
  const out = { attrs: [], buffs: [], walk: null };
  const t = build.talents;
  if (!D || !(Number(t?.lv) > 0)) return out;
  const sum = new Map();
  const add = (a, v) => sum.set(a, (sum.get(a) ?? 0) + v);
  out.walk = talentWalk(build, data);
  for (const n of out.walk.nodes) if (n.lv > 0 && n.g) for (const [a, v] of D.groups[n.g].per) add(a, v * n.lv);
  for (const branch of out.walk.reached) {
    for (const id of talentPick(t, branch, build.career, data).filter(Boolean)) {
      const row = talentRow(id, build.career, t.prof, D);
      for (const [a, v] of row.a) add(a, v);
      for (const [g, lv, a, v] of row.c) if ((Number(t.skills?.[g]) || 0) >= lv) add(a, v);
      out.buffs.push(...row.b);
    }
  }
  out.attrs = [...sum];
  return out;
}

// ============================================================================
// 7. Self-Test & Sample Optimization Report (`--self-test`)
// ============================================================================

export function runSelfTest(data = new Ro3DataStore()) {
  // 1. Verify StatCalculator against Ro3Emu.Tests/StatCalculatorTests.cs
  {
    const sheet1 = computeStatSheet({ 103: 22, 1031: 100 }, data);
    assert.equal(sheet1[103], 23, '22 * 1.01 = 22.22 -> ceil 23');
    assert.equal(sheet1.base[103], 22, 'Pre-percentage base PATK = 22');
    assert.equal(sheet1[1031], 100, 'Member 1031 preserved');

    const sheet2 = computeStatSheet({ 115: 100, 114: 20, 1142: 10 }, data);
    assert.equal(sheet2[115], 130, '1.00 * 1.20 + 0.10 = 1.30 (130)');
  }

  // 2. Verify Novice Lv1 HP and Lv10 StatPoints against Ro3Emu.Tests/CharacterTests.cs
  {
    const noviceLv1 = buildCharacterStats({ career: 1000, level: 1, stats: [1, 1, 1, 1, 1, 1] }, data);
    assert.equal(noviceLv1[101], 71, 'Novice Lv1 MaxHP: (30 + 40) * 1.002 = 70.14 -> 71');
    assert.equal(noviceLv1[113], 700, 'Novice Lv1 Speed = 700');

    assert.equal(totalStatPoints(10, 0, data), 68, 'Lv10 total stat points = 48 + 8*2 + 4 = 68');
    assert.equal(statCost(5, data), 8, 'Raising stat 1 -> 5 costs 4 * 2 = 8');
  }

  // 3. Verify SkillParameterRules against Ro3Emu.Tests/SkillProtocolTests.cs
  {
    const bashLv1 = data.row('SkillConfig', 1100101);
    const buffedBash = applySkillParameterRules(bashLv1, [{ id: 1100301, piles: 1 }], data);
    assert.equal(buffedBash._kDamageParam1[0], 4830, '4600 * (1 + 500/10000) = 4830');
  }

  // 4. Verify TotemEffects against Ro3Emu.Tests/TotemEffectsTests.cs
  {
    const totemBuild = {
      career: 1000,
      level: 1,
      stats: [1, 1, 1, 1, 1, 1],
      totems: [
        {
          guid: 990001,
          skills: [10051001, 10053001, 10053005, 10052017, 10053010, 10053012],
        },
      ],
      activeBuffs: [{ id: 2500401, piles: 3, isTotemOwned: true, sourceId: 990001 }],
    };
    const fireBolt = data.row('SkillConfig', 1200401);
    const mult = totemOutgoingMultiplier(totemBuild, fireBolt, false, data);
    assert.ok(Math.abs(mult - 1.025) < 1e-6, `Totem 3-stack outgoing magic multiplier = 1.025 (got ${mult})`);
  }
  {
    const rows = {
      1: { _iSuperiorSkillID: 2, _iIsCoexist: 0, _kBasicAttribute: [[103, 5]] },
      2: { _iSuperiorSkillID: 0, _iIsCoexist: 0, _kBasicAttribute: [[103, 10]] },
      3: { _iSuperiorSkillID: 0, _iIsCoexist: 1, _kBasicAttribute: [[101, 7]] },
    };
    const mock = { row: (table, id) => table === 'TotemSkillConfig' ? rows[id] : null };
    const attrs = evaluateTotemAttributes({ totems: [
      { attrs: [[103, 100]], enhanceBp: 5000, skills: [1, 2, 3] },
      { skills: [2, 3] },
    ] }, mock);
    assert.equal(attrs.filter(([a]) => a === 103).reduce((sum, [, v]) => sum + v, 0), 160,
      'Totem rolls are enhanced, inferior skills suppressed, and non-coexisting effects counted once');
    assert.equal(attrs.filter(([a]) => a === 101).reduce((sum, [, v]) => sum + v, 0), 14,
      'Coexisting Totem effects still apply from both deployed instances');
  }

  // 5. Verify EquipmentStunts conversion (ops 4, 8, 14) against EquipmentAffixTests.cs
  {
    const stuntBuild = {
      career: 1000,
      level: 50,
      stats: [1, 1, 1, 1, 1, 1],
      equipmentAttrs: [[104, 300]],
      affixAttrs: [[1, 7], [2, 7]],
      stunts: [10010404, 10020402, 10020404, 1],
    };
    const stSheet = buildCharacterStats(stuntBuild, data);
    assert.ok(stSheet[1033] > 0 && stSheet[1033] <= 160, 'Op 8 MATK->PATK conversion active and capped at 160');
    assert.ok(stSheet[1013] > 0 && stSheet[1013] <= 4000, 'Op 14 (PATK+MATK)->MaxHP conversion active');
  }

  // 6. Verify Stat Optimizer improves DPS over baseline 2:1 STR:VIT reference build
  {
    const defender = FALLBACK_TABLES.Monsters.baphomet;
    const baseBuild = {
      career: 1100,
      level: 40,
      equipmentAttrs: [[103, 120]],
      weaponRefine: 4,
      weaponStrengthen: 10,
    };
    const opt = optimizeStatAllocation(baseBuild, defender, {
      mode: 'sustained',
      rotation: [1100210, 1100110],
      windowMs: 20000,
    }, data);
    const baseline2to1 = simulateRotation(
      { ...baseBuild, stats: [55, 1, 31, 1, 1, 1] },
      defender,
      [1100210, 1100110],
      20000,
      data
    );
    assert.ok(opt.usedPoints <= opt.budget, 'Optimal allocation respects stat point budget');
    assert.ok(opt.optimalScore > baseline2to1.sustainedDps, 'Optimized allocation strictly beats 2:1 STR:VIT baseline');
  }

  // 7. Verify Ranged (_iDistanceType == 2) DEX scaling & Totem ExtraHitDamage proc
  {
    const archerStr = buildCharacterStats({ career: 3100, level: 50, stats: [50, 1, 1, 1, 1, 1] }, data);
    const archerDex = buildCharacterStats({ career: 3100, level: 50, stats: [1, 1, 1, 1, 50, 1] }, data);
    assert.ok(archerDex[103] > archerStr[103], 'Ranged career (Archer 3100) scales PATK from DEX (_kAttribute2), not STR');

    const mageNoProc = simulateRotation(
      { career: 2100, level: 50, stats: [1, 1, 1, 80, 1, 1] },
      FALLBACK_TABLES.Monsters.poring,
      [1200410],
      10000,
      data
    );
    const mageWithProc = simulateRotation(
      { career: 2100, level: 50, stats: [1, 1, 1, 80, 1, 1], totemExtraHitPassiveId: 2504001 },
      FALLBACK_TABLES.Monsters.poring,
      [1200410],
      10000,
      data
    );
    assert.ok(mageWithProc.sustainedDps > mageNoProc.sustainedDps, 'Totem ExtraHitDamage passive 2504001 increases DPS');
    // Deployed totem skills drive the same passives as the legacy fields: 10052018 grants 2504001; 10051001 + 10053001 give 2500401 at cap +1.
    if (data.row('TotemSkillConfig', 10052018)) {
      const viaTotem = simulateRotation({ career: 2100, level: 50, stats: [1, 1, 1, 80, 1, 1], totems: [{ guid: 1, skills: [10052018] }] }, FALLBACK_TABLES.Monsters.poring, [1200410], 10000, data);
      assert.equal(viaTotem.sustainedDps, mageWithProc.sustainedDps, 'A deployed 10052018 totem skill procs like totemExtraHitPassiveId 2504001');
      const fx = totemPassives({ totems: [{ guid: 7, skills: [10051001, 10053001] }] }, data);
      const cap0 = Math.max(1, Number(data.row('BuffConfig', 2500401)?._iMaxStack ?? 2));
      assert.deepEqual(fx.castStacks, [{ guid: 7, buffId: 2500401, durMs: 5000, cap: cap0 + 1 }], 'Cast stack from 10051001, +1 max stack from 10053001 on the same totem');
      assert.equal(totemPassives({ totems: [{ guid: 1, skills: [10051001] }, { guid: 2, skills: [10053001] }] }, data).castStacks[0].cap, cap0, 'Op 18 only raises its own totem\'s cap');
    }
  }

  // 8. Verify the Monte Carlo replay traces every damage event and converges on the deterministic expectation
  {
    const mcBuild = { career: 2200, level: 50, stats: [1, 1, 1, 80, 1, 1], equipmentAttrs: [[104, 2000]], totemExtraHitPassiveId: 2504001 };
    const rotation = [1201010, 1201210, 1200410];
    const trace = [];
    const det = simulateRotation(mcBuild, FALLBACK_TABLES.Monsters.baphomet, rotation, 20000, data, trace);
    const traced = trace.reduce((a, e) => a + e.ev.expectedPerAttempt + (e.proc ?? []).reduce((s, pr) => s + pr.p * pr.dmg, 0), 0);
    assert.ok(trace.some((e) => e.kind === 'dot'), 'Ground DoT ticks are traced');
    assert.ok(Math.abs(traced - det.totalExpectedDamage) < 1e-6 * det.totalExpectedDamage, 'Trace sums to the deterministic expected damage');

    const mc = simulateDistribution(mcBuild, FALLBACK_TABLES.Monsters.baphomet, rotation, 20000, { runs: 1500, seed: 7 }, data);
    const mean = mc.totals.reduce((a, b) => a + b, 0) / mc.runs;
    assert.ok(Math.abs(mean / mc.expectedTotal - 1) < 0.02, `Monte Carlo mean ${mean.toFixed(0)} converges on expected ${mc.expectedTotal.toFixed(0)}`);
    const captured = simulateDistribution(mcBuild, FALLBACK_TABLES.Monsters.baphomet, rotation, 20000, { runs: 2, seed: 7, captureRun: true }, data);
    const plain = simulateDistribution(mcBuild, FALLBACK_TABLES.Monsters.baphomet, rotation, 20000, { runs: 2, seed: 7 }, data);
    assert.deepEqual(captured.totals, plain.totals, 'Capturing playback does not change damage rolls');
    assert.deepEqual(captured.skills, plain.skills, 'Capturing playback does not change skill accounting');
    assert.equal(captured.sampleRun.reduce((sum, e) => sum + e.damage, 0), captured.totals[0], 'Playback retains every rolled damage event');
    assert.ok(captured.sampleRun.every((e, i, all) => e.t >= 0 && e.t <= 20000 && (!i || e.t >= all[i - 1].t)), 'Playback events are chronological and inside the combat window');
  }

  // 9. Verify final-value calibration hits typed numbers exactly (up and down) through percent groups and ceil/round rules
  {
    const cal = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], passiveSkills: [1300110, 1300210] };
    for (const [attr, target] of [[103, 4671], [103, 100], [104, 3617], [109, 307], [110, 129], [111, 1640], [115, 314], [101, 176086], [105, 1340], [107, 797], [5, 182], [5, 40]]) {
      const bonus = solveAttributeBonus(cal, attr, target, data);
      const sheet = buildCharacterStats({ ...cal, equipmentAttrs: [[attr, bonus]] }, data);
      assert.equal(sheet[attr], target, `Attribute ${attr} reaches typed value ${target} (bonus ${bonus})`);
    }
  }

  // 10. Verify Unlimited Shooting (scope-1 category modifier + 1211 layer) and that rotation modifiers are applied exactly once
  {
    const rb = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023]] };
    const dummy = { level: 70, def: 500, mdef: 500, flee: 0, hit: 0, element: 1, resCri: 0 };
    const fas = data.row('SkillConfig', 1330505);
    const plain = evaluateSkillDamage(rb, dummy, fas, {}, data);
    const boosted = evaluateSkillDamage({ ...rb, activeBuffs: [{ id: 1330205 }, { id: 1330405 }] }, dummy, fas, {}, data);
    assert.equal(plain.p1, 6000);
    assert.equal(boosted.p1, 9000, 'Focused Arrow Strike (category 3105) damage multiplier +50%');
    assert.ok(Math.abs(boosted.normalHitMean / plain.normalHitMean - 1.5 * 1.1) < 0.01, '+50% multiplier and +10% Physical Damage (1211)');

    const trace = [];
    simulateRotation(rb, dummy, [1330705, 1330505], 20000, data, trace);
    assert.deepEqual([...new Set(trace.map((e) => e.ev.p1))].sort((a, b) => a - b), [6000, 9000], 'Boosted while the buff lasts, plain after');

    const sw = { career: 1200, level: 70, stats: [60, 1, 1, 1, 30, 1], activeBuffs: [{ id: 1100301 }] };
    const bash = data.row('SkillConfig', 1100110);
    const swTrace = [];
    simulateRotation(sw, dummy, [1100110], 3000, data, swTrace);
    assert.equal(swTrace[0].ev.p1, evaluateSkillDamage(sw, dummy, bash, {}, data).p1, 'A buff skill modifier is not applied twice inside simulateRotation');
  }

  // 11. Verify per-skill damage the rows cannot express: multi-hit casts, Resonance / ASPD scaling, monster-only bonuses, hybrid ATK
  {
    const rb = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023]] };
    const dummy = { level: 70, def: 500, mdef: 500, flee: 0, hit: 0, element: 1, resCri: 0 };
    const sheet = buildCharacterStats(rb, data);

    const mscm = evaluateSkillDamage(rb, dummy, data.row('SkillConfig', 1332005), {}, data);
    assert.equal(mscm.hitsPerCast, 7, 'Myriad Stars Chase the Moon lands 7 hits (text: 1400% = 7 x 200%)');
    assert.ok(Math.abs(mscm.expectedPerCast / mscm.expectedPerAttempt - 7) < 1e-9);
    const mTrace = [];
    simulateRotation(rb, dummy, [1332005], 25000, data, mTrace);
    assert.equal(mTrace.filter((e) => e.ev.skillId === 1332005).length, 14, 'two casts in 25 s land 14 hits');

    const axe = { career: 6400, level: 72, stats: [60, 1, 40, 1, 1, 1] };
    const tornado = data.row('SkillConfig', 1630405);
    const [tick, finisher] = [0, 1].map((branch) => evaluateSkillDamage(axe, dummy, tornado, { branch }, data).expectedPerAttempt);
    assert.ok(Math.abs(evaluateSkillDamage(axe, dummy, tornado, {}, data).expectedPerCast - (6 * tick + finisher)) < 1e-6, 'Axe Tornado: 6 ticks + a finisher');

    const agi = sheet[2];
    const storm = evaluateSkillDamage(rb, dummy, data.row('SkillConfig', 1330205), {}, data);
    assert.equal(storm.p1, 42000 + 10 * Math.min(agi, 100), 'Agility Resonance adds 0.1% per AGI up to 100');
    const blitz = evaluateSkillDamage(rb, dummy, data.row('SkillConfig', 1310205), {}, data);
    assert.equal(blitz.p1, 10000 + 5 * agi, 'Blitz Beat: every 20 AGI adds 1%');

    const gx = { career: 5400, level: 72, stats: [1, 60, 1, 1, 1, 1], equipmentAttrs: [[103, 2000], [115, 150]] };
    const cutter = evaluateSkillDamage(gx, dummy, data.row('SkillConfig', 1530310), {}, data);
    const aspd = buildCharacterStats(gx, data)[115];
    const plainDmg = (cutter.atkStat * cutter.p1) / 10000 + cutter.p2;
    assert.ok(Math.abs(cutter.baseDamage / (plainDmg * cutter.defMitigation * cutter.eleMod) - (1 + Math.min(aspd, 500) * 0.005)) < 1e-9, 'Rolling Cutter: (1 + ASPD * 0.5%)');

    const shieldBash = data.row('SkillConfig', 1163605);
    assert.equal(evaluateSkillDamage(rb, dummy, shieldBash, {}, data).p1, 27000, 'Powerful Shield Bash: +50% against monsters');
    assert.equal(evaluateSkillDamage(rb, dummy, shieldBash, { branch: 0 }, data).p1, 18000);

    const destroyer = evaluateSkillDamage(rb, dummy, data.row('SkillConfig', 1521010), {}, data);
    assert.equal(destroyer.atkStat, sheet[103] + sheet[104], 'Soul Destroyer: Physical ATK*50% + Magic ATK*50%');
  }

  // 12. Verify buff stats feed the conversions, and Fear Breeze's bow-skill proc (30%, 3 hits totaling 50% P.ATK)
  {
    const rb = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023]] };
    const dummy = { level: 70, def: 500, mdef: 500, flee: 0, hit: 0, element: 1, resCri: 0 };
    const focus = { ...rb, activeBuffs: [{ id: 1300210 }] }; // Steady Focus: AGI +6, DEX +11
    const [before, after] = [rb, focus].map((b) => buildCharacterStats(b, data));
    assert.equal(after[5], before[5] + 11);
    assert.ok(after[103] > before[103], 'Buff DEX feeds the P.ATK conversion');

    const breeze = { ...rb, activeBuffs: [{ id: 1330105 }] };
    const strike = data.row('SkillConfig', 1330505);
    const [plain, procced] = [rb, breeze].map((b) => {
      const trace = [];
      const res = simulateRotation(b, dummy, [1330505], 10000, data, trace);
      return { res, trace };
    });
    const procs = procced.trace.filter((e) => e.ev.skillName === 'Fear Breeze');
    assert.equal(procs.length, procced.trace.filter((e) => e.ev.skillId === strike._iID).length, 'Every Focused Arrow Strike hit can trigger it');
    assert.ok(procs.every((e) => Math.abs(e.prob - 0.3) < 1e-9 && e.ev.p1 === 5000), '30% chance, 50% P.ATK');
    assert.equal(plain.trace.filter((e) => e.ev.skillName === 'Fear Breeze').length, 0);
    assert.ok(procced.res.totalExpectedDamage > plain.res.totalExpectedDamage * 1.1, 'The proc adds damage');
    const blitzTrace = [];
    simulateRotation(breeze, dummy, [1310205], 5000, data, blitzTrace);
    assert.ok(blitzTrace.some((e) => e.ev.skillId === 1310205));
    blitzTrace.forEach((e, i) => {
      if (e.ev.skillName === 'Fear Breeze') assert.notEqual(blitzTrace[i - 1].ev.skillId, 1310205, 'Blitz Beat is not a bow skill, so it never triggers Fear Breeze');
    });

    const mc = simulateDistribution(breeze, dummy, [1330505], 10000, { runs: 1500, seed: 11 }, data);
    assert.ok(Math.abs(mc.totals.reduce((a, b) => a + b, 0) / mc.runs / mc.expectedTotal - 1) < 0.02, 'Monte Carlo converges with triggered hits');
  }

  // 13. Verify rotation timing: template hit points, the animation lock (and cancelling it), Warg Strike's follow-up on Focused Arrow Strike
  {
    const rb = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023]], skillLevels: { 13312: 3 } };
    const post = { level: 100, def: 0, mdef: 0, flee: 1, hit: 1, element: 1, resCri: 0 };
    const rotation = [1332005, 1330505]; // Myriad Stars Chase the Moon (20 s cooldown), then Focused Arrow Strike (no cooldown)
    const trace = [];
    const plain = simulateRotation(rb, post, rotation, 30000, data, trace);
    const casts = plain.castLog.filter((c) => c.lockMs);

    // The template puts Myriad Stars' 7 hits 0.2 s apart, the last 1.7 s in; the cast locks the caster for its whole 2.37 s action.
    assert.equal(casts[0].id, 1332005);
    assert.deepEqual(casts[0].hits.slice(1).map((h, i) => Math.round((h - casts[0].hits[i]) / 10)), [20, 20, 20, 20, 20, 20]);
    assert.ok(Math.abs(casts[0].hits[6] - 1700) < 10 && casts[0].lockMs === 2370);
    // Nothing can start inside a cast, and with a no-cooldown filler nothing waits either: each cast starts the moment the last ends.
    casts.forEach((c, i) => i && assert.equal(c.t, casts[i - 1].t + casts[i - 1].lockMs, 'casts neither overlap nor leave gaps'));
    assert.deepEqual(casts.filter((c) => c.id === 1332005).map((c) => c.t >= 20000), [false, true], 'Myriad Stars comes back after its 20 s cooldown');

    // Cancelling frees the caster at the interrupt frame (Myriad Stars 1.73 s of 2.37 s) without cutting a hit off, so more fits in.
    const cancelled = simulateRotation({ ...rb, cancelBackswing: true }, post, rotation, 30000, data);
    const first = cancelled.castLog[0];
    assert.ok(first.lockMs < 2370 && first.lockMs >= first.hits[6], 'the lock ends after the last hit');
    assert.ok(cancelled.totalExpectedDamage > plain.totalExpectedDamage);
    // A skill with no template falls back to the server's default: the first hit at 20% of the action, the rest spread after it.
    assert.deepEqual(castTimes(data, { _iScriptShow: 0 }, { chantMs: 0, actionMs: 1000 }, 2).hitAt, [200, 600]);
    // A start marker (a point within one frame of 0 s) is not a hit: Aerial Bombardment's 7 hits are the 7 points after its 0.017 s marker,
    // and Axe Leap Attack's single hit is the slam at 3.2 s of its 5 s animation, not the marker at 0 s.
    const rowOf = (group) => Object.values(data.table('SkillConfig')).find((r) => r._iSkillID === group && r._iLevel === 1);
    const aerial = rowOf(16318);
    const aerialAt = castTimes(data, aerial, calcSkillTimingMs({ 115: 100 }, aerial), SKILL_MODEL[16318].hits.length).hitAt;
    assert.ok(aerialAt.length === 7 && Math.abs(aerialAt[0] - 1650) <= 15 && Math.abs(aerialAt[6] - 2667) <= 15, 'Aerial Bombardment: 7 hits after the start marker');
    const leap = rowOf(16307);
    assert.ok(Math.abs(castTimes(data, leap, calcSkillTimingMs({ 115: 100 }, leap), 1).hitAt[0] - 3190) <= 15, 'Axe Leap Attack lands at its slam');

    // Warg Strike's mode 0 row (30% P.ATK) follows a Focused Arrow Strike at most once per 2.5 s, only while it is learned.
    const follows = plain.castLog.filter((c) => c.kind === 'follow');
    assert.ok(follows.length >= 8);
    follows.forEach((f, i) => i && assert.ok(f.t - follows[i - 1].t >= 2500, 'follow-up cooldown'));
    const followHits = trace.filter((e) => e.ev.skillId === 1331203);
    assert.equal(followHits.length, follows.length);
    assert.ok(followHits.every((e) => e.ev.p1 === 3000), 'Warg Strike follow-up is 30% P.ATK');
    assert.equal(simulateRotation({ ...rb, skillLevels: {} }, post, rotation, 30000, data).castLog.filter((c) => c.kind === 'follow').length, 0);
  }

  // 14. Verify periodic self-buffs: Wolf Taming's Warg Howl (+5% P.ATK for 10 s every 30 s) lifts exactly the hits inside its windows
  {
    const rb = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023]], skillLevels: { 13310: 1 } };
    const post = { level: 100, def: 0, mdef: 0, flee: 1, hit: 1, element: 1, resCri: 0 };
    const run = (b) => {
      const trace = [];
      return { res: simulateRotation(b, post, [1330505], 45000, data, trace), trace };
    };
    const windows = (r) => r.res.castLog.filter((c) => c.kind === 'buff').map((c) => [c.t, c.durMs]);
    const off = run({ ...rb, periodicOff: true });
    // Each hit's damage against the same hit without the howl: +5% inside a window, untouched outside it.
    const liftedBy = (r, from) => r.trace.map((e, i) => {
      const up = e.t >= from && (e.t - from) % 30000 < 10000;
      const ratio = e.ev.expectedPerAttempt / off.trace[i].ev.expectedPerAttempt;
      assert.ok(up ? Math.abs(ratio - 1.05) < 0.002 : ratio === 1, `hit at ${e.t} ms: x${ratio} (${up ? 'inside' : 'outside'} a howl)`);
      return up;
    }).filter(Boolean).length;

    const on = run(rb);
    assert.equal(on.trace.length, off.trace.length);
    assert.deepEqual(windows(on), [[0, 10000], [30000, 10000]]);
    const n = liftedBy(on, 0);
    assert.ok(n > 0 && n < on.trace.length, 'only the hits inside the windows are lifted');
    // The first howl can land later (0 = the fight starts as the wolf howls) ...
    const late = run({ ...rb, periodicStartMs: 20000 });
    assert.deepEqual(windows(late), [[20000, 10000]]);
    assert.ok(liftedBy(late, 20000) > 0);
    // ... a window already running when the fight starts is clipped to it ...
    assert.deepEqual(windows(run({ ...rb, periodicStartMs: -4000 })), [[0, 6000], [26000, 10000]]);
    // ... and it needs the passive learned and the wolf not ridden.
    assert.equal(windows(off).length, 0);
    assert.equal(windows(run({ ...rb, skillLevels: {} })).length, 0);
    assert.equal(run({ ...rb, skillLevels: {} }).res.totalExpectedDamage, off.res.totalExpectedDamage);
    assert.ok(on.res.totalExpectedDamage > off.res.totalExpectedDamage * 1.01);
  }

  // 15. Verify the damage layers Equipment Resonance and the pets use (215, 235, 1215, 1227 / 1229) and the resonance tiers themselves
  {
    const rb = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023]] };
    const post = { level: 100, def: 0, mdef: 0, flee: 1, hit: 1, element: 1, resCri: 0 };
    const fas = data.row('SkillConfig', 1330505); // a ranged Physical skill
    const hit = (b, d = post) => evaluateSkillDamage(b, d, fas, {}, data).normalHitMean;
    const withBuff = (attr, v) => ({ ...rb, activeBuffs: [{ id: 9e9, _kChangeAttri: [[attr, v]] }] });
    const plain = hit(rb);
    assert.ok(Math.abs(hit(withBuff(1229, 1000)) / plain - 1.1) < 1e-3, 'Ranged Physical Damage Increase (buff layer) +10%');
    assert.ok(Math.abs(hit(withBuff(1215, 1000)) / plain - 1.1) < 1e-3, 'Damage Increase (buff layer) +10%');
    assert.equal(hit(withBuff(1227, 1000)), plain, 'a melee bonus does nothing to a ranged skill');
    assert.equal(hit(withBuff(1252, 1000)), plain, 'a magic bonus does nothing to a physical skill');
    // Equipment Resonance: the highest tier reached adds its row (all 7 grids at or above the level).
    assert.equal(resonanceEffects(2, 29, data).refine, null);
    assert.equal(resonanceEffects(2, 29, data).enhance, null);
    assert.equal(resonanceEffects(17, 0, data).refine._iEffectLev, 5, '+15 is the tier at +17');
    assert.equal(resonanceEffects(18, 0, data).refine._iEffectLev, 6);
    assert.equal(resonanceEffects(0, 100, data).enhance._iEffectLev, 8);
    assert.equal(resonanceEffects(0, 150, data).enhance._iEffectLev, 8);
    assert.deepEqual(resonanceEffects(18, 100, data).attrs.filter(([id]) => id === 215 || id === 235), [[215, 900], [235, 4000]]);
    const res = buildCharacterStats({ ...rb, resonance: { refine: 18, enhance: 100 } }, data);
    assert.equal(res[215], 900, 'Refinement Resonance +18: Damage Increase +9%');
    assert.equal(res[235], 4000, 'Enhancement Resonance Lv 100: Elemental Counter Ignore +40%');
    const bare = buildCharacterStats(rb, data);
    assert.equal(res[1011], bare[1011] + 3400, 'Max HP% counts like the server: +18% (refine) and +16% (enhance)');
    assert.ok(Math.abs(res[101] / bare[101] - (1 + res[1011] / 10000) / (1 + bare[1011] / 10000)) < 1e-3, '...and multiplies the Max HP');
    assert.ok(Math.abs(hit({ ...rb, resonance: { refine: 18 } }) / plain - 1.09) < 1e-3, 'Damage Increase +9% on the sheet');
    assert.equal(hit({ ...rb, resonance: { refine: 2, enhance: 29 } }), plain, 'below the first tier nothing happens');
    // Elemental Counter Ignore cuts the penalty of attacking into a disadvantage (Fire into Fire is -50%).
    const fire = { ...rb, element: 4 };
    const fireDef = { ...post, element: 4 };
    assert.ok(Math.abs(hit(fire, fireDef) / plain - 0.5) < 1e-3, 'Fire into Fire: -50%');
    assert.ok(Math.abs(hit({ ...fire, resonance: { enhance: 100 } }, fireDef) / plain - 0.7) < 1e-3, '-50% x (1 - 40%) = -30%');
    assert.equal(hit({ ...rb, resonance: { enhance: 100 } }), plain, 'no disadvantage, nothing to ignore');
  }

  // 16. Owner-scaled Primary casts, per-impact Utility triggers, core sharing and owner-hit internal cooldowns.
  {
    const damageRow = (id) => ({ _iID: id, _iSkillID: Math.floor(id / 100), _iDmgType: 4, _iEleType: 1, _iDistanceType: 1, _iSkillHit: 10000, _iSkillCri: 10000 });
    const primary = (id, hits = [], buffs = []) => ({ id, cd: 30000, row: damageRow(id), hits, buffs, notes: [] });
    const star = (primary, p, c = [], ca = []) => Array.from({ length: 6 }, () => ({ primary, m: [], p, pa: [], c, ca }));
    const digest = {
      22002: { _iID: 22002, name: 'Garm Baby', types: ['control'], main: { name: 'Frost Breath' }, pas: { name: 'Cold Embrace' }, star: star(primary(2344306, [417, 617, 817, 1017, 1217, 1417, 1617].map((at) => ({ at, ratio: 32000 }))), []) },
      20001: { _iID: 20001, name: 'Rainbow Ferus', types: ['offense', 'debuff'], main: { name: 'Dragon Breath' }, pas: { name: 'Same Old Trick' }, star: star(primary(2337406), [1, 270, 0.2]) },
      30001: { _iID: 30001, name: 'Silver Moon Witch', types: ['offense', 'buff'], main: { name: 'Silver Moon Strike' }, pas: { name: 'Radiant Moon' }, star: star(primary(2303106, [{ at: 417, ratio: 40000 }, { at: 917, ratio: 40000 }]), [5, 9]) },
      30401: { _iID: 30401, name: 'Zherlthsh', types: ['offense', 'buff'], main: { name: 'Whirling Whip' }, pas: { name: "Esen's Execution" }, core: { name: "Esen's Slaughter" }, star: star(primary(2315206), [10, 5], [15, 5], [1, 40]) },
      32401: { _iID: 32401, name: 'Corrupted Wander Man', types: ['offense', 'debuff'], main: { name: 'Slash' }, pas: { name: 'Gale Slash' }, core: { name: 'Core' }, star: star(primary(2317206), [6, 5, 220]) },
      10001: { _iID: 10001, name: 'Choco', types: ['buff'], main: { name: 'Choco Antics' }, pas: { name: 'Agility Song' }, star: star(primary(2353306, [], [{ attrs: [[114, 20]], durMs: 20000, firstMs: 0 }]), [1]) },
      30002: { _iID: 30002, name: 'Owl Baron', types: ['offense'], main: { name: 'Lightning' }, pas: { name: 'Summon Lightning' }, star: star(primary(2311406), [0.15, 1, 8, 5, 80]) },
      31003: { _iID: 31003, name: 'Incubus', types: ['buff'], main: { name: 'Demonic Miasma' }, pas: { name: "Demon's Whisper" }, star: star(primary(2308606), [5, 5, 0.5, 5, 5, 30]) },
      32002: { _iID: 32002, name: 'Dullahan', types: ['offense'], main: { name: "Samurai's Fury" }, pas: { name: 'Deliberate Laceration' }, star: star(primary(2327506), [5, 45, 0.5]) },
    };
    const petData = Object.assign(Object.create(data), { table: (n) => (n === 'PetDigest' ? digest : data.table(n)) });
    const lineup = [{ id: 22002, star: 6 }, { id: 20001, star: 6 }, { id: 30001, star: 6 }, { id: 30401, star: 6 }];
    const fx = petEffects(lineup, petData);
    assert.deepEqual(fx.timedBuffs.map((e) => e.name), ["Esen's Execution", "Esen's Slaughter"], 'Control Garm never triggers Offensive-only Radiant Moon');
    assert.equal(fx.hits.filter((h) => h.slot === 0).length, 7);
    assert.equal(fx.hits.filter((h) => h.slot === 1).length, 7, 'Ferus reacts to all seven .2 s-spaced hits, not once per cast');
    const duplicateDigest = structuredClone(digest);
    duplicateDigest[22002].star[5].primary.hits.push({ at: 417, ratio: 32000 });
    const duplicateData = Object.assign(Object.create(petData), { table: (n) => n === 'PetDigest' ? duplicateDigest : petData.table(n) });
    const duplicateFx = petEffects(lineup, duplicateData);
    assert.equal(duplicateFx.hits.filter((h) => h.primary).length, 8, 'distinct simultaneous Primary instances remain distinct');
    assert.equal(duplicateFx.hits.filter((h) => h.slot === 1).length, 7, 'Ferus rejects the simultaneous duplicate through its own 200ms cooldown');
    assert.deepEqual(petEffects([null, lineup[1]], petData).timedBuffs, [], 'no Primary pet, no casts to react to');
    assert.equal(petEffects([null, lineup[1]], petData).hits.length, 0);
    const masked = petEffects([lineup[0], { id: 32401, star: 6 }, lineup[3]], petData);
    assert.ok(!masked.hits.some((h) => h.sharePct), 'an earlier core masks Zherlthsh core, even if the earlier effect is not modeled');
    const offense = petEffects([lineup[2], lineup[2]], petData).timedBuffs[0];
    assert.deepEqual([offense.firstMs, offense.durMs], [417, 5500], 'Radiant Moon begins on the first hit and refreshes on the second');
    const buffOnly = petEffects([{ id: 10001, star: 6 }, { id: 30002, star: 6 }, { id: 31003, star: 6 }, lineup[1]], petData);
    assert.equal(buffOnly.hits.filter((h) => h.slot === 1).length, 5, 'Owl strikes are individual events');
    assert.equal(buffOnly.hits.filter((h) => h.slot === 2).length, 10, 'Incubus aura ticks are individual events');
    assert.equal(buffOnly.hits.filter((h) => h.slot === 3).length, 0, 'a Buff cast cannot trigger Ferus, including indirectly via Owl');
    const rb = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023]] };
    const post = { level: 100, def: 0, mdef: 0, flee: 1, hit: 1, element: 1, resCri: 0 };
    const run = (pets, ms = 60000, extra = {}) => {
      const trace = [];
      return { res: simulateRotation({ ...rb, pets, ...extra }, post, [1330505], ms, petData, trace), trace };
    };
    const off = run([]);
    const on = run(lineup.slice(0, 3));
    const breath = on.trace.filter((e) => e.ev.skillId === 2344306);
    const ferus = on.trace.filter((e) => e.ev.skillId === -9020001);
    assert.deepEqual(on.res.castLog.filter((c) => c.kind === 'pet').map((c) => c.t), [0, 30000], '30 s Primary cooldown, without a player cast lock');
    assert.equal(breath.length, 14);
    assert.deepEqual(ferus.map((e) => e.t), breath.map((e) => e.t));
    assert.ok(breath.every((e) => e.ev.p1 === 32000) && ferus.every((e) => e.ev.p1 === 27000));
    const owner = (r) => r.trace.filter((e) => e.kind !== 'pet').map((e) => [e.t, e.ev.skillId, e.ev.expectedPerAttempt]);
    assert.deepEqual(owner(on), owner(off), 'independent pet damage neither replaces nor delays owner attacks');
    const fire = run([lineup[0]], 2000, { element: 4 });
    assert.ok(fire.trace.filter((e) => e.kind === 'pet').every((e) => e.ev.eleMod === 1), 'Neutral pet damage cannot inherit the weapon element');
    const mage = run([lineup[0]], 2000, { equipmentAttrs: [[104, 9000]] });
    assert.ok(mage.trace.filter((e) => e.kind === 'pet').every((e) => e.ev.magic && e.ev.atkStat > 9000 && e.ev.critRate === 0), 'Adaptive picks owner MATK even for a Ranger');
    const mixed = simulateDistribution({ ...rb, pets: [lineup[0]], equipmentAttrs: [[104, 9000], [111, 10000]],
      timedBuffs: [{ name: 'Adaptive switch', attrs: [[103, 20000]], firstMs: 500, durMs: 1000, periodMs: 30000 }] }, post, [], 2000, { runs: 2, seed: 7, captureRun: true }, petData);
    assert.deepEqual(mixed.sampleRun.filter((e) => e.id === 2344306).map((e) => e.crit), [false, true, true, true, true, true, false], 'each Adaptive hit resolves its current attack type, not the first hit type');
    assert.equal(mixed.skills.find((s) => s.id === 2344306).crits, 10);
    const captured = simulateDistribution({ ...rb, pets: lineup, equipmentAttrs: [...rb.equipmentAttrs, [111, 10000]] }, post, [1330505], 30000, { runs: 2, seed: 42, captureRun: true }, petData);
    const core = captured.sampleRun.find((e) => e.id === -9130401);
    assert.equal(core.damage, Math.round(captured.sampleRun.filter((e) => e.id === 2344306).reduce((sum, e) => sum + e.damage, 0) * 0.4), 'core copies actual rolled Primary total, excluding Ferus and without reapplying buffs/crit');
    assert.equal(captured.skills.find((s) => s.id === 2344306).crits, 14, 'all seven crits per run count as landed hits');
    const dull = simulateDistribution({ ...rb, pets: [lineup[0], { id: 32002, star: 6 }] }, { ...post, flee: 1e9 }, [], 6000, { runs: 30, seed: 7, captureRun: true }, petData);
    const extra = dull.sampleRun.filter((e) => e.id === -9032002);
    assert.ok(extra.length > 0 && extra.every((e, i) => e.t < 5000 && (!i || e.t - extra[i - 1].t >= 500)));
    assert.ok(extra.every((e) => dull.sampleRun.some((a) => a.kind === 'auto' && a.t === e.t && !a.miss)), 'owner-hit passive cannot trigger on a missed attack');
    const timedSkill = { _iID: 9000101, _iSkillID: 90001, _iBasicType: 1, _iCD: 1000, _iActionTime: 1000, _iScriptShow: 90001, _kBuff1: [[9000201, 10000, 100]], _kDamageParam1: [] };
    const timedData = Object.assign(Object.create(petData), { row: (table, id) => table === 'SkillConfig' && id === timedSkill._iID ? timedSkill
      : table === 'BuffConfig' && id === 9000201 ? { _kChangeAttri: [[1215, 5000]] }
      : table === 'SkillTiming' && id === 90001 ? [0, 1, 0, [0.2]] : petData.row(table, id) });
    const history = [];
    simulateRotation({ ...rb, pets: [lineup[0]] }, post, [timedSkill._iID], 2000, timedData, history);
    const expected = run([lineup[0]], 2000).trace.filter((e) => e.kind === 'pet');
    history.filter((e) => e.kind === 'pet').forEach((e, i) => {
      const ratio = e.ev.expectedPerAttempt / expected[i].ev.expectedPerAttempt;
      assert.ok(Math.abs(ratio - (e.t >= 1200 && e.t < 1300 ? 1.5 : 1)) < 0.001, `pet at ${e.t}: sees only the buff actually up at that instant`);
    });
  }

  // 17. Verify the Warg Hunter kit: Warg Bite resets Warg Hunt, King of the Wargs enhances it and sends the wolf followers, mounted-only skills need a ride
  {
    const rb = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023]], periodicOff: true };
    const post = { level: 100, def: 0, mdef: 0, flee: 1, hit: 1, element: 1, resCri: 0 };
    const [KING, CHARGE, BITE, HUNT, FAS] = [1332205, 1331213, 1332505, 1332305, 1330505];
    const run = (b, rot, secs = 30) => {
      const trace = [];
      return { res: simulateRotation({ ...rb, ...b }, post, rot, secs * 1000, data, trace), trace };
    };
    const casts = (r, id) => r.res.castLog.filter((c) => c.id === id);
    // Bite resets Hunt: Hunt follows every Bite at once, although its own cooldown (2.5 s) has not run out.
    const loop = run({ ridden: true }, [BITE, HUNT, FAS]);
    const bites = casts(loop, BITE);
    assert.ok(bites.length >= 8);
    for (const b of bites.filter((c) => c.t + c.lockMs < 30000)) assert.ok(casts(loop, HUNT).some((h) => h.t === b.t + b.lockMs), `Warg Hunt right after the Warg Bite at ${b.t}`);
    // Mounted-only skills need the ride; Warg Charge works without it but then grants no Physical DMG.
    const walk = run({ ridden: false }, [KING, CHARGE, BITE, HUNT, FAS]);
    assert.deepEqual([KING, BITE, HUNT].map((id) => casts(walk, id).length), [0, 0, 0], 'the wolf is not ridden');
    assert.ok(casts(walk, CHARGE).length > 0);
    const rideHits = run({ ridden: true }, [CHARGE, FAS], 5).trace;
    const walkHits = run({ ridden: false }, [CHARGE, FAS], 5).trace;
    const charge = casts(run({ ridden: true }, [CHARGE, FAS], 5), CHARGE)[0];
    rideHits.forEach((e, i) => {
      const ratio = e.ev.expectedPerAttempt / walkHits[i].ev.expectedPerAttempt;
      const inside = e.t >= charge.t && e.t < charge.t + 3000; // the buff lands with the hit, so it lifts the Charge's own hit too
      assert.ok(Math.abs(ratio - (inside ? 1.1 : 1)) < 1e-3, `hit at ${e.t} ms (${e.ev.skillName}): x${ratio} (${inside ? 'inside' : 'outside'} the 3 s of Warg Charge's Physical DMG)`);
    });
    // King of the Wargs: 6 s of Enhanced Warg Hunt (310%) and followers on Warg Charge (4 hits, 320%) and Warg Bite (240%).
    const king = run({ ridden: true }, [KING, CHARGE, BITE, HUNT, FAS]);
    const kingCasts = casts(king, KING).map((c) => c.t);
    assert.deepEqual(kingCasts.length, 2, 'cooldown 24 s: twice in 30 s');
    const inKing = (t) => kingCasts.some((k) => t > k && t < k + 6000);
    const enhanced = king.res.castLog.filter((c) => c.id === 1332315);
    assert.ok(enhanced.length >= 3 && enhanced.every((c) => inKing(c.t)), 'Enhanced Warg Hunt only inside the window');
    assert.ok(casts(king, HUNT).length > 0 && casts(king, HUNT).every((c) => !inKing(c.t)), 'plain Warg Hunt only outside it');
    const huntHits = (id) => king.trace.filter((e) => e.ev.skillId === id);
    assert.equal(huntHits(1332315).length, enhanced.length);
    assert.ok(huntHits(1332315).every((e) => e.ev.p1 === 31000) && huntHits(1332305).every((e) => e.ev.p1 === 15000), 'Enhanced Warg Hunt 310%, Warg Hunt 150%');
    // The followers (King of the Wargs Lv 5): 4 hits of 80% with each Warg Charge, one 240% hit with each Warg Bite, inside the window only.
    const chargeFollowers = huntHits(1332705);
    const biteFollowers = huntHits(1332805);
    assert.equal(chargeFollowers.length, 8, 'two Warg Charges inside a window, 4 hits each');
    assert.ok(chargeFollowers.every((e) => e.ev.p1 === 8000) && biteFollowers.every((e) => e.ev.p1 === 24000));
    assert.ok(biteFollowers.length >= 3 && biteFollowers.length < casts(king, BITE).length, 'only the Warg Bites inside a window');
    assert.ok(king.res.castLog.some((c) => c.kind === 'follow' && c.hits.length === 4));
    assert.ok(king.res.totalExpectedDamage > run({ ridden: true }, [CHARGE, BITE, HUNT, FAS]).res.totalExpectedDamage * 1.05, 'King of the Wargs adds damage');
  }

  // 18. Verify the stat split: the best DEX / LUK split found by the coarse-then-fine sweep is the one a full sweep finds
  {
    const rb = { career: 3400, level: 60, stats: [1, 1, 1, 1, 1, 1], equipmentAttrs: [[103, 1500], [109, 80]], skillLevels: {}, periodicOff: true };
    const post = { level: 100, def: 0, mdef: 0, flee: 1, hit: 1, element: 1, resCri: 0 };
    const rot = [1330505];
    const split = optimizeStatSplit(rb, post, [4, 5], { rotation: rot, windowMs: 10000 }, data);
    assert.ok(split.used <= split.budget && split.budget - split.used < 4, 'the budget is spent');
    assert.deepEqual(split.stats.map((v, i) => (i === 4 || i === 5 ? 0 : v)), [1, 1, 1, 1, 0, 0], 'only the pair gets points');
    const cost = (v) => statCost(v, data);
    let best = 0;
    for (let a = 1; a <= MAX_STAT; a++) {
      if (cost(a) > split.budget) break;
      let b = 1;
      while (b < MAX_STAT && cost(a) + cost(b + 1) <= split.budget) b++;
      const stats = [1, 1, 1, 1, 1, 1];
      stats[4] = a;
      stats[5] = b;
      best = Math.max(best, simulateRotation({ ...rb, stats }, post, rot, 10000, data).sustainedDps);
    }
    assert.ok(split.dps >= best * 0.9995, `the sweep finds the best split (${split.dps.toFixed(1)} of ${best.toFixed(1)})`);
  }

  // 19. Verify cards: attributes by star and level, the unique rule, Phreeoni's HIT conversion, Drake's size bonus and the damage
  // against the target's element, race and size (all in the additive bracket with the Physical / Ranged damage bonuses)
  {
    const rb = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023], [109, 84]] };
    const post = { level: 100, def: 0, mdef: 0, flee: 1, hit: 1, element: 1, race: 3, size: 3, resCri: 0 };
    const fas = data.row('SkillConfig', 1330505); // a ranged Physical skill
    const hit = (b, d = post) => evaluateSkillDamage(b, d, fas, {}, data).normalHitMean;
    const near = (a, b, msg) => assert.ok(Math.abs(a / b - 1) < 2e-3, `${msg}: ${a} vs ${b}`);
    const [PHREEONI, DRAKE, ORC_ARCHER, SHADOW_DRAKE, WOLF] = [1460101, 1460100, 1440603, 1450100, 1440113];
    const slot = (id, star = 3, level = 15) => ({ id, star, level });
    const sorted = (pairs) => JSON.stringify([...pairs].sort((a, b) => a[0] - b[0]));
    // Basic attributes of the star + the level's upgrade (P.ATK and M.ATK +6 per level on an MVP weapon card), capped by the star
    const max = cardEffects([slot(PHREEONI)], data);
    assert.equal(sorted(max.attrs), sorted([[109, 900], [103, 90], [104, 90]]));
    assert.deepEqual(max.stunts.map((s) => s._kSpecialEffect), [[[8, 109, 1, 1304, 1, 1100]]], 'Every 1 HIT: +0.01% Physical damage, up to 11% at 3 stars');
    assert.equal(sorted(cardEffects([slot(PHREEONI, 0, 99)], data).attrs), sorted([[109, 500], [103, 30], [104, 30]]), 'a 0 star card stops at Lv 5');
    assert.equal(cardEffects([slot(PHREEONI, 0, 99)], data).stunts[0]._kSpecialEffect[0][5], 850, 'and caps the conversion at 8.5%');
    assert.equal(sorted(cardEffects([slot(PHREEONI, 3, 0)], data).attrs), sorted([[109, 900]]), 'Lv 0 has no upgrade attributes');
    assert.equal(sorted(cardEffects([{ id: PHREEONI }], data).attrs), sorted(max.attrs), 'no star or level = the maximum');
    assert.equal(sorted(cardEffects([slot(1)], data).attrs), '[]', 'an unknown card gives nothing');
    // Drake: all three sizes, from the buff's value; a unique card counts once, an ordinary one every time
    assert.equal(sorted(cardEffects([slot(DRAKE)], data).attrs), sorted([[103, 90], [104, 90]]));
    assert.equal(cardEffects([slot(DRAKE)], data).sizeBonusBp, 1150, 'Drake is a combat bonus, not an ordinary panel size attribute');
    assert.deepEqual(cardEffects([slot(DRAKE), slot(DRAKE, 0, 0)], data), cardEffects([slot(DRAKE)], data), 'the MVP card is unique');
    assert.equal(sorted(cardEffects([slot(ORC_ARCHER), slot(ORC_ARCHER)], data).attrs), sorted([[321, 600], [103, 75], [104, 75], [321, 600], [103, 75], [104, 75]]));

    // On the sheet: Phreeoni's HIT (+900) feeds the conversion, which is capped, and lands in Physical Damage (211)
    const base = buildCharacterStats(rb, data);
    const withCard = buildCharacterStats({ ...rb, cards: [slot(PHREEONI)] }, data);
    assert.equal(withCard[109], base[109] + 900);
    assert.equal(withCard[211], base[211] + Math.min(withCard[109], 1100));
    const manual = { ...rb, equipmentAttrs: [...rb.equipmentAttrs, [109, 900], [103, 90], [104, 90]], stunts: [{ _kSpecialEffect: [[8, 109, 1, 1304, 1, 1100]] }] };
    assert.equal(hit({ ...rb, cards: [slot(PHREEONI)] }), hit(manual), 'a card is the same as its parts');
    assert.ok(hit({ ...rb, cards: [slot(PHREEONI)] }) > hit(rb) * 1.1, 'Phreeoni adds damage');

    // Against the target: Neutral +6%, Wind +6% (not the target's), Demon +10%, Large +11.5%; Drake covers every size
    const plain = hit(rb);
    const adds = (...attrs) => ({ ...rb, equipmentAttrs: [...rb.equipmentAttrs, ...attrs] });
    near(hit(adds([321, 600])), plain * 1.06, 'Damage to Neutral Monsters');
    near(hit(adds([322, 600])), plain, 'a Wind bonus does nothing to a Neutral target');
    near(hit(adds([403, 1000])), plain * 1.1, 'Damage to Demon Race');
    near(hit(adds([404, 1000])), plain, 'a Plant bonus does nothing to a Demon');
    near(hit(adds([505, 1150])), plain * 1.115, 'DMG vs Large Enemies');
    near(hit(adds([505, 1150]), { ...post, size: 1 }), hit(rb, { ...post, size: 1 }), 'a Large bonus does nothing to a Small target');
    for (const size of [1, 2, 3]) near(hit({ ...rb, cards: [slot(DRAKE, 3, 0)] }, { ...post, size }), plain * 1.115, `Drake against size ${size}`);
    near(hit(adds([321, 600], [229, 1000])), plain * 1.16, 'target bonuses add to the Ranged Physical bonus, they do not multiply');
    near(hit(adds([321, 600]), { ...post, element: 0, race: 0, size: 0 }), hit(rb, { ...post, element: 0, race: 0, size: 0 }), 'a target without element, race or size gets none');
    const stray = buildCharacterStats(adds([320, 777]), data); // 320 is Undead Damage Reduction, not a bonus against Neutral
    assert.equal(targetBonus(stray, {}) + targetBonus(stray, { element: 0, race: 0, size: 0 }), 0);
    assert.equal(targetBonus(stray, { element: 1.5, race: 2.5, size: 1.5 }, 1150, true), 0, 'unknown or fractional classifications cannot select a bonus');
    for (let id = 1; id <= 10; id++) {
      const elementTarget = { ...post, element: id };
      const raceTarget = { ...post, race: id };
      near(hit(adds([320 + id, 750]), elementTarget), hit(rb, elementTarget) * 1.075, `monster element ${id} selects its own bonus`);
      near(hit(adds([400 + id, 750]), raceTarget), hit(rb, raceTarget) * 1.075, `monster race ${id} selects its own bonus`);
      near(hit(adds([320 + id, 750]), { ...post, element: id % 10 + 1 }), hit(rb, { ...post, element: id % 10 + 1 }), 'nonmatching element bonuses stay inactive');
      near(hit(adds([400 + id, 750]), { ...post, race: id % 10 + 1 }), hit(rb, { ...post, race: id % 10 + 1 }), 'nonmatching race bonuses stay inactive');
      const elementalBuild = { ...rb, element: id };
      const elementalHit = hit(elementalBuild);
      near(hit({ ...elementalBuild, equipmentAttrs: [...rb.equipmentAttrs, [300 + id, 1000]] }), elementalHit * 1.1, `skill element ${id} uses its own damage bonus`);
    }
    near(hit(adds([304, 1000]), { ...post, element: 4 }), hit(rb, { ...post, element: 4 }), 'Fire skill damage does not boost a Neutral attack against a Fire monster');
    const fireBolt = data.row('SkillConfig', 1200401);
    const fireDamage = (b) => evaluateSkillDamage({ ...b, equipmentAttrs: [...b.equipmentAttrs, [104, 3000]] }, post, fireBolt, {}, data).normalHitMean;
    near(fireDamage(adds([304, 1000])), fireDamage(rb) * 1.1, 'fixed Fire magic uses Fire skill damage with a Neutral weapon');
    near(fireDamage(adds([301, 1000])), fireDamage(rb), 'fixed Fire magic does not inherit Neutral skill damage');

    const wolfCards = [slot(DRAKE, 1, 0), ...Array.from({ length: 3 }, () => slot(WOLF, 1, 0))];
    const wolfStats = buildCharacterStats({ ...rb, cards: wolfCards }, data);
    assert.deepEqual([wolfStats[501], wolfStats[503], wolfStats[505]], [1404, 0, 0], 'Drake stays separate from the three stacked Wolf panel bonuses');
    const mixedSizes = { ...adds([501, 100], [503, 200], [505, 300], [322, 700], [401, 800]), cards: [slot(DRAKE, 1, 0)] };
    for (const size of [1, 2, 3]) {
      const d = { ...post, size };
      const manual = adds([103, 57], [104, 57], [499 + 2 * size, 850 + 1404]);
      assert.equal(hit({ ...rb, cards: wolfCards }, d), hit(manual, d), 'Drake enables every Wolf bonus against any size and adds its own bonus once');
      assert.equal(hit(mixedSizes, d), hit(adds([499 + 2 * size, 850 + 600]), d), 'Drake enables all offensive size bonuses without removing element or race conditions');
      const shadowBuild = { ...rb, cards: [slot(SHADOW_DRAKE, 1, 0)] };
      const ev = evaluateSkillDamage(shadowBuild, d, fas, {}, data);
      const low = ev.damageAt(1, false, false), high = ev.damageAt(1, false, true);
      assert.equal(low, hit(rb, d));
      near(high, low * 1.08, 'a successful 1-star Shadow Drake proc adds 8% in the current bracket');
      assert.equal(ev.sizeProcChance, 0.75);
      assert.equal(ev.normalHitMean, low * 0.25 + high * 0.75, 'expectation weights the two separately rounded outcomes');
      assert.equal(ev.critHitMean, ev.damageAt(1, true, false) * 0.25 + ev.damageAt(1, true, true) * 0.75);
      assert.deepEqual(cardEffects([slot(SHADOW_DRAKE, 1, 0), slot(SHADOW_DRAKE, 0, 0)], data), cardEffects(shadowBuild.cards, data), 'Shadow Drake is unique too');
      const shadowWolves = { ...rb, cards: [slot(SHADOW_DRAKE, 1, 0), ...wolfCards.slice(1)] };
      const shadowManual = { ...adds([103, 57], [104, 57], [499 + 2 * size, 1404]), cards: [slot(SHADOW_DRAKE, 1, 0)] };
      assert.equal(hit(shadowWolves, d), hit(shadowManual, d), 'yellow Drake enables Wolf bonuses against every size');
      const shadowWolfHit = evaluateSkillDamage(shadowWolves, d, fas, {}, data);
      const shadowManualHit = evaluateSkillDamage(shadowManual, d, fas, {}, data);
      assert.equal(shadowWolfHit.damageAt(1, false, false), shadowManualHit.damageAt(1, false, false), 'yellow size-ignore stays active when its extra-damage proc does not trigger');
      const both = evaluateSkillDamage({ ...rb, cards: [slot(DRAKE, 1, 0), slot(SHADOW_DRAKE, 1, 0)] }, d, fas, {}, data);
      near(both.damageAt(1, false, true), hit(rb, d) * 1.165, 'red and Shadow Drake add in the current damage bracket');
    }
    const shadowBuild = { ...rb, cards: [slot(SHADOW_DRAKE, 1, 0)] };
    const rolls = simulateDistribution(shadowBuild, post, [fas._iID], 30000, { runs: 1000, seed: 9137, captureRun: true }, data);
    const mean = rolls.totals.reduce((sum, v) => sum + v, 0) / rolls.runs;
    assert.ok(Math.abs(mean / rolls.expectedTotal - 1) < 0.01, 'Shadow Drake Monte Carlo converges on its weighted expectation');
    assert.ok(rolls.sampleRun.some((e) => e.sizeProc) && rolls.sampleRun.some((e) => !e.miss && !e.sizeProc), 'the replay contains both proc and non-proc hits');
    const again = simulateDistribution(shadowBuild, post, [fas._iID], 30000, { runs: 1000, seed: 9137 }, data);
    assert.deepEqual(rolls.totals, again.totals, 'capturing proc hits does not change seeded outcomes');
    for (const chanceBp of [0, 10000]) {
      const forced = Object.assign(Object.create(data), {
        row: (table, id) => table === 'BuffConfig' && id === 2050002
          ? { ...data.row(table, id), _kLogicData: [chanceBp, 800] } : data.row(table, id),
      });
      const ev = evaluateSkillDamage(shadowBuild, post, fas, {}, forced);
      assert.equal(ev.normalHitMean, ev.damageAt(1, false, chanceBp > 0), 'zero and certain proc chances have no phantom probability');
    }

    // Star by star, as the wiki lists them (wiki.ro3.cc, compared with all 242 cards x 4 stars on 2026-10-15): Lunatic, Phreeoni, Drake,
    // Orc Archer and Nightmare. `cardParts` keeps the star's own attributes apart from the level bonus and the Collection attributes.
    const parts = (id, s, f = {}) => cardParts({ id, star: s, level: 0, ...f }, data);
    const by = (id, pick) => [0, 1, 2, 3].map((s) => pick(parts(id, s)));
    const attrOf = (a) => (p) => p.base.find(([id]) => id === a)?.[1] ?? 0;
    assert.deepEqual(by(1420100, (p) => sorted(p.base)), [[[6, 1], [111, 100], [110, 1]], [[6, 1], [111, 100], [110, 1], [103, 14]], [[6, 1], [111, 200], [110, 1], [103, 14]], [[6, 1], [111, 200], [110, 1], [103, 28]]].map(sorted), 'Lunatic Card by star');
    assert.deepEqual(by(PHREEONI, attrOf(109)), [500, 900, 900, 900], 'Phreeoni HIT by star');
    assert.deepEqual([0, 1, 2, 3].map((s) => cardEffects([slot(PHREEONI, s, 0)], data).stunts[0]._kSpecialEffect[0][5]), [850, 850, 950, 1100], 'Phreeoni HIT -> Physical DMG cap by star: 8.5 / 8.5 / 9.5 / 11%');
    assert.deepEqual([0, 1, 2, 3].map((s) => cardEffects([slot(DRAKE, s, 0)], data).sizeBonusBp), [750, 850, 1000, 1150], 'Drake: 7.5 / 8.5 / 10 / 11.5% against Small, Medium and Large');
    assert.deepEqual([0, 1, 2, 3].map((s) => cardEffects([slot(SHADOW_DRAKE, s, 0)], data).sizeProc),
      [{ chanceBp: 6500, bonusBp: 800 }, { chanceBp: 7500, bonusBp: 800 }, { chanceBp: 8500, bonusBp: 800 }, { chanceBp: 8500, bonusBp: 1000 }], 'Shadow Drake chances and bonuses follow each star');
    assert.deepEqual(by(ORC_ARCHER, attrOf(321)), [240, 360, 480, 600], 'Orc Archer: Damage to Neutral Monsters by star');
    assert.deepEqual(by(1440702, attrOf(2)), [2, 2, 3, 3], 'Nightmare: AGI by star');
    assert.deepEqual(by(1440702, attrOf(726)), [140, 280, 280, 420], 'Nightmare: Sleep Resistance by star');
    assert.deepEqual(parts(DRAKE, 3).base, [], 'Drake has no basic attribute: only its effect and the level bonus');
    assert.deepEqual(parts(DRAKE, 3, { level: 15 }).levelAttrs, [[103, 90], [104, 90]], 'the level bonus is apart from the star');

    // Collection (foil) cards: the wiki's "Collection attributes" on top of everything else, only for purple, gold and red cards
    assert.deepEqual(parts(DRAKE, 3).collectionAttrs, [[209, 150], [215, 100], [221, 16]], 'Red weapon / accessory Collection card: Crit DMG +1.5%, Damage Increase +1%, Bonus ATK +16');
    assert.deepEqual(parts(ORC_ARCHER, 3).collectionAttrs, [[215, 60], [221, 10]], 'Purple accessory Collection card: Damage Increase +0.6%, Bonus ATK +10');
    assert.deepEqual(parts(1440702, 3).collectionAttrs, [[216, 60], [223, 20]], 'Purple head Collection card: the defensive twins');
    assert.deepEqual(parts(1430612, 3).collectionAttrs, [], 'a Blue card has no Collection version');
    assert.equal(sorted(cardEffects([slot(DRAKE)], data).attrs), sorted(cardEffects([{ ...slot(DRAKE), flash: false }], data).attrs), 'Collection is off unless asked for');
    assert.equal(sorted(cardEffects([{ ...slot(1430612), flash: true }], data).attrs), sorted(cardEffects([slot(1430612)], data).attrs), 'asking for a Collection version that does not exist adds nothing');
    assert.equal(sorted(cardEffects([{ ...slot(DRAKE), flash: true }], data).attrs), sorted([...cardEffects([slot(DRAKE)], data).attrs, [209, 150], [215, 100], [221, 16]]));
    // On the sheet and in the damage: Crit DMG +1.5% and Damage Increase +1% are what they say, Bonus ATK is added to the attack
    const coll = { ...rb, cards: [{ ...slot(ORC_ARCHER, 3, 0), flash: true }] };
    const noColl = { ...rb, cards: [slot(ORC_ARCHER, 3, 0)] };
    const withFlash = buildCharacterStats(coll, data);
    assert.deepEqual([withFlash[215], withFlash[221]], [60, 10], 'Damage Increase and Bonus ATK reach the sheet');
    assert.equal(hit(coll), hit({ ...noColl, equipmentAttrs: [...rb.equipmentAttrs, [215, 60], [221, 10]] }), 'a Collection card is the same as its parts');
    near(hit({ ...rb, equipmentAttrs: [...rb.equipmentAttrs, [215, 100]] }), plain * 1.01, 'Damage Increase +1% adds 1%');
    near(hit(adds([221, 200])), plain * (base[103] + 200) / base[103], 'Bonus ATK is attack: +200 of 4,000 is +5%');
    assert.equal(hit({ ...rb, equipmentAttrs: [...rb.equipmentAttrs, [222, 500]] }), plain, 'Bonus MATK does nothing to a Physical skill');
    const crit = (b) => evaluateSkillDamage(b, post, fas, {}, data).critHitMean;
    near(crit(adds([209, 150])) / crit(rb), 1 + 150 / 15000, 'Crit DMG +1.5% lifts a crit by 1%');
  }

  // 20. Verify gear: base attributes at a roll, the roll quantiles, affixes, stunts, the grid tables and how they reach the sheet
  {
    const rb = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 100], [109, 84]] };
    const post = { level: 100, def: 0, mdef: 0, flee: 1, hit: 1, element: 1, race: 3, size: 3, resCri: 0 };
    const fas = data.row('SkillConfig', 1330505);
    const hit = (b) => evaluateSkillDamage(b, post, fas, {}, data).normalHitMean;
    const [BOW, GOLD_BOW, PURPLE_BOW, BLUE_BOW, ARMOR, RING] = [2110660, 2110650, 2110640, 2110630, 2550660, 2700660];
    const part = (id, g = {}) => gearParts({ grid: 1, id, ...g }, data);
    const values = (p) => p.base.map((b) => [b.attr, b.value]);
    // Rudra Bow (T6 Red, wiki.ro3.cc/en/equip/2110660: HP 3420-4560, P.ATK and M.ATK 428-570): min + (max - min) * roll / 10000, whole numbers
    assert.deepEqual(part(BOW, { roll: 0 }).base.map((b) => [b.attr, b.min, b.max]), [[101, 3420, 4560], [103, 428, 570], [104, 428, 570]]);
    assert.deepEqual(values(part(BOW, { roll: 0 })), [[101, 3420], [103, 428], [104, 428]]);
    assert.deepEqual(values(part(BOW, { roll: 5050 })), [[101, 3995], [103, 499], [104, 499]]);
    assert.deepEqual(values(part(BOW, { roll: 10000 })), [[101, 4560], [103, 570], [104, 570]]);
    assert.deepEqual(values(part(BOW, { roll: 99999 })), values(part(BOW, { roll: 10000 })), 'a roll stops at the top of the range');
    assert.deepEqual(values(part(BOW, {})), values(part(BOW, { roll: 5000 })), 'no roll = the middle');
    assert.equal(part(BOW).rank, 6);
    assert.deepEqual([3, 4, 5, 6].map((q) => [0.25, 0.5, 0.75].map((p) => rollQuantile(q, p, data))), [[2500, 5000, 7500], [2500, 5000, 7500], [2250, 3650, 5725], [3200, 5050, 6850]], 'Low / Mid / High of Blue, Purple, Gold and Red rolls');
    // Every T5-T7 item rolls inside its range at the ends and the middle
    const catalog = Object.values(data.table('ItemConfig')).filter((i) => i._iType === 5 && i._iID < 9000000 && i._iLevelNeed < 999 && data.row('EquipConfig', i._iEquipId)?._iRank >= 5);
    assert.ok(catalog.length >= 200, `T5-T7 gear: ${catalog.length} items`);
    for (const i of catalog) for (const roll of [0, 5000, 10000]) for (const b of part(i._iID, { roll }).base) assert.ok(b.value >= b.min && b.value <= b.max, `${i._iID} attribute ${b.attr} at roll ${roll}`);

    // Affixes: T6 two-hander entries are 12-20 (group 6106), others 6-10; Red and Gold carry up to 2, Purple 1, Blue (T5+) none; none twice
    const aff = (id, affixes, roll = 5000) => part(id, { affixes, roll }).affixes.map((a) => [a.attr, a.value]);
    assert.deepEqual(aff(BOW, [5, 2], 0), [[5, 12], [2, 12]]);
    assert.deepEqual(aff(BOW, [5, 2], 5000), [[5, 16], [2, 16]]);
    assert.deepEqual(aff(BOW, [5, 2], 10000), [[5, 20], [2, 20]]);
    assert.deepEqual(aff(RING, [5, 2], 10000).concat(aff(RING, [5], 0)), [[5, 10], [2, 10], [5, 6]], 'accessories roll 6-10');
    assert.deepEqual([BOW, GOLD_BOW, PURPLE_BOW, BLUE_BOW].map((id) => part(id).slots), [2, 2, 1, 0]);
    assert.deepEqual(aff(BOW, [5, 5, 2]), [[5, 16], [2, 16]], 'one attribute twice counts once');
    assert.deepEqual(aff(BOW, [101, 0, 5]), [[5, 16]], 'only STR..LUK of the pool, 0 = none');
    assert.deepEqual(aff(PURPLE_BOW, [5, 2]), [[5, part(PURPLE_BOW, { affixes: [5] }).affixes[0].value]], 'a Purple item has room for one');
    assert.deepEqual(aff(BLUE_BOW, [5]), [], 'a Blue T6 item has none');

    // Stunts: one per pool (the common pool first, the rare one second), from that pool only; fixed stunts come with the item
    const pools = part(BOW).pools;
    assert.equal(pools.length, 2);
    assert.ok(pools[0].includes(10010601) && !pools[0].includes(10010603) && !pools[0].includes(10020607));
    assert.ok(pools[1].includes(10020607) && pools[1].includes(10020603) && !pools[1].includes(10010601));
    assert.deepEqual(part(BOW, { stunts: [10010601, 10020607] }).stunts, [10010601, 10020607]);
    assert.deepEqual(part(BOW, { stunts: [10020607, 10010601] }).stunts, [0, 0], 'a stunt from the other pool is dropped');
    assert.deepEqual(part(BOW, { stunts: [10010603] }).stunts, [0, 0], 'a Max HP stunt is not in the weapon pool');
    assert.deepEqual(part(2550561).pools, [[10010505]], 'Mink Coat-STR/AGI-ATK: one stunt in a pool that always rolls');
    assert.deepEqual(part(2550561).stunts, [10010505], 'so the item always has it');
    assert.deepEqual(part(2550561, { stunts: [10010601] }).stunts, [10010505], 'whatever is asked');
    assert.deepEqual(part(2550561).fixed, [[1, 7], [2, 7]], 'and fixed entries: STR +7, AGI +7');
    assert.deepEqual(part(BOW).chances, [10000, 1000], 'the common pool always rolls, the rare one 10% of the time');

    // Grid levels: the totals of the tables at that level (weapon: P.ATK / M.ATK; armor grid: Max HP, P.DEF, M.DEF)
    assert.deepEqual(part(BOW, { refine: 15 }).refineAttrs, [[103, 401], [104, 401]]);
    assert.deepEqual(part(BOW, { enhance: 70 }).enhanceAttrs, [[103, 140], [104, 140]]);
    assert.deepEqual(part(BOW, { refine: 0, enhance: 0 }).refineAttrs.concat(part(BOW, { refine: 0 }).enhanceAttrs), []);
    assert.deepEqual(gearParts({ grid: 3, id: ARMOR, refine: 15 }, data).refineAttrs, [[101, 10680], [105, 134], [106, 134]]);

    // On the sheet: the set is the same as its parts, in the same pipeline as everything else
    const bow = { grid: 1, id: BOW, roll: 5050, affixes: [5, 2], stunts: [10010601, 10020607], refine: 15, enhance: 70 };
    const ring = { grid: 6, id: RING, roll: 5050, affixes: [5], stunts: [10010606, 10020603], refine: 12, enhance: 40 };
    const fx = gearEffects([bow, ring], data);
    assert.equal(fx.count, 4);
    assert.deepEqual([...fx.grids], [1, 6]);
    const manual = {
      ...rb,
      equipmentAttrs: [...rb.equipmentAttrs, ...fx.attrs],
      stunts: [{ _kSpecialEffect: [[5, 1, 103, 4]], refine: 15 }, { _kSpecialEffect: [[1, 218, 500]], refine: 15 }, { _kSpecialEffect: [[4, 1, 10, 103, 9]], refine: 12 }, { _kSpecialEffect: [[8, 104, 34, 1033, 1, 160]], refine: 12 }],
    };
    const geared = { ...rb, gear: [bow, ring] };
    const [a, b] = [buildCharacterStats(geared, data), buildCharacterStats(manual, data)];
    for (const id of [1, 2, 5, 101, 102, 103, 104, 105, 106, 109, 110, 111, 218, 1033]) assert.equal(a[id], b[id], `attribute ${id}: gear = its parts`);
    assert.equal(hit(geared), hit(manual), 'the damage too');
    const naked = buildCharacterStats(rb, data);
    assert.ok(a[103] > naked[103] + 499 + 140 + 401 && a[5] === naked[5] + 16 + 8 && a[2] === naked[2] + 16, 'attack, DEX and AGI rise (STR..LUK feed the per-point stats)');
    assert.ok(a[101] > naked[101] + 3995, 'Max HP rises by at least the weapon\'s');
    assert.ok(hit(geared) > hit(rb) * 1.2, 'gear adds damage');
    assert.equal(buildCharacterStats({ ...rb, gear: [{ ...bow, grid: 9 }, { grid: 1, id: 1 }, { grid: 1 }] }, data)[103], naked[103], 'unknown items and grids give nothing');
    assert.equal(buildCharacterStats({ ...rb, gear: [bow, { ...bow, roll: 10000 }] }, data)[103], buildCharacterStats({ ...rb, gear: [bow] }, data)[103], 'one item per grid');

    // Stunts: per refine of their grid (op 5), per stunt on all the gear (op 4, the evade effect counts but adds nothing)
    const patk = (b) => buildCharacterStats(b, data)[103];
    const stunted = (stunts, refine, extra = []) => ({ ...rb, gear: [{ grid: 1, id: BOW, stunts, refine }, ...extra] });
    const flat = (b, v) => ({ ...b, equipmentAttrs: [...b.equipmentAttrs, [103, v]] }); // the flat P.ATK a stunt stands for (the sheet multiplies it like any other)
    assert.equal(patk(stunted([10010601, 0], 15)), patk(flat(stunted([0, 0], 15), 4 * 15)), 'P.ATK +4 per refine: +60 at +15');
    assert.equal(patk(stunted([10010601, 0], 10)), patk(flat(stunted([0, 0], 10), 4 * 10)), 'and +40 at +10');
    assert.ok(patk(stunted([10010601, 0], 15)) > patk(stunted([0, 0], 15)));
    const evade = { grid: 3, id: ARMOR, stunts: [0, 10020609] };
    assert.equal(patk(stunted([10010606, 0], 0)), patk(flat(stunted([0, 0], 0), 9)), 'P.ATK +9 for every stunt on the gear: one stunt, +9');
    assert.equal(patk(stunted([10010606, 0], 0, [evade])), patk(flat(stunted([0, 0], 0, [evade]), 18)), 'the evade stunt on the armor is a second one: +18');
    assert.equal(patk({ ...rb, gear: [evade] }), patk({ ...rb, gear: [{ grid: 3, id: ARMOR }] }), 'the [1, 103, 1] stand-in of the evade effect is not +1 P.ATK');
    // The weapon of the gear replaces weaponRefine / weaponStrengthen; without one they still count
    const legacy = { ...rb, weaponRefine: 8, weaponStrengthen: 15 };
    assert.equal(patk({ ...legacy, gear: [{ grid: 1, id: BOW }] }), patk({ ...rb, gear: [{ grid: 1, id: BOW }] }), 'gear weapon: the old weapon fields are ignored');
    assert.ok(patk({ ...legacy, gear: [{ grid: 6, id: RING }] }) > patk({ ...rb, gear: [{ grid: 6, id: RING }] }), 'no gear weapon: they still count');
  }

  // 21. Verify what the simulator's Character Info rests on: a typed percent or damage row solves exactly (P.ATK % moves P.ATK and no base stat),
  //     and the weapon Refine / Strengthen of a saved state migrates to the flat P.ATK / M.ATK it stood for
  {
    const base = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023], [104, 3297]], passiveSkills: [1300110, 1300210] };
    const sheet = (b) => buildCharacterStats(b, data);
    const before = sheet(base);
    for (const [attr, target] of [[1031, before[1031] + 140], [1041, before[1041] + 250], [209, 300], [211, 1100], [213, 80], [215, 260], [221, 42], [235, 500]]) {
      const typed = sheet({ ...base, equipmentAttrs: [...base.equipmentAttrs, [attr, solveAttributeBonus(base, attr, target, data)]] });
      assert.equal(typed[attr], target, `typed ${attr} shows ${target}`);
      for (let s = 1; s <= 6; s++) assert.equal(typed[s], before[s], `typing ${attr} moves no base stat`);
    }
    const plus = sheet({ ...base, equipmentAttrs: [...base.equipmentAttrs, [1031, 140]] });
    assert.ok(plus[103] > before[103] && plus[104] === before[104], 'P.ATK % raises P.ATK only');
    const post = { level: 100, def: 0, mdef: 0, flee: 1, hit: 1, element: 1, race: 3, size: 3, resCri: 0 };
    const hit = (b) => evaluateSkillDamage(b, post, data.row('SkillConfig', 1330505), {}, data).normalHitMean;
    for (const [r, s] of [[0, 20], [9, 0], [9, 20], [15, 99], [16, 5]]) {
      const flat = legacyWeaponFlat(r, s);
      const [legacy, migrated] = [{ ...base, weaponRefine: r, weaponStrengthen: s }, { ...base, equipmentAttrs: [...base.equipmentAttrs, [103, flat], [104, flat]] }];
      for (const id of [103, 104, 1031, 1033]) assert.equal(sheet(legacy)[id], sheet(migrated)[id], `Refine +${r} / Strengthen ${s} = ${flat} flat P.ATK and M.ATK (attribute ${id})`);
      assert.equal(hit(legacy), hit(migrated), `...and the damage (Refine +${r} / Strengthen ${s})`);
    }
  }

  // 22. Verify pet stats: a pet shares its own stats with its master, as the client's Stat Bonus Overview adds them up
  {
    const rows = Array.from({ length: 99 }, (_, i) => [1000 + i, 20, 30 + i, 30 + i, 5 + i, 5 + i]); // HP, SP, P.ATK, M.ATK, P.DEF, M.DEF at level i + 1
    const curve = [10000, 10400, 10800, 11200, 11600, 12025, 12450, 12875, 13300, 13800, 14300, 14800, 15300, 15850, 16400, 16950, 17500, 18125, 18750, 19375, 20000];
    const rules = { _iID: 1, curve, fight: [10000, 10000, 10000, 10000, 0], assist: [3000, 3000, 3000, 3000, 3000], fightScale: { 5: 10000 }, assistScale: { 5: 10000 }, notAdd: { fight: [115], assist: [115] }, maxLv: 99 };
    const tables = { PetDigest: { 30001: { _iID: 30001, g: 51 } }, PetGrowth: { 51: { _iID: 51, q: 5, camp: 1, lv: rows } }, PetRules: { 1: rules } };
    const petData = Object.assign(Object.create(data), { table: (n) => tables[n] ?? data.table(n) });
    const stats = (slot, kind = 'fight', i = 0, level = 99) => Object.fromEntries(petSlotStats(slot, kind, i, level, petData));
    const L60 = { id: 30001, star: 1, stage: 0, lv: 60 };
    assert.deepEqual(stats(L60), { 101: 1059, 102: 20, 103: 89, 104: 89, 105: 64, 106: 64 }, 'a deployed pet gives its own stats at its level');
    assert.deepEqual(stats({ ...L60, star: 6 }), { 101: 2118, 102: 40, 103: 178, 104: 178, 105: 128, 106: 128 }, '6 stars double them');
    assert.deepEqual(stats({ ...L60, star: 2, stage: 1 }), { 101: 1274, 102: 25, 103: 108, 104: 108, 105: 77, 106: 77 }, 'a rank step (x1.2025) is rounded up per attribute');
    assert.deepEqual(stats({ ...L60, star: 6, stage: 3 }), stats({ ...L60, star: 6 }), 'there is no stage at 6 stars');
    assert.deepEqual(stats({ g: 51, star: 1, stage: 0, lv: 60 }, 'assist'), { 101: 318, 102: 6, 103: 27, 104: 27, 105: 20, 106: 20 }, 'a support pet gives 30%, rounded up');
    assert.deepEqual(stats({ g: 51, star: 1, lv: 60 }, 'assist', 4), stats({ g: 51, star: 1, lv: 60 }, 'assist', 0), 'all 5 support slots share alike');
    assert.deepEqual(stats({ ...L60, lv: 99 }, 'fight', 0, 72), stats({ ...L60, lv: 72 }), 'a pet cannot be above the adventurer');
    assert.deepEqual(stats({ ...L60, lv: 500 }), stats({ ...L60, lv: 99 }), 'nor above level 99');
    for (const [what, slot, kind, i] of [['no level', { id: 30001, star: 3 }, 'fight', 0], ['level 0', { ...L60, lv: 0 }, 'fight', 0], ['an unknown pet', { ...L60, id: 1 }, 'fight', 0], ['an unknown group', { g: 12, star: 1, lv: 60 }, 'assist', 0], ['a fifth deployed slot', L60, 'fight', 4]]) {
      assert.deepEqual(petSlotStats(slot, kind, i, 99, petData), [], `${what} gives nothing`);
    }
    const lineup = [L60, { id: 30001, star: 6, stage: 0, lv: 60 }, null, { id: 0 }];
    const support = [{ g: 51, star: 1, lv: 60 }, null, { g: 51, star: 1, lv: 60 }];
    const all = Object.fromEntries(petStats(lineup, support, 99, petData));
    assert.deepEqual(all, { 101: 1059 + 2118 + 318 * 2, 102: 20 + 40 + 6 * 2, 103: 89 + 178 + 27 * 2, 104: 89 + 178 + 27 * 2, 105: 64 + 128 + 20 * 2, 106: 64 + 128 + 20 * 2 }, 'the slots add up');
    assert.deepEqual(petStats(undefined, undefined, 99, petData), [], 'no pets, no stats');
    // On the sheet they are flat stats like gear: the same as adding them by hand, and P.ATK rises with the percent bonuses on it
    const base = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023], [104, 3297]], passiveSkills: [1300110, 1300210] };
    const withPets = buildCharacterStats({ ...base, pets: lineup, assistPets: support }, petData);
    const byHand = buildCharacterStats({ ...base, equipmentAttrs: [...base.equipmentAttrs, ...petStats(lineup, support, 72, petData)] }, petData);
    const bare = buildCharacterStats(base, petData);
    for (const id of [101, 102, 103, 104, 105, 106, 111, 1031]) assert.equal(withPets[id], byHand[id], `attribute ${id}: pets = their stats added by hand`);
    assert.ok(withPets[103] >= bare[103] + 321 && withPets[104] >= bare[104] + 321 && withPets[101] >= bare[101] + 3813, 'pets add at least their flat attack and Max HP (the percent bonuses multiply them)');
  }

  // 23. Verify HP recover / SP Recovery: the flat value plus a share of Max HP / Max SP, rounded up. The numbers are a live Lv 74 Ranger's panel
  //     (STR 15, AGI 77, VIT 15, INT 15, DEX 192, LUK 76 with 176,497 HP and 11,463 SP): 519 + 3 x 15 + 0.15% of HP, and 150 + 0.2 x 15 + 1.5% of SP.
  {
    const cal = { career: 3400, level: 74, stats: [15, 77, 15, 15, 192, 76] };
    const typed = { ...cal, equipmentAttrs: [[101, solveAttributeBonus(cal, 101, 176497, data)], [102, solveAttributeBonus(cal, 102, 11463, data)]] };
    const [live, bare] = [buildCharacterStats(typed, data), buildCharacterStats(cal, data)];
    assert.deepEqual([live[101], live[102], live[107], live[108]], [176497, 11463, 829, 325], 'HP recover 829 and SP Recovery 325 at that Max HP and Max SP');
    assert.ok(bare[107] < 700 && bare[108] < 200, 'a character with little Max HP and Max SP recovers little: the share is a percentage of them');
  }

  // 24. Verify the off-hand grid of a two-handed weapon: the client lists the weapon in both weapon grids, so the off-hand grid's Refine / Enhance
  //     levels count with it (Max HP only, once), and only with a two-handed weapon
  {
    const rb = { career: 3400, level: 74, stats: [1, 1, 1, 1, 1, 1] };
    const catalog = Object.values(data.table('ItemConfig')).filter((i) => i._iType === 5 && i._iLevelNeed <= 70 && data.row('EquipConfig', i._iEquipId)?._iRank === 6);
    const [BOW, ONE_HANDED, SHIELD] = [2110660, catalog.find((i) => i._iEquipPart === 2)._iID, catalog.find((i) => i._iEquipPart === 3)._iID];
    assert.equal(data.row('ItemConfig', BOW)._iEquipPart, 1, 'the Rudra Bow is a two-handed weapon');
    const weapon = (id, extra = {}) => ({ grid: 1, id, refine: 15, enhance: 70, ...extra });
    const off = { offRefine: 18, offEnhance: 74 };
    const extra = (gear) => {
      const without = gearEffects(gear.map(({ offRefine, offEnhance, ...rest }) => rest), data).attrs;
      return gearEffects(gear, data).attrs.slice(without.length);
    };
    assert.deepEqual(extra([weapon(BOW, off)]), [[101, 5920], [101, 17150]], 'Enhance 74 and Refine +18 of the off-hand grid: Max HP and nothing else');
    assert.deepEqual(extra([weapon(BOW, { offRefine: 18 })]), [[101, 17150]], 'each level on its own');
    assert.deepEqual(extra([weapon(BOW)]), [], 'no levels, no stats');
    assert.deepEqual(extra([weapon(ONE_HANDED, off)]), [], 'a one-handed weapon leaves the off-hand grid to a shield');
    assert.deepEqual(extra([weapon(BOW, off), { grid: 2, id: SHIELD, refine: 3, enhance: 10 }]), [], 'an item in the off-hand grid brings its own levels, never both');
    const [bare, leveled] = [buildCharacterStats({ ...rb, gear: [weapon(BOW)] }, data), buildCharacterStats({ ...rb, gear: [weapon(BOW, off)] }, data)];
    assert.ok(leveled[101] >= bare[101] + 5920 + 17150, 'Max HP rises (the Max HP % multiplies it)');
    for (const id of [103, 104, 105, 106, 109, 110, 111, 115]) assert.equal(leveled[id], bare[id], `attribute ${id} does not move`);
  }

  // 25. Verify where a number comes from: the sources join one by one and their shares add up to the sheet. Case: the example Ranger (typed numbers
  //     standing for the gear of a screenshot) that is then given gear: its AGI is 1 point + the gear's entries + 5 from Vulture Eye + the typed 71
  {
    const typedAttrs = [[1, 14], [2, 71], [3, 14], [4, 14], [5, 88], [6, 29], [103, 3023], [104, 3297], [109, 84]];
    const gear = [
      { grid: 1, id: 2110660, roll: 5050, affixes: [2, 5], refine: 15, enhance: 70, offRefine: 18, offEnhance: 74 },
      { grid: 3, id: 2550660, roll: 5050, refine: 15, enhance: 70 },
      { grid: 6, id: 2700660, roll: 5050, affixes: [2], refine: 15, enhance: 70 },
    ];
    const build = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], gear, resonance: { refine: 15, enhance: 70 }, passiveSkills: [1300110, 1300210], equipmentAttrs: typedAttrs };
    const noLevels = ({ refine, enhance, offRefine, offEnhance, ...item }) => item;
    const steps = [['Items', { gear: gear.map(noLevels) }], ['Levels', { gear }], ['Resonance', { resonance: build.resonance }], ['Passives', { passiveSkills: build.passiveSkills }], ['Typed', { equipmentAttrs: typedAttrs }]];
    const sheets = sheetSteps(build, steps, data);
    const [full, noTyped] = [buildCharacterStats(build, data), buildCharacterStats({ ...build, equipmentAttrs: [] }, data)];
    assert.equal(sheets.length, steps.length + 1, 'the base and one sheet per source');
    for (const id of [1, 2, 3, 4, 5, 6, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 115, 209, 215, 1011, 1031]) {
      assert.equal(sheets.at(-1)[id], full[id], `the last sheet is the whole one (attribute ${id})`);
      assert.equal(sheets[steps.length - 1][id], noTyped[id], `the one before it is the build without its typed values (attribute ${id})`);
    }
    const share = (id) => Object.fromEntries(steps.map(([name], i) => [name, sheets[i + 1][id] - sheets[i][id]]));
    const entries = gearEffects(gear.map(noLevels), data).attrs.filter(([a]) => a === 2).reduce((sum, [, v]) => sum + v, 0);
    assert.ok(entries >= 16 + 8, 'the weapon and ring entries give AGI');
    assert.deepEqual(share(2), { Items: entries, Levels: 0, Resonance: 0, Passives: 5, Typed: 71 }, 'AGI: entries, no level or resonance AGI, Vulture Eye +5, typed +71');
    assert.equal(sheets[0][2], 1, 'and the point put into it');
    assert.ok(share(101).Levels >= 5920 + 17150, 'Max HP: the Refine / Enhance levels of the grids, the off-hand one with the two-hander');
    assert.ok(share(101).Resonance > 0 && share(103).Typed > 3023, 'resonance lifts Max HP; the typed P.ATK is multiplied by the percent bonuses');
  }

  // 26. Verify the Season Talent chain on a small digest: nodes open in order, trees by job rank / base level / total Talent Lv, a branch point
  //     takes a free pick (clusters by job and profession), and the effects reach the sheet and the buffs
  {
    const row = (name, extra = {}) => ({ jobs: [3400], profs: [], name, text: name, sim: 2, a: [], b: [], c: [], ...extra });
    const digest = {
      _iID: 1,
      trees: [
        { id: 1, name: 'I', need: 0, rank: 2, lv: 20, chain: [{ n: 101, ty: 1, max: 3, g: 11 }, { n: 102, ty: 1, max: 2, g: 12 }] },
        { id: 2, name: 'II', need: 5, rank: 3, lv: 30, chain: [{ n: 201, ty: 1, max: 2, g: 21 }, { n: 202, ty: 5, max: 1, g: 0 }, { n: 203, ty: 1, max: 2, g: 22 }] },
        { id: 3, name: 'III', need: 40, rank: 5, lv: 50, chain: [{ n: 301, ty: 1, max: 4, g: 11 }] },
      ],
      groups: { 11: { name: 'Fortitude', per: [[101, 100]], cost: [10, 100] }, 12: { name: 'Offense', per: [[103, 2], [104, 2]], cost: [10, 100] }, 21: { name: 'Life', per: [[1011, 60]], cost: [20, 100] }, 22: { name: 'Speed', per: [[114, 3]], cost: [20, 100] } },
      branches: { 202: [{ n: 501, kids: [511, 512] }, { n: 502, kids: [521] }] },
      jobs: { 501: [row('Cluster P', { b: [900] })], 502: [row('Cluster Q', { profs: [305], a: [[215, 100]] })], 511: [row('Kid 1', { a: [[6, 5]] })], 512: [row('Kid 2')], 521: [row('Kid 3', { c: [[13102, 5, 5, 5]] })] },
    };
    const tdata = Object.assign(Object.create(data), { table: (n) => (n === 'TalentDigest' ? { 1: digest } : data.table(n)) });
    const at = (talents, extra = {}) => ({ career: 3400, level: 72, stats: [1, 1, 1, 1, 1, 1], talents, ...extra });
    const spent = (w) => w.nodes.filter((n) => n.lv).map((n) => [n.n, n.lv]);
    const states = (w) => w.trees.map((t) => t.state);
    assert.deepEqual(talentEffects(at({ lv: 0 }), tdata).attrs, [], 'no levels, no talents');
    assert.deepEqual(talentEffects(at({ lv: 10 }), data).attrs, [], 'no digest (the raw config has none), no talents');
    const w4 = talentWalk(at({ lv: 4 }), tdata);
    assert.deepEqual(spent(w4), [[101, 3], [102, 1]], 'a node opens when the one before it is at its maximum');
    assert.deepEqual(states(w4), ['open', 'short', 'short'], 'tree II needs a total Talent Lv of 5');
    assert.deepEqual(w4.cost, { mats: 40, coin: 400 }, 'each level costs its Talent Remnants and Minted Coins');
    assert.deepEqual(states(talentWalk(at({ lv: 5 }), tdata)), ['open', 'open', 'short'], 'tree I done: tree II opens');
    const w10 = talentWalk(at({ lv: 10 }), tdata);
    assert.deepEqual(spent(w10), [[101, 3], [102, 2], [201, 2], [202, 1], [203, 1]]);
    assert.deepEqual(w10.reached, [202]);
    assert.equal(w10.total, 10, 'the Talent Lv counts the branch point and its pick, 1 each: 5 + 2 + 1 + 1 + 1');
    const w8 = talentWalk(at({ lv: 8 }), tdata);
    assert.deepEqual([spent(w8).at(-1), w8.reached, w8.total], [[202, 1], [], 8], 'a branch point with no level left for its pick gives no talent');
    assert.deepEqual(talentEffects(at({ lv: 8 }), tdata).buffs, []);
    const fx = talentEffects(at({ lv: 10 }), tdata);
    assert.deepEqual(Object.fromEntries(fx.attrs), { 101: 300, 103: 4, 104: 4, 1011: 120, 114: 3, 6: 5 }, 'stat nodes by level, then the first talent of the first cluster (LUK +5)');
    assert.deepEqual(fx.buffs, [900], 'and its buff for the simulation');
    // picks: a profession-bound cluster, a skill level condition, an invalid pick falls back to the first option
    const picks = { 202: [502, 521] };
    assert.deepEqual(talentOptions(202, 3400, 305, tdata).map((o) => o.id), [501, 502], 'profession 305 also has cluster Q');
    assert.deepEqual(talentOptions(202, 3400, 306, tdata).map((o) => o.id), [501], 'other professions do not');
    const q = (skills, prof) => Object.fromEntries(talentEffects(at({ lv: 10, picks, prof, skills }), tdata).attrs);
    assert.deepEqual(q({ 13102: 5 }, 305), { 101: 300, 103: 4, 104: 4, 1011: 120, 114: 3, 215: 100, 5: 5 }, 'Q (+1% damage) and its talent: DEX +5 at skill level 5');
    assert.equal(q({ 13102: 4 }, 305)[5], undefined, 'not at skill level 4');
    assert.deepEqual(talentPick({ picks, prof: 306 }, 202, 3400, tdata), [501, 511], 'a pick the profession cannot take falls back');
    assert.deepEqual(talentPick({ picks: { 202: [501, 999] }, prof: 305 }, 202, 3400, tdata), [501, 511], 'so does an unknown talent');
    // gating by job rank and base level
    assert.deepEqual(states(talentWalk(at({ lv: 99 }, { career: 3100 }), tdata)), ['open', 'locked', 'locked'], 'a 2nd-job Archer has tree I only');
    assert.deepEqual(states(talentWalk(at({ lv: 99 }, { level: 25 }), tdata)), ['open', 'locked', 'locked'], 'tree II opens at base Lv 30');
    assert.equal(talentMax(at({}), tdata), 11, 'tree III never opens here: its 40 Talent Lv are out of reach');
    // on the sheet: the same as adding the attributes by hand
    const plain = { career: 3400, level: 72, stats: [1, 1, 1, 1, 1, 1], passiveSkills: [1300110, 1300210] };
    const withTalents = buildCharacterStats({ ...plain, talents: { lv: 10 } }, tdata);
    const byHand = buildCharacterStats({ ...plain, equipmentAttrs: fx.attrs }, tdata);
    for (const id of [1, 2, 6, 101, 103, 104, 109, 111, 115]) assert.equal(withTalents[id], byHand[id], `attribute ${id}: talents = their attributes added by hand`);
    assert.ok(withTalents[101] > buildCharacterStats(plain, tdata)[101] + 300 && withTalents[115] === buildCharacterStats(plain, tdata)[115] + 3, 'Max HP rises (the Max HP % multiplies it), ASPD by 3');
    // a job talent that adds crit chance to one skill (SkillCriticalProb, type 10: Perfect Shot) lifts that skill's crit rate by its points
    const perfect = { _iID: 7, _kSkillAttributeList: [['0', '13204', '10', '1', '3500', '0']] };
    const strike = { _iSkillID: 13204, _iDmgType: 1, _iSkillCri: 10000 };
    const rate = (row) => calcCritRate({ cri: 2000 }, { resCri: 0 }, row);
    assert.equal(rate(strike), 0.2);
    assert.equal(rate(applySkillParameterRules(strike, [perfect], data)), 0.55, 'the skill gains 35 points of crit chance');
    assert.equal(rate(applySkillParameterRules({ ...strike, _iSkillID: 13203 }, [perfect], data)), 0.2, 'other skills do not');
    assert.equal(rate(applySkillParameterRules({ ...strike, _iDmgType: 2 }, [{ ...perfect, _kSkillAttributeList: [['0', '13204', '10', '1', '9000', '0']] }], data)), 0, 'magic never crits');
  }

  // 27. Verify the ASPD cap: past 500% every point turns into 0.1% P.ATK (up to 20%), and the cast stops getting faster
  {
    const rb = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53] };
    const base = buildCharacterStats(rb, data);
    const aspd = (to) => buildCharacterStats({ ...rb, equipmentAttrs: [[114, to - base[115]]] }, data);
    assert.equal(aspd(480)[115], 480);
    assert.equal(aspd(480)[1031], base[1031], 'below the cap nothing converts');
    assert.equal(aspd(500)[1031], base[1031], 'and not at it');
    assert.equal(aspd(530)[1031], base[1031] + 300, '30 over the cap: +3% P.ATK');
    assert.equal(aspd(900)[1031], base[1031] + 2000, 'at most +20%');
    assert.ok(aspd(530)[103] > aspd(500)[103], 'the P.ATK it adds is in the sheet');
    const row = { _iActionTime: 1000, _iActionTimeInfluence: 100 };
    assert.equal(calcSkillTimingMs(aspd(900), row).actionMs, calcSkillTimingMs(aspd(500), row).actionMs, 'the cast speed stops at 500%');
    assert.ok(calcSkillTimingMs(aspd(480), row).actionMs > calcSkillTimingMs(aspd(500), row).actionMs);
  }

  // 28. Verify the Season Ranger skills, the Cycle order and DEF: Gale Beat sends the enhanced cast as every 5th Focused Arrow Strike, Celestial Symphony turns
  // Myriad Stars into 10 hits of 200% and a closing 150% one, the cycle takes the skill after the last cast, and DEF reads the attacker's level
  {
    const rb = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023]], skillLevels: { 113360: 1, 113361: 1, 113362: 1, 113363: 1 }, cancelBackswing: true };
    const post = { level: 100, def: 0, mdef: 0, flee: 1, hit: 1, element: 1, resCri: 0 };
    const trace = [];
    const FAS = [1330525, 11330205]; // Rhythmic Arrow's mode 2, and Gale Beat's enhanced skill
    const run = simulateRotation({ ...rb, rotationCycle: true }, post, [1330505, 1320410, 1332005], 60000, data, trace);
    const ids = run.castLog.filter((c) => c.kind === 'cast').map((c) => c.id);
    const fas = ids.filter((id) => FAS.includes(id));
    assert.ok(fas.length >= 20 && fas.every((id, i) => (id === 11330205) === (i % 5 === 4)), 'four Focused Arrow Strikes, then the enhanced one');
    const circle = ids.filter((id) => FAS.includes(id) || id === 1320410).map((id) => id === 1320410);
    assert.ok(circle.length > 20 && circle.every((sharp, i) => sharp === (i % 2 === 1)), 'Cycle: Focused Arrow Strike, Sharp Shooting, and round again');
    const priority = simulateRotation(rb, post, [1330505, 1320410, 1332005], 60000, data).castLog.filter((c) => c.id === 1320410).length;
    assert.equal(priority, 0, 'Priority: the no-cooldown Focused Arrow Strike starves Sharp Shooting');
    const myriad = trace.filter((e) => e.ev.skillId === 1332015);
    assert.ok(myriad.length >= 11 && myriad.length % 11 === 0, 'Myriad Stars is cast in mode 1: 11 hits a cast');
    assert.deepEqual(myriad.slice(0, 11).map((e) => e.ev.p1), [...Array(10).fill(20000), 15000]);
    assert.equal(run.castLog.find((c) => c.id === 1332015).hits.length, 11);
    const rhapsodyRow = data.row('SkillConfig', 1330545);
    const rhapsody = evaluateSkillDamage(rb, post, rhapsodyRow, {}, data);
    assert.equal(rhapsody.hitsPerCast, 2, 'Unlimited Shooting with Infinite Rhapsody has two damage packets, not two casts');
    assert.equal(rhapsody.expectedPerCast, [0, 1].reduce((sum, branch) =>
      sum + evaluateSkillDamage(rb, post, rhapsodyRow, { branch }, data).expectedPerAttempt, 0), 'per-cast figures include the extra 15% packet');
    const celestialRow = data.row('SkillConfig', 1332015);
    const celestial = evaluateSkillDamage(rb, post, celestialRow, {}, data);
    assert.equal(celestial.hitsPerCast, 11, 'per-cast figures use the active mode rather than the base seven-hit model');
    const celestialExpected = 10 * evaluateSkillDamage(rb, post, celestialRow, { branch: 0 }, data).expectedPerAttempt
      + evaluateSkillDamage(rb, post, celestialRow, { branch: 1 }, data).expectedPerAttempt;
    assert.ok(Math.abs(celestial.expectedPerCast - celestialExpected) < 1e-8);
    // Without the Season skills it is the tree's own rows again.
    const plainIds = simulateRotation({ ...rb, skillLevels: {} }, post, [1332005, 1330505], 30000, data).castLog.map((c) => c.id);
    assert.ok(plainIds.includes(1332005) && plainIds.includes(1330505) && !plainIds.includes(1332015) && !plainIds.includes(11330205));
    // DEF: 1980 / (1980 + 20 x the attacker's Lv 75) = 0.431 on the Lv 99 dummy, whatever the dummy's own level.
    const dummy = { level: 99, def: 1980, mdef: 1980, flee: 1, hit: 1, element: 1, resCri: 0 };
    const mit = (b, d) => evaluateSkillDamage(b, d, data.row('SkillConfig', 1330505), {}, data).defMitigation;
    assert.ok(Math.abs(mit({ ...rb, level: 75 }, dummy) - (1 - 1980 / (1980 + 1500))) < 1e-9);
    assert.equal(mit({ ...rb, level: 75 }, { ...dummy, level: 50 }), mit({ ...rb, level: 75 }, dummy));
  }

  // 29. Verify solveBonuses: the hidden bonuses make the sheet show exactly the wanted numbers (through the percent groups and the stats built from stats), and with
  // more sources in the build (the always-on buffs here) they shrink while the numbers hold: what a typed panel needs once its sources are in the sheet
  {
    const rb = { career: 3400, level: 75, stats: [1, 1, 1, 1, 99, 51] };
    const want = { 1: 15, 2: 79, 5: 191, 6: 80, 101: 180421, 103: 4758, 109: 318, 111: 2298, 115: 488, 209: 1375, 1031: 3820 };
    const shows = (b) => { const bonus = solveBonuses(b, want, data); return { bonus, sheet: buildCharacterStats({ ...b, equipmentAttrs: [...bonus] }, data) }; };
    const bare = shows(rb);
    for (const [a, v] of Object.entries(want)) assert.equal(bare.sheet[a], v, `attribute ${a} shows ${v}`);
    assert.ok(!bare.bonus.has(1031), 'P.ATK % 38.2% is DEX 191 x 0.2%: typing DEX already shows it, nothing is hidden on it');
    const buffed = shows({ ...rb, activeBuffs: [1300210, 1310304, 1320210, 1330105].map((id) => ({ id })) });
    for (const [a, v] of Object.entries(want)) assert.equal(buffed.sheet[a], v, `attribute ${a} shows ${v} with the buffs`);
    assert.ok([1, 2, 5, 6].every((a) => buffed.bonus.get(a) < bare.bonus.get(a)), 'the buffs give base stats, so less of them is hidden');
    const kept = solveBonuses({ ...rb, equipmentAttrs: [[104, 777], [5, 50]] }, want, data);
    assert.equal(kept.get(104), 777, 'a bonus of an attribute that is not wanted stays');
    assert.equal(kept.get(5), bare.bonus.get(5), 'a wanted one is solved again, whatever it was');
  }

  return true;
}

function printOptimizationReport(options = {}) {
  const data = new Ro3DataStore(options.dataDir || DEFAULT_CONFIG_DIR);
  const classKey = (options.class || 'swordman').toLowerCase();
  const level = Number(options.level || 50);
  const targetKey = (options.target || 'baphomet').toLowerCase();
  const windowSec = Number(options.window || 20);
  const defender = FALLBACK_TABLES.Monsters[targetKey] ?? FALLBACK_TABLES.Monsters.baphomet;

  const classProfiles = CLASS_PROFILES;

  const profile = classProfiles[classKey] ?? classProfiles.swordman;
  const baseBuild = { ...profile, level };

  // Find the rotation + stat allocation pair that maximizes sustained DPS
  let sustainedOpt = null;
  for (const candRot of profile.candidateRotations) {
    const opt = optimizeStatAllocation(baseBuild, defender, {
      mode: 'sustained',
      rotation: candRot.skills.length > 0 ? candRot.skills : [data.row('JobConfig', profile.career)?._kSkillNormalID?.[0] ?? 1100001],
      windowMs: windowSec * 1000,
    }, data);
    if (!sustainedOpt || opt.optimalScore > sustainedOpt.optimalScore) {
      sustainedOpt = opt;
    }
  }

  const firstDamagingSkillId =
    profile.candidateRotations
      .flatMap((r) => r.skills)
      .find((sid) => {
        const r = data.row('SkillConfig', sid);
        return r && Array.isArray(r._kDamageParam1) && r._kDamageParam1.length > 0;
      }) ?? 1100110;

  const burstOpt = optimizeStatAllocation(baseBuild, defender, {
    mode: 'burst',
    rotation: [firstDamagingSkillId],
  }, data);

  const buildAtOptimalStats = { ...baseBuild, stats: sustainedOpt.optimalStats.raw };
  const { rotationResults, bestRotation, affixWeights } = optimizeRotationAndAffixes(
    buildAtOptimalStats,
    defender,
    profile.candidateRotations,
    data
  );

  const bestDamagingSkillId =
    bestRotation.skills.find((sid) => {
      const r = data.row('SkillConfig', sid);
      return r && Array.isArray(r._kDamageParam1) && r._kDamageParam1.length > 0;
    }) ?? firstDamagingSkillId;

  const primarySkillEval = evaluateSkillDamage(
    buildAtOptimalStats,
    defender,
    data.row('SkillConfig', bestDamagingSkillId),
    {},
    data
  );

  if (options.json) {
    console.log(JSON.stringify({ profile: profile.name, level, defender, sustainedOpt, burstOpt, rotationResults, affixWeights }, null, 2));
    return;
  }

  const st = sustainedOpt.statSheet;
  const os = sustainedOpt.optimalStats;
  const bs = burstOpt.optimalStats;
  console.log('================================================================================');
  console.log(`RO3 DAMAGE PIPELINE & BUILD OPTIMIZER (${data.usingExportedJson ? 'Exported JSON Config' : 'Built-in Client Config Profile'})`);
  console.log('================================================================================');
  console.log(`Class Build : ${profile.name} (Base Lv.${level}, Career ${profile.career})`);
  console.log(`Target      : ${defender.name} (Lv.${defender.level}, HP ${defender.maxHp.toLocaleString()}, DEF ${defender.def}, MDEF ${defender.mdef}, FLEE ${defender.flee}, Ele ${defender.element})`);
  console.log(`Stat Budget : ${sustainedOpt.budget} pts (Used: ${sustainedOpt.usedPoints}, Remaining: ${sustainedOpt.unspentPoints})`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`Optimal Sustained-DPS Stat Allocation : STR ${os.STR} | AGI ${os.AGI} | VIT ${os.VIT} | INT ${os.INT} | DEX ${os.DEX} | LUK ${os.LUK}`);
  console.log(`Optimal Single-Hit Burst Allocation   : STR ${bs.STR} | AGI ${bs.AGI} | VIT ${bs.VIT} | INT ${bs.INT} | DEX ${bs.DEX} | LUK ${bs.LUK}`);
  console.log(`Final Combat Sheet (Sustained Build)  : P.ATK ${st[103]} (Base ${st.base[103]}, +${(st[1031] / 100).toFixed(1)}%) | M.ATK ${st[104]} (Base ${st.base[104]}, +${(st[1041] / 100).toFixed(1)}%)`);
  console.log(`                                        HIT ${st[109]} | FLEE ${st[110]} | CRIT ${(st[111] / 100).toFixed(2)}% | ASPD ${(st[115] / 100).toFixed(2)}x | MaxHP ${st[101]}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`Primary Skill Single-Hit Breakdown    : ${primarySkillEval.skillName} (Ratio ${(primarySkillEval.p1 / 100).toFixed(0)}% + ${primarySkillEval.p2})`);
  console.log(`  Defense Mitigation : ${(primarySkillEval.defMitigation * 100).toFixed(2)}% | Element Mod: ${(primarySkillEval.eleMod * 100).toFixed(0)}% | Hit Rate: ${(primarySkillEval.hitRate * 100).toFixed(2)}% | Crit Rate: ${(primarySkillEval.critRate * 100).toFixed(2)}%`);
  console.log(`  Normal Hit Range   : [${primarySkillEval.normalHitMin}, ${primarySkillEval.normalHitMax}] (Mean ${primarySkillEval.normalHitMean}) | Crit Hit Mean: ${primarySkillEval.critHitMean} | Expected/Cast: ${primarySkillEval.expectedPerAttempt.toFixed(1)}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`Skill Rotation Comparison (${windowSec}s Combat Window):`);
  for (const r of rotationResults) {
    console.log(
      `  * ${r.name.padEnd(48)} | Sustained: ${r.sustainedDps.toFixed(1).padStart(7)} DPS | 5s Burst: ${r.burst5sDps.toFixed(1).padStart(7)} DPS | Casts:${String(r.casts).padStart(3)} Auto:${String(r.autoSwings).padStart(3)} DoT:${String(r.groundTicks).padStart(3)}`
    );
  }
  console.log('--------------------------------------------------------------------------------');
  console.log('Marginal Equipment Affix / Stat Weights (at Optimal Build):');
  for (const w of affixWeights.slice(0, 8)) {
    console.log(
      `  * ${w.label.padEnd(34)} : +${w.deltaDps.toFixed(2).padStart(6)} DPS (+${w.pctGain.toFixed(2).padStart(5)}%) | +${w.dpsPer100Power.toFixed(2).padStart(6)} DPS / 100 Rating`
    );
  }
  console.log('================================================================================');
}

// CLI Entrypoint
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--self-test') opts.selfTest = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--class' && args[i + 1]) opts.class = args[++i];
    else if (a === '--level' && args[i + 1]) opts.level = args[++i];
    else if (a === '--target' && args[i + 1]) opts.target = args[++i];
    else if (a === '--window' && args[i + 1]) opts.window = args[++i];
    else if (a === '--data-dir' && args[i + 1]) opts.dataDir = args[++i];
  }

  if (opts.selfTest) {
    runSelfTest(new Ro3DataStore(opts.dataDir || DEFAULT_CONFIG_DIR));
    console.log('[PASS] All RO3 damage pipeline & stat optimizer self-tests passed.');
  }
  printOptimizationReport(opts);
}
