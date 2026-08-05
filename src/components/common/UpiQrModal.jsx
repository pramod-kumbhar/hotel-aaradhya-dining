import React, { useState } from 'react';
import { HOTEL_INFO } from '../../data/menuData';
import { QrCode, X, Copy, Check, ShieldCheck, Sparkles, Smartphone } from 'lucide-react';

export const UpiQrModal = ({ isOpen, onClose, amount = 0, orderId = '' }) => {
  const [copied, setCopied] = useState(false);
  const [customUpiId, setCustomUpiId] = useState(HOTEL_INFO.upiId);

  if (!isOpen) return null;

  const upiPayUrl = `upi://pay?pa=${customUpiId}&pn=${encodeURIComponent(HOTEL_INFO.upiName)}&am=${amount}&cu=INR&tn=Order_${orderId || 'Bill'}`;
  const qrCodeImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayUrl)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(customUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
      <div className="bg-stone-900 border border-amber-600/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-400">
              UPI ऑनलाइन पेमेंट QR कोड
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bill Amount Display */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
          <span className="text-xs text-stone-400 block">एकूण देय रक्कम (Payable Amount):</span>
          <span className="text-2xl font-black text-amber-300">₹{amount}</span>
          {orderId && (
            <span className="text-[10px] text-stone-400 block pt-0.5">ऑर्डर क्र: {orderId}</span>
          )}
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl shadow-inner inline-block border-4 border-amber-500/60 relative group">
          <img
            src={qrCodeImgUrl}
            alt="UPI Payment QR Code"
            className="w-48 h-48 mx-auto object-contain"
          />
          <div className="mt-1 text-[10px] font-bold text-stone-800 tracking-wider uppercase flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>GPay • PhonePe • Paytm • BHIM</span>
          </div>
        </div>

        {/* UPI ID Details & Copy Button */}
        <div className="space-y-2 text-xs">
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between gap-2">
            <div className="text-left overflow-hidden">
              <span className="text-[10px] text-stone-400 block">हॉटेल UPI ID:</span>
              <input
                type="text"
                value={customUpiId}
                onChange={(e) => setCustomUpiId(e.target.value)}
                className="bg-transparent font-bold text-amber-400 text-xs w-full focus:outline-none"
              />
            </div>
            <button
              onClick={handleCopyUpi}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition shrink-0"
              title="UPI ID कॉपी करा"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          <p className="text-[10px] text-stone-400">
            कोणत्याही UPI ॲपवरून स्कॅन करून रक्कम भरा. पेमेंट पूर्ण झाल्यावर मालकांना सांगा.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-bold text-xs uppercase tracking-wider shadow-lg hover:opacity-90 transition"
        >
          झाले (Done)
        </button>

      </div>
    </div>
  );
};
