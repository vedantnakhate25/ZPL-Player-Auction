import { useState } from 'react';
import { Lock, User, ArrowRight, AlertCircle, CheckCircle2, ChevronLeft, Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen bg-[#060c16] flex flex-col justify-center items-center p-4 sm:p-6 text-white selection:bg-[#f5d77f] selection:text-[#060c16]">
      <div className="w-full max-w-md">
        {/* OFFICIAL PORTAL HEADER */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex w-20 h-20 p-1.5 rounded-full bg-[#081220] border-2 border-[#f5d77f]/60 shadow-2xl shadow-[#040811]/90 mb-2 ring-2 ring-[#f5d77f]/25 overflow-hidden">
            <img
              src="/assets/aistudio/file_00000000661882118ee895643705c2c1_2d4830dd.png"
              alt="ZPL Official Tournament Crest"
              className="w-full h-full object-contain filter contrast-105"
            />
          </div>
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#0a1526] text-[#f5d77f] text-xs font-black uppercase tracking-widest mb-2 border border-[#f5d77f]/30">
              Official Administration
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Admin Portal
            </h1>
            <p className="text-[#a1b3cb] text-sm mt-1 font-medium">
              Live Auction Desk &bull; Management Control
            </p>
          </div>
        </div>

        {/* LOGIN FORM CARD */}
        <div className="rounded-3xl bg-[#0a1526] border border-[#f5d77f]/25 p-6 sm:p-8 shadow-2xl shadow-[#040811]/80 space-y-6 backdrop-blur-md">
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
            {/* ADMIN ID INPUT */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#c5d3e8] mb-1.5">
                Admin ID
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-[#a1b3cb] absolute left-3.5 top-3" />
                <input
                  type={showAdminId ? 'text' : 'password'}
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="username"
                  required
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl bg-[#060c16] border border-[#13243f] text-white placeholder-[#60738e] font-medium focus:outline-none focus:border-[#f5d77f] focus:ring-2 focus:ring-[#f5d77f]/20 transition-all text-sm tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminId(!showAdminId)}
                  className="absolute right-3.5 top-3 text-[#a1b3cb] hover:text-[#f5d77f] transition-colors cursor-pointer"
                  title={showAdminId ? 'Hide ID' : 'Show ID'}
                >
                  {showAdminId ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#c5d3e8] mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#a1b3cb] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl bg-[#060c16] border border-[#13243f] text-white placeholder-[#60738e] font-medium focus:outline-none focus:border-[#f5d77f] focus:ring-2 focus:ring-[#f5d77f]/20 transition-all text-sm tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#a1b3cb] hover:text-[#f5d77f] transition-colors cursor-pointer"
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
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#fae29c] via-[#f5d77f] to-[#e0bc50] hover:from-[#fff0b8] hover:to-[#ebc860] text-[#060c16] font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/30 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#060c16] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enter Admin Portal</span>
                  <ArrowRight className="w-4 h-4 text-[#060c16] stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* BACK TO PUBLIC STREAM */}
          <div className="pt-3 border-t border-[#13243f] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1 font-bold text-[#a1b3cb] hover:text-[#f5d77f] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Public Viewer</span>
            </button>

            <span className="text-[11px] text-[#60738e] font-medium">
              Authorized Officials Only
            </span>
          </div>
        </div>

        {/* SECURITY FOOTNOTE */}
        <div className="mt-6 text-center text-xs text-[#a1b3cb]">
          <p>
            Live Auction Management Desk &bull; Official Access
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
