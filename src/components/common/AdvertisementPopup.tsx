import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Tag } from 'lucide-react';

interface AdvertisementData {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  destinationUrl: string;
  buttonText: string;
  priority: number;
  frequency: 'once_per_session' | 'always' | 'daily';
  isActive: boolean;
}

interface AdvertisementPopupProps {
  onNavigate: (view: string, params?: any) => void;
}

export const AdvertisementPopup: React.FC<AdvertisementPopupProps> = ({ onNavigate }) => {
  const [ad, setAd] = useState<AdvertisementData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  useEffect(() => {
    async function checkAndLoadAd() {
      try {
        // Check session dismissal
        const isDismissed = sessionStorage.getItem('shopmax_ad_dismissed');
        if (isDismissed === 'true') {
          return;
        }

        const res = await fetch('/api/cms/advertisements/active');
        const json = await res.json();

        if (json.success && json.data) {
          const activeAd: AdvertisementData = json.data;

          // If daily frequency, check localStorage timestamp
          if (activeAd.frequency === 'daily') {
            const lastDismissed = localStorage.getItem(`shopmax_ad_dismissed_${activeAd.id}`);
            if (lastDismissed) {
              const diffHours = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60);
              if (diffHours < 24) return;
            }
          }

          setAd(activeAd);

          // Delay appearance by 1.2s for pleasant UX
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 1200);

          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error('Failed to load active advertisement:', err);
      }
    }

    checkAndLoadAd();
  }, []);

  // Track impression once when opened
  useEffect(() => {
    if (isOpen && ad && !hasTrackedImpression) {
      setHasTrackedImpression(true);
      fetch(`/api/cms/advertisements/${ad.id}/impression`, { method: 'POST' }).catch(() => {});
    }
  }, [isOpen, ad, hasTrackedImpression]);

  if (!isOpen || !ad) return null;

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('shopmax_ad_dismissed', 'true');
    if (ad.frequency === 'daily') {
      localStorage.setItem(`shopmax_ad_dismissed_${ad.id}`, Date.now().toString());
    }
    fetch(`/api/cms/advertisements/${ad.id}/dismiss`, { method: 'POST' }).catch(() => {});
  };

  const handleActionClick = () => {
    fetch(`/api/cms/advertisements/${ad.id}/click`, { method: 'POST' }).catch(() => {});
    setIsOpen(false);
    sessionStorage.setItem('shopmax_ad_dismissed', 'true');

    if (ad.destinationUrl.startsWith('/')) {
      const path = ad.destinationUrl.split('?')[0].replace('/', '');
      onNavigate(path || 'shop');
    } else {
      window.location.href = ad.destinationUrl;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />

      {/* Popup Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ad-modal-title"
        className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 z-10 animate-in zoom-in-95 duration-200"
      >
        {/* Prominent Visible Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer shadow-md"
          aria-label="Close advertisement popup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Visual Banner */}
        <div className="relative aspect-[16/9] bg-emerald-950 overflow-hidden">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
              <Tag className="w-3 h-3" />
              <span>Special Offer</span>
            </span>
            <h3 id="ad-modal-title" className="text-lg font-extrabold text-white mt-1 leading-snug drop-shadow-md">
              {ad.title}
            </h3>
          </div>
        </div>

        {/* Description & Action */}
        <div className="p-5 space-y-4 text-center">
          {ad.description && (
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {ad.description}
            </p>
          )}

          <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              onClick={handleActionClick}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#00875a] hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer"
            >
              <span>{ad.buttonText || 'Claim Deal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition cursor-pointer"
            >
              No, Thanks
            </button>
          </div>

          <div className="text-[10px] text-gray-500 pt-1">
            Offer valid while stock lasts. Terms and conditions apply.
          </div>
        </div>
      </div>
    </div>
  );
};
