import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toggleCartDrawer } from '../../features/cart/cartSlice';
import { openAuthModal, logout } from '../../features/auth/authSlice';
import { addToast } from '../../features/toast/toastSlice';
import { formatCartBadge } from '../../utils/ecommerceRules';
import { useCartFly } from '../../context/CartFlyContext';
import { SearchBar } from './SearchBar';
import {
  Truck,
  ShieldCheck,
  Headphones,
  User as UserIcon,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
  MapPin,
  Settings,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const dispatch = useAppDispatch();
  const totalQuantity = useAppSelector((state) => state.cart.totalQuantity);
  const lineItemsCount = useAppSelector((state) => state.cart.lineItemsCount);
  const finalTotal = useAppSelector((state) => state.cart.finalTotal);
  const wishlistCount = useAppSelector((state) => state.ui.wishlistProductIds.length);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { isCartBouncing } = useCartFly();

  const cartBadgeDisplay = formatCartBadge(totalQuantity);

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close account menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setAccountMenuOpen(false);
    dispatch(addToast({ type: 'info', message: 'You have been signed out.' }));
  };

  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Fashion', slug: 'fashion' },
    { name: 'Home & Living', slug: 'home-living' },
    { name: 'Beauty & Personal Care', slug: 'beauty-personal-care' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
    { name: 'Toys & Games', slug: 'toys-games' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-2xs">
      {/* 1. Top Announcement Bar (Faithful to Reference Image) */}
      <div className="bg-[#0c261e] text-white text-[11px] sm:text-xs py-2 px-4 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-normal text-emerald-100">Free shipping on orders over $50</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-normal text-emerald-100">30 Days Money Back Guarantee</span>
          </div>

          <div className="flex items-center gap-2">
            <Headphones className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-normal text-emerald-100">24/7 Customer Support</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo matching ShopMax visual direction */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-900/10 group-hover:bg-emerald-900 transition">
            <ShoppingBag className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 flex items-center gap-0.5">
              <span>Shop</span>
              <span className="text-emerald-700">Max</span>
            </div>
            <div className="text-[10px] text-gray-400 font-medium tracking-wider -mt-1 uppercase">
              Better Products, Better Life
            </div>
          </div>
        </div>

        {/* Center Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-gray-700">
          <button
            onClick={() => onNavigate('home')}
            className={`py-1 transition-colors relative cursor-pointer ${
              currentView === 'home'
                ? 'text-emerald-800 font-semibold'
                : 'text-gray-600 hover:text-emerald-800'
            }`}
          >
            Home
            {currentView === 'home' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onNavigate('shop')}
            className={`py-1 transition-colors relative cursor-pointer ${
              currentView === 'shop'
                ? 'text-emerald-800 font-semibold'
                : 'text-gray-600 hover:text-emerald-800'
            }`}
          >
            Shop
            {currentView === 'shop' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full" />
            )}
          </button>

          {/* Categories Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setCategoriesDropdownOpen(true)}
            onMouseLeave={() => setCategoriesDropdownOpen(false)}
          >
            <button
              onClick={() => onNavigate('shop')}
              className="flex items-center gap-1 py-1 text-gray-600 hover:text-emerald-800 transition cursor-pointer"
            >
              <span>Categories</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {categoriesDropdownOpen && (
              <div className="absolute top-full left-0 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => {
                      onNavigate('shop', { category: c.slug });
                      setCategoriesDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('about')}
            className={`py-1 transition-colors relative cursor-pointer ${
              currentView === 'about'
                ? 'text-emerald-800 font-semibold'
                : 'text-gray-600 hover:text-emerald-800'
            }`}
          >
            About
          </button>

          <button
            onClick={() => onNavigate('blog')}
            className={`py-1 transition-colors relative cursor-pointer ${
              currentView === 'blog'
                ? 'text-emerald-800 font-semibold'
                : 'text-gray-600 hover:text-emerald-800'
            }`}
          >
            Blog
          </button>

          <button
            onClick={() => onNavigate('contact')}
            className={`py-1 transition-colors relative cursor-pointer ${
              currentView === 'contact'
                ? 'text-emerald-800 font-semibold'
                : 'text-gray-600 hover:text-emerald-800'
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Center-Right Search Bar (Hidden on Wishlist desktop to match reference image design) */}
        {currentView !== 'wishlist' && (
          <div className="hidden sm:block flex-1 max-w-xs md:max-w-sm mx-2">
            <SearchBar
              onSelectProduct={(slug) => onNavigate('product', { slug })}
              onSubmitSearch={(q) => onNavigate('shop', { q })}
            />
          </div>
        )}

        {/* Right Utility Icons (Account, Wishlist, Cart) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Account Icon & Popup Menu */}
          <div ref={accountMenuRef} className="relative">
            <button
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="p-2 text-gray-700 hover:text-emerald-800 hover:bg-gray-100 rounded-full transition cursor-pointer relative"
              aria-label="User account"
            >
              <UserIcon className="w-5 h-5" />
              {isAuthenticated && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </button>

            {/* Account popup dropdown */}
            {accountMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2.5 z-50">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-xs font-bold text-gray-900 truncate">{user.name}</div>
                      <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onNavigate('account', { tab: 'orders' });
                        setAccountMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
                    >
                      <Package className="w-4 h-4 text-gray-400" />
                      <span>My Orders</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('account', { tab: 'addresses' });
                        setAccountMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>Saved Addresses</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('account', { tab: 'settings' });
                        setAccountMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setAccountMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-emerald-800 hover:bg-emerald-50 flex items-center gap-2.5 transition border-t border-gray-100 mt-1 pt-2"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span>Admin Management</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition border-t border-gray-100 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="p-3 text-center">
                    <p className="text-xs font-semibold text-gray-800 mb-1">Customer Account</p>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Sign in to track orders, manage addresses, and checkout.
                    </p>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => {
                          dispatch(openAuthModal({ mode: 'login' }));
                          setAccountMenuOpen(false);
                        }}
                        className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl transition"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          dispatch(openAuthModal({ mode: 'register' }));
                          setAccountMenuOpen(false);
                        }}
                        className="w-full py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-xl transition"
                      >
                        Create Account
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setAccountMenuOpen(false);
                        }}
                        className="w-full text-center text-[10px] text-gray-400 hover:text-emerald-700 transition pt-1 cursor-pointer block"
                      >
                        Staff & Admin Access →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wishlist Icon with count badge "2" */}
          <button
            onClick={() => onNavigate('wishlist')}
            className="p-2 text-gray-700 hover:text-emerald-800 hover:bg-gray-100 rounded-full transition cursor-pointer relative"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4.5 h-4.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Dedicated Cart Page button with strict 99+ display limit using totalQuantity */}
          <button
            onClick={() => onNavigate('cart')}
            data-testid="navigation-cart-button"
            className={`p-2 rounded-full transition cursor-pointer relative ${
              isCartBouncing ? 'cart-icon-bounce ring-2 ring-emerald-500 scale-110 shadow-md' : ''
            } ${
              currentView === 'cart'
                ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300'
                : 'text-gray-700 hover:text-emerald-800 hover:bg-gray-100'
            }`}
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartBadgeDisplay && (
              <span
                data-testid="navigation-cart-badge"
                className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs"
              >
                {cartBadgeDisplay}
              </span>
            )}
          </button>

          {/* Mobile Hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-full transition"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search input */}
      <div className="sm:hidden px-4 pb-3">
        <SearchBar
          onSelectProduct={(slug) => onNavigate('product', { slug })}
          onSubmitSearch={(q) => onNavigate('shop', { q })}
        />
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2.5">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-semibold text-gray-800"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('shop');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-semibold text-gray-800"
          >
            Shop All
          </button>
          <div className="py-2 border-y border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categories</div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => {
                    onNavigate('shop', { category: c.slug });
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-xs text-gray-600 hover:text-emerald-800 py-1"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              onNavigate('about');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-gray-700"
          >
            About Us
          </button>
          <button
            onClick={() => {
              onNavigate('blog');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-gray-700"
          >
            Blog & Insights
          </button>
          <button
            onClick={() => {
              onNavigate('contact');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-gray-700"
          >
            Contact & Support
          </button>
        </div>
      )}
    </header>
  );
};
