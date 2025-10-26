import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Will store wallet address
  walletAddress: varchar("wallet_address").unique().notNull(), // Primary identifier
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("student"), // student, admin
  studentId: varchar("student_id"),
  phoneNumber: varchar("phone_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Food items table
export const foodItems = pgTable("food_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  canteenName: varchar("canteen_name", { length: 255 }).notNull(),
  canteenLocation: varchar("canteen_location", { length: 255 }),
  quantityAvailable: integer("quantity_available").notNull().default(0),
  imageUrl: text("image_url"),
  availableUntil: timestamp("available_until", { mode: 'string' }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Food claims table
export const foodClaims = pgTable("food_claims", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  foodItemId: uuid("food_item_id").notNull().references(() => foodItems.id),
  quantityClaimed: integer("quantity_claimed").notNull().default(1),
  claimCode: varchar("claim_code", { length: 20 }).unique().notNull(),
  status: varchar("status", { length: 50 }).notNull().default("reserved"), // reserved, claimed, expired, cancelled
  expiresAt: timestamp("expires_at").notNull(),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Food donations table
export const foodDonations = pgTable("food_donations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  foodItemId: uuid("food_item_id").notNull().references(() => foodItems.id),
  ngoName: varchar("ngo_name", { length: 255 }),
  ngoContactPerson: varchar("ngo_contact_person", { length: 255 }),
  ngoPhoneNumber: varchar("ngo_phone_number", { length: 20 }),
  quantityDonated: integer("quantity_donated").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("available"), // available, reserved_for_ngo, collected
  donatedAt: timestamp("donated_at").defaultNow(),
  reservedAt: timestamp("reserved_at"),
  collectedAt: timestamp("collected_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time", { mode: 'string' }).notNull(),
  endTime: timestamp("end_time", { mode: 'string' }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("info"), // info, success, warning, error
  isRead: boolean("is_read").notNull().default(false),
  relatedItemId: uuid("related_item_id"), // Optional reference to food item, claim, etc.
  relatedItemType: varchar("related_item_type", { length: 50 }), // food_item, claim, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  foodItems: many(foodItems),
  foodClaims: many(foodClaims),
  events: many(events),
}));

export const foodItemsRelations = relations(foodItems, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [foodItems.createdBy],
    references: [users.id],
  }),
  claims: many(foodClaims),
  donations: many(foodDonations),
}));

export const foodClaimsRelations = relations(foodClaims, ({ one }) => ({
  user: one(users, {
    fields: [foodClaims.userId],
    references: [users.id],
  }),
  foodItem: one(foodItems, {
    fields: [foodClaims.foodItemId],
    references: [foodItems.id],
  }),
}));

export const foodDonationsRelations = relations(foodDonations, ({ one }) => ({
  foodItem: one(foodItems, {
    fields: [foodDonations.foodItemId],
    references: [foodItems.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  createdBy: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Treasury and Revenue Management Tables

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  donorAddress: varchar("donor_address").notNull(),
  planType: varchar("plan_type", { length: 50 }).notNull(), // MONTHLY, YEARLY, CUSTOM
  startDate: timestamp("start_date").notNull().defaultNow(),
  expiryDate: timestamp("expiry_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("ACTIVE"), // ACTIVE, EXPIRED, SUSPENDED, CANCELLED
  price: decimal("price", { precision: 20, scale: 18 }).notNull(), // in cUSD
  totalPaid: decimal("total_paid", { precision: 20, scale: 18 }).notNull().default("0"),
  pickupsUsed: integer("pickups_used").notNull().default(0),
  autoRenew: boolean("auto_renew").notNull().default(false),
  transactionHash: varchar("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pickup fees table
export const pickupFees = pgTable("pickup_fees", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pickupId: uuid("pickup_id").notNull(),
  donorAddress: varchar("donor_address").notNull(),
  feeAmount: decimal("fee_amount", { precision: 20, scale: 18 }).notNull(),
  donorTier: varchar("donor_tier", { length: 50 }).notNull().default("STANDARD"), // STANDARD, PREMIUM, ENTERPRISE, CUSTOM
  estimatedFoodValue: decimal("estimated_food_value", { precision: 20, scale: 18 }),
  foodWeightKg: decimal("food_weight_kg", { precision: 10, scale: 2 }),
  wasteDisposalSavings: decimal("waste_disposal_savings", { precision: 20, scale: 18 }),
  transactionHash: varchar("transaction_hash"),
  isPaid: boolean("is_paid").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sponsors table
export const sponsors = pgTable("sponsors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorAddress: varchar("sponsor_address").unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  totalContributed: decimal("total_contributed", { precision: 20, scale: 18 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  tier: varchar("tier", { length: 50 }).default("SUPPORTER"), // SUPPORTER, PARTNER, FOUNDING
  website: varchar("website"),
  contactEmail: varchar("contact_email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grants table
export const grants = pgTable("grants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  grantName: varchar("grant_name", { length: 255 }).notNull(),
  grantSource: varchar("grant_source", { length: 255 }).notNull(), // e.g., "Celo Foundation", "Celo Camp"
  amount: decimal("amount", { precision: 20, scale: 18 }).notNull(),
  description: text("description"),
  receivedDate: timestamp("received_date").notNull().defaultNow(),
  transactionHash: varchar("transaction_hash"),
  status: varchar("status", { length: 50 }).notNull().default("ACTIVE"), // ACTIVE, COMPLETED, DEPLETED
  amountDisbursed: decimal("amount_disbursed", { precision: 20, scale: 18 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sponsorship contributions table
export const sponsorshipContributions = pgTable("sponsorship_contributions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: uuid("sponsor_id").notNull().references(() => sponsors.id),
  amount: decimal("amount", { precision: 20, scale: 18 }).notNull(),
  transactionHash: varchar("transaction_hash"),
  campaign: varchar("campaign", { length: 255 }), // Optional campaign name
  createdAt: timestamp("created_at").defaultNow(),
});

// Treasury transactions table (audit trail)
export const treasuryTransactions = pgTable("treasury_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // DEPOSIT, WITHDRAWAL, REWARD_DISTRIBUTION
  revenueSource: varchar("revenue_source", { length: 50 }), // SUBSCRIPTION, PER_PICKUP_FEE, GRANT, SPONSORSHIP, PLATFORM_FEE
  amount: decimal("amount", { precision: 20, scale: 18 }).notNull(),
  fromAddress: varchar("from_address"),
  toAddress: varchar("to_address"),
  relatedId: uuid("related_id"), // Reference to subscription, pickup, grant, etc.
  transactionHash: varchar("transaction_hash"),
  metadata: jsonb("metadata"), // Additional data
  createdAt: timestamp("created_at").defaultNow(),
});

// NGO rewards table
export const ngoRewards = pgTable("ngo_rewards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ngoAddress: varchar("ngo_address").notNull(),
  ngoName: varchar("ngo_name", { length: 255 }),
  pickupId: uuid("pickup_id").notNull(),
  rewardAmount: decimal("reward_amount", { precision: 20, scale: 18 }).notNull(),
  fundingSource: varchar("funding_source", { length: 50 }).notNull(), // Which revenue source funded this
  transactionHash: varchar("transaction_hash"),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"), // PENDING, DISTRIBUTED, FAILED
  distributedAt: timestamp("distributed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// CSR Reports table (for donors)
export const csrReports = pgTable("csr_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  donorAddress: varchar("donor_address").notNull(),
  reportPeriodStart: timestamp("report_period_start").notNull(),
  reportPeriodEnd: timestamp("report_period_end").notNull(),
  totalPickups: integer("total_pickups").notNull(),
  totalFoodDonatedKg: decimal("total_food_donated_kg", { precision: 10, scale: 2 }).notNull(),
  totalMealsProvided: integer("total_meals_provided").notNull(),
  co2SavedKg: decimal("co2_saved_kg", { precision: 10, scale: 2 }).notNull(),
  wasteDisposalSavings: decimal("waste_disposal_savings", { precision: 20, scale: 18 }).notNull(),
  platformFeesPaid: decimal("platform_fees_paid", { precision: 20, scale: 18 }).notNull(),
  netSavings: decimal("net_savings", { precision: 20, scale: 18 }).notNull(),
  impactNFTTokenId: varchar("impact_nft_token_id"), // Reference to proof of impact NFT
  reportUrl: text("report_url"), // PDF/document URL
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for new tables
export const subscriptionsRelations = relations(subscriptions, ({ many }) => ({
  treasuryTransactions: many(treasuryTransactions),
}));

export const sponsorsRelations = relations(sponsors, ({ many }) => ({
  contributions: many(sponsorshipContributions),
}));

export const sponsorshipContributionsRelations = relations(sponsorshipContributions, ({ one }) => ({
  sponsor: one(sponsors, {
    fields: [sponsorshipContributions.sponsorId],
    references: [sponsors.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  walletAddress: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  studentId: true,
  phoneNumber: true,
});

export const insertFoodItemSchema = createInsertSchema(foodItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFoodClaimSchema = z.object({
  userId: z.string(),
  foodItemId: z.string(),
  quantityClaimed: z.number().int().positive().default(1),
  claimCode: z.string().default(''), // Can be empty for pending claims
  status: z.enum(["pending", "reserved", "claimed", "expired", "rejected"]).default("pending"),
  expiresAt: z.date(),
  claimedAt: z.date().optional(),
  metadata: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phoneNumber: z.string().optional(),
    organization: z.string().optional(),
  }).optional(),
});

export const insertFoodDonationSchema = createInsertSchema(foodDonations).omit({
  id: true,
  donatedAt: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPickupFeeSchema = createInsertSchema(pickupFees).omit({
  id: true,
  createdAt: true,
});

export const insertSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGrantSchema = createInsertSchema(grants).omit({
  id: true,
  createdAt: true,
});

export const insertSponsorshipContributionSchema = createInsertSchema(sponsorshipContributions).omit({
  id: true,
  createdAt: true,
});

export const insertTreasuryTransactionSchema = createInsertSchema(treasuryTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertNgoRewardSchema = createInsertSchema(ngoRewards).omit({
  id: true,
  createdAt: true,
});

export const insertCsrReportSchema = createInsertSchema(csrReports).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodClaim = z.infer<typeof insertFoodClaimSchema>;
export type FoodClaim = typeof foodClaims.$inferSelect;
export type InsertFoodDonation = z.infer<typeof insertFoodDonationSchema>;
export type FoodDonation = typeof foodDonations.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Extended types with relations
export type FoodItemWithCreator = FoodItem & {
  createdBy: User;
  claimCount?: number;
};

export type FoodClaimWithDetails = FoodClaim & {
  user: User;
  foodItem: FoodItem;
};

export type FoodDonationWithDetails = FoodDonation & {
  foodItem: FoodItem;
};

export type EventWithCreator = Event & {
  createdBy: User;
};

// New types for treasury management
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type PickupFee = typeof pickupFees.$inferSelect;
export type InsertPickupFee = z.infer<typeof insertPickupFeeSchema>;

export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;

export type Grant = typeof grants.$inferSelect;
export type InsertGrant = z.infer<typeof insertGrantSchema>;

export type SponsorshipContribution = typeof sponsorshipContributions.$inferSelect;
export type InsertSponsorshipContribution = z.infer<typeof insertSponsorshipContributionSchema>;

export type TreasuryTransaction = typeof treasuryTransactions.$inferSelect;
export type InsertTreasuryTransaction = z.infer<typeof insertTreasuryTransactionSchema>;

export type NgoReward = typeof ngoRewards.$inferSelect;
export type InsertNgoReward = z.infer<typeof insertNgoRewardSchema>;

export type CsrReport = typeof csrReports.$inferSelect;
export type InsertCsrReport = z.infer<typeof insertCsrReportSchema>;

// Extended types
export type SponsorWithContributions = Sponsor & {
  contributions: SponsorshipContribution[];
  totalAmount: string;
};

export type SubscriptionWithMetrics = Subscription & {
  daysRemaining: number;
  isExpired: boolean;
  planName: string;
};
