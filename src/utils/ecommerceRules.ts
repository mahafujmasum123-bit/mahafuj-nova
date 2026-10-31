/**
 * NOVARA COMMERCE — Core E-commerce Business Logic & Rules
 * Pure functions decoupled from React & Express for fast, deterministic unit testing.
 */

export interface CartItemInput {
  productId: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  name: string;
  price: number;
  salePrice?: number;
  quantity: number;
  image: string;
  stock: number;
  selected?: boolean;
}

export interface CouponRule {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

/**
 * Valid allowed transitions for order lifecycle
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['returned'],
  returned: ['refunded'],
  cancelled: [],
  refunded: [],
};

/**
 * Validate order state machine transition
 */
export function isValidOrderTransition(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next) return true;
  const allowed = ALLOWED_ORDER_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

/**
 * Calculate effective unit price
 */
export function getEffectivePrice(basePrice: number, salePrice?: number): number {
  if (typeof salePrice === 'number' && salePrice > 0 && salePrice < basePrice) {
    return salePrice;
  }
  return basePrice;
}

export interface ShippingMethod {
  id: 'standard' | 'express' | 'next_day';
  name: string;
  estimatedDays: string;
  baseFee: number;
  isFreeEligible: boolean;
}

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    estimatedDays: '3-5 business days',
    baseFee: 0,
    isFreeEligible: true,
  },
  {
    id: 'express',
    name: 'Express Shipping',
    estimatedDays: '1-2 business days',
    baseFee: 9.99,
    isFreeEligible: false,
  },
  {
    id: 'next_day',
    name: 'Next Day Delivery',
    estimatedDays: 'Next day (order before 2 PM)',
    baseFee: 14.99,
    isFreeEligible: false,
  },
];

/**
 * Calculate cart line totals
 */
export function calculateCartTotals(
  items: CartItemInput[],
  coupon?: CouponRule | null,
  division: string = 'Dhaka',
  shippingMethodId: string = 'auto'
) {
  const lineItemsCount = items.length; // total unique line items
  const activeItems = items.filter((i) => i.selected !== false);
  const selectedItemsCount = activeItems.length;
  const totalQuantity = activeItems.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = activeItems.reduce((sum, item) => {
    const unitPrice = getEffectivePrice(item.price, item.salePrice);
    return sum + unitPrice * item.quantity;
  }, 0);

  // Bangladesh shipping fee: Dhaka division 60 BDT, outside Dhaka 120 BDT. Free over 5000 BDT or $50
  const isBdDivision = /dhaka|chittagong|sylhet|rajshahi|khulna|barisal|rangpur|mymensingh/i.test(division);
  const isFreeShipping = isBdDivision ? subtotal >= 5000 : subtotal >= 50;

  let shippingFee = 0;
  if (activeItems.length > 0) {
    if (shippingMethodId === 'express') {
      shippingFee = 9.99;
    } else if (shippingMethodId === 'next_day') {
      shippingFee = 14.99;
    } else if (shippingMethodId === 'standard') {
      // Standard Shipping is Free in the reference checkout UI
      shippingFee = 0;
    } else {
      // Legacy auto-calculation based on division & threshold
      if (isFreeShipping) {
        shippingFee = 0;
      } else if (isBdDivision) {
        shippingFee = division.toLowerCase().includes('dhaka') ? 60 : 120;
      } else {
        shippingFee = 10;
      }
    }
  }

  let discount = 0;
  let couponError: string | null = null;

  if (coupon && activeItems.length > 0) {
    const now = new Date().toISOString();
    if (!coupon.isActive) {
      couponError = 'Coupon is not active';
    } else if (now < coupon.validFrom || now > coupon.validTo) {
      couponError = 'Coupon has expired or is not yet valid';
    } else if (subtotal < coupon.minOrderAmount) {
      couponError = `Minimum order amount of $${coupon.minOrderAmount} required for this coupon`;
    } else {
      if (coupon.discountType === 'percentage') {
        const rawDiscount = (subtotal * coupon.discountValue) / 100;
        discount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
      } else {
        discount = Math.min(coupon.discountValue, subtotal);
      }
    }
  }

  const finalTotal = Math.max(0, subtotal - discount + shippingFee);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    shippingFee: Math.round(shippingFee * 100) / 100,
    finalTotal: Math.round(finalTotal * 100) / 100,
    lineItemsCount,
    selectedItemsCount,
    totalQuantity,
    couponError,
    isFreeShipping,
    shippingMethodId,
  };
}

/**
 * Merge guest cart into customer cart without duplicates
 */
export function mergeCartLines(
  existingItems: CartItemInput[],
  incomingItems: CartItemInput[]
): CartItemInput[] {
  const merged = [...existingItems];

  for (const inc of incomingItems) {
    const existingIndex = merged.findIndex(
      (m) => m.productId === inc.productId && (m.variantId || '') === (inc.variantId || '')
    );

    if (existingIndex >= 0) {
      // Sum quantity, capped at available stock
      const newQty = Math.min(merged[existingIndex].quantity + inc.quantity, inc.stock);
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: Math.max(1, newQty),
        stock: inc.stock, // keep freshest stock
      };
    } else {
      merged.push({
        ...inc,
        quantity: Math.min(inc.quantity, inc.stock),
      });
    }
  }

  return merged;
}

/**
 * Centralized business constant: one Add to Cart click adds 10 units by default
 */
export const DEFAULT_ADD_TO_CART_QUANTITY = 10;

/**
 * Navigation Cart Badge: Strict 99+ display limit
 * Presentation-only restriction: actual database/Redux quantities remain unclipped.
 * If totalCartUnits <= 0: null (hidden)
 * If totalCartUnits <= 99: exact number as string
 * If totalCartUnits > 99: exactly "99+"
 */
export function formatCartBadge(totalCartUnits: number): string | null {
  if (!totalCartUnits || isNaN(totalCartUnits) || totalCartUnits <= 0) {
    return null;
  }
  if (totalCartUnits > 99) {
    return '99+';
  }
  return String(Math.floor(totalCartUnits));
}

/**
 * Validate Add to Cart quantity against stock and limits
 */
export interface AddToCartValidationResult {
  valid: boolean;
  actualAdded: number;
  newQuantity: number;
  message?: string;
  isCapped: boolean;
}

export function validateAddToCartQuantity(
  currentQuantity: number = 0,
  requestedIncrement: number = DEFAULT_ADD_TO_CART_QUANTITY,
  availableStock: number = 999,
  maxPurchaseLimit: number = 1000
): AddToCartValidationResult {
  const safeStock = Math.max(0, availableStock);
  const safeCurrent = Math.max(0, currentQuantity);
  const safeIncrement = Math.max(1, requestedIncrement);

  if (safeStock <= 0) {
    return {
      valid: false,
      actualAdded: 0,
      newQuantity: safeCurrent,
      message: 'Product is currently out of stock.',
      isCapped: false,
    };
  }

  const remainingStock = Math.max(0, safeStock - safeCurrent);
  if (remainingStock <= 0) {
    return {
      valid: false,
      actualAdded: 0,
      newQuantity: safeCurrent,
      message: `You already have all available units (${safeStock}) in your cart.`,
      isCapped: false,
    };
  }

  // Cap at remaining stock and configured purchase limit
  const maxAllowedToAdd = Math.min(remainingStock, Math.max(0, maxPurchaseLimit - safeCurrent));
  const actualAdded = Math.min(safeIncrement, maxAllowedToAdd);
  const newQuantity = safeCurrent + actualAdded;
  const isCapped = actualAdded < safeIncrement;

  return {
    valid: actualAdded > 0,
    actualAdded,
    newQuantity,
    isCapped,
    message: isCapped
      ? `Added ${actualAdded} units (stock limit reached).`
      : undefined,
  };
}

/**
 * Safe Regex escaper to prevent ReDoS (Regular Expression Denial of Service)
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Multilingual search query normalization:
 * - Unicode normalization (NFC)
 * - Removes zero-width joiners / non-joiners
 * - Normalizes Bangla punctuation and diacritics
 * - Lowercases English text
 * - Trims and collapses multiple spaces
 */
export function normalizeMultilingualQuery(rawQuery: string): string {
  if (!rawQuery) return '';
  return rawQuery
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width chars
    .replace(/[।;,!?]/g, ' ') // normalize punctuation
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Bidirectional Bangla <-> English cross-lingual synonym and keyword dictionary
 */
export const CROSS_LINGUAL_SYNONYM_MAP: Record<string, string[]> = {
  // Bangla terms to English & related Bangla variations
  'জুতা': ['জুতো', 'shoes', 'shoe', 'footwear', 'sneakers', 'running shoes', 'boots', 'কেডস'],
  'জুতো': ['জুতা', 'shoes', 'shoe', 'footwear', 'sneakers', 'running shoes', 'boots', 'কেডস'],
  'কেডস': ['জুতা', 'জুতো', 'shoes', 'sneakers', 'running shoes'],
  'শার্ট': ['shirt', 't-shirt', 'tshirt', 'tee', 'টি শার্ট', 'টি-শার্ট', 'apparel', 'fashion'],
  'টি শার্ট': ['t-shirt', 'tshirt', 'shirt', 'tee', 'শার্ট', 'mens t-shirt'],
  'টি-শার্ট': ['t-shirt', 'tshirt', 'shirt', 'tee', 'শার্ট'],
  'মোবাইল': ['mobile', 'smartphone', 'phone', 'cellphone', 'মোবাইল ফোন', 'স্মার্টফোন', 'ফোন'],
  'স্মার্টফোন': ['smartphone', 'mobile', 'phone', 'মোবাইল', 'মোবাইল ফোন'],
  'ফোন': ['phone', 'mobile', 'smartphone', 'মোবাইল'],
  'ঘড়ি': ['ঘড়ি', 'watch', 'smartwatch', 'smart watch', 'fitness tracker', 'স্মার্ট ওয়াচ'],
  'ঘড়ি': ['ঘড়ি', 'watch', 'smartwatch', 'smart watch', 'fitness tracker', 'স্মার্ট ওয়াচ'],
  'স্মার্ট ওয়াচ': ['smartwatch', 'smart watch', 'watch', 'ঘড়ি', 'ঘড়ি'],
  'বই': ['book', 'books', 'literature', 'novel'],
  'হেডফোন': ['headphone', 'headphones', 'earbuds', 'audio', 'soundcore', 'wireless', 'ইয়ারফোন'],
  'ইয়ারফোন': ['earbuds', 'earphone', 'earphones', 'headphones', 'হেডফোন', 'এয়ারবাডস'],
  'ইয়ারফোন': ['earbuds', 'earphone', 'earphones', 'headphones', 'হেডফোন'],
  'এয়ারবাডস': ['earbuds', 'tws', 'wireless earbuds', 'হেডফোন'],
  'ল্যাপটপ': ['laptop', 'computer', 'notebook', 'macbook', 'ultrabook', 'পিসি'],
  'কম্পিউটার': ['computer', 'laptop', 'pc', 'ল্যাপটপ'],
  'ব্যাগ': ['bag', 'backpack', 'leather', 'wallet', 'ব্যাকপ্যাক'],
  'ব্যাকপ্যাক': ['backpack', 'bag', 'commuter backpack', 'ব্যাগ'],
  'মানিব্যাগ': ['wallet', 'leather wallet', 'ব্যাগ', 'cardholder'],
  'সানগ্লাস': ['sunglasses', 'glasses', 'eyewear', 'shades', 'চশমা', 'রোদ চশমা'],
  'চশমা': ['glasses', 'sunglasses', 'eyewear', 'সানগ্লাস'],
  'জ্যাকেট': ['jacket', 'coat', 'winter', 'mens jacket', 'শীতের পোশাক'],
  'স্পিকার': ['speaker', 'bluetooth speaker', 'soundbox', 'অডিও'],
  'গেম': ['game', 'gaming', 'controller', 'joystick', 'console'],
  'স্কিনকেয়ার': ['skincare', 'beauty', 'cream', 'serum', 'lotion', 'সৌন্দর্য'],

  // English terms to Bangla & related English variations
  'shoes': ['জুতা', 'জুতো', 'footwear', 'sneakers', 'running shoes', 'কেডস'],
  'shoe': ['জুতা', 'জুতো', 'footwear', 'shoes', 'sneakers'],
  'footwear': ['জুতা', 'জুতো', 'shoes', 'sneakers'],
  'sneakers': ['জুতা', 'জুতো', 'shoes', 'কেডস'],
  'shirt': ['শার্ট', 'টি শার্ট', 't-shirt', 'tee', 'apparel'],
  't-shirt': ['টি শার্ট', 'টি-শার্ট', 'শার্ট', 'tshirt', 'tee'],
  'tshirt': ['টি শার্ট', 'শার্ট', 't-shirt'],
  'mobile': ['মোবাইল', 'স্মার্টফোন', 'smartphone', 'phone', 'মোবাইল ফোন'],
  'smartphone': ['স্মার্টফোন', 'মোবাইল', 'mobile', 'phone'],
  'phone': ['ফোন', 'মোবাইল', 'mobile', 'smartphone'],
  'watch': ['ঘড়ি', 'ঘড়ি', 'smartwatch', 'smart watch', 'স্মার্ট ওয়াচ'],
  'smartwatch': ['স্মার্ট ওয়াচ', 'ঘড়ি', 'ঘড়ি', 'watch'],
  'book': ['বই', 'books', 'literature'],
  'books': ['বই', 'book', 'literature'],
  'headphone': ['হেডফোন', 'headphones', 'earbuds', 'ইয়ারফোন'],
  'headphones': ['হেডফোন', 'headphone', 'earbuds', 'ইয়ারফোন', 'audio'],
  'earbuds': ['এয়ারবাডস', 'ইয়ারফোন', 'হেডফোন', 'wireless earbuds'],
  'laptop': ['ল্যাপটপ', 'computer', 'notebook'],
  'bag': ['ব্যাগ', 'backpack', 'leather'],
  'backpack': ['ব্যাকপ্যাক', 'ব্যাগ', 'bag'],
  'sunglasses': ['সানগ্লাস', 'চশমা', 'glasses', 'eyewear'],
  'jacket': ['জ্যাকেট', 'coat', 'winter'],
};

// Backward-compatible alias for existing imports
export const BANGLA_SYNONYM_MAP = CROSS_LINGUAL_SYNONYM_MAP;

/**
 * Expand search query across Bangla and English using normalized tokenization
 */
export function expandSearchQuery(rawQuery: string): string[] {
  const normalized = normalizeMultilingualQuery(rawQuery);
  if (!normalized) return [];

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const terms = new Set<string>([normalized]);

  for (const token of tokens) {
    terms.add(token);
    const synonyms = CROSS_LINGUAL_SYNONYM_MAP[token];
    if (synonyms) {
      for (const syn of synonyms) {
        terms.add(syn.toLowerCase());
      }
    }
  }

  // Also check if the whole multi-word query exists in synonym dictionary
  if (CROSS_LINGUAL_SYNONYM_MAP[normalized]) {
    for (const syn of CROSS_LINGUAL_SYNONYM_MAP[normalized]) {
      terms.add(syn.toLowerCase());
    }
  }

  return Array.from(terms);
}

/**
 * Calculate relevance score for search results
 */
export function scoreSearchMatch(
  query: string,
  tokens: string[],
  product: {
    name: string;
    sku: string;
    brand?: string;
    category?: string;
    subcategory?: string;
    banglaKeywords?: string[];
    description?: string;
  }
): number {
  const cleanQ = normalizeMultilingualQuery(query);
  const prodName = normalizeMultilingualQuery(product.name);
  const prodSku = (product.sku || '').toLowerCase();
  const prodBrand = normalizeMultilingualQuery(product.brand || '');
  const prodCategory = normalizeMultilingualQuery(product.category || '');
  const banglaList = (product.banglaKeywords || []).map((k) => normalizeMultilingualQuery(k));

  let score = 0;

  // 1. Exact Name match (Highest priority)
  if (prodName === cleanQ) {
    score += 100;
  } else if (prodName.startsWith(cleanQ)) {
    score += 80;
  } else if (prodName.includes(cleanQ)) {
    score += 60;
  }

  // 2. Exact SKU match
  if (prodSku === cleanQ || prodSku.includes(cleanQ)) {
    score += 90;
  }

  // 3. Brand or Category exact match
  if (prodBrand === cleanQ || prodCategory === cleanQ) {
    score += 50;
  }

  // 4. Token matches in Name, Brand, Category, Bangla Keywords
  for (const token of tokens) {
    if (prodName.includes(token)) score += 30;
    if (prodBrand.includes(token)) score += 20;
    if (prodCategory.includes(token)) score += 20;
    if (banglaList.some((bk) => bk.includes(token) || token.includes(bk))) score += 40;
  }

  // 5. Description partial match
  if (product.description && normalizeMultilingualQuery(product.description).includes(cleanQ)) {
    score += 10;
  }

  return score;
}

/**
 * Filter and sort hero sliders by displayOrder
 */
export interface BaseSlider {
  id: string;
  displayOrder: number;
  isActive: boolean;
  headline: string;
}

export function filterAndSortSliders<T extends BaseSlider>(sliders: T[], activeOnly: boolean = true): T[] {
  let list = [...sliders];
  if (activeOnly) {
    list = list.filter((s) => s.isActive);
  }
  return list.sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Filter banners by placement and active status
 */
export interface BaseBanner {
  id: string;
  placement: string;
  displayOrder: number;
  isActive: boolean;
}

export function filterBannersByPlacement<T extends BaseBanner>(
  banners: T[],
  placement?: string,
  activeOnly: boolean = true
): T[] {
  let list = [...banners];
  if (placement && placement !== 'all') {
    list = list.filter((b) => b.placement === placement);
  }
  if (activeOnly) {
    list = list.filter((b) => b.isActive);
  }
  return list.sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Determine advertisement campaign eligibility
 */
export interface BaseAd {
  id: string;
  priority: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  frequency: 'once_per_session' | 'always' | 'daily';
}

export function isAdEligible(ad: BaseAd, now: Date = new Date()): boolean {
  if (!ad.isActive) return false;
  if (ad.startDate && new Date(ad.startDate) > now) return false;
  if (ad.endDate && new Date(ad.endDate) < now) return false;
  return true;
}

/**
 * Check if visitor session is currently online based on heartbeat threshold
 */
export function isSessionActiveOnline(
  lastSeenMs: number,
  nowMs: number = Date.now(),
  timeoutMs: number = 5 * 60 * 1000
): boolean {
  return nowMs - lastSeenMs <= timeoutMs;
}

