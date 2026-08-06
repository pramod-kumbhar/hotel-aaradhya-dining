import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HOTEL_INFO } from '../../data/menuData';
import { Banknote, CreditCard, BookOpen, CheckCircle, X, User, Smartphone, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SettleOrderModal = ({ isOpen, onClose, order, onPrintBill }) => {
  const { lang, settleOrder, t } = useApp();
  const [selectedMethod, setSelectedMethod] = useState('Cash'); // 'Cash', 'UPI', 'Udhar'
  const [customerName, setCustomerName] = useState(order?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(order?.customerPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleSettleAndClose = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      settleOrder(order.id, selectedMethod, customerName, customerPhone);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // optional confetti
      }

      setIsSubmitting(false);
      onClose();

      if (onPrintBill) {
        onPrintBill({
          ...order,
          status: 'completed',
          paymentMethod: selectedMethod,
          customerName: customerName || order.customerName,
          customerPhone: customerPhone || order.customerPhone
        });
      }
    } catch (err) {
      console.error('Error settling order:', err);
      setIsSubmitting(false);
    }
  };

  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `upi://pay?pa=${HOTEL_INFO.upiId}&pn=${encodeURIComponent(HOTEL_INFO.upiName)}&am=${order.grandTotal}&cu=INR`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-amber-600/40 rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5 relative overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Top Flag Decor */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 text-stone-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="space-y-0.5 text-center pt-1">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 mx-auto shadow-md">
            <CheckCircle className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-base font-black text-amber-400">
            पेमेंट जमा करा व बिल पूर्ण करा
          </h3>
          <p className="text-xs text-stone-400">
            स्थान: <strong className="text-amber-300 font-bold">{order.tableNo}</strong> • ऑर्डर क्र. <strong className="text-stone-200 font-mono">{order.id}</strong>
          </p>
        </div>

        {/* Bill Grand Total Card */}
        <div className="bg-stone-950 p-3 rounded-2xl border border-amber-500/30 text-center space-y-0.5">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            एकूण देय रक्कम
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            ₹{order.grandTotal}/-
          </span>
        </div>

        {/* Payment Method Selection (Cash, UPI, Udhar) */}
        <form onSubmit={handleSettleAndClose} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 block">
              पेमेंटचा प्रकार निवडा *
            </label>

            <div className="grid grid-cols-3 gap-2">
              {/* Cash Option */}
              <button
                type="button"
                onClick={() => setSelectedMethod('Cash')}
                className={`p-2.5 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition ${
                  selectedMethod === 'Cash'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>💵 Cash</span>
              </button>

              {/* UPI Option */}
              <button
                type="button"
                onClick={() => setSelectedMethod('UPI')}
                className={`p-2.5 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition ${
                  selectedMethod === 'UPI'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>📱 UPI QR</span>
              </button>

              {/* Udhar Option */}
              <button
                type="button"
                onClick={() => setSelectedMethod('Udhar')}
                className={`p-2.5 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition ${
                  selectedMethod === 'Udhar'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                <BookOpen className="w-4 h-4 text-red-400" />
                <span>📝 उधार</span>
              </button>
            </div>
          </div>

          {/* Show Interactive QR Code if UPI is selected */}
          {selectedMethod === 'UPI' && (
            <div className="bg-stone-950 p-3 rounded-2xl border border-amber-500/40 text-center space-y-1.5 animate-fade-in">
              <span className="text-xs font-bold text-amber-300 block">
                स्कॅन करून ऑनलाईन बिल भरा
              </span>
              <img
                src={upiQrUrl}
                alt="UPI QR Code"
                className="w-28 h-28 bg-white p-1.5 rounded-xl mx-auto border border-stone-700 shadow-md"
              />
              <span className="text-[10px] text-stone-400 block font-mono">
                UPI ID: {HOTEL_INFO.upiId}
              </span>
            </div>
          )}

          {/* Customer Details for Udhar or Bill Message */}
          <div className="space-y-2 pt-0.5">
            <div>
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>ग्राहक नाव {selectedMethod === 'Udhar' ? '*' : '(पर्यायी)'}</span>
              </label>
              <input
                type="text"
                required={selectedMethod === 'Udhar'}
                placeholder="ग्राहक नाव प्रविष्ट करा..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1 mb-1">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>मोबाईल नंबर {selectedMethod === 'Udhar' ? '*' : '(पर्यायी)'}</span>
              </label>
              <input
                type="tel"
                maxLength="10"
                required={selectedMethod === 'Udhar'}
                placeholder="१० अंकी मोबाईल नंबर..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold placeholder-stone-500 focus:outline-none transition font-mono"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-950/60 hover:scale-[1.02] active:scale-98 transition disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? (
              <span>पेमेंट जमा होत आहे...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>पेमेंट जमा करा (₹{order.grandTotal}) 🟢</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

