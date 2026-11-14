export const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
export const initialGame = () => ({
  board: Array(9).fill(null),
  turn: "radiant",
  winner: null,
  line: [],
  draw: false,
  scores: { radiant: 0, dire: 0, draw: 0 },
  round: 1,
  moves: [],
});
export function gameReducer(state, action) {
  if (action.type === "restore") return { ...state, scores: action.scores };
  if (action.type === "resetScores") return initialGame();
  if (action.type === "newGame")
    return { ...initialGame(), scores: state.scores, round: state.round + 1 };
  if (
    action.type !== "move" ||
    !Number.isInteger(action.index) ||
    action.index < 0 ||
    action.index > 8 ||
    state.board[action.index] ||
    state.winner ||
    state.draw
  )
    return state;
  const board = [...state.board];
  board[action.index] = state.turn;
  const line =
    LINES.find(
      ([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c],
    ) || [];
  const winner = line.length ? state.turn : null,
    draw = !winner && board.every(Boolean);
  const scores = { ...state.scores };
  if (winner) scores[winner]++;
  else if (draw) scores.draw++;
  return {
    ...state,
    board,
    line,
    winner,
    draw,
    scores,
    turn: state.turn === "radiant" ? "dire" : "radiant",
    moves: [...state.moves, { team: state.turn, index: action.index }],
  };
}
