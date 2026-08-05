import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, KeyRound, X, Settings, CheckCircle2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OwnerPinModal = ({ isOpen, onClose }) => {
  const { unlockOwnerVault, changeOwnerPin, setupInitialOwnerPin, ownerPin, lang } = useApp();
  
  const hasConfiguredPin = !!ownerPin;
  const [mode, setMode] = useState(hasConfiguredPin ? 'unlock' : 'setup'); // 'unlock', 'change_pin', 'setup'

  useEffect(() => {
    if (!ownerPin) {
      setMode('setup');
    } else {
      setMode('unlock');
    }
  }, [ownerPin, isOpen]);

  // Unlock Form State
  const [pin, setPin] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Initial Setup PIN State
  const [setupPin, setSetupPin] = useState('');
  const [setupConfirmPin, setSetupConfirmPin] = useState('');
  const [setupError, setSetupError] = useState('');

  // Change PIN Form State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changeMsg, setChangeMsg] = useState({ text: '', type: '' });

  if (!isOpen) return null;

  // Submit Initial Setup
  const handleInitialSetupSubmit = (e) => {
    e.preventDefault();
    setSetupError('');

    if (setupPin !== setupConfirmPin) {
      setSetupError('पिन जुळत नाही!');
      return;
    }

    const res = setupInitialOwnerPin(setupPin);
    if (res.success) {
      setSetupPin('');
      setSetupConfirmPin('');
      try { confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } }); } catch(err) {}
      onClose();
    } else {
      setSetupError(res.error || 'पिन सेव्ह करणे अयशस्वी!');
    }
  };

  // Submit Unlock
  const handleUnlockSubmit = (e) => {
    e.preventDefault();
    setUnlockError('');

    const res = unlockOwnerVault(pin);
    if (res.success) {
      setPin('');
      try { confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } }); } catch(err) {}
      onClose();
    } else {
      setUnlockError(res.error || 'चुकीचा पिन!');
      setPin('');
    }
  };

  // Submit Change PIN
  const handleChangePinSubmit = (e) => {
    e.preventDefault();
    setChangeMsg({ text: '', type: '' });

    if (newPin !== confirmPin) {
      setChangeMsg({ text: 'नवीन पिन जुळत नाही!', type: 'error' });
      return;
    }

    const res = changeOwnerPin(currentPin, newPin);
    if (res.success) {
      setChangeMsg({ text: '✅ मालक पिन बदलला आहे!', type: 'success' });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      try { confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } }); } catch(err) {}
      setTimeout(() => {
        setMode('unlock');
        setChangeMsg({ text: '', type: '' });
      }, 1200);
    } else {
      setChangeMsg({ text: res.error || 'पिन बदलणे अयशस्वी!', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      
      <div className="bg-[#161514] border border-amber-600/30 rounded-3xl max-w-xs w-full p-5 shadow-2xl space-y-4 relative overflow-hidden">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-stone-100">
              {mode === 'change_pin' ? 'पिन बदला' : mode === 'setup' ? 'नवीन पिन' : 'मालक PIN'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* --- UNLOCK MODE (Clean & Minimal) --- */}
        {hasConfiguredPin && mode === 'unlock' && (
          <form onSubmit={handleUnlockSubmit} className="space-y-4 pt-1">
            
            <div className="space-y-2">
              <input
                type="password"
                maxLength="6"
                autoFocus
                required
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-[#0c0c0b] border border-stone-800 focus:border-amber-500 rounded-2xl px-4 py-3 text-center text-2xl font-black text-amber-400 tracking-widest focus:outline-none transition shadow-inner"
              />

              {unlockError && (
                <p className="text-xs text-red-400 text-center font-bold animate-pulse">
                  ⚠️ {unlockError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs uppercase tracking-wider transition active:scale-98 shadow-md shadow-amber-950/40 min-h-[44px]"
            >
              अनलॉक (UNLOCK)
            </button>

            {/* Toggle Change PIN */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('change_pin');
                  setChangeMsg({ text: '', type: '' });
                }}
                className="text-[11px] font-bold text-stone-400 hover:text-amber-400 transition"
              >
                ⚙️ पिन बदला (Change PIN)
              </button>
            </div>
          </form>
        )}

        {/* --- INITIAL SETUP MODE --- */}
        {!hasConfiguredPin && (
          <form onSubmit={handleInitialSetupSubmit} className="space-y-3 pt-1">
            <p className="text-xs text-stone-400 text-center font-medium">
              मालक विभागासाठी नवीन ४-६ अंकी PIN सेट करा
            </p>

            <input
              type="password"
              maxLength="6"
              required
              autoFocus
              placeholder="नवीन पिन"
              value={setupPin}
              onChange={(e) => setSetupPin(e.target.value)}
              className="w-full bg-[#0c0c0b] border border-stone-800 focus:border-amber-500 rounded-xl px-3 py-2 text-center text-sm font-bold text-amber-300 focus:outline-none"
            />

            <input
              type="password"
              maxLength="6"
              required
              placeholder="पुन्हा पिन टाका"
              value={setupConfirmPin}
              onChange={(e) => setSetupConfirmPin(e.target.value)}
              className="w-full bg-[#0c0c0b] border border-stone-800 focus:border-amber-500 rounded-xl px-3 py-2 text-center text-sm font-bold text-amber-300 focus:outline-none"
            />

            {setupError && (
              <p className="text-xs text-red-400 text-center font-bold">
                ⚠️ {setupError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs uppercase tracking-wider transition active:scale-98 shadow-md"
            >
              सेव्ह करा (Save PIN)
            </button>
          </form>
        )}

        {/* --- CHANGE PIN MODE --- */}
        {hasConfiguredPin && mode === 'change_pin' && (
          <form onSubmit={handleChangePinSubmit} className="space-y-3 pt-1">
            
            <input
              type="password"
              maxLength="6"
              required
              placeholder="जुना वर्तमान पिन"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              className="w-full bg-[#0c0c0b] border border-stone-800 focus:border-amber-500 rounded-xl px-3 py-2 text-center text-xs font-bold text-stone-200 focus:outline-none"
            />

            <input
              type="password"
              maxLength="6"
              required
              placeholder="नवीन पिन"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full bg-[#0c0c0b] border border-stone-800 focus:border-amber-500 rounded-xl px-3 py-2 text-center text-xs font-bold text-amber-300 focus:outline-none"
            />

            <input
              type="password"
              maxLength="6"
              required
              placeholder="पुन्हा नवीन पिन टाका"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full bg-[#0c0c0b] border border-stone-800 focus:border-amber-500 rounded-xl px-3 py-2 text-center text-xs font-bold text-amber-300 focus:outline-none"
            />

            {changeMsg.text && (
              <p className={`text-xs text-center font-bold ${
                changeMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {changeMsg.text}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs uppercase tracking-wider transition active:scale-98 shadow-md"
            >
              सेव्ह करा (Save)
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode('unlock')}
                className="text-[11px] font-bold text-stone-400 hover:text-amber-400 transition"
              >
                ← मागे जा (Back)
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
