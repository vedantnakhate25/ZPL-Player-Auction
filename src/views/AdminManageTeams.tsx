import { useState, useEffect } from 'react';
import {
  db,
  doc,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc
} from '../lib/firebase';
import { compressImage } from '../lib/imageUtils';
import type { Team } from '../types/auction';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Coins,
  Shield,
  Upload,
  Check,
  X,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';

interface AdminManageTeamsProps {
  auctionId: string;
  auctionName: string;
  onBack: () => void;
}

const PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&auto=format&fit=crop&q=80'
];

export function AdminManageTeams({ auctionId, auctionName, onBack }: AdminManageTeamsProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState(PRESET_LOGOS[0]);
  const [purse, setPurse] = useState<number>(1000);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageCompressing, setImageCompressing] = useState(false);

  // Real-time subscription to teams
  // Real-time query with fail-safe timeout so loading never hangs
  useEffect(() => {
    if (!auctionId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    const q = query(collection(db, 'teams'), where('auctionId', '==', auctionId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        clearTimeout(safetyTimer);
        const list: Team[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Team));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setTeams(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Teams live query notice:', err);
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    );

    return () => {
      unsub();
      clearTimeout(safetyTimer);
    };
  }, [auctionId]);

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingTeam(null);
    setName('');
    setLogoUrl(PRESET_LOGOS[Math.floor(Math.random() * PRESET_LOGOS.length)]);
    setPurse(1000);
    setError(null);
    setShowAddModal(true);
  };

  // Open modal for edit
  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setName(team.name);
    setLogoUrl(team.logoUrl);
    setPurse(team.purse);
    setError(null);
    setShowAddModal(true);
  };

  // Handle image upload with auto-compression to avoid Firestore size limits
  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageCompressing(true);
    setError(null);
    try {
      const compressed = await Promise.race([
        compressImage(file, 240, 0.82),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Logo compression timed out')), 3000)
        )
      ]);
      setLogoUrl(compressed);
    } catch (err) {
      console.warn('Fallback to standard read:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setLogoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setImageCompressing(false);
    }
  };

  // Save team with instant local state update and background Firestore sync
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Team name is required.');
      return;
    }
    if (purse <= 0) {
      setError('Points purse must be greater than 0.');
      return;
    }

    const now = new Date().toISOString();
    const cleanName = name.trim();
    const finalLogo = logoUrl || PRESET_LOGOS[0];
    const purseNum = Number(purse);

    if (editingTeam) {
      // Edit existing team
      const diff = purseNum - editingTeam.purse;
      const newRemaining = Math.max(0, editingTeam.remainingPurse + diff);
      const updatedTeam: Team = {
        ...editingTeam,
        name: cleanName,
        logoUrl: finalLogo,
        purse: purseNum,
        remainingPurse: newRemaining,
        updatedAt: now
      };

      // Optimistic instant update - modal closes immediately!
      setTeams((prev) =>
        prev.map((t) => (t.id === editingTeam.id ? updatedTeam : t))
      );
      setShowAddModal(false);

      // Background write
      updateDoc(doc(db, 'teams', editingTeam.id), {
        name: cleanName,
        logoUrl: finalLogo,
        purse: purseNum,
        remainingPurse: newRemaining,
        updatedAt: now
      }).catch((err) => {
        console.error('Background team update failed:', err);
      });
    } else {
      // Create new team
      const teamId = `team-${Date.now()}`;
      const newTeam: Team = {
        id: teamId,
        auctionId,
        name: cleanName,
        logoUrl: finalLogo,
        purse: purseNum,
        remainingPurse: purseNum,
        totalSpent: 0,
        purchasedPlayerCount: 0,
        createdAt: now
      };

      // Optimistic instant update - no spinner or waiting!
      setTeams((prev) => {
        const list = [...prev.filter((t) => t.id !== teamId), newTeam];
        list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
      });
      setShowAddModal(false);

      // Background write
      setDoc(doc(db, 'teams', teamId), newTeam).catch((err) => {
        console.error('Background team registration failed:', err);
      });
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    try {
      await deleteDoc(doc(db, 'teams', teamId));
    } catch (err) {
      console.error('Delete team failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 selection:bg-amber-400 selection:text-black">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-zinc-950 border border-amber-500/30 hover:bg-zinc-900 text-amber-400 hover:text-amber-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs uppercase font-black tracking-widest text-amber-400">
                {auctionName}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Manage Auction Teams ({teams.length})
              </h1>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Team</span>
          </button>
        </div>

        {/* TEAMS LIST */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-400 text-sm font-semibold">Loading teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-12 text-center space-y-4 shadow-xl">
            <Shield className="w-16 h-16 text-amber-400/60 mx-auto" />
            <h3 className="text-xl font-black text-white">No Teams Registered Yet</h3>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              Add teams that will participate in this auction. You can assign starting purse points and custom logos.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm inline-flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add First Team</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map((t) => (
              <div
                key={t.id}
                className="rounded-3xl bg-zinc-950 border border-zinc-800 hover:border-amber-400/40 p-5 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={t.logoUrl}
                      alt={t.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-md bg-black"
                    />
                    <div>
                      <h3 className="font-black text-white text-lg">{t.name}</h3>
                      <p className="text-xs text-zinc-400">
                        Squad: <strong className="text-amber-400 font-bold">{t.purchasedPlayerCount || 0}</strong> players
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white transition-colors cursor-pointer"
                      title="Edit Team"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(t.id)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-700 hover:border-rose-700 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                      title="Delete Team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* PURSE METRICS */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800">
                  <div className="p-3 rounded-2xl bg-black border border-zinc-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Total Purse
                    </span>
                    <span className="text-lg font-black text-amber-400">
                      {t.purse} <span className="text-xs font-semibold text-zinc-400">PTS</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-black border border-zinc-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Remaining
                    </span>
                    <span
                      className={`text-lg font-black ${
                        t.remainingPurse < 150 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {t.remainingPurse} <span className="text-xs font-semibold text-zinc-400">PTS</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADD / EDIT MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-xl font-black text-white">
                  {editingTeam ? 'Edit Team Details' : 'Add New Team'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Team Name:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mumbai Warriors"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-black border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Points Purse:
                  </label>
                  <input
                    type="number"
                    value={purse}
                    onChange={(e) => setPurse(Number(e.target.value))}
                    min={10}
                    step={10}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-black border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm font-black"
                  />
                </div>

                {/* TEAM LOGO SELECTION / UPLOAD */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Team Logo:
                  </label>

                  <div className="flex items-center gap-4">
                    <img
                      src={logoUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-md bg-black shrink-0"
                    />

                    <div className="flex-1 space-y-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white transition-colors border border-zinc-700">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Choose from Gallery (JPG / PNG)</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp, image/*"
                          onChange={handleImageFile}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="Or paste image URL"
                        className="w-full px-3 py-1.5 rounded-xl bg-black border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  {/* PRESET LOGOS */}
                  <div className="pt-2">
                    <span className="text-[10px] text-zinc-400 font-bold block mb-1.5">
                      Or pick a cricket team badge preset:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {PRESET_LOGOS.map((pUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLogoUrl(pUrl)}
                          className={`rounded-full p-0.5 border-2 shrink-0 transition-transform cursor-pointer ${
                            logoUrl === pUrl
                              ? 'border-amber-400 scale-110'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={pUrl}
                            alt={`Preset ${idx}`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-98"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{editingTeam ? 'Save Changes' : 'Create Team'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
