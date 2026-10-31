import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setWishlistProductIds } from '../features/ui/uiSlice';
import { fetchWishlist } from '../utils/wishlistApi';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { CartDrawer } from '../components/cart/CartDrawer';
import { AuthModal } from '../components/modal/AuthModal';
import { ToastContainer } from '../components/feedback/ToastContainer';

interface StorefrontLayoutProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  children: React.ReactNode;
}

export const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({
  currentView,
  onNavigate,
  children,
}) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    let isMounted = true;
    fetchWishlist()
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.productIds)) {
          dispatch(setWishlistProductIds(data.productIds));
        }
      })
      .catch((err) => {
        console.warn('Initial wishlist sync from server:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch, isAuthenticated]);
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans selection:bg-emerald-100 selection:text-emerald-950">
      {/* 1. Customer-facing Header with announcement bar, search, badges, and user navigation */}
      <Header currentView={currentView} onNavigate={onNavigate} />

      {/* 2. Main Storefront Content Area */}
      <main className="flex-1">
        {children}
      </main>

      {/* 3. Customer-facing Footer matching ShopMax aesthetic */}
      <Footer onNavigate={onNavigate} />

      {/* 4. Global Overlays & Modals specific to storefront shopping */}
      <CartDrawer
        onNavigateToCheckout={() => onNavigate('checkout')}
        onNavigateToShop={() => onNavigate('shop')}
      />
      <AuthModal />
      <ToastContainer />
    </div>
  );
};
