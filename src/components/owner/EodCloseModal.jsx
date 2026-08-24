import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { sendEodReportEmail } from '../../services/emailService';
import { Mail, Lock, CheckCircle2, Send, X, ShieldAlert, Sparkles, Banknote, CreditCard, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

export const EodCloseModal = ({ isOpen, onClose }) => {
  const { orders, ownerEmails, addOwnerEmail, removeOwnerEmail, lang, saveEodReport, closeDayAndRefreshKds } = useApp();
  const [ownerEmail, setOwnerEmail] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [mailtoUrl, setMailtoUrl] = useState('');

  // Keep ownerEmail synced with AppContext ownerEmails array
  useEffect(() => {
    if (ownerEmails && ownerEmails.length > 0) {
      setOwnerEmail(ownerEmails.join(', '));
    } else {
      setOwnerEmail(import.meta.env.VITE_OWNER_EMAIL || '');
    }
  }, [ownerEmails, isOpen]);

  if (!isOpen) return null;

  const handleAddQuickEmail = (e) => {
    e.preventDefault();
    if (!newEmailInput || !newEmailInput.includes('@')) return;
    addOwnerEmail(newEmailInput.trim());
    setNewEmailInput('');
  };

  // Helper functions to accurately identify dish categories
  const isItemThali = (item) => {
    if (!item) return false;
    return Boolean(
      item.isThali ||
      item.id?.startsWith('t') ||
      item.nameMr?.includes('ताट') ||
      item.nameMr?.includes('थाळी') ||
      item.nameEn?.toLowerCase().includes('thali') ||
      item.category === 'thali'
    );
  };

  const isItemExtra = (item) => {
    if (!item) return false;
    return Boolean(
      item.category === 'extras' ||
      item.id?.startsWith('e') ||
      Number(item.price) < 50 ||
      item.nameMr?.includes('भाकरी') ||
      item.nameMr?.includes('चपाती') ||
      item.nameMr?.includes('पापड') ||
      item.nameMr?.includes('ताक') ||
      item.nameMr?.includes('सोलकढी') ||
      item.nameMr?.includes('पाणी') ||
      item.nameMr?.includes('जिरा')
    );
  };

  // Filter today's completed orders
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => {
    const orderDate = new Date(o.timestamp).toISOString().split('T')[0];
    return orderDate === todayStr && o.status === 'completed';
  });

  const totalRevenue = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalOrders = todayOrders.length;

  const cashTotal = todayOrders.filter((o) => o.paymentMethod === 'Cash').reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const upiTotal = todayOrders.filter((o) => o.paymentMethod === 'UPI').reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const udharTotal = todayOrders.filter((o) => o.paymentMethod === 'Udhar').reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  // Dine-in vs Parcel Orders Breakdown
  const parcelOrders = todayOrders.filter((o) => o.tableNo === 'Parcel' || (o.tableNo && String(o.tableNo).toLowerCase().includes('parcel')));
  const parcelCount = parcelOrders.length;
  const parcelTotal = parcelOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const dineInOrders = todayOrders.filter((o) => o.tableNo !== 'Parcel' && (!o.tableNo || !String(o.tableNo).toLowerCase().includes('parcel')));
  const dineInCount = dineInOrders.length;
  const dineInTotal = dineInOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  // Count Thalis, Plates, and Extras
  let thaliCount = 0;
  let plateCount = 0;
  let extrasCount = 0;
  let vegCount = 0;
  let nonVegCount = 0;
  const dishCounts = {};

  todayOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const qty = item.quantity || 1;
      if (isItemThali(item)) {
        thaliCount += qty;
      } else if (isItemExtra(item)) {
        extrasCount += qty;
      } else {
        plateCount += qty;
      }

      if (item.category === 'veg' || item.isVeg) {
        vegCount += qty;
      } else {
        nonVegCount += qty;
      }

      const key = item.id || item.nameMr;
      dishCounts[key] = dishCounts[key] || { nameMr: item.nameMr, count: 0, revenue: 0 };
      dishCounts[key].count += qty;
      dishCounts[key].revenue += ((item.price || 0) * qty + (item.extraThalis || 0) * 60);
    });
  });

  const topDishes = Object.values(dishCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const reportData = {
    date: new Date().toLocaleDateString('mr-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    totalRevenue,
    totalOrders,
    thaliCount,
    plateCount,
    extrasCount,
    parcelCount,
    parcelTotal,
    dineInCount,
    dineInTotal,
    vegCount,
    nonVegCount,
    cashTotal,
    upiTotal,
    udharTotal,
    topDishes
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!ownerEmail || ownerEmail.trim().length === 0) {
      alert(lang === 'mr' ? 'कृपया किमान एक मालक ई-मेल प्रविष्ट करा!' : 'Please enter at least one owner email!');
      return;
    }

    setIsSending(true);

    // 1. Save EOD report in database
    await saveEodReport?.(reportData).catch(() => {});

    // 2. Send the EOD report email to owners
    const res = await sendEodReportEmail(reportData, ownerEmail);

    // 3. Automatically refresh operational state for new orders
    if (closeDayAndRefreshKds) {
      await closeDayAndRefreshKds();
    }

    setIsSending(false);
    setSentSuccess(true);
    if (res?.mailtoUrl) {
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
            {lang === 'mr' ? 'आजचा व्यवहार बंद करा व ई-मेल पाठवा' : 'Close Day Sales & Send Email'}
          </h3>
          <p className="text-[11px] text-stone-400">
            {lang === 'mr'
              ? `हॉटेल बंद करताना मालकांना दैनंदिन विक्री व महसूल अहवाल ई-मेल करा (${reportData.date})`
              : `Email daily sales and revenue report to owners (${reportData.date})`}
          </p>
        </div>

        {/* Sales Summary Card Preview */}
        <div className="bg-stone-955 p-3.5 rounded-2xl border border-stone-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="text-xs font-bold text-stone-400">{lang === 'mr' ? 'एकूण दैनिक महसूल' : 'Total Daily Revenue'}</span>
            <span className="text-lg sm:text-xl font-black text-amber-400">₹{totalRevenue}/-</span>
          </div>

          {/* Dish Counts Grid: Thalis, Plates, Extras */}
          <div className="grid grid-cols-3 gap-1.5 text-xs text-center">
            <div className="bg-stone-900 p-2 rounded-xl border border-orange-900/40">
              <span className="text-orange-400 block text-[10px] font-bold">{lang === 'mr' ? '🍱 ताट' : '🍱 Thalis'}</span>
              <span className="font-extrabold text-orange-300">{thaliCount}</span>
            </div>
            <div className="bg-stone-900 p-2 rounded-xl border border-amber-900/40">
              <span className="text-amber-400 block text-[10px] font-bold">{lang === 'mr' ? '🍛 प्लेट्स' : '🍛 Plates'}</span>
              <span className="font-extrabold text-amber-300">{plateCount}</span>
            </div>
            <div className="bg-stone-900 p-2 rounded-xl border border-cyan-900/40">
              <span className="text-cyan-400 block text-[10px] font-bold">{lang === 'mr' ? '🫓 एक्स्ट्रा' : '🫓 Extras'}</span>
              <span className="font-extrabold text-cyan-300">{extrasCount}</span>
            </div>
          </div>

          {/* Dine-In vs Parcel Split */}
          <div className="grid grid-cols-2 gap-1.5 text-xs text-center">
            <div className="bg-stone-900 p-2 rounded-xl border border-stone-700">
              <span className="text-stone-400 block text-[10px] font-bold">🍽️ {lang === 'mr' ? 'डायनिंग टेबल' : 'Dine-In'}</span>
              <span className="font-extrabold text-stone-200">{dineInCount} ऑर्डर्स (₹{dineInTotal})</span>
            </div>
            <div className="bg-purple-950/40 p-2 rounded-xl border border-purple-800/40">
              <span className="text-purple-400 block text-[10px] font-bold">🛍️ {lang === 'mr' ? 'पार्सल' : 'Parcel'}</span>
              <span className="font-extrabold text-purple-300">{parcelCount} पार्सल (₹{parcelTotal})</span>
            </div>
          </div>

          {/* Payment Breakup */}
          <div className="space-y-1 pt-0.5">
            <span className="text-[10px] font-bold text-stone-400 block uppercase">
              {lang === 'mr' ? 'पेमेंट पद्धतीनुसार वर्गिकरण:' : 'Payment Method Breakdown:'}
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="bg-emerald-950/40 border border-emerald-700/40 p-1.5 rounded-xl">
                <span className="text-[10px] text-emerald-400 block font-bold">💵 {lang === 'mr' ? 'रोख' : 'Cash'}</span>
                <span className="font-black text-emerald-300">₹{cashTotal}</span>
              </div>
              <div className="bg-amber-950/40 border border-amber-700/40 p-1.5 rounded-xl">
                <span className="text-[10px] text-amber-400 block font-bold">📱 UPI</span>
                <span className="font-black text-amber-300">₹{upiTotal}</span>
              </div>
              <div className="bg-red-950/40 border border-red-700/40 p-1.5 rounded-xl">
                <span className="text-[10px] text-red-400 block font-bold">📝 {lang === 'mr' ? 'उधार' : 'Udhar'}</span>
                <span className="font-black text-red-300">₹{udharTotal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Registered Owner Recipient List Management */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {lang === 'mr'
                  ? `ई-मेल प्राप्तकर्ते मालक (${ownerEmails?.length || 0})`
                  : `Owner Email Recipients (${ownerEmails?.length || 0})`}
              </span>
            </label>
          </div>

          {/* Recipient Email Badges */}
          {ownerEmails && ownerEmails.length > 0 ? (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {ownerEmails.map((email, idx) => (
                <div key={idx} className="flex items-center justify-between bg-stone-950 px-2.5 py-1.5 rounded-xl border border-stone-800 text-xs">
                  <span className="font-mono text-amber-300 truncate text-[11px]">{email}</span>
                  <button
                    type="button"
                    onClick={() => removeOwnerEmail(email)}
                    className="p-1 text-stone-400 hover:text-red-400 transition ml-2 shrink-0"
                    title="हा ई-मेल काढून टाका"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {/* Quick Add Email Input */}
          <div className="flex gap-1.5 pt-1">
            <input
              type="email"
              placeholder="उदा. newowner@gmail.com"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
              className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              type="button"
              onClick={handleAddQuickEmail}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold shrink-0 transition"
            >
              + जोडा
            </button>
          </div>

          {/* Comma-separated Manual Input Box */}
          <div>
            <span className="text-[10px] text-stone-400 font-medium block mb-1">किंवा थेट खाली ई-मेल प्रविष्ट करा (कॉमाने वेगळे करा):</span>
            <textarea
              required
              rows={2}
              placeholder="उदा. owner1@gmail.com, owner2@gmail.com"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full bg-stone-950 border border-amber-600/40 rounded-xl p-2.5 text-xs text-amber-300 font-medium placeholder-stone-500 focus:outline-none focus:border-amber-500 resize-none font-mono"
            />
          </div>
        </div>

        {/* Form Submit Button */}
        <form onSubmit={handleSendEmail} className="space-y-3 pt-1">
          {!sentSuccess ? (
            <>
              <p className="text-[10px] text-emerald-400/90 font-medium text-center bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/40">
                {lang === 'mr'
                  ? '🔒 अहवाल पाठवल्यानंतर आजचे सर्व विक्री व ऑर्डर्स रेकॉर्ड्स डेटाबेसमध्ये सुरक्षित जतन राहतील.'
                  : '🔒 All order & sales records will remain permanently saved in the database.'}
              </p>

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
                    <span>{lang === 'mr' ? 'व्यवहार बंद करा व ई-मेल पाठवा' : 'Close Day Sales & Send Email'}</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="space-y-2 text-center animate-fade-in">
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-bold flex flex-col items-center justify-center gap-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{lang === 'mr' ? 'दैनिक विक्री अहवाल ई-मेल पाठवला आहे!' : 'Daily sales email sent successfully!'}</span>
                </div>
                <span className="text-[11px] text-emerald-400/90 font-normal">
                  {lang === 'mr'
                    ? '✅ आजचे सर्व ऑर्डर्स व महसूल रेकॉर्ड्स डेटाबेसमध्ये सुरक्षित सेव्ह झाले आहेत.'
                    : '✅ All order records of today are safely preserved in the database.'}
                </span>
              </div>

              {mailtoUrl && (
                <a
                  href={mailtoUrl}
                  className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition border border-stone-700"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'mr' ? 'थेट ई-मेल ॲप मध्ये उघडा' : 'Open in Email App'}</span>
                </a>
              )}
            </div>
          )}
        </form>

      </div>
    </div>
  );
};
