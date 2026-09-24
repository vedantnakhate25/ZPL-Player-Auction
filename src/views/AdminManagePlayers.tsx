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
import type { Player, PlayerRole } from '../types/auction';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Target,
  Zap,
  Award,
  Upload,
  Check,
  X,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';

interface AdminManagePlayersProps {
  auctionId: string;
  auctionName: string;
  onBack: () => void;
}

const ROLES: PlayerRole[] = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];

const PRESET_PLAYER_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80'
];

export function AdminManagePlayers({
  auctionId,
  auctionName,
  onBack
}: AdminManagePlayersProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form states
  const [slotNumber, setSlotNumber] = useState<number | ''>(1);
  const [slotName, setSlotName] = useState<string>('Marquee Players');
  const [name, setName] = useState('');
  const [role, setRole] = useState<PlayerRole>('Batsman');
  const [photoUrl, setPhotoUrl] = useState(PRESET_PLAYER_PHOTOS[0]);
  const [basePoints, setBasePoints] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageCompressing, setImageCompressing] = useState(false);

  // Filter role & slot
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [slotFilter, setSlotFilter] = useState<string>('all');

  // Real-time players query with fail-safe timeout
  useEffect(() => {
    if (!auctionId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Fail-safe timer: guaranteed to exit full-screen loading within 1s
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    const q = query(collection(db, 'players'), where('auctionId', '==', auctionId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        clearTimeout(safetyTimer);
        const list: Player[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Player));
        list.sort((a, b) => a.order - b.order);
        setPlayers(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Players live query notice:', err);
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    );

    return () => {
      unsub();
      clearTimeout(safetyTimer);
    };
  }, [auctionId]);

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    const highestSlot = players.reduce((max, p) => Math.max(max, p.slotNumber || 1), 1);
    const matchingSlotPlayers = players.filter((p) => (p.slotNumber || 1) === highestSlot);
    setSlotNumber(highestSlot);
    const existingSlotName =
      matchingSlotPlayers.find((p) => p.slotName)?.slotName ||
      (highestSlot === 1 ? 'Marquee Players' : `Slot ${highestSlot}`);
    setSlotName(existingSlotName);

    setName('');
    setRole('Batsman');
    setPhotoUrl(
      PRESET_PLAYER_PHOTOS[
        Math.floor(Math.random() * PRESET_PLAYER_PHOTOS.length)
      ]
    );
    setBasePoints(50);
    setError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setSlotNumber(player.slotNumber || 1);
    setSlotName(player.slotName || 'Marquee Players');
    setName(player.name);
    setRole(player.role);
    setPhotoUrl(player.photoUrl);
    setBasePoints(player.basePoints);
    setError(null);
    setShowAddModal(true);
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageCompressing(true);
    setError(null);
    try {
      const compressed = await Promise.race([
        compressImage(file, 320, 0.82),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Image compression timed out')), 3000)
        )
      ]);
      setPhotoUrl(compressed);
    } catch (err) {
      console.warn('Fallback to standard read:', err);
      // Fallback: fast data URL
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setImageCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Player name is required.');
      return;
    }
    if (basePoints <= 0) {
      setError('Base points must be greater than 0.');
      return;
    }

    const now = new Date().toISOString();
    const cleanName = name.trim();
    const finalPhoto = photoUrl || PRESET_PLAYER_PHOTOS[0];
    const pointsNum = Number(basePoints);
    const cleanSlotNum = slotNumber ? Number(slotNumber) : 1;
    const cleanSlotName = slotName.trim() || `Slot ${cleanSlotNum}`;

    if (editingPlayer) {
      const updatedPlayer: Player = {
        ...editingPlayer,
        name: cleanName,
        role,
        photoUrl: finalPhoto,
        basePoints: pointsNum,
        slotNumber: cleanSlotNum,
        slotName: cleanSlotName,
        updatedAt: now
      };

      // Optimistic instant update - no loading wait!
      setPlayers((prev) =>
        prev.map((p) => (p.id === editingPlayer.id ? updatedPlayer : p))
      );
      setShowAddModal(false);

      // Save in background
      updateDoc(doc(db, 'players', editingPlayer.id), {
        name: cleanName,
        role,
        photoUrl: finalPhoto,
        basePoints: pointsNum,
        slotNumber: cleanSlotNum,
        slotName: cleanSlotName,
        updatedAt: now
      }).catch((err) => {
        console.error('Background player update failed:', err);
      });
    } else {
      const playerId = `player-${Date.now()}`;
      const newPlayer: Player = {
        id: playerId,
        auctionId,
        name: cleanName,
        role,
        photoUrl: finalPhoto,
        basePoints: pointsNum,
        slotNumber: cleanSlotNum,
        slotName: cleanSlotName,
        status: 'upcoming',
        order: players.length + 1,
        round: 'regular',
        createdAt: now
      };

      // Optimistic instant update - no waiting or spinner!
      setPlayers((prev) => {
        const list = [...prev.filter((p) => p.id !== playerId), newPlayer];
        list.sort((a, b) => a.order - b.order);
        return list;
      });
      setShowAddModal(false);

      // Save in background
      setDoc(doc(db, 'players', playerId), newPlayer).catch((err) => {
        console.error('Background player registration failed:', err);
      });
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    try {
      await deleteDoc(doc(db, 'players', playerId));
    } catch (err) {
      console.error('Delete player failed:', err);
    }
  };

  const availableSlots = Array.from(
    new Set(players.map((p) => p.slotNumber || 1))
  ).sort((a, b) => a - b);

  const filteredPlayers = players.filter((p) => {
    const matchRole = roleFilter === 'all' || p.role === roleFilter;
    const matchSlot = slotFilter === 'all' || String(p.slotNumber || 1) === slotFilter;
    return matchRole && matchSlot;
  });

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
              <span className="text-xs uppercase font-black tracking-wider text-amber-400">
                {auctionName}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Manage Auction Players ({players.length})
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* SLOT FILTER */}
            {availableSlots.length > 1 && (
              <select
                value={slotFilter}
                onChange={(e) => setSlotFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                <option value="all">All Slots ({availableSlots.length})</option>
                {availableSlots.map((s) => {
                  const samplePlayer = players.find((p) => (p.slotNumber || 1) === s);
                  return (
                    <option key={s} value={String(s)} className="bg-zinc-900 text-white">
                      Slot {s}{samplePlayer?.slotName ? `: ${samplePlayer.slotName}` : ''}
                    </option>
                  );
                })}
              </select>
            )}

            {/* ROLE FILTER */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="all">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-zinc-900 text-white">
                  {r}
                </option>
              ))}
            </select>

            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Player</span>
            </button>
          </div>
        </div>

        {/* PLAYERS LIST */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-400 text-sm font-semibold">Loading players...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-12 text-center space-y-4">
            <Users className="w-16 h-16 text-zinc-600 mx-auto" />
            <h3 className="text-xl font-black text-white">No Players Found</h3>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              Add players to this auction. Remember that base points are decided explicitly by the admin!
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm inline-flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add First Player</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredPlayers.map((p) => (
              <div
                key={p.id}
                className="rounded-3xl bg-zinc-950 border border-zinc-800 p-4 shadow-xl hover:border-amber-400/40 transition-all flex flex-col justify-between space-y-3 relative overflow-hidden"
              >
                {/* Photo & Role */}
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border border-zinc-800">
                  <img
                    src={p.photoUrl}
                    alt={p.name}
                    className="w-full h-full object-cover object-top"
                  />
                  
                  {/* Slot Tag on top left */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-amber-400/90 text-black text-[10px] font-black uppercase tracking-wider shadow-sm backdrop-blur-xs">
                    Slot {p.slotNumber || 1}
                  </div>

                  <div className="absolute top-2 right-2 px-2.5 py-1 rounded-xl bg-black/90 backdrop-blur-md text-[11px] font-black tracking-wide text-amber-300 border border-zinc-700">
                    {p.role}
                  </div>

                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-xl bg-black/90 backdrop-blur-md text-[11px] font-black uppercase tracking-wider">
                    <span
                      className={
                        p.status === 'sold'
                          ? 'text-emerald-400 font-black'
                          : p.status === 'unsold'
                          ? 'text-rose-400 font-black'
                          : 'text-amber-400 font-black'
                      }
                    >
                      {p.status}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-white text-base truncate">
                      {p.name}
                    </h3>
                  </div>
                  {p.slotName && (
                    <p className="text-[11px] font-semibold text-amber-400/80 truncate">
                      {p.slotName}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>
                      Base:{' '}
                      <strong className="text-amber-400 font-black">
                        {p.basePoints} PTS
                      </strong>
                    </span>
                    {p.status === 'sold' && (
                      <span className="text-emerald-400 font-black">
                        Sold: {p.soldPoints} PTS
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white transition-colors cursor-pointer"
                    title="Edit Player"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePlayer(p.id)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-700 hover:border-rose-700 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                    title="Delete Player"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADD / EDIT MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-xl font-black text-white">
                  {editingPlayer ? 'Edit Player' : 'Add New Player'}
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
                {/* 1. FIRST OPTION: AUCTION SLOT & SLOT NAME */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center">
                        1
                      </span>
                      <label className="text-xs font-black uppercase tracking-wider text-amber-300">
                        Auction Slot &amp; Set Allocation
                      </label>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider">
                      Required First
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                        Slot Number:
                      </label>
                      <input
                        type="number"
                        value={slotNumber}
                        onChange={(e) => setSlotNumber(e.target.value ? Number(e.target.value) : '')}
                        min={1}
                        placeholder="e.g. 1"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm font-black text-center"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                        Slot Name / Category:
                      </label>
                      <input
                        type="text"
                        value={slotName}
                        onChange={(e) => setSlotName(e.target.value)}
                        placeholder="e.g. Marquee Players, Set 1 - Batsmen"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm font-bold"
                      />
                    </div>
                  </div>

                  {/* Popular Slot Presets */}
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Quick Slot Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: 'Marquee Players', slot: 1 },
                        { name: 'Set 1 - Batsmen', slot: 2 },
                        { name: 'Set 2 - All-Rounders', slot: 3 },
                        { name: 'Set 3 - Fast Bowlers', slot: 4 },
                        { name: 'Set 4 - Spinners', slot: 5 },
                        { name: 'Set 5 - Wicket-Keepers', slot: 6 },
                        { name: 'Emerging Talent', slot: 7 }
                      ].map((preset) => (
                        <button
                          type="button"
                          key={preset.name}
                          onClick={() => {
                            setSlotName(preset.name);
                            setSlotNumber(preset.slot);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                            slotName === preset.name
                              ? 'bg-amber-400 text-black border-amber-400 shadow-xs'
                              : 'bg-zinc-900 text-zinc-300 hover:text-white border-zinc-700 hover:border-zinc-500'
                          }`}
                        >
                          {preset.name} (Slot {preset.slot})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. PLAYER NAME */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Player Name:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rohit Sharma"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-black border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                      Player Role:
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as PlayerRole)}
                      className="w-full px-3 py-2.5 rounded-2xl bg-black border border-zinc-800 text-white text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="bg-zinc-900 text-white">
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                      Base Points:
                    </label>
                    <input
                      type="number"
                      value={basePoints}
                      onChange={(e) => setBasePoints(Number(e.target.value))}
                      min={10}
                      step={5}
                      required
                      className="w-full px-4 py-2.5 rounded-2xl bg-black border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm font-black"
                    />
                  </div>
                </div>

                {/* PHOTO SELECTION / UPLOAD */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Player Photo:
                  </label>

                  <div className="flex items-center gap-4">
                    <img
                      src={photoUrl}
                      alt="Player Preview"
                      className="w-20 h-20 rounded-2xl object-cover object-top border-2 border-amber-400 shadow-md bg-black shrink-0"
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
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="Or paste image URL"
                        className="w-full px-3 py-1.5 rounded-xl bg-black border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  {/* PRESET PLAYERS */}
                  <div className="pt-2">
                    <span className="text-[10px] text-zinc-400 font-bold block mb-1.5">
                      Or select from presets:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {PRESET_PLAYER_PHOTOS.map((pUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPhotoUrl(pUrl)}
                          className={`rounded-xl p-0.5 border-2 shrink-0 transition-transform cursor-pointer ${
                            photoUrl === pUrl
                              ? 'border-amber-400 scale-110'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={pUrl}
                            alt={`Preset ${idx}`}
                            className="w-9 h-9 rounded-lg object-cover object-top"
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
                    <span>
                      {editingPlayer ? 'Save Changes' : 'Register Player'}
                    </span>
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
