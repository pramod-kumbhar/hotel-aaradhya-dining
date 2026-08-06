import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HOTEL_INFO } from '../data/menuData';
import { UtensilsCrossed, Volume2, VolumeX, Globe, LayoutGrid, ChefHat, BarChart3, Utensils, BookOpen, Lock, Users, KeyRound, Mail, Smartphone, Menu, X, Sparkles, Shield, Crown, FileText, CalendarCheck, LogOut, ShoppingCart, Home } from 'lucide-react';

export const Header = ({ activeTab, setActiveTab, onOpenEodModal, onOpenPinModal, onOpenEmailModal, onOpenRules, onOpenCart }) => {
  const { lang, setLang, mode, setMode, isMuted, setIsMuted, isOwnerUnlocked, lockOwnerVault, cart, t } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const totalCartCount = (cart || []).reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = (cart || []).reduce((sum, item) => sum + (item.price * item.quantity) + ((item.extraThalis || 0) * 60), 0);

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-stone-955/95 backdrop-blur-md border-b border-amber-600/40 shadow-2xl">
        {/* Top Maharashtrian Saffron Gradient Flag Line */}
        <div className="h-1 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600" />

        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-2 h-12 sm:h-14">
            
            {/* Logo & Hotel Title (Clickable to return to Welcome Page) */}
            <div 
              onClick={() => setActiveTab('welcome')}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition group shrink-0"
              title={lang === 'mr' ? 'मुख्य स्वागत स्क्रीनवर जा' : 'Go to Welcome Screen'}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center shadow-md border border-amber-400/50 shrink-0 group-hover:scale-105 transition">
                <Crown className="w-5 h-5 text-stone-950 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h1 className="max-w-[160px] sm:max-w-none truncate text-sm sm:text-lg lg:text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-orange-400 leading-tight flex items-center gap-1.5">
                  <span className="truncate">{lang === 'mr' ? HOTEL_INFO.nameMr : HOTEL_INFO.nameEn}</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </h1>
                <p className="hidden xl:flex text-[11px] text-stone-400 font-medium items-center gap-1">
                  <UtensilsCrossed className="w-3 h-3 text-amber-500" />
                  <span>{lang === 'mr' ? 'हॉटेल काउंटर व मालक POS प्रणाली' : 'Hotel Staff & Owner POS System'}</span>
                </p>
              </div>
            </div>

            {/* Desktop Center Navigation Tabs (Rich Icons + Text Labels for Desktop/Laptops) */}
            <div className="hidden md:flex items-center gap-1 bg-stone-900/90 p-1 rounded-2xl border border-stone-800 overflow-x-auto no-scrollbar">
              {/* 0. Welcome Screen */}
              <button
                onClick={() => setActiveTab('welcome')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'welcome'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>{lang === 'mr' ? 'स्वागत' : 'Welcome'}</span>
              </button>


              {/* 1. Table POS */}
              <button
                onClick={() => {
                  setMode('pos');
                  setActiveTab('pos');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  mode === 'pos' && activeTab === 'pos'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{lang === 'mr' ? 'टेबल POS' : 'Table POS'}</span>
              </button>

              {/* 2. Kitchen KDS */}
              <button
                onClick={() => setActiveTab('kds')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'kds'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>{lang === 'mr' ? 'किचन KDS' : 'Kitchen'}</span>
              </button>

              {/* OWNER UI TABS (UNLOCKED STATE) */}
              {isOwnerUnlocked ? (
                <>
                  <button
                    onClick={() => setActiveTab('udhar')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'udhar'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow'
                        : 'text-amber-400 hover:text-amber-200 hover:bg-stone-800/60'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'उधार खाते' : 'Udhar Credit'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('staff')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'staff'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow'
                        : 'text-emerald-400 hover:text-emerald-200 hover:bg-stone-800/60'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'हजेरी' : 'Staff'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'analytics'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow'
                        : 'text-amber-400 hover:text-amber-200 hover:bg-stone-800/60'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'विक्री' : 'Analytics'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('menu')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'menu'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow'
                        : 'text-amber-400 hover:text-amber-200 hover:bg-stone-800/60'
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'मेनू' : 'Menu'}</span>
                  </button>

                  <button
                    onClick={onOpenEmailModal}
                    className="px-2.5 py-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition flex items-center gap-1 shrink-0 text-xs font-bold"
                    title={lang === 'mr' ? 'मालक ई-मेल सेटिंग्स' : 'Owner Email'}
                  >
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden lg:inline">{lang === 'mr' ? 'ई-मेल' : 'Email'}</span>
                  </button>

                  <button
                    onClick={onOpenEodModal}
                    className="px-2.5 py-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition flex items-center gap-1 shrink-0 text-xs font-bold"
                    title={lang === 'mr' ? 'दिवस अखेर बंद (EOD Report)' : 'EOD Report'}
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden lg:inline">{lang === 'mr' ? 'ईओडी' : 'EOD'}</span>
                  </button>

                  <button
                    onClick={onOpenRules}
                    className="px-2.5 py-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition flex items-center gap-1 shrink-0 text-xs font-bold"
                    title={lang === 'mr' ? 'हॉटेल नियम' : 'Hotel Rules'}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden lg:inline">{lang === 'mr' ? 'नियम' : 'Rules'}</span>
                  </button>

                  <button
                    onClick={lockOwnerVault}
                    className="px-2.5 py-1.5 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-stone-800/60 transition flex items-center gap-1 shrink-0 text-xs font-bold"
                    title={lang === 'mr' ? 'मालक विभाग लॉक करा' : 'Lock Owner Vault'}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'लॉक' : 'Lock'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={onOpenPinModal}
                  className="px-3 py-1.5 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-500/40 hover:bg-amber-900 transition flex items-center gap-1.5 shrink-0 text-xs font-black"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>{lang === 'mr' ? 'मालक अनलॉक' : 'Unlock Owner'}</span>
                </button>
              )}
            </div>

            {/* Header Right Action Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* ORDER CART QUICK BUTTON */}
              <button
                onClick={() => {
                  if (onOpenCart) onOpenCart();
                }}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition min-h-[36px] cursor-pointer ${
                  totalCartCount > 0
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-950/40 border-amber-300 animate-pulse'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
                title={lang === 'mr' ? 'ऑर्डर कार्ट (Cart Drawer)' : 'Order Cart'}
              >
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black font-mono">
                  {totalCartCount}
                </span>
              </button>

              {/* LANGUAGE SWITCHER */}
              <button
                onClick={() => setLang(lang === 'mr' ? 'en' : 'mr')}
                className="px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-amber-300 hover:bg-stone-800 transition text-xs font-bold flex items-center gap-1 min-h-[36px]"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'mr' ? 'ENG' : 'मराठी'}</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="no-print md:hidden fixed bottom-0 left-0 right-0 z-50 bg-stone-950/95 backdrop-blur-xl border-t border-stone-800/80 px-2 py-1.5 flex items-center justify-between overflow-x-auto no-scrollbar shadow-[0_-10px_25px_rgba(0,0,0,0.8)] gap-1">
        
        {/* 0. Home / Welcome */}
        <button
          onClick={() => setActiveTab('welcome')}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl shrink-0 transition-all duration-200 ${
            activeTab === 'welcome'
              ? 'bg-amber-500/15 text-amber-400 font-extrabold border border-amber-500/30 shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Home className={`w-4 h-4 ${activeTab === 'welcome' ? 'text-amber-400 stroke-[2.5]' : 'text-stone-400'}`} />
          <span className="text-[10px] font-bold tracking-tight">{lang === 'mr' ? 'मुख्य' : 'Home'}</span>
        </button>


        {/* 1. Table POS */}
        <button
          onClick={() => {
            setMode('pos');
            setActiveTab('pos');
          }}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl shrink-0 transition-all duration-200 ${
            mode === 'pos' && activeTab === 'pos'
              ? 'bg-amber-500/15 text-amber-400 font-extrabold border border-amber-500/30 shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <LayoutGrid className={`w-4 h-4 ${mode === 'pos' && activeTab === 'pos' ? 'text-amber-400 stroke-[2.5]' : 'text-stone-400'}`} />
          <span className="text-[10px] font-bold tracking-tight">{lang === 'mr' ? 'टेबल' : 'Tables'}</span>
        </button>

        {/* 2. Kitchen Display */}
        <button
          onClick={() => setActiveTab('kds')}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl shrink-0 transition-all duration-200 ${
            activeTab === 'kds'
              ? 'bg-amber-500/15 text-amber-400 font-extrabold border border-amber-500/30 shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <ChefHat className={`w-4 h-4 ${activeTab === 'kds' ? 'text-amber-400 stroke-[2.5]' : 'text-stone-400'}`} />
          <span className="text-[10px] font-bold tracking-tight">{lang === 'mr' ? 'किचन' : 'Kitchen'}</span>
        </button>

        {/* OWNER UI ONLY TABS (Shown in Bottom Footer when Owner Vault is Unlocked!) */}
        {isOwnerUnlocked ? (
          <>
            {/* 3. Staff Attendance (Owner Only) */}
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl shrink-0 transition-all duration-200 ${
                activeTab === 'staff'
                  ? 'bg-emerald-500/15 text-emerald-400 font-extrabold border border-emerald-500/30 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'staff' ? 'text-emerald-400 stroke-[2.5]' : 'text-stone-400'}`} />
              <span className="text-[10px] font-bold tracking-tight">{lang === 'mr' ? 'हजेरी' : 'Staff'}</span>
            </button>

            {/* 3.5 Udhar Credit Register (Owner Only) */}
            <button
              onClick={() => setActiveTab('udhar')}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl shrink-0 transition-all duration-200 ${
                activeTab === 'udhar'
                  ? 'bg-amber-500/15 text-amber-400 font-extrabold border border-amber-500/30 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'udhar' ? 'text-amber-400 stroke-[2.5]' : 'text-stone-400'}`} />
              <span className="text-[10px] font-bold tracking-tight">{lang === 'mr' ? 'उधार' : 'Udhar'}</span>
            </button>

            {/* 4. Analytics / Reports (Owner Only) */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl shrink-0 transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-amber-500/15 text-amber-400 font-extrabold border border-amber-500/30 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-amber-400 stroke-[2.5]' : 'text-stone-400'}`} />
              <span className="text-[10px] font-bold tracking-tight">{lang === 'mr' ? 'अहवाल' : 'Reports'}</span>
            </button>

            {/* 5. Menu Manager (Owner Only) */}
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl shrink-0 transition-all duration-200 ${
                activeTab === 'menu'
                  ? 'bg-amber-500/15 text-amber-400 font-extrabold border border-amber-500/30 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Utensils className={`w-4 h-4 ${activeTab === 'menu' ? 'text-amber-400 stroke-[2.5]' : 'text-stone-400'}`} />
              <span className="text-[10px] font-bold tracking-tight">{lang === 'mr' ? 'मेनू' : 'Menu'}</span>
            </button>

            {/* 6. Lock Owner Vault */}
            <button
              onClick={lockOwnerVault}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl shrink-0 text-rose-400 hover:text-rose-200 transition-all duration-200"
            >
              <Lock className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] font-bold tracking-tight">{lang === 'mr' ? 'लॉक' : 'Lock'}</span>
            </button>
          </>
        ) : (
          /* Locked State: Show Owner Vault PIN Unlock Button */
          <button
            onClick={onOpenPinModal}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl shrink-0 bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all duration-200 shadow-sm"
          >
            <KeyRound className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-tight">{lang === 'mr' ? 'मालक PIN' : 'Owner PIN'}</span>
          </button>
        )}
      </div>

      {/* FULL-FEATURED SLIDE MENU DRAWER MODAL */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto flex items-start sm:items-center justify-center p-3 sm:p-6 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-stone-950 border border-amber-500/40 rounded-3xl max-w-md w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
          >
            
            {/* Drawer Top Header */}
            <div className="flex items-center justify-between p-4 bg-stone-950 border-b border-stone-800 shrink-0">
              <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>{lang === 'mr' ? HOTEL_INFO.nameMr : HOTEL_INFO.nameEn}</span>
                <span className="text-xs bg-amber-950 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                  {isOwnerUnlocked ? (lang === 'mr' ? '⚡ मालक मोड ऑन' : '⚡ Owner Mode') : (lang === 'mr' ? '🔒 स्टाफ मोड' : '🔒 Staff Mode')}
                </span>
              </h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-white bg-stone-900 border border-stone-800 flex items-center gap-1 text-xs font-bold px-3 min-h-[40px]"
              >
                <span>✕ {lang === 'mr' ? 'बंद करा' : 'Close'}</span>
              </button>
            </div>

            {/* Menu Drawer Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              
              {/* 1. Main Navigation */}
              <div>
                <p className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚡ {lang === 'mr' ? 'काउंटर व किचन' : 'Counter & Kitchen'}</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMode('pos');
                      setActiveTab('pos');
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-3 min-h-[48px] rounded-2xl bg-amber-950/60 border border-amber-600/40 text-amber-300 font-bold text-xs flex items-center gap-2"
                  >
                    <LayoutGrid className="w-4 h-4 text-amber-400" />
                    <span>📋 {lang === 'mr' ? 'टेबल POS' : 'Table POS'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('kds');
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-3 min-h-[48px] rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 font-bold text-xs flex items-center gap-2"
                  >
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    <span>👨‍🍳 {lang === 'mr' ? 'किचन (KDS)' : 'Kitchen (KDS)'}</span>
                  </button>
                </div>
              </div>

              {/* 2. OWNER UI SECTION (Attendance, Analytics, Menu Management - OWNER ONLY!) */}
              <div className="pt-2 border-t border-stone-800">
                <p className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>👑 {lang === 'mr' ? 'मालक विभाग (Owner UI)' : 'Owner Section'}</span>
                </p>

                {isOwnerUnlocked ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setActiveTab('staff');
                          setIsMobileMenuOpen(false);
                        }}
                        className="p-3 min-h-[48px] rounded-2xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 font-bold text-xs flex items-center gap-2"
                      >
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span>👥 {lang === 'mr' ? 'स्टाफ हजेरी' : 'Attendance'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('analytics');
                          setIsMobileMenuOpen(false);
                        }}
                        className="p-3 min-h-[48px] rounded-2xl bg-amber-950/60 border border-amber-600/40 text-amber-300 font-bold text-xs flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4 text-amber-400" />
                        <span>📊 {lang === 'mr' ? 'विक्री अहवाल' : 'Analytics'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('menu');
                          setIsMobileMenuOpen(false);
                        }}
                        className="p-3 min-h-[48px] rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 font-bold text-xs flex items-center gap-2 col-span-2"
                      >
                        <Utensils className="w-4 h-4 text-amber-400" />
                        <span>🍴 {lang === 'mr' ? 'मेनू व्यवस्थापन (Menu Manager)' : 'Menu Management'}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        lockOwnerVault();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full p-2.5 rounded-xl bg-rose-950/80 border border-rose-600/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-4 h-4 text-rose-400" />
                      <span>{lang === 'mr' ? '🔒 मालक विभाग लॉक करा' : '🔒 Lock Owner UI'}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenPinModal();
                    }}
                    className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <KeyRound className="w-4 h-4 text-stone-950 animate-bounce" />
                    <span>🔐 {lang === 'mr' ? 'मालक पिन टाका आणि अनलॉक करा' : 'Enter Owner PIN to Unlock Owner UI'}</span>
                  </button>
                )}
              </div>

              {/* Policy Rules & Info */}
              {onOpenRules && (
                <div className="pt-2 border-t border-stone-800">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenRules();
                    }}
                    className="w-full p-3 min-h-[48px] rounded-2xl bg-stone-900 border border-stone-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>📜 {lang === 'mr' ? 'हॉटेल नियम व माहिती' : 'Hotel Rules & Info'}</span>
                  </button>
                </div>
              )}

            </div>

            {/* Sound & Language Footer */}
            <div className="p-4 border-t border-stone-800 grid grid-cols-2 gap-2 bg-stone-955">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 min-h-[44px] rounded-2xl bg-stone-900 border border-stone-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                <span>{isMuted ? (lang === 'mr' ? '🔊 आवाज बंद' : '🔊 Sound Muted') : (lang === 'mr' ? '🔊 आवाज चालू' : '🔊 Sound Active')}</span>
              </button>

              <button
                onClick={() => setLang(lang === 'mr' ? 'en' : 'mr')}
                className="p-3 min-h-[44px] rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>🌐 {lang === 'mr' ? 'Switch to ENG' : 'मराठी निवडा'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
};
