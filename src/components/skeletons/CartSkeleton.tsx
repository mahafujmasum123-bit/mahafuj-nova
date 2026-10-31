import React from 'react';

export const CartSkeleton: React.FC = () => {
  return (
    <div data-testid="cart-page-skeleton" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="bg-gray-100 rounded-3xl p-8 mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded-lg w-56" />
          <div className="h-4 bg-gray-200 rounded w-40" />
        </div>
        <div className="w-32 h-20 bg-gray-200 rounded-2xl" />
      </div>

      {/* Main 2-column cart layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Cart Items (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-36" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>

            {/* Skeleton Cart rows */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="w-18 h-18 bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-16" />
                <div className="w-20 h-7 bg-gray-200 rounded-lg" />
                <div className="h-5 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>

          {/* Promo code box placeholder */}
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-40" />
            <div className="h-9 bg-gray-200 rounded-xl w-48" />
          </div>
        </div>

        {/* Right column: Order Summary Card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32 pb-2" />
          <div className="h-14 bg-gray-100 rounded-xl w-full" />
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-12" />
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <div className="h-6 bg-gray-200 rounded w-28" />
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
          </div>
          <div className="h-12 bg-gray-200 rounded-xl w-full mt-4" />
        </div>
      </div>
    </div>
  );
};
