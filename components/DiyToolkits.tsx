
import React from 'react';
import { ShoppingCart, Star, Wrench, ShieldCheck, ArrowRight, ExternalLink } from './Icons';

const DIY_PRODUCTS = [
  {
    name: "NOCO Boost Plus GB40 1000A Jump Starter",
    desc: "Compact and powerful lithium-ion jump starter for dead batteries.",
    usage: "Emergency engine starts without needing a second vehicle.",
    rating: 4.8,
    img: "https://m.media-amazon.com/images/I/71hJgp07X1L._AC_SL1500_.jpg",
    url: "https://www.amazon.com/s?k=NOCO+Boost+Plus+GB40"
  },
  {
    name: "BlueDriver Bluetooth Pro OBDII Scan Tool",
    desc: "Professional grade diagnostic tool that works with your smartphone.",
    usage: "Decode check engine lights and view real-time engine data.",
    rating: 4.7,
    img: "https://m.media-amazon.com/images/I/61ybpjOSa1L._AC_SX679_.jpg",
    url: "https://www.amazon.com/s?k=BlueDriver+Bluetooth+Pro+OBDII"
  },
  {
    name: "AstroAI Digital Tire Pressure Gauge 150 PSI",
    desc: "Highly accurate digital gauge with backlit display and lighted nozzle.",
    usage: "Ensure tires are inflated to factory spec for safety and MPG.",
    rating: 4.8,
    img: "https://m.media-amazon.com/images/I/61EZNZQXXfL._SL1500_.jpg",
    url: "https://www.amazon.com/s?k=AstroAI+Digital+Tire+Pressure+Gauge"
  },
  {
    name: "DEWALT Mechanics Tool Set, 1/4\" & 3/8\" Drive",
    desc: "84-piece comprehensive set with sockets, ratchets, and hex keys.",
    usage: "Basic mechanical repairs and part replacements at home.",
    rating: 4.9,
    img: "https://m.media-amazon.com/images/I/81wL6a+f13L._AC_SL1500_.jpg",
    url: "https://www.amazon.com/s?k=DEWALT+Mechanics+Tool+Set"
  },
  {
    name: "resqme Car Escape Tool Keychain",
    desc: "Original seatbelt cutter and window breaker emergency tool.",
    usage: "Life-saving emergency extraction if trapped inside the vehicle.",
    rating: 4.7,
    img: "https://m.media-amazon.com/images/I/61XL3H+JhvL._AC_SL1080_.jpg",
    url: "https://www.amazon.com/s?k=resqme+Car+Escape+Tool"
  },
  {
    name: "EPAuto 12V DC Portable Air Compressor",
    desc: "Compact tire inflator with auto shut-off and digital display.",
    usage: "Fill tires on the go or in the driveway without a gas station.",
    rating: 4.5,
    img: "https://m.media-amazon.com/images/I/81W+7QvYtLL._AC_SL1500_.jpg",
    url: "https://www.amazon.com/s?k=EPAuto+12V+Portable+Air+Compressor"
  },
  {
    name: "Heavy Duty Jumper Cables - 4 Gauge 20 Feet",
    desc: "Thick core cables for jump-starting everything from cars to trucks.",
    usage: "Traditional battery jumping with enough length for any angle.",
    rating: 4.7,
    img: "https://m.media-amazon.com/images/I/71omAGygmbL._AC_SL1500_.jpg",
    url: "https://www.amazon.com/s?k=Heavy+Duty+Jumper+Cables"
  },
  {
    name: "AAA First Aid Kit - 121 Piece Roadside Medical",
    desc: "Official AAA branded kit with everything for minor injuries.",
    usage: "Treatment of cuts, scrapes, and bruises during road travel.",
    rating: 4.6,
    img: "https://m.media-amazon.com/images/I/71YnrvxxZOL._AC_SL1500_.jpg",
    url: "https://www.amazon.com/s?k=AAA+First+Aid+Kit"
  },
  {
    name: "Gorilla Grip Durable Utility Work Gloves",
    desc: "Maximum grip technology with high dexterity and palm protection.",
    usage: "Keep hands clean and safe while working under the hood.",
    rating: 4.6,
    img: "https://m.media-amazon.com/images/I/81jfLkUeXfL._AC_SL1500_.jpg",
    url: "https://www.amazon.com/s?k=Gorilla+Grip+Work+Gloves"
  }
];

const DiyToolkits: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm font-bold text-blue-600 dark:text-blue-400 mb-8 shadow-sm">
            <Wrench className="w-4 h-4" />
            Essential Driver Gear
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
          DIY Fixes <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
             & Essential Toolkits
          </span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg sm:text-xl leading-relaxed font-medium">
          Stop paying dealer markups. We've curated the absolute must-have tools for every vehicle owner to handle roadside emergencies and home maintenance.
        </p>
      </div>

      {/* 3x3 Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {DIY_PRODUCTS.map((product, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden">
            <div className="aspect-square w-full rounded-2xl bg-slate-50 dark:bg-slate-800/50 mb-8 flex items-center justify-center p-6 overflow-hidden border border-slate-100 dark:border-slate-700">
              <img 
                src={product.img} 
                alt={product.name} 
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
              />
            </div>
            
            <div className="flex-grow flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 text-orange-400">
                  {[...Array(5)].map((_, si) => (
                    <Star key={si} className={`w-3 h-3 ${si < Math.floor(product.rating) ? 'fill-current' : 'opacity-30'}`} />
                  ))}
                  <span className="text-[10px] font-black ml-1 text-slate-400">{product.rating}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">Essential</span>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 leading-tight min-h-[3rem] group-hover:text-blue-600 transition-colors">
                {product.name}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 leading-relaxed line-clamp-2">
                {product.desc}
              </p>
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  <span className="text-blue-500 font-black">Best for:</span> {product.usage}
                </p>
                <a 
                  href={product.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#FF9900] text-white font-black text-sm hover:bg-[#e68a00] transition-all shadow-lg shadow-orange-500/10 active:scale-95"
                >
                  Buy on Amazon <ShoppingCart className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main CTA */}
      <div className="text-center">
        <a 
          href="https://Autospex.short.gy/Z9WMx3" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-12 py-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-500/20 group"
        >
          View All Products on Amazon.com
          <ExternalLink className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </a>
        <p className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-500" /> Professional Grade Recommendations
        </p>
        <p className="mt-2 text-[10px] text-slate-500 italic max-w-xs mx-auto">
          *As an Amazon Associate, AutoSpex earns from qualifying purchases. Products are selected for performance and utility.
        </p>
      </div>
    </div>
  );
};

export default DiyToolkits;
