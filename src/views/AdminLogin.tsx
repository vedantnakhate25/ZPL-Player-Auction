import { useState } from 'react';
import { Lock, User, ArrowRight, AlertCircle, CheckCircle2, ChevronLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
  onQuickAdmin?: () => void;
}

export function AdminLogin({ onSuccess, onNavigateHome }: AdminLoginProps) {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminId, setShowAdminId] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Official Zhep Krida Mandal credentials
  const REQUIRED_ADMIN_ID = 'zhepkridamandal';
  const REQUIRED_PASSWORD = 'Zhepkridamandal@1981';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const enteredId = adminId.trim().toLowerCase();
    const enteredPassword = password.trim();

    if (!enteredId || !enteredPassword) {
      setError('Please enter both Admin ID and Password.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (enteredId === REQUIRED_ADMIN_ID && enteredPassword === REQUIRED_PASSWORD) {
        // Correct credentials
        sessionStorage.setItem('zhep_admin_session', 'authenticated');
        localStorage.setItem('zhep_admin_id', 'zhepkridamandal');
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        // Access Denied
        setError('Access Denied: Invalid Admin ID or Password. Please check your credentials and try again.');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 sm:p-6 text-white selection:bg-amber-400 selection:text-black">
      <div className="w-full max-w-md">
        {/* OFFICIAL PORTAL HEADER */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex p-3.5 rounded-2xl bg-zinc-950 border border-amber-500/30 shadow-xl shadow-black/60 mb-1 ring-1 ring-amber-400/20">
            <ShieldCheck className="w-10 h-10 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          </div>
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-zinc-950 text-amber-400 text-xs font-black uppercase tracking-widest mb-2 border border-amber-500/30">
              Official Administration
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Admin Portal
            </h1>
            <p className="text-zinc-400 text-sm mt-1 font-medium">
              Live Auction Desk &bull; Management Control
            </p>
          </div>
        </div>

        {/* LOGIN FORM CARD */}
        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 backdrop-blur-md">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="font-bold">Credentials verified! Opening Admin Portal...</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* ADMIN ID INPUT (MASKED BY DEFAULT AS REQUESTED) */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-300 mb-1.5">
                Admin ID
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type={showAdminId ? 'text' : 'password'}
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="username"
                  required
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl bg-black border border-zinc-800 text-white placeholder-zinc-500 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-sm tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminId(!showAdminId)}
                  className="absolute right-3.5 top-3 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={showAdminId ? 'Hide ID' : 'Show ID'}
                >
                  {showAdminId ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* PASSWORD INPUT (MASKED BY DEFAULT AS REQUESTED) */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl bg-black border border-zinc-800 text-white placeholder-zinc-500 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-sm tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enter Admin Portal</span>
                  <ArrowRight className="w-4 h-4 text-black stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* BACK TO PUBLIC STREAM */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1 font-bold text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Public Viewer</span>
            </button>

            <span className="text-[11px] text-zinc-500 font-medium">
              Authorized Officials Only
            </span>
          </div>
        </div>

        {/* SECURITY FOOTNOTE */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          <p>
            Live Auction Management Desk &bull; Official Access
          </p>
        </div>
      </div>
    </div>
  );
}
