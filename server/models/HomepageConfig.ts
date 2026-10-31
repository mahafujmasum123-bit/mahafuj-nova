import mongoose, { Schema, Document } from 'mongoose';

export interface IBannerPlacementRule {
  id: string;
  bannerId: string;
  insertAfterProductCount: number;
  displayOrder: number;
  isEnabled: boolean;
}

export interface IHomepageSection {
  id: string;
  sectionType: string;
  title: string;
  subtitle?: string;
  displayOrder: number;
  isEnabled: boolean;
  settings: {
    productSource?: string;
    categorySlug?: string;
    productIds?: string[];
    productLimit: number;
    desktopColumns: number;
    mobileColumns: number;
    bannerPlacements: IBannerPlacementRule[];
    bannerId?: string;
    bannerIds?: string[];
    backgroundColor?: string;
    viewAllLink?: string;
    viewAllText?: string;
  };
}

export interface IHomepageConfig extends Document {
  draftSections: IHomepageSection[];
  publishedSections: IHomepageSection[];
  isDraftModified: boolean;
  lastPublishedAt?: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const BannerPlacementRuleSchema = new Schema(
  {
    id: { type: String, required: true },
    bannerId: { type: String, required: true },
    insertAfterProductCount: { type: Number, default: 4 },
    displayOrder: { type: Number, default: 1 },
    isEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const SectionSettingsSchema = new Schema(
  {
    productSource: { type: String, default: 'featured' },
    categorySlug: { type: String },
    productIds: [{ type: String }],
    productLimit: { type: Number, default: 8 },
    desktopColumns: { type: Number, default: 4 },
    mobileColumns: { type: Number, default: 2 },
    bannerPlacements: [BannerPlacementRuleSchema],
    bannerId: { type: String },
    bannerIds: [{ type: String }],
    backgroundColor: { type: String },
    viewAllLink: { type: String },
    viewAllText: { type: String },
  },
  { _id: false }
);

const HomepageSectionSchema = new Schema(
  {
    id: { type: String, required: true },
    sectionType: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    displayOrder: { type: Number, required: true },
    isEnabled: { type: Boolean, default: true },
    settings: { type: SectionSettingsSchema, default: () => ({}) },
  },
  { _id: false }
);

const HomepageConfigSchema = new Schema<IHomepageConfig>(
  {
    draftSections: [HomepageSectionSchema],
    publishedSections: [HomepageSectionSchema],
    isDraftModified: { type: Boolean, default: false },
    lastPublishedAt: { type: Date },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const HomepageConfigModel =
  mongoose.models.HomepageConfig ||
  mongoose.model<IHomepageConfig>('HomepageConfig', HomepageConfigSchema);
