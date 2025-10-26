# Smart Contract Deployment Guide

## Prerequisites

Before deploying the RePlate treasury smart contracts, ensure you have:

1. **Node.js** (v16 or higher)
2. **Hardhat** development environment
3. **Celo wallet** with testnet/mainnet CELO for gas
4. **Private key** for deployment wallet

## Installation

### 1. Install Dependencies

```bash
# Install Hardhat and related packages
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Install OpenZeppelin contracts
npm install @openzeppelin/contracts

# Install Celo-specific tools
npm install @celo/contractkit
```

### 2. Create Hardhat Config

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Celo Alfajores Testnet
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 44787,
    },
    // Celo Mainnet
    celo: {
      url: "https://forno.celo.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 42220,
    },
  },
  etherscan: {
    apiKey: {
      alfajores: process.env.CELOSCAN_API_KEY || "",
      celo: process.env.CELOSCAN_API_KEY || "",
    },
  },
};
```

### 3. Create Environment File

Create `.env`:

```env
# Deployment wallet private key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# CeloScan API key for verification (optional)
CELOSCAN_API_KEY=your_api_key_here

# Network selection (alfajores or celo)
NETWORK=alfajores
```

## Deployment Scripts

### 1. Deploy Treasury Contract

Create `scripts/deploy-treasury.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  const isTestnet = network === "alfajores";
  
  console.log(`Deploying to ${network}...`);
  
  // Get cUSD address for network
  const CUSD_ADDRESS = isTestnet 
    ? "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" // Testnet
    : "0x765DE816845861e75A25fCA122bb6898B8B1282a"; // Mainnet
  
  console.log(`Using cUSD at: ${CUSD_ADDRESS}`);
  
  // Deploy Treasury
  const Treasury = await hre.ethers.getContractFactory("RePlateTreasury");
  const treasury = await Treasury.deploy(CUSD_ADDRESS);
  await treasury.deployed();
  
  console.log(`✅ Treasury deployed to: ${treasury.address}`);
  
  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  await treasury.deployTransaction.wait(5);
  
  // Verify on CeloScan
  if (process.env.CELOSCAN_API_KEY) {
    console.log("Verifying contract on CeloScan...");
    try {
      await hre.run("verify:verify", {
        address: treasury.address,
        constructorArguments: [CUSD_ADDRESS],
      });
      console.log("✅ Contract verified");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }
  
  return treasury.address;
}

main()
  .then((address) => {
    console.log("\n📝 Save this address:");
    console.log(`TREASURY_ADDRESS=${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 2. Deploy Subscription Manager

Create `scripts/deploy-subscription.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  const isTestnet = network === "alfajores";
  
  // Get addresses
  const CUSD_ADDRESS = isTestnet 
    ? "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
    : "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
  
  if (!TREASURY_ADDRESS) {
    throw new Error("TREASURY_ADDRESS not set. Deploy treasury first.");
  }
  
  console.log(`Deploying SubscriptionManager to ${network}...`);
  console.log(`Treasury: ${TREASURY_ADDRESS}`);
  
  // Deploy
  const SubscriptionManager = await hre.ethers.getContractFactory("SubscriptionManager");
  const subscription = await SubscriptionManager.deploy(
    CUSD_ADDRESS,
    TREASURY_ADDRESS
  );
  await subscription.deployed();
  
  console.log(`✅ SubscriptionManager deployed to: ${subscription.address}`);
  
  // Grant SUBSCRIPTION_MANAGER_ROLE to this contract in Treasury
  console.log("\nGranting SUBSCRIPTION_MANAGER_ROLE to contract...");
  const Treasury = await hre.ethers.getContractAt("RePlateTreasury", TREASURY_ADDRESS);
  const ROLE = await Treasury.SUBSCRIPTION_MANAGER_ROLE();
  
  const tx = await Treasury.grantRole(ROLE, subscription.address);
  await tx.wait();
  console.log("✅ Role granted");
  
  // Wait and verify
  await subscription.deployTransaction.wait(5);
  
  if (process.env.CELOSCAN_API_KEY) {
    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: subscription.address,
        constructorArguments: [CUSD_ADDRESS, TREASURY_ADDRESS],
      });
      console.log("✅ Contract verified");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }
  
  return subscription.address;
}

main()
  .then((address) => {
    console.log("\n📝 Save this address:");
    console.log(`SUBSCRIPTION_ADDRESS=${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 3. Deploy Pickup Fee Manager

Create `scripts/deploy-pickup-fee.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  const isTestnet = network === "alfajores";
  
  const CUSD_ADDRESS = isTestnet 
    ? "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
    : "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
  
  if (!TREASURY_ADDRESS) {
    throw new Error("TREASURY_ADDRESS not set. Deploy treasury first.");
  }
  
  console.log(`Deploying PickupFeeManager to ${network}...`);
  
  const PickupFeeManager = await hre.ethers.getContractFactory("PickupFeeManager");
  const pickupFee = await PickupFeeManager.deploy(
    CUSD_ADDRESS,
    TREASURY_ADDRESS
  );
  await pickupFee.deployed();
  
  console.log(`✅ PickupFeeManager deployed to: ${pickupFee.address}`);
  
  // Grant OPERATOR_ROLE
  console.log("\nGranting OPERATOR_ROLE...");
  const Treasury = await hre.ethers.getContractAt("RePlateTreasury", TREASURY_ADDRESS);
  const ROLE = await Treasury.OPERATOR_ROLE();
  
  const tx = await Treasury.grantRole(ROLE, pickupFee.address);
  await tx.wait();
  console.log("✅ Role granted");
  
  await pickupFee.deployTransaction.wait(5);
  
  if (process.env.CELOSCAN_API_KEY) {
    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: pickupFee.address,
        constructorArguments: [CUSD_ADDRESS, TREASURY_ADDRESS],
      });
      console.log("✅ Contract verified");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }
  
  return pickupFee.address;
}

main()
  .then((address) => {
    console.log("\n📝 Save this address:");
    console.log(`PICKUP_FEE_ADDRESS=${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 4. Deploy All Contracts

Create `scripts/deploy-all.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying all RePlate Treasury contracts...\n");
  
  // 1. Deploy Treasury
  console.log("1️⃣  Deploying Treasury...");
  const treasuryAddress = await require("./deploy-treasury").main();
  
  // Set treasury address for next deployments
  process.env.TREASURY_ADDRESS = treasuryAddress;
  
  // 2. Deploy Subscription Manager
  console.log("\n2️⃣  Deploying Subscription Manager...");
  const subscriptionAddress = await require("./deploy-subscription").main();
  
  // 3. Deploy Pickup Fee Manager
  console.log("\n3️⃣  Deploying Pickup Fee Manager...");
  const pickupFeeAddress = await require("./deploy-pickup-fee").main();
  
  // Summary
  console.log("\n✅ All contracts deployed successfully!\n");
  console.log("📝 Contract Addresses:");
  console.log("=".repeat(50));
  console.log(`Treasury:         ${treasuryAddress}`);
  console.log(`Subscription:     ${subscriptionAddress}`);
  console.log(`Pickup Fee:       ${pickupFeeAddress}`);
  console.log("=".repeat(50));
  
  console.log("\n📋 Next Steps:");
  console.log("1. Update client/src/lib/treasuryService.ts with these addresses");
  console.log("2. Run database migrations: npm run db:migrate");
  console.log("3. Test the integration with testnet cUSD");
  console.log("4. Apply for Celo grants to fund the treasury");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Deployment Steps

### Step 1: Deploy to Testnet (Alfajores)

```bash
# 1. Get testnet CELO from faucet
# Visit: https://faucet.celo.org/alfajores

# 2. Deploy all contracts
npx hardhat run scripts/deploy-all.js --network alfajores

# 3. Save the contract addresses from output
```

### Step 2: Test Contracts

```bash
# Create test script
npx hardhat run scripts/test-treasury.js --network alfajores
```

### Step 3: Deploy to Mainnet

```bash
# ⚠️  ONLY deploy to mainnet after thorough testing!

# 1. Ensure wallet has enough CELO for gas
# 2. Double-check all contract code
# 3. Deploy
npx hardhat run scripts/deploy-all.js --network celo

# 4. Verify on CeloScan
# Contracts will be automatically verified if CELOSCAN_API_KEY is set
```

## Post-Deployment Configuration

### 1. Update Frontend

Edit `client/src/lib/treasuryService.ts`:

```typescript
const TREASURY_ADDRESS = "0x..."; // Your deployed address
const SUBSCRIPTION_ADDRESS = "0x...";
const PICKUP_FEE_ADDRESS = "0x...";
```

### 2. Grant Additional Roles

```bash
# Run admin script to grant roles to backend wallet
npx hardhat run scripts/grant-roles.js --network alfajores
```

### 3. Fund Initial Treasury

```bash
# If you have grant funding, send initial cUSD to treasury
npx hardhat run scripts/fund-treasury.js --network alfajores --amount 10000
```

## Verification

### Check Deployment

```bash
# Verify contracts are deployed
npx hardhat verify --network alfajores <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Example for Treasury
npx hardhat verify --network alfajores 0x... 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
```

### View on CeloScan

- **Testnet**: https://alfajores.celoscan.io/address/YOUR_ADDRESS
- **Mainnet**: https://celoscan.io/address/YOUR_ADDRESS

## Troubleshooting

### Gas Issues
- Ensure wallet has sufficient CELO
- Testnet: Get from https://faucet.celo.org/alfajores
- Mainnet: Purchase CELO from exchange

### Deployment Fails
- Check network connectivity
- Verify private key is correct
- Ensure contract code compiles: `npx hardhat compile`

### Role Grant Fails
- Ensure deployer wallet has ADMIN_ROLE
- Check treasury address is correct
- Verify transaction on CeloScan

## Security Checklist

Before mainnet deployment:

- [ ] Audit all smart contracts
- [ ] Test with testnet cUSD extensively
- [ ] Set up multi-sig wallet for admin functions
- [ ] Configure emergency pause mechanism
- [ ] Document all admin procedures
- [ ] Set up monitoring and alerts
- [ ] Create incident response plan

## Resources

- [Hardhat Docs](https://hardhat.org/docs)
- [Celo Docs](https://docs.celo.org/)
- [OpenZeppelin Docs](https://docs.openzeppelin.com/)
- [CeloScan](https://celoscan.io/)

---

**Need help?** Join Celo Discord: https://chat.celo.org/
