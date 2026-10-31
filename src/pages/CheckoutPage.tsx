import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  clearCart,
  setDivision,
  setShippingMethod,
  updateQuantity,
  removeFromCart,
  applyCoupon,
  removeCoupon,
} from '../features/cart/cartSlice';
import { openAuthModal, updateUserAddresses } from '../features/auth/authSlice';
import { addToast } from '../features/toast/toastSlice';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  Lock,
  ArrowRight,
  Package,
  Headphones,
  RotateCcw,
  Tag,
  Check,
  X,
  Plus,
  Minus,
  Info,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface CheckoutPageProps {
  onOrderSuccess: (order: any) => void;
  onNavigateToShop: () => void;
}

const BD_DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
];

const BD_CITIES = [
  'Dhaka',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Gazipur',
  'Narayanganj',
  'Cumilla',
];

const COUNTRIES = [
  'Bangladesh',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'United Arab Emirates',
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onOrderSuccess,
  onNavigateToShop,
}) => {
  const dispatch = useAppDispatch();
  const {
    items,
    subtotal,
    discount,
    coupon,
    shippingFee,
    shippingMethodId = 'standard',
    finalTotal,
    lineItemsCount,
  } = useAppSelector((state) => state.cart);
  const { user, isAuthenticated, token } = useAppSelector((state) => state.auth);

  // Form State initialized to reference image defaults
  const [email, setEmail] = useState(user?.email || 'mdmahim@gmail.com');
  const [phone, setPhone] = useState(user?.phone || '+880 1712 345678');
  const [marketingConsent, setMarketingConsent] = useState(true);

  // Shipping Address Form
  const [fullName, setFullName] = useState(user?.name || 'Md Mahim');
  const [streetAddress, setStreetAddress] = useState(
    'House 12, Road 5, Block B, Dhanmondi'
  );
  const [city, setCity] = useState('Dhaka');
  const [stateProvince, setStateProvince] = useState('Dhaka');
  const [postalCode, setPostalCode] = useState('1209');
  const [country, setCountry] = useState('Bangladesh');
  const [saveAddressForNextTime, setSaveAddressForNextTime] = useState(true);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'cod' | 'bkash' | 'sslcommerz'>('card');
  const [cardNumber, setCardNumber] = useState('1234 5678 9012 3456');
  const [cardExpiry, setCardExpiry] = useState('12 / 28');
  const [cardCvv, setCardCvv] = useState('123');
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [gatewayNoticeModal, setGatewayNoticeModal] = useState<{
    open: boolean;
    gateway: string;
    message: string;
    orderNumber?: string;
  } | null>(null);

  // Coupon state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<any | null>(null);

  // Fetch real payment gateway configuration status
  useEffect(() => {
    fetch('/api/payment/config-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setGatewayConfig(data.gateways);
        }
      })
      .catch(() => {});
  }, []);

  // Handle gateway return callback verification (e.g. bKash or SSLCOMMERZ return)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pStatus = params.get('paymentStatus');
    const gateway = params.get('gateway');
    const paymentId = params.get('paymentId');
    const orderNumber = params.get('orderNumber');
    const valId = params.get('valId');

    if (pStatus === 'verifying' && orderNumber) {
      setVerifyingPayment(true);
      fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, gateway, paymentId, valId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            dispatch(
              addToast({
                type: 'success',
                title: 'Payment Confirmed',
                message: `Transaction ${data.transactionId || ''} verified successfully!`,
              })
            );
            setOrderCompleted({
              orderNumber,
              paymentStatus: 'paid',
              paymentMethod: gateway || 'online',
              shippingAddress: { street: 'Delivery Address', city: 'Dhaka' },
              finalTotal: data.amount || 0,
            });
          } else {
            dispatch(
              addToast({
                type: 'error',
                title: 'Payment Verification Error',
                message: data.error || 'Gateway validation failed',
              })
            );
          }
        })
        .catch((err) => {
          dispatch(
            addToast({
              type: 'error',
              title: 'Verification Error',
              message: err.message,
            })
          );
        })
        .finally(() => {
          setVerifyingPayment(false);
        });
    } else if (pStatus === 'failed') {
      dispatch(
        addToast({
          type: 'error',
          title: 'Payment Not Completed',
          message: 'The transaction was cancelled or failed by the payment provider.',
        })
      );
    }
  }, []);

  // Sync with authenticated customer profile if logged in
  useEffect(() => {
    if (user) {
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.name) setFullName(user.name);

      if (user.addresses && user.addresses.length > 0) {
        const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
        setFullName(defaultAddr.name || user.name);
        setPhone(defaultAddr.phone || user.phone || '');
        setStreetAddress(defaultAddr.street || '');
        setCity(defaultAddr.district || 'Dhaka');
        setStateProvince(defaultAddr.division || 'Dhaka');
        setPostalCode(defaultAddr.upazila || '1209');
      }
    }
  }, [user]);

  // Handle shipping method selection
  const handleSelectShippingMethod = (methodId: 'standard' | 'express' | 'next_day') => {
    dispatch(setShippingMethod(methodId));
  };

  // Handle city / state change
  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setStateProvince(newCity);
    dispatch(setDivision(newCity));
  };

  // Apply promo code via backend validation API
  const handleApplyPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = (promoCodeInput || '').trim().toUpperCase();
    if (!cleanCode) {
      dispatch(addToast({ type: 'warning', message: 'Please enter a promo code.' }));
      return;
    }

    setValidatingCoupon(true);
    try {
      const res = await fetch(`/api/checkout/validate-coupon/${encodeURIComponent(cleanCode)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid promo code');
      }

      dispatch(applyCoupon(data.coupon));
      dispatch(
        addToast({
          type: 'success',
          title: 'Coupon Applied',
          message: data.message || `Coupon "${cleanCode}" successfully applied!`,
        })
      );
      setPromoCodeInput('');
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Coupon Error', message: err.message }));
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    dispatch(addToast({ type: 'info', message: 'Coupon removed.' }));
  };

  // Order Placement Handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      dispatch(addToast({ type: 'warning', message: 'Please enter a valid email address.' }));
      return;
    }

    if (!phone.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Please provide a valid contact phone number.' }));
      return;
    }

    if (!fullName.trim() || !streetAddress.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Please complete your recipient name and address.' }));
      return;
    }

    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (cleanCard.length < 12) {
        dispatch(addToast({ type: 'warning', message: 'Please enter a valid card number.' }));
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          variantName: i.variantName,
          name: i.name,
          quantity: i.quantity,
          image: i.image,
        })),
        contactInfo: {
          email: email.trim(),
          phone: phone.trim(),
          marketingConsent,
        },
        shippingAddress: {
          name: fullName.trim(),
          phone: phone.trim(),
          address: streetAddress.trim(),
          street: streetAddress.trim(),
          city,
          state: stateProvince,
          division: stateProvince,
          district: city,
          postalCode,
          country,
        },
        shippingMethod: shippingMethodId,
        paymentMethod,
        paymentDetails:
          paymentMethod === 'card'
            ? {
                cardNumber: cardNumber.trim(),
                expiry: cardExpiry.trim(),
                cvv: cardCvv.trim(),
              }
            : undefined,
        couponCode: coupon?.code,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/checkout/place-order', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order');
      }

      // If user requested to save address and is authenticated, save it
      if (saveAddressForNextTime && token) {
        try {
          const addrRes = await fetch('/api/auth/address', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: fullName.trim(),
              phone: phone.trim(),
              division: stateProvince,
              district: city,
              street: streetAddress.trim(),
              isDefault: true,
            }),
          });
          const addrData = await addrRes.json();
          if (addrData.success && addrData.addresses) {
            dispatch(updateUserAddresses(addrData.addresses));
          }
        } catch {
          // address save non-critical failure
        }
      }

      // If online payment gateway selected (bKash or SSLCOMMERZ), initiate payment session
      if (paymentMethod === 'bkash' || paymentMethod === 'sslcommerz') {
        try {
          const initRes = await fetch('/api/payment/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderNumber: data.order.orderNumber,
              gateway: paymentMethod,
            }),
          });
          const initData = await initRes.json();

          if (initData.success && initData.redirectUrl) {
            dispatch(clearCart());
            // Redirect to real payment provider URL
            window.location.href = initData.redirectUrl;
            return;
          } else {
            // Live credentials not set in env: inform user honestly and keep order in pending status
            dispatch(clearCart());
            setGatewayNoticeModal({
              open: true,
              gateway: paymentMethod,
              orderNumber: data.order.orderNumber,
              message:
                initData.error ||
                `The live ${paymentMethod.toUpperCase()} merchant credentials are not configured in your environment. Your order #${data.order.orderNumber} has been securely saved in "Pending" status.`,
            });
            setOrderCompleted(data.order);
            return;
          }
        } catch (gateErr: any) {
          console.error('Payment gateway initiation error:', gateErr);
        }
      }

      dispatch(clearCart());
      setOrderCompleted(data.order);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      dispatch(
        addToast({
          type: 'success',
          title: 'Order Confirmed!',
          message: `Order #${data.order.orderNumber} successfully placed.`,
        })
      );
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Order Failed', message: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  // If order is completed, show the beautiful Order Confirmation
  if (orderCompleted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
          <Check className="w-10 h-10 stroke-[3]" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Order Placed Successfully
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Thank you for your order!
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            We've sent an order confirmation and tracking link to{' '}
            <strong className="text-gray-900">{orderCompleted.customerEmail}</strong>.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left max-w-lg mx-auto space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-500">Order Number</span>
            <span className="text-sm font-bold text-gray-900">{orderCompleted.orderNumber}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-500">Payment Status</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
              {orderCompleted.paymentStatus} ({orderCompleted.paymentMethod.toUpperCase()})
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-500">Delivery Address</span>
            <span className="text-xs font-medium text-gray-800 text-right">
              {orderCompleted.shippingAddress.street}, {orderCompleted.shippingAddress.city}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 text-base font-bold text-gray-900">
            <span>Total Paid</span>
            <span className="text-emerald-800">${orderCompleted.finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onOrderSuccess(orderCompleted)}
            className="w-full sm:w-auto px-7 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md cursor-pointer"
          >
            View Order Status
          </button>
          <button
            onClick={onNavigateToShop}
            className="w-full sm:w-auto px-7 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // If cart is empty, show clean empty state
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-2">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
          Add items to your cart before proceeding to checkout.
        </p>
        <button
          onClick={onNavigateToShop}
          className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-sm cursor-pointer"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f9fafb] pb-20 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 1. Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-4 select-none">
          <button
            onClick={onNavigateToShop}
            className="hover:text-emerald-700 transition cursor-pointer text-gray-500 font-medium"
          >
            Home
          </button>
          <span>&gt;</span>
          <span className="text-gray-800 font-medium">Checkout</span>
        </nav>

        {/* 2. Top Hero Header Banner (Faithful to Reference Image) */}
        <div className="relative rounded-2xl bg-gradient-to-r from-emerald-50/90 via-[#f0fdf4] to-emerald-100/50 border border-emerald-100 p-6 sm:p-8 mb-8 overflow-hidden shadow-2xs">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pr-0 lg:pr-32">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0c261e] tracking-tight">
                Secure Checkout
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
                Complete your purchase with confidence
              </p>
            </div>

            {/* 4 Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 shrink-0">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center mb-1.5 shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                  100% Secure
                </span>
                <span className="text-[10px] text-gray-500">Payment</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center mb-1.5 shadow-2xs">
                  <Truck className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                  Fast &amp; Free
                </span>
                <span className="text-[10px] text-gray-500">Shipping</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center mb-1.5 shadow-2xs">
                  <Headphones className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                  24/7 Customer
                </span>
                <span className="text-[10px] text-gray-500">Support</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center mb-1.5 shadow-2xs">
                  <RotateCcw className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                  30 Days
                </span>
                <span className="text-[10px] text-gray-500">Return Policy</span>
              </div>
            </div>
          </div>

          {/* Decorative ShopMax Shopping Bag & Parcel Gift Art on Far Right */}
          <div className="absolute -right-2 -bottom-2 hidden lg:flex items-end gap-2 pointer-events-none select-none z-0">
            {/* Delivery parcel box */}
            <div className="w-16 h-12 rounded-lg bg-[#c49a6c] shadow-lg border border-[#a87a4a] relative overflow-hidden flex flex-col justify-end p-1">
              <div className="h-2 w-full bg-[#a87a4a]/40 rounded-sm mb-1" />
              <div className="flex justify-between items-center px-1">
                <div className="w-3 h-1.5 bg-[#8b6138] rounded-xs" />
                <div className="w-4 h-1 bg-[#8b6138] rounded-xs" />
              </div>
            </div>

            {/* Premium ShopMax Shopping Bag */}
            <div className="w-24 h-32 rounded-t-2xl bg-gradient-to-b from-[#0b533b] to-[#063b29] shadow-2xl border-2 border-emerald-500/30 flex flex-col items-center justify-between p-2.5 relative">
              {/* Bag Handles */}
              <div className="w-12 h-6 border-2 border-white/60 rounded-t-full -mt-6" />
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center mb-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <span className="text-white font-extrabold text-[11px] tracking-tight">ShopMax</span>
                <span className="text-emerald-200/60 text-[8px] uppercase tracking-wider">Premium</span>
              </div>
              <div className="w-full h-1 bg-emerald-400/30 rounded-full mb-1" />
            </div>

            {/* Decorative leaf accent */}
            <div className="text-emerald-800/30 font-serif italic text-4xl -ml-2 -mb-2">🌿</div>
          </div>
        </div>

        {/* 3. Stepper Bar (1 Contact Information, 2 Shipping Address, 3 Payment Method, 4 Review & Confirm) */}
        <div className="max-w-4xl mx-auto mb-10 px-2 sm:px-6">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            {/* Step 1: Contact Information (Active) */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <span className="text-gray-900 font-bold text-xs sm:text-sm">
                Contact Information
              </span>
            </div>

            <div className="flex-1 h-[1px] bg-gray-200 mx-3 hidden sm:block" />

            {/* Step 2: Shipping Address */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full border border-gray-300 text-gray-400 text-[11px] font-semibold flex items-center justify-center shrink-0">
                2
              </span>
              <span className="text-gray-500 text-xs sm:text-sm hidden sm:inline">
                Shipping Address
              </span>
            </div>

            <div className="flex-1 h-[1px] bg-gray-200 mx-3 hidden sm:block" />

            {/* Step 3: Payment Method */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full border border-gray-300 text-gray-400 text-[11px] font-semibold flex items-center justify-center shrink-0">
                3
              </span>
              <span className="text-gray-500 text-xs sm:text-sm hidden sm:inline">
                Payment Method
              </span>
            </div>

            <div className="flex-1 h-[1px] bg-gray-200 mx-3 hidden sm:block" />

            {/* Step 4: Review & Confirm */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full border border-gray-300 text-gray-400 text-[11px] font-semibold flex items-center justify-center shrink-0">
                4
              </span>
              <span className="text-gray-500 text-xs sm:text-sm hidden sm:inline">
                Review &amp; Confirm
              </span>
            </div>
          </div>
        </div>

        {/* 4. Main Two-Column Layout */}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Cards 1 to 4 (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Contact Information */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-2xs space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    1. Contact Information
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    We'll use this email to send you order updates.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mdmahim@gmail.com"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Phone Number <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1712 345678"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-700 font-medium">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 accent-emerald-800 cursor-pointer"
                  />
                  <span>Keep me updated on news and exclusive offers</span>
                </label>

                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => dispatch(openAuthModal({ mode: 'login', returnUrl: '/checkout' }))}
                    className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer"
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: Shipping Address */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-2xs space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    2. Shipping Address
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Enter your shipping address to get your order delivered.
                  </p>
                </div>
              </div>

              {/* Saved Address Quick Selector if Authenticated */}
              {user?.addresses && user.addresses.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                    Saved Addresses
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {user.addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setFullName(addr.name);
                          setPhone(addr.phone);
                          setStreetAddress(addr.street);
                          setCity(addr.district || 'Dhaka');
                          setStateProvince(addr.division || 'Dhaka');
                          setPostalCode(addr.upazila || '1209');
                          dispatch(setDivision(addr.division || 'Dhaka'));
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition font-medium cursor-pointer ${
                          streetAddress === addr.street
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {addr.name} ({addr.district})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Full Name <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Md Mahim"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Address <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="House 12, Road 5, Block B, Dhanmondi"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      City <span className="text-emerald-700">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white cursor-pointer appearance-none pr-8"
                      >
                        {BD_CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      State / Province <span className="text-emerald-700">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={stateProvince}
                        onChange={(e) => {
                          setStateProvince(e.target.value);
                          dispatch(setDivision(e.target.value));
                        }}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white cursor-pointer appearance-none pr-8"
                      >
                        {BD_DIVISIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Postal Code <span className="text-emerald-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="1209"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Country <span className="text-emerald-700">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white cursor-pointer appearance-none pr-8"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 select-none">
                <input
                  type="checkbox"
                  id="saveAddressCheckbox"
                  checked={saveAddressForNextTime}
                  onChange={(e) => setSaveAddressForNextTime(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-800 accent-emerald-800 cursor-pointer"
                />
                <label
                  htmlFor="saveAddressCheckbox"
                  className="text-xs text-gray-700 font-medium cursor-pointer"
                >
                  Save this address for next time
                </label>
              </div>
            </div>

            {/* Card 3: Shipping Method */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    3. Shipping Method
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Choose your preferred shipping option.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {/* Option 1: Standard Shipping ($0.00 FREE) */}
                <div
                  onClick={() => handleSelectShippingMethod('standard')}
                  className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer ${
                    shippingMethodId === 'standard'
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                        shippingMethodId === 'standard'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {shippingMethodId === 'standard' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <Truck className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900">
                        Standard Shipping
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">3-5 business days</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-emerald-800">$0.00</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider">
                      FREE
                    </span>
                  </div>
                </div>

                {/* Option 2: Express Shipping ($9.99) */}
                <div
                  onClick={() => handleSelectShippingMethod('express')}
                  className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer ${
                    shippingMethodId === 'express'
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                        shippingMethodId === 'express'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {shippingMethodId === 'express' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <Truck className="w-4 h-4 text-emerald-700" />
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900">
                        Express Shipping
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">1-2 business days</div>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs sm:text-sm font-bold text-gray-900">$9.99</span>
                  </div>
                </div>

                {/* Option 3: Next Day Delivery ($14.99) */}
                <div
                  onClick={() => handleSelectShippingMethod('next_day')}
                  className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer ${
                    shippingMethodId === 'next_day'
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                        shippingMethodId === 'next_day'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {shippingMethodId === 'next_day' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <Truck className="w-4 h-4 text-purple-700" />
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900">
                        Next Day Delivery
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Next day (order before 2 PM)
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs sm:text-sm font-bold text-gray-900">$14.99</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Payment Method */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-2xs space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    4. Payment Method
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Select your payment method.
                  </p>
                </div>
              </div>

              {/* 5 Method Cards Grid (Credit/Debit Card, PayPal, Cash on Delivery, Bkash, SSLCOMMERZ) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {/* Method 1: Credit / Debit Card */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border cursor-pointer transition relative flex flex-col items-center text-center justify-center gap-1.5 ${
                    paymentMethod === 'card'
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {paymentMethod === 'card' && (
                    <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <CreditCard className="w-5 h-5 text-gray-700" />
                  <span className="text-xs font-bold text-gray-900">Credit Card</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="px-1 text-[8px] font-extrabold bg-blue-700 text-white rounded">VISA</span>
                    <span className="px-1 text-[8px] font-extrabold bg-rose-600 text-white rounded">MC</span>
                  </div>
                </div>

                {/* Method 2: PayPal */}
                <div
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-3 rounded-xl border cursor-pointer transition relative flex flex-col items-center text-center justify-center gap-1.5 ${
                    paymentMethod === 'paypal'
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {paymentMethod === 'paypal' && (
                    <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <div className="w-5 h-5 flex items-center justify-center font-black text-[#003087] text-base">
                    P
                  </div>
                  <span className="text-xs font-bold text-gray-900">PayPal</span>
                  <span className="text-[10px] text-gray-400">Fast &amp; secure</span>
                </div>

                {/* Method 3: Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-xl border cursor-pointer transition relative flex flex-col items-center text-center justify-center gap-1.5 ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {paymentMethod === 'cod' && (
                    <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <div className="w-5 h-5 flex items-center justify-center text-gray-700">
                    💵
                  </div>
                  <span className="text-xs font-bold text-gray-900">Cash on Del.</span>
                  <span className="text-[10px] text-gray-400">Doorstep pay</span>
                </div>

                {/* Method 4: Bkash */}
                <div
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-3 rounded-xl border cursor-pointer transition relative flex flex-col items-center text-center justify-center gap-1.5 ${
                    paymentMethod === 'bkash'
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {paymentMethod === 'bkash' && (
                    <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <div className="w-5 h-5 flex items-center justify-center text-[#E2136E] font-extrabold text-sm">
                    ৳
                  </div>
                  <span className="text-xs font-bold text-gray-900">bKash</span>
                  <span className="text-[10px] text-[#E2136E] font-semibold">
                    {gatewayConfig?.bkash ? 'Live Tokenized' : 'Sandbox Ready'}
                  </span>
                </div>

                {/* Method 5: SSLCOMMERZ */}
                <div
                  onClick={() => setPaymentMethod('sslcommerz')}
                  className={`p-3 rounded-xl border cursor-pointer transition relative flex flex-col items-center text-center justify-center gap-1.5 ${
                    paymentMethod === 'sslcommerz'
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {paymentMethod === 'sslcommerz' && (
                    <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <div className="w-5 h-5 flex items-center justify-center text-[#1E3A8A] font-extrabold text-xs">
                    SSL
                  </div>
                  <span className="text-xs font-bold text-gray-900">SSLCOMMERZ</span>
                  <span className="text-[10px] text-blue-600 font-semibold">
                    {gatewayConfig?.sslcommerz ? 'Live Gateway' : 'Session v4'}
                  </span>
                </div>
              </div>

              {/* Card Inputs Form when Credit Card selected */}
              {paymentMethod === 'card' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Card Number <span className="text-emerald-700">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white pr-10 transition tracking-wider font-mono"
                      />
                      <CreditCard className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Expiry Date <span className="text-emerald-700">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM / YY"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        CVV <span className="text-emerald-700">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white pr-9 transition font-mono"
                        />
                        <Info className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Encrypted Notice Banner */}
                  <div className="flex items-center gap-2 p-3 bg-emerald-50/70 border border-emerald-100/80 rounded-xl text-xs text-emerald-800 font-medium">
                    <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Your payment information is secure and encrypted.</span>
                  </div>
                </div>
              )}

              {/* PayPal note */}
              {paymentMethod === 'paypal' && (
                <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-xl text-xs text-sky-900 space-y-1">
                  <span className="font-bold block">PayPal Instant Checkout</span>
                  <p className="text-[11px] text-sky-700">
                    You will be securely authenticated and your purchase protected with PayPal Buyer Protection.
                  </p>
                </div>
              )}

              {/* Cash on Delivery note */}
              {paymentMethod === 'cod' && (
                <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-xl text-xs text-amber-900 space-y-1">
                  <span className="font-bold block">Cash on Delivery (Doorstep Verification)</span>
                  <p className="text-[11px] text-amber-700">
                    Please prepare exact cash for the courier delivery rider upon package arrival.
                  </p>
                </div>
              )}

              {/* bKash note */}
              {paymentMethod === 'bkash' && (
                <div className="p-4 bg-[#fdeaf2] border border-[#f7c2d9] rounded-xl text-xs text-[#80073c] space-y-1">
                  <span className="font-bold block">bKash Direct Gateway</span>
                  <p className="text-[11px] text-[#9c1350]">
                    Your mobile payment will be processed securely through bKash verified payment tokens.
                  </p>
                </div>
              )}

              {/* SSLCOMMERZ note */}
              {paymentMethod === 'sslcommerz' && (
                <div className="p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl text-xs text-[#1e3a8a] space-y-1">
                  <span className="font-bold block">SSLCOMMERZ Session Gateway</span>
                  <p className="text-[11px] text-[#2563eb]">
                    Process Visa, Mastercard, AMEX, Internet Banking (City Bank, BRAC Bank) or Mobile Wallets (Nagad, Rocket).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Gateway Notice Modal */}
          {gatewayNoticeModal?.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-bold text-gray-900">
                    {gatewayNoticeModal.gateway.toUpperCase()} Gateway Notice
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {gatewayNoticeModal.message}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Ref:</span>
                    <strong className="font-mono">{gatewayNoticeModal.orderNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Status:</span>
                    <span className="font-semibold text-amber-700 uppercase">Pending</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setGatewayNoticeModal(null)}
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    View Order Confirmation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Right Column: Sticky Order Summary & Shop with Confidence (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Order Summary</h3>
                <span className="text-xs font-medium text-gray-400">
                  {lineItemsCount} {lineItemsCount === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Line Items List with Exact Stepper & Delete */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId || 'default'}`}
                    className="flex items-start gap-3.5 pb-4 border-b border-gray-50 last:border-b-0 last:pb-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">
                          {item.name}
                        </h4>
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
                          className="text-gray-400 hover:text-rose-500 transition cursor-pointer p-0.5 shrink-0"
                          title="Remove item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {item.variantName || 'Standard Edition'}
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        {/* Quantity Stepper */}
                        <div className="inline-flex items-center border border-gray-200 rounded-lg bg-gray-50/50">
                          <button
                            type="button"
                            onClick={() =>
                              dispatch(
                                updateQuantity({
                                  productId: item.productId,
                                  variantId: item.variantId,
                                  quantity: Math.max(1, item.quantity - 1),
                                })
                              )
                            }
                            className="p-1 px-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-l-lg transition cursor-pointer disabled:opacity-40"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-gray-900 min-w-5 text-center">
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
                            className="p-1 px-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-r-lg transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                          ${((item.salePrice || item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Box */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="Enter promo code"
                      className="w-full text-xs pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-700 bg-white"
                    />
                    <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyPromoCode}
                    disabled={validatingCoupon}
                    className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>

                {/* Applied Coupon Pill */}
                {coupon && (
                  <div className="flex items-center justify-between mt-2.5 p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="font-bold">{coupon.code}</span>
                      <span className="text-emerald-700 font-medium">
                        ({coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `$${coupon.discountValue} off`})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-emerald-800 hover:text-rose-600 font-bold text-[11px] cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Financial Calculation Breakdown matching reference */}
              <div className="pt-3 border-t border-gray-100 space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between items-center">
                  <span>Subtotal ({lineItemsCount} items)</span>
                  <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <span className="font-semibold text-gray-900">
                    {shippingFee === 0 ? '$0.00' : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-bold">-${discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-900">Total (USD)</span>
                  <span className="text-2xl font-extrabold text-emerald-700">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Primary Place Order Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-950/15 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Place Order</span>
                  </>
                )}
              </button>

              {/* Legal disclaimer */}
              <p className="text-[11px] text-gray-400 text-center leading-normal">
                By placing your order, you agree to our{' '}
                <a href="#terms" className="text-gray-600 hover:underline">
                  Terms &amp; Conditions
                </a>{' '}
                and{' '}
                <a href="#privacy" className="text-gray-600 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>

            {/* Shop with Confidence Card (Faithful to Reference Image) */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                    Shop with Confidence
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-gray-400">
                    Your information is safe and secure with us.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 shrink-0">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block leading-tight">
                      Secure Payment
                    </span>
                    <span className="text-[11px] text-gray-400">100% safe and encrypted</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 shrink-0">
                    <Truck className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block leading-tight">
                      Free Shipping
                    </span>
                    <span className="text-[11px] text-gray-400">On orders over $50</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 shrink-0">
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block leading-tight">
                      30 Days Money Back
                    </span>
                    <span className="text-[11px] text-gray-400">Hassle-free returns</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 shrink-0">
                    <Headphones className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block leading-tight">
                      24/7 Support
                    </span>
                    <span className="text-[11px] text-gray-400">We're here to help</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
