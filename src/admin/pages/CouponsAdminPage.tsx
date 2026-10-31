import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { Modal } from '../../components/modal/Modal';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Calendar,
  Percent,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export const CouponsAdminPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('15');
  const [minOrderValue, setMinOrderValue] = useState('50');
  const [maxDiscount, setMaxDiscount] = useState('30');
  const [expiresAt, setExpiresAt] = useState('2026-12-31');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, [token]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data);
      }
    } catch (err) {
      console.error('Failed to load coupons', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      dispatch(addToast({ type: 'warning', message: 'Coupon code and discount amount are required' }));
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
        expiresAt: new Date(expiresAt).toISOString(),
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create coupon');

      dispatch(
        addToast({
          type: 'success',
          title: 'Coupon Created',
          message: `Code ${code.toUpperCase()} is active for customer checkout.`,
        })
      );

      setIsModalOpen(false);
      setCode('');
      fetchCoupons();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (couponCode: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${couponCode}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        dispatch(
          addToast({
            type: 'info',
            title: 'Coupon Toggled',
            message: `${couponCode} is now ${data.data.isActive ? 'Active' : 'Deactivated'}.`,
          })
        );
        fetchCoupons();
      }
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to toggle coupon' }));
    }
  };

  const [deleteCouponTarget, setDeleteCouponTarget] = useState<string | null>(null);

  const handleDelete = (couponCode: string) => {
    setDeleteCouponTarget(couponCode);
  };

  const confirmDeleteCoupon = async () => {
    if (!deleteCouponTarget) return;

    try {
      const res = await fetch(`/api/admin/coupons/${deleteCouponTarget}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        dispatch(addToast({ type: 'success', title: 'Deleted', message: `${deleteCouponTarget} removed.` }));
        fetchCoupons();
      }
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to delete coupon' }));
    } finally {
      setDeleteCouponTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Discount Codes & Promotions</h2>
          <p className="text-xs text-gray-500">
            Define checkout discount coupons, minimum basket thresholds, and maximum dollar savings.
          </p>
        </div>

        <button
          onClick={() => {
            setCode(`NOV${Math.floor(10 + Math.random() * 90)}`);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ml-auto sm:ml-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon Code</span>
        </button>
      </div>

      {/* Coupons Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-8 text-center text-xs text-gray-500">
            Loading coupon codes...
          </div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
            <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">No active coupon codes</p>
          </div>
        ) : (
          coupons.map((c) => (
            <div
              key={c.id || c.code}
              className={`bg-white rounded-2xl p-5 border transition shadow-2xs flex flex-col justify-between ${
                c.isActive ? 'border-gray-200/90' : 'border-gray-200 opacity-60 bg-gray-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                      {c.discountType === 'percentage' ? (
                        <Percent className="w-4 h-4" />
                      ) : (
                        <DollarSign className="w-4 h-4" />
                      )}
                    </div>
                    <span className="font-mono text-base font-extrabold text-gray-900 tracking-wider">
                      {c.code}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span>Discount Rate:</span>
                    <span className="font-extrabold text-emerald-800">
                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `$${c.discountValue} OFF`}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span>Minimum Basket:</span>
                    <span className="font-semibold text-gray-900">${c.minOrderValue || 0}</span>
                  </div>
                  {c.maxDiscount && (
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span>Max Cap:</span>
                      <span className="font-semibold text-gray-900">${c.maxDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 text-[11px] text-gray-400">
                    <span>Valid Until:</span>
                    <span>{new Date(c.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => handleToggle(c.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    c.isActive
                      ? 'border-gray-200 hover:bg-gray-100 text-gray-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {c.isActive ? 'Disable' : 'Enable'}
                </button>

                <button
                  onClick={() => handleDelete(c.code)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Delete coupon"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Promotional Discount Code"
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Coupon Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER20 or NOVARA50"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono uppercase font-bold tracking-wider focus:ring-1 focus:ring-emerald-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white cursor-pointer"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Value {discountType === 'percentage' ? '(%)' : '($)'} *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Min Order Value ($)</label>
              <input
                type="number"
                min="0"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Max Discount Cap ($)</label>
              <input
                type="number"
                min="0"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSaving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>Create Coupon</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Coupon In-App Confirmation Modal */}
      <Modal
        isOpen={!!deleteCouponTarget}
        onClose={() => setDeleteCouponTarget(null)}
        title="Confirm Coupon Deletion"
        description={`Are you sure you want to delete coupon code "${deleteCouponTarget}"? This cannot be undone.`}
        maxWidth="sm"
      >
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => setDeleteCouponTarget(null)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDeleteCoupon}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Delete Coupon
          </button>
        </div>
      </Modal>
    </div>
  );
};
