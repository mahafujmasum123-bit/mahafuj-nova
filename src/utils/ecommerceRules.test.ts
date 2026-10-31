import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  getEffectivePrice,
  isValidOrderTransition,
  mergeCartLines,
  expandSearchQuery,
  filterAndSortSliders,
  filterBannersByPlacement,
  isAdEligible,
  isSessionActiveOnline,
  formatCartBadge,
  DEFAULT_ADD_TO_CART_QUANTITY,
  validateAddToCartQuantity,
  scoreSearchMatch,
  type CartItemInput,
  type CouponRule,
} from './ecommerceRules';

test('getEffectivePrice returns salePrice if lower than basePrice', () => {
  assert.equal(getEffectivePrice(100, 80), 80);
  assert.equal(getEffectivePrice(100, 120), 100);
  assert.equal(getEffectivePrice(100, undefined), 100);
  assert.equal(getEffectivePrice(100, 0), 100);
});

test('calculateCartTotals calculates subtotal, shipping, and discount correctly', () => {
  const items: CartItemInput[] = [
    {
      productId: 'p1',
      sku: 'SKU-1',
      name: 'Wireless Earbuds',
      price: 50,
      salePrice: 40,
      quantity: 2,
      image: '/test.jpg',
      stock: 10,
    },
    {
      productId: 'p2',
      sku: 'SKU-2',
      name: 'Men T-shirt',
      price: 25,
      quantity: 1,
      image: '/test.jpg',
      stock: 5,
    },
  ];

  // subtotal: (40 * 2) + (25 * 1) = 105
  // Dhaka shipping: 60 (subtotal < 5000)
  // lineItemsCount: 2
  const result = calculateCartTotals(items, null, 'Dhaka');
  assert.equal(result.subtotal, 105);
  assert.equal(result.shippingFee, 60);
  assert.equal(result.finalTotal, 165);
  assert.equal(result.lineItemsCount, 2);
  assert.equal(result.totalQuantity, 3);
});

test('calculateCartTotals applies percentage coupon with cap', () => {
  const items: CartItemInput[] = [
    {
      productId: 'p1',
      sku: 'SKU-1',
      name: 'Smart Watch',
      price: 1000,
      quantity: 2,
      image: '/test.jpg',
      stock: 10,
    },
  ];

  const coupon: CouponRule = {
    code: 'SAVE20',
    discountType: 'percentage',
    discountValue: 20, // 20% of 2000 = 400
    minOrderAmount: 500,
    maxDiscount: 300, // capped at 300
    validFrom: '2020-01-01',
    validTo: '2030-01-01',
    isActive: true,
  };

  const result = calculateCartTotals(items, coupon, 'Dhaka');
  assert.equal(result.subtotal, 2000);
  assert.equal(result.discount, 300);
  assert.equal(result.shippingFee, 60);
  assert.equal(result.finalTotal, 1760);
});

test('isValidOrderTransition rejects invalid status jumps', () => {
  assert.equal(isValidOrderTransition('pending', 'confirmed'), true);
  assert.equal(isValidOrderTransition('confirmed', 'processing'), true);
  assert.equal(isValidOrderTransition('processing', 'shipped'), false); // must go to packed first
  assert.equal(isValidOrderTransition('cancelled', 'delivered'), false);
  assert.equal(isValidOrderTransition('delivered', 'returned'), true);
});

test('mergeCartLines combines duplicates and respects stock caps', () => {
  const existing: CartItemInput[] = [
    {
      productId: 'p1',
      variantId: 'v1',
      sku: 'SKU-A',
      name: 'Shoes',
      price: 100,
      quantity: 2,
      image: '',
      stock: 5,
    },
  ];

  const incoming: CartItemInput[] = [
    {
      productId: 'p1',
      variantId: 'v1',
      sku: 'SKU-A',
      name: 'Shoes',
      price: 100,
      quantity: 4,
      image: '',
      stock: 5,
    },
    {
      productId: 'p2',
      sku: 'SKU-B',
      name: 'Hat',
      price: 20,
      quantity: 1,
      image: '',
      stock: 10,
    },
  ];

  const merged = mergeCartLines(existing, incoming);
  assert.equal(merged.length, 2);
  // capped at stock 5
  assert.equal(merged[0].quantity, 5);
  assert.equal(merged[1].quantity, 1);
});

test('expandSearchQuery handles Bangla to English mapping', () => {
  const tokens = expandSearchQuery('বই');
  assert.ok(tokens.includes('বই'));
  assert.ok(tokens.includes('book'));
  assert.ok(tokens.includes('literature'));
});

test('filterAndSortSliders filters inactive sliders and orders by displayOrder', () => {
  const sampleSliders = [
    { id: 's1', displayOrder: 3, isActive: true, headline: 'Slide 3' },
    { id: 's2', displayOrder: 1, isActive: true, headline: 'Slide 1' },
    { id: 's3', displayOrder: 2, isActive: false, headline: 'Slide 2 Hidden' },
  ];

  const activeOrdered = filterAndSortSliders(sampleSliders, true);
  assert.equal(activeOrdered.length, 2);
  assert.equal(activeOrdered[0].id, 's2');
  assert.equal(activeOrdered[1].id, 's1');

  const allOrdered = filterAndSortSliders(sampleSliders, false);
  assert.equal(allOrdered.length, 3);
  assert.equal(allOrdered[0].id, 's2');
  assert.equal(allOrdered[1].id, 's3');
  assert.equal(allOrdered[2].id, 's1');
});

test('filterBannersByPlacement filters correctly by placement identifier', () => {
  const sampleBanners = [
    { id: 'b1', placement: 'homepage-main', displayOrder: 1, isActive: true },
    { id: 'b2', placement: 'homepage-secondary', displayOrder: 2, isActive: true },
    { id: 'b3', placement: 'homepage-secondary', displayOrder: 1, isActive: true },
    { id: 'b4', placement: 'homepage-promotion', displayOrder: 1, isActive: false },
  ];

  const secondary = filterBannersByPlacement(sampleBanners, 'homepage-secondary', true);
  assert.equal(secondary.length, 2);
  assert.equal(secondary[0].id, 'b3'); // order 1
  assert.equal(secondary[1].id, 'b2'); // order 2

  const activePromos = filterBannersByPlacement(sampleBanners, 'homepage-promotion', true);
  assert.equal(activePromos.length, 0); // b4 is inactive
});

test('isAdEligible respects active flag and scheduled date windows', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  // Active with valid dates
  assert.equal(
    isAdEligible(
      {
        id: 'ad1',
        priority: 1,
        isActive: true,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        frequency: 'once_per_session',
      },
      now
    ),
    true
  );

  // Inactive ad
  assert.equal(
    isAdEligible(
      {
        id: 'ad2',
        priority: 1,
        isActive: false,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        frequency: 'once_per_session',
      },
      now
    ),
    false
  );

  // Expired ad
  assert.equal(
    isAdEligible(
      {
        id: 'ad3',
        priority: 1,
        isActive: true,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        frequency: 'once_per_session',
      },
      now
    ),
    false
  );
});

test('isSessionActiveOnline correctly detects presence within 5 minutes', () => {
  const now = 1750000000000;
  const recent = now - 2 * 60 * 1000; // 2 minutes ago
  const stale = now - 6 * 60 * 1000; // 6 minutes ago

  assert.equal(isSessionActiveOnline(recent, now, 5 * 60 * 1000), true);
  assert.equal(isSessionActiveOnline(stale, now, 5 * 60 * 1000), false);
});

test('calculateCartTotals matches reference image exact values: $303.95 subtotal, -$56.98 discount, $246.97 total', () => {
  const referenceItems: CartItemInput[] = [
    { productId: 'p1', sku: 'SKU-1', name: 'Soundcore Life Q30', price: 99.99, salePrice: 74.99, quantity: 1, image: '', stock: 25, selected: true },
    { productId: 'p2', sku: 'SKU-2', name: 'Smart Watch', price: 99.99, salePrice: 68.99, quantity: 1, image: '', stock: 32, selected: true },
    { productId: 'p3', sku: 'SKU-3', name: 'Wireless Earbuds', price: 69.99, salePrice: 39.99, quantity: 1, image: '', stock: 80, selected: true },
    { productId: 'p4', sku: 'SKU-4', name: 'Laptop Backpack', price: 79.99, salePrice: 49.99, quantity: 1, image: '', stock: 60, selected: true },
    { productId: 'p5', sku: 'SKU-5', name: 'Running Shoes', price: 89.99, salePrice: 69.99, quantity: 1, image: '', stock: 28, selected: true },
  ];

  const shopmaxCoupon: CouponRule = {
    code: 'SHOPMAX',
    discountType: 'fixed',
    discountValue: 56.98,
    minOrderAmount: 0,
    validFrom: '2024-01-01',
    validTo: '2030-12-31',
    isActive: true,
  };

  const totals = calculateCartTotals(referenceItems, shopmaxCoupon, 'US');
  assert.equal(totals.subtotal, 303.95);
  assert.equal(totals.shippingFee, 0);
  assert.equal(totals.discount, 56.98);
  assert.equal(totals.finalTotal, 246.97);
  assert.equal(totals.lineItemsCount, 5);
  assert.equal(totals.selectedItemsCount, 5);
  assert.equal(totals.isFreeShipping, true);
});

test('calculateCartTotals dynamically updates when an item is unselected', () => {
  const referenceItems: CartItemInput[] = [
    { productId: 'p1', sku: 'SKU-1', name: 'Item 1', price: 100, salePrice: 75, quantity: 1, image: '', stock: 25, selected: true },
    { productId: 'p2', sku: 'SKU-2', name: 'Item 2', price: 50, salePrice: 25, quantity: 1, image: '', stock: 30, selected: false },
  ];

  const totals = calculateCartTotals(referenceItems, null, 'US');
  assert.equal(totals.subtotal, 75);
  assert.equal(totals.lineItemsCount, 2);
  assert.equal(totals.selectedItemsCount, 1);
  assert.equal(totals.finalTotal, 75);
});

test('calculateCartTotals matches reference checkout interface: $143.98 subtotal, -$10.00 discount, $0.00 shipping, $133.98 total', () => {
  const checkoutItems: CartItemInput[] = [
    {
      productId: 'prod-1',
      variantId: 'var-1a',
      variantName: 'Black, 2.6kg',
      sku: 'NOV-AUD-001',
      name: 'Soundcore Life Q30 Wireless Noise Cancelling Headphones',
      price: 99.99,
      salePrice: 74.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b',
      stock: 25,
      selected: true,
    },
    {
      productId: 'prod-2',
      variantId: 'var-2a',
      variantName: 'Black, 1.2kg',
      sku: 'NOV-WCH-002',
      name: 'Smart Watch',
      price: 99.99,
      salePrice: 68.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1',
      stock: 32,
      selected: true,
    },
  ];

  const save10Coupon: CouponRule = {
    code: 'SAVE10',
    discountType: 'fixed',
    discountValue: 10,
    minOrderAmount: 0,
    validFrom: '2024-01-01',
    validTo: '2030-12-31',
    isActive: true,
  };

  // Standard shipping (Free over $50)
  const standardTotals = calculateCartTotals(checkoutItems, save10Coupon, 'Dhaka', 'standard');
  assert.equal(standardTotals.subtotal, 143.98);
  assert.equal(standardTotals.discount, 10.00);
  assert.equal(standardTotals.shippingFee, 0);
  assert.equal(standardTotals.finalTotal, 133.98);
  assert.equal(standardTotals.lineItemsCount, 2);

  // Express shipping ($9.99)
  const expressTotals = calculateCartTotals(checkoutItems, save10Coupon, 'Dhaka', 'express');
  assert.equal(expressTotals.subtotal, 143.98);
  assert.equal(expressTotals.shippingFee, 9.99);
  assert.equal(expressTotals.finalTotal, 143.97);

  // Next Day Delivery ($14.99)
  const nextDayTotals = calculateCartTotals(checkoutItems, save10Coupon, 'Dhaka', 'next_day');
  assert.equal(nextDayTotals.subtotal, 143.98);
  assert.equal(nextDayTotals.shippingFee, 14.99);
  assert.equal(nextDayTotals.finalTotal, 148.97);
});

test('formatCartBadge strictly caps at 99+ and hides on zero or negative', () => {
  assert.equal(formatCartBadge(0), null);
  assert.equal(formatCartBadge(-5), null);
  assert.equal(formatCartBadge(1), '1');
  assert.equal(formatCartBadge(10), '10');
  assert.equal(formatCartBadge(25), '25');
  assert.equal(formatCartBadge(50), '50');
  assert.equal(formatCartBadge(98), '98');
  assert.equal(formatCartBadge(99), '99');
  assert.equal(formatCartBadge(100), '99+');
  assert.equal(formatCartBadge(150), '99+');
  assert.equal(formatCartBadge(200), '99+');
  assert.equal(formatCartBadge(500), '99+');
  assert.equal(formatCartBadge(1000), '99+');
  assert.equal(formatCartBadge(99999), '99+');
});

test('validateAddToCartQuantity enforces DEFAULT_ADD_TO_CART_QUANTITY = 10 and stock boundaries', () => {
  assert.equal(DEFAULT_ADD_TO_CART_QUANTITY, 10);

  // 1. Initial click with abundant stock: adds 10
  const initial = validateAddToCartQuantity(0, undefined, 50);
  assert.equal(initial.valid, true);
  assert.equal(initial.actualAdded, 10);
  assert.equal(initial.newQuantity, 10);
  assert.equal(initial.isCapped, false);

  // 2. Second click on same item: adds another 10 (0 -> 10 -> 20)
  const secondClick = validateAddToCartQuantity(10, DEFAULT_ADD_TO_CART_QUANTITY, 50);
  assert.equal(secondClick.valid, true);
  assert.equal(secondClick.actualAdded, 10);
  assert.equal(secondClick.newQuantity, 20);
  assert.equal(secondClick.isCapped, false);

  // 3. Stock less than default (e.g. 6 items in stock): caps at 6
  const lowStock = validateAddToCartQuantity(0, 10, 6);
  assert.equal(lowStock.valid, true);
  assert.equal(lowStock.actualAdded, 6);
  assert.equal(lowStock.newQuantity, 6);
  assert.equal(lowStock.isCapped, true);

  // 4. Partial stock remaining: 10 in cart, 15 available in stock
  const partialStock = validateAddToCartQuantity(10, 10, 15);
  assert.equal(partialStock.valid, true);
  assert.equal(partialStock.actualAdded, 5);
  assert.equal(partialStock.newQuantity, 15);
  assert.equal(partialStock.isCapped, true);

  // 5. Completely out of stock
  const outOfStock = validateAddToCartQuantity(0, 10, 0);
  assert.equal(outOfStock.valid, false);
  assert.equal(outOfStock.actualAdded, 0);
  assert.equal(outOfStock.newQuantity, 0);

  // 6. Already at maximum stock
  const atMax = validateAddToCartQuantity(20, 10, 20);
  assert.equal(atMax.valid, false);
  assert.equal(atMax.actualAdded, 0);
  assert.equal(atMax.newQuantity, 20);
});

test('Cross-lingual search expansion and synonym bidirectional mapping for Bangla and English', () => {
  // জুতা <-> shoes
  const shoesTokens = expandSearchQuery('জুতা');
  assert.ok(shoesTokens.includes('shoes'));
  assert.ok(shoesTokens.includes('footwear'));

  const enShoesTokens = expandSearchQuery('shoes');
  assert.ok(enShoesTokens.includes('জুতা') || enShoesTokens.includes('জুতো'));

  // shirt <-> শার্ট
  const shirtTokens = expandSearchQuery('Shirt');
  assert.ok(shirtTokens.includes('শার্ট'));
  assert.ok(shirtTokens.includes('টিশার্ট') || shirtTokens.includes('t-shirt'));

  const banglaShirtTokens = expandSearchQuery('শার্ট');
  assert.ok(banglaShirtTokens.includes('shirt'));

  // মোবাইল <-> mobile
  const mobileTokens = expandSearchQuery('মোবাইল');
  assert.ok(mobileTokens.includes('mobile'));
  assert.ok(mobileTokens.includes('smartphone'));

  const enMobileTokens = expandSearchQuery('mobile');
  assert.ok(enMobileTokens.includes('মোবাইল'));

  // ঘড়ি / ঘড়ি <-> watch
  const watchTokens1 = expandSearchQuery('ঘড়ি');
  assert.ok(watchTokens1.includes('watch'));
  assert.ok(watchTokens1.includes('smartwatch'));

  const watchTokens2 = expandSearchQuery('ঘড়ি');
  assert.ok(watchTokens2.includes('watch'));

  const enWatchTokens = expandSearchQuery('watch');
  assert.ok(enWatchTokens.includes('ঘড়ি') || enWatchTokens.includes('ঘড়ি'));
});

test('scoreSearchMatch ranks multilingual and keyword matches accurately', () => {
  const shoeProduct = {
    name: 'Air Flow Running Shoes',
    sku: 'NOV-SHOE-001',
    banglaName: 'এয়ার ফ্লো রানিং জুতা',
    category: 'fashion',
    brand: 'Novara Sports',
    description: 'Breathable lightweight athletic footwear for daily running and training.',
    banglaKeywords: ['জুতা', 'জুতো', 'স্নিকার্স', 'shoes', 'footwear'],
  };

  const scoreBangla = scoreSearchMatch('জুতা', ['জুতা', 'জুতো', 'shoes', 'footwear'], shoeProduct);
  assert.ok(scoreBangla >= 100, `Expected score >= 100 for primary Bangla match, got ${scoreBangla}`);

  const phoneProduct = {
    name: 'Smartphone Pro Max',
    sku: 'NOV-PHN-001',
    banglaName: 'স্মার্টফোন প্রো ম্যাক্স',
    category: 'electronics',
    brand: 'Novara Tech',
    description: 'Flagship 5G smartphone with triple camera.',
    banglaKeywords: ['মোবাইল', 'স্মার্টফোন', 'ফোন'],
  };
  const scorePhone = scoreSearchMatch('জুতা', ['জুতা', 'জুতো', 'shoes', 'footwear'], phoneProduct);
  assert.equal(scorePhone, 0);
});

test('calculateCartTotals retains true totalQuantity (e.g. 60, 200, 600) while badge format limits to 99+', () => {
  // Scenario 1: 3 distinct items with 10, 20, 30 units = 60 total
  const items60: CartItemInput[] = [
    { productId: 'p1', sku: 'S1', name: 'Item 1', price: 10, quantity: 10, image: '', stock: 100, selected: true },
    { productId: 'p2', sku: 'S2', name: 'Item 2', price: 20, quantity: 20, image: '', stock: 100, selected: true },
    { productId: 'p3', sku: 'S3', name: 'Item 3', price: 30, quantity: 30, image: '', stock: 100, selected: true },
  ];
  const totals60 = calculateCartTotals(items60, null, 'Dhaka');
  assert.equal(totals60.lineItemsCount, 3);
  assert.equal(totals60.totalQuantity, 60);
  assert.equal(formatCartBadge(totals60.totalQuantity), '60');

  // Scenario 2: 3 distinct items with 100, 200, 300 units = 600 total
  const items600: CartItemInput[] = [
    { productId: 'p1', sku: 'S1', name: 'Bulk 1', price: 10, quantity: 100, image: '', stock: 500, selected: true },
    { productId: 'p2', sku: 'S2', name: 'Bulk 2', price: 20, quantity: 200, image: '', stock: 500, selected: true },
    { productId: 'p3', sku: 'S3', name: 'Bulk 3', price: 30, quantity: 300, image: '', stock: 500, selected: true },
  ];
  const totals600 = calculateCartTotals(items600, null, 'Dhaka');
  assert.equal(totals600.lineItemsCount, 3);
  assert.equal(totals600.totalQuantity, 600);
  // Presentation badge is strictly 99+
  assert.equal(formatCartBadge(totals600.totalQuantity), '99+');
});




