import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UpiQrModal } from '../common/UpiQrModal';
import { ShoppingBag, X, Plus, Minus, Trash2, ShieldAlert, CreditCard, Banknote, CheckCircle, Sparkles, QrCode, Smartphone, MessageSquare, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CartDrawer = ({ isOpen, onClose, onOpenTracker }) => {
  const {
    lang,
    tableNo,
    setTableNo,
    cart,
    orders,
    activeOrderId,
    updateQuantity,
    updateExtraThalis,
    clearCart,
    specialNotes,
    setSpecialNotes,
    createOrder,
    allTables,
    t
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash', 'UPI', 'Udhar'
  const [isUpiQrOpen, setIsUpiQrOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableError, setTableError] = useState('');

  const availableTableList = allTables || ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Parcel'];

  if (!isOpen) return null;

  // Calculate totals
  const itemTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const extraThaliTotal = cart.reduce((sum, item) => sum + (item.extraThalis || 0) * 60, 0);
  const grandTotal = itemTotal + extraThaliTotal;

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Check table occupancy
    const activeOrderOnTable = orders.find(
      (o) => o.tableNo === tableNo && o.status !== 'completed'
    );
    if (tableNo !== 'Parcel' && activeOrderOnTable && activeOrderOnTable.id !== activeOrderId) {
      setTableError(`⚠️ ${tableNo} हे सध्या व्यस्त आहे. कृपया दुसरे मोकळे टेबल निवडा!`);
      return;
    }
    setTableError('');

    setIsSubmitting(true);

    setTimeout(() => {
      const newOrder = createOrder({
        tableNo,
        customerName: customerName || '',
        customerPhone: '',
        items: cart,
        specialNotes,
        paymentMethod,
        itemTotal,
        extraThaliTotal,
        grandTotal
      });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}

      setIsSubmitting(false);
      onClose();
      if (onOpenTracker) onOpenTracker();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-fade-in">
      
      {/* Exact Match Card UI: "काउंटर ऑर्डर बिल (POS Summary)" */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181716] border border-amber-600/40 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        
        {/* Card Top Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-[#141312]">
          <h3 className="text-base font-black text-amber-400 tracking-wide flex items-center gap-2">
            <span>काउंटर ऑर्डर बिल (POS Summary)</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-900 text-stone-400 hover:text-white border border-stone-800 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Content Form */}
        <form onSubmit={handleSubmitOrder} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* 1. Table Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 block">टेबल क्र.</label>
            <select
              value={tableNo}
              onChange={(e) => setTableNo(e.target.value)}
              className="w-full bg-[#0d0c0c] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-100 focus:outline-none focus:border-amber-500 transition"
            >
              {availableTableList.map((tbl) => (
                <option key={tbl} value={tbl}>{tbl === 'Parcel' ? '🛍️ पार्सल' : tbl}</option>
              ))}
            </select>
          </div>

          {/* Table Error Banner if occupied */}
          {tableError && (
            <div className="p-2.5 rounded-xl bg-red-950/90 border border-red-600 text-red-200 text-xs font-bold flex items-center justify-between">
              <span>{tableError}</span>
              <button type="button" onClick={() => setTableError('')} className="p-0.5 text-red-400 hover:text-white">✕</button>
            </div>
          )}

          {/* 2. Customer Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 block">ग्राहक नाव</label>
            <input
              type="text"
              placeholder={lang === 'mr' ? 'ग्राहकाचे नाव टाका' : 'Enter Customer Name'}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-[#0d0c0c] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* 3. Payment Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 block">पेमेंट प्रकार (Payment Type)</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`py-2.5 px-2 rounded-xl text-xs font-black transition border flex items-center justify-center gap-1.5 min-h-[44px] ${
                  paymentMethod === 'Cash'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                    : 'bg-[#0d0c0c] text-stone-300 border-stone-800 hover:border-stone-700'
                }`}
              >
                <Banknote className="w-3.5 h-3.5 shrink-0" />
                <span>कॅश</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`py-2.5 px-2 rounded-xl text-xs font-black transition border flex items-center justify-center gap-1.5 min-h-[44px] ${
                  paymentMethod === 'UPI'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                    : 'bg-[#0d0c0c] text-stone-300 border-stone-800 hover:border-stone-700'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 shrink-0" />
                <span>UPI</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Udhar')}
                className={`py-2.5 px-2 rounded-xl text-xs font-black transition border flex items-center justify-center gap-1.5 min-h-[44px] ${
                  paymentMethod === 'Udhar'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                    : 'bg-[#0d0c0c] text-stone-300 border-stone-800 hover:border-stone-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>उधार</span>
              </button>
            </div>
          </div>

          {/* 4. Cart Selected Dishes List */}
          <div className="pt-2 border-t border-stone-800/80 space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-6 text-stone-500 text-xs font-bold">
                🛒 कार्टमध्ये कोणतेही पदार्थ जोडलेले नाहीत
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs py-1">
                  <span className="text-stone-200 font-bold">{lang === 'mr' ? item.nameMr : item.nameEn}</span>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#0d0c0c] border border-stone-800 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-2.5 py-1 text-stone-400 hover:text-white font-black bg-stone-900"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-stone-100 font-black font-mono">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="px-2.5 py-1 text-stone-400 hover:text-white font-black bg-stone-900"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-mono font-black text-amber-400 min-w-[50px] text-right">
                      ₹{item.price * item.quantity + (item.extraThalis || 0) * 60}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 5. Special Cooking Instructions */}
          {cart.length > 0 && (
            <div className="pt-1">
              <input
                type="text"
                placeholder={lang === 'mr' ? 'विशेष सूचना टाका...' : 'Special Cooking Notes...'}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="w-full bg-[#0d0c0c] border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-amber-300 italic focus:outline-none placeholder:text-stone-600"
              />
            </div>
          )}

          {/* 6. Prominent Orange Submit Order Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-950/50 disabled:opacity-50 transition active:scale-98 min-h-[48px]"
            >
              {isSubmitting ? 'ऑर्डर सबमिट होत आहे...' : 'ऑर्डर पाठवा (SUBMIT ORDER)'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
