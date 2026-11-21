// Checks ro3-export-character.cs without the game:
//   A  the script compiles (C# 5, like your plugins) against the real client DLLs: every Unity / BepInEx / Unity Explorer name it uses exists
//   B  its real logic runs against fake Lua objects shaped like the game's (with decoy look-alike methods): discovery by shape, the JSON, the
//      skipped identifying keys, depth cap, error isolation, and every Lua reference released
//   C  the shape predicates (the script's own SHAPES block) find exactly the xLua members in the real Assembly-CSharp.dll of the client
// node check-export-character.mjs [--client "C:\...\Client"]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const client = argv.includes('--client') ? argv[argv.indexOf('--client') + 1] : path.join(here, 'Client');
const managed = path.join(client, 'ro3_Data', 'Managed');
const csc = path.join(process.env.WINDIR ?? 'C:\\Windows', 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'ro3-export-check-'));
const script = fs.readFileSync(path.join(here, 'ro3-export-character.cs'), 'utf8').replace(/\r\n/g, '\n');
assert.ok(fs.existsSync(csc), 'the .NET Framework C# compiler (csc.exe v4) is needed, like for your plugins');
assert.ok(fs.existsSync(managed), `the client's Managed folder: ${managed}`);

// The Unity Explorer console takes at most 16,000 characters.
assert.ok(script.length < 15500, `the script is ${script.length} characters: the Unity Explorer console takes 16,000`);

const run = (exe, args, opts = {}) => {
  const r = spawnSync(exe, args, { encoding: 'utf8', ...opts });
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};
const compile = (name, source, extra) => {
  const file = path.join(work, `${name}.cs`);
  fs.writeFileSync(file, source);
  const out = path.join(work, `${name}.${extra.includes('/target:library') ? 'dll' : 'exe'}`);
  const r = run(csc, ['/nologo', '/langversion:5', '/optimize+', ...extra, `/out:${out}`, file]);
  assert.equal(r.code, 0, `${name} did not compile:\n${r.out}`);
  return out;
};

// ---- A: compiles against the real client ----
{
  const refs = ['mscorlib.dll', 'System.dll', 'System.Core.dll', 'Assembly-CSharp.dll', 'Happyengine.Base.Runtime.dll', 'UnityEngine.dll', 'UnityEngine.CoreModule.dll']
    .map((f) => `/reference:${path.join(managed, f)}`);
  refs.push(`/reference:${path.join(client, 'BepInEx', 'core', 'BepInEx.dll')}`, `/reference:${path.join(client, 'BepInEx', 'plugins', 'sinai-dev-UnityExplorer', 'UnityExplorer.BIE5.Mono.dll')}`);
  compile('A', `internal static class ExportCompile { public static void Run() {\n${script}\n} }\n`, ['/noconfig', '/nostdlib+', '/target:library', '/platform:x64', ...refs]);
  console.log('A  compiles against the client\'s Unity, BepInEx and Unity Explorer assemblies (C# 5)');
}

// ---- B: behaviour against fakes ----
const HOST = {
  manager: 'var manager = new FakeManager(Harness.Globals, Harness.Refs);',
  build: 'var build = "fake-build / Unity test";',
  dir: 'var dir = Harness.OutDir;',
  log: 'Harness.Result = ro3Export();',
};
let hosted = script;
for (const [name, line] of Object.entries(HOST)) {
  const re = new RegExp(`^.*// HOST:${name}\\s*$`, 'm');
  assert.ok(re.test(hosted), `the script has no "// HOST:${name}" line`);
  hosted = hosted.replace(re, line);
}
assert.ok(!/LA_LuaManager|BepInEx|UnityEngine|UnityExplorer/.test(hosted.replace(/\/\/.*$/gm, '')), 'every game-specific call of the script is behind a // HOST: line');
const harness = String.raw`
using System;
using System.Collections.Generic;
using System.IO;
using System.Web.Script.Serialization;
public class Tracker { public int Live; }
public class FakeFunction : IDisposable {
  readonly Func<object[], object[]> f; readonly Tracker t;
  public FakeFunction(Func<object[], object[]> f, Tracker t) { this.f = f; this.t = t; t.Live++; }
  public object[] Obf_HuA(object[] args) { return f(args); }                          // Call
  public void Obf_IuA(object[] args) { f(args); }                                      // decoy: void
  public object[] Obf_huA(object[] args, Type[] types) { return f(args); }             // decoy: two parameters
  public void Obf_fuA<T>(T a) { }                                                      // decoy
  public void Dispose() { t.Live--; }
}
public class FakeTable : IDisposable {
  readonly Dictionary<object, object> d; readonly Tracker t;
  public FakeTable(Dictionary<object, object> d, Tracker t) { this.d = d; this.t = t; t.Live++; }
  public static object Wrap(object v, Tracker t) {
    var m = v as Dictionary<object, object>; if (m != null) return new FakeTable(m, t);
    var f = v as Func<object[], object[]>; if (f != null) return new FakeFunction(f, t);
    return v;
  }
  public T Obf_QuA<T>(object o) { return default(T); }                                // decoy: an object parameter
  public T Obf_SuA<T>() { return default(T); }                                         // decoy: no parameter
  public void Obf_kuA<K, V>(K k, out V v) { v = default(V); }                          // decoy: two parameters
  public T Obf_LuA<T>(string path) { object v; return d.TryGetValue(path, out v) ? (T)Wrap(v, t) : default(T); }   // GetInPath
  public V Obf_ruA<K, V>(K key) { object v; return d.TryGetValue(key, out v) ? (V)Wrap(v, t) : default(V); }       // Get by key
  public void Obf_OuA<K, V>(Action<K, V> a) { foreach (var kv in new List<KeyValuePair<object, object>>(d)) a((K)kv.Key, (V)Wrap(kv.Value, t)); }  // ForEach
  public int Obf_puA() { return d.Count; }
  public void Dispose() { t.Live--; }
}
public class FakeManager {
  readonly Dictionary<string, object> g; readonly Tracker t;
  public FakeManager(Dictionary<string, object> g, Tracker t) { this.g = g; this.t = t; }
  public void Obf_iD(bool a, object b) { }
  public object[] Obf_KD(string s) { return null; }
  public T Obf_oD<T>(string name) { object v; return g.TryGetValue(name, out v) ? (T)FakeTable.Wrap(v, t) : default(T); }
}
public static class Harness {
  public static Tracker Refs = new Tracker();
  public static Dictionary<string, object> Globals;
  public static string OutDir, Result;
  static Dictionary<object, object> D(params object[] kv) { var d = new Dictionary<object, object>(); for (int i = 0; i < kv.Length; i += 2) d[kv[i]] = kv[i + 1]; return d; }
  static int checks;
  static void Check(bool ok, string what) { checks++; if (!ok) { Console.WriteLine("FAIL: " + what); Environment.Exit(1); } }
  public static int Main() {
    OutDir = Path.Combine(Path.GetTempPath(), "ro3-export-" + Guid.NewGuid().ToString("N")); Directory.CreateDirectory(OutDir);
    var loop = D("name", "loop"); loop["self"] = loop;
    long echoA = 9007199254740993L, echoB = 9007199254740995L, echoC = 9007199254740997L;
    var firstEcho = D("iItemId", 1280001L, "iInstanceId", echoA, "sOwnerName", "PrivateEchoOwner",
      "kCommonInfo", D("iSetUpState", 2L, "iSetUpPos", 3L),
      "kEmblemInfo", D("iLevel", 8L, "iExp", 123L, "iTotalExp", 456L,
        "kAttrList", D(1L, D("iId", 115L, "iValue", 48L)),
        "kSubAttrList", D(1L, D("iId", 101L, "iRealId", 123456L, "iValue", 700L)),
        "kMarkList", D(1L, D("iMarkId", 12L, "bIsEffective", true)),
        "kSpecialEffectList", D(1L, 35001L)));
    var secondEcho = D("iItemId", 1280001L, "iInstanceId", echoB,
      "kEmblemInfo", D("iLevel", 2L, "kAttrList", D(1L, D("iId", 115L, "iValue", 19L))));
    var deployedEcho = D("iItemId", 1280002L, "iInstanceId", echoC, "kEmblemInfo", D("iLevel", 5L));
    long totemA = 9007199254741001L, totemB = 9007199254741003L;
    var firstTotem = D("iItemId", 1770101L, "iInstanceId", totemA, "kTotemInfo", D(
      "kAttrList", D(1L, D("iId", 103L, "iValue", 150L)),
      "kSkillList", D(1L, D("iSkillID", 10051001L))));
    var secondTotem = D("iItemId", 1770102L, "iInstanceId", totemB, "kTotemInfo", D(
      "kAttrList", D(1L, D("iId", 101L, "iValue", 900L)), "kSkillList", D()));
    var echoScheme = D("currentPlan", 1L, "emblemPlans", D(
      0L, D("planName", "PrivateEchoPlan", "setUpEmblem", D(1L, echoB)),
      1L, D("setUpEmblem", D(2L, echoC, 3L, echoA)),
      2L, D()));
    var assets = new Dictionary<string, object> {
      { "PlayerBasicInfo", D("career", 3400L, "level", 74L, "jobLevel", 50L, "name", "SecretName", "account", "acct-1") },
      { "PlayerAttrSumPoint", D("curPlanIndex", 0L, "allPlanBaseProperty", D(0L, D("baseProperty", D(1L, 1L, 5L, 89L, 6L, 53L), "planName", "my plan"))) },
      { "EquipGearDataMap", D(1L, D("iItemId", 2110660L, "iInstanceId", 99999L, "sOwnerName", "x", "iGuid", 5L,
          "kEquipInfo", D("kPropertyList", D(1L, D("iId", 101L, "iValue", 4210L)), "kEntryList", D(1L, D("iId", 5L, "iValue", 17L)),
            "fLuck", 1.5, "bFlag", true, "kCreaterInfo", D("kName", "crafter"), "note", "q\"uote\\ and\n newline \u00e9 \u0001"))) },
      { "PetInfo", D("m_kPetList", D(1L, D("m_iPetId", 30001L, "m_iLevel", 60L, "m_iStar", 3L, "m_sNickName", "Fluffy"),
          2L, D("m_iPetId", 31005L, "m_iLevel", 50L, "m_iStar", 2L, "m_iStarProgress", 1L, "m_bIsActiveCollect", true)),
          "loop", loop, "fn", (Func<object[], object[]>)(a => a), "__index", 2L) },
      { "PetSetUpInfo", D("currentPlan", 1L, "setupPlans", D(
          0L, D("setUpPets", D(1L, 31005L), "supportPets", D()),
          1L, D("setUpPets", D(1L, 30001L), "supportPets", D(1L, 31005L)))) },
      { "ServerAllSkills", D(13204L, 10L, 13302L, 5L) },
      { "ServerSkillDevelopInfo", D("currentPlanIndex", 0L, "skillAssignPlans", D(1L, D("skillAssigns", D(13204L, D("skillId", 1320410L, "skillLevel", 10L)))), "skillCdData", "ignored") },
      { "SeasonTalentData", D(10101001L, D("talentId", 10101001L, "currentLevel", 3L, "isActivated", true)) },
      { "PackItems", D(5L, D(echoA, firstEcho, echoB, secondEcho), 4L, D(totemA, firstTotem), 1L, D(123L, D("iItemId", 999L, "iInstanceId", 123L))) },
      { "EmblemGridMap", D(2L, deployedEcho, 3L, firstEcho, 4L, D()) },
      { "EmblemSystemSchemeInfo", echoScheme },
      { "TotemGridData", D(1L, firstTotem, 2L, secondTotem) },
      { "TotemSystemSchemeInfo", D("currentPlan", 0L, "totemPlans", D(
          0L, D("setUpTotem", D(1L, totemA, 2L, totemB)), 1L, D())) },
      { "TotemExp", D("kLevel", 4L, "kTotalExp", 15000L, "kExtraExp", 10L) },
      { "LibraryInfo", D("kCardInfo", D(1440102L, D("isActivated", true))) },
      { "SeasonRefineData", D(1L, D("iActiveAttri", 1234L)) },
      { "WardrobeInfo", D("appearancePlans", D()) },
      { "AllMountData", D(201L, D("m_iMountId", 201L, "m_iUniqueId", 8888888888888888L)) },
      { "ActivationMounts", D(1L, 201L) },
    };
    Func<object[], object[]> getAsset = a => {
      var name = (string)a[1];
      if (name == "SeasonTalentPlanInfo") throw new InvalidOperationException("boom");
      object v; if (!assets.TryGetValue(name, out v)) return new object[] { null };
      if (a.Length > 2) { object f; var m = (Dictionary<object, object>)v; return new object[] { m.TryGetValue(a[2], out f) ? FakeTable.Wrap(f, Refs) : null }; }
      return new object[] { FakeTable.Wrap(v, Refs) };
    };
    Globals = new Dictionary<string, object> {
      { "ServerLocation", D("m_tServersMap", D("LC_AssetManager", D("GetAssetData", (Func<object[], object[]>)(a => getAsset(a))))) },
      { "enum_EquipGridType", D("MainHand", 1L, "ViceHand", 2L) }, { "enum_CardType", D("Normal", 0L, "Flash", 1L) }, { "enum_unitAttrMap", D("MaxHP", 101L) },
      { "enum_packType", D("PackType_Emblem", 5L, "PackType_Totem", 4L) },
    };
    ExportRun.Run();
    Check(Result != null && Result.StartsWith("RO3 character export: "), "the summary: " + Result);
    var file = Path.Combine(OutDir, "ro3-character.json");
    Check(File.Exists(file), "the file was written");
    var text = File.ReadAllText(file);
    var j = (Dictionary<string, object>)new JavaScriptSerializer { MaxJsonLength = int.MaxValue }.DeserializeObject(text);   // well-formed JSON
    Func<object, string, object> at = (o, k) => ((Dictionary<string, object>)o)[k];
    var A = at(j, "assets");
    Check((string)at(j, "format") == "ro3-character/1" && (string)at(j, "build") == "fake-build / Unity test", "format and build");
    Check(Convert.ToInt64(at(at(A, "PlayerBasicInfo"), "career")) == 3400 && Convert.ToInt64(at(at(A, "PlayerBasicInfo"), "level")) == 74, "fields of an asset");
    var basic = (Dictionary<string, object>)at(A, "PlayerBasicInfo");
    Check(basic.Count == 3 && !basic.ContainsKey("name") && !basic.ContainsKey("account"), "only the asked fields: no name, no account");
    var gear = at(at(A, "EquipGearDataMap"), "1");
    Check(Convert.ToInt64(at(gear, "iItemId")) == 2110660, "the item id");
    var gd = (Dictionary<string, object>)gear;
    Check(!gd.ContainsKey("iInstanceId") && !gd.ContainsKey("sOwnerName") && !gd.ContainsKey("iGuid"), "instance, owner and guid keys are left out");
    var info = (Dictionary<string, object>)at(gear, "kEquipInfo");
    Check(!info.ContainsKey("kCreaterInfo"), "the crafter is left out");
    Check(Convert.ToInt64(at(at(at(info, "kPropertyList"), "1"), "iValue")) == 4210 && Convert.ToInt64(at(at(at(info, "kEntryList"), "1"), "iId")) == 5, "a Lua list is an object keyed \"1\", \"2\"...");
    Check(Convert.ToDouble(at(info, "fLuck")) == 1.5 && (bool)at(info, "bFlag"), "a float and a boolean");
    Check((string)at(info, "note") == "q\"uote\\ and\n newline \u00e9 \u0001", "a string with quotes, backslash, newline, accent and a control character survives");
    var pets = (Dictionary<string, object>)at(A, "PetInfo");
    Check(!pets.ContainsKey("fn") && !pets.ContainsKey("__index"), "functions and internal keys are left out");
    var pet = (Dictionary<string, object>)at(at(pets, "m_kPetList"), "1");
    Check(Convert.ToInt64(at(pet, "m_iLevel")) == 60 && Convert.ToInt64(at(pet, "m_iPetId")) == 30001, "the client's own m_ fields are kept: the pet list uses them");
    Check(!pet.ContainsKey("m_sNickName"), "but a nickname is not");
    var skills = (Dictionary<string, object>)at(A, "ServerAllSkills");
    var cardType = (Dictionary<string, object>)at(at(j, "enums"), "enum_CardType");
    Check(Convert.ToInt64(skills["13302"]) == 5 && Convert.ToInt64(cardType["Flash"]) == 1, "the flat skill levels and the card type enum");
    Check(Convert.ToInt64(at(j, "truncated")) > 0 && pets.ContainsKey("loop"), "a cyclic table is cut at the depth cap, not followed forever");
    Check(Convert.ToInt64(at(at(A, "PlayerAttrSumPoint"), "curPlanIndex")) == 0 && !((Dictionary<string, object>)at(at(at(at(A, "PlayerAttrSumPoint"), "allPlanBaseProperty"), "0"), "baseProperty")).ContainsKey("x"), "the stat plan");
    var setup = at(A, "PetSetUpInfo");
    var setupPlans = at(setup, "setupPlans");
    Check(Convert.ToInt64(at(setup, "currentPlan")) == 1 &&
      Convert.ToInt64(at(at(at(setupPlans, "1"), "setUpPets"), "1")) == 30001 &&
      Convert.ToInt64(at(at(at(setupPlans, "1"), "supportPets"), "1")) == 31005 &&
      Convert.ToInt64(at(at(at(setupPlans, "0"), "setUpPets"), "1")) == 31005,
      "active and alternative pet plans retain deployed and support pet identities");
    var supportPet = at(at(pets, "m_kPetList"), "2");
    Check(Convert.ToInt64(at(supportPet, "m_iLevel")) == 50 && Convert.ToInt64(at(supportPet, "m_iStar")) == 2 &&
      Convert.ToInt64(at(supportPet, "m_iStarProgress")) == 1 && (bool)at(supportPet, "m_bIsActiveCollect"),
      "support pet level, star stage and collection activation survive");
    var sk = (Dictionary<string, object>)at(A, "ServerSkillDevelopInfo");
    Check(!sk.ContainsKey("skillCdData") && sk.ContainsKey("skillAssignPlans") && sk.ContainsKey("currentPlanIndex"), "the skill plans, without what was not asked for");
    var missing = (object[])at(j, "missing");
    Check(Array.IndexOf(missing, "ProfessionInfo") >= 0 && Array.IndexOf(missing, "enum_CardPosType") >= 0, "assets and enums the game does not have are listed as missing");
    Check(!((Dictionary<string, object>)A).ContainsKey("ProfessionInfo"), "and not written as empty");
    var errors = (object[])at(j, "errors");
    Check(errors.Length == 1 && ((string)errors[0]).StartsWith("SeasonTalentPlanInfo: "), "an asset that throws is reported and the rest still comes out");
    var grid = (Dictionary<string, object>)at(at(j, "enums"), "enum_EquipGridType");
    Check(Convert.ToInt64(grid["MainHand"]) == 1, "the game's own enums are exported");
    var souls = at(A, "SoulEchoes");
    var soulItems = (Dictionary<string, object>)at(souls, "items");
    Check(soulItems.Count == 3 && Convert.ToInt64(at(souls, "currentPlan")) == 1, "both bag and deployed Soul Echoes are captured, without duplicate instances");
    var soulPlans = at(souls, "plans");
    var activeSlots = at(at(soulPlans, "1"), "slots");
    var firstRef = (string)at(activeSlots, "3");
    var secondRef = (string)at(at(at(soulPlans, "0"), "slots"), "1");
    var deployedRef = (string)at(activeSlots, "2");
    Check(firstRef != secondRef && firstRef != deployedRef && secondRef != deployedRef, "same-entry instances above JavaScript's exact-integer range remain distinct");
    var soulInfo = at(soulItems[firstRef], "kEmblemInfo");
    Check(Convert.ToInt64(at(soulInfo, "iLevel")) == 8 && Convert.ToInt64(at(soulInfo, "iExp")) == 123 &&
      Convert.ToInt64(at(soulInfo, "iTotalExp")) == 456, "Soul Echo level and both experience counters survive");
    Check(Convert.ToInt64(at(at(at(soulInfo, "kAttrList"), "1"), "iValue")) == 48 &&
      Convert.ToInt64(at(at(at(soulInfo, "kSubAttrList"), "1"), "iRealId")) == 123456 &&
      Convert.ToInt64(at(at(at(soulInfo, "kSubAttrList"), "1"), "iValue")) == 700 &&
      (bool)at(at(at(soulInfo, "kMarkList"), "1"), "bIsEffective") &&
      Convert.ToInt64(at(at(soulInfo, "kSpecialEffectList"), "1")) == 35001, "rolled attributes, original subattribute row ids, marks and specials survive");
    Check(Convert.ToInt64(at(at(soulItems[secondRef], "kEmblemInfo"), "iLevel")) == 2 &&
      Convert.ToInt64(at(at(at(at(soulItems[secondRef], "kEmblemInfo"), "kAttrList"), "1"), "iValue")) == 19 &&
      Convert.ToInt64(at(at(soulItems[deployedRef], "kEmblemInfo"), "iLevel")) == 5, "different rolls and deployed-only items are retained");
    Check(((Dictionary<string, object>)at(at(soulPlans, "2"), "slots")).Count == 0, "empty plans are distinguishable from missing data");
    Check(!text.Contains(echoA.ToString()) && !text.Contains(echoB.ToString()) && !text.Contains(echoC.ToString()) &&
      !text.Contains("PrivateEchoOwner") && !text.Contains("PrivateEchoPlan") && !text.Contains("iInstanceId"), "Soul Echo instance ids and names never leak through item keys or plan values");
    Check(Result.Contains("Soul Echoes: 3 items / 3 plans"), "the result reports the captured Echo and plan counts");
    var totems = at(A, "DivineTotems");
    var totemItems = (Dictionary<string, object>)at(totems, "items");
    var totemSlots = at(at(at(totems, "plans"), "0"), "slots");
    var firstTotemRef = (string)at(totemSlots, "1");
    var secondTotemRef = (string)at(totemSlots, "2");
    Check(totemItems.Count == 2 && firstTotemRef != secondTotemRef && Convert.ToInt64(at(totems, "currentPlan")) == 0,
      "Totem bag/deployed instances are deduplicated and joined to the selected plan");
    var totemInfo = at(totemItems[firstTotemRef], "kTotemInfo");
    Check(Convert.ToInt64(at(at(at(totemInfo, "kAttrList"), "1"), "iValue")) == 150 &&
      Convert.ToInt64(at(at(at(totemInfo, "kSkillList"), "1"), "iSkillID")) == 10051001 &&
      Convert.ToInt64(at(at(A, "TotemExp"), "kLevel")) == 4 &&
      Convert.ToInt64(at(at(A, "TotemExp"), "kTotalExp")) == 15000,
      "Totem rolls, skill ids and system enhancement progress survive");
    Check(!text.Contains(totemA.ToString()) && !text.Contains(totemB.ToString()) &&
      Result.Contains("Divine Totems: 2 items / 2 plans"), "Totem links remain anonymous and capture counts are visible");
    Check(((Dictionary<string, object>)A).ContainsKey("LibraryInfo") &&
      ((Dictionary<string, object>)A).ContainsKey("SeasonRefineData") &&
      ((Dictionary<string, object>)A).ContainsKey("AllMountData"), "other verified stat-source snapshots are retained");
    Check(Convert.ToInt64(at(j, "captureVersion")) == 2 && !text.Contains("8888888888888888"),
      "capture revision is explicit and mount unique ids remain private");
    Check(Refs.Live == 0, "every Lua table and function reference the script took was released (" + Refs.Live + " left)");

    assets["EmblemSystemSchemeInfo"] = D("currentPlan", 0L, "emblemPlans", D(0L, D("setUpEmblem", D(1L, 77777777777777777L))));
    ExportRun.Run();
    text = File.ReadAllText(file);
    j = (Dictionary<string, object>)new JavaScriptSerializer { MaxJsonLength = int.MaxValue }.DeserializeObject(text);
    A = at(j, "assets");
    errors = (object[])at(j, "errors");
    Check(!((Dictionary<string, object>)A).ContainsKey("SoulEchoes") &&
      Array.Exists(errors, e => ((string)e).Contains("SoulEchoes:") && ((string)e).Contains("missing from the loaded inventory")),
      "unresolved plan references reject the whole Soul Echo snapshot, not a plausible but incomplete loadout");
    Check(!text.Contains("77777777777777777") && Result.Contains("Soul Echoes: NOT captured") && Refs.Live == 0,
      "a failed capture reports failure, leaks no instance id and releases every Lua reference");

    assets["EmblemSystemSchemeInfo"] = echoScheme;
    firstEcho["iInstanceId"] = 9007199254740992.0;
    ExportRun.Run();
    j = (Dictionary<string, object>)new JavaScriptSerializer { MaxJsonLength = int.MaxValue }.DeserializeObject(File.ReadAllText(file));
    Check(!((Dictionary<string, object>)at(j, "assets")).ContainsKey("SoulEchoes") &&
      Array.Exists((object[])at(j, "errors"), e => ((string)e).Contains("not losslessly readable")) && Refs.Live == 0,
      "unsafe floating-point instance ids fail explicitly instead of merging different Echoes");
    firstEcho["iInstanceId"] = echoA;

    assets.Remove("PackItems");
    ExportRun.Run();
    j = (Dictionary<string, object>)new JavaScriptSerializer { MaxJsonLength = int.MaxValue }.DeserializeObject(File.ReadAllText(file));
    Check(!((Dictionary<string, object>)at(j, "assets")).ContainsKey("SoulEchoes") &&
      Array.Exists((object[])at(j, "errors"), e => ((string)e).StartsWith("SoulEchoes:")) && Refs.Live == 0,
      "an unavailable inventory is reported and not mistaken for zero owned Echoes");

    assets["PackItems"] = D();
    assets["EmblemGridMap"] = D(1L, D());
    assets["EmblemSystemSchemeInfo"] = D("currentPlan", 0L, "emblemPlans", D(0L, D()));
    ExportRun.Run();
    j = (Dictionary<string, object>)new JavaScriptSerializer { MaxJsonLength = int.MaxValue }.DeserializeObject(File.ReadAllText(file));
    souls = at(at(j, "assets"), "SoulEchoes");
    Check(((Dictionary<string, object>)at(souls, "items")).Count == 0 &&
      ((Dictionary<string, object>)at(souls, "plans")).Count == 1 && Result.Contains("Soul Echoes: 0 items / 1 plans") && Refs.Live == 0,
      "a loaded empty inventory still exports its empty plan and releases every reference");
    Console.WriteLine("B  " + checks + " checks passed");
    return 0;
  }
}
`;
{
  const exe = compile('B', `${harness}\npublic static class ExportRun { public static void Run() {\n${hosted}\n} }\n`, ['/reference:System.Web.Extensions.dll', '/target:exe']);
  const r = run(exe, []);
  assert.equal(r.code, 0, `B failed:\n${r.out}`);
  process.stdout.write(r.out);
}

// ---- C: the shape predicates against the real xLua types ----
{
  const block = /\/\/ SHAPES-BEGIN\n([\s\S]*?)\n\s*\/\/ SHAPES-END/.exec(script)?.[1];
  assert.ok(block, 'the script has a SHAPES block');
  const source = String.raw`
using System;
using System.IO;
using System.Reflection;
public static class ShapeCheck {
  public static int Main(string[] args) {
    var managed = args[0];
    AppDomain.CurrentDomain.ReflectionOnlyAssemblyResolve += (s, e) => {
      var p = Path.Combine(managed, e.Name.Split(',')[0] + ".dll");
      return File.Exists(p) ? Assembly.ReflectionOnlyLoadFrom(p) : Assembly.ReflectionOnlyLoad(e.Name);
    };
    var asm = Assembly.ReflectionOnlyLoadFrom(Path.Combine(managed, "Assembly-CSharp.dll"));
    Console.WriteLine("C  Assembly-CSharp MVID " + asm.ManifestModule.ModuleVersionId);
${block}
    var wanted = new[] { new[] { "LA_LuaManager", "get" }, new[] { "Obf_R.Obf_ff", "get" }, new[] { "Obf_R.Obf_ff", "each" }, new[] { "Obf_R.Obf_Ef", "call" } };
    var bad = 0;
    foreach (var w in wanted) {
      var type = asm.GetType(w[0], false);
      var m = type == null ? null : shape(type, w[1]);
      Console.WriteLine("   " + w[0] + " " + w[1] + " -> " + (m == null ? "NOT FOUND" : m.Name + " (" + m + ")"));
      if (m == null) bad++;
    }
    // the shapes must reject their look-alikes: a function is not a table, and the manager has no ForEach
    if (shape(asm.GetType("Obf_R.Obf_Ef"), "get") != null || shape(asm.GetType("Obf_R.Obf_Ef"), "each") != null || shape(asm.GetType("LA_LuaManager"), "each") != null || shape(asm.GetType("LA_LuaManager"), "call") != null) { Console.WriteLine("   a shape matched a type it must not"); bad++; }
    return bad;
  }
}
`;
  const exe = compile('C', source, ['/target:exe']);
  const r = run(exe, [managed]);
  process.stdout.write(r.out);
  assert.equal(r.code, 0, 'C: the shapes did not find the xLua members of the client\'s Assembly-CSharp.dll');
}

fs.rmSync(work, { recursive: true, force: true });
console.log('export script checks passed');
