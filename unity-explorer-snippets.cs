// ============================================================================
// RO3 UnityExplorer C# REPL Snippets (for the RO3 damage simulator)
// Paste any section into the UnityExplorer C# Console.
// ============================================================================

using System;
using System.Collections.Generic;
using UnityEngine;
using LuaTable = Obf_R.Obf_ff;
using LuaFunction = Obf_R.Obf_Ef;

public static class Ro3ExplorerTools
{
    private static LA_LuaManager Lua => UnityEngine.Object.FindObjectOfType<LA_LuaManager>();

    private static LuaTable Require(string module)
    {
        using (var req = Lua.Obf_oD<LuaFunction>("require"))
        {
            var res = req.Obf_HuA(new object[] { module });
            return res != null && res.Length > 0 ? res[0] as LuaTable : null;
        }
    }

    // ------------------------------------------------------------------------
    // 1. DIRECT WIRE SKILL CAST (Bypasses Hotbar & Client Cooldown Prechecks)
    // ------------------------------------------------------------------------
    // Sends CastSkillReq (msgId 31102 / ProtobufNameMap.USE_SKILL_REQ) directly
    // via NW_Helper.SendMessage without needing the skill in any hotbar slot
    // and without calling CheckIsSkillCD on the client.
    // On local ro3emu-server, type "!nocd" in chat to also disable server CD +
    // action-tail lock (SkillBusy).
    // ------------------------------------------------------------------------
    public static void CastRawSkill(int skillId, long targetId = 0, bool selfTarget = false, bool autoCast = false)
    {
        var lua = Lua;
        if (lua == null) { Debug.LogWarning("[Ro3Tools] LA_LuaManager not ready."); return; }

        using (var unitMgr = lua.Obf_oD<LuaTable>("LC_UnitManager"))
        using (var selector = lua.Obf_oD<LuaTable>("LC_SelectorManager"))
        using (var nwHelper = lua.Obf_oD<LuaTable>("NW_Helper"))
        using (var pbMap = lua.Obf_oD<LuaTable>("ProtobufNameMap"))
        {
            var pRes = unitMgr.Obf_RuA<LuaFunction>("GetLocalPlayer").Obf_HuA(new object[] { unitMgr });
            using (var player = pRes != null && pRes.Length > 0 ? pRes[0] as LuaTable : null)
            {
                if (player == null) { Debug.LogWarning("[Ro3Tools] LocalPlayer not in world."); return; }
                long selfId = Convert.ToInt64(player.Obf_RuA<object>("m_kUUID"));
                Transform pTrans = player.Obf_RuA<Transform>("transform");
                Vector3 pos = pTrans != null ? pTrans.position : Vector3.zero;
                float face = pTrans != null ? pTrans.eulerAngles.y : 0f;

                if (selfTarget)
                {
                    targetId = selfId;
                }
                else if (targetId == 0 && selector != null)
                {
                    var sRes = selector.Obf_RuA<LuaFunction>("GetSelectUnit").Obf_HuA(new object[] { selector });
                    using (var sel = sRes != null && sRes.Length > 0 ? sRes[0] as LuaTable : null)
                    {
                        if (sel != null)
                        {
                            targetId = Convert.ToInt64(sel.Obf_RuA<object>("m_kUUID"));
                            Transform tTrans = sel.Obf_RuA<Transform>("transform");
                            if (tTrans != null) pos = tTrans.position;
                        }
                    }
                }

                using (var req = lua.Obf_jD().Obf_wTA())
                using (var tPos = lua.Obf_jD().Obf_wTA())
                {
                    tPos.Obf_luA<string, float>("x", pos.x);
                    tPos.Obf_luA<string, float>("y", pos.y);
                    tPos.Obf_luA<string, float>("z", pos.z);

                    req.Obf_luA<string, int>("skillId", skillId);
                    req.Obf_luA<string, long>("targetId", targetId);
                    req.Obf_luA<string, LuaTable>("targetPos", tPos);
                    req.Obf_luA<string, float>("face", face);
                    req.Obf_luA<string, bool>("isExtraSkill", false);
                    req.Obf_luA<string, bool>("isAutoCast", autoCast);
                    req.Obf_luA<string, int>("comboIndex", 0);

                    object msgName = pbMap.Obf_RuA<object>("USE_SKILL_REQ");
                    using (var send = nwHelper.Obf_RuA<LuaFunction>("SendMessage"))
                    {
                        send.Obf_HuA(new object[] { msgName, req });
                        Debug.Log($"[Ro3Tools] Sent raw USE_SKILL_REQ (31102): skillId={skillId}, targetId={targetId}, pos={pos}, face={face:F1}");
                    }
                }
            }
        }
    }

    // ------------------------------------------------------------------------
    // 2. DUMP ALL NEARBY AOI ENTITIES (Players, Monsters, Pets/Summons & Owners)
    // ------------------------------------------------------------------------
    public static void DumpAoiUnits()
    {
        var lua = Lua;
        using (var unitMgr = lua.Obf_oD<LuaTable>("LC_UnitManager"))
        {
            var instRes = unitMgr.Obf_RuA<LuaFunction>("GetInstance").Obf_HuA(new object[] { unitMgr });
            using (var inst = instRes != null && instRes.Length > 0 ? instRes[0] as LuaTable : null)
            using (var dict = inst?.Obf_RuA<LuaTable>("m_kUnitDic"))
            {
                if (dict == null) { Debug.LogWarning("[Ro3Tools] m_kUnitDic unavailable."); return; }
                int count = 0;
                dict.Obf_OuA<object, object>((k, v) =>
                {
                    var u = v as LuaTable;
                    if (u == null) return;
                    try
                    {
                        long uid = Convert.ToInt64(k);
                        object typeObj = u.Obf_RuA<object>("m_iUnitTypeEnum");
                        object ownerObj = u.Obf_RuA<object>("m_ownerId");
                        var nameFn = u.Obf_RuA<LuaFunction>("GetUnitName");
                        var nRes = nameFn?.Obf_HuA(new object[] { u });
                        string name = nRes != null && nRes.Length > 0 ? nRes[0] as string : "?";
                        nameFn?.Dispose();
                        Debug.Log($"[AOI Unit #{++count}] uid={uid} type={typeObj} owner={ownerObj} name={name}");
                    }
                    finally { u.Dispose(); }
    // ------------------------------------------------------------------------
    // 3. FORCE-OPEN GM PANEL, CAMERA PANEL, OR SCENE MODE PANEL
    // ------------------------------------------------------------------------
    public static void OpenGmPanel()
    {
        var lua = Lua;
        var ui = lua.Obf_oD<LuaTable>("Lua_UIManagerNewIns");
        var layers = lua.Obf_oD<LuaTable>("UILayers");
        var names = lua.Obf_oD<LuaTable>("UINames");
        var events = lua.Obf_oD<LuaTable>("LC_Event");
        var modId = lua.Obf_oD<LuaTable>("LC_ModuleId");
        var notifyId = lua.Obf_oD<LuaTable>("LC_NotifyId");
        var commonNotify = notifyId.Obf_RuA<LuaTable>("Common");

        // 1. Open UI_Sys_GMPanel on UILayers.SYSTEM_TIP (OpenPanelDefault does not work because GM panels have no default layer)
        ui.Obf_RuA<LuaFunction>("OpenPanel").Obf_HuA(new object[] {
            ui, layers.Obf_RuA<object>("SYSTEM_TIP"), names.Obf_RuA<object>("UI_Sys_GMPanel")
        });

        // 2. Dispatch FilmingState = null (exits filming mode, keeps all HUD UI visible, unhides GM button + binds NumpadPlus)
        events.Obf_RuA<LuaFunction>("DispatchEvent").Obf_HuA(new object[] {
            events, modId.Obf_RuA<object>("Common"), commonNotify.Obf_RuA<object>("FilmingState"), null
        });
    }

    // ------------------------------------------------------------------------
    // 4. CLIENT-SIDE GM FEATURES THAT WORK ON ANY SERVER (Even Unowned)
    // ------------------------------------------------------------------------
    // Enables the hidden "Extreme Auto-Attack" (frame-perfect backswing cancel)
    // and injects extra learned Skill IDs (beyond the 6 hotbar slots) into the
    // native Auto-Battle rotation list!
    // ------------------------------------------------------------------------
    public static void EnableExtremeAutoAndInjectSkills(params int[] extraSkillIds)
    {
        var lua = Lua;
        // A. Turn on built-in Extreme Auto-Battle (cancels skill backswing at earliest interruptible frame)
        using (var autoHelper = Require("lc_autoattackhelper"))
        {
            autoHelper.Obf_RuA<LuaFunction>("SetExtremeAutoEnabled").Obf_HuA(new object[] { true });
            Debug.Log("[Ro3Tools] SetExtremeAutoEnabled(true) -> active!");
        }

        // B. Inject extra learned skill IDs into the active Auto-Battle skill rotation (bypasses 6-slot hotbar cap)
        using (var sceneMgr = lua.Obf_oD<LuaTable>("LC_SceneManagerIns"))
        {
            var actorRes = sceneMgr.Obf_RuA<LuaFunction>("GetMyActor").Obf_HuA(new object[] { sceneMgr });
            using (var actor = actorRes != null && actorRes.Length > 0 ? actorRes[0] as LuaTable : null)
            using (var autoInput = actor?.Obf_RuA<LuaTable>("m_kAutoAttackInput"))
            using (var skillList = autoInput?.Obf_RuA<LuaTable>("m_kSkillList"))
            {
                if (skillList == null) { Debug.LogWarning("[Ro3Tools] Start Auto-Battle once first so m_kSkillList is initialized."); return; }
                int len = 0;
                skillList.Obf_OuA<object, object>((k, v) => { len++; });
                foreach (int sid in extraSkillIds)
                {
                    skillList.Obf_luA<int, int>(++len, sid);
                }
                Debug.Log($"[Ro3Tools] Injected {extraSkillIds.Length} extra off-hotbar skill(s) into m_kAutoAttackInput.m_kSkillList (total={len}).");
            }
        }
    }

    // ------------------------------------------------------------------------
    // 5. NAVIGATION, TELEPORT & REMOTE SHOP / UI HELPERS
    // ------------------------------------------------------------------------

    // A. Client-side A* Auto-Walk to any exact (x, y, z) on the current map (works on ANY server)
    public static void WalkToXYZ(float x, float y, float z)
    {
        var lua = Lua;
        using (var gmMock = Require("gmglobalmock"))
        using (var pos = lua.Obf_jD().Obf_wTA())
        {
            pos.Obf_luA<int, float>(1, x);
            pos.Obf_luA<int, float>(2, y);
            pos.Obf_luA<int, float>(3, z);
            gmMock.Obf_RuA<LuaFunction>("FindPathToXYZ").Obf_HuA(new object[] { pos });
            Debug.Log($"[Ro3Tools] A* pathfinding started to ({x}, {y}, {z})");
        }
    }

    // B. Jump to any Map's Born Point via 30012 SCENE_TELEPORT_REQ (no Butterfly Wing or Kafra fee)
    public static void TeleportToMapBorn(long targetMapId)
    {
        var lua = Lua;
        using (var nwHelper = lua.Obf_oD<LuaTable>("NW_Helper"))
        using (var pbMap = lua.Obf_oD<LuaTable>("ProtobufNameMap"))
        using (var req = lua.Obf_jD().Obf_wTA())
        {
            req.Obf_luA<string, long>("targetMapId", targetMapId);
            nwHelper.Obf_RuA<LuaFunction>("SendMessage").Obf_HuA(new object[] {
                pbMap.Obf_RuA<object>("SCENE_TELEPORT_REQ"), req
            });
            Debug.Log($"[Ro3Tools] Sent SCENE_TELEPORT_REQ (30012) -> targetMapId={targetMapId}");
        }
    }

    // C. Jump to a specific SceneEditor PointId on a map via 30131 CLIENT_CUSTOM_JUMP_MAP_REQ
    public static void JumpToScenePoint(long sceneId, long pointId)
    {
        var lua = Lua;
        using (var nwHelper = lua.Obf_oD<LuaTable>("NW_Helper"))
        using (var pbMap = lua.Obf_oD<LuaTable>("ProtobufNameMap"))
        using (var req = lua.Obf_jD().Obf_wTA())
        {
            req.Obf_luA<string, long>("sceneId", sceneId);
            req.Obf_luA<string, long>("pointId", pointId);
            nwHelper.Obf_RuA<LuaFunction>("SendMessage").Obf_HuA(new object[] {
                pbMap.Obf_RuA<object>("CLIENT_CUSTOM_JUMP_MAP_REQ"), req
            });
            Debug.Log($"[Ro3Tools] Sent CLIENT_CUSTOM_JUMP_MAP_REQ (30131) -> sceneId={sceneId}, pointId={pointId}");
        }
    }

    // D. Remote Buy from any NPC/Point Shop from anywhere (82332 SHOP_BUY_COMMODITY, no NPC distance check)
    public static void RemoteBuyCommodity(int commodityId, int count = 1)
    {
        var lua = Lua;
        using (var nwHelper = lua.Obf_oD<LuaTable>("NW_Helper"))
        using (var pbMap = lua.Obf_oD<LuaTable>("ProtobufNameMap"))
        using (var req = lua.Obf_jD().Obf_wTA())
        {
            req.Obf_luA<string, int>("commodityId", commodityId);
            req.Obf_luA<string, int>("count", count);
            req.Obf_luA<string, int>("price", 0); // server resolves authoritative price from ShopCommodityConfig
            nwHelper.Obf_RuA<LuaFunction>("SendMessage").Obf_HuA(new object[] {
                pbMap.Obf_RuA<object>("SHOP_BUY_COMMODITY"), req
            });
            Debug.Log($"[Ro3Tools] Sent remote SHOP_BUY_COMMODITY (82332): commodityId={commodityId} x{count}");
        }
    }

    // ------------------------------------------------------------------------
    // 6. QUEST FAST-FORWARD / AUTO-COMPLETE STEPPER (Works on Any Server)
    // ------------------------------------------------------------------------
    // Inspects all Running/Finished quests in AllTaskInfo and fires the exact
    // client-trusted completion packets (TaskService.cs:168-225):
    //   - 104003 (Enter Area)       -> 31209 CLIENT_ENTERAREA (no walking needed!)
    //   - 103046 (Interact/Gather)  -> 31214 TASK_TRIGGER_EVENT (no progress bar!)
    //   - 309002 (Cutscene/Plot)    -> 84011 PLOT_ACTING_TRIGGER_SCENE_EVENT
    //   - 106905 (Mini-game/Puzzle) -> 83651 TASK_GOODS_TASK
    //   - 104001 (NPC Dialogue)     -> 31208 CLIENT_NPCINTERACT (skips all chat lines!)
    //   - Status == Finish (3)      -> 31205 TASK_DELIVERY
    // ------------------------------------------------------------------------
    public static void FastForwardActiveQuests()
    {
        var lua = Lua;
        using (var taskHelper = Require("lc_taskhelper"))
        using (var nwHelper = lua.Obf_oD<LuaTable>("NW_Helper"))
        using (var pbMap = lua.Obf_oD<LuaTable>("ProtobufNameMap"))
        using (var unitFinder = lua.Obf_oD<LuaTable>("LC_UnitFinder"))
        using (var gmMock = Require("gmglobalmock"))
        {
            // Skip any active cutscene/story lock first
            gmMock?.Obf_RuA<LuaFunction>("GmSkipCutScene")?.Obf_HuA(new object[0]);

            var listRes = taskHelper.Obf_RuA<LuaFunction>("GetTaskListBySort").Obf_HuA(new object[0]);
            using (var list = listRes != null && listRes.Length > 0 ? listRes[0] as LuaTable : null)
            {
                if (list == null) { Debug.LogWarning("[Ro3Tools] No active task list."); return; }
                list.Obf_OuA<object, object>((idx, val) =>
                {
                    var task = val as LuaTable;
                    if (task == null) return;
                    try
                    {
                        long taskId = Convert.ToInt64(task.Obf_RuA<object>("id"));
                        int status = Convert.ToInt32(task.Obf_RuA<object>("status"));
                        if (status == 3) // TaskState_Finish -> Turn in immediately
                        {
                            taskHelper.Obf_RuA<LuaFunction>("SendTaskGetward").Obf_HuA(new object[] { taskId, 0 });
                            Debug.Log($"[QuestFastForward] Delivered finished task {taskId}");
                            return;
                        }
                        if (status != 2) return; // Only Running (2)

                        // Also trigger 30016 track teleport if the step has one
                        using (var trackReq = lua.Obf_jD().Obf_wTA())
                        {
                            trackReq.Obf_luA<string, long>("taskId", taskId);
                            nwHelper.Obf_RuA<LuaFunction>("SendMessage").Obf_HuA(new object[] {
                                pbMap.Obf_RuA<object>("TASK_TRACK_TELEPORT"), trackReq
                            });
                        }

                        var tRes = taskHelper.Obf_RuA<LuaFunction>("GetTaskProgressTarget").Obf_HuA(new object[] { taskId });
                        using (var targets = tRes != null && tRes.Length > 0 ? tRes[0] as LuaTable : null)
                        {
                            if (targets == null) return;
                            targets.Obf_OuA<object, object>((tIdx, tVal) =>
                            {
                                var t = tVal as LuaTable;
                                if (t == null) return;
                                try
                                {
                                    int tType = Convert.ToInt32(t.Obf_ruA<int, object>(1));
                                    long p1 = Convert.ToInt64(t.Obf_ruA<int, object>(2) ?? 0);
                                    long p2 = Convert.ToInt64(t.Obf_ruA<int, object>(3) ?? 0);
                                    long p3 = Convert.ToInt64(t.Obf_ruA<int, object>(4) ?? 0);

                                    if (tType == 104003) // TArea: [104003, mapId, areaId]
                                    {
                                        taskHelper.Obf_RuA<LuaFunction>("SendPointInArea").Obf_HuA(new object[] { p2 });
                                        Debug.Log($"[QuestFastForward] Task {taskId}: Sent CLIENT_ENTERAREA (area={p2})");
                                    }
                                    else if (tType == 103046) // TClientInteract: [103046, interactId, count]
                                    {
                                        taskHelper.Obf_RuA<LuaFunction>("OnTiggerTaskEvent").Obf_HuA(new object[] { p1, p2 });
                                        Debug.Log($"[QuestFastForward] Task {taskId}: Sent TASK_TRIGGER_EVENT (id={p1}, count={p2})");
                                    }
                                    else if (tType == 309002) // TPlot: [309002, plotId]
                                    {
                                        taskHelper.Obf_RuA<LuaFunction>("PlotActingTriggerReq").Obf_HuA(new object[] { p1 });
                                        Debug.Log($"[QuestFastForward] Task {taskId}: Sent PLOT_ACTING_END (plot={p1})");
                                    }
                                    else if (tType == 106905) // TPlaceGame
                                    {
                                        taskHelper.Obf_RuA<LuaFunction>("SendCompletePlaceGame").Obf_HuA(new object[0]);
                                        Debug.Log($"[QuestFastForward] Task {taskId}: Sent TASK_GOODS_TASK (place game)");
                                    }
                                    else if (tType == 104001) // TDialog: [104001, npcOrPointId, mapId, dialogId]
                                    {
                                        long npcUid = 0;
                                        var uRes = unitFinder.Obf_RuA<LuaFunction>("FindUnitByNpcConfigId").Obf_HuA(new object[] { unitFinder, p1 });
                                        using (var npcUnit = uRes != null && uRes.Length > 0 ? uRes[0] as LuaTable : null)
                                        {
                                            if (npcUnit != null) npcUid = Convert.ToInt64(npcUnit.Obf_RuA<object>("m_kUUID"));
                                        }
                                        using (var dReq = lua.Obf_jD().Obf_wTA())
                                        {
                                            dReq.Obf_luA<string, long>("npcUid", npcUid);
                                            dReq.Obf_luA<string, long>("areapointid", p1);
                                            dReq.Obf_luA<string, long>("dialogID", p3);
                                            nwHelper.Obf_RuA<LuaFunction>("SendMessage").Obf_HuA(new object[] {
                                                pbMap.Obf_RuA<object>("CLIENT_NPCINTERACT"), dReq
                                            });
                                            Debug.Log($"[QuestFastForward] Task {taskId}: Sent CLIENT_NPCINTERACT (npc={p1}/uid={npcUid}, dialog={p3})");
                                        }
                                    }
                                }
                                finally { t.Dispose(); }
                            });
                        }
                    }
                    finally { task.Dispose(); }
                });
            }
        }
    }
}
