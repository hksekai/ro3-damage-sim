# RO3 Damage Simulator

A damage and stat simulator for Ragnarok Online 3. It covers stats, gear, cards, pets, talents, Soul Echoes and Divine Totems, and simulates skill rotations against a monster or training dummy.
The formulas follow the `ro3emu-server` emulator, and the game tables are taken from the client config.

Community R&D project. The page embeds data derived from the game client: keep the repository private and do not redistribute it outside the community.
Skill, card and pet icons are not included: the page loads them from [wiki.ro3.cc](https://wiki.ro3.cc).

## Use it

No install needed. `ro3-damage-sim.html` is self-contained (engine, UI and game data in one file):

- Open `ro3-damage-sim.html` in Chrome, Edge or Firefox, or
- Serve it: `npm run serve`, then open http://127.0.0.1:8080/ro3-damage-sim.html

Builds are saved in your browser's local storage.

### Import your character

`ro3-export-character.cs` reads your character from the running game, without sending anything to the server. Run it in a [Unity Explorer](https://github.com/yukieiji/UnityExplorer) C# console while in the world.
It writes `Desktop\RO3 Character Exports\ro3-character.json`. Load that file with **Import character** in the page.
`unity-explorer-snippets.cs` contains other read-only console snippets.

## Develop

Requires Node.js 22 or newer.

| Command | What it does |
|---|---|
| `npm test` | Runs the page's import/state and simulation checks (`check-character-import.mjs`), plus the engine self-test when the config tables are available (see Game data). |
| `npm run build` | Regenerates the engine and data blocks of `ro3-damage-sim.html` (needs the config tables, see below). |
| `node check-export-character.mjs --client <Client folder>` | Compiles and checks the character exporter against the game DLLs. |
| `node ro3-rates-inspector.mjs` | Prints drop, card, pet hatching and lottery rates. |

`ro3-damage-optimizer.mjs` is the engine. `build-ro3-sim.mjs` inlines it into the page together with the game tables, and checks them. UI code is edited directly in `ro3-damage-sim.html`. The build only rewrites the engine and data blocks.

### Game data

The build and the rates inspector read the client's exported config tables (`*.json`) from `RO3_CONFIG_DIR`. The default is `..\ro3emu-server\data\config`, next to this folder.

```powershell
$env:RO3_CONFIG_DIR = 'D:\path\to\data\config'; npm run build
```

`ro3-skill-timing.json` (skill hit and cancel timings) is produced from the client's skill scripts by:

```powershell
npm install; node extract-skill-timing.mjs '<Client>\ro3_Data\StreamingAssets\Recovery\LuaPayload\Config\Skill'
```

`catalog-*.md` / `.tsv` are searchable item and skill ID lists.

## Known limits

- Divine Totem execute effects (below 30% target HP) are not simulated: the target stays at full HP. Healing, shields and PvP effects are not simulated either.
- The numbers are only as good as the emulator's reading of the game. Report differences you measure in game, with a screenshot.

## Deploy (maintainer)

`deploy-azure.ps1` publishes the page to Azure Static Web Apps. It needs `az login` and access to the `rg-ro3-damage-sim` resource group.
