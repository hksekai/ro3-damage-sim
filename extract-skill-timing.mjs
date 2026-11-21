#!/usr/bin/env node
/**
 * One-off tool: reads the client's skill templates (Config/Skill/skill_<scriptShow>.lua.bytes, obfuscated Lua 5.4 chunks) and
 * writes ro3-skill-timing.json: { scriptShow: [chant, end, interrupt, [hit points]] }, all in seconds on the template timeline.
 * The simulator uses it to place every hit of a cast and to know when a cast's backswing can be cancelled.
 *
 * Needs a Lua VM: `npm i wasmoon` (only this tool; the simulator itself stays dependency-free).
 *   node extract-skill-timing.mjs [<Client>/ro3_Data/StreamingAssets/Recovery/LuaPayload/Config/Skill] [out.json]
 *
 * De-obfuscation = tools/LuaDecode of ro3emu-server: signature 0x1E -> 0x1B, every instruction XOR (sizecode << 16 | sizecode)
 * with the client's opcode order mapped back to stock Lua 5.4, string payloads un-chained.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LuaFactory } from 'wasmoon';

const here = path.dirname(fileURLToPath(import.meta.url));
const inDir = process.argv[2] ?? (process.env.RO3_CLIENT_DIR && path.join(process.env.RO3_CLIENT_DIR, 'ro3_Data', 'StreamingAssets', 'Recovery', 'LuaPayload', 'Config', 'Skill'));
if (!inDir) throw new Error('Pass the client Config\\Skill folder, or set RO3_CLIENT_DIR to your client folder.');
const outFile = process.argv[3] ?? path.join(here, 'ro3-skill-timing.json');

// client opcode -> stock Lua 5.4 opcode
const OP = Uint8Array.from({ length: 128 }, (_, i) => (i >= 1 && i <= 20 ? i + 33 : i >= 21 && i <= 53 ? i - 20 : i === 83 ? 12 : i));

function decode(buf) {
  const d = Buffer.from(buf);
  let p = 0;
  const varint = () => {
    let x = 0;
    for (let b = 0; (b & 0x80) === 0; ) { b = d[p++]; x = x * 128 + (b & 0x7f); }
    return x;
  };
  const skip = (size) => { const n = varint(); p += size * n; };
  const str = () => {
    const n = varint() - 1;
    if (n < 0) return;
    for (let k = n - 1; k >= 1; k--) d[p + k] ^= d[p + k - 1];
    if (n > 0) d[p] ^= n & 0xff;
    p += n;
  };
  const fn = () => {
    str(); varint(); varint(); p += 3;
    const sizecode = varint();
    const key = ((sizecode << 16) | sizecode) >>> 0;
    for (let i = 0; i < sizecode; i++, p += 4) {
      const w = (d.readUInt32LE(p) ^ key) >>> 0;
      if ((w & 0x7f) > 83) throw new Error(`unknown opcode ${w & 0x7f}`);
      d.writeUInt32LE(((w & ~0x7f) | OP[w & 0x7f]) >>> 0, p);
    }
    for (let i = varint(); i > 0; i--) {
      const tag = d[p++];
      if (tag === 3 || tag === 0x13) p += 8;
      else if (tag === 4 || tag === 0x14) str();
      else if (tag !== 0 && tag !== 1 && tag !== 0x11) throw new Error(`constant tag ${tag}`);
    }
    skip(3); // upvalues
    for (let i = varint(); i > 0; i--) fn();
    skip(1); // lineinfo
    for (let i = varint(); i > 0; i--) { varint(); varint(); }
    for (let i = varint(); i > 0; i--) { str(); varint(); varint(); }
    for (let i = varint(); i > 0; i--) str();
  };
  if (d[0] !== 0x1e && d[0] !== 0x1b) throw new Error(`signature ${d[0]}`);
  d[0] = 0x1b;
  p = 32;
  fn();
  if (p !== d.length) throw new Error(`trailing bytes ${p}/${d.length}`);
  return new Uint8Array(d);
}

const factory = new LuaFactory();
const ids = [];
for (const f of fs.readdirSync(inDir).filter((f) => /^skill_\d+\.lua\.bytes$/.test(f))) {
  const id = Number(f.match(/\d+/)[0]);
  await factory.mountFile(`/skill_${id}.luac`, decode(fs.readFileSync(path.join(inDir, f))));
  ids.push(id);
}
const lua = await factory.createEngine();
await lua.doString(`
function timing(path)
  local _, t = next((assert(loadfile(path, "b")))())
  local time = t.m_kState and t.m_kState.Time or {}
  local pts = {}
  for i, p in ipairs(t.m_kAtkPoints or {}) do pts[i] = string.format("%.6g", p) end
  return string.format("[%.6g,%.6g,%.6g,[%s]]", time[2] or 0, time[3] or t.m_fTotalTime or 1, t.m_fInterruptTime or 0, table.concat(pts, ","))
end`);
const timing = lua.global.get('timing');
const rows = ids.sort((a, b) => a - b).map((id) => `"${id}":${timing(`/skill_${id}.luac`)}`);
fs.writeFileSync(outFile, `{\n${rows.join(',\n')}\n}\n`);
console.log(`${rows.length} templates -> ${outFile}`);
lua.global.close();
