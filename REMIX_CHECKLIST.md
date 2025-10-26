# 📋 Remix Deployment Checklist

## Pre-Deployment Setup ✅

- [ ] Install MetaMask extension
- [ ] Add Celo Alfajores network to MetaMask
  - RPC: `https://alfajores-forno.celo-testnet.org`
  - Chain ID: `44787`
- [ ] Get testnet CELO from faucet: https://faucet.celo.org/alfajores
- [ ] Get testnet cUSD (swap CELO → cUSD on Ubeswap)
- [ ] Open Remix: https://remix.ethereum.org

## Deploy on Remix 🚀

### 1. ImpactCertificate Contract
- [ ] Copy `contracts/ImpactCertificate.sol` to Remix
- [ ] Compile with Solidity 0.8.19
- [ ] Deploy (no constructor params)
- [ ] **Save Contract Address:** `_________________________`
- [ ] Grant MINTER_ROLE to your address
  - Role hash: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`

### 2. StudentRewards Contract
- [ ] Copy `contracts/StudentRewards.sol` to Remix
- [ ] Compile with Solidity 0.8.19
- [ ] Deploy with cUSD address: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
- [ ] **Save Contract Address:** `_________________________`
- [ ] Grant REWARD_MANAGER_ROLE to your address
  - Role hash: `0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08`
- [ ] Fund contract with cUSD (recommended: 100 cUSD)

## Update Frontend Configuration ⚙️

File: `client/src/lib/rewardsService.ts`

```typescript
const CELO_TESTNET_CONFIG = {
  chainId: 44787,
  rpcUrl: 'https://alfajores-forno.celo-testnet.org',
  impactCertificateAddress: 'PASTE_YOUR_CERTIFICATE_ADDRESS_HERE',
  studentRewardsAddress: 'PASTE_YOUR_REWARDS_ADDRESS_HERE',
  cUSDAddress: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'
};
```

- [ ] Update `impactCertificateAddress`
- [ ] Update `studentRewardsAddress`
- [ ] Save file

## Testing 🧪

- [ ] Test ImpactCertificate.issueCertificate()
- [ ] Test StudentRewards.rewardStudent()
- [ ] Verify on Celoscan: https://alfajores.celoscan.io
- [ ] Run app: `npm run dev`
- [ ] Test Admin Dashboard → "Test Rewards" tab
- [ ] Click "Execute Test Rewards & Certificates"
- [ ] Verify transactions in MetaMask and Celoscan

## Deployed Contracts 📝

**ImpactCertificate:**
- Address: `_________________________`
- Transaction: `_________________________`
- Verified: [ ] Yes [ ] No

**StudentRewards:**
- Address: `_________________________`
- Transaction: `_________________________`
- Verified: [ ] Yes [ ] No
- cUSD Balance: `_________` cUSD

## Useful Links 🔗

- **Remix IDE:** https://remix.ethereum.org
- **Celo Faucet:** https://faucet.celo.org/alfajores
- **Celoscan Explorer:** https://alfajores.celoscan.io
- **Ubeswap (Get cUSD):** https://app.ubeswap.org
- **cUSD Token:** https://alfajores.celoscan.io/token/0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1

---

**Need detailed instructions?** See `REMIX_DEPLOYMENT_GUIDE.md`
