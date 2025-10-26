import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';

// Contract ABIs (simplified - you'll need to generate full ABIs from compiled contracts)
const TREASURY_ABI = [
  "function getTotalBalance() view returns (uint256)",
  "function getBalanceBreakdown() view returns (uint256 subscription, uint256 pickupFee, uint256 grant, uint256 sponsorship, uint256 platformFee)",
  "function getDonorCSRMetrics(address donor) view returns (uint256 totalSavings, uint256 totalPickups, uint256 estimatedCO2Saved, uint256 mealsProvided)",
  "function getAllSponsors() view returns (address[])",
  "function getSponsorDetails(address sponsorAddress) view returns (string name, string logoUrl, uint256 totalContributed, uint256 contributionDate, bool isActive)",
  "function getSourceMetrics(uint8 source) view returns (uint256 currentBalance, uint256 totalReceived, uint256 totalDisbursed, uint256 lastUpdated)",
  "function receiveGrant(uint256 amount, string grantName, string grantSource)",
  "function receiveSponsorshipWithDetails(uint256 amount, string sponsorName, string logoUrl)",
  "function distributeReward(address ngo, uint256 amount, uint256 pickupId, uint8 fundingSource)",
  "function recordDonorSavings(address donor, uint256 savingsAmount)",
];

const SUBSCRIPTION_ABI = [
  "function subscribe(uint8 planType, bool autoRenew)",
  "function renewSubscription()",
  "function cancelSubscription()",
  "function hasActiveSubscription(address subscriber) view returns (bool)",
  "function getSubscription(address subscriber) view returns (uint8 planType, uint256 startDate, uint256 expiryDate, uint8 status, uint256 totalPaid, uint256 pickupsUsed, bool autoRenew, uint256 daysRemaining)",
  "function getPlan(uint8 planType) view returns (string name, uint256 price, uint256 durationDays, bool isActive, uint256 maxPickups, bool includesAnalytics, bool includesCSRReports)",
  "function recordPickup(address subscriber, uint256 pickupId)",
];

const PICKUP_FEE_ABI = [
  "function chargePickupFee(uint256 pickupId, address donor, uint256 estimatedFoodValue, uint256 foodWeightKg)",
  "function getDonorStats(address donor) view returns (uint8 tier, uint256 totalPickups, uint256 monthlyPickups, uint256 totalFeesPaid, uint256 totalSavings, uint256 netSavings)",
  "function previewFee(address donor, uint256 estimatedFoodValue) view returns (uint256 fee, uint8 tier, string tierName)",
  "function getPickupFeeDetails(uint256 pickupId) view returns (address donor, uint256 feeCharged, uint256 estimatedFoodValue, uint256 wasteDisposalSavings, uint256 timestamp, bool feePaid)",
];

// cUSD token ABI
const CUSD_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

// Contract addresses (you'll deploy these and update)
const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // Celo testnet cUSD
const TREASURY_ADDRESS = ""; // Deploy and set
const SUBSCRIPTION_ADDRESS = ""; // Deploy and set
const PICKUP_FEE_ADDRESS = ""; // Deploy and set

enum RevenueSource {
  SUBSCRIPTION = 0,
  PER_PICKUP_FEE = 1,
  GRANT = 2,
  SPONSORSHIP = 3,
  PLATFORM_FEE = 4,
}

enum PlanType {
  MONTHLY = 0,
  YEARLY = 1,
  CUSTOM = 2,
}

enum DonorTier {
  STANDARD = 0,
  PREMIUM = 1,
  ENTERPRISE = 2,
  CUSTOM = 3,
}

export class TreasuryService {
  private provider: Web3Provider | null = null;
  private treasuryContract: ethers.Contract | null = null;
  private subscriptionContract: ethers.Contract | null = null;
  private pickupFeeContract: ethers.Contract | null = null;
  private cUSDContract: ethers.Contract | null = null;

  constructor() {}

  async initialize(provider: Web3Provider) {
    this.provider = provider;
    const signer = provider.getSigner();

    if (!TREASURY_ADDRESS || !SUBSCRIPTION_ADDRESS || !PICKUP_FEE_ADDRESS) {
      console.warn('Contract addresses not set. Please deploy contracts first.');
      return;
    }

    this.treasuryContract = new ethers.Contract(TREASURY_ADDRESS, TREASURY_ABI, signer);
    this.subscriptionContract = new ethers.Contract(SUBSCRIPTION_ADDRESS, SUBSCRIPTION_ABI, signer);
    this.pickupFeeContract = new ethers.Contract(PICKUP_FEE_ADDRESS, PICKUP_FEE_ABI, signer);
    this.cUSDContract = new ethers.Contract(CUSD_ADDRESS, CUSD_ABI, signer);
  }

  // Treasury Management
  async getTotalBalance(): Promise<string> {
    if (!this.treasuryContract) throw new Error('Treasury not initialized');
    const balance = await this.treasuryContract.getTotalBalance();
    return ethers.utils.formatEther(balance);
  }

  async getBalanceBreakdown() {
    if (!this.treasuryContract) throw new Error('Treasury not initialized');
    const breakdown = await this.treasuryContract.getBalanceBreakdown();
    return {
      subscription: ethers.utils.formatEther(breakdown.subscription),
      pickupFee: ethers.utils.formatEther(breakdown.pickupFee),
      grant: ethers.utils.formatEther(breakdown.grant),
      sponsorship: ethers.utils.formatEther(breakdown.sponsorship),
      platformFee: ethers.utils.formatEther(breakdown.platformFee),
    };
  }

  async getDonorCSRMetrics(donorAddress: string) {
    if (!this.treasuryContract) throw new Error('Treasury not initialized');
    const metrics = await this.treasuryContract.getDonorCSRMetrics(donorAddress);
    return {
      totalSavings: ethers.utils.formatEther(metrics.totalSavings),
      totalPickups: metrics.totalPickups.toNumber(),
      estimatedCO2Saved: metrics.estimatedCO2Saved.toNumber(),
      mealsProvided: metrics.mealsProvided.toNumber(),
    };
  }

  async getAllSponsors(): Promise<string[]> {
    if (!this.treasuryContract) throw new Error('Treasury not initialized');
    return await this.treasuryContract.getAllSponsors();
  }

  async getSponsorDetails(sponsorAddress: string) {
    if (!this.treasuryContract) throw new Error('Treasury not initialized');
    const details = await this.treasuryContract.getSponsorDetails(sponsorAddress);
    return {
      name: details.name,
      logoUrl: details.logoUrl,
      totalContributed: ethers.utils.formatEther(details.totalContributed),
      contributionDate: new Date(details.contributionDate.toNumber() * 1000),
      isActive: details.isActive,
    };
  }

  async receiveGrant(amount: string, grantName: string, grantSource: string) {
    if (!this.treasuryContract || !this.cUSDContract) throw new Error('Contracts not initialized');
    
    const amountWei = ethers.utils.parseEther(amount);
    
    // Approve cUSD spending
    const approveTx = await this.cUSDContract.approve(TREASURY_ADDRESS, amountWei);
    await approveTx.wait();
    
    // Receive grant
    const tx = await this.treasuryContract.receiveGrant(amountWei, grantName, grantSource);
    return await tx.wait();
  }

  async becomeSponsor(amount: string, sponsorName: string, logoUrl: string = '') {
    if (!this.treasuryContract || !this.cUSDContract) throw new Error('Contracts not initialized');
    
    const amountWei = ethers.utils.parseEther(amount);
    
    // Approve cUSD spending
    const approveTx = await this.cUSDContract.approve(TREASURY_ADDRESS, amountWei);
    await approveTx.wait();
    
    // Become sponsor
    const tx = await this.treasuryContract.receiveSponsorshipWithDetails(
      amountWei,
      sponsorName,
      logoUrl
    );
    return await tx.wait();
  }

  // Subscription Management
  async subscribeToPlan(planType: PlanType, autoRenew: boolean = true) {
    if (!this.subscriptionContract || !this.cUSDContract) throw new Error('Contracts not initialized');
    
    // Get plan price
    const plan = await this.subscriptionContract.getPlan(planType);
    const price = plan.price;
    
    // Approve cUSD spending
    const approveTx = await this.cUSDContract.approve(SUBSCRIPTION_ADDRESS, price);
    await approveTx.wait();
    
    // Subscribe
    const tx = await this.subscriptionContract.subscribe(planType, autoRenew);
    return await tx.wait();
  }

  async renewSubscription() {
    if (!this.subscriptionContract || !this.cUSDContract) throw new Error('Contracts not initialized');
    
    const signer = this.provider?.getSigner();
    const address = await signer?.getAddress();
    if (!address) throw new Error('No address');
    
    // Get subscription details to find plan price
    const subscription = await this.subscriptionContract.getSubscription(address);
    const plan = await this.subscriptionContract.getPlan(subscription.planType);
    
    // Approve cUSD spending
    const approveTx = await this.cUSDContract.approve(SUBSCRIPTION_ADDRESS, plan.price);
    await approveTx.wait();
    
    // Renew
    const tx = await this.subscriptionContract.renewSubscription();
    return await tx.wait();
  }

  async cancelSubscription() {
    if (!this.subscriptionContract) throw new Error('Subscription contract not initialized');
    const tx = await this.subscriptionContract.cancelSubscription();
    return await tx.wait();
  }

  async hasActiveSubscription(address: string): Promise<boolean> {
    if (!this.subscriptionContract) throw new Error('Subscription contract not initialized');
    return await this.subscriptionContract.hasActiveSubscription(address);
  }

  async getSubscriptionDetails(address: string) {
    if (!this.subscriptionContract) throw new Error('Subscription contract not initialized');
    const sub = await this.subscriptionContract.getSubscription(address);
    return {
      planType: sub.planType,
      startDate: new Date(sub.startDate.toNumber() * 1000),
      expiryDate: new Date(sub.expiryDate.toNumber() * 1000),
      status: sub.status,
      totalPaid: ethers.utils.formatEther(sub.totalPaid),
      pickupsUsed: sub.pickupsUsed.toNumber(),
      autoRenew: sub.autoRenew,
      daysRemaining: sub.daysRemaining.toNumber(),
    };
  }

  async getPlanDetails(planType: PlanType) {
    if (!this.subscriptionContract) throw new Error('Subscription contract not initialized');
    const plan = await this.subscriptionContract.getPlan(planType);
    return {
      name: plan.name,
      price: ethers.utils.formatEther(plan.price),
      durationDays: plan.durationDays.toNumber(),
      isActive: plan.isActive,
      maxPickups: plan.maxPickups.toNumber(),
      includesAnalytics: plan.includesAnalytics,
      includesCSRReports: plan.includesCSRReports,
    };
  }

  // Pickup Fee Management
  async getDonorStats(donorAddress: string) {
    if (!this.pickupFeeContract) throw new Error('Pickup fee contract not initialized');
    const stats = await this.pickupFeeContract.getDonorStats(donorAddress);
    return {
      tier: stats.tier,
      tierName: this.getTierName(stats.tier),
      totalPickups: stats.totalPickups.toNumber(),
      monthlyPickups: stats.monthlyPickups.toNumber(),
      totalFeesPaid: ethers.utils.formatEther(stats.totalFeesPaid),
      totalSavings: ethers.utils.formatEther(stats.totalSavings),
      netSavings: ethers.utils.formatEther(stats.netSavings),
    };
  }

  async previewPickupFee(donorAddress: string, estimatedFoodValue: string) {
    if (!this.pickupFeeContract) throw new Error('Pickup fee contract not initialized');
    const valueWei = ethers.utils.parseEther(estimatedFoodValue);
    const preview = await this.pickupFeeContract.previewFee(donorAddress, valueWei);
    return {
      fee: ethers.utils.formatEther(preview.fee),
      tier: preview.tier,
      tierName: preview.tierName,
    };
  }

  async getPickupFeeDetails(pickupId: number) {
    if (!this.pickupFeeContract) throw new Error('Pickup fee contract not initialized');
    const details = await this.pickupFeeContract.getPickupFeeDetails(pickupId);
    return {
      donor: details.donor,
      feeCharged: ethers.utils.formatEther(details.feeCharged),
      estimatedFoodValue: ethers.utils.formatEther(details.estimatedFoodValue),
      wasteDisposalSavings: ethers.utils.formatEther(details.wasteDisposalSavings),
      timestamp: new Date(details.timestamp.toNumber() * 1000),
      feePaid: details.feePaid,
    };
  }

  // Helper methods
  async getCUSDBalance(address: string): Promise<string> {
    if (!this.cUSDContract) throw new Error('cUSD contract not initialized');
    const balance = await this.cUSDContract.balanceOf(address);
    return ethers.utils.formatEther(balance);
  }

  async approveCUSD(spender: string, amount: string) {
    if (!this.cUSDContract) throw new Error('cUSD contract not initialized');
    const amountWei = ethers.utils.parseEther(amount);
    const tx = await this.cUSDContract.approve(spender, amountWei);
    return await tx.wait();
  }

  private getTierName(tier: number): string {
    switch (tier) {
      case DonorTier.STANDARD:
        return 'Standard';
      case DonorTier.PREMIUM:
        return 'Premium';
      case DonorTier.ENTERPRISE:
        return 'Enterprise';
      case DonorTier.CUSTOM:
        return 'Custom';
      default:
        return 'Unknown';
    }
  }

  // Contract addresses getters
  static getContractAddresses() {
    return {
      treasury: TREASURY_ADDRESS,
      subscription: SUBSCRIPTION_ADDRESS,
      pickupFee: PICKUP_FEE_ADDRESS,
      cUSD: CUSD_ADDRESS,
    };
  }
}

export const treasuryService = new TreasuryService();

// Export enums for use in components
export { RevenueSource, PlanType, DonorTier };
