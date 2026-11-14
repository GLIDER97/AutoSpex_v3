
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateContent, Type } from '../utils/gemini';
import {
  ShieldAlert, ShoppingCart, Zap, ArrowRight,
  Car, ShieldCheck, ExternalLink, Star, DollarSign,
  Award, Globe, CheckCircle2, MapPin, RefreshCw,
  Search, Clock, AlertTriangle, Info, ChevronRight,
  Target, Bot, Gauge, Image as ImageIcon, Wrench, Package
} from './Icons';
import CouponLeadForm from './CouponLeadForm';

interface ResourceHubProps {
  type: 'recalls' | 'toolkits' | 'coupons';
}

const ESSENTIAL_DRIVERS_GEAR = [
  {
    name: "NOCO Boost Plus GB40 1000A Jump Starter",
    tag: "Emergency",
    img: "https://m.media-amazon.com/images/I/81N064D7S3L._AC_SL1500_.jpg",
    url: "https://www.amazon.com/s?k=NOCO+Boost+Plus+GB40"
  },
  {
    name: "AstroAI Digital Tire Pressure Gauge 150 PSI",
    tag: "Must-Have",
    img: "https://m.media-amazon.com/images/I/61EZNZQXXfL._SL1500_.jpg",
    url: "https://www.amazon.com/s?k=AstroAI+Digital+Tire+Pressure+Gauge"
  },
  {
    name: "DEWALT Mechanics Tool Set, 1/4\" & 3/8\" Drive",
    tag: "Roadside Safety",
    img: "https://m.media-amazon.com/images/I/81vW-Jg0vWL._AC_SL1500_.jpg",
    url: "https://www.amazon.com/s?k=DEWALT+Mechanics+Tool+Set"
  },
  {
    name: "BlueDriver Bluetooth Pro OBDII Scan Tool",
    tag: "Diagnostic",
    img: "https://m.media-amazon.com/images/I/61ybpjOSa1L._AC_SX679_.jpg",
    url: "https://www.amazon.com/s?k=BlueDriver+Bluetooth+Pro+OBDII"
  },
  {
    name: "First Aid Kit - 200 Piece Roadside Medical",
    tag: "Emergency",
    img: "https://m.media-amazon.com/images/I/91t6I7V0uFL._AC_SL1500_.jpg",
    url: "https://www.amazon.com/s?k=First+Aid+Kit+Car"
  },
  {
    name: "resqme Car Escape Tool Keychain Seatbelt Cutter",
    tag: "Must-Have",
    img: "https://m.media-amazon.com/images/I/61hX4E3QnSL._AC_SL1500_.jpg",
    url: "https://www.amazon.com/s?k=resqme+Car+Escape+Tool"
  },
  {
    name: "Heavy Duty Jumper Cables - 4 Gauge 20 Feet",
    tag: "Roadside Safety",
    img: "https://m.media-amazon.com/images/I/81o+C7R0AHL._AC_SL1500_.jpg",
    url: "https://www.amazon.com/s?k=Heavy+Duty+Jumper+Cables"
  },
  {
    name: "ThruNite Archer 2A V3 500 Lumens Flashlight",
    tag: "Emergency",
    img: "https://m.media-amazon.com/images/I/61Z6vj0yqJL._AC_SL1000_.jpg",
    url: "https://www.amazon.com/s?k=ThruNite+Archer+2A+V3"
  },
  {
    name: "Rain-X 2-in-1 Glass Cleaner and Repellent",
    tag: "Must-Have",
    img: "https://m.media-amazon.com/images/I/713B8vX4H5L._AC_SL1500_.jpg",
    url: "https://www.amazon.com/s?k=Rain-X+2-in-1"
  }
];

const ResourceHub: React.FC<ResourceHubProps> = ({ type }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loadingStatus, setLoadingStatus] = useState('Initializing Scanner...');

  // Coupon Form State
  const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);

  const fetchDynamicContent = async (query?: string) => {
    setLoading(true);
    setError(null);

    // UI Status messaging for transparency
    const statusMessages = [
      "Accessing official databases...",
      "Auditing recent safety reports...",
      "Syncing US market data...",
      "AI cross-referencing records...",
      "Finalizing report results..."
    ];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      setLoadingStatus(statusMessages[msgIndex]);
      msgIndex = (msgIndex + 1) % statusMessages.length;
    }, 1200);

    try {
      let prompt = '';
      let schema: any = {};

      if (type === 'recalls') {
        prompt = `
          Act as a Safety Compliance Auditor. Provide a list of the 6 most significant or recent automotive safety recalls in the US market for ${query || 'general top-selling makes'}.
          Focus on high-impact safety issues (Airbags, Engines, Brakes).
          Return strictly valid JSON with an array called "items".
          Each item must have: make, model, year, issue, component, urgency (Critical/High/Medium), summary (max 100 chars), and nhtsaId.
        `;
        schema = {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  make: { type: Type.STRING },
                  model: { type: Type.STRING },
                  year: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  component: { type: Type.STRING },
                  urgency: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  nhtsaId: { type: Type.STRING }
                },
                required: ['make', 'model', 'year', 'issue', 'component', 'urgency', 'summary']
              }
            }
          },
          required: ['items']
        };
      } else if (type === 'toolkits') {
        prompt = `
          Act as a Master Technician. Suggest 6 essential DIY toolkits or high-quality diagnostic parts currently popular on the US market.
          Focus on tools like OBDII Scanners, Multimeters, and Socket Sets.
          IMPORTANT: Do not include specific price numbers as they fluctuate.
          Each item MUST have a real, working image URL of the product (use high-quality automotive tool photography URLs).
          Return strictly valid JSON with an array called "items".
          Each item must have: name, brand, rating (number 4.0-5.0), category, bestFor, and imageUrl.
        `;
        schema = {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  bestFor: { type: Type.STRING },
                  imageUrl: { type: Type.STRING }
                },
                required: ['name', 'brand', 'rating', 'category', 'bestFor', 'imageUrl']
              }
            }
          },
          required: ['items']
        };
      } else {
        prompt = `
          Provide 6 currently active types of maintenance coupons or regional service deals common in the US.
          Return strictly valid JSON with an array called "items".
          Each item must have: shop, offer, savingValue (e.g. "$20 Off"), validIn (Regions), and category (Oil Change/Brakes/Tires).
        `;
        schema = {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  shop: { type: Type.STRING },
                  offer: { type: Type.STRING },
                  savingValue: { type: Type.STRING },
                  validIn: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ['shop', 'offer', 'savingValue', 'validIn', 'category']
              }
            }
          },
          required: ['items']
        };
      }

      const response = await generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });

      const data = JSON.parse(response.text);
      setItems(data.items || []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error("Automation Error:", err);
      setError("The automated feed is currently syncing. Please try again in a few moments.");
    } finally {
      clearInterval(msgInterval);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicContent();
  }, [type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchDynamicContent(searchQuery);
    }
  };

  const handleClaimCoupon = (item: any) => {
    setSelectedCoupon(item);
    setIsCouponFormOpen(true);
  };

  const getHeaderInfo = () => {
    switch (type) {
      case 'recalls': return {
        title: "Recalls & Safety Alerts",
        subtitle: "Automated NHTSA Compliance Feed",
        desc: "Protect your passengers with real-time safety data. Our AI audits the official NHTSA database to bring you critical manufacture alerts.",
        icon: <ShieldAlert className="w-10 h-10 text-red-500" />,
        color: "text-red-500",
        bg: "bg-red-50 dark:bg-red-950/20"
      };
      case 'toolkits': return {
        title: "DIY Fixes & Toolkits",
        subtitle: "AI Curated Enthusiast Gear",
        desc: "Stop paying dealer markups. We find the exact tools and parts used by master technicians for reliable home repairs.",
        icon: null,
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-950/20"
      };
      case 'coupons': return {
        title: "Service Coupons",
        subtitle: "Live Maintenance Deal Tracker",
        desc: "Scan your region for the best savings on oil changes, brakes, and diagnostic services from national authorized networks.",
        icon: <Zap className="w-10 h-10 text-emerald-500" />,
        color: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/20"
      };
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <CouponLeadForm
        isOpen={isCouponFormOpen}
        onClose={() => setIsCouponFormOpen(false)}
        couponData={selectedCoupon}
      />

      {/* Dynamic Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-16">
        <div
          className={`flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left transition-all duration-300 ${type === 'recalls' ? 'cursor-pointer hover:opacity-80 active:scale-[0.98]' : ''}`}
          onClick={() => type === 'recalls' && navigate('/vin-lookup')}
        >
          {header.icon && (
            <div className={`p-6 rounded-[2.5rem] ${header.bg} shadow-2xl border border-white/10 shrink-0`}>
              {header.icon}
            </div>
          )}
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full ${header.bg} ${header.color} text-[10px] font-black uppercase tracking-widest border border-current/20`}>
                Live Automation Active
              </span>
              {lastUpdated && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Updated {lastUpdated}
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">{header.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl leading-relaxed font-medium">{header.desc}</p>
          </div>
        </div>

        {/* Action / Search Bar (Restored for Recalls) */}
        {type === 'recalls' && (
          <div className="w-full lg:w-auto shrink-0">
            <form onSubmit={handleSearch} className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-[1.8rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-1.5">
                <div className="pl-4 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search Make (e.g. Ford)"
                  className="w-full lg:w-64 p-3 bg-transparent border-none text-slate-900 dark:text-white font-bold placeholder-slate-400 focus:ring-0 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="px-6 py-3 rounded-2xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-all">
                  Audit Make
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="w-full flex flex-col items-center justify-center py-24 animate-in fade-in zoom-in duration-500">
          <div className="relative mb-12">
            <div className="absolute -inset-8 bg-brand-primary/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-brand-primary border-transparent rounded-full animate-spin"></div>
              <Bot className="w-12 h-12 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary/40 shadow-[0_0_15px_rgba(245,158,11,0.5)] rounded-full animate-[scan_2s_ease-in-out_infinite]" />
          </div>

          <div className="text-center space-y-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{loadingStatus}</h3>
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce delay-200"></span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Syncing with official US market safety datasets...</p>
          </div>

          <style>{`
            @keyframes scan {
              0% { top: 10%; opacity: 0; }
              50% { opacity: 1; }
              100% { top: 90%; opacity: 0; }
            }
          `}</style>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-[2.5rem] p-12 text-center mb-20">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Feed Connection Interrupted</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-8">{error}</p>
          <button onClick={() => fetchDynamicContent()} className="px-8 py-3 bg-red-600 text-white font-black rounded-2xl flex items-center gap-2 mx-auto hover:bg-red-700 transition-all">
            <RefreshCw className="w-5 h-5" /> Retry Sync
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {items.map((item: any, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">

                {type === 'recalls' && (
                  <>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border ${item.urgency === 'Critical' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                      }`}>
                      <ShieldAlert className="w-3 h-3" /> {item.urgency} Risk Alert
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                      {item.year} {item.make} {item.model}
                    </h3>
                    <div className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4">
                      Component: {item.component}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed flex-grow">
                      <strong>Issue:</strong> {item.issue}<br />
                      <span className="mt-2 block italic opacity-80">{item.summary}</span>
                    </p>
                    <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <a
                        href={`https://www.nhtsa.gov/recalls?q=${item.make}+${item.model}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl"
                      >
                        Check My VIN <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </>
                )}

                {type === 'toolkits' && (
                  <>
                    {/* High Quality Product Image Display */}
                    <div className="aspect-square w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 mb-6 flex items-center justify-center overflow-hidden transition-colors">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                      ) : (
                        <div className="relative">
                          <ImageIcon className="w-12 h-12 text-slate-200 dark:text-slate-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1 text-orange-400">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.floor(item.rating) ? 'fill-current' : 'opacity-30'}`} />)}
                        <span className="text-[10px] font-black ml-1 text-slate-400">{item.rating}</span>
                      </div>
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.category}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight min-h-[3.5rem]">{item.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed flex-grow">
                      <strong>Best for:</strong> {item.bestFor}<br />
                      <span className="text-xs text-slate-400 font-bold block mt-2">Verified Brand: {item.brand}</span>
                    </p>
                    <a
                      href={`https://www.amazon.com/s?k=${encodeURIComponent(item.name + ' ' + item.brand)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-orange-500 text-slate-900 font-black text-sm hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20"
                    >
                      View on Amazon <ShoppingCart className="w-4 h-4" />
                    </a>
                  </>
                )}

                {type === 'coupons' && (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-emerald-100 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Exclusive Deal Found
                    </div>
                    <div className="text-4xl font-black text-emerald-600 mb-2">{item.savingValue}</div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{item.offer}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed flex-grow">
                      <strong>Partner:</strong> {item.shop}<br />
                      <span className="text-xs text-slate-400 font-bold block mt-2">Active in: {item.validIn}</span>
                    </p>
                    <button
                      onClick={() => handleClaimCoupon(item)}
                      className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20"
                    >
                      Claim Digital Coupon <ExternalLink className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Persistent Essential Gear Grid for DIY Toolkits page */}
          {type === 'toolkits' && (
            <div className="mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Master Technician Essentials</h2>
                  <p className="text-slate-500 text-lg font-medium">Standard gear every driver should carry for roadside safety and diagnostics.</p>
                </div>
                <div className="flex items-center gap-2 text-orange-500 bg-orange-500/5 px-5 py-2.5 rounded-full border border-orange-500/20 shadow-sm">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-xs font-black uppercase tracking-widest">Driver Essentials</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ESSENTIAL_DRIVERS_GEAR.map((item, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden">
                    <div className="aspect-video w-full rounded-2xl bg-slate-50 dark:bg-slate-800 mb-6 flex items-center justify-center overflow-hidden">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-grow flex flex-col">
                      <div className="inline-flex mb-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {item.tag}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 mb-6 leading-snug h-10">
                        {item.name}
                      </h3>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs hover:opacity-90 transition-all mt-auto"
                      >
                        Buy on Amazon <ShoppingCart className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-8 font-medium italic">
                *As an Amazon Associate, MyAutoSpex earns from qualifying purchases. These products are selected for utility and performance.
              </p>
            </div>
          )}
        </>
      )}

      {/* Trust & Methodology Section */}
      <div className="bg-slate-950 rounded-[3rem] p-12 sm:p-20 border border-slate-800 shadow-2xl relative overflow-hidden text-center sm:text-left">
        <div className="absolute top-0 right-0 p-12 opacity-5 hidden sm:block">
          <Bot className="w-64 h-64 text-brand-primary -rotate-12" />
        </div>
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black uppercase tracking-widest mb-8 border border-brand-primary/20">
              <ShieldCheck className="w-4 h-4" /> Verified Data Engine
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">Automated Automotive Intelligence</h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">
              The MyAutoSpex Resource Hub uses high-fidelity AI to audit global automotive datasets. We provide US drivers with a transparent look at safety hazards, maintenance savings, and professional-grade tools.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-8 justify-center sm:justify-start">
              <div className="flex flex-col items-center sm:items-start gap-2">
                <div className="text-2xl font-black text-white">1.2M+</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Safety Records Audited</div>
              </div>
              <div className="h-10 w-px bg-slate-800 hidden sm:block"></div>
              <div className="flex flex-col items-center sm:items-start gap-2">
                <div className="text-2xl font-black text-white">98.4%</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Match Accuracy</div>
              </div>
              <div className="h-10 w-px bg-slate-800 hidden sm:block"></div>
              <div className="flex flex-col items-center sm:items-start gap-2">
                <div className="text-2xl font-black text-white">24/7</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Auto-Update Cycle</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-white leading-tight">Our Monetization Integrity</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">
              To keep these tools free, we partner with verified US services. If you purchase through our toolkits or check a VIN, we may earn a small commission at no extra cost to you. This directly funds our live database access.
            </p>
            <div className="space-y-4">
              {[
                { icon: <ShieldCheck className="w-5 h-5 text-green-500" />, text: "Authorized Dealer Referral Network" },
                { icon: <Globe className="w-5 h-5 text-blue-500" />, text: "Direct US Government Data Access" },
                { icon: <Award className="w-5 h-5 text-orange-500" />, text: "Zero Sponsored Content - Merit Only" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-xs font-black text-slate-200">
                  {item.icon} {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 flex flex-col items-center gap-8 no-print">
        <button
          onClick={() => fetchDynamicContent()}
          className="group flex items-center gap-3 px-10 py-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black hover:border-blue-500 transition-all shadow-xl"
        >
          <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          Sync Latest Feed
        </button>
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest max-w-sm text-center">
          *As an Amazon and partner Associate, MyAutoSpex earns from qualifying purchases. Data is provided for informational safety audits only.
        </p>
      </div>
    </div>
  );
};

export default ResourceHub;
