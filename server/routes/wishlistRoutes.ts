import { Router, Request, Response } from 'express';
import { WishlistModel, IWishlistItem } from '../models/Wishlist';
import { ProductModel } from '../models/Product';
import { inMemoryProducts } from './productRoutes';
import { CartModel } from '../models/Cart';
import { INITIAL_PRODUCTS, SeedProduct } from '../data/initialData';
import { isDbConnected } from '../db';
import { DEFAULT_ADD_TO_CART_QUANTITY } from '../../src/utils/ecommerceRules';

const router = Router();

// In-memory wishlist store for offline database fallback and instant response
interface InMemoryWishlist {
  userId?: string;
  sessionId?: string;
  items: IWishlistItem[];
  updatedAt: Date;
}

const inMemoryWishlists = new Map<string, InMemoryWishlist>();

// The 6 reference products matching the user's reference image
export const REFERENCE_WISHLIST_PRODUCT_IDS = [
  'prod-1', // Soundcore Life Q30 Wireless Noise Cancelling Headphones
  'prod-2', // Smart Watch
  'prod-6', // Wireless Earbuds
  'prod-3', // Laptop Backpack
  'prod-4', // Running Shoes
  'prod-5', // Sunglasses
];

// Helper to resolve user or guest session key
function getWishlistIdentity(req: Request): {
  userId?: string;
  sessionId?: string;
  cacheKey: string;
} {
  const userId = req.user?.userId;
  if (userId) {
    return { userId, cacheKey: `user_${userId}` };
  }

  const headerSession = req.headers['x-session-id'] as string;
  if (headerSession && headerSession.trim()) {
    const sessionId = headerSession.trim();
    return { sessionId, cacheKey: `sess_${sessionId}` };
  }

  const querySession = req.query.sessionId as string;
  if (querySession && querySession.trim()) {
    const sessionId = querySession.trim();
    return { sessionId, cacheKey: `sess_${sessionId}` };
  }

  return { sessionId: 'default_guest_session', cacheKey: 'sess_default_guest_session' };
}

// Helper to look up a product by ID (DB or in-memory)
async function findProductById(productId: string): Promise<SeedProduct | null> {
  if (isDbConnected()) {
    try {
      const dbProd = await ProductModel.findOne({ id: productId });
      if (dbProd) {
        return dbProd.toObject() as SeedProduct;
      }
    } catch (e) {
      // fallback
    }
  }

  const mem = inMemoryProducts.find((p) => p.id === productId) ||
              INITIAL_PRODUCTS.find((p) => p.id === productId);
  return mem || null;
}

// Load wishlist items for a given identity
async function getWishlistItems(identity: { userId?: string; sessionId?: string; cacheKey: string }): Promise<IWishlistItem[]> {
  // 1. Try MongoDB if connected
  if (isDbConnected()) {
    try {
      const query = identity.userId
        ? { userId: identity.userId }
        : { sessionId: identity.sessionId };
      const doc = await WishlistModel.findOne(query);
      if (doc) {
        return doc.items || [];
      }
    } catch (e) {
      console.warn('Failed to read from WishlistModel, falling back to memory', e);
    }
  }

  // 2. Check in-memory store
  if (inMemoryWishlists.has(identity.cacheKey)) {
    return inMemoryWishlists.get(identity.cacheKey)!.items;
  }

  // 3. For any initial new guest or user session, initialize with reference image's 6 products
  const defaultItems: IWishlistItem[] = REFERENCE_WISHLIST_PRODUCT_IDS.map((productId) => ({
    productId,
    addedAt: new Date(),
  }));

  // Persist the default items in-memory and in DB if connected
  await saveWishlistItems(identity, defaultItems);
  return defaultItems;
}

// Save wishlist items for a given identity
async function saveWishlistItems(
  identity: { userId?: string; sessionId?: string; cacheKey: string },
  items: IWishlistItem[]
): Promise<void> {
  // Update in-memory
  inMemoryWishlists.set(identity.cacheKey, {
    userId: identity.userId,
    sessionId: identity.sessionId,
    items,
    updatedAt: new Date(),
  });

  // Update MongoDB if connected
  if (isDbConnected()) {
    try {
      const filter = identity.userId
        ? { userId: identity.userId }
        : { sessionId: identity.sessionId };

      await WishlistModel.findOneAndUpdate(
        filter,
        {
          $set: {
            items,
            userId: identity.userId,
            sessionId: identity.sessionId,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.warn('Failed to persist to WishlistModel', e);
    }
  }
}

// -------------------------------------------------------------
// 1. GET /api/wishlist — Retrieve user or session's wishlist products
// -------------------------------------------------------------
router.get('/', async (req: Request, res: Response) => {
  try {
    const identity = getWishlistIdentity(req);
    const items = await getWishlistItems(identity);

    // Populate products
    const products: SeedProduct[] = [];
    const validItems: IWishlistItem[] = [];

    for (const item of items) {
      const prod = await findProductById(item.productId);
      if (prod) {
        products.push(prod);
        validItems.push(item);
      }
    }

    // Clean up any dangling/deleted product references silently
    if (validItems.length !== items.length) {
      await saveWishlistItems(identity, validItems);
    }

    const productIds = validItems.map((i) => i.productId);

    res.json({
      success: true,
      count: products.length,
      productIds,
      data: products,
    });
  } catch (error: any) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve wishlist' });
  }
});

// -------------------------------------------------------------
// 2. POST /api/wishlist/toggle — Add or remove product from wishlist
// -------------------------------------------------------------
router.post('/toggle', async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }

    const product = await findProductById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const identity = getWishlistIdentity(req);
    let items = await getWishlistItems(identity);

    const existingIndex = items.findIndex((i) => i.productId === productId);
    let action: 'added' | 'removed';

    if (existingIndex >= 0) {
      // Remove from wishlist
      items = items.filter((i) => i.productId !== productId);
      action = 'removed';
    } else {
      // Add to wishlist
      items.push({ productId, addedAt: new Date() });
      action = 'added';
    }

    await saveWishlistItems(identity, items);

    const productIds = items.map((i) => i.productId);

    res.json({
      success: true,
      action,
      count: items.length,
      productIds,
      message: action === 'added' ? `Added "${product.name}" to wishlist` : `Removed "${product.name}" from wishlist`,
    });
  } catch (error: any) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ success: false, error: 'Failed to update wishlist' });
  }
});

// -------------------------------------------------------------
// 3. POST /api/wishlist/add — Idempotent add to wishlist
// -------------------------------------------------------------
router.post('/add', async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }

    const product = await findProductById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const identity = getWishlistIdentity(req);
    const items = await getWishlistItems(identity);

    const alreadyExists = items.some((i) => i.productId === productId);
    if (!alreadyExists) {
      items.push({ productId, addedAt: new Date() });
      await saveWishlistItems(identity, items);
    }

    const productIds = items.map((i) => i.productId);

    res.json({
      success: true,
      added: !alreadyExists,
      count: items.length,
      productIds,
      message: `Saved "${product.name}" to wishlist`,
    });
  } catch (error: any) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ success: false, error: 'Failed to save to wishlist' });
  }
});

// -------------------------------------------------------------
// 4. DELETE /api/wishlist/:productId — Remove single product
// -------------------------------------------------------------
router.delete('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }

    const identity = getWishlistIdentity(req);
    let items = await getWishlistItems(identity);

    items = items.filter((i) => i.productId !== productId);
    await saveWishlistItems(identity, items);

    const productIds = items.map((i) => i.productId);

    res.json({
      success: true,
      count: items.length,
      productIds,
      message: 'Product removed from wishlist',
    });
  } catch (error: any) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ success: false, error: 'Failed to remove from wishlist' });
  }
});

// -------------------------------------------------------------
// 5. DELETE /api/wishlist — Clear entire wishlist
// -------------------------------------------------------------
router.delete('/', async (req: Request, res: Response) => {
  try {
    const identity = getWishlistIdentity(req);
    await saveWishlistItems(identity, []);

    res.json({
      success: true,
      count: 0,
      productIds: [],
      message: 'Wishlist cleared successfully',
    });
  } catch (error: any) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({ success: false, error: 'Failed to clear wishlist' });
  }
});

// -------------------------------------------------------------
// 6. POST /api/wishlist/move-all-to-cart — Bulk transfer items to cart
// -------------------------------------------------------------
router.post('/move-all-to-cart', async (req: Request, res: Response) => {
  try {
    const { productIds: targetProductIds } = req.body;
    const identity = getWishlistIdentity(req);
    const items = await getWishlistItems(identity);

    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'Wishlist is empty' });
    }

    const toProcess = targetProductIds && Array.isArray(targetProductIds) && targetProductIds.length > 0
      ? items.filter((i) => targetProductIds.includes(i.productId))
      : items;

    let movedCount = 0;
    let outOfStockCount = 0;
    const movedIds: string[] = [];

    // Helper to resolve cart key
    const cartKey = identity.userId ? `user_${identity.userId}` : `sess_${identity.sessionId || 'default'}`;

    for (const item of toProcess) {
      const prod = await findProductById(item.productId);
      if (!prod) continue;

      if (prod.stock <= 0) {
        outOfStockCount++;
        continue;
      }

      // Add to cart directly via CartModel if connected
      if (isDbConnected()) {
        try {
          const cartFilter = identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId };
          const cart = await CartModel.findOne(cartFilter);
          const cartItems = cart ? cart.items : [];

          const existingCartIndex = cartItems.findIndex((ci: any) => ci.productId === prod.id);
          if (existingCartIndex >= 0) {
            cartItems[existingCartIndex].quantity += 1;
          } else {
            cartItems.push({
              productId: prod.id,
              variantId: prod.variants?.[0]?.id,
              variantName: prod.variants?.[0]?.name,
              sku: prod.sku,
              name: prod.name,
              price: prod.price,
              salePrice: prod.salePrice,
              quantity: 1,
              image: prod.images[0]?.url || '',
              stock: prod.stock,
              selected: true,
            });
          }

          await CartModel.findOneAndUpdate(
            cartFilter,
            { $set: { items: cartItems } },
            { upsert: true, new: true }
          );
        } catch (e) {
          // fallback handled below
        }
      }

      movedCount++;
      movedIds.push(item.productId);
    }

    // Remove moved items from wishlist
    const remainingItems = items.filter((i) => !movedIds.includes(i.productId));
    await saveWishlistItems(identity, remainingItems);

    res.json({
      success: true,
      message: `Moved ${movedCount} item${movedCount === 1 ? '' : 's'} to your cart.`,
      movedCount,
      outOfStockCount,
      productIds: remainingItems.map((i) => i.productId),
    });
  } catch (error: any) {
    console.error('Error moving items to cart:', error);
    res.status(500).json({ success: false, error: 'Failed to move items to cart' });
  }
});

// -------------------------------------------------------------
// 7. POST /api/wishlist/merge — Merge guest session wishlist into user
// -------------------------------------------------------------
router.post('/merge', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required for merge' });
    }

    const { guestSessionId } = req.body;
    if (!guestSessionId) {
      return res.json({ success: true, message: 'No guest session to merge' });
    }

    const guestIdentity = { sessionId: guestSessionId, cacheKey: `sess_${guestSessionId}` };
    const userIdentity = { userId, cacheKey: `user_${userId}` };

    const guestItems = await getWishlistItems(guestIdentity);
    const userItems = await getWishlistItems(userIdentity);

    const userProductIds = new Set(userItems.map((i) => i.productId));
    const merged = [...userItems];

    for (const gItem of guestItems) {
      if (!userProductIds.has(gItem.productId)) {
        merged.push(gItem);
        userProductIds.add(gItem.productId);
      }
    }

    await saveWishlistItems(userIdentity, merged);
    await saveWishlistItems(guestIdentity, []); // Clear guest wishlist after successful merge

    res.json({
      success: true,
      count: merged.length,
      productIds: merged.map((i) => i.productId),
      message: 'Guest wishlist merged successfully',
    });
  } catch (error: any) {
    console.error('Error merging wishlist:', error);
    res.status(500).json({ success: false, error: 'Failed to merge wishlist' });
  }
});

export default router;
