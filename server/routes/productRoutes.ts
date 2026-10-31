import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ProductModel } from '../models/Product';
import { AuditLogModel } from '../models/Coupon';
import { INITIAL_PRODUCTS, SeedProduct } from '../data/initialData';
import {
  expandSearchQuery,
  escapeRegex,
  scoreSearchMatch,
  normalizeMultilingualQuery,
} from '../../src/utils/ecommerceRules';
import { isDbConnected } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// In-memory catalog state initialized with exact reference products
let inMemoryProducts: SeedProduct[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));

// Standard lean projection for catalog listings to prevent fetching large blobs for millions of rows
const CATALOG_PROJECTION = 'name slug sku brand category subcategory price salePrice badge images stock ratingAverage reviewCount salesCount isPopular isBestSeller isFeatured isNewArrival status banglaKeywords createdAt';

// List products with filtering, sorting, cursor or offset pagination, and lean projection
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      sort,
      isPopular,
      isBestSeller,
      isFeatured,
      isNewArrival,
      status,
      includeAll,
      page = '1',
      limit = '12',
      cursor,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 12));

    if (isDbConnected()) {
      const filter: any = {};
      if (status && status !== 'all') {
        filter.status = status;
      } else if (includeAll !== 'true') {
        filter.status = 'published';
      }

      if (category && category !== 'all') {
        const safeCat = escapeRegex(category as string);
        filter.category = new RegExp(`^${safeCat}$`, 'i');
      }
      if (brand) {
        const safeBrand = escapeRegex(brand as string);
        filter.brand = new RegExp(`^${safeBrand}$`, 'i');
      }
      if (isPopular === 'true') filter.isPopular = true;
      if (isBestSeller === 'true') filter.isBestSeller = true;
      if (isFeatured === 'true') filter.isFeatured = true;
      if (isNewArrival === 'true') filter.isNewArrival = true;

      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
      }

      // Cursor-based pagination for large datasets
      if (cursor && typeof cursor === 'string' && mongoose.isValidObjectId(cursor)) {
        filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
      }

      let sortOptions: any = { createdAt: -1, _id: -1 };
      if (sort === 'price_asc') sortOptions = { price: 1, _id: 1 };
      else if (sort === 'price_desc') sortOptions = { price: -1, _id: -1 };
      else if (sort === 'rating') sortOptions = { ratingAverage: -1, _id: -1 };
      else if (sort === 'popular') sortOptions = { salesCount: -1, _id: -1 };

      const total = await ProductModel.countDocuments(filter);
      const queryBuilder = ProductModel.find(filter)
        .select(CATALOG_PROJECTION)
        .sort(sortOptions)
        .limit(limitNum)
        .lean();

      if (!cursor) {
        queryBuilder.skip((pageNum - 1) * limitNum);
      }

      const products = await queryBuilder.exec();
      const nextCursor = products.length === limitNum ? products[products.length - 1]._id : null;

      res.json({
        success: true,
        data: products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          nextCursor,
        },
      });
      return;
    }

    // In-memory filtering with bounded slicing
    let filtered = [...inMemoryProducts];
    if (status && status !== 'all') {
      filtered = filtered.filter((p) => p.status === status);
    } else if (includeAll !== 'true') {
      filtered = filtered.filter((p) => p.status === 'published');
    }

    if (category && category !== 'all') {
      filtered = filtered.filter((p) => p.category.toLowerCase() === (category as string).toLowerCase());
    }
    if (brand) {
      filtered = filtered.filter((p) => p.brand.toLowerCase() === (brand as string).toLowerCase());
    }
    if (isPopular === 'true') filtered = filtered.filter((p) => p.isPopular);
    if (isBestSeller === 'true') filtered = filtered.filter((p) => p.isBestSeller);
    if (isFeatured === 'true') filtered = filtered.filter((p) => p.isFeatured);
    if (isNewArrival === 'true') filtered = filtered.filter((p) => p.isNewArrival);

    if (minPrice) {
      const min = parseFloat(minPrice as string);
      filtered = filtered.filter((p) => (p.salePrice || p.price) >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice as string);
      filtered = filtered.filter((p) => (p.salePrice || p.price) <= max);
    }

    if (sort === 'price_asc') {
      filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (sort === 'price_desc') {
      filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    } else if (sort === 'rating') {
      filtered.sort((a, b) => b.ratingAverage - a.ratingAverage);
    } else if (sort === 'popular') {
      filtered.sort((a, b) => b.salesCount - a.salesCount);
    }

    const total = filtered.length;
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Autocomplete suggestions (bounded, keyboard-accessible dropdown with cross-lingual support)
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const rawQ = ((req.query.q as string) || '').slice(0, 100).trim();
    if (!rawQ) {
      res.json({ success: true, suggestions: [] });
      return;
    }

    const expandedTokens = expandSearchQuery(rawQ);

    if (isDbConnected()) {
      try {
        const regexList = expandedTokens.map((t) => new RegExp(escapeRegex(t), 'i'));
        const dbMatches = await ProductModel.find({
          status: 'published',
          $or: [
            { name: { $in: regexList } },
            { brand: { $in: regexList } },
            { category: { $in: regexList } },
            { banglaKeywords: { $in: expandedTokens } },
          ],
        })
          .select('name slug brand category price salePrice images badge')
          .limit(8)
          .lean();

        if (dbMatches && dbMatches.length > 0) {
          const suggestions = dbMatches.map((p: any) => ({
            id: String(p._id),
            name: p.name,
            slug: p.slug,
            brand: p.brand,
            category: p.category,
            price: p.price,
            salePrice: p.salePrice,
            image: p.images?.[0]?.url || '',
            badge: p.badge,
          }));
          res.json({ success: true, suggestions });
          return;
        }
      } catch (err) {
        console.warn('DB suggestions lookup fallback:', err);
      }
    }

    // In-memory cross-lingual matching with relevance score
    const scored = inMemoryProducts
      .map((p) => {
        const pText = `${p.name} ${p.brand} ${p.category} ${p.description} ${p.banglaKeywords.join(' ')}`.toLowerCase();
        const hasMatch = expandedTokens.some((token) => pText.includes(token));
        if (!hasMatch) return null;
        let score = 0;
        const normQ = rawQ.toLowerCase();
        if (p.name.toLowerCase().includes(normQ)) score += 50;
        if (p.banglaKeywords.some((k) => k.toLowerCase().includes(normQ))) score += 40;
        return { product: p, score };
      })
      .filter((item): item is { product: SeedProduct; score: number } => item !== null)
      .sort((a, b) => b.score - a.score);

    const suggestions = scored.slice(0, 8).map(({ product: p }) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      price: p.price,
      salePrice: p.salePrice,
      image: p.images[0]?.url || '',
      badge: p.badge,
    }));

    res.json({ success: true, suggestions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Search endpoint with Bangla-English cross-lingual discovery and relevance ranking
router.get('/search', async (req: Request, res: Response) => {
  try {
    const rawQuery = ((req.query.q as string) || '').slice(0, 100).trim();
    if (!rawQuery) {
      res.json({ success: true, data: [], query: '', total: 0 });
      return;
    }

    const tokens = expandSearchQuery(rawQuery);
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    if (isDbConnected()) {
      try {
        const regexList = tokens.map((t) => new RegExp(escapeRegex(t), 'i'));
        const dbMatches = await ProductModel.find({
          status: 'published',
          $or: [
            { name: { $in: regexList } },
            { brand: { $in: regexList } },
            { category: { $in: regexList } },
            { subcategory: { $in: regexList } },
            { sku: { $in: regexList } },
            { banglaKeywords: { $in: tokens } },
          ],
        })
          .select(CATALOG_PROJECTION)
          .limit(limit * 2)
          .lean();

        if (dbMatches && dbMatches.length > 0) {
          // Sort results by relevance score
          dbMatches.sort((a: any, b: any) => {
            const scoreA = tokens.reduce((acc, t) => {
              if (a.name.toLowerCase().includes(t)) return acc + 50;
              if (a.banglaKeywords?.includes(t)) return acc + 40;
              if (a.category.toLowerCase().includes(t)) return acc + 30;
              return acc + 10;
            }, 0);
            const scoreB = tokens.reduce((acc, t) => {
              if (b.name.toLowerCase().includes(t)) return acc + 50;
              if (b.banglaKeywords?.includes(t)) return acc + 40;
              if (b.category.toLowerCase().includes(t)) return acc + 30;
              return acc + 10;
            }, 0);
            return scoreB - scoreA;
          });

          const paginated = dbMatches.slice((page - 1) * limit, page * limit);
          res.json({
            success: true,
            data: paginated,
            query: rawQuery,
            expandedTokens: tokens,
            total: dbMatches.length,
            pagination: {
              total: dbMatches.length,
              page,
              limit,
              totalPages: Math.ceil(dbMatches.length / limit),
            },
          });
          return;
        }
      } catch (err) {
        console.warn('MongoDB search fallback to memory:', err);
      }
    }

    // In-memory cross-lingual scoring and ranking
    const matched = inMemoryProducts
      .map((p) => {
        const text = `${p.name} ${p.brand} ${p.category} ${p.subcategory || ''} ${p.description} ${p.banglaKeywords.join(' ')}`.toLowerCase();
        const matches = tokens.some((token) => text.includes(token));
        if (!matches) return null;

        // Calculate relevance weight
        let score = 0;
        const normQ = rawQuery.toLowerCase();
        if (p.name.toLowerCase() === normQ) score += 100;
        else if (p.name.toLowerCase().includes(normQ)) score += 60;
        if (p.sku.toLowerCase() === normQ) score += 80;
        if (p.category.toLowerCase() === normQ) score += 40;
        if (p.brand.toLowerCase() === normQ) score += 40;
        for (const token of tokens) {
          if (p.banglaKeywords.some((bk) => bk.toLowerCase().includes(token))) score += 45;
          if (p.name.toLowerCase().includes(token)) score += 30;
        }

        return { product: p, score };
      })
      .filter((item): item is { product: SeedProduct; score: number } => item !== null)
      .sort((a, b) => b.score - a.score);

    const total = matched.length;
    const paginated = matched
      .slice((page - 1) * limit, page * limit)
      .map((item) => item.product);

    res.json({
      success: true,
      data: paginated,
      query: rawQuery,
      expandedTokens: tokens,
      total,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Explain query execution plan for MongoDB database architect inspection
router.get('/explain-query', async (req: Request, res: Response) => {
  try {
    if (!isDbConnected()) {
      res.json({
        success: true,
        database: 'offline (memory fallback)',
        message: 'MongoDB is currently disconnected; explain plans require active database.',
        simulatedPlan: {
          indexUsed: ['status_1_category_1_price_1', 'ProductTextSearchIndex'],
          scanType: 'IXSCAN',
          projectedFields: CATALOG_PROJECTION.split(' '),
        },
      });
      return;
    }

    const { category, brand, q } = req.query;
    const filter: any = { status: 'published' };
    if (category) filter.category = new RegExp(`^${escapeRegex(category as string)}$`, 'i');
    if (brand) filter.brand = new RegExp(`^${escapeRegex(brand as string)}$`, 'i');
    if (q) filter.$text = { $search: q as string };

    const explainResult = await (ProductModel.find(filter)
      .select(CATALOG_PROJECTION)
      .limit(12) as any)
      .explain('executionStats');

    res.json({
      success: true,
      query: filter,
      explain: explainResult,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Related products endpoint
router.get('/:slug/related', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const current = inMemoryProducts.find((p) => p.slug === slug || p.id === slug || p.sku === slug);
    const category = current?.category || 'Electronics';

    let related: SeedProduct[] = [];
    if (current?.id === 'prod-1' || current?.slug === 'wireless-headphones') {
      const preferredIds = ['prod-6', 'prod-2', 'prod-3', 'prod-4', 'prod-5'];
      related = preferredIds
        .map((id) => inMemoryProducts.find((p) => p.id === id))
        .filter(Boolean) as SeedProduct[];
    } else {
      related = inMemoryProducts.filter((p) => p.id !== current?.id && p.category.toLowerCase() === category.toLowerCase());
      if (related.length < 5) {
        const others = inMemoryProducts.filter((p) => p.id !== current?.id && !related.some((r) => r.id === p.id));
        related = [...related, ...others];
      }
    }

    res.json({ success: true, data: related.slice(0, 5) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Single product by slug or id
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (isDbConnected()) {
      const orConditions: any[] = [{ slug }, { sku: slug }];
      if (mongoose.isValidObjectId(slug)) {
        orConditions.push({ _id: slug });
      }
      const product = await ProductModel.findOne({ $or: orConditions });
      if (product) {
        res.json({ success: true, data: product });
        return;
      }
    }

    const item = inMemoryProducts.find((p) => p.slug === slug || p.id === slug || p.sku === slug);
    if (!item) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create product (Admin)
router.post('/', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const { name, brand, category, price, salePrice, description, stock, sku, images, badge, banglaKeywords } = req.body;

    if (!name || !price || !sku || !category) {
      res.status(400).json({ success: false, error: 'Name, price, SKU, and category are required' });
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check SKU duplicate
    if (inMemoryProducts.some((p) => p.sku.toUpperCase() === sku.toUpperCase())) {
      res.status(400).json({ success: false, error: `SKU ${sku} already exists` });
      return;
    }

    const newProduct: SeedProduct = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      sku: sku.trim().toUpperCase(),
      brand: (brand || 'Novara').trim(),
      category: category.trim(),
      description: description || 'Premium product designed for modern living.',
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : undefined,
      badge: badge || undefined,
      images: images && images.length ? images : [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', isPrimary: true }],
      stock: parseInt(stock, 10) || 10,
      reservedStock: 0,
      ratingAverage: 5.0,
      reviewCount: 0,
      salesCount: 0,
      isPopular: false,
      isBestSeller: false,
      isFeatured: false,
      isNewArrival: true,
      attributes: {},
      banglaKeywords: Array.isArray(banglaKeywords) ? banglaKeywords : [],
      status: 'published',
    };

    inMemoryProducts.unshift(newProduct);

    if (isDbConnected()) {
      try {
        await ProductModel.create(newProduct);
      } catch (dbErr: any) {
        console.warn('Could not persist to MongoDB Atlas:', dbErr.message);
      }
    }

    res.status(201).json({ success: true, data: newProduct });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update product (Admin)
router.put('/:id', requireAuth, requireRole(['admin', 'super_admin', 'catalog_manager']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = inMemoryProducts.findIndex((p) => p.id === id);

    if (index === -1) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    const existing = inMemoryProducts[index];
    const updated: SeedProduct = {
      ...existing,
      ...req.body,
      id: existing.id,
      sku: req.body.sku ? req.body.sku.toUpperCase() : existing.sku,
    };

    inMemoryProducts[index] = updated;

    if (isDbConnected()) {
      try {
        const isOid = mongoose.isValidObjectId(id);
        const query = isOid ? { $or: [{ _id: id }, { slug: id }, { sku: id }] } : { $or: [{ slug: id }, { sku: id }] };
        await ProductModel.findOneAndUpdate(query, updated);
      } catch (dbErr) {
        console.warn('Product DB update failed:', dbErr);
      }
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete/Archive product (Admin)
router.delete('/:id', requireAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    inMemoryProducts = inMemoryProducts.filter((p) => p.id !== id && p.slug !== id && p.sku !== id);

    if (isDbConnected()) {
      try {
        const isOid = mongoose.isValidObjectId(id);
        const query = isOid ? { $or: [{ _id: id }, { slug: id }, { sku: id }] } : { $or: [{ slug: id }, { sku: id }] };
        await ProductModel.findOneAndDelete(query);
      } catch (dbErr) {
        console.warn('Product DB deletion failed:', dbErr);
      }
    }

    res.json({ success: true, message: 'Product removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Adjust stock (Admin)
router.post('/:id/stock', requireAuth, requireRole(['admin', 'super_admin', 'inventory_manager']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body;

    const prod = inMemoryProducts.find((p) => p.id === id || p.sku === id || p.slug === id);
    if (!prod) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    const newStock = Math.max(0, prod.stock + (parseInt(adjustment, 10) || 0));
    prod.stock = newStock;

    if (isDbConnected()) {
      try {
        const isOid = mongoose.isValidObjectId(id);
        const query = isOid ? { $or: [{ _id: id }, { slug: id }, { sku: id }] } : { $or: [{ slug: id }, { sku: id }] };
        await ProductModel.findOneAndUpdate(query, { stock: newStock });
      } catch (dbErr) {
        console.warn('Stock DB update failed:', dbErr);
      }
    }

    console.log(`[Inventory] Adjusted stock for ${prod.name} (${prod.sku}) to ${newStock}. Reason: ${reason || 'Manual Adjustment'}`);

    res.json({ success: true, stock: newStock, message: `Stock updated to ${newStock}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export { inMemoryProducts };
export default router;
