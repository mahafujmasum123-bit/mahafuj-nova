import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';

interface SuggestionItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  salePrice?: number;
  image: string;
  badge?: string;
}

interface SearchBarProps {
  onSelectProduct: (slug: string) => void;
  onSubmitSearch: (query: string) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectProduct,
  onSubmitSearch,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/suggestions?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
          setIsOpen(data.suggestions.length > 0);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        onSelectProduct(suggestions[selectedIndex].slug);
        setIsOpen(false);
      } else if (query.trim()) {
        onSubmitSearch(query.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmitSearch(query.trim());
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleFormSubmit} className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, brands, or বাংলা (e.g. হেডফোন, বই)..."
          className="w-full pl-10 pr-9 py-2 text-xs md:text-sm bg-gray-50/80 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-emerald-600 rounded-full outline-none transition shadow-2xs"
          aria-label="Search catalog"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5 md:top-3 pointer-events-none" />
        {loading ? (
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-2.5 md:top-3" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="p-1 text-gray-400 hover:text-gray-700 absolute right-2.5 top-2 md:top-2.5"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto">
          <div className="px-3.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Matching Products ({suggestions.length})
          </div>
          {suggestions.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectProduct(item.slug);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center gap-3 px-3.5 py-2 cursor-pointer transition ${
                  isSelected ? 'bg-emerald-50/70 text-emerald-950' : 'hover:bg-gray-50'
                }`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-900 truncate">{item.name}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate">
                    {item.brand} • {item.category}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-900">
                    ${(item.salePrice || item.price).toFixed(2)}
                  </span>
                  {item.salePrice && item.salePrice < item.price && (
                    <div className="text-[10px] text-gray-400 line-through">
                      ${item.price.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div
            onClick={() => {
              onSubmitSearch(query);
              setIsOpen(false);
            }}
            className="mt-1 pt-2 border-t border-gray-100 px-3.5 py-1.5 flex items-center justify-between text-xs font-semibold text-emerald-800 hover:bg-emerald-50 cursor-pointer transition"
          >
            <span>View all search results for "{query}"</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}
    </div>
  );
};
