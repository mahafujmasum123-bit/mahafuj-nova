import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  removeFromCart,
  updateQuantity,
  toggleSelectItem,
  selectAllItems,
  applyCoupon,
  removeCoupon,
  clearCart,
  resetToDemoCart,
  addToCart,
} from '../features/cart/cartSlice';
import { openAuthModal } from '../features/auth/authSlice';
import { addToast } from '../features/toast/toastSlice';
import { DEFAULT_ADD_TO_CART_QUANTITY } from '../utils/ecommerceRules';
import { useCartFly } from '../context/CartFlyContext';
import { useDelayedSkeleton } from '../hooks/useDelayedSkeleton';
import { CartSkeleton } from '../components/skeletons/CartSkeleton';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Check,
  Tag,
  Truck,
  ShieldCheck,
  Lock,
  ArrowRight,
  ChevronRight,
  Star,
  ShoppingCart,
  X,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { INITIAL_PRODUCTS, SeedProduct } from '../../server/data/initialData';

interface CartPageProps {
  onNavigate: (view: string, params?: any) => void;
  onNavigateToCheckout: () => void;
  onNavigateToShop: () => void;
  onViewProduct?: (slug: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onNavigate,
  onNavigateToCheckout,
  onNavigateToShop,
  onViewProduct,
}) => {
  const dispatch = useAppDispatch();
  const {
    items,
    coupon,
    subtotal,
    discount,
    shippingFee,
    finalTotal,
    lineItemsCount,
    selectedItemsCount,
    totalQuantity,
    isLoading,
  } = useAppSelector((state) => state.cart);

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { triggerCartFly } = useCartFly();

  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Recommendations for "You May Also Like" (5 items matching reference image)
  const recommendedSlugs = [
    'wireless-earbuds-pro',
    'smart-watch',
    'commuter-backpack',
    'pro-running-shoes',
    'polaroid-sunglasses',
  ];

  const recommendedProducts: SeedProduct[] = recommendedSlugs
    .map((slug) => INITIAL_PRODUCTS.find((p) => p.slug === slug))
    .filter(Boolean) as SeedProduct[];

  // Determine if all items are selected
  const allSelected = items.length > 0 && items.every((i) => i.selected !== false);
  const someSelected = items.some((i) => i.selected !== false);

  const handleToggleSelectAll = () => {
    dispatch(selectAllItems(!allSelected));
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setPromoLoading(true);
    try {
      const res = await fetch('/api/cart/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code }),
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.coupon) {
        throw new Error(data.error || `Promo code "${code}" is invalid or expired.`);
      }

      dispatch(applyCoupon(data.coupon));
      dispatch(
        addToast({
          type: 'success',
          title: 'Promo Code Applied',
          message: data.message || `Code ${code} activated!`,
        })
      );
      setPromoInput('');
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Invalid Promo Code', message: err.message }));
    } finally {
      setPromoLoading(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      dispatch(addToast({ type: 'warning', message: 'Your shopping cart is empty.' }));
      return;
    }

    if (selectedItemsCount === 0) {
      dispatch(
        addToast({
          type: 'warning',
          message: 'Please select at least one item to proceed to checkout.',
        })
      );
      return;
    }

    if (!isAuthenticated) {
      dispatch(
        addToast({
          type: 'info',
          title: 'Sign In Required',
          message: 'Please sign in or create an account to complete checkout.',
        })
      );
      dispatch(openAuthModal({ mode: 'login', returnUrl: '/checkout' }));
      return;
    }

    onNavigateToCheckout();
  };

  const handleQuickAddRecommended = (prod: SeedProduct, e?: React.MouseEvent) => {
    if (e && e.currentTarget) {
      triggerCartFly(e.currentTarget as HTMLElement, prod.images[0]?.url || '');
    }

    const qtyToAdd = Math.min(DEFAULT_ADD_TO_CART_QUANTITY, prod.stock > 0 ? prod.stock : 10);
    dispatch(
      addToCart({
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        price: prod.price,
        salePrice: prod.salePrice,
        quantity: DEFAULT_ADD_TO_CART_QUANTITY,
        image: prod.images[0]?.url || '',
        stock: prod.stock,
      })
    );
    dispatch(
      addToast({
        type: 'success',
        title: 'Added to Cart',
        message: `${qtyToAdd}x ${prod.name} added to your cart.`,
      })
    );
  };

  const showSkeleton = useDelayedSkeleton(Boolean(isLoading));

  if (isLoading) {
    if (showSkeleton) {
      return <CartSkeleton />;
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 pb-20">
      {/* 1. TOP HERO BANNER (ShopMax Green Leafy Shopping Cart Aesthetic) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#dcfce7]/70 via-[#f0fdf4] to-[#e8f5e9] border-b border-emerald-100/60">
        {/* Background leafy decorative blur & accents */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left Title & Tagline */}
          <div className="max-w-xl text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              <span className="text-[#107c41]">Shopping</span>{' '}
              <span className="text-gray-900">Cart</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 font-medium">
              Review your items and proceed to checkout
            </p>
          </div>

          {/* Right Hero Visual Banner (Shopping cart & ShopMax branded shopping bag) */}
          <div className="shrink-0 flex items-center justify-center relative">
            <div className="relative w-72 sm:w-80 h-32 sm:h-36 flex items-center justify-center">
              {/* Fresh green potted plant representation */}
              <div className="absolute left-0 bottom-1 flex items-end">
                <div className="text-3xl filter drop-shadow-md select-none">🪴</div>
              </div>

              {/* Shopping Cart with groceries */}
              <div className="relative z-10 flex items-center gap-2 bg-white/70 backdrop-blur-xs p-3 rounded-2xl shadow-sm border border-emerald-100">
                <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-md">
                  <ShoppingCart className="w-6 h-6 text-emerald-200" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">ShopMax Verified Cart</div>
                  <div className="text-[11px] text-emerald-800 font-medium">
                    {totalQuantity} units • {lineItemsCount} distinct {lineItemsCount === 1 ? 'product' : 'products'}
                  </div>
                </div>
              </div>

              {/* Branded ShopMax Green Bag Visual */}
              <div className="absolute right-0 bottom-1 bg-[#0c593f] text-white px-3 py-4 rounded-xl shadow-lg border border-emerald-800 flex flex-col items-center justify-center select-none transform hover:scale-105 transition">
                <ShoppingBag className="w-5 h-5 text-emerald-300 mb-1" />
                <span className="text-[11px] font-extrabold tracking-tight">ShopMax</span>
                <span className="text-[8px] text-emerald-200 uppercase tracking-widest scale-90">Store</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-emerald-700 transition cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-emerald-800 font-semibold">Shopping Cart</span>
        </nav>
      </div>

      {/* 3. MAIN CART WORKSPACE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          /* EMPTY CART STATE */
          <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-gray-100 shadow-xs my-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center mb-5">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Your shopping cart is empty</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 mb-6">
              Looks like you haven't added anything to your cart yet. Explore our featured categories or restore reference items.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onNavigateToShop}
                className="px-6 py-3 bg-[#0c593f] hover:bg-[#0a4d36] text-white text-sm font-bold rounded-xl transition shadow-md shadow-emerald-900/10 cursor-pointer"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => {
                  dispatch(resetToDemoCart());
                  dispatch(
                    addToast({
                      type: 'info',
                      message: 'Reference cart items loaded successfully.',
                    })
                  );
                }}
                className="px-5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-xl transition border border-emerald-200 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Load Reference Cart Items</span>
              </button>
            </div>
          </div>
        ) : (
          /* CART CONTENT: 2-COLUMN LAYOUT */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-4">
            {/* LEFT COLUMN: Items List & Promo Code Box (~65% width) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Cart Container Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
                {/* Top Action Bar: Select All & Clear Cart */}
                <div className="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4.5 h-4.5 rounded text-[#0c593f] focus:ring-[#0c593f] border-gray-300 accent-[#0c593f] cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-800">
                      Select All ({items.length} distinct {items.length === 1 ? 'product' : 'products'} • {totalQuantity} total units)
                    </span>
                  </label>

                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-rose-600 transition cursor-pointer p-1.5 rounded-lg hover:bg-gray-50"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-600" />
                    <span>Clear Cart</span>
                  </button>
                </div>

                {/* Table Header Row (Desktop) */}
                <div className="hidden sm:grid grid-cols-12 px-6 py-3 bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-500 tracking-wider">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-left">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Cart Items List */}
                <div className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const unitPrice = item.salePrice && item.salePrice > 0 ? item.salePrice : item.price;
                    const originalPrice = item.price;
                    const discountPercent =
                      item.salePrice && item.salePrice < item.price
                        ? Math.round(((item.price - item.salePrice) / item.price) * 100)
                        : 0;
                    const itemTotal = unitPrice * item.quantity;
                    const isSelected = item.selected !== false;

                    return (
                      <div
                        key={`${item.productId}-${item.variantId || 'standard'}`}
                        className={`p-4 sm:px-6 sm:py-5 transition-colors ${
                          isSelected ? 'bg-white' : 'bg-gray-50/50 opacity-70'
                        }`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                          {/* Col 1: Checkbox + Thumbnail + Product Title & Details (col-span-6) */}
                          <div className="sm:col-span-6 flex items-start gap-3.5">
                            {/* Checkbox */}
                            <div className="pt-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                aria-label={`Select ${item.name}`}
                                onChange={() =>
                                  dispatch(
                                    toggleSelectItem({
                                      productId: item.productId,
                                      variantId: item.variantId,
                                    })
                                  )
                                }
                                className="w-4.5 h-4.5 rounded text-[#0c593f] focus:ring-[#0c593f] border-gray-300 accent-[#0c593f] cursor-pointer"
                              />
                            </div>

                            {/* Thumbnail */}
                            <div
                              onClick={() => onViewProduct && onViewProduct(item.productId)}
                              className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-gray-50 border border-gray-100 p-1 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>

                            {/* Title & Metadata */}
                            <div className="flex-1 min-w-0 pr-2">
                              <h3
                                onClick={() => onViewProduct && onViewProduct(item.productId)}
                                className="text-xs sm:text-sm font-bold text-gray-900 hover:text-emerald-800 transition cursor-pointer line-clamp-2 leading-snug"
                              >
                                {item.name}
                              </h3>

                              {item.variantName && (
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                  {item.variantName}
                                </p>
                              )}

                              {/* In Stock Badge */}
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-medium text-emerald-800">
                                  In Stock
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Price presentation (col-span-2) */}
                          <div className="sm:col-span-2 flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-1">
                            <span className="sm:hidden text-xs text-gray-500">Price:</span>
                            <div className="text-left">
                              <div className="text-xs sm:text-sm font-bold text-gray-900">
                                ${unitPrice.toFixed(2)}
                              </div>
                              {discountPercent > 0 && (
                                <>
                                  <div className="text-[11px] text-gray-400 line-through">
                                    ${originalPrice.toFixed(2)}
                                  </div>
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-[#0c593f] text-white text-[9px] font-bold tracking-tight">
                                    {discountPercent}% OFF
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Col 3: Quantity selector (col-span-2) */}
                          <div className="sm:col-span-2 flex items-center justify-between sm:justify-center">
                            <span className="sm:hidden text-xs text-gray-500">Quantity:</span>
                            <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                              <button
                                type="button"
                                onClick={() =>
                                  dispatch(
                                    updateQuantity({
                                      productId: item.productId,
                                      variantId: item.variantId,
                                      quantity: item.quantity - 1,
                                    })
                                  )
                                }
                                disabled={item.quantity <= 1}
                                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                                aria-label={`Decrease quantity of ${item.name}`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-gray-900 select-none">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  dispatch(
                                    updateQuantity({
                                      productId: item.productId,
                                      variantId: item.variantId,
                                      quantity: item.quantity + 1,
                                    })
                                  )
                                }
                                disabled={item.quantity >= (item.stock || 99)}
                                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Col 4: Item Total & Remove ✕ Button (col-span-2) */}
                          <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-3">
                            <span className="sm:hidden text-xs text-gray-500">Total:</span>
                            <span className="text-xs sm:text-sm font-bold text-gray-900">
                              ${itemTotal.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                dispatch(
                                  removeFromCart({
                                    productId: item.productId,
                                    variantId: item.variantId,
                                  })
                                )
                              }
                              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Promo Code Card (Faithful to Reference Mockup) */}
              <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0c593f] flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5 text-[#0c593f]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0c593f]">Have a Promo Code?</h4>
                    <p className="text-xs text-emerald-800/80 font-medium">
                      Enter your code to get discount
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {coupon && (
                    <div className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
                      <span className="text-xs font-bold text-[#0c593f]">
                        {coupon.code} (-${discount.toFixed(2)})
                      </span>
                      <button
                        type="button"
                        onClick={() => dispatch(removeCoupon())}
                        className="text-gray-400 hover:text-rose-600 transition cursor-pointer p-0.5"
                        title="Remove promo code"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleApplyPromo} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Enter promo code"
                      className="px-3.5 py-2.5 bg-white text-xs border border-gray-200 rounded-xl uppercase tracking-wider outline-none focus:ring-1 focus:ring-[#0c593f] focus:border-[#0c593f] w-40 sm:w-48 shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={promoLoading || !promoInput.trim()}
                      className="px-5 py-2.5 bg-[#0c593f] hover:bg-[#0a4d36] text-white text-xs font-bold rounded-xl transition disabled:opacity-60 cursor-pointer shadow-xs"
                    >
                      {promoLoading ? 'Checking...' : 'Apply'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary Card (~35% width) */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xs space-y-4">
                {/* Header with pill badge showing real counts */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Order Summary</h2>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                    {lineItemsCount} {lineItemsCount === 1 ? 'product' : 'products'} • {totalQuantity} units
                  </span>
                </div>

                {/* Real Quantity Metrics (Prompt Requirement: clearly display Total Quantity and Distinct Products) */}
                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-900 font-medium">Total Quantity:</span>
                    <span data-testid="cart-page-total-quantity" className="font-bold text-emerald-950 text-sm">
                      {totalQuantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-900 font-medium">Distinct Products:</span>
                    <span data-testid="cart-page-distinct-products" className="font-bold text-emerald-950">
                      {lineItemsCount}
                    </span>
                  </div>
                </div>

                {/* Subtotal row */}
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                  <span>Subtotal ({totalQuantity} units)</span>
                  <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>

                {/* Shipping row */}
                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span>Shipping</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {shippingFee === 0 ? '$0.00' : `$${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  {shippingFee === 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-[#107c41] font-medium mt-1">
                      <span>🚚</span>
                      <span>Free shipping on orders over $50</span>
                    </div>
                  )}
                </div>

                {/* Discount row */}
                {discount > 0 && (
                  <div className="flex items-center justify-between text-xs sm:text-sm text-[#107c41]">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4" />
                      <span>Discount</span>
                    </div>
                    <span className="font-bold">-${discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-gray-900">Total (USD)</span>
                    <span className="text-2xl font-black text-[#107c41] tracking-tight">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Primary Proceed to Checkout button */}
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 bg-[#0c593f] hover:bg-[#094732] text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* OR divider */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-gray-200 w-full" />
                  <span className="bg-white px-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    OR
                  </span>
                </div>

                {/* Express Checkout Alternative Buttons (Faithful to Reference Mockup) */}
                <div className="space-y-2">
                  {/* PayPal button */}
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-bold text-[#003087] shadow-2xs cursor-pointer"
                  >
                    <span className="italic font-black text-sm text-[#003087]">Pay</span>
                    <span className="italic font-black text-sm text-[#0079C1]">Pal</span>
                  </button>

                  {/* Visa & Mastercard button */}
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition flex items-center justify-center gap-3 text-xs font-bold text-gray-700 shadow-2xs cursor-pointer"
                  >
                    <span className="font-black italic tracking-wider text-blue-800 text-sm">
                      VISA
                    </span>
                    <div className="flex items-center -space-x-2">
                      <div className="w-4.5 h-4.5 rounded-full bg-red-500 opacity-90" />
                      <div className="w-4.5 h-4.5 rounded-full bg-amber-400 opacity-90" />
                    </div>
                  </button>

                  {/* Apple Pay button */}
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition flex items-center justify-center gap-1 text-xs font-bold text-black shadow-2xs cursor-pointer"
                  >
                    <span className="text-sm"></span>
                    <span className="font-semibold text-xs">Pay</span>
                  </button>
                </div>
              </div>

              {/* Trust & Safe Info Card */}
              <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0c593f] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#0c593f]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0c593f]">Your Information is Safe</h4>
                  <p className="text-[11px] text-emerald-800/80 mt-0.5 leading-relaxed font-medium">
                    We use industry-standard encryption to protect your data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. "YOU MAY ALSO LIKE" SECTION (5 Products Grid) */}
        <div className="mt-14 pt-8 border-t border-gray-200/80">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">You May Also Like</h3>
            <button
              onClick={onNavigateToShop}
              className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#107c41] hover:text-[#0c593f] transition cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {recommendedProducts.map((prod) => {
              const sale = prod.salePrice || prod.price;
              const hasDiscount = prod.salePrice && prod.salePrice < prod.price;
              const discountPercent = hasDiscount
                ? Math.round(((prod.price - prod.salePrice!) / prod.price) * 100)
                : 0;

              return (
                <div
                  key={prod.id}
                  onClick={() => onViewProduct && onViewProduct(prod.slug)}
                  className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 hover:shadow-md transition group cursor-pointer flex flex-col justify-between"
                >
                  {/* Image container with discount pill */}
                  <div className="relative aspect-square w-full rounded-xl bg-gray-50 flex items-center justify-center p-3 overflow-hidden mb-3">
                    {discountPercent > 0 && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#0c593f] text-white text-[10px] font-bold z-10">
                        -{discountPercent}%
                      </span>
                    )}
                    <img
                      src={prod.images[0]?.url}
                      alt={prod.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Title */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition line-clamp-1">
                      {prod.name}
                    </h4>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mt-1 text-amber-400">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium ml-0.5">
                        ({prod.ratingAverage || 4.7}/5)
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Price & Green Cart Button */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-gray-900">
                        ${sale.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] text-gray-400 line-through">
                          ${prod.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAddRecommended(prod, e);
                      }}
                      className="w-8 h-8 rounded-full bg-[#0c593f] hover:bg-[#0a4d36] text-white flex items-center justify-center shadow-xs transition cursor-pointer"
                      title="Add to cart"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONFIRM CLEAR CART MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Clear Shopping Cart?</h3>
            <p className="text-xs text-gray-500 mt-1 mb-6">
              Are you sure you want to remove all items from your shopping cart? This cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch(clearCart());
                  setShowClearConfirm(false);
                  dispatch(addToast({ type: 'info', message: 'Shopping cart cleared.' }));
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Yes, Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
