import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { Modal } from '../../components/modal/Modal';
import {
  Sparkles,
  Save,
  Truck,
  Image as ImageIcon,
  Layout,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  Sliders as SlidersIcon,
  Megaphone,
  Layers,
  ArrowUpDown,
  Calendar,
  MousePointerClick,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface CmsAdminPageProps {
  cmsData: any;
  activeModule?: string;
  onRefresh: () => void;
}

interface SliderItem {
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
  isActive: boolean;
}

interface BannerItem {
  id: string;
  placement: string;
  tag?: string;
  headline: string;
  subheadline?: string;
  buttonText: string;
  buttonLink: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  theme?: string;
  displayOrder: number;
  isActive: boolean;
}

interface AdvertisementItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  destinationUrl: string;
  buttonText: string;
  priority: number;
  frequency: 'once_per_session' | 'always' | 'daily';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  dismissals: number;
}

const PRESET_SLIDER_IMAGES = [
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&q=80',
];

const PRESET_BANNER_IMAGES = [
  'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
  'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1000&q=80',
];

const PRESET_AD_IMAGES = [
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&q=80',
  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1000&q=80',
  'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1000&q=80',
];

export const CmsAdminPage: React.FC<CmsAdminPageProps> = ({
  cmsData,
  activeModule,
  onRefresh,
}) => {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  // Tab Selection
  const [activeTab, setActiveTab] = useState<'sliders' | 'banners' | 'ads' | 'announcements'>(
    activeModule === 'cms-ads'
      ? 'ads'
      : activeModule === 'cms-banners'
      ? 'banners'
      : 'sliders'
  );

  useEffect(() => {
    if (activeModule === 'cms-ads') setActiveTab('ads');
    else if (activeModule === 'cms-banners') setActiveTab('banners');
    else if (activeModule === 'cms-home') setActiveTab('announcements');
  }, [activeModule]);

  // Sliders State
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [sliderModalOpen, setSliderModalOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<SliderItem | null>(null);
  const [previewSlider, setPreviewSlider] = useState<SliderItem | null>(null);
  const [deleteSliderId, setDeleteSliderId] = useState<string | null>(null);

  // Banners State
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [bannerFilterPlacement, setBannerFilterPlacement] = useState<string>('all');
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [deleteBannerId, setDeleteBannerId] = useState<string | null>(null);

  // Advertisements State
  const [advertisements, setAdvertisements] = useState<AdvertisementItem[]>([]);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdvertisementItem | null>(null);
  const [testPreviewAd, setTestPreviewAd] = useState<AdvertisementItem | null>(null);
  const [deleteAdId, setDeleteAdId] = useState<string | null>(null);

  // Announcement Bar State
  const [announcementText, setAnnouncementText] = useState('');
  const [guaranteeText, setGuaranteeText] = useState('');
  const [supportText, setSupportText] = useState('');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  // Slider Form State
  const [sliderForm, setSliderForm] = useState({
    tag: 'NEW ARRIVALS',
    headline: 'Upgrade Your\nLifestyle',
    subheadline: 'Discover premium quality products designed for a better, smarter and easier life.',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    lifestyleImage: PRESET_SLIDER_IMAGES[0],
    modelScript: 'Good Things\nTake Time ♡',
    badge: 'Trending Collection',
    displayOrder: 1,
    isActive: true,
  });

  // Banner Form State
  const [bannerForm, setBannerForm] = useState({
    placement: 'homepage-secondary',
    tag: 'Special Promo',
    headline: 'Smart Lifestyle Solutions',
    subheadline: 'Curated products engineered for modern comfort.',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    imageUrl: PRESET_BANNER_IMAGES[0],
    backgroundColor: '#0c261e',
    textColor: '#ffffff',
    theme: 'dark',
    displayOrder: 1,
    isActive: true,
  });

  // Ad Form State
  const [adForm, setAdForm] = useState({
    title: 'Flash Sale: 20% Off Your Entire Cart',
    description: 'Use promo code FLASH20 during checkout to unlock an exclusive 20% discount on all premium electronics.',
    imageUrl: PRESET_AD_IMAGES[0],
    destinationUrl: '/shop?coupon=FLASH20',
    buttonText: 'Claim 20% Off',
    priority: 1,
    frequency: 'once_per_session' as 'once_per_session' | 'always' | 'daily',
    isActive: true,
    startDate: '',
    endDate: '',
  });

  // Load Sliders, Banners, and Advertisements
  useEffect(() => {
    loadSliders();
    loadBanners();
    loadAdvertisements();
  }, [token]);

  useEffect(() => {
    if (cmsData) {
      setAnnouncementText(cmsData.announcementBar?.freeShippingText || 'Free shipping on orders over $50 / ৳5,000');
      setGuaranteeText(cmsData.announcementBar?.guaranteeText || '30 Days Money Back Guarantee');
      setSupportText(cmsData.announcementBar?.supportText || '24/7 Dedicated Customer Care');
    }
  }, [cmsData]);

  const loadSliders = async () => {
    try {
      const res = await fetch('/api/cms/sliders');
      const data = await res.json();
      if (data.success) {
        setSliders(data.data);
      }
    } catch (err) {
      console.error('Failed to load sliders', err);
    }
  };

  const loadBanners = async () => {
    try {
      const res = await fetch('/api/cms/banners');
      const data = await res.json();
      if (data.success) {
        setBanners(data.data);
      }
    } catch (err) {
      console.error('Failed to load banners', err);
    }
  };

  const loadAdvertisements = async () => {
    try {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/cms/advertisements', { headers });
      const data = await res.json();
      if (data.success) {
        setAdvertisements(data.data);
      }
    } catch (err) {
      console.error('Failed to load advertisements', err);
    }
  };

  // ==========================================
  // SLIDER ACTIONS
  // ==========================================

  const handleOpenAddSlider = () => {
    setEditingSlider(null);
    setSliderForm({
      tag: 'NEW ARRIVALS',
      headline: 'Upgrade Your\nLifestyle',
      subheadline: 'Discover premium quality products designed for a better, smarter and easier life.',
      buttonText: 'Shop Now',
      buttonLink: '/shop',
      lifestyleImage: PRESET_SLIDER_IMAGES[0],
      modelScript: 'Good Things\nTake Time ♡',
      badge: 'Trending Collection',
      displayOrder: sliders.length + 1,
      isActive: true,
    });
    setSliderModalOpen(true);
  };

  const handleOpenEditSlider = (slider: SliderItem) => {
    setEditingSlider(slider);
    setSliderForm({
      tag: slider.tag,
      headline: slider.headline,
      subheadline: slider.subheadline,
      buttonText: slider.buttonText,
      buttonLink: slider.buttonLink,
      lifestyleImage: slider.lifestyleImage,
      modelScript: slider.modelScript || 'Good Things\nTake Time ♡',
      badge: slider.badge || '',
      displayOrder: slider.displayOrder,
      isActive: slider.isActive,
    });
    setSliderModalOpen(true);
  };

  const handleSaveSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const url = editingSlider ? `/api/cms/sliders/${editingSlider.id}` : '/api/cms/sliders';
      const method = editingSlider ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(sliderForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save slider');

      dispatch(
        addToast({
          type: 'success',
          title: editingSlider ? 'Slider Updated' : 'Slider Created',
          message: data.message || 'Slider successfully saved to database.',
        })
      );

      setSliderModalOpen(false);
      loadSliders();
      onRefresh();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const handleToggleSliderActive = async (slider: SliderItem) => {
    try {
      const res = await fetch(`/api/cms/sliders/${slider.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to toggle slider');

      dispatch(
        addToast({
          type: 'success',
          message: data.message || `Slider ${slider.id} status updated`,
        })
      );
      loadSliders();
      onRefresh();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const handleConfirmDeleteSlider = async () => {
    if (!deleteSliderId) return;
    try {
      const res = await fetch(`/api/cms/sliders/${deleteSliderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete slider');

      dispatch(addToast({ type: 'info', title: 'Slider Deleted', message: data.message }));
      setDeleteSliderId(null);
      loadSliders();
      onRefresh();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  // ==========================================
  // BANNER ACTIONS
  // ==========================================

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      placement: bannerFilterPlacement !== 'all' ? bannerFilterPlacement : 'homepage-secondary',
      tag: 'Special Promo',
      headline: 'Smart Lifestyle Solutions',
      subheadline: 'Curated products engineered for modern comfort.',
      buttonText: 'Shop Now',
      buttonLink: '/shop',
      imageUrl: PRESET_BANNER_IMAGES[0],
      backgroundColor: '#0c261e',
      textColor: '#ffffff',
      theme: 'dark',
      displayOrder: banners.length + 1,
      isActive: true,
    });
    setBannerModalOpen(true);
  };

  const handleOpenEditBanner = (banner: BannerItem) => {
    setEditingBanner(banner);
    setBannerForm({
      placement: banner.placement,
      tag: banner.tag || '',
      headline: banner.headline,
      subheadline: banner.subheadline || '',
      buttonText: banner.buttonText,
      buttonLink: banner.buttonLink,
      imageUrl: banner.imageUrl || PRESET_BANNER_IMAGES[0],
      backgroundColor: banner.backgroundColor || '#0c261e',
      textColor: banner.textColor || '#ffffff',
      theme: banner.theme || 'dark',
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
    });
    setBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const url = editingBanner ? `/api/cms/banners/${editingBanner.id}` : '/api/cms/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(bannerForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save banner');

      dispatch(
        addToast({
          type: 'success',
          title: editingBanner ? 'Banner Updated' : 'Banner Created',
          message: data.message || 'Banner saved to live homepage.',
        })
      );

      setBannerModalOpen(false);
      loadBanners();
      onRefresh();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const handleToggleBannerActive = async (banner: BannerItem) => {
    try {
      const res = await fetch(`/api/cms/banners/${banner.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to toggle banner');

      dispatch(
        addToast({
          type: 'success',
          message: data.message || `Banner status updated.`,
        })
      );
      loadBanners();
      onRefresh();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const handleConfirmDeleteBanner = async () => {
    if (!deleteBannerId) return;
    try {
      const res = await fetch(`/api/cms/banners/${deleteBannerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete banner');

      dispatch(addToast({ type: 'info', title: 'Banner Deleted', message: data.message }));
      setDeleteBannerId(null);
      loadBanners();
      onRefresh();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  // ==========================================
  // ADVERTISEMENT ACTIONS
  // ==========================================

  const handleOpenAddAd = () => {
    setEditingAd(null);
    setAdForm({
      title: 'Flash Sale: 20% Off Your Entire Cart',
      description: 'Use promo code FLASH20 during checkout to unlock an exclusive 20% discount on all premium electronics.',
      imageUrl: PRESET_AD_IMAGES[0],
      destinationUrl: '/shop?coupon=FLASH20',
      buttonText: 'Claim 20% Off',
      priority: 1,
      frequency: 'once_per_session',
      isActive: true,
      startDate: '',
      endDate: '',
    });
    setAdModalOpen(true);
  };

  const handleOpenEditAd = (ad: AdvertisementItem) => {
    setEditingAd(ad);
    setAdForm({
      title: ad.title,
      description: ad.description || '',
      imageUrl: ad.imageUrl,
      destinationUrl: ad.destinationUrl,
      buttonText: ad.buttonText,
      priority: ad.priority,
      frequency: ad.frequency,
      isActive: ad.isActive,
      startDate: ad.startDate || '',
      endDate: ad.endDate || '',
    });
    setAdModalOpen(true);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const url = editingAd ? `/api/cms/advertisements/${editingAd.id}` : '/api/cms/advertisements';
      const method = editingAd ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(adForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save advertisement');

      dispatch(
        addToast({
          type: 'success',
          title: editingAd ? 'Advertisement Updated' : 'Advertisement Created',
          message: data.message || 'Campaign is live for storefront visitors.',
        })
      );

      setAdModalOpen(false);
      loadAdvertisements();
      onRefresh();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const handleToggleAdActive = async (ad: AdvertisementItem) => {
    try {
      const res = await fetch(`/api/cms/advertisements/${ad.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to toggle advertisement');

      dispatch(
        addToast({
          type: 'success',
          message: data.message || `Advertisement ${ad.id} updated`,
        })
      );
      loadAdvertisements();
      onRefresh();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const handleConfirmDeleteAd = async () => {
    if (!deleteAdId) return;
    try {
      const res = await fetch(`/api/cms/advertisements/${deleteAdId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete advertisement');

      dispatch(addToast({ type: 'info', title: 'Ad Campaign Deleted', message: data.message }));
      setDeleteAdId(null);
      loadAdvertisements();
      onRefresh();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  // ==========================================
  // ANNOUNCEMENT BAR ACTIONS
  // ==========================================

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAnnouncement(true);
    try {
      const payload = {
        announcementBar: {
          enabled: true,
          freeShippingText: announcementText,
          guaranteeText: guaranteeText,
          supportText: supportText,
        },
      };

      const res = await fetch('/api/cms/homepage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update announcements');

      dispatch(
        addToast({
          type: 'success',
          title: 'Storefront Announcements Saved',
          message: 'Top announcement bar updated across storefront.',
        })
      );
      onRefresh();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const filteredBanners = banners.filter((b) =>
    bannerFilterPlacement === 'all' ? true : b.placement === bannerFilterPlacement
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
              Dynamic Homepage & Content Management
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Directly control the live Storefront Hero Slider, Promotional Banners, and Visitor Advertisement Campaigns.
          </p>
        </div>

        {/* Tab navigation buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200/80 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('sliders')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'sliders'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <SlidersIcon className="w-3.5 h-3.5" />
            <span>Hero Sliders</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {sliders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Homepage Banners</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
              {banners.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'ads'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Advertisements</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {advertisements.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Top Bar</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: HERO SLIDERS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'sliders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4">
            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                Hero Slider Carousel ({sliders.filter((s) => s.isActive).length} Active on Storefront)
              </h3>
              <p className="text-xs text-emerald-800/80">
                Sliders rotate automatically on the customer homepage with auto-play, pause-on-hover, and swipe navigation.
              </p>
            </div>
            <button
              onClick={handleOpenAddSlider}
              className="flex items-center gap-2 px-4 py-2 bg-[#00875a] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Slider</span>
            </button>
          </div>

          {/* Sliders Grid / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sliders.map((slider) => (
              <div
                key={slider.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-xs ${
                  slider.isActive ? 'border-gray-200/90' : 'border-dashed border-gray-300 opacity-75'
                }`}
              >
                {/* Image Container with Tag & Status */}
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden group">
                  <img
                    src={slider.lifestyleImage}
                    alt={slider.headline}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/95 text-emerald-900 shadow-xs">
                      {slider.tag}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                      Order: #{slider.displayOrder}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleToggleSliderActive(slider)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition shadow-xs flex items-center gap-1 ${
                        slider.isActive
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-gray-700 text-gray-200 hover:bg-gray-800'
                      }`}
                      title={slider.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {slider.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{slider.isActive ? 'Live' : 'Hidden'}</span>
                    </button>
                  </div>

                  {/* Overlay text */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h4 className="text-base font-extrabold leading-tight line-clamp-1 drop-shadow-md">
                      {slider.headline.replace('\n', ' ')}
                    </h4>
                    <p className="text-[11px] text-gray-200 line-clamp-1 mt-0.5 drop-shadow-sm">
                      {slider.subheadline}
                    </p>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">Button: "{slider.buttonText}"</span>
                    <span className="font-mono text-[11px] text-emerald-700">{slider.buttonLink}</span>
                  </div>

                  {slider.modelScript && (
                    <div className="text-[11px] font-serif italic text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      Overlay: "{slider.modelScript.replace('\n', ' ')}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setPreviewSlider(slider)}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-emerald-700 font-semibold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditSlider(slider)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                        title="Edit slider"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteSliderId(slider.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                        title="Delete slider"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: HOMEPAGE BANNERS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4">
            <div>
              <h3 className="text-sm font-bold text-blue-950">
                Promotional Banners by Placement
              </h3>
              <p className="text-xs text-blue-800/80">
                Manage promotional strips, dual campaign cards (Smart Tech & Fashion), category spotlight banners, and discount strips.
              </p>
            </div>
            <button
              onClick={handleOpenAddBanner}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Banner</span>
            </button>
          </div>

          {/* Placement Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Placements' },
              { id: 'homepage-main', label: 'Main Promo' },
              { id: 'homepage-secondary', label: 'Dual Split Cards' },
              { id: 'homepage-category', label: 'Category Spotlight' },
              { id: 'homepage-promotion', label: 'Discount Strip' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setBannerFilterPlacement(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  bannerFilterPlacement === p.id
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Banners List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBanners.map((banner) => (
              <div
                key={banner.id}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div
                  className="p-5 flex flex-col justify-between min-h-[160px] relative text-white rounded-t-2xl overflow-hidden"
                  style={{
                    backgroundColor: banner.backgroundColor || '#0c261e',
                    color: banner.textColor || '#ffffff',
                  }}
                >
                  {banner.imageUrl && (
                    <img
                      src={banner.imageUrl}
                      alt={banner.headline}
                      className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                    />
                  )}

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-xs">
                      {banner.placement}
                    </span>
                    <button
                      onClick={() => handleToggleBannerActive(banner)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition flex items-center gap-1 ${
                        banner.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-gray-200'
                      }`}
                    >
                      {banner.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <div className="relative z-10 my-3">
                    {banner.tag && (
                      <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                        {banner.tag}
                      </div>
                    )}
                    <h4 className="text-base font-extrabold leading-snug">
                      {banner.headline.replace('\n', ' ')}
                    </h4>
                    {banner.subheadline && (
                      <p className="text-xs opacity-80 mt-1 line-clamp-1">{banner.subheadline}</p>
                    )}
                  </div>

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-xs font-bold underline underline-offset-4">
                      {banner.buttonText} →
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">{banner.buttonLink}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">
                    Order: #{banner.displayOrder}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditBanner(banner)}
                      className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                      title="Edit banner"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteBannerId(banner.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                      title="Delete banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ADVERTISEMENTS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'ads' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Visitor Advertisement Popup System
              </h3>
              <p className="text-xs text-amber-900/80">
                Configure promotional popup modals shown to visitors. Includes visible Close button, frequency controls, impression/click analytics, and session dismissal rules.
              </p>
            </div>
            <button
              onClick={handleOpenAddAd}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Advertisement</span>
            </button>
          </div>

          {/* Advertisements List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {advertisements.map((ad) => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
              return (
                <div
                  key={ad.id}
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  {/* Image preview with tag */}
                  <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                        Priority #{ad.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white backdrop-blur-xs">
                        {ad.frequency.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleToggleAdActive(ad)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition shadow-xs flex items-center gap-1 ${
                          ad.isActive
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-gray-700 text-gray-200 hover:bg-gray-800'
                        }`}
                      >
                        {ad.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{ad.isActive ? 'Active' : 'Paused'}</span>
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h4 className="text-base font-extrabold leading-tight line-clamp-1 drop-shadow-md">
                        {ad.title}
                      </h4>
                      <p className="text-[11px] text-gray-200 line-clamp-1 mt-0.5">
                        {ad.description}
                      </p>
                    </div>
                  </div>

                  {/* Real-Time Ad Performance Metrics */}
                  <div className="p-4 space-y-3 bg-white">
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-xl text-center border border-gray-100">
                      <div>
                        <div className="text-[10px] text-gray-500 font-medium">Impressions</div>
                        <div className="text-sm font-extrabold text-gray-900">{ad.impressions}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 font-medium">Clicks</div>
                        <div className="text-sm font-extrabold text-emerald-700">{ad.clicks}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 font-medium">CTR</div>
                        <div className="text-sm font-extrabold text-blue-600">{ctr}%</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">Destination:</span>
                      <span className="font-mono text-[11px] text-emerald-700 truncate max-w-[150px]">
                        {ad.destinationUrl}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setTestPreviewAd(ad)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Test Modal Popup</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditAd(ad)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                          title="Edit advertisement"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteAdId(ad.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                          title="Delete advertisement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: STOREFRONT ANNOUNCEMENTS & CONTENT */}
      {/* ======================================================== */}
      {activeTab === 'announcements' && (
        <form onSubmit={handleSaveAnnouncement} className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Top Announcement Bar (ShopMax Header)
                </h3>
              </div>

              <button
                type="submit"
                disabled={isSavingAnnouncement}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isSavingAnnouncement ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Header Messages</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Free Shipping Headline
                </label>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-emerald-600 transition"
                  placeholder="e.g. Free shipping on orders over $50 / ৳5,000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Guarantee Badge Text
                </label>
                <input
                  type="text"
                  value={guaranteeText}
                  onChange={(e) => setGuaranteeText(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-emerald-600 transition"
                  placeholder="e.g. 30 Days Money Back Guarantee"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Support Hotline / Hours
                </label>
                <input
                  type="text"
                  value={supportText}
                  onChange={(e) => setSupportText(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-emerald-600 transition"
                  placeholder="e.g. 24/7 Dedicated Customer Care"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT HERO SLIDER */}
      {/* ======================================================== */}
      <Modal
        isOpen={sliderModalOpen}
        onClose={() => setSliderModalOpen(false)}
        title={editingSlider ? 'Edit Hero Slider' : 'Create New Hero Slider'}
        description="Configure headline, call-to-action button, display order, and background lifestyle imagery."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveSlider} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Upper Tag / Badge
              </label>
              <input
                type="text"
                required
                value={sliderForm.tag}
                onChange={(e) => setSliderForm({ ...sliderForm, tag: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600"
                placeholder="e.g. NEW ARRIVALS, FLASH SALE"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Badge Pill (Optional)
              </label>
              <input
                type="text"
                value={sliderForm.badge}
                onChange={(e) => setSliderForm({ ...sliderForm, badge: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600"
                placeholder="e.g. Trending Collection"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Main Headline (Supports line break \n)
            </label>
            <textarea
              required
              rows={2}
              value={sliderForm.headline}
              onChange={(e) => setSliderForm({ ...sliderForm, headline: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600"
              placeholder="e.g. Upgrade Your&#10;Lifestyle"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Subtitle / Description
            </label>
            <input
              type="text"
              required
              value={sliderForm.subheadline}
              onChange={(e) => setSliderForm({ ...sliderForm, subheadline: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600"
              placeholder="e.g. Discover premium quality products designed for a better life."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Button Text
              </label>
              <input
                type="text"
                required
                value={sliderForm.buttonText}
                onChange={(e) => setSliderForm({ ...sliderForm, buttonText: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600"
                placeholder="Shop Now"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Button Destination Link
              </label>
              <input
                type="text"
                required
                value={sliderForm.buttonLink}
                onChange={(e) => setSliderForm({ ...sliderForm, buttonLink: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600 font-mono"
                placeholder="/shop or /shop?category=electronics"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Handwritten Model Script Overlay
            </label>
            <input
              type="text"
              value={sliderForm.modelScript}
              onChange={(e) => setSliderForm({ ...sliderForm, modelScript: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600"
              placeholder="Good Things&#10;Take Time ♡"
            />
          </div>

          {/* Lifestyle Image selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              Lifestyle Image URL
            </label>
            <input
              type="url"
              required
              value={sliderForm.lifestyleImage}
              onChange={(e) => setSliderForm({ ...sliderForm, lifestyleImage: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600 font-mono"
              placeholder="https://..."
            />

            {/* Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-gray-500 font-semibold">Presets:</span>
              <div className="flex items-center gap-2 overflow-x-auto">
                {PRESET_SLIDER_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSliderForm({ ...sliderForm, lifestyleImage: img })}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                      sliderForm.lifestyleImage === img
                        ? 'border-emerald-600 scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Display Order Sequence
              </label>
              <input
                type="number"
                min={1}
                value={sliderForm.displayOrder}
                onChange={(e) =>
                  setSliderForm({ ...sliderForm, displayOrder: parseInt(e.target.value, 10) || 1 })
                }
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="sliderActiveCheckbox"
                checked={sliderForm.isActive}
                onChange={(e) => setSliderForm({ ...sliderForm, isActive: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="sliderActiveCheckbox"
                className="text-xs font-bold text-gray-800 cursor-pointer"
              >
                Publish Live Immediately
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setSliderModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {editingSlider ? 'Save Changes' : 'Create Slider'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: ADD / EDIT BANNER */}
      {/* ======================================================== */}
      <Modal
        isOpen={bannerModalOpen}
        onClose={() => setBannerModalOpen(false)}
        title={editingBanner ? 'Edit Banner' : 'Create Homepage Banner'}
        description="Configure banner placement, headline, background color, and destination link."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveBanner} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Placement Section
              </label>
              <select
                value={bannerForm.placement}
                onChange={(e) => setBannerForm({ ...bannerForm, placement: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600 font-semibold"
              >
                <option value="homepage-secondary">Dual Split Card (homepage-secondary)</option>
                <option value="homepage-main">Main Highlight (homepage-main)</option>
                <option value="homepage-category">Category Spotlight (homepage-category)</option>
                <option value="homepage-promotion">Discount Strip (homepage-promotion)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Upper Tag
              </label>
              <input
                type="text"
                value={bannerForm.tag}
                onChange={(e) => setBannerForm({ ...bannerForm, tag: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600"
                placeholder="e.g. Smart Tech, Fashion"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Headline
            </label>
            <input
              type="text"
              required
              value={bannerForm.headline}
              onChange={(e) => setBannerForm({ ...bannerForm, headline: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600"
              placeholder="e.g. Smart Tech Smarter You"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={bannerForm.subheadline}
              onChange={(e) => setBannerForm({ ...bannerForm, subheadline: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600"
              placeholder="e.g. Latest gadgets. Unbeatable prices."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Button Label
              </label>
              <input
                type="text"
                required
                value={bannerForm.buttonText}
                onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600"
                placeholder="Shop Now"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Destination Link
              </label>
              <input
                type="text"
                required
                value={bannerForm.buttonLink}
                onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-emerald-600 font-mono"
                placeholder="/shop?category=electronics"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Background Hex Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bannerForm.backgroundColor}
                  onChange={(e) => setBannerForm({ ...bannerForm, backgroundColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={bannerForm.backgroundColor}
                  onChange={(e) => setBannerForm({ ...bannerForm, backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Theme
              </label>
              <select
                value={bannerForm.theme}
                onChange={(e) => setBannerForm({ ...bannerForm, theme: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold"
              >
                <option value="dark">Dark Slate (#0c261e)</option>
                <option value="emerald">Forest Emerald (#00875a)</option>
                <option value="peach">Warm Peach (#fef3e9)</option>
                <option value="amber">Vibrant Amber (#d97706)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Banner Image URL (Optional)
            </label>
            <input
              type="url"
              value={bannerForm.imageUrl}
              onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-mono"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setBannerModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {editingBanner ? 'Save Banner' : 'Create Banner'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: ADD / EDIT ADVERTISEMENT */}
      {/* ======================================================== */}
      <Modal
        isOpen={adModalOpen}
        onClose={() => setAdModalOpen(false)}
        title={editingAd ? 'Edit Advertisement Campaign' : 'Create Visitor Advertisement Campaign'}
        description="Set up high-converting popup promotions with priority, scheduling, and session rules."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveAd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Campaign Title
            </label>
            <input
              type="text"
              required
              value={adForm.title}
              onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-amber-600 font-semibold"
              placeholder="e.g. Flash Sale: 20% Off Your Entire Cart"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Campaign Description / Promo Code
            </label>
            <textarea
              rows={2}
              value={adForm.description}
              onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-amber-600"
              placeholder="e.g. Use promo code FLASH20 during checkout to unlock 20% off."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Button Text
              </label>
              <input
                type="text"
                required
                value={adForm.buttonText}
                onChange={(e) => setAdForm({ ...adForm, buttonText: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                placeholder="Claim 20% Off"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Destination Link URL
              </label>
              <input
                type="text"
                required
                value={adForm.destinationUrl}
                onChange={(e) => setAdForm({ ...adForm, destinationUrl: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-mono"
                placeholder="/shop?coupon=FLASH20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Display Priority (1 = Top)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={adForm.priority}
                onChange={(e) =>
                  setAdForm({ ...adForm, priority: parseInt(e.target.value, 10) || 1 })
                }
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Display Frequency Rule
              </label>
              <select
                value={adForm.frequency}
                onChange={(e) => setAdForm({ ...adForm, frequency: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold"
              >
                <option value="once_per_session">Once Per Session (Recommended)</option>
                <option value="daily">Once Daily</option>
                <option value="always">Every Visit</option>
              </select>
            </div>
          </div>

          {/* Ad Image URL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              Advertisement Image URL
            </label>
            <input
              type="url"
              required
              value={adForm.imageUrl}
              onChange={(e) => setAdForm({ ...adForm, imageUrl: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-mono"
              placeholder="https://images.unsplash.com/..."
            />

            {/* Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-gray-500 font-semibold">Presets:</span>
              <div className="flex items-center gap-2 overflow-x-auto">
                {PRESET_AD_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAdForm({ ...adForm, imageUrl: img })}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                      adForm.imageUrl === img
                        ? 'border-amber-600 scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAdModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {editingAd ? 'Save Campaign' : 'Launch Campaign'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: INTERACTIVE VISITOR ADVERTISEMENT TEST PREVIEW */}
      {/* ======================================================== */}
      {testPreviewAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Prominent Close button matching requirements */}
            <button
              onClick={() => setTestPreviewAd(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer shadow-md"
              aria-label="Close advertisement popup"
            >
              <XCircle className="w-5 h-5" />
            </button>

            {/* Image banner */}
            <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
              <img
                src={testPreviewAd.imageUrl}
                alt={testPreviewAd.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                  Exclusive Offer
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1 drop-shadow-md">
                  {testPreviewAd.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-center">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {testPreviewAd.description ||
                  'Limited time promotion available across all categories.'}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    dispatch(
                      addToast({
                        type: 'info',
                        title: 'Destination Triggered',
                        message: `Visitor redirected to: ${testPreviewAd.destinationUrl}`,
                      })
                    );
                    setTestPreviewAd(null);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#00875a] hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-950/20 cursor-pointer"
                >
                  {testPreviewAd.buttonText || 'Claim Deal'}
                </button>

                <button
                  onClick={() => setTestPreviewAd(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                Visitor View Mode • Session Dismissal: Active
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRMATION DELETION MODALS (NO WINDOW.CONFIRM) */}
      {/* ======================================================== */}
      <Modal
        isOpen={Boolean(deleteSliderId)}
        onClose={() => setDeleteSliderId(null)}
        title="Confirm Slider Deletion"
        description="Are you sure you want to delete this hero slider from the storefront? This action cannot be undone."
        maxWidth="sm"
      >
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            onClick={() => setDeleteSliderId(null)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDeleteSlider}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Confirm Delete
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(deleteBannerId)}
        onClose={() => setDeleteBannerId(null)}
        title="Confirm Banner Deletion"
        description="Are you sure you want to delete this promotional banner? It will be immediately removed from the customer homepage."
        maxWidth="sm"
      >
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            onClick={() => setDeleteBannerId(null)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDeleteBanner}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Confirm Delete
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(deleteAdId)}
        onClose={() => setDeleteAdId(null)}
        title="Confirm Advertisement Deletion"
        description="Are you sure you want to delete this visitor popup campaign? Visitors will no longer receive this popup."
        maxWidth="sm"
      >
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            onClick={() => setDeleteAdId(null)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDeleteAd}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Confirm Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};
