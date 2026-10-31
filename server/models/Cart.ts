import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  productId: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  name: string;
  price: number;
  salePrice?: number;
  quantity: number;
  image: string;
  stock: number;
  selected?: boolean;
}

export interface ICart extends Document {
  userId?: string;
  sessionId?: string;
  items: ICartItem[];
  couponCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: String, required: true },
    variantId: { type: String },
    variantName: { type: String },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    salePrice: { type: Number },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} must be a positive integer quantity',
      },
    },
    image: { type: String, required: true },
    stock: { type: Number, default: 99 },
    selected: { type: Boolean, default: true },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    userId: { type: String, index: true },
    sessionId: { type: String, index: true },
    items: [CartItemSchema],
    couponCode: { type: String, uppercase: true, trim: true },
  },
  { timestamps: true }
);

// Indexes for high-performance lookup
CartSchema.index({ userId: 1 });
CartSchema.index({ sessionId: 1 });
CartSchema.index({ userId: 1, sessionId: 1 });

// TTL index to automatically prune abandoned guest carts older than 30 days
CartSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 30 * 86400,
    partialFilterExpression: { userId: { $exists: false } },
  }
);

export const CartModel = mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
