import React from 'react';
import { ArrowRight } from 'lucide-react';

export const WelcomeView = ({ onEnterSystem }) => {
  return (
    <div className="fixed inset-0 z-50 bg-stone-955 text-stone-100 flex flex-col justify-center items-center p-4 overflow-hidden select-none bg-gradient-to-b from-stone-950 via-[#11100f] to-stone-955">
      
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-amber-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Accent Line */}
      <div className="h-1 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 w-full fixed top-0 left-0" />

      {/* DIRECT EMBLEM & COMPACT ENTER BUTTON */}
      <div className="max-w-md w-full flex flex-col items-center justify-center text-center space-y-4 z-10 my-auto py-2">
        
        {/* LOGO EMBLEM DIRECTLY ON BACKGROUND (NO BOX / NO BORDER) */}
        <div 
          onClick={() => onEnterSystem('pos')}
          className="cursor-pointer transition-transform duration-300 transform hover:scale-[1.02] flex justify-center"
          title="प्रवेश करण्यासाठी येथे क्लिक करा"
        >
          <img
            src="/hotel_emblem.png"
            alt="हॉटेल आराध्या डायनिंग"
            className="w-full h-auto object-contain max-h-[62vh] max-w-[340px] sm:max-w-[380px] mx-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
          />
        </div>

        {/* ACTION BUTTONS (POS ENTER & CHEF LOGIN) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() => onEnterSystem('pos')}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-950/50 flex items-center gap-2 transition-all duration-300 active:scale-95 cursor-pointer border border-amber-400/50 group"
          >
            <span>प्रवेश करा (ENTER POS)</span>
            <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onEnterSystem('chef')}
            className="px-4 py-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-orange-400 hover:text-orange-300 font-bold text-xs sm:text-sm tracking-wide border border-orange-500/40 hover:border-orange-500/80 shadow-md flex items-center gap-1.5 transition-all duration-300 active:scale-95 cursor-pointer"
            title="आचारी / शेफ लॉगिन"
          >
            <span>👨‍🍳 शेफ लॉगिन (Chef)</span>
          </button>
        </div>

      </div>

    </div>
  );
};
