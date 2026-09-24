import { useState, useEffect } from 'react';
import {
  db,
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  signOut,
  auth,
  getDocs,
  query,
  where,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import type { Auction, Team } from '../types/auction';
import { createSampleAuction } from '../lib/sampleData';
import { AdminPreAuctionPhotoManager } from '../components/AdminPreAuctionPhotoManager';
import { useLiveViewers } from '../lib/useLiveViewers';
import {
  Plus,
  Play,
  Calendar,
  Clock,
  Users,
  Shield,
  Trash2,
  ExternalLink,
  Sparkles,
  LogOut,
  ChevronRight,
  Radio,
  FileText,
  Eye,
  Image as ImageIcon,
  ShieldCheck
} from 'lucide-react';

interface AdminDashboardProps {
  adminEmail: string;
  adminUid: string;
  onCreateAuction: () => void;
  onOpenControl: (auctionId: string) => void;
  onManageTeams: (auctionId: string, name: string) => void;
  onManagePlayers: (auctionId: string, name: string) => void;
  onViewResults: (auctionId: string) => void;
  onNavigateHome: () => void;
  onLogout?: () => void;
}

function AuctionLiveViewerTag({ auctionId }: { auctionId: string }) {
  const count = useLiveViewers(auctionId, false);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-black">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Eye className="w-3.5 h-3.5 text-emerald-400" />
      <span>{count} watching live</span>
    </span>
  );
}

export function AdminDashboard({
  adminEmail,
  adminUid,
  onCreateAuction,
  onOpenControl,
  onManageTeams,
  onManagePlayers,
  onViewResults,
  onNavigateHome,
  onLogout
}: AdminDashboardProps) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingSample, setCreatingSample] = useState(false);
  const [selectedAuctionForPhotos, setSelectedAuctionForPhotos] = useState<Auction | null>(null);
  const [teamsForPhotos, setTeamsForPhotos] = useState<Team[]>([]);
  const [auctionToDelete, setAuctionToDelete] = useState<Auction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenPhotos = async (auc: Auction) => {
    setSelectedAuctionForPhotos(auc);
    try {
      const q = query(collection(db, 'teams'), where('auctionId', '==', auc.id));
      const snap = await getDocs(q);
      const teamList: Team[] = [];
      snap.forEach((d) => teamList.push({ id: d.id, ...d.data() } as Team));
      setTeamsForPhotos(teamList);
    } catch (err) {
      console.error('Fetch teams for photo manager failed:', err);
    }
  };

  // Subscribe to auctions
  useEffect(() => {
    // Fail-safe timer so dashboard never hangs on loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    const unsub = onSnapshot(
      collection(db, 'auctions'),
      (snap) => {
        const list: Auction[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Auction));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAuctions(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Auctions live query notice:', err);
        setLoading(false);
      }
    );
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    if (onLogout) {
      onLogout();
    } else {
      onNavigateHome();
    }
  };

  // Trigger modal confirmation
  const promptDeleteAuction = (auc: Auction) => {
    setAuctionToDelete(auc);
  };

  // Execute deep deletion of auction and all associated documents
  const confirmDeleteAuction = async () => {
    if (!auctionToDelete) return;
    const auctionId = auctionToDelete.id;
    const auctionName = auctionToDelete.name;
    setIsDeleting(true);
    setFeedback(null);

    // Optimistic UI update: Remove auction immediately from local view
    setAuctions((prev) => prev.filter((a) => a.id !== auctionId));

    try {
      // 1. Delete main auction document
      await deleteDoc(doc(db, 'auctions', auctionId));

      // 2. Delete live auctionState document
      await deleteDoc(doc(db, 'auctionState', auctionId)).catch(() => {});

      // 3. Clean up associated teams
      try {
        const teamsSnap = await getDocs(
          query(collection(db, 'teams'), where('auctionId', '==', auctionId))
        );
        await Promise.allSettled(teamsSnap.docs.map((d) => deleteDoc(d.ref)));
      } catch (e) {
        console.warn('Teams cleanup notice:', e);
      }

      // 4. Clean up associated players
      try {
        const playersSnap = await getDocs(
          query(collection(db, 'players'), where('auctionId', '==', auctionId))
        );
        await Promise.allSettled(playersSnap.docs.map((d) => deleteDoc(d.ref)));
      } catch (e) {
        console.warn('Players cleanup notice:', e);
      }

      // 5. Clean up associated auctionPlayers mapping
      try {
        const apSnap = await getDocs(
          query(collection(db, 'auctionPlayers'), where('auctionId', '==', auctionId))
        );
        await Promise.allSettled(apSnap.docs.map((d) => deleteDoc(d.ref)));
      } catch (e) {
        console.warn('AuctionPlayers cleanup notice:', e);
      }

      setFeedback({
        type: 'success',
        message: `Auction "${auctionName}" was deleted successfully.`
      });
      setTimeout(() => setFeedback(null), 4000);
      setAuctionToDelete(null);
    } catch (err: any) {
      console.error('Delete auction error:', err);
      setFeedback({
        type: 'error',
        message: `Failed to delete auction: ${err?.message || 'Check connection.'}`
      });
      // Restore list if delete failed
      try {
        const snap = await getDocs(collection(db, 'auctions'));
        const list: Auction[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Auction));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAuctions(list);
      } catch {}
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLoadSample = async () => {
    setCreatingSample(true);
    try {
      const sampleId = await createSampleAuction(adminUid, adminEmail);
      onOpenControl(sampleId);
    } catch (err) {
      console.error('Sample generation failed:', err);
    } finally {
      setCreatingSample(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 selection:bg-amber-400 selection:text-black">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-bold animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                : 'bg-red-950/80 border border-red-800 text-red-300'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-zinc-950 border border-amber-500/30 text-amber-400 shadow-xl shadow-black/60 ring-1 ring-amber-400/20">
              <ShieldCheck className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </div>
            <div>
              <span className="text-xs uppercase font-black tracking-widest text-amber-400">
                Administration Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ZPL &bull; Zhep Premier League Control Desk
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Session Active &bull; Authorized Official Desk</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-xs sm:text-sm font-bold text-amber-300 transition-colors shadow-xs cursor-pointer"
            >
              Public Home
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800 text-xs sm:text-sm font-bold text-rose-400 transition-colors shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* QUICK ACTION BANNER (BLACK & METALLIC GOLD) */}
        <div className="rounded-3xl bg-zinc-950 text-white p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-amber-500/30 relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          <div className="space-y-2 max-w-2xl relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                Fast Start & Testing Desk
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Create an Auction or Load Complete Demo Roster
            </h2>
            <p className="text-sm text-zinc-300 font-medium">
              Create an empty auction to add custom teams & players, or instantly seed a complete Premier League with 4 teams and 8 players to test live bidding and projector mode immediately.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10">
            <button
              onClick={handleLoadSample}
              disabled={creatingSample}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black hover:bg-zinc-900 border border-amber-500/30 text-amber-300 font-black text-sm transition-all shadow-md disabled:opacity-50 active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{creatingSample ? 'Loading Demo...' : 'Load Sample Auction'}</span>
            </button>

            <button
              onClick={onCreateAuction}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New Auction</span>
            </button>
          </div>
        </div>

        {/* EXISTING AUCTIONS LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Existing Auctions ({auctions.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">Loading auctions...</p>
            </div>
          ) : auctions.length === 0 ? (
            <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-12 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-black border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <ShieldCheck className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-black text-white">No Auctions Created Yet</h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                Get started by creating your first cricket player auction or load the ready-to-test sample auction.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleLoadSample}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 font-bold text-sm cursor-pointer"
                >
                  Load Sample
                </button>
                <button
                  onClick={onCreateAuction}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm shadow-md cursor-pointer"
                >
                  Create New Auction
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {auctions.map((auc) => (
                <div
                  key={auc.id}
                  className="rounded-3xl bg-zinc-950 border border-zinc-800 hover:border-amber-400/40 p-5 sm:p-6 shadow-xl hover:shadow-2xl transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Auction Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs ${
                          auc.status === 'live'
                            ? 'bg-red-600 text-white animate-pulse'
                            : auc.status === 'paused'
                            ? 'bg-amber-400 text-black font-black'
                            : auc.status === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-900 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {auc.status}
                      </span>
                      {auc.round === 'unsold' && (
                        <span className="px-2.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold uppercase">
                          Unsold Round
                        </span>
                      )}
                      <AuctionLiveViewerTag auctionId={auc.id} />
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {auc.name}
                    </h3>

                    <div className="flex items-center gap-4 text-xs sm:text-sm text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        {auc.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        {auc.time}
                      </span>
                    </div>
                  </div>

                  {/* Auction Action Buttons */}
                  <div className="grid grid-cols-2 sm:flex sm:items-center sm:flex-wrap gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
                    <button
                      onClick={() => onOpenControl(auc.id)}
                      className="col-span-2 sm:col-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 active:scale-98 cursor-pointer"
                    >
                      <Radio className="w-4 h-4" />
                      <span>Live Control Desk</span>
                    </button>

                    <button
                      onClick={() => onManageTeams(auc.id, auc.name)}
                      className="min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>Teams</span>
                    </button>

                    <button
                      onClick={() => onManagePlayers(auc.id, auc.name)}
                      className="min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Players</span>
                    </button>

                    <button
                      onClick={() => handleOpenPhotos(auc)}
                      className="min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                      title="Manage Pre-Auction Photos (Last Year Champions & Team Logos)"
                    >
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>Photos ({auc.preAuctionPhotos?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => onViewResults(auc.id)}
                      className="min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-zinc-400" />
                      <span>Results</span>
                    </button>

                    <a
                      href={`?auction=${auc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 transition-colors cursor-pointer"
                      title="Open Public Viewer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="sm:hidden text-xs font-bold">Public View</span>
                    </a>

                    <button
                      onClick={() => promptDeleteAuction(auc)}
                      className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-700 hover:border-rose-700 text-rose-400 transition-colors cursor-pointer"
                      title="Delete Auction"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sm:hidden text-xs font-bold text-rose-400">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* IN-APP CONFIRMATION MODAL FOR DELETING AUCTION */}
      {auctionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Delete Auction?</h3>
                <p className="text-xs text-zinc-400">Permanently removes all auction records</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black border border-zinc-800 text-sm text-zinc-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">"{auctionToDelete.name}"</span>? All associated teams, player rosters, and live bidding state will be deleted.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAuctionToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAuction}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm transition-all shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRE-AUCTION SLIDESHOW PHOTOS MODAL */}
      {selectedAuctionForPhotos && (
        <AdminPreAuctionPhotoManager
          auction={selectedAuctionForPhotos}
          teams={teamsForPhotos}
          isOpen={Boolean(selectedAuctionForPhotos)}
          onClose={() => setSelectedAuctionForPhotos(null)}
        />
      )}
    </div>
  );
}
