import { useEffect, useState, useSyncExternalStore } from 'react';
import { getQueueLength, subscribeQueueLength, startOfflineQueue } from './offlineQueue';

export function useOfflineQueueStatus(): { pending: number; online: boolean } {
  const pending = useSyncExternalStore(subscribeQueueLength, getQueueLength, getQueueLength);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    startOfflineQueue();
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return { pending, online };
}
