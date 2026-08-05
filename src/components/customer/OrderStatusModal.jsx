import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, CheckCircle2, ChefHat, UtensilsCrossed, X, ShieldAlert, Sparkles } from 'lucide-react';

export const OrderStatusModal = ({ isOpen, onClose }) => {
  const { lang, activeOrder, t } = useApp();
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds

  useEffect(() => {
    if (!activeOrder) return;

    // Calculate elapsed time from timestamp
    const startTime = new Date(activeOrder.timestamp).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const remaining = Math.max(0, 20 * 60 - elapsedSeconds);
    setTimeLeft(remaining);

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOrder]);

  if (!isOpen || !activeOrder) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Status mapping
  const getStatusStep = (status) => {
    switch (status) {
      case 'pending': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'completed': return 4;
      default: return 1;
    }
  };

  const currentStep = getStatusStep(activeOrder.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-amber-600/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden">
        
        {/* Decorative Saffron Gradient Corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 flex items-center justify-center font-extrabold shadow-lg shadow-orange-950/40">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-100">{t.orderStatusTitle}</h3>
            <p className="text-xs text-amber-400 font-extrabold flex items-center gap-2">
              <span>{t.orderId}: {activeOrder.id}</span>
              <span>•</span>
              <span>{activeOrder.tableNo}</span>
            </p>
          </div>
        </div>

        {/* 20-Min Timer Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/80 via-stone-950 to-amber-950/80 border border-amber-600/30 text-center space-y-1">
          <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider block">
            {t.estimatedTime} (२० मिनिटांचा नियम)
          </span>
          <div className="text-3xl font-black text-amber-300 font-mono tracking-widest">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-[11px] text-stone-400 italic">
            {t.prepNotice}
          </p>
        </div>

        {/* Status Stepper */}
        <div className="py-2 space-y-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            
            {/* Step 1: Received */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition border ${
                currentStep >= 1 ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md' : 'bg-stone-800 text-stone-500 border-stone-700'
              }`}>
                1
              </div>
              <span className={`text-[10px] font-bold ${currentStep >= 1 ? 'text-amber-300' : 'text-stone-500'}`}>
                {t.statusPending}
              </span>
            </div>

            {/* Step 2: Preparing */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition border ${
                currentStep >= 2 ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md' : 'bg-stone-800 text-stone-500 border-stone-700'
              }`}>
                <ChefHat className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold ${currentStep >= 2 ? 'text-amber-300' : 'text-stone-500'}`}>
                {t.statusPreparing}
              </span>
            </div>

            {/* Step 3: Ready */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition border ${
                currentStep >= 3 ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md' : 'bg-stone-800 text-stone-500 border-stone-700'
              }`}>
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold ${currentStep >= 3 ? 'text-amber-300' : 'text-stone-500'}`}>
                {t.statusReady}
              </span>
            </div>

            {/* Step 4: Completed */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition border ${
                currentStep >= 4 ? 'bg-emerald-500 text-stone-950 border-emerald-400 shadow-md' : 'bg-stone-800 text-stone-500 border-stone-700'
              }`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold ${currentStep >= 4 ? 'text-emerald-400' : 'text-stone-500'}`}>
                {t.statusCompleted}
              </span>
            </div>

          </div>

          {/* Progress Bar Line */}
          <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Order Details List */}
        <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 space-y-2 max-h-40 overflow-y-auto">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            {lang === 'mr' ? 'ऑर्डर केलेले पदार्थ:' : 'Ordered Items:'}
          </span>
          {activeOrder.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs text-stone-200">
              <span>
                {lang === 'mr' ? item.nameMr : item.nameEn} x {item.quantity}
                {item.extraThalis > 0 && <strong className="text-amber-400 ml-1">({item.extraThalis} एक्स्ट्रा ताट)</strong>}
              </span>
              <span className="font-bold text-amber-400">₹{item.price * item.quantity + (item.extraThalis || 0) * 60}</span>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800">
          <span className="text-xs font-bold text-stone-300">{t.grandTotal}:</span>
          <span className="text-lg font-black text-amber-400">₹{activeOrder.grandTotal}</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs hover:bg-stone-700 transition"
        >
          {t.close}
        </button>

      </div>
    </div>
  );
};
