import React from 'react';

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div
      data-testid="product-detail-skeleton"
      className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-pulse"
    >
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-3.5 bg-gray-200 rounded w-12" />
        <div className="h-3.5 bg-gray-200 rounded w-4" />
        <div className="h-3.5 bg-gray-200 rounded w-20" />
        <div className="h-3.5 bg-gray-200 rounded w-4" />
        <div className="h-3.5 bg-gray-200 rounded w-32" />
      </div>

      {/* Main product hero layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Gallery */}
        <div className="lg:col-span-6 flex flex-col sm:flex-row gap-4">
          {/* Thumbnails strip */}
          <div className="order-2 sm:order-1 flex sm:flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gray-200 shrink-0" />
            ))}
          </div>

          {/* Large image placeholder */}
          <div className="order-1 sm:order-2 flex-1 bg-gray-100 rounded-3xl min-h-[380px] sm:min-h-[460px] lg:h-[480px] flex items-center justify-center p-8 border border-gray-200/50">
            <div className="w-48 h-48 rounded-full bg-gray-200/70" />
          </div>
        </div>

        {/* Right Column: Info & Action Buttons */}
        <div className="lg:col-span-6 space-y-5">
          <div className="space-y-3">
            <div className="h-5 bg-gray-200 rounded-full w-24" />
            <div className="h-8 bg-gray-200 rounded-lg w-4/5" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>

          {/* Pricing skeleton */}
          <div className="flex items-baseline gap-3 pt-2">
            <div className="h-10 bg-gray-200 rounded-lg w-28" />
            <div className="h-6 bg-gray-200 rounded w-20" />
            <div className="h-6 bg-gray-200 rounded-md w-16" />
          </div>

          {/* Feature pills skeleton */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded-xl w-32" />
            ))}
          </div>

          {/* Description paragraph lines */}
          <div className="space-y-2 pt-2">
            <div className="h-3.5 bg-gray-200 rounded w-full" />
            <div className="h-3.5 bg-gray-200 rounded w-5/6" />
            <div className="h-3.5 bg-gray-200 rounded w-2/3" />
          </div>

          {/* Color variants selector skeleton */}
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="flex gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gray-200" />
              ))}
            </div>
          </div>

          {/* Buttons skeleton */}
          <div className="flex items-center gap-3 pt-4">
            <div className="w-28 h-12 bg-gray-200 rounded-xl" />
            <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
            <div className="w-32 h-12 bg-gray-200 rounded-xl" />
          </div>

          {/* Trust badges row */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
