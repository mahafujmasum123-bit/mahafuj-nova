import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const CouponModel = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export interface IHomepageCMS extends Document {
  announcementBar: {
    enabled: boolean;
    text: string;
    subtext?: string;
  };
  heroBanner: {
    tag: string;
    headline: string;
    subheadline: string;
    buttonText: string;
    buttonLink: string;
    imageUrl: string;
    modelScript: string;
  };
  promotionalAds: {
    enabled: boolean;
    headline: string;
    subheadline: string;
    buttonText: string;
    targetUrl: string;
    imageUrl?: string;
    backgroundColor?: string;
  };
  updatedAt: Date;
}

const HomepageCMSSchema = new Schema<IHomepageCMS>(
  {
    announcementBar: {
      enabled: { type: Boolean, default: true },
      text: { type: String, default: 'Free shipping on orders over ৳5,000' },
      subtext: { type: String, default: '24/7 Customer Support in Bangladesh' },
    },
    heroBanner: {
      tag: { type: String, default: 'NEW ARRIVALS' },
      headline: { type: String, default: 'Upgrade Your Lifestyle' },
      subheadline: { type: String, default: 'Discover premium quality products designed for a better, smarter and easier life.' },
      buttonText: { type: String, default: 'Shop Now' },
      buttonLink: { type: String, default: '/shop' },
      imageUrl: { type: String, default: '/assets/aistudio/ShopMax_Premium_E-Commerce_Homepage_4a6173dd.png' },
      modelScript: { type: String, default: 'Good Things Take Time ♡' },
    },
    promotionalAds: {
      enabled: { type: Boolean, default: true },
      headline: { type: String, default: 'UP TO 50% OFF' },
      subheadline: { type: String, default: 'On Your Favorite Brands' },
      buttonText: { type: String, default: 'Shop Now' },
      targetUrl: { type: String, default: '/shop?discount=true' },
      imageUrl: { type: String },
      backgroundColor: { type: String, default: '#0c261e' },
    },
  },
  { timestamps: true }
);

export const CMSModel = mongoose.models.CMS || mongoose.model<IHomepageCMS>('CMS', HomepageCMSSchema);

export interface IAuditLog extends Document {
  action: string;
  actor: string;
  role: string;
  entity: string;
  entityId?: string;
  details?: string;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    actor: { type: String, required: true },
    role: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    details: { type: String },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
