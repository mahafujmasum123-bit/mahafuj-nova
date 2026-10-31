import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { Modal } from '../../components/modal/Modal';
import {
  Sparkles,
  Save,
  Globe,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Copy,
  ArrowUp,
  ArrowDown,
  Layers,
  Image as ImageIcon,
  LayoutGrid,
  ShoppingBag,
  Sliders as SlidersIcon,
  Quote,
  ShieldCheck,
  Smartphone,
  Tablet,
  Monitor,
  RefreshCw,
  ExternalLink,
  Info,
  Check,
  X,
  PlusCircle,
  Tag,
  Clock,
  Sparkle,
} from 'lucide-react';
import {
  HomepageSectionConfig,
  HomepageSectionType,
  ProductGridSource,
  BannerPlacementRule,
  GenericBanner,
  interleaveProductsAndBanners,
  reorderSections,
  moveSection,
  duplicateSection,
} from '../../utils/homepageBuilderRules';
import { ProductCard } from '../../components/ui/ProductCard';

interface HomepageBuilderAdminPageProps {
  onRefresh?: () => void;
  onGoToStorefront?: () => void;
}

const PRESET_BANNER_IMAGES = [
  'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
  'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1000&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&q=80',
];

export const HomepageBuilderAdminPage: React.FC<HomepageBuilderAdminPageProps> = ({
  onRefresh,
  onGoToStorefront,
}) => {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Core builder state
  const [draftSections, setDraftSections] = useState<HomepageSectionConfig[]>([]);
  const [publishedSections, setPublishedSections] = useState<HomepageSectionConfig[]>([]);
  const [isDraftModified, setIsDraftModified] = useState(false);
  const [lastPublishedAt, setLastPublishedAt] = useState<string>('');

  // Aux state for selection
  const [banners, setBanners] = useState<GenericBanner[]>([]);
  const [bannersMap, setBannersMap] = useState<Record<string, GenericBanner>>({});
  const [sliders, setSliders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productsSummary, setProductsSummary] = useState<any[]>([]);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSectionConfig | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [newBannerModalOpen, setNewBannerModalOpen] = useState(false);
  const [confirmPublishModalOpen, setConfirmPublishModalOpen] = useState(false);
  const [confirmResetModalOpen, setConfirmResetModalOpen] = useState(false);

  // New Banner Form State
  const [newBannerForm, setNewBannerForm] = useState({
    headline: 'Exclusive Limited Deal',
    subheadline: 'Save up to 40% on cutting edge accessories today.',
    tag: 'FLASH DEAL',
    buttonText: 'Claim Deal',
    buttonLink: '/shop',
    imageUrl: PRESET_BANNER_IMAGES[0],
    backgroundColor: '#0c261e',
    textColor: '#ffffff',
  });

  // Load builder data from API
  const loadBuilderData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/homepage/builder', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDraftSections(data.data.draftSections || []);
        setPublishedSections(data.data.publishedSections || []);
        setIsDraftModified(data.data.isDraftModified || false);
        setLastPublishedAt(data.data.lastPublishedAt || '');
        setBanners(data.data.banners || []);
        setBannersMap(data.data.bannersMap || {});
        setSliders(data.data.sliders || []);
        setCategories(data.data.categories || []);
        setProductsSummary(data.data.productsSummary || []);
      }
    } catch (err) {
      console.error('Failed to load homepage builder data', err);
      dispatch(addToast({ type: 'error', message: 'Failed to load homepage builder state' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuilderData();
  }, [token]);

  // Save Draft to backend
  const handleSaveDraft = async (customSections?: HomepageSectionConfig[]) => {
    const sectionsToSave = customSections || draftSections;
    try {
      setSaving(true);
      const res = await fetch('/api/admin/homepage/builder/draft', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sections: sectionsToSave }),
      });
      const data = await res.json();
      if (data.success) {
        setDraftSections(data.data.draftSections);
        setIsDraftModified(data.data.isDraftModified);
        dispatch(
          addToast({
            type: 'success',
            title: 'Draft Saved',
            message: 'Homepage layout draft has been saved. Changes are staged for preview.',
          })
        );
      } else {
        dispatch(addToast({ type: 'error', message: data.message || 'Failed to save draft' }));
      }
    } catch (err) {
      console.error('Failed to save draft', err);
      dispatch(addToast({ type: 'error', message: 'Error communicating with server' }));
    } finally {
      setSaving(false);
    }
  };

  // Publish Draft to Live
  const handlePublishLive = async () => {
    try {
      setPublishing(true);
      const res = await fetch('/api/admin/homepage/builder/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setPublishedSections(data.data.publishedSections);
        setDraftSections(data.data.draftSections);
        setIsDraftModified(false);
        setLastPublishedAt(data.data.lastPublishedAt);
        setConfirmPublishModalOpen(false);
        dispatch(
          addToast({
            type: 'success',
            title: 'Published Live!',
            message: 'Your homepage layout is now live on the public storefront.',
          })
        );
        if (onRefresh) onRefresh();
      } else {
        dispatch(addToast({ type: 'error', message: data.message || 'Publish failed' }));
      }
    } catch (err) {
      console.error('Failed to publish homepage', err);
      dispatch(addToast({ type: 'error', message: 'Publish error' }));
    } finally {
      setPublishing(false);
    }
  };

  // Reset to Factory Default
  const handleResetToDefault = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/homepage/builder/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setDraftSections(data.data.draftSections);
        setIsDraftModified(true);
        setConfirmResetModalOpen(false);
        dispatch(
          addToast({
            type: 'info',
            title: 'Draft Reset',
            message: 'Layout has been reset to default template. Save or publish to apply.',
          })
        );
      }
    } catch (err) {
      console.error('Failed to reset draft', err);
    } finally {
      setSaving(false);
    }
  };

  // Move Section Up/Down
  const handleMove = (sectionId: string, direction: 'up' | 'down') => {
    const updated = moveSection(draftSections, sectionId, direction);
    setDraftSections(updated);
    setIsDraftModified(true);
  };

  // Duplicate Section
  const handleDuplicate = (sectionId: string) => {
    const updated = duplicateSection(draftSections, sectionId);
    setDraftSections(updated);
    setIsDraftModified(true);
    dispatch(addToast({ type: 'success', message: 'Section duplicated in draft' }));
  };

  // Delete Section
  const handleDelete = (sectionId: string) => {
    const filtered = draftSections.filter((s) => s.id !== sectionId);
    const reindexed = filtered.map((s, idx) => ({ ...s, displayOrder: idx + 1 }));
    setDraftSections(reindexed);
    setIsDraftModified(true);
    dispatch(addToast({ type: 'info', message: 'Section removed from draft' }));
  };

  // Toggle Section Enabled
  const handleToggleEnabled = (sectionId: string) => {
    const updated = draftSections.map((s) =>
      s.id === sectionId ? { ...s, isEnabled: !s.isEnabled } : s
    );
    setDraftSections(updated);
    setIsDraftModified(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (section: HomepageSectionConfig) => {
    setEditingSection(JSON.parse(JSON.stringify(section)));
    setEditModalOpen(true);
  };

  // Save Section Edits from Modal
  const handleSaveSectionModal = () => {
    if (!editingSection) return;
    const updated = draftSections.map((s) =>
      s.id === editingSection.id ? editingSection : s
    );
    setDraftSections(updated);
    setIsDraftModified(true);
    setEditModalOpen(false);
    setEditingSection(null);
    dispatch(addToast({ type: 'success', message: 'Section settings updated in draft' }));
  };

  // Add New Section
  const handleAddNewSection = (type: HomepageSectionType) => {
    const typeTitles: Record<HomepageSectionType, { title: string; subtitle: string }> = {
      hero_slider: { title: 'Hero Carousel', subtitle: 'Dynamic promotional slider' },
      trust_badges: { title: 'Value & Trust Badges', subtitle: 'Free Shipping, Support, Guarantee' },
      category_showcase: { title: 'Featured Categories', subtitle: 'Browse top collections' },
      product_grid: { title: 'Trending Products', subtitle: 'Specially picked items for you' },
      promotional_banner: { title: 'Mid-Page Special Offer', subtitle: 'Limited discount promo' },
      split_banners: { title: 'Seasonal Campaigns', subtitle: 'Dual card promotional showcase' },
      testimonials: { title: 'Customer Reviews', subtitle: 'Verified buyer feedback' },
    };

    const info = typeTitles[type] || { title: 'New Section', subtitle: '' };
    const newSec: HomepageSectionConfig = {
      id: `sec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      sectionType: type,
      title: info.title,
      subtitle: info.subtitle,
      displayOrder: draftSections.length + 1,
      isEnabled: true,
      settings: {
        productSource: 'featured',
        productLimit: 8,
        desktopColumns: 4,
        mobileColumns: 2,
        bannerPlacements: [],
        viewAllLink: '/shop',
        viewAllText: 'View All',
      },
    };

    const updated = [...draftSections, newSec];
    setDraftSections(updated);
    setIsDraftModified(true);
    dispatch(addToast({ type: 'success', message: `Added ${info.title} to draft` }));
    handleOpenEdit(newSec);
  };

  // Create Quick Banner
  const handleCreateQuickBanner = async () => {
    try {
      const res = await fetch('/api/cms/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          placement: 'homepage-secondary',
          tag: newBannerForm.tag,
          headline: newBannerForm.headline,
          subheadline: newBannerForm.subheadline,
          buttonText: newBannerForm.buttonText,
          buttonLink: newBannerForm.buttonLink,
          imageUrl: newBannerForm.imageUrl,
          backgroundColor: newBannerForm.backgroundColor,
          textColor: newBannerForm.textColor,
          theme: 'dark',
          displayOrder: 1,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const created = data.data;
        setBanners((prev) => [...prev, created]);
        setBannersMap((prev) => ({ ...prev, [created.id]: created }));
        setNewBannerModalOpen(false);
        dispatch(addToast({ type: 'success', message: 'New promotional banner created!' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(addToast({ type: 'error', message: 'Failed to create banner' }));
    }
  };

  // Interleaved Banner Management inside Edit Modal
  const handleAddBannerPlacement = () => {
    if (!editingSection) return;
    const availableBannerId = banners[0]?.id || 'bnr-main-1';
    const newPlacement: BannerPlacementRule = {
      id: `bp-${Date.now().toString(36)}`,
      bannerId: availableBannerId,
      insertAfterProductCount: 4,
      displayOrder: (editingSection.settings.bannerPlacements?.length || 0) + 1,
      isEnabled: true,
    };

    setEditingSection({
      ...editingSection,
      settings: {
        ...editingSection.settings,
        bannerPlacements: [...(editingSection.settings.bannerPlacements || []), newPlacement],
      },
    });
  };

  const handleUpdateBannerPlacement = (
    placementId: string,
    updates: Partial<BannerPlacementRule>
  ) => {
    if (!editingSection) return;
    const updated = (editingSection.settings.bannerPlacements || []).map((bp) =>
      bp.id === placementId ? { ...bp, ...updates } : bp
    );
    setEditingSection({
      ...editingSection,
      settings: {
        ...editingSection.settings,
        bannerPlacements: updated,
      },
    });
  };

  const handleRemoveBannerPlacement = (placementId: string) => {
    if (!editingSection) return;
    const filtered = (editingSection.settings.bannerPlacements || []).filter(
      (bp) => bp.id !== placementId
    );
    setEditingSection({
      ...editingSection,
      settings: {
        ...editingSection.settings,
        bannerPlacements: filtered,
      },
    });
  };

  // Helper for Section Type Badges
  const renderTypeIcon = (type: HomepageSectionType) => {
    switch (type) {
      case 'hero_slider':
        return <SlidersIcon className="w-4 h-4 text-emerald-400" />;
      case 'category_showcase':
        return <LayoutGrid className="w-4 h-4 text-teal-400" />;
      case 'product_grid':
        return <ShoppingBag className="w-4 h-4 text-blue-400" />;
      case 'promotional_banner':
        return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case 'split_banners':
        return <Layers className="w-4 h-4 text-amber-400" />;
      case 'testimonials':
        return <Quote className="w-4 h-4 text-pink-400" />;
      case 'trust_badges':
        return <ShieldCheck className="w-4 h-4 text-emerald-300" />;
      default:
        return <Sparkles className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderTypeBadge = (type: HomepageSectionType) => {
    const labels: Record<HomepageSectionType, { label: string; color: string }> = {
      hero_slider: { label: 'Hero Carousel', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
      category_showcase: { label: 'Category Grid', color: 'bg-teal-950 text-teal-300 border-teal-800' },
      product_grid: { label: 'Product Feed', color: 'bg-blue-950 text-blue-300 border-blue-800' },
      promotional_banner: { label: 'Single Banner', color: 'bg-purple-950 text-purple-300 border-purple-800' },
      split_banners: { label: 'Split Banners', color: 'bg-amber-950 text-amber-300 border-amber-800' },
      testimonials: { label: 'Reviews', color: 'bg-pink-950 text-pink-300 border-pink-800' },
      trust_badges: { label: 'Trust Badges', color: 'bg-emerald-900/60 text-emerald-200 border-emerald-700' },
    };
    const current = labels[type] || { label: type, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.color}`}>
        {renderTypeIcon(type)}
        {current.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading Homepage Builder Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Dynamic Homepage Builder</span>
                  {isDraftModified ? (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Draft Changes Pending
                    </span>
                  ) : (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Check className="w-3 h-3" /> Live Synchronized
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full control over homepage sequence, product feeds, banner placements, and grid counts.
                  {lastPublishedAt && (
                    <span className="ml-2 text-slate-500">
                      • Last published: {new Date(lastPublishedAt).toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setPreviewModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 border border-slate-700 cursor-pointer shadow-sm"
              title="Preview how draft layout looks on Desktop, Tablet, and Mobile"
            >
              <Eye className="w-4 h-4 text-teal-400" />
              <span>Live Preview</span>
            </button>

            <button
              onClick={() => handleSaveDraft()}
              disabled={saving}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 rounded-xl text-xs font-semibold transition flex items-center gap-2 border border-emerald-800/60 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              onClick={() => setConfirmPublishModalOpen(true)}
              disabled={publishing}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
            >
              <Globe className="w-4 h-4" />
              <span>Publish Live Homepage</span>
            </button>

            <div className="relative group">
              <button
                onClick={() => setConfirmResetModalOpen(true)}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                title="Reset layout to default factory template"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Add Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Add New Section to Homepage:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleAddNewSection('product_grid')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>+ Product Grid</span>
            </button>

            <button
              onClick={() => handleAddNewSection('promotional_banner')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>+ Promo Banner</span>
            </button>

            <button
              onClick={() => handleAddNewSection('split_banners')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>+ Split Cards</span>
            </button>

            <button
              onClick={() => handleAddNewSection('category_showcase')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>+ Categories</span>
            </button>

            <button
              onClick={() => handleAddNewSection('hero_slider')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <SlidersIcon className="w-3.5 h-3.5" />
              <span>+ Hero Slider</span>
            </button>

            <button
              onClick={() => handleAddNewSection('testimonials')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-pink-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Quote className="w-3.5 h-3.5" />
              <span>+ Testimonials</span>
            </button>

            <button
              onClick={() => setNewBannerModalOpen(true)}
              className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-emerald-800/80 cursor-pointer ml-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Create Banner</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Reorderable Section Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Active Sections Sequence</span>
            <span className="text-xs font-normal text-slate-500">
              ({draftSections.length} sections arranged from top to bottom)
            </span>
          </h2>
          <span className="text-xs text-slate-400">
            Use ▲ and ▼ to reorder sections. Changes take effect on next publish.
          </span>
        </div>

        {draftSections.map((section, index) => {
          const isFirst = index === 0;
          const isLast = index === draftSections.length - 1;
          const interleavedCount = section.settings.bannerPlacements?.filter((p) => p.isEnabled)
            .length || 0;

          return (
            <div
              key={section.id}
              className={`bg-slate-900 border rounded-2xl p-4 transition-all duration-200 shadow-md ${
                section.isEnabled
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-800/50 bg-slate-900/40 opacity-70'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Position & Basic Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Position Badge */}
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {section.displayOrder}
                  </div>

                  {/* Ordering arrows */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleMove(section.id, 'up')}
                      disabled={isFirst}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition"
                      title="Move Up"
                      aria-label={`Move ${section.title} up`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(section.id, 'down')}
                      disabled={isLast}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition"
                      title="Move Down"
                      aria-label={`Move ${section.title} down`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm truncate">
                        {section.title}
                      </span>
                      {renderTypeBadge(section.sectionType)}
                      {!section.isEnabled && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/80">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-400 flex-wrap">
                      {section.subtitle && (
                        <span className="text-slate-400 truncate max-w-xs">{section.subtitle}</span>
                      )}
                      {section.sectionType === 'product_grid' && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-blue-300 font-medium">
                            Source: {section.settings.productSource?.toUpperCase()}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">
                            Limit: {section.settings.productLimit} items ({section.settings.desktopColumns} cols)
                          </span>
                          {interleavedCount > 0 && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                                {interleavedCount} banner{interleavedCount > 1 ? 's' : ''} interleaved
                              </span>
                            </>
                          )}
                        </>
                      )}
                      {section.sectionType === 'promotional_banner' && section.settings.bannerId && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-purple-300">
                            Banner: {bannersMap[section.settings.bannerId]?.headline || section.settings.bannerId}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {/* Enable / Disable Switch */}
                  <button
                    onClick={() => handleToggleEnabled(section.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                      section.isEnabled
                        ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                    title={section.isEnabled ? 'Disable this section' : 'Enable this section'}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        section.isEnabled ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                    />
                    <span>{section.isEnabled ? 'Active' : 'Hidden'}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleOpenEdit(section)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    title="Configure section settings, feeds, and banners"
                  >
                    <Edit className="w-3.5 h-3.5 text-teal-400" />
                    <span>Configure</span>
                  </button>

                  {/* Duplicate Button */}
                  <button
                    onClick={() => handleDuplicate(section.id)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition cursor-pointer"
                    title="Duplicate section"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(section.id)}
                    className="p-2 bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer"
                    title="Delete section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3. SECTION CONFIGURATION DRAWER / MODAL */}
      {/* ======================================================== */}
      {editModalOpen && editingSection && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Configure Section: ${editingSection.title}`}
          maxWidth="3xl"
        >
          <div className="space-y-5 text-slate-200 text-xs">
            {/* Header info */}
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {renderTypeBadge(editingSection.sectionType)}
                <span className="text-slate-400 font-medium">Position #{editingSection.displayOrder}</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSection.isEnabled}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, isEnabled: e.target.checked })
                  }
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-white">Section Enabled</span>
              </label>
            </div>

            {/* Title & Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Section Heading Title</label>
                <input
                  type="text"
                  value={editingSection.title}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Popular Products"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Subtitle / Description</label>
                <input
                  type="text"
                  value={editingSection.subtitle || ''}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, subtitle: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Handpicked electronics & fashion"
                />
              </div>
            </div>

            {/* PRODUCT GRID SETTINGS */}
            {editingSection.sectionType === 'product_grid' && (
              <div className="border border-slate-700 rounded-xl p-4 bg-slate-800/40 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-400" />
                  <span>Product Feed & Layout Settings</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Product Source</label>
                    <select
                      value={editingSection.settings.productSource || 'featured'}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          settings: {
                            ...editingSection.settings,
                            productSource: e.target.value as ProductGridSource,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                    >
                      <option value="featured">Featured / Popular</option>
                      <option value="best_seller">Best Sellers</option>
                      <option value="new_arrivals">New Arrivals</option>
                      <option value="discount">On Sale / Deals</option>
                      <option value="category">Specific Category</option>
                    </select>
                  </div>

                  {editingSection.settings.productSource === 'category' && (
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Select Category</label>
                      <select
                        value={editingSection.settings.categorySlug || ''}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            settings: {
                              ...editingSection.settings,
                              categorySlug: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Total Products Limit</label>
                    <input
                      type="number"
                      min="2"
                      max="24"
                      value={editingSection.settings.productLimit}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          settings: {
                            ...editingSection.settings,
                            productLimit: parseInt(e.target.value, 10) || 4,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Desktop Grid Columns</label>
                    <select
                      value={editingSection.settings.desktopColumns || 4}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          settings: {
                            ...editingSection.settings,
                            desktopColumns: parseInt(e.target.value, 10) || 4,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                    >
                      <option value={3}>3 Columns</option>
                      <option value={4}>4 Columns (Standard)</option>
                      <option value={5}>5 Columns (Compact)</option>
                    </select>
                  </div>
                </div>

                {/* View All Link Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">View All Link</label>
                    <input
                      type="text"
                      value={editingSection.settings.viewAllLink || ''}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          settings: { ...editingSection.settings, viewAllLink: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                      placeholder="/shop"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">View All Button Label</label>
                    <input
                      type="text"
                      value={editingSection.settings.viewAllText || ''}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          settings: { ...editingSection.settings, viewAllText: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                      placeholder="View All Products"
                    />
                  </div>
                </div>

                {/* DYNAMIC INTERLEAVED BANNER PLACEMENT MANAGER */}
                <div className="mt-5 pt-4 border-t border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-purple-400" />
                        <span>Dynamic Banner Placement Between Products</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Insert promotional banners inside the product stream after specific product counts (e.g., after 4, 8, or 12 products).
                      </p>
                    </div>

                    <button
                      onClick={handleAddBannerPlacement}
                      className="px-2.5 py-1.5 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Interleaved Banner</span>
                    </button>
                  </div>

                  {(!editingSection.settings.bannerPlacements ||
                    editingSection.settings.bannerPlacements.length === 0) && (
                    <div className="bg-slate-900/60 border border-dashed border-slate-700 rounded-xl p-4 text-center">
                      <p className="text-slate-400 text-xs">
                        No banners interleaved in this section yet. Click "+ Add Interleaved Banner" to inject promotions between product cards.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {editingSection.settings.bannerPlacements?.map((placement, bpIdx) => (
                      <div
                        key={placement.id || bpIdx}
                        className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        {/* Banner selection */}
                        <div className="flex-1 min-w-0">
                          <label className="block text-[11px] text-slate-400 font-medium mb-1">
                            Promotional Banner to Display
                          </label>
                          <select
                            value={placement.bannerId}
                            onChange={(e) =>
                              handleUpdateBannerPlacement(placement.id, { bannerId: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                          >
                            {banners.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.tag ? `[${b.tag}] ` : ''}
                                {b.headline} ({b.id})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Insertion product threshold */}
                        <div className="w-full md:w-48">
                          <label className="block text-[11px] text-slate-400 font-medium mb-1">
                            Insert After Product #
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs">After</span>
                            <input
                              type="number"
                              min="1"
                              max="24"
                              value={placement.insertAfterProductCount}
                              onChange={(e) =>
                                handleUpdateBannerPlacement(placement.id, {
                                  insertAfterProductCount: parseInt(e.target.value, 10) || 1,
                                })
                              }
                              className="w-20 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-center font-bold focus:outline-none"
                            />
                            <span className="text-slate-500 text-xs">products</span>
                          </div>
                        </div>

                        {/* Status toggle & delete */}
                        <div className="flex items-center gap-2 self-end md:self-center pt-2 md:pt-0">
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={placement.isEnabled}
                              onChange={(e) =>
                                handleUpdateBannerPlacement(placement.id, {
                                  isEnabled: e.target.checked,
                                })
                              }
                              className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                            />
                            <span>Active</span>
                          </label>

                          <button
                            onClick={() => handleRemoveBannerPlacement(placement.id)}
                            className="p-1.5 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                            title="Remove banner placement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SINGLE PROMOTIONAL BANNER SETTINGS */}
            {editingSection.sectionType === 'promotional_banner' && (
              <div className="border border-slate-700 rounded-xl p-4 bg-slate-800/40 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span>Banner Selection</span>
                </h3>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Choose Banner</label>
                  <select
                    value={editingSection.settings.bannerId || ''}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        settings: { ...editingSection.settings, bannerId: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="">-- Choose Banner --</option>
                    {banners.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.headline} ({b.id})
                      </option>
                    ))}
                  </select>
                </div>

                {editingSection.settings.bannerId && bannersMap[editingSection.settings.bannerId] && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-700 flex items-center gap-4">
                    {bannersMap[editingSection.settings.bannerId].imageUrl && (
                      <img
                        src={bannersMap[editingSection.settings.bannerId].imageUrl}
                        alt="Preview"
                        className="w-20 h-14 object-cover rounded-lg border border-slate-700"
                      />
                    )}
                    <div>
                      <div className="text-white font-bold">
                        {bannersMap[editingSection.settings.bannerId].headline}
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {bannersMap[editingSection.settings.bannerId].subheadline}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SPLIT BANNERS SETTINGS */}
            {editingSection.sectionType === 'split_banners' && (
              <div className="border border-slate-700 rounded-xl p-4 bg-slate-800/40 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Dual Campaign Cards Selection</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Left Banner</label>
                    <select
                      value={editingSection.settings.bannerIds?.[0] || 'bnr-sec-1'}
                      onChange={(e) => {
                        const nextIds = [...(editingSection.settings.bannerIds || ['bnr-sec-1', 'bnr-sec-2'])];
                        nextIds[0] = e.target.value;
                        setEditingSection({
                          ...editingSection,
                          settings: { ...editingSection.settings, bannerIds: nextIds },
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                    >
                      {banners.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.headline} ({b.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Right Banner</label>
                    <select
                      value={editingSection.settings.bannerIds?.[1] || 'bnr-sec-2'}
                      onChange={(e) => {
                        const nextIds = [...(editingSection.settings.bannerIds || ['bnr-sec-1', 'bnr-sec-2'])];
                        nextIds[1] = e.target.value;
                        setEditingSection({
                          ...editingSection,
                          settings: { ...editingSection.settings, bannerIds: nextIds },
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                    >
                      {banners.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.headline} ({b.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSectionModal}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Section Settings</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 4. LIVE STOREFRONT PREVIEW MODAL */}
      {/* ======================================================== */}
      {previewModalOpen && (
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          title="Draft Homepage Live Preview"
          maxWidth="3xl"
        >
          <div className="space-y-4">
            {/* Viewport switch toolbar */}
            <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Viewport Mode:</span>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    previewDevice === 'tablet'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>Tablet (768px)</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (375px)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/60 font-medium">
                  Staging Preview Mode
                </span>
                <button
                  onClick={handlePublishLive}
                  disabled={publishing}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Publish This Layout</span>
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-center max-h-[70vh] overflow-y-auto">
              <div
                className={`bg-[#f8fafc] text-gray-900 rounded-xl overflow-hidden transition-all duration-300 shadow-2xl ${
                  previewDevice === 'desktop'
                    ? 'w-full'
                    : previewDevice === 'tablet'
                    ? 'w-[768px]'
                    : 'w-[375px]'
                }`}
              >
                {/* Storefront Mini Header */}
                <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0c593f] text-white flex items-center justify-center font-bold text-xs">
                      SM
                    </div>
                    <span className="font-extrabold text-sm tracking-tight text-[#0c593f]">
                      ShopMax
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">Draft Layout Preview</div>
                </div>

                {/* Render Sections in configured draft order */}
                <div className="divide-y divide-gray-100">
                  {draftSections
                    .filter((s) => s.isEnabled)
                    .map((sec) => (
                      <div key={sec.id} className="p-4 sm:p-6">
                        {/* Section Header */}
                        {sec.title && (
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-base font-bold text-gray-900">{sec.title}</h3>
                              {sec.subtitle && (
                                <p className="text-xs text-gray-500 mt-0.5">{sec.subtitle}</p>
                              )}
                            </div>
                            {sec.settings.viewAllText && (
                              <span className="text-xs font-semibold text-[#0c593f]">
                                {sec.settings.viewAllText} →
                              </span>
                            )}
                          </div>
                        )}

                        {/* HERO SLIDER PREVIEW */}
                        {sec.sectionType === 'hero_slider' && (
                          <div className="bg-[#0c261e] text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-3 max-w-md">
                              <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                {sliders[0]?.tag || 'FEATURED COLLECTION'}
                              </span>
                              <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">
                                {sliders[0]?.headline || 'Upgrade Your Lifestyle'}
                              </h2>
                              <p className="text-xs text-emerald-100/80">
                                {sliders[0]?.subheadline || 'Premium quality curated for your daily life.'}
                              </p>
                              <div className="pt-1">
                                <span className="inline-block px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow">
                                  {sliders[0]?.buttonText || 'Shop Now'}
                                </span>
                              </div>
                            </div>
                            {sliders[0]?.lifestyleImage && (
                              <img
                                src={sliders[0].lifestyleImage}
                                alt="Hero"
                                className="w-48 h-32 sm:w-60 sm:h-40 object-cover rounded-xl shadow-md"
                              />
                            )}
                          </div>
                        )}

                        {/* TRUST BADGES PREVIEW */}
                        {sec.sectionType === 'trust_badges' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2">
                            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex items-center gap-3">
                              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                              <div>
                                <div className="text-xs font-bold text-gray-900">
                                  Free Express Shipping
                                </div>
                                <div className="text-[11px] text-gray-500">On all orders over $50</div>
                              </div>
                            </div>
                            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex items-center gap-3">
                              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                              <div>
                                <div className="text-xs font-bold text-gray-900">
                                  30-Day Guarantee
                                </div>
                                <div className="text-[11px] text-gray-500">Hassle-free refunds</div>
                              </div>
                            </div>
                            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex items-center gap-3">
                              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                              <div>
                                <div className="text-xs font-bold text-gray-900">24/7 Support</div>
                                <div className="text-[11px] text-gray-500">Dedicated staff care</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CATEGORY SHOWCASE PREVIEW */}
                        {sec.sectionType === 'category_showcase' && (
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                            {categories.slice(0, 6).map((c) => (
                              <div
                                key={c.slug}
                                className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-xs"
                              >
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0c593f] flex items-center justify-center mx-auto mb-2 font-bold text-xs">
                                  {c.name.charAt(0)}
                                </div>
                                <div className="text-xs font-bold text-gray-800 truncate">
                                  {c.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* PRODUCT GRID WITH INTERLEAVED BANNERS PREVIEW */}
                        {sec.sectionType === 'product_grid' && (() => {
                          const limit = sec.settings.productLimit || 8;
                          const filteredProds = productsSummary.slice(0, limit);
                          const interleaved = interleaveProductsAndBanners(
                            filteredProds,
                            sec.settings.bannerPlacements || [],
                            bannersMap
                          );

                          return (
                            <div className="space-y-4">
                              <div
                                className={`grid gap-3.5 ${
                                  sec.settings.desktopColumns === 5
                                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
                                    : sec.settings.desktopColumns === 3
                                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                                    : 'grid-cols-2 sm:grid-cols-4'
                                }`}
                              >
                                {interleaved.map((entry, idx) => {
                                  if (entry.type === 'product') {
                                    const p = entry.item as any;
                                    return (
                                      <div
                                        key={`prod-${p.id}-${idx}`}
                                        className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs flex flex-col justify-between"
                                      >
                                        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2 relative">
                                          <img
                                            src={p.image}
                                            alt={p.name}
                                            className="w-full h-full object-contain p-2"
                                          />
                                        </div>
                                        <div>
                                          <div className="text-xs font-bold text-gray-800 line-clamp-1">
                                            {p.name}
                                          </div>
                                          <div className="text-xs font-extrabold text-[#0c593f] mt-1">
                                            ${p.price.toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Interleaved Banner item spanning full width
                                  const b = entry.item as GenericBanner;
                                  return (
                                    <div
                                      key={`bnr-${b.id}-${idx}`}
                                      className="col-span-full bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-5 my-2 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md"
                                      style={{ backgroundColor: b.backgroundColor || '#0c261e' }}
                                    >
                                      <div>
                                        {b.tag && (
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                            {b.tag}
                                          </span>
                                        )}
                                        <h4 className="text-base font-extrabold text-white mt-0.5">
                                          {b.headline}
                                        </h4>
                                        {b.subheadline && (
                                          <p className="text-xs text-white/80 mt-1 max-w-lg">
                                            {b.subheadline}
                                          </p>
                                        )}
                                      </div>
                                      <button className="px-4 py-2 bg-white text-gray-900 font-bold text-xs rounded-xl shadow shrink-0 cursor-pointer">
                                        {b.buttonText || 'Shop Now'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* PROMOTIONAL BANNER PREVIEW */}
                        {sec.sectionType === 'promotional_banner' && (() => {
                          const banner = bannersMap[sec.settings.bannerId || ''] || banners[0];
                          if (!banner) return null;
                          return (
                            <div
                              className="rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md"
                              style={{ backgroundColor: banner.backgroundColor || '#064e3b' }}
                            >
                              <div className="space-y-2">
                                {banner.tag && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                    {banner.tag}
                                  </span>
                                )}
                                <h3 className="text-xl font-extrabold">{banner.headline}</h3>
                                {banner.subheadline && (
                                  <p className="text-xs text-emerald-100/80 max-w-md">
                                    {banner.subheadline}
                                  </p>
                                )}
                                <div className="pt-2">
                                  <span className="inline-block px-4 py-2 bg-white text-gray-900 text-xs font-bold rounded-xl shadow">
                                    {banner.buttonText || 'Claim Deal'}
                                  </span>
                                </div>
                              </div>
                              {banner.imageUrl && (
                                <img
                                  src={banner.imageUrl}
                                  alt="Banner"
                                  className="w-48 h-28 object-cover rounded-xl shadow"
                                />
                              )}
                            </div>
                          );
                        })()}

                        {/* SPLIT BANNERS PREVIEW */}
                        {sec.sectionType === 'split_banners' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {sec.settings.bannerIds?.slice(0, 2).map((bId) => {
                              const b = bannersMap[bId] || banners[0];
                              if (!b) return null;
                              return (
                                <div
                                  key={bId}
                                  className="p-5 rounded-2xl text-white flex items-center justify-between gap-4 shadow-sm"
                                  style={{ backgroundColor: b.backgroundColor || '#0c261e' }}
                                >
                                  <div>
                                    {b.tag && (
                                      <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                                        {b.tag}
                                      </span>
                                    )}
                                    <h4 className="text-base font-bold text-white mt-1">
                                      {b.headline}
                                    </h4>
                                    <p className="text-xs text-white/70 mt-1">{b.subheadline}</p>
                                    <div className="mt-3">
                                      <span className="text-xs font-bold underline">
                                        {b.buttonText || 'Shop Now'} →
                                      </span>
                                    </div>
                                  </div>
                                  {b.imageUrl && (
                                    <img
                                      src={b.imageUrl}
                                      alt="Split"
                                      className="w-24 h-24 object-cover rounded-xl shrink-0"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* TESTIMONIALS PREVIEW */}
                        {sec.sectionType === 'testimonials' && (
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center max-w-lg mx-auto shadow-xs">
                            <Quote className="w-8 h-8 text-emerald-600/30 mx-auto mb-2" />
                            <p className="text-xs italic text-gray-600 leading-relaxed">
                              "ShopMax delivers exceptional build quality and ultra-fast shipping.
                              The noise cancelling headphones were even better than expected!"
                            </p>
                            <div className="mt-3 font-bold text-xs text-gray-900">
                              Marcus Sterling
                            </div>
                            <div className="text-[10px] text-emerald-600 font-semibold">
                              Verified Customer ★★★★★
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 5. QUICK BANNER CREATION MODAL */}
      {/* ======================================================== */}
      {newBannerModalOpen && (
        <Modal
          isOpen={newBannerModalOpen}
          onClose={() => setNewBannerModalOpen(false)}
          title="Create New Promotional Banner"
          maxWidth="xl"
        >
          <div className="space-y-4 text-slate-200 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Headline</label>
              <input
                type="text"
                value={newBannerForm.headline}
                onChange={(e) => setNewBannerForm({ ...newBannerForm, headline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none"
                placeholder="e.g. 50% Off Flash Weekend"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Subheadline</label>
              <input
                type="text"
                value={newBannerForm.subheadline}
                onChange={(e) => setNewBannerForm({ ...newBannerForm, subheadline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                placeholder="e.g. Save on top-tier smart tech & audio"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Tag / Category Pill</label>
                <input
                  type="text"
                  value={newBannerForm.tag}
                  onChange={(e) => setNewBannerForm({ ...newBannerForm, tag: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  placeholder="e.g. LIMITED OFFER"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Button Text</label>
                <input
                  type="text"
                  value={newBannerForm.buttonText}
                  onChange={(e) => setNewBannerForm({ ...newBannerForm, buttonText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  placeholder="Shop Now"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Destination URL</label>
              <input
                type="text"
                value={newBannerForm.buttonLink}
                onChange={(e) => setNewBannerForm({ ...newBannerForm, buttonLink: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                placeholder="/shop?category=electronics"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Banner Image URL</label>
              <input
                type="text"
                value={newBannerForm.imageUrl}
                onChange={(e) => setNewBannerForm({ ...newBannerForm, imageUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
              />
              <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
                {PRESET_BANNER_IMAGES.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Preset ${i}`}
                    onClick={() => setNewBannerForm({ ...newBannerForm, imageUrl: img })}
                    className={`w-14 h-10 object-cover rounded-lg cursor-pointer border-2 transition shrink-0 ${
                      newBannerForm.imageUrl === img ? 'border-emerald-500 scale-105' : 'border-transparent opacity-60'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                onClick={() => setNewBannerModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuickBanner}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Banner</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 6. CONFIRM PUBLISH MODAL */}
      {/* ======================================================== */}
      {confirmPublishModalOpen && (
        <Modal
          isOpen={confirmPublishModalOpen}
          onClose={() => setConfirmPublishModalOpen(false)}
          title="Publish Homepage Layout Live"
          maxWidth="md"
        >
          <div className="space-y-4 text-slate-200 text-xs">
            <div className="bg-emerald-950/60 border border-emerald-800/80 p-4 rounded-xl flex items-center gap-3">
              <Globe className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Deploy Draft to Live Site</h4>
                <p className="text-slate-300 text-xs mt-0.5">
                  This will immediately update the live public storefront (`/`) with your {draftSections.length} configured sections and banner interleaving rules.
                </p>
              </div>
            </div>

            <p className="text-slate-400">
              Shoppers visiting your storefront will immediately see the updated sequence and promotional placements without requiring server restarts.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                onClick={() => setConfirmPublishModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishLive}
                disabled={publishing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-950/60 cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{publishing ? 'Publishing...' : 'Yes, Publish Live'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 7. CONFIRM RESET MODAL */}
      {/* ======================================================== */}
      {confirmResetModalOpen && (
        <Modal
          isOpen={confirmResetModalOpen}
          onClose={() => setConfirmResetModalOpen(false)}
          title="Reset Draft to Default Template"
          maxWidth="md"
        >
          <div className="space-y-4 text-slate-200 text-xs">
            <p className="text-slate-300">
              Are you sure you want to reset your draft layout to the factory default ShopMax homepage sequence? Any unsaved rearrangements in draft will be replaced.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                onClick={() => setConfirmResetModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetToDefault}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition shadow cursor-pointer"
              >
                Reset Draft
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
