#!/bin/bash
set -e

echo "🚀 Initializing ZK Battleship Contract for Hackathon Demo"
echo "=========================================================="

CONTRACT_ID="CCVL2EVEX4M7QVD7PBYV5B4WRIUI6O563GXNEZU6XJOHDE5UIXPHHZUE"
ADMIN="GAD474G7OMEHZKJEO5IW6HVUCCNCOFTADA3NSSFZDMM5COKRF2IEFLQW"
GAME_HUB="CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG"

echo ""
echo "📋 Configuration:"
echo "   Contract: $CONTRACT_ID"
echo "   Admin: $ADMIN"
echo "   Game Hub: $GAME_HUB"
echo ""

# Try to call constructor (may already be initialized)
echo "🔧 Attempting to initialize contract..."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$ADMIN" \
  --network testnet \
  -- __constructor \
  --admin "$ADMIN" \
  --game_hub "$GAME_HUB" 2>&1 || echo "⚠️  Constructor may already be called or not available via CLI"

echo ""
echo "✅ Contract setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Run the frontend: cd zk-battleship-frontend && npm run dev"
echo "   2. Connect Freighter wallet"
echo "   3. Play game and make real transactions"
echo ""
