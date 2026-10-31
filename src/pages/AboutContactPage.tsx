import React, { useState } from 'react';
import { useAppDispatch } from '../app/hooks';
import { addToast } from '../features/toast/toastSlice';
import { Mail, Phone, MapPin, Send, ShieldCheck, Truck, Headphones, RotateCcw } from 'lucide-react';

export const AboutContactPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Please complete all required fields.' }));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/cms/support-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch(addToast({ type: 'success', title: 'Enquiry Received', message: data.message }));
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to send message.' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-16">
      {/* About Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-5">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
            About Novara Commerce
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Premium Single-Vendor Retail for Bangladesh
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Novara Commerce is built on a direct retail model. Unlike multi-vendor marketplaces, every single item in our catalog is directly sourced, quality-audited, stocked in our central Dhaka fulfillment hub, and delivered under our warranty.
          </p>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            From smart watches and active noise-cancelling headphones to organic apparel, ergonomic furniture, and high-performance footwear, we bring world-class retail luxury to all 64 districts of Bangladesh.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xl font-extrabold text-emerald-800">100%</div>
              <div className="text-xs text-gray-500 font-medium">Authenticity Guarantee</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xl font-extrabold text-emerald-800">64</div>
              <div className="text-xs text-gray-500 font-medium">Districts Covered in BD</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <img
            src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80"
            alt="Novara Fulfillment"
            className="w-full rounded-3xl shadow-xl object-cover aspect-[4/3]"
          />
        </div>
      </div>

      {/* Contact & Support Section */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 sm:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Contact Info */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Get in Touch
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Have questions regarding delivery, bulk purchases, or returns? Reach out to our Dhaka support center.
            </p>
          </div>

          <div className="space-y-4 text-xs text-gray-700">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-gray-900">Central Headquarters</div>
                <div className="text-gray-500">Road 11, Banani, Dhaka 1213, Bangladesh</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-gray-900">Customer Hotline</div>
                <div className="text-gray-500">+880 1711 000000 (9 AM – 10 PM daily)</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-gray-900">Official Support Desk</div>
                <div className="text-gray-500">support@novaracommerce.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Contact Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Khan"
                className="w-full text-xs p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Question regarding delivery to Sylhet"
              className="w-full text-xs p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Message *</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can our support team assist you today?"
              className="w-full text-xs p-3 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send Message'}
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
