#!/bin/bash
set -e

echo "🎮 BattleZero - Final Deployment Script"
echo "=========================================="
echo ""

# Check prerequisites
echo "✓ Checking prerequisites..."
command -v stellar >/dev/null 2>&1 || { echo "❌ stellar CLI not found"; exit 1; }
command -v nargo >/dev/null 2>&1 || { echo "❌ nargo not found"; exit 1; }

# Compile Noir circuit
echo ""
echo "📐 Compiling Noir circuit..."
cd circuits
nargo compile
echo "✅ Circuit compiled: target/battleship.json"
cd ..

# Build contract
echo ""
echo "🔨 Building Soroban contract..."
cd contracts/zk-battleship
cargo build --target wasm32-unknown-unknown --release
cd ../..

# Optimize WASM
echo ""
echo "⚡ Optimizing WASM..."
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/zk_battleship.wasm

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Artifacts:"
echo "  - Noir circuit: circuits/target/battleship.json"
echo "  - Contract WASM: target/wasm32-unknown-unknown/release/zk_battleship.optimized.wasm"
echo ""
echo "🚀 Next steps:"
echo "  1. Deploy contract: stellar contract deploy --wasm target/wasm32-unknown-unknown/release/zk_battleship.optimized.wasm --source <wallet> --network testnet"
echo "  2. Initialize: stellar contract invoke --id <CONTRACT_ID> --source <wallet> --network testnet -- __constructor --admin <ADMIN> --game_hub CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG"
echo "  3. Update frontend: Edit zk-battleship-frontend/src/utils/stellar.ts with CONTRACT_ID"
echo "  4. Run frontend: cd zk-battleship-frontend && npm install && npm run dev"
echo ""
