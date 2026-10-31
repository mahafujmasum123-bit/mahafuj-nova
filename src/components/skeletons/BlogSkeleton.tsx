import React from 'react';

export const BlogSkeleton: React.FC = () => {
  return (
    <div data-testid="blog-page-skeleton" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Blog header skeleton */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="h-4 bg-gray-200 rounded w-28 mx-auto" />
        <div className="h-9 bg-gray-200 rounded-lg w-72 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-64 mx-auto" />
      </div>

      {/* Featured article skeleton */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
        <div className="md:col-span-7 aspect-[16/9] bg-gray-200 rounded-2xl" />
        <div className="md:col-span-5 flex flex-col justify-center space-y-4">
          <div className="h-5 bg-gray-200 rounded-full w-24" />
          <div className="h-7 bg-gray-200 rounded-lg w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="space-y-1.5">
              <div className="h-3.5 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Articles grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden p-4 space-y-3">
            <div className="aspect-[16/10] bg-gray-200 rounded-xl" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-5 bg-gray-200 rounded w-4/5" />
            <div className="h-3.5 bg-gray-200 rounded w-full" />
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
