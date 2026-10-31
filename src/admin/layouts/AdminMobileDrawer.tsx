import React from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { addToast } from '../../features/toast/toastSlice';
import {
  X,
  LayoutDashboard,
  Package,
  LayoutGrid,
  ShoppingCart,
  Users,
  Percent,
  Star,
  LayoutTemplate,
  Sliders,
  Megaphone,
  BookOpen,
  FileText,
  Menu,
  Settings,
  CreditCard,
  Truck,
  Mail,
  Clock,
  Shield,
  Sprout,
  ExternalLink,
  LogOut,
} from 'lucide-react';

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentModule: string;
  onSelectModule: (moduleId: string) => void;
  onGoToStorefront: () => void;
  pendingOrdersCount?: number;
  lowStockCount?: number;
  productsCount?: number;
  unreadMessagesCount?: number;
}

export const AdminMobileDrawer: React.FC<AdminMobileDrawerProps> = ({
  isOpen,
  onClose,
  currentModule,
  onSelectModule,
  onGoToStorefront,
  pendingOrdersCount = 0,
  lowStockCount = 0,
  productsCount = 0,
  unreadMessagesCount = 0,
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  if (!isOpen) return null;

  const handleSelect = (moduleId: string) => {
    onSelectModule(moduleId);
    onClose();
  };

  const handleSignOut = () => {
    dispatch(logout());
    onClose();
    dispatch(addToast({ type: 'info', title: 'Signed Out', message: 'Admin session closed.' }));
  };

  const navSections = [
    {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'products', label: 'Products', icon: Package, badge: productsCount > 0 ? productsCount : undefined },
        { id: 'categories', label: 'Categories', icon: LayoutGrid },
        { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
        { id: 'messages', label: 'Messages', icon: Mail, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'coupons', label: 'Coupons', icon: Percent },
        { id: 'reviews', label: 'Reviews', icon: Star },
      ],
    },
    {
      title: 'PAGES & CONTENT',
      items: [
        { id: 'cms-home', label: 'Home Page Management', icon: LayoutTemplate },
        { id: 'cms-banners', label: 'Banners & Sliders', icon: Sliders },
        { id: 'cms-ads', label: 'Advertisements', icon: Megaphone },
        { id: 'cms-blog', label: 'Blog Management', icon: BookOpen },
        { id: 'cms-pages', label: 'Pages', icon: FileText },
        { id: 'cms-menu', label: 'Menu Management', icon: Menu },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        { id: 'settings-general', label: 'General Settings', icon: Settings },
        { id: 'settings-payment', label: 'Payment Settings', icon: CreditCard },
        { id: 'settings-shipping', label: 'Shipping Settings', icon: Truck },
        { id: 'settings-email', label: 'Email Settings', icon: Mail },
      ],
    },
    {
      title: 'AUDIT & LOGS',
      items: [
        { id: 'activity-logs', label: 'Activity Logs', icon: Clock },
        { id: 'admin-logs', label: 'Admin Logs', icon: Shield },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] bg-[#051b14] text-white flex flex-col h-full shadow-2xl z-10 border-r border-[#0d2e23]">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#0d2e23]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00875a] text-white flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight text-white leading-none">ShopMax</div>
              <div className="text-[10px] text-emerald-300 font-medium mt-0.5">Better Products, Better Life</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-[#0c3628] transition cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {navSections.map((sec, idx) => (
            <div key={sec.title || `sec-${idx}`} className="space-y-1">
              {sec.title && (
                <div className="px-3 text-[10px] font-bold tracking-wider text-emerald-400/70 uppercase">
                  {sec.title}
                </div>
              )}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isSelected =
                    currentModule === item.id ||
                    (item.id.startsWith('cms') && currentModule === 'cms') ||
                    (item.id.startsWith('settings') && currentModule === 'settings') ||
                    (item.id === 'activity-logs' && currentModule === 'activity-logs') ||
                    (item.id === 'admin-logs' && currentModule === 'admin-logs');

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#00875a] text-white font-semibold'
                          : 'text-gray-300 hover:bg-[#0c3628] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {'badge' in item && (item as any).badge !== undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#005e3e] text-[#4ade80]">
                          {(item as any).badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Drawer Footer */}
        <div className="p-4 border-t border-[#0d2e23] bg-[#03130e] space-y-2">
          <button
            onClick={() => {
              onClose();
              onGoToStorefront();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#00875a] hover:bg-[#00734c] text-white font-semibold text-xs transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Go to Live Storefront</span>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#0c3628] hover:bg-rose-950/60 text-gray-300 hover:text-rose-300 font-semibold text-xs transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out ({user?.name || 'Admin'})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
