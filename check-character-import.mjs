// Runs the real page's import/state logic without a browser or third-party packages.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, 'ro3-damage-sim.html'), 'utf8');
const packed = /<script type="text\/plain" id="ro3-data">([^<]+)<\/script>/.exec(html)?.[1];
assert.ok(packed, 'generated page data is missing: run build-ro3-sim.mjs');
const captureData = JSON.parse(zlib.gunzipSync(Buffer.from(packed, 'base64')).toString('utf8'));
let code = /<script type="module">([\s\S]*?)<\/script>/.exec(html)?.[1];
assert.ok(code?.includes('/* ---------- boot ---------- */'));
code = code.slice(0, code.indexOf('/* ---------- boot ---------- */'))
  .replace(/^export /gm, '')
  .replace("const D = await unpack($('#ro3-data').textContent);", 'const D = captureData;');
assert.ok(!code.includes('const D = await'));
const elements = new Map();
const api = vm.runInNewContext(`${code}\n;({ mapExport, currentBuild, finalsOf, loadState, activePets, activeAssist, setFinal,
  defaultState, rotationIds, applyRotation, simBuild, simulateRotation, simulateDistribution, analyze, renderRotation, skillTile, petEffects, Ro3MemoryDataStore,
  defender, data, setPath, renderTarget, targetBonus, vsTarget, evaluateSkillDamage, cardEffects, cardBrief, cardTip,
  ELEMENTS, RACES, SIZES,
  setState: (st) => { S = st; },
  panelFields: [...FIN, ...EXT], attrConfig: D.tables.AttributeConfig })`, {
  captureData, structuredClone,
  addEventListener() {},
  document: { querySelector: (selector) => { if (!elements.has(selector)) elements.set(selector, {}); return elements.get(selector); }, querySelectorAll: () => [] },
  localStorage: { getItem: () => null },
  console,
});
const source = JSON.parse(fs.readFileSync(path.join(here, 'ro3-character.sample.json'), 'utf8'));
const a = source.assets;
a.PlayerBasicInfo = { career: 3400, level: 75, jobLevel: 40 };
a.PetInfo = { m_kPetList: {
  10001: { m_iPetId: 10001, m_iLevel: 60, m_iStar: 1, m_iStarProgress: 0, m_bIsActiveCollect: true },
  30001: { m_iPetId: 30001, m_iLevel: 50, m_iStar: 2, m_iStarProgress: 1, m_bIsActiveCollect: false },
} };
a.PetSetUpInfo = { currentPlan: 1, setupPlans: {
  0: { setUpPets: { 1: 30001 }, supportPets: {} },
  1: { setUpPets: { 1: 10001 }, supportPets: { 1: 30001 } },
} };
a.SoulEchoes = { currentPlan: 1, items: {
  active: { iItemId: 1850101, kEmblemInfo: {
    kAttrList: { 1: { iId: 103, iValue: 1000 } },
    kSubAttrList: { 1: { iId: 101, iRealId: 57, iValue: 3000 } },
  } },
  inactive: { iItemId: 1850101, kEmblemInfo: { kAttrList: { 1: { iId: 101, iValue: 999999 } } } },
}, plans: { 0: { slots: { 1: 'inactive' } }, 1: { slots: { 1: 'active' } } } };
a.DivineTotems = { currentPlan: 0, items: {
  active: { kTotemInfo: { kAttrList: { 1: { iId: 103, iValue: 200 } }, kSkillList: {} } },
  inactive: { kTotemInfo: { kAttrList: { 1: { iId: 101, iValue: 999999 } }, kSkillList: {} } },
}, plans: { 0: { slots: { 1: 'active' } }, 1: { slots: { 1: 'inactive' } } } };
a.TotemExp = { kLevel: 1, kTotalExp: 25 };
a.RoleAllProperty = { BasicAttributeInfo: { 101: 200000, 103: 5000, 115: 5 } };
source.truncated = 0;
source.missing = source.errors = [];
const plain = (x) => JSON.parse(JSON.stringify(x));
const mapped = api.mapExport(source, false);
assert.ok(mapped.st);
const build = api.currentBuild(mapped.st);
assert.deepEqual(plain(build.emblemAttrs), [[103, 1000], [101, 3000]], 'only the selected Echo plan contributes');
assert.equal(build.totems.length, 1);
assert.deepEqual(plain(build.totems[0].attrs), [[103, 200]], 'inactive Totems do not contribute');
assert.equal(build.totems[0].enhanceBp, 500, 'the captured Totem system level selects the enhancement row');
assert.equal(api.activePets(mapped.st)[0].id, 10001, 'use the active pet plan, not the first plan');
assert.equal(api.activeAssist(mapped.st)[0].star, 2);
assert.equal(api.activeAssist(mapped.st)[0].stage, 1);
assert.ok(build.extraAttrs.some(([id, value]) => id === 103 && value === 5), 'activated pet collection stats are included');
const held = api.mapExport(source, true);
assert.equal(api.finalsOf(held.st)[101], 200000, 'Echo/Totem/pet sources are counted before the panel remainder');
assert.equal(api.finalsOf(held.st)[103], 5000, 'known imported stats must not be added on top of the held game panel');
assert.deepEqual(plain(api.currentBuild(api.loadState(plain(held.st))).totems), plain(api.currentBuild(held.st).totems));
assert.equal(api.finalsOf(api.loadState(plain(held.st)))[103], 5000, 'saved tabs retain imported sources without double-counting');
{
  // A tab saved before the Totem editor: its level comes back from the enhancement the totems carried; a manual Totem survives a reload.
  const old = plain(held.st);
  delete old.totemLv;
  assert.equal(api.loadState(old).totemLv, 1, 'older tabs recover the system level from enhanceBp');
  const manual = { ...plain(held.st), totems: [{ id: 17400006, attrs: [[103, 50]], skills: [10052018, 99999999] }], totemLv: 1 };
  assert.deepEqual(plain(api.currentBuild(api.loadState(manual)).totems), [{ id: 17400006, attrs: [[103, 50]], skills: [10052018], guid: 1, enhanceBp: 500 }], 'unknown skills dropped, level applied');
}

const classified = structuredClone(source);
Object.assign(classified.assets.RoleAllProperty.BasicAttributeInfo, {
  304: 0.07, 324: 0.12, 409: 0.09, 501: 0.0468, 503: 0,
});
const classifiedState = api.mapExport(classified, true).st;
for (const [id, value] of [[304, 700], [324, 1200], [409, 900], [501, 468], [503, 0]]) {
  assert.equal(api.finalsOf(classifiedState)[id], value, 'conditional panel bonuses import in basis points');
  assert.equal(api.finalsOf(api.loadState(plain(classifiedState)))[id], value, 'conditional panel bonuses survive saved-tab loading');
}
for (const [names, base, step] of [[api.ELEMENTS, 321, 1], [api.RACES, 401, 1], [api.SIZES, 501, 2]]) {
  names.forEach((name, i) => {
    assert.ok(captureData.ui.attrNames[base + i * step].includes(name), 'selector order matches native bonus attribute names');
  });
}
const targetState = api.defaultState();
const originalTarget = plain(targetState.target);
assert.deepEqual([originalTarget.element, originalTarget.race, originalTarget.size], [1, 2, 2], 'Challenge dummy defaults remain Neutral, Demi-Human, Medium');
api.setState(targetState);
api.setPath('target.element', 4);
api.setPath('target.race', 9);
api.setPath('target.size', 1);
assert.equal(targetState.target.def, originalTarget.def);
assert.equal(targetState.target.maxHp, originalTarget.maxHp);
assert.ok(targetState.target.name.endsWith(' (edited)'), 'classification overrides are visibly marked as edited');
const savedTarget = api.loadState(plain(targetState));
assert.deepEqual(plain(api.defender(savedTarget)), plain(targetState.target), 'all three target overrides survive save/load');
for (const [id, value] of [[324, 1200], [409, 900], [501, 468]]) api.setFinal(targetState, id, value);
targetState.cards[0] = { id: 1460100, star: 1, lv: 0, flash: false };
targetState.cards[1] = { id: 1450100, star: 1, lv: 0, flash: false };
api.setFinal(targetState, 503, 0);
assert.equal(api.finalsOf(targetState)[503], 0, 'holding panel size bonuses must not absorb Drake combat effects');
const targetFx = api.cardEffects(api.simBuild(targetState).cards, api.data);
assert.equal(api.targetBonus(api.finalsOf(targetState), api.defender(targetState), targetFx.sizeBonusBp, targetFx.ignoreSize), 3418);
api.renderTarget();
assert.match(elements.get('#tBonuses').innerHTML, /vs Fire element/);
assert.match(elements.get('#tBonuses').innerHTML, /vs Insect race/);
assert.match(elements.get('#tBonuses').innerHTML, /All size bonuses \(Drake\)/);
assert.match(elements.get('#tBonuses').innerHTML, /34\.18%/);
assert.match(elements.get('#tBonuses').innerHTML, /75% chance: \+8\.00%/);
const targetHit = api.evaluateSkillDamage(api.simBuild(targetState), api.defender(targetState), api.data.row('SkillConfig', 1330505), {}, api.data);
assert.equal(targetHit.sizeProcChance, 0.75, 'target overrides flow through to Shadow Drake damage');
for (const size of [1, 2, 3]) {
  api.setPath('target.size', size);
  assert.equal(api.targetBonus(api.finalsOf(targetState), api.defender(targetState), targetFx.sizeBonusBp, targetFx.ignoreSize), 3418, 'Drake enables the held Small bonus against every size');
  assert.ok(api.vsTarget(api.finalsOf(targetState), api.defender(targetState), targetFx.ignoreSize).some(([id, value]) => id === 501 && value === 468), 'the UI includes bonuses enabled by Drake rather than only the actual target size');
  api.renderTarget();
  assert.match(elements.get('#tBonuses').innerHTML, /All size bonuses \(Drake\)/);
  assert.match(elements.get('#tBonuses').innerHTML, /34\.18%/);
  const hit = api.evaluateSkillDamage(api.simBuild(targetState), api.defender(targetState), api.data.row('SkillConfig', 1330505), {}, api.data);
  assert.equal(hit.normalHitMean, targetHit.normalHitMean, 'changing size does not remove a Drake-enabled bonus');
}
assert.match(api.cardBrief(1450100, 1, 0, false).identity, /75% chance per landed hit/);
assert.equal(api.cardBrief(1450100, 1, 0, false).simulated, true);
assert.match(api.cardTip(1460100, 1, 0, false), /All offensive size bonuses apply against any size/);
assert.match(api.cardTip(1450100, 1, 0, false), /All offensive size bonuses apply against any size/);
const yellowState = structuredClone(targetState);
yellowState.cards[0] = { id: 0, star: 0, lv: 0, flash: false };
api.setState(yellowState);
api.renderTarget();
assert.match(elements.get('#tBonuses').innerHTML, /All size bonuses \(Drake\)/);
assert.match(elements.get('#tBonuses').innerHTML, /25\.68%/, 'yellow Drake alone enables the Small bonus on the Large target without adding a permanent proc bonus');
api.setState(targetState);
for (const field of ['element', 'race', 'size']) api.setPath(`target.${field}`, 0);
api.renderTarget();
assert.match(elements.get('#tBonuses').innerHTML, /Unspecified element/);
assert.match(elements.get('#tBonuses').innerHTML, /Unspecified race/);
assert.match(elements.get('#tBonuses').innerHTML, /Unspecified size/);
assert.doesNotMatch(elements.get('#tBonuses').innerHTML, /undefined|Shadow Drake/);
assert.equal(api.targetBonus(api.finalsOf(targetState), api.defender(targetState), targetFx.sizeBonusBp, targetFx.ignoreSize), 0, 'unclassified NPCs do not inherit unrelated bonus attributes');
api.setState(api.defaultState());

const anchored = api.mapExport(source, false).st;
const originalAtk = api.finalsOf(anchored)[103];
api.setFinal(anchored, 103, originalAtk);
assert.ok(!Object.hasOwn(anchored.ex, 103), 'matching panel values need no hidden bonus');
const restored = api.loadState(plain(anchored));
assert.equal(restored.hold[103], originalAtk, 'zero-remainder held values survive saved-tab loading');
api.setFinal(restored, 5, api.finalsOf(restored)[5] + 10);
assert.equal(api.finalsOf(restored)[103], originalAtk, 'typing DEX must preserve an already-matching held PATK');

const echoes = api.mapExport(structuredClone(source), false).st;
const originalEchoAtk = api.finalsOf(echoes)[103];
assert.equal(echoes.echoes[0].id, 1850101, 'the active Echo instance populates its own editor');
echoes.echoes[0].stats[0].v += 1250;
assert.ok(api.finalsOf(echoes)[103] > originalEchoAtk, 'editing an Echo bonus changes the character sheet');
assert.deepEqual(plain(api.currentBuild(echoes).emblemAttrs), [[103, 2250], [101, 3000]], 'estimates replace the captured total instead of stacking on it');
echoes.echoUseEntries = false;
assert.deepEqual(plain(api.currentBuild(echoes).emblemAttrs), [[103, 1000], [101, 3000]], 'the original imported total remains recoverable');
echoes.echoUseEntries = true;
const enteredAttrs = plain(api.currentBuild(echoes).emblemAttrs);
const enteredAtk = api.finalsOf(echoes)[103];
echoes.echoes[0].colors = ['green', 'blue', 'yellow', 'red'];
echoes.echoes[0].lv = 20;
assert.equal(api.finalsOf(echoes)[103], enteredAtk, 'planning colors and reference levels do not secretly scale entered bonuses');
const savedEchoes = api.loadState(plain(echoes));
assert.deepEqual(plain(api.currentBuild(savedEchoes).emblemAttrs), enteredAttrs, 'saved Echo entries retain their contribution');
assert.deepEqual(plain(savedEchoes.echoes[0].colors), ['green', 'blue', 'yellow', 'red']);
savedEchoes.echoes[0].id = 0;
assert.equal(api.currentBuild(savedEchoes).emblemAttrs.length, 0, 'an empty Echo slot cannot contribute its stored estimates');
const oldEchoState = plain(mapped.st);
oldEchoState.v = 13;
delete oldEchoState.echoes;
delete oldEchoState.echoUseEntries;
const oldEchoes = api.loadState(oldEchoState);
assert.deepEqual(plain(api.currentBuild(oldEchoes).emblemAttrs), [[103, 1000], [101, 3000]], 'v13 tabs keep their captured aggregate until explicitly replaced');
assert.equal(api.finalsOf(oldEchoes)[103], originalEchoAtk, 'migrating an older tab must not change its damage stats');
const sparseEchoes = structuredClone(source);
sparseEchoes.assets.SoulEchoes.plans[1].slots = { 4: 'active' };
const sparse = api.mapExport(sparseEchoes, false).st;
assert.equal(sparse.echoes[0].id, 0);
assert.equal(sparse.echoes[3].id, 1850101, 'sparse imported slots keep their real position');
const richEchoes = structuredClone(source);
richEchoes.assets.SoulEchoes.items.active.kEmblemInfo.kSubAttrList = {
  1: { iId: 101, iValue: 3000 }, 2: { iId: 109, iValue: 50 }, 3: { iId: 111, iValue: 100 },
  4: { iId: 209, iValue: 550 }, 5: { iId: 1031, iValue: 100 },
};
const rich = api.mapExport(richEchoes, false).st;
assert.equal(rich.echoes[0].stats.length, 6, 'imported bonuses are not truncated to the four initial estimate rows');
assert.deepEqual(plain(api.currentBuild(api.loadState(plain(rich))).emblemAttrs), plain(api.currentBuild(rich).emblemAttrs), 'all imported rows survive a save/load cycle');
const extraSlot = structuredClone(source);
extraSlot.assets.SoulEchoes.plans[1].slots = { 6: 'active' };
const extra = api.mapExport(extraSlot, false).st;
assert.equal(extra.echoUseEntries, false);
assert.deepEqual(plain(api.currentBuild(extra).emblemAttrs), [[103, 1000], [101, 3000]], 'an unexpected extra slot retains its captured total rather than losing bonuses');
const invalidEchoes = plain(echoes);
invalidEchoes.echoes[0].stats.push({ a: '__proto__', v: 1 });
invalidEchoes.echoes[0].colors[0] = 'not-a-color';
const safeEchoes = api.loadState(invalidEchoes);
assert.deepEqual(plain(api.currentBuild(safeEchoes).emblemAttrs), enteredAttrs, 'invalid attribute keys must not enter the engine');
assert.equal(safeEchoes.echoes[0].colors[0], '', 'unknown saved colors remain unassigned');

const old = structuredClone(source);
delete old.assets.SoulEchoes;
delete old.assets.DivineTotems;
const legacy = api.mapExport(old, true);
assert.equal(api.currentBuild(legacy.st).emblemAttrs.length, 0);
assert.equal(api.currentBuild(legacy.st).totems.length, 0);
assert.ok(legacy.lines.some(([kind, text]) => kind === 'warn' && text.includes('Soul Echoes: not captured')));
assert.equal(api.finalsOf(legacy.st)[103], 5000, 'old captures retain the panel fallback');

const bad = structuredClone(source);
bad.assets.SoulEchoes.currentPlan = 99;
bad.assets.DivineTotems.plans[0].slots[1] = 'missing';
bad.truncated = 2;
const rejected = api.mapExport(bad, false);
assert.equal(api.currentBuild(rejected.st).emblemAttrs.length, 0, 'never substitute the first Echo plan');
assert.equal(api.currentBuild(rejected.st).totems.length, 0, 'unresolved instance references must not produce Totem stats');
assert.ok(rejected.lines.some(([kind, text]) => kind === 'warn' && text.includes('truncated')));

const rotation = api.defaultState();
rotation.skills[13305] = 5;
rotation.skills[13320] = 5;
rotation.rotation = [13305, 13320, 13305];
rotation.sim.cycle = 1;
const learned = plain(rotation.skills);
assert.deepEqual(plain(api.rotationIds(rotation)), [1330505, 1332005, 1330505]);
rotation.disabledRotation = [13305];
assert.deepEqual(plain(api.rotationIds(rotation)), [1332005], 'disabling a group gates every Cycle occurrence, not its saved slots or levels');
assert.deepEqual(plain(rotation.rotation), [13305, 13320, 13305]);
assert.deepEqual(plain(rotation.skills), learned);
assert.deepEqual(plain(api.loadState(plain(rotation)).disabledRotation), [13305], 'disabled flags survive tab save/load');
rotation.rotation = [13320, 13305, 13305];
assert.deepEqual(plain(api.rotationIds(rotation)), [1332005], 'reordering cannot attach a disabled flag to another skill');
rotation.sim.cycle = 0;
api.setState(rotation);
api.renderRotation();
assert.ok(elements.get('#rotList').innerHTML.includes('aria-pressed="false"'));
assert.ok(!elements.get('#rotList').innerHTML.includes('never cast:'), 'a disabled zero-CD skill cannot starve later entries');
assert.ok(api.skillTile(13305).includes('class="rot off"'), 'the skill-tree badge reflects the disabled rotation group');
rotation.disabledRotation = [13305, 13320];
assert.equal(api.rotationIds(rotation).length, 0, 'all disabled entries fall back to basic attacks');
const legacyRotation = plain(rotation);
legacyRotation.v = 14;
delete legacyRotation.disabledRotation;
assert.deepEqual(plain(api.rotationIds(api.loadState(legacyRotation))), [1332005, 1330505, 1330505], 'v14 builds migrate with every existing rotation skill enabled');
const invalidRotation = plain(rotation);
invalidRotation.disabledRotation = [13305, 13305, '13320', null, -1, 999999, 13305.5];
assert.deepEqual(plain(api.loadState(invalidRotation).disabledRotation), [13305], 'unknown/noninteger saved groups cannot enter the disabled set');
api.applyRotation(rotation, [1330505]);
assert.deepEqual(plain(rotation.disabledRotation), [], 'loading a preset intentionally enables its new rotation');

const petBuild = { career: 3400, level: 72, stats: [1, 1, 1, 1, 89, 53], equipmentAttrs: [[103, 3023]],
  pets: [{ id: 22002, star: 6 }, { id: 20001, star: 6 }, { id: 30001, star: 6 }, { id: 30401, star: 6 }] };
const target = { level: 72, def: 0, mdef: 0, flee: 0, resCri: 0, element: 1 };
const memoryData = new api.Ro3MemoryDataStore(captureData.tables);
assert.ok(memoryData.row('SkillConfig', 1330515), 'ordinary Unlimited Shooting must be bundled even without Season skills');
const unlimitedTrace = [];
api.simulateRotation({ ...petBuild, pets: [] }, target, [1330705, 1330505], 15000, memoryData, unlimitedTrace);
const unlimitedFas = unlimitedTrace.filter((e) => Math.floor(e.ev.skillId / 100) === 13305);
assert.deepEqual([...new Set(unlimitedFas.map((e) => e.ev.skillId))].sort(), [1330505, 1330515], 'the browser must switch to Unlimited FAS, then back after its buff expires');
assert.ok(unlimitedFas.filter((e) => e.ev.skillId === 1330515).every((e) => e.ev.skillName.includes('Unlimited Shooting') && e.ev.p1 === 9000),
  'Unlimited shots retain their native name and boosted coefficient without requiring a Season toggle');
const petRun = api.simulateDistribution(petBuild, target, [], 60000, { runs: 2, seed: 42, captureRun: true }, memoryData);
const petAnalysis = api.analyze(petRun, rotation);
const frost = petAnalysis.skills.find((s) => s.id === 2344306);
assert.equal(frost.landed / petAnalysis.n, 14, 'the actual bundled Garm skill lands seven hits every 30 seconds, not the 12-second pet AI attack');
assert.equal(petAnalysis.skills.find((s) => s.id === -9020001).landed / petAnalysis.n, 14);
assert.ok(!petRun.deterministic.castLog.some((c) => c.name === 'Radiant Moon'), 'the real catalog must not classify Control Frost Breath as Offensive');
assert.equal(petRun.sampleRun.filter((e) => e.id === -9130401).length, 2);
const extended = api.petEffects([{ id: 31003, star: 6 }, { id: 10001, star: 6 }, { id: 30401, star: 6 }], memoryData);
assert.equal(extended.hits.filter((h) => h.primary).length, 12, 'Choco extends the actual aura ticks, not only its displayed buff');
assert.equal(extended.hits.find((h) => h.sharePct).firstMs, 6000, 'core waits for the extended Primary skill to finish');
const aura = api.simulateDistribution({ ...petBuild, pets: [{ id: 31003, star: 6 }] }, target, [], 5000, { runs: 1, seed: 42, captureRun: true }, memoryData);
assert.equal(aura.sampleRun.filter((e) => e.id === 2308606).length, 10, 'a final impact exactly at fight end counts, but no new cast starts there');
let missedPrimary = false;
for (let seed = 1; seed <= 8; seed++) {
  const procRun = api.simulateDistribution({ ...petBuild, pets: [{ id: 30005, star: 6 }, { id: 20001, star: 6 }, { id: 30004, star: 6 }, { id: 30401, star: 6 }] },
    { ...target, flee: 1e9 }, [], 2000, { runs: 1, seed, captureRun: true }, memoryData);
  const missed = procRun.sampleRun.find((e) => e.id === 2335206).miss;
  missedPrimary ||= missed;
  assert.equal(procRun.sampleRun.filter((e) => e.id === -9020001).length, missed ? 0 : 1, 'Ferus needs the actual Primary hit, not only its cast');
  assert.equal(procRun.sampleRun.filter((e) => e.id === -9030004).length, missed ? 0 : 5, 'Sarah keeps five distinct hits, none of which can trigger after a missed Primary');
  assert.equal(procRun.sampleRun.filter((e) => e.id === -9130401).length, missed ? 0 : 1, 'a zero Primary total cannot create a phantom core hit');
}
assert.ok(missedPrimary, 'the native Alicel regression must exercise at least one missed Primary');
const owlHits = (pets) => {
  const trace = [];
  api.simulateRotation({ ...petBuild, pets }, target, [], 2000, memoryData, trace);
  return trace.filter((e) => e.ev.skillId === 2311406);
};
const owlOnly = owlHits([{ id: 30002, star: 6 }]);
const radiantOwl = owlHits([{ id: 30002, star: 6 }, { id: 30001, star: 6 }]);
assert.equal(radiantOwl[0].ev.expectedPerAttempt, owlOnly[0].ev.expectedPerAttempt, 'an on-hit debuff cannot amplify the impact that first applies it');
assert.ok(radiantOwl[1].ev.expectedPerAttempt > owlOnly[1].ev.expectedPerAttempt, 'later Primary hits benefit from the already-triggered debuff');
const conditionalBuff = api.petEffects([{ id: 30005, star: 6 }, { id: 30001, star: 6 }], memoryData);
assert.ok(!conditionalBuff.timedBuffs.some((b) => b.slot === 1), 'an unsupported random on-hit buff must not be granted unconditionally');
assert.ok(conditionalBuff.notes.some((n) => n.slot === 1 && n.text.includes('can miss')), 'the omitted conditional buff must be explicitly disclosed');
const simultaneousPet = Object.values(captureData.tables.PetDigest).find((p) => p.star[5].primary.id === 2329106);
assert.ok(simultaneousPet, 'the bundled Bokba Primary is required for simultaneous-hit coverage');
const simultaneousFx = api.petEffects([{ id: simultaneousPet._iID, star: 6 }, { id: 30004, star: 6 }, { id: 20001, star: 6 }], memoryData);
const simultaneousPrimary = simultaneousFx.hits.filter((h) => h.primary);
assert.ok(new Set(simultaneousPrimary.map((h) => h.firstMs)).size < simultaneousPrimary.length);
assert.equal(simultaneousFx.hits.filter((h) => h.row._iID === -9030004).length, simultaneousPrimary.length * 5, 'distinct simultaneous Primary hits each trigger Sarah, which has no internal cooldown');
assert.equal(simultaneousFx.hits.filter((h) => h.row._iID === -9020001).length, 0, 'Bokba is a Debuff Primary, not Offensive or Control, so it cannot trigger Ferus');
const counterRun = api.simulateDistribution({ ...petBuild, pets: [], equipmentAttrs: [[111, 4500]] }, { ...target, flee: 10000 }, [], 5000, { runs: 20, seed: 9 }, memoryData);
const counts = api.analyze(counterRun, rotation).skills[0];
assert.ok(counts.misses > 0 && counts.crits > 0);
assert.equal(counts.landed, counts.hits + counts.crits);
assert.ok(counts.landed / counterRun.runs < counts.events, 'Hits uses actual landed mean, not attempted hits that include misses');
const defaultState = api.defaultState();
api.setState(defaultState);
const defaultRun = api.simulateDistribution(api.simBuild(defaultState), api.defender(defaultState), api.rotationIds(defaultState), 30000,
  { runs: 1, seed: defaultState.sim.seed, captureRun: true }, api.data);
assert.equal(defaultRun.sampleRun.length, 135, 'the default Ranger keeps its seeded packet count');
assert.equal(defaultRun.totals[0], 289231, 'the default Ranger keeps its seeded damage');
console.log('Character import checks passed: selected plans, support pets, collection, Echo/Totem stats, enhancement, held-panel reconciliation, saved tabs and legacy captures.');
console.log('Rotation and bundled-pet checks passed: saved group toggles, migration, badges, starvation, native Primary cadence, Utility triggers, core and landed-hit counts.');

const flag = process.argv.indexOf('--capture');
if (flag >= 0) {
  const real = JSON.parse(fs.readFileSync(process.argv[flag + 1], 'utf8'));
  const result = api.mapExport(real, true);
  assert.ok(result.st, result.lines.map(([, text]) => text).join('\n'));
  const panel = { ...real.assets.RoleAllProperty?.BaseAttributeInfo, ...real.assets.RoleAllProperty?.BasicAttributeInfo };
  let matchedPanelValues = 0;
  for (const { a } of api.panelFields) {
    if (typeof panel[a] !== 'number') continue;
    const expected = a === 115 ? Math.round(panel[a] * 100)
      : api.attrConfig[a]?._iDataType === 1 ? Math.round(panel[a] * 10000) : panel[a];
    assert.equal(api.finalsOf(result.st)[a], expected, `imported game-panel attribute ${a}`);
    matchedPanelValues++;
  }
  console.log(JSON.stringify({
    file: process.argv[flag + 1],
    pets: api.activePets(result.st).filter(Boolean).length,
    support: api.activeAssist(result.st).filter(Boolean).length,
    echoAttributes: result.st.echoAttrs.length,
    totems: result.st.totems.length,
    hp: api.finalsOf(result.st)[101], patk: api.finalsOf(result.st)[103],
    matchedPanelValues,
    messages: result.lines,
  }, null, 2));
}
