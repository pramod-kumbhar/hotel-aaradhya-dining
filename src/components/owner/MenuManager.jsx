import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit2, Check, X, ShieldAlert, Sparkles, Utensils, Flame } from 'lucide-react';

export const MenuManager = () => {
  const { lang, menuItems, toggleItemAvailability, updateItemPrice, updateFullMenuItem, addNewMenuItem, t } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalItem, setEditModalItem] = useState(null);

  // New Item Form State
  const [newItem, setNewItem] = useState({
    nameMr: '',
    nameEn: '',
    category: 'veg',
    price: 150,
    isThali: true,
    descMr: '',
    descEn: '',
    spicyLevel: 'Medium',
    isSpecial: false
  });

  const handleCreateNewItem = (e) => {
    e.preventDefault();
    if (!newItem.nameMr || !newItem.price) return;

    addNewMenuItem({
      ...newItem,
      price: Number(newItem.price)
    });

    setIsAddModalOpen(false);
    setNewItem({
      nameMr: '',
      nameEn: '',
      category: 'veg',
      price: 150,
      isThali: true,
      descMr: '',
      descEn: '',
      spicyLevel: 'Medium',
      isSpecial: false
    });
  };

  const handleSaveEditItem = (e) => {
    e.preventDefault();
    if (!editModalItem || !editModalItem.nameMr || !editModalItem.price) return;

    updateFullMenuItem({
      ...editModalItem,
      price: Number(editModalItem.price)
    });

    setEditModalItem(null);
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-4 pb-20 md:pb-8 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-amber-500" />
          <span>{t.tabMenu}</span>
        </h3>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 hover:scale-105 transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>+ नवीन पदार्थ जोडा</span>
        </button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border transition flex flex-col justify-between ${
              item.available
                ? 'bg-stone-900 border-stone-800'
                : 'bg-stone-950/60 border-stone-800/40 opacity-70'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-stone-100">
                    {lang === 'mr' ? item.nameMr : item.nameEn}
                  </h4>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase">
                    {item.category} • {item.isThali ? 'ताट (Thali)' : 'डिश (Dish)'} {item.isSpecial ? '• ★ स्पेशल' : ''}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-amber-400">₹{item.price}</span>
                </div>
              </div>

              {/* Description preview */}
              <p className="text-xs text-stone-300 line-clamp-2 bg-stone-950/40 p-2 rounded border border-stone-800/60">
                {lang === 'mr' ? item.descMr : item.descEn}
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-stone-800 flex items-center justify-between mt-3 gap-2">
              <button
                onClick={() => setEditModalItem({ ...item })}
                className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1 transition border border-stone-700"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>एडिट (Edit)</span>
              </button>

              <button
                onClick={() => toggleItemAvailability(item.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                  item.available
                    ? 'bg-red-950/40 text-red-300 border-red-800/40 hover:bg-red-900/60'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60'
                }`}
              >
                {item.available ? 'Out of Stock' : 'In Stock'}
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* --- ADD NEW ITEM MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreateNewItem}
            className="bg-stone-900 border border-amber-600/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>नवीन पदार्थ जोडा</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">पदार्थाचे नाव (मराठी)</label>
                <input
                  type="text"
                  required
                  placeholder="पदार्थाचे नाव..."
                  value={newItem.nameMr}
                  onChange={(e) => setNewItem({ ...newItem, nameMr: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">Item Name (English)</label>
                <input
                  type="text"
                  placeholder="Enter dish name..."
                  value={newItem.nameEn}
                  onChange={(e) => setNewItem({ ...newItem, nameEn: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">प्रकार (Category)</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                  >
                    <option value="veg">शाकाहारी (Veg)</option>
                    <option value="egg">अंडाकरी (Egg)</option>
                    <option value="chicken">चिकन (Chicken)</option>
                    <option value="mutton">मटण (Mutton)</option>
                    <option value="extras">अतिरिक्त / साइड्स (Extras)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">किंमत (₹)</label>
                  <input
                    type="number"
                    required
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-amber-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">वर्णन मराठी (Description Marathi)</label>
                <textarea
                  rows="2"
                  placeholder="वर्णन टाका..."
                  value={newItem.descMr}
                  onChange={(e) => setNewItem({ ...newItem, descMr: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">Description English</label>
                <textarea
                  rows="2"
                  placeholder="Enter description..."
                  value={newItem.descEn}
                  onChange={(e) => setNewItem({ ...newItem, descEn: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-stone-200 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.isThali}
                    onChange={(e) => setNewItem({ ...newItem, isThali: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span>हे ताट (Thali) आहे</span>
                </label>

                <label className="flex items-center gap-2 text-stone-200 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.isSpecial}
                    onChange={(e) => setNewItem({ ...newItem, isSpecial: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span>★ स्पेशल बॅज</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
              >
                जतन करा (Save Item)
              </button>
            </div>

          </form>
        </div>
      )}

      {/* --- EDIT EXISTING ITEM MODAL --- */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
          <form
            onSubmit={handleSaveEditItem}
            className="bg-stone-900 border border-amber-600/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4" />
                <span>पदार्थ संपादित करा (Edit Dish Details)</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditModalItem(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">पदार्थाचे नाव मराठी (Item Name Marathi)</label>
                <input
                  type="text"
                  required
                  value={editModalItem.nameMr || ''}
                  onChange={(e) => setEditModalItem({ ...editModalItem, nameMr: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">Item Name English</label>
                <input
                  type="text"
                  value={editModalItem.nameEn || ''}
                  onChange={(e) => setEditModalItem({ ...editModalItem, nameEn: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">प्रकार (Category)</label>
                  <select
                    value={editModalItem.category || 'veg'}
                    onChange={(e) => setEditModalItem({ ...editModalItem, category: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                  >
                    <option value="veg">शाकाहारी (Veg)</option>
                    <option value="egg">अंडाकरी (Egg)</option>
                    <option value="chicken">चिकन (Chicken)</option>
                    <option value="mutton">मटण (Mutton)</option>
                    <option value="extras">अतिरिक्त / साइड्स (Extras)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">किंमत (Price ₹)</label>
                  <input
                    type="number"
                    required
                    value={editModalItem.price || 0}
                    onChange={(e) => setEditModalItem({ ...editModalItem, price: e.target.value })}
                    className="w-full bg-stone-950 border border-amber-500 rounded-xl px-3 py-2 text-amber-400 font-black text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">वर्णन मराठी (Description Marathi)</label>
                <textarea
                  rows="2"
                  value={editModalItem.descMr || ''}
                  onChange={(e) => setEditModalItem({ ...editModalItem, descMr: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">Description English</label>
                <textarea
                  rows="2"
                  value={editModalItem.descEn || ''}
                  onChange={(e) => setEditModalItem({ ...editModalItem, descEn: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">तिखटपणा (Spicy Level)</label>
                <select
                  value={editModalItem.spicyLevel || 'Medium'}
                  onChange={(e) => setEditModalItem({ ...editModalItem, spicyLevel: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                >
                  <option value="None">None (नाही)</option>
                  <option value="Mild">Mild (कमी तिखट)</option>
                  <option value="Medium">Medium (मध्यम)</option>
                  <option value="Spicy">Spicy (तिखट)</option>
                  <option value="Hot">Hot (झणझणीत)</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-stone-200 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editModalItem.isThali}
                    onChange={(e) => setEditModalItem({ ...editModalItem, isThali: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span>हे ताट (Thali) आहे</span>
                </label>

                <label className="flex items-center gap-2 text-stone-200 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editModalItem.isSpecial}
                    onChange={(e) => setEditModalItem({ ...editModalItem, isSpecial: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span>★ स्पेशल बॅज</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setEditModalItem(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs uppercase tracking-wider shadow"
              >
                बदल जतन करा (Save Changes)
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};
