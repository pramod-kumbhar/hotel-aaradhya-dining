// Hotel Aaradhya Dining - 24x7 Background Soundbox & Voice Notification Service
// Keeps background audio, speech, vibration, and lock-screen notifications alive even when mobile screen is OFF

let silentAudioElement = null;
let isSoundboxActive = false;
let wakeLockInstance = null;

// 1-second clean PCM silent WAV data URI
const SILENT_WAV_DATA_URI = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/**
 * Activate Background Soundbox Engine:
 * - Starts background silent audio loop to prevent mobile OS CPU/Audio throttling
 * - Registers Lock-Screen MediaSession metadata
 * - Acquires Screen WakeLock (where supported)
 * - Requests Notification permissions
 */
export const activateBackgroundSoundbox = async () => {
  if (typeof window === 'undefined') return { success: false };

  try {
    // 1. Initialize Silent Audio Loop to keep Mobile Audio Daemon alive
    if (!silentAudioElement) {
      silentAudioElement = new Audio();
      silentAudioElement.src = SILENT_WAV_DATA_URI;
      silentAudioElement.loop = true;
      silentAudioElement.volume = 0.01;
    }

    try {
      await silentAudioElement.play();
    } catch (err) {
      // Audio autoplay might require user tap
    }

    // 2. Register MediaSession for Mobile Lock-Screen Keep-Alive
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: '🔔 हॉटेल आराध्या - किचन साऊंडबॉक्स',
        artist: 'ऑर्डर व्हॉईस अलर्ट सिस्टीम सक्रिय',
        album: 'Hotel Aaradhya Dining',
        artwork: [
          { src: '/hotel_emblem.png', sizes: '192x192', type: 'image/png' },
          { src: '/hotel_emblem.png', sizes: '512x512', type: 'image/png' }
        ]
      });
      navigator.mediaSession.playbackState = 'playing';

      navigator.mediaSession.setActionHandler('play', () => {
        if (silentAudioElement) silentAudioElement.play().catch(() => {});
        navigator.mediaSession.playbackState = 'playing';
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        // Keep active
        navigator.mediaSession.playbackState = 'playing';
      });
    }

    // 3. Screen Wake Lock
    if ('wakeLock' in navigator) {
      try {
        wakeLockInstance = await navigator.wakeLock.request('screen');
      } catch (e) {}
    }

    // 4. Request Notifications Permission
    let notifPerm = 'default';
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        notifPerm = await Notification.requestPermission();
      } else {
        notifPerm = Notification.permission;
      }
    }

    isSoundboxActive = true;
    return { success: true, notifPerm };
  } catch (error) {
    console.warn('Soundbox activation notice:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Play Dual-Tone Loud Paytm Ding-Dong Chime
 */
export const playPaytmDingDongChime = () => {
  try {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) return;

    const audioCtx = new AudioCtxClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Tone 1: Ding (G5 - 783.99 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(783.99, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);

    // Tone 2: Dong (C6 - 1046.50 Hz)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.45, audioCtx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(audioCtx.currentTime + 0.15);
    osc2.stop(audioCtx.currentTime + 0.55);
  } catch (e) {}
};

/**
 * Play Full Real-World Voice Announcement with Vibration, Chime, and Lock-Screen Push
 */
export const playOrderVoiceAndVibration = (order, customPrefix = '', lang = 'mr') => {
  if (!order) return;

  // 1. Strong Physical Vibration for Mobile (Works when phone in pocket or screen dark)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([600, 200, 600, 200, 800, 200, 1200]);
    } catch (e) {}
  }

  // 2. Play Loud Ding-Dong Soundbox Chime
  playPaytmDingDongChime();

  // 3. Format Dish Names & Quantities
  let parsedItems = order.items || [];
  if (typeof parsedItems === 'string') {
    try {
      parsedItems = JSON.parse(parsedItems);
    } catch (e) {
      parsedItems = [];
    }
  }
  if (!Array.isArray(parsedItems)) parsedItems = [];

  const itemsSummary = parsedItems
    .map((i) => {
      const qty = i.quantity || 1;
      const dishName = lang === 'mr' ? (i.nameMr || i.nameEn) : (i.nameEn || i.nameMr);
      const extra = i.extraThalis > 0 ? `, ${i.extraThalis} एक्स्ट्रा ताट` : '';
      return `${qty} ${dishName}${extra}`;
    })
    .filter(Boolean)
    .join(', ');

  const defaultPrefix = lang === 'mr' ? 'नवीन ऑर्डर!' : 'New Order!';
  const prefix = customPrefix || defaultPrefix;
  const tableText = order.tableNo === 'Parcel' 
    ? (lang === 'mr' ? 'पार्सल' : 'Parcel') 
    : `${order.tableNo}`;
  const notes = order.specialNotes 
    ? (lang === 'mr' ? `. सूचना: ${order.specialNotes}` : `. Note: ${order.specialNotes}`) 
    : '';

  // 4. Real Marathi Spoken Speech Playback (HTML5 Audio Stream - Works even when screen is locked / OFF)
  try {
    const ttsUrl = `/api/tts?text=${encodeURIComponent(speechText)}&lang=mr`;
    const ttsAudio = new Audio(ttsUrl);
    ttsAudio.volume = 1.0;

    // Slight delay after chime (350ms)
    setTimeout(() => {
      ttsAudio.play().catch((err) => {
        // Fallback to Web SpeechSynthesis if network stream fails
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(speechText);
            
            const voices = window.speechSynthesis.getVoices() || [];
            const marathiVoice = voices.find((v) => v.lang?.includes('mr') || v.lang?.includes('MR'));
            const hindiVoice = voices.find((v) => v.lang?.includes('hi') || v.lang?.includes('HI'));
            const indianEngVoice = voices.find((v) => v.lang?.includes('en-IN') || v.lang?.includes('en_IN'));

            if (marathiVoice) {
              utterance.voice = marathiVoice;
              utterance.lang = marathiVoice.lang;
            } else if (hindiVoice) {
              utterance.voice = hindiVoice;
              utterance.lang = hindiVoice.lang;
            } else if (indianEngVoice) {
              utterance.voice = indianEngVoice;
              utterance.lang = indianEngVoice.lang;
            } else {
              utterance.lang = lang === 'mr' ? 'mr-IN' : 'en-IN';
            }

            utterance.rate = 0.88;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            window.speechSynthesis.speak(utterance);
          } catch (e) {}
        }
      });
    }, 350);
  } catch (e) {}

  // 5. Lock-Screen Push Notification via Service Worker
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const title = `${prefix} (${tableText})`;
      const body = itemsSummary ? `${itemsSummary}${notes}` : `किचनमध्ये ऑर्डर तयार करण्यासाठी आली आहे.`;

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/hotel_emblem.png',
            badge: '/hotel_emblem.png',
            vibrate: [600, 200, 600, 200, 800, 200, 1200],
            tag: `chef-order-${order.id}-${Date.now()}`,
            renotify: true,
            requireInteraction: true,
            data: { orderId: order.id, tableNo: order.tableNo }
          }).catch(() => {});
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

