import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mail, Plus, Trash2, X, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OwnerEmailModal = ({ isOpen, onClose }) => {
  const { ownerEmails, addOwnerEmail, removeOwnerEmail, lang, safeFetchJson } = useApp();
  const [newEmail, setNewEmail] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newEmail) return;

    // Support comma-separated multiple emails
    const emailsToAdd = newEmail.split(',').map(e => e.trim()).filter(e => e.includes('@'));
    emailsToAdd.forEach(em => addOwnerEmail(em));

    setNewEmail('');
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
  };

  const handleTestSmtp = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const data = await safeFetchJson('/api/verify-smtp');
      if (data) {
        setTestResult(data);
      } else {
        setTestResult({ success: false, message: '❌ SMTP सर्व्हर जोडता आला नाही.' });
      }
    } catch (e) {
      setTestResult({ success: false, message: '❌ SMTP सर्व्हर जोडता आला नाही.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-amber-600/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative overflow-hidden">
        
        {/* Top Flag Decor */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-stone-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 mx-auto shadow-md">
            <Mail className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-black text-amber-400">
            📧 मालक ई-मेल व्यवस्थापन (Owner Emails)
          </h3>
          <p className="text-xs text-stone-400">
            दिवसअखेर (EOD Closing) दैनिक विक्री रिपोर्ट ज्या ई-मेल आयडीवर पाठवायचा आहे त्यांची यादी
          </p>
        </div>

        {/* Form to Add Email */}
        <form onSubmit={handleAddSubmit} className="flex gap-2 pt-2">
          <input
            type="email"
            required
            placeholder="उदा. owner@gmail.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs flex items-center gap-1 shadow hover:scale-105 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ जोडा</span>
          </button>
        </form>

        {/* Registered Owner Email List */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-300 block">
            नोंदणीकृत मालक ई-मेल यादी ({ownerEmails.length}):
          </label>

          {ownerEmails.length > 0 ? (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {ownerEmails.map((email, idx) => (
                <div key={idx} className="flex items-center justify-between bg-stone-950 p-2.5 rounded-xl border border-stone-800 text-xs">
                  <div className="flex items-center gap-2 font-mono text-stone-200">
                    <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{email}</span>
                  </div>
                  <button
                    onClick={() => removeOwnerEmail(email)}
                    className="p-1 rounded-lg bg-stone-900 hover:bg-red-950 text-red-400 transition"
                    title="ई-मेल काढून टाका"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-stone-500 bg-stone-950 rounded-xl border border-stone-800">
              कोणताही ई-मेल जोडलेला नाही. वर ई-मेल प्रविष्ट करून जोडा.
            </div>
          )}
        </div>

        {/* SMTP Verification Test */}
        <div className="pt-2 border-t border-stone-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400 font-bold">ई-मेल सर्व्हर चाचणी:</span>
            <button
              onClick={handleTestSmtp}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-bold border border-amber-600/40 flex items-center gap-1 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTesting ? 'तपासत आहे...' : '🧪 कनेक्शन चाचणी'}</span>
            </button>
          </div>

          {testResult && (
            <div className={`p-2.5 rounded-xl text-xs border ${
              testResult.success ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50' : 'bg-red-950/80 text-red-300 border-red-600/50'
            }`}>
              {testResult.message}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition"
        >
          मागे जा (Close)
        </button>

      </div>
    </div>
  );
};
