import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'public', 'heroes');
const heroes = ['juggernaut', 'nevermore', 'crystal_maiden', 'axe', 'windrunner', 'invoker'];
await mkdir(destination, { recursive: true });
await Promise.all(heroes.flatMap(hero => ['', '-render'].map(async suffix => {
  const file = path.join(destination, `${hero}${suffix}.png`);
  try { if ((await stat(file)).size > 0) return; } catch {}
  const media = suffix ? 'videos/dota_react/heroes/renders' : 'images/dota_react/heroes';
  const url = `https://cdn.steamstatic.com/apps/dota2/${media}/${hero}.png`;
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Artwork download failed: ${hero}${suffix} (${response.status})`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  console.log(`Downloaded ${hero}${suffix}.png`);
})));
