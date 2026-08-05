import React from 'react';
import { useApp } from '../context/AppContext';
import { HOTEL_RULES } from '../data/menuData';
import { AlertCircle, X, CheckCircle2, ShieldAlert } from 'lucide-react';

export const RulesBanner = () => {
  const { lang } = useApp();

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/80 border-y border-amber-600/30 py-2 px-4 overflow-hidden relative">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs shrink-0 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/50">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{lang === 'mr' ? 'महत्वाचे नियम' : 'Hotel Rules'}</span>
        </div>
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-6 whitespace-nowrap text-xs text-amber-200/90 font-medium">
          {HOTEL_RULES.map((rule) => (
            <span key={rule.id} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {lang === 'mr' ? rule.mr : rule.en}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RulesModal = ({ isOpen, onClose }) => {
  const { lang, t } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-amber-600/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-300">
              {lang === 'mr' ? 'हॉटेल नियम व अटी' : 'Hotel Rules & Regulations'}
            </h3>
            <p className="text-xs text-stone-400">
              {lang === 'mr' ? 'हॉटेल आराध्या डायनिंग शिष्टाचार' : 'Hotel Aaradhya Dining Policies'}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-2 my-4">
          {HOTEL_RULES.map((rule) => (
            <div
              key={rule.id}
              className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 flex items-start gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-stone-200 font-medium leading-relaxed">
                {lang === 'mr' ? rule.mr : rule.en}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-stone-950 font-bold text-xs hover:opacity-90 transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
