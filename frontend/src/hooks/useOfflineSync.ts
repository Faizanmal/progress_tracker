'use client';

import { useState, useEffect, useCallback } from 'react';
import { SyncStatus, OfflineQueueItem } from '@/types';

interface UseOfflineSyncReturn {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingChanges: number;
  isServiceWorkerReady: boolean;
  syncNow: () => Promise<void>;
  addToQueue: (item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries' | 'status'>) => void;
  subscribeToPush: () => Promise<PushSubscription | null>;
  unsubscribeFromPush: () => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    is_online: true,
    last_sync: new Date().toISOString(),
    pending_changes: 0,
    is_syncing: false,
    conflicts: [],
  });

  // Get queue status from service worker
  const getQueueStatus = useCallback(async () => {
    if (!navigator.serviceWorker.controller) return 0;

    const messageChannel = new MessageChannel();
    
    return new Promise<number>((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        const pending = event.data?.pending || 0;
        setSyncStatus(prev => ({ ...prev, pending_changes: pending }));
        resolve(pending);
      };

      navigator.serviceWorker.controller!.postMessage(
        { type: 'GET_QUEUE_STATUS' },
        [messageChannel.port2]
      );
    });
  }, []);

  // Trigger sync
  const syncNow = useCallback(async () => {
    if (!navigator.serviceWorker.controller || !isOnline) return;

    setSyncStatus(prev => ({ ...prev, is_syncing: true }));

    try {
      // Try background sync first
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-offline-queue');
      } else {
        // Fallback to message-based sync
        navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
      }

      await getQueueStatus();
      setSyncStatus(prev => ({
        ...prev,
        is_syncing: false,
        last_sync: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({ ...prev, is_syncing: false }));
    }
  }, [isOnline, getQueueStatus]);

  // Add item to offline queue
  const addToQueue = useCallback((item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries' | 'status'>) => {
    // Store in IndexedDB via service worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ADD_TO_QUEUE',
        payload: item,
      });
      getQueueStatus();
    }
  }, [getQueueStatus]);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus(prev => ({ ...prev, is_online: true }));
      // Trigger sync when coming back online
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus(prev => ({ ...prev, is_online: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow]);

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('New version available');
              }
            });
          }
        });

        setIsServiceWorkerReady(true);
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    registerServiceWorker();

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        getQueueStatus();
      }
    });
  }, [getQueueStatus]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    if (!('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from server (you'd fetch this from your backend)
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn('VAPID public key not configured');
        return null;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // Send subscription to backend
      await fetch('/api/notifications/push-subscription/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh_key: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth_key: arrayBufferToBase64(subscription.getKey('auth')),
        }),
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify backend
        await fetch('/api/notifications/push-subscription/', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
    }
  }, []);

  return {
    isOnline,
    syncStatus,
    pendingChanges: syncStatus.pending_changes,
    isServiceWorkerReady,
    syncNow,
    addToQueue,
    subscribeToPush,
    unsubscribeFromPush,
  };
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
