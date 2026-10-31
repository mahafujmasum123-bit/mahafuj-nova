import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import {
  Calendar,
  ChevronDown,
  ShoppingBag,
  ShoppingCart,
  Users,
  Package,
  Percent,
  TrendingUp,
  PieChart,
  ArrowRight,
  MoreVertical,
  Plus,
  Sparkles,
  Settings,
  Cloud,
  Server,
  Database,
  ExternalLink,
  Flame,
  Layout,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { OrderDetailsModal } from './OrderDetailsModal';

interface DashboardOverviewPageProps {
  data: any;
  onNavigateToModule: (module: string) => void;
  onSelectOrder?: (order: any) => void;
  onGoToStorefront?: () => void;
  onRefresh?: () => void;
}

export const DashboardOverviewPage: React.FC<DashboardOverviewPageProps> = ({
  data,
  onNavigateToModule,
  onGoToStorefront,
  onRefresh,
}) => {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [activeDateRange, setActiveDateRange] = useState('Mar 10, 2025 - Mar 16, 2025');
  const [hoveredSalesPoint, setHoveredSalesPoint] = useState<any | null>(null);

  const handleUpdateOrderStatus = async (orderNumber: string, nextStatus: string, note?: string) => {
    try {
      const cleanNum = orderNumber.replace(/^#/, '');
      const res = await fetch(`/api/orders/admin/${encodeURIComponent(cleanNum)}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: nextStatus,
          note: note || `Status transitioned to ${nextStatus} by ${user?.name || 'Admin'}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update order status');
      }

      dispatch(
        addToast({
          type: 'success',
          title: 'Order Updated',
          message: `Order #${cleanNum} status updated to "${nextStatus.toUpperCase()}"`,
        })
      );

      if (selectedOrder) {
        setSelectedOrder((prev: any) => (prev ? { ...prev, status: nextStatus } : null));
      }
      onRefresh?.();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
      throw err;
    }
  };

  // Dynamic values with graceful fallback to reference dataset
  const grossNum = data?.grossSales !== undefined ? Number(data.grossSales) : 12458.0;
  const totalOrd = data?.totalOrders !== undefined ? Number(data.totalOrders) : 248;
  const totalCust = data?.totalCustomers !== undefined ? Number(data.totalCustomers) : 1245;
  const totalProd = data?.totalProducts !== undefined ? Number(data.totalProducts) : 156;
  const totalCoup = data?.totalCoupons !== undefined ? Number(data.totalCoupons) : 18;

  const salesPoints = data?.salesOverview || [
    { day: 'Mar 10', sales: 1950, formatted: '$1,950' },
    { day: 'Mar 11', sales: 2840, formatted: '$2,840' },
    { day: 'Mar 12', sales: 3480, formatted: '$3,480' },
    { day: 'Mar 13', sales: 2980, formatted: '$2,980' },
    { day: 'Mar 14', sales: 5210, formatted: '$5,210' },
    { day: 'Mar 15', sales: 5120, formatted: '$5,120' },
    { day: 'Mar 16', sales: 7320, formatted: '$7,320' },
  ];

  const orderDistribution = data?.orderStatusDistribution || [
    { status: 'Completed', count: 142, percentage: '57.3%', color: '#00875a' },
    { status: 'Processing', count: 48, percentage: '19.4%', color: '#3b82f6' },
    { status: 'Pending', count: 32, percentage: '12.9%', color: '#f59e0b' },
    { status: 'Cancelled', count: 16, percentage: '6.5%', color: '#ef4444' },
    { status: 'Refunded', count: 10, percentage: '4.0%', color: '#94a3b8' },
  ];

  const topProducts = data?.topSellingProducts || [
    {
      id: 'prod-1',
      name: 'Wireless Headphones',
      sold: '1,245 sold',
      price: 59.99,
      growth: '+12%',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    },
    {
      id: 'prod-2',
      name: 'Smart Watch',
      sold: '982 sold',
      price: 68.99,
      growth: '+8%',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    },
    {
      id: 'prod-4',
      name: 'Running Shoes',
      sold: '756 sold',
      price: 69.99,
      growth: '+15%',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    },
    {
      id: 'prod-11',
      name: 'Laptop Pro 15"',
      sold: '689 sold',
      price: 1099.0,
      growth: '+10%',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    },
    {
      id: 'prod-3',
      name: 'Backpack',
      sold: '542 sold',
      price: 49.99,
      growth: '+6%',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    },
  ];

  const recentOrders = data?.recentOrders || [
    {
      id: 'ord-1256',
      orderNumber: '#ORD-1256',
      customerName: 'Rahim Khan',
      items: [
        {
          name: 'Wireless Headphones',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        },
      ],
      finalTotal: 59.99,
      status: 'completed',
      date: 'Mar 16, 2025',
    },
    {
      id: 'ord-1255',
      orderNumber: '#ORD-1255',
      customerName: 'Ayesha Akter',
      items: [
        {
          name: 'Smart Watch',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        },
      ],
      finalTotal: 68.99,
      status: 'processing',
      date: 'Mar 16, 2025',
    },
    {
      id: 'ord-1254',
      orderNumber: '#ORD-1254',
      customerName: 'Tanvir Hasan',
      items: [
        {
          name: 'Backpack',
          image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
        },
      ],
      finalTotal: 49.99,
      status: 'pending',
      date: 'Mar 15, 2025',
    },
    {
      id: 'ord-1253',
      orderNumber: '#ORD-1253',
      customerName: 'Shanta Islam',
      items: [
        {
          name: 'Running Shoes',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        },
      ],
      finalTotal: 69.99,
      status: 'completed',
      date: 'Mar 15, 2025',
    },
    {
      id: 'ord-1252',
      orderNumber: '#ORD-1252',
      customerName: 'Nusrat Jahan',
      items: [
        {
          name: 'Sunglasses',
          image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
        },
      ],
      finalTotal: 29.99,
      status: 'cancelled',
      date: 'Mar 14, 2025',
    },
  ];

  // SVG Chart Coordinate Math
  // Canvas width: 500, height: 220
  // X values from 40 to 470, Y values inverted from 8000 max (top=20, bottom=180)
  const chartWidth = 500;
  const chartHeight = 200;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 25;
  const maxSales = 8000;

  const points = salesPoints.map((pt: any, index: number) => {
    const x = paddingLeft + (index / (salesPoints.length - 1)) * (chartWidth - paddingLeft - paddingRight);
    const y = paddingTop + (1 - pt.sales / maxSales) * (chartHeight - paddingTop - paddingBottom);
    return { ...pt, x, y };
  });

  // Generate smooth spline SVG path
  const linePath = points.reduce((acc: string, pt: any, i: number, arr: any[]) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;

  // SVG Donut Chart Math
  const donutSize = 180;
  const donutRadius = 70;
  const donutStrokeWidth = 24;
  const circumference = 2 * Math.PI * donutRadius;
  let accumulatedPercent = 0;

  const donutSegments = orderDistribution.map((item: any) => {
    const percent = parseFloat(item.percentage) / 100;
    const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
    const strokeDashoffset = -circumference * accumulatedPercent;
    accumulatedPercent += percent;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'delivered') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6f4ea] text-[#00875a]">
          Completed
        </span>
      );
    }
    if (s === 'processing' || s === 'packed' || s === 'confirmed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e8f0fe] text-[#1a73e8]">
          Processing
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#fef7e0] text-[#b06000]">
          Pending
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#fce8e6] text-[#d93025]">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Header Section matching mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Welcome back, here's what's happening with your store today.
          </p>
        </div>

        {/* Date Range Selector Pill */}
        <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:bg-gray-50 text-xs font-semibold text-gray-700 transition cursor-pointer self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>{activeDateRange}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
        </button>
      </div>

      {/* 2. Top Row: 5 KPI Cards in single row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Sales */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#e6f4ea] text-[#00875a] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-[#00875a]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-gray-500 font-medium">Total Sales</span>
              <div className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                ${grossNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="font-bold text-[#00875a] flex items-center">
              &uarr; 12.5%
            </span>
            <span className="text-gray-400 font-normal">vs. last week</span>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 text-[#3b82f6]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-gray-500 font-medium">Total Orders</span>
              <div className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                {totalOrd}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="font-bold text-[#00875a] flex items-center">
              &uarr; 8.2%
            </span>
            <span className="text-gray-400 font-normal">vs. last week</span>
          </div>
        </div>

        {/* KPI 3: Total Customers */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#f3e8ff] text-[#9333ea] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-[#9333ea]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-gray-500 font-medium">Total Customers</span>
              <div className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                {totalCust.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="font-bold text-[#00875a] flex items-center">
              &uarr; 15.3%
            </span>
            <span className="text-gray-400 font-normal">vs. last week</span>
          </div>
        </div>

        {/* KPI 4: Total Products */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#fff7ed] text-[#ea580c] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-[#ea580c]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-gray-500 font-medium">Total Products</span>
              <div className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                {totalProd}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="font-bold text-[#00875a] flex items-center">
              &uarr; 6.7%
            </span>
            <span className="text-gray-400 font-normal">vs. last week</span>
          </div>
        </div>

        {/* KPI 5: Total Coupons */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#fef2f2] text-[#e11d48] flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5 text-[#e11d48]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-gray-500 font-medium">Total Coupons</span>
              <div className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                {totalCoup}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="font-bold text-[#00875a] flex items-center">
              &uarr; 10.0%
            </span>
            <span className="text-gray-400 font-normal">vs. last week</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Sales Overview (Spline) + Order Status (Donut) + Store Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sales Overview Area Chart (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#e6f4ea] text-[#00875a] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#00875a]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Sales Overview</h3>
                  <p className="text-xs text-gray-400">Total sales in the last 7 days</p>
                </div>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">
                <span>Last 7 Days</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            {/* SVG Spline Chart */}
            <div className="relative w-full h-56 pt-2 select-none">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00875a" stopOpacity="0.28" />
                    <stop offset="85%" stopColor="#00875a" stopOpacity="0.02" />
                    <stop offset="100%" stopColor="#00875a" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Y-axis grid lines & labels (8K, 6K, 4K, 2K, 0) */}
                {[8000, 6000, 4000, 2000, 0].map((val) => {
                  const y = paddingTop + (1 - val / maxSales) * (chartHeight - paddingTop - paddingBottom);
                  return (
                    <g key={val}>
                      <text x="5" y={y + 3} className="text-[10px] fill-gray-400 font-medium">
                        {val === 0 ? '0' : `${val / 1000}K`}
                      </text>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth - paddingRight}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}

                {/* Filled gradient area */}
                <path d={areaPath} fill="url(#salesGradient)" />

                {/* Spline curve line */}
                <path d={linePath} fill="none" stroke="#00875a" strokeWidth="2.5" strokeLinecap="round" />

                {/* Data point circles with hover interactions */}
                {points.map((pt: any, i: number) => (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#00875a"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:r-6"
                      onMouseEnter={() => setHoveredSalesPoint(pt)}
                      onMouseLeave={() => setHoveredSalesPoint(null)}
                    />
                  </g>
                ))}
              </svg>

              {/* Hover Tooltip */}
              {hoveredSalesPoint && (
                <div
                  className="absolute pointer-events-none bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-lg -translate-x-1/2 -translate-y-8"
                  style={{
                    left: `${(hoveredSalesPoint.x / chartWidth) * 100}%`,
                    top: `${(hoveredSalesPoint.y / chartHeight) * 100}%`,
                  }}
                >
                  {hoveredSalesPoint.day}: {hoveredSalesPoint.formatted}
                </div>
              )}
            </div>
          </div>

          {/* X-axis day labels below chart */}
          <div className="flex justify-between pl-8 pr-4 text-[11px] text-gray-400 font-medium pt-1">
            {salesPoints.map((pt: any) => (
              <span key={pt.day}>{pt.day}</span>
            ))}
          </div>
        </div>

        {/* Order Status Donut Breakdown (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#e6f4ea] text-[#00875a] flex items-center justify-center">
                <PieChart className="w-4 h-4 text-[#00875a]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Order Status</h3>
                <p className="text-xs text-gray-400">Order status distribution</p>
              </div>
            </div>

            {/* SVG Donut */}
            <div className="relative flex items-center justify-center my-3">
              <svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`}>
                <g transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`}>
                  {donutSegments.map((seg: any) => (
                    <circle
                      key={seg.status}
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={donutRadius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={donutStrokeWidth}
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  ))}
                </g>
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">
                  {totalOrd}
                </span>
                <span className="text-[11px] text-gray-400 font-medium mt-1">Total Orders</span>
              </div>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-1.5 pt-2">
            {orderDistribution.map((item: any) => (
              <div key={item.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-700 font-medium">{item.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">{item.count}</span>
                  <span className="text-gray-400 text-[11px] w-10 text-right">{item.percentage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Promo Banner Card (lg:col-span-3) */}
        <div className="lg:col-span-3 rounded-2xl bg-[#062319] p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-sm">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
              Manage Your Store Easily & Efficiently
            </h3>
            <p className="text-xs text-emerald-200/80 mt-2 font-normal leading-relaxed">
              Get complete control over your store with our powerful admin panel.
            </p>
            <div className="mt-4">
              <button
                onClick={onGoToStorefront}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00875a] hover:bg-[#00734c] text-white font-semibold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                <span>View Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Modern Electronics Device Mockup Cluster SVG matching reference image */}
          <div className="mt-4 pt-3 flex items-end justify-center select-none opacity-90">
            <svg viewBox="0 0 240 120" className="w-full max-h-28">
              {/* Laptop base & screen */}
              <rect x="50" y="20" width="140" height="85" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="2" />
              <rect x="56" y="26" width="128" height="73" rx="3" fill="#0284c7" />
              <path d="M 40 105 L 200 105 L 195 110 L 45 110 Z" fill="#475569" />
              {/* Tablet / Phone */}
              <rect x="160" y="35" width="45" height="70" rx="6" fill="#1e293b" stroke="#00875a" strokeWidth="1.5" />
              <rect x="164" y="40" width="37" height="60" rx="3" fill="#0369a1" />
              {/* Smartwatch */}
              <rect x="195" y="70" width="28" height="36" rx="6" fill="#090d16" stroke="#4ade80" strokeWidth="1" />
              <rect x="198" y="74" width="22" height="28" rx="3" fill="#10b981" />
              {/* Earbuds */}
              <circle cx="35" cy="85" r="14" fill="#022c22" stroke="#10b981" strokeWidth="1" />
              <circle cx="35" cy="85" r="6" fill="#4ade80" />
            </svg>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Recent Orders (50%) + Top Selling Products (25%) + Quick Actions (25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Orders Table (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#e6f4ea] text-[#00875a] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#00875a]" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Recent Orders</h3>
            </div>
            <button
              onClick={() => onNavigateToModule('orders')}
              className="text-xs font-semibold text-[#00875a] hover:text-[#00734c] flex items-center gap-1 transition cursor-pointer"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Orders Table matching mockup with fixed column proportions */}
          <div className="w-full">
            <table className="table-fixed w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase">
                  <th className="pb-3 pr-1 w-[15%] font-semibold">#</th>
                  <th className="pb-3 px-1 w-[17%] font-semibold">Customer</th>
                  <th className="pb-3 px-1 w-[26%] font-semibold">Product</th>
                  <th className="pb-3 px-1 w-[12%] font-semibold">Amount</th>
                  <th className="pb-3 px-1 w-[14%] font-semibold text-center">Status</th>
                  <th className="pb-3 px-1 w-[12%] font-semibold">Date</th>
                  <th className="pb-3 pl-1 w-[4%] font-semibold text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((ord: any) => {
                  const firstItem = ord.items?.[0] || {};
                  return (
                    <tr key={ord.id || ord.orderNumber} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 pr-1 font-semibold text-gray-900 truncate text-[11px]">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-1 text-gray-700 font-medium truncate text-[11px]">
                        {ord.customerName}
                      </td>
                      <td className="py-3 px-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {firstItem.image && (
                            <img
                              src={firstItem.image}
                              alt={firstItem.name || 'Product'}
                              className="w-6 h-6 rounded-md object-cover border border-gray-100 shrink-0 shadow-2xs"
                            />
                          )}
                          <span className="truncate text-gray-800 font-medium text-[11px]">
                            {firstItem.name || 'Item'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-1 font-semibold text-gray-900 whitespace-nowrap text-[11px]">
                        ${Number(ord.finalTotal || ord.subtotal || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-1 text-center whitespace-nowrap">
                        {getStatusBadge(ord.status)}
                      </td>
                      <td className="py-3 px-1 text-gray-400 whitespace-nowrap text-[10px]">
                        {ord.date || (ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Mar 16, 2025')}
                      </td>
                      <td className="py-3 pl-1 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2 py-0.5 text-[10px] font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-md shadow-2xs transition cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#e6f4ea] text-[#00875a] flex items-center justify-center">
                  <Flame className="w-4 h-4 text-[#00875a]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Top Selling Products</h3>
              </div>
              <button
                onClick={() => onNavigateToModule('products')}
                className="text-xs font-semibold text-[#00875a] hover:text-[#00734c] flex items-center gap-1 transition cursor-pointer"
              >
                <span>View All Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-gray-50 space-y-2">
              {topProducts.map((prod: any) => (
                <div key={prod.id || prod.name} className="pt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{prod.name}</div>
                      <div className="text-[11px] text-gray-400">{prod.sold}</div>
                      <div className="text-xs font-semibold text-gray-800">
                        ${Number(prod.price).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-xs font-bold text-[#00875a] flex items-center">
                      &uarr; {prod.growth?.replace('+', '') || '10%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>

            <div className="space-y-2.5">
              {/* Action 1: Add New Product */}
              <button
                onClick={() => onNavigateToModule('products')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#00875a] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-emerald-900">
                  Add New Product
                </span>
              </button>

              {/* Action 2: Manage Orders */}
              <button
                onClick={() => onNavigateToModule('orders')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 transition text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0d9488] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-teal-900">
                  Manage Orders
                </span>
              </button>

              {/* Action 3: Add New Coupon */}
              <button
                onClick={() => onNavigateToModule('coupons')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-rose-200 hover:bg-rose-50/30 transition text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#e11d48] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                  <Percent className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-rose-900">
                  Add New Coupon
                </span>
              </button>

              {/* Action 4: Update Homepage */}
              <button
                onClick={() => onNavigateToModule('cms')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#3b82f6] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                  <Layout className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-blue-900">
                  Update Homepage
                </span>
              </button>

              {/* Action 5: View Customers */}
              <button
                onClick={() => onNavigateToModule('customers')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#6366f1] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-indigo-900">
                  View Customers
                </span>
              </button>

              {/* Action 6: System Settings */}
              <button
                onClick={() => onNavigateToModule('settings')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-slate-300 hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1e293b] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-slate-900">
                  System Settings
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Floating Bottom Status Bar matching mockup */}
      <div className="bg-[#f2fbf7] border border-[#d1fae5] rounded-2xl p-4 sm:px-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 w-full md:w-auto text-xs">
          {/* Store Status */}
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
            <div>
              <div className="text-[10px] text-gray-400 font-medium">Store Status</div>
              <div className="font-bold text-[#00875a]">Online</div>
            </div>
          </div>

          {/* Last Backup */}
          <div className="flex items-center gap-2.5">
            <Cloud className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] text-gray-400 font-medium">Last Backup</div>
              <div className="font-semibold text-gray-800">Mar 16, 2025 10:24 AM</div>
            </div>
          </div>

          {/* Server Load */}
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] text-gray-400 font-medium">Server Load</div>
              <div className="font-semibold text-gray-800">Normal (12%)</div>
            </div>
          </div>

          {/* Database */}
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] text-gray-400 font-medium">Database</div>
              <div className="font-semibold text-gray-800">Connected</div>
            </div>
          </div>
        </div>

        {/* Go to Store Button */}
        <button
          onClick={onGoToStorefront}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#051b14] hover:bg-[#0c3628] text-white text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer shrink-0"
        >
          <span>Go to Store</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 6. Dashboard Footer matching mockup */}
      <footer className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
        <div>&copy; 2025 ShopMax. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <span className="hover:text-gray-600 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-gray-600 cursor-pointer">Terms of Service</span>
          <span className="hover:text-gray-600 cursor-pointer">Support</span>
          <div className="flex items-center gap-3 text-gray-400 ml-2">
            {/* Social icons */}
            <span className="hover:text-gray-700 cursor-pointer font-bold">f</span>
            <span className="hover:text-gray-700 cursor-pointer font-bold">📷</span>
            <span className="hover:text-gray-700 cursor-pointer font-bold">▶</span>
            <span className="hover:text-gray-700 cursor-pointer font-bold">&#120143;</span>
            <span className="hover:text-gray-700 cursor-pointer font-bold">P</span>
          </div>
        </div>
      </footer>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}
    </div>
  );
};
