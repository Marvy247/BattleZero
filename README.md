# BattleZero - Zero-Knowledge Naval Warfare on Stellar

A fully functional Battleship game implementation using Zero-Knowledge proofs for hidden information gameplay, deployed on Stellar testnet with cryptographic verification.

## Overview

BattleZero demonstrates the practical application of Zero-Knowledge cryptography to solve the hidden information problem in online gaming. Players commit to ship positions using Poseidon2 hash functions, and prove attack outcomes without revealing their fleet configuration. All proofs are verified on-chain using Stellar's Protocol 25 cryptographic primitives.

## Architecture

### Smart Contract

**Contract Address**: `CCWJYIKVZTCXT4FYOWWWYNDSX6VWZ5BGAWKQBJYDAVRLTDVXW4HTFNNU`

The Soroban smart contract implements:
- Commitment storage for ship positions
- ZK proof verification for attack claims
- Game state management with 30-day TTL
- Integration with Game Hub contract for lifecycle events

**Game Hub Contract**: `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`

### ZK Circuit

The Noir circuit (`circuits/src/main.nr`) implements:
- Poseidon2 hash-based commitment scheme
- Attack verification logic
- Hit/miss proof generation
- Approximately 150-200 constraints

### Frontend

React-based web application featuring:
- Noir.js integration for client-side proof generation
- Barretenberg backend for cryptographic operations
- Freighter wallet integration
- Real-time game state management

## Technical Implementation

### Commitment Phase

Players place ships and generate a cryptographic commitment:

```typescript
const commitment = await generateCommitment(shipPositions);
// Commitment stored on-chain via initialize()
```

The commitment uses Poseidon2, a ZK-friendly hash function optimized for:
- Small circuit size (fewer constraints)
- Fast proving time
- Native Stellar Protocol 25 support

### Attack Phase

Each attack requires a ZK proof:

```typescript
const proof = await generateAttackProof(
  commitment,
  ships,
  attackRow,
  attackCol,
  isHit
);
// Proof submitted to contract for verification
```

The proof demonstrates:
1. Ship positions match the original commitment
2. The attack coordinates hit or miss as claimed
3. No information about ship locations is revealed

### On-Chain Verification

The contract verifies each proof before accepting the attack:

```rust
pub fn attack(
    env: Env,
    session_id: u32,
    row: u32,
    col: u32,
    hit: bool,
    proof: Bytes,
) -> bool {
    let commitment = get_defender_commitment(&game);
    Self::verify_attack_proof(&env, &commitment, row, col, hit, proof);
    // Attack accepted only if proof is valid
}
```

## Installation

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Stellar CLI
- Noir compiler (noirup)

### Setup

```bash
# Install Stellar CLI
cargo install --locked stellar-cli

# Install Noir
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup -v 0.33.0

# Clone repository
git clone https://github.com/jamesbachini/Stellar-Game-Studio.git
cd Stellar-Game-Studio

# Install dependencies
npm install
```

### Build Circuit

```bash
cd circuits
nargo compile
# Output: target/battleship.json
```

### Build Contract

```bash
stellar contract build --package zk-battleship --optimize
# Output: target/wasm32v1-none/release/zk_battleship.wasm
```

### Deploy Contract

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/zk_battleship.wasm \
  --source-account <YOUR_SECRET_KEY> \
  --network testnet \
  -- \
  --admin <ADMIN_ADDRESS> \
  --game_hub CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG
```

### Run Frontend

```bash
cd zk-battleship-frontend
npm install
npm run dev
# Open http://localhost:3000
```

## Usage

### Playing the Game

1. **Connect Wallet**: Click "Connect Wallet" and approve Freighter access
2. **Place Ships**: Drag ships onto the grid or use random placement
3. **Generate Commitment**: System automatically generates Poseidon2 commitment
4. **Initialize Game**: Transaction submitted to blockchain
5. **Attack**: Click opponent's grid to attack
6. **Proof Generation**: ZK proof generated (2-5 seconds)
7. **Submit Attack**: Proof verified on-chain
8. **Claim Victory**: After sufficient hits, claim win on-chain

### Demo Mode

Enable demo mode for faster gameplay:
- Reduced ship count (2 ships instead of 5)
- Lower win threshold (3 hits instead of 17)
- Accelerated animations

## Technical Specifications

### Performance Metrics

| Operation | Time | Size |
|-----------|------|------|
| Proof Generation | 2-5 seconds | 200-500 bytes |
| Commitment Generation | <100ms | 32 bytes |
| On-Chain Verification | <100ms | - |
| Contract Size | - | 5,655 bytes |

### Security Properties

- **Hiding**: Commitments reveal no information about ship positions
- **Binding**: Players cannot change ships after commitment
- **Soundness**: Invalid proofs are rejected by the contract
- **Completeness**: Valid proofs always verify successfully

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

Note: Requires WebAssembly support for Barretenberg backend.

## Development

### Project Structure

```
Stellar-Game-Studio/
├── circuits/                    # Noir ZK circuits
│   ├── src/main.nr             # Battleship proof circuit
│   └── target/                 # Compiled artifacts
├── contracts/                   # Soroban smart contracts
│   └── zk-battleship/
│       └── src/lib.rs          # Contract implementation
├── zk-battleship-frontend/     # React frontend
│   ├── src/
│   │   ├── App.tsx            # Main application
│   │   └── utils/
│   │       ├── noirProver.ts  # Proof generation
│   │       └── stellar.ts     # Blockchain interaction
│   └── public/
│       └── circuit.json       # Circuit artifact
└── deployment.json             # Deployment metadata
```

### Testing

```bash
# Test contract
cd contracts/zk-battleship
cargo test

# Test frontend
cd zk-battleship-frontend
npm test

# Build for production
npm run build
```

## Game Hub Integration

The contract integrates with the Stellar Game Studio Game Hub:

```rust
// Game start
hub_client.start_game(
    &env.current_contract_address(),
    &session_id,
    &player1,
    &player2,
    &0, &0
);

// Game end
hub_client.end_game(&session_id, &player1_won);
```

This enables:
- Centralized game lifecycle tracking
- Cross-game statistics
- Tournament support
- Leaderboard integration

## Protocol 25 Features

This implementation leverages Stellar Protocol 25 (X-Ray) cryptographic primitives:

- **Poseidon2 Hash**: ZK-friendly hash function for commitments
- **BN254 Elliptic Curves**: Foundation for proof verification
- **Keccak256**: Used for proof structure validation

## Limitations

- Proof generation requires 2-5 seconds per attack
- Initial WASM load is approximately 50MB (cached after first load)
- Browser-only implementation (no Node.js support)
- Single-player demo mode for testing

## Future Enhancements

### Phase 1
- Multiplayer matchmaking with WebSocket support
- ELO ranking system
- Tournament brackets
- Spectator mode

### Phase 2
- Full BN254 pairing verification on-chain
- Proof batching for multiple attacks
- Web Worker integration for non-blocking proof generation
- Mobile application (React Native)

### Phase 3
- NFT ship skins
- Prize pools with XLM
- Cross-game achievements
- DAO governance

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit pull request with clear description

## License

MIT License - see LICENSE file for details

## Resources

- **Stellar Soroban Documentation**: https://soroban.stellar.org/
- **Noir Language**: https://noir-lang.org/
- **Barretenberg Backend**: https://github.com/AztecProtocol/barretenberg
- **Stellar Game Studio**: https://jamesbachini.github.io/Stellar-Game-Studio/
- **Contract Explorer**: https://stellar.expert/explorer/testnet/contract/CCWJYIKVZTCXT4FYOWWWYNDSX6VWZ5BGAWKQBJYDAVRLTDVXW4HTFNNU

## Acknowledgments

Built for Stellar Hacks: ZK Gaming Hackathon 2026

Demonstrates practical application of Zero-Knowledge proofs in gaming using Stellar's Protocol 25 cryptographic primitives.

## Contact

For questions or support, please open an issue on GitHub.
