import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { updateUserAddresses, UserAddress } from '../features/auth/authSlice';
import { addToast } from '../features/toast/toastSlice';
import { Modal } from '../components/modal/Modal';
import {
  Package,
  MapPin,
  Settings,
  Heart,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';

interface CustomerAccountPageProps {
  initialTab?: 'orders' | 'addresses' | 'settings';
  onNavigateToShop: () => void;
}

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({
  initialTab = 'orders',
  onNavigateToShop,
}) => {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'settings'>(initialTab);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Address modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddrName, setNewAddrName] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrDivision, setNewAddrDivision] = useState('Dhaka');
  const [newAddrDistrict, setNewAddrDistrict] = useState('Dhaka');
  const [newAddrUpazila, setNewAddrUpazila] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      if (!token) return;
      setLoadingOrders(true);
      try {
        const res = await fetch('/api/orders/my-orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadOrders();
  }, [token]);

  const handleCancelOrder = async (orderNumber: string) => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Customer requested cancellation from account' }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch(addToast({ type: 'success', title: 'Order Cancelled', message: data.message }));
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === orderNumber ? { ...o, status: 'cancelled' } : o))
        );
      } else {
        dispatch(addToast({ type: 'error', message: data.error }));
      }
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to cancel order' }));
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrName.trim() || !newAddrPhone.trim() || !newAddrStreet.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Please fill all required address fields.' }));
      return;
    }

    setSavingAddress(true);
    try {
      const res = await fetch('/api/auth/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newAddrName.trim(),
          phone: newAddrPhone.trim(),
          division: newAddrDivision,
          district: newAddrDistrict,
          upazila: newAddrUpazila.trim(),
          street: newAddrStreet.trim(),
          isDefault: false,
        }),
      });

      const data = await res.json();
      if (data.success && data.addresses) {
        dispatch(updateUserAddresses(data.addresses));
        dispatch(addToast({ type: 'success', title: 'Address Saved', message: 'New address added to your account.' }));
        setIsAddressModalOpen(false);
        setNewAddrName('');
        setNewAddrPhone('');
        setNewAddrStreet('');
        setNewAddrUpazila('');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to save address' }));
    } finally {
      setSavingAddress(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900">Please Sign In</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">You must be logged in to view your customer account.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Profile summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-emerald-950/10">
            {user.name[0]}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              {user.name}
            </h1>
            <p className="text-xs text-gray-500">{user.email} • {user.phone || '+880 Bangladesh'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
            {user.role.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'orders'
              ? 'border-emerald-800 text-emerald-950'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`flex items-center gap-2 pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'addresses'
              ? 'border-emerald-800 text-emerald-950'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Saved Addresses ({user.addresses?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'border-emerald-800 text-emerald-950'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Account Settings</span>
        </button>
      </div>

      {/* TAB 1: MY ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {loadingOrders ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 space-y-3">
              <Package className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-gray-900">No orders placed yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Explore our popular electronics, footwear, and fashion items to place your first order.
              </p>
              <button
                onClick={onNavigateToShop}
                className="mt-2 px-6 py-2.5 bg-emerald-800 text-white text-xs font-bold rounded-xl"
              >
                Browse Shop
              </button>
            </div>
          ) : (
            orders.map((order) => {
              const isCancellable = order.status === 'pending' || order.status === 'confirmed';
              return (
                <div
                  key={order.orderNumber}
                  className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-extrabold text-gray-900">
                          Order #{order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Placed on {new Date(order.createdAt).toLocaleDateString()} via{' '}
                        {order.paymentMethod?.toUpperCase()}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-base font-extrabold text-gray-900">
                        ${order.finalTotal?.toFixed(2)}
                      </span>
                      {isCancellable && (
                        <button
                          onClick={() => handleCancelOrder(order.orderNumber)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items snapshot */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {order.items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-white shrink-0 border border-gray-100"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-gray-900 truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Qty: {item.quantity} × ${item.unitPrice?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery address snapshot */}
                  <div className="pt-2 text-xs text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
                    <div>
                      <strong className="text-gray-800">Ship To:</strong> {order.shippingAddress?.name} ({order.shippingAddress?.phone})
                    </div>
                    <div>
                      <strong className="text-gray-800">Address:</strong> {order.shippingAddress?.street}, {order.shippingAddress?.upazila}, {order.shippingAddress?.district}, {order.shippingAddress?.division}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: SAVED ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Saved Delivery Addresses
            </h2>
            <button
              onClick={() => setIsAddressModalOpen(true)}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Address</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.addresses?.map((addr) => (
              <div
                key={addr.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-2 relative"
              >
                {addr.isDefault && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Default Address
                  </span>
                )}
                <div className="text-sm font-bold text-gray-900">{addr.name}</div>
                <div className="text-xs text-gray-500 leading-relaxed">
                  {addr.street}, {addr.upazila} <br />
                  {addr.district}, {addr.division}
                </div>
                <div className="text-xs font-semibold text-gray-700 pt-1">{addr.phone}</div>
              </div>
            ))}
          </div>

          {/* Add Address Modal */}
          <Modal
            isOpen={isAddressModalOpen}
            onClose={() => setIsAddressModalOpen(false)}
            title="Add New Delivery Address"
            description="Address will be saved to your profile for 1-click checkout."
          >
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  value={newAddrName}
                  onChange={(e) => setNewAddrName(e.target.value)}
                  placeholder="e.g. Sarah Khan"
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={newAddrPhone}
                  onChange={(e) => setNewAddrPhone(e.target.value)}
                  placeholder="+880 17XX XXXXXX"
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Division</label>
                  <select
                    value={newAddrDivision}
                    onChange={(e) => setNewAddrDivision(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl outline-none bg-white"
                  >
                    {['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'].map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">District</label>
                  <input
                    type="text"
                    value={newAddrDistrict}
                    onChange={(e) => setNewAddrDistrict(e.target.value)}
                    placeholder="e.g. Dhaka"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Upazila / Thana
                </label>
                <input
                  type="text"
                  value={newAddrUpazila}
                  onChange={(e) => setNewAddrUpazila(e.target.value)}
                  placeholder="e.g. Dhanmondi, Gulshan"
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={newAddrStreet}
                  onChange={(e) => setNewAddrStreet(e.target.value)}
                  placeholder="House 42, Road 9/A"
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingAddress}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition"
              >
                {savingAddress ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          </Modal>
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs max-w-xl space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
            Profile Information
          </h2>
          <div>
            <label className="text-xs text-gray-500 block">Full Name</label>
            <div className="text-sm font-bold text-gray-900 mt-0.5">{user.name}</div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block">Email Address</label>
            <div className="text-sm font-bold text-gray-900 mt-0.5">{user.email}</div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block">Account Role</label>
            <div className="text-sm font-bold text-emerald-800 mt-0.5 capitalize">
              {user.role.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
