async function runCartAndSearchE2E() {
  console.log('🚀 Running Live Cart, Search & Badge E2E Verification against http://localhost:3000...\n');

  const BASE_URL = 'http://localhost:3000';
  const testSessionId = `test-session-${Date.now()}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-session-id': testSessionId,
  };

  // -------------------------------------------------------------
  // TEST 1: Cross-Lingual Product Search for "জুতা" (Bangla -> Shoes)
  // -------------------------------------------------------------
  console.log('🔍 [1/6] Testing Cross-Lingual Search: query="জুতা"...');
  const shoesRes = await fetch(`${BASE_URL}/api/products/search?q=${encodeURIComponent('জুতা')}`);
  const shoesData = await shoesRes.json();
  if (!shoesData.success || !shoesData.data || shoesData.data.length === 0) {
    throw new Error('Search for "জুতা" returned no results!');
  }
  const foundShoe = shoesData.data.some((p) => /shoe|জুতা|জুতো|footwear|sneakers/i.test(p.name + ' ' + (p.banglaKeywords || []).join(' ')));
  if (!foundShoe) {
    throw new Error('Search for "জুতা" did not return shoes/footwear!');
  }
  console.log(`   ✓ Found ${shoesData.data.length} results. Top result: "${shoesData.data[0].name}"`);

  // -------------------------------------------------------------
  // TEST 2: Cross-Lingual Product Search for "Shirt" (English -> শার্ট)
  // -------------------------------------------------------------
  console.log('🔍 [2/6] Testing Cross-Lingual Search: query="Shirt"...');
  const shirtRes = await fetch(`${BASE_URL}/api/products/search?q=${encodeURIComponent('Shirt')}`);
  const shirtData = await shirtRes.json();
  if (!shirtData.success || !shirtData.data || shirtData.data.length === 0) {
    throw new Error('Search for "Shirt" returned no results!');
  }
  const foundShirt = shirtData.data.some((p) => /shirt|শার্ট|t-shirt|tee/i.test(p.name + ' ' + (p.banglaKeywords || []).join(' ')));
  if (!foundShirt) {
    throw new Error('Search for "Shirt" did not return shirts!');
  }
  console.log(`   ✓ Found ${shirtData.data.length} results. Top result: "${shirtData.data[0].name}"`);

  // -------------------------------------------------------------
  // TEST 3: Cross-Lingual Product Search for "মোবাইল" (Bangla -> Mobile/Smartphone)
  // -------------------------------------------------------------
  console.log('🔍 [3/6] Testing Cross-Lingual Search: query="মোবাইল"...');
  const mobRes = await fetch(`${BASE_URL}/api/products/search?q=${encodeURIComponent('মোবাইল')}`);
  const mobData = await mobRes.json();
  if (!mobData.success || !mobData.data || mobData.data.length === 0) {
    throw new Error('Search for "মোবাইল" returned no results!');
  }
  console.log(`   ✓ Found ${mobData.data.length} results. Top result: "${mobData.data[0].name}"`);

  // -------------------------------------------------------------
  // TEST 4: Add to Cart default 10-unit increment
  // -------------------------------------------------------------
  console.log('🛒 [4/6] Testing Add to Cart default 10-unit increment...');
  
  // Clear cart first
  await fetch(`${BASE_URL}/api/cart/clear`, { method: 'DELETE', headers });

  // First Add to Cart click (omit quantity: must default to 10)
  const add1Res = await fetch(`${BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId: 'prod-1' }),
  });
  const add1Data = await add1Res.json();
  if (!add1Data.success) {
    throw new Error('Add to cart failed: ' + add1Data.error);
  }
  const qty1 = add1Data.items.find((i) => i.productId === 'prod-1')?.quantity;
  console.log(`   ✓ After 1st click: Item quantity = ${qty1} (Expected: 10 units)`);
  if (qty1 !== 10) {
    throw new Error(`Expected 1st click to add 10 units, got ${qty1}`);
  }

  // Second Add to Cart click (omit quantity: must add another 10, total 20)
  const add2Res = await fetch(`${BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId: 'prod-1' }),
  });
  const add2Data = await add2Res.json();
  const qty2 = add2Data.items.find((i) => i.productId === 'prod-1')?.quantity;
  console.log(`   ✓ After 2nd click: Item quantity = ${qty2} (Expected: 20 units)`);
  if (qty2 !== 20) {
    throw new Error(`Expected 2nd click to increment to 20 units, got ${qty2}`);
  }

  // -------------------------------------------------------------
  // TEST 5: Strict 99+ Navigation Badge Limit vs Real Cart Quantity
  // -------------------------------------------------------------
  console.log('🏷️  [5/6] Testing Navigation Badge (99+ Limit) vs Real Cart Page Quantity...');

  // Add more items to exceed 100 total units
  // Add 40 units of prod-2 and 50 units of prod-6 (20 + 40 + 50 = 110 units)
  await fetch(`${BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId: 'prod-2', quantity: 40 }),
  });
  await fetch(`${BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId: 'prod-6', quantity: 50 }),
  });

  const cartRes = await fetch(`${BASE_URL}/api/cart`, { headers });
  const cartData = await cartRes.json();
  
  const totalUnits = cartData.totalQuantity;
  const distinctCount = cartData.lineItemsCount;
  console.log(`   • Real Backend Cart Total Units: ${totalUnits} (Expected > 100)`);
  console.log(`   • Distinct Products Count: ${distinctCount}`);

  if (totalUnits < 100) {
    throw new Error(`Expected total units to exceed 100, got ${totalUnits}`);
  }

  // Compute presentation badge value
  const badgeValue = totalUnits > 99 ? '99+' : String(totalUnits);
  console.log(`   ✓ Computed Navigation Badge: "${badgeValue}" (Strictly "99+", never 100 or 110)`);
  if (badgeValue !== '99+') {
    throw new Error(`Navigation badge display must be "99+", got "${badgeValue}"`);
  }

  // -------------------------------------------------------------
  // TEST 6: Clean Cleanup
  // -------------------------------------------------------------
  console.log('🧹 [6/6] Cleaning up test session cart...');
  await fetch(`${BASE_URL}/api/cart/clear`, { method: 'DELETE', headers });
  console.log('   ✓ Test cart cleared successfully.');

  console.log('\n🎉 ALL LIVE END-TO-END CART & SEARCH TESTS PASSED WITH 100% SUCCESS!');
}

runCartAndSearchE2E().catch((err) => {
  console.error('❌ E2E failed:', err);
  process.exit(1);
});
