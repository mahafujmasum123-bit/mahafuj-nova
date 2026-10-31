import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { OrderDetailsModal } from './OrderDetailsModal';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

interface OrdersAdminPageProps {
  orders: any[];
  onRefresh: () => void;
}

export const OrdersAdminPage: React.FC<OrdersAdminPageProps> = ({ orders, onRefresh }) => {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState('all');
  const [activeOrderForModal, setActiveOrderForModal] = useState<any>(null);

  const statusTabs = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'pending', label: 'Pending', count: orders.filter((o) => o.status === 'pending').length },
    { id: 'confirmed', label: 'Confirmed', count: orders.filter((o) => o.status === 'confirmed').length },
    { id: 'processing', label: 'Processing', count: orders.filter((o) => o.status === 'processing').length },
    { id: 'packed', label: 'Packed', count: orders.filter((o) => o.status === 'packed').length },
    { id: 'shipped', label: 'Shipped', count: orders.filter((o) => o.status === 'shipped').length },
    { id: 'delivered', label: 'Delivered', count: orders.filter((o) => o.status === 'delivered').length },
    { id: 'cancelled', label: 'Cancelled', count: orders.filter((o) => o.status === 'cancelled').length },
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesTab = selectedStatusTab === 'all' || o.status === selectedStatusTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      (o.shippingAddress?.division && o.shippingAddress.division.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const handleUpdateOrderStatus = async (orderNumber: string, nextStatus: string, note?: string) => {
    try {
      const res = await fetch(`/api/orders/admin/${orderNumber}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: nextStatus,
          note: note || `Status transitioned to ${nextStatus} by ${user?.name || 'Admin Staff'}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update order status');
      }

      dispatch(
        addToast({
          type: 'success',
          title: 'Order Status Advanced',
          message: `Order #${orderNumber} is now marked as "${nextStatus.toUpperCase()}".`,
        })
      );

      // Refresh data
      onRefresh();
      // Update modal order if still active
      if (activeOrderForModal && activeOrderForModal.orderNumber === orderNumber) {
        setActiveOrderForModal(data.order || { ...activeOrderForModal, status: nextStatus });
      }
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
      throw err;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; border: string }> = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-200' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-200' },
      processing: { bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-200' },
      packed: { bg: 'bg-cyan-100', text: 'text-cyan-900', border: 'border-cyan-200' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-200' },
      delivered: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-200' },
      cancelled: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-200' },
      returned: { bg: 'bg-gray-100', text: 'text-gray-900', border: 'border-gray-300' },
    };

    const style = map[status] || map.pending;

    return (
      <span
        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Search and Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-4">
        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order #, customer name, email, or division..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-emerald-800 transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {statusTabs.map((tab) => {
            const isActive = selectedStatusTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatusTab(tab.id)}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/70'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-emerald-950/60 text-emerald-200' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Destination</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-3">Fulfillment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">No matching orders found</p>
                    <p className="text-[11px] text-gray-400">Try changing status filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/60 transition group">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-gray-900 group-hover:text-emerald-800 transition">
                        {ord.orderNumber}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(ord.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-gray-900">{ord.customerName}</div>
                      <div className="text-[11px] text-gray-500 truncate max-w-xs">{ord.customerEmail}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-gray-800">{ord.shippingAddress?.division || 'Dhaka'}</span>
                      <div className="text-[10px] text-gray-500 truncate max-w-[120px]">
                        {ord.shippingAddress?.district || ord.shippingAddress?.street || 'Local delivery'}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold uppercase text-[11px] text-gray-800">
                        {ord.paymentMethod}
                      </div>
                      <span
                        className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          ord.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-extrabold text-gray-900">
                      ${(ord.finalTotal || 0).toFixed(2)}
                      <div className="text-[10px] text-gray-400 font-normal">
                        {ord.items?.length || 1} items
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {getStatusBadge(ord.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveOrderForModal(ord)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Slideover */}
      {activeOrderForModal && (
        <OrderDetailsModal
          order={activeOrderForModal}
          isOpen={Boolean(activeOrderForModal)}
          onClose={() => setActiveOrderForModal(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}
    </div>
  );
};
