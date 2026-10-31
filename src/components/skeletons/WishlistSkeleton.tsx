import React from 'react';

export const WishlistSkeleton: React.FC = () => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-8 animate-pulse" aria-busy="true" aria-label="Loading wishlist">
      {/* 1. Breadcrumbs Skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-12 h-3.5 bg-gray-200 rounded-md" />
        <div className="w-3 h-3 bg-gray-200 rounded-full" />
        <div className="w-16 h-3.5 bg-gray-200 rounded-md" />
      </div>

      {/* 2. Hero Banner Skeleton */}
      <div className="rounded-3xl bg-emerald-50/50 border border-emerald-100/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 shrink-0" />
          <div className="space-y-2">
            <div className="w-48 h-8 bg-gray-200/80 rounded-lg" />
            <div className="w-64 h-4 bg-gray-200/60 rounded-md" />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="w-36 h-24 bg-emerald-100/60 rounded-2xl" />
        </div>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Wishlist Card (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200" />
              <div className="space-y-1.5">
                <div className="w-32 h-5 bg-gray-200 rounded-md" />
                <div className="w-40 h-3.5 bg-gray-200/70 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 h-9 bg-gray-200 rounded-xl" />
              <div className="w-28 h-9 bg-gray-200 rounded-xl" />
            </div>
          </div>

          {/* 6 Item Rows Skeleton */}
          <div className="divide-y divide-gray-100">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="py-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-4 h-4 rounded bg-gray-200 shrink-0" />
                  <div className="w-24 h-24 rounded-2xl bg-gray-100 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="w-3/4 h-4 bg-gray-200 rounded-md" />
                    <div className="w-32 h-3.5 bg-gray-200/80 rounded-md" />
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-5 bg-emerald-100 rounded-full" />
                      <div className="w-4 h-4 rounded-full bg-gray-200" />
                      <div className="w-4 h-4 rounded-full bg-gray-200" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 sm:pl-4 justify-between sm:justify-end">
                  <div className="space-y-1 text-right">
                    <div className="w-16 h-5 bg-gray-200 rounded-md ml-auto" />
                    <div className="w-12 h-3.5 bg-gray-200/60 rounded-md ml-auto" />
                  </div>
                  <div className="w-12 h-9 bg-gray-100 rounded-xl" />
                  <div className="w-28 h-10 bg-emerald-100 rounded-xl" />
                  <div className="w-5 h-5 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: 3 Sidebar Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Special Offer Banner */}
          <div className="rounded-3xl bg-[#0c261e]/90 p-6 space-y-4">
            <div className="w-24 h-5 bg-emerald-800/60 rounded-full" />
            <div className="w-4/5 h-6 bg-emerald-700/50 rounded-lg" />
            <div className="w-3/4 h-4 bg-emerald-800/40 rounded-md" />
            <div className="w-28 h-9 bg-white/40 rounded-xl" />
          </div>

          {/* Card 2: Recently Viewed */}
          <div className="rounded-3xl bg-white border border-gray-100 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100/70" />
              <div className="space-y-1">
                <div className="w-28 h-4 bg-gray-200 rounded-md" />
                <div className="w-36 h-3 bg-gray-200/60 rounded-md" />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="w-24 h-3.5 bg-gray-200 rounded-md" />
                      <div className="w-12 h-3 bg-gray-200/70 rounded-md" />
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-rose-100" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Need Help */}
          <div className="rounded-3xl bg-white border border-gray-100 p-5 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-emerald-100" />
            <div className="w-24 h-4 bg-gray-200 rounded-md" />
            <div className="w-40 h-3 bg-gray-200/70 rounded-md" />
            <div className="w-full h-10 bg-emerald-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
