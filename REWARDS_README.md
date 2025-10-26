# RePlate Rewards System - Celo Blockchain Integration

## 🎯 Overview

The RePlate Rewards System incentivizes food waste reduction through blockchain-based rewards on Celo:

- **Students** receive **cUSD** (Celo stablecoin) for claiming surplus meals
- **Admins/Donors** receive **NFT certificates** showcasing their environmental impact

All transactions are recorded on the Celo blockchain for transparency and verifiability.

## 🏗️ Architecture

### Smart Contracts (Solidity 0.8.19)

#### 1. ImpactCertificate.sol
- **Type**: ERC-721 NFT
- **Purpose**: Issue certificates to admins/donors showing their impact
- **Features**:
  - Achievement levels: BRONZE, SILVER, GOLD, PLATINUM (based on pickups)
  - Stores impact metrics: pickups, food donated (kg), CO2 saved, meals provided
  - Batch minting capability
  - On-chain metadata storage

#### 2. StudentRewards.sol
- **Type**: ERC-20 reward distributor
- **Purpose**: Distribute cUSD rewards to students
- **Features**:
  - Base reward: 0.5 cUSD per meal claimed
  - Welcome bonus: 1 cUSD for first claim
  - Milestone bonus: 2 cUSD every 10 meals
  - Streak bonus: 1 cUSD every 7 consecutive days
  - Batch reward distribution for testing
  - Pausable for emergencies

### Frontend Integration

#### rewardsService.ts
- Web3 provider management
- Contract interaction layer
- Celo testnet/mainnet switching
- Transaction monitoring
- Event listening

#### test-rewards-button.tsx
- Admin UI for testing contracts
- Real-time transaction feedback
- Success/error handling
- CeloScan integration for verification

## 💰 Reward Economics

### Student Rewards (cUSD)

| Action | Reward | Condition |
|--------|--------|-----------|
| First meal claim | 1.5 cUSD | Welcome bonus (1x only) |
| Regular meal claim | 0.5 cUSD | Per meal |
| 10 meals milestone | +2 cUSD | Every 10 meals |
| 7-day streak | +1 cUSD | Every 7 consecutive days |

**Example Student Journey:**
```
Day 1:  Claim meal #1  → 1.5 cUSD (0.5 + 1.0 welcome bonus)
Day 2:  Claim meal #2  → 0.5 cUSD
Day 3:  Claim meal #3  → 0.5 cUSD
...
Day 10: Claim meal #10 → 2.5 cUSD (0.5 + 2.0 milestone bonus)
Day 17: Claim meal #17 → 1.5 cUSD (0.5 + 1.0 streak bonus)
```

### Admin NFT Certificates

| Pickups | Level | Badge |
|---------|-------|-------|
| 1-19 | BRONZE | 🥉 |
| 20-49 | SILVER | 🥈 |
| 50-99 | GOLD | 🥇 |
| 100+ | PLATINUM | 💎 |

**Certificate Metadata:**
- Organization name
- Total pickups
- Food donated (kg)
- CO2 saved (kg)
- Meals provided
- Achievement level
- Issue timestamp

## 🚀 Quick Start

### Prerequisites
```bash
# 1. Install dependencies
npm install ethers @ethersproject/providers

# 2. Install Hardhat (for contract deployment)
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
```

### Get Testnet Tokens
1. **CELO**: [Celo Faucet](https://faucet.celo.org/alfajores)
2. **cUSD**: Swap CELO → cUSD on [Ubeswap](https://app.ubeswap.org)

### Deploy Contracts
```bash
# 1. Configure environment
cp .env.example .env
# Add your testnet private key to .env

# 2. Compile contracts
npx hardhat compile

# 3. Deploy to Alfajores testnet
npx hardhat run scripts/deploy-rewards.js --network alfajores

# 4. Fund StudentRewards contract
npx hardhat run scripts/fund-rewards.js --network alfajores
```

### Update Frontend
```typescript
// client/src/lib/rewardsService.ts
export const CELO_TESTNET_CONFIG = {
  // ... other config
  impactCertificate: '0xYOUR_DEPLOYED_ADDRESS',
  studentRewards: '0xYOUR_DEPLOYED_ADDRESS'
};
```

### Test in Admin Dashboard
1. Navigate to Admin Dashboard → "Test Rewards" tab
2. Click "Connect to Celo Testnet"
3. Click "Distribute Test Rewards"
4. Verify transactions on [CeloScan](https://alfajores.celoscan.io)

## 📁 File Structure

```
Build-on-celo/
├── contracts/
│   ├── ImpactCertificate.sol      # NFT certificate contract
│   ├── StudentRewards.sol         # cUSD reward distribution
│   └── package.json               # Contract dependencies
├── scripts/
│   ├── deploy-rewards.js          # Deployment script
│   └── fund-rewards.js            # Fund rewards contract
├── client/src/
│   ├── lib/
│   │   └── rewardsService.ts      # Web3 integration layer
│   └── components/
│       └── rewards/
│           └── test-rewards-button.tsx  # Admin test UI
├── hardhat.config.js              # Hardhat configuration
└── REWARDS_DEPLOYMENT_GUIDE.md    # Detailed deployment guide
```

## 🔧 Smart Contract Functions

### ImpactCertificate (Admin NFTs)

```solidity
// Issue single certificate
function issueCertificate(
    address recipient,
    string organizationName,
    uint256 totalPickups,
    uint256 foodDonatedKg,
    uint256 co2SavedKg,
    uint256 mealsProvided,
    string tokenURI
) returns (uint256 tokenId)

// Batch issue certificates (for testing)
function batchIssueCertificates(
    address[] recipients,
    string[] organizationNames,
    uint256[] totalPickups,
    uint256[] foodDonatedKgs,
    uint256[] co2SavedKgs,
    uint256[] mealsProvidedList,
    string[] tokenURIs
) returns (uint256[] tokenIds)

// Get all certificates for an admin
function getCertificatesForRecipient(address recipient) 
    returns (CertificateData[] certificates)
```

### StudentRewards (Student cUSD)

```solidity
// Reward single student
function rewardStudent(address student) 
    returns (uint256 rewardAmount)

// Batch reward students (for testing)
function batchRewardStudents(address[] studentAddresses) 
    returns (uint256 totalDistributed)

// Get student data
function getStudentData(address student) 
    returns (
        uint256 totalMeals,
        uint256 totalRewards,
        uint256 lastClaim,
        uint256 streak,
        bool active
    )

// Preview next reward
function previewNextReward(address student) 
    returns (uint256 estimatedReward)

// Get statistics
function getStatistics() 
    returns (
        uint256 totalStudents,
        uint256 totalMeals,
        uint256 totalRewards,
        uint256 contractBalance
    )
```

## 🌐 Frontend Integration

### Initialize Service
```typescript
import { rewardsService } from '@/lib/rewardsService';

// Initialize and connect to Celo
await rewardsService.initialize();
```

### Reward a Student
```typescript
// Single student
const tx = await rewardsService.rewardStudent(studentAddress);
await tx.wait();

// Multiple students
const tx = await rewardsService.batchRewardStudents([
  '0xStudent1...',
  '0xStudent2...',
  '0xStudent3...'
]);
await tx.wait();
```

### Issue Certificate to Admin
```typescript
const tx = await rewardsService.issueCertificate(
  adminAddress,
  'Grand Hotel Downtown',
  45,    // total pickups
  680,   // food donated (kg)
  1190,  // CO2 saved (kg)
  1530,  // meals provided
  'ipfs://...'  // metadata URI
);
await tx.wait();
```

### Get Student Balance
```typescript
const balance = await rewardsService.getCUSDBalance(studentAddress);
console.log(`Student has ${balance} cUSD`);
```

### Check Admin Certificates
```typescript
const certificates = await rewardsService.getCertificatesForRecipient(adminAddress);
console.log(`Admin has ${certificates.length} certificates`);
```

## 🧪 Testing

### Test Data (Included in Button)
- **5 test students** (will receive cUSD)
- **3 test admins** (will receive NFTs):
  - Grand Hotel Downtown (45 pickups → SILVER)
  - Riverside Restaurant Group (32 pickups → SILVER)
  - Campus Cafeteria Services (68 pickups → GOLD)

### Run Tests
```bash
# Admin Dashboard → Test Rewards Tab → "Distribute Test Rewards"
```

### Verify Results
1. **CeloScan**: Check transaction hashes
2. **MetaMask**: View cUSD balances
3. **OpenSea**: View NFT certificates (may take time to index)

## 📊 Monitoring & Analytics

### Contract Events

```solidity
// Student rewards
event StudentRewarded(address indexed student, uint256 amount, uint256 mealNumber, uint256 timestamp);
event BonusRewarded(address indexed student, uint256 bonusAmount, string reason);
event BatchRewardsDistributed(uint256 studentCount, uint256 totalAmount);

// Admin certificates
event CertificateIssued(uint256 indexed tokenId, address indexed recipient, string organizationName, uint256 totalPickups, uint256 foodDonatedKg, string achievementLevel);
```

### Listen to Events
```typescript
// Listen for student rewards
rewardsService.studentRewardsContract.on('StudentRewarded', (student, amount, mealNumber, timestamp) => {
  console.log(`Student ${student} received ${ethers.utils.formatEther(amount)} cUSD`);
});

// Listen for certificates
rewardsService.impactCertificateContract.on('CertificateIssued', (tokenId, recipient, org, pickups, food, level) => {
  console.log(`${org} received ${level} certificate (Token #${tokenId})`);
});
```

## 🔐 Security Features

### Smart Contract Security
- ✅ OpenZeppelin battle-tested contracts
- ✅ ReentrancyGuard on all state-changing functions
- ✅ AccessControl with role-based permissions
- ✅ Pausable for emergency stops
- ✅ Safe ERC20/ERC721 transfers

### Roles
- **REWARD_MANAGER_ROLE**: Can distribute student rewards
- **MINTER_ROLE**: Can issue admin certificates
- **DEFAULT_ADMIN_ROLE**: Can grant/revoke roles and pause contracts

### Best Practices
- Never expose private keys
- Use environment variables for sensitive data
- Test thoroughly on Alfajores before mainnet
- Implement multi-sig for production admin roles
- Monitor contract balances regularly

## 🌍 Network Configuration

### Alfajores Testnet
```typescript
{
  chainId: 44787,
  rpcUrl: 'https://alfajores-forn.celo-testnet.org',
  explorer: 'https://alfajores.celoscan.io',
  cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'
}
```

### Celo Mainnet
```typescript
{
  chainId: 42220,
  rpcUrl: 'https://forno.celo.org',
  explorer: 'https://celoscan.io',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a'
}
```

## 💡 Use Cases

### 1. Student Meal Claims
```
Student scans QR → Claims meal → Receives 0.5 cUSD → Can spend or save
```

### 2. Admin Impact Recognition
```
Admin donates 50 meals → Earns GOLD certificate → Showcases on website/social media
```

### 3. Monthly Rewards
```
Run batch rewards at month-end → All active students get bonuses → Track engagement
```

### 4. CSR Reporting
```
Admin views NFT → Shows stakeholders verified impact → Uses in ESG reports
```

## 📈 Scalability

### Gas Optimization
- Batch operations for multiple users
- Optimized storage layouts
- Minimal external calls

### Cost Estimates (Alfajores)
- Deploy ImpactCertificate: ~0.05 CELO
- Deploy StudentRewards: ~0.08 CELO
- Reward single student: ~0.002 CELO
- Batch reward 10 students: ~0.008 CELO
- Issue certificate: ~0.003 CELO

## 🛠️ Troubleshooting

### Common Issues

**"Insufficient funds"**
- Get more testnet CELO from faucet
- Ensure StudentRewards contract has cUSD balance

**"Transaction reverted"**
- Check contract has REWARD_MANAGER_ROLE
- Verify cUSD approval before deposit

**"Wrong network"**
- Switch MetaMask to Celo Alfajores (Chain ID: 44787)
- Use the "Switch Network" button in the app

**"Contract not found"**
- Update contract addresses in rewardsService.ts
- Verify deployment succeeded

## 📚 Additional Resources

- **Celo Docs**: https://docs.celo.org
- **OpenZeppelin**: https://docs.openzeppelin.com
- **Hardhat**: https://hardhat.org
- **Ethers.js**: https://docs.ethers.org
- **Celo Faucet**: https://faucet.celo.org/alfajores
- **CeloScan**: https://alfajores.celoscan.io

## 🤝 Contributing

Improvements welcome! Areas for contribution:
- Enhanced NFT metadata (IPFS integration)
- More complex reward tiers
- Governance mechanisms
- Analytics dashboard
- Mobile app integration

## 📄 License

MIT License - See LICENSE file

---

**Built with ❤️ on Celo for a sustainable future**
