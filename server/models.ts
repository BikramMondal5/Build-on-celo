import mongoose, { Schema, Document } from 'mongoose';

// Base interface with both _id and id
interface BaseDocument extends Document {
  _id: any;
  id: string;
}

// User Model
export interface IUser extends BaseDocument {
  walletAddress: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: string;
  studentId?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  walletAddress: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  firstName: String,
  lastName: String,
  profileImageUrl: String,
  role: { type: String, default: 'student' },
  studentId: String,
  phoneNumber: String,
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('id').get(function() {
  return this._id.toString();
});

export const User = mongoose.model<IUser>('User', userSchema);

// Food Item Model
export interface IFoodItem extends BaseDocument {
  name: string;
  description?: string;
  canteenName: string;
  canteenLocation?: string;
  quantityAvailable: number;
  imageUrl?: string;
  availableUntil: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const foodItemSchema = new Schema<IFoodItem>({
  name: { type: String, required: true },
  description: String,
  canteenName: { type: String, required: true },
  canteenLocation: String,
  quantityAvailable: { type: Number, default: 0 },
  imageUrl: String,
  availableUntil: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true, ref: 'User' },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

foodItemSchema.virtual('id').get(function() {
  return this._id.toString();
});

export const FoodItem = mongoose.model<IFoodItem>('FoodItem', foodItemSchema);

// Food Claim Model
export interface IFoodClaim extends BaseDocument {
  userId: string;
  foodItemId: string;
  quantityClaimed: number;
  claimCode: string;
  status: string;
  expiresAt: Date;
  claimedAt?: Date;
  createdAt: Date;
}

const foodClaimSchema = new Schema<IFoodClaim>({
  userId: { type: String, required: true, ref: 'User' },
  foodItemId: { type: String, required: true, ref: 'FoodItem' },
  quantityClaimed: { type: Number, default: 1 },
  claimCode: { type: String, required: true, unique: true },
  status: { type: String, default: 'reserved' },
  expiresAt: { type: Date, required: true },
  claimedAt: Date,
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

foodClaimSchema.virtual('id').get(function() {
  return this._id.toString();
});

export const FoodClaim = mongoose.model<IFoodClaim>('FoodClaim', foodClaimSchema);

// Food Donation Model
export interface IFoodDonation extends BaseDocument {
  foodItemId: string;
  ngoName?: string;
  ngoContactPerson?: string;
  ngoPhoneNumber?: string;
  quantityDonated: number;
  status: string;
  donatedAt: Date;
  reservedAt?: Date;
  collectedAt?: Date;
  notes?: string;
  createdAt: Date;
}

const foodDonationSchema = new Schema<IFoodDonation>({
  foodItemId: { type: String, required: true, ref: 'FoodItem' },
  ngoName: String,
  ngoContactPerson: String,
  ngoPhoneNumber: String,
  quantityDonated: { type: Number, required: true },
  status: { type: String, default: 'available' },
  donatedAt: { type: Date, default: Date.now },
  reservedAt: Date,
  collectedAt: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

foodDonationSchema.virtual('id').get(function() {
  return this._id.toString();
});

export const FoodDonation = mongoose.model<IFoodDonation>('FoodDonation', foodDonationSchema);

// Event Model
export interface IEvent extends BaseDocument {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location: string;
  phoneNumber?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: String,
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String, required: true },
  phoneNumber: String,
  createdBy: { type: String, required: true, ref: 'User' },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

eventSchema.virtual('id').get(function() {
  return this._id.toString();
});

export const Event = mongoose.model<IEvent>('Event', eventSchema);

// Notification Model
export interface INotification extends BaseDocument {
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedItemId?: string;
  relatedItemType?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' },
  isRead: { type: Boolean, default: false },
  relatedItemId: String,
  relatedItemType: String,
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

notificationSchema.virtual('id').get(function() {
  return this._id.toString();
});

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);