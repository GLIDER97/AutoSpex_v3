
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isDailyLimit, runAiTool } from '../utils/ai';
import { searchRecalls, latestFeaturedRecalls } from '../utils/nhtsaRecalls';
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

interface RecallQuery {
  year: string;
  make: string;
  model: string;
}

const formatReportDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

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
  // Recalls: year/make/model search form, the search being shown, and a line describing the results
  const [recallForm, setRecallForm] = useState<RecallQuery>({ year: '', make: '', model: '' });
  const [recallSearch, setRecallSearch] = useState<RecallQuery | null>(null);
  const [feedNote, setFeedNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loadingStatus, setLoadingStatus] = useState('Initializing Scanner...');

  // Coupon Form State
  const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);

  // Only the most recent request may update the page (e.g. a search submitted
  // while the default recall list is still loading).
  const latestRequest = useRef(0);

  // Recalls come straight from NHTSA's public recalls API (no AI, no API key).
  const loadRecalls = async (query?: RecallQuery): Promise<{ recalls: any[]; note: string }> => {
    if (!query) {
      return {
        recalls: await latestFeaturedRecalls(),
        note: 'Latest NHTSA recalls on best-selling vehicles. Enter your year, make and model above to check yours.',
      };
    }
    const result = await searchRecalls(Number(query.year), query.make, query.model);
    if (!result.recalls.length) {
      return {
        recalls: [],
        note: `NHTSA has no recalls on record for a ${query.year} ${result.make ?? query.make} ${query.model}. If that looks wrong, try the model name as NHTSA lists it (for example CR-V, F-150 or C-Class).`,
      };
    }
    const [first, ...others] = result.models;
    const models = others.length ? `${first} (and ${others.length} related model${others.length === 1 ? '' : 's'})` : first;
    return {
      recalls: result.recalls,
      note: `${result.recalls.length} NHTSA recall${result.recalls.length === 1 ? '' : 's'} for the ${query.year} ${result.make} ${models}, newest first.`,
    };
  };

  const fetchDynamicContent = async (recallQuery?: RecallQuery) => {
    const requestId = ++latestRequest.current;
    const isCurrent = () => requestId === latestRequest.current;
    setLoading(true);
    setError(null);

    // UI Status messaging for transparency
    const statusMessages = type === 'recalls' ? [
      "Connecting to the NHTSA recalls database...",
      "Loading official recall records...",
      "Sorting newest recalls first..."
    ] : [
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
      if (type === 'recalls') {
        const { recalls, note } = await loadRecalls(recallQuery);
        if (!isCurrent()) return;
        setItems(recalls);
        setFeedNote(note);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return;
      }

      // The server writes the feed prompts (api/_tools.ts).
      const response = await runAiTool(type === 'toolkits' ? 'diy-toolkits' : 'service-promos', {});
      const data = response.data ?? {};
      if (!isCurrent()) return;
      setItems(data.items || []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error("Automation Error:", err);
      if (!isCurrent()) return;
      setError(type === 'recalls'
        ? "We couldn't reach the NHTSA recalls database. Please try again in a moment."
        : isDailyLimit(err)
          ? err.message
          : "The automated feed is currently syncing. Please try again in a few moments.");
    } finally {
      clearInterval(msgInterval);
      if (isCurrent()) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicContent();
  }, [type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = { year: recallForm.year.trim(), make: recallForm.make.trim(), model: recallForm.model.trim() };
    if (!query.year || !query.make || !query.model) return;
    setRecallSearch(query);
    fetchDynamicContent(query);
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
        desc: "Protect your passengers with official safety data. Every recall here comes straight from the NHTSA recalls database. Enter your year, make and model to check your vehicle.",
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
        subtitle: "Typical service promotions",
        desc: "Typical promotions on oil changes, brakes and tires that national chains advertise, found by AI. Confirm current terms with the shop, or ask local shops for their own offers.",
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
          <div className="w-full lg:w-104 shrink-0">
            <form onSubmit={handleSearch} className="group relative">
              <div className="absolute -inset-1 bg-linear-to-r from-red-500 to-orange-600 rounded-4xl blur-sm opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-white dark:bg-slate-900 rounded-[1.8rem] border border-slate-200 dark:border-slate-800 shadow-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3 px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Search className="w-4 h-4" /> Check your vehicle
                </div>
                <div className="grid grid-cols-[5.5rem_1fr_1fr] gap-2 mb-3">
                  {([
                    { key: 'year', placeholder: 'Year', label: 'Model year', type: 'number' },
                    { key: 'make', placeholder: 'Make (Ford)', label: 'Make', type: 'text' },
                    { key: 'model', placeholder: 'Model (F-150)', label: 'Model', type: 'text' },
                  ] as const).map((field) => (
                    <input
                      key={field.key}
                      type={field.type}
                      required
                      aria-label={field.label}
                      placeholder={field.placeholder}
                      {...(field.type === 'number' ? { min: 1950, max: new Date().getFullYear() + 1, inputMode: 'numeric' as const } : {})}
                      className="w-full min-w-0 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-bold placeholder-slate-400 focus:ring-2 focus:ring-red-500 outline-hidden"
                      value={recallForm[field.key]}
                      onChange={(e) => setRecallForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    />
                  ))}
                </div>
                <button type="submit" className="w-full px-6 py-3 rounded-2xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-all">
                  Check Recalls
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
          <button onClick={() => fetchDynamicContent(recallSearch ?? undefined)} className="px-8 py-3 bg-red-600 text-white font-black rounded-2xl flex items-center gap-2 mx-auto hover:bg-red-700 transition-all">
            <RefreshCw className="w-5 h-5" /> Retry Sync
          </button>
        </div>
      ) : (
        <>
          {type === 'recalls' && feedNote && (
            <p className="mb-8 text-sm font-bold text-slate-500 dark:text-slate-400">{feedNote}</p>
          )}
          {type === 'coupons' && (
            <p className="mb-8 text-sm font-bold text-slate-500 dark:text-slate-400">
              These are typical promotions found by AI, not coupons. Offers and terms change, so confirm with the shop before you go.
            </p>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {items.map((item: any, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">

                {type === 'recalls' && (
                  <>
                    {/* NHTSA's own advisories: "Park It" (do not drive) and "Park Outside" (fire risk) */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border ${item.parkIt || item.parkOutside ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                      }`}>
                      <ShieldAlert className="w-3 h-3" /> {item.parkIt ? 'Do Not Drive' : item.parkOutside ? 'Park Outside' : 'Safety Recall'}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                      {item.modelYear} {item.make} {item.model}
                    </h3>
                    <div className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4">
                      Component: {item.component.replace(/:/g, ' › ')}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed grow space-y-3">
                      <p className="line-clamp-5">{item.summary}</p>
                      {item.consequence && <p><strong>Risk:</strong> {item.consequence}</p>}
                      {item.remedy && <p className="line-clamp-3"><strong>Remedy:</strong> {item.remedy}</p>}
                    </div>
                    <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        NHTSA Campaign {item.campaignNumber}{item.reportDate && ` · Reported ${formatReportDate(item.reportDate)}`}
                      </div>
                      <a
                        href="https://www.nhtsa.gov/recalls"
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
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight min-h-14">{item.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed grow">
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
                      <CheckCircle2 className="w-3 h-3" /> Typical deal to ask about
                    </div>
                    <div className="text-4xl font-black text-emerald-600 mb-2">{item.savingValue}</div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{item.offer}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed grow">
                      <strong>Often offered by:</strong> {item.shop}<br />
                      <span className="text-xs text-slate-400 font-bold block mt-2">Where: {item.validIn}</span>
                    </p>
                    <button
                      onClick={() => handleClaimCoupon(item)}
                      className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20"
                    >
                      Get offers from local shops <ExternalLink className="w-4 h-4" />
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
                <div className="flex items-center gap-2 text-orange-500 bg-orange-500/5 px-5 py-2.5 rounded-full border border-orange-500/20 shadow-xs">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-xs font-black uppercase tracking-widest">Driver Essentials</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ESSENTIAL_DRIVERS_GEAR.map((item, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden">
                    <div className="aspect-video w-full rounded-2xl bg-slate-50 dark:bg-slate-800 mb-6 flex items-center justify-center overflow-hidden">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="grow flex flex-col">
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
          onClick={() => fetchDynamicContent(recallSearch ?? undefined)}
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
