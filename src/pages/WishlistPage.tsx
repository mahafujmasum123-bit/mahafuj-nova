import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { addToCart } from '../features/cart/cartSlice';
import { toggleWishlist, setWishlistProductIds } from '../features/ui/uiSlice';
import { addToast } from '../features/toast/toastSlice';
import { SeedProduct, INITIAL_PRODUCTS } from '../../server/data/initialData';
import { useDelayedSkeleton } from '../hooks/useDelayedSkeleton';
import { WishlistSkeleton } from '../components/skeletons/WishlistSkeleton';
import { useCartFly } from '../context/CartFlyContext';
import {
  fetchWishlist,
  removeFromWishlistOnServer,
  clearWishlistOnServer,
  toggleWishlistOnServer,
  moveAllWishlistToCart,
} from '../utils/wishlistApi';
import {
  Heart,
  ShoppingCart,
  ShoppingBag,
  Trash2,
  Star,
  X,
  ChevronDown,
  MoreVertical,
  Eye,
  Headphones,
  Truck,
  ShieldCheck,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
  Check,
  Percent,
} from 'lucide-react';

interface WishlistPageProps {
  onViewProduct: (slug: string) => void;
  onNavigateToShop: () => void;
  onNavigateToContact?: () => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  onViewProduct,
  onNavigateToShop,
  onNavigateToContact,
}) => {
  const dispatch = useAppDispatch();
  const { triggerCartFly } = useCartFly();
  const wishlistIds = useAppSelector((state) => state.ui.wishlistProductIds);

  const [products, setProducts] = useState<SeedProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Recently viewed / recommended items for the right sidebar
  const recentlyViewedProducts: SeedProduct[] = [
    INITIAL_PRODUCTS.find((p) => p.id === 'prod-3') || INITIAL_PRODUCTS[2], // Laptop Backpack
    INITIAL_PRODUCTS.find((p) => p.id === 'prod-4') || INITIAL_PRODUCTS[3], // Running Shoes
    INITIAL_PRODUCTS.find((p) => p.id === 'prod-2') || INITIAL_PRODUCTS[1], // Smart Watch
    INITIAL_PRODUCTS.find((p) => p.id === 'prod-5') || INITIAL_PRODUCTS[4], // Sunglasses
  ].filter(Boolean) as SeedProduct[];

  // Load wishlist from backend
  const loadWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWishlist();
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data);
        dispatch(setWishlistProductIds(data.productIds || []));
        // Select all by default
        setSelectedIds(data.productIds || []);
      }
    } catch (err) {
      console.error('Failed to load wishlist from server, using local fallback', err);
      // Fallback to match seed products by wishlistIds
      const fallback = INITIAL_PRODUCTS.filter((p) => wishlistIds.includes(p.id));
      setProducts(fallback);
      setSelectedIds(fallback.map((p) => p.id));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Keep selection synced if items are removed
  useEffect(() => {
    const validIds = new Set(products.map((p) => p.id));
    setSelectedIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [products]);

  // Checkbox handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  // Quantity handler
  const handleQuantityChange = (productId: string, qty: number) => {
    setItemQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, qty),
    }));
  };

  // Add individual item to cart
  const handleAddToCart = (product: SeedProduct, e?: React.MouseEvent) => {
    if (product.stock <= 0) {
      dispatch(
        addToast({
          type: 'warning',
          message: `"${product.name}" is currently out of stock.`,
        })
      );
      return;
    }

    if (e && e.currentTarget) {
      triggerCartFly(e.currentTarget as HTMLElement, product.images[0]?.url || '');
    }

    const qty = itemQuantities[product.id] || 1;

    dispatch(
      addToCart({
        productId: product.id,
        variantId: product.variants?.[0]?.id,
        variantName: product.variants?.[0]?.name,
        sku: product.sku,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        quantity: qty,
        image: product.images[0]?.url || '',
        stock: product.stock,
      })
    );

    dispatch(
      addToast({
        type: 'success',
        title: 'Added to Cart',
        message: `${qty}x "${product.name}" added to your cart.`,
      })
    );
  };

  // Move all or selected items to cart
  const handleMoveAllToCart = async (e?: React.MouseEvent) => {
    if (products.length === 0) return;

    const targetIds = selectedIds.length > 0 ? selectedIds : products.map((p) => p.id);
    const availableProds = products.filter((p) => targetIds.includes(p.id) && p.stock > 0);

    if (availableProds.length === 0) {
      dispatch(
        addToast({
          type: 'warning',
          message: 'Selected items are currently out of stock.',
        })
      );
      return;
    }

    if (e && e.currentTarget) {
      triggerCartFly(e.currentTarget as HTMLElement, availableProds[0]?.images[0]?.url || '');
    }

    setIsProcessing(true);
    try {
      // Add each available item to client Redux cart
      for (const prod of availableProds) {
        const qty = itemQuantities[prod.id] || 1;
        dispatch(
          addToCart({
            productId: prod.id,
            variantId: prod.variants?.[0]?.id,
            variantName: prod.variants?.[0]?.name,
            sku: prod.sku,
            name: prod.name,
            price: prod.price,
            salePrice: prod.salePrice,
            quantity: qty,
            image: prod.images[0]?.url || '',
            stock: prod.stock,
          })
        );
      }

      // Sync move with backend
      await moveAllWishlistToCart(availableProds.map((p) => p.id));

      // Remove moved items from local wishlist
      const movedIdsSet = new Set(availableProds.map((p) => p.id));
      const remaining = products.filter((p) => !movedIdsSet.has(p.id));
      setProducts(remaining);
      dispatch(setWishlistProductIds(remaining.map((p) => p.id)));

      dispatch(
        addToast({
          type: 'success',
          title: 'Moved to Cart',
          message: `Successfully moved ${availableProds.length} item${
            availableProds.length === 1 ? '' : 's'
          } to your cart.`,
        })
      );
    } catch (err: any) {
      console.error('Error moving all to cart:', err);
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to move items to cart' }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove a single product from wishlist
  const handleRemoveItem = async (productId: string, productName: string) => {
    try {
      await removeFromWishlistOnServer(productId);
      const updated = products.filter((p) => p.id !== productId);
      setProducts(updated);
      dispatch(setWishlistProductIds(updated.map((p) => p.id)));
      dispatch(
        addToast({
          type: 'info',
          message: `Removed "${productName}" from your wishlist.`,
        })
      );
    } catch (err: any) {
      console.error('Failed to remove item:', err);
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to remove product' }));
    }
  };

  // Clear entire wishlist
  const handleClearWishlist = async () => {
    setIsProcessing(true);
    try {
      await clearWishlistOnServer();
      setProducts([]);
      setSelectedIds([]);
      dispatch(setWishlistProductIds([]));
      setShowClearConfirm(false);
      dispatch(
        addToast({
          type: 'success',
          title: 'Wishlist Cleared',
          message: 'All items have been removed from your wishlist.',
        })
      );
    } catch (err: any) {
      console.error('Failed to clear wishlist:', err);
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to clear wishlist' }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle wishlist for sidebar items
  const handleSidebarToggle = async (product: SeedProduct) => {
    try {
      const res = await toggleWishlistOnServer(product.id);
      dispatch(setWishlistProductIds(res.productIds));
      if (res.action === 'added') {
        setProducts((prev) => [...prev, product]);
        dispatch(
          addToast({
            type: 'success',
            title: 'Saved to Wishlist',
            message: `"${product.name}" has been added to your wishlist.`,
          })
        );
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        dispatch(
          addToast({
            type: 'info',
            message: `Removed "${product.name}" from your wishlist.`,
          })
        );
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const showSkeleton = useDelayedSkeleton(loading);

  if (loading) {
    if (showSkeleton) {
      return <WishlistSkeleton />;
    }
    return null;
  }

  const allSelected = products.length > 0 && selectedIds.length === products.length;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-7 font-sans text-gray-800">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-gray-400 font-medium flex items-center gap-2">
        <button
          onClick={onNavigateToShop}
          className="hover:text-emerald-700 transition cursor-pointer"
        >
          Home
        </button>
        <span className="text-gray-300">&gt;</span>
        <span className="text-emerald-700 font-semibold">Wishlist</span>
      </nav>

      {/* 2. Hero Header Banner matching reference image */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#eef9f4] via-[#f3faf7] to-[#e6f6ee] border border-emerald-100/80 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
        {/* Left: Icon container and title */}
        <div className="flex items-center gap-5 z-10">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#daf2e6] border border-emerald-200/80 flex items-center justify-center text-emerald-800 shadow-xs shrink-0">
            <Heart className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-800 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
              My Wishlist
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Your favorite items, all in one place.
            </p>
          </div>
        </div>

        {/* Right: Decorative ShopMax shopping bag composition & cursive badge matching reference image */}
        <div className="relative flex items-center gap-7 z-10 self-center md:self-auto">
          {/* Cursive text in Caveat font matching reference image */}
          <div className="text-right hidden sm:block select-none">
            <div className="font-['Caveat',cursive] text-emerald-700 text-2xl sm:text-3xl font-bold leading-tight drop-shadow-xs">
              Save Today
            </div>
            <div className="font-['Caveat',cursive] text-emerald-700 text-2xl sm:text-3xl font-bold flex items-center justify-end gap-1">
              <span>Shop Tomorrow</span>
              <span className="text-emerald-600">♡</span>
            </div>
          </div>

          {/* Plant & ShopMax Shopping Bag artwork */}
          <div className="relative flex items-end">
            {/* Ceramic white pot with lush succulent plant */}
            <div className="relative z-10 -mr-4 flex flex-col items-center">
              {/* Plant leaves SVG */}
              <svg viewBox="0 0 80 70" className="w-16 h-14 -mb-2 drop-shadow-sm">
                <path d="M40 50 C25 40 10 25 15 10 C25 20 35 35 40 50 Z" fill="#2d8a56" />
                <path d="M40 50 C55 40 70 25 65 10 C55 20 45 35 40 50 Z" fill="#237045" />
                <path d="M40 50 C30 30 20 15 32 5 C38 18 40 35 40 50 Z" fill="#34a867" />
                <path d="M40 50 C50 30 60 15 48 5 C42 18 40 35 40 50 Z" fill="#1b5a36" />
                <path d="M40 50 C38 25 40 12 40 2 C40 12 42 25 40 50 Z" fill="#48c77e" />
              </svg>
              {/* White minimalist ceramic pot */}
              <div className="w-12 h-12 rounded-b-xl rounded-t-sm bg-gradient-to-b from-[#fdfdfd] to-[#e5e7eb] border border-gray-200/80 shadow-md" />
            </div>

            {/* Branded ShopMax Green Bag */}
            <div className="w-22 h-26 sm:w-26 sm:h-32 rounded-2xl bg-gradient-to-br from-[#0c4a34] via-[#0a3827] to-[#06241a] shadow-xl p-3 flex flex-col items-center justify-between text-white border border-emerald-600/30 relative z-20">
              {/* Bag Rope Handles */}
              <div className="w-10 h-5 border-[2.5px] border-white/70 border-b-0 rounded-t-full -mt-6 drop-shadow-xs" />
              <div className="my-auto flex flex-col items-center gap-1.5 pt-1">
                {/* ShopMax leaf emblem */}
                <div className="w-7 h-7 rounded-xl bg-emerald-600/50 border border-emerald-400/40 flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-4 h-4 text-emerald-200" />
                </div>
                <div className="text-xs font-black tracking-wider text-white">ShopMax</div>
              </div>
              <div className="w-full h-0.5 bg-emerald-700/40 rounded-full" />
            </div>

            {/* 3D White Porcelain Heart */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-200 shadow-md flex items-center justify-center text-rose-500 absolute -right-3 top-6 text-xs z-30 border border-white">
              <span className="drop-shadow-xs">❤</span>
            </div>
          </div>
        </div>

        {/* Ambient background light gradients */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
        {/* Left Column: Wishlist Card (approx 70% width: 8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100/90 shadow-sm p-5 sm:p-7 space-y-6">
          {/* Header row matching reference image */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0c261e] text-white flex items-center justify-center shadow-xs">
                <Heart className="w-4 h-4 fill-white text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  My Wishlist ({products.length})
                </h2>
                <p className="text-xs text-gray-400">Items you've saved for later</p>
              </div>
            </div>

            {/* Right action buttons: Move All to Cart & Clear Wishlist */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleMoveAllToCart}
                disabled={products.length === 0 || isProcessing}
                className="border border-emerald-600 text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />
                <span>Move All to Cart</span>
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={products.length === 0 || isProcessing}
                className="border border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                <span>Clear Wishlist</span>
              </button>
            </div>
          </div>

          {/* Select all header bar */}
          {products.length > 0 && (
            <div className="flex items-center justify-between text-xs text-gray-500 px-2 py-1 bg-[#fafcfb] rounded-xl border border-gray-100">
              <label className="flex items-center gap-2.5 cursor-pointer font-medium select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Select All ({selectedIds.length}/{products.length} items)</span>
              </label>
              {selectedIds.length > 0 && selectedIds.length < products.length && (
                <span className="text-emerald-700 font-semibold text-[11px]">
                  {selectedIds.length} items selected
                </span>
              )}
            </div>
          )}

          {/* Empty State */}
          {products.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <Heart className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">Your wishlist is currently empty</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Explore our curated collection of electronics, footwear, and accessories to save your favorites.
                </p>
              </div>
              <button
                onClick={onNavigateToShop}
                className="mt-2 px-6 py-2.5 bg-[#00875a] hover:bg-[#00724c] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                Explore Catalog
              </button>
            </div>
          ) : (
            /* Items List Rows matching reference image */
            <div className="divide-y divide-gray-100">
              {products.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                const effectivePrice =
                  product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
                const hasDiscount = product.salePrice && product.salePrice < product.price;
                const discountPercent = hasDiscount
                  ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
                  : 0;
                const currentQty = itemQuantities[product.id] || 1;

                // Color swatch dots logic
                const colorHexes: string[] = [];
                if (product.variants && product.variants.length > 0) {
                  product.variants.forEach((v) => {
                    const hex = v.options?.hex || (v.options?.Color === 'Black' ? '#111827' : v.options?.Color === 'Navy Blue' ? '#1e3a8a' : v.options?.Color === 'Beige' ? '#e5d5be' : '#6b7280');
                    if (!colorHexes.includes(hex)) colorHexes.push(hex);
                  });
                }
                if (colorHexes.length === 0) {
                  colorHexes.push('#111827', '#1e3a8a');
                }

                return (
                  <div
                    key={product.id}
                    className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-[#fbfdfc] transition-colors -mx-2 px-2 rounded-2xl"
                  >
                    {/* Left: Checkbox + Product Thumbnail + Information */}
                    <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                      {/* Selection Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(product.id)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                        aria-label={`Select ${product.name}`}
                      />

                      {/* Thumbnail Container with red heart icon */}
                      <div
                        onClick={() => onViewProduct(product.slug)}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#f8faf9] border border-gray-100 p-2 relative flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group-hover:border-emerald-200 transition"
                      >
                        <img
                          src={product.images[0]?.url || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&q=80'}
                          alt={product.name}
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Red heart badge */}
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center">
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                        </div>
                      </div>

                      {/* Product Title, Rating, Stock & Swatches */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <h3
                          onClick={() => onViewProduct(product.slug)}
                          className="text-xs sm:text-sm font-bold text-gray-900 hover:text-emerald-700 transition cursor-pointer line-clamp-2"
                        >
                          {product.name}
                        </h3>

                        {/* Stars & Reviews */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < Math.floor(product.ratingAverage || 4.5)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-200 fill-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-gray-700 text-[11px]">
                            {(product.ratingAverage || 4.6).toFixed(1)}
                          </span>
                          <span className="text-gray-400 text-[11px]">
                            ({(product.reviewCount || 1200).toLocaleString()} reviews)
                          </span>
                        </div>

                        {/* Stock Pill & Color Swatches */}
                        <div className="flex items-center gap-2.5 pt-0.5">
                          {product.stock > 0 ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold inline-flex items-center gap-1">
                              In Stock
                            </span>
                          ) : (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200/60 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold inline-flex items-center gap-1">
                              Out of Stock
                            </span>
                          )}

                          {/* Swatches */}
                          <div className="flex items-center gap-1">
                            {colorHexes.slice(0, 3).map((hex, idx) => (
                              <span
                                key={idx}
                                className="w-3 h-3 rounded-full border border-gray-300 shadow-2xs"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Pricing + Quantity + Add to Cart + Actions */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between md:justify-end pl-7 md:pl-0">
                      {/* Pricing column */}
                      <div className="text-left md:text-right space-y-0.5">
                        <div className="flex items-center md:justify-end gap-1.5 flex-wrap">
                          <span className="text-sm sm:text-base font-extrabold text-emerald-800">
                            ${effectivePrice.toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <span className="inline-block bg-[#0c4a34] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      {/* Quantity Select Dropdown matching reference image */}
                      <div className="relative">
                        <select
                          value={currentQty}
                          onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value, 10))}
                          className="appearance-none bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-1.5 pr-7 text-xs font-semibold text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                          aria-label="Quantity"
                        >
                          {[1, 2, 3, 4, 5, 10].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
                      </div>

                      {/* Add to Cart button */}
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.stock <= 0}
                        className="bg-[#00875a] hover:bg-[#00724c] active:bg-[#00603f] text-white font-bold text-xs rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 shadow-xs hover:shadow-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-white" />
                        <span className="hidden sm:inline">Add to Cart</span>
                      </button>

                      {/* More options button */}
                      <button
                        onClick={() => onViewProduct(product.slug)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
                        title="View product details"
                        aria-label="View product details"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Remove item button */}
                      <button
                        onClick={() => handleRemoveItem(product.id, product.name)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title="Remove from wishlist"
                        aria-label={`Remove ${product.name} from wishlist`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: 3 Sidebar Cards (approx 30% width: 4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Card 1: Special Offer Banner Card matching reference image */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c261e] via-[#093327] to-[#0c261e] text-white p-6 shadow-sm border border-emerald-900/40 space-y-4">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-1.5 bg-white/10 text-emerald-300 text-[11px] font-semibold px-3 py-1 rounded-full border border-white/10 backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Special Offer</span>
            </div>

            {/* Headline and subtext */}
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Turn Your Wishlist Into Reality
              </h3>
              <p className="text-xs text-emerald-200/80 leading-relaxed">
                Get exclusive discounts on your favorite items.
              </p>
            </div>

            {/* Button */}
            <div>
              <button
                onClick={onNavigateToShop}
                className="bg-white hover:bg-emerald-50 text-[#0c261e] font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer group"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Visual composition: Watch, earbuds & podium with floating % */}
            <div className="pt-2 flex items-end justify-center relative">
              {/* Podium surface matching reference image */}
              <div className="w-56 h-14 bg-gradient-to-t from-emerald-950/80 to-[#123d30] rounded-2xl border border-emerald-500/30 shadow-inner relative flex items-center justify-between px-4">
                {/* White earbuds standing on podium */}
                <div className="absolute -top-10 left-6 w-14 h-16 rounded-2xl bg-white/95 p-1.5 shadow-xl border border-gray-100 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=240&q=80"
                    alt="Wireless Earbuds"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Smart watch standing on podium */}
                <div className="absolute -top-16 right-6 w-18 h-22 rounded-2xl bg-gray-950 p-2 shadow-2xl border border-emerald-500/40 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=240&q=80"
                    alt="Smart Watch"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>

                {/* Floating percentage badge */}
                <div className="absolute -top-6 right-2 w-9 h-9 rounded-full bg-[#00875a] text-white font-black text-sm flex items-center justify-center shadow-lg border-2 border-[#0c261e]">
                  %
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Recently Viewed / You might also like these */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Recently Viewed</h4>
                <p className="text-[11px] text-gray-400">You might also like these</p>
              </div>
            </div>

            {/* Compact items list */}
            <div className="space-y-3.5">
              {recentlyViewedProducts.map((prod) => {
                const inWishlist = wishlistIds.includes(prod.id);
                return (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between gap-3 group"
                  >
                    <div
                      onClick={() => onViewProduct(prod.slug)}
                      className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={prod.images[0]?.url}
                          alt={prod.name}
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-gray-900 truncate group-hover:text-emerald-700 transition">
                          {prod.name}
                        </h5>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-extrabold text-gray-800">
                            ${(prod.salePrice || prod.price).toFixed(2)}
                          </span>
                          <div className="flex items-center text-[10px] text-gray-400 font-medium">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 mr-0.5" />
                            <span>{(prod.ratingAverage || 4.5).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Red heart toggle button */}
                    <button
                      onClick={() => handleSidebarToggle(prod)}
                      className="p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer shrink-0"
                      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                      aria-label={`Toggle wishlist for ${prod.name}`}
                    >
                      <Heart
                        className={`w-4 h-4 transition ${
                          inWishlist
                            ? 'text-rose-500 fill-rose-500 scale-105'
                            : 'text-gray-300 hover:text-rose-500'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Need Help? Support Card matching reference image pale mint green */}
          <div className="bg-[#eef9f4] rounded-3xl border border-emerald-100/80 shadow-2xs p-5 space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Need Help?</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Our support team is here for you.
              </p>
            </div>
            <button
              onClick={() => {
                if (onNavigateToContact) {
                  onNavigateToContact();
                } else {
                  window.location.href = '/contact';
                }
              }}
              className="w-full bg-[#00875a] hover:bg-[#00724c] active:bg-[#00603f] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Contact Support</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      </div>

      {/* 4. Bottom Trust & Service Badges matching reference layout */}
      <section className="pt-6 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/60 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-xs shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Free Shipping</div>
              <div className="text-[11px] text-gray-400">On orders over $50</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/60 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Secure Payment</div>
              <div className="text-[11px] text-gray-400">100% safe & secure</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/60 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-xs shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">30 Days Return</div>
              <div className="text-[11px] text-gray-400">Hassle-free returns</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/60 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-xs shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">24/7 Support</div>
              <div className="text-[11px] text-gray-400">We're here to help</div>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Modal for Clear Wishlist */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-gray-900">Clear Entire Wishlist?</h4>
              <p className="text-xs text-gray-500">
                Are you sure you want to remove all {products.length} saved products? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearWishlist}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
