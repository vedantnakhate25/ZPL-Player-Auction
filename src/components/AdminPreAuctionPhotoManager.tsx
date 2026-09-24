import { useState, useEffect } from 'react';
import type { Auction, Team, PreAuctionPhoto } from '../types/auction';
import { db, doc, updateDoc, handleFirestoreError, OperationType } from '../lib/firebase';
import { compressImage } from '../lib/imageUtils';
import {
  Shield,
  Sparkles,
  Plus,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Images,
  Link as LinkIcon,
  Check,
  Trophy
} from 'lucide-react';

interface AdminPreAuctionPhotoManagerProps {
  auction: Auction;
  teams: Team[];
  isOpen: boolean;
  onClose: () => void;
}

const CHAMPION_PRESETS = [
  {
    title: '2025 Defending Champions 🏆',
    url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
    caption: 'Reigning Champions of Zhep Krida Mandal'
  },
  {
    title: 'Grand Championship Trophy 🏆',
    url: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=800&auto=format&fit=crop&q=80',
    caption: 'The Ultimate Prize for 2027 Season'
  },
  {
    title: 'Champions Podium Celebration 🎉',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    caption: 'Victory Moment of Last Season'
  }
];

export function AdminPreAuctionPhotoManager({
  auction,
  teams,
  isOpen,
  onClose
}: AdminPreAuctionPhotoManagerProps) {
  const [photos, setPhotos] = useState<PreAuctionPhoto[]>(
    auction.preAuctionPhotos || []
  );
  const [category, setCategory] = useState<'champion' | 'team_logo' | 'custom'>('champion');
  const [photoSourceMode, setPhotoSourceMode] = useState<'gallery' | 'url'>('gallery');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'JPG' | 'PNG' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Keep state synchronized with parent auction doc
  useEffect(() => {
    setPhotos(auction.preAuctionPhotos || []);
  }, [auction.id, auction.preAuctionPhotos]);

  if (!isOpen) return null;

  // Process image from gallery (JPG or PNG)
  const processGalleryFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please select an image file (JPG or PNG).' });
      return;
    }

    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    const formatLabel = isPng ? 'PNG' : 'JPG';
    setSelectedFormat(formatLabel);
    setSelectedFileName(file.name);

    // Suggest a default title from filename if title is blank
    if (!title.trim()) {
      const baseName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();
      if (baseName.length > 2 && baseName.length < 40) {
        setTitle(baseName);
      }
    }

    setIsCompressing(true);
    setFeedback(null);
    try {
      // Compress to 640px max dimension and 0.78 quality - handles both JPG and PNG
      const compressed = await compressImage(file, 640, 0.78);
      setImageUrl(compressed);
      setFeedback({
        type: 'success',
        message: `Gallery ${formatLabel} photo loaded & optimized!`
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      console.warn('Image compression fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle local image file upload from input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processGalleryFile(file);
    // Reset input to allow selecting the same file again if desired
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processGalleryFile(file);
    }
  };

  // Save changes to Firestore
  const savePhotosToFirestore = async (newPhotos: PreAuctionPhoto[]) => {
    setIsSaving(true);
    setFeedback(null);
    try {
      // Ensure absolutely NO undefined values are passed to Firestore
      const sanitizedPhotos = newPhotos.map((p) => {
        const clean: PreAuctionPhoto = {
          id: p.id || `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: (p.title || '').trim() || 'Showcase Photo',
          category: p.category || 'custom',
          url: (p.url || '').trim()
        };
        const trimmedCaption = (p.caption || '').trim();
        if (trimmedCaption) {
          clean.caption = trimmedCaption;
        }
        return clean;
      });

      await updateDoc(doc(db, 'auctions', auction.id), {
        preAuctionPhotos: sanitizedPhotos,
        updatedAt: new Date().toISOString()
      });
      setPhotos(sanitizedPhotos);
      setFeedback({ type: 'success', message: 'Saved successfully! Viewers will see the updated slideshow.' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Save slideshow photos error:', err);
      let errorMsg = 'Failed to save.';
      if (err?.message?.includes('exceeds maximum allowed size')) {
        errorMsg = 'Image payload exceeds Firestore size limit. Please use a smaller photo or direct link.';
      } else if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        errorMsg = 'Permission denied. Please ensure your admin session is active.';
      } else if (err?.message) {
        errorMsg = `Failed to save: ${err.message}`;
      } else {
        errorMsg = 'Failed to save. Check your connection.';
      }
      setFeedback({ type: 'error', message: errorMsg });
      try {
        handleFirestoreError(err, OperationType.UPDATE, `auctions/${auction.id}`);
      } catch {
        // Logged via handleFirestoreError
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Add new photo
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please choose a JPG/PNG photo from your gallery or paste an image link.'
      });
      return;
    }

    const trimmedCaption = caption.trim();
    const newPhoto: PreAuctionPhoto = {
      id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: title.trim() || (category === 'champion' ? 'Last Year Champions 🏆' : category === 'team_logo' ? 'Team Logo 🛡️' : 'Showcase Banner'),
      category,
      url: imageUrl.trim()
    };
    if (trimmedCaption) {
      newPhoto.caption = trimmedCaption;
    }

    const updated = [...photos, newPhoto];
    await savePhotosToFirestore(updated);

    // Reset inputs
    setTitle('');
    setCaption('');
    setImageUrl('');
    setSelectedFileName(null);
    setSelectedFormat(null);
  };

  // Delete photo
  const handleDeletePhoto = async (photoId: string) => {
    const updated = photos.filter((p) => p.id !== photoId);
    await savePhotosToFirestore(updated);
  };

  // Move photo up/down
  const handleMovePhoto = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const reordered = [...photos];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    await savePhotosToFirestore(reordered);
  };

  // 1-Click Import all registered this-year teams logos
  const handleImportTeamLogos = async () => {
    if (teams.length === 0) {
      setFeedback({ type: 'error', message: 'No teams registered yet. Register teams first in Manage Teams.' });
      return;
    }

    const existingIds = new Set(photos.map((p) => p.id));
    const teamPhotos: PreAuctionPhoto[] = teams
      .filter((t) => !existingIds.has(`team-logo-${t.id}`))
      .map((t) => ({
        id: `team-logo-${t.id}`,
        title: t.name,
        category: 'team_logo',
        url: t.logoUrl,
        caption: `This Year Contender • Starting Purse: ${t.purse} PTS`
      }));

    if (teamPhotos.length === 0) {
      setFeedback({ type: 'success', message: 'All team logos are already added to the slideshow.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const updated = [...photos, ...teamPhotos];
    await savePhotosToFirestore(updated);
  };

  // 1-Click Add Champion Preset
  const handleAddDefaultChampion = async (preset = CHAMPION_PRESETS[0]) => {
    const championPhoto: PreAuctionPhoto = {
      id: 'champion-' + Date.now(),
      title: preset.title,
      category: 'champion',
      url: preset.url,
      caption: preset.caption
    };
    const updated = [championPhoto, ...photos];
    await savePhotosToFirestore(updated);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-black via-zinc-950 to-black border-b border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-black border border-amber-500/30 shadow-md text-amber-400">
              <Trophy className="w-7 h-7 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider">
                <Clock className="w-3 h-3" />
                <span>5-6 Sec Rotation</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Pre-Auction Slideshow Photos
              </h3>
              <p className="text-xs text-zinc-400 font-medium">
                Visible to viewers continuously until the live auction starts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`px-5 py-3 border-b text-xs font-bold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/80 border-rose-800 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* QUICK PRESETS ROW */}
          <div className="p-4 rounded-2xl bg-black border border-zinc-800 shadow-sm space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Fast 1-Click Presets</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleImportTeamLogos}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Import This Year Team Logos ({teams.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddDefaultChampion(CHAMPION_PRESETS[0])}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>+ 2025 Champions Trophy</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddDefaultChampion(CHAMPION_PRESETS[1])}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>+ Grand Trophy Prize</span>
              </button>
            </div>
          </div>

          {/* ADD PHOTO FORM */}
          <form
            onSubmit={handleAddPhoto}
            className="p-5 rounded-2xl bg-black border border-zinc-800 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Showcase Photo (JPG or PNG)</span>
              </h4>
              <span className="text-[11px] text-zinc-400 font-semibold">
                Admin Exclusive
              </span>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 block">
                Photo Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('champion')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] cursor-pointer ${
                    category === 'champion'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Champions Trophy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('team_logo')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] cursor-pointer ${
                    category === 'team_logo'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Team Logo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('custom')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] cursor-pointer ${
                    category === 'custom'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Custom Banner</span>
                </button>
              </div>
            </div>

            {/* PHOTO SOURCE TABS: GALLERY (JPG/PNG) vs WEB URL */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Select Photo Source
                </label>
                <div className="flex rounded-xl bg-zinc-950 p-0.5 border border-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setPhotoSourceMode('gallery')}
                    className={`min-h-[38px] px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      photoSourceMode === 'gallery'
                        ? 'bg-zinc-900 text-amber-400 border border-amber-500/30 shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Images className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Gallery (Upload)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoSourceMode('url')}
                    className={`min-h-[38px] px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      photoSourceMode === 'url'
                        ? 'bg-zinc-900 text-amber-400 border border-amber-500/30 shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Web URL</span>
                  </button>
                </div>
              </div>

              {/* GALLERY DROPZONE (JPG / PNG) */}
              {photoSourceMode === 'gallery' ? (
                <div className="space-y-2">
                  <input
                    id="slideshow-gallery-input"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/*"
                    disabled={isCompressing}
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('slideshow-gallery-input')?.click()}
                    className={`p-6 sm:p-7 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                        : 'border-zinc-700 hover:border-amber-400/60 bg-zinc-950/80 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-2.5 text-amber-400">
                      {isCompressing ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Images className="w-6 h-6" />
                      )}
                    </div>
                    <h5 className="text-sm font-black text-white">
                      {isCompressing
                        ? 'Optimizing Photo from Gallery...'
                        : 'Click to Choose from Gallery or Drag & Drop'}
                    </h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      Select any photo of last year champions or team logos
                    </p>

                    {/* FORMAT BADGES (JPG & PNG) */}
                    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full bg-black border border-zinc-800 text-[11px] font-black text-zinc-300 shadow-xs flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>JPG / JPEG</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-black border border-zinc-800 text-[11px] font-black text-zinc-300 shadow-xs flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>PNG (Transparent or Solid)</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-black border border-zinc-800 text-[11px] font-bold text-zinc-400 shadow-xs">
                        WebP
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* WEB URL INPUT */
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setSelectedFileName(null);
                        setSelectedFormat(null);
                      }}
                      placeholder="https://example.com/photo.jpg or .png"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white text-xs focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 block">
                    Paste any public link ending in .jpg, .jpeg, or .png
                  </span>
                </div>
              )}

              {/* Compression loading indicator */}
              {isCompressing && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                  <span>Optimizing photo size for smooth live broadcasting...</span>
                </div>
              )}

              {/* Sample Quick Image Links for Champions */}
              {category === 'champion' && !imageUrl && (
                <div className="pt-1">
                  <span className="text-[11px] text-zinc-400 font-bold block mb-1">
                    Or select a championship template:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CHAMPION_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImageUrl(preset.url);
                          setSelectedFormat('JPG');
                          setSelectedFileName('Trophy Template');
                          if (!title) setTitle(preset.title);
                          if (!caption) setCaption(preset.caption);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-zinc-700 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Thumbnail Preview & Details */}
              {imageUrl && !isCompressing && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-contain bg-black border border-amber-500/30 shadow-sm shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Photo Ready for Slideshow</span>
                      </span>
                      {selectedFormat && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-900 text-amber-400 font-black text-[10px] border border-amber-500/30">
                          {selectedFormat}
                        </span>
                      )}
                    </div>
                    {selectedFileName && (
                      <p className="text-[11px] text-zinc-300 truncate font-semibold mt-0.5">
                        {selectedFileName}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        type="button"
                        onClick={() => document.getElementById('slideshow-gallery-input')?.click()}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                      >
                        Choose Different Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setSelectedFileName(null);
                          setSelectedFormat(null);
                        }}
                        className="text-[11px] text-rose-400 hover:underline font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 block">
                Title / Heading
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  category === 'champion'
                    ? 'e.g., 2025 Champions - Shivaji Super Kings 🏆'
                    : category === 'team_logo'
                    ? 'e.g., Pune Warriors (2027 Contender)'
                    : 'e.g., Welcome to Zhep Krida Mandal Live Auction'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            {/* Caption */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 block">
                Caption / Subtitle (Optional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g., Defending champions with 12 consecutive wins in 2025"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white text-xs focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving || isCompressing || !imageUrl}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Photo...</span>
                </>
              ) : (
                <span>+ Add to Pre-Auction Slideshow</span>
              )}
            </button>
          </form>

          {/* ACTIVE PHOTOS IN ROTATION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Photos in Rotation ({photos.length})</span>
              </h4>
              <span className="text-xs text-zinc-400 font-bold">
                Each displays 5-6s continuously
              </span>
            </div>

            {photos.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-black border border-zinc-800 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400/60 mx-auto" />
                <h5 className="text-sm font-bold text-white">
                  No Custom Photos Added Yet
                </h5>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Use the Gallery button above to add JPG or PNG photos of last year champions and teams logo. Viewers will see these rotating until the live auction begins.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-black border border-zinc-800 shadow-sm hover:border-amber-400/40 transition-colors"
                  >
                    {/* Index & Thumbnail */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-black text-amber-400 w-5 text-center">
                        #{index + 1}
                      </span>
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-12 h-12 rounded-xl object-contain bg-zinc-950 border border-zinc-800 shrink-0 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-black text-white truncate">
                            {photo.title}
                          </h5>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              photo.category === 'champion'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                : photo.category === 'team_logo'
                                ? 'bg-zinc-900 text-amber-300 border border-zinc-700'
                                : 'bg-zinc-900 text-zinc-300 border border-zinc-700'
                            }`}
                          >
                            {photo.category === 'champion'
                              ? 'Champion'
                              : photo.category === 'team_logo'
                              ? 'Team Logo'
                              : 'Banner'}
                          </span>
                        </div>
                        {photo.caption && (
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                            {photo.caption}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: Reorder & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer"
                        title="Move slide earlier"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(index, 'down')}
                        disabled={index === photos.length - 1}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer"
                        title="Move slide later"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/60 text-rose-400 transition-colors ml-1 cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gradient-to-r from-black via-zinc-950 to-black border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-300 font-bold">
            Total <strong className="text-amber-400">{photos.length}</strong> photos in active rotation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
