import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EodCloseModal } from './EodCloseModal';
import { 
  IndianRupee, TrendingUp, ShoppingBag, Utensils, Award, Calendar, 
  Banknote, CreditCard, FileText, PieChart, BarChart2, Lock, Download, 
  Search, History, ChevronDown, ChevronUp, Clock, CheckCircle2,
  Package, Store
} from 'lucide-react';

export const AnalyticsView = () => {
  const { lang, orders, eodReports, t } = useApp();
  const [timeframe, setTimeframe] = useState('today'); // 'today', 'weekly', 'monthly', 'allTime'
  const [isEodModalOpen, setIsEodModalOpen] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [expandedEodId, setExpandedEodId] = useState(null);
  const [viewTab, setViewTab] = useState('overview'); // 'overview', 'orders_log', 'eod_history'

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

  // Parcel vs Dine-In Breakdown
  const parcelOrders = filteredOrders.filter((o) => o.tableNo === 'Parcel' || (o.tableNo && String(o.tableNo).toLowerCase().includes('parcel')));
  const parcelCount = parcelOrders.length;
  const parcelTotal = parcelOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const dineInOrders = filteredOrders.filter((o) => o.tableNo !== 'Parcel' && (!o.tableNo || !String(o.tableNo).toLowerCase().includes('parcel')));
  const dineInCount = dineInOrders.length;
  const dineInTotal = dineInOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  // Thalis, Plates, and Extras counts & Category Sales Map
  let totalThalisSold = 0;
  let totalPlatesSold = 0;
  let totalExtrasSold = 0;
  let totalExtraThalisSold = 0;

  const categorySalesMap = { veg: 0, egg: 0, chicken: 0, mutton: 0, extras: 0 };
  const itemSalesMap = {};

  filteredOrders.forEach((ord) => {
    (ord.items || []).forEach((item) => {
      const qty = item.quantity || 1;
      const lineTotal = (item.price || 0) * qty + (item.extraThalis || 0) * 60;
      
      if (isItemThali(item)) {
        totalThalisSold += qty;
      } else if (isItemExtra(item)) {
        totalExtrasSold += qty;
      } else {
        totalPlatesSold += qty;
      }

      if (item.extraThalis > 0) {
        totalExtraThalisSold += item.extraThalis;
      }

      if (categorySalesMap[item.category] !== undefined) {
        categorySalesMap[item.category] += lineTotal;
      }

      const key = item.nameMr || item.nameEn || item.id;
      if (!itemSalesMap[key]) {
        itemSalesMap[key] = { nameMr: item.nameMr, nameEn: item.nameEn, count: 0, revenue: 0, category: item.category };
      }
      itemSalesMap[key].count += qty;
      itemSalesMap[key].revenue += lineTotal;
    });
  });

  const topSellingItems = Object.values(itemSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

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

  // Search filtered orders in records management tab
  const searchedOrders = filteredOrders.filter((ord) => {
    if (!orderSearchQuery.trim()) return true;
    const query = orderSearchQuery.toLowerCase();
    const itemsText = (ord.items || []).map((i) => `${i.nameMr} ${i.nameEn}`).join(' ').toLowerCase();
    return (
      (ord.id || '').toLowerCase().includes(query) ||
      (ord.tableNo || '').toLowerCase().includes(query) ||
      (ord.customerName || '').toLowerCase().includes(query) ||
      (ord.customerPhone || '').includes(query) ||
      (ord.paymentMethod || '').toLowerCase().includes(query) ||
      itemsText.includes(query)
    );
  });

  const downloadOrdersCsv = () => {
    const headers = ['Order ID', 'Date & Time', 'Table/Type', 'Customer Name', 'Customer Phone', 'Status', 'Payment Method', 'Items List', 'Grand Total (Rs)'];
    
    const rows = searchedOrders.map((ord) => {
      const itemsStr = (ord.items || []).map((i) => `${i.nameMr} x ${i.quantity}`).join('; ');
      const dateFormatted = new Date(ord.timestamp).toLocaleString('mr-IN');

      return [
        `"${ord.id}"`,
        `"${dateFormatted}"`,
        `"${ord.tableNo}"`,
        `"${ord.customerName || 'N/A'}"`,
        `"${ord.customerPhone || 'N/A'}"`,
        `"${ord.status}"`,
        `"${ord.paymentMethod || 'Cash'}"`,
        `"${itemsStr}"`,
        ord.grandTotal
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hotel_Aaradhya_Orders_Report_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-4 pb-20 md:pb-8 animate-fade-in">
      
      {/* Header & Controls Bar */}
      <div className="w-full max-w-full overflow-hidden bg-stone-900/90 p-3 sm:p-4 rounded-2xl border border-amber-600/30 shadow-xl space-y-3">
        
        {/* Title & Action Buttons Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5 min-w-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <h3 className="text-xs sm:text-base font-black text-amber-300 truncate">
              {lang === 'mr' ? 'विक्री रिपोर्ट, ॲनालिटिक्स व पार्सल रेकॉर्ड्स' : 'Sales Analytics & Parcel Records'}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {/* DOWNLOAD CSV BUTTON */}
            <button
              type="button"
              onClick={downloadOrdersCsv}
              className="p-1.5 sm:p-2 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 flex items-center justify-center transition min-w-[34px] sm:min-w-[38px] min-h-[34px] sm:min-h-[38px] shrink-0"
              title={lang === 'mr' ? 'अहवाल डाऊनलोड करा (CSV)' : 'Download Report CSV'}
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
              <span>{lang === 'mr' ? 'ई-मेल अहवाल व क्लोज' : 'Email Report & Close'}</span>
            </button>
          </div>
        </div>

        {/* View Mode Navigation */}
        <div className="flex bg-stone-955 p-1 rounded-xl border border-stone-800 gap-1 w-full max-w-full overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setViewTab('overview')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition text-center ${
              viewTab === 'overview'
                ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            📊 {lang === 'mr' ? 'ॲनालिटिक्स डॅशबोर्ड' : 'Overview Analytics'}
          </button>

          <button
            type="button"
            onClick={() => setViewTab('orders_log')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition text-center ${
              viewTab === 'orders_log'
                ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            📋 {lang === 'mr' ? `ऑर्डर्स नोंदवही (${filteredOrders.length})` : `Order Records (${filteredOrders.length})`}
          </button>

          <button
            type="button"
            onClick={() => setViewTab('eod_history')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition text-center ${
              viewTab === 'eod_history'
                ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            📜 {lang === 'mr' ? `दैनिक अहवाल इतिहास (${eodReports?.length || 0})` : `Daily Close History (${eodReports?.length || 0})`}
          </button>
        </div>

        {/* Timeframe Pills Bar */}
        <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 overflow-x-auto no-scrollbar gap-1 w-full pt-1 border-t">
          <button
            type="button"
            onClick={() => setTimeframe('today')}
            className={`flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition text-center ${
              timeframe === 'today' ? 'bg-amber-500 text-stone-950 font-black shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'mr' ? 'आज' : 'Today'}
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('weekly')}
            className={`flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition text-center ${
              timeframe === 'weekly' ? 'bg-amber-500 text-stone-950 font-black shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'mr' ? 'आठवडा' : 'Weekly'}
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('monthly')}
            className={`flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition text-center ${
              timeframe === 'monthly' ? 'bg-amber-500 text-stone-950 font-black shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'mr' ? 'महिना' : 'Monthly'}
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('allTime')}
            className={`flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition text-center ${
              timeframe === 'allTime' ? 'bg-amber-500 text-stone-950 font-black shadow' : 'text-stone-400 hover:text-stone-200'
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

      {/* Primary Metrics Grid (Responsive Layout: Revenue, Orders, Thalis, Plates, Extras, Parcels) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        
        {/* 1. Total Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/70 via-stone-900 to-stone-900 border border-amber-500/40 space-y-1.5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
              {lang === 'mr'
                ? (timeframe === 'today' ? 'आजचे उत्पन्न' : timeframe === 'weekly' ? 'आठवडा उत्पन्न' : timeframe === 'monthly' ? 'महिना उत्पन्न' : 'एकूण उत्पन्न')
                : (timeframe === 'today' ? "Today Revenue" : timeframe === 'weekly' ? "Weekly Revenue" : timeframe === 'monthly' ? "Monthly Revenue" : "Total Revenue")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
            ₹{totalRevenue}
          </div>
          <p className="text-[10px] text-stone-400 font-semibold truncate">
            {lang === 'mr' ? 'एकूण विक्री महसूल' : 'Total sales revenue'}
          </p>
        </div>

        {/* 2. Total Orders Count */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-stone-300 uppercase tracking-wider">
              {lang === 'mr' ? 'एकूण ऑर्डर्स' : 'Total Orders'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center border border-stone-700 shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-100 tracking-tight">
            {totalOrdersCount} <span className="text-xs font-bold text-stone-400">{lang === 'mr' ? 'ऑर्डर्स' : 'Orders'}</span>
          </div>
          <p className="text-[10px] text-stone-400 font-semibold truncate">
            {lang === 'mr' ? `डायनिंग: ${dineInCount} • पार्सल: ${parcelCount}` : `Dine-in: ${dineInCount} • Parcel: ${parcelCount}`}
          </p>
        </div>

        {/* 3. Total Thalis Sold */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-orange-900/40 space-y-1.5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-orange-400 uppercase tracking-wider">
              {lang === 'mr' ? 'विकलेले ताट' : 'Thalis Sold'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-950/70 text-orange-400 flex items-center justify-center border border-orange-700/60 shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-orange-300 tracking-tight">
            {totalThalisSold} <span className="text-xs font-bold text-stone-400">{lang === 'mr' ? 'ताट' : 'Thalis'}</span>
          </div>
          <p className="text-[10px] text-stone-400 font-semibold truncate">
            {lang === 'mr' ? 'मटण, चिकन, अंडा व वेज' : 'Full Meal Thalis'}
          </p>
        </div>

        {/* 4. Total Plates Sold */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-amber-900/40 space-y-1.5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
              {lang === 'mr' ? 'विकलेल्या प्लेट्स' : 'Plates Sold'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-950/70 text-amber-400 flex items-center justify-center border border-amber-700/60 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-200 tracking-tight">
            {totalPlatesSold} <span className="text-xs font-bold text-stone-400">{lang === 'mr' ? 'प्लेट्स' : 'Plates'}</span>
          </div>
          <p className="text-[10px] text-stone-400 font-semibold truncate">
            {lang === 'mr' ? 'सुक्का, फ्राय व भाजी' : 'Single Curry & Fry'}
          </p>
        </div>

        {/* 5. Total Extras Sold */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-cyan-900/40 space-y-1.5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">
              {lang === 'mr' ? 'एक्स्ट्रा पदार्थ' : 'Extras Sold'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-950/70 text-cyan-400 flex items-center justify-center border border-cyan-700/60 shrink-0">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-300 tracking-tight">
            {totalExtrasSold} <span className="text-xs font-bold text-stone-400">{lang === 'mr' ? 'नग' : 'Items'}</span>
          </div>
          <p className="text-[10px] text-stone-400 font-semibold truncate">
            {lang === 'mr' 
              ? `भाकरी, पापड इ. ${totalExtraThalisSold > 0 ? `(+${totalExtraThalisSold} ताट)` : ''}`
              : `Bhakri, Papad (+${totalExtraThalisSold} thalis)`}
          </p>
        </div>

        {/* 6. Parcel Orders & Revenue */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-purple-900/40 space-y-1.5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-purple-400 uppercase tracking-wider">
              {lang === 'mr' ? '🛍️ पार्सल विक्री' : '🛍️ Parcel Sales'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-950/70 text-purple-400 flex items-center justify-center border border-purple-700/60 shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-300 tracking-tight">
            {parcelCount} <span className="text-xs font-bold text-stone-400">({lang === 'mr' ? 'पार्सल' : 'qty'})</span>
          </div>
          <p className="text-[10px] text-purple-300 font-bold truncate">
            ₹{parcelTotal}/- {lang === 'mr' ? 'पार्सल उत्पन्न' : 'revenue'}
          </p>
        </div>

      </div>

      {/* --- TAB 1: OVERVIEW ANALYTICS --- */}
      {viewTab === 'overview' && (
        <div className="space-y-4">
          
          {/* Payment Method Breakup */}
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 shadow-xl">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-400" />
              <span>{lang === 'mr' ? 'पेमेंट प्रकारानुसार विभाजन' : 'Payment Type Breakdown'}</span>
            </h4>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {/* Cash */}
                <div className="p-3 rounded-xl bg-stone-950 border border-emerald-900/40 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>💵 Cash</span>
                    <span className="text-emerald-400 font-bold">{lang === 'mr' ? 'रोख' : 'Cash'}</span>
                  </div>
                  <div className="text-lg font-black text-stone-100">₹{cashTotal}</div>
                </div>

                {/* UPI */}
                <div className="p-3 rounded-xl bg-stone-950 border border-amber-900/40 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>📱 UPI</span>
                    <span className="text-amber-400 font-bold">{lang === 'mr' ? 'ऑनलाइन' : 'Online'}</span>
                  </div>
                  <div className="text-lg font-black text-stone-100">₹{upiTotal}</div>
                </div>

                {/* Udhar */}
                <div className="p-3 rounded-xl bg-stone-950 border border-red-900/40 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>📝 Udhar</span>
                    <span className="text-red-400 font-bold">{lang === 'mr' ? 'उधार' : 'Credit'}</span>
                  </div>
                  <div className="text-lg font-black text-red-400">₹{udharTotal}</div>
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
      )}

      {/* --- TAB 2: DETAILED ORDER RECORDS MANAGEMENT --- */}
      {viewTab === 'orders_log' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4 shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>{lang === 'mr' ? 'ऑर्डर्स नोंदवही व तपशीलवार यादी' : 'Order Records Register & History'}</span>
              </h4>
              <p className="text-xs text-stone-400">
                {lang === 'mr'
                  ? `निवडलेल्या कालावधीतील एकूण ${searchedOrders.length} ऑर्डर्स डेटाबेसमध्ये उपलब्ध आहेत.`
                  : `Showing ${searchedOrders.length} order records saved in database.`}
              </p>
            </div>

            {/* Search Box */}
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={lang === 'mr' ? 'ऑर्डर क्र., टेबल, पार्सल किंवा नाव शोधा...' : 'Search ID, Table, Parcel, Customer...'}
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>
          </div>

          {searchedOrders.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-xs italic">
              {lang === 'mr' ? 'कोणतीही ऑर्डर सापडली नाही.' : 'No order records match your criteria.'}
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {searchedOrders.map((ord) => {
                const isParcel = ord.tableNo === 'Parcel' || (ord.tableNo && String(ord.tableNo).toLowerCase().includes('parcel'));
                return (
                  <div
                    key={ord.id}
                    className="bg-stone-950 p-3.5 rounded-xl border border-stone-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {ord.id}
                        </span>
                        
                        {/* Table No or Parcel Badge */}
                        <span className={`font-bold px-2 py-0.5 rounded border ${
                          isParcel 
                            ? 'bg-purple-950/60 text-purple-300 border-purple-700/60' 
                            : 'bg-stone-900 text-stone-200 border-stone-700'
                        }`}>
                          {isParcel ? '🛍️ पार्सल (Parcel)' : `🍽️ ${ord.tableNo}`}
                        </span>

                        <span className="text-[11px] text-stone-400">
                          {new Date(ord.timestamp).toLocaleString('mr-IN')}
                        </span>
                        {ord.customerName && (
                          <span className="text-[11px] text-stone-300 font-semibold">
                            • {ord.customerName} {ord.customerPhone ? `(${ord.customerPhone})` : ''}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-stone-300 pt-1">
                        {(ord.items || []).map((i) => `${i.nameMr || i.nameEn} x ${i.quantity}`).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-stone-800">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        ord.paymentMethod === 'Cash'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : ord.paymentMethod === 'UPI'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {ord.paymentMethod || 'Cash'}
                      </span>

                      <span className="text-sm font-black text-amber-300">
                        ₹{ord.grandTotal}/-
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* --- TAB 3: DAILY EOD CLOSE REPORTS HISTORY (WITH AUTOMATIC FALLBACK RE-CALCULATION) --- */}
      {viewTab === 'eod_history' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4 shadow-xl">
          
          <div className="border-b border-stone-800 pb-3">
            <h4 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>{lang === 'mr' ? 'दैनंदिन विक्री क्लोजिंग अहवाल इतिहास' : 'Daily EOD Closing Reports History'}</span>
            </h4>
            <p className="text-xs text-stone-400">
              {lang === 'mr'
                ? 'मागील सर्व दिवसांचे क्लोजिंग सारांश, ताट, प्लेट्स, एक्स्ट्रा व पार्सल रेकॉर्ड्स डेटाबेसमध्ये कायमस्वरूपी उपलब्ध.'
                : 'Permanent archive of daily close reports with thalis, plates, extras & parcels stored in database.'}
            </p>
          </div>

          {(!eodReports || eodReports.length === 0) ? (
            <div className="text-center py-10 text-stone-400 text-xs italic">
              {lang === 'mr' ? 'अद्याप कोणताही दैनिक अहवाल क्लोज केलेला नाही.' : 'No daily closing reports found.'}
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {eodReports.map((report) => {
                const isExpanded = expandedEodId === report.id;

                // Find matching orders for that day from database orders
                const dayOrders = orders.filter((o) => {
                  const oDate = new Date(o.timestamp).toISOString().split('T')[0];
                  return oDate === report.dateKey;
                });

                let dayThali = 0;
                let dayPlate = 0;
                let dayExtras = 0;
                let dayParcelCount = 0;
                let dayParcelTotal = 0;
                let dayDineInCount = 0;
                let dayDineInTotal = 0;
                const computedDishMap = {};

                dayOrders.forEach((o) => {
                  const isParcel = o.tableNo === 'Parcel' || (o.tableNo && String(o.tableNo).toLowerCase().includes('parcel'));
                  if (isParcel) {
                    dayParcelCount += 1;
                    dayParcelTotal += (o.grandTotal || 0);
                  } else {
                    dayDineInCount += 1;
                    dayDineInTotal += (o.grandTotal || 0);
                  }

                  (o.items || []).forEach((item) => {
                    const qty = item.quantity || 1;
                    if (isItemThali(item)) {
                      dayThali += qty;
                    } else if (isItemExtra(item)) {
                      dayExtras += qty;
                    } else {
                      dayPlate += qty;
                    }

                    const key = item.nameMr || item.nameEn || item.id;
                    if (!computedDishMap[key]) {
                      computedDishMap[key] = { nameMr: item.nameMr, count: 0, revenue: 0 };
                    }
                    computedDishMap[key].count += qty;
                    computedDishMap[key].revenue += ((item.price || 0) * qty + (item.extraThalis || 0) * 60);
                  });
                });

                const finalThali = (report.thaliCount && report.thaliCount > 0) ? report.thaliCount : dayThali;
                const finalPlate = (report.plateCount && report.plateCount > 0) ? report.plateCount : dayPlate;
                const finalExtras = (report.extrasCount && report.extrasCount > 0) ? report.extrasCount : dayExtras;
                const finalParcelCount = (report.parcelCount && report.parcelCount > 0) ? report.parcelCount : dayParcelCount;
                const finalParcelTotal = (report.parcelTotal && report.parcelTotal > 0) ? report.parcelTotal : dayParcelTotal;
                const finalDineInCount = (report.totalOrders ? Math.max(0, report.totalOrders - finalParcelCount) : dayDineInCount);
                const finalDineInTotal = (report.totalRevenue ? Math.max(0, report.totalRevenue - finalParcelTotal) : dayDineInTotal);

                const topDishesList = (report.topDishes && report.topDishes.length > 0) 
                  ? report.topDishes 
                  : Object.values(computedDishMap).sort((a, b) => b.count - a.count).slice(0, 5);

                return (
                  <div
                    key={report.id}
                    className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3 transition"
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedEodId(isExpanded ? null : report.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-stone-100">
                            {lang === 'mr' ? `अहवाल: ${report.dateKey}` : `Report: ${report.dateKey}`}
                          </h5>
                          <span className="text-[10px] text-stone-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(report.closedAt).toLocaleString('mr-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 block">{lang === 'mr' ? 'एकूण विक्री' : 'Total Revenue'}</span>
                          <span className="text-sm sm:text-base font-black text-amber-400">₹{report.totalRevenue}/-</span>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </div>

                    {/* Payment & Orders Summary Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="bg-stone-900/80 p-2 rounded-xl border border-stone-800 text-center">
                        <span className="text-[10px] text-stone-400 block">{lang === 'mr' ? 'एकूण ऑर्डर्स' : 'Total Orders'}</span>
                        <span className="font-bold text-stone-200">{report.totalOrders}</span>
                      </div>
                      <div className="bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/40 text-center">
                        <span className="text-[10px] text-emerald-400 block">💵 {lang === 'mr' ? 'रोख' : 'Cash'}</span>
                        <span className="font-bold text-emerald-300">₹{report.cashTotal}</span>
                      </div>
                      <div className="bg-amber-950/40 p-2 rounded-xl border border-amber-800/40 text-center">
                        <span className="text-[10px] text-amber-400 block">📱 UPI</span>
                        <span className="font-bold text-amber-300">₹{report.upiTotal}</span>
                      </div>
                      <div className="bg-red-950/40 p-2 rounded-xl border border-red-800/40 text-center">
                        <span className="text-[10px] text-red-400 block">📝 {lang === 'mr' ? 'उधार' : 'Udhar'}</span>
                        <span className="font-bold text-red-300">₹{report.udharTotal}</span>
                      </div>
                    </div>

                    {/* Thalis, Plates, Extras & Parcels Grid (Always Visible & Computed) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-xs text-center">
                      <div className="bg-stone-900/90 p-2 rounded-xl border border-orange-900/40">
                        <span className="text-[10px] text-orange-400 font-bold block">🍱 {lang === 'mr' ? 'ताट (थाळी)' : 'Thalis'}</span>
                        <span className="font-black text-orange-300 text-sm">{finalThali}</span>
                      </div>
                      <div className="bg-stone-900/90 p-2 rounded-xl border border-amber-900/40">
                        <span className="text-[10px] text-amber-400 font-bold block">🍛 {lang === 'mr' ? 'प्लेट्स' : 'Plates'}</span>
                        <span className="font-black text-amber-300 text-sm">{finalPlate}</span>
                      </div>
                      <div className="bg-stone-900/90 p-2 rounded-xl border border-cyan-900/40">
                        <span className="text-[10px] text-cyan-400 font-bold block">🫓 {lang === 'mr' ? 'एक्स्ट्रा' : 'Extras'}</span>
                        <span className="font-black text-cyan-300 text-sm">{finalExtras}</span>
                      </div>
                      <div className="bg-purple-950/40 p-2 rounded-xl border border-purple-800/40">
                        <span className="text-[10px] text-purple-400 font-bold block">🛍️ {lang === 'mr' ? 'पार्सल' : 'Parcel'}</span>
                        <span className="font-black text-purple-300 text-sm">{finalParcelCount} <span className="text-[10px] font-normal text-purple-400">(₹{finalParcelTotal})</span></span>
                      </div>
                    </div>

                    {/* Expanded Details: Dine-in vs Parcel and Top Dishes */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-stone-800/80 space-y-2.5 text-xs animate-fade-in">
                        {/* Dine-In vs Parcel Breakup */}
                        <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                          <div className="bg-stone-900 p-2 rounded-lg border border-stone-700">
                            <span className="text-stone-400 block font-semibold">🍽️ {lang === 'mr' ? 'डायनिंग टेबल विक्री' : 'Dine-In Sales'}</span>
                            <span className="font-bold text-stone-200">{finalDineInCount} ऑर्डर्स (₹{finalDineInTotal})</span>
                          </div>
                          <div className="bg-purple-950/40 p-2 rounded-lg border border-purple-800/50">
                            <span className="text-purple-400 block font-semibold">🛍️ {lang === 'mr' ? 'पार्सल विक्री' : 'Parcel Sales'}</span>
                            <span className="font-bold text-purple-300">{finalParcelCount} पार्सल (₹{finalParcelTotal})</span>
                          </div>
                        </div>

                        {topDishesList && topDishesList.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold text-amber-400 block">
                              {lang === 'mr' ? 'त्या दिवसाचे सर्वाधिक विकलेले पदार्थ:' : 'Top Dishes that day:'}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {topDishesList.map((td, tIdx) => (
                                <span key={tIdx} className="bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-700 text-[11px] text-stone-300 flex items-center gap-1.5">
                                  <span className="text-amber-400 font-bold">#{tIdx + 1}</span>
                                  <span>{td.nameMr || td.nameEn}</span>
                                  <strong className="text-amber-300 font-mono">({td.count} नग • ₹{td.revenue})</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

