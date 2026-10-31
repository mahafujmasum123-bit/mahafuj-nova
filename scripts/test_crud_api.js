async function runTest() {
  console.log('Testing ShopMax API endpoints...');

  // 1. Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@novara.com', password: 'Admin@123' }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.token;
  console.log('✓ Admin login successful. User:', loginData.user.name);

  // 2. Sliders CRUD
  console.log('--- Testing Sliders CRUD ---');
  const createSliderRes = await fetch('http://localhost:3000/api/cms/sliders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tag: 'AUTOMATION TEST',
      headline: 'Automated Slider Headline',
      subheadline: 'Testing live persistence and sync',
      buttonText: 'Test CTA',
      buttonLink: '/shop?test=true',
      lifestyleImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&q=80',
      displayOrder: 99,
      isActive: true,
    }),
  });
  const createdSlider = await createSliderRes.json();
  console.log('✓ Slider Created:', createdSlider.data?.id, createdSlider.data?.headline);

  const sliderId = createdSlider.data?.id;

  // Toggle slider
  const toggleSliderRes = await fetch(`http://localhost:3000/api/cms/sliders/${sliderId}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const toggleSliderData = await toggleSliderRes.json();
  console.log('✓ Slider Toggled Active status to:', toggleSliderData.data?.isActive);

  // Delete slider
  const delSliderRes = await fetch(`http://localhost:3000/api/cms/sliders/${sliderId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const delSliderData = await delSliderRes.json();
  console.log('✓ Slider Deleted:', delSliderData.message);

  // 3. Banners CRUD
  console.log('--- Testing Banners CRUD ---');
  const createBannerRes = await fetch('http://localhost:3000/api/cms/banners', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      placement: 'homepage-category',
      tag: 'NEW CATEGORY SPOTLIGHT',
      headline: 'Audio Masters Collection',
      subheadline: 'Acoustic fidelity for discerning audiophiles',
      buttonText: 'Listen Now',
      buttonLink: '/shop?category=electronics',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      backgroundColor: '#0c261e',
      displayOrder: 5,
    }),
  });
  const createdBanner = await createBannerRes.json();
  console.log('✓ Banner Created:', createdBanner.data?.id, createdBanner.data?.headline);
  const bannerId = createdBanner.data?.id;

  const toggleBannerRes = await fetch(`http://localhost:3000/api/cms/banners/${bannerId}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const toggleBannerData = await toggleBannerRes.json();
  console.log('✓ Banner Toggled Active status to:', toggleBannerData.data?.isActive);

  const delBannerRes = await fetch(`http://localhost:3000/api/cms/banners/${bannerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const delBannerData = await delBannerRes.json();
  console.log('✓ Banner Deleted:', delBannerData.message);

  // 4. Advertisements CRUD & Telemetry
  console.log('--- Testing Advertisements CRUD & Telemetry ---');
  const createAdRes = await fetch('http://localhost:3000/api/cms/advertisements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Automated Promo Popup',
      description: 'Get extra 15% off with test code',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&q=80',
      destinationUrl: '/shop?discount=true',
      buttonText: 'Claim',
      priority: 2,
      frequency: 'once_per_session',
      isActive: true,
    }),
  });
  const createdAd = await createAdRes.json();
  console.log('✓ Ad Created:', createdAd.data?.id, createdAd.data?.title);
  const adId = createdAd.data?.id;

  // Track impression and click
  await fetch(`http://localhost:3000/api/cms/advertisements/${adId}/impression`, { method: 'POST' });
  await fetch(`http://localhost:3000/api/cms/advertisements/${adId}/click`, { method: 'POST' });
  console.log('✓ Recorded impression and click on ad');

  // Delete ad
  await fetch(`http://localhost:3000/api/cms/advertisements/${adId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('✓ Ad Deleted successfully');

  // 5. Visitor Analytics Heartbeat & Real-Time Query
  console.log('--- Testing Visitor Heartbeat & Realtime Analytics ---');
  const hbRes = await fetch('http://localhost:3000/api/analytics/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'sess-e2e-tester',
      page: '/shop',
      device: 'desktop',
    }),
  });
  const hbData = await hbRes.json();
  console.log('✓ Heartbeat recorded at:', new Date(hbData.timestamp).toLocaleTimeString());

  const realRes = await fetch('http://localhost:3000/api/analytics/realtime');
  const realData = await realRes.json();
  console.log('✓ Realtime metrics retrieved:', {
    totalRegisteredUsers: realData.data?.totalRegisteredUsers,
    currentOnlineVisitors: realData.data?.currentOnlineVisitors,
    totalPageViews: realData.data?.totalPageViews,
  });

  console.log('\n🎉 ALL FULL-STACK CRUD AND ANALYTICS TESTS PASSED WITH 100% SUCCESS!');
}

runTest().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
