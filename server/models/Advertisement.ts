import mongoose, { Schema, Document } from 'mongoose';

export type AdFrequency = 'once_per_session' | 'always' | 'daily';

export interface IAdvertisement extends Document {
  title: string;
  description?: string;
  imageUrl: string;
  destinationUrl: string;
  buttonText: string;
  priority: number;
  frequency: AdFrequency;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  impressions: number;
  clicks: number;
  dismissals: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementSchema = new Schema<IAdvertisement>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, required: true },
    destinationUrl: { type: String, required: true, default: '/shop' },
    buttonText: { type: String, default: 'Learn More' },
    priority: { type: Number, default: 1 },
    frequency: {
      type: String,
      enum: ['once_per_session', 'always', 'daily'],
      default: 'once_per_session',
    },
    isActive: { type: Boolean, default: true, index: true },
    startDate: { type: Date },
    endDate: { type: Date },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    dismissals: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AdvertisementModel =
  mongoose.models.Advertisement ||
  mongoose.model<IAdvertisement>('Advertisement', AdvertisementSchema);
