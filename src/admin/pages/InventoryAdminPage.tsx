import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { Modal } from '../../components/modal/Modal';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Search,
  History,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';

interface InventoryAdminPageProps {
  products: any[];
  onRefresh: () => void;
}

export const InventoryAdminPage: React.FC<InventoryAdminPageProps> = ({ products, onRefresh }) => {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');

  // Adjustment modal
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('20');
  const [adjustmentReason, setAdjustmentReason] = useState('Restock shipment received from supplier');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-page audit log trail
  const [recentMovements, setRecentMovements] = useState<any[]>([
    {
      id: 'mov-1',
      sku: 'NOV-1001',
      name: 'Wireless Headphones',
      delta: '+25',
      reason: 'Supplier inbound container arrived',
      actor: 'Kamal Hossain (Inventory Mgr)',
      time: '2 hours ago',
    },
    {
      id: 'mov-2',
      sku: 'NOV-1002',
      name: 'Smart Watch',
      delta: '-1',
      reason: 'Fulfillment order NOV-2025-882193',
      actor: 'System Auto-Deduction',
      time: '3 hours ago',
    },
  ]);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q));

    const threshold = p.lowStockThreshold || 5;
    let matchesFilter = true;
    if (filterType === 'low_stock') matchesFilter = p.stock > 0 && p.stock <= threshold;
    if (filterType === 'out_of_stock') matchesFilter = p.stock === 0;

    return matchesSearch && matchesFilter;
  });

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const handleOpenAdjustment = (prod: any) => {
    setSelectedProduct(prod);
    setAdjustmentAmount('15');
    setAdjustmentReason('Supplier restock received');
  };

  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const delta = parseInt(adjustmentAmount, 10);
    if (isNaN(delta) || delta === 0) {
      dispatch(addToast({ type: 'warning', message: 'Enter a non-zero adjustment delta' }));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adjustment: delta,
          reason: adjustmentReason.trim() || 'Inventory adjustment',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to adjust stock');
      }

      dispatch(
        addToast({
          type: 'success',
          title: 'Stock Updated & Logged',
          message: `${selectedProduct.name}: Stock changed by ${delta > 0 ? `+${delta}` : delta} units.`,
        })
      );

      // Record local movement trail
      setRecentMovements((prev) => [
        {
          id: `mov-${Date.now()}`,
          sku: selectedProduct.sku,
          name: selectedProduct.name,
          delta: delta > 0 ? `+${delta}` : `${delta}`,
          reason: adjustmentReason,
          actor: `${user?.name || 'Admin Staff'} (${user?.role || 'staff'})`,
          time: 'Just now',
        },
        ...prev,
      ]);

      setSelectedProduct(null);
      onRefresh();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Total Tracked SKUs</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{products.length}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Active warehouse items</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase">Low Stock Alerts</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{lowStockCount}</div>
            <div className="text-[11px] text-amber-600/80 mt-0.5">At or below safety threshold</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-700 uppercase">Out of Stock (0)</div>
            <div className="text-2xl font-extrabold text-rose-600 mt-1">{outOfStockCount}</div>
            <div className="text-[11px] text-rose-600/80 mt-0.5">Customer ordering disabled</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inventory by SKU, product name, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-emerald-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-emerald-800 text-white'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            All Stock ({products.length})
          </button>
          <button
            onClick={() => setFilterType('low_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'low_stock'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterType('out_of_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'out_of_stock'
                ? 'bg-rose-600 text-white'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Available Stock</th>
                <th className="py-3 px-3">Safety Threshold</th>
                <th className="py-3 px-3">Inventory Status</th>
                <th className="py-3 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => {
                const threshold = p.lowStockThreshold || 5;
                const isOut = p.stock === 0;
                const isLow = p.stock > 0 && p.stock <= threshold;

                return (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
                          alt={p.name}
                          className="w-9 h-9 rounded-lg object-cover border border-gray-100 bg-gray-50 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate max-w-xs">{p.name}</div>
                          <div className="text-[10px] text-gray-500">${(p.salePrice || p.price).toFixed(2)}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-gray-700">{p.sku}</td>
                    <td className="py-3 px-3 text-gray-600">{p.category}</td>

                    <td className="py-3 px-3 font-mono">
                      <span className="font-extrabold text-sm text-gray-900">{p.stock}</span>
                      <span className="text-[10px] text-gray-400 ml-1">units</span>
                    </td>

                    <td className="py-3 px-3 font-mono text-gray-500">≤ {threshold} units</td>

                    <td className="py-3 px-3">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          Low Stock Alert
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Healthy Stock
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenAdjustment(p)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>Adjust Stock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Audit Trail */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-gray-900">Recent Warehouse Movement Trail</h3>
        </div>
        <div className="space-y-2">
          {recentMovements.map((mov) => (
            <div
              key={mov.id}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900">{mov.sku}</span>
                  <span className="text-gray-600 truncate">{mov.name}</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Reason: {mov.reason} • Actor: {mov.actor}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded ${
                    mov.delta.startsWith('+')
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {mov.delta}
                </span>
                <div className="text-[10px] text-gray-400 mt-0.5">{mov.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adjustment Modal */}
      {selectedProduct && (
        <Modal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          title={`Adjust Inventory: ${selectedProduct.name}`}
        >
          <form onSubmit={handleExecuteAdjustment} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex justify-between">
              <div>
                <span className="text-gray-500">Current Stock:</span>{' '}
                <span className="font-bold text-gray-900 font-mono text-sm">{selectedProduct.stock} units</span>
              </div>
              <div>
                <span className="text-gray-500">SKU:</span>{' '}
                <span className="font-bold text-gray-900 font-mono">{selectedProduct.sku}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Adjustment Delta Units (+ to Restock, - to Write Off) *
              </label>
              <input
                type="number"
                required
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="e.g. 25 or -3"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 focus:ring-1 focus:ring-emerald-800"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                New resulting stock:{' '}
                <span className="font-bold text-emerald-800">
                  {Math.max(0, selectedProduct.stock + (parseInt(adjustmentAmount, 10) || 0))} units
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Audit Log Reason *
              </label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-emerald-800 bg-white cursor-pointer"
              >
                <option value="Restock shipment received from supplier">Restock shipment received from supplier</option>
                <option value="Physical count audit adjustment">Physical count audit adjustment</option>
                <option value="Damaged or defective units written off">Damaged or defective units written off</option>
                <option value="Customer return inspected and restocked">Customer return inspected and restocked</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Apply & Audit Log</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
