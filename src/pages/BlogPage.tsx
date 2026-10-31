import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Clock,
  User,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  Tag,
  Eye,
  Share2,
  Check,
  ShoppingBag,
} from 'lucide-react';
import { useAppDispatch } from '../app/hooks';
import { addToast } from '../features/toast/toastSlice';
import { useDelayedSkeleton } from '../hooks/useDelayedSkeleton';
import { BlogSkeleton } from '../components/skeletons/BlogSkeleton';

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  readTimeMinutes: number;
  publishedAt: string;
  featured?: boolean;
  tags?: string[];
  viewsCount?: number;
}

interface BlogPageProps {
  initialSlug?: string;
  onNavigate?: (view: string, params?: any) => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({ initialSlug, onNavigate }) => {
  const dispatch = useAppDispatch();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const categories = [
    { label: 'All Stories', value: 'all' },
    { label: 'Audio Tech', value: 'Audio Tech' },
    { label: 'Sustainability', value: 'Sustainability' },
    { label: 'Wearables & Health', value: 'Wearables & Health' },
    { label: 'Buying Guides', value: 'Buying Guides' },
  ];

  // Fetch articles list
  useEffect(() => {
    loadArticles();
  }, [activeCategory, searchQuery]);

  // Load article if initialSlug is present
  useEffect(() => {
    if (initialSlug) {
      loadSingleArticle(initialSlug);
    } else {
      setSelectedArticle(null);
    }
  }, [initialSlug]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/blog?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setArticles(data.data);
      }
    } catch (err) {
      console.error('Failed to load blog articles', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSingleArticle = async (slug: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/blog/${slug}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedArticle(data.data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to load article detail', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArticle = (slug: string) => {
    if (onNavigate) {
      onNavigate('blog', { slug });
    } else {
      loadSingleArticle(slug);
    }
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
    if (onNavigate) {
      onNavigate('blog', {});
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    dispatch(addToast({ type: 'success', message: 'Article link copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  };

  // If viewing single article
  if (selectedArticle) {
    const formattedDate = new Date(selectedArticle.publishedAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Back navigation */}
        <button
          onClick={handleBackToList}
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Articles</span>
        </button>

        {/* Article Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider">
              {selectedArticle.category}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{selectedArticle.readTimeMinutes} min read</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Eye className="w-3.5 h-3.5" />
              <span>{selectedArticle.viewsCount || 1} views</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 tracking-tight leading-tight">
            {selectedArticle.title}
          </h1>

          <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-normal">
            {selectedArticle.excerpt}
          </p>

          {/* Author Card & Share */}
          <div className="flex items-center justify-between border-y border-gray-100 py-4 mt-6">
            <div className="flex items-center gap-3">
              <img
                src={selectedArticle.author.avatar}
                alt={selectedArticle.author.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-200"
              />
              <div>
                <div className="text-xs font-bold text-gray-900">{selectedArticle.author.name}</div>
                <div className="text-[11px] text-gray-500">
                  {selectedArticle.author.role} • {formattedDate}
                </div>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-medium text-gray-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </header>

        {/* Featured Cover Image */}
        <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100 max-h-[460px]">
          <img
            src={selectedArticle.coverImage}
            alt={selectedArticle.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body Content */}
        <article className="prose prose-emerald max-w-none text-gray-800 text-sm sm:text-base leading-relaxed space-y-4">
          {selectedArticle.content.split('\n\n').map((paragraph, index) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;

            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={index} className="text-xl sm:text-2xl font-bold text-gray-900 pt-4 pb-1">
                  {trimmed.replace('## ', '')}
                </h2>
              );
            }
            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={index} className="text-lg font-bold text-gray-900 pt-3 pb-1">
                  {trimmed.replace('### ', '')}
                </h3>
              );
            }
            if (trimmed.startsWith('- ')) {
              const items = trimmed.split('\n').map((item) => item.replace(/^- /, ''));
              return (
                <ul key={index} className="list-disc pl-5 space-y-1.5 text-gray-700">
                  {items.map((it, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={{ __html: it.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  ))}
                </ul>
              );
            }
            if (/^\d+\.\s/.test(trimmed)) {
              const items = trimmed.split('\n').map((item) => item.replace(/^\d+\.\s*/, ''));
              return (
                <ol key={index} className="list-decimal pl-5 space-y-1.5 text-gray-700">
                  {items.map((it, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={{ __html: it.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  ))}
                </ol>
              );
            }

            return (
              <p
                key={index}
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                }}
              />
            );
          })}
        </article>

        {/* Article Tags */}
        {selectedArticle.tags && selectedArticle.tags.length > 0 && (
          <div className="pt-6 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
              Related Topics
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedArticle.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-xs text-gray-700 transition"
                >
                  <Tag className="w-3 h-3 text-gray-400" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Next Articles Recommendation Box */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-emerald-50 border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base font-bold text-emerald-950">
              Explore More from the ShopMax Journal
            </h4>
            <p className="text-xs text-emerald-800/80">
              Stay ahead with practical tech reviews, ergonomics guides, and retail insights.
            </p>
          </div>
          <button
            onClick={handleBackToList}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            Browse All Stories
          </button>
        </div>
      </div>
    );
  }

  const showSkeleton = useDelayedSkeleton(loading);

  if (loading) {
    if (showSkeleton) {
      return <BlogSkeleton />;
    }
    return null;
  }

  // Articles List View
  const featuredArticle = articles.find((a) => a.featured) || articles[0];
  const regularArticles = articles.filter((a) => a.id !== featuredArticle?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
          <span>ShopMax Journal & Editorial</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          Tech Insights, Buying Guides & Living Well
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Deep-dives on acoustic engineering, sustainable fulfillment, health sensors, and workstation ergonomics straight from our Dhaka editorial desk.
        </p>
      </div>

      {/* Search & Categories Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeCategory === c.value
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories, topics..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500">Loading journal articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No articles found</h3>
          <p className="text-xs text-gray-500">
            Try adjusting your search query or switching category filters.
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Featured Hero Story Card */}
          {featuredArticle && activeCategory === 'all' && !searchQuery && (
            <div
              onClick={() => handleSelectArticle(featuredArticle.slug)}
              className="group cursor-pointer rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden grid grid-cols-1 lg:grid-cols-12"
            >
              <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-full overflow-hidden">
                <img
                  src={featuredArticle.coverImage}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-800 text-white text-[11px] font-bold shadow-md uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    <span>Featured Article</span>
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                    <span className="font-bold text-emerald-800">{featuredArticle.category}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{featuredArticle.readTimeMinutes} min read</span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-950 group-hover:text-emerald-800 transition leading-snug">
                    {featuredArticle.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {featuredArticle.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={featuredArticle.author.avatar}
                      alt={featuredArticle.author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-gray-900">{featuredArticle.author.name}</div>
                      <div className="text-[10px] text-gray-500">{featuredArticle.author.role}</div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition-transform">
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Standard Article Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {(activeCategory === 'all' && !searchQuery ? regularArticles : articles).map((art) => (
              <div
                key={art.id}
                onClick={() => handleSelectArticle(art.slug)}
                className="group cursor-pointer bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={art.coverImage}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-emerald-900 text-[10px] font-bold shadow-xs">
                      {art.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{art.readTimeMinutes} min read</span>
                      <span>•</span>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(art.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>

                    <h3 className="text-base font-bold text-gray-950 group-hover:text-emerald-800 transition line-clamp-2 leading-snug">
                      {art.title}
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={art.author.avatar}
                      alt={art.author.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-[11px] font-medium text-gray-700">{art.author.name}</span>
                  </div>

                  <span className="text-xs font-semibold text-emerald-800 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>Read</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPage;
