import express from "express";
import { db } from "./db";
import { 
  subscriptions, 
  pickupFees, 
  sponsors, 
  grants, 
  sponsorshipContributions,
  treasuryTransactions,
  ngoRewards,
  csrReports,
  type InsertSubscription,
  type InsertPickupFee,
  type InsertSponsor,
  type InsertGrant,
  type InsertTreasuryTransaction,
  type InsertNgoReward,
  type InsertCsrReport
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

const router = express.Router();

// ============================================
// Treasury Metrics Endpoints
// ============================================

// Get overall treasury metrics
router.get("/api/treasury/metrics", async (req, res) => {
  try {
    // Get total balance from blockchain or database
    // For now, we'll calculate from database records
    const totalSubscriptions = await db
      .select({ total: sql<number>`sum(${subscriptions.totalPaid})` })
      .from(subscriptions);
    
    const totalPickupFees = await db
      .select({ total: sql<number>`sum(${pickupFees.feeAmount})` })
      .from(pickupFees)
      .where(eq(pickupFees.isPaid, true));
    
    const totalGrants = await db
      .select({ total: sql<number>`sum(${grants.amount})` })
      .from(grants);
    
    const totalSponsorships = await db
      .select({ total: sql<number>`sum(${sponsors.totalContributed})` })
      .from(sponsors);
    
    const totalDisbursed = await db
      .select({ total: sql<number>`sum(${ngoRewards.rewardAmount})` })
      .from(ngoRewards)
      .where(eq(ngoRewards.status, 'DISTRIBUTED'));
    
    const activeSubscribers = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'ACTIVE'));
    
    const totalSponsorsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(sponsors)
      .where(eq(sponsors.isActive, true));

    res.json({
      totalBalance: (
        parseFloat(totalSubscriptions[0]?.total || '0') +
        parseFloat(totalPickupFees[0]?.total || '0') +
        parseFloat(totalGrants[0]?.total || '0') +
        parseFloat(totalSponsorships[0]?.total || '0') -
        parseFloat(totalDisbursed[0]?.total || '0')
      ).toFixed(2),
      breakdown: {
        subscription: totalSubscriptions[0]?.total || '0',
        pickupFee: totalPickupFees[0]?.total || '0',
        grant: totalGrants[0]?.total || '0',
        sponsorship: totalSponsorships[0]?.total || '0',
        platformFee: '0',
      },
      totalDisbursed: totalDisbursed[0]?.total || '0',
      activeSubscribers: activeSubscribers[0]?.count || 0,
      totalSponsors: totalSponsorsCount[0]?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching treasury metrics:', error);
    res.status(500).json({ error: 'Failed to fetch treasury metrics' });
  }
});

// ============================================
// Subscription Management
// ============================================

// Get subscription for a donor
router.get("/api/subscriptions/:address", async (req, res) => {
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.donorAddress, req.params.address),
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create new subscription
router.post("/api/subscriptions", async (req, res) => {
  try {
    const newSubscription: InsertSubscription = req.body;
    
    const [subscription] = await db
      .insert(subscriptions)
      .values(newSubscription)
      .returning();

    // Record in treasury transactions
    const transaction: InsertTreasuryTransaction = {
      transactionType: 'DEPOSIT',
      revenueSource: 'SUBSCRIPTION',
      amount: newSubscription.price,
      fromAddress: newSubscription.donorAddress,
      toAddress: 'TREASURY',
      relatedId: subscription.id,
      transactionHash: newSubscription.transactionHash,
      metadata: { planType: newSubscription.planType },
    };

    await db.insert(treasuryTransactions).values(transaction);

    res.json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Get all active subscriptions
router.get("/api/subscriptions", async (req, res) => {
  try {
    const allSubscriptions = await db.query.subscriptions.findMany({
      where: eq(subscriptions.status, 'ACTIVE'),
      orderBy: [desc(subscriptions.createdAt)],
    });

    res.json(allSubscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// ============================================
// Pickup Fee Management
// ============================================

// Record pickup fee
router.post("/api/pickup-fees", async (req, res) => {
  try {
    const newPickupFee: InsertPickupFee = req.body;
    
    const [pickupFee] = await db
      .insert(pickupFees)
      .values(newPickupFee)
      .returning();

    // Record in treasury transactions
    if (newPickupFee.isPaid) {
      const transaction: InsertTreasuryTransaction = {
        transactionType: 'DEPOSIT',
        revenueSource: 'PER_PICKUP_FEE',
        amount: newPickupFee.feeAmount,
        fromAddress: newPickupFee.donorAddress,
        toAddress: 'TREASURY',
        relatedId: pickupFee.id,
        transactionHash: newPickupFee.transactionHash,
        metadata: { pickupId: newPickupFee.pickupId },
      };

      await db.insert(treasuryTransactions).values(transaction);
    }

    res.json(pickupFee);
  } catch (error) {
    console.error('Error recording pickup fee:', error);
    res.status(500).json({ error: 'Failed to record pickup fee' });
  }
});

// Get donor pickup fee stats
router.get("/api/pickup-fees/donor/:address", async (req, res) => {
  try {
    const fees = await db.query.pickupFees.findMany({
      where: eq(pickupFees.donorAddress, req.params.address),
      orderBy: [desc(pickupFees.createdAt)],
    });

    const stats = {
      totalPickups: fees.length,
      totalFeesPaid: fees.reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
      totalSavings: fees.reduce((sum, fee) => sum + parseFloat(fee.wasteDisposalSavings || '0'), 0),
      averageFee: fees.length > 0 
        ? fees.reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0) / fees.length 
        : 0,
      recentFees: fees.slice(0, 10),
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching donor stats:', error);
    res.status(500).json({ error: 'Failed to fetch donor stats' });
  }
});

// ============================================
// Sponsor Management
// ============================================

// Get all sponsors
router.get("/api/sponsors", async (req, res) => {
  try {
    const allSponsors = await db.query.sponsors.findMany({
      where: eq(sponsors.isActive, true),
      with: {
        contributions: true,
      },
      orderBy: [desc(sponsors.totalContributed)],
    });

    res.json(allSponsors);
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    res.status(500).json({ error: 'Failed to fetch sponsors' });
  }
});

// Create new sponsor
router.post("/api/sponsors", async (req, res) => {
  try {
    const newSponsor: InsertSponsor = req.body;
    
    const [sponsor] = await db
      .insert(sponsors)
      .values(newSponsor)
      .returning();

    // Record initial contribution if amount > 0
    if (parseFloat(newSponsor.totalContributed) > 0) {
      const transaction: InsertTreasuryTransaction = {
        transactionType: 'DEPOSIT',
        revenueSource: 'SPONSORSHIP',
        amount: newSponsor.totalContributed,
        fromAddress: newSponsor.sponsorAddress,
        toAddress: 'TREASURY',
        relatedId: sponsor.id,
        metadata: { sponsorName: newSponsor.name },
      };

      await db.insert(treasuryTransactions).values(transaction);
    }

    res.json(sponsor);
  } catch (error) {
    console.error('Error creating sponsor:', error);
    res.status(500).json({ error: 'Failed to create sponsor' });
  }
});

// ============================================
// Grant Management
// ============================================

// Get all grants
router.get("/api/grants", async (req, res) => {
  try {
    const allGrants = await db.query.grants.findMany({
      orderBy: [desc(grants.receivedDate)],
    });

    res.json(allGrants);
  } catch (error) {
    console.error('Error fetching grants:', error);
    res.status(500).json({ error: 'Failed to fetch grants' });
  }
});

// Create new grant record
router.post("/api/grants", async (req, res) => {
  try {
    const newGrant: InsertGrant = req.body;
    
    const [grant] = await db
      .insert(grants)
      .values(newGrant)
      .returning();

    // Record in treasury transactions
    const transaction: InsertTreasuryTransaction = {
      transactionType: 'DEPOSIT',
      revenueSource: 'GRANT',
      amount: newGrant.amount,
      fromAddress: 'GRANT_SOURCE',
      toAddress: 'TREASURY',
      relatedId: grant.id,
      transactionHash: newGrant.transactionHash,
      metadata: { 
        grantName: newGrant.grantName,
        grantSource: newGrant.grantSource,
      },
    };

    await db.insert(treasuryTransactions).values(transaction);

    res.json(grant);
  } catch (error) {
    console.error('Error recording grant:', error);
    res.status(500).json({ error: 'Failed to record grant' });
  }
});

// ============================================
// NGO Rewards
// ============================================

// Record NGO reward distribution
router.post("/api/ngo-rewards", async (req, res) => {
  try {
    const newReward: InsertNgoReward = req.body;
    
    const [reward] = await db
      .insert(ngoRewards)
      .values(newReward)
      .returning();

    // Record in treasury transactions
    const transaction: InsertTreasuryTransaction = {
      transactionType: 'WITHDRAWAL',
      revenueSource: newReward.fundingSource as any,
      amount: newReward.rewardAmount,
      fromAddress: 'TREASURY',
      toAddress: newReward.ngoAddress,
      relatedId: reward.id,
      transactionHash: newReward.transactionHash,
      metadata: { 
        pickupId: newReward.pickupId,
        ngoName: newReward.ngoName,
      },
    };

    await db.insert(treasuryTransactions).values(transaction);

    res.json(reward);
  } catch (error) {
    console.error('Error recording NGO reward:', error);
    res.status(500).json({ error: 'Failed to record NGO reward' });
  }
});

// Get NGO rewards
router.get("/api/ngo-rewards/:address", async (req, res) => {
  try {
    const rewards = await db.query.ngoRewards.findMany({
      where: eq(ngoRewards.ngoAddress, req.params.address),
      orderBy: [desc(ngoRewards.createdAt)],
    });

    const totalRewards = rewards.reduce(
      (sum, reward) => sum + parseFloat(reward.rewardAmount),
      0
    );

    res.json({
      rewards,
      totalRewards,
      totalCount: rewards.length,
    });
  } catch (error) {
    console.error('Error fetching NGO rewards:', error);
    res.status(500).json({ error: 'Failed to fetch NGO rewards' });
  }
});

// ============================================
// CSR Reports
// ============================================

// Get CSR report for donor
router.get("/api/csr-reports/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get pickup fees for the period
    const fees = await db.query.pickupFees.findMany({
      where: and(
        eq(pickupFees.donorAddress, address),
        gte(pickupFees.createdAt, startDate)
      ),
    });

    // Calculate metrics
    const totalPickups = fees.length;
    const totalFoodDonatedKg = fees.reduce(
      (sum, fee) => sum + parseFloat(fee.foodWeightKg || '0'),
      0
    );
    const totalMealsProvided = Math.floor(totalFoodDonatedKg * 2); // ~2 meals per kg
    const co2SavedKg = totalFoodDonatedKg * 2; // ~2kg CO2 per kg food
    const wasteDisposalSavings = fees.reduce(
      (sum, fee) => sum + parseFloat(fee.wasteDisposalSavings || '0'),
      0
    );
    const platformFeesPaid = fees.reduce(
      (sum, fee) => sum + parseFloat(fee.feeAmount),
      0
    );
    const netSavings = wasteDisposalSavings - platformFeesPaid;

    // Get subscription info
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.donorAddress, address),
    });

    const report = {
      donorAddress: address,
      donorName: 'Donor Organization', // TODO: Get from user profile
      reportPeriodStart: startDate,
      reportPeriodEnd: now,
      totalPickups,
      totalFoodDonatedKg,
      totalMealsProvided,
      co2SavedKg,
      wasteDisposalSavings,
      platformFeesPaid,
      netSavings,
      planType: subscription?.planType || 'STANDARD',
      subscriptionStartDate: subscription?.startDate || now,
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating CSR report:', error);
    res.status(500).json({ error: 'Failed to generate CSR report' });
  }
});

// Create CSR report record
router.post("/api/csr-reports", async (req, res) => {
  try {
    const newReport: InsertCsrReport = req.body;
    
    const [report] = await db
      .insert(csrReports)
      .values(newReport)
      .returning();

    res.json(report);
  } catch (error) {
    console.error('Error creating CSR report:', error);
    res.status(500).json({ error: 'Failed to create CSR report' });
  }
});

// ============================================
// Treasury Transactions (Audit Trail)
// ============================================

// Get all treasury transactions
router.get("/api/treasury/transactions", async (req, res) => {
  try {
    const { limit = 50, offset = 0, type, source } = req.query;

    let query = db.query.treasuryTransactions.findMany({
      orderBy: [desc(treasuryTransactions.createdAt)],
      limit: Number(limit),
      offset: Number(offset),
    });

    const transactions = await query;

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching treasury transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
