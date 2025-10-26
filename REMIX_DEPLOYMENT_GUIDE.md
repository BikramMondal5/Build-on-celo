# 🚀 Deploy Contracts on Remix IDE - Complete Guide

This guide will help you deploy the **ImpactCertificate** and **StudentRewards** contracts on Remix IDE to Celo Alfajores Testnet.

## 📋 Prerequisites

### 1. MetaMask Setup
- Install [MetaMask](https://metamask.io/) browser extension
- Add Celo Alfajores Testnet to MetaMask

### 2. Add Celo Alfajores Network to MetaMask

**Network Details:**
- **Network Name:** Celo Alfajores Testnet
- **RPC URL:** `https://alfajores-forno.celo-testnet.org`
- **Chain ID:** `44787`
- **Currency Symbol:** CELO
- **Block Explorer:** `https://alfajores.celoscan.io`

**Steps to Add:**
1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add Network Manually"
3. Enter the details above
4. Click "Save"

### 3. Get Testnet CELO
1. Visit [Celo Faucet](https://faucet.celo.org/alfajores)
2. Enter your wallet address
3. Click "Get Testnet CELO"
4. Wait for CELO to arrive (~30 seconds)

### 4. Get Testnet cUSD (for StudentRewards contract)
1. Visit [Ubeswap](https://app.ubeswap.org)
2. Connect your wallet
3. Switch to Alfajores network
4. Swap some CELO → cUSD
5. Or use the cUSD faucet at the Celo faucet

---

## 📝 Step-by-Step Deployment on Remix

### Step 1: Open Remix IDE
Go to: **https://remix.ethereum.org**

### Step 2: Create Contract Files

#### A. Create ImpactCertificate.sol
1. In Remix, go to **File Explorers** (left sidebar)
2. Click "contracts" folder
3. Create new file: `ImpactCertificate.sol`
4. Copy the entire content from your local `contracts/ImpactCertificate.sol` file
5. Paste it into Remix

#### B. Create StudentRewards.sol
1. In the same "contracts" folder
2. Create new file: `StudentRewards.sol`
3. Copy the entire content from your local `contracts/StudentRewards.sol` file
4. Paste it into Remix

### Step 3: Compile Contracts

#### For ImpactCertificate.sol:
1. Click on **Solidity Compiler** icon (left sidebar)
2. Select compiler version: **0.8.19**
3. Click **"Compile ImpactCertificate.sol"**
4. Wait for green checkmark ✅

#### For StudentRewards.sol:
1. Select the file in the editor
2. Click **"Compile StudentRewards.sol"**
3. Wait for green checkmark ✅

### Step 4: Deploy Contracts

#### A. Deploy ImpactCertificate Contract

1. Click **Deploy & Run Transactions** icon (left sidebar)
2. **Environment:** Select **"Injected Provider - MetaMask"**
3. MetaMask will popup → **Connect** your wallet
4. Ensure you're on **Celo Alfajores** network (check MetaMask)
5. **Contract:** Select **ImpactCertificate**
6. Click **Deploy** (no constructor parameters needed)
7. **Confirm transaction in MetaMask**
8. Wait for deployment (~5-10 seconds)
9. **IMPORTANT:** Copy the deployed contract address (you'll see it under "Deployed Contracts")

**Example:** `0x1234...5678`

#### B. Deploy StudentRewards Contract

1. **Contract:** Select **StudentRewards**
2. **Constructor Parameters:** You need to provide the cUSD token address

**For Celo Alfajores Testnet, use:**
```
0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
```

3. Paste this address in the **cUSD** field next to the Deploy button
4. Click **Deploy**
5. **Confirm transaction in MetaMask**
6. Wait for deployment
7. **IMPORTANT:** Copy the deployed contract address

---

## 🔧 Post-Deployment Configuration

### Step 1: Configure ImpactCertificate Contract

After deployment, you need to grant minter role:

1. **Expand** the deployed ImpactCertificate contract in Remix
2. Find the **grantRole** function
3. Enter parameters:
   - **role:** `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`
     (This is the keccak256 hash of "MINTER_ROLE")
   - **account:** Your wallet address (or another address you want to grant minting rights)
4. Click **transact**
5. **Confirm in MetaMask**

### Step 2: Configure StudentRewards Contract

#### A. Set Reward Parameters (Optional - has defaults)

The contract has default values, but you can customize:

1. **Expand** the deployed StudentRewards contract
2. Find **setRewardPerMeal** function
3. Enter amount in Wei (e.g., `500000000000000000` = 0.5 cUSD)
4. Click **transact** → Confirm in MetaMask

#### B. Grant Reward Manager Role

1. Find **grantRole** function
2. Enter parameters:
   - **role:** `0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08`
     (This is keccak256 of "REWARD_MANAGER_ROLE")
   - **account:** Your wallet address
3. Click **transact** → Confirm

#### C. Fund the Contract with cUSD

You need to transfer cUSD to the StudentRewards contract so it can distribute rewards:

**Option 1: Via MetaMask**
1. Open MetaMask
2. Click "Send"
3. Select cUSD token
4. Send to: **StudentRewards contract address**
5. Amount: At least 100 cUSD recommended for testing

**Option 2: Via Remix (if you have cUSD in your wallet)**
1. In Remix, select the **cUSD token contract**
2. Use contract address: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
3. Select **IERC20** interface
4. Call **transfer** function:
   - **to:** StudentRewards contract address
   - **amount:** `100000000000000000000` (100 cUSD in Wei)
5. Confirm transaction

---

## ✅ Verify Deployments

### Check ImpactCertificate:
1. Visit: `https://alfajores.celoscan.io/address/YOUR_CONTRACT_ADDRESS`
2. You should see the contract creation transaction
3. Click "Contract" tab → "Verify & Publish" (optional but recommended)

### Check StudentRewards:
1. Visit: `https://alfajores.celoscan.io/address/YOUR_CONTRACT_ADDRESS`
2. Verify the contract has cUSD balance
3. Check that your role was granted

---

## 📝 Update Frontend Configuration

After deploying both contracts, update your frontend configuration:

**File:** `client/src/lib/rewardsService.ts`

Find and update these addresses (around line 17-23):

```typescript
const CELO_TESTNET_CONFIG = {
  chainId: 44787,
  rpcUrl: 'https://alfajores-forno.celo-testnet.org',
  impactCertificateAddress: 'YOUR_DEPLOYED_IMPACT_CERTIFICATE_ADDRESS',
  studentRewardsAddress: 'YOUR_DEPLOYED_STUDENT_REWARDS_ADDRESS',
  cUSDAddress: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'
};
```

Replace:
- `YOUR_DEPLOYED_IMPACT_CERTIFICATE_ADDRESS` with the ImpactCertificate contract address from Remix
- `YOUR_DEPLOYED_STUDENT_REWARDS_ADDRESS` with the StudentRewards contract address from Remix

---

## 🧪 Test the Contracts

### Test ImpactCertificate:

1. In Remix, expand the deployed contract
2. Call **issueCertificate** function:
   - **recipient:** A test address
   - **organizationName:** "Test Org"
   - **totalPickups:** 15
   - **foodDonatedKg:** 50
   - **co2SavedKg:** 25
   - **mealsProvided:** 100
   - **tokenURI:** "ipfs://your-metadata-uri" (or leave empty for testing)
3. Confirm transaction
4. Call **balanceOf** with the recipient address → should return 1

### Test StudentRewards:

1. In Remix, expand the deployed contract
2. Call **rewardStudent** function:
   - **student:** A test address
   - **mealsClaimed:** 1
3. Confirm transaction
4. Call **getStudentData** with the student address
5. Verify the student received rewards

---

## 🎯 Common Issues & Solutions

### Issue 1: "Gas estimation failed"
**Solution:** Ensure you have enough CELO in your wallet for gas fees

### Issue 2: "Execution reverted"
**Solution:** Check that:
- You granted the necessary roles
- Contract has sufficient cUSD balance (for StudentRewards)
- You're using the correct network (Alfajores)

### Issue 3: MetaMask not connecting
**Solution:** 
- Refresh Remix page
- Disconnect and reconnect wallet
- Clear MetaMask cache

### Issue 4: Contract not verified on explorer
**Solution:**
- Go to Celoscan contract page
- Click "Verify & Publish"
- Select compiler version 0.8.19
- Paste contract code
- Submit for verification

---

## 📚 Quick Reference

### Important Addresses (Alfajores Testnet):
- **cUSD Token:** `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
- **CELO Faucet:** https://faucet.celo.org/alfajores
- **Block Explorer:** https://alfajores.celoscan.io
- **Ubeswap DEX:** https://app.ubeswap.org

### Role Hashes:
- **MINTER_ROLE:** `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`
- **REWARD_MANAGER_ROLE:** `0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08`

### Default Reward Values:
- **Reward per meal:** 0.5 cUSD
- **Bonus threshold:** 10 meals
- **Bonus amount:** 2 cUSD
- **Welcome bonus:** 1 cUSD

---

## 🎉 Next Steps

After successful deployment:

1. ✅ Update frontend contract addresses
2. ✅ Test the admin dashboard "Test Rewards" button
3. ✅ Verify transactions on Celoscan
4. ✅ Monitor contract balances
5. ✅ Add more cUSD as needed for rewards

---

## 📞 Need Help?

- **Celo Discord:** https://discord.gg/celo
- **Remix Documentation:** https://remix-ide.readthedocs.io
- **Celo Documentation:** https://docs.celo.org

---

**Last Updated:** December 2024
**Network:** Celo Alfajores Testnet
**Solidity Version:** 0.8.19
**Status:** ✅ Ready for Deployment
