#!/usr/bin/env node
// RO3 Exact Drop, Card, Pet Hatching & Lottery Rate Inspector
// Implements the exact server math from ro3emu-server (RewardService, PetService, LotteryService)
// against the exported client config tables (RO3_CONFIG_DIR, default ..\ro3emu-server\data\config).

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const CONFIG_DIR = process.env.RO3_CONFIG_DIR ?? path.join(import.meta.dirname, '..', 'ro3emu-server', 'data', 'config');

function loadTable(name) {
  const p = path.join(CONFIG_DIR, `${name}.json`);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const loc = loadTable('Localization_en');
const items = loadTable('ItemConfig');
const npcs = loadTable('NPCConfig');
const npcDrops = loadTable('NPCDropConfig');
const npcNormalDrops = loadTable('NpcNormalDropConfig');
const multiverseGroups = loadTable('MultiverseGroupConfig');
const dropPools = loadTable('DropPoolConfig');
const dropGroups = loadTable('DropGroupConfig');
const awards = loadTable('AwardConfig');
const draws = loadTable('DrawConfig');
const drawPools = loadTable('DrawPoolConfig');
const petSlots = loadTable('PetIncubationSlotConfig');
const petRooms = loadTable('PetIncubationRoomConfig');
const petBase = loadTable('PetBaseConfig');
const petStar = loadTable('PetStarConfig');
const newActivities = loadTable('NewActivityConfig');
const timeLimits = loadTable('TimeLimitConfig');

function text(key) {
  if (Array.isArray(key)) key = key[0];
  if (key === undefined || key === null || key === '' || typeof key === 'object') return '';
  const entry = loc[String(key)];
  if (!entry) return String(key);
  if (typeof entry === 'string') return entry;
  return entry._kDes || entry._sContent || entry._sText || entry._sName || String(key);
}

function itemName(id) {
  const row = items[String(id)];
  if (!row) return `Item#${id}`;
  return text(row._iName) || text(row._kName) || text(row._sName) || `Item#${id}`;
}

function isCard(id) {
  const row = items[String(id)];
  return Boolean(row && row._iType === 4 && row._iSubType === 400);
}

// Index DropGroupConfig rows by groupId (in exported DropGroupConfig.json, top-level keys are groupIds -> array of rows, or flat rows)
const groupsById = new Map();
for (const [key, val] of Object.entries(dropGroups)) {
  if (Array.isArray(val)) {
    groupsById.set(Number(key), val);
  } else if (val && typeof val === 'object') {
    const gid = Number(val._iGroupId || key || 0);
    if (!gid) continue;
    if (!groupsById.has(gid)) groupsById.set(gid, []);
    groupsById.get(gid).push(val);
  }
}

function flatNumbers(val) {
  if (typeof val === 'number') return [val];
  if (Array.isArray(val)) return val.flatMap(flatNumbers);
  if (val && typeof val === 'object') return Object.values(val).flatMap(flatNumbers);
  return [];
}

// Index DrawPoolConfig rows by _iGroupID (LotteryService.cs / PetService.Incubation.cs)
const drawPoolsByGroup = new Map();
for (const row of Object.values(drawPools)) {
  const gid = Number(row._iGroupID || 0);
  if (!gid) continue;
  if (!drawPoolsByGroup.has(gid)) drawPoolsByGroup.set(gid, []);
  drawPoolsByGroup.get(gid).push(row);
}

/**
 * RewardService.RollPool math:
 * Each _iDropGroup_1..25 is [groupId, chancePerMillion, rolls, picks].
 * P(trigger on 1 roll) = chancePerMillion / 1,000,000.
 * Within groupId, eligible rows (weight > 0, questLimit == 0, activityId == 0) are chosen by _iWeights / sum(_iWeights).
 */
export function computePoolRates(poolId) {
  const pool = dropPools[String(poolId)];
  if (!pool) return [];
  const results = [];
  for (let i = 1; i <= 25; i++) {
    const tuple = pool[`_iDropGroup_${i}`];
    if (!Array.isArray(tuple) || tuple.length < 2) continue;
    const [groupId, chancePerMillion, rawRolls = 1, rawPicks = 1] = tuple.map(Number);
    if (!groupId || !chancePerMillion) continue;
    const rolls = Math.max(1, rawRolls || 1);
    const picks = Math.max(1, rawPicks || 1);
    const pSingleRoll = Math.min(1, Math.max(0, chancePerMillion / 1_000_000));
    const pAtLeastOnce = 1 - Math.pow(1 - pSingleRoll, rolls);
    const rows = (groupsById.get(groupId) || []).filter(
      r => Number(r._iWeights) > 0 && !Number(r._iQuestLimit) && !Number(r._iActivityid)
    );
    const totalWeight = rows.reduce((acc, r) => acc + Number(r._iWeights), 0);
    if (totalWeight <= 0) continue;

    for (const r of rows) {
      const itemId = Number(r._kDropItem || r._iItemId);
      const w = Number(r._iWeights);
      const condProb = w / totalWeight;
      // Probability item is picked in at least one roll/pick
      const pPerRollPick = pSingleRoll * (1 - Math.pow(1 - condProb, picks));
      const pEffective = 1 - Math.pow(1 - pPerRollPick, rolls);
      results.push({
        poolId: Number(poolId),
        slot: i,
        groupId,
        itemId,
        itemName: itemName(itemId),
        isCard: isCard(itemId),
        chancePerMillion,
        rolls,
        picks,
        weight: w,
        totalWeight,
        condProb,
        effectiveProb: pEffective,
        minCount: Number(r._iMinNumber || 1),
        maxCount: Number(r._iMaxNumber || 1),
        minLv: Number(r._iMinLevelLimit || 0),
        maxLv: Number(r._iMaxLevelLimit || 999),
      });
    }
  }
  return results;
}

function resolveMultiverse(id) {
  const mg = multiverseGroups[String(id)];
  return mg ? Number(mg._iValue_default || 0) : 0;
}

export function resolveMonsterPools(npcRow, env = '0') {
  const poolIds = [];
  // 1. _iDrop -> MultiverseGroupConfig._iValue_default -> NPCDropConfig[env] -> _iDropPool1..10
  const dropId = resolveMultiverse(npcRow._iDrop);
  if (dropId > 0 && npcDrops[String(dropId)]) {
    const dropCfg = npcDrops[String(dropId)];
    const envRow = dropCfg && (dropCfg[env] || dropCfg['0'] || dropCfg);
    if (envRow) {
      for (const [k, v] of Object.entries(envRow)) {
        if (k.startsWith('_iDropPool') && Number(v) > 0) {
          poolIds.push({ type: `NPCDrop(env=${env}).${k}`, poolId: Number(v) });
        }
      }
    }
  }
  // 2. _iNormalDrop -> MultiverseGroupConfig._iValue_default -> NpcNormalDropConfig -> _iDropPool*
  for (const rawNd of flatNumbers(npcRow._iNormalDrop)) {
    const ndId = resolveMultiverse(rawNd) || rawNd;
    const nd = npcNormalDrops[String(ndId)];
    if (!nd) continue;
    for (const [k, v] of Object.entries(nd)) {
      if (k.startsWith('_iDropPool') && Number(v) > 0) {
        poolIds.push({ type: `NormalDrop(id=${ndId},map=${JSON.stringify(nd._iMapId || 'any')}).${k}`, poolId: Number(v) });
      }
    }
  }
  return poolIds;
}

export function computePetIncubationRates() {
  const report = [];
  for (const [slotId, slot] of Object.entries(petSlots)) {
    const drawIds = flatNumbers(slot._kDrawIds);
    drawIds.forEach((drawId, idx) => {
      const draw = draws[String(drawId)];
      if (!draw) return;
      const groups = flatNumbers(draw._kSubBanner);
      const rows = groups.flatMap(gid => drawPoolsByGroup.get(Number(gid)) || []).filter(r => Number(r._iWeight) > 0);
      const totalWeight = rows.reduce((s, r) => s + Number(r._iWeight), 0);
      const outcomes = [];
      for (const r of rows) {
        const w = Number(r._iWeight);
        const tuples = (Array.isArray(r._kItem) ? r._kItem : []).filter(t => Array.isArray(t) && t.length >= 2);
        for (const t of tuples) {
          const [type, id, count = 1] = t.map(Number);
          const p = (w / totalWeight) * (1 / tuples.length);
          const pb = petBase[String(id)];
          const name = pb ? (text(pb._kName) || text(pb._iName) || `Pet#${id}`) : itemName(id);
          outcomes.push({
            poolRowId: r._iID,
            type,
            id,
            name,
            count,
            rowWeight: w,
            totalWeight,
            tuplesInRow: tuples.length,
            probability: p,
          });
        }
      }
      report.push({
        slotId: Number(slotId),
        roomLevelIndex: idx,
        drawId: Number(drawId),
        totalWeight,
        outcomes,
      });
    });
  }
  return report;
}

function petOrItemName(tuple) {
  const [kind, id, count = 1] = tuple.map(Number);
  if (kind === 1) {
    const pb = petBase[String(id)];
    return `${pb ? (text(pb._kName) || text(pb._iName) || `Pet#${id}`) : `Pet#${id}`} (Pet) x${count}`;
  }
  return `${itemName(id)} x${count}`;
}

export function computeLotteryPools() {
  const banners = [];
  for (const [id, draw] of Object.entries(draws)) {
    const groups = flatNumbers(draw._kSubBanner);
    const guaranteedGroups = new Set(flatNumbers(draw._kGuaranteedBanner));
    const rows = groups.flatMap(gid => drawPoolsByGroup.get(Number(gid)) || []).filter(r => Number(r._iWeight) > 0);
    if (rows.length === 0) continue;
    const totalWeight = rows.reduce((s, r) => s + Number(r._iWeight), 0);
    const guaranteedWeight = rows.filter(r => guaranteedGroups.has(Number(r._iGroupID))).reduce((s, r) => s + Number(r._iWeight), 0);
    const actId = Number(draw._iNewAct || 0);
    const act = actId ? newActivities[String(actId)] : null;
    const timeId = act ? Number(act._iTimeid || 0) : 0;
    const tl = timeId ? timeLimits[String(timeId)] : null;
    const guaranteedCnt = Number(draw._iGuaranteedCnt || 0);
    const pityType = Number(draw._iType || 0);

    const tiers = rows.map(r => {
      const w = Number(r._iWeight);
      const gid = Number(r._iGroupID);
      const inPityPool = guaranteedGroups.has(gid);
      const tuples = (Array.isArray(r._kItem) ? r._kItem : []).filter(t => Array.isArray(t) && t.length >= 2);
      return {
        poolRowId: Number(r._iID),
        groupId: gid,
        inPityPool,
        pityShare: inPityPool && guaranteedWeight > 0 ? w / guaranteedWeight : 0,
        weight: w,
        rowShare: w / totalWeight,
        tupleCount: tuples.length,
        perItemProb: tuples.length > 0 ? (w / totalWeight) / tuples.length : 0,
        sampleItems: tuples.slice(0, 4).map(petOrItemName),
      };
    });

    banners.push({
      drawId: Number(id),
      name: text(draw._kName) || text(draw._iName) || `Draw#${id}`,
      pityType,
      guaranteedCnt,
      guaranteedGroups: [...guaranteedGroups],
      functionId: Number(draw._iFunctionID || 0),
      activityId: actId,
      timeLimitId: timeId,
      timeWindow: tl ? { type: tl._iTimeType, start: tl._kOpenTime, end: tl._kCloseTime } : null,
      maxCnt: draw._kMaxCnt,
      rollItem: draw._kRollItem,
      totalWeight,
      tiers,
    });
  }
  return banners;
}

function pct(p) {
  return `${(p * 100).toFixed(4)}%`;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('ro3-rates-inspector.mjs')) {
  const args = process.argv.slice(2);
  // Self-test assertions
  assert(Object.keys(items).length > 1000, 'ItemConfig must be loaded');
  assert(Object.keys(dropPools).length > 100, 'DropPoolConfig must be loaded');

  const petReport = computePetIncubationRates();
  const lotteryReport = computeLotteryPools();

  // Scan all monsters for card drops
  const cardDrops = [];
  for (const npc of Object.values(npcs)) {
    const pools = resolveMonsterPools(npc, '0');
    for (const p of pools) {
      for (const entry of computePoolRates(p.poolId)) {
        if (entry.isCard) {
          cardDrops.push({
            npcId: npc._iID,
            npcName: text(npc._kName) || text(npc._iName) || text(npc._sName) || `NPC#${npc._iID}`,
            level: npc._iLevel,
            poolSource: p.type,
            ...entry,
          });
        }
      }
    }
  }

  assert(cardDrops.length > 0, 'Must resolve monster card drops');
  assert(petReport.length > 0, 'Must resolve pet incubation rates');
  assert(lotteryReport.length > 0, 'Must resolve lottery/gacha pools');

  console.log('=== 1. MONSTER CARD DROP RATES (Sample from', cardDrops.length, 'resolved monster->card entries) ===');
  for (const c of cardDrops.slice(0, 12)) {
    console.log(
      `  [${c.npcId}] ${c.npcName} (Lv.${c.level}) -> ${c.itemName} [${c.itemId}]: ` +
      `${pct(c.effectiveProb)} (pool ${c.poolId} slot ${c.slot}: ${c.chancePerMillion}/1M x${c.rolls}r, group ${c.groupId} weight ${c.weight}/${c.totalWeight}, lv ${c.minLv}-${c.maxLv})`
    );
  }

  console.log('\n=== 2. PET EGG INCUBATION RATES (Slot 10001 by Room Level) ===');
  for (const r of petReport.filter(x => x.slotId === 10001)) {
    console.log(`  Slot ${r.slotId} RoomIdx ${r.roomLevelIndex} (Draw ${r.drawId}, TotalWeight=${r.totalWeight}):`);
    for (const o of r.outcomes) {
      console.log(`    -> [${o.id}] ${o.name} x${o.count}: ${pct(o.probability)} (rowWeight ${o.rowWeight}/${o.totalWeight}, 1/${o.tuplesInRow} in row)`);
    }
  }

  console.log('\n=== 3. LOTTERY / GACHA & LIMITED POOL ROTATIONS ===');
  for (const b of lotteryReport.filter(x => [101, 200, 201].includes(x.drawId))) {
    const w = b.timeWindow ? `TimeLimit#${b.timeLimitId} (type=${b.timeWindow.type}, open=${JSON.stringify(b.timeWindow.start)}, close=${JSON.stringify(b.timeWindow.end)})` : 'always/function-gated';
    const pityDesc = b.guaranteedCnt > 0 ? `Hard Pity @ ${b.guaranteedCnt} draws (pityType=${b.pityType}, guaranteedSubBanners=${JSON.stringify(b.guaranteedGroups)})` : 'no pity';
    console.log(`  Draw ${b.drawId} "${b.name}" | Func=${b.functionId} Act=${b.activityId} | MaxCnt=${JSON.stringify(b.maxCnt)} | ${pityDesc} | Window=${w}`);
    for (const t of b.tiers) {
      const pTag = t.inPityPool ? ` [IN PITY POOL: ${pct(t.pityShare)} on pity roll]` : '';
      console.log(
        `    Row ${t.poolRowId} (grp ${t.groupId}): RowShare=${pct(t.rowShare)} (${t.weight}/${b.totalWeight}), ` +
        `PerTuple=${pct(t.perItemProb)} (${t.tupleCount} items)${pTag} | e.g. ${t.sampleItems.slice(0, 3).join(', ')}`
      );
    }
  }
}
