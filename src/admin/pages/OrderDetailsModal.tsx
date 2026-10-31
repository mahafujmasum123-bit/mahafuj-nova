import React, { useState } from 'react';
import { Modal } from '../../components/modal/Modal';
import {
  ShoppingBag,
  User,
  MapPin,
  CreditCard,
  Clock,
  ArrowRight,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderNumber: string, nextStatus: string, note?: string) => Promise<void>;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  const [selectedNextStatus, setSelectedNextStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!order) return null;

  // Lifecycle transitions map
  const VALID_TRANSITIONS: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['packed', 'cancelled'],
    packed: ['shipped', 'cancelled'],
    shipped: ['delivered', 'returned'],
    delivered: ['returned'],
    cancelled: [],
    returned: [],
  };

  const allowedTransitions = VALID_TRANSITIONS[order.status] || [];

  const handleExecuteStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNextStatus) return;

    setIsUpdating(true);
    try {
      await onUpdateStatus(order.orderNumber, selectedNextStatus, statusNote.trim() || undefined);
      setSelectedNextStatus('');
      setStatusNote('');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order ${order.orderNumber?.startsWith('#') ? order.orderNumber : '#' + (order.orderNumber || '')} Management`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Top summary card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-gray-900 font-mono">
                {order.orderNumber}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                {order.status}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Placed {new Date(order.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-extrabold text-gray-900">
              ${(order.finalTotal || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-gray-500 uppercase font-semibold">
              Payment: {order.paymentMethod?.toUpperCase()} ({order.paymentStatus})
            </div>
          </div>
        </div>

        {/* 2 columns: Customer Info & Shipping Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 mb-2">
              <User className="w-4 h-4 text-emerald-700" />
              <span>Customer Credentials</span>
            </div>
            <div className="text-xs space-y-1 text-gray-600">
              <div className="font-semibold text-gray-900">{order.customerName}</div>
              <div>{order.customerEmail}</div>
              <div className="font-mono text-gray-700">{order.customerPhone || 'Phone on file'}</div>
            </div>
          </div>

          {/* Delivery destination */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 mb-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Shipping Destination</span>
            </div>
            <div className="text-xs space-y-1 text-gray-600">
              <div className="font-semibold text-gray-900">{order.shippingAddress?.name || order.customerName}</div>
              <div>{order.shippingAddress?.street}</div>
              <div>
                {order.shippingAddress?.upazila ? `${order.shippingAddress.upazila}, ` : ''}
                {order.shippingAddress?.district ? `${order.shippingAddress.district}, ` : ''}
                {order.shippingAddress?.division || 'Dhaka'}
              </div>
              {order.shippingAddress?.landmark && (
                <div className="text-[11px] text-gray-400">Landmark: {order.shippingAddress.landmark}</div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items breakdown */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-xs font-bold text-gray-700 flex items-center justify-between">
            <span>Ordered Items ({order.items?.length || 0})</span>
            <span>Total Units: {order.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0)}</span>
          </div>

          <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-gray-50 shrink-0"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{item.name}</div>
                    <div className="text-[11px] text-gray-500 font-mono">
                      SKU: {item.sku || 'N/A'} • Qty: {item.quantity}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    ${((item.price || item.effectivePrice || 0) * (item.quantity || 1)).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    ${(item.price || item.effectivePrice || 0).toFixed(2)} each
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="bg-gray-50/50 p-4 border-t border-gray-200 space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-gray-900">${(order.subtotal || 0).toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                <span className="font-semibold">-${(order.discount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping Fee:</span>
              <span className="font-semibold text-gray-900">${(order.shippingFee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 font-extrabold text-sm text-gray-900">
              <span>Final Total:</span>
              <span>${(order.finalTotal || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Status Transition Control (Lifecycle State Machine) */}
        {allowedTransitions.length > 0 ? (
          <form onSubmit={handleExecuteStatusUpdate} className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Fulfillment Lifecycle Transition</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Next Allowed Stage *
                </label>
                <select
                  required
                  value={selectedNextStatus}
                  onChange={(e) => setSelectedNextStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-emerald-800 cursor-pointer"
                >
                  <option value="">Select transition stage...</option>
                  {allowedTransitions.map((st) => (
                    <option key={st} value={st}>
                      Transition to: {st.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Staff Transition Note
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched with RedX courier tracking #8812"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:outline-emerald-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!selectedNextStatus || isUpdating}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isUpdating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Advance Order State</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Order is in a final state ({order.status}). No additional lifecycle transitions permitted.</span>
          </div>
        )}

        {/* Audit Timeline */}
        {order.statusTimeline && order.statusTimeline.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Audit Timeline
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {order.statusTimeline.map((tl: any, i: number) => (
                <div key={i} className="flex items-start gap-2.5 text-xs p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 uppercase text-[10px]">{tl.status}</span>
                      <span className="text-[10px] text-gray-400">
                        {tl.timestamp ? new Date(tl.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    {tl.note && <div className="text-[11px] text-gray-600 mt-0.5">{tl.note}</div>}
                    <div className="text-[10px] text-gray-400">Actor: {tl.actor || 'System'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
