# 🚀 Quick Reference - RePlate Rewards System

## One-Page Cheat Sheet

### 📦 What You Got
- ✅ 2 Smart Contracts (Celo blockchain)
- ✅ Test Button in Admin Dashboard
- ✅ Complete Documentation
- ✅ Deployment Scripts

---

## ⚡ Quick Start (5 Minutes)

```bash
# 1. Install
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
npm install ethers @ethersproject/providers

# 2. Setup
cp .env.example .env
# Edit .env and add your testnet private key

# 3. Deploy
npx hardhat compile
npx hardhat run scripts/deploy-rewards.js --network alfajores

# 4. Update addresses in client/src/lib/rewardsService.ts

# 5. Fund contract
npx hardhat run scripts/fund-rewards.js --network alfajores

# 6. Test via Admin Dashboard → "Test Rewards" tab
```

---

## 💰 Reward Amounts

| Action | Amount |
|--------|--------|
| First meal | 1.5 cUSD (0.5 + 1.0 welcome) |
| Regular meal | 0.5 cUSD |
| 10 meals | +2.0 cUSD bonus |
| 7-day streak | +1.0 cUSD bonus |

---

## 🏅 Certificate Levels

| Pickups | Level | Badge |
|---------|-------|-------|
| 1-19 | BRONZE | 🥉 |
| 20-49 | SILVER | 🥈 |
| 50-99 | GOLD | 🥇 |
| 100+ | PLATINUM | 💎 |

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `contracts/StudentRewards.sol` | cUSD distribution |
| `contracts/ImpactCertificate.sol` | NFT certificates |
| `client/src/lib/rewardsService.ts` | Web3 integration |
| `client/src/components/rewards/test-rewards-button.tsx` | Test UI |
| `scripts/deploy-rewards.js` | Deploy to Celo |
| `REWARDS_README.md` | Full documentation |

---

## 🌐 Important Links

- **Testnet Faucet**: https://faucet.celo.org/alfajores
- **Swap CELO→cUSD**: https://app.ubeswap.org
- **Explorer**: https://alfajores.celoscan.io
- **Celo Docs**: https://docs.celo.org

---

## 🔧 Contract Addresses (Update After Deploy)

```typescript
// In client/src/lib/rewardsService.ts
export const CELO_TESTNET_CONFIG = {
  impactCertificate: 'YOUR_ADDRESS_HERE',
  studentRewards: 'YOUR_ADDRESS_HERE',
  cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'
};
```

---

## 🧪 Test Data

### Students (5)
Each gets ~0.5-1.5 cUSD

### Admins (3)
1. Grand Hotel (45 pickups) → SILVER 🥈
2. Riverside Restaurant (32 pickups) → SILVER 🥈
3. Campus Cafeteria (68 pickups) → GOLD 🥇

---

## 💡 Quick Commands

```bash
# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy-rewards.js --network alfajores

# Fund rewards contract
npx hardhat run scripts/fund-rewards.js --network alfajores

# Verify contract (optional)
npx hardhat verify --network alfajores <ADDRESS>
```

---

## ⚠️ Before Testing Checklist

- [ ] Installed all dependencies
- [ ] Got testnet CELO from faucet
- [ ] Got testnet cUSD from Ubeswap
- [ ] Created .env with private key
- [ ] Deployed contracts successfully
- [ ] Updated contract addresses in rewardsService.ts
- [ ] Funded StudentRewards with cUSD
- [ ] MetaMask connected to Celo Alfajores

---

## 🐛 Common Issues

**"Insufficient funds"**
→ Get more CELO from faucet

**"Contract not deployed"**
→ Run deploy script and update addresses

**"Wrong network"**
→ Switch MetaMask to Celo Alfajores (Chain ID: 44787)

**"Transaction failed"**
→ Check StudentRewards has cUSD balance

---

## 📊 Monitor Your Deployment

After testing, check:
- ✅ Transaction hashes on CeloScan
- ✅ cUSD in student wallets
- ✅ NFTs in admin wallets
- ✅ Contract balances

---

## 🎯 Next Steps After Testing

1. Gather user feedback
2. Refine reward amounts
3. Add more students
4. Deploy to mainnet (when ready)
5. Launch! 🚀

---

**Need Help?** Check REWARDS_README.md or REWARDS_DEPLOYMENT_GUIDE.md

**Ready to Test?** Admin Dashboard → Test Rewards Tab → Click Button!
