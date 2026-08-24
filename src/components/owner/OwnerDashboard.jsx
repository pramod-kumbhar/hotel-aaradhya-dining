import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { sortMenuItemsThaliFirst } from '../../data/menuData';
import { MenuManager } from './MenuManager';
import { AnalyticsView } from './AnalyticsView';
import { BillReceiptModal } from './BillReceiptModal';
import { SettleOrderModal } from './SettleOrderModal';
import { EditOrderModal } from '../common/EditOrderModal';
import { UpiQrModal } from '../common/UpiQrModal';
import { ChefHat, UtensilsCrossed, Clock, CheckCircle2, Printer, Plus, Minus, Users, LayoutGrid, DollarSign, Search, ShieldAlert, Sparkles, Banknote, QrCode, CreditCard, ShieldCheck, X, Edit3, Package } from 'lucide-react';

export const OwnerDashboard = ({ initialTab = 'tables' }) => {
  const { lang, orders, updateOrderStatus, cancelOrder, updatePaymentMethod, addItemsToExistingOrder, createOrder, menuItems, cart, addToCart, updateQuantity, allTables, customTables, addCustomTable, removeCustomTable, DEFAULT_TABLES, t } = useApp();

  const [activeTab, setActiveTab] = useState(initialTab); // 'orders', 'new_order', 'tables', 'menu', 'analytics'

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'preparing', 'ready', 'completed'
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);
  const [settleModalOrder, setSettleModalOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [addItemsModalOrder, setAddItemsModalOrder] = useState(null);
  const [upiModalData, setUpiModalData] = useState({ isOpen: false, amount: 0, orderId: '' });
  const [tableAddCart, setTableAddCart] = useState([]);
  const [tableSearch, setTableSearch] = useState('');

  // New POS Order Form state
  const [posTable, setPosTable] = useState('Table 1');
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCart, setPosCart] = useState([]);
  const [posNotes, setPosNotes] = useState('');
  const [posPayment, setPosPayment] = useState('Cash');
  const [posSearch, setPosSearch] = useState('');
  const [posCategory, setPosCategory] = useState('all');
  const [posError, setPosError] = useState('');
  const [newTableNameInput, setNewTableNameInput] = useState('');
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);

  // Auto-refresh credentials (customer name, notes, payment method, error) whenever posTable changes
  React.useEffect(() => {
    setPosCustomerName('');
    setPosNotes('');
    setPosPayment('Cash');
    setPosError('');
  }, [posTable]);

  // Filtered orders with Today, Active, Completed & All filters
  const todayDateStr = new Date().toISOString().split('T')[0];
  const filteredOrders = orders.filter((ord) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return ord.status !== 'completed' && ord.status !== 'cancelled';
    if (statusFilter === 'today') {
      const ordDate = new Date(ord.timestamp).toISOString().split('T')[0];
      return ordDate === todayDateStr;
    }
    if (statusFilter === 'completed') return ord.status === 'completed';
    return ord.status === statusFilter;
  });

  // Table Matrix calculation using dynamic allTables
  const allTableNames = allTables || ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Parcel'];
  const tableStatusMap = {};
  allTableNames.forEach((tbl) => {
    const activeOrd = orders.find((o) => o.tableNo === tbl && o.status !== 'completed' && o.status !== 'cancelled');
    tableStatusMap[tbl] = activeOrd || null;
  });

  // POS Cart Handlers
  const addPosItem = (item) => {
    setPosCart((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { ...item, quantity: 1, extraThalis: 0 }];
    });
  };

  const updatePosQty = (itemId, delta) => {
    setPosCart((prev) =>
      prev
        .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const submitPosOrder = async (e) => {
    e.preventDefault();
    if (posCart.length === 0) return;

    // Validate table availability (ongoing order if not completed and not cancelled)
    const isOccupied = posTable !== 'Parcel' && orders.some(
      (o) => o.tableNo === posTable && o.status !== 'completed' && o.status !== 'cancelled'
    );
    if (isOccupied) {
      setPosError(
        lang === 'mr'
          ? `⚠️ ${posTable} उपलब्ध नाही! या टेबलवर आधीच चालू ऑर्डर सुरू आहे.`
          : `⚠️ ${posTable} is not available! An order is already ongoing on this table.`
      );
      return;
    }
    setPosError('');

    const itemTotal = posCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const extraThaliTotal = posCart.reduce((sum, i) => sum + (i.extraThalis || 0) * 60, 0);
    const grandTotal = itemTotal + extraThaliTotal;

    const res = await createOrder({
      tableNo: posTable,
      customerName: posCustomerName || '',
      items: posCart,
      specialNotes: posNotes,
      paymentMethod: posPayment,
      itemTotal,
      extraThaliTotal,
      grandTotal
    });

    if (res && res.error) {
      setPosError(res.message || (lang === 'mr' ? 'टेबल उपलब्ध नाही!' : 'Table is not available!'));
      return;
    }

    setPosCart([]);
    setPosNotes('');
    setPosCustomerName('');
    setPosError('');
    setActiveTab('orders');
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-4 pb-20 md:pb-8 animate-fade-in">
      
      {/* Top POS / KDS / Waiter Status Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-900/90 p-4 rounded-2xl border border-amber-600/30 shadow-xl">
        <div>
          <h2 className="text-lg font-black text-amber-300 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-400" />
            <span>
              {(activeTab === 'tables' || activeTab === 'pos') && (lang === 'mr' ? '📋 टेबल व्यवस्थापन & बिलिंग POS' : '📋 Table Management & POS Billing')}
              {activeTab === 'waiter' && (lang === 'mr' ? '🧑‍🍳 वेटर डॅशबोर्ड - चालू टेबल ऑर्डर्स' : '🧑‍🍳 Waiter Dashboard - Active Table Orders')}
              {activeTab === 'orders' && (lang === 'mr' ? '👨‍🍳 किचन ऑर्डर डिस्प्ले (KDS Wall)' : '👨‍🍳 Kitchen Display System (KDS)')}
              {activeTab === 'new_order' && (lang === 'mr' ? '📝 नवीन टेबल ऑर्डर नोंदवा' : '📝 Take New Table Order')}
            </span>
          </h2>
          <p className="text-xs text-stone-400">
            {lang === 'mr' 
              ? 'हॉटेल आराध्या डायनिंग - काउंटर व्यवस्थापन, वेटर ऑर्डर्स आणि किचन प्रणाली' 
              : 'Hotel Aaradhya Dining - Counter Management, Waiter Orders & KDS System'}
          </p>
        </div>

        {(activeTab === 'tables' || activeTab === 'waiter' || activeTab === 'pos') && (
          <button
            onClick={() => setActiveTab('new_order')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-orange-950/40 hover:scale-105 transition min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'mr' ? 'नवीन टेबल ऑर्डर घ्या' : 'Take New Table Order'}</span>
          </button>
        )}

        {activeTab === 'new_order' && (
          <button
            onClick={() => setActiveTab('tables')}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition border border-stone-700 min-h-[40px]"
          >
            <span>{lang === 'mr' ? '← टेबल्स कडे मागे जा' : '← Back to Tables'}</span>
          </button>
        )}
      </div>

      {/* --- TAB 1: LIVE ORDERS (KDS) --- */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Status Filter Buttons (Sleek Mobile Scrollable Container) */}
          <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 overflow-x-auto no-scrollbar gap-1 w-full">
            {[
              { id: 'pending', labelMr: 'चालू ऑर्डर्स', labelEn: 'Active Orders' },
              { id: 'today', labelMr: 'आजच्या ऑर्डर्स', labelEn: "Today's Orders" },
              { id: 'completed', labelMr: 'पूर्ण ऑर्डर्स', labelEn: 'Completed Orders' },
              { id: 'all', labelMr: 'सर्व रेकॉर्ड्स', labelEn: 'All History' }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`flex-1 sm:flex-initial min-w-[90px] px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 text-center ${
                  statusFilter === st.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {lang === 'mr' ? st.labelMr : st.labelEn}
              </button>
            ))}
          </div>

          {/* Orders Cards Grid or Empty State Card */}
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl bg-stone-900/60 border border-stone-800/80 space-y-3.5 my-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
                <ChefHat className="w-7 h-7 stroke-[2]" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm sm:text-base font-extrabold text-stone-200">
                  {statusFilter === 'pending'
                    ? (lang === 'mr' ? 'सध्या कोणतीही चालू ऑर्डर नाही' : 'No Active Orders Right Now')
                    : statusFilter === 'today'
                    ? (lang === 'mr' ? 'आजच्या तारखेला कोणतीही ऑर्डर नाही' : "No Orders for Today")
                    : statusFilter === 'completed'
                    ? (lang === 'mr' ? 'कोणतीही पूर्ण झालेली ऑर्डर नाही' : 'No Completed Orders Yet')
                    : (lang === 'mr' ? 'कोणतीही ऑर्डर सापडली नाही' : 'No Orders Found')}
                </h3>
                <p className="text-xs text-stone-400">
                  {lang === 'mr'
                    ? 'नवीन ऑर्डर घेण्याकरिता टेबल डॅशबोर्ड किंवा "नवीन ऑर्डर" बटणावर क्लिक करा.'
                    : 'To place a new order, navigate to Tables or tap "Take New Table Order".'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('new_order')}
                className="mt-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-orange-950/40 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{lang === 'mr' ? 'नवीन टेबल ऑर्डर घ्या' : 'Take New Table Order'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition ${
                    ord.status === 'pending'
                      ? 'bg-amber-950/20 border-amber-500/50 animate-pulse-glow'
                      : 'bg-stone-900/60 border-stone-800 opacity-80'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <div>
                      <span className="text-xs font-black text-amber-400">{ord.id}</span>
                      <h4 className="text-sm font-extrabold text-stone-100">{ord.tableNo}</h4>
                    </div>

                    <div className="text-right">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        ord.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : ord.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {ord.status === 'completed' ? (lang === 'mr' ? 'पूर्ण' : 'Completed') : ord.status === 'cancelled' ? (lang === 'mr' ? 'रद्ध' : 'Cancelled') : (lang === 'mr' ? 'चालू ऑर्डर' : 'Active')}
                      </span>
                      <p className="text-[10px] text-stone-400 mt-1">
                        {new Date(ord.timestamp).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 text-xs text-stone-200">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {item.nameMr} x {item.quantity}
                          {item.extraThalis > 0 && <strong className="text-amber-400 ml-1">(+{item.extraThalis} एक्स्ट्रा ताट)</strong>}
                        </span>
                        <span className="font-bold text-stone-400">
                          ₹{item.price * item.quantity + (item.extraThalis || 0) * 60}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Special Notes if any */}
                  {ord.specialNotes && (
                    <p className="text-[11px] text-amber-300 italic bg-amber-950/40 p-2 rounded border border-amber-800/40">
                      सूचना: "{ord.specialNotes}"
                    </p>
                  )}

                  {/* Grand Total & Print Receipt Button */}
                  <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-stone-400 block">{t.grandTotal}</span>
                      <span className="text-base font-black text-amber-400">₹{ord.grandTotal}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Payment Method Selector Dropdown */}
                      <select
                        value={ord.paymentMethod || 'Cash'}
                        onChange={(e) => updatePaymentMethod(ord.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                          ord.paymentMethod === 'Udhar'
                            ? 'bg-red-950/80 text-red-300 border-red-600'
                            : ord.paymentMethod === 'UPI'
                            ? 'bg-blue-950/80 text-blue-300 border-blue-600'
                            : 'bg-stone-800 text-amber-300 border-stone-700'
                        }`}
                      >
                        <option value="Cash">💵 {t.cash}</option>
                        <option value="UPI">📱 {t.upi}</option>
                        <option value="Udhar">📝 {t.udhar}</option>
                      </select>

                      {ord.paymentMethod === 'UPI' && (
                        <button
                          type="button"
                          onClick={() => setUpiModalData({ isOpen: true, amount: ord.grandTotal, orderId: ord.id })}
                          className="p-1 rounded bg-blue-950 text-blue-300 border border-blue-600 hover:bg-blue-900 transition"
                          title="UPI QR कोड दाखवा"
                        >
                          <QrCode className="w-3.5 h-3.5 text-blue-300" />
                        </button>
                      )}

                      <button
                        onClick={() => setEditingOrder(ord)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-stone-950 text-[11px] font-bold flex items-center gap-1 transition border border-amber-500/40"
                        title={lang === 'mr' ? 'ऑर्डर बदला व सुधारित करा' : 'Edit Order'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>बदला</span>
                      </button>

                      <button
                        onClick={() => setSelectedOrderForBill(ord)}
                        className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-200 text-[11px] font-bold flex items-center gap-1 hover:bg-stone-700 transition border border-stone-700"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>बिल</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Controls for Order Status Progression */}
                  <div className="pt-2 flex gap-1.5">
                    {ord.status !== 'completed' && ord.status !== 'cancelled' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'completed')}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black transition min-h-[38px]"
                        >
                          ✓ {lang === 'mr' ? 'ऑर्डर पूर्ण करा (Complete)' : 'Complete Order'}
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(lang === 'mr' ? 'तुम्हाला ही ऑर्डर रद्द करायची आहे का?' : 'Are you sure you want to cancel this order?')) {
                              cancelOrder(ord.id);
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-600/40 transition shrink-0 min-h-[38px]"
                          title={lang === 'mr' ? 'ऑर्डर रद्द करा' : 'Cancel Order'}
                        >
                          ✕ {lang === 'mr' ? 'रद्द' : 'Cancel'}
                        </button>
                      </>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* --- TAB 2: NEW POS ORDER ENTRY --- */}
      {activeTab === 'new_order' && (
        <div className="space-y-4">
          
          {/* Table Occupancy Error Alert Banner */}
          {posError && (
            <div className="p-3.5 rounded-2xl bg-red-950/90 border border-red-600 text-red-200 text-xs font-bold flex items-center justify-between shadow-lg">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{posError}</span>
              </span>
              <button type="button" onClick={() => setPosError('')} className="p-1 text-red-400 hover:text-white font-bold">✕</button>
            </div>
          )}

          {/* Menu Items Selector */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-stone-200">
                {lang === 'mr' ? 'पदार्थ निवडा' : 'Select Menu Items'}
              </h3>
              
              {/* POS Item Search Input */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={lang === 'mr' ? 'मेनू शोधा...' : 'Search menu...'}
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Category Filter Pills (Mobile Scrollable) */}
            <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 overflow-x-auto no-scrollbar gap-1">
              {[
                { id: 'all', labelMr: 'सर्व', labelEn: 'All' },
                { id: 'veg', labelMr: 'शाकाहारी', labelEn: 'Veg', dot: 'bg-emerald-500' },
                { id: 'egg', labelMr: 'अंडाकरी', labelEn: 'Egg', dot: 'bg-amber-400' },
                { id: 'chicken', labelMr: 'चिकन', labelEn: 'Chicken', dot: 'bg-red-500' },
                { id: 'mutton', labelMr: 'मटण', labelEn: 'Mutton', dot: 'bg-orange-600' },
                { id: 'extras', labelMr: 'इतर', labelEn: 'Extras', dot: 'bg-sky-500' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setPosCategory(cat.id)}
                  className={`px-3 py-2 min-h-[44px] rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition flex items-center justify-center gap-1.5 ${
                    posCategory === cat.id ? 'bg-amber-500 text-stone-950 font-black shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cat.dot && <span className={`w-2 h-2 rounded-full ${cat.dot}`} />}
                  <span>{lang === 'mr' ? cat.labelMr : cat.labelEn}</span>
                </button>
              ))}
            </div>

            {/* Filtered Menu Grid (Thalis first -> Plates second -> Extras third) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {sortMenuItemsThaliFirst(
                menuItems.filter((item) => {
                  const matchesCat = posCategory === 'all' || item.category === posCategory;
                  const matchesSearch =
                    item.nameMr.toLowerCase().includes(posSearch.toLowerCase()) ||
                    item.nameEn.toLowerCase().includes(posSearch.toLowerCase());
                  return matchesCat && matchesSearch;
                })
              ).map((item) => {
                  const cartItem = (cart || []).find((c) => c.id === item.id);
                  const qtyInCart = cartItem ? cartItem.quantity : 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className={`p-3 min-h-[58px] rounded-xl border flex items-center justify-between transition cursor-pointer select-none ${
                        qtyInCart > 0
                          ? 'bg-amber-950/30 border-amber-500/80 shadow-md shadow-amber-950/20'
                          : 'bg-stone-900 border-stone-800 hover:border-amber-500/50'
                      }`}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-stone-100 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            item.category === 'veg' ? 'bg-emerald-500' :
                            item.category === 'egg' ? 'bg-amber-400' :
                            item.category === 'chicken' ? 'bg-red-500' : 'bg-orange-600'
                          }`} />
                          <span>{lang === 'mr' ? item.nameMr : (item.nameEn || item.nameMr)}</span>
                        </h4>
                        <span className="text-[11px] text-amber-400 font-mono font-bold">₹{item.price}</span>
                      </div>

                      {qtyInCart > 0 ? (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 bg-amber-500 text-stone-950 p-1 rounded-xl shadow font-black"
                        >
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-amber-600/60 hover:bg-amber-700 text-stone-950 flex items-center justify-center transition min-h-[28px]"
                          >
                            <Minus className="w-4 h-4 text-stone-950" />
                          </button>

                          <span className="px-2 text-xs font-black font-mono min-w-[20px] text-center">
                            {qtyInCart}
                          </span>

                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="w-7 h-7 rounded-lg bg-amber-600/60 hover:bg-amber-700 text-stone-950 flex items-center justify-center transition min-h-[28px]"
                          >
                            <Plus className="w-4 h-4 text-stone-950" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item);
                          }}
                          className="min-h-[42px] min-w-[42px] rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center hover:bg-amber-500 hover:text-stone-950 transition active:scale-95 border border-amber-500/40"
                          title={lang === 'mr' ? 'ऑर्डरमध्ये जोडा' : 'Add to Order'}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: TABLE OCCUPANCY MATRIX (POS & WAITER VIEW) --- */}
      {(activeTab === 'tables' || activeTab === 'waiter' || activeTab === 'pos') && (
        <div className="space-y-4">
          {/* Table Cards Grid (Desktop & Mobile Optimized) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
              {allTableNames.map((tbl) => {
                const isParcelCard = tbl === 'Parcel';
                const activeParcelOrders = isParcelCard 
                  ? orders.filter((o) => (o.tableNo === 'Parcel' || o.isParcel || (o.tableNo && String(o.tableNo).toLowerCase().includes('parcel'))) && o.status !== 'completed' && o.status !== 'cancelled')
                  : [];
                const activeOrd = tableStatusMap[tbl];
                const isCustom = customTables.includes(tbl);

                // 1. Specialized Dedicated Render for Parcel / Takeaway Counter
                if (isParcelCard) {
                  return (
                    <div
                      key={tbl}
                      className="p-5 rounded-2xl border flex flex-col justify-between space-y-3 transition bg-gradient-to-br from-purple-950/40 via-stone-900 to-stone-900 border-purple-600/50 shadow-xl"
                    >
                      {/* Parcel Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/40">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-base font-extrabold text-purple-200">
                              {lang === 'mr' ? '🛍️ पार्सल काउंटर' : '🛍️ Parcel Counter'}
                            </h4>
                            <span className="text-[10px] text-purple-400 font-semibold">
                              {lang === 'mr' ? 'टेकअवे (पार्सल)' : 'Takeaway Orders'}
                            </span>
                          </div>
                        </div>
                        <span className={`w-3 h-3 rounded-full ${activeParcelOrders.length > 0 ? 'bg-purple-400 animate-pulse' : 'bg-purple-500'}`} />
                      </div>

                      {/* Active Parcel Orders or Empty Counter State */}
                      {activeParcelOrders.length > 0 ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-300">
                              {lang === 'mr' ? `चालू पार्सल ऑर्डर्स (${activeParcelOrders.length})` : `Active Parcels (${activeParcelOrders.length})`}
                            </span>
                            <span className="text-[10px] font-bold text-purple-400">
                              ₹{activeParcelOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0)}
                            </span>
                          </div>

                          {/* List of active parcel orders */}
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {activeParcelOrders.map((pOrd) => (
                              <div key={pOrd.id} className="p-2.5 rounded-xl bg-stone-950/80 border border-purple-800/40 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-purple-300 text-[11px]">{pOrd.id}</span>
                                  <span className="font-black text-amber-400 text-xs">₹{pOrd.grandTotal}</span>
                                </div>
                                {pOrd.customerName && (
                                  <p className="text-[11px] text-stone-300 truncate">
                                    👤 {pOrd.customerName} {pOrd.customerPhone ? `(${pOrd.customerPhone})` : ''}
                                  </p>
                                )}
                                <p className="text-[10px] text-stone-400 truncate">
                                  {(pOrd.items || []).map(i => `${i.nameMr || i.nameEn} x ${i.quantity}`).join(', ')}
                                </p>

                                {/* Action buttons for this parcel */}
                                <div className="grid grid-cols-3 gap-1 pt-1 border-t border-stone-800/80">
                                  <button
                                    type="button"
                                    onClick={() => setSettleModalOrder(pOrd)}
                                    className="py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition"
                                    title="Pay Bill"
                                  >
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>{lang === 'mr' ? 'बिल जमा' : 'Pay'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingOrder(pOrd)}
                                    className="py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] flex items-center justify-center gap-1 transition border border-amber-500/30"
                                    title="Edit Order"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>{lang === 'mr' ? 'बदला' : 'Edit'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForBill(pOrd)}
                                    className="py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[10px] flex items-center justify-center gap-1 transition border border-stone-700"
                                    title="Print Bill"
                                  >
                                    <Printer className="w-3 h-3" />
                                    <span>{lang === 'mr' ? 'पावती' : 'Bill'}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Take Another Parcel Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setPosTable('Parcel');
                              setActiveTab('new_order');
                            }}
                            className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-purple-950/40"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{lang === 'mr' ? '+ आणखी एक पार्सल ऑर्डर घ्या' : '+ Take Another Parcel'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-lg w-fit border border-purple-800/60 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-purple-400" />
                            <span>{lang === 'mr' ? '🛍️ पार्सल काउंटर उपलब्ध' : '🛍️ Parcel Counter Ready'}</span>
                          </p>

                          <button
                            type="button"
                            onClick={() => {
                              setPosTable('Parcel');
                              setActiveTab('new_order');
                            }}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-purple-950/40 border border-purple-500/40"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{lang === 'mr' ? '🛍️ नवीन पार्सल ऑर्डर घ्या' : '🛍️ Take New Parcel Order'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                // 2. Standard Dining Table Card Render
                return (
                  <div
                    key={tbl}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 transition ${
                      activeOrd
                        ? 'bg-amber-950/30 border-amber-500/50 shadow-lg'
                        : 'bg-stone-900 border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-stone-100">{tbl}</h4>
                        {isCustom && (
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-950/80 px-1.5 py-0.5 rounded border border-orange-500/30">
                            कस्टम
                          </span>
                        )}
                      </div>
                      <span className={`w-3 h-3 rounded-full ${activeOrd ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                    </div>

                    {activeOrd ? (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <p className="text-xs text-stone-300 font-medium">
                            {lang === 'mr' ? 'ग्राहक: ' : 'Customer: '}<strong className="text-amber-300">{activeOrd.customerName}</strong>
                          </p>
                          <p className="text-xs text-stone-400">
                            {lang === 'mr' ? 'ऑर्डर: ' : 'Order: '}{activeOrd.id} ({activeOrd.items.length} {lang === 'mr' ? 'पदार्थ' : 'dishes'})
                          </p>
                          <p className="text-sm font-black text-amber-400 pt-0.5">
                            {lang === 'mr' ? 'चालू बिल: ' : 'Ongoing Total: '}₹{activeOrd.grandTotal}
                          </p>
                        </div>

                        {/* Table Action Buttons */}
                        <div className="pt-2 border-t border-stone-800 flex flex-col gap-1.5">
                          <button
                            onClick={() => setSettleModalOrder(activeOrd)}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-950/40 min-h-[38px]"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-200" />
                            <span>💳 {lang === 'mr' ? 'पेमेंट जमा करा (Pay Bill)' : 'Settle & Pay Bill'} 🟢</span>
                          </button>

                          <div className="grid grid-cols-3 gap-1">
                            <button
                              onClick={() => setEditingOrder(activeOrd)}
                              className="py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 hover:bg-amber-500/30 transition border border-amber-500/40 min-h-[36px]"
                              title={lang === 'mr' ? 'ऑर्डर बदला व सुधारित करा' : 'Edit Order'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{lang === 'mr' ? 'बदला' : 'Edit'}</span>
                            </button>

                            <button
                              onClick={() => {
                                setAddItemsModalOrder(activeOrd);
                                setTableAddCart([]);
                                setTableSearch('');
                              }}
                              className="py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-1 transition border border-stone-700 min-h-[36px]"
                            >
                              <Plus className="w-3.5 h-3.5 text-amber-400" />
                              <span>+ {lang === 'mr' ? 'जोडा' : 'Add'}</span>
                            </button>

                            <button
                              onClick={() => setSelectedOrderForBill(activeOrd)}
                              className="py-1.5 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs flex items-center justify-center gap-1 hover:bg-stone-700 transition border border-stone-700 min-h-[36px]"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-400" />
                              <span>{lang === 'mr' ? 'पावती' : 'Bill'}</span>
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              if (window.confirm(lang === 'mr' ? 'तुम्हाला ही टेबल ऑर्डर खरोखर रद्द करायची आहे का?' : 'Are you sure you want to cancel this table order?')) {
                                cancelOrder(activeOrd.id);
                              }
                            }}
                            className="w-full py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs flex items-center justify-center gap-1 transition border border-rose-600/30 min-h-[36px]"
                          >
                            <X className="w-3.5 h-3.5 text-rose-400" />
                            <span>❌ {lang === 'mr' ? 'ऑर्डर रद्द करा' : 'Cancel Order'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg w-fit border border-emerald-800/40">
                          ✓ {lang === 'mr' ? 'मोकळे टेबल' : 'Available Table'}
                        </p>
                        
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              setPosTable(tbl);
                              setActiveTab('new_order');
                            }}
                            className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-1 transition border border-amber-600/30"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{lang === 'mr' ? 'नवीन ऑर्डर घ्या' : 'Take New Order'}</span>
                          </button>

                          {/* Option to Remove Custom Table when empty */}
                          {isCustom && (
                            <button
                              onClick={() => {
                                const res = removeCustomTable(tbl);
                                if (!res.success) alert(res.error);
                              }}
                              className="w-full py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 font-bold text-[11px] flex items-center justify-center gap-1 transition border border-rose-800/40"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>{lang === 'mr' ? 'हे कस्टम टेबल हटवा' : 'Remove Custom Table'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* DEDICATED ADD TABLE OPTION CARD AT THE VERY END OF GRID */}
              <div
                onClick={async () => {
                  const defaultNext = `Table ${allTableNames.length} (Custom)`;
                  const res = await addCustomTable(defaultNext);
                  if (res && !res.success) alert(res.error);
                }}
                className="p-5 rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-950/10 hover:bg-amber-950/20 hover:border-amber-400 transition cursor-pointer flex flex-col items-center justify-center text-center space-y-2.5 min-h-[180px] group shadow-md"
              >
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition shadow-inner">
                  <Plus className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  {lang === 'mr' ? '+ नवीन टेबल जोडा' : '+ Add Custom Table'}
                </h4>
                <p className="text-[11px] text-stone-400">
                  {lang === 'mr' ? 'अतिरिक्त टेबल (कस्टम) जोडा' : 'Add temporary table'}
                </p>
              </div>

            </div>
        </div>
      )}

      {/* --- TAB 4: MENU STOCK MANAGER --- */}
      {activeTab === 'menu' && <MenuManager />}

      {/* --- TAB 5: ANALYTICS & REVENUE --- */}
      {activeTab === 'analytics' && <AnalyticsView />}

      {/* Settle Order & Collect Payment Modal */}
      {settleModalOrder && (
        <SettleOrderModal
          isOpen={!!settleModalOrder}
          onClose={() => setSettleModalOrder(null)}
          order={settleModalOrder}
          onPrintBill={(updatedOrder) => setSelectedOrderForBill(updatedOrder)}
        />
      )}

      {/* Bill Thermal Receipt Modal */}
      {selectedOrderForBill && (
        <BillReceiptModal
          isOpen={!!selectedOrderForBill}
          onClose={() => setSelectedOrderForBill(null)}
          order={selectedOrderForBill}
        />
      )}

      {/* Add Items to Existing Table Order Modal */}
      {addItemsModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
          <div className="bg-stone-900 border border-amber-600/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col justify-between">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  <span>{addItemsModalOrder.tableNo} - बिलात अजून पदार्थ जोडा</span>
                </h3>
                <p className="text-xs text-stone-400">
                  ऑर्डर: {addItemsModalOrder.id} | ग्राहक: {addItemsModalOrder.customerName} | चालू बिल: ₹{addItemsModalOrder.grandTotal}
                </p>
              </div>
              <button
                onClick={() => setAddItemsModalOrder(null)}
                className="text-stone-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Menu Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="पदार्थ शोधा (उदा. रोटी, रस्सा वाटी, पापड, सोलकढी, चिकन...)"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-500"
              />
            </div>

            {/* Menu Selection List (Thalis first -> Plates second -> Extras third) */}
            <div className="flex-1 overflow-y-auto max-h-60 grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
              {sortMenuItemsThaliFirst(
                menuItems.filter((item) =>
                  item.nameMr.toLowerCase().includes(tableSearch.toLowerCase()) ||
                  item.nameEn.toLowerCase().includes(tableSearch.toLowerCase())
                )
              ).map((item) => {
                  const inCart = tableAddCart.find((i) => i.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <h5 className="font-bold text-stone-200">{item.nameMr}</h5>
                        <span className="text-[10px] text-amber-400 font-bold">₹{item.price}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {inCart ? (
                          <div className="flex items-center gap-1.5 bg-stone-800 px-2 py-1 rounded-lg">
                            <button
                              onClick={() => {
                                setTableAddCart((prev) =>
                                  prev
                                    .map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
                                    .filter((i) => i.quantity > 0)
                                );
                              }}
                              className="text-stone-400 hover:text-amber-400 font-bold"
                            >
                              -
                            </button>
                            <span className="font-bold text-amber-300">{inCart.quantity}</span>
                            <button
                              onClick={() => {
                                setTableAddCart((prev) =>
                                  prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
                                );
                              }}
                              className="text-stone-400 hover:text-amber-400 font-bold"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setTableAddCart((prev) => [...prev, { ...item, quantity: 1, extraThalis: 0 }]);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 text-[11px] font-bold hover:scale-105 transition"
                          >
                            + जोडा
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Selected Additions Summary */}
            {tableAddCart.length > 0 && (
              <div className="p-3 rounded-xl bg-stone-950 border border-amber-600/30 space-y-2 text-xs">
                <span className="font-bold text-stone-300 block">नवीन जोडलेले पदार्थ:</span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {tableAddCart.map((i) => (
                    <div key={i.id} className="flex justify-between text-stone-300">
                      <span>{i.nameMr} x {i.quantity}</span>
                      <span className="font-bold text-amber-400">₹{i.price * i.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-black text-amber-300 pt-1 border-t border-stone-800">
                  <span>अतिरिक्त बिल (New Subtotal):</span>
                  <span>+ ₹{tableAddCart.reduce((s, i) => s + i.price * i.quantity, 0)}</span>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end gap-2 border-t border-stone-800">
              <button
                onClick={() => setAddItemsModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs"
              >
                रद्द करा
              </button>

              <button
                disabled={tableAddCart.length === 0}
                onClick={() => {
                  addItemsToExistingOrder(addItemsModalOrder.id, tableAddCart);
                  setAddItemsModalOrder(null);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-extrabold text-xs uppercase tracking-wider disabled:opacity-50 shadow-md"
              >
                बिलामध्ये जोडा (Save to Table Bill)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          order={editingOrder}
        />
      )}

      {/* UPI QR Code Modal */}
      <UpiQrModal
        isOpen={upiModalData.isOpen}
        onClose={() => setUpiModalData({ isOpen: false, amount: 0, orderId: '' })}
        amount={upiModalData.amount}
        orderId={upiModalData.orderId}
      />

    </div>
  );
};
