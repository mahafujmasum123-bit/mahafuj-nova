import test from 'node:test';
import assert from 'node:assert/strict';
import {
  interleaveProductsAndBanners,
  reorderSections,
  moveSection,
  duplicateSection,
  filterVisibleSections,
  getDefaultHomepageSections,
  type BannerPlacementRule,
  type GenericBanner,
  type HomepageSectionConfig,
} from './homepageBuilderRules';

test('interleaveProductsAndBanners inserts banners at exact product counts', () => {
  const products = [
    { id: 'p1', name: 'Product 1' },
    { id: 'p2', name: 'Product 2' },
    { id: 'p3', name: 'Product 3' },
    { id: 'p4', name: 'Product 4' },
    { id: 'p5', name: 'Product 5' },
    { id: 'p6', name: 'Product 6' },
  ];

  const bannerA: GenericBanner = {
    id: 'bnr-a',
    headline: 'Banner A',
    buttonText: 'Shop A',
    buttonLink: '/a',
  };

  const bannerB: GenericBanner = {
    id: 'bnr-b',
    headline: 'Banner B',
    buttonText: 'Shop B',
    buttonLink: '/b',
  };

  const bannersMap: Record<string, GenericBanner> = {
    'bnr-a': bannerA,
    'bnr-b': bannerB,
  };

  const placements: BannerPlacementRule[] = [
    {
      id: 'rule-1',
      bannerId: 'bnr-a',
      insertAfterProductCount: 2,
      displayOrder: 1,
      isEnabled: true,
    },
    {
      id: 'rule-2',
      bannerId: 'bnr-b',
      insertAfterProductCount: 4,
      displayOrder: 2,
      isEnabled: true,
    },
  ];

  const result = interleaveProductsAndBanners(products, placements, bannersMap);

  // Expected sequence:
  // p1 (0), p2 (1), Banner A, p3 (2), p4 (3), Banner B, p5 (4), p6 (5)
  // Total items = 6 + 2 = 8
  assert.equal(result.length, 8);
  assert.equal(result[0].type, 'product');
  assert.equal((result[0].item as any).id, 'p1');
  assert.equal(result[1].type, 'product');
  assert.equal((result[1].item as any).id, 'p2');
  assert.equal(result[2].type, 'banner');
  assert.equal((result[2].item as any).id, 'bnr-a');
  assert.equal(result[3].type, 'product');
  assert.equal((result[3].item as any).id, 'p3');
  assert.equal(result[4].type, 'product');
  assert.equal((result[4].item as any).id, 'p4');
  assert.equal(result[5].type, 'banner');
  assert.equal((result[5].item as any).id, 'bnr-b');
  assert.equal(result[6].type, 'product');
  assert.equal((result[6].item as any).id, 'p5');
  assert.equal(result[7].type, 'product');
  assert.equal((result[7].item as any).id, 'p6');
});

test('interleaveProductsAndBanners ignores disabled or missing placements', () => {
  const products = [{ id: 'p1' }, { id: 'p2' }];
  const bannersMap: Record<string, GenericBanner> = {
    'bnr-1': { id: 'bnr-1', headline: 'Valid', buttonText: 'Click', buttonLink: '#' },
  };

  const placements: BannerPlacementRule[] = [
    { id: 'r1', bannerId: 'bnr-1', insertAfterProductCount: 1, displayOrder: 1, isEnabled: false }, // disabled
    { id: 'r2', bannerId: 'bnr-unknown', insertAfterProductCount: 1, displayOrder: 2, isEnabled: true }, // missing
    { id: 'r3', bannerId: 'bnr-1', insertAfterProductCount: 99, displayOrder: 3, isEnabled: true }, // out of bounds
  ];

  const result = interleaveProductsAndBanners(products, placements, bannersMap);
  assert.equal(result.length, 2);
  assert.equal(result[0].type, 'product');
  assert.equal(result[1].type, 'product');
});

test('reorderSections moves section correctly and re-indexes displayOrder', () => {
  const sections: HomepageSectionConfig[] = [
    { id: 's1', sectionType: 'hero_slider', title: 'S1', displayOrder: 1, isEnabled: true, settings: { productLimit: 0, desktopColumns: 1, mobileColumns: 1, bannerPlacements: [] } },
    { id: 's2', sectionType: 'category_showcase', title: 'S2', displayOrder: 2, isEnabled: true, settings: { productLimit: 0, desktopColumns: 1, mobileColumns: 1, bannerPlacements: [] } },
    { id: 's3', sectionType: 'product_grid', title: 'S3', displayOrder: 3, isEnabled: true, settings: { productLimit: 0, desktopColumns: 1, mobileColumns: 1, bannerPlacements: [] } },
  ];

  // Move s3 to the top (index 2 to index 0)
  const reordered = reorderSections(sections, 2, 0);
  assert.equal(reordered[0].id, 's3');
  assert.equal(reordered[0].displayOrder, 1);
  assert.equal(reordered[1].id, 's1');
  assert.equal(reordered[1].displayOrder, 2);
  assert.equal(reordered[2].id, 's2');
  assert.equal(reordered[2].displayOrder, 3);
});

test('moveSection up and down works predictably', () => {
  const sections = getDefaultHomepageSections().slice(0, 3);
  const originalIds = sections.map((s) => s.id);

  // Move item 1 ('sec-trust') up
  const movedUp = moveSection(sections, originalIds[1], 'up');
  assert.equal(movedUp[0].id, originalIds[1]);
  assert.equal(movedUp[1].id, originalIds[0]);

  // Move item 0 down
  const movedDown = moveSection(movedUp, originalIds[1], 'down');
  assert.equal(movedDown[0].id, originalIds[0]);
  assert.equal(movedDown[1].id, originalIds[1]);
});

test('duplicateSection clones and inserts right after original', () => {
  const sections = getDefaultHomepageSections().slice(0, 3);
  const targetId = sections[1].id;
  const duplicated = duplicateSection(sections, targetId);

  assert.equal(duplicated.length, 4);
  assert.equal(duplicated[1].id, targetId);
  assert.notEqual(duplicated[2].id, targetId);
  assert.equal(duplicated[2].title, `${sections[1].title} (Copy)`);
  assert.equal(duplicated[2].displayOrder, 3);
  assert.equal(duplicated[3].displayOrder, 4);
});

test('filterVisibleSections respects isEnabled flag', () => {
  const sections = getDefaultHomepageSections().slice(0, 4);
  sections[1].isEnabled = false;

  const publicVisible = filterVisibleSections(sections, false);
  assert.equal(publicVisible.length, 3);
  assert.ok(!publicVisible.some((s) => s.id === sections[1].id));

  const previewVisible = filterVisibleSections(sections, true);
  assert.equal(previewVisible.length, 4);
});
