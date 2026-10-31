export type HomepageSectionType =
  | 'hero_slider'
  | 'category_showcase'
  | 'product_grid'
  | 'promotional_banner'
  | 'split_banners'
  | 'trust_badges'
  | 'testimonials';

export type ProductGridSource =
  | 'featured'
  | 'best_seller'
  | 'new_arrivals'
  | 'category'
  | 'discount'
  | 'manual';

export interface BannerPlacementRule {
  id: string;
  bannerId: string;
  insertAfterProductCount: number; // e.g. 4, 8, 12
  displayOrder: number;
  isEnabled: boolean;
}

export interface SectionSettings {
  productSource?: ProductGridSource;
  categorySlug?: string;
  productIds?: string[];
  productLimit: number;
  desktopColumns: number; // 3, 4, or 5
  mobileColumns: number; // 1 or 2
  bannerPlacements: BannerPlacementRule[];
  bannerId?: string; // For single promotional banner
  bannerIds?: string[]; // For split banners
  backgroundColor?: string;
  viewAllLink?: string;
  viewAllText?: string;
}

export interface HomepageSectionConfig {
  id: string;
  sectionType: HomepageSectionType;
  title: string;
  subtitle?: string;
  displayOrder: number;
  isEnabled: boolean;
  settings: SectionSettings;
}

export interface GenericBanner {
  id: string;
  headline: string;
  subheadline?: string;
  buttonText: string;
  buttonLink: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  theme?: string;
  tag?: string;
}

export interface InterleavedItem<TProduct, TBanner = GenericBanner> {
  type: 'product' | 'banner';
  item: TProduct | TBanner;
  index: number;
}

/**
 * Interleaves promotional banners between products based on configured placement rules.
 * Preserves product order and only places banners after the specified number of products.
 */
export function interleaveProductsAndBanners<TProduct, TBanner extends GenericBanner>(
  products: TProduct[],
  placements: BannerPlacementRule[],
  bannersMap: Record<string, TBanner>
): InterleavedItem<TProduct, TBanner>[] {
  if (!products || products.length === 0) {
    return [];
  }

  // Filter valid, enabled placements that have matching banners in bannersMap
  const activePlacements = (placements || [])
    .filter((p) => p.isEnabled && p.insertAfterProductCount > 0 && bannersMap[p.bannerId])
    .sort((a, b) => {
      if (a.insertAfterProductCount !== b.insertAfterProductCount) {
        return a.insertAfterProductCount - b.insertAfterProductCount;
      }
      return a.displayOrder - b.displayOrder;
    });

  const result: InterleavedItem<TProduct, TBanner>[] = [];
  let productCount = 0;

  for (let i = 0; i < products.length; i++) {
    result.push({
      type: 'product',
      item: products[i],
      index: i,
    });
    productCount++;

    // Check if any placement triggers after this exact productCount
    for (const p of activePlacements) {
      if (p.insertAfterProductCount === productCount) {
        const banner = bannersMap[p.bannerId];
        if (banner) {
          result.push({
            type: 'banner',
            item: banner,
            index: result.length,
          });
        }
      }
    }
  }

  return result;
}

/**
 * Re-indexes displayOrder sequentially: 1, 2, 3...
 */
export function reindexSections(sections: HomepageSectionConfig[]): HomepageSectionConfig[] {
  return sections.map((sec, idx) => ({
    ...sec,
    displayOrder: idx + 1,
  }));
}

/**
 * Reorders sections by moving an item from sourceIndex to targetIndex.
 */
export function reorderSections(
  sections: HomepageSectionConfig[],
  sourceIndex: number,
  targetIndex: number
): HomepageSectionConfig[] {
  if (
    sourceIndex < 0 ||
    sourceIndex >= sections.length ||
    targetIndex < 0 ||
    targetIndex >= sections.length ||
    sourceIndex === targetIndex
  ) {
    return [...sections];
  }

  const result = [...sections];
  const [removed] = result.splice(sourceIndex, 1);
  result.splice(targetIndex, 0, removed);

  return reindexSections(result);
}

/**
 * Moves a section up or down.
 */
export function moveSection(
  sections: HomepageSectionConfig[],
  sectionId: string,
  direction: 'up' | 'down'
): HomepageSectionConfig[] {
  const index = sections.findIndex((s) => s.id === sectionId);
  if (index === -1) return [...sections];

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  return reorderSections(sections, index, targetIndex);
}

/**
 * Duplicates a section and inserts it immediately after the original.
 */
export function duplicateSection(
  sections: HomepageSectionConfig[],
  sectionId: string
): HomepageSectionConfig[] {
  const index = sections.findIndex((s) => s.id === sectionId);
  if (index === -1) return [...sections];

  const original = sections[index];
  const newSection: HomepageSectionConfig = {
    ...JSON.parse(JSON.stringify(original)),
    id: `sec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    title: `${original.title} (Copy)`,
  };

  const result = [...sections];
  result.splice(index + 1, 0, newSection);
  return reindexSections(result);
}

/**
 * Filters visible sections for the public homepage or preview.
 */
export function filterVisibleSections(
  sections: HomepageSectionConfig[],
  includeDisabled: boolean = false
): HomepageSectionConfig[] {
  const filtered = includeDisabled ? sections : sections.filter((s) => s.isEnabled);
  return [...filtered].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Default factory configuration for ShopMax homepage.
 */
export function getDefaultHomepageSections(): HomepageSectionConfig[] {
  return [
    {
      id: 'sec-hero',
      sectionType: 'hero_slider',
      title: 'Hero Banner Carousel',
      subtitle: 'Main dynamic promotional slider with auto-rotation',
      displayOrder: 1,
      isEnabled: true,
      settings: {
        productLimit: 0,
        desktopColumns: 1,
        mobileColumns: 1,
        bannerPlacements: [],
      },
    },
    {
      id: 'sec-trust',
      sectionType: 'trust_badges',
      title: 'Trust & Value Badges',
      subtitle: 'Free Shipping, Money Back Guarantee, 24/7 Support',
      displayOrder: 2,
      isEnabled: true,
      settings: {
        productLimit: 0,
        desktopColumns: 3,
        mobileColumns: 1,
        bannerPlacements: [],
      },
    },
    {
      id: 'sec-categories',
      sectionType: 'category_showcase',
      title: 'Shop by Category',
      subtitle: 'Explore our curated product categories',
      displayOrder: 3,
      isEnabled: true,
      settings: {
        productLimit: 6,
        desktopColumns: 6,
        mobileColumns: 3,
        bannerPlacements: [],
        viewAllLink: '/shop',
        viewAllText: 'All Categories',
      },
    },
    {
      id: 'sec-split-promo',
      sectionType: 'split_banners',
      title: 'Campaign Highlights',
      subtitle: 'Smart Tech and Fashion seasonal collections',
      displayOrder: 4,
      isEnabled: true,
      settings: {
        productLimit: 0,
        desktopColumns: 2,
        mobileColumns: 1,
        bannerIds: ['bnr-sec-1', 'bnr-sec-2'],
        bannerPlacements: [],
      },
    },
    {
      id: 'sec-popular',
      sectionType: 'product_grid',
      title: 'Popular Products',
      subtitle: 'Handpicked favorites loved by our community',
      displayOrder: 5,
      isEnabled: true,
      settings: {
        productSource: 'featured',
        productLimit: 10,
        desktopColumns: 5,
        mobileColumns: 2,
        viewAllLink: '/shop',
        viewAllText: 'View All Products',
        bannerPlacements: [
          {
            id: 'bp-1',
            bannerId: 'bnr-main-1',
            insertAfterProductCount: 5,
            displayOrder: 1,
            isEnabled: true,
          },
        ],
      },
    },
    {
      id: 'sec-mid-banner',
      sectionType: 'promotional_banner',
      title: 'Flash Sale Promo Banner',
      subtitle: 'Up to 50% off seasonal clearance',
      displayOrder: 6,
      isEnabled: true,
      settings: {
        bannerId: 'bnr-promo-1',
        productLimit: 0,
        desktopColumns: 1,
        mobileColumns: 1,
        bannerPlacements: [],
      },
    },
    {
      id: 'sec-best-sellers',
      sectionType: 'product_grid',
      title: 'Best Selling Products',
      subtitle: 'Top rated gear and lifestyle accessories',
      displayOrder: 7,
      isEnabled: true,
      settings: {
        productSource: 'best_seller',
        productLimit: 5,
        desktopColumns: 5,
        mobileColumns: 2,
        viewAllLink: '/shop?sort=best_seller',
        viewAllText: 'View All Best Sellers',
        bannerPlacements: [],
      },
    },
    {
      id: 'sec-testimonials',
      sectionType: 'testimonials',
      title: 'What Our Customers Say',
      subtitle: 'Real reviews from verified buyers',
      displayOrder: 8,
      isEnabled: true,
      settings: {
        productLimit: 0,
        desktopColumns: 1,
        mobileColumns: 1,
        bannerPlacements: [],
      },
    },
  ];
}
