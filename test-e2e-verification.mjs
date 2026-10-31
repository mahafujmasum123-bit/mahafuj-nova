import { chromium } from 'playwright';

async function main() {
  console.log('🚀 Launching automated Playwright browser test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Visit Home
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log('✅ Page loaded successfully: ', await page.title());

  // 2. Initial badge: should not exist or be 0
  let initialBadge = await page.$('[data-testid="navigation-cart-badge"]');
  console.log('Initial badge present:', !!initialBadge);

  // 3. Find first "Add to Cart" button on product card
  const addButtons = page.locator('button:has-text("Add to Cart")');
  const count = await addButtons.count();
  console.log(`Found ${count} "Add to Cart" buttons on page.`);
  if (count === 0) {
    throw new Error('No Add to Cart button found!');
  }

  // 4. Click Add to Cart once (should add 10 units)
  await addButtons.first().click();
  await page.waitForTimeout(500);

  const badgeAfter1 = await page.locator('[data-testid="navigation-cart-badge"]').textContent();
  console.log(`Cart badge after 1st click: "${badgeAfter1}" (Expected: "10")`);
  if (badgeAfter1 !== '10') {
    throw new Error(`Expected badge to be "10", got "${badgeAfter1}"`);
  }

  // 5. Click Add to Cart 2nd time (should increment by 10 to 20 units)
  await addButtons.first().click();
  await page.waitForTimeout(500);

  const badgeAfter2 = await page.locator('[data-testid="navigation-cart-badge"]').textContent();
  console.log(`Cart badge after 2nd click: "${badgeAfter2}" (Expected: "20")`);
  if (badgeAfter2 !== '20') {
    throw new Error(`Expected badge to be "20", got "${badgeAfter2}"`);
  }

  // 6. Click more times across cards to exceed 100 units
  // Let's click 9 more times (20 + 9*10 = 110)
  for (let i = 0; i < 8; i++) {
    // Pick different cards if available or same card
    const targetBtn = addButtons.nth(i % count);
    await targetBtn.click();
    await page.waitForTimeout(200);
  }

  const badgeOver100 = await page.locator('[data-testid="navigation-cart-badge"]').textContent();
  console.log(`Cart badge after 100+ units: "${badgeOver100}" (Expected strictly "99+")`);
  if (badgeOver100 !== '99+') {
    throw new Error(`Expected badge to be strictly "99+", got "${badgeOver100}"`);
  }

  // 7. Navigate to Cart Page to verify unclipped true total quantity
  await page.click('button[aria-label="Shopping Cart"]');
  await page.waitForTimeout(600);

  const cartTotalQtyEl = page.locator('[data-testid="cart-page-total-quantity"]');
  const cartTotalQtyText = await cartTotalQtyEl.textContent();
  console.log(`Cart Page Total Quantity: "${cartTotalQtyText}" (Expected actual number e.g. 100+)`);

  const distinctProdEl = page.locator('[data-testid="cart-page-distinct-products"]');
  const distinctProdText = await distinctProdEl.textContent();
  console.log(`Cart Page Distinct Products: "${distinctProdText}"`);

  // Verify that cart page total quantity is NOT "99+" but the actual numerical total
  if (cartTotalQtyText?.includes('99+')) {
    throw new Error(`Cart page total quantity should NOT be capped to 99+! Got: ${cartTotalQtyText}`);
  }

  // 8. Test Cross-Lingual Search for "জুতা" (Bangla for shoes)
  console.log('\n🔍 Testing Cross-Lingual Search for "জুতা"...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const searchInput = page.locator('input[placeholder*="Search"]').first();
  await searchInput.fill('জুতা');
  await searchInput.press('Enter');
  await page.waitForTimeout(800);

  let searchResults = await page.locator('text=/Shoes|জুতা/i').count();
  console.log(`Search for "জুতা" matched ${searchResults} elements.`);
  if (searchResults === 0) {
    throw new Error('Search for "জুতা" failed to return shoes/footwear!');
  }

  // 9. Test Cross-Lingual Search for "Shirt" (English for শার্ট)
  console.log('\n🔍 Testing Cross-Lingual Search for "Shirt"...');
  await searchInput.fill('Shirt');
  await searchInput.press('Enter');
  await page.waitForTimeout(800);

  let shirtResults = await page.locator('text=/Shirt|শার্ট/i').count();
  console.log(`Search for "Shirt" matched ${shirtResults} elements.`);
  if (shirtResults === 0) {
    throw new Error('Search for "Shirt" failed to return shirts/t-shirts!');
  }

  // 10. Test Cross-Lingual Search for "মোবাইল" (Bangla for mobile/smartphone)
  console.log('\n🔍 Testing Cross-Lingual Search for "মোবাইল"...');
  await searchInput.fill('মোবাইল');
  await searchInput.press('Enter');
  await page.waitForTimeout(800);

  let mobileResults = await page.locator('text=/Smartphone|মোবাইল|ফোন/i').count();
  console.log(`Search for "মোবাইল" matched ${mobileResults} elements.`);
  if (mobileResults === 0) {
    throw new Error('Search for "মোবাইল" failed to return smartphone!');
  }

  // Take screenshot for visual confirmation
  await page.screenshot({ path: 'verification-success.png', fullPage: false });
  console.log('\n🎉 ALL END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!');

  await browser.close();
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
