import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { isDbConnected } from '../db';
import { HomepageConfigModel, IHomepageSection } from '../models/HomepageConfig';
import { inMemoryBanners, inMemorySliders } from './cmsRoutes';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/initialData';
import {
  getDefaultHomepageSections,
  reindexSections,
  duplicateSection,
  HomepageSectionConfig,
} from '../../src/utils/homepageBuilderRules';

const router = Router();

// ==========================================
// In-Memory Fallback Store
// ==========================================
let inMemoryDraftSections: HomepageSectionConfig[] = getDefaultHomepageSections();
let inMemoryPublishedSections: HomepageSectionConfig[] = getDefaultHomepageSections();
let inMemoryIsDraftModified = false;
let inMemoryLastPublishedAt: string = new Date().toISOString();

// Sync from DB if available on boot
async function initFromDb() {
  if (!isDbConnected()) return;
  try {
    let doc = await HomepageConfigModel.findOne();
    if (!doc) {
      doc = await HomepageConfigModel.create({
        draftSections: inMemoryDraftSections,
        publishedSections: inMemoryPublishedSections,
        isDraftModified: false,
        lastPublishedAt: new Date(),
        version: 1,
      });
    } else {
      inMemoryDraftSections = (doc.draftSections as any) || getDefaultHomepageSections();
      inMemoryPublishedSections = (doc.publishedSections as any) || getDefaultHomepageSections();
      inMemoryIsDraftModified = doc.isDraftModified || false;
      inMemoryLastPublishedAt = doc.lastPublishedAt ? doc.lastPublishedAt.toISOString() : new Date().toISOString();
    }
  } catch (err) {
    console.error('Error initializing HomepageConfig from DB:', err);
  }
}

// Fire async initialization
initFromDb();

// Persist helper
async function persistState() {
  if (!isDbConnected()) return;
  try {
    let doc = await HomepageConfigModel.findOne();
    if (!doc) {
      await HomepageConfigModel.create({
        draftSections: inMemoryDraftSections,
        publishedSections: inMemoryPublishedSections,
        isDraftModified: inMemoryIsDraftModified,
        lastPublishedAt: new Date(inMemoryLastPublishedAt),
        version: 1,
      });
    } else {
      doc.draftSections = inMemoryDraftSections as any;
      doc.publishedSections = inMemoryPublishedSections as any;
      doc.isDraftModified = inMemoryIsDraftModified;
      doc.lastPublishedAt = new Date(inMemoryLastPublishedAt);
      doc.version = (doc.version || 1) + 1;
      await doc.save();
    }
  } catch (err) {
    console.error('Error persisting HomepageConfig:', err);
  }
}

// ==========================================
// 1. PUBLIC STOREFRONT HOMEPAGE CONFIG
// ==========================================
// GET /api/homepage/config?preview=draft
router.get('/config', (req: Request, res: Response) => {
  const isPreview = req.query.preview === 'draft' || req.query.preview === 'true';
  const rawSections = isPreview ? inMemoryDraftSections : inMemoryPublishedSections;

  // Filter only enabled sections for public view (preview shows disabled as well or highlights them)
  const sections = (rawSections || [])
    .filter((sec) => (isPreview ? true : sec.isEnabled))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Return resolved banners map so client can render interleaved banners instantly
  const bannersMap: Record<string, any> = {};
  for (const bnr of inMemoryBanners) {
    bannersMap[bnr.id] = bnr;
  }

  res.json({
    success: true,
    data: {
      sections,
      banners: inMemoryBanners.filter((b) => b.isActive),
      bannersMap,
      sliders: inMemorySliders.filter((s) => s.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
      categories: INITIAL_CATEGORIES,
      isPreview,
      lastPublishedAt: inMemoryLastPublishedAt,
    },
  });
});

// ==========================================
// 2. ADMIN BUILDER ENDPOINTS
// ==========================================
const adminAuth = [requireAuth, requireRole(['admin', 'super_admin'])];

// GET /api/admin/homepage/builder
router.get('/builder', ...adminAuth, (req: Request, res: Response) => {
  const bannersMap: Record<string, any> = {};
  for (const bnr of inMemoryBanners) {
    bannersMap[bnr.id] = bnr;
  }

  res.json({
    success: true,
    data: {
      draftSections: inMemoryDraftSections,
      publishedSections: inMemoryPublishedSections,
      isDraftModified: inMemoryIsDraftModified,
      lastPublishedAt: inMemoryLastPublishedAt,
      banners: inMemoryBanners,
      bannersMap,
      sliders: inMemorySliders,
      categories: INITIAL_CATEGORIES,
      productsSummary: INITIAL_PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        category: p.category,
        image: p.images?.[0] || '',
        isPopular: p.isPopular,
        isBestSeller: p.isBestSeller,
      })),
    },
  });
});

// PUT /api/admin/homepage/builder/draft - Update entire draft sections list & order
router.put('/builder/draft', ...adminAuth, async (req: Request, res: Response) => {
  const { sections } = req.body;
  if (!Array.isArray(sections)) {
    return res.status(400).json({ success: false, message: 'Sections array is required' });
  }

  inMemoryDraftSections = reindexSections(sections);
  inMemoryIsDraftModified = true;
  await persistState();

  res.json({
    success: true,
    message: 'Homepage draft updated successfully',
    data: {
      draftSections: inMemoryDraftSections,
      isDraftModified: inMemoryIsDraftModified,
    },
  });
});

// POST /api/admin/homepage/builder/publish - Promote draft to published atomically
router.post('/builder/publish', ...adminAuth, async (req: Request, res: Response) => {
  inMemoryPublishedSections = JSON.parse(JSON.stringify(inMemoryDraftSections));
  inMemoryIsDraftModified = false;
  inMemoryLastPublishedAt = new Date().toISOString();
  await persistState();

  res.json({
    success: true,
    message: 'Homepage published live successfully!',
    data: {
      publishedSections: inMemoryPublishedSections,
      draftSections: inMemoryDraftSections,
      isDraftModified: inMemoryIsDraftModified,
      lastPublishedAt: inMemoryLastPublishedAt,
    },
  });
});

// POST /api/admin/homepage/builder/reset - Reset draft back to factory default
router.post('/builder/reset', ...adminAuth, async (req: Request, res: Response) => {
  inMemoryDraftSections = getDefaultHomepageSections();
  inMemoryIsDraftModified = true;
  await persistState();

  res.json({
    success: true,
    message: 'Draft reset to default homepage layout',
    data: {
      draftSections: inMemoryDraftSections,
      isDraftModified: inMemoryIsDraftModified,
    },
  });
});

// POST /api/admin/homepage/builder/sections - Add new section
router.post('/builder/sections', ...adminAuth, async (req: Request, res: Response) => {
  const { sectionType, title, subtitle, settings, isEnabled = true } = req.body;

  if (!sectionType || !title) {
    return res.status(400).json({ success: false, message: 'sectionType and title are required' });
  }

  const newSection: HomepageSectionConfig = {
    id: `sec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    sectionType,
    title,
    subtitle: subtitle || '',
    displayOrder: inMemoryDraftSections.length + 1,
    isEnabled,
    settings: {
      productSource: settings?.productSource || 'featured',
      categorySlug: settings?.categorySlug || '',
      productIds: settings?.productIds || [],
      productLimit: settings?.productLimit !== undefined ? settings?.productLimit : 8,
      desktopColumns: settings?.desktopColumns || 4,
      mobileColumns: settings?.mobileColumns || 2,
      bannerPlacements: settings?.bannerPlacements || [],
      bannerId: settings?.bannerId || '',
      bannerIds: settings?.bannerIds || [],
      backgroundColor: settings?.backgroundColor || '',
      viewAllLink: settings?.viewAllLink || '/shop',
      viewAllText: settings?.viewAllText || 'View All',
    },
  };

  inMemoryDraftSections.push(newSection);
  inMemoryDraftSections = reindexSections(inMemoryDraftSections);
  inMemoryIsDraftModified = true;
  await persistState();

  res.status(201).json({
    success: true,
    message: 'Section created in draft',
    data: newSection,
  });
});

// PUT /api/admin/homepage/builder/sections/:id - Update existing section
router.put('/builder/sections/:id', ...adminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const index = inMemoryDraftSections.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Section not found in draft' });
  }

  const current = inMemoryDraftSections[index];
  const { title, subtitle, isEnabled, settings, sectionType } = req.body;

  inMemoryDraftSections[index] = {
    ...current,
    sectionType: sectionType || current.sectionType,
    title: title !== undefined ? title : current.title,
    subtitle: subtitle !== undefined ? subtitle : current.subtitle,
    isEnabled: isEnabled !== undefined ? isEnabled : current.isEnabled,
    settings: {
      ...current.settings,
      ...(settings || {}),
    },
  };

  inMemoryIsDraftModified = true;
  await persistState();

  res.json({
    success: true,
    message: 'Section updated in draft',
    data: inMemoryDraftSections[index],
  });
});

// DELETE /api/admin/homepage/builder/sections/:id - Delete section
router.delete('/builder/sections/:id', ...adminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = inMemoryDraftSections.length;
  inMemoryDraftSections = inMemoryDraftSections.filter((s) => s.id !== id);

  if (inMemoryDraftSections.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Section not found' });
  }

  inMemoryDraftSections = reindexSections(inMemoryDraftSections);
  inMemoryIsDraftModified = true;
  await persistState();

  res.json({
    success: true,
    message: 'Section deleted from draft',
    data: { id },
  });
});

// POST /api/admin/homepage/builder/sections/:id/duplicate - Duplicate section
router.post('/builder/sections/:id/duplicate', ...adminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const duplicated = duplicateSection(inMemoryDraftSections, id);

  if (duplicated.length === inMemoryDraftSections.length) {
    return res.status(404).json({ success: false, message: 'Section not found' });
  }

  inMemoryDraftSections = duplicated;
  inMemoryIsDraftModified = true;
  await persistState();

  res.json({
    success: true,
    message: 'Section duplicated in draft',
    data: { draftSections: inMemoryDraftSections },
  });
});

export default router;
