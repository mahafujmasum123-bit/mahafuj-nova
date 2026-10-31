import mongoose, { Schema, Document } from 'mongoose';

export interface IContactMessage extends Document {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  department?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  isRead: boolean;
  staffNotes?: string;
  repliedAt?: Date;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    department: { type: String, default: 'General Support', trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    isRead: { type: Boolean, default: false },
    staffNotes: { type: String, trim: true },
    repliedAt: { type: Date },
    ipAddress: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ email: 1 });
ContactMessageSchema.index({ isRead: 1 });

export const ContactMessageModel = mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);

// In-memory store for development / offline MongoDB resilience
export let inMemoryContactMessages: Array<{
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  department?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  isRead: boolean;
  staffNotes?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: 'msg-seed-1',
    name: 'Tanvir Ahmed',
    email: 'tanvir.ahmed@example.com',
    phone: '+880 1711 223344',
    subject: 'Corporate Bulk Purchase for Soundcore Headphones',
    department: 'Wholesale & B2B',
    message: 'Greetings! Our engineering consultancy is looking to purchase 35 units of the Soundcore Life Q30 Wireless Noise Cancelling Headphones for our engineering team in Banani, Dhaka. Could you share corporate discount rates and estimated delivery timelines?',
    status: 'new',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'msg-seed-2',
    name: 'Farzana Yasmin',
    email: 'farzana.y@gmail.com',
    phone: '+880 1819 887766',
    subject: 'Inquiry about Chittagong express delivery',
    department: 'Shipping & Delivery',
    message: 'Hello, I live in Nasirabad, Chittagong. I want to order the Smart Watch with AMOLED display for an anniversary gift this Friday. Is Next-Day Delivery available for Chittagong addresses, or does standard shipping take 2 days?',
    status: 'read',
    isRead: true,
    staffNotes: 'Confirmed 24-hr express courier with RedX / Paperfly priority parcel.',
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'msg-seed-3',
    name: 'Mahmudul Hasan',
    email: 'mahmud.tech@yahoo.com',
    phone: '+880 1912 345678',
    subject: 'Warranty coverage question on ErgoPro Chair',
    department: 'Warranty & Claims',
    message: 'I purchased the ErgoPro mesh chair last month. The lumbar adjustment feels excellent, but I wanted to verify the procedure for obtaining warranty service should any hydraulic cylinder issue arise in the future.',
    status: 'replied',
    isRead: true,
    staffNotes: 'Support team shared official 3-year door-step replacement warranty documentation.',
    repliedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];
