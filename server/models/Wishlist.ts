import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlistItem {
  productId: string;
  addedAt: Date;
}

export interface IWishlist extends Document {
  userId?: string;
  sessionId?: string;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>(
  {
    productId: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: String, sparse: true, index: true },
    sessionId: { type: String, sparse: true, index: true },
    items: [WishlistItemSchema],
  },
  { timestamps: true }
);

// Prevent duplicate entries for the same user or session
WishlistSchema.index({ userId: 1 }, { unique: true, sparse: true });
WishlistSchema.index({ sessionId: 1 }, { unique: true, sparse: true });

export const WishlistModel =
  mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', WishlistSchema);
