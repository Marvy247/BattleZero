export interface Ship {
  length: number;
  positions: [number, number][];
  sunk: boolean;
}

export interface GameState {
  sessionId: number;
  player1: string;
  player2: string;
  myShips: Ship[];
  myCommitment: string;
  oppCommitment: string;
  myAttacks: [number, number, boolean][];
  oppAttacks: [number, number, boolean][];
  turn: string;
  winner: string | null;
  phase: 'setup' | 'playing' | 'finished';
}
