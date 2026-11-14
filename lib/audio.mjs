import { HERO_VOICES, VICTORY_VOICES } from "./voices.mjs";

// Independent music, synthesized effects, and a single interruptible voice.
export class ArenaAudio {
  constructor() {
    this.ctx = null;
    this.music = null;
    this.volume = 0.65;
    this.voice = null;
    this.ducked = false;
    this.preloadedVoices = new Map();
    this.lastQuote = new Map();
    this.disposed = false;
  }
  init() {
    if (!this.ctx)
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  tone(freq, time, length, type = "sine", volume = 0.08, bus) {
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(volume, time + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, time + length);
    o.connect(g);
    g.connect(bus || c.destination);
    o.start(time);
    o.stop(time + length + 0.05);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  effect(kind, team = "radiant") {
    this.init();
    const t = this.ctx.currentTime,
      base = team === "radiant" ? 392 : 196;
    if (kind === "win") {
      [0, 4, 7, 12, 7, 12].forEach((n, i) =>
        this.tone(
          base * Math.pow(2, n / 12),
          t + i * 0.16,
          1,
          "triangle",
          0.11,
        ),
      );
    } else if (kind === "draw") {
      [294, 261, 220].forEach((n, i) =>
        this.tone(n, t + i * 0.16, 0.7, "triangle", 0.07),
      );
    } else {
      this.tone(base, t, 0.4, "triangle", 0.1);
      this.tone(base * 2, t + 0.04, 0.6, "sine", 0.045);
      this.tone(65, t, 0.16, "sine", 0.2);
    }
  }
  async start() {
    if (!this.music) {
      this.music = new Audio("/audio/dota.mp3");
      this.music.loop = true;
      this.applyMusicVolume();
    }
    try {
      await this.music.play();
      return !this.music.paused;
    } catch {
      return false;
    }
  }
  stop() {
    this.music?.pause();
  }
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.applyMusicVolume();
  }
  applyMusicVolume() {
    if (this.music) this.music.volume = this.volume * (this.ducked ? 0.3 : 1);
  }
  preloadVoices(heroIds) {
    if (this.disposed) return;
    const wanted = new Set([
      ...heroIds.flatMap((hero) => HERO_VOICES[hero] || []),
      ...Object.values(VICTORY_VOICES),
    ]);
    for (const [src, clip] of this.preloadedVoices) {
      if (!wanted.has(src)) {
        clip.removeAttribute("src");
        clip.load();
        this.preloadedVoices.delete(src);
      }
    }
    for (const src of wanted) {
      if (this.preloadedVoices.has(src)) continue;
      const clip = new Audio();
      clip.preload = "auto";
      clip.src = src;
      clip.load();
      this.preloadedVoices.set(src, clip);
    }
  }
  async playVoice(heroId) {
    const quotes = HERO_VOICES[heroId] || [];
    const choices = quotes.filter((src) => src !== this.lastQuote.get(heroId));
    const src = choices[Math.floor(Math.random() * choices.length)];
    return this.playSpeech(src, () => this.lastQuote.set(heroId, src));
  }
  playVictory(team) {
    return this.playSpeech(VICTORY_VOICES[team]);
  }
  async playSpeech(src, onPlaying) {
    this.stopVoice();
    if (this.disposed || !src) return false;
    // Separate playback elements keep interrupted play promises/events isolated.
    const clip = new Audio(src);
    clip.volume = 0.9;
    this.voice = clip;
    clip.onplaying = () => {
      if (this.voice !== clip) return;
      onPlaying?.();
      this.ducked = true;
      this.applyMusicVolume();
    };
    const finish = () => {
      if (this.voice === clip) this.stopVoice();
    };
    clip.onended = finish;
    clip.onerror = finish;
    try {
      await clip.play();
      if (this.voice !== clip) {
        clip.pause();
        return false;
      }
      return true;
    } catch {
      finish();
      return false;
    }
  }
  stopVoice() {
    const clip = this.voice;
    this.voice = null;
    if (clip) {
      clip.onplaying = clip.onended = clip.onerror = null;
      clip.pause();
      clip.removeAttribute("src");
      clip.load();
    }
    this.ducked = false;
    this.applyMusicVolume();
  }
  dispose() {
    this.disposed = true;
    this.stopVoice();
    for (const clip of this.preloadedVoices.values()) {
      clip.removeAttribute("src");
      clip.load();
    }
    this.preloadedVoices.clear();
    this.stop();
    this.ctx?.close();
  }
}
