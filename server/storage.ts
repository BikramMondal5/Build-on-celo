import { User, FoodItem, FoodClaim, FoodDonation, Event, Notification } from './models';
import type { IUser, IFoodItem, IFoodClaim, IFoodDonation, IEvent, INotification } from './models';
import mongoose from 'mongoose';

// Type definitions for complex return types
type FoodItemWithCreator = IFoodItem & {
  createdBy: IUser;
  claimCount?: number;
};

type FoodClaimWithDetails = IFoodClaim & {
  user: IUser;
  foodItem: IFoodItem;
};

type FoodDonationWithDetails = IFoodDonation & {
  foodItem: IFoodItem;
};

type EventWithCreator = IEvent & {
  createdBy: IUser;
};

type InsertFoodItem = Partial<IFoodItem>;
type InsertFoodClaim = Partial<IFoodClaim>;
type InsertFoodDonation = Partial<IFoodDonation>;
type InsertEvent = Partial<IEvent>;
type InsertNotification = Partial<INotification>;
type UpsertUser = Partial<IUser> & { id?: string };

export interface IStorage {
  // User operations
  getUser(id: string): Promise<IUser | undefined>;
  getUserByEmail(email: string): Promise<IUser | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<IUser | undefined>;
  getUsersByRole(role: string | null): Promise<IUser[]>;
  upsertUser(user: UpsertUser): Promise<IUser>;
  createOrUpdateUserByWallet(walletAddress: string, userData?: Partial<IUser>): Promise<IUser>;

  // Food item operations
  getAllActiveFoodItems(): Promise<FoodItemWithCreator[]>;
  getFoodItemById(id: string): Promise<IFoodItem | undefined>;
  createFoodItem(foodItem: InsertFoodItem): Promise<IFoodItem>;
  updateFoodItem(id: string, updates: Partial<InsertFoodItem>): Promise<IFoodItem>;
  deleteFoodItem(id: string): Promise<void>;
  getFoodItemsByCreator(creatorId: string): Promise<FoodItemWithCreator[]>;
  getPendingFoodClaims(): Promise<any[]>;
  getFoodClaimById(id: string): Promise<IFoodClaim | null>;
  updateFoodClaimWithCode(id: string, claimCode: string, status: string, expiresAt: Date): Promise<IFoodClaim | null>;

  // Food claim operations
  createFoodClaim(claim: InsertFoodClaim & { claimCode: string }): Promise<IFoodClaim>;
  getFoodClaimsByUser(userId: string): Promise<FoodClaimWithDetails[]>;
  getFoodClaimByClaimCode(claimCode: string): Promise<FoodClaimWithDetails | undefined>;
  updateFoodClaimStatus(id: string, status: string, claimedAt?: Date): Promise<IFoodClaim | null>;
  getActiveFoodClaims(): Promise<FoodClaimWithDetails[]>;
  getClaimByCode(claimCode: string): Promise<FoodClaimWithDetails | undefined>;
  completeClaim(claimId: string): Promise<FoodClaimWithDetails>;
  hasUserClaimedFoodItem(userId: string, foodItemId: string): Promise<boolean>;

  // Food donation operations
  getExpiredFoodItems(): Promise<IFoodItem[]>;
  createFoodDonation(donation: InsertFoodDonation): Promise<IFoodDonation>;
  getAllDonations(): Promise<FoodDonationWithDetails[]>;
  getDonationsByCreator(creatorId: string): Promise<FoodDonationWithDetails[]>;
  updateDonationStatus(id: string, status: string, ngoInfo?: {
    ngoName: string;
    ngoContactPerson: string;
    ngoPhoneNumber: string;
  }): Promise<IFoodDonation>;
  transferExpiredItemsToDonations(): Promise<number>;
  updateExpiredItemsStatus(): Promise<number>;

  // Event operations
  createEvent(event: InsertEvent): Promise<IEvent>;
  getAllEvents(): Promise<EventWithCreator[]>;
  getEventsByCreator(creatorId: string): Promise<IEvent[]>;
  getEventById(id: string): Promise<IEvent | undefined>;
  updateEvent(id: string, updates: Partial<InsertEvent>): Promise<IEvent>;
  deleteEvent(id: string): Promise<void>;

  // Stats operations
  getCampusStats(): Promise<{
    totalMealsSaved: number;
    activeStudents: number;
    partnerCanteens: number;
    totalSavings: number;
    foodProvided: number;
    wastedFood: number;
    claimedFood: number;
    carbonFootprintSaved: number;
    waterFootprintSaved: number;
    currentlyActiveItems: number;
    totalQuantityAvailable: number;
  }>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<INotification>;
  getNotificationsByUser(userId: string): Promise<INotification[]>;
  markNotificationAsRead(notificationId: string): Promise<INotification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  getUsersWhoClaimedFromCanteen(canteenName: string): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(userId: string): Promise<IUser | undefined> {
    try {
      // Try to find by wallet address first
      let user = await User.findOne({ walletAddress: userId }).lean();
      if (user) {
        return user as any as IUser;
      }
      
      // Check if it's a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(userId) && userId.length === 24) {
        user = await User.findById(userId).lean();
        return user ? (user as any as IUser) : undefined;
      }
      
      // Otherwise, try email
      user = await User.findOne({ email: userId }).lean();
      return user ? (user as any as IUser) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByWalletAddress(walletAddress: string): Promise<IUser | undefined> {
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() }).lean();
    return user ? (user as any as IUser) : undefined;
  }

  async getUserByEmail(email: string): Promise<IUser | undefined> {
    const user = await User.findOne({ email }).lean();
    return user ? (user as any as IUser) : undefined;
  }

  async getUsersByRole(role: string | null): Promise<IUser[]> {
    if (role === null) {
      const users = await User.find({ role: null }).lean();
      return users as any as IUser[];
    } else {
      const users = await User.find({ role }).lean();
      return users as any as IUser[];
    }
  }

  async createOrUpdateUserByWallet(walletAddress: string, userData?: Partial<IUser>): Promise<IUser> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      const existingUser = await User.findOne({ walletAddress: normalizedAddress });
      
      if (existingUser) {
        // Update existing user
        if (userData) {
          Object.assign(existingUser, userData);
          await existingUser.save();
        }
        return existingUser;
      }
      
      // Create new user
      const user = await User.create({
        walletAddress: normalizedAddress,
        studentId: `STU${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        ...userData,
      });
      return user;
    } catch (error) {
      console.error('Error creating/updating user by wallet:', error);
      throw error;
    }
  }

  async upsertUser(userData: Partial<IUser>): Promise<IUser> {
    try {
      const { id, ...dataWithoutId } = userData;
      
      // If wallet address is provided, use it
      if (dataWithoutId.walletAddress) {
        return this.createOrUpdateUserByWallet(dataWithoutId.walletAddress, dataWithoutId);
      }
      
      // Fallback to email-based upsert
      if (dataWithoutId.email) {
        const existingUser = await User.findOne({ email: dataWithoutId.email });
        
        if (existingUser) {
          // Update existing user
          Object.assign(existingUser, dataWithoutId);
          await existingUser.save();
          return existingUser;
        }
      }
      
      // Create new user (MongoDB will auto-generate _id)
      const user = await User.create(dataWithoutId);
      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  // Food item operations
  async getAllActiveFoodItems(): Promise<FoodItemWithCreator[]> {
    await this.updateExpiredItemsStatus();
    const now = new Date().toISOString();
    
    const items = await FoodItem.find({
      $or: [
        { isActive: true },
        { isActive: { $exists: false } } // Include items where isActive field doesn't exist
      ],
      availableUntil: { $gte: now }
    })
    .populate('createdBy')
    .sort({ createdAt: -1 });
    
    const itemsWithCounts = await Promise.all(
      items.map(async (item: any) => {
        const claimCount = await FoodClaim.countDocuments({
          foodItemId: item._id.toString(),
          status: { $in: ['reserved', 'claimed'] }
        });
        console.log('Food item from database:', { 
          _id: item._id.toString(), 
          name: item.name, 
          id: item.id,
          hasIdField: 'id' in item 
        });
        return { ...item.toObject(), claimCount };
      })
    );
    
    return itemsWithCounts as any as FoodItemWithCreator[];
  }

  async getFoodItemById(id: string): Promise<IFoodItem | undefined> {
    try {
      console.log('Looking for food item with ID:', id);
      
      // Check if it's a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(id)) {
        const item = await FoodItem.findById(id);
        console.log('MongoDB query result:', item);
        if (!item) {
          return undefined;
        }
        const itemObj = item.toObject();
        console.log('Item as object with virtuals:', itemObj);
        return itemObj as any as IFoodItem;
      } else {
        console.log('Invalid ObjectId format:', id);
        return undefined;
      }
    } catch (error) {
      console.error('Error getting food item by ID:', error);
      return undefined;
    }
  }

  // Get pending food claims with full details
  async getPendingFoodClaims() {
    const claims = await FoodClaim.find({ status: 'pending' })
      .sort({ createdAt: -1 });
    
    // Populate user and food item details
    const claimsWithDetails = await Promise.all(
      claims.map(async (claim) => {
        const user = await User.findById(claim.userId);
        const foodItem = await FoodItem.findById(claim.foodItemId);
        return {
          ...claim.toObject(),
          user,
          foodItem,
        };
      })
    );
    
    return claimsWithDetails;
  }

  // Get food claim by ID
  async getFoodClaimById(id: string) {
    return await FoodClaim.findById(id);
  }

  // Update food claim with claim code and status
  async updateFoodClaimWithCode(
    id: string, 
    claimCode: string, 
    status: string, 
    expiresAt: Date
  ) {
    const claim = await FoodClaim.findByIdAndUpdate(
      id,
      { 
        claimCode, 
        status, 
        expiresAt,
        updatedAt: new Date() 
      },
      { new: true }
    );
    return claim;
  }

  // Update food claim status (for rejection)
  async updateFoodClaimStatus(id: string, status: string, claimedAt?: Date) {
    const updateData: any = { 
      status,
      updatedAt: new Date() 
    };
    
    if (claimedAt) {
      updateData.claimedAt = claimedAt;
    }
    
    const claim = await FoodClaim.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    // If status is claimed, reduce the food item quantity
    if (status === 'claimed' && claim) {
      const foodItem = await FoodItem.findById(claim.foodItemId);
      if (foodItem) {
        foodItem.quantityAvailable = Math.max(0, foodItem.quantityAvailable - claim.quantityClaimed);
        await foodItem.save();
      }
    }
    
    return claim;
  }

  // Check if user has already claimed a food item (including pending status)
  async hasUserClaimedFoodItem(userId: string, foodItemId: string): Promise<boolean> {
    const existingClaim = await FoodClaim.findOne({
      userId,
      foodItemId,
      status: { $in: ['pending', 'reserved', 'claimed'] }
    });
    return !!existingClaim;
  }

  async createFoodItem(foodItem: InsertFoodItem): Promise<IFoodItem> {
    const item = await FoodItem.create(foodItem);
    return item.toObject() as any as IFoodItem;
  }

  async updateFoodItem(id: string, updates: Partial<InsertFoodItem>): Promise<IFoodItem> {
    const item = await FoodItem.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();
    return item as any as IFoodItem;
  }

  async deleteFoodItem(id: string): Promise<void> {
    await FoodDonation.deleteMany({ foodItemId: id });
    await FoodClaim.deleteMany({ foodItemId: id });
    await FoodItem.findByIdAndDelete(id);
  }

  async getFoodItemsByCreator(creatorId: string): Promise<FoodItemWithCreator[]> {
    await this.updateExpiredItemsStatus();

    const items = await FoodItem.find({ createdBy: creatorId })
      .populate('createdBy')
      .sort({ createdAt: -1 });

    const itemsWithCounts = await Promise.all(
      items.map(async (item: any) => {
        const claimCount = await FoodClaim.countDocuments({
          foodItemId: item._id.toString(),
          status: { $in: ['reserved', 'claimed'] }
        });
        return { ...item.toObject(), claimCount };
      })
    );

    return itemsWithCounts as any as FoodItemWithCreator[];
  }

  // Food claim operations
  async createFoodClaim(claim: InsertFoodClaim & { claimCode: string }): Promise<IFoodClaim> {
    const newClaim = await FoodClaim.create(claim);
    return newClaim.toObject() as any as IFoodClaim;
  }

  async getFoodClaimsByUser(userId: string): Promise<FoodClaimWithDetails[]> {
    const claims = await FoodClaim.find({ userId })
      .populate('userId')
      .populate('foodItemId')
      .sort({ createdAt: -1 })
      .lean();
    
    return claims.map((claim: any) => {
      // Store the original foodItemId string before it gets replaced by population
      const foodItemIdString = claim.foodItemId?._id?.toString() || claim.foodItemId;
      
      return {
        ...claim,
        foodItemId: foodItemIdString, // Keep as string for comparisons
        user: claim.userId,
        foodItem: claim.foodItemId
      };
    }) as any as FoodClaimWithDetails[];
  }

  async getFoodClaimByClaimCode(claimCode: string): Promise<FoodClaimWithDetails | undefined> {
    const claim = await FoodClaim.findOne({ claimCode })
      .populate('userId')
      .populate('foodItemId')
      .lean();
    
    if (!claim) return undefined;
    
    // Store the original foodItemId string before it gets replaced by population
    const foodItemIdString = (claim as any).foodItemId?._id?.toString() || (claim as any).foodItemId;
    
    return {
      ...(claim as any),
      foodItemId: foodItemIdString, // Keep as string for comparisons
      user: (claim as any).userId,
      foodItem: (claim as any).foodItemId
    } as any as FoodClaimWithDetails;
  }

  async getActiveFoodClaims(): Promise<FoodClaimWithDetails[]> {
    const now = new Date();
    const claims = await FoodClaim.find({
      status: 'reserved',
      expiresAt: { $gte: now }
    })
    .populate('userId')
    .populate('foodItemId')
    .sort({ createdAt: -1 })
    .lean();
    
    return claims.map((claim: any) => {
      // Store the original foodItemId string before it gets replaced by population
      const foodItemIdString = claim.foodItemId?._id?.toString() || claim.foodItemId;
      
      return {
        ...claim,
        foodItemId: foodItemIdString, // Keep as string for comparisons
        user: claim.userId,
        foodItem: claim.foodItemId
      };
    }) as any as FoodClaimWithDetails[];
  }

  async getClaimByCode(claimCode: string): Promise<FoodClaimWithDetails | undefined> {
    return this.getFoodClaimByClaimCode(claimCode);
  }

  async completeClaim(claimId: string): Promise<FoodClaimWithDetails> {
    const claim = await FoodClaim.findById(claimId).lean();
    
    if (!claim) {
      throw new Error("Claim not found");
    }

    if (claim.status !== "reserved") {
      throw new Error("Claim is not in reserved status");
    }

    await FoodClaim.findByIdAndUpdate(claimId, {
      status: 'claimed',
      claimedAt: new Date()
    });

    await FoodItem.findByIdAndUpdate(claim.foodItemId, {
      $inc: { quantityAvailable: -claim.quantityClaimed },
      updatedAt: new Date()
    });

    const fullClaim = await FoodClaim.findById(claimId)
      .populate('userId')
      .populate('foodItemId')
      .lean();

    // Store the original foodItemId string before it gets replaced by population
    const foodItemIdString = (fullClaim as any).foodItemId?._id?.toString() || (fullClaim as any).foodItemId;

    return {
      ...(fullClaim as any),
      foodItemId: foodItemIdString, // Keep as string for comparisons
      user: (fullClaim as any).userId,
      foodItem: (fullClaim as any).foodItemId
    } as any as FoodClaimWithDetails;
  }

  // Food donation operations
  async getExpiredFoodItems(): Promise<IFoodItem[]> {
    const now = new Date().toISOString();
    const items = await FoodItem.find({
      isActive: false,
      availableUntil: { $lt: now }
    })
    .sort({ createdAt: -1 })
    .lean();
    return items as any as IFoodItem[];
  }

  async updateExpiredItemsStatus(): Promise<number> {
    const now = new Date().toISOString();

    // Mark expired items as inactive
    const expiredResult = await FoodItem.updateMany(
      {
        $or: [
          { isActive: true },
          { isActive: { $exists: false } } // Include items where isActive field doesn't exist
        ],
        availableUntil: { $lt: now }
      },
      {
        isActive: false,
        updatedAt: new Date()
      }
    );

    // Reactivate items that are not expired and have quantity available
    await FoodItem.updateMany(
      {
        isActive: false,
        availableUntil: { $gte: now },
        quantityAvailable: { $gte: 1 }
      },
      {
        isActive: true,
        updatedAt: new Date()
      }
    );

    return expiredResult.modifiedCount;
  }

  async createFoodDonation(donation: InsertFoodDonation): Promise<IFoodDonation> {
    const newDonation = await FoodDonation.create(donation);
    return newDonation.toObject() as any as IFoodDonation;
  }

  async getAllDonations(): Promise<FoodDonationWithDetails[]> {
    const donations = await FoodDonation.find()
      .populate('foodItemId')
      .sort({ createdAt: -1 })
      .lean();
    
    return donations.map((donation: any) => ({
      ...donation,
      foodItem: donation.foodItemId
    })) as any as FoodDonationWithDetails[];
  }

  async getDonationsByCreator(creatorId: string): Promise<FoodDonationWithDetails[]> {
    const foodItems = await FoodItem.find({ createdBy: creatorId }).select('_id').lean();
    const foodItemIds = foodItems.map(item => item._id.toString());

    const donations = await FoodDonation.find({
      foodItemId: { $in: foodItemIds }
    })
    .populate('foodItemId')
    .sort({ createdAt: -1 })
    .lean();
    
    return donations.map((donation: any) => ({
      ...donation,
      foodItem: donation.foodItemId
    })) as any as FoodDonationWithDetails[];
  }

  async updateDonationStatus(
    id: string,
    status: string,
    ngoInfo?: {
      ngoName: string;
      ngoContactPerson: string;
      ngoPhoneNumber: string;
    }
  ): Promise<IFoodDonation> {
    const updateData: any = { status };

    if (status === "reserved_for_ngo" && ngoInfo) {
      updateData.ngoName = ngoInfo.ngoName;
      updateData.ngoContactPerson = ngoInfo.ngoContactPerson;
      updateData.ngoPhoneNumber = ngoInfo.ngoPhoneNumber;
      updateData.reservedAt = new Date();
    } else if (status === "collected") {
      updateData.collectedAt = new Date();
    }

    const donation = await FoodDonation.findByIdAndUpdate(id, updateData, { new: true }).lean();
    return donation as any as IFoodDonation;
  }

  async transferExpiredItemsToDonations(): Promise<number> {
    await this.updateExpiredItemsStatus();
    const expiredItems = await this.getExpiredFoodItems();
    let transferredCount = 0;

    for (const item of expiredItems) {
      if (item.quantityAvailable > 0) {
        const existingDonation = await FoodDonation.findOne({ foodItemId: item._id });

        if (!existingDonation) {
          await this.createFoodDonation({
            foodItemId: item._id.toString(),
            quantityDonated: item.quantityAvailable,
            status: "available",
            notes: `Auto-transferred from expired food item: ${item.name}`
          });
          transferredCount++;
        }
      }
    }

    return transferredCount;
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<IEvent> {
    const newEvent = await Event.create(event);
    return newEvent.toObject() as any as IEvent;
  }

  async getAllEvents(): Promise<EventWithCreator[]> {
    const events = await Event.find()
      .populate('createdBy')
      .sort({ startTime: -1 })
      .lean();
    
    return events as any as EventWithCreator[];
  }

  async getEventsByCreator(creatorId: string): Promise<IEvent[]> {
    const events = await Event.find({ createdBy: creatorId })
      .sort({ startTime: -1 })
      .lean();
    return events as any as IEvent[];
  }

  async getEventById(id: string): Promise<IEvent | undefined> {
    const event = await Event.findById(id).lean();
    return event ? (event as any as IEvent) : undefined;
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<IEvent> {
    const event = await Event.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();
    return event as any as IEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    await Event.findByIdAndDelete(id);
  }

  // Stats operations
  async getCampusStats(): Promise<{
    totalMealsSaved: number;
    activeStudents: number;
    partnerCanteens: number;
    totalSavings: number;
    foodProvided: number;
    wastedFood: number;
    claimedFood: number;
    carbonFootprintSaved: number;
    waterFootprintSaved: number;
    currentlyActiveItems: number;
    totalQuantityAvailable: number;
  }> {
    const mealsSaved = await FoodClaim.countDocuments({ status: 'claimed' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeStudents = await FoodClaim.distinct('userId', {
      createdAt: { $gte: thirtyDaysAgo }
    });

    const partnerCanteens = await FoodItem.distinct('canteenName', { isActive: true });

    const foodProvidedResult = await FoodItem.aggregate([
      { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
    ]);
    const foodProvided = foodProvidedResult[0]?.total || 0;

    const now = new Date();
    const currentlyActiveItems = await FoodItem.countDocuments({
      isActive: true,
      availableUntil: { $gte: now.toISOString() }
    });

    const totalQuantityResult = await FoodItem.aggregate([
      {
        $match: {
          isActive: true,
          availableUntil: { $gte: now.toISOString() }
        }
      },
      { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
    ]);
    const totalQuantityAvailable = totalQuantityResult[0]?.total || 0;

    const expiredClaims = await FoodClaim.countDocuments({
      $or: [
        { status: 'expired' },
        { status: 'reserved', expiresAt: { $lt: now } }
      ]
    });

    const expiredItemsResult = await FoodItem.aggregate([
      {
        $match: {
          availableUntil: { $lt: now.toISOString() },
          isActive: false
        }
      },
      { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
    ]);
    const expiredItems = expiredItemsResult[0]?.total || 0;

    const claimedFood = await FoodClaim.countDocuments({ status: 'claimed' });

    const totalMeals = mealsSaved;
    const carbonFootprintSaved = totalMeals * 1.5;
    const waterFootprintSaved = totalMeals * 500;

    return {
      totalMealsSaved: totalMeals,
      activeStudents: activeStudents.length,
      partnerCanteens: partnerCanteens.length,
      totalSavings: 0,
      foodProvided,
      wastedFood: expiredClaims + expiredItems,
      claimedFood,
      carbonFootprintSaved,
      waterFootprintSaved,
      currentlyActiveItems,
      totalQuantityAvailable,
    };
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<INotification> {
    const newNotification = await Notification.create(notification);
    return newNotification.toObject() as any as INotification;
  }

  async getNotificationsByUser(userId: string): Promise<INotification[]> {
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return notifications as any as INotification[];
  }

  async markNotificationAsRead(notificationId: string): Promise<INotification> {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    ).lean();
    return notification as any as INotification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId }, { isRead: true });
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await Notification.findByIdAndDelete(notificationId);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return await Notification.countDocuments({ userId, isRead: false });
  }

  async getUsersWhoClaimedFromCanteen(canteenName: string): Promise<string[]> {
    const foodItems = await FoodItem.find({ canteenName }).select('_id').lean();
    const foodItemIds = foodItems.map(item => item._id.toString());

    const claims = await FoodClaim.find({
      foodItemId: { $in: foodItemIds }
    }).distinct('userId');

    return claims;
  }
}

export const storage = new DatabaseStorage();