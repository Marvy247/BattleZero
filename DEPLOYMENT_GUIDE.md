# ZK Battleship Deployment Guide

## Step-by-Step Deployment to Stellar Testnet

### 1. Build Noir Circuit

\`\`\`bash
cd circuits
nargo compile
# Output: target/battleship.json

# Optional: Generate Solidity verifier (for reference)
nargo codegen-verifier
\`\`\`

### 2. Build Soroban Contract

\`\`\`bash
cd ..
bun run build zk-battleship
# Output: target/wasm32-unknown-unknown/release/zk_battleship.wasm
\`\`\`

### 3. Deploy to Testnet

\`\`\`bash
# Deploy contract
bun run deploy zk-battleship

# Note the contract ID from output
# Example: CBQHNAXSI55GX2GN6D67GK7BHKQKJQCQNPDD2PLPAHS62UL4XQBATTLESHIP
\`\`\`

### 4. Initialize Contract

\`\`\`bash
# Get your wallet address from Freighter
# Game Hub address: CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG

stellar contract invoke \
  --id <YOUR_CONTRACT_ID> \
  --source <YOUR_WALLET> \
  --network testnet \
  -- __constructor \
  --admin <YOUR_WALLET> \
  --game_hub CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG
\`\`\`

### 5. Update Frontend Config

Edit `zk-battleship-frontend/src/utils/stellar.ts`:

\`\`\`typescript
const CONTRACT_ID = 'YOUR_DEPLOYED_CONTRACT_ID_HERE';
\`\`\`

### 6. Install Frontend Dependencies

\`\`\`bash
cd zk-battleship-frontend
bun install
\`\`\`

### 7. Run Development Server

\`\`\`bash
bun run dev
# Open http://localhost:3000
\`\`\`

### 8. Test with Two Wallets

**Wallet 1 (Normal Browser):**
1. Connect Freighter
2. Place ships
3. Wait for opponent

**Wallet 2 (Incognito/Different Browser):**
1. Connect different Freighter wallet
2. Place ships
3. Game starts!

### 9. Build for Production

\`\`\`bash
bun run build
# Output: dist/

# Deploy to Vercel/Netlify/etc
\`\`\`

## Verification Checklist

- [ ] Noir circuit compiles without errors
- [ ] Contract builds successfully
- [ ] Contract deployed to testnet
- [ ] Contract initialized with Game Hub address
- [ ] Frontend connects to Freighter
- [ ] Ship placement works
- [ ] Proof generation completes (<5s)
- [ ] Attack transactions succeed
- [ ] Win claim calls Game Hub end_game
- [ ] Explorer shows transactions

## Troubleshooting

### "stellar CLI not found"
- Install: `cargo install --locked stellar-cli`

### "Freighter not connected"
- Install Freighter extension
- Switch to Testnet in Freighter settings
- Fund wallet: https://laboratory.stellar.org/#account-creator

### "Proof generation fails"
- Check browser console for errors
- Ensure Noir circuit compiled
- Verify ship positions are valid

### "Transaction failed"
- Check wallet has XLM for fees
- Verify contract ID is correct
- Check Game Hub address matches

## Explorer Links

After deployment, verify on Stellar Expert:

- Contract: `https://stellar.expert/explorer/testnet/contract/<CONTRACT_ID>`
- Transactions: `https://stellar.expert/explorer/testnet/account/<YOUR_WALLET>`
- Game Hub: `https://stellar.expert/explorer/testnet/contract/CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`

## Performance Benchmarks

- **Proof Generation**: ~2-4 seconds (browser)
- **Transaction Confirmation**: ~5-7 seconds (testnet)
- **Full Game Duration**: ~5-10 minutes (2 players)

## Next Steps

1. Record demo video (2-3 minutes)
2. Submit to DoraHacks with:
   - GitHub repo link
   - Demo video
   - Contract address
   - Live frontend URL
3. Share on Twitter/Discord
4. Win $5k XLM! 🚀
