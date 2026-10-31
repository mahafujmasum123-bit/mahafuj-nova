import React from 'react';
import { ProductGridSkeleton } from './ProductCardSkeleton';

export const ShopSkeleton: React.FC = () => {
  return (
    <div data-testid="shop-page-skeleton" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
      {/* Top Header & Breadcrumbs Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded-lg w-48" />
          <div className="h-3 bg-gray-200 rounded w-32" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 bg-gray-200 rounded-xl w-32" />
        </div>
      </div>

      {/* Main Shop Layout: Sidebar Filters (desktop) + Product Grid */}
      <div className="flex gap-8 items-start mt-6">
        {/* Left Sidebar Skeleton (desktop) */}
        <div className="hidden md:block w-64 space-y-6 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3.5 bg-gray-200 rounded w-28" />
                  <div className="h-3.5 bg-gray-200 rounded w-6" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-8 bg-gray-200 rounded-xl w-full" />
          </div>
        </div>

        {/* Right Product Grid Skeleton */}
        <div className="flex-1">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
};
