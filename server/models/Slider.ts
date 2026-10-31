import mongoose, { Schema, Document } from 'mongoose';

export interface ISlider extends Document {
  tag: string;
  headline: string;
  subheadline: string;
  buttonText: string;
  buttonLink: string;
  lifestyleImage: string;
  modelScript?: string;
  badge?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SliderSchema = new Schema<ISlider>(
  {
    tag: { type: String, required: true, default: 'NEW ARRIVALS' },
    headline: { type: String, required: true },
    subheadline: { type: String, required: true },
    buttonText: { type: String, required: true, default: 'Shop Now' },
    buttonLink: { type: String, required: true, default: '/shop' },
    lifestyleImage: { type: String, required: true },
    modelScript: { type: String, default: 'Good Things\nTake Time ♡' },
    badge: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const SliderModel = mongoose.models.Slider || mongoose.model<ISlider>('Slider', SliderSchema);
