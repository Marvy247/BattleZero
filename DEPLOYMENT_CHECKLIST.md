# 🎯 ZK Battleship - Deployment Checklist

## Pre-Deployment ✅

- [x] Noir circuit created (`circuits/src/main.nr`)
- [x] Soroban contract created (`contracts/zk-battleship/src/lib.rs`)
- [x] React frontend created (`zk-battleship-frontend/`)
- [x] All components implemented (ShipPlacement, BattleGrid, ProofSpinner)
- [x] Stellar SDK integration complete
- [x] Noir proof utilities created
- [x] Documentation written (4 guides)
- [x] Git commits completed (12 commits)

## Deployment Steps

### Step 1: Install Dependencies ⏳
```bash
cd /home/marvi/Documents/Stellar-Game-Studio
bun install
cd zk-battleship-frontend
bun install
```
- [ ] Root dependencies installed
- [ ] Frontend dependencies installed

### Step 2: Compile Noir Circuit ⏳
```bash
cd /home/marvi/Documents/Stellar-Game-Studio/circuits
nargo compile
```
- [ ] Circuit compiles without errors
- [ ] `target/battleship.json` created

### Step 3: Build Contract ⏳
```bash
cd /home/marvi/Documents/Stellar-Game-Studio
bun run build zk-battleship
```
- [ ] Contract builds successfully
- [ ] WASM file created in `target/`

### Step 4: Deploy to Testnet ⏳
```bash
bun run deploy zk-battleship
```
- [ ] Contract deployed
- [ ] Contract ID saved: `_______________________________`
- [ ] Transaction hash: `_______________________________`

### Step 5: Initialize Contract ⏳
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <YOUR_WALLET> \
  --network testnet \
  -- __constructor \
  --admin <YOUR_WALLET> \
  --game_hub CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG
```
- [ ] Contract initialized
- [ ] Game Hub address set

### Step 6: Update Frontend Config ⏳
Edit `zk-battleship-frontend/src/utils/stellar.ts`:
```typescript
const CONTRACT_ID = 'YOUR_CONTRACT_ID_HERE';
```
- [ ] CONTRACT_ID updated
- [ ] File saved

### Step 7: Test Locally ⏳
```bash
cd zk-battleship-frontend
bun run dev
```
- [ ] Frontend runs on http://localhost:3000
- [ ] Freighter connects successfully
- [ ] Ship placement works
- [ ] Proof generation works (<5s)
- [ ] Attack transactions succeed
- [ ] Win claim works

### Step 8: Build for Production ⏳
```bash
cd zk-battleship-frontend
bun run build
```
- [ ] Build completes without errors
- [ ] `dist/` folder created

### Step 9: Deploy Frontend ⏳
Choose one:
- [ ] Vercel: `vercel deploy`
- [ ] Netlify: `netlify deploy`
- [ ] GitHub Pages: `gh-pages -d dist`

Frontend URL: `_______________________________`

### Step 10: Record Demo Video ⏳
Follow script in `README_ZK_BATTLESHIP.md`:
- [ ] 0:00-0:20: Intro + architecture
- [ ] 0:20-0:50: Ship placement
- [ ] 0:50-1:30: Gameplay with proofs
- [ ] 1:30-2:00: Victory + claim
- [ ] 2:00-2:30: Technical highlights
- [ ] Video uploaded to YouTube/Loom

Video URL: `_______________________________`

### Step 11: Prepare Submission ⏳
- [ ] GitHub repo is public
- [ ] README updated with contract address
- [ ] Demo video linked in README
- [ ] Live frontend URL in README
- [ ] All code committed and pushed

### Step 12: Submit to DoraHacks ⏳
Required information:
- [ ] Project name: "ZK Battleship"
- [ ] GitHub URL: `_______________________________`
- [ ] Demo video URL: `_______________________________`
- [ ] Live demo URL: `_______________________________`
- [ ] Contract address: `_______________________________`
- [ ] Game Hub proof (explorer link): `_______________________________`

Submission text (copy from `PROJECT_COMPLETE.md`):
- [ ] Description written
- [ ] Tech stack listed
- [ ] Links included
- [ ] Submitted!

## Post-Submission

### Verification ⏳
- [ ] Contract visible on Stellar Expert
- [ ] Frontend loads correctly
- [ ] Video plays without issues
- [ ] GitHub repo accessible
- [ ] DoraHacks submission confirmed

### Promotion ⏳
- [ ] Tweet about submission
- [ ] Share in Stellar Discord
- [ ] Post in Noir community
- [ ] Share on LinkedIn

### Monitoring ⏳
- [ ] Check DoraHacks for comments
- [ ] Monitor contract transactions
- [ ] Track frontend analytics
- [ ] Respond to questions

## Troubleshooting

### Common Issues
- **Noir compile fails**: Check Noir version >= 0.23.0
- **Contract build fails**: Ensure Rust + Stellar CLI installed
- **Deploy fails**: Check wallet has testnet XLM
- **Frontend errors**: Run `bun install` again
- **Freighter issues**: Switch to Testnet in settings

### Support Resources
- Stellar Discord: #soroban channel
- Noir Docs: https://noir-lang.org
- Stellar Docs: https://developers.stellar.org
- Project docs: `DEPLOYMENT_GUIDE.md`

## Success Criteria

### Minimum Viable Submission ✅
- [x] Code complete and committed
- [ ] Contract deployed to testnet
- [ ] Frontend deployed and accessible
- [ ] Demo video recorded
- [ ] DoraHacks submission complete

### Winning Submission 🏆
- [ ] All minimum criteria met
- [ ] Polished demo video
- [ ] Clean, documented code
- [ ] Working live demo
- [ ] Active on social media
- [ ] Responsive to feedback

## Timeline

- **Day 1**: Deploy + test (2 hours)
- **Day 2**: Record video + deploy frontend (2 hours)
- **Day 3**: Submit + promote (1 hour)
- **Total**: ~5 hours from code to submission

## Prize

🏆 **$5,000 XLM** for 1st place in Stellar Hacks: ZK Gaming

---

**Current Status**: ✅ Code Complete, Ready to Deploy

**Next Action**: Start with Step 1 (Install Dependencies)

**Estimated Time to Submission**: 5 hours

**Good luck! 🚀**
