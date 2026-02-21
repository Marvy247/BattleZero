# ✅ ZK Battleship - SIMPLIFIED DEPLOYMENT (No Noir Required)

## Current Status
✅ Contract built successfully!  
✅ WASM optimized: `target/wasm32-unknown-unknown/release/zk_battleship.optimized.wasm`  
⚠️ Noir circuit skipped (using mock proofs in frontend)

## Quick Deploy (5 minutes)

### 1. Deploy Contract to Testnet

```bash
cd /home/marvi/Documents/Stellar-Game-Studio

# Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/zk_battleship.optimized.wasm \
  --source <YOUR_WALLET_ALIAS> \
  --network testnet

# Save the contract ID that's printed!
```

### 2. Initialize Contract

```bash
# Replace <CONTRACT_ID> with the ID from step 1
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <YOUR_WALLET_ALIAS> \
  --network testnet \
  -- __constructor \
  --admin <YOUR_WALLET_ADDRESS> \
  --game_hub CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG
```

### 3. Update Frontend

Edit `zk-battleship-frontend/src/utils/stellar.ts`:
```typescript
const CONTRACT_ID = 'YOUR_CONTRACT_ID_HERE';
```

### 4. Install & Run Frontend

```bash
cd zk-battleship-frontend

# Install dependencies (if not already done)
npm install
# or
yarn install

# Run dev server
npm run dev
# or  
yarn dev
```

Open http://localhost:3000

## What About ZK Proofs?

The frontend uses **mock proof generation** (see `src/utils/noir.ts`). This is fine for:
- Demo purposes
- Hackathon submission
- Testing the game flow

The proof functions simulate 2-4 second delays to mimic real ZK proof generation.

## For Production (Later)

To add real Noir proofs:
1. Install Noir: https://noir-lang.org/docs/getting_started/installation
2. Compile circuit: `cd circuits && nargo compile`
3. Update `zk-battleship-frontend/src/utils/noir.ts` with real Noir.js integration

## Testing

1. Connect Freighter wallet (testnet mode)
2. Place ships (drag & drop)
3. Wait for "opponent" (use 2nd wallet in incognito)
4. Attack and see hit/miss animations
5. Win and claim victory!

## Explorer Links

After deployment, check:
- Your contract: `https://stellar.expert/explorer/testnet/contract/<CONTRACT_ID>`
- Game Hub: `https://stellar.expert/explorer/testnet/contract/CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`

## Hackathon Submission

You can still submit! The game is functional:
- ✅ Soroban contract deployed
- ✅ Game Hub integration
- ✅ React frontend with animations
- ✅ 2-player gameplay
- ⚠️ Mock ZK proofs (mention this in submission)

**Note in submission**: "ZK proof generation is mocked for demo. Circuit code included, production integration pending Noir toolchain setup."

---

**You're ready to deploy! 🚀**

Total time: ~10 minutes
