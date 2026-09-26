import { useState, useEffect } from 'react';
import { db, doc, collection, setDoc, deleteDoc, onSnapshot } from './firebase';
import { safeStorage } from './storage';

/**
 * Tracks real-time active viewers for an auction with high performance and zero lag.
 *
 * @param auctionId The ID of the auction.
 * @param isViewer Whether the current client is a public viewer (if true, transmits heartbeats).
 * @returns The current number of active live viewers.
 */
export function useLiveViewers(auctionId: string | undefined | null, isViewer: boolean = false) {
  const [liveViewerCount, setLiveViewerCount] = useState<number>(1);

  // 1. Viewer Heartbeat transmission (for public viewers)
  useEffect(() => {
    if (!auctionId || !isViewer) return;

    let viewerId = safeStorage.getItem('zhep_viewer_session_id');
    if (!viewerId) {
      viewerId = 'viewer_' + Math.random().toString(36).substring(2, 11);
      safeStorage.setItem('zhep_viewer_session_id', viewerId);
    }

    const viewerDocRef = doc(db, 'auctions', auctionId, 'viewers', viewerId);

    // Initial heartbeat
    const sendHeartbeat = () => {
      if (document.visibilityState === 'hidden') return;
      setDoc(viewerDocRef, { lastActive: Date.now() }, { merge: true }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 25000); // 25s heartbeat to prevent write saturation

    const handleBeforeUnload = () => {
      deleteDoc(viewerDocRef).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      deleteDoc(viewerDocRef).catch(() => {});
    };
  }, [auctionId, isViewer]);

  // 2. Real-time subscription to viewers collection
  useEffect(() => {
    if (!auctionId) return;

    const viewersColRef = collection(db, 'auctions', auctionId, 'viewers');

    const unsubscribe = onSnapshot(
      viewersColRef,
      (snapshot) => {
        const threshold = Date.now() - 60000; // Active within last 60 seconds
        let activeCount = 0;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.lastActive === 'number' && data.lastActive > threshold) {
            activeCount++;
          }
        });

        // Ensure if this client is a viewer, active count is at least 1
        if (isViewer && activeCount === 0) {
          activeCount = 1;
        }

        // Only trigger state update if count actually changed to prevent render cascade
        setLiveViewerCount((prev) => (prev === activeCount ? prev : activeCount));
      },
      (error) => {
        console.warn('Viewers subscription note:', error);
      }
    );

    return () => unsubscribe();
  }, [auctionId, isViewer]);

  return liveViewerCount;
}
