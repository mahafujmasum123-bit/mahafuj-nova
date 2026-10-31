import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/ui/ProductCard';
import { SeedProduct } from '../../server/data/initialData';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  Dumbbell,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Star,
  Quote,
  Eye,
  Settings,
} from 'lucide-react';
import { AdvertisementPopup } from '../components/common/AdvertisementPopup';
import { useVisitorAnalytics } from '../hooks/useVisitorAnalytics';
import {
  HomepageSectionConfig,
  GenericBanner,
  interleaveProductsAndBanners,
} from '../utils/homepageBuilderRules';
import { useDelayedSkeleton } from '../hooks/useDelayedSkeleton';
import { HomepageSkeleton } from '../components/skeletons/HomepageSkeleton';

interface HomePageProps {
  onNavigate: (view: string, params?: any) => void;
}

interface DynamicSlider {
  id: string;
  tag: string;
  headline: string;
  subheadline: string;
  buttonText: string;
  buttonLink: string;
  lifestyleImage: string;
  modelScript?: string;
  badge?: string;
  displayOrder: number;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  useVisitorAnalytics('/');

  // Query parameter preview mode check
  const searchParams = new URLSearchParams(window.location.search);
  const isPreviewDraft = searchParams.get('preview') === 'draft';

  const [products, setProducts] = useState<SeedProduct[]>([]);
  const [sections, setSections] = useState<HomepageSectionConfig[]>([]);
  const [sliders, setSliders] = useState<DynamicSlider[]>([]);
  const [bannersMap, setBannersMap] = useState<Record<string, GenericBanner>>({});
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const configUrl = isPreviewDraft
          ? '/api/homepage/config?preview=draft'
          : '/api/homepage/config';

        const [prodRes, configRes] = await Promise.all([
          fetch('/api/products?limit=50'),
          fetch(configUrl),
        ]);

        const prodData = await prodRes.json();
        const configData = await configRes.json();

        if (prodData.success) {
          setProducts(prodData.data);
        }

        if (configData.success && configData.data) {
          setSections(configData.data.sections || []);
          setBannersMap(configData.data.bannersMap || {});
          if (configData.data.sliders?.length > 0) {
            setSliders(configData.data.sliders);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic homepage data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isPreviewDraft]);

  // Slider Autoplay (5s rotation, pauses when hovered)
  useEffect(() => {
    if (sliders.length <= 1 || isSliderHovered) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % sliders.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sliders.length, isSliderHovered]);

  const currentSlider = sliders.length > 0 ? sliders[currentSlideIndex] : null;

  const handlePrevSlide = () => {
    if (sliders.length <= 1) return;
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : sliders.length - 1));
  };

  const handleNextSlide = () => {
    if (sliders.length <= 1) return;
    setCurrentSlideIndex((prev) => (prev + 1) % sliders.length);
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    electronics: <Smartphone className="w-5 h-5 text-gray-700" />,
    fashion: <Shirt className="w-5 h-5 text-gray-700" />,
    'home-living': <Home className="w-5 h-5 text-gray-700" />,
    'beauty-personal-care': <Sparkles className="w-5 h-5 text-gray-700" />,
    'sports-outdoors': <Dumbbell className="w-5 h-5 text-gray-700" />,
    'toys-games': <Gamepad2 className="w-5 h-5 text-gray-700" />,
  };

  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Fashion', slug: 'fashion' },
    { name: 'Home & Living', slug: 'home-living' },
    { name: 'Beauty & Personal Care', slug: 'beauty-personal-care' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
    { name: 'Toys & Games', slug: 'toys-games' },
  ];

  // Helper to resolve products for a given product grid section
  const resolveProductsForSection = (sec: HomepageSectionConfig): SeedProduct[] => {
    const { productSource = 'featured', categorySlug, productLimit = 8, productIds = [] } =
      sec.settings;

    let result = [...products];

    if (productSource === 'featured') {
      result = result.filter((p) => p.isPopular);
    } else if (productSource === 'best_seller') {
      result = result.filter((p) => p.isBestSeller);
    } else if (productSource === 'new_arrivals') {
      result = [...products].reverse();
    } else if (productSource === 'discount') {
      result = result.filter((p) => (p as any).discountPercentage || (p.salePrice && p.salePrice < p.price));
    } else if (productSource === 'category' && categorySlug) {
      result = result.filter(
        (p) => p.category?.toLowerCase() === categorySlug.toLowerCase()
      );
    } else if (productSource === 'manual' && productIds.length > 0) {
      result = result.filter((p) => productIds.includes(p.id));
    }

    // Fallback if filter returned empty
    if (result.length === 0) {
      result = products;
    }

    return result.slice(0, productLimit);
  };

  const showSkeleton = useDelayedSkeleton(loading);

  if (loading) {
    if (showSkeleton) {
      return <HomepageSkeleton />;
    }
    return null;
  }

  return (
    <div className="space-y-16 pb-12">
      {/* Draft Mode Indicator Banner */}
      {isPreviewDraft && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-3 shadow-md sticky top-0 z-50">
          <Eye className="w-4 h-4" />
          <span>STAGING PREVIEW: Viewing unpublished draft layout.</span>
          <button
            onClick={() => onNavigate('admin', { module: 'cms-home' })}
            className="underline cursor-pointer hover:text-black font-extrabold flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Open Builder</span>
          </button>
          <span>•</span>
          <a href="/" className="underline hover:text-black">
            Exit Preview
          </a>
        </div>
      )}

      {/* Render Dynamic Sections in Configured Sequence */}
      {sections.map((section) => {
        // 1. HERO BANNER SLIDER
        if (section.sectionType === 'hero_slider') {
          return (
            <section key={section.id} className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
              <div
                onMouseEnter={() => setIsSliderHovered(true)}
                onMouseLeave={() => setIsSliderHovered(false)}
                className="relative rounded-3xl bg-gradient-to-r from-[#edf4f0] via-[#f4f7f5] to-[#fbfaf8] border border-gray-100 overflow-hidden min-h-[500px] lg:min-h-[560px] flex items-center shadow-xs"
              >
                {/* Navigation arrow buttons */}
                {sliders.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevSlide}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-gray-700 z-20 transition cursor-pointer hover:scale-105"
                      aria-label="Previous slider"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextSlide}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-gray-700 z-20 transition cursor-pointer hover:scale-105"
                      aria-label="Next slider"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div className="w-full grid grid-cols-1 lg:grid-cols-12 items-center p-8 sm:p-14 lg:p-16 gap-8">
                  {/* Left Content */}
                  <div className="lg:col-span-6 z-10 space-y-6">
                    <div className="flex items-center gap-2">
                      <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                        {currentSlider?.tag || 'NEW ARRIVALS'}
                      </span>
                      {currentSlider?.badge && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                          {currentSlider.badge}
                        </span>
                      )}
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] whitespace-pre-line">
                      {currentSlider?.headline || 'Upgrade Your\nLifestyle'}
                    </h1>

                    <p className="text-sm sm:text-base text-gray-600 max-w-md leading-relaxed">
                      {currentSlider?.subheadline ||
                        'Discover premium quality products designed for a better, smarter and easier life.'}
                    </p>

                    <div>
                      <button
                        onClick={() => {
                          const link = currentSlider?.buttonLink || '/shop';
                          if (link.startsWith('/')) {
                            const dest = link.replace('/', '');
                            onNavigate(dest || 'shop');
                          } else {
                            window.location.href = link;
                          }
                        }}
                        className="px-8 py-3.5 rounded-full bg-[#0c3328] hover:bg-emerald-800 text-white font-bold text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-950/20 cursor-pointer"
                      >
                        <span>{currentSlider?.buttonText || 'Shop Now'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 3 Trust Badges below Hero Button */}
                    <div className="grid grid-cols-3 gap-3 pt-6 border-t border-emerald-900/10">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                          Premium Quality Products
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                          Fast & Reliable Delivery
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                          Easy Return & Refund
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Lifestyle Photography & Script */}
                  <div className="lg:col-span-6 relative flex items-center justify-center">
                    <div className="relative w-full max-w-md lg:max-w-none aspect-[4/3] lg:aspect-[1/1] overflow-hidden rounded-2xl flex items-center justify-center">
                      <img
                        src={
                          currentSlider?.lifestyleImage ||
                          'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&q=80'
                        }
                        alt={currentSlider?.headline || 'ShopMax Hero Banner'}
                        className="w-full h-full object-cover object-top rounded-2xl shadow-xl transition-all duration-700"
                      />

                      {/* Script overlay matching "Good Things Take Time ♡" */}
                      {currentSlider?.modelScript && (
                        <div className="absolute right-4 top-8 text-right font-serif italic text-white drop-shadow-md select-none whitespace-pre-line">
                          <div className="text-3xl sm:text-4xl text-amber-100 font-normal">
                            {(currentSlider.modelScript || '').split('\n')[0]}
                          </div>
                          <div className="text-3xl sm:text-4xl text-white font-normal -mt-1">
                            {(currentSlider.modelScript || '').split('\n')[1] || ''}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Carousel dots */}
                {sliders.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                    {sliders.map((s, idx) => (
                      <button
                        key={s.id || idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`transition-all duration-300 rounded-full cursor-pointer ${
                          currentSlideIndex === idx
                            ? 'w-7 h-2 bg-emerald-700 shadow-xs'
                            : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        }

        // 2. TRUST & VALUE BADGES
        if (section.sectionType === 'trust_badges') {
          return (
            <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-emerald-50/40 border border-emerald-100 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0c593f] flex items-center justify-center shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Free Express Shipping</h4>
                    <p className="text-xs text-gray-500 mt-0.5">On all domestic orders over $50</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0c593f] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">30-Day Money Guarantee</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Hassle-free 100% money back returns</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0c593f] flex items-center justify-center shrink-0">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">24/7 Dedicated Support</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Live support anytime, anywhere</p>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        // 3. CATEGORY SHOWCASE
        if (section.sectionType === 'category_showcase') {
          return (
            <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  {section.title || 'Shop by Category'}
                </h2>
                {section.settings.viewAllText && (
                  <button
                    onClick={() => onNavigate('shop')}
                    className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>{section.settings.viewAllText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.slug}
                    onClick={() => onNavigate('shop', { category: cat.slug })}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-gray-50 transition cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-100/80 group-hover:bg-emerald-50 group-hover:scale-105 transition flex items-center justify-center shadow-2xs mb-3 border border-gray-100">
                      {categoryIcons[cat.slug] || <Smartphone className="w-5 h-5 text-gray-700" />}
                    </div>
                    <span className="text-xs font-semibold text-gray-800 text-center group-hover:text-emerald-800 transition">
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 4. SPLIT CAMPAIGN CARDS
        if (section.sectionType === 'split_banners') {
          const bannerIds = section.settings.bannerIds || ['bnr-sec-1', 'bnr-sec-2'];
          const card1 = bannersMap[bannerIds[0]] || bannersMap['bnr-sec-1'] || {
            tag: 'Smart Tech',
            headline: 'Smart Tech\nSmarter You',
            subheadline: 'Latest gadgets. Unbeatable prices.',
            buttonText: 'Shop Now',
            buttonLink: '/shop?category=electronics',
            imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
            backgroundColor: '#0c3328',
            theme: 'dark',
          };

          const card2 = bannersMap[bannerIds[1]] || bannersMap['bnr-sec-2'] || {
            tag: 'Fashion',
            headline: 'Fashion\nThat Speaks You',
            subheadline: 'Trendy styles for every mood.',
            buttonText: 'Shop Now',
            buttonLink: '/shop?category=fashion',
            imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
            backgroundColor: '#fbe7dc',
            theme: 'peach',
          };

          const isDark2 = card2.theme === 'dark' || card2.backgroundColor === '#0c261e';

          return (
            <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1 */}
                <div
                  className="relative rounded-3xl text-white p-8 sm:p-10 overflow-hidden flex flex-col justify-between min-h-[300px] shadow-lg"
                  style={{ backgroundColor: card1.backgroundColor || '#0c3328' }}
                >
                  <div className="relative z-10 max-w-xs space-y-2">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
                      {card1.tag}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug whitespace-pre-line">
                      {card1.headline}
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-200/80">{card1.subheadline}</p>
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          const link = card1.buttonLink || '/shop';
                          if (link.startsWith('/')) {
                            onNavigate(link.replace('/', '') || 'shop');
                          } else {
                            window.location.href = link;
                          }
                        }}
                        className="px-6 py-2.5 rounded-full bg-white text-gray-900 font-bold text-xs hover:bg-gray-100 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <span>{card1.buttonText || 'Shop Now'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="absolute right-0 bottom-0 w-1/2 h-full flex items-end justify-end pointer-events-none p-4">
                    <img
                      src={card1.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'}
                      alt={card1.headline}
                      className="w-full max-h-56 object-contain"
                    />
                  </div>
                </div>

                {/* Card 2 */}
                <div
                  className={`relative rounded-3xl p-8 sm:p-10 overflow-hidden flex flex-col justify-between min-h-[300px] shadow-lg ${
                    isDark2 ? 'text-white' : 'text-gray-900'
                  }`}
                  style={{ backgroundColor: card2.backgroundColor || '#fbe7dc' }}
                >
                  <div className="relative z-10 max-w-xs space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                      {card2.tag}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug whitespace-pre-line">
                      {card2.headline}
                    </h2>
                    <p className={`text-xs sm:text-sm ${isDark2 ? 'text-gray-200' : 'text-gray-600'}`}>
                      {card2.subheadline}
                    </p>
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          const link = card2.buttonLink || '/shop';
                          if (link.startsWith('/')) {
                            onNavigate(link.replace('/', '') || 'shop');
                          } else {
                            window.location.href = link;
                          }
                        }}
                        className="px-6 py-2.5 rounded-full bg-[#0c3328] text-white font-bold text-xs hover:bg-emerald-900 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <span>{card2.buttonText || 'Shop Now'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="absolute right-0 bottom-0 w-1/2 h-full flex items-end justify-end pointer-events-none">
                    <img
                      src={card2.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80'}
                      alt={card2.headline}
                      className="w-full max-h-64 object-contain object-bottom"
                    />
                  </div>
                </div>
              </div>
            </section>
          );
        }

        // 5. FULL-WIDTH PROMOTIONAL BANNER
        if (section.sectionType === 'promotional_banner') {
          const banner = bannersMap[section.settings.bannerId || ''] || bannersMap['bnr-promo-1'] || {
            tag: 'LIMITED TIME OFFER',
            headline: 'UP TO 50% OFF',
            subheadline: 'On Your Favorite Brands across Tech, Living & Footwear.',
            buttonText: 'Claim Discount',
            buttonLink: '/shop?discount=true',
            imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1000&q=80',
            backgroundColor: '#064e3b',
          };

          return (
            <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6">
              <div
                className="relative rounded-3xl text-white overflow-hidden p-8 sm:p-14 shadow-2xl flex items-center min-h-[320px]"
                style={{ backgroundColor: banner.backgroundColor || '#0c261e' }}
              >
                <div className="relative z-10 max-w-lg space-y-3">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
                    {banner.tag || 'LIMITED TIME OFFER'}
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight whitespace-pre-line">
                    {banner.headline}
                  </h2>
                  <p className="text-sm sm:text-base text-emerald-100/80">{banner.subheadline}</p>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        const link = banner.buttonLink || '/shop';
                        if (link.startsWith('/')) {
                          onNavigate(link.replace('/', '') || 'shop');
                        } else {
                          window.location.href = link;
                        }
                      }}
                      className="px-8 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <span>{banner.buttonText || 'Shop Now'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="absolute right-0 top-0 bottom-0 w-3/5 hidden md:flex items-center justify-end p-6 pointer-events-none opacity-90">
                  <img
                    src={banner.imageUrl || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'}
                    alt="Promo devices"
                    className="max-h-64 object-contain rounded-xl"
                  />
                </div>
              </div>
            </section>
          );
        }

        // 6. DYNAMIC PRODUCT GRID WITH INTERLEAVED BANNERS
        if (section.sectionType === 'product_grid') {
          const sectionProducts = resolveProductsForSection(section);
          const interleavedItems = interleaveProductsAndBanners(
            sectionProducts,
            section.settings.bannerPlacements || [],
            bannersMap
          );

          const desktopColsClass =
            section.settings.desktopColumns === 5
              ? 'lg:grid-cols-5'
              : section.settings.desktopColumns === 3
              ? 'lg:grid-cols-3'
              : 'lg:grid-cols-4';

          const mobileColsClass =
            section.settings.mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2';

          return (
            <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  {section.settings.productSource === 'best_seller' && (
                    <Crown className="w-5 h-5 text-amber-500" />
                  )}
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                    {section.title}
                  </h2>
                  <span className="w-8 h-0.5 bg-emerald-700 hidden sm:inline-block" />
                </div>

                {section.settings.viewAllText && (
                  <button
                    onClick={() => {
                      const link = section.settings.viewAllLink || '/shop';
                      onNavigate(link.replace('/', '') || 'shop');
                    }}
                    className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>{section.settings.viewAllText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {loading ? (
                <div className={`grid ${mobileColsClass} sm:grid-cols-3 ${desktopColsClass} gap-4`}>
                  {[...Array(section.settings.productLimit || 8)].map((_, i) => (
                    <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className={`grid ${mobileColsClass} sm:grid-cols-3 ${desktopColsClass} gap-4`}>
                  {interleavedItems.map((entry, idx) => {
                    if (entry.type === 'product') {
                      const product = entry.item as SeedProduct;
                      return (
                        <ProductCard
                          key={`${section.id}-prod-${product.id}-${idx}`}
                          product={product}
                          onViewProduct={(slug) => onNavigate('product', { slug })}
                        />
                      );
                    }

                    // INTERLEAVED BANNER (spans across the full width of the grid!)
                    const banner = entry.item as GenericBanner;
                    return (
                      <div
                        key={`${section.id}-bnr-${banner.id}-${idx}`}
                        className="col-span-full my-4 rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden"
                        style={{ backgroundColor: banner.backgroundColor || '#0c261e' }}
                      >
                        <div className="relative z-10 space-y-2 max-w-xl">
                          {banner.tag && (
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                              {banner.tag}
                            </span>
                          )}
                          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            {banner.headline}
                          </h3>
                          {banner.subheadline && (
                            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                              {banner.subheadline}
                            </p>
                          )}
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                const link = banner.buttonLink || '/shop';
                                if (link.startsWith('/')) {
                                  onNavigate(link.replace('/', '') || 'shop');
                                } else {
                                  window.location.href = link;
                                }
                              }}
                              className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs transition flex items-center gap-2 shadow cursor-pointer"
                            >
                              <span>{banner.buttonText || 'Shop Now'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {banner.imageUrl && (
                          <div className="relative z-10 max-h-48 shrink-0">
                            <img
                              src={banner.imageUrl}
                              alt={banner.headline}
                              className="max-h-40 sm:max-h-48 object-contain rounded-2xl drop-shadow-lg"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        }

        // 7. TESTIMONIALS
        if (section.sectionType === 'testimonials') {
          return (
            <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-100">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  {section.title || 'What Our Customers Say'}
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTestimonialIndex((prev) => (prev > 0 ? prev - 1 : 0))}
                    className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-400 flex items-center justify-center text-gray-600 transition cursor-pointer"
                    aria-label="Previous review"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTestimonialIndex((prev) => (prev < 1 ? prev + 1 : 1))}
                    className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-400 flex items-center justify-center text-gray-600 transition cursor-pointer"
                    aria-label="Next review"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80"
                        alt="Sarah Khan"
                        className="w-11 h-11 rounded-full object-cover border border-emerald-100"
                      />
                      <div>
                        <div className="text-sm font-bold text-gray-900">Sarah Khan</div>
                        <div className="text-[11px] text-gray-500">Verified Buyer • New York</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed italic">
                      "The active noise cancellation on the Soundcore headphones is mindblowing for the price! Customer service helped me track delivery within minutes."
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80"
                        alt="David Miller"
                        className="w-11 h-11 rounded-full object-cover border border-emerald-100"
                      />
                      <div>
                        <div className="text-sm font-bold text-gray-900">David Miller</div>
                        <div className="text-[11px] text-gray-500">Verified Buyer • Austin</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed italic">
                      "I ordered the waterproof backpack and smart watch together. Delivered in pristine condition in 2 days. ShopMax is my default store now."
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80"
                        alt="Elena Rostova"
                        className="w-11 h-11 rounded-full object-cover border border-emerald-100"
                      />
                      <div>
                        <div className="text-sm font-bold text-gray-900">Elena Rostova</div>
                        <div className="text-[11px] text-gray-500">Verified Buyer • Chicago</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed italic">
                      "Seamless checkout experience and genuine products with official manufacturer warranties. Highly recommended!"
                    </p>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        return null;
      })}

      {/* Promotional Ad Popup (if configured) */}
      <AdvertisementPopup onNavigate={onNavigate} />
    </div>
  );
};
