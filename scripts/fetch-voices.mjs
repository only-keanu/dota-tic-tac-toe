import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { HERO_VOICES, VICTORY_VOICES } from "../lib/voices.mjs";

const root = new URL("../public/", import.meta.url);
const repository = "https://huggingface.co/datasets/Sqls1/dota2-sounds";
let revision;
try {
  revision = JSON.parse(await readFile(new URL("audio/voices/SOURCES.json", root))).revision;
} catch {}
if (!revision) {
  const metadata = await (await fetch("https://huggingface.co/api/datasets/Sqls1/dota2-sounds")).json();
  revision = metadata.sha;
}
if (!revision) throw new Error("Cannot resolve voice source revision");
const sources = [];
for (const [hero, clips] of Object.entries({ ...HERO_VOICES, announcer: Object.values(VICTORY_VOICES) })) {
  for (const clip of clips) {
    const folder = hero === "crystal_maiden" ? "crystalmaiden" : hero;
    const source = `${repository}/resolve/${revision}/sounds/vo/${folder}/${clip.split("/").at(-1)}`;
    const destination = new URL(clip.slice(1), root);
    await mkdir(new URL("./", destination), { recursive: true });
    let bytes;
    try { bytes = await readFile(destination); } catch {}
    if (!bytes?.length) {
      const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`Voice download failed: ${source} (${response.status})`);
      bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 1000 || bytes.subarray(0, 100).toString().includes("<!DOCTYPE"))
        throw new Error(`Invalid audio: ${source}`);
      await writeFile(destination, bytes);
    }
    sources.push({ hero, clip, source, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
  }
}
await writeFile(new URL("audio/voices/SOURCES.json", root), JSON.stringify({
  credit: "Dota 2 and original hero voice recordings © Valve Corporation. Unofficial fan project.",
  repository, revision, sources,
}, null, 2) + "\n");
console.log(`Bundled ${sources.length} voice clips in ${fileURLToPath(new URL("audio/voices/", root))}`);
