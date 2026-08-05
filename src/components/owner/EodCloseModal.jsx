import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { sendEodReportEmail } from '../../services/emailService';
import { Mail, Lock, CheckCircle2, Send, X, ShieldAlert, Sparkles, Banknote, CreditCard, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

export const EodCloseModal = ({ isOpen, onClose }) => {
  const { orders, ownerEmails, lang } = useApp();
  const defaultEmails = ownerEmails?.length > 0 ? ownerEmails.join(', ') : (import.meta.env.VITE_OWNER_EMAIL || '');
  const [ownerEmail, setOwnerEmail] = useState(defaultEmails);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [mailtoUrl, setMailtoUrl] = useState('');

  if (!isOpen) return null;

  // Filter today's completed orders
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => {
    const orderDate = new Date(o.timestamp).toISOString().split('T')[0];
    return orderDate === todayStr && o.status === 'completed';
  });

  const totalRevenue = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalOrders = todayOrders.length;

  const cashTotal = todayOrders.filter((o) => o.paymentMethod === 'Cash').reduce((sum, o) => sum + o.grandTotal, 0);
  const upiTotal = todayOrders.filter((o) => o.paymentMethod === 'UPI').reduce((sum, o) => sum + o.grandTotal, 0);
  const udharTotal = todayOrders.filter((o) => o.paymentMethod === 'Udhar').reduce((sum, o) => sum + o.grandTotal, 0);

  // Count Veg vs Non-Veg
  let vegCount = 0;
  let nonVegCount = 0;
  const dishCounts = {};

  todayOrders.forEach((order) => {
    order.items?.forEach((item) => {
      if (item.category === 'veg' || item.isVeg) {
        vegCount += item.quantity;
      } else {
        nonVegCount += item.quantity;
      }

      dishCounts[item.id] = dishCounts[item.id] || { nameMr: item.nameMr, count: 0, revenue: 0 };
      dishCounts[item.id].count += item.quantity;
      dishCounts[item.id].revenue += item.price * item.quantity;
    });
  });

  const topDishes = Object.values(dishCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const reportData = {
    date: new Date().toLocaleDateString('mr-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    totalRevenue,
    totalOrders,
    vegCount,
    nonVegCount,
    cashTotal,
    upiTotal,
    udharTotal,
    topDishes
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsSending(true);

    const res = await sendEodReportEmail(reportData, ownerEmail);
    setIsSending(false);
    setSentSuccess(true);
    if (res.mailtoUrl) {
      setMailtoUrl(res.mailtoUrl);
    }

    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-amber-600/40 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 relative overflow-hidden max-h-[92vh] overflow-y-auto">
        
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

        {/* Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 mx-auto shadow-md">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-base font-black text-amber-400">
            आजचा व्यवहार बंद करा व ई-मेल पाठवा
          </h3>
          <p className="text-[11px] text-stone-400">
            हॉटेल बंद करताना मालकांना दैनंदिन विक्री व महसूल अहवाल ई-मेल करा ({reportData.date})
          </p>
        </div>

        {/* Sales Summary Card Preview */}
        <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="text-xs font-bold text-stone-400">एकूण दैनिक महसूल</span>
            <span className="text-lg sm:text-xl font-black text-amber-400">₹{totalRevenue}/-</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-stone-900 p-2 rounded-xl border border-stone-800">
              <span className="text-stone-400 block text-[10px]">पूर्ण ऑर्डर्स</span>
              <span className="font-extrabold text-stone-200">{totalOrders} ऑर्डर्स</span>
            </div>
            <div className="bg-stone-900 p-2 rounded-xl border border-stone-800">
              <span className="text-stone-400 block text-[10px]">जेवण विक्री</span>
              <span className="font-extrabold text-emerald-400">🥗 {vegCount}</span> • <span className="font-extrabold text-red-400">🍗 {nonVegCount}</span>
            </div>
          </div>

          {/* Payment Breakup */}
          <div className="space-y-1 pt-0.5">
            <span className="text-[10px] font-bold text-stone-400 block uppercase">पेमेंट पद्धतीनुसार वर्गिकरण:</span>
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="bg-emerald-950/40 border border-emerald-700/40 p-1.5 rounded-xl">
                <span className="text-[10px] text-emerald-400 block font-bold">💵 Cash</span>
                <span className="font-black text-emerald-300">₹{cashTotal}</span>
              </div>
              <div className="bg-amber-950/40 border border-amber-700/40 p-1.5 rounded-xl">
                <span className="text-[10px] text-amber-400 block font-bold">📱 UPI</span>
                <span className="font-black text-amber-300">₹{upiTotal}</span>
              </div>
              <div className="bg-red-950/40 border border-red-700/40 p-1.5 rounded-xl">
                <span className="text-[10px] text-red-400 block font-bold">📝 उधार</span>
                <span className="font-black text-red-300">₹{udharTotal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSendEmail} className="space-y-3">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>हॉटेल मालकांचे ई-मेल आयडी *</span>
              </label>
              <span className="text-[10px] text-amber-400 font-medium">कॉमा (,) ने जोडा</span>
            </div>
            
            <textarea
              required
              rows={2}
              placeholder="ई-मेल आयडी प्रविष्ट करा..."
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full bg-stone-950 border border-amber-600/40 rounded-xl p-2.5 text-xs text-amber-300 font-medium placeholder-stone-500 focus:outline-none focus:border-amber-500 resize-none font-mono"
            />
          </div>

          {!sentSuccess ? (
            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-950/60 hover:scale-[1.02] active:scale-98 transition disabled:opacity-50 min-h-[44px]"
            >
              {isSending ? (
                <span>अहवाल पाठवत आहे...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>व्यवहार बंद करा व ई-मेल पाठवा</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-2 text-center animate-fade-in">
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>दैनिक विक्री अहवाल ई-मेल यशस्वी पाठवला गेला आहे!</span>
              </div>

              {mailtoUrl && (
                <a
                  href={mailtoUrl}
                  className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition border border-stone-700"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>थेट ई-मेल ॲप मध्ये उघडा</span>
                </a>
              )}
            </div>
          )}
        </form>

      </div>
    </div>
  );
};

