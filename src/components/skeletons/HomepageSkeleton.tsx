import React from 'react';
import { ProductGridSkeleton } from './ProductCardSkeleton';

export const HomepageSkeleton: React.FC = () => {
  return (
    <div data-testid="homepage-skeleton" className="space-y-12 pb-16 animate-pulse">
      {/* Hero Slider Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="relative rounded-3xl bg-gray-100 overflow-hidden min-h-[420px] sm:min-h-[500px] flex items-center p-8 sm:p-14 border border-gray-200/50">
          <div className="max-w-xl space-y-4">
            <div className="h-6 bg-gray-200 rounded-full w-28" />
            <div className="h-12 bg-gray-200 rounded-2xl w-4/5" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-12 bg-gray-200 rounded-xl w-36 mt-4" />
          </div>
        </div>
      </div>

      {/* Categories strip skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex gap-4 overflow-hidden py-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 min-w-[180px]">
              <div className="w-12 h-12 rounded-xl bg-gray-200" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-3 bg-gray-200 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Products Section Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between pb-2">
          <div className="space-y-1">
            <div className="h-7 bg-gray-200 rounded-lg w-48" />
            <div className="h-3.5 bg-gray-200 rounded w-64" />
          </div>
          <div className="h-8 bg-gray-200 rounded-xl w-24" />
        </div>

        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
};
