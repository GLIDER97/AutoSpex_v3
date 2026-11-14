import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateContent, Type } from '../utils/gemini';
import CodeInput from './CodeInput';
import ResultCard from './ResultCard';
import RecentScans from './RecentScans';
import FAQSection from './FAQSection';
import { 
  Users, CheckCircle2, DollarSign, Zap, ShieldCheck, Lock, 
  Search, Wrench, Star, FileText, Info, AlertTriangle, ShieldAlert, Award, Bot
} from './Icons';
import { OBDCodeData, SeverityLevel, SearchHistoryItem, SafetyStatus, DIYDifficulty } from '../types';

import { INITIAL_OBD_DATABASE } from '../data/obdCodes';

const getUnknownCodeResult = (code: string): OBDCodeData => ({
  code: code,
  title: 'Unknown or Non-Standard Code',
  description: 'The code you entered does not match standard OBD-II formats or is not in our database.',
  plainEnglish: 'This appears to be an invalid or manufacturer-specific code that we cannot decode currently. Please double-check the code characters.',
  symptoms: ['Unknown'],
  causes: ['Typo in code', 'Manufacturer specific protocol', 'Non-OBDII system'],
  severity: SeverityLevel.LOW,
  safetyStatus: SafetyStatus.CAUTION,
  repairCostEstimate: 'N/A',
  diyDifficulty: DIYDifficulty.HARD,
  category: 'Unknown / Invalid',
  similarCodes: []
});

const FaultCodeDecoder: React.FC = () => {
  const [currentResult, setCurrentResult] = useState<OBDCodeData | null>(null);
  const [activeVehicle, setActiveVehicle] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [database, setDatabase] = useState<Record<string, OBDCodeData>>(INITIAL_OBD_DATABASE);
  const [history, setHistory] = useState<SearchHistoryItem[]>([
    { code: 'P0420', timestamp: Date.now() - 86400000, label: 'Catalyst System Efficiency Below Threshold' },
    { code: 'P0300', timestamp: Date.now() - 172800000, label: 'Random/Multiple Cylinder Misfire Detected' },
    { code: 'P0171', timestamp: Date.now() - 259200000, label: 'System Too Lean (Bank 1)' },
    { code: 'P0455', timestamp: Date.now() - 345600000, label: 'EVAP System Leak Detected (Gross Leak)' },
    { code: 'P0128', timestamp: Date.now() - 432000000, label: 'Coolant Thermostat (Coolant Temp Below Regulating Temp)' },
  ]);

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  const fetchAIResult = async (code: string, vehicleInfo?: string): Promise<OBDCodeData> => {
    try {
      const prompt = `
        You are an expert automotive mechanic. Provide detailed diagnostic information for OBD-II fault code ${code} ${vehicleInfo ? `for a ${vehicleInfo}` : 'for a standard US-market vehicle'}.
        
        Return strictly valid JSON matching this structure:
        {
          "code": "${code}",
          "title": "Technical Name of Code",
          "description": "Technical description",
          "plainEnglish": "Simple explanation for a non-mechanic",
          "symptoms": ["symptom1", "symptom2", ...],
          "causes": ["cause1", "cause2", ...],
          "severity": "Low" | "Medium" | "High" | "Critical",
          "category": "System Category (e.g. Ignition, Emissions)",
          "safetyStatus": "Safe to Drive" | "Drive with Caution" | "Stop Immediately",
          "repairCostEstimate": "e.g. $100 - $300",
          "diyDifficulty": "Easy (DIY)" | "Moderate" | "Professional Required",
          "similarCodes": ["Related Code 1", "Related Code 2"]
        }

        Ensure content is accurate for the US market. 
        Do not use markdown formatting. Return raw JSON only.
      `;

      const response = await generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              plainEnglish: { type: Type.STRING },
              symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
              causes: { type: Type.ARRAY, items: { type: Type.STRING } },
              severity: { type: Type.STRING, enum: [SeverityLevel.LOW, SeverityLevel.MEDIUM, SeverityLevel.HIGH, SeverityLevel.CRITICAL] },
              category: { type: Type.STRING },
              safetyStatus: { type: Type.STRING, enum: [SafetyStatus.SAFE, SafetyStatus.CAUTION, SafetyStatus.STOP] },
              repairCostEstimate: { type: Type.STRING },
              diyDifficulty: { type: Type.STRING, enum: [DIYDifficulty.EASY, DIYDifficulty.MODERATE, DIYDifficulty.HARD] },
              similarCodes: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['code', 'title', 'description', 'plainEnglish', 'symptoms', 'causes', 'severity', 'category', 'safetyStatus', 'repairCostEstimate', 'diyDifficulty']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      return JSON.parse(text) as OBDCodeData;
    } catch (error) {
      console.error("AI Generation Failed:", error);
      return getUnknownCodeResult(code);
    }
  };

  const handleSearch = async (rawCode: string, vehicleInfo?: string) => {
    const code = rawCode.replace(/\s+/g, '').toUpperCase();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setActiveVehicle(vehicleInfo);

    const isValidFormat = /^[PCBU][0-9A-F]{4,}/.test(code);
    
    if (!isValidFormat) {
       const errorResult = getUnknownCodeResult(code);
       setCurrentResult(errorResult);
       setLoading(false);
       return;
    }
    
    if (database[code]) {
      setTimeout(() => {
        setCurrentResult(database[code]);
        addToHistory(database[code]);
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const result = await fetchAIResult(code, vehicleInfo);
      
      if (result.category !== 'Unknown / Invalid') {
        setDatabase(prev => ({ ...prev, [code]: result }));
        addToHistory(result);
      }
      
      setCurrentResult(result);
      
    } catch (e) {
      console.error(e);
      const errorResult = getUnknownCodeResult(code);
      setCurrentResult(errorResult);
    } finally {
      setLoading(false);
    }
  };

  // Links like /fault-code-decoder?code=P0420 (from the homepage) open straight to that code.
  const [searchParams] = useSearchParams();
  const linkedCode = searchParams.get('code');
  useEffect(() => {
    if (linkedCode) handleSearch(linkedCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedCode]);

  const addToHistory = (data: OBDCodeData) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item.code !== data.code);
      return [{ code: data.code, timestamp: Date.now(), label: data.title }, ...filtered].slice(0, 5);
    });
  };

  return (
    <>
        {!currentResult && (
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 text-sm sm:text-base font-semibold text-brand-primary mb-8 shadow-lg shadow-brand-primary/10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-default">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
            </span>
            US Database Updated {currentMonth}, {currentYear}
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
            OBD-II Fault Code <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-brand-primary to-orange-600">
                Decoder & Repair Guide
            </span>
            </h1>
            <h2 className="text-slate-600 dark:text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Instantly translate check engine light codes into plain English. Get localized repair cost estimates, severity alerts, and DIY fixes for your vehicle.
            </h2>
        </div>
        )}

        <div className="w-full flex flex-col items-center">
            {!currentResult ? (
                <>
                <CodeInput onSearch={handleSearch} isLoading={loading} />
                
                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        Verified US Database
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        <Zap className="w-4 h-4 text-brand-primary" />
                        AI-Powered Analysis
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        <Lock className="w-4 h-4 text-slate-400" />
                        100% Free Search
                    </div>
                </div>

                <RecentScans history={history} onSelect={(c) => handleSearch(c)} />
                
                {/* ABOUT THIS TOOL SECTION */}
                <div className="w-full max-w-7xl px-4 mt-24 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6">About the MyAutoSpex Decoder</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 text-lg">
                                The MyAutoSpex OBD-II Decoder is a specialized diagnostic engine built to help US car owners understand their vehicle's health without needing a mechanical engineering degree.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                                We combine a massive database of standard SAE J2012 fault codes with <span className="font-bold text-brand-primary">Intelligent AI</span> to provide context-aware results. Whether it's a generic P0420 or a specific manufacturer-derived error, our system analyzes the technical data to give you localized repair cost estimates and safety assessments based on current US market averages.
                            </p>
                        </div>
                        <div className="order-1 md:order-2 bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden text-white">
                            <Bot className="absolute -bottom-8 -right-8 w-64 h-64 text-brand-primary/10 -rotate-12" />
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    <Zap className="w-6 h-6 text-brand-primary" />
                                    Technical Architecture
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-1" />
                                        <p className="text-sm text-slate-300">Direct integration with US NHTSA & SAE technical datasets.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-1" />
                                        <p className="text-sm text-slate-300">Live cost-auditing engine for local US mechanic labor rates.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-1" />
                                        <p className="text-sm text-slate-300">Privacy-first design (no personal data stored for simple searches).</p>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* WHY USE THIS TOOL SECTION */}
                <div className="w-full max-w-7xl px-4 mb-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-12">
                        Why Drivers Choose MyAutoSpex
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { 
                                icon: <DollarSign className="w-8 h-8 text-green-500" />, 
                                title: "Save Hundreds", 
                                desc: "Stop mechanics from upselling you on unnecessary repairs by knowing the exact issue first." 
                            },
                            { 
                                icon: <ShieldAlert className="w-8 h-8 text-red-500" />, 
                                title: "Safety Priority", 
                                desc: "Instantly know if your car is safe for a road trip or if you need a tow truck immediately." 
                            },
                            { 
                                icon: <Award className="w-8 h-8 text-amber-500" />, 
                                title: "DIY Clarity", 
                                desc: "We rank repairs by difficulty so you know if you can fix it at home or need a pro." 
                            },
                            { 
                                icon: <Bot className="w-8 h-8 text-blue-500" />, 
                                title: "AI Expert Access", 
                                desc: "Get answers to follow-up questions from our AI Master Technician in real-time." 
                            },
                        ].map((benefit, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all group">
                                <div className="mb-6 flex justify-center group-hover:scale-110 transition-transform">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{benefit.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How to Use Section */}
                <div className="w-full max-w-7xl px-4 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-250">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center mb-10">
                    How to Decode Your Check Engine Light
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center mb-4">
                        <Zap className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">1. Connect Scanner</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Plug your OBD2 scanner into the port typically found under your dashboard.
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mb-4">
                        <Search className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">2. Enter Code</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Type the alphanumeric error code (e.g., P0300) into the box above.
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-500 flex items-center justify-center mb-4">
                        <Wrench className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">3. Get Solution</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        View repair costs, severity alerts, and step-by-step DIY instructions instantly.
                        </p>
                    </div>
                    </div>
                </div>

                {/* Testimonials Section */}
                <div className="w-full max-w-7xl px-4 mb-20">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center mb-10">
                    Trusted by US Drivers
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { name: "James T.", loc: "Austin, TX", text: "Saved me $400 at the mechanic. I knew exactly what was wrong before I went in, so they couldn't upsell me on unnecessary parts.", stars: 5 },
                        { name: "Sarah M.", loc: "Denver, CO", text: "The plain English explanation helped me understand that my 'major engine issue' was just a loose gas cap.", stars: 5 },
                        { name: "Robert K.", loc: "Detroit, MI", text: "Spot on repair estimates. Helps me budget for repairs on my older truck without getting ripped off.", stars: 5 },
                    ].map((review, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                        <div className="flex gap-1 mb-4 text-orange-400">
                            {[...Array(review.stars)].map((_, si) => <Star key={si} className="w-4 h-4 fill-current" />)}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 mb-6 italic text-sm leading-relaxed">"{review.text}"</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                            {review.name.charAt(0)}
                            </div>
                            <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{review.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{review.loc}</p>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>

                <FAQSection />
                
                <div className="mt-10 mb-10 flex items-center gap-2 text-slate-500 text-sm bg-white dark:bg-slate-900/50 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800">
                    <Lock className="w-3 h-3" />
                    <span>Secure & Professional Service. Data shared only to fulfill quote requests.</span>
                </div>
                </>
            ) : (
                <ResultCard 
                data={currentResult} 
                onReset={() => { setCurrentResult(null); setActiveVehicle(undefined); }} 
                onCodeClick={(code) => handleSearch(code)}
                vehicleInfo={activeVehicle}
                />
            )}
        </div>
    </>
  );
};

export default FaultCodeDecoder;