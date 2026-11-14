// Original English, standard-hero recordings. See public/audio/voices/SOURCES.json.
const clips = (hero, names) => names.map((name) => `/audio/voices/${hero}/${name}.mp3`);

export const VICTORY_VOICES = {
  radiant: "/audio/voices/announcer/announcer_victory_rad.mp3",
  dire: "/audio/voices/announcer/announcer_victory_dire.mp3",
};

export const HERO_VOICES = {
  juggernaut: clips("juggernaut", ["jug_rare_01", "jug_rare_02", "jug_rare_03", "jug_rare_04", "jugg_taunt_01", "jugg_taunt_02"]),
  nevermore: clips("nevermore", ["nev_rare_01", "nev_rare_02", "nev_rare_03", "nev_rare_04", "nev_rare_05", "nev_spawn_04"]),
  crystal_maiden: clips("crystal_maiden", ["cm_rare_01", "cm_rare_02", "cm_rare_03", "cm_rare_04", "cm_spawn_03", "cm_spawn_04"]),
  axe: clips("axe", ["axe_rare_01", "axe_rare_02", "axe_rare_03", "axe_spawn_03", "axe_spawn_04", "axe_spawn_05"]),
  windrunner: clips("windrunner", ["wind_rare_01", "wind_rare_02", "wind_rare_03", "wind_rare_04", "wind_spawn_03", "wind_spawn_04"]),
  invoker: clips("invoker", ["invo_rare_01", "invo_rare_02", "invo_rare_03", "invo_rare_04", "invo_rare_05", "invo_spawn_04"]),
};
