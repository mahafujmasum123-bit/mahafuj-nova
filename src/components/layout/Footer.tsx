import React, { useState } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import {
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  RotateCcw,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Heart,
} from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, params?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const dispatch = useAppDispatch();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      dispatch(addToast({ type: 'warning', message: 'Please enter a valid email address.' }));
      return;
    }

    setNewsletterLoading(true);
    try {
      const res = await fetch('/api/cms/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch(addToast({ type: 'success', title: 'Subscribed', message: data.message }));
        setNewsletterEmail('');
      } else {
        dispatch(addToast({ type: 'error', message: data.error || 'Failed to subscribe' }));
      }
    } catch {
      dispatch(addToast({ type: 'error', message: 'Subscription failed. Please try again.' }));
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <footer className="w-full bg-[#0a1e17] text-white pt-16 pb-8 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 1. Guarantee / Service Badges Strip */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Free Shipping</h4>
              <p className="text-xs text-gray-400">On all orders over $50</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Secure Payment</h4>
              <p className="text-xs text-gray-400">100% secure payment</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">24/7 Support</h4>
              <p className="text-xs text-gray-400">We're here to help</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Money Back Guarantee</h4>
              <p className="text-xs text-gray-400">30 days return policy</p>
            </div>
          </div>
        </div>

        {/* 2. Newsletter Subscription Banner matching reference image */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2f24] via-[#0b281f] to-[#071d16] border border-emerald-800/40 p-8 sm:p-12 overflow-hidden mb-16 shadow-2xl">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-xl">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Join Our Newsletter
              </h3>
              <p className="text-sm text-emerald-200/80 mt-2">
                Get exclusive deals, early access to new products, and seasonal retail discounts.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex-1 max-w-md w-full">
              <div className="flex bg-white rounded-full p-1.5 shadow-xl">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none rounded-full"
                  required
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm rounded-full transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Decorative script & leaf badge matching reference image */}
          <div className="absolute right-4 bottom-2 text-emerald-300/20 font-serif italic text-3xl sm:text-4xl pointer-events-none select-none hidden md:block">
            Be the First to Know ♡
          </div>
        </div>

        {/* 3. Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div>
            <div
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 cursor-pointer mb-3 select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-emerald-300" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Novara<span className="text-emerald-400">Max</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
              Bangladesh’s leading premium single-vendor retail platform. Dedicated to curated lifestyle, electronics, fashion, and home products.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Quick Links</h5>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-emerald-400 transition cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-emerald-400 transition cursor-pointer">
                  Shop Catalog
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-emerald-400 transition cursor-pointer">
                  All Categories
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-emerald-400 transition cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="hover:text-emerald-400 transition cursor-pointer">
                  Journal & Blog
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-emerald-400 transition cursor-pointer">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Customer Service</h5>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-emerald-400 transition cursor-pointer">
                  Help Center & FAQs
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-emerald-400 transition cursor-pointer">
                  Shipping & Delivery Info
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-emerald-400 transition cursor-pointer">
                  Return & Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('account', { tab: 'orders' })} className="hover:text-emerald-400 transition cursor-pointer">
                  Track Your Order
                </button>
              </li>
            </ul>
          </div>

          {/* Social Media & Follow Us */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Follow Us</h5>
            <div className="flex items-center gap-3 mb-6">
              <a href="#facebook" className="w-8 h-8 rounded-full bg-white/10 hover:bg-emerald-700 flex items-center justify-center text-gray-300 hover:text-white transition">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#instagram" className="w-8 h-8 rounded-full bg-white/10 hover:bg-emerald-700 flex items-center justify-center text-gray-300 hover:text-white transition">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#youtube" className="w-8 h-8 rounded-full bg-white/10 hover:bg-emerald-700 flex items-center justify-center text-gray-300 hover:text-white transition">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#twitter" className="w-8 h-8 rounded-full bg-white/10 hover:bg-emerald-700 flex items-center justify-center text-gray-300 hover:text-white transition">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-gray-400">
              Dhaka Office: Gulshan-2, Dhaka 1212, Bangladesh
            </p>
          </div>
        </div>

        {/* 4. Bottom Copyright & Payment Methods */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            © {new Date().getFullYear()} Novara Commerce / ShopMax. All rights reserved.
          </div>

          {/* Payment Badges (VISA, Mastercard, PayPal, Apple Pay, Google Pay, bKash) */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-white text-gray-900 font-bold text-[10px] tracking-wider">VISA</span>
            <span className="px-2 py-1 rounded bg-white text-rose-600 font-bold text-[10px] tracking-wider">Mastercard</span>
            <span className="px-2 py-1 rounded bg-[#E2136E] text-white font-bold text-[10px] tracking-wider">bKash</span>
            <span className="px-2 py-1 rounded bg-[#F7941D] text-white font-bold text-[10px] tracking-wider">Nagad</span>
            <span className="px-2 py-1 rounded bg-white text-gray-900 font-bold text-[10px] tracking-wider">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
