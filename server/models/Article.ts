import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  readTimeMinutes: number;
  publishedAt: Date;
  featured: boolean;
  tags: string[];
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverImage: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    author: {
      name: { type: String, required: true },
      role: { type: String, default: 'Editorial Staff' },
      avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80' },
    },
    readTimeMinutes: { type: Number, default: 4 },
    publishedAt: { type: Date, default: Date.now },
    featured: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
    viewsCount: { type: Number, default: 0 },
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

ArticleSchema.index({ slug: 1 });
ArticleSchema.index({ category: 1, publishedAt: -1 });
ArticleSchema.index({ featured: 1 });

export const ArticleModel = mongoose.model<IArticle>('Article', ArticleSchema);

// In-memory fallback and seed articles
export let inMemoryArticles: Array<{
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  readTimeMinutes: number;
  publishedAt: string;
  featured: boolean;
  tags: string[];
  viewsCount: number;
}> = [
  {
    id: 'art-1',
    title: 'The Science of Active Noise Cancellation: Why Modern Drivers Matter',
    slug: 'science-of-active-noise-cancellation',
    excerpt: 'Explore how inverse acoustic phase wave inversion, dual-microphone arrays, and hybrid hybrid cancellation create absolute silence for work and travel in busy cities.',
    content: `
      ## Silence by Design: Understanding Hybrid ANC

      In bustling urban centers like Dhaka, traffic ambient frequencies hover consistently between 80 Hz and 400 Hz. Standard passive foam isolation blocks high frequency treble (such as vocal chatter), but struggles against the heavy, low-frequency rumble of bus engines, air conditioners, and street transit.

      This is where **Active Noise Cancellation (ANC)** transforms the personal audio landscape.

      ### How Inverted Soundwaves Create Pure Stillness

      Hybrid active noise cancellation relies on internal and external micro-electromechanical systems (MEMS) microphones:

      1. **Feedforward Microphones**: Positioned on the exterior shell, these capture external ambient noise before it permeates the ear canal.
      2. **Digital Signal Processor (DSP)**: In mere fractions of a millisecond, the internal audio chip calculates an exact 180-degree phase-inverted soundwave ("anti-noise").
      3. **Feedback Microphones**: Positioned inside the driver chamber right next to the ear, these continuously measure what you actually hear and calibrate out residual low-end drift.

      When the sound wave meets its inverted mirror, destructive interference occurs: $Wave + (-Wave) = 0$. What remains is pure, undistorted musical fidelity.

      ### Custom Dynamic Drivers vs. Off-The-Shelf Hardware

      Many budget headphones cut corners by placing standard 30mm plastic drivers into ANC housings. However, when the DSP injects corrective anti-phase waves, cheap drivers suffer diaphragm distortion, causing muddy bass or a noticeable "ear-pressure" sensation.

      Our Soundcore Life Q30 and flagship audio products utilize custom 40mm silk-diaphragm drivers capable of reproducing frequencies up to 40kHz (Hi-Res Audio Certified). The silk suspension ensures instantaneous transient response without introducing harmonic flutter.

      ### Maximizing Your Battery Life

      When using ANC in heavy transit environments, remember:
      - Multi-mode ANC (Transport vs. Indoor vs. Outdoor) tailors processor load.
      - Using Bluetooth 5.3 Low Energy (LE) Audio extends playback beyond 40 continuous hours.
      - A quick 5-minute USB-C charge yields over 4 hours of listening time.
    `,
    coverImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80',
    category: 'Audio Tech',
    author: {
      name: 'Dr. Shahriar Kabir',
      role: 'Lead Acoustics Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    },
    readTimeMinutes: 5,
    publishedAt: '2026-10-24T10:00:00.000Z',
    featured: true,
    tags: ['Acoustics', 'ANC', 'Headphones', 'Hi-Res Audio'],
    viewsCount: 1420,
  },
  {
    id: 'art-2',
    title: 'The Sustainable Retail Blueprint: Direct Sourcing Without Middlemen',
    slug: 'sustainable-retail-blueprint-direct-sourcing',
    excerpt: 'How single-vendor fulfillment models eliminate redundant packaging, reduce regional freight emissions, and guarantee authentic consumer electronics across 64 districts.',
    content: `
      ## The Hidden Cost of Multi-Tier Distribution

      Traditional e-commerce marketplaces in South Asia often pass products through three to five intermediaries: the manufacturer, regional import distributors, sub-wholesalers, merchant warehouses, and finally third-party courier dispatchers.

      Every transfer stage adds:
      - Disposable plastic shrink-wrap and protective bubble layers.
      - Redundant cross-city freight miles between competing depots.
      - Increased risk of damaged packaging and counterfeit insertion.

      ### Novara’s Direct Single-Vendor Hub Model

      At Novara Commerce / ShopMax, we adopted a closed-loop direct supply chain. Every item showcased in our catalog is imported directly from authenticated manufacturer partner agreements and stocked at our temperature-controlled central facility in Dhaka.

      ### Concrete Environmental Milestones

      - **FSC-Certified Biodegradable Boxes**: Over 94% of our packaging is 100% recyclable unbleached kraft board.
      - **Zero Bubble-Wrap Policy**: We replaced synthetic plastic air pillows with expandable honeycomb paper buffers.
      - **Route-Optimized Direct Courier Routing**: By dispatching directly from our central hub through localized logistics hubs, we eliminated 38% of unnecessary urban transit transfers.

      Direct retail isn't merely a superior consumer guarantee — it is an ecological imperative for the future of Bangladesh commerce.
    `,
    coverImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&q=80',
    category: 'Sustainability',
    author: {
      name: 'Nusrat Chowdhury',
      role: 'Head of Sustainable Operations',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
    },
    readTimeMinutes: 4,
    publishedAt: '2026-10-18T14:30:00.000Z',
    featured: false,
    tags: ['Sustainability', 'Logistics', 'Eco-Packaging', 'Direct Retail'],
    viewsCount: 890,
  },
  {
    id: 'art-3',
    title: 'Smartwatch Health Sensors in 2026: SpO2, HRV, and Sleep Architecture',
    slug: 'smartwatch-health-sensors-spo2-hrv-sleep',
    excerpt: 'Demystifying optical photoplethysmography (PPG), wrist-based temperature tracking, and algorithmic sleep staging to get actionable insights into daily recovery.',
    content: `
      ## Beyond Step Counting: The Modern Wellness Companion

      Ten years ago, fitness trackers measured basic wrist oscillation using primitive accelerometers. Today’s smartwatches are precision diagnostic wear that measure cardiovascular stress, oxygen saturation, and autonomic nervous system tone.

      ### Photoplethysmography (PPG) Explained

      Underneath your smartwatch casing sits an array of green, red, and infrared LEDs paired with sensitive optical photodiodes:
      - **Green Light**: Absorbed primarily by oxygenated hemoglobin. By pulsing green light hundreds of times per second, the sensor records micro-volume fluctuations in capillaries as your pulse expands them.
      - **Red & Infrared Light**: Deoxygenated hemoglobin absorbs more red light, while oxygenated blood absorbs more infrared. Comparing the absorption ratio calculates continuous SpO2 (peripheral blood oxygen saturation).

      ### Why Heart Rate Variability (HRV) is Your Truest Stress Metric

      Unlike steady-state resting heart rate, HRV measures the exact millisecond differences between successive heartbeats (the R-R intervals).

      - **High HRV**: Signals that your parasympathetic (rest-and-digest) system is dominating, indicating prime physical recovery.
      - **Low HRV**: Signals that your sympathetic (fight-or-flight) system is burdened by fatigue, dehydration, lack of sleep, or early-stage illness.

      By monitoring HRV baseline over 14 consecutive nights, modern wearable algorithms alert you to rest before burnout or muscle strain sets in.
    `,
    coverImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
    category: 'Wearables & Health',
    author: {
      name: 'Adnan Al-Mamun',
      role: 'Wearable Tech Reviewer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    },
    readTimeMinutes: 6,
    publishedAt: '2026-10-12T09:15:00.000Z',
    featured: false,
    tags: ['Smartwatch', 'Health Tech', 'Wearables', 'Sensors'],
    viewsCount: 1650,
  },
  {
    id: 'art-4',
    title: 'The Ergonomic Workstation Guide: Posture, Lumbar Angles & Productivity',
    slug: 'ergonomic-workstation-guide-posture-lumbar-productivity',
    excerpt: 'Practical guidelines on seat pan depth, armrest height ratios, lumbar support curvature, and monitor eye-level alignment for 8-hour desktop comfort.',
    content: `
      ## The Physical Burden of Sedentary Work

      Spending 40+ hours per week at a desk without dialed-in ergonomic calibration places disproportionate torque on the L4-L5 lumbar discs and cervical spine. 

      Slouching increases intradiscal pressure by up to 190% compared to standing. Here is how to configure your workstation correctly:

      ### 1. The 90-90-90 Rule
      - **Hips**: Sit back fully into the chair backrest with hips angled at approximately 95 to 105 degrees.
      - **Knees**: Adjust seat height so your knees rest level with or slightly below your hips. Feet should sit completely flat on the floor.
      - **Elbows**: Desk or armrest height should allow forearms to rest parallel to the desk surface, avoiding shoulder shrugging.

      ### 2. Lumbar Spine Support
      The natural lordotic curve of your lower back needs continuous firm resistance. Dynamic lumbar tracking cushions or integrated lumbar dials prevent pelvic tilting and spinal compression.

      ### 3. Screen Height & Eye Angle
      The top third of your display should align exactly with horizontal eye level. This eliminates neck craning and chronic trapezius strain.
    `,
    coverImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
    category: 'Buying Guides',
    author: {
      name: 'Dr. Shahriar Kabir',
      role: 'Lead Acoustics & Ergonomics Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    },
    readTimeMinutes: 5,
    publishedAt: '2026-10-05T11:45:00.000Z',
    featured: false,
    tags: ['Ergonomics', 'Office', 'Health', 'Furniture'],
    viewsCount: 920,
  },
];
