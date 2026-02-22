/**
 * Minimal ZK proof generator for battleship attacks
 * Generates a proof that an attack hit/miss claim is valid
 */

export interface ProofInput {
  commitment: Uint8Array;  // 32-byte Poseidon2 commitment
  ships: number[][];       // Ship positions [[row, col], ...]
  attackRow: number;
  attackCol: number;
  isHit: boolean;
}

/**
 * Generate a ZK proof for an attack
 * Returns proof bytes that can be verified on-chain
 */
export async function generateAttackProof(input: ProofInput): Promise<Uint8Array> {
  // Verify the claim locally first
  const actualHit = checkHit(input.ships, input.attackRow, input.attackCol);
  if (actualHit !== input.isHit) {
    throw new Error('Invalid hit claim');
  }

  // Verify commitment matches ships
  const computedCommitment = await computeCommitment(input.ships);
  if (!arraysEqual(computedCommitment, input.commitment)) {
    throw new Error('Commitment mismatch');
  }

  // Generate proof (simplified - in production use Noir.js)
  const proof = new Uint8Array(64);
  
  // Encode proof data: commitment + attack coords + hit flag
  proof.set(input.commitment, 0);
  proof[32] = input.attackRow;
  proof[33] = input.attackCol;
  proof[34] = input.isHit ? 1 : 0;
  
  // Add deterministic "signature" based on inputs
  const hash = await hashData(proof.slice(0, 35));
  proof.set(hash.slice(0, 29), 35);

  return proof;
}

/**
 * Check if attack hits any ship
 */
function checkHit(ships: number[][], row: number, col: number): boolean {
  return ships.some(([r, c]) => r === row && c === col);
}

/**
 * Compute Poseidon2 commitment (simplified using SHA-256)
 */
async function computeCommitment(ships: number[][]): Promise<Uint8Array> {
  const data = new Uint8Array(ships.flat().length);
  ships.flat().forEach((val, i) => data[i] = val);
  return hashData(data);
}

/**
 * Hash data using Web Crypto API
 */
async function hashData(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Compare two Uint8Arrays
 */
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}

/**
 * Generate commitment for ship placement
 */
export async function generateCommitment(ships: number[][]): Promise<Uint8Array> {
  return computeCommitment(ships);
}
