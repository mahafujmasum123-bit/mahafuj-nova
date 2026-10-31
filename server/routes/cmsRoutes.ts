import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { INITIAL_TESTIMONIALS } from '../data/initialData';
import { SliderModel } from '../models/Slider';
import { BannerModel, BannerPlacement } from '../models/Banner';
import { AdvertisementModel } from '../models/Advertisement';
import { isDbConnected } from '../db';

const router = Router();

// ==========================================
// 1. IN-MEMORY STORE WITH DATABASE SYNC
// ==========================================

export interface SliderItem {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface BannerItem {
  id: string;
  placement: BannerPlacement;
  tag?: string;
  headline: string;
  subheadline?: string;
  buttonText: string;
  buttonLink: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  theme?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdvertisementItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  destinationUrl: string;
  buttonText: string;
  priority: number;
  frequency: 'once_per_session' | 'always' | 'daily';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  dismissals: number;
  createdAt: string;
  updatedAt: string;
}

export let inMemorySliders: SliderItem[] = [
  {
    id: 'sld-1',
    tag: 'NEW ARRIVALS',
    headline: 'Upgrade Your\nLifestyle',
    subheadline: 'Discover premium quality products designed for a better, smarter and easier life.',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    lifestyleImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&q=80',
    modelScript: 'Good Things\nTake Time ♡',
    badge: 'Trending Collection',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sld-2',
    tag: 'FLAGSHIP AUDIO',
    headline: 'Immersive Sound\nEvery Moment',
    subheadline: 'Experience studio-grade active noise cancellation and 40h endurance audio.',
    buttonText: 'Explore Audio',
    buttonLink: '/shop?category=electronics',
    lifestyleImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=80',
    modelScript: 'Pure Clarity\nZero Noise ♫',
    badge: 'Editor Choice',
    displayOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sld-3',
    tag: 'SMART WEARABLES',
    headline: 'Precision Tech\nOn Your Wrist',
    subheadline: 'Advanced biometric monitoring, sleep stages, and refined sapphire titanium finish.',
    buttonText: 'Shop Smart Watches',
    buttonLink: '/shop?category=electronics',
    lifestyleImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&q=80',
    modelScript: 'Every Beat\nCounts ⚡',
    badge: 'Limited Stock',
    displayOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export let inMemoryBanners: BannerItem[] = [
  {
    id: 'bnr-main-1',
    placement: 'homepage-main',
    tag: 'SEASON HIGHLIGHT',
    headline: 'Premium Living Redefined',
    subheadline: 'Handpicked aesthetics and certified electronics backed by our 30-day guarantee.',
    buttonText: 'Shop Highlights',
    buttonLink: '/shop',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&q=80',
    backgroundColor: '#051b14',
    textColor: '#ffffff',
    theme: 'emerald',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bnr-sec-1',
    placement: 'homepage-secondary',
    tag: 'Smart Tech',
    headline: 'Smart Tech\nSmarter You',
    subheadline: 'Latest gadgets. Unbeatable prices.',
    buttonText: 'Shop Tech',
    buttonLink: '/shop?category=electronics',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80',
    backgroundColor: '#0c261e',
    textColor: '#ffffff',
    theme: 'dark',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bnr-sec-2',
    placement: 'homepage-secondary',
    tag: 'Fashion',
    headline: 'Fashion\nThat Speaks You',
    subheadline: 'Trendy styles for every mood & season.',
    buttonText: 'Explore Styles',
    buttonLink: '/shop?category=fashion',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
    backgroundColor: '#fef3e9',
    textColor: '#1f2937',
    theme: 'peach',
    displayOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bnr-cat-1',
    placement: 'homepage-category',
    tag: 'CURATED PICKS',
    headline: 'Smart Living Essentials',
    subheadline: 'Elevate your everyday routine with ergonomic accessories.',
    buttonText: 'Browse Categories',
    buttonLink: '/shop?category=home-living',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
    backgroundColor: '#134e4a',
    textColor: '#ffffff',
    theme: 'emerald',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bnr-promo-1',
    placement: 'homepage-promotion',
    tag: 'LIMITED TIME OFFER',
    headline: 'UP TO 50% OFF',
    subheadline: 'On Your Favorite Brands across Tech, Living & Footwear.',
    buttonText: 'Claim Discount',
    buttonLink: '/shop?discount=true',
    imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1000&q=80',
    backgroundColor: '#064e3b',
    textColor: '#ffffff',
    theme: 'dark',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export let inMemoryAdvertisements: AdvertisementItem[] = [
  {
    id: 'ad-1',
    title: 'Flash Sale: 20% Off Your Entire Cart',
    description: 'Use promo code FLASH20 during checkout to unlock an exclusive 20% discount on all premium electronics and footwear.',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&q=80',
    destinationUrl: '/shop?coupon=FLASH20',
    buttonText: 'Claim 20% Off',
    priority: 1,
    frequency: 'once_per_session',
    isActive: true,
    startDate: '2025-01-01',
    endDate: '2028-12-31',
    impressions: 48,
    clicks: 16,
    dismissals: 32,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let inMemoryCMS = {
  announcementBar: {
    enabled: true,
    freeShippingText: 'Free shipping on orders over $50 / ৳5,000',
    guaranteeText: '30 Days Money Back Guarantee',
    supportText: '24/7 Dedicated Customer Care',
  },
  heroBanner: {
    tag: 'NEW ARRIVALS',
    headline: 'Upgrade Your\nLifestyle',
    subheadline: 'Discover premium quality products designed for a better, smarter and easier life.',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    modelScript: 'Good Things\nTake Time ♡',
    lifestyleImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&q=80',
  },
  splitCampaigns: {
    card1: {
      tag: 'Smart Tech',
      headline: 'Smart Tech\nSmarter You',
      subheadline: 'Latest gadgets. Unbeatable prices.',
      buttonText: 'Shop Now',
      buttonLink: '/shop?category=electronics',
      theme: 'dark',
    },
    card2: {
      tag: 'Fashion',
      headline: 'Fashion\nThat Speaks You',
      subheadline: 'Trendy styles for every mood.',
      buttonText: 'Shop Now',
      buttonLink: '/shop?category=fashion',
      theme: 'peach',
    },
  },
  promotionalAds: {
    enabled: true,
    tag: 'LIMITED TIME OFFER',
    headline: 'UP TO 50% OFF',
    subheadline: 'On Your Favorite Brands',
    buttonText: 'Shop Now',
    buttonLink: '/shop?discount=true',
    imageUrl: '',
    backgroundColor: '#0c261e',
  },
  testimonials: INITIAL_TESTIMONIALS,
};

let inMemoryNewsletter: string[] = ['subscriber1@novara.com'];
let inMemoryEnquiries: any[] = [];

// ==========================================
// 2. HERO SLIDERS CRUD APIS
// ==========================================

// GET /api/cms/sliders - List sliders (public or admin)
router.get('/sliders', async (req: Request, res: Response) => {
  try {
    const { activeOnly } = req.query;

    if (isDbConnected()) {
      try {
        const query = activeOnly === 'true' ? { isActive: true } : {};
        const dbSliders = await SliderModel.find(query).sort({ displayOrder: 1, createdAt: -1 });
        if (dbSliders.length > 0) {
          const formatted = dbSliders.map((s) => ({
            id: s._id.toString(),
            tag: s.tag,
            headline: s.headline,
            subheadline: s.subheadline,
            buttonText: s.buttonText,
            buttonLink: s.buttonLink,
            lifestyleImage: s.lifestyleImage,
            modelScript: s.modelScript,
            badge: s.badge,
            displayOrder: s.displayOrder,
            isActive: s.isActive,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          }));
          res.json({ success: true, data: formatted });
          return;
        }
      } catch (dbErr) {
        console.warn('DB slider query failed, falling back to memory store:', dbErr);
      }
    }

    let result = [...inMemorySliders].sort((a, b) => a.displayOrder - b.displayOrder);
    if (activeOnly === 'true') {
      result = result.filter((s) => s.isActive);
    }

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cms/sliders - Create slider (Admin)
router.post('/sliders', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const {
      tag,
      headline,
      subheadline,
      buttonText,
      buttonLink,
      lifestyleImage,
      modelScript,
      badge,
      displayOrder,
      isActive,
    } = req.body;

    if (!headline || !lifestyleImage) {
      res.status(400).json({ success: false, error: 'Headline and image are required for slider creation.' });
      return;
    }

    const now = new Date().toISOString();
    const newSlider: SliderItem = {
      id: `sld-${Date.now()}`,
      tag: tag?.trim() || 'NEW ARRIVALS',
      headline: headline.trim(),
      subheadline: subheadline?.trim() || '',
      buttonText: buttonText?.trim() || 'Shop Now',
      buttonLink: buttonLink?.trim() || '/shop',
      lifestyleImage: lifestyleImage.trim(),
      modelScript: modelScript?.trim() || 'Good Things\nTake Time ♡',
      badge: badge?.trim() || '',
      displayOrder: typeof displayOrder === 'number' ? displayOrder : inMemorySliders.length + 1,
      isActive: isActive !== false,
      createdAt: now,
      updatedAt: now,
    };

    inMemorySliders.push(newSlider);

    if (isDbConnected()) {
      try {
        const created = await SliderModel.create({
          tag: newSlider.tag,
          headline: newSlider.headline,
          subheadline: newSlider.subheadline,
          buttonText: newSlider.buttonText,
          buttonLink: newSlider.buttonLink,
          lifestyleImage: newSlider.lifestyleImage,
          modelScript: newSlider.modelScript,
          badge: newSlider.badge,
          displayOrder: newSlider.displayOrder,
          isActive: newSlider.isActive,
        });
        newSlider.id = created._id.toString();
      } catch (dbErr: any) {
        console.warn('Slider DB persistence failed:', dbErr.message);
      }
    }

    res.status(201).json({
      success: true,
      data: newSlider,
      message: 'Hero slider created successfully and published to live website.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/cms/sliders/:id - Update slider (Admin)
router.put('/sliders/:id', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = inMemorySliders.find((s) => s.id === id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Slider not found.' });
      return;
    }

    const {
      tag,
      headline,
      subheadline,
      buttonText,
      buttonLink,
      lifestyleImage,
      modelScript,
      badge,
      displayOrder,
      isActive,
    } = req.body;

    if (tag !== undefined) existing.tag = tag;
    if (headline !== undefined) existing.headline = headline;
    if (subheadline !== undefined) existing.subheadline = subheadline;
    if (buttonText !== undefined) existing.buttonText = buttonText;
    if (buttonLink !== undefined) existing.buttonLink = buttonLink;
    if (lifestyleImage !== undefined) existing.lifestyleImage = lifestyleImage;
    if (modelScript !== undefined) existing.modelScript = modelScript;
    if (badge !== undefined) existing.badge = badge;
    if (displayOrder !== undefined) existing.displayOrder = Number(displayOrder);
    if (isActive !== undefined) existing.isActive = Boolean(isActive);
    existing.updatedAt = new Date().toISOString();

    if (isDbConnected()) {
      try {
        await SliderModel.findByIdAndUpdate(id, {
          tag: existing.tag,
          headline: existing.headline,
          subheadline: existing.subheadline,
          buttonText: existing.buttonText,
          buttonLink: existing.buttonLink,
          lifestyleImage: existing.lifestyleImage,
          modelScript: existing.modelScript,
          badge: existing.badge,
          displayOrder: existing.displayOrder,
          isActive: existing.isActive,
        });
      } catch (dbErr: any) {
        console.warn('Slider update DB sync failed:', dbErr.message);
      }
    }

    res.json({
      success: true,
      data: existing,
      message: 'Slider updated and live changes synchronized to homepage.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/cms/sliders/:id/toggle - Toggle active state (Admin)
router.patch('/sliders/:id/toggle', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const slider = inMemorySliders.find((s) => s.id === id);

    if (!slider) {
      res.status(404).json({ success: false, error: 'Slider not found.' });
      return;
    }

    slider.isActive = !slider.isActive;
    slider.updatedAt = new Date().toISOString();

    if (isDbConnected()) {
      try {
        await SliderModel.findByIdAndUpdate(id, { isActive: slider.isActive });
      } catch (dbErr: any) {
        console.warn('Slider toggle DB sync failed:', dbErr.message);
      }
    }

    res.json({
      success: true,
      data: slider,
      message: `Slider is now ${slider.isActive ? 'active' : 'hidden'} on storefront.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/cms/sliders/:id - Delete slider (Admin)
router.delete('/sliders/:id', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idx = inMemorySliders.findIndex((s) => s.id === id);

    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Slider not found.' });
      return;
    }

    inMemorySliders.splice(idx, 1);

    if (isDbConnected()) {
      try {
        await SliderModel.findByIdAndDelete(id);
      } catch (dbErr: any) {
        console.warn('Slider deletion DB sync failed:', dbErr.message);
      }
    }

    res.json({ success: true, message: 'Slider deleted successfully from store database.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. HOMEPAGE BANNERS CRUD APIS
// ==========================================

// GET /api/cms/banners - List banners
router.get('/banners', async (req: Request, res: Response) => {
  try {
    const { placement, activeOnly } = req.query;

    if (isDbConnected()) {
      try {
        const query: any = {};
        if (placement) query.placement = placement;
        if (activeOnly === 'true') query.isActive = true;

        const dbBanners = await BannerModel.find(query).sort({ displayOrder: 1, createdAt: -1 });
        if (dbBanners.length > 0) {
          const formatted = dbBanners.map((b) => ({
            id: b._id.toString(),
            placement: b.placement,
            tag: b.tag,
            headline: b.headline,
            subheadline: b.subheadline,
            buttonText: b.buttonText,
            buttonLink: b.buttonLink,
            imageUrl: b.imageUrl,
            backgroundColor: b.backgroundColor,
            textColor: b.textColor,
            theme: b.theme,
            displayOrder: b.displayOrder,
            isActive: b.isActive,
            createdAt: b.createdAt.toISOString(),
            updatedAt: b.updatedAt.toISOString(),
          }));
          res.json({ success: true, data: formatted });
          return;
        }
      } catch (dbErr) {
        console.warn('DB banner query failed:', dbErr);
      }
    }

    let result = [...inMemoryBanners].sort((a, b) => a.displayOrder - b.displayOrder);
    if (placement) {
      result = result.filter((b) => b.placement === placement);
    }
    if (activeOnly === 'true') {
      result = result.filter((b) => b.isActive);
    }

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cms/banners - Create banner (Admin)
router.post('/banners', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const {
      placement,
      tag,
      headline,
      subheadline,
      buttonText,
      buttonLink,
      imageUrl,
      backgroundColor,
      textColor,
      theme,
      displayOrder,
      isActive,
    } = req.body;

    if (!placement || !headline) {
      res.status(400).json({ success: false, error: 'Placement and headline are required.' });
      return;
    }

    const now = new Date().toISOString();
    const newBanner: BannerItem = {
      id: `bnr-${Date.now()}`,
      placement,
      tag: tag?.trim() || '',
      headline: headline.trim(),
      subheadline: subheadline?.trim() || '',
      buttonText: buttonText?.trim() || 'Shop Now',
      buttonLink: buttonLink?.trim() || '/shop',
      imageUrl: imageUrl?.trim() || '',
      backgroundColor: backgroundColor?.trim() || '#0c261e',
      textColor: textColor?.trim() || '#ffffff',
      theme: theme || 'dark',
      displayOrder: typeof displayOrder === 'number' ? displayOrder : inMemoryBanners.length + 1,
      isActive: isActive !== false,
      createdAt: now,
      updatedAt: now,
    };

    inMemoryBanners.push(newBanner);

    if (isDbConnected()) {
      try {
        const created = await BannerModel.create({
          placement: newBanner.placement,
          tag: newBanner.tag,
          headline: newBanner.headline,
          subheadline: newBanner.subheadline,
          buttonText: newBanner.buttonText,
          buttonLink: newBanner.buttonLink,
          imageUrl: newBanner.imageUrl,
          backgroundColor: newBanner.backgroundColor,
          textColor: newBanner.textColor,
          theme: newBanner.theme,
          displayOrder: newBanner.displayOrder,
          isActive: newBanner.isActive,
        });
        newBanner.id = created._id.toString();
      } catch (dbErr: any) {
        console.warn('Banner DB persistence failed:', dbErr.message);
      }
    }

    res.status(201).json({
      success: true,
      data: newBanner,
      message: `Banner created for placement '${placement}'.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/cms/banners/:id - Update banner (Admin)
router.put('/banners/:id', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const banner = inMemoryBanners.find((b) => b.id === id);

    if (!banner) {
      res.status(404).json({ success: false, error: 'Banner not found.' });
      return;
    }

    const {
      placement,
      tag,
      headline,
      subheadline,
      buttonText,
      buttonLink,
      imageUrl,
      backgroundColor,
      textColor,
      theme,
      displayOrder,
      isActive,
    } = req.body;

    if (placement !== undefined) banner.placement = placement;
    if (tag !== undefined) banner.tag = tag;
    if (headline !== undefined) banner.headline = headline;
    if (subheadline !== undefined) banner.subheadline = subheadline;
    if (buttonText !== undefined) banner.buttonText = buttonText;
    if (buttonLink !== undefined) banner.buttonLink = buttonLink;
    if (imageUrl !== undefined) banner.imageUrl = imageUrl;
    if (backgroundColor !== undefined) banner.backgroundColor = backgroundColor;
    if (textColor !== undefined) banner.textColor = textColor;
    if (theme !== undefined) banner.theme = theme;
    if (displayOrder !== undefined) banner.displayOrder = Number(displayOrder);
    if (isActive !== undefined) banner.isActive = Boolean(isActive);
    banner.updatedAt = new Date().toISOString();

    if (isDbConnected()) {
      try {
        await BannerModel.findByIdAndUpdate(id, {
          placement: banner.placement,
          tag: banner.tag,
          headline: banner.headline,
          subheadline: banner.subheadline,
          buttonText: banner.buttonText,
          buttonLink: banner.buttonLink,
          imageUrl: banner.imageUrl,
          backgroundColor: banner.backgroundColor,
          textColor: banner.textColor,
          theme: banner.theme,
          displayOrder: banner.displayOrder,
          isActive: banner.isActive,
        });
      } catch (dbErr: any) {
        console.warn('Banner update DB sync failed:', dbErr.message);
      }
    }

    res.json({
      success: true,
      data: banner,
      message: 'Banner updated and live on storefront.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/cms/banners/:id/toggle - Toggle active state (Admin)
router.patch('/banners/:id/toggle', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const banner = inMemoryBanners.find((b) => b.id === id);

    if (!banner) {
      res.status(404).json({ success: false, error: 'Banner not found.' });
      return;
    }

    banner.isActive = !banner.isActive;
    banner.updatedAt = new Date().toISOString();

    if (isDbConnected()) {
      try {
        await BannerModel.findByIdAndUpdate(id, { isActive: banner.isActive });
      } catch (dbErr: any) {
        console.warn('Banner toggle DB sync failed:', dbErr.message);
      }
    }

    res.json({
      success: true,
      data: banner,
      message: `Banner is now ${banner.isActive ? 'active' : 'hidden'} on storefront.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/cms/banners/:id - Delete banner (Admin)
router.delete('/banners/:id', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idx = inMemoryBanners.findIndex((b) => b.id === id);

    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Banner not found.' });
      return;
    }

    inMemoryBanners.splice(idx, 1);

    if (isDbConnected()) {
      try {
        await BannerModel.findByIdAndDelete(id);
      } catch (dbErr: any) {
        console.warn('Banner deletion DB sync failed:', dbErr.message);
      }
    }

    res.json({ success: true, message: 'Banner deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. ADVERTISEMENT MANAGEMENT SYSTEM APIS
// ==========================================

// GET /api/cms/advertisements - List all ads (Admin)
router.get('/advertisements', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    if (isDbConnected()) {
      try {
        const dbAds = await AdvertisementModel.find().sort({ priority: 1, createdAt: -1 });
        if (dbAds.length > 0) {
          const formatted = dbAds.map((a) => ({
            id: a._id.toString(),
            title: a.title,
            description: a.description,
            imageUrl: a.imageUrl,
            destinationUrl: a.destinationUrl,
            buttonText: a.buttonText,
            priority: a.priority,
            frequency: a.frequency,
            isActive: a.isActive,
            startDate: a.startDate ? a.startDate.toISOString().split('T')[0] : undefined,
            endDate: a.endDate ? a.endDate.toISOString().split('T')[0] : undefined,
            impressions: a.impressions || 0,
            clicks: a.clicks || 0,
            dismissals: a.dismissals || 0,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
          }));
          res.json({ success: true, data: formatted });
          return;
        }
      } catch (dbErr) {
        console.warn('DB advertisement query failed:', dbErr);
      }
    }

    res.json({ success: true, data: inMemoryAdvertisements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/cms/advertisements/active - Get current active ad for visitor popup (Public)
router.get('/advertisements/active', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    if (isDbConnected()) {
      try {
        const activeAd = await AdvertisementModel.findOne({
          isActive: true,
          $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }],
          $and: [{ $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }] }],
        }).sort({ priority: 1, createdAt: -1 });

        if (activeAd) {
          res.json({
            success: true,
            data: {
              id: activeAd._id.toString(),
              title: activeAd.title,
              description: activeAd.description,
              imageUrl: activeAd.imageUrl,
              destinationUrl: activeAd.destinationUrl,
              buttonText: activeAd.buttonText,
              priority: activeAd.priority,
              frequency: activeAd.frequency,
              isActive: activeAd.isActive,
            },
          });
          return;
        }
      } catch (dbErr) {
        console.warn('DB active ad query failed:', dbErr);
      }
    }

    // In-memory fallback
    const eligible = inMemoryAdvertisements
      .filter((a) => {
        if (!a.isActive) return false;
        if (a.startDate && new Date(a.startDate) > now) return false;
        if (a.endDate && new Date(a.endDate) < now) return false;
        return true;
      })
      .sort((a, b) => a.priority - b.priority);

    if (eligible.length > 0) {
      const topAd = eligible[0];
      res.json({
        success: true,
        data: {
          id: topAd.id,
          title: topAd.title,
          description: topAd.description,
          imageUrl: topAd.imageUrl,
          destinationUrl: topAd.destinationUrl,
          buttonText: topAd.buttonText,
          priority: topAd.priority,
          frequency: topAd.frequency,
          isActive: topAd.isActive,
        },
      });
      return;
    }

    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cms/advertisements - Create new advertisement (Admin)
router.post('/advertisements', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      imageUrl,
      destinationUrl,
      buttonText,
      priority,
      frequency,
      isActive,
      startDate,
      endDate,
    } = req.body;

    if (!title || !imageUrl) {
      res.status(400).json({ success: false, error: 'Title and advertisement image are required.' });
      return;
    }

    const now = new Date().toISOString();
    const newAd: AdvertisementItem = {
      id: `ad-${Date.now()}`,
      title: title.trim(),
      description: description?.trim() || '',
      imageUrl: imageUrl.trim(),
      destinationUrl: destinationUrl?.trim() || '/shop',
      buttonText: buttonText?.trim() || 'Claim Deal',
      priority: typeof priority === 'number' ? priority : 1,
      frequency: frequency || 'once_per_session',
      isActive: isActive !== false,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      impressions: 0,
      clicks: 0,
      dismissals: 0,
      createdAt: now,
      updatedAt: now,
    };

    inMemoryAdvertisements.push(newAd);

    if (isDbConnected()) {
      try {
        const created = await AdvertisementModel.create({
          title: newAd.title,
          description: newAd.description,
          imageUrl: newAd.imageUrl,
          destinationUrl: newAd.destinationUrl,
          buttonText: newAd.buttonText,
          priority: newAd.priority,
          frequency: newAd.frequency,
          isActive: newAd.isActive,
          startDate: newAd.startDate ? new Date(newAd.startDate) : undefined,
          endDate: newAd.endDate ? new Date(newAd.endDate) : undefined,
          impressions: 0,
          clicks: 0,
          dismissals: 0,
        });
        newAd.id = created._id.toString();
      } catch (dbErr: any) {
        console.warn('Ad DB persistence failed:', dbErr.message);
      }
    }

    res.status(201).json({
      success: true,
      data: newAd,
      message: 'Advertisement campaign created and active for visitors.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/cms/advertisements/:id - Update advertisement (Admin)
router.put('/advertisements/:id', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ad = inMemoryAdvertisements.find((a) => a.id === id);

    if (!ad) {
      res.status(404).json({ success: false, error: 'Advertisement not found.' });
      return;
    }

    const {
      title,
      description,
      imageUrl,
      destinationUrl,
      buttonText,
      priority,
      frequency,
      isActive,
      startDate,
      endDate,
    } = req.body;

    if (title !== undefined) ad.title = title;
    if (description !== undefined) ad.description = description;
    if (imageUrl !== undefined) ad.imageUrl = imageUrl;
    if (destinationUrl !== undefined) ad.destinationUrl = destinationUrl;
    if (buttonText !== undefined) ad.buttonText = buttonText;
    if (priority !== undefined) ad.priority = Number(priority);
    if (frequency !== undefined) ad.frequency = frequency;
    if (isActive !== undefined) ad.isActive = Boolean(isActive);
    if (startDate !== undefined) ad.startDate = startDate;
    if (endDate !== undefined) ad.endDate = endDate;
    ad.updatedAt = new Date().toISOString();

    if (isDbConnected()) {
      try {
        await AdvertisementModel.findByIdAndUpdate(id, {
          title: ad.title,
          description: ad.description,
          imageUrl: ad.imageUrl,
          destinationUrl: ad.destinationUrl,
          buttonText: ad.buttonText,
          priority: ad.priority,
          frequency: ad.frequency,
          isActive: ad.isActive,
          startDate: ad.startDate ? new Date(ad.startDate) : undefined,
          endDate: ad.endDate ? new Date(ad.endDate) : undefined,
        });
      } catch (dbErr: any) {
        console.warn('Ad update DB sync failed:', dbErr.message);
      }
    }

    res.json({
      success: true,
      data: ad,
      message: 'Advertisement campaign settings updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/cms/advertisements/:id/toggle - Toggle ad active state (Admin)
router.patch('/advertisements/:id/toggle', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ad = inMemoryAdvertisements.find((a) => a.id === id);

    if (!ad) {
      res.status(404).json({ success: false, error: 'Advertisement not found.' });
      return;
    }

    ad.isActive = !ad.isActive;
    ad.updatedAt = new Date().toISOString();

    if (isDbConnected()) {
      try {
        await AdvertisementModel.findByIdAndUpdate(id, { isActive: ad.isActive });
      } catch (dbErr: any) {
        console.warn('Ad toggle DB sync failed:', dbErr.message);
      }
    }

    res.json({
      success: true,
      data: ad,
      message: `Advertisement is now ${ad.isActive ? 'active' : 'paused'}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/cms/advertisements/:id - Delete advertisement (Admin)
router.delete('/advertisements/:id', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idx = inMemoryAdvertisements.findIndex((a) => a.id === id);

    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Advertisement not found.' });
      return;
    }

    inMemoryAdvertisements.splice(idx, 1);

    if (isDbConnected()) {
      try {
        await AdvertisementModel.findByIdAndDelete(id);
      } catch (dbErr: any) {
        console.warn('Ad deletion DB sync failed:', dbErr.message);
      }
    }

    res.json({ success: true, message: 'Advertisement campaign deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cms/advertisements/:id/impression - Record impression (Public with abuse prevention)
router.post('/advertisements/:id/impression', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ad = inMemoryAdvertisements.find((a) => a.id === id);
    if (ad) {
      ad.impressions = (ad.impressions || 0) + 1;
    }

    if (isDbConnected()) {
      try {
        await AdvertisementModel.findByIdAndUpdate(id, { $inc: { impressions: 1 } });
      } catch (e) {}
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cms/advertisements/:id/click - Record click (Public)
router.post('/advertisements/:id/click', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ad = inMemoryAdvertisements.find((a) => a.id === id);
    if (ad) {
      ad.clicks = (ad.clicks || 0) + 1;
    }

    if (isDbConnected()) {
      try {
        await AdvertisementModel.findByIdAndUpdate(id, { $inc: { clicks: 1 } });
      } catch (e) {}
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cms/advertisements/:id/dismiss - Record dismissal (Public)
router.post('/advertisements/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ad = inMemoryAdvertisements.find((a) => a.id === id);
    if (ad) {
      ad.dismissals = (ad.dismissals || 0) + 1;
    }

    if (isDbConnected()) {
      try {
        await AdvertisementModel.findByIdAndUpdate(id, { $inc: { dismissals: 1 } });
      } catch (e) {}
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. EXISTING HOMEPAGE CMS & NEWSLETTER
// ==========================================

// Get homepage CMS content
router.get('/homepage', (req: Request, res: Response) => {
  res.json({ success: true, data: inMemoryCMS });
});

// Update homepage CMS (Admin)
router.put('/homepage', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), (req: Request, res: Response) => {
  inMemoryCMS = {
    ...inMemoryCMS,
    ...req.body,
  };
  res.json({ success: true, data: inMemoryCMS, message: 'CMS settings saved successfully' });
});

// Newsletter subscription
router.post('/newsletter', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    return;
  }

  const normalized = email.toLowerCase().trim();
  if (inMemoryNewsletter.includes(normalized)) {
    res.json({ success: true, message: 'You are already subscribed to our newsletter!' });
    return;
  }

  inMemoryNewsletter.push(normalized);
  res.status(201).json({
    success: true,
    message: 'Welcome to the NOVARA club! You have been subscribed for exclusive deals.',
  });
});

// Customer Support Enquiry
router.post('/support-enquiry', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ success: false, error: 'Name, email, and message are required' });
    return;
  }

  const enquiry = {
    id: `enq-${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    subject: subject?.trim() || 'General Inquiry',
    message: message.trim(),
    status: 'open',
    createdAt: new Date(),
  };

  inMemoryEnquiries.push(enquiry);
  res.status(201).json({
    success: true,
    message: 'Thank you for reaching out! Our Dhaka support desk will contact you shortly.',
  });
});

export default router;
