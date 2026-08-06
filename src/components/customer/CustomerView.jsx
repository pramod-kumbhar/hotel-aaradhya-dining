import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../data/menuData';
import { Search, Flame, Leaf, Egg, Drumstick, Utensils, Plus, Check, Info, ShieldAlert, Sparkles } from 'lucide-react';

export const CustomerView = ({ onOpenCart }) => {
  const { lang, tableNo, setTableNo, menuItems, cart, orders, addToCart, allTables, t } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'thali', 'plate'
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);

  // Active occupied tables
  const occupiedTables = new Set(
    orders.filter((o) => o.status !== 'completed').map((o) => o.tableNo)
  );

  // Dynamic table list from backend + local fallback
  const tables = allTables?.length
    ? allTables
    : ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10', 'Parcel'];

  // Category Icon helper
  const getCategoryIcon = (catId) => {
    switch (catId) {
      case 'veg': return <Leaf className="w-4 h-4 text-emerald-400" />;
      case 'egg': return <Egg className="w-4 h-4 text-amber-400" />;
      case 'chicken': return <Drumstick className="w-4 h-4 text-red-400" />;
      case 'mutton': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'extras': return <Utensils className="w-4 h-4 text-cyan-400" />;
      default: return <Utensils className="w-4 h-4 text-amber-400" />;
    }
  };

  // Filtered menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.nameMr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === 'all' ||
      (filterType === 'thali' && item.isThali) ||
      (filterType === 'plate' && !item.isThali);

    return matchesCategory && matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      
      {/* Step Guide & Table Status Bar */}
      <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-600/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>१. मेनूमधून पदार्थ निवडा ➔ २. चेकआऊट वेळी मोकळे टेबल निवडा</span>
            </span>
          </div>

          <span className="text-xs font-extrabold text-stone-300 bg-stone-800 px-3 py-1 rounded-full border border-stone-700 shrink-0">
            {t.tableSelected}: <strong className="text-amber-400">{tableNo}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {tables.map((tbl) => {
            const isOccupied = tbl !== 'Parcel' && occupiedTables.has(tbl);
            const isSelected = tableNo === tbl;

            return (
              <button
                key={tbl}
                disabled={isOccupied}
                onClick={() => setTableNo(tbl)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 border-amber-400 shadow-md scale-105 font-black'
                    : isOccupied
                    ? 'bg-stone-950/40 text-stone-600 border-stone-800/40 cursor-not-allowed'
                    : 'bg-stone-800/60 text-stone-300 border-stone-700/60 hover:bg-stone-800'
                }`}
              >
                <span>{tbl === 'Parcel' ? (lang === 'mr' ? '🛍️ पार्सल' : '🛍️ Parcel') : tbl}</span>
                <span className={`text-[9px] px-1 rounded font-black ${
                  isOccupied ? 'bg-red-950 text-red-400 border border-red-800' : isSelected ? 'bg-stone-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                }`}>
                  {isOccupied ? 'व्यस्त' : isSelected ? 'निवडले' : 'मोकळे'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-900 border border-stone-700/70 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition border ${
                selectedCategory === cat.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-lg'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-800 hover:text-stone-200'
              }`}
            >
              {getCategoryIcon(cat.id)}
              <span>{lang === 'mr' ? cat.nameMr : cat.nameEn}</span>
            </button>
          ))}
        </div>

        {/* Thali vs Plate Sub-filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              filterType === 'all' ? 'bg-stone-800 text-amber-400 border border-amber-500/40' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {t.all}
          </button>
          <button
            onClick={() => setFilterType('thali')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              filterType === 'thali' ? 'bg-stone-800 text-amber-400 border border-amber-500/40' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {t.thaliOnly} (ताट)
          </button>
          <button
            onClick={() => setFilterType('plate')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              filterType === 'plate' ? 'bg-stone-800 text-amber-400 border border-amber-500/40' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {t.plateOnly} (डिश)
          </button>
        </div>

      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between relative group ${
              item.available
                ? 'bg-stone-900/80 hover:bg-stone-900 border border-stone-800 hover:border-amber-600/40 shadow-lg hover:shadow-amber-950/20'
                : 'bg-stone-900/40 border border-stone-800/40 opacity-60'
            }`}
          >
            <div>
              {/* Badges Bar */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {item.category === 'veg' || item.category === 'extras' || item.isVeg ? (
                    <span className="w-4 h-4 rounded border border-emerald-500 flex items-center justify-center p-0.5" title="Veg">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded border border-red-500 flex items-center justify-center p-0.5" title="Non-Veg">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                    </span>
                  )}

                  {item.isThali && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      🍱 ताट (Thali)
                    </span>
                  )}

                  {item.isSpecial && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/30">
                      ★ स्पेशल
                    </span>
                  )}
                </div>

                <span className="text-xs font-bold text-stone-400 flex items-center gap-1">
                  {item.spicyLevel === 'Hot' && <Flame className="w-3 h-3 text-red-500" />}
                  {item.spicyLevel}
                </span>
              </div>

              {/* Item Title & Price */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="text-base font-bold text-stone-100 group-hover:text-amber-300 transition">
                  {lang === 'mr' ? item.nameMr : item.nameEn}
                </h3>
                <span className="text-base font-black text-amber-400 shrink-0">
                  ₹{item.price}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-stone-400 line-clamp-2 mb-4">
                {lang === 'mr' ? item.descMr : item.descEn}
              </p>
            </div>

            {/* Action Footer */}
            <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
              {item.isThali && item.available && (
                <button
                  onClick={() => setSelectedItemForModal(item)}
                  className="text-[11px] font-bold text-amber-400/90 hover:text-amber-300 underline decoration-amber-500/40"
                >
                  + {t.extraThaliTitle} (₹६०)
                </button>
              )}

              {item.available ? (
                <button
                  onClick={() => addToCart(item)}
                  className="ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition shadow-md shadow-amber-950/40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addToCart}</span>
                </button>
              ) : (
                <span className="ml-auto text-xs font-bold text-red-400 bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-800/40">
                  {t.outOfStock}
                </span>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Extra Thali Customization Modal */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-amber-600/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-amber-300">
                  {lang === 'mr' ? selectedItemForModal.nameMr : selectedItemForModal.nameEn}
                </h4>
                <p className="text-xs text-stone-400 font-bold">
                  मूळ किंमत: ₹{selectedItemForModal.price}
                </p>
              </div>
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="text-stone-400 hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Info className="w-4 h-4 shrink-0" />
                <span>{t.extraThaliTitle} (₹६०/- extra)</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {t.extraThaliDesc}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  addToCart(selectedItemForModal, 0);
                  setSelectedItemForModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-200 text-xs font-bold hover:bg-stone-700 transition"
              >
                फक्त १ ताट (₹{selectedItemForModal.price})
              </button>

              <button
                onClick={() => {
                  addToCart(selectedItemForModal, 1);
                  setSelectedItemForModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 text-xs font-extrabold hover:opacity-90 transition shadow-lg shadow-orange-950/40"
              >
                + १ एक्स्ट्रा ताट (₹{selectedItemForModal.price + 60})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Mobile/Desktop Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 z-40 max-w-lg mx-auto">
          <button
            onClick={onOpenCart}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-sm flex items-center justify-between shadow-2xl shadow-orange-950/80 hover:scale-[1.02] active:scale-98 transition border border-amber-300/40"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-stone-950 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-400">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <span>पदार्थ जोडले आहेत</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-black">
                ₹{cart.reduce((s, i) => s + i.price * i.quantity + (i.extraThalis || 0) * 60, 0)}
              </span>
              <span className="bg-stone-950/80 text-amber-300 text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 font-bold">
                कार्ट पहा 🛒
              </span>
            </div>
          </button>
        </div>
      )}

    </div>
  );
};
