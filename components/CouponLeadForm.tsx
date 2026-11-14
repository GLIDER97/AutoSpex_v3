
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Phone, Mail, MapPin, CheckCircle2, RefreshCw, ArrowRight, Zap, ShieldCheck } from './Icons';
import { saveLead } from '../utils/leadStorage';

interface CouponLeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  couponData: any;
}

const CouponLeadForm: React.FC<CouponLeadFormProps> = ({ isOpen, onClose, couponData }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    zip: ''
  });

  if (!isOpen) return null;

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const leadEntry = {
      timestamp: new Date().toISOString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone || 'Not provided',
      zip: formData.zip,
      shop: couponData?.shop,
      offer: couponData?.offer,
      savingValue: couponData?.savingValue,
      source: 'Service_Coupons_Claim_Tool'
    };



    await saveLead('digital_coupon_leads.json', leadEntry);

    setLoading(false);
    setSubmitted(true);
  };

  return createPortal(
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

        {!submitted && (
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        )}

        <div className="p-8 sm:p-10">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>

          {!submitted ? (
            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Claim Coupon</h2>
                    <p className="text-slate-500 text-sm">Enter your details to receive your digital voucher for {couponData?.shop}.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <Users className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-4 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-4 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!formData.name || !formData.email}
                    className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-emerald-500/10"
                  >
                    Next Step <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Regional Verification</h2>
                    <p className="text-slate-500 text-sm">Ensure this offer is valid in your area.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <Phone className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="Phone Number (Optional)"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-4 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="ZIP Code"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                        className="w-full p-4 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button type="button" onClick={handleBack} className="flex-1 py-4 font-bold text-slate-500">Back</button>
                    <button
                      type="submit"
                      disabled={loading || formData.zip.length < 5}
                      className="flex-2 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Claim My Coupon'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="text-center py-10 animate-in zoom-in-90 duration-500">
              <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Request Successful!</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xs mx-auto font-medium leading-relaxed">
                Your coupon details will be mailed to you shortly.
              </p>
              <button
                onClick={onClose}
                className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:opacity-90 transition-all shadow-xl"
              >
                Return to Hub
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CouponLeadForm;
