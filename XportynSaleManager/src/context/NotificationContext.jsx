import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

import { TOKEN_KEY } from '../api/client';

/**
 * Live notifications (Socket.IO)
 * ------------------------------
 * Backend har chand minute baad mailbox dekhta hai. Nayi reply milte hi
 * `xportyn:new-replies` event bhejta hai — yahan se wo navbar ki ghanti
 * tak pohanchta hai. Yani page refresh karne ki zaroorat nahi rehti.
 *
 * Purani notifications browser me hi rakhi jati hain (localStorage), taake
 * tab band kar ke wapas aayen to list gayab na ho.
 */

const NotificationContext = createContext(null);

const STORAGE_KEY = 'xportyn_notifications';
const MAX_ITEMS = 30;

/** localStorage private window me throw kar sakta hai — is liye har jagah try/catch */
const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeStored = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* jagah na ho ya blocked ho — notification khone se app nahi rukti */
  }
};

/**
 * Socket ka pata.
 *
 * Dev me frontend aur backend alag ports par hain, magar Vite `/socket.io`
 * ko proxy kar deta hai — is liye same-origin kaafi hai. Agar VITE_API_URL
 * poora URL de rakha ho to usi host par jate hain.
 */
const socketUrl = () => {
  const api = import.meta.env.VITE_API_URL;
  if (!api || api.startsWith('/')) return undefined; // same origin

  try {
    return new URL(api).origin;
  } catch {
    return undefined;
  }
};

export const NotificationProvider = ({ children }) => {
  const [items, setItems] = useState(readStored);
  const [connected, setConnected] = useState(false);

  /**
   * Aakhri event ka waqt.
   *
   * Replies page isay dekhta rehta hai -- badalte hi apni list dobara mangwa
   * leta hai. Is tarah na koi polling chahiye, na page refresh.
   */
  const [lastEventAt, setLastEventAt] = useState(null);

  // Har naye event par callback badalta rehta hai — socket ko dobara na joren
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const save = useCallback((next) => {
    setItems(next);
    writeStored(next);
  }, []);

  useEffect(() => {
    // Login ke baghair socket ka koi faida nahi
    let token = null;
    try {
      token = localStorage.getItem(TOKEN_KEY);
    } catch {
      token = null;
    }
    if (!token) return undefined;

    const socket = io(socketUrl(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('xportyn:new-replies', (payload) => {
      setLastEventAt(payload?.at || new Date().toISOString());

      const incoming = (payload?.items || []).map((item) => ({
        id: (item.contactId || '') + '|' + (item.receivedAt || payload.at),
        contactId: item.contactId,
        contactName: item.contactName,
        from: item.from,
        subject: item.subject,
        receivedAt: item.receivedAt || payload.at,
        isAutoReply: Boolean(item.isAutoReply),
        fromSpam: Boolean(item.fromSpam),
        isRead: false,
      }));

      if (incoming.length === 0) return;

      // Wohi reply dobara aaye to list me do dafa na dikhe
      const seen = new Set(itemsRef.current.map((x) => x.id));
      const fresh = incoming.filter((x) => !seen.has(x.id));
      if (fresh.length === 0) return;

      save([...fresh, ...itemsRef.current].slice(0, MAX_ITEMS));

      const first = fresh[0];
      toast.success(
        fresh.length === 1
          ? `${first.contactName} replied`
          : `${fresh.length} new replies received`,
        { icon: '📬', duration: 6000 }
      );
    });

    return () => socket.close();
  }, [save]);

  const markAllRead = useCallback(() => {
    save(itemsRef.current.map((x) => ({ ...x, isRead: true })));
  }, [save]);

  const clearAll = useCallback(() => save([]), [save]);

  const value = useMemo(
    () => ({
      items,
      connected,
      lastEventAt,
      unreadCount: items.filter((x) => !x.isRead).length,
      markAllRead,
      clearAll,
    }),
    [items, connected, lastEventAt, markAllRead, clearAll]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);

  // Provider ke baghair bhi component toote na — khali haalat de do
  return (
    ctx || {
      items: [],
      connected: false,
      lastEventAt: null,
      unreadCount: 0,
      markAllRead: () => {},
      clearAll: () => {},
    }
  );
};
