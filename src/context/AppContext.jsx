import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_MENU_ITEMS } from '../data/menuData';
import { TRANSLATIONS } from '../data/translations';

const AppContext = createContext();

const BROADCAST_CHANNEL_NAME = 'aaradhya_dining_orders_channel';
const LOCAL_STORAGE_ORDERS_KEY = 'aaradhya_orders_db_v2';
const LOCAL_STORAGE_MENU_KEY = 'aaradhya_menu_db_v3';

// Production Clean Setup (Zero dummy records for real hotel deployment)
const SEED_ORDERS = [];

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim();

const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  if (!API_BASE_URL) return cleanPath;
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${baseUrl}${cleanPath}`;
};

const safeFetchJson = async (url, options = {}) => {
  const primaryUrl = getApiUrl(url);

  try {
    const res = await fetch(primaryUrl, options);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn(`API fetch notice [${primaryUrl}]:`, e.message);
  }

  // Fallback to relative URL if custom VITE_API_URL failed
  if (API_BASE_URL) {
    try {
      const cleanPath = url.startsWith('/') ? url : '/' + url;
      const res = await fetch(cleanPath, options);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
  }

  return null;
};

const postJson = async (url, body, method = 'POST') => {
  return safeFetchJson(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
};

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState('mr'); // 'mr' or 'en'
  const [mode, setMode] = useState('owner'); // 'owner' or 'pos'
  const [tableNo, setTableNo] = useState('Table 1');
  const [cart, setCart] = useState([]);
  const [specialNotes, setSpecialNotes] = useState('');
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [isMuted, setIsMuted] = useState(false); // Audio mute state

  // Voice Announcement & Sound Chime Player
  const playNotificationSound = (textAnnouncement = '') => {
    if (isMuted) return;

    // 1. Play Chime Sound using Web Audio API safely
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      // Ignore audio block
    }

    // 2. Text-To-Speech Voice Announcement (मराठी/English)
    try {
      if ('speechSynthesis' in window && textAnnouncement) {
        window.speechSynthesis.cancel(); // Stop any pending speech
        const utterance = new SpeechSynthesisUtterance(textAnnouncement);
        utterance.lang = lang === 'mr' ? 'mr-IN' : 'en-IN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      // Voice synthesis optional
    }
  };

  // Secret Owner PIN Lock Vault State (Persisted in localStorage without hardcoded defaults)
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(false);
  const [ownerPin, setOwnerPin] = useState(() => {
    return localStorage.getItem('aaradhya_owner_pin_db') || import.meta.env.VITE_OWNER_PIN || '';
  });

  const setupInitialOwnerPin = (newPin) => {
    if (!newPin || newPin.length < 4 || newPin.length > 6) {
      return { success: false, error: lang === 'mr' ? 'पिन ४ ते ६ अंकी असावा!' : 'PIN must be 4 to 6 digits!' };
    }
    setOwnerPin(newPin);
    localStorage.setItem('aaradhya_owner_pin_db', newPin);
    setIsOwnerUnlocked(true);
    playNotificationSound(lang === 'mr' ? 'मालक पिन सेट केला आहे!' : 'Owner PIN setup successfully!');
    return { success: true };
  };

  const unlockOwnerVault = (enteredPin) => {
    if (!ownerPin) {
      return { success: false, error: lang === 'mr' ? 'पिन सेट केलेला नाही! नवीन पिन तयार करा.' : 'No PIN set! Please set a PIN.' };
    }
    if (enteredPin === ownerPin) {
      setIsOwnerUnlocked(true);
      playNotificationSound(lang === 'mr' ? 'गुप्त मालक विभाग उघडला आहे!' : 'Owner vault unlocked!');
      return { success: true };
    }
    return { success: false, error: lang === 'mr' ? 'चुकीचा पिन! (Wrong PIN)' : 'Incorrect PIN!' };
  };

  const lockOwnerVault = () => {
    setIsOwnerUnlocked(false);
    playNotificationSound(lang === 'mr' ? 'मालक विभाग लॉक केला आहे' : 'Owner vault locked');
  };

  const changeOwnerPin = (currentPin, newPin) => {
    if (ownerPin && currentPin !== ownerPin) {
      return { success: false, error: lang === 'mr' ? 'जुना पिन चुकीचा आहे!' : 'Current PIN is incorrect!' };
    }
    if (!newPin || newPin.length < 4 || newPin.length > 6) {
      return { success: false, error: lang === 'mr' ? 'नवीन पिन ४ ते ६ अंकी असावा!' : 'New PIN must be 4 to 6 digits!' };
    }
    setOwnerPin(newPin);
    localStorage.setItem('aaradhya_owner_pin_db', newPin);
    playNotificationSound(lang === 'mr' ? 'मालक पिन यशस्वीरित्या बदलला आहे!' : 'Owner PIN updated successfully!');
    return { success: true };
  };

  // Customer Login State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('aaradhya_logged_user');
    return saved ? JSON.parse(saved) : { name: '', phone: '', isLoggedIn: false };
  });

  const loginUser = (name, phone) => {
    const user = { name, phone, isLoggedIn: true };
    setCurrentUser(user);
    localStorage.setItem('aaradhya_logged_user', JSON.stringify(user));
  };

  const logoutUser = () => {
    setCurrentUser({ name: '', phone: '', isLoggedIn: false });
    localStorage.removeItem('aaradhya_logged_user');
  };

  // Unique tab instance ID to prevent infinite sync loops
  const instanceId = useRef(Math.random().toString(36).substring(2, 9));

  // Registered Owner Recipient Emails State (Persisted in localStorage with .env fallback)
  const [ownerEmails, setOwnerEmails] = useState(() => {
    const saved = localStorage.getItem('aaradhya_owner_emails_db');
    if (saved) return JSON.parse(saved);
    const envEmails = import.meta.env.VITE_OWNER_EMAIL || '';
    return envEmails ? envEmails.split(',').map(e => e.trim()).filter(Boolean) : [];
  });

  useEffect(() => {
    localStorage.setItem('aaradhya_owner_emails_db', JSON.stringify(ownerEmails));
  }, [ownerEmails]);

  const addOwnerEmail = (email) => {
    const trimmed = email.trim();
    if (!trimmed || ownerEmails.includes(trimmed)) return;
    setOwnerEmails((prev) => [...prev, trimmed]);
    playNotificationSound(lang === 'mr' ? 'नवीन मालक ई-मेल जोडला आहे!' : 'Owner email added!');
  };

  const removeOwnerEmail = (email) => {
    setOwnerEmails((prev) => prev.filter((e) => e !== email));
    playNotificationSound(lang === 'mr' ? 'ई-मेल काढून टाकला आहे' : 'Owner email removed');
  };
  const lastSyncedOrdersStr = useRef('');
  const userInteracted = useRef(false);

  // Auto resume audio on first user click/interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      userInteracted.current = true;
    };
    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Menu items state with auto-merge for default dataset
  const [menuItems, setMenuItems] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_MENU_KEY);
    if (!saved) return INITIAL_MENU_ITEMS;
    try {
      const parsed = JSON.parse(saved);
      const existingIds = new Set(parsed.map((item) => item.id));
      const missingDefaults = INITIAL_MENU_ITEMS.filter((item) => !existingIds.has(item.id));
      return [...parsed, ...missingDefaults];
    } catch (e) {
      return INITIAL_MENU_ITEMS;
    }
  });

  // Orders state
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    return saved ? JSON.parse(saved) : SEED_ORDERS;
  });

  // Staff Members State (Empty by default for production deployment)
  const [staffMembers, setStaffMembers] = useState(() => {
    const saved = localStorage.getItem('aaradhya_staff_db');
    return saved ? JSON.parse(saved) : [];
  });

  // Attendance Records State (Key: 'YYYY-MM-DD_staffId', Value: 'P' | 'HD' | 'A')
  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const saved = localStorage.getItem('aaradhya_attendance_db');
    return saved ? JSON.parse(saved) : {};
  });

  // Submitted Attendance Dates State (Key: 'YYYY-MM-DD', Value: true)
  const [submittedAttendanceDates, setSubmittedAttendanceDates] = useState(() => {
    const saved = localStorage.getItem('aaradhya_submitted_attendance_dates');
    return saved ? JSON.parse(saved) : {};
  });

  // Salary Advances State
  const [salaryAdvances, setSalaryAdvances] = useState(() => {
    const saved = localStorage.getItem('aaradhya_advances_db');
    return saved ? JSON.parse(saved) : [];
  });

  // Salary Payments Ledger State (Key: 'YYYY-MM_staffId')
  const [salaryPayments, setSalaryPayments] = useState(() => {
    const saved = localStorage.getItem('aaradhya_salary_payments_db');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('aaradhya_salary_payments_db', JSON.stringify(salaryPayments));
  }, [salaryPayments]);

  // EOD Close Reports State
  const [eodReports, setEodReports] = useState(() => {
    const saved = localStorage.getItem('aaradhya_eod_reports_db');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('aaradhya_eod_reports_db', JSON.stringify(eodReports));
  }, [eodReports]);

  // Dynamic Table Management Setup (10 Base Tables + Parcel)
  const DEFAULT_TABLES = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10', 'Parcel'];

  const [customTables, setCustomTables] = useState(() => {
    const saved = localStorage.getItem('aaradhya_custom_tables_db');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('aaradhya_custom_tables_db', JSON.stringify(customTables));
  }, [customTables]);

  const allTables = [...DEFAULT_TABLES, ...customTables];

  const addCustomTable = async (customName) => {
    const name = customName?.trim() || `Table ${allTables.length} (Custom)`;
    if (allTables.includes(name)) {
      return { success: false, error: lang === 'mr' ? 'या नावाचे टेबल आधीच आहे!' : 'Table already exists!' };
    }
    setCustomTables((prev) => {
      const updated = [...prev, name];
      localStorage.setItem('aaradhya_custom_tables_db', JSON.stringify(updated));
      return updated;
    });
    await postJson('/api/custom-tables', { tableName: name });
    playNotificationSound(lang === 'mr' ? `नवीन टेबल '${name}' जोडले आहे!` : `Custom table '${name}' added!`);
    return { success: true, tableName: name };
  };

  const removeCustomTable = async (tableName) => {
    if (DEFAULT_TABLES.includes(tableName)) {
      return { success: false, error: lang === 'mr' ? 'मूळ टेबल काढता येत नाही!' : 'Default tables cannot be removed!' };
    }
    const hasActiveOrder = orders.some((o) => o.tableNo === tableName && o.status !== 'completed' && o.status !== 'cancelled');
    if (hasActiveOrder) {
      return { success: false, error: lang === 'mr' ? 'टेबलवर चालू ऑर्डर असल्यामुळे काढता येत नाही!' : 'Cannot remove table with active order!' };
    }
    setCustomTables((prev) => {
      const updated = prev.filter((t) => t !== tableName);
      localStorage.setItem('aaradhya_custom_tables_db', JSON.stringify(updated));
      return updated;
    });
    await safeFetchJson(`/api/custom-tables/${encodeURIComponent(tableName)}`, { method: 'DELETE' });
    playNotificationSound(lang === 'mr' ? `कस्टम टेबल '${tableName}' हटवले आहे.` : `Custom table '${tableName}' removed.`);
    return { success: true };
  };

  // Auto-Add Custom Table if ALL existing tables are occupied (100% full capacity)
  useEffect(() => {
    const occupiedCount = allTables.filter((tbl) =>
      orders.some((o) => o.tableNo === tbl && o.status !== 'completed' && o.status !== 'cancelled')
    ).length;

    if (occupiedCount > 0 && occupiedCount === allTables.length) {
      const nextNum = allTables.length;
      const autoCustomName = `Table ${nextNum} (Custom)`;
      if (!customTables.includes(autoCustomName)) {
        setCustomTables((prev) => {
          const updated = [...prev, autoCustomName];
          localStorage.setItem('aaradhya_custom_tables_db', JSON.stringify(updated));
          return updated;
        });
        postJson('/api/custom-tables', { tableName: autoCustomName }).catch(() => {});
        playNotificationSound(
          lang === 'mr'
            ? `⚡ सर्व टेबल फुल झाल्यामुळे '${autoCustomName}' आपोआप जोडले गेले!`
            : `All tables full! Auto-added ${autoCustomName}`
        );
      }
    }
  }, [orders, customTables]);

  // 1. Fetch Data from Turso Production DB API & Sync Real-Time Records
  const fetchTursoData = async () => {
    try {
      const [ordersRes, staffRes, menuRes, attendanceRes, advancesRes, paymentsRes, tablesRes, eodRes] = await Promise.all([
        safeFetchJson('/api/orders'),
        safeFetchJson('/api/staff'),
        safeFetchJson('/api/menu'),
        safeFetchJson('/api/attendance'),
        safeFetchJson('/api/salary-advances'),
        safeFetchJson('/api/salary-payments'),
        safeFetchJson('/api/custom-tables'),
        safeFetchJson('/api/eod-reports')
      ]);

      if (ordersRes?.success && Array.isArray(ordersRes.orders)) {
        setOrders((prev) => {
          const cancelledIds = new Set(prev.filter((o) => o.status === 'cancelled').map((o) => o.id));
          return ordersRes.orders.map((o) => {
            if (cancelledIds.has(o.id) && o.status !== 'cancelled') {
              return { ...o, status: 'cancelled' };
            }
            return o;
          });
        });
      }
      if (staffRes?.success && Array.isArray(staffRes.staff)) {
        setStaffMembers(staffRes.staff);
        localStorage.setItem('aaradhya_staff_db', JSON.stringify(staffRes.staff));
      }
      if (menuRes?.success && menuRes.menuItems?.length > 0) {
        setMenuItems(menuRes.menuItems);
      } else if (menuRes?.success && menuRes.menuItems?.length === 0) {
        postJson('/api/seed-menu', { items: menuItems }).catch(() => {});
      }
      if (attendanceRes?.success) {
        setAttendanceRecords(attendanceRes.attendanceRecords || {});
        setSubmittedAttendanceDates(attendanceRes.submittedAttendanceDates || {});
      }
      if (advancesRes?.success) {
        setSalaryAdvances(advancesRes.advances || []);
      }
      if (paymentsRes?.success) {
        setSalaryPayments(paymentsRes.salaryPayments || {});
      }
      if (tablesRes?.success) {
        const dbTables = tablesRes.customTables || [];
        setCustomTables((prev) => {
          const merged = Array.from(new Set([...prev, ...dbTables]));
          localStorage.setItem('aaradhya_custom_tables_db', JSON.stringify(merged));
          return merged;
        });
      }
      if (eodRes?.success && eodRes.reports?.length > 0) {
        setEodReports(eodRes.reports);
      }
    } catch (e) {
      console.log('Turso DB offline fallback active');
    }
  };

  // Real-time background polling every 3 seconds for zero-lag DB updates
  useEffect(() => {
    fetchTursoData();
    const interval = setInterval(fetchTursoData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync staff, attendance & advances to localStorage
  useEffect(() => {
    localStorage.setItem('aaradhya_staff_db', JSON.stringify(staffMembers));
  }, [staffMembers]);

  useEffect(() => {
    localStorage.setItem('aaradhya_attendance_db', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('aaradhya_submitted_attendance_dates', JSON.stringify(submittedAttendanceDates));
  }, [submittedAttendanceDates]);

  useEffect(() => {
    localStorage.setItem('aaradhya_advances_db', JSON.stringify(salaryAdvances));
  }, [salaryAdvances]);

  // Staff Handlers (Clean Architecture)
  const addStaffMember = async (newStaff) => {
    const id = newStaff.id || `stf-${Date.now()}`;
    const item = { ...newStaff, id };
    setStaffMembers((prev) => {
      const updated = [item, ...prev.filter((s) => s.id !== id)];
      localStorage.setItem('aaradhya_staff_db', JSON.stringify(updated));
      return updated;
    });
    await postJson('/api/staff', item);
  };

  const updateStaffMember = async (updatedStaff) => {
    setStaffMembers((prev) => {
      const updated = prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s));
      localStorage.setItem('aaradhya_staff_db', JSON.stringify(updated));
      return updated;
    });
    await postJson('/api/staff', updatedStaff);
  };

  const deleteStaffMember = async (staffId) => {
    setStaffMembers((prev) => {
      const updated = prev.filter((s) => s.id !== staffId);
      localStorage.setItem('aaradhya_staff_db', JSON.stringify(updated));
      return updated;
    });
    await safeFetchJson(`/api/staff/${staffId}`, { method: 'DELETE' });
  };

  const clearAllStaffMembers = async () => {
    setStaffMembers([]);
    localStorage.setItem('aaradhya_staff_db', JSON.stringify([]));
    await safeFetchJson('/api/staff', { method: 'DELETE' });
  };

  const markAttendance = (dateStr, staffId, status) => {
    const key = `${dateStr}_${staffId}`;
    setAttendanceRecords((prev) => ({ ...prev, [key]: status }));
    postJson('/api/attendance', { dateKey: dateStr, staffId, status }).catch(() => {});
  };

  const submitDailyAttendance = (dateStr) => {
    setSubmittedAttendanceDates((prev) => ({ ...prev, [dateStr]: true }));
    postJson('/api/attendance/submitted', { dateKey: dateStr, submitted: true }).catch(() => {});
    playNotificationSound(lang === 'mr' ? 'हजेरी सेव्ह व सबमिट झाली आहे!' : 'Attendance submitted successfully!');
  };

  const unlockDailyAttendance = (dateStr) => {
    setSubmittedAttendanceDates((prev) => {
      const copy = { ...prev };
      delete copy[dateStr];
      return copy;
    });
    safeFetchJson(`/api/attendance/submitted/${dateStr}`, { method: 'DELETE' }).catch(() => {});
    playNotificationSound(lang === 'mr' ? 'हजेरी बदलासाठी अनलॉक केली आहे' : 'Attendance unlocked for editing');
  };

  const recordAdvance = (staffId, amount, notes = '') => {
    const newAdvance = {
      id: `adv-${Date.now()}`,
      staffId,
      amount,
      notes,
      date: new Date().toISOString()
    };
    setSalaryAdvances((prev) => [newAdvance, ...prev]);
    postJson('/api/salary-advances', newAdvance).catch(() => {});
  };

  const paySalary = (staffId, amount, monthStr) => {
    const key = `${monthStr}_${staffId}`;
    const paidAt = new Date().toISOString();
    setSalaryPayments((prev) => ({
      ...prev,
      [key]: {
        amount,
        paidAt
      }
    }));
    postJson('/api/salary-payments', { staffId, amount, monthKey: monthStr, paidAt }).catch(() => {});
    playNotificationSound(lang === 'mr' ? 'कर्मचाऱ्याचा पगार जमा झाला आहे!' : 'Salary payment recorded successfully!');
  };

  // Sync menu state to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MENU_KEY, JSON.stringify(menuItems));
  }, [menuItems]);

  // Sync orders state to localStorage & BroadcastChannel (WITH ECHO-LOOP PREVENTION)
  useEffect(() => {
    const currentOrdersStr = JSON.stringify(orders);
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, currentOrdersStr);

    // Prevent echoing back the same data
    if (currentOrdersStr === lastSyncedOrdersStr.current) {
      return;
    }
    lastSyncedOrdersStr.current = currentOrdersStr;

    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({
        type: 'SYNC_ORDERS',
        payload: orders,
        senderId: instanceId.current
      });
      channel.close();
    } catch (e) {
      // Fallback
    }
  }, [orders]);

  // Listen to BroadcastChannel for cross-tab sync without infinite loops
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (!event.data || event.data.type !== 'SYNC_ORDERS') return;

        // Ignore messages sent by this tab instance
        if (event.data.senderId === instanceId.current) return;

        const newOrders = event.data.payload;
        const newOrdersStr = JSON.stringify(newOrders);

        // Only update if state actually changed
        if (newOrdersStr !== lastSyncedOrdersStr.current) {
          lastSyncedOrdersStr.current = newOrdersStr;
          setOrders(newOrders);
          playNotificationSound(lang === 'mr' ? 'ऑर्डर अपडेट झाली आहे!' : 'Order updated!');
        }
      };
    } catch (e) {
      // BroadcastChannel fallback
    }

    return () => {
      if (channel) channel.close();
    };
  }, [lang, isMuted]);

  // Helper translations
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;

  // Cart operations
  const addToCart = (item, extraThalis = 0) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        updated[existingIndex].extraThalis += extraThalis;
        return updated;
      } else {
        return [...prevCart, { ...item, quantity: 1, extraThalis }];
      }
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const updateExtraThalis = (itemId, delta) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === itemId) {
          const newExtra = Math.max(0, item.extraThalis + delta);
          return { ...item, extraThalis: newExtra };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCart([]);
    setSpecialNotes('');
  };

  // Place Order (With Turso DB Sync)
  const createOrder = async (orderData) => {
    const newId = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder = {
      id: newId,
      tableNo: orderData.tableNo || tableNo,
      customerName: orderData.customerName || '',
      customerPhone: orderData.customerPhone || '',
      timestamp: new Date().toISOString(),
      status: 'pending', // pending, preparing, ready, completed
      items: orderData.items || cart,
      specialNotes: orderData.specialNotes || specialNotes,
      paymentMethod: orderData.paymentMethod || 'Cash',
      itemTotal: orderData.itemTotal,
      extraThaliTotal: orderData.extraThaliTotal,
      grandTotal: orderData.grandTotal
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrderId(newId);
    clearCart();

    await postJson('/api/orders', newOrder).catch(() => {});

    playNotificationSound(lang === 'mr' ? 'नवीन ऑर्डर किचनमध्ये प्राप्त झाली आहे!' : 'New order received in kitchen!');
    return newOrder;
  };

  // Update order status (Owner with Turso DB Sync)
  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );

    await postJson(`/api/orders/${orderId}`, { status: newStatus }, 'PUT').catch(() => {});

    const msg =
      newStatus === 'preparing'
        ? lang === 'mr' ? 'ऑर्डर किचनमध्ये तयार होत आहे' : 'Order is cooking'
        : newStatus === 'ready'
        ? lang === 'mr' ? 'ऑर्डर सर्व्ह करण्यासाठी तयार झाली आहे' : 'Order is ready to serve'
        : lang === 'mr' ? 'ऑर्डर पूर्ण झाली' : 'Order completed';
    playNotificationSound(msg);
  };

  // Cancel Order (Owner / Staff with Turso DB Sync)
  const cancelOrder = async (orderId) => {
    let targetOrder = null;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          targetOrder = { ...ord, status: 'cancelled' };
          return targetOrder;
        }
        return ord;
      })
    );

    // Save to localStorage immediately
    try {
      const savedStr = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
      if (savedStr) {
        const parsed = JSON.parse(savedStr);
        const updated = parsed.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o));
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
      }
    } catch (e) {}

    await postJson(`/api/orders/${orderId}`, { status: 'cancelled' }, 'PUT').catch(() => {});

    playNotificationSound(lang === 'mr' ? 'ऑर्डर रद्द करण्यात आली आहे!' : 'Order cancelled successfully!');
  };

  // Update order payment method (Owner - Cash, UPI, Udhar)
  const updatePaymentMethod = (orderId, newPaymentMethod) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, paymentMethod: newPaymentMethod } : ord))
    );
    postJson(`/api/orders/${orderId}`, { paymentMethod: newPaymentMethod }, 'PUT').catch(() => {});
  };

  // Settle and complete order with payment method (Cash, UPI, Udhar with Turso DB Sync)
  const settleOrder = async (orderId, paymentMethod, customerName = '', customerPhone = '') => {
    const isUdhar = paymentMethod === 'Udhar';
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: 'completed', // FREES THE TABLE IMMEDIATELY!
            paymentMethod: paymentMethod || ord.paymentMethod || 'Cash',
            udharStatus: isUdhar ? 'pending' : 'none',
            customerName: customerName || ord.customerName,
            customerPhone: customerPhone || ord.customerPhone,
            settledAt: isUdhar ? null : new Date().toISOString()
          };
        }
        return ord;
      })
    );

    await postJson(`/api/orders/${orderId}`, {
      status: 'completed',
      paymentMethod: paymentMethod || 'Cash',
      udharStatus: isUdhar ? 'pending' : 'none',
      customerName,
      customerPhone,
      settledAt: isUdhar ? null : new Date().toISOString()
    }, 'PUT').catch(() => {});

    const soundMsg = isUdhar
      ? (lang === 'mr' ? 'उधारी बिल प्रलंबित खात्यावर जोडले व टेबल मोकळे केले!' : 'Udhar order saved & table freed!')
      : (lang === 'mr' ? 'पेमेंट जमा झाले व टेबल मोकळे केले!' : 'Payment settled and table freed!');
    playNotificationSound(soundMsg);
  };

  const settleUdharPayment = async (orderId, clearedPaymentMethod) => {
    const order = orders.find((o) => o.id === orderId);
    const settledAt = new Date().toISOString();

    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'completed',
              paymentMethod: clearedPaymentMethod || 'Cash',
              clearedPaymentMethod: clearedPaymentMethod || 'Cash',
              udharStatus: 'cleared',
              settledAt
            }
          : ord
      )
    );

    if (!order) return;

    await Promise.all([
      postJson(`/api/orders/${orderId}`, {
        status: 'completed',
        paymentMethod: clearedPaymentMethod || 'Cash',
        udharStatus: 'cleared',
        customerName: order.customerName || '',
        customerPhone: order.customerPhone || '',
        settledAt
      }, 'PUT'),
      postJson('/api/udhar-ledger', {
        id: `udhar-${orderId}`,
        orderId,
        customerName: order.customerName || '',
        customerPhone: order.customerPhone || '',
        amount: order.grandTotal || 0,
        paymentMethod: clearedPaymentMethod || 'Cash',
        settledAt
      })
    ]).catch(() => {});
  };

  const saveEodReport = async (reportData) => {
    const dateKey = new Date().toISOString().split('T')[0];
    const closedAt = new Date().toISOString();
    const newReport = {
      id: `eod-${dateKey}`,
      dateKey,
      totalRevenue: Number(reportData.totalRevenue || 0),
      totalOrders: Number(reportData.totalOrders || 0),
      cashTotal: Number(reportData.cashTotal || 0),
      upiTotal: Number(reportData.upiTotal || 0),
      udharTotal: Number(reportData.udharTotal || 0),
      vegCount: Number(reportData.vegCount || 0),
      nonVegCount: Number(reportData.nonVegCount || 0),
      closedAt
    };

    setEodReports((prev) => {
      const filtered = prev.filter((r) => r.id !== newReport.id);
      const updated = [newReport, ...filtered];
      localStorage.setItem('aaradhya_eod_reports_db', JSON.stringify(updated));
      return updated;
    });

    const res = await postJson('/api/eod-reports', newReport);
    return res || { success: true };
  };

  // Add items to an existing running order (Owner Table Section)
  const addItemsToExistingOrder = (orderId, newItemsToAdd) => {
    let updatedOrder = null;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;

        const updatedItems = [...ord.items];
        newItemsToAdd.forEach((newItem) => {
          const idx = updatedItems.findIndex((i) => i.id === newItem.id);
          if (idx > -1) {
            updatedItems[idx].quantity += newItem.quantity;
            updatedItems[idx].extraThalis = (updatedItems[idx].extraThalis || 0) + (newItem.extraThalis || 0);
          } else {
            updatedItems.push({ ...newItem });
          }
        });

        const itemTotal = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const extraThaliTotal = updatedItems.reduce((sum, i) => sum + (i.extraThalis || 0) * 60, 0);
        const grandTotal = itemTotal + extraThaliTotal;

        updatedOrder = {
          ...ord,
          items: updatedItems,
          itemTotal,
          extraThaliTotal,
          grandTotal
        };
        return updatedOrder;
      })
    );
    setTimeout(() => {
      if (!updatedOrder) return;
      postJson(`/api/orders/${orderId}`, updatedOrder, 'PUT').catch(() => {});
    }, 0);
    playNotificationSound(lang === 'mr' ? 'बिलामध्ये नवीन पदार्थ जोडले आहेत' : 'Added items to bill');
  };

  // Menu Admin Operations
  const toggleItemAvailability = (itemId) => {
    setMenuItems((prev) => {
      const next = prev.map((item) => (item.id === itemId ? { ...item, available: !item.available } : item));
      postJson('/api/seed-menu', { items: next }).catch(() => {});
      return next;
    });
  };

  const updateItemPrice = (itemId, newPrice) => {
    setMenuItems((prev) => {
      const next = prev.map((item) => (item.id === itemId ? { ...item, price: Number(newPrice) } : item));
      postJson('/api/seed-menu', { items: next }).catch(() => {});
      return next;
    });
  };

  const updateFullMenuItem = (updatedItem) => {
    setMenuItems((prev) => {
      const next = prev.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem } : item));
      postJson('/api/seed-menu', { items: next }).catch(() => {});
      return next;
    });
  };

  const addNewMenuItem = (newItem) => {
    const id = `custom-${Date.now()}`;
    setMenuItems((prev) => {
      const next = [{ ...newItem, id, available: true }, ...prev];
      postJson('/api/seed-menu', { items: next }).catch(() => {});
      return next;
    });
  };

  // Active Order object
  const activeOrder = orders.find((o) => o.id === activeOrderId);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        mode,
        setMode,
        tableNo,
        setTableNo,
        cart,
        addToCart,
        updateQuantity,
        updateExtraThalis,
        clearCart,
        specialNotes,
        setSpecialNotes,
        menuItems,
        orders,
        setOrders,
        settleOrder,
        isOwnerUnlocked,
        unlockOwnerVault,
        lockOwnerVault,
        ownerPin,
        changeOwnerPin,
        setupInitialOwnerPin,
        ownerEmails,
        addOwnerEmail,
        removeOwnerEmail,
        staffMembers,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        clearAllStaffMembers,
        attendanceRecords,
        markAttendance,
        submittedAttendanceDates,
        submitDailyAttendance,
        unlockDailyAttendance,
        salaryAdvances,
        salaryPayments,
        recordAdvance,
        paySalary,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        updatePaymentMethod,
        settleUdharPayment,
        eodReports,
        saveEodReport,
        addItemsToExistingOrder,
        activeOrderId,
        setActiveOrderId,
        activeOrder,
        toggleItemAvailability,
        updateItemPrice,
        updateFullMenuItem,
        addNewMenuItem,
        isMuted,
        setIsMuted,
        currentUser,
        loginUser,
        allTables,
        DEFAULT_TABLES,
        customTables,
        addCustomTable,
        removeCustomTable,
        playNotificationSound,
        safeFetchJson,
        t
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
