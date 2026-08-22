import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { sortMenuItemsThaliFirst } from '../../data/menuData';
import { Edit3, Plus, Minus, Trash2, Search, X, Check, Utensils, AlertCircle, Sparkles, User, Smartphone, LayoutGrid, FileText, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

export const EditOrderModal = ({ isOpen, onClose, order }) => {
  const { lang, menuItems, updateFullOrder, allTables, orders, t } = useApp();

  const [items, setItems] = useState([]);
  const [tableNo, setTableNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setItems(order.items ? JSON.parse(JSON.stringify(order.items)) : []);
      setTableNo(order.tableNo || '');
      setCustomerName(order.customerName || '');
      setCustomerPhone(order.customerPhone || '');
      setSpecialNotes(order.specialNotes || '');
      setPaymentMethod(order.paymentMethod || 'Cash');
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  // Tables available (excluding tables occupied by OTHER orders)
  const occupiedTablesByOthers = new Set(
    orders
      .filter((o) => o.id !== order.id && o.status !== 'completed' && o.status !== 'cancelled')
      .map((o) => o.tableNo)
  );

  const availableTables = (allTables || []).filter((tbl) => tbl === 'Parcel' || tbl === order.tableNo || !occupiedTablesByOthers.has(tbl));

  // Item Quantity Handlers
  const handleUpdateQuantity = (itemId, delta) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleUpdateExtraThalis = (itemId, delta) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const currentExtras = item.extraThalis || 0;
          const nextExtras = Math.max(0, currentExtras + delta);
          return { ...item, extraThalis: nextExtras };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddItemFromMenu = (menuItem) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === menuItem.id);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          id: menuItem.id,
          nameMr: menuItem.nameMr,
          nameEn: menuItem.nameEn || menuItem.nameMr,
          price: Number(menuItem.price),
          category: menuItem.category,
          isThali: menuItem.isThali || false,
          quantity: 1,
          extraThalis: 0
        }
      ];
    });
  };

  // Calculations
  const itemTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const extraThaliTotal = items.reduce((sum, item) => sum + (item.extraThalis || 0) * 60, 0);
  const grandTotal = itemTotal + extraThaliTotal;

  const handleSave = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      alert(lang === 'mr' ? 'कृपया ऑर्डरमध्ये किमान एक पदार्थ ठेवा!' : 'Please keep at least one dish in the order!');
      return;
    }

    setIsSaving(true);
    await updateFullOrder(order.id, {
      items,
      tableNo,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      specialNotes: specialNotes.trim(),
      paymentMethod
    });
    setIsSaving(false);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-amber-600/40 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col justify-between relative overflow-hidden">
        
        {/* Top Flag Decor */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-inner shrink-0">
              <Edit3 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-400 flex items-center gap-2">
                <span>{lang === 'mr' ? 'ऑर्डर बदला व सुधारित करा' : 'Edit & Update Order'}</span>
                <span className="text-xs font-mono bg-stone-950 px-2 py-0.5 rounded-lg border border-amber-600/30 text-stone-300">
                  {order.id}
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                {lang === 'mr' ? 'पदार्थ, संख्या, एक्स्ट्रा ताट, टेबल व तपशील अपडेट करा' : 'Update items, quantities, extra thalis, table and notes'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          
          {/* 1. Quick Info Row (Table, Customer, Phone) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-stone-950/80 p-3 rounded-2xl border border-stone-800">
            {/* Table Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'mr' ? 'टेबल क्रमांक:' : 'Table:'}</span>
              </label>
              <select
                value={tableNo}
                onChange={(e) => setTableNo(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
              >
                {availableTables.map((tbl) => (
                  <option key={tbl} value={tbl}>
                    {tbl === 'Parcel' ? (lang === 'mr' ? '🛍️ पार्सल (Parcel)' : '🛍️ Parcel') : tbl}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'mr' ? 'ग्राहकाचे नाव:' : 'Name:'}</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="उदा. राहुल शिंदे"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Customer Phone */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'mr' ? 'मोबाईल:' : 'Phone:'}</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="उदा. 9876543210"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-100 placeholder-stone-600 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* 2. Current Order Items List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'mr' ? 'ऑर्डरमधील पदार्थ (Current Dishes)' : 'Current Dishes in Order'}</span>
                <span className="text-[10px] text-stone-400 font-mono">({items.length})</span>
              </h4>
            </div>

            {items.length === 0 ? (
              <div className="p-4 rounded-xl bg-stone-950 border border-red-500/40 text-center text-xs text-red-300 font-bold">
                ⚠️ ऑर्डरमधील सर्व पदार्थ काढून टाकले आहेत. कृपया खालील मेनूमधून पदार्थ जोडा!
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-stone-950 p-2.5 rounded-2xl border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    {/* Item Name & Price */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        item.category === 'veg' ? 'bg-emerald-500' :
                        item.category === 'egg' ? 'bg-amber-400' :
                        item.category === 'chicken' ? 'bg-red-500' : 'bg-orange-600'
                      }`} />
                      <div className="min-w-0">
                        <h5 className="font-bold text-stone-100 truncate">
                          {lang === 'mr' ? item.nameMr : (item.nameEn || item.nameMr)}
                        </h5>
                        <span className="text-[11px] text-amber-400 font-mono font-bold">
                          ₹{item.price} x {item.quantity} = ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Extra Thali Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      
                      {/* Extra Thali Pill if applicable */}
                      {(item.isThali || item.nameMr?.includes('थाळी') || item.nameMr?.includes('ताट')) && (
                        <div className="flex items-center gap-1 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded-xl text-[10px]">
                          <span className="text-amber-300 font-bold">ताट:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateExtraThalis(item.id, -1)}
                            className="w-5 h-5 rounded bg-stone-900 text-stone-300 hover:text-amber-400 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-amber-300 px-1">{item.extraThalis || 0}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateExtraThalis(item.id, 1)}
                            className="w-5 h-5 rounded bg-stone-900 text-stone-300 hover:text-amber-400 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {/* Main Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-700">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 flex items-center justify-center font-bold transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-black text-amber-400 px-2 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 flex items-center justify-center font-bold transition"
                        >
                          <Plus className="w-3.5 h-3.5 text-stone-950" />
                        </button>
                      </div>

                      {/* Delete Item Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-800/40 transition"
                        title="हा पदार्थ काढून टाका"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Add More Dishes from Menu (Inline Collapsible Picker) */}
          <div className="space-y-2 pt-2 border-t border-stone-800">
            <h4 className="text-xs font-black text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'mr' ? '+ मेनूमधून नवीन पदार्थ बिलात जोडा' : '+ Add More Dishes from Menu'}</span>
            </h4>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="पदार्थ शोधा (उदा. चिकन थाळी, रोटी, रस्सा, सोलकढी...)"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'सर्व' },
                  { id: 'veg', label: 'शाकाहारी' },
                  { id: 'chicken', label: 'चिकन' },
                  { id: 'mutton', label: 'मटण' },
                  { id: 'extras', label: 'इतर' }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                      selectedCategory === c.id
                        ? 'bg-amber-500 text-stone-950 font-black'
                        : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Quick Pick Grid (Thalis first -> Plates second -> Extras third) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {sortMenuItemsThaliFirst(
                menuItems.filter((item) => {
                  const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
                  const matchSearch =
                    item.nameMr.toLowerCase().includes(menuSearch.toLowerCase()) ||
                    item.nameEn.toLowerCase().includes(menuSearch.toLowerCase());
                  return matchCat && matchSearch;
                })
              ).map((mItem) => (
                  <div
                    key={mItem.id}
                    className="p-2 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs hover:border-amber-500/40 transition"
                  >
                    <div className="truncate pr-2">
                      <h6 className="font-bold text-stone-200 truncate">{mItem.nameMr}</h6>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">₹{mItem.price}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddItemFromMenu(mItem)}
                      className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 font-black text-[11px] border border-amber-500/40 transition shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>जोडा</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* 4. Special Notes */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'mr' ? 'किचन सूचना (Special Notes):' : 'Kitchen Notes:'}</span>
            </label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="उदा. कमी तिखट, जास्त रस्सा, लिंबू जादा द्या..."
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
            />
          </div>

        </div>

        {/* Modal Footer & Bill Calculation Summary */}
        <div className="pt-3 border-t border-stone-800 space-y-3">
          <div className="flex items-center justify-between bg-stone-950 p-3 rounded-2xl border border-amber-600/30">
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold block">
                {lang === 'mr' ? 'सुधारित एकूण बिल' : 'Updated Grand Total'}
              </span>
              <span className="text-xl font-black text-amber-400">₹{grandTotal}/-</span>
            </div>

            <div className="text-right text-[11px] text-stone-400 space-y-0.5">
              <div>पदार्थ: <strong className="text-stone-200">₹{itemTotal}</strong></div>
              {extraThaliTotal > 0 && <div>एक्स्ट्रा ताट: <strong className="text-amber-300">₹{extraThaliTotal}</strong></div>}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition"
            >
              {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || items.length === 0}
              className="flex-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-950/60 hover:scale-[1.02] active:scale-98 transition disabled:opacity-50 min-h-[44px]"
            >
              {isSaving ? (
                <span>सेव्ह होत आहे...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{lang === 'mr' ? 'सुधारणा सेव्ह करा व KDS अपडेट करा' : 'Save & Update KDS'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
