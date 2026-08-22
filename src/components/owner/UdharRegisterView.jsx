import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Search, CheckCircle2, User, Smartphone, Calendar, Banknote, CreditCard, ShieldCheck, Download, Eye, X, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const UdharRegisterView = () => {
  const { orders, setOrders, lang, settleUdharPayment, deleteUdharRecord } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'cleared', 'all'
  const [settlingOrderId, setSettlingOrderId] = useState(null);
  const [inspectOrder, setInspectOrder] = useState(null);

  // Filter Udhar orders (only orders with active udhar tracking)
  const udharOrders = orders.filter((o) => o.paymentMethod === 'Udhar' || (o.udharStatus && o.udharStatus !== 'none'));

  const isUdharPending = (o) => !o.settledAt || o.udharStatus === 'pending';
  const isUdharCleared = (o) => !!o.settledAt && o.udharStatus !== 'pending';

  const filteredOrders = udharOrders.filter((o) => {
    const pending = isUdharPending(o);
    if (statusFilter === 'pending' && !pending) return false;
    if (statusFilter === 'cleared' && pending) return false;

    const query = searchTerm.toLowerCase();
    return (
      o.customerName?.toLowerCase().includes(query) ||
      o.customerPhone?.includes(query) ||
      o.tableNo?.toLowerCase().includes(query) ||
      o.id?.toLowerCase().includes(query)
    );
  });

  const totalUdharPending = udharOrders
    .filter(isUdharPending)
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const totalUdharCleared = udharOrders
    .filter(isUdharCleared)
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const pendingCount = udharOrders.filter(isUdharPending).length;
  const clearedCount = udharOrders.filter(isUdharCleared).length;

  const downloadUdharCsv = () => {
    const headers = ['Order ID', 'Table No', 'Customer Name', 'Phone', 'Grand Total (Rs)', 'Status', 'Date & Time', 'Settled At'];
    const rows = filteredOrders.map((o) => [
      `"${o.id}"`,
      `"${o.tableNo}"`,
      `"${o.customerName || 'N/A'}"`,
      `"${o.customerPhone || 'N/A'}"`,
      o.grandTotal,
      `"${isUdharCleared(o) ? 'जमा झाले (Cleared)' : 'प्रलंबित (Pending)'}"`,
      `"${new Date(o.timestamp).toLocaleString('mr-IN')}"`,
      `"${o.settledAt ? new Date(o.settledAt).toLocaleString('mr-IN') : 'N/A'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hotel_Aaradhya_Udhar_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSettleUdhar = async (orderId, newPaymentMethod) => {
    if (settleUdharPayment) {
      await settleUdharPayment(orderId, newPaymentMethod);
    } else {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              udharStatus: 'cleared',
              clearedPaymentMethod: newPaymentMethod,
              settledAt: new Date().toISOString()
            };
          }
          return o;
        })
      );
    }

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
    setSettlingOrderId(null);
    if (inspectOrder?.id === orderId) {
      setInspectOrder(null);
    }
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-4 pb-20 md:pb-8 animate-fade-in">
      
      {/* Top Banner & Control Header */}
      <div className="bg-stone-900 border border-amber-600/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-400">
                {lang === 'mr' ? 'उधार खाते नोंदणी पुस्तक' : 'Udhar Credit Ledger'}
              </h2>
              <p className="text-[11px] text-stone-400">
                {lang === 'mr' ? 'उधारी बिलांचा हिशोब व तत्काळ जमा वसुली' : 'Manage customer credit balances & instant recovery'}
              </p>
            </div>
          </div>

          {/* Quick Summary Metrics & CSV Download */}
          <div className="flex items-center gap-2">
            <div className="bg-stone-950/80 border border-red-500/40 rounded-xl px-3 py-1.5 text-center shrink-0">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">
                {lang === 'mr' ? 'प्रलंबित उधारी' : 'Pending Credit'}
              </span>
              <span className="text-sm sm:text-base font-black text-red-400">₹{totalUdharPending}</span>
            </div>

            <div className="bg-stone-950/80 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-center shrink-0">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">
                {lang === 'mr' ? 'वसूल उधारी' : 'Recovered Credit'}
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-400">₹{totalUdharCleared}</span>
            </div>

            <button
              type="button"
              onClick={downloadUdharCsv}
              className="p-2 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 flex items-center justify-center transition min-w-[38px] min-h-[38px] shrink-0"
              title={lang === 'mr' ? 'उधार खाते अहवाल डाऊनलोड करा' : 'Download Udhar CSV'}
            >
              <Download className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Filter Pills & Search Bar Group */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 border-t border-stone-800/80">
          
          {/* Status Filter Pills */}
          <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 overflow-x-auto no-scrollbar gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap text-center ${
                statusFilter === 'pending' ? 'bg-amber-500 text-stone-950 font-black shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {lang === 'mr' ? `📝 प्रलंबित (${pendingCount})` : `📝 Pending (${pendingCount})`}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('cleared')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap text-center ${
                statusFilter === 'cleared' ? 'bg-amber-500 text-stone-950 font-black shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {lang === 'mr' ? `✅ जमा झालेले (${clearedCount})` : `✅ Cleared (${clearedCount})`}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap text-center ${
                statusFilter === 'all' ? 'bg-amber-500 text-stone-950 font-black shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {lang === 'mr' ? `सर्व (${udharOrders.length})` : `All (${udharOrders.length})`}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={lang === 'mr' ? 'नाव, मोबाईल किंवा ऑर्डर क्र. शोधा...' : 'Search name, phone or order ID...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition min-h-[38px]"
            />
          </div>

        </div>

      </div>

      {/* Udhar Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-10 text-center space-y-2.5 shadow-xl">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
          <h3 className="text-sm font-bold text-stone-200">
            {lang === 'mr' ? 'कोणतीही उधार नोंद आढळली नाही' : 'No matching Udhar records found'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {lang === 'mr' ? 'निवडलेल्या फिल्टरनुसार कोणतीही प्रलंबित किंवा जमा उधारी नोंद उपलब्ध नाही.' : 'All credit bills have been settled cleanly.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredOrders.map((order) => {
            const pending = isUdharPending(order);

            return (
              <div
                key={order.id}
                className={`bg-stone-900 border rounded-2xl p-4 space-y-3 relative shadow-lg transition ${
                  pending
                    ? 'border-amber-600/50 bg-stone-900/90'
                    : 'border-emerald-600/30 opacity-80'
                }`}
              >
                {/* Header: Order ID & Status */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-400">{order.id}</span>
                    <span className="text-xs font-bold text-stone-300 bg-stone-950 px-2 py-0.5 rounded-md border border-stone-700">
                      {order.tableNo}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      pending
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    }`}
                  >
                    {pending ? '📝 जमा येणे बाकी' : '✅ जमा झाले'}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-stone-100 font-extrabold text-sm">
                      <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{order.customerName || '-'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectOrder(order)}
                      className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold transition flex items-center gap-1"
                      title="ऑर्डरचे सविस्तर तपशील पहा"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[11px]">तपशील</span>
                    </button>
                  </div>

                  {order.customerPhone && (
                    <div className="flex items-center gap-1.5 text-stone-400 font-mono">
                      <Smartphone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <a href={`tel:${order.customerPhone}`} className="hover:text-amber-300 transition">
                        +91 {order.customerPhone}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                    <span>{new Date(order.timestamp).toLocaleString('mr-IN')}</span>
                  </div>
                </div>

                {/* Items Summary Preview */}
                <div className="bg-stone-950/70 rounded-xl p-2.5 space-y-1 text-xs border border-stone-800/60">
                  {order.items?.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-stone-300 text-[11px]">
                      <span>{item.nameMr} x {item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <div className="text-[10px] text-amber-400 font-bold text-right pt-0.5">
                      +{order.items.length - 3} इतर पदार्थ...
                    </div>
                  )}
                </div>

                {/* Total & Action */}
                <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">एकूण उधारी बिल</span>
                    <span className="text-base font-black text-amber-400">₹{order.grandTotal}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {pending ? (
                      <button
                        type="button"
                        onClick={() => setSettlingOrderId(order.id)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs hover:scale-105 transition shadow"
                      >
                        जमा वसूल करा ➔
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{order.clearedPaymentMethod || order.paymentMethod} द्वारे प्राप्त</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(lang === 'mr' ? `तुम्हाला ${order.customerName || order.id} यांची उधार नोंद डेटाबेसमधून पूर्णपणे हटवायची आहे का?` : `Are you sure you want to remove Udhar record for ${order.customerName || order.id} from database?`)) {
                          await deleteUdharRecord(order.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition"
                      title={lang === 'mr' ? 'ही उधार नोंद डेटाबेसमधून हटवा' : 'Delete Udhar record from database'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Settlement Options Inline */}
                {settlingOrderId === order.id && (
                  <div className="p-3 bg-stone-950 border border-amber-500/50 rounded-xl space-y-2 text-center animate-fade-in">
                    <p className="text-xs font-bold text-amber-300">
                      {order.customerName} यांच्याकडून पेमेंट जमा झाले व डेटाबेसमधून प्रलंबित उधार नोंद हटवायची आहे?
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSettleUdhar(order.id, 'Cash')}
                        className="py-2 px-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>💵 Cash जमा</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSettleUdhar(order.id, 'UPI')}
                        className="py-2 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1 transition"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>📱 UPI जमा</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSettlingOrderId(null)}
                      className="text-[10px] text-stone-400 hover:text-stone-200 underline pt-1 block mx-auto"
                    >
                      रद्द करा
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL: INSPECT ITEMIZE UDHAR ORDER DETAILS --- */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-stone-900 border border-amber-600/40 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-black text-amber-400">{inspectOrder.customerName || '-'}</h3>
                <p className="text-xs text-stone-400">ऑर्डर क्र. {inspectOrder.id} • {inspectOrder.tableNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectOrder(null)}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-300">
                <span className="text-stone-400">मोबाईल नंबर:</span>
                <strong className="text-amber-300 font-mono">+91 {inspectOrder.customerPhone || 'उपलब्ध नाही'}</strong>
              </div>
              <div className="flex justify-between text-stone-300">
                <span className="text-stone-400">दिनांक व वेळ:</span>
                <strong className="text-stone-200">{new Date(inspectOrder.timestamp).toLocaleString('mr-IN')}</strong>
              </div>
            </div>

            {/* Itemized Breakdown */}
            <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 space-y-2 max-h-48 overflow-y-auto">
              <h4 className="text-xs font-bold text-amber-400 border-b border-stone-800 pb-1">ऑर्डर मधील पदार्थ:</h4>
              {inspectOrder.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs py-1 border-b border-stone-800/40 last:border-0">
                  <span className="text-stone-200 font-bold">{item.nameMr} x {item.quantity}</span>
                  <span className="text-amber-300 font-bold">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm bg-stone-950 p-3 rounded-2xl border border-amber-600/30">
              <span className="font-bold text-stone-300">एकूण बिल:</span>
              <span className="font-black text-amber-400 text-lg">₹{inspectOrder.grandTotal}</span>
            </div>

            {inspectOrder.status !== 'completed' ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSettleUdhar(inspectOrder.id, 'Cash')}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Banknote className="w-4 h-4" />
                  <span>💵 Cash जमा</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSettleUdhar(inspectOrder.id, 'UPI')}
                  className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>📱 UPI जमा</span>
                </button>
              </div>
            ) : (
              <div className="text-center p-2 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 font-bold text-xs">
                ✅ हे उधार बिल वसूल झाले आहे ({inspectOrder.paymentMethod} द्वारे)
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
