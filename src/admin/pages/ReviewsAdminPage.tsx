import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { Modal } from '../../components/modal/Modal';

interface ReviewsAdminPageProps {
  reviews: any[];
  onRefresh: () => void;
  products: any[];
}

export const ReviewsAdminPage: React.FC<ReviewsAdminPageProps> = ({
  reviews,
  onRefresh,
  products,
}) => {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReviews = reviews.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.userName.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q) ||
      (r.productId && r.productId.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const handleModerate = async (id: string, nextStatus: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/reviews/admin/${id}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (data.success) {
        dispatch(
          addToast({
            type: 'success',
            title: 'Moderation Updated',
            message: `Review marked as ${nextStatus}.`,
          })
        );
        onRefresh();
      }
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to update review status' }));
    }
  };

  const [deleteReviewTarget, setDeleteReviewTarget] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteReviewTarget(id);
  };

  const confirmDeleteReview = async () => {
    if (!deleteReviewTarget) return;

    try {
      const res = await fetch(`/api/reviews/admin/${deleteReviewTarget}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        dispatch(addToast({ type: 'success', title: 'Deleted', message: 'Review removed from queue.' }));
        onRefresh();
      }
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to delete review' }));
    } finally {
      setDeleteReviewTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500 uppercase">Total User Reviews</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{reviews.length}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Across catalog items</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-800 uppercase">Approved Live Reviews</div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">
            {reviews.filter((r) => r.status === 'approved').length}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Visible on product detail pages</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-amber-700 uppercase">Pending Moderation</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {reviews.filter((r) => r.status === 'pending').length}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">Awaiting staff verification</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by reviewer name, comment text, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-emerald-800"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer ${
                filterStatus === st
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {st} ({st === 'all' ? reviews.length : reviews.filter((r) => r.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200/80">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">No reviews match the selected filter</p>
          </div>
        ) : (
          filteredReviews.map((r) => {
            const prod = products.find((p) => p.id === r.productId || p.slug === r.productId);

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-gray-900 text-xs">{r.userName}</span>
                    {r.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400 font-mono">
                      {r.createdAt || 'Recent'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed font-normal">
                    "{r.comment}"
                  </p>

                  {prod && (
                    <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                      <span className="font-semibold text-gray-700">Product:</span>
                      <span className="text-emerald-800 font-medium">{prod.name}</span>
                      <span className="text-gray-400 font-mono">({prod.sku})</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase border ${
                      r.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : r.status === 'rejected'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {r.status}
                  </span>

                  {r.status !== 'approved' && (
                    <button
                      onClick={() => handleModerate(r.id, 'approved')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Approve for public storefront"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {r.status !== 'rejected' && (
                    <button
                      onClick={() => handleModerate(r.id, 'rejected')}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer flex items-center gap-1 border border-rose-200"
                      title="Reject review"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Review In-App Confirmation Modal */}
      <Modal
        isOpen={!!deleteReviewTarget}
        onClose={() => setDeleteReviewTarget(null)}
        title="Confirm Review Deletion"
        description="Are you sure you want to permanently delete this customer review? This action cannot be undone."
        maxWidth="sm"
      >
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => setDeleteReviewTarget(null)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDeleteReview}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Delete Review
          </button>
        </div>
      </Modal>
    </div>
  );
};
