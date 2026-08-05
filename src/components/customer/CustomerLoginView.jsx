import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HOTEL_INFO } from '../../data/menuData';
import { OtpVerificationModal } from '../common/OtpVerificationModal';
import { Smartphone, User, ShieldCheck, Sparkles, Utensils, ArrowRight, CheckCircle2 } from 'lucide-react';

export const CustomerLoginView = () => {
  const { lang, loginUser, t } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isOtpOpen, setIsOtpOpen] = useState(false);

  const handleStartOtp = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('कृपया तुमचे नाव टाका (Please enter your name)');
      return;
    }
    if (!phone || phone.length !== 10) {
      setError('कृपया १० अंकी वैध मोबाईल नंबर टाका (Enter 10-digit mobile number)');
      return;
    }
    setError('');
    setIsOtpOpen(true);
  };

  const handleOtpSuccess = (verifiedPhone) => {
    setIsOtpOpen(false);
    loginUser(name, verifiedPhone);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-amber-600/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Top Flag Banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600" />

        {/* Branding & Welcome */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center mx-auto shadow-xl shadow-orange-950/50 border border-amber-400/40">
            <span className="text-3xl font-black">🚩</span>
          </div>
          
          <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-orange-400">
            {lang === 'mr' ? HOTEL_INFO.nameMr : HOTEL_INFO.nameEn}
          </h2>
          <p className="text-xs text-stone-400 font-medium">
            ऑर्डर करण्यासाठी मोबाईल नंबरद्वारे लॉगिन करा (Customer Login)
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleStartOtp} className="space-y-4 pt-2">
          
          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>तुमचे नाव (Customer Name) *</span>
            </label>
            <input
              type="text"
              required
              placeholder="उदा. राहुल पाटील (e.g. Rahul Patil)"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-3 text-xs text-stone-100 placeholder-stone-500 focus:outline-none transition"
            />
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>मोबाईल नंबर (10-Digit Mobile) *</span>
              </span>
              <span className="text-[10px] text-amber-300 font-semibold">SMS OTP पाठवला जाईल</span>
            </label>
            
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 select-none">
                +91
              </span>
              <input
                type="tel"
                maxLength="10"
                required
                placeholder="9822123456"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                className="w-full bg-stone-950 border border-amber-600/40 focus:border-amber-500 rounded-xl pl-12 pr-3.5 py-3 text-sm font-black text-amber-300 tracking-widest placeholder-stone-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs font-bold text-red-400 text-center animate-pulse">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-950/60 hover:scale-[1.02] active:scale-98 transition"
          >
            <span>OTP मिळवा आणि लॉगिन करा (Get OTP & Login)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Feature Points */}
        <div className="pt-4 border-t border-stone-800 grid grid-cols-2 gap-2 text-[11px] text-stone-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>थेट डिजिटल पावती</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>२० मिनिटात जेवण तयार</span>
          </div>
        </div>

      </div>

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        phone={phone}
        onVerified={handleOtpSuccess}
      />
    </div>
  );
};
