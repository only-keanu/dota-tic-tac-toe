import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { ArenaAudio } from "../lib/audio.mjs";
import { HERO_VOICES, VICTORY_VOICES } from "../lib/voices.mjs";

class FakeAudio {
  static behavior = null;
  constructor(src) { this.src = src; this.paused = true; this.volume = 1; }
  play() {
    if (FakeAudio.behavior) return FakeAudio.behavior(this);
    this.paused = false;
    this.onplaying?.();
    return Promise.resolve();
  }
  pause() { this.paused = true; }
  load() {}
  removeAttribute(name) { if (name === "src") this.src = ""; }
}
beforeEach(() => { globalThis.Audio = FakeAudio; FakeAudio.behavior = null; });

test("each hero uses its own clips and never repeats its last spoken quote", async () => {
  const audio = new ArenaAudio();
  for (const [hero, clips] of Object.entries(HERO_VOICES)) {
    let previous;
    for (let i = 0; i < 20; i++) {
      assert.equal(await audio.playVoice(hero), true);
      assert.ok(clips.includes(audio.voice.src));
      assert.notEqual(audio.voice.src, previous);
      assert.equal(audio.voice.volume, 0.9);
      previous = audio.voice.src;
    }
  }
});

test("speech ducks music, follows slider changes and restores its latest volume", async () => {
  const audio = new ArenaAudio();
  await audio.start();
  await audio.playVoice("axe");
  assert.equal(audio.music.volume, 0.65 * 0.3);
  audio.setVolume(0.8);
  assert.equal(audio.music.volume, 0.8 * 0.3);
  audio.voice.onended();
  assert.equal(audio.music.volume, 0.8);
  assert.equal(audio.voice, null);
  await audio.playVoice("invoker");
  audio.setVolume(0);
  audio.stopVoice();
  assert.equal(audio.music.volume, 0);
});

test("interrupting speech ignores stale completion and error callbacks", async () => {
  const audio = new ArenaAudio();
  await audio.start();
  await audio.playVoice("juggernaut");
  const old = audio.voice, ended = old.onended, failed = old.onerror;
  await audio.playVoice("nevermore");
  const current = audio.voice;
  assert.equal(old.paused, true);
  ended(); failed();
  assert.equal(audio.voice, current);
  assert.equal(audio.music.volume, 0.65 * 0.3);
  current.onerror();
  assert.equal(audio.music.volume, 0.65);
});

test("blocked playback and unknown heroes do not leave music ducked", async () => {
  const audio = new ArenaAudio();
  await audio.start();
  FakeAudio.behavior = () => Promise.reject(new Error("NotAllowedError"));
  assert.equal(await audio.playVoice("axe"), false);
  assert.equal(audio.voice, null);
  assert.equal(audio.music.volume, 0.65);
  assert.equal(await audio.playVoice("missing"), false);
});

test("late play resolution or rejection cannot disturb a newer voice", async () => {
  for (const rejectOld of [false, true]) {
    const audio = new ArenaAudio();
    let settle;
    FakeAudio.behavior = () => new Promise((resolve, reject) => {
      settle = rejectOld ? () => reject(new Error("aborted")) : resolve;
    });
    const pending = audio.playVoice("axe");
    const old = audio.voice, playing = old.onplaying;
    FakeAudio.behavior = null;
    await audio.playVoice("invoker");
    const current = audio.voice;
    playing(); settle();
    assert.equal(await pending, false);
    assert.equal(audio.voice, current);
    assert.equal(audio.ducked, true);
    assert.equal(old.paused, true);
  }
});

test("stop and disposal cancel pending speech; preloads track selected heroes", async () => {
  const audio = new ArenaAudio();
  audio.preloadVoices(["axe", "invoker"]);
  assert.equal(audio.preloadedVoices.size, 14);
  audio.preloadVoices(["axe", "crystal_maiden"]);
  assert.equal(audio.preloadedVoices.size, 14);
  for (const src of Object.values(VICTORY_VOICES)) assert.ok(audio.preloadedVoices.has(src));
  assert.ok([...audio.preloadedVoices.keys()].every(src => !src.includes("invoker")));
  let resolve;
  FakeAudio.behavior = () => new Promise(done => { resolve = done; });
  const pending = audio.playVoice("axe");
  audio.stopVoice();
  resolve();
  assert.equal(await pending, false);
  audio.dispose();
  assert.equal(audio.preloadedVoices.size, 0);
  assert.equal(await audio.playVoice("axe"), false);
});

test("every manifest clip is bundled and matches its recorded source checksum", async () => {
  const root = new URL("../public/", import.meta.url);
  const { sources } = JSON.parse(await readFile(new URL("audio/voices/SOURCES.json", root)));
  assert.equal(sources.length, 38);
  for (const clips of Object.values(HERO_VOICES)) assert.equal(new Set(clips).size, 6);
  for (const clips of [...Object.values(HERO_VOICES), Object.values(VICTORY_VOICES)]) {
    for (const clip of clips) {
      const bytes = await readFile(new URL(clip.slice(1), root));
      const source = sources.find(item => item.clip === clip);
      assert.ok(source, clip);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), source.sha256);
    }
  }
});

test("each victory interrupts the hero, plays the matching announcer and restores music", async () => {
  for (const team of ["radiant", "dire"]) {
    const audio = new ArenaAudio();
    await audio.start();
    await audio.playVoice("axe");
    const hero = audio.voice, staleEnd = hero.onended;
    const lastQuote = audio.lastQuote.get("axe");
    assert.equal(await audio.playVictory(team), true);
    assert.equal(hero.paused, true);
    assert.equal(audio.voice.src, VICTORY_VOICES[team]);
    assert.equal(audio.voice.volume, 0.9);
    assert.equal(audio.music.volume, 0.65 * 0.3);
    staleEnd();
    assert.equal(audio.voice.src, VICTORY_VOICES[team]);
    assert.equal(audio.lastQuote.get("axe"), lastQuote);
    audio.setVolume(0.4);
    audio.voice.onended();
    assert.equal(audio.voice, null);
    assert.equal(audio.music.volume, 0.4);
  }
});

test("victory supersedes pending speech even when the old promise settles late", async () => {
  for (const rejectOld of [false, true]) {
    const audio = new ArenaAudio();
    let settle;
    FakeAudio.behavior = () => new Promise((resolve, reject) => {
      settle = rejectOld ? () => reject(new Error("aborted")) : resolve;
    });
    const pending = audio.playVoice("invoker");
    const hero = audio.voice, stalePlaying = hero.onplaying;
    FakeAudio.behavior = null;
    await audio.playVictory("dire");
    stalePlaying(); settle();
    assert.equal(await pending, false);
    assert.equal(audio.voice.src, VICTORY_VOICES.dire);
    assert.equal(audio.ducked, true);
    assert.equal(hero.paused, true);
  }
});

test("victory cancellation, playback failures and disposal restore music safely", async () => {
  const audio = new ArenaAudio();
  await audio.start();
  for (const finish of [() => audio.stopVoice(), () => audio.voice.onerror()]) {
    await audio.playVictory("radiant");
    finish();
    assert.equal(audio.voice, null);
    assert.equal(audio.music.volume, 0.65);
  }
  FakeAudio.behavior = () => Promise.reject(new Error("NotAllowedError"));
  assert.equal(await audio.playVictory("dire"), false);
  assert.equal(audio.voice, null);
  assert.equal(audio.music.volume, 0.65);
  FakeAudio.behavior = null;
  await audio.playVictory("dire");
  audio.dispose();
  assert.equal(audio.voice, null);
  assert.equal(await audio.playVictory("radiant"), false);
});
