import { useState, useEffect } from 'react';
import { db, doc, collection, setDoc, deleteDoc, onSnapshot } from './firebase';

/**
 * Tracks real-time active viewers for an auction.
 *
 * @param auctionId The ID of the auction.
 * @param isViewer Whether the current client is a public viewer (if true, transmits heartbeats).
 * @returns The current number of active live viewers.
 */
export function useLiveViewers(auctionId: string | undefined | null, isViewer: boolean = false) {
  const [liveViewerCount, setLiveViewerCount] = useState<number>(0);

  // 1. Viewer Heartbeat transmission (for public viewers)
  useEffect(() => {
    if (!auctionId || !isViewer) return;

    let viewerId = sessionStorage.getItem('zhep_viewer_session_id');
    if (!viewerId) {
      viewerId = 'viewer_' + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem('zhep_viewer_session_id', viewerId);
    }

    const viewerDocRef = doc(db, 'auctions', auctionId, 'viewers', viewerId);

    // Initial heartbeat
    const sendHeartbeat = () => {
      setDoc(viewerDocRef, { lastActive: Date.now() }, { merge: true }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000); // Heartbeat every 10 seconds

    const handleBeforeUnload = () => {
      deleteDoc(viewerDocRef).catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
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
        const threshold = Date.now() - 30000; // Active within last 30 seconds
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

        setLiveViewerCount(activeCount);
      },
      (error) => {
        console.warn('Viewers subscription note:', error);
      }
    );

    return () => unsubscribe();
  }, [auctionId, isViewer]);

  return liveViewerCount;
}
