import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
  id: string;
  sku: string;
  name: string;
  options: Record<string, string>; // e.g. { Color: "Midnight Black", Size: "XL" }
  price: number;
  salePrice?: number;
  stock: number;
  image?: string;
  isAvailable: boolean;
}

export interface IProductImage {
  url: string;
  publicId?: string; // Cloudinary public_id
  alt?: string;
  isPrimary?: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  brand: string;
  category: string;
  subcategory?: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  badge?: string;
  images: IProductImage[];
  variants: IProductVariant[];
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  ratingAverage: number;
  reviewCount: number;
  salesCount: number;
  isBestSeller: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  isNewArrival: boolean;
  attributes: Record<string, string>;
  banglaKeywords: string[];
  status: 'draft' | 'published' | 'archived';
  warranty?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    id: { type: String, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    options: { type: Map, of: String },
    price: { type: Number, required: true },
    salePrice: { type: Number },
    stock: { type: Number, default: 0 },
    image: { type: String },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    barcode: { type: String },
    brand: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String },
    description: { type: String, required: true },
    shortDescription: { type: String },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    badge: { type: String },
    images: [ProductImageSchema],
    variants: [ProductVariantSchema],
    stock: { type: Number, required: true, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    isBestSeller: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isPopular: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: true, index: true },
    attributes: { type: Map, of: String },
    banglaKeywords: [{ type: String, index: true }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    warranty: { type: String },
  },
  { timestamps: true }
);

// Compound indexes optimized for high-throughput catalog filtering and sorting
ProductSchema.index({ status: 1, category: 1, price: 1 });
ProductSchema.index({ status: 1, brand: 1, price: 1 });
ProductSchema.index({ status: 1, isPopular: 1, salesCount: -1 });
ProductSchema.index({ status: 1, isBestSeller: 1 });
ProductSchema.index({ status: 1, isFeatured: 1 });
ProductSchema.index({ status: 1, isNewArrival: 1 });
ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ banglaKeywords: 1, status: 1 });

// Full text search index with field relevance weighting
ProductSchema.index(
  {
    name: 'text',
    sku: 'text',
    banglaKeywords: 'text',
    brand: 'text',
    category: 'text',
    subcategory: 'text',
    description: 'text',
  },
  {
    weights: {
      name: 10,
      sku: 8,
      banglaKeywords: 7,
      brand: 5,
      category: 5,
      subcategory: 4,
      description: 1,
    },
    name: 'ProductTextSearchIndex',
  }
);

export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
