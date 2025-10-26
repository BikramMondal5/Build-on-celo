# RePlate Treasury & Revenue System

## 🎯 Overview

The RePlate Treasury system is the financial backbone of the platform, implementing a **sustainable revenue model** that funds NGO rewards while maintaining platform operations. This is critical for long-term success and scalability.

## 💰 Revenue Sources (Priority Order)

### 1. **SaaS Subscriptions** (Primary Revenue - 60-70%)
**Who pays**: Hotels, Restaurants, Event Venues  
**Why they pay**: 
- Save money on waste disposal
- Get valuable CSR data and reports
- Streamlined logistics and compliance
- Access to NGO network

**Pricing Tiers**:
- **Standard**: $100/month - Unlimited pickups, analytics, CSR reports
- **Premium**: $3/pickup (auto-upgrade at 50+ pickups/month)
- **Enterprise**: $2/pickup (auto-upgrade at 200+ pickups/month)
- **Custom**: Negotiated rates for large-scale operations

### 2. **Per-Pickup Fees** (Secondary Revenue - 20-30%)
**Who pays**: Donors for each successful pickup  
**Why they pay**: Immediate transaction-based value exchange

**Fee Structure**:
- $5 per pickup (Standard tier)
- $3 per pickup (Premium tier - 50+ monthly)
- $2 per pickup (Enterprise tier - 200+ monthly)
- Automatic tier upgrades based on volume

### 3. **Blockchain Grants** (Seed Funding - Months 0-6)
**Who gives**: Celo Foundation, Celo Camp, ReFi programs  
**Purpose**: Bootstrap the reward pool before revenue scales  
**Target**: $10,000-50,000 initial funding

**Application Resources**:
- Celo Foundation: https://celo.org/community
- Celo Camp: https://www.celocamp.com/
- ReFi DAO: https://www.refidao.com/

### 4. **Corporate Sponsorships** (Scale Phase - Year 2+)
**Who gives**: Large corporations with CSR budgets  
**Value Proposition**: 
- Logo featured on platform
- Branded "Impact Partner" NFTs
- Press release and PR support
- Direct, measurable impact

**Sponsorship Tiers**:
- **Supporter**: $5,000 (funds 2,500 pickups)
- **Partner**: $25,000 (funds 12,500 pickups)
- **Founding Partner**: $100,000+ (long-term strategic partner)

## 🏗️ Architecture

### Smart Contracts (Celo Blockchain)

#### 1. **RePlateTreasury.sol**
Main treasury contract managing the Impact Pool.

**Key Functions**:
```solidity
// Receive revenue
receiveSubscription(address donor, uint256 amount, string metadata)
receivePickupFee(address donor, uint256 amount, uint256 pickupId)
receiveGrant(uint256 amount, string grantName, string grantSource)
receiveSponsorshipWithDetails(uint256 amount, string name, string logo)

// Distribute rewards
distributeReward(address ngo, uint256 amount, uint256 pickupId, RevenueSource source)

// Analytics
getTotalBalance() → uint256
getBalanceBreakdown() → (subscription, pickupFee, grant, sponsorship, platform)
getDonorCSRMetrics(address donor) → (savings, pickups, CO2, meals)
```

#### 2. **SubscriptionManager.sol**
Manages SaaS subscriptions for donors.

**Key Functions**:
```solidity
subscribe(PlanType planType, bool autoRenew)
renewSubscription()
hasActiveSubscription(address subscriber) → bool
recordPickup(address subscriber, uint256 pickupId)
```

#### 3. **PickupFeeManager.sol**
Handles per-pickup transaction fees.

**Key Functions**:
```solidity
chargePickupFee(uint256 pickupId, address donor, uint256 estimatedValue, uint256 weightKg)
getDonorStats(address donor) → (tier, pickups, fees, savings, netSavings)
previewFee(address donor, uint256 value) → (fee, tier, tierName)
```

### Database Schema

```typescript
// Subscriptions
subscriptions {
  id, donorAddress, planType, startDate, expiryDate,
  status, price, totalPaid, pickupsUsed, autoRenew
}

// Pickup Fees
pickupFees {
  id, pickupId, donorAddress, feeAmount, donorTier,
  estimatedFoodValue, foodWeightKg, wasteDisposalSavings
}

// Sponsors
sponsors {
  id, sponsorAddress, name, logoUrl, totalContributed,
  isActive, tier, website, contactEmail
}

// Grants
grants {
  id, grantName, grantSource, amount, description,
  receivedDate, status, amountDisbursed
}

// NGO Rewards
ngoRewards {
  id, ngoAddress, ngoName, pickupId, rewardAmount,
  fundingSource, transactionHash, status
}

// CSR Reports
csrReports {
  id, donorAddress, reportPeriodStart, reportPeriodEnd,
  totalPickups, totalFoodDonatedKg, totalMealsProvided,
  co2SavedKg, wasteDisposalSavings, platformFeesPaid,
  netSavings, impactNFTTokenId
}
```

## 📊 Business Model Phases

### **Phase 1: Bootstrap (Months 0-6)**
- **Goal**: Prove concept with 20-50 hotels
- **Funding**: 100% Grant-funded reward pool
- **Strategy**: Offer free service to acquire users
- **Outcome**: Case studies and metrics for fundraising

### **Phase 2: Growth (Months 6-18)**
- **Goal**: Reach 50-200 paying subscribers
- **Funding**: 70% Subscriptions, 20% Pickup Fees, 10% Grants
- **Strategy**: Convert free users to paid subscriptions
- **Outcome**: Self-sustaining reward pool

### **Phase 3: Scale (Year 2+)**
- **Goal**: Expand to new cities, 500+ subscribers
- **Funding**: 60% Subs, 25% Pickup Fees, 10% Sponsorships, 5% Grants
- **Strategy**: Corporate sponsorships for expansion
- **Outcome**: National/regional platform

## 💡 Value Propositions

### For Hotels/Restaurants
**The Pitch**:
> "Last month your waste disposal cost was $1,500. Using RePlate, you diverted 2 tons of food, dropping your bill to $1,000. You saved $500. Our $100 monthly fee is a 5x return on investment."

**What They Get**:
- ✅ Real cost savings on waste disposal
- ✅ CSR data for compliance reports
- ✅ Proof of Impact NFT (blockchain-verified)
- ✅ One-stop solution for food donation
- ✅ Tax deduction documentation
- ✅ Brand reputation boost

### For Corporate Sponsors
**The Pitch**:
> "For $10,000, your company will fund 5,000 NGO pickups, feeding 500,000 meals to communities. Your logo will be featured as a founding partner on our platform serving 200 businesses."

**What They Get**:
- ✅ Branded sponsorship recognition
- ✅ Impact NFT with their contribution
- ✅ Press release and media coverage
- ✅ Quarterly impact reports
- ✅ Employee engagement opportunities

### For Celo Foundation/Grants
**The Pitch**:
> "RePlate is a real-world ReFi application solving food waste and poverty using Celo blockchain. We're a perfect case study for public goods funding with measurable impact."

**What They Get**:
- ✅ Success story for Celo ecosystem
- ✅ Real-world blockchain utility
- ✅ Social and environmental impact
- ✅ Community growth on Celo

## 🚀 Implementation Checklist

### Smart Contracts
- [x] RePlateTreasury.sol (Main treasury)
- [x] SubscriptionManager.sol (SaaS subscriptions)
- [x] PickupFeeManager.sol (Per-pickup fees)

### Backend Integration
- [x] Database schema for treasury management
- [x] API routes for subscriptions, fees, grants
- [x] CSR report generation
- [x] Treasury transaction audit trail

### Frontend Components
- [x] Treasury dashboard for admins
- [x] CSR report viewer for donors
- [x] Subscription management UI
- [x] Sponsor showcase page

### Deployment Steps
1. **Deploy Smart Contracts** to Celo testnet
   ```bash
   # Install Hardhat
   npm install --save-dev hardhat
   
   # Deploy contracts
   npx hardhat run scripts/deploy-treasury.js --network celo-testnet
   ```

2. **Update Contract Addresses** in `treasuryService.ts`

3. **Run Database Migration**
   ```bash
   npm run db:migrate
   ```

4. **Configure cUSD Token**
   - Testnet: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
   - Mainnet: `0x765DE816845861e75A25fCA122bb6898B8B1282a`

5. **Test Revenue Flow**
   - Create test subscription
   - Charge test pickup fee
   - Verify treasury balance
   - Distribute test reward

## 📈 Success Metrics

### Month 6 Goals
- 25 paying subscribers
- $2,500/month recurring revenue
- $10,000 in grant funding secured
- 100+ successful pickups

### Year 1 Goals
- 100 paying subscribers
- $10,000/month recurring revenue
- 5 corporate sponsors
- Self-sustaining reward pool

### Year 2 Goals
- 500 subscribers across 3 cities
- $50,000/month revenue
- 20 corporate sponsors
- Expand to new regions

## 🔐 Security Considerations

1. **Multi-sig Treasury**: Use Gnosis Safe for large fund management
2. **Access Control**: Role-based permissions (ADMIN, OPERATOR)
3. **Rate Limiting**: Prevent excessive reward distributions
4. **Audit Trail**: All transactions logged on-chain and off-chain
5. **Emergency Pause**: Circuit breaker for critical issues

## 📞 Grant Application Tips

### For Celo Foundation
1. Emphasize **real-world utility** and **social impact**
2. Show **blockchain verification** of impact (NFTs)
3. Demonstrate **user growth** potential
4. Highlight **public goods** nature

### Application Sections
- **Problem**: Food waste + poverty in [Your City]
- **Solution**: Blockchain-verified donation platform
- **Impact**: X meals, Y kg CO2 saved, Z NGOs supported
- **Traction**: Current users, partnerships
- **Ask**: $X for Y pickups over Z months

## 📄 Example Sponsor Package

**Founding Partner Package - $50,000**
- Funds 25,000 NGO pickups (250,000 meals)
- Logo on homepage and all donor dashboards
- Custom Impact NFT collection
- Quarterly board presentations
- Press release distribution
- Employee volunteer opportunities
- 2-year partnership agreement

---

## 🎓 Next Steps

1. **Deploy contracts** to Celo testnet
2. **Apply for Celo Camp** or Foundation grants
3. **Create pitch deck** for local corporate sponsors
4. **Launch pilot** with 5-10 hotels (free tier)
5. **Collect metrics** for 3 months
6. **Convert to paid** subscriptions
7. **Scale** with proven model

## 📚 Resources

- [Celo Developer Docs](https://docs.celo.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [ReFi Ecosystem](https://www.refidao.com/)
- [Hardhat Documentation](https://hardhat.org/docs)

---

**Built with ❤️ for a sustainable future**
