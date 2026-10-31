import mongoose, { Schema, Document } from 'mongoose';

export type BannerPlacement =
  | 'homepage-main'
  | 'homepage-secondary'
  | 'homepage-category'
  | 'homepage-promotion';

export interface IBanner extends Document {
  placement: BannerPlacement;
  tag?: string;
  headline: string;
  subheadline?: string;
  buttonText: string;
  buttonLink: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  theme?: string; // 'dark' | 'peach' | 'emerald' | 'amber'
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    placement: {
      type: String,
      required: true,
      enum: ['homepage-main', 'homepage-secondary', 'homepage-category', 'homepage-promotion'],
      index: true,
    },
    tag: { type: String },
    headline: { type: String, required: true },
    subheadline: { type: String },
    buttonText: { type: String, default: 'Shop Now' },
    buttonLink: { type: String, default: '/shop' },
    imageUrl: { type: String },
    backgroundColor: { type: String, default: '#0c261e' },
    textColor: { type: String, default: '#ffffff' },
    theme: { type: String, default: 'dark' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const BannerModel = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);
