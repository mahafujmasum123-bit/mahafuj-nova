import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  removeFromCart,
  updateQuantity,
  applyCoupon,
  removeCoupon,
  toggleCartDrawer,
} from '../../features/cart/cartSlice';
import { openAuthModal } from '../../features/auth/authSlice';
import { addToast } from '../../features/toast/toastSlice';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Tag, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  onNavigateToCheckout: () => void;
  onNavigateToShop: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigateToCheckout, onNavigateToShop }) => {
  const dispatch = useAppDispatch();
  const {
    items,
    subtotal,
    discount,
    coupon,
    shippingFee,
    finalTotal,
    lineItemsCount,
    couponError,
    isCartDrawerOpen,
  } = useAppSelector((state) => state.cart);

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  if (!isCartDrawerOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setCouponLoading(true);

    const code = couponCodeInput.trim().toUpperCase();
    try {
      const res = await fetch(`/api/checkout/validate-coupon/${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.coupon) {
        throw new Error(data.error || `Coupon "${code}" is invalid or expired.`);
      }

      dispatch(applyCoupon(data.coupon));
      dispatch(
        addToast({
          type: 'success',
          title: 'Coupon Applied',
          message: data.message || `Code ${code} activated!`,
        })
      );
      setCouponCodeInput('');
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Invalid Coupon', message: err.message }));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckoutClick = () => {
    if (items.length === 0) {
      dispatch(addToast({ type: 'warning', message: 'Your shopping cart is empty.' }));
      return;
    }

    if (!isAuthenticated) {
      dispatch(toggleCartDrawer(false));
      dispatch(
        addToast({
          type: 'info',
          title: 'Account Required',
          message: 'Please sign in or create an account to proceed to checkout.',
        })
      );
      dispatch(openAuthModal({ mode: 'login', returnUrl: '/checkout' }));
      return;
    }

    dispatch(toggleCartDrawer(false));
    onNavigateToCheckout();
  };

  return (
    <div className="fixed inset-0 z-[9000] flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => dispatch(toggleCartDrawer(false))}
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 transition-transform">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Your Cart</h2>
              <span className="text-xs text-gray-500 font-medium">
                {lineItemsCount} unique {lineItemsCount === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
          <button
            onClick={() => dispatch(toggleCartDrawer(false))}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-base font-semibold text-gray-700">Your cart is empty</p>
              <p className="text-xs text-gray-400 max-w-xs mt-1 mb-5">
                Discover trending gadgets, apparel, and lifestyle accessories on Novara Commerce.
              </p>
              <button
                onClick={() => {
                  dispatch(toggleCartDrawer(false));
                  onNavigateToShop();
                }}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl transition"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || 'std'}`}
                className="flex gap-3.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition bg-white shadow-xs"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-18 h-18 rounded-lg object-cover bg-gray-50 shrink-0 border border-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs font-semibold text-gray-900 truncate pr-2">{item.name}</h3>
                    <button
                      onClick={() =>
                        dispatch(removeFromCart({ productId: item.productId, variantId: item.variantId }))
                      }
                      className="text-gray-400 hover:text-rose-600 p-1 transition"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">SKU: {item.sku}</div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-gray-900">
                      ${((item.salePrice || item.price) * item.quantity).toFixed(2)}
                    </span>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              variantId: item.variantId,
                              quantity: item.quantity - 1,
                            })
                          )
                        }
                        className="p-1.5 hover:bg-gray-200 text-gray-600 transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs font-semibold text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              variantId: item.variantId,
                              quantity: item.quantity + 1,
                            })
                          )
                        }
                        disabled={item.quantity >= item.stock}
                        className="p-1.5 hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Totals & Checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-3.5">
            {/* Coupon field */}
            <div className="space-y-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    placeholder="Coupon code (e.g. NOVARA10)"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg uppercase tracking-wider outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCodeInput.trim()}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              {coupon && (
                <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-md">
                  <span>Applied: <strong>{coupon.code}</strong> (-${discount.toFixed(2)})</span>
                  <button onClick={() => dispatch(removeCoupon())} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {couponError && <p className="text-[11px] text-rose-600">{couponError}</p>}
            </div>

            {/* Price breakdown */}
            <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-200/60">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-semibold">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-gray-900">
                  {shippingFee === 0 ? <span className="text-emerald-700">FREE</span> : `$${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Final Total</span>
                <span className="text-base text-emerald-900">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              onClick={handleCheckoutClick}
              className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 cursor-pointer"
            >
              <span>{isAuthenticated ? 'Proceed to Checkout' : 'Sign in to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Cash on Delivery & Secure Online Checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
