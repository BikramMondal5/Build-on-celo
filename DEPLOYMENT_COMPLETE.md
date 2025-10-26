# ✅ Food Donation Rewards - Setup Complete

## What We've Built

Two simple smart contracts for rewarding students and donors:

### 1. **SimpleStudentRewards.sol** ✨
- Students get **0.1 CELO** when they claim food
- Uses native CELO (no complex ERC20 tokens)
- Automatically mints NFT to admin when student claims
- Tracks student claim history
- Admin can withdraw unused funds

### 2. **AdminFoodCertificate.sol** 🏆
- **ERC721 NFT** for food donors (admins)
- Tracks total donations per admin
- Only mintable by linked StudentRewards contract
- Permanent certificate of contribution

## Files Created/Updated

### Smart Contracts
- ✅ `contracts/SimpleStudentRewards.sol` - Simple CELO rewards contract
- ✅ `contracts/AdminFoodCertificate.sol` - NFT certificate contract

### Deployment Scripts
- ✅ `scripts/deploy-food-donation.js` - Deploys both contracts and links them
- ✅ `scripts/fund-rewards.js` - Funds the rewards contract with CELO

### Configuration
- ✅ `hardhat.config.js` - Updated to Solidity 0.8.20, ES modules
- ✅ `DEPLOYMENT.md` - Complete deployment guide

### Files Removed (Old/Unnecessary)
- ❌ `contracts/StudentRewards.sol` - Complex ERC20 version
- ❌ `contracts/StudentRewardsCELO.sol` - Complex version
- ❌ `contracts/ImpactCertificate.sol` - Complex NFT version
- ❌ Old deployment scripts and guides

## ✅ Compilation Status

```
✅ Compiled successfully!
Compiled 17 Solidity files successfully (evm target: paris)
```

## 🚀 Ready to Deploy

### Step 1: Set Up Environment

Create `.env` file (if you haven't already):
```env
PRIVATE_KEY=your_private_key_here
CELOSCAN_API_KEY=your_api_key  # Optional
```

### Step 2: Get Testnet CELO

Visit: https://faucet.celo.org/alfajores
- Connect your wallet
- Request testnet CELO

### Step 3: Deploy Contracts

```bash
npx hardhat run scripts/deploy-food-donation.js --network celoAlfajores
```

This will:
- Deploy AdminFoodCertificate (NFT)
- Deploy SimpleStudentRewards
- Link them together
- Save addresses to `deployments/food-donation.json`

### Step 4: Fund the Contract

```bash
npx hardhat run scripts/fund-rewards.js --network celoAlfajores
```

Default sends 10 CELO. To customize:
```bash
FUND_AMOUNT=20 npx hardhat run scripts/fund-rewards.js --network celoAlfajores
```

## How It Works

### When a Student Claims Food:
1. Admin calls `claimFood(studentAddress, adminAddress)`
2. Contract sends **0.1 CELO** to student  
3. Contract mints **NFT certificate** to admin (or increments donation count)
4. Event emitted for tracking

### Contract Functions

**SimpleStudentRewards:**
- `claimFood(student, admin)` - Process claim and reward
- `getBalance()` - Check contract balance
- `getStudentStats(student)` - Get student's claim history
- `withdraw(amount)` - Admin withdraws unused CELO

**AdminFoodCertificate:**
- `mintCertificate(admin)` - Mint NFT (called by StudentRewards)
- `foodDonations(admin)` - Get total donations
- `tokenURI(tokenId)` - Get NFT metadata

## Frontend Integration

After deployment, update your frontend with the contract addresses:

```typescript
// client/src/lib/web3Config.ts
export const STUDENT_REWARDS_ADDRESS = "0x..."; // From deployments/food-donation.json
export const ADMIN_CERTIFICATE_ADDRESS = "0x...";
```

Then use the rewardsService to interact:

```typescript
import { claimFoodReward } from './lib/rewardsService';

// When student claims food
await claimFoodReward(studentAddress, adminAddress);
```

## Testing

### Check Contract Balance
```bash
npx hardhat console --network celoAlfajores
```
```javascript
const contract = await ethers.getContractAt("SimpleStudentRewards", "YOUR_ADDRESS");
const balance = await contract.getBalance();
console.log(ethers.formatEther(balance), "CELO");
```

### View on Explorer
After deployment, check:
- https://alfajores.celoscan.io/address/[YOUR_STUDENT_REWARDS_ADDRESS]
- https://alfajores.celoscan.io/address/[YOUR_ADMIN_CERTIFICATE_ADDRESS]

## Architecture Summary

```
┌─────────────────┐
│     Student     │
│  Claims Food    │
└────────┬────────┘
         │
         ▼
┌────────────────────────┐
│ SimpleStudentRewards   │
│                        │
│ 1. Send 0.1 CELO ──────┼──► Student Wallet
│                        │
│ 2. Mint NFT ───────────┼──► AdminFoodCertificate
└────────────────────────┘           │
                                     ▼
                          ┌──────────────────────┐
                          │   Admin Gets NFT     │
                          │  (Donation Receipt)  │
                          └──────────────────────┘
```

## Next Steps

1. ✅ **Contracts compiled and ready**
2. ⏳ **Deploy to Alfajores testnet**
3. ⏳ **Fund the rewards contract**
4. ⏳ **Update frontend configuration**
5. ⏳ **Test the complete flow**

## Support Resources

- **Celo Docs**: https://docs.celo.org
- **Hardhat Docs**: https://hardhat.org/docs
- **Faucet**: https://faucet.celo.org/alfajores
- **Explorer**: https://alfajores.celoscan.io
- **Deployment Guide**: See `DEPLOYMENT.md` for detailed instructions

---

**Ready to deploy!** 🎉 Follow the steps above to get your contracts on the Celo Alfajores testnet.
