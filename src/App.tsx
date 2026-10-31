import React, { useState, useEffect, useCallback } from 'react';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { StorefrontLayout } from './layouts/StorefrontLayout';
import { AdminLayout } from './admin/layouts/AdminLayout';
import { CartFlyProvider } from './context/CartFlyContext';
import { GlobalReloadOverlay } from './components/common/GlobalReloadOverlay';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CustomerAccountPage } from './pages/CustomerAccountPage';
import { WishlistPage } from './pages/WishlistPage';
import { AboutPage } from './pages/AboutPage';
import { BlogPage } from './pages/BlogPage';
import { ContactPage } from './pages/ContactPage';
import { CartPage } from './pages/CartPage';

function AppContent() {
  // Parse initial route from browser URL
  const getInitialState = () => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      const parts = path.split('/').filter(Boolean);
      const mod = parts[1] || 'dashboard';
      return { view: 'admin', params: { module: mod } };
    }
    if (path.startsWith('/shop')) {
      const searchParams = new URLSearchParams(window.location.search);
      const q = searchParams.get('q') || '';
      const cat = searchParams.get('category') || '';
      return { view: 'shop', params: { q, category: cat } };
    }
    if (path.startsWith('/cart')) {
      return { view: 'cart', params: {} };
    }
    if (path.startsWith('/product/')) {
      const slug = path.replace('/product/', '');
      return { view: 'product', params: { slug } };
    }
    if (path.startsWith('/checkout')) {
      return { view: 'checkout', params: {} };
    }
    if (path.startsWith('/account')) {
      return { view: 'account', params: {} };
    }
    if (path.startsWith('/wishlist')) {
      return { view: 'wishlist', params: {} };
    }
    if (path.startsWith('/blog/')) {
      const slug = path.replace('/blog/', '');
      return { view: 'blog', params: { slug } };
    }
    if (path.startsWith('/blog')) {
      return { view: 'blog', params: {} };
    }
    if (path.startsWith('/about')) {
      return { view: 'about', params: {} };
    }
    if (path.startsWith('/contact')) {
      return { view: 'contact', params: {} };
    }
    return { view: 'home', params: {} };
  };

  const [currentView, setCurrentView] = useState<string>(() => getInitialState().view);
  const [viewParams, setViewParams] = useState<any>(() => getInitialState().params);

  // Synchronize history state
  const handleNavigate = useCallback((view: string, params: any = {}) => {
    setCurrentView(view);
    setViewParams(params);

    // Update browser URL seamlessly
    let targetPath = '/';
    if (view === 'home') targetPath = '/';
    else if (view === 'admin') targetPath = params.module ? `/admin/${params.module}` : '/admin';
    else if (view === 'shop') {
      const qp = new URLSearchParams();
      if (params.category && params.category !== 'all') qp.set('category', params.category);
      if (params.q) qp.set('q', params.q);
      const qs = qp.toString();
      targetPath = qs ? `/shop?${qs}` : '/shop';
    }
    else if (view === 'cart') targetPath = '/cart';
    else if (view === 'product') targetPath = `/product/${params.slug || 'wireless-headphones'}`;
    else if (view === 'checkout') targetPath = '/checkout';
    else if (view === 'account') targetPath = '/account';
    else if (view === 'wishlist') targetPath = '/wishlist';
    else if (view === 'blog') targetPath = params.slug ? `/blog/${params.slug}` : '/blog';
    else if (view === 'about') targetPath = '/about';
    else if (view === 'contact') targetPath = '/contact';

    const currentFull = window.location.pathname + window.location.search;
    if (currentFull !== targetPath) {
      window.history.pushState({ view, params }, '', targetPath);
    }
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.view) {
        setCurrentView(e.state.view);
        setViewParams(e.state.params || {});
      } else {
        const initial = getInitialState();
        setCurrentView(initial.view);
        setViewParams(initial.params);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, viewParams]);

  // 1. ISOLATED ADMIN LAYOUT: Completely independent layout with zero customer header/footer
  if (currentView === 'admin') {
    return (
      <AdminLayout
        initialModule={viewParams.module || 'dashboard'}
        onGoToStorefront={() => handleNavigate('home')}
      />
    );
  }

  // 2. STOREFRONT LAYOUT: Public storefront layout with customer navbar, search, cart drawer, and footer
  return (
    <StorefrontLayout currentView={currentView} onNavigate={handleNavigate}>
      {currentView === 'home' && (
        <HomePage onNavigate={handleNavigate} />
      )}

      {currentView === 'shop' && (
        <ShopPage
          key={`${viewParams.q || ''}-${viewParams.category || ''}`}
          initialCategory={viewParams.category}
          initialQuery={viewParams.q}
          onViewProduct={(slug) => handleNavigate('product', { slug })}
        />
      )}

      {currentView === 'cart' && (
        <CartPage
          onNavigate={handleNavigate}
          onNavigateToCheckout={() => handleNavigate('checkout')}
          onNavigateToShop={() => handleNavigate('shop')}
          onViewProduct={(slug) => handleNavigate('product', { slug })}
        />
      )}

      {currentView === 'product' && (
        <ProductDetailPage
          slug={viewParams.slug || 'wireless-headphones'}
          onNavigateToShop={() => handleNavigate('shop')}
          onNavigateToCheckout={() => handleNavigate('checkout')}
          onViewProduct={(slug) => handleNavigate('product', { slug })}
        />
      )}

      {currentView === 'checkout' && (
        <CheckoutPage
          onOrderSuccess={(order) => handleNavigate('account', { tab: 'orders' })}
          onNavigateToShop={() => handleNavigate('shop')}
        />
      )}

      {currentView === 'account' && (
        <CustomerAccountPage
          initialTab={viewParams.tab || 'orders'}
          onNavigateToShop={() => handleNavigate('shop')}
        />
      )}

      {currentView === 'wishlist' && (
        <WishlistPage
          onViewProduct={(slug) => handleNavigate('product', { slug })}
          onNavigateToShop={() => handleNavigate('shop')}
          onNavigateToContact={() => handleNavigate('contact')}
        />
      )}

      {currentView === 'about' && (
        <AboutPage onNavigate={handleNavigate} />
      )}

      {currentView === 'blog' && (
        <BlogPage initialSlug={viewParams.slug} onNavigate={handleNavigate} />
      )}

      {currentView === 'contact' && (
        <ContactPage />
      )}
    </StorefrontLayout>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <CartFlyProvider>
        <GlobalReloadOverlay />
        <AppContent />
      </CartFlyProvider>
    </Provider>
  );
}
