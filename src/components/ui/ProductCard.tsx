import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addToCart } from '../../features/cart/cartSlice';
import { toggleWishlist } from '../../features/ui/uiSlice';
import { addToast } from '../../features/toast/toastSlice';
import { ShoppingBag, Star, Heart } from 'lucide-react';
import { SeedProduct } from '../../../server/data/initialData';
import { DEFAULT_ADD_TO_CART_QUANTITY } from '../../utils/ecommerceRules';
import { useCartFly } from '../../context/CartFlyContext';
import { toggleWishlistOnServer } from '../../utils/wishlistApi';

interface ProductCardProps {
  product: SeedProduct;
  onViewProduct: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewProduct }) => {
  const dispatch = useAppDispatch();
  const { triggerCartFly } = useCartFly();
  const wishlist = useAppSelector((state) => state.ui.wishlistProductIds);
  const isWishlisted = wishlist.includes(product.id);

  const effectivePrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) {
      dispatch(addToast({ type: 'warning', message: `"${product.name}" is currently out of stock.` }));
      return;
    }

    // Trigger visual flying animation toward navigation cart icon
    triggerCartFly(e.currentTarget as HTMLElement, product.images[0]?.url || '');

    const qtyToAdd = Math.min(DEFAULT_ADD_TO_CART_QUANTITY, product.stock);

    dispatch(
      addToCart({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        quantity: DEFAULT_ADD_TO_CART_QUANTITY,
        image: product.images[0]?.url || '',
        stock: product.stock,
      })
    );

    dispatch(
      addToast({
        type: 'success',
        title: 'Added to Cart',
        message: `${qtyToAdd}x ${product.name} added to your cart.`,
      })
    );
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
          ? `Removed ${product.name} from your wishlist.`
          : `Saved ${product.name} to your wishlist.`,
      })
    );
  };

  return (
    <div
      onClick={() => onViewProduct(product.slug)}
      className="group relative bg-white rounded-2xl border border-gray-100 hover:border-emerald-200/80 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-4 flex flex-col justify-between cursor-pointer"
    >
      {/* Top badges & Wishlist */}
      <div className="relative w-full aspect-square bg-[#f8faf9] rounded-xl overflow-hidden flex items-center justify-center p-3 mb-3.5">
        {product.badge && (
          <span
            className={`absolute top-2.5 left-2.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full z-10 ${
              product.badge.includes('%')
                ? 'bg-[#00875a] text-white'
                : product.badge === 'Hot'
                ? 'bg-amber-500 text-white'
                : 'bg-[#00875a] text-white'
            }`}
          >
            {product.badge}
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center z-10 transition ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 shadow-xs'
              : 'bg-white/80 text-gray-400 hover:text-rose-600 shadow-2xs hover:bg-white'
          }`}
          aria-label="Wishlist toggle"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
        </button>

        {/* Product photo */}
        <img
          src={product.images[0]?.url}
          alt={product.images[0]?.alt || product.name}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Product metadata */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-emerald-800 transition line-clamp-1">
          {product.name}
        </h3>

        {/* Rating and review count */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(product.ratingAverage)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-200 fill-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-gray-700">
            {product.ratingAverage.toFixed(1)}
          </span>
          <span className="text-[11px] text-gray-400">
            ({product.reviewCount > 1000 ? `${(product.reviewCount / 1000).toFixed(1)}k` : product.reviewCount})
          </span>
        </div>

        {/* Price & Quick Add Button */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
          <div>
            <span className="text-sm sm:text-base font-extrabold text-gray-900">
              ${effectivePrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through ml-1.5 font-normal">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className="w-8 h-8 rounded-full bg-[#00875a] hover:bg-[#00724c] text-white flex items-center justify-center transition shadow-xs hover:scale-105 shrink-0 cursor-pointer"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
