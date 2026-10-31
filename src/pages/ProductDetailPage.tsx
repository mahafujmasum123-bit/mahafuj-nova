import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { addToCart } from '../features/cart/cartSlice';
import { toggleWishlist } from '../features/ui/uiSlice';
import { openAuthModal } from '../features/auth/authSlice';
import { addToast } from '../features/toast/toastSlice';
import { ProductCard } from '../components/ui/ProductCard';
import { SeedProduct } from '../../server/data/initialData';
import { DEFAULT_ADD_TO_CART_QUANTITY } from '../utils/ecommerceRules';
import { useCartFly } from '../context/CartFlyContext';
import { useDelayedSkeleton } from '../hooks/useDelayedSkeleton';
import { ProductDetailSkeleton } from '../components/skeletons/ProductDetailSkeleton';
import { toggleWishlistOnServer } from '../utils/wishlistApi';
import {
  Star,
  ShoppingBag,
  ShoppingCart,
  Heart,
  Truck,
  ShieldCheck,
  CreditCard,
  Headphones,
  CheckCircle2,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
  Radio,
  BatteryCharging,
  Zap,
  Volume2,
  Wifi,
  ThumbsUp,
} from 'lucide-react';

interface ProductDetailPageProps {
  slug: string;
  onNavigateToShop: () => void;
  onNavigateToCheckout: () => void;
  onViewProduct: (slug: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  slug,
  onNavigateToShop,
  onNavigateToCheckout,
  onViewProduct,
}) => {
  const dispatch = useAppDispatch();
  const { triggerCartFly } = useCartFly();
  const wishlist = useAppSelector((state) => state.ui.wishlistProductIds);
  const { isAuthenticated, user, token } = useAppSelector((state) => state.auth);

  const [product, setProduct] = useState<SeedProduct | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string>('Black');
  const [quantity, setQuantity] = useState(DEFAULT_ADD_TO_CART_QUANTITY);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'shipping' | 'reviews'>('overview');
  const [relatedProducts, setRelatedProducts] = useState<SeedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<{
    average: number;
    total: number;
    distribution: Record<number, number>;
  }>({
    average: 4.8,
    total: 2345,
    distribution: { 5: 86, 4: 9, 3: 3, 2: 1, 1: 1 },
  });
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});

  const reviewsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (data.success && data.data) {
          const currentProd: SeedProduct = data.data;
          setProduct(currentProd);
          setSelectedImageIndex(0);
          setQuantity(Math.min(DEFAULT_ADD_TO_CART_QUANTITY, currentProd.stock > 0 ? currentProd.stock : 1));

          // Configure variant defaults
          if (currentProd.variants && currentProd.variants.length > 0) {
            setSelectedVariantId(currentProd.variants[0].id);
            const initialCol = currentProd.variants[0].options?.Color || currentProd.variants[0].name;
            setSelectedColor(initialCol);
          } else {
            setSelectedColor('Black');
          }

          // Fetch reviews
          const revRes = await fetch(`/api/reviews/${currentProd.id}`);
          const revData = await revRes.json();
          if (revData.success) {
            setReviews(revData.data);
            setReviewStats({
              average: revData.average || currentProd.ratingAverage || 4.8,
              total: revData.total || currentProd.reviewCount || 2345,
              distribution: revData.distribution || { 5: 86, 4: 9, 3: 3, 2: 1, 1: 1 },
            });
          }

          // Fetch related products
          const relRes = await fetch(`/api/products/${encodeURIComponent(slug)}/related`);
          const relData = await relRes.json();
          if (relData.success && relData.data) {
            setRelatedProducts(relData.data);
          } else {
            // Fallback related query
            const fallbackRel = await fetch(`/api/products?category=${currentProd.category}&limit=6`);
            const fallbackData = await fallbackRel.json();
            if (fallbackData.success) {
              setRelatedProducts(fallbackData.data.filter((p: SeedProduct) => p.id !== currentProd.id).slice(0, 5));
            }
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Failed to load product', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  const showSkeleton = useDelayedSkeleton(loading);

  if (loading) {
    if (showSkeleton) {
      return <ProductDetailSkeleton />;
    }
    return null;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800">Product Not Found</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          The requested product may have been moved, unpublished, or does not exist.
        </p>
        <button
          onClick={onNavigateToShop}
          className="mt-2 px-6 py-2.5 bg-[#00875a] hover:bg-[#00724c] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
        >
          Browse All Products
        </button>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const effectivePrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const productImages = product.images && product.images.length > 0 ? product.images : [{ url: '' }];

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (product.stock <= 0) {
      dispatch(addToast({ type: 'warning', message: 'Item is currently out of stock.' }));
      return;
    }

    if (e && e.currentTarget) {
      triggerCartFly(e.currentTarget as HTMLElement, productImages[selectedImageIndex]?.url || productImages[0]?.url);
    }

    dispatch(
      addToCart({
        productId: product.id,
        variantId: selectedVariantId,
        sku: product.sku,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        quantity,
        image: productImages[selectedImageIndex]?.url || productImages[0]?.url,
        stock: product.stock,
      })
    );

    dispatch(
      addToast({
        type: 'success',
        title: 'Added to Cart',
        message: `${quantity}x ${product.name} added to your shopping cart.`,
      })
    );
  };

  const handleBuyNow = () => {
    handleAddToCart();
    onNavigateToCheckout();
  };

  const handleWishlistToggle = async () => {
    dispatch(toggleWishlist(product.id));
    try {
      await toggleWishlistOnServer(product.id);
    } catch (err) {
      console.error('Failed to sync wishlist to server:', err);
    }
    dispatch(
      addToast({
        type: 'info',
        message: isWishlisted
          ? `Removed "${product.name}" from your wishlist.`
          : `Saved "${product.name}" to your wishlist.`,
      })
    );
  };

  const handleHelpfulClick = async (reviewId: string) => {
    if (helpfulVoted[reviewId]) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setHelpfulVoted((prev) => ({ ...prev, [reviewId]: true }));
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: json.helpfulCount } : r))
        );
        dispatch(addToast({ type: 'success', message: 'Thank you for your feedback!' }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      dispatch(
        addToast({
          type: 'info',
          title: 'Account Required',
          message: 'Please sign in to submit a verified customer review.',
        })
      );
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }

    if (!newComment.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Please write a review comment.' }));
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('novara_auth_token_v1') || ''}`,
        },
        body: JSON.stringify({
          productId: product.id,
          rating: newRating,
          title: newTitle.trim() || undefined,
          comment: newComment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit review');
      }

      dispatch(addToast({ type: 'success', title: 'Review Published', message: data.message }));
      setReviews([data.data, ...reviews]);
      setNewComment('');
      setNewTitle('');
      setIsWriteReviewOpen(false);
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const scrollToReviews = () => {
    setActiveTab('reviews');
    reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Color options resolution
  const colorOptions = [
    { name: 'Black', hex: '#111827' },
    { name: 'Blue', hex: '#1e3a8a' },
    { name: 'Beige', hex: '#e5d5be' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-10 font-sans text-gray-800">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-gray-500 font-medium flex items-center gap-1.5 flex-wrap">
        <button onClick={onNavigateToShop} className="hover:text-[#00875a] transition cursor-pointer">
          Home
        </button>
        <span className="text-gray-400">&gt;</span>
        <button onClick={onNavigateToShop} className="hover:text-[#00875a] transition cursor-pointer">
          {product.category || 'Electronics'}
        </button>
        <span className="text-gray-400">&gt;</span>
        <button onClick={onNavigateToShop} className="hover:text-[#00875a] transition cursor-pointer">
          {product.subcategory || product.brand || 'Audio'}
        </button>
        <span className="text-gray-400">&gt;</span>
        <span className="text-[#00875a] font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* 2. Hero Product Layout (Gallery Left, Details Right) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-6 flex flex-col sm:flex-row gap-4">
          {/* Vertical Thumbnail Strip */}
          <div className="order-2 sm:order-1 flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 shrink-0">
            {productImages.slice(0, 4).map((img, idx) => {
              const isSelected = selectedImageIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-xl border-2 overflow-hidden bg-white p-1 transition cursor-pointer flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-[#00875a] ring-2 ring-[#00875a]/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'
                  }`}
                  aria-label={`View photo ${idx + 1}`}
                >
                  <img
                    src={img.url}
                    alt={img.alt || `${product.name} view ${idx + 1}`}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </button>
              );
            })}

            {/* +N remaining thumbnail slot matching reference mockup */}
            {productImages.length > 4 && (
              <button
                onClick={() => {
                  setSelectedImageIndex(4);
                }}
                className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl border-2 overflow-hidden bg-gray-900 transition cursor-pointer shrink-0 ${
                  selectedImageIndex >= 4 ? 'border-[#00875a] ring-2 ring-[#00875a]/20' : 'border-gray-200'
                }`}
                aria-label={`View ${productImages.length - 4} more photos`}
              >
                <img
                  src={productImages[4]?.url}
                  alt="More photos"
                  className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                />
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                  +{productImages.length - 4}
                </div>
              </button>
            )}
          </div>

          {/* Large Main Image Display */}
          <div className="order-1 sm:order-2 flex-1 relative bg-[#f4f5f7] rounded-3xl p-6 sm:p-10 flex items-center justify-center min-h-[380px] sm:min-h-[460px] lg:h-[480px] border border-gray-100/80 shadow-2xs select-none">
            {/* Discount Pill Badge at Top Right */}
            {hasDiscount && (
              <span className="absolute top-5 right-5 text-xs font-extrabold px-3 py-1 rounded-full bg-[#00875a] text-white shadow-xs z-10">
                -{discountPercent}%
              </span>
            )}

            {/* Previous Image Arrow Button */}
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-black border border-gray-200/80 flex items-center justify-center shadow-sm transition hover:scale-105 z-10 cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>

            {/* Main Product Image */}
            <img
              src={productImages[selectedImageIndex]?.url || productImages[0]?.url}
              alt={product.name}
              className="max-h-[340px] sm:max-h-[400px] w-auto object-contain mix-blend-multiply transition-all duration-300"
            />

            {/* Next Image Arrow Button */}
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-black border border-gray-200/80 flex items-center justify-center shadow-sm transition hover:scale-105 z-10 cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 -mr-0.5" />
            </button>

            {/* Bottom Counter Pill (e.g. 1/7) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-200/90 text-gray-700 font-bold text-[11px] px-3.5 py-0.5 rounded-full z-10 shadow-2xs">
              {selectedImageIndex + 1}/{productImages.length}
            </div>
          </div>
        </div>

        {/* Right Column: Product Info & Actions (7 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Badge & Title */}
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-[#00875a] text-white uppercase tracking-wider mb-2">
              {product.badge === 'Hot' ? 'Hot Deal' : product.badge || 'Best Seller'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Stars, Review Count, Write a Review Link */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.ratingAverage || 4.8)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-200 fill-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-700">
                {(product.ratingAverage || 4.8).toFixed(1)} ({reviewStats.total.toLocaleString()} reviews)
              </span>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setIsWriteReviewOpen(true)}
                className="text-xs font-semibold text-gray-500 hover:text-[#00875a] underline transition cursor-pointer"
              >
                Write a Review
              </button>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#00875a] tracking-tight">
              ${effectivePrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through font-medium">
                ${product.price.toFixed(2)}
              </span>
            )}
            {hasDiscount && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-[#00875a] border border-emerald-200/80">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Key Feature Pills Row matching mockup */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/70 text-xs font-semibold text-gray-700">
              <Volume2 className="w-3.5 h-3.5 text-[#00875a]" />
              Active Noise Cancelling
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/70 text-xs font-semibold text-gray-700">
              <BatteryCharging className="w-3.5 h-3.5 text-[#00875a]" />
              Up to 40H Playtime
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/70 text-xs font-semibold text-gray-700">
              <Zap className="w-3.5 h-3.5 text-[#00875a]" />
              Hi-Res Audio
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/70 text-xs font-semibold text-gray-700">
              <Wifi className="w-3.5 h-3.5 text-[#00875a]" />
              Bluetooth 5.0
            </span>
          </div>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {product.shortDescription || product.description}
          </p>

          {/* Color Variant Selector matching mockup */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-bold text-gray-800">
              Color: <span className="text-gray-600 font-medium ml-1">{selectedColor}</span>
            </div>
            <div className="flex items-center gap-3">
              {colorOptions.map((col) => {
                const isSelected = selectedColor.toLowerCase() === col.name.toLowerCase();
                return (
                  <button
                    key={col.name}
                    onClick={() => {
                      setSelectedColor(col.name);
                      if (product.variants && product.variants.length > 0) {
                        const matching = product.variants.find(
                          (v) => v.options?.Color?.toLowerCase() === col.name.toLowerCase()
                        );
                        if (matching) setSelectedVariantId(matching.id);
                      }
                    }}
                    style={{ backgroundColor: col.hex }}
                    className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-gray-900 scale-110 shadow-xs'
                        : 'hover:scale-105 border border-gray-200/60'
                    }`}
                    aria-label={`Select color ${col.name}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Action Row: Quantity + Add to Cart + Add to Wishlist */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Quantity Selector */}
              <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs h-12">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 h-full hover:bg-gray-100 text-gray-600 transition flex items-center justify-center cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-gray-900 select-none">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  className="px-3.5 h-full hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition flex items-center justify-center cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={(e) => handleAddToCart(e)}
                disabled={product.stock <= 0}
                className="flex-1 h-12 rounded-xl bg-[#00875a] hover:bg-[#00724c] text-white font-bold text-sm transition flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4 text-white" />
                <span>Add to Cart</span>
              </button>

              {/* Add to Wishlist Button */}
              <button
                onClick={handleWishlistToggle}
                className={`h-12 px-5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs ${
                  isWishlisted
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-gray-600'}`} />
                <span className="whitespace-nowrap">{isWishlisted ? 'Saved' : 'Add to Wishlist'}</span>
              </button>
            </div>

            {/* Value Proposition Row (Free Shipping, 30 Days, Secure Payment) */}
            <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#00875a] shrink-0" />
                <div>
                  <div className="font-bold text-gray-900">Free Shipping</div>
                  <div className="text-[11px] text-gray-400">On orders over $50</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#00875a] shrink-0" />
                <div>
                  <div className="font-bold text-gray-900">30 Days</div>
                  <div className="text-[11px] text-gray-400">Money Back Guarantee</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-[#00875a] shrink-0" />
                <div>
                  <div className="font-bold text-gray-900">Secure Payment</div>
                  <div className="text-[11px] text-gray-400">100% secure payment</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. White Tabbed Information Container (Overview, Specs, Shipping, Reviews) */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-2xs p-6 sm:p-8 space-y-6">
        {/* Tab Headers */}
        <div className="flex items-center gap-6 sm:gap-8 border-b border-gray-100 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold transition whitespace-nowrap cursor-pointer border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#00875a] text-[#00875a]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 text-sm font-bold transition whitespace-nowrap cursor-pointer border-b-2 ${
              activeTab === 'specs'
                ? 'border-[#00875a] text-[#00875a]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-3 text-sm font-bold transition whitespace-nowrap cursor-pointer border-b-2 ${
              activeTab === 'shipping'
                ? 'border-[#00875a] text-[#00875a]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Shipping &amp; Returns
          </button>
          <button
            onClick={() => {
              setActiveTab('reviews');
              scrollToReviews();
            }}
            className={`pb-3 text-sm font-bold transition whitespace-nowrap cursor-pointer border-b-2 ${
              activeTab === 'reviews'
                ? 'border-[#00875a] text-[#00875a]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Reviews ({reviewStats.total.toLocaleString()})
          </button>
        </div>

        {/* Tab 1: Overview (3-Column Layout matching reference image) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
            {/* Column 1: Product Overview text & checklist (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-base font-bold text-gray-900">Product Overview</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
              <ul className="space-y-2.5 pt-1 text-xs sm:text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00875a] shrink-0" />
                  <span>Hybrid Active Noise Cancelling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00875a] shrink-0" />
                  <span>Up to 40 Hours Playtime</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00875a] shrink-0" />
                  <span>Hi-Res Audio for Crystal Clear Sound</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00875a] shrink-0" />
                  <span>Soft Memory Foam Ear Cups</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00875a] shrink-0" />
                  <span>Bluetooth 5.0 for Stable Connection</span>
                </li>
              </ul>
            </div>

            {/* Column 2: Specifications Table (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-base font-bold text-gray-900">Specifications</h3>
              <div className="rounded-xl border border-gray-100 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <tbody>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <td className="px-3.5 py-2.5 font-medium text-gray-500 w-2/5">Brand</td>
                      <td className="px-3.5 py-2.5 font-semibold text-gray-900">{product.brand}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-3.5 py-2.5 font-medium text-gray-500">Model</td>
                      <td className="px-3.5 py-2.5 font-semibold text-gray-900">{product.attributes?.Model || product.sku}</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <td className="px-3.5 py-2.5 font-medium text-gray-500">Battery Life</td>
                      <td className="px-3.5 py-2.5 font-semibold text-gray-900">{product.attributes?.['Battery Life'] || 'Up to 40 Hours'}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-3.5 py-2.5 font-medium text-gray-500">Charging Time</td>
                      <td className="px-3.5 py-2.5 font-semibold text-gray-900">{product.attributes?.['Charging Time'] || '2 Hours'}</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <td className="px-3.5 py-2.5 font-medium text-gray-500">Bluetooth Version</td>
                      <td className="px-3.5 py-2.5 font-semibold text-gray-900">{product.attributes?.['Bluetooth Version'] || '5.0'}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-3.5 py-2.5 font-medium text-gray-500">Weight</td>
                      <td className="px-3.5 py-2.5 font-semibold text-gray-900">{product.attributes?.Weight || '260g'}</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <td className="px-3.5 py-2.5 font-medium text-gray-500">Color Options</td>
                      <td className="px-3.5 py-2.5 font-semibold text-gray-900">{product.attributes?.['Color Options'] || 'Black, Blue, Beige'}</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-medium text-gray-500">Warranty</td>
                      <td className="px-3.5 py-2.5 font-semibold text-gray-900">{product.warranty || '1 Year'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column 3: Promo Mini-Banner Card matching reference mockup (3 cols) */}
            <div className="lg:col-span-3">
              <div className="relative rounded-2xl bg-gradient-to-br from-[#062417] via-[#0b3b26] to-[#041a10] text-white p-6 overflow-hidden flex flex-col justify-between min-h-[300px] shadow-md group">
                <div className="relative z-10 space-y-1">
                  <h4 className="text-lg font-extrabold leading-snug">
                    Premium Sound <br />for a Better You
                  </h4>
                  <p className="text-[11px] text-emerald-200/80">
                    Noise Cancelling Wireless Headphones
                  </p>
                </div>

                {/* Floating headphone image */}
                <div className="relative z-10 my-3 flex justify-center">
                  <img
                    src={productImages[0]?.url}
                    alt="Promo preview"
                    className="w-36 h-36 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="relative z-10">
                  <button
                    onClick={onNavigateToShop}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-emerald-50 text-gray-900 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <span>Shop Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Background glow circle */}
                <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Specifications expanded */}
        {activeTab === 'specs' && (
          <div className="space-y-4 max-w-3xl pt-2">
            <h3 className="text-base font-bold text-gray-900">Detailed Specifications</h3>
            <div className="rounded-xl border border-gray-100 overflow-hidden text-xs">
              <table className="w-full text-left">
                <tbody>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-500 w-1/3">Brand</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{product.brand}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-semibold text-gray-500">Category</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{product.category} ({product.subcategory})</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-500">SKU</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{product.sku}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-semibold text-gray-500">Stock Status</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-500">Warranty</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{product.warranty || '1 Year Official Brand Warranty'}</td>
                  </tr>
                  {product.attributes &&
                    Object.entries(product.attributes).map(([key, val]) => (
                      <tr key={key} className="border-b border-gray-100">
                        <td className="px-4 py-3 font-semibold text-gray-500">{key}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{val}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Shipping & Returns */}
        {activeTab === 'shipping' && (
          <div className="space-y-4 max-w-3xl pt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
            <h3 className="text-base font-bold text-gray-900">Shipping &amp; Delivery Policy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#00875a]" /> Inside Dhaka
                </div>
                <p className="text-xs text-gray-500">
                  Delivery within 24 to 48 hours via Paperfly / Pathao Express courier. Standard charge: ৳60 (Free on orders above $50 / ৳5,000).
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#00875a]" /> Outside Dhaka
                </div>
                <p className="text-xs text-gray-500">
                  Delivery within 3 to 5 business days nationwide across all 64 districts in Bangladesh with real-time SMS tracking. Standard charge: ৳120.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1 text-xs">
              <div className="font-bold text-emerald-950">30-Day Hassle-Free Returns</div>
              <p className="text-emerald-800">
                If your item arrives damaged, defective, or not as described, return it in original packaging within 30 days for a full refund or exchange.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 4. Customer Reviews Section matching reference image */}
      <section ref={reviewsSectionRef} className="space-y-6 pt-4">
        {/* Header with Title and "Write a Review" button */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Customer Reviews
          </h2>
          <button
            onClick={() => setIsWriteReviewOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Write a Review
          </button>
        </div>

        {/* Rating Breakdown & Customer Review Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Overall Score & Histogram (3 cols) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-3">
            <div className="text-5xl font-extrabold text-gray-900 tracking-tight">
              {(product.ratingAverage || reviewStats.average).toFixed(1)}
            </div>
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.ratingAverage || reviewStats.average)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200 fill-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-400 font-medium">
              Based on {reviewStats.total.toLocaleString()} reviews
            </div>

            {/* Histogram bars */}
            <div className="space-y-2 pt-2">
              {[
                { star: 5, pct: 86 },
                { star: 4, pct: 9 },
                { star: 3, pct: 3 },
                { star: 2, pct: 1 },
                { star: 1, pct: 1 },
              ].map(({ star, pct }) => (
                <div key={star} className="flex items-center gap-2.5 text-xs">
                  <span className="w-5 text-gray-500 font-semibold">{star} ★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00875a] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-400 text-[11px] font-medium">{pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Individual Review Cards (9 cols, 3 cards in row) */}
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.slice(0, 3).map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between space-y-3 hover:shadow-xs transition"
              >
                <div className="space-y-2.5">
                  {/* User info & avatar */}
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        rev.userAvatar ||
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80'
                      }
                      alt={rev.userName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-100"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900">{rev.userName}</div>
                      <div className="text-[10px] text-gray-400 font-medium">Verified Buyer</div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Title & Comment */}
                  <div className="text-xs font-bold text-gray-900">
                    {rev.title || 'Excellent sound quality!'}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                    "{rev.comment}"
                  </p>
                </div>

                {/* Footer with Date & Helpful Button */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-[11px] text-gray-400">
                  <span>{rev.createdAt || 'Mar 12, 2025'}</span>
                  <button
                    onClick={() => handleHelpfulClick(rev.id)}
                    className="flex items-center gap-1 hover:text-gray-700 transition cursor-pointer"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Helpful ({rev.helpfulCount || 24})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. "You May Also Like" (Related Products Section) */}
      {relatedProducts.length > 0 && (
        <section className="space-y-5 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              You May Also Like
            </h2>
            <button
              onClick={onNavigateToShop}
              className="text-xs font-bold text-[#00875a] hover:text-[#00724c] flex items-center gap-1 transition cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {relatedProducts.slice(0, 5).map((p) => (
              <ProductCard key={p.id} product={p} onViewProduct={onViewProduct} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Bottom Trust / Value Proposition Banner */}
      <section className="bg-[#f4fbf7] border border-emerald-100 rounded-3xl p-6 sm:p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#00875a] flex items-center justify-center shadow-2xs shrink-0">
              <Headphones className="w-5 h-5 text-[#00875a]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-gray-900">Premium Quality</div>
              <div className="text-[11px] text-gray-500">100% original products</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#00875a] flex items-center justify-center shadow-2xs shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#00875a]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-gray-900">Secure Payment</div>
              <div className="text-[11px] text-gray-500">Multiple payment options</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#00875a] flex items-center justify-center shadow-2xs shrink-0">
              <Truck className="w-5 h-5 text-[#00875a]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-gray-900">Fast &amp; Free Shipping</div>
              <div className="text-[11px] text-gray-500">On orders over $50</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#00875a] flex items-center justify-center shadow-2xs shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#00875a]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-gray-900">24/7 Support</div>
              <div className="text-[11px] text-gray-500">We are here to help</div>
            </div>
          </div>
        </div>
      </section>

      {/* Write a Review Modal */}
      {isWriteReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Write a Review</h3>
                <p className="text-xs text-gray-500 mt-0.5">Share your experience with {product.name}</p>
              </div>
              <button
                onClick={() => setIsWriteReviewOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition cursor-pointer"
                      aria-label={`${star} star`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newRating ? 'fill-amber-400' : 'text-gray-200 fill-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-800 ml-2">{newRating} Stars</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Review Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Excellent sound quality!"
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00875a] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Your Review</label>
                <textarea
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share details of your experience with sound quality, comfort, battery life..."
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00875a] outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWriteReviewOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#00875a] hover:bg-[#00724c] text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
