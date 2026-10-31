import React, { useState, useRef, useEffect } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Building,
  RotateCcw,
  Headphones,
} from 'lucide-react';
import { useAppDispatch } from '../app/hooks';
import { addToast } from '../features/toast/toastSlice';

interface SubmissionResult {
  id: string;
  name: string;
  email: string;
  subject: string;
  createdAt: string;
}

export const ContactPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('General Customer Support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Validation & UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmissionResult | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Particle Animation System
  useEffect(() => {
    if (!submittedData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const colors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#fbbf24', '#0c261e'];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
      rotation: number;
      vRot: number;
      shape: 'rect' | 'circle';
    }

    const particles: Particle[] = [];
    const count = 90;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      particles.push({
        x: width / 2,
        y: height / 2 - 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.012 + 0.008,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      let alive = false;
      for (const p of particles) {
        if (p.alpha > 0) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.18; // gravity
          p.vx *= 0.98; // air drag
          p.alpha -= p.decay;
          p.rotation += p.vRot;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      if (alive) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [submittedData]);

  // Validation Logic
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Please provide your full name (minimum 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!subject.trim() || subject.trim().length < 3) {
      newErrors.subject = 'Please enter a subject (minimum 3 characters).';
    }

    if (!message.trim() || message.trim().length < 10) {
      newErrors.message = 'Please provide message details (minimum 10 characters).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      dispatch(addToast({ type: 'warning', message: 'Please correct the highlighted fields.' }));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          department,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedData(data.data);
        dispatch(
          addToast({
            type: 'success',
            title: 'Message Received',
            message: 'Your inquiry has been logged in our Dhaka support center.',
          })
        );
      } else {
        dispatch(addToast({ type: 'error', message: data.error || 'Failed to submit inquiry.' }));
      }
    } catch {
      dispatch(
        addToast({
          type: 'error',
          message: 'Network error. Please verify your connection and try again.',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSubject('');
    setMessage('');
    setSubmittedData(null);
    setErrors({});
  };

  const contactCards = [
    {
      icon: Headphones,
      title: 'Customer Concierge Desk',
      sub: 'Order tracking, delivery timing & product advice',
      detail: '+880 1712 345678',
      linkText: 'Call Support Hotline',
      note: 'Available 24 hours / 7 days a week',
      badge: 'Always Open',
    },
    {
      icon: Building,
      title: 'Dhaka Central Hub',
      sub: 'Fulfillment headquarters & executive offices',
      detail: 'House 12, Road 5, Block B, Dhanmondi, Dhaka 1209',
      linkText: 'View on Maps',
      note: 'Climate-controlled warehouse & QC facility',
      badge: 'Main Center',
    },
    {
      icon: Mail,
      title: 'Wholesale & B2B Partnerships',
      sub: 'Bulk institutional orders & corporate procurement',
      detail: 'b2b@novaracommerce.com',
      linkText: 'Email Corporate Desk',
      note: 'Volume discounts for 10+ units',
      badge: 'B2B Procurement',
    },
    {
      icon: Clock,
      title: 'Dispatch & Operational Hours',
      sub: 'Order processing & courier release schedule',
      detail: 'Sun – Thu: 9:00 AM – 8:00 PM BST',
      linkText: 'Same-day cut-off: 2:00 PM',
      note: 'Weekend priority express dispatch active',
      badge: 'Express Schedule',
    },
  ];

  const faqs = [
    {
      q: 'How fast is delivery across Bangladesh?',
      a: 'For Dhaka metro orders placed before 2:00 PM BST, same-day or next-day express delivery is available. Outside Dhaka (Chittagong, Sylhet, Rajshahi, Khulna, and all 64 districts), delivery takes 2 to 3 business days via priority insured couriers.',
    },
    {
      q: 'How does the 30-Day Money Back Guarantee work?',
      a: 'Every single product purchased from ShopMax is backed by our direct 30-day return policy. If an item arrives damaged, defective, or fails to meet specifications, contact our concierge desk for a free doorstep replacement or 100% refund.',
    },
    {
      q: 'Are all products 100% authentic and warrantied?',
      a: 'Yes. Unlike uncurated multi-vendor marketplaces, we do not allow third-party drop-shipping. Every item is procured directly under authorized agreements, inspected in our Dhaka hub, and covered by official vendor warranties.',
    },
    {
      q: 'Which payment methods are accepted?',
      a: 'We support Cash on Delivery (COD) nationwide, bKash mobile wallet, and major credit/debit cards (Visa, MasterCard, American Express) through secured 256-bit SSL encryption.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      {/* 1. Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Dedicated Customer Support</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          We’re Here to Help You Every Step of the Way
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
          Have an inquiry about an active shipment, bulk enterprise order, or technical specifications? Reach our Dhaka central support team directly.
        </p>
      </div>

      {/* 2. 4 Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {contactCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {c.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">{c.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{c.sub}</p>
                </div>

                <div className="text-xs font-bold text-emerald-900 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 break-words">
                  {c.detail}
                </div>
              </div>

              <div className="text-[11px] text-gray-400 border-t border-gray-50 pt-3">
                {c.note}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Form Section & Office Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Contact Form Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          {submittedData ? (
            /* Confirmed Submission View with Canvas Confetti / Particle Animation */
            <div className="relative py-8 text-center space-y-6">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              />

              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8 text-emerald-700" />
              </div>

              <div className="space-y-2 relative z-20">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                  Inquiry Successfully Received
                </span>
                <h3 className="text-2xl font-extrabold text-gray-900">
                  Thank You, {submittedData.name}!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Your message has been registered in our centralized administrative system with reference{' '}
                  <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {submittedData.id}
                  </span>
                  . A dedicated support specialist will review it promptly.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 max-w-md mx-auto text-left text-xs space-y-2 border border-gray-100 relative z-20">
                <div className="flex justify-between text-gray-500">
                  <span>Subject:</span>
                  <span className="font-semibold text-gray-800">{submittedData.subject}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Email:</span>
                  <span className="font-semibold text-gray-800">{submittedData.email}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Submitted At:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(submittedData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="pt-2 relative z-20">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Send Another Inquiry</span>
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Contact Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  Send Us a Direct Message
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Fill in your details below and our Dhaka concierge team will respond within 2-4 hours.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="e.g. Md Mahim"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                      errors.name ? 'border-rose-400 focus:ring-1 focus:ring-rose-400' : 'border-gray-200 focus:ring-1 focus:ring-emerald-700'
                    }`}
                  />
                  {errors.name && <p className="text-[11px] text-rose-600">{errors.name}</p>}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="e.g. mahim@example.com"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                      errors.email ? 'border-rose-400 focus:ring-1 focus:ring-rose-400' : 'border-gray-200 focus:ring-1 focus:ring-emerald-700'
                    }`}
                  />
                  {errors.email && <p className="text-[11px] text-rose-600">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1712 345678"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 transition"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 transition"
                  >
                    <option value="General Customer Support">General Customer Support</option>
                    <option value="Order Tracking & Delivery">Order Tracking & Delivery</option>
                    <option value="Product Warranty & Claims">Product Warranty & Claims</option>
                    <option value="Wholesale & B2B">Wholesale & B2B Inquiries</option>
                    <option value="Returns & Exchange">Returns & Exchange</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Subject *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (errors.subject) setErrors((prev) => ({ ...prev, subject: '' }));
                  }}
                  placeholder="What is your message regarding?"
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                    errors.subject ? 'border-rose-400 focus:ring-1 focus:ring-rose-400' : 'border-gray-200 focus:ring-1 focus:ring-emerald-700'
                  }`}
                />
                {errors.subject && <p className="text-[11px] text-rose-600">{errors.subject}</p>}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Message *</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
                  }}
                  placeholder="Please describe your question or issue in detail..."
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition resize-none ${
                    errors.message ? 'border-rose-400 focus:ring-1 focus:ring-rose-400' : 'border-gray-200 focus:ring-1 focus:ring-emerald-700'
                  }`}
                />
                {errors.message && <p className="text-[11px] text-rose-600">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-950/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting Message...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message to Support Desk</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Location & Guarantees */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-emerald-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
              <ShieldCheck className="w-48 h-48 -mr-10 -mb-10 text-emerald-400" />
            </div>

            <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Dhaka Fulfillment Center
            </div>

            <h3 className="text-xl font-bold">Centralized Operations Hub</h3>

            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Every parcel shipped across Bangladesh originates from our central Dhanmondi facility, where staff inspect serial numbers and apply tamper-evident seals before handoff to couriers.
            </p>

            <div className="pt-2 space-y-2 text-xs text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Barcode-scanned dispatch verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Climate-controlled electronics storage</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Direct integration with 64-district express delivery</span>
              </div>
            </div>
          </div>

          {/* Interactive FAQs Accordion */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              <span>Frequently Asked Questions</span>
            </h4>

            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full text-left py-1.5 flex items-center justify-between text-xs font-semibold text-gray-800 hover:text-emerald-800 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                      expandedFaq === i ? 'rotate-180 text-emerald-800' : ''
                    }`}
                  />
                </button>
                {expandedFaq === i && (
                  <p className="text-[11px] text-gray-600 leading-relaxed pt-1 pb-1">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
