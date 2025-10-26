# 🚀 Food Donation Rewards - Deployment Guide

## Overview
This system rewards students with **native CELO** when they claim food, and mints an **NFT certificate** to the admin who donated the food.

## Smart Contracts

### 1. SimpleStudentRewards.sol
- **Purpose**: Rewards students with 0.1 CELO per meal claim
- **Features**: 
  - Uses native CELO (no ERC20 complexity)
  - Tracks student claim history
  - Automatically mints NFT to admin when student claims
  - Owner can withdraw unused funds

### 2. AdminFoodCertificate.sol
- **Purpose**: NFT certificates for food donors (admins)
- **Features**:
  - ERC721 standard NFT
  - Tracks total food donations per admin
  - Can only be minted by linked StudentRewards contract

## Prerequisites

1. **Node.js & npm** installed
2. **Hardhat** environment set up
3. **Celo Alfajores testnet** access
4. **Private key** with testnet CELO

## Quick Start

### Step 1: Set Up Environment

Create `.env` file in project root:
```env
PRIVATE_KEY=your_private_key_here
CELOSCAN_API_KEY=your_celoscan_api_key_here  # Optional, for verification
```

### Step 2: Deploy Contracts

```bash
npx hardhat run scripts/deploy-food-donation.js --network celoAlfajores
```

This will:
- Deploy AdminFoodCertificate contract
- Deploy SimpleStudentRewards contract
- Link them together
- Save addresses to `deployments/food-donation.json`

### Step 3: Fund the Rewards Contract

```bash
npx hardhat run scripts/fund-rewards.js --network celoAlfajores
```

Default: Sends 10 CELO to the contract

To customize the amount:
```bash
FUND_AMOUNT=20 npx hardhat run scripts/fund-rewards.js --network celoAlfajores
```

## Contract Addresses

After deployment, contract addresses are saved to:
```
deployments/food-donation.json
```

Example structure:
```json
{
  "adminCertificate": "0x...",
  "studentRewards": "0x...",
  "network": "celoAlfajores",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## How It Works

### Student Claims Food
1. Admin calls `claimFood(studentAddress, adminAddress)`
2. Contract sends 0.1 CELO to student
3. Contract mints NFT certificate to admin (or increments their donation count)
4. Event emitted: `RewardClaimed(student, admin, amount, timestamp)`

### Contract Functions

**SimpleStudentRewards.sol:**
- `claimFood(address student, address admin)` - Reward student & mint NFT
- `getBalance()` - Check contract CELO balance
- `getStudentStats(address student)` - Get student's claim history
- `withdraw(uint256 amount)` - Owner withdraws unused CELO

**AdminFoodCertificate.sol:**
- `mintCertificate(address admin)` - Mint NFT to admin (only StudentRewards can call)
- `foodDonations(address admin)` - Get total donations by admin
- `tokenURI(uint256 tokenId)` - Get NFT metadata

## Testing on Alfajores

1. Get testnet CELO from faucet:
   - https://faucet.celo.org/alfajores

2. View contracts on explorer:
   - https://alfajores.celoscan.io/address/[YOUR_CONTRACT_ADDRESS]

3. Interact with contract:
   ```bash
   # Check contract balance
   npx hardhat console --network celoAlfajores
   > const contract = await ethers.getContractAt("SimpleStudentRewards", "YOUR_ADDRESS")
   > const balance = await contract.getBalance()
   > console.log(ethers.formatEther(balance))
   ```

## Frontend Integration

Update your frontend config with deployed addresses:

```typescript
// client/src/lib/web3Config.ts
export const STUDENT_REWARDS_ADDRESS = "0x..."; // From deployments/food-donation.json
export const ADMIN_CERTIFICATE_ADDRESS = "0x...";
```

## Troubleshooting

### Insufficient CELO Balance
- Get testnet CELO from https://faucet.celo.org/alfajores

### Transaction Reverts
- Ensure contract has enough CELO balance
- Check that addresses are valid Celo addresses

### Contract Not Found
- Verify deployment completed successfully
- Check `deployments/food-donation.json` for addresses

## Support

- Celo Documentation: https://docs.celo.org
- Hardhat Docs: https://hardhat.org/docs
- Alfajores Faucet: https://faucet.celo.org/alfajores
- Alfajores Explorer: https://alfajores.celoscan.io
