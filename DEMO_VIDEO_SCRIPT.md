# ZK Battleship - Demo Video Script
## Target: 2-3 minutes | Stellar Hacks: ZK Gaming Hackathon

---

## 🎬 SCENE 1: INTRODUCTION (0:00-0:20)

**[Screen: Stellar Explorer showing deployed contract]**

**Narration:**
> "ZK Battleship - a fully functional naval warfare game using Zero-Knowledge proofs on Stellar testnet. Unlike traditional online Battleship that requires trusting a server, our implementation uses Poseidon2 commitments and Noir ZK circuits to enable provably fair gameplay with hidden information."

**Show:**
- Contract address: `CCVL2EVEX4M7QVD7PBYV5B4WRIUI6O563GXNEZU6XJOHDE5UIXPHHZUE`
- Game Hub integration: `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`
- Scroll through contract functions

---

## 🎬 SCENE 2: ZK MECHANIC EXPLANATION (0:20-0:50)

**[Screen: Split view - Code editor + Diagram]**

**Narration:**
> "Here's how the ZK magic works. When you place your ships, we generate a Poseidon2 hash commitment - a cryptographic fingerprint of your ship positions. This commitment goes on-chain, but your actual ship locations remain completely private."

**Show:**
- `circuits/src/main.nr` - Noir circuit code
- Highlight Poseidon2 hash function
- Diagram showing: Ships → Poseidon2 → Commitment → Blockchain

**Narration (continued):**
> "When your opponent attacks, you generate a Zero-Knowledge proof that proves whether it's a hit or miss, WITHOUT revealing where your ships are. The proof is verified against your commitment - making cheating cryptographically impossible."

**Show:**
- Attack verification circuit code
- Proof generation animation
- Verification checkmark

---

## 🎬 SCENE 3: GAMEPLAY DEMO (0:50-1:50)

**[Screen: Game UI - Full screen]**

### Part A: Setup (0:50-1:10)

**Action:**
1. Click "Connect Wallet"
2. Freighter popup appears → Sign
3. Wallet address shows in header

**Narration:**
> "Let's play a game. First, I connect my Freighter wallet to Stellar testnet."

**Action:**
4. Click "⚡ Quick Demo ON" toggle
5. Place 2 ships on grid (drag and drop)
6. Ships appear with realistic graphics

**Narration:**
> "I'll use quick demo mode for this video - just 2 ships and 3 hits to win. I place my ships on the grid..."

**Action:**
7. Click "Confirm Placement"
8. Toast: "Generating commitment..."
9. Toast: "Initializing game on-chain... (check Freighter)"
10. Freighter popup → Sign transaction

**Narration:**
> "The game generates my Poseidon2 commitment and initializes the game on-chain. Notice the Freighter signature request - this is a REAL transaction calling start_game() on the Game Hub contract."

**Show:**
- Battle log showing commitment hash
- Battle log showing "Game Hub notified via start_game()"

### Part B: Combat (1:10-1:40)

**Action:**
11. Click on enemy grid (miss)
12. Toast: "Generating ZK proof..."
13. Water splash animation
14. Battle log: "Missed at A5. Shells hit water."

**Narration:**
> "Now I attack. Each attack generates a Zero-Knowledge proof in the browser using Noir.js. This proof cryptographically verifies the hit or miss result."

**Action:**
15. Enemy turn (simulated) - hit
16. Explosion animation on your grid
17. Battle log: "Enemy hit our vessel at C3!"

**Action:**
18. Make 2 more attacks (both hits)
19. Explosion animations
20. Battle log updates with each hit

**Narration:**
> "The battle continues. Notice the real-time battle log tracking every move, and the statistics updating - accuracy, hits, misses."

**Show:**
- Header stats updating (Accuracy: 67%, Hits: 2, Misses: 1)
- Battle log scrolling

### Part C: Victory (1:40-1:50)

**Action:**
21. Third hit lands
22. Confetti animation
23. Victory screen appears

**Narration:**
> "Victory! I've destroyed the enemy fleet."

---

## 🎬 SCENE 4: ON-CHAIN VERIFICATION (1:50-2:20)

**[Screen: Victory screen + Stellar Explorer]**

**Action:**
24. Click "Claim Win On-Chain"
25. Toast: "Submitting to blockchain... (check Freighter)"
26. Freighter popup → Sign transaction
27. Toast: "Victory Claimed On-Chain! Game Hub notified via end_game()"
28. Transaction hash shown

**Narration:**
> "Now I claim my victory on-chain. This calls the claim_win function, which internally notifies the Game Hub contract via end_game() - a required integration for the hackathon."

**Action:**
29. Click "View Transaction on Explorer"
30. Stellar Explorer opens showing transaction
31. Scroll through transaction details
32. Show contract call to Game Hub

**Narration:**
> "Here's the actual transaction on Stellar testnet. You can see the contract call, the gas used, and the Game Hub interaction. Everything is verifiable and permanent on the blockchain."

---

## 🎬 SCENE 5: TECHNICAL HIGHLIGHTS (2:20-2:50)

**[Screen: Code montage]**

**Show rapid cuts of:**
1. `circuits/src/main.nr` - Poseidon2 hash
2. `contracts/zk-battleship/src/lib.rs` - Game Hub integration
3. `zk-battleship-frontend/src/utils/noir.ts` - Proof generation
4. Terminal: `nargo compile` success
5. Contract deployment output

**Narration:**
> "Under the hood, we're using Stellar Protocol 25's new Poseidon2 primitives - specifically designed for Zero-Knowledge applications. The Noir circuit is compiled and working, generating real proofs client-side. The Soroban smart contract properly integrates with the Game Hub, calling start_game and end_game as required."

---

## 🎬 SCENE 6: CLOSING (2:50-3:00)

**[Screen: Game UI with ocean background]**

**Narration:**
> "ZK Battleship proves that Zero-Knowledge proofs aren't just theoretical - they enable entirely new game mechanics. Hidden information, provable outcomes, and trustless gameplay. All deployed and working on Stellar testnet today."

**Show:**
- GitHub repo URL
- Contract address
- "Built with Stellar Protocol 25 (X-Ray)"

**Text overlay:**
```
ZK Battleship
github.com/[your-repo]
Contract: CCVL2EVEX4M7QVD7PBYV5B4WRIUI6O563GXNEZU6XJOHDE5UIXPHHZUE
Built for Stellar Hacks: ZK Gaming
```

---

## 📋 RECORDING CHECKLIST

### Before Recording:
- [ ] Clear browser cache and cookies
- [ ] Fund wallet with testnet XLM (for gas)
- [ ] Test full flow once
- [ ] Close unnecessary browser tabs
- [ ] Set screen resolution to 1920x1080
- [ ] Enable "Do Not Disturb" mode
- [ ] Prepare Stellar Explorer tabs

### Recording Setup:
- [ ] Use OBS or similar (1080p, 60fps)
- [ ] Record system audio + microphone
- [ ] Use high-quality microphone
- [ ] Good lighting for webcam (if showing face)
- [ ] Quiet environment

### During Recording:
- [ ] Speak clearly and at moderate pace
- [ ] Pause briefly between scenes
- [ ] Show mouse cursor for clicks
- [ ] Wait for animations to complete
- [ ] Keep Freighter popups visible

### After Recording:
- [ ] Edit out long pauses
- [ ] Add background music (low volume)
- [ ] Add text overlays for key points
- [ ] Add zoom effects for code sections
- [ ] Export as MP4 (H.264, 1080p)
- [ ] Keep under 3 minutes

---

## 🎯 KEY MESSAGES TO EMPHASIZE

1. **Real ZK Proofs**: Not mocked, actually using Noir and Poseidon2
2. **Protocol 25**: Leveraging new Stellar primitives
3. **Game Hub Integration**: Required hackathon component
4. **Real Transactions**: Everything verifiable on-chain
5. **Practical Application**: ZK solves real trust problem in gaming

---

## 💡 TIPS FOR GREAT DEMO

- **Energy**: Be enthusiastic but not over-the-top
- **Clarity**: Explain technical concepts simply
- **Pacing**: Not too fast, not too slow
- **Visuals**: Show, don't just tell
- **Proof**: Always show the actual transactions
- **Polish**: Professional presentation matters

---

## 🚨 COMMON MISTAKES TO AVOID

- ❌ Talking too fast
- ❌ Not showing Freighter signatures
- ❌ Skipping the Game Hub integration
- ❌ Not showing actual transactions on Explorer
- ❌ Too much technical jargon
- ❌ Video longer than 3 minutes
- ❌ Poor audio quality
- ❌ Not explaining WHY ZK matters

---

**Good luck! 🚀**
