import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setCredentials } from '../../features/auth/authSlice';
import { addToast } from '../../features/toast/toastSlice';
import { ToastContainer } from '../../components/feedback/ToastContainer';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { AdminMobileDrawer } from './AdminMobileDrawer';

import { DashboardOverviewPage } from '../pages/DashboardOverviewPage';
import { ProductsAdminPage } from '../pages/ProductsAdminPage';
import { OrdersAdminPage } from '../pages/OrdersAdminPage';
import { CategoriesAdminPage } from '../pages/CategoriesAdminPage';
import { InventoryAdminPage } from '../pages/InventoryAdminPage';
import { CustomersAdminPage } from '../pages/CustomersAdminPage';
import { ReviewsAdminPage } from '../pages/ReviewsAdminPage';
import { CouponsAdminPage } from '../pages/CouponsAdminPage';
import { CmsAdminPage } from '../pages/CmsAdminPage';
import { HomepageBuilderAdminPage } from '../pages/HomepageBuilderAdminPage';
import { AnalyticsAdminPage } from '../pages/AnalyticsAdminPage';
import { SystemSettingsPage } from '../pages/SystemSettingsPage';
import { MessagesAdminPage } from '../pages/MessagesAdminPage';

import { ShieldCheck, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface AdminLayoutProps {
  initialModule?: string;
  onGoToStorefront: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  initialModule = 'dashboard',
  onGoToStorefront,
}) => {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);

  const [currentModule, setCurrentModule] = useState<string>(initialModule);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Centralized Admin Data State
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [cmsData, setCmsData] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAdminRole =
    user &&
    ['super_admin', 'admin', 'order_manager', 'catalog_manager', 'inventory_manager'].includes(
      user.role
    );

  useEffect(() => {
    if (isAdminRole) {
      loadAllAdminData();
    }
  }, [token, isAdminRole]);

  const loadAllAdminData = async () => {
    setIsRefreshing(true);
    try {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [dashRes, prodRes, ordRes, catRes, revRes, cmsRes, sysRes, msgRes] = await Promise.all([
        fetch('/api/admin/dashboard', { headers }),
        fetch('/api/products?limit=100'),
        fetch('/api/orders/admin/list', { headers }),
        fetch('/api/categories'),
        fetch('/api/reviews/admin/list', { headers }),
        fetch('/api/cms/homepage'),
        fetch('/api/admin/system-status'),
        fetch('/api/admin/messages/stats', { headers }),
      ]);

      const [dash, prod, ord, cat, rev, cms, sys, msg] = await Promise.all([
        dashRes.json(),
        prodRes.json(),
        ordRes.json(),
        catRes.json(),
        revRes.json(),
        cmsRes.json(),
        sysRes.json(),
        msgRes.json(),
      ]);

      if (dash.success) setDashboardData(dash.data);
      if (prod.success) setProducts(prod.data);
      if (ord.success) setOrders(ord.data);
      if (cat.success) setCategories(cat.data);
      if (rev.success) setReviews(rev.data);
      if (cms.success) setCmsData(cms.data);
      if (sys.success) setSystemStatus(sys.system);
      if (msg.success && msg.data) setUnreadMessagesCount(msg.data.unread || 0);
    } catch (err) {
      console.error('Failed to load operations data', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignInAsAdmin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@novara.com', password: 'Admin@123' }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch(
          setCredentials({
            user: data.user,
            token: data.token,
          })
        );
        dispatch(
          addToast({
            type: 'success',
            title: 'Admin Access Granted',
            message: `Welcome, ${data.user.name} (${data.user.role.toUpperCase()})`,
          })
        );
      }
    } catch (e) {
      console.error(e);
      dispatch(addToast({ type: 'error', message: 'Failed to authenticate admin demo credentials' }));
    }
  };

  // If unauthorized, render isolated Admin Access Gate
  if (!isAdminRole) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-emerald-500 selection:text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
              Novara Commerce Ops
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Administrative Control Gate
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Managing catalog SKUs, fulfilling orders across lifecycle state machines, and auditing warehouse inventory requires staff authorization.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={handleSignInAsAdmin}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Sign In as Super Admin (1-Click)</span>
            </button>

            <button
              onClick={onGoToStorefront}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
            >
              Return to Customer Storefront
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            Default credentials: <span className="font-mono text-slate-300">admin@novara.com</span> /{' '}
            <span className="font-mono text-slate-300">Admin@123</span>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).length;

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      {/* 1. Desktop Collapsible Sidebar */}
      <AdminSidebar
        currentModule={currentModule}
        onSelectModule={(mod) => setCurrentModule(mod)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onGoToStorefront={onGoToStorefront}
        pendingOrdersCount={pendingOrdersCount}
        lowStockCount={lowStockCount}
        productsCount={products.length}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* 2. Mobile Responsive Off-Canvas Drawer */}
      <AdminMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentModule={currentModule}
        onSelectModule={(mod) => setCurrentModule(mod)}
        onGoToStorefront={onGoToStorefront}
        pendingOrdersCount={pendingOrdersCount}
        lowStockCount={lowStockCount}
        productsCount={products.length}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* 3. Main Operational Content Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <AdminTopbar
          onToggleMobileMenu={() => setIsMobileDrawerOpen(true)}
          currentModule={currentModule}
          onGoToStorefront={onGoToStorefront}
          onQuickAddProduct={() => setCurrentModule('products')}
          systemStatus={systemStatus}
          onRefreshData={loadAllAdminData}
          isRefreshing={isRefreshing}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 max-w-[1600px] w-full mx-auto">
          {currentModule === 'dashboard' && (
            <DashboardOverviewPage
              data={dashboardData}
              onNavigateToModule={(mod) => setCurrentModule(mod)}
              onGoToStorefront={onGoToStorefront}
              onRefresh={loadAllAdminData}
            />
          )}

          {currentModule === 'products' && (
            <ProductsAdminPage
              products={products}
              categories={categories}
              onRefresh={loadAllAdminData}
            />
          )}

          {currentModule === 'orders' && (
            <OrdersAdminPage
              orders={orders}
              onRefresh={loadAllAdminData}
            />
          )}

          {currentModule === 'messages' && (
            <MessagesAdminPage onRefreshParent={loadAllAdminData} />
          )}

          {currentModule === 'categories' && (
            <CategoriesAdminPage
              categories={categories}
              products={products}
              onRefresh={loadAllAdminData}
            />
          )}

          {currentModule === 'inventory' && (
            <InventoryAdminPage
              products={products}
              onRefresh={loadAllAdminData}
            />
          )}

          {currentModule === 'customers' && (
            <CustomersAdminPage onRefresh={loadAllAdminData} />
          )}

          {currentModule === 'reviews' && (
            <ReviewsAdminPage
              reviews={reviews}
              products={products}
              onRefresh={loadAllAdminData}
            />
          )}

          {currentModule === 'coupons' && <CouponsAdminPage />}

          {(currentModule === 'cms-home' || currentModule === 'homepage-builder') && (
            <HomepageBuilderAdminPage
              onRefresh={loadAllAdminData}
              onGoToStorefront={onGoToStorefront}
            />
          )}

          {(currentModule === 'cms' || (currentModule.startsWith('cms-') && currentModule !== 'cms-home')) && (
            <CmsAdminPage
              cmsData={cmsData}
              activeModule={currentModule}
              onRefresh={loadAllAdminData}
            />
          )}

          {currentModule === 'analytics' && <AnalyticsAdminPage />}

          {(currentModule === 'settings' || currentModule.startsWith('settings-')) && (
            <SystemSettingsPage
              systemStatus={systemStatus}
              onRefresh={loadAllAdminData}
            />
          )}

          {(currentModule === 'activity-logs' || currentModule === 'admin-logs') && (
            <AnalyticsAdminPage />
          )}
        </main>
      </div>

      {/* Isolated Admin Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
