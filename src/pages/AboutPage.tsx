import React from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Award,
  Sparkles,
  PackageCheck,
  Leaf,
  Users,
  ArrowRight,
  CheckCircle2,
  Building2,
  TrendingUp,
} from 'lucide-react';

interface AboutPageProps {
  onNavigate?: (view: string, params?: any) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const stats = [
    { value: '100%', label: 'Guaranteed Authentic', sub: 'Zero counterfeit tolerance' },
    { value: '64', label: 'Districts Reached', sub: 'Nationwide last-mile logistics' },
    { value: '24h', label: 'Dhaka Express Dispatch', sub: 'Same/next-day delivery' },
    { value: '30 Days', label: 'Money Back Guarantee', sub: 'Hassle-free verified returns' },
  ];

  const pillars = [
    {
      icon: ShieldCheck,
      title: 'Direct-to-Consumer Sourcing',
      desc: 'We bypass grey-market importers and unverified third-party merchants. Every single product in our catalog is procured directly from authorized manufacturers and brand partners.',
      badge: 'Zero Counterfeits',
    },
    {
      icon: PackageCheck,
      title: 'Central Dhaka Fulfillment Hub',
      desc: 'No dropshipping delays. All inventory is physical, audited, barcoded, and stored in our climate-controlled 25,000 sq.ft facility in Dhanmondi, Dhaka.',
      badge: 'Live Stock Control',
    },
    {
      icon: Leaf,
      title: 'Eco-Conscious Packaging',
      desc: 'Over 94% of our packaging is FSC-certified unbleached kraft board. We replaced plastic bubble wraps with biodegradable honeycomb paper buffers.',
      badge: 'Sustainable Retail',
    },
    {
      icon: Headphones,
      title: 'Human-First 24/7 Concierge',
      desc: 'No confusing automated bots that run in circles. Our support desk is staffed by knowledgeable technology and lifestyle advisors based right here in Dhaka.',
      badge: 'Real Team Support',
    },
  ];

  const milestones = [
    {
      year: '2022',
      title: 'The Inception',
      desc: 'Frustrated by rampant counterfeit electronics and week-long delays on marketplace platforms, our founders launched Novara with just 25 curated premium audio products.',
    },
    {
      year: '2023',
      title: 'Central Hub Expansion',
      desc: 'Commissioned our central Dhaka fulfillment facility, introducing barcode-level SKU tracking and guaranteed same-day dispatch for Dhaka metro orders.',
    },
    {
      year: '2024',
      title: 'All-District Coverage',
      desc: 'Partnered with priority express carriers to bring guaranteed 48-to-72 hour delivery to all 64 districts of Bangladesh, including remote upazilas.',
    },
    {
      year: '2025',
      title: 'Green Packaging Initiative',
      desc: 'Completely eliminated non-recyclable single-use plastics from our shipping boxes, adopting biodegradable honeycomb cushioning and water-activated paper tape.',
    },
    {
      year: '2026',
      title: 'The ShopMax Ecosystem',
      desc: 'Over 50,000 satisfied customers nationwide, an expanded catalog covering smart wearables, lifestyle ergonomics, and verified tech with comprehensive warranties.',
    },
  ];

  const values = [
    'Every product undergoes a 4-point physical quality check before boxing',
    'Upfront transparent pricing with zero hidden surcharges or surprise fees',
    '30-day no-quibble return policy with prompt refund processing',
    'Complete customer privacy with secure, encrypted data storage',
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0c261e] via-[#091f18] to-gray-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4ade80_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Direct Retail Excellence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Setting the Gold Standard for Direct Retail in Bangladesh
          </h1>

          <p className="max-w-3xl mx-auto text-sm sm:text-base lg:text-lg text-emerald-100/80 leading-relaxed font-normal">
            Novara Commerce was born from a simple belief: customers in Bangladesh deserve guaranteed authenticity, immaculate packaging, and prompt nationwide delivery without the uncertainty of uncurated open marketplaces.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate && onNavigate('shop')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <span>Explore Our Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate && onNavigate('contact')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/20 transition cursor-pointer"
            >
              <span>Contact Support Desk</span>
            </button>
          </div>
        </div>

        {/* Floating KPI Cards */}
        <div className="relative max-w-6xl mx-auto mt-12 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center space-y-1"
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-emerald-400 tracking-tight">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white">{s.label}</div>
              <div className="text-[11px] text-emerald-200/60">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Direct Retail vs Marketplace Model */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
              The Direct Difference
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
              Why Single-Vendor Direct Retail Outperforms Open Marketplaces
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Open marketplace platforms list products from thousands of anonymous third-party sellers. When an order arrives damaged, counterfeit, or delayed, accountability is lost between multiple brokers and couriers.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              At Novara Commerce, we are the direct seller, the stockist, the quality inspector, and the warranty provider. When you order from ShopMax, our reputation is on the line with every parcel that leaves our Dhaka hub.
            </p>

            <div className="space-y-3 pt-2">
              {values.map((v, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-700 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&q=80"
                alt="Fulfillment Hub in Dhaka"
                className="w-full h-96 sm:h-[450px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent flex items-end p-6 sm:p-8">
                <div className="text-white space-y-1">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Central Distribution Hub
                  </div>
                  <div className="text-base sm:text-lg font-bold">
                    House 12, Road 5, Block B, Dhanmondi, Dhaka 1209
                  </div>
                  <div className="text-xs text-gray-300">
                    Climate-controlled warehouse with active quality auditing
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four Core Pillars */}
      <section className="bg-emerald-50/50 py-16 sm:py-20 border-y border-emerald-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
              Our Core Principles
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Built on Trust, Precision, and Integrity
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Four non-negotiable promises that govern every decision we make.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs hover:shadow-md transition space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {pillar.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{pillar.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{pillar.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Journey & Milestones */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
            Timeline of Progress
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            From a Passion Project to National Leader
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            A constant drive to raise the bar for consumer satisfaction.
          </p>
        </div>

        <div className="relative border-l-2 border-emerald-200 ml-4 sm:ml-8 space-y-8 py-2">
          {milestones.map((m, idx) => (
            <div key={idx} className="relative pl-6 sm:pl-8 group">
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-emerald-600 group-hover:scale-125 transition-transform" />
              <div className="space-y-1">
                <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {m.year}
                </span>
                <h3 className="text-base font-bold text-gray-900">{m.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Bottom Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#0c261e] to-emerald-900 text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Upgrade Your Shopping Experience?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
              Enjoy 100% verified authentic goods, express doorstep delivery across Bangladesh, and our signature 30-day return warranty.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate && onNavigate('shop')}
              className="px-6 py-3 rounded-xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition cursor-pointer shadow-md"
            >
              Start Shopping Now
            </button>
            <button
              onClick={() => onNavigate && onNavigate('contact')}
              className="px-6 py-3 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-medium text-xs sm:text-sm border border-emerald-600/50 transition cursor-pointer"
            >
              Get in Touch
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
