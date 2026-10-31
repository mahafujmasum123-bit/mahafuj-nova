import React from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { addToast } from '../../features/toast/toastSlice';
import {
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
  Headphones,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sprout,
  LogOut,
} from 'lucide-react';

export interface AdminNavSection {
  title?: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[];
}

interface AdminSidebarProps {
  currentModule: string;
  onSelectModule: (moduleId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onGoToStorefront: () => void;
  pendingOrdersCount?: number;
  lowStockCount?: number;
  productsCount?: number;
  unreadMessagesCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
  onGoToStorefront,
  pendingOrdersCount = 0,
  lowStockCount = 0,
  productsCount = 0,
  unreadMessagesCount = 0,
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const navSections: AdminNavSection[] = [
    {
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'products',
          label: 'Products',
          icon: Package,
          badge: productsCount > 0 ? productsCount : undefined,
          badgeColor: 'bg-[#005e3e] text-[#4ade80]',
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: LayoutGrid,
        },
        {
          id: 'orders',
          label: 'Orders',
          icon: ShoppingCart,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
          badgeColor: 'bg-[#005e3e] text-[#4ade80]',
        },
        {
          id: 'messages',
          label: 'Messages',
          icon: Mail,
          badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        },
        {
          id: 'customers',
          label: 'Customers',
          icon: Users,
        },
        {
          id: 'coupons',
          label: 'Coupons',
          icon: Percent,
        },
        {
          id: 'reviews',
          label: 'Reviews',
          icon: Star,
        },
      ],
    },
    {
      title: 'PAGES & CONTENT',
      items: [
        {
          id: 'cms-home',
          label: 'Homepage Builder',
          icon: LayoutTemplate,
          badge: 'Dynamic',
          badgeColor: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
        },
        {
          id: 'cms-banners',
          label: 'Banners & Sliders',
          icon: Sliders,
        },
        {
          id: 'cms-ads',
          label: 'Advertisements',
          icon: Megaphone,
        },
        {
          id: 'cms-blog',
          label: 'Blog Management',
          icon: BookOpen,
        },
        {
          id: 'cms-pages',
          label: 'Pages',
          icon: FileText,
        },
        {
          id: 'cms-menu',
          label: 'Menu Management',
          icon: Menu,
        },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        {
          id: 'settings-general',
          label: 'General Settings',
          icon: Settings,
        },
        {
          id: 'settings-payment',
          label: 'Payment Settings',
          icon: CreditCard,
        },
        {
          id: 'settings-shipping',
          label: 'Shipping Settings',
          icon: Truck,
        },
        {
          id: 'settings-email',
          label: 'Email Settings',
          icon: Mail,
        },
      ],
    },
    {
      title: 'AUDIT & LOGS',
      items: [
        {
          id: 'activity-logs',
          label: 'Activity Logs',
          icon: Clock,
        },
        {
          id: 'admin-logs',
          label: 'Admin Logs',
          icon: Shield,
        },
      ],
    },
  ];

  const handleSupportClick = () => {
    dispatch(
      addToast({
        type: 'info',
        title: 'Support Desk',
        message: 'Support channel is active. Direct hotline: support@shopmax.com',
      })
    );
  };

  return (
    <aside
      className={`hidden lg:flex flex-col bg-[#051b14] text-gray-200 border-r border-[#0d2e23] transition-all duration-300 ease-in-out shrink-0 select-none z-30 ${
        isCollapsed ? 'w-20' : 'w-60 xl:w-64'
      }`}
      aria-label="ShopMax Admin Sidebar Navigation"
    >
      {/* Brand Header matching mockup */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-[#0d2e23]">
        <div
          onClick={() => onSelectModule('dashboard')}
          className="flex items-center gap-3 cursor-pointer overflow-hidden group"
          title="ShopMax Admin Dashboard"
        >
          {/* Logo badge with rounded squircle */}
          <div className="w-10 h-10 rounded-2xl bg-[#00875a] text-white flex items-center justify-center shadow-md shadow-emerald-950/50 shrink-0 group-hover:scale-105 transition">
            <Sprout className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 transition-opacity duration-200">
              <div className="font-extrabold text-xl tracking-tight text-white leading-none">
                ShopMax
              </div>
              <p className="text-[11px] text-emerald-300 font-medium tracking-tight mt-1 truncate">
                Better Products, Better Life
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-emerald-400/80 hover:text-white hover:bg-[#0c3628] transition cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Links scrollable */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-emerald-900/60">
        {navSections.map((section, idx) => (
          <div key={section.title || `sec-${idx}`} className="space-y-1">
            {section.title && !isCollapsed && (
              <h3 className="px-3 text-[11px] font-bold tracking-wider text-emerald-400/70 uppercase">
                {section.title}
              </h3>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                // Match base id or sub-id
                const isSelected =
                  currentModule === item.id ||
                  (item.id.startsWith('cms') && currentModule === 'cms') ||
                  (item.id.startsWith('settings') && currentModule === 'settings') ||
                  (item.id === 'activity-logs' && currentModule === 'activity-logs') ||
                  (item.id === 'admin-logs' && currentModule === 'admin-logs');

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectModule(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 cursor-pointer group relative ${
                      isSelected
                        ? 'bg-[#00875a] text-white shadow-md shadow-emerald-950/40 font-semibold'
                        : 'text-gray-300/90 hover:bg-[#0c3628] hover:text-white'
                    } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isSelected ? 'text-white' : 'text-gray-400 group-hover:text-emerald-300'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          item.badgeColor || 'bg-[#005e3e] text-[#4ade80]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isCollapsed && isSelected && (
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-400 rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Need Help? Card matching reference mockup */}
        {!isCollapsed && (
          <div className="pt-2">
            <div className="p-4 rounded-2xl bg-[#092b20] border border-[#144737] shadow-lg shadow-black/20 text-center relative overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-[#051b14] border border-[#144737] text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
                <Headphones className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-xs font-bold text-white tracking-tight">Need Help?</h4>
              <p className="text-[11px] text-gray-300/80 mt-0.5 mb-3 leading-tight">
                Contact support for assistance.
              </p>
              <button
                onClick={handleSupportClick}
                className="w-full py-2 px-3 bg-[#00875a] hover:bg-[#00734c] text-white font-semibold text-xs rounded-xl transition shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                Get Support
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer Copyright */}
      <div className="p-4 border-t border-[#0d2e23] bg-[#03130e] text-center">
        {!isCollapsed ? (
          <div className="text-[11px] text-gray-400/80 font-normal">
            &copy; 2025 <span className="font-semibold text-gray-300">ShopMax</span>. All rights reserved.
          </div>
        ) : (
          <button
            onClick={onGoToStorefront}
            className="p-2 text-emerald-400 hover:text-white hover:bg-[#0c3628] rounded-lg transition"
            title="Storefront"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
