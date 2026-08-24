import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ChefHat, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Flame, 
  LogOut, 
  User, 
  Smartphone, 
  KeyRound, 
  AlertTriangle, 
  Radio, 
  BellRing, 
  Sparkles, 
  Play, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Phone,
  Vibrate,
  Maximize2,
  Minimize2,
  Monitor
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { activateBackgroundSoundbox, playOrderVoiceAndVibration, playPaytmDingDongChime } from '../../services/soundboxBackgroundService';

export const ChefDashboard = () => {
  const { 
    lang, 
    orders, 
    updateOrderStatus, 
    staffMembers, 
    playNotificationSound,
    speakOrderDetails 
  } = useApp();

  // Real-world Chef Session (Stored in localStorage)
  const [chefUser, setChefUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aaradhya_chef_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login Form States
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'select'
  const [chefPhone, setChefPhone] = useState('');
  const [chefLoginName, setChefLoginName] = useState('');
  const [chefLoginPin, setChefLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Paytm Soundbox States
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundboxActivated, setSoundboxActivated] = useState(true);
  const [isBackgroundAudioActive, setIsBackgroundAudioActive] = useState(false);
  const [lastAnnouncedOrder, setLastAnnouncedOrder] = useState(null);
  const [isSpeakingAnimation, setIsSpeakingAnimation] = useState(false);
  const [notificationPerm, setNotificationPerm] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
      } else {
        document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
      }
    } catch (e) {}
  };

  // Activate 24x7 Soundbox (Background Audio, MediaSession, WakeLock & Notifications)
  const handleActivateSoundbox = async () => {
    const res = await activateBackgroundSoundbox();
    if (res && res.success) {
      setIsBackgroundAudioActive(true);
      setSoundboxActivated(true);
      setVoiceEnabled(true);
      if (res.notifPerm) setNotificationPerm(res.notifPerm);
      playPaytmDingDongChime();
    }
  };

  // Automatically activate background soundbox on first touch/interaction
  useEffect(() => {
    const triggerAutoActivate = () => {
      activateBackgroundSoundbox().then((res) => {
        if (res && res.success) {
          setIsBackgroundAudioActive(true);
        }
      }).catch(() => {});
    };

    window.addEventListener('click', triggerAutoActivate, { once: true });
    window.addEventListener('touchstart', triggerAutoActivate, { once: true });
    return () => {
      window.removeEventListener('click', triggerAutoActivate);
      window.removeEventListener('touchstart', triggerAutoActivate);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPerm(perm);
        if (perm === 'granted') {
          playPaytmDingDongChime();
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification('🔔 लॉक स्क्रीन पुश नोटिफिकेशन्स सक्रिय!', {
                body: 'आता स्क्रीन बंद असली तरीही नवीन ऑर्डर्सचा डिंग-डिंग आवाज, व्हायब्रेशन व व्हॉईस थेट ऐकू येईल!',
                icon: '/hotel_emblem.png',
                vibrate: [600, 200, 600, 200, 800, 200, 1200]
              });
            }).catch(() => {});
          }
        }
      } catch (e) {}
    }
  };

  const ordersStateMapRef = useRef({}); // { orderId: hash }
  const isFirstRender = useRef(true);

  // Active incoming kitchen orders only
  const incomingOrders = orders
    .filter((o) => o.status !== 'completed' && o.status !== 'cancelled')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Screen Wake Lock API to keep mobile screen awake 24x7 in the kitchen
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (e) {}
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  const triggerLockScreenNotification = (ord, isUpdate = false) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const itemsList = (ord.items || []).map((i) => `${i.quantity}x ${i.nameMr}`).join(', ');
        const tableText = ord.tableNo === 'Parcel' ? '🛍️ पार्सल' : `📍 ${ord.tableNo}`;
        const title = isUpdate ? `🔔 ऑर्डर बदलली आहे! (${tableText})` : `🔔 नवीन ऑर्डर प्राप्त झाली! (${tableText})`;
        const body = `${itemsList}${ord.specialNotes ? ` (सूचना: ${ord.specialNotes})` : ''}`;

        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/hotel_emblem.png',
              badge: '/hotel_emblem.png',
              vibrate: [600, 200, 600, 200, 800, 200, 1200],
              tag: `order-${ord.id}-${Date.now()}`,
              requireInteraction: true,
              data: { orderId: ord.id }
            });
          }).catch(() => {});
        } else {
          new Notification(title, {
            body,
            icon: '/hotel_emblem.png',
            vibrate: [600, 200, 600, 200, 800, 200, 1200]
          });
        }
      }
    } catch (e) {}
  };

  // REAL-WORLD PAYTM SOUNDBOX VOICE & VIBRATION NOTIFICATION ENGINE (NEW & MODIFIED ORDERS!)
  useEffect(() => {
    if (!voiceEnabled || !soundboxActivated) return;

    // Helper to generate a content signature for each order
    const getOrderSignature = (ord) => {
      const itemsStr = (ord.items || [])
        .map((i) => `${i.id || i.nameMr}-${i.quantity || 1}-${i.extraThalis || 0}`)
        .join('|');
      return `${itemsStr}__${ord.specialNotes || ''}__${ord.tableNo || ''}`;
    };

    if (isFirstRender.current) {
      isFirstRender.current = false;
      const initialMap = {};
      incomingOrders.forEach((o) => {
        initialMap[o.id] = getOrderSignature(o);
      });
      ordersStateMapRef.current = initialMap;
      if (incomingOrders.length > 0) {
        setLastAnnouncedOrder(incomingOrders[0]);
      }
      return;
    }

    const currentMap = { ...ordersStateMapRef.current };

    incomingOrders.forEach((ord) => {
      const currentSignature = getOrderSignature(ord);
      const previousSignature = currentMap[ord.id];

      if (!previousSignature) {
        // 1. BRAND NEW INCOMING ORDER (Plays Ding-Dong Chime, Vibrates Mobile & Speaks Marathi Menu Items)
        setLastAnnouncedOrder(ord);
        setIsSpeakingAnimation(true);
        setTimeout(() => setIsSpeakingAnimation(false), 5000);
        triggerLockScreenNotification(ord, false);
        playOrderVoiceAndVibration(ord, 'नवीन ऑर्डर!', lang);
      } else if (previousSignature !== currentSignature) {
        // 2. MODIFIED / UPDATED ORDER (Plays Chime, Vibrates Mobile & Announces Modified Details)
        setLastAnnouncedOrder(ord);
        setIsSpeakingAnimation(true);
        setTimeout(() => setIsSpeakingAnimation(false), 5000);
        triggerLockScreenNotification(ord, true);
        playOrderVoiceAndVibration(ord, 'ऑर्डर बदलली आहे!', lang);
      }

      currentMap[ord.id] = currentSignature;
    });

    ordersStateMapRef.current = currentMap;
  }, [orders, voiceEnabled, soundboxActivated, lang]);

  // Real-World Chef Login Authenticator
  const handleChefLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    let authenticatedChef = null;

    if (loginMethod === 'phone') {
      const cleanPhone = chefPhone.trim().replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setLoginError('कृपया योग्य १० अंकी मोबाईल नंबर प्रविष्ट करा!');
        return;
      }

      // Check registered staff in DB
      const matched = staffMembers?.find(
        (s) => (s.phone || '').replace(/\D/g, '').includes(cleanPhone)
      );

      if (matched) {
        // If staff exists, verify PIN if set (or default 1234)
        const expectedPin = matched.pin || '1234';
        if (chefLoginPin && chefLoginPin !== expectedPin && chefLoginPin !== '1234') {
          setLoginError('अवैध शेफ पिन! (डिफॉल्ट पिन: 1234)');
          return;
        }
        authenticatedChef = {
          id: matched.id,
          name: matched.name,
          phone: matched.phone || cleanPhone,
          role: matched.role || 'मुख्य आचारी (Head Chef)'
        };
      } else {
        // Allow mobile login with default PIN for any kitchen staff
        if (chefLoginPin && chefLoginPin !== '1234') {
          setLoginError('अवैध शेफ पिन! (डिफॉल्ट पिन: 1234)');
          return;
        }
        authenticatedChef = {
          id: `chef-${cleanPhone.slice(-4)}`,
          name: `शेफ (${cleanPhone.slice(-4)})`,
          phone: cleanPhone,
          role: 'किचन शेफ (Kitchen Chef)'
        };
      }
    } else {
      // Login via Name Select
      const cleanName = chefLoginName.trim();
      if (!cleanName) {
        setLoginError('कृपया शेफ / आचारी नाव प्रविष्ट करा!');
        return;
      }

      const matched = staffMembers?.find((s) => s.name?.toLowerCase() === cleanName.toLowerCase());
      const expectedPin = matched?.pin || '1234';
      if (chefLoginPin && chefLoginPin !== expectedPin && chefLoginPin !== '1234') {
        setLoginError('अवैध शेफ पिन! (डिफॉल्ट पिन: 1234)');
        return;
      }

      authenticatedChef = {
        id: matched?.id || `chef-${Date.now()}`,
        name: cleanName,
        phone: matched?.phone || '',
        role: matched?.role || 'मुख्य आचारी (Head Chef)'
      };
    }

    const session = {
      ...authenticatedChef,
      loginAt: new Date().toISOString()
    };

    setChefUser(session);
    localStorage.setItem('aaradhya_chef_session', JSON.stringify(session));
    setLoginError('');

    playNotificationSound(`शेफ ${session.name} लॉगिन झाले!`);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleChefLogout = () => {
    if (window.confirm('लॉगआउट करायचे आहे का? (साऊंडबॉक्स व्हॉईस मोड चालू राहील)')) {
      setChefUser(null);
      localStorage.removeItem('aaradhya_chef_session');
    }
  };

  // Announce single order voice with Ding-Dong & Vibration
  const handleListenOrder = (ord) => {
    setIsSpeakingAnimation(true);
    setTimeout(() => setIsSpeakingAnimation(false), 5000);
    playOrderVoiceAndVibration(ord, 'नवीन ऑर्डर!', lang);
  };

  // Test Soundbox Voice
  const handleTestSoundbox = () => {
    setIsSpeakingAnimation(true);
    setTimeout(() => setIsSpeakingAnimation(false), 5000);

    if (lastAnnouncedOrder) {
      handleListenOrder(lastAnnouncedOrder);
    } else {
      const demoOrder = {
        id: 'ORD-DEMO',
        tableNo: 'Table 1',
        items: [
          { nameMr: 'स्पे. शेतकरी मटण थाळी', quantity: 1, extraThalis: 0 },
          { nameMr: 'चिकन सुक्का थाळी', quantity: 2, extraThalis: 1 }
        ],
        specialNotes: 'कमी तिखट'
      };
      playOrderVoiceAndVibration(demoOrder, 'नवीन ऑर्डर!', lang);
    }
  };

  // --- 1. REAL-WORLD CHEF LOGIN & PAYTM SOUNDBOX SCREEN (WHEN NOT LOGGED IN) ---
  if (!chefUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in select-none">
        
        {/* PAYTM SOUNDBOX REAL-WORLD VOICE DEVICE BANNER */}
        <div className="bg-gradient-to-br from-amber-950/90 via-stone-900 to-stone-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/60 relative overflow-hidden">
          
          {/* Top Saffron Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            
            {/* Soundbox Emblem with Pulse Waves */}
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-stone-950 flex items-center justify-center shadow-xl border-2 border-amber-300 shrink-0 relative transition-transform ${
                isSpeakingAnimation ? 'scale-110 shadow-amber-400/50' : ''
              }`}>
                <Radio className={`w-10 h-10 stroke-[2.5] ${isSpeakingAnimation ? 'animate-bounce text-stone-950' : 'animate-pulse'}`} />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-stone-950 animate-ping" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Paytm Soundbox 24x7 Mode</span>
                  </span>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {incomingOrders.length} चालू ऑर्डर्स
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-amber-300">
                  हॉटेल आराध्या किचन साऊंडबॉक्स
                </h2>
                <p className="text-xs text-stone-300 font-medium">
                  मोबाईल लॉगिन नसला तरीही नवीन ऑर्डर येताच साऊंडबॉक्सद्वारे आपोआप मराठीत मोठ्या आवाजात बोलले जाईल!
                </p>
              </div>
            </div>

            {/* Test Voice & Sound Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto shrink-0">
              {/* Push Notification Toggle / Button */}
              <button
                type="button"
                onClick={requestNotificationPermission}
                className={`w-full sm:w-auto px-4 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-lg cursor-pointer transition ${
                  notificationPerm === 'granted'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 text-stone-950 animate-pulse'
                }`}
              >
                <BellRing className="w-4 h-4 stroke-[2.5]" />
                <span>{notificationPerm === 'granted' ? '🔔 लॉक स्क्रीन पुश ऑन' : '🔔 लॉक स्क्रीन पुश ऑन करा'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestSoundbox}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
              >
                <BellRing className="w-4 h-4 stroke-[2.5]" />
                <span>🔊 आवाज टेस्ट करा</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextState = !voiceEnabled;
                  setVoiceEnabled(nextState);
                  playNotificationSound(nextState ? 'साऊंडबॉक्स चालू' : 'साऊंडबॉक्स बंद');
                }}
                className={`w-full sm:w-auto px-4 py-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  voiceEnabled
                    ? 'bg-stone-900 border-amber-500/50 text-amber-300'
                    : 'bg-stone-950 border-stone-800 text-stone-500'
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
                <span>{voiceEnabled ? 'आवाज चालू' : 'आवाज बंद'}</span>
              </button>
            </div>

          </div>

          {/* Last Received Order Card Preview */}
          {lastAnnouncedOrder && (
            <div className="mt-5 pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-950/70 p-3.5 rounded-2xl border border-stone-800">
              <div className="flex items-center gap-2.5 text-xs text-stone-300 min-w-0">
                <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-stone-950 font-black shrink-0">
                  {lastAnnouncedOrder.tableNo === 'Parcel' ? '🛍️ पार्सल' : `📍 ${lastAnnouncedOrder.tableNo}`}
                </span>
                <span className="truncate font-bold text-amber-300">
                  {(lastAnnouncedOrder.items || []).map((i) => `${i.quantity}x ${i.nameMr}`).join(', ')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleListenOrder(lastAnnouncedOrder)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>पुन्हा ऐका</span>
              </button>
            </div>
          )}

        </div>

        {/* REAL-WORLD CHEF LOGIN PORTAL (TO MANAGE ORDERS) */}
        <div className="bg-stone-900 border border-amber-600/40 rounded-3xl p-6 sm:p-8 shadow-xl max-w-md mx-auto space-y-5">
          
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-stone-950 border border-stone-800 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <ChefHat className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-amber-300">
              👨‍🍳 शेफ / आचारी लॉगिन
            </h3>
            <p className="text-xs text-stone-400">
              किचन स्क्रीनवर ऑर्डर्स पाहण्यासाठी व पूर्ण करण्यासाठी लॉगिन करा
            </p>
          </div>

          {/* Login Method Tabs (Mobile / Name) */}
          <div className="flex bg-stone-950 p-1 rounded-2xl border border-stone-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                loginMethod === 'phone'
                  ? 'bg-amber-500 text-stone-950 font-black shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>मोबाईल नंबर</span>
            </button>

            <button
              type="button"
              onClick={() => setLoginMethod('select')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                loginMethod === 'select'
                  ? 'bg-amber-500 text-stone-950 font-black shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>स्टाफ यादीतून</span>
            </button>
          </div>

          <form onSubmit={handleChefLogin} className="space-y-4">
            
            {/* Phone Input Method */}
            {loginMethod === 'phone' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>शेफ मोबाईल नंबर:</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="उदा. 9876543210"
                  value={chefPhone}
                  onChange={(e) => setChefPhone(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-2xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none font-mono font-bold"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>शेफ नाव निवडा:</span>
                </label>

                {staffMembers && staffMembers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto mb-2">
                    {staffMembers.slice(0, 6).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setChefLoginName(s.name);
                          if (s.pin) setChefLoginPin(s.pin);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                          chefLoginName === s.name
                            ? 'bg-amber-500 text-stone-950 border-amber-400 font-black'
                            : 'bg-stone-950 text-stone-300 border-stone-800'
                        }`}
                      >
                        👨‍🍳 {s.name}
                      </button>
                    ))}
                  </div>
                ) : null}

                <input
                  type="text"
                  required
                  placeholder="उदा. रामदास / मुख्य आचारी"
                  value={chefLoginName}
                  onChange={(e) => setChefLoginName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-2xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none font-bold"
                />
              </div>
            )}

            {/* PIN Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>शेफ ४-अंकी पिन (डिफॉल्ट: 1234):</span>
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="1234"
                value={chefLoginPin}
                onChange={(e) => setChefLoginPin(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-2xl px-4 py-2.5 text-sm text-amber-400 tracking-widest font-mono text-center placeholder-stone-600 focus:outline-none"
              />
            </div>

            {loginError && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-bold text-center">
                ⚠️ {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <ChefHat className="w-4 h-4 stroke-[2.5]" />
              <span>किचन डॅशबोर्ड उघडा</span>
            </button>
          </form>

        </div>

      </div>
    );
  }

  // --- 2. CLEAN CHEF ORDER SCREEN (WHEN LOGGED IN) ---
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-24 animate-fade-in select-none">
      
      {/* Top Header */}
      <div className="bg-stone-900 border border-amber-600/40 rounded-2xl p-3 sm:p-4 shadow-xl flex items-center justify-between gap-3">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 flex items-center justify-center font-black shadow-md border border-amber-300/40">
            <ChefHat className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-amber-300">
              👨‍🍳 {chefUser.name}
            </h2>
            <p className="text-xs text-stone-400">
              {incomingOrders.length} चालू ऑर्डर्स • साऊंडबॉक्स ऑन 🔊
            </p>
          </div>
        </div>

        {/* Actions (Push Notification, Test Voice, Voice Toggle, Logout) */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Lock Screen Push Notification Button */}
          <button
            type="button"
            onClick={requestNotificationPermission}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition border min-h-[38px] cursor-pointer ${
              notificationPerm === 'granted'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-stone-950 border-emerald-300 hover:from-emerald-400 animate-pulse shadow-md'
            }`}
            title="स्क्रीन बंद असताना नोटिफिकेशन्स मिळवण्यासाठी क्लिक करा"
          >
            <BellRing className="w-4 h-4 stroke-[2.5]" />
            <span>{notificationPerm === 'granted' ? '🔔 लॉक स्क्रीन पुश ऑन' : '🔔 लॉक स्क्रीन पुश ऑन करा'}</span>
          </button>

          {/* Test Voice Button */}
          <button
            type="button"
            onClick={handleTestSoundbox}
            className="px-3 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800 transition text-xs font-bold flex items-center gap-1.5 min-h-[38px]"
            title="आवाज तपासा"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>आवाज टेस्ट</span>
          </button>

          {/* Fullscreen Kitchen Kiosk Mode Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 transition text-xs font-bold flex items-center gap-1.5 min-h-[38px] cursor-pointer"
            title="किचन स्टँड फुलस्क्रीन मोड (स्क्रीन सतत चालू राहते)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'स्क्रीन लहान करा' : '⛶ फुलस्क्रीन'}</span>
          </button>

          {/* Voice Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextState = !voiceEnabled;
              setVoiceEnabled(nextState);
              playNotificationSound(nextState ? 'व्हॉईस चालू' : 'व्हॉईस बंद');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border min-h-[38px] ${
              voiceEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-stone-950 text-stone-400 border-stone-800'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
            <span>{voiceEnabled ? 'व्हॉईस ऑन' : 'आवाज बंद'}</span>
          </button>

          {/* Chef Logout */}
          <button
            type="button"
            onClick={handleChefLogout}
            className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition text-xs font-bold flex items-center gap-1 min-h-[38px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>लॉगआउट</span>
          </button>
        </div>

      </div>

      {/* 24x7 Real-World Background Soundbox & Vibration Status Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-stone-900 to-stone-900 border border-emerald-500/50 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5 text-xs text-stone-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-300">
                {lang === 'mr' ? '24x7 साऊंडबॉक्स व्हॉईस, डिंग-डिंग व व्हायब्रेशन सक्रिय' : '24x7 Soundbox Voice, Ding-Dong & Vibration Active'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[11px] text-stone-400">
              {lang === 'mr' 
                ? '📱 मोबाईल स्क्रीन बंद (Off) असली तरीही नवीन ऑर्डर येताच मोठा डिंग-डिंग आवाज, व्हायब्रेशन व मेनू ऐकू येईल!' 
                : '📱 Even when mobile screen is OFF, you will receive loud ding-dong chime, vibration & voice notification!'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestSoundbox}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 transition shadow shrink-0"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{lang === 'mr' ? '🔊 आवाज + व्हायब्रेशन टेस्ट करा' : '🔊 Test Sound & Vibration'}</span>
        </button>
      </div>

      {/* Incoming Orders Grid */}
      {incomingOrders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-stone-900/60 border border-stone-800 space-y-3">
          <ChefHat className="w-16 h-16 text-stone-600 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-stone-300">
            सध्या कोणतीही नवीन ऑर्डर नाही!
          </h3>
          <p className="text-xs text-stone-400">
            नवीन ऑर्डर येताच साऊंडबॉक्सद्वारे आपोआप ऐकू येईल.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incomingOrders.map((ord) => (
            <div
              key={ord.id}
              className={`rounded-3xl p-5 border-2 shadow-2xl space-y-4 transition ${
                ord.status === 'pending'
                  ? 'bg-stone-900 border-amber-500 shadow-amber-950/30'
                  : ord.status === 'preparing'
                  ? 'bg-stone-900 border-orange-500 shadow-orange-950/30'
                  : 'bg-stone-900 border-emerald-500 shadow-emerald-950/30'
              }`}
            >
              
              {/* Card Header: Table No & Order ID */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-sm uppercase tracking-wider shadow">
                    {ord.tableNo === 'Parcel' ? '🛍️ पार्सल' : `📍 ${ord.tableNo}`}
                  </span>
                  <span className="text-xs font-mono font-bold text-stone-300 bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-700">
                    {ord.id}
                  </span>
                </div>

                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  ord.status === 'pending' 
                    ? 'bg-amber-950 text-amber-300 border border-amber-600/40' 
                    : ord.status === 'preparing'
                    ? 'bg-orange-950 text-orange-300 border border-orange-600/40'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                }`}>
                  {ord.status === 'pending' ? 'नवीन ऑर्डर' : ord.status === 'preparing' ? 'बनवत आहे' : 'तयार आहे'}
                </span>
              </div>

              {/* Special Notes (if any) */}
              {ord.specialNotes && (
                <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/60 text-xs text-amber-200 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>सूचना: "{ord.specialNotes}"</span>
                </div>
              )}

              {/* Dishes Ordered List */}
              <div className="space-y-2">
                {(ord.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-black text-sm flex items-center justify-center border border-amber-500/40">
                        {item.quantity}x
                      </span>
                      <div>
                        <h4 className="text-sm font-black text-stone-100">
                          {item.nameMr}
                        </h4>
                        {item.extraThalis > 0 && (
                          <span className="text-[11px] font-bold text-amber-400">
                            +{item.extraThalis} एक्स्ट्रा ताट
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* PROMINENT VOICE LISTEN BUTTON */}
              <button
                type="button"
                onClick={() => handleListenOrder(ord)}
                className="w-full py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border-2 border-amber-500/60 font-black text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-lg"
              >
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span>🔊 ऑर्डर ऐका (Listen Order)</span>
              </button>

              {/* Simple Single Status Button */}
              {ord.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => {
                    updateOrderStatus(ord.id, 'preparing');
                    playNotificationSound(`${ord.tableNo} ची ऑर्डर बनवायला घेतली आहे`);
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-stone-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Flame className="w-4 h-4 stroke-[2.5]" />
                  <span>👨‍🍳 बनवायला घ्या (Start Cooking)</span>
                </button>
              )}

              {ord.status === 'preparing' && (
                <button
                  type="button"
                  onClick={() => {
                    updateOrderStatus(ord.id, 'ready');
                    playNotificationSound(`${ord.tableNo} तयार आहे, सर्व्ह करा!`);
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 text-stone-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>🍲 तयार झाले (Mark Ready)</span>
                </button>
              )}

              {ord.status === 'ready' && (
                <button
                  type="button"
                  onClick={() => {
                    updateOrderStatus(ord.id, 'completed');
                    playNotificationSound(`${ord.tableNo} पूर्ण झाले`);
                  }}
                  className="w-full py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-emerald-300 border border-emerald-500/40 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>✓ सर्व्ह झाले (Completed)</span>
                </button>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
