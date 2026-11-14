# Battle of the Ancients

The ZIP includes a prebuilt version in `out/`. With Node.js installed, run `node preview.mjs` (or double-click `Start-Preview.cmd` on Windows), then open http://127.0.0.1:3000. No dependency installation is needed for this preview.

A Dota 2 themed, two-player Tic Tac Toe game built with React and Next.js App Router for the CAPM developer challenge.

## Run locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Production build: `npm run build` (static export in `out/`). Run logic tests with `npm test`.

## Challenge checklist

- Two players alternate on a 3×3 board, with hero portraits as marks and X/O badges for clarity.
- All eight winning lines and draws are detected. Completed rounds and occupied cells reject further moves.
- New Game clears the board and keeps the scoreboard.
- Bonus scoreboard tracks Radiant wins, Dire wins, and draws, persisted in browser localStorage.
- Six selectable heroes; opponent picks cannot be duplicated. Picks lock during a round.
- Responsive layout, keyboard controls, live announcements, modal focus management, and reduced-motion support.
- Looping music enabled by default at 65%, with a 0–100% volume slider. Playback starts on the first interaction if the browser blocks autoplay.
- Each valid move plays one of six original quotes from the selected hero, without repeating their previous quote. A new move interrupts the previous voice. Music drops to 30% of its selected volume during speech and returns afterward.
- A winning move interrupts hero speech with the standard announcer's “Radiant victory!” or “Dire victory!” once per round, alongside the victory effect. Draws keep their existing audio.
- The speaker button mutes synthesized effects, hero voices, and victory announcements. Voices stop on reset, hero changes, or tab hiding; music resumes when the tab becomes visible.

## Deploy on Vercel

Import this directory as a new Next.js project, or use the Vercel CLI from this directory:

```sh
npx vercel
```

No environment variables, database, or backend services are required. Production build command: `npm run build`. The app uses Next.js static export.

## Structure

- `app/page.jsx`: game UI and interactions
- `app/globals.css`: arena, responsive layouts, and animations
- `lib/game.mjs`: pure game reducer and win detection
- `lib/audio.mjs`: MP3 music playback and synthesized effects
- `lib/voices.mjs`: six local voice clips for each selectable hero
- `public/audio/voices/SOURCES.json`: pinned download URLs, Valve credit, and checksums for all 38 recordings (36 hero quotes and two victory announcements)
- `tests/game.test.mjs`: gameplay regression checks
- `public/heroes/`: Valve hero artwork bundled for dependable loading

## Credits

Unofficial fan project. Dota 2, character names, and hero artwork belong to Valve. Hero artwork sourced from Valve's Steam CDN, as used by https://www.dota2.com/heroes. Background music uses the user-supplied Dota.mp3 in public/audio/dota.mp3. Spell and victory effects are synthesized with the Web Audio API. Fonts: Barlow, Barlow Condensed, and Cinzel via Google Fonts (with system fallbacks). UI icons: Lucide (ISC license).

Original English hero voice recordings belong to Valve and are bundled from the unofficial [Dota 2 Sounds collection](https://huggingface.co/datasets/Sqls1/dota2-sounds). They use standard hero voices. All clips are served locally, including in the static export, with no external audio requests during gameplay. `node scripts/fetch-voices.mjs` downloads missing clips and records source checksums; normal builds use the bundled files.
