import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div
      data-testid="product-card-skeleton"
      className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col justify-between animate-pulse shadow-2xs"
    >
      {/* Thumbnail placeholder */}
      <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3.5 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-gray-200/60" />
      </div>

      {/* Product metadata placeholder */}
      <div className="space-y-2.5">
        {/* Title bar */}
        <div className="h-4 bg-gray-200 rounded-md w-4/5" />

        {/* Rating stars placeholder */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-gray-200" />
            ))}
          </div>
          <div className="h-3 bg-gray-200 rounded w-10 ml-1" />
        </div>

        {/* Price & Add-to-cart button placeholder */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="h-5 bg-gray-200 rounded-md w-16" />
          <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
        </div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};
