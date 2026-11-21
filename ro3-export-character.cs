// RO3 character capture for the damage utility.
// READ-ONLY: reads GetAssetData and writes Desktop\RO3 Character Exports\ro3-character.json. No server messages.
// In the world, open this file in a fresh Unity Explorer C# tab and run (Ctrl+Enter).
// Obfuscated xLua members are discovered by shape, not name.
// Identifying keys are omitted (SKIP); Soul Echo and Totem plans use anonymous item references.
System.Func<string> ro3Export = () =>
{
    // SHAPES-BEGIN
    var bf = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.DeclaredOnly;
    // Match getter, enumerator and call signatures.
    System.Func<System.Type, string, System.Reflection.MethodInfo> shape = (type, kind) =>
    {
        foreach (var m in type.GetMethods(bf))
        {
            var ga = m.IsGenericMethodDefinition ? m.GetGenericArguments() : new System.Type[0];
            var ps = m.GetParameters();
            if (ps.Length != 1) continue;
            var p = ps[0].ParameterType;
            if (kind == "get" && ga.Length == 1 && m.ReturnType == ga[0] && p.FullName == "System.String") return m;
            if (kind == "each" && ga.Length == 2 && p.IsGenericType && p.GetGenericTypeDefinition().FullName == "System.Action`2" && p.GetGenericArguments()[0] == ga[0] && p.GetGenericArguments()[1] == ga[1]) return m;
            if (kind == "call" && ga.Length == 0 && p.FullName == "System.Object[]" && m.ReturnType.FullName == "System.Object[]") return m;
        }
        return null;
    };
    // SHAPES-END
    var manager = UnityEngine.Object.FindObjectOfType<LA_LuaManager>(); // HOST:manager
    var build = typeof(LA_LuaManager).Module.ModuleVersionId.ToString() + " / Unity " + UnityEngine.Application.unityVersion; // HOST:build
    var dir = System.IO.Path.Combine(System.Environment.GetFolderPath(System.Environment.SpecialFolder.DesktopDirectory), "RO3 Character Exports"); // HOST:dir
    var obj = typeof(object);
    var inv = System.Globalization.CultureInfo.InvariantCulture;
    var globalGet = manager == null ? null : shape(manager.GetType(), "get");
    if (globalGet == null) throw new System.InvalidOperationException("Lua manager unavailable; enter the world first.");
    globalGet = globalGet.MakeGenericMethod(obj);
    System.Func<string, object> glob = n => globalGet.Invoke(manager, new object[] { n });
    var location = glob("ServerLocation");
    if (location == null) throw new System.InvalidOperationException("Server registry unavailable; enter the world first.");
    var tableType = location.GetType();
    var sGet = shape(tableType, "get");
    var sEach = shape(tableType, "each");
    if (sGet == null || sEach == null) throw new System.MissingMethodException("Unsupported Lua table API shape.");
    var getT = sGet.MakeGenericMethod(obj);
    var eachT = sEach.MakeGenericMethod(obj, obj);
    System.Func<object, string, object> field = (t, k) => t == null ? null : getT.Invoke(t, new object[] { k });
    System.Action<object> free = o => { var d = o as System.IDisposable; if (d != null) d.Dispose(); };
    var servers = field(location, "m_tServersMap");
    var assets = field(servers, "LC_AssetManager");
    var ask = field(assets, "GetAssetData");
    var call = ask == null ? null : shape(ask.GetType(), "call");
    if (call == null) throw new System.InvalidOperationException("Asset manager unavailable; enter the world first.");
    System.Func<object[], object> query = a => { var r = (object[])call.Invoke(ask, new object[] { a }); return r != null && r.Length > 0 ? r[0] : null; };

    var skip = new System.Text.RegularExpressions.Regex("name|account|nick|owner|creat|guid|uid|unique|instance|bind|role.?id|player.?id|token|mail|phone|openid|^__", System.Text.RegularExpressions.RegexOptions.IgnoreCase); // SKIP
    var sb = new System.Text.StringBuilder();
    int nodes = 0, cut = 0;
    System.Action<string> quote = s =>
    {
        sb.Append('"');
        foreach (var c in s)
        {
            if (c == '"' || c == '\\') sb.Append('\\').Append(c);
            else if (c < ' ') sb.Append("\\u").Append(((int)c).ToString("x4"));
            else sb.Append(c);
        }
        sb.Append('"');
    };
    System.Action<object, int> write = null;
    write = (v, depth) =>
    {
        if (v == null) sb.Append("null");
        else if (v is bool) sb.Append((bool)v ? "true" : "false");
        else if (v is string) quote((string)v);
        else if (v is double || v is float)
        {
            var d = System.Convert.ToDouble(v);
            sb.Append(double.IsNaN(d) || double.IsInfinity(d) ? "null" : d.ToString("R", inv));
        }
        else if (v.GetType().IsPrimitive) sb.Append(System.Convert.ToString(v, inv));
        else if (v.GetType() == tableType)
        {
            if (depth > 9 || nodes > 80000) { cut++; sb.Append("null"); return; }
            sb.Append('{');
            var first = true;
            eachT.Invoke(v, new object[] { new System.Action<object, object>((k, x) =>
            {
                var key = System.Convert.ToString(k, inv);
                var data = x is bool || x is string || (x != null && (x.GetType().IsPrimitive || x.GetType() == tableType));
                if (data && !skip.IsMatch(key))
                {
                    if (!first) sb.Append(',');
                    first = false;
                    nodes++;
                    quote(key);
                    sb.Append(':');
                    write(x, depth + 1);
                }
                free(x);
            }) });
            sb.Append('}');
        }
        else sb.Append("null");
    };

    var soulStatus = "NOT captured; see errors";
    var totemStatus = soulStatus;
    System.Action<object, System.Action<object, object>> each = (t, visit) =>
    {
        if (t == null || t.GetType() != tableType) throw new System.InvalidOperationException("Inventory data is not a loaded Lua table.");
        eachT.Invoke(t, new object[] { new System.Action<object, object>((k, v) => { try { visit(k, v); } finally { free(v); } }) });
    };
    System.Func<object, string> itemKey = v =>
    {
        long id;
        if (v == null || ((v is double || v is float) && System.Math.Abs(System.Convert.ToDouble(v)) > 9007199254740991.0) ||
            !long.TryParse(System.Convert.ToString(v, inv), System.Globalization.NumberStyles.Integer, inv, out id) || id < 0)
            throw new System.InvalidOperationException("An item reference is missing or not losslessly readable.");
        return id.ToString(inv);
    };
    System.Action<bool> writeLoadout = totem =>
    {
        object packs = null, grid = null, scheme = null, packEnum = null, plans = null;
        int beforeCut = cut;
        var refs = new System.Collections.Generic.Dictionary<string, string>();
        try
        {
            packs = query(new object[] { assets, "PackItems" });
            grid = query(new object[] { assets, totem ? "TotemGridData" : "EmblemGridMap" });
            scheme = query(new object[] { assets, totem ? "TotemSystemSchemeInfo" : "EmblemSystemSchemeInfo" });
            packEnum = glob("enum_packType");
            var pack = field(packEnum, totem ? "PackType_Totem" : "PackType_Emblem");
            if (pack == null || grid == null || scheme == null)
                throw new System.InvalidOperationException("Inventory/plans are not loaded; enter the world and open this system first.");
            sb.Append("{\"items\":{");
            System.Action<object, object> item = (k, v) =>
            {
                var entry = field(v, "iItemId");
                if (entry == null || System.Convert.ToInt64(entry, inv) == 0) return;
                var raw = field(v, "iInstanceId");
                string id;
                try { id = itemKey(raw); } finally { free(raw); }
                if (id == "0") throw new System.InvalidOperationException("An item has no instance reference.");
                if (refs.ContainsKey(id)) return;
                var detail = field(v, totem ? "kTotemInfo" : "kEmblemInfo");
                try { if (detail == null) throw new System.InvalidOperationException("An item has no parsed details."); }
                finally { free(detail); }
                var key = (totem ? "totem-" : "echo-") + (refs.Count + 1).ToString(inv);
                if (refs.Count > 0) sb.Append(',');
                refs.Add(id, key);
                quote(key); sb.Append(':'); write(v, 0);
            };
            each(packs, (k, v) => { if (System.Convert.ToString(k, inv) == System.Convert.ToString(pack, inv)) each(v, item); });
            each(grid, item);
            sb.Append("},\"currentPlan\":");
            var current = field(scheme, "currentPlan");
            if (current == null) throw new System.InvalidOperationException("The current plan is missing.");
            write(current, 0);
            sb.Append(",\"plans\":{");
            plans = field(scheme, totem ? "totemPlans" : "emblemPlans");
            var indices = new System.Collections.Generic.HashSet<string>();
            each(plans, (k, v) =>
            {
                int index;
                if (!int.TryParse(System.Convert.ToString(k, inv), out index) || index < 0)
                    throw new System.InvalidOperationException("A plan index is invalid.");
                if (indices.Count > 0) sb.Append(',');
                var key = index.ToString(inv);
                if (!indices.Add(key)) throw new System.InvalidOperationException("Duplicate plan index.");
                quote(key); sb.Append(":{\"slots\":{");
                var slots = field(v, totem ? "setUpTotem" : "setUpEmblem");
                bool anySlot = false;
                try
                {
                    if (slots != null) each(slots, (slot, guid) =>
                    {
                        var id = itemKey(guid);
                        if (id == "0") return;
                        int pos;
                        if (!int.TryParse(System.Convert.ToString(slot, inv), out pos) || pos < 1 || !refs.ContainsKey(id))
                            throw new System.InvalidOperationException("A slot is invalid or references an item missing from the loaded inventory.");
                        if (anySlot) sb.Append(',');
                        anySlot = true;
                        quote(pos.ToString(inv)); sb.Append(':'); quote(refs[id]);
                    });
                }
                finally { free(slots); }
                sb.Append("}}");
            });
            if (!indices.Contains(System.Convert.ToString(current, inv)))
                throw new System.InvalidOperationException("The active plan is not loaded.");
            if (cut != beforeCut) throw new System.InvalidOperationException("Item details exceeded the export limits.");
            sb.Append("}}");
            var status = refs.Count + " items / " + indices.Count + " plans";
            if (totem) totemStatus = status; else soulStatus = status;
        }
        finally { free(plans); free(packEnum); free(scheme); free(grid); free(packs); }
    };

    // Native assets and portable loadouts.
    var wanted = new string[][]
    {
        new[] { "PlayerBasicInfo", "career", "level", "jobLevel" }, new[] { "ProfessionInfo" },
        new[] { "PlayerAttrSumPoint", "allPlanBaseProperty", "curPlanIndex" }, new[] { "RoleAllProperty", "BaseAttributeInfo", "BasicAttributeInfo" },
        new[] { "EquipGearDataMap" }, new[] { "EquipStrengthenData" }, new[] { "EquipSystemSchemeInfo", "currentPlan" }, new[] { "EquipGridCardMap" },
        new[] { "PetInfo" }, new[] { "PetSetUpInfo", "currentPlan", "setupPlans" }, new[] { "SeasonTalentData" }, new[] { "SeasonTalentPlanInfo" },
        new[] { "ServerAllSkills" }, new[] { "ServerSkillDevelopInfo", "currentPlanIndex", "skillAssignPlans" },
        new[] { "SoulEchoes" }, new[] { "DivineTotems" }, new[] { "TotemExp" },
        new[] { "LibraryInfo" }, new[] { "SeasonRefineData" }, new[] { "WardrobeInfo" },
        new[] { "AllMountData" }, new[] { "ActivationMounts" },
    };
    var enums = new[] { "enum_EquipGridType", "enum_EquipPosType", "enum_CardPosType", "enum_CardType", "enum_unitAttrMap" };
    var missing = new System.Collections.Generic.List<string>();
    var errors = new System.Collections.Generic.List<string>();
    sb.Append("{\"format\":\"ro3-character/1\",\"captureVersion\":2,\"exportedAt\":\"").Append(System.DateTime.UtcNow.ToString("o", inv)).Append("\",\"build\":");
    quote(build);
    sb.Append(",\"enums\":{");
    var any = false;
    foreach (var name in enums)
    {
        var e = glob(name);
        if (e == null) { missing.Add(name); continue; }
        if (any) sb.Append(',');
        any = true;
        quote(name);
        sb.Append(':');
        write(e, 0);
        free(e);
    }
    sb.Append("},\"assets\":{");
    any = false;
    foreach (var req in wanted)
    {
        var mark = sb.Length;
        try
        {
            if (any) sb.Append(',');
            quote(req[0]);
            sb.Append(':');
            var have = false;
            if (req[0] == "SoulEchoes" || req[0] == "DivineTotems") { writeLoadout(req[0] == "DivineTotems"); have = true; }
            else if (req.Length == 1)
            {
                var t = query(new object[] { assets, req[0] });
                if (t != null) { write(t, 0); free(t); have = true; }
            }
            else
            {
                sb.Append('{');
                for (var i = 1; i < req.Length; i++)
                {
                    var t = query(new object[] { assets, req[0], req[i] });
                    if (t == null) continue;
                    if (have) sb.Append(',');
                    have = true;
                    quote(req[i]);
                    sb.Append(':');
                    write(t, 0);
                    free(t);
                }
                sb.Append('}');
            }
            if (have) any = true; else { sb.Length = mark; missing.Add(req[0]); }
        }
        catch (System.Exception ex) { sb.Length = mark; errors.Add(req[0] + ": " + ex.GetBaseException().Message); }
    }
    sb.Append("},\"missing\":[");
    for (var i = 0; i < missing.Count; i++) { if (i > 0) sb.Append(','); quote(missing[i]); }
    sb.Append("],\"errors\":[");
    for (var i = 0; i < errors.Count; i++) { if (i > 0) sb.Append(','); quote(errors[i]); }
    sb.Append("],\"limitations\":[\"The panel includes current buffs. Buff timers, proc state and unexposed server bonuses are not separately captured.\"],\"truncated\":").Append(cut).Append('}');
    free(ask); free(assets); free(servers); free(location);
    var path = System.IO.Path.Combine(dir, "ro3-character.json");
    if (!System.IO.Path.IsPathRooted(dir)) throw new System.IO.IOException("Desktop folder is unavailable.");
    System.IO.Directory.CreateDirectory(dir);
    System.IO.File.WriteAllText(path, sb.ToString(), new System.Text.UTF8Encoding(false));
    return "RO3 character export: " + path + " (" + (sb.Length / 1024) + " KB, " + nodes + " values; Soul Echoes: " + soulStatus +
        "; Divine Totems: " + totemStatus +
        (missing.Count > 0 ? "; not found: " + string.Join(", ", missing.ToArray()) : "") + (errors.Count > 0 ? "; errors: " + errors.Count : "") + ")";
};
UnityExplorer.ExplorerCore.Log(ro3Export()); // HOST:log
