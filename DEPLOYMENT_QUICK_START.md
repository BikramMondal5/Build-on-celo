# 🚀 Quick Deployment Guide - Choose Your Method

## ⚡ FASTEST: Deploy with Remix (Recommended)

**Why Remix?**
- ✅ No private key exposure
- ✅ No local setup needed
- ✅ Visual interface
- ✅ Direct MetaMask integration

**Steps:**
1. Go to https://remix.ethereum.org
2. Copy your contracts to Remix
3. Connect MetaMask (Celo Alfajores network)
4. Deploy with one click!

**Full Guide:** See `REMIX_DEPLOYMENT_GUIDE.md`

---

## 🔧 ALTERNATIVE: Deploy with Hardhat

### Prerequisites:
```bash
# 1. Get testnet CELO
Visit: https://faucet.celo.org/alfajores
Enter your wallet address

# 2. Create .env file
Copy .env.example to .env
```

### Setup .env file:

Create a file named `.env` in your project root:

```bash
# Get your private key from MetaMask:
# 1. Open MetaMask
# 2. Click 3 dots → Account Details → Show Private Key
# 3. Copy and paste below (TESTNET WALLET ONLY!)

PRIVATE_KEY=your_private_key_here

# Network (already set)
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
CUSD_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
```

### Deploy Commands:

```bash
# Step 1: Compile contracts
npx hardhat compile

# Step 2: Deploy to Celo Alfajores
npx hardhat run scripts/deploy-rewards.js --network alfajores

# Step 3: Fund the rewards contract (optional)
npx hardhat run scripts/fund-rewards.js --network alfajores
```

### After Deployment:

The script will output contract addresses like:
```
ImpactCertificate: 0x1234...5678
StudentRewards: 0xabcd...efgh
```

**Update these in:** `client/src/lib/rewardsService.ts`

---

## 🎯 My Recommendation

**Use Remix!** It's safer and easier. Here's why:

| Feature | Remix | Hardhat |
|---------|-------|---------|
| **Safety** | ✅ No private key exposure | ⚠️ Need to handle private key |
| **Setup** | ✅ None needed | ❌ Need .env file |
| **Speed** | ✅ 5 minutes | ⏱️ 10-15 minutes |
| **Interface** | ✅ Visual GUI | ❌ Command line |

---

## 📞 Need Help?

If you want to use **Hardhat**, I can guide you through each step.
If you want to use **Remix**, open `REMIX_DEPLOYMENT_GUIDE.md` for detailed instructions.

Let me know which method you prefer!
