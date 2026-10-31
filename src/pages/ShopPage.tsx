import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/ui/ProductCard';
import { SeedProduct } from '../../server/data/initialData';
import { Filter, SlidersHorizontal, ArrowUpDown, X, Tag } from 'lucide-react';
import { useDelayedSkeleton } from '../hooks/useDelayedSkeleton';
import { ShopSkeleton } from '../components/skeletons/ShopSkeleton';

interface ShopPageProps {
  initialCategory?: string;
  initialQuery?: string;
  onViewProduct: (slug: string) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  initialCategory,
  initialQuery,
  onViewProduct,
}) => {
  const [products, setProducts] = useState<SeedProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(1500);
  const [sortOption, setSortOption] = useState<string>('popular');
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery || '');
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    if (initialCategory !== undefined) setSelectedCategory(initialCategory);
    if (initialQuery !== undefined) setSearchQuery(initialQuery);
  }, [initialCategory, initialQuery]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        if (catData.success) setCategories(catData.data);

        let list: SeedProduct[] = [];

        if (searchQuery.trim()) {
          const searchRes = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery.trim())}&limit=50`);
          const searchData = await searchRes.json();
          if (searchData.success && Array.isArray(searchData.data)) {
            list = searchData.data;
          }
        } else {
          let url = `/api/products?limit=50`;
          if (selectedCategory && selectedCategory !== 'all') url += `&category=${selectedCategory}`;
          if (selectedBrand && selectedBrand !== 'all') url += `&brand=${selectedBrand}`;
          if (sortOption) url += `&sort=${sortOption}`;

          const prodRes = await fetch(url);
          const prodData = await prodRes.json();
          if (prodData.success && Array.isArray(prodData.data)) {
            list = prodData.data;
          }
        }

        if (selectedCategory && selectedCategory !== 'all' && searchQuery.trim()) {
          list = list.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());
        }
        if (selectedBrand && selectedBrand !== 'all') {
          list = list.filter((p) => p.brand?.toLowerCase() === selectedBrand.toLowerCase());
        }

        list = list.filter((p) => (p.salePrice || p.price) <= priceRange);
        setProducts(list);
      } catch (err) {
        console.error('Error loading shop products', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedCategory, selectedBrand, sortOption, priceRange, searchQuery]);

  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setPriceRange(1500);
    setSearchQuery('');
    setSortOption('popular');
  };

  const showSkeleton = useDelayedSkeleton(loading);

  if (loading) {
    if (showSkeleton) {
      return <ShopSkeleton />;
    }
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
        <div>
          <div className="text-xs text-gray-400 font-medium mb-1">
            Home / Shop {selectedCategory !== 'all' ? `/ ${selectedCategory}` : ''}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {searchQuery ? `Results for "${searchQuery}"` : selectedCategory !== 'all' ? selectedCategory : 'All Products'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Showing {products.length} {products.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Sorting & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <Filter className="w-3.5 h-3.5 text-emerald-800" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-8">
        {/* Desktop Filter Sidebar */}
        <aside className={`md:block ${mobileFilterOpen ? 'block' : 'hidden'} md:col-span-1 space-y-6`}>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
                <span>Filters</span>
              </div>
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2.5">
                Category
              </label>
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`block w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-800 text-white font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => setSelectedCategory(c.name)}
                    className={`block w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition ${
                      selectedCategory.toLowerCase() === c.name.toLowerCase()
                        ? 'bg-emerald-800 text-white font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
                <span className="uppercase tracking-wider">Max Price</span>
                <span className="text-emerald-900 font-extrabold">${priceRange}</span>
              </div>
              <input
                type="range"
                min="20"
                max="1500"
                step="20"
                value={priceRange}
                onChange={(e) => setPriceRange(parseFloat(e.target.value))}
                className="w-full accent-emerald-800 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>$20</span>
                <span>$1,500</span>
              </div>
            </div>

            {/* Brands */}
            {brands.length > 0 && (
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2.5">
                  Brand
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  <button
                    onClick={() => setSelectedBrand('all')}
                    className={`block w-full text-left text-xs py-1 px-2 rounded-md ${
                      selectedBrand === 'all'
                        ? 'bg-emerald-100 text-emerald-900 font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All Brands
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(b)}
                      className={`block w-full text-left text-xs py-1 px-2 rounded-md ${
                        selectedBrand === b
                          ? 'bg-emerald-100 text-emerald-900 font-bold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 p-8">
              <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No products match your criteria</h3>
              <p className="text-xs text-gray-500 mt-1 mb-5">
                Try widening your price range or clearing active filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 bg-emerald-800 text-white text-xs font-bold rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewProduct={onViewProduct}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
