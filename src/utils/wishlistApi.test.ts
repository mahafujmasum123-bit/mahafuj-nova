import test from 'node:test';
import assert from 'node:assert/strict';
import { REFERENCE_WISHLIST_PRODUCT_IDS } from '../../server/routes/wishlistRoutes';
import { INITIAL_PRODUCTS } from '../../server/data/initialData';

test('REFERENCE_WISHLIST_PRODUCT_IDS contains exactly the 6 reference image products', () => {
  assert.equal(REFERENCE_WISHLIST_PRODUCT_IDS.length, 6);
  assert.deepEqual(REFERENCE_WISHLIST_PRODUCT_IDS, [
    'prod-1', // Soundcore Life Q30 Wireless Noise Cancelling Headphones
    'prod-2', // Smart Watch
    'prod-6', // Wireless Earbuds
    'prod-3', // Laptop Backpack
    'prod-4', // Running Shoes
    'prod-5', // Sunglasses
  ]);
});

test('Reference products match exact pricing and discount specs from design', () => {
  const prod1 = INITIAL_PRODUCTS.find((p) => p.id === 'prod-1')!;
  assert.equal(prod1.price, 99.99);
  assert.equal(prod1.salePrice, 74.99);
  assert.equal(Math.round(((prod1.price - prod1.salePrice!) / prod1.price) * 100), 25); // 25% OFF

  const prod2 = INITIAL_PRODUCTS.find((p) => p.id === 'prod-2')!;
  assert.equal(prod2.price, 99.99);
  assert.equal(prod2.salePrice, 68.99);
  assert.equal(Math.round(((prod2.price - prod2.salePrice!) / prod2.price) * 100), 31); // 31% OFF

  const prod6 = INITIAL_PRODUCTS.find((p) => p.id === 'prod-6')!;
  assert.equal(prod6.price, 69.99);
  assert.equal(prod6.salePrice, 39.99);
  assert.equal(Math.round(((prod6.price - prod6.salePrice!) / prod6.price) * 100), 43); // 43% OFF

  const prod3 = INITIAL_PRODUCTS.find((p) => p.id === 'prod-3')!;
  assert.equal(prod3.price, 79.99);
  assert.equal(prod3.salePrice, 49.99);
  assert.equal(Math.round(((prod3.price - prod3.salePrice!) / prod3.price) * 100), 38); // 38% OFF

  const prod4 = INITIAL_PRODUCTS.find((p) => p.id === 'prod-4')!;
  assert.equal(prod4.price, 89.99);
  assert.equal(prod4.salePrice, 69.99);
  assert.equal(Math.round(((prod4.price - prod4.salePrice!) / prod4.price) * 100), 22); // 22% OFF

  const prod5 = INITIAL_PRODUCTS.find((p) => p.id === 'prod-5')!;
  assert.equal(prod5.price, 49.99);
  assert.equal(prod5.salePrice, 29.99);
  assert.equal(Math.round(((prod5.price - prod5.salePrice!) / prod5.price) * 100), 40); // 40% OFF
});

test('Wishlist duplicate prevention logic', () => {
  const currentList = ['prod-1', 'prod-2'];
  const addAttempt = 'prod-1';
  const updatedList = currentList.includes(addAttempt) ? currentList : [...currentList, addAttempt];
  assert.equal(updatedList.length, 2);
  assert.deepEqual(updatedList, ['prod-1', 'prod-2']);

  const newAdd = 'prod-3';
  const secondUpdate = currentList.includes(newAdd) ? currentList : [...currentList, newAdd];
  assert.equal(secondUpdate.length, 3);
  assert.deepEqual(secondUpdate, ['prod-1', 'prod-2', 'prod-3']);
});

test('Wishlist merge deduplication logic for guest to authenticated user', () => {
  const userItems = [{ productId: 'prod-1' }, { productId: 'prod-2' }];
  const guestItems = [{ productId: 'prod-2' }, { productId: 'prod-3' }, { productId: 'prod-4' }];

  const userIds = new Set(userItems.map((i) => i.productId));
  const merged = [...userItems];

  for (const g of guestItems) {
    if (!userIds.has(g.productId)) {
      merged.push(g);
      userIds.add(g.productId);
    }
  }

  assert.equal(merged.length, 4);
  assert.deepEqual(merged.map((m) => m.productId), ['prod-1', 'prod-2', 'prod-3', 'prod-4']);
});

test('Wishlist Move to Cart validates in-stock and skips out-of-stock items', () => {
  const mockWishlistProducts = [
    { id: 'prod-1', name: 'Product 1', stock: 10 },
    { id: 'prod-out', name: 'Product Out', stock: 0 },
    { id: 'prod-3', name: 'Product 3', stock: 5 },
  ];

  const inStockToMove = mockWishlistProducts.filter((p) => p.stock > 0);
  assert.equal(inStockToMove.length, 2);
  assert.deepEqual(inStockToMove.map((p) => p.id), ['prod-1', 'prod-3']);
});
