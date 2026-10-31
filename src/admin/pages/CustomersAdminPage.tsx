import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../app/hooks';
import { Modal } from '../../components/modal/Modal';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface CustomersAdminPageProps {
  onRefresh?: () => void;
}

export const CustomersAdminPage: React.FC<CustomersAdminPageProps> = () => {
  const { token } = useAppSelector((state) => state.auth);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  });

  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Registered Customers</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{customers.length}</div>
            <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">Active accounts</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Total Lifetime Orders</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">
              {customers.reduce((sum, c) => sum + (c.ordersCount || 0), 0)}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Across all client profiles</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Cumulative Spend</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">
              ${totalSpentAll.toFixed(2)}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Verified checkout revenue</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone, or delivery city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-emerald-800"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Lifetime Orders</th>
                <th className="py-3 px-3">Total Spend</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Loading customer accounts...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No customers match the criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-emerald-800 transition">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Joined {new Date(c.joinedAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-gray-800">{c.email}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{c.phone}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-medium text-gray-800">{c.city}</span>
                      <div className="text-[10px] text-gray-400">{c.district}</div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-gray-900">
                      {c.ordersCount} orders
                    </td>

                    <td className="py-3.5 px-3 font-extrabold text-gray-900">
                      ${c.totalSpent.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {c.status || 'Active'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 font-bold text-xs transition cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Account: ${selectedCustomer.name}`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white font-extrabold text-lg flex items-center justify-center">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedCustomer.name}</h3>
                <div className="text-xs text-gray-500">{selectedCustomer.email}</div>
                <div className="text-xs font-mono text-gray-600 mt-0.5">{selectedCustomer.phone}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-gray-200 rounded-xl">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Total Orders</span>
                <div className="text-xl font-extrabold text-gray-900 mt-1">{selectedCustomer.ordersCount}</div>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-xl">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Total Spent</span>
                <div className="text-xl font-extrabold text-emerald-800 mt-1">${selectedCustomer.totalSpent.toFixed(2)}</div>
              </div>
            </div>

            <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Default Delivery Area</span>
              </div>
              <div className="text-gray-600">
                Division: <span className="font-semibold text-gray-800">{selectedCustomer.city}</span>
              </div>
              <div className="text-gray-600">
                District / Upazila: <span className="font-semibold text-gray-800">{selectedCustomer.district}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
