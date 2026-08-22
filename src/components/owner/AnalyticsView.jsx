import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EodCloseModal } from './EodCloseModal';
import { IndianRupee, TrendingUp, ShoppingBag, Utensils, Award, Calendar, Banknote, CreditCard, FileText, PieChart, BarChart2, Lock, Download } from 'lucide-react';

export const AnalyticsView = () => {
  const { lang, orders, t } = useApp();
  const [timeframe, setTimeframe] = useState('today'); // 'today', 'weekly', 'monthly', 'allTime'
  const [isEodModalOpen, setIsEodModalOpen] = useState(false);

  const downloadOrdersCsv = () => {
    const headers = ['Order ID', 'Date & Time', 'Table No', 'Customer Name', 'Customer Phone', 'Status', 'Payment Method', 'Items List', 'Grand Total (Rs)'];
    
    const rows = filteredOrders.map(ord => {
      const itemsStr = ord.items.map(i => `${i.nameMr} x ${i.quantity}`).join('; ');
      const dateFormatted = new Date(ord.timestamp).toLocaleString('mr-IN');

      return [
        `"${ord.id}"`,
        `"${dateFormatted}"`,
        `"${ord.tableNo}"`,
        `"${ord.customerName}"`,
        `"${ord.customerPhone || 'N/A'}"`,
        `"${ord.status}"`,
        `"${ord.paymentMethod || 'Cash'}"`,
        `"${itemsStr}"`,
        ord.grandTotal
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hotel_Aaradhya_Orders_Report_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
  const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

  // Filter orders based on selected timeframe
  const filteredOrders = orders.filter((ord) => {
    const ordTime = new Date(ord.timestamp).getTime();
    if (timeframe === 'today') return ordTime >= todayStart;
    if (timeframe === 'weekly') return ordTime >= weekStart;
    if (timeframe === 'monthly') return ordTime >= monthStart;
    return true; // allTime
  });

  // Calculate metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalOrdersCount = filteredOrders.length;

  // Payment Breakdown
  const cashTotal = filteredOrders
    .filter((o) => o.paymentMethod === 'Cash')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const upiTotal = filteredOrders
    .filter((o) => o.paymentMethod === 'UPI')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const udharTotal = filteredOrders
    .filter((o) => o.paymentMethod === 'Udhar')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  // Thalis, Plates, and Extras counts & Category Sales Map
  let totalThalisSold = 0;
  let totalPlatesSold = 0;
  let totalExtrasSold = 0;
  let totalExtraThalisSold = 0;

  const categorySalesMap = { veg: 0, egg: 0, chicken: 0, mutton: 0, extras: 0 };
  const itemSalesMap = {};

  filteredOrders.forEach((ord) => {
    ord.items.forEach((item) => {
      const lineTotal = item.price * item.quantity + (item.extraThalis || 0) * 60;
      
      if (item.isThali) {
        totalThalisSold += item.quantity;
      } else if (item.category === 'extras' || Number(item.price) < 50) {
        totalExtrasSold += item.quantity;
      } else {
        totalPlatesSold += item.quantity;
      }

      if (item.extraThalis > 0) {
        totalExtraThalisSold += item.extraThalis;
      }

      if (categorySalesMap[item.category] !== undefined) {
        categorySalesMap[item.category] += lineTotal;
      }

      if (!itemSalesMap[item.nameMr]) {
        itemSalesMap[item.nameMr] = { nameMr: item.nameMr, nameEn: item.nameEn, count: 0, revenue: 0, category: item.category };
      }
      itemSalesMap[item.nameMr].count += item.quantity;
      itemSalesMap[item.nameMr].revenue += lineTotal;
    });
  });

  const topSellingItems = Object.values(itemSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Generate Last 7 Days Bar Chart Data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayStart - (6 - i) * 24 * 60 * 60 * 1000);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const dayOrders = orders.filter((o) => {
      const t = new Date(o.timestamp).getTime();
      return t >= dayStart && t < dayEnd;
    });

    const dayRev = dayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const label = d.toLocaleDateString('mr-IN', { weekday: 'short', day: 'numeric' });

    return { label, rev: dayRev, count: dayOrders.length };
  });

  const maxRevInWeek = Math.max(...last7Days.map((d) => d.rev), 500);

  return (
    <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-4 pb-20 md:pb-8 animate-fade-in">
      
      {/* Header & Timeframe Selector Bar (100% Responsive & Zero Overflow) */}
      <div className="w-full max-w-full overflow-hidden bg-stone-900/90 p-3 sm:p-4 rounded-2xl border border-amber-600/30 shadow-xl space-y-3">
        
        {/* Title & Action Buttons Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5 min-w-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <h3 className="text-xs sm:text-base font-black text-amber-300 truncate">
              {lang === 'mr' ? 'विक्री रिपोर्ट व ॲनालिटिक्स' : 'Sales Analytics'}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {/* ICON ONLY DOWNLOAD BUTTON */}
            <button
              type="button"
              onClick={downloadOrdersCsv}
              className="p-1.5 sm:p-2 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 flex items-center justify-center transition min-w-[34px] sm:min-w-[38px] min-h-[34px] sm:min-h-[38px] shrink-0"
              title={lang === 'mr' ? 'अहवाल डाऊनलोड करा' : 'Download Report'}
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </button>

            {/* EOD CLOSE & EMAIL REPORT BUTTON */}
            <button
              type="button"
              onClick={() => setIsEodModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-[34px] sm:min-h-[38px] rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 shadow-lg shadow-red-950/40 transition shrink-0"
            >
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-200 shrink-0" />
              <span>{lang === 'mr' ? 'ई-मेल अहवाल' : 'Email Report'}</span>
            </button>
          </div>
        </div>

        {/* Timeframe Pills Bar (Concise Marathi/English Labels) */}
        <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 overflow-x-auto no-scrollbar gap-1 w-full max-w-full">
          <button
            type="button"
            onClick={() => setTimeframe('today')}
            className={`flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition text-center ${
              timeframe === 'today' ? 'bg-amber-500 text-stone-950 font-black shadow-md' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'mr' ? 'आज' : 'Today'}
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('weekly')}
            className={`flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition text-center ${
              timeframe === 'weekly' ? 'bg-amber-500 text-stone-950 font-black shadow-md' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'mr' ? 'आठवडा' : 'Weekly'}
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('monthly')}
            className={`flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition text-center ${
              timeframe === 'monthly' ? 'bg-amber-500 text-stone-950 font-black shadow-md' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'mr' ? 'महिना' : 'Monthly'}
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('allTime')}
            className={`flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition text-center ${
              timeframe === 'allTime' ? 'bg-amber-500 text-stone-950 font-black shadow-md' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'mr' ? 'सर्व वेळ' : 'All Time'}
          </button>
        </div>
      </div>

      {/* EOD Close Email Report Modal */}
      <EodCloseModal
        isOpen={isEodModalOpen}
        onClose={() => setIsEodModalOpen(false)}
      />

      {/* Primary Metrics Grid (Responsive Layout for Revenue, Orders, Thalis, Plates & Extras) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* 1. Total Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/70 via-stone-900 to-stone-900 border border-amber-500/40 space-y-2 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
              {lang === 'mr'
                ? (timeframe === 'today' ? 'आजचे उत्पन्न' : timeframe === 'weekly' ? 'आठवड्याचे उत्पन्न' : timeframe === 'monthly' ? 'महिन्याचे उत्पन्न' : 'एकूण उत्पन्न')
                : (timeframe === 'today' ? "Today's Revenue" : timeframe === 'weekly' ? "Weekly Revenue" : timeframe === 'monthly' ? "Monthly Revenue" : "Total Revenue")}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-inner shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
            ₹{totalRevenue}
          </div>
          <p className="text-[11px] text-stone-400 font-semibold">
            {lang === 'mr' ? 'हॉटेल आराध्या डायनिंग विक्री' : 'Hotel Aaradhya Sales'}
          </p>
        </div>

        {/* 2. Total Orders Count */}
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-stone-300 uppercase tracking-wider">
              {lang === 'mr' ? 'एकूण ऑर्डर्स संख्या' : 'Total Orders Count'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center border border-stone-700 shadow-inner shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-100 tracking-tight">
            {totalOrdersCount} <span className="text-sm font-bold text-stone-400">{lang === 'mr' ? 'ऑर्डर्स' : 'Orders'}</span>
          </div>
          <p className="text-[11px] text-stone-400 font-semibold">
            {lang === 'mr' ? 'टेबल व पार्सल एकत्रित' : 'Dine-In & Takeaway'}
          </p>
        </div>

        {/* 3. Total Thalis Sold */}
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-orange-900/40 space-y-2 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-orange-400 uppercase tracking-wider">
              {lang === 'mr' ? 'विकलेले ताट (थाळी)' : 'Thalis Sold'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-950/70 text-orange-400 flex items-center justify-center border border-orange-700/60 shadow-inner shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-300 tracking-tight">
            {totalThalisSold} <span className="text-sm font-bold text-stone-400">{lang === 'mr' ? 'ताट' : 'Thalis'}</span>
          </div>
          <p className="text-[11px] text-stone-400 font-semibold">
            {lang === 'mr' ? 'मटण, चिकन, अंडा व वेज ताट' : 'Full Meal Thalis'}
          </p>
        </div>

        {/* 4. Total Plates Sold */}
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-amber-900/40 space-y-2 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
              {lang === 'mr' ? 'विकलेल्या प्लेट्स' : 'Plates Sold'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-950/70 text-amber-400 flex items-center justify-center border border-amber-700/60 shadow-inner shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-200 tracking-tight">
            {totalPlatesSold} <span className="text-sm font-bold text-stone-400">{lang === 'mr' ? 'प्लेट्स' : 'Plates'}</span>
          </div>
          <p className="text-[11px] text-stone-400 font-semibold">
            {lang === 'mr' ? 'सुक्का मटण, चिकन, भाजी व ऑम्लेट' : 'Single Curry & Fry Plates'}
          </p>
        </div>

        {/* 5. Total Extras Sold */}
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-cyan-900/40 space-y-2 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
              {lang === 'mr' ? 'एक्स्ट्रा पदार्थ' : 'Extras Sold'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 text-cyan-400 flex items-center justify-center border border-cyan-700/60 shadow-inner shrink-0">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300 tracking-tight">
            {totalExtrasSold} <span className="text-sm font-bold text-stone-400">{lang === 'mr' ? 'नग' : 'Items'}</span>
          </div>
          <p className="text-[11px] text-stone-400 font-semibold truncate" title="भाकरी, चपाती, पापड, सोलकढी, ताक, रस्सा इ.">
            {lang === 'mr' 
              ? `भाकरी, पापड, सोलकढी इ. ${totalExtraThalisSold > 0 ? `(+${totalExtraThalisSold} ताट)` : ''}`
              : `Bhakri, Papad, Drinks (+${totalExtraThalisSold} thalis)`}
          </p>
        </div>

      </div>

      {/* Payment Breakup Grid (Cash, UPI, Udhar) */}
      <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
        <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-amber-400" />
          <span>{lang === 'mr' ? 'पेमेंट प्रकारानुसार विभाजन' : 'Payment Type Breakdown'}</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Cash */}
          <div className="p-3.5 rounded-xl bg-stone-950 border border-emerald-900/40 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>💵 {t.cash}</span>
              <span className="text-emerald-400 font-bold">{lang === 'mr' ? 'रोख' : 'Cash'}</span>
            </div>
            <div className="text-xl font-extrabold text-stone-100">₹{cashTotal}</div>
          </div>

          {/* UPI */}
          <div className="p-3.5 rounded-xl bg-stone-950 border border-amber-900/40 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>📱 {t.upi}</span>
              <span className="text-amber-400 font-bold">{lang === 'mr' ? 'ऑनलाइन' : 'Online'}</span>
            </div>
            <div className="text-xl font-extrabold text-stone-100">₹{upiTotal}</div>
          </div>

          {/* Udhar */}
          <div className="p-3.5 rounded-xl bg-stone-950 border border-red-900/40 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>📝 {t.udhar}</span>
              <span className="text-red-400 font-bold">{lang === 'mr' ? 'उधार खाते' : 'Udhar Credit'}</span>
            </div>
            <div className="text-xl font-extrabold text-red-400">₹{udharTotal}</div>
          </div>
        </div>
      </div>

      {/* Visual Daily Revenue Trend Bar Chart */}
      <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-amber-400" />
          <span>{lang === 'mr' ? 'मागील ७ दिवसांचा रोजचा विक्री ट्रेंड' : 'Last 7 Days Sales Trend'}</span>
        </h4>

        <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 bg-stone-950/60 rounded-xl border border-stone-800">
          {last7Days.map((day, idx) => {
            const heightPercent = Math.max(12, Math.round((day.rev / maxRevInWeek) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-extrabold text-amber-300 opacity-90 group-hover:scale-110 transition">
                  ₹{day.rev}
                </span>

                <div
                  className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-amber-600 via-orange-500 to-amber-400 group-hover:from-amber-500 group-hover:to-yellow-400 transition-all duration-500 shadow-lg shadow-orange-950/40"
                  style={{ height: `${heightPercent}%` }}
                />

                <span className="text-[10px] text-stone-400 font-bold truncate">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Selling Items Section */}
      <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>{lang === 'mr' ? 'सर्वाधिक विक्री झालेले पदार्थ' : 'Top Selling Dishes'}</span>
        </h4>

        <div className="space-y-3">
          {topSellingItems.length === 0 ? (
            <p className="text-xs text-stone-400 italic py-4 text-center">
              {lang === 'mr' ? 'या निवडलेल्या कालावधीत कोणतीही विक्री झाली नाही.' : 'No sales records found for selected period.'}
            </p>
          ) : (
            topSellingItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-stone-955/60 border border-stone-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-extrabold flex items-center justify-center border border-amber-500/40 text-[11px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <h5 className="font-bold text-stone-200">
                      {lang === 'mr' ? item.nameMr : item.nameEn}
                    </h5>
                    <span className="text-[10px] text-stone-400">
                      {lang === 'mr' ? `विक्री: ${item.count} नग` : `Sold: ${item.count} qty`}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-amber-400 text-sm">
                    ₹{item.revenue}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
