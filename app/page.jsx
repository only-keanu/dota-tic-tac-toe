"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import {
  Swords,
  Volume2,
  VolumeX,
  Music2,
  RotateCcw,
  ArrowUpRight,
  Shield,
  Flame,
  ChevronDown,
  X,
  Check,
  Info,
  Trophy,
} from "lucide-react";
import { initialGame, gameReducer } from "../lib/game.mjs";
import { ArenaAudio } from "../lib/audio.mjs";
const HEROES = [
  {
    id: "juggernaut",
    name: "Juggernaut",
    title: "THE MASKED SWORDSMAN",
    type: "Agility",
  },
  {
    id: "nevermore",
    name: "Shadow Fiend",
    title: "THE SOUL COLLECTOR",
    type: "Agility",
  },
  {
    id: "crystal_maiden",
    name: "Crystal Maiden",
    title: "THE FROST MAGE",
    type: "Intelligence",
  },
  { id: "axe", name: "Axe", title: "THE RED MIST", type: "Strength" },
  {
    id: "windrunner",
    name: "Windranger",
    title: "THE WIND ARCHER",
    type: "Intelligence",
  },
  {
    id: "invoker",
    name: "Invoker",
    title: "THE ARSENAL MAGUS",
    type: "Intelligence",
  },
];
const portrait = (h) => `/heroes/${h.id}.png`;
function Rune({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 4l33-2 2 34-34 2zm8 6 20 20-1-16-8-4zm-1 9 1 12 12 1z"
      />
    </svg>
  );
}
export default function Home() {
  const [game, dispatch] = useReducer(gameReducer, undefined, initialGame),
    [heroes, setHeroes] = useState({ radiant: HEROES[0], dire: HEROES[1] }),
    [music, setMusic] = useState(true),
    [musicVolume, setMusicVolume] = useState(65),
    [sfx, setSfx] = useState(true),
    [picker, setPicker] = useState(null),
    [help, setHelp] = useState(false),
    [confirmReset, setConfirmReset] = useState(false),
    [ready, setReady] = useState(false);
  const audio = useRef(null),
    previousMoves = useRef(0),
    returnFocus = useRef(null),
    dialogRef = useRef(null);
  const finished = game.winner || game.draw,
    locked = game.moves.length > 0 && !finished;
  useEffect(() => {
    audio.current = new ArenaAudio();
    try {
      const saved = JSON.parse(localStorage.getItem("ancients-score-v1"));
      if (
        saved &&
        ["radiant", "dire", "draw"].every(
          (k) => Number.isInteger(saved[k]) && saved[k] >= 0,
        )
      )
        dispatch({ type: "restore", scores: saved });
    } catch {}
    setReady(true);
    return () => audio.current?.dispose();
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem("ancients-score-v1", JSON.stringify(game.scores));
      } catch {}
  }, [game.scores, ready]);
  useEffect(() => {
    audio.current?.stopVoice();
    audio.current?.preloadVoices([heroes.radiant.id, heroes.dire.id]);
  }, [heroes]);
  useEffect(() => {
    if (game.moves.length > previousMoves.current && sfx && !document.hidden) {
      const last = game.moves.at(-1);
      audio.current?.effect(
        game.winner ? "win" : game.draw ? "draw" : "move",
        last.team,
      );
      if (game.winner) void audio.current?.playVictory(game.winner);
      else void audio.current?.playVoice(heroes[last.team].id);
    }
    previousMoves.current = game.moves.length;
  }, [game.moves, game.winner, game.draw, sfx, heroes]);
  useEffect(() => {
    const startMusic = () => {
      if (music && !document.hidden) void audio.current?.start();
    };
    const onVisibility = () => {
      if (document.hidden) {
        audio.current?.stop();
        audio.current?.stopVoice();
      } else startMusic();
    };
    if (music) startMusic();
    else audio.current?.stop();
    document.addEventListener("pointerdown", startMusic);
    document.addEventListener("keydown", startMusic);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("pointerdown", startMusic);
      document.removeEventListener("keydown", startMusic);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [music]);
  const modal = picker || help || confirmReset;
  useEffect(() => {
    if (modal) {
      returnFocus.current = document.activeElement;
      dialogRef.current?.focus();
    } else returnFocus.current?.focus();
  }, [modal]);
  function closeModal() {
    setPicker(null);
    setHelp(false);
    setConfirmReset(false);
  }
  function modalKey(e) {
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") {
      const items = dialogRef.current.querySelectorAll(
        "button:not(:disabled),[href],input,select",
      );
      const first = items[0],
        last = items[items.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialogRef.current)
      ) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }
  function toggleMusic() {
    if (music) {
      audio.current.stop();
      setMusic(false);
    } else {
      setMusic(true);
      void audio.current.start();
    }
  }
  function move(index) {
    audio.current?.init();
    dispatch({ type: "move", index });
  }
  function newGame() {
    audio.current?.stopVoice();
    audio.current?.init();
    dispatch({ type: "newGame" });
  }
  function keyboardBoard(e, i) {
    const offsets = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3 };
    if (e.key in offsets) {
      e.preventDefault();
      document.getElementById(`cell-${(i + offsets[e.key] + 9) % 9}`)?.focus();
    }
  }
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <div className="mist mist-green" />
        <div className="mist mist-red" />
        {Array.from({ length: 15 }, (_, i) => (
          <i key={i} style={{ "--i": i }} />
        ))}
      </div>
      <header className="topbar">
        <a className="brand" href="#arena">
          <Rune />
          <span>
            ANCIENTS<span className="brand-sub">TIC TAC TOE</span>
          </span>
        </a>
        <div className="top-center">
          <span className="live-dot" /> LOCAL MULTIPLAYER
        </div>
        <div className="audio-controls">
          <button
            className={music ? "audio active" : "audio"}
            onClick={toggleMusic}
            aria-pressed={music}
            aria-label={music ? "Turn music off" : "Turn music on"}
          >
            <Music2 size={16} />
            <span>Music {music ? "on" : "off"}</span>
          </button>
          <label className="music-volume">
            <span>Volume</span>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume}
              aria-label="Music volume"
              aria-valuetext={`${musicVolume}%`}
              onChange={(event) => {
                const volume = Number(event.target.value);
                setMusicVolume(volume);
                audio.current?.setVolume(volume / 100);
              }}
            />
            <output>{musicVolume}%</output>
          </label>
          <button
            className="audio icon-only"
            onClick={() => {
              audio.current?.init();
              if (sfx) audio.current?.stopVoice();
              setSfx(!sfx);
            }}
            aria-pressed={sfx}
            aria-label={sfx ? "Mute sound effects and voices" : "Enable sound effects and voices"}
            title="Sound effects, hero voices, and victory announcements"
          >
            {sfx ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>
      <main id="arena">
        <section className="intro">
          <div className="eyebrow">
            <span /> A CLASSIC GAME. AN ANCIENT RIVALRY. <span />
          </div>
          <h1>
            BATTLE OF THE <em>ANCIENTS</em>
          </h1>
          <p>Two heroes. Nine tiles. One Ancient standing.</p>
        </section>
        <section className="arena-layout" aria-label="Game arena">
          {["radiant", "dire"].map((team) => (
            <aside
              key={team}
              className={`hero-panel ${team} ${!finished && game.turn === team ? "current" : ""}`}
            >
              <div className="faction-heading">
                {team === "radiant" ? (
                  <Shield size={17} />
                ) : (
                  <Flame size={17} />
                )}
                <span>THE {team.toUpperCase()}</span>
                <span className="player-id">
                  P{team === "radiant" ? "1" : "2"}
                </span>
              </div>
              <div className="hero-art">
                <div className="hero-halo" />
                <img
                  src={`/heroes/${heroes[team].id}-render.png`}
                  alt={heroes[team].name}
                  onError={(e) => {
                    if (!e.currentTarget.dataset.fallback) {
                      e.currentTarget.dataset.fallback = "true";
                      e.currentTarget.src = portrait(heroes[team]);
                    }
                  }}
                />
                <span className="hero-attribute">
                  ◆ {heroes[team].type.toUpperCase()}
                </span>
              </div>
              <div className="hero-info">
                <span className="hero-subtitle">{heroes[team].title}</span>
                <h2>{heroes[team].name}</h2>
                <button
                  className="hero-select"
                  disabled={locked}
                  onClick={() => setPicker(team)}
                  title={
                    locked
                      ? "Finish this round or start a new game to change heroes"
                      : "Choose your hero"
                  }
                >
                  Change hero <ChevronDown size={14} />
                </button>
              </div>
              <div
                className={`team-status ${game.winner === team ? "victorious" : ""}`}
              >
                <span className="status-dot" />
                {game.winner === team
                  ? "VICTORY"
                  : game.draw
                    ? "STALEMATE"
                    : finished
                      ? "DEFEATED"
                      : game.turn === team
                        ? "YOUR TURN"
                        : "AWAITING TURN"}
              </div>
            </aside>
          ))}
          <div className="battle-center">
            <div className="board-top">
              <span>
                <Swords size={15} /> THE BATTLEFIELD
              </span>
              <span>ROUND {String(game.round).padStart(2, "0")}</span>
            </div>
            <div
              className={`turn-banner ${game.winner || (!game.draw ? game.turn : "draw")}`}
              role="status"
              aria-live="polite"
            >
              {game.winner ? (
                <Trophy size={19} />
              ) : game.draw ? (
                <Shield size={19} />
              ) : (
                <span className="pulse-dot" />
              )}
              <span>
                {game.winner
                  ? `${game.winner === "radiant" ? "Radiant" : "Dire"} victory!`
                  : game.draw
                    ? "A worthy stalemate."
                    : `${game.turn === "radiant" ? "Radiant" : "Dire"}, make your move.`}
              </span>
              <span className="move-count">{game.moves.length}/9</span>
            </div>
            <div
              className={`board ${game.winner ? "won" : ""}`}
              role="group"
              aria-label="Tic tac toe board"
            >
              <div className="board-watermark">
                <Rune />
              </div>
              {game.board.map((team, i) => (
                <button
                  id={`cell-${i}`}
                  key={i}
                  className={`cell ${team || "empty"} ${game.line.includes(i) ? "winning" : ""}`}
                  onClick={() => move(i)}
                  onKeyDown={(e) => keyboardBoard(e, i)}
                  aria-label={`Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}: ${team ? `${heroes[team].name}, ${team}` : "empty"}`}
                  aria-disabled={!!team || !!finished}
                >
                  {team ? (
                    <>
                      <img src={portrait(heroes[team])} alt="" />
                      <span className="cell-symbol">
                        {team === "radiant" ? "X" : "O"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="cell-cross">+</span>
                      <span className="tile-index">0{i + 1}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
            <div className="board-caption">
              {game.winner
                ? "The Ancient falls. The legend remains."
                : game.draw
                  ? "Both Ancients stand. Settle it in the next round."
                  : "Claim three tiles in a row to destroy the enemy Ancient."}
            </div>
            <button className="new-game" onClick={newGame}>
              <Swords size={18} />
              {finished ? "PLAY AGAIN" : "NEW GAME"}
              <ArrowUpRight size={18} />
            </button>
            <div className="under-button">
              <span>2 PLAYERS</span>
              <span>•</span>
              <span>SAME DEVICE</span>
              <span>•</span>
              <span>NO DOWNLOAD</span>
            </div>
          </div>
        </section>
        <section className="scoreboard" aria-label="Scoreboard">
          <div className="score-title">
            <Trophy size={17} />
            <div>
              <span>THE WAR SO FAR</span>
              <small>Your local scoreboard</small>
            </div>
          </div>
          <div className="score radiant-text">
            <span>RADIANT</span>
            <strong>{String(game.scores.radiant).padStart(2, "0")}</strong>
          </div>
          <div className="score">
            <span>DRAWS</span>
            <strong>{String(game.scores.draw).padStart(2, "0")}</strong>
          </div>
          <div className="score dire-text">
            <span>DIRE</span>
            <strong>{String(game.scores.dire).padStart(2, "0")}</strong>
          </div>
          <button
            className="reset"
            onClick={() => setConfirmReset(true)}
            aria-label="Reset scores"
          >
            <RotateCcw size={16} />
          </button>
        </section>
        <div className="bottom-note">
          <span>
            <span className="tiny-diamond" /> Every move matters.
          </span>
          <button onClick={() => setHelp(true)}>
            <Info size={14} /> How to play
          </button>
        </div>
      </main>
      <footer>
        <Rune />
        <span>A FAN-MADE DOTA 2 EXPERIENCE</span>
        <span className="footer-right">
          Dota 2, hero artwork & voices © Valve · Music: Dota.mp3
        </span>
      </footer>
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            ref={dialogRef}
            onKeyDown={modalKey}
          >
            <button
              className="modal-close"
              onClick={closeModal}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
            <div className="eyebrow">
              {picker
                ? `THE ${picker.toUpperCase()}`
                : "BATTLE OF THE ANCIENTS"}
            </div>
            <h2 id="modal-title">
              {picker
                ? "Choose your champion"
                : help
                  ? "Defend your Ancient"
                  : "Begin a new war?"}
            </h2>
            {picker ? (
              <>
                <p>Your hero becomes your mark on the battlefield.</p>
                <div className="hero-grid">
                  {HEROES.map((hero) => {
                    const selected = heroes[picker].id === hero.id,
                      other =
                        heroes[picker === "radiant" ? "dire" : "radiant"].id ===
                        hero.id;
                    return (
                      <button
                        key={hero.id}
                        disabled={other}
                        className={selected ? "selected" : ""}
                        onClick={() => {
                          setHeroes({ ...heroes, [picker]: hero });
                          if (finished) dispatch({ type: "newGame" });
                          closeModal();
                        }}
                      >
                        <img src={portrait(hero)} alt="" />
                        <span>{hero.name}</span>
                        {selected && <Check size={17} />}
                        <small>
                          {other ? "Picked by opponent" : hero.type}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : help ? (
              <>
                <p>
                  Share this device with a friend. Radiant plays first; Dire
                  follows.
                </p>
                <ol>
                  <li>Pick a hero for each side before the first move.</li>
                  <li>Take turns claiming an empty tile.</li>
                  <li>
                    Connect three horizontally, vertically, or diagonally to
                    win. A full board without a winner is a draw.
                  </li>
                </ol>
                <p>
                  <b>New Game</b> clears the board and keeps your scores. Scores
                  stay saved in this browser. Use Tab or arrow keys to move
                  between tiles, then Enter or Space to play.
                </p>
                <p className="muted">
                  Music is on by default and may start after your first interaction.
                  Use the music button to turn it off or the volume slider to
                  adjust it. Each valid move plays a random quote from your hero;
                  the next move interrupts the previous quote. A winning move
                  interrupts hero speech with “Radiant victory!” or “Dire victory!”
                  from the announcer. Music becomes
                  quieter during speech. Effects and voices share the speaker
                  mute button. Music pauses
                  while this tab is hidden and resumes when you return.
                </p>
              </>
            ) : (
              <>
                <p>
                  This clears both teams’ scores, draws, and the current board.
                </p>
                <div className="modal-actions">
                  <button className="hero-select" onClick={closeModal}>
                    Keep playing
                  </button>
                  <button
                    className="new-game"
                    onClick={() => {
                      audio.current?.stopVoice();
                      dispatch({ type: "resetScores" });
                      closeModal();
                    }}
                  >
                    RESET SCORES
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
