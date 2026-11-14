import test from "node:test";
import assert from "node:assert/strict";
import { initialGame, gameReducer, LINES } from "../lib/game.mjs";
const play = (moves) =>
  moves.reduce(
    (s, index) => gameReducer(s, { type: "move", index }),
    initialGame(),
  );
test("players alternate and cannot overwrite occupied cells", () => {
  const s = play([0]);
  assert.equal(s.turn, "dire");
  assert.strictEqual(gameReducer(s, { type: "move", index: 0 }), s);
  assert.equal(play([0, 1]).board[1], "dire");
});
test("every winning line is detected and scored", () => {
  for (const line of LINES) {
    const other = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((x) => !line.includes(x));
    const s = play([line[0], other[0], line[1], other[1], line[2]]);
    assert.equal(s.winner, "radiant");
    assert.deepEqual(s.line, line);
    assert.equal(s.scores.radiant, 1);
    assert.strictEqual(gameReducer(s, { type: "move", index: other[2] }), s);
  }
});
test("Dire can win", () => {
  const s = play([0, 3, 1, 4, 8, 5]);
  assert.equal(s.winner, "dire");
  assert.equal(s.scores.dire, 1);
});
test("draw is scored only once and locks board", () => {
  const s = play([0, 1, 2, 4, 3, 5, 7, 6, 8]);
  assert.equal(s.draw, true);
  assert.equal(s.scores.draw, 1);
  assert.strictEqual(gameReducer(s, { type: "move", index: 0 }), s);
});
test("new game clears board and retains scoreboard; reset clears everything", () => {
  const s = play([0, 3, 1, 4, 2]);
  const n = gameReducer(s, { type: "newGame" });
  assert.deepEqual(n.board, Array(9).fill(null));
  assert.equal(n.scores.radiant, 1);
  assert.equal(n.round, 2);
  assert.deepEqual(gameReducer(n, { type: "resetScores" }), initialGame());
});
test("invalid positions are ignored", () => {
  for (const index of [-1, 9, 1.2, NaN]) {
    const s = initialGame();
    assert.strictEqual(gameReducer(s, { type: "move", index }), s);
  }
});
