import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from './lib/firebase';
import type { User } from 'firebase/auth';
import { LiveAuctionViewer } from './views/LiveAuctionViewer';
import { PublicAuctionList } from './views/PublicAuctionList';
import { AdminLogin } from './views/AdminLogin';
import { AdminDashboard } from './views/AdminDashboard';
import { AdminCreateAuction } from './views/AdminCreateAuction';
import { AdminLiveAuctionControl } from './views/AdminLiveAuctionControl';
import { AdminManageTeams } from './views/AdminManageTeams';
import { AdminManagePlayers } from './views/AdminManagePlayers';
import { AdminAuctionResults } from './views/AdminAuctionResults';
import { FooterCopyright } from './components/FooterCopyright';

type AppView =
  | 'public-list'
  | 'public-viewer'
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-create'
  | 'admin-control'
  | 'admin-teams'
  | 'admin-players'
  | 'admin-results';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('zhep_admin_session') === 'authenticated';
  });

  // Router State
  const [currentView, setCurrentView] = useState<AppView>('public-list');
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>('');
  const [selectedAuctionName, setSelectedAuctionName] = useState<string>('');

  // 1. Listen for Firebase Auth state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 800);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // 2. Read query parameters on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auctionParam = params.get('auction');
    const adminParam = params.get('admin');

    if (auctionParam) {
      setSelectedAuctionId(auctionParam);
      setCurrentView('public-viewer');
    } else if (adminParam === 'login') {
      setCurrentView('admin-login');
    } else if (adminParam === 'dashboard' || window.location.pathname.startsWith('/admin')) {
      const isAuthed = sessionStorage.getItem('zhep_admin_session') === 'authenticated';
      setCurrentView(isAuthed ? 'admin-dashboard' : 'admin-login');
    }
  }, []);

  // Navigation handlers
  const handleSelectAuction = (auctionId: string) => {
    setSelectedAuctionId(auctionId);
    setCurrentView('public-viewer');
    const url = new URL(window.location.href);
    url.searchParams.set('auction', auctionId);
    url.searchParams.delete('admin');
    window.history.pushState({}, '', url.toString());
  };

  const handleNavigateHome = () => {
    setCurrentView('public-list');
    setSelectedAuctionId('');
    const url = new URL(window.location.href);
    url.searchParams.delete('auction');
    url.searchParams.delete('admin');
    window.history.pushState({}, '', url.toString());
  };

  const handleNavigateAdmin = () => {
    if (isAdminAuthenticated) {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('admin-login');
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('auction');
    url.searchParams.set('admin', isAdminAuthenticated ? 'dashboard' : 'login');
    window.history.pushState({}, '', url.toString());
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setCurrentView('admin-dashboard');
    const url = new URL(window.location.href);
    url.searchParams.delete('auction');
    url.searchParams.set('admin', 'dashboard');
    window.history.pushState({}, '', url.toString());
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('zhep_admin_session');
    setIsAdminAuthenticated(false);
    setCurrentView('public-list');
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    window.history.pushState({}, '', url.toString());
  };

  const handleOpenControl = (auctionId: string) => {
    setSelectedAuctionId(auctionId);
    setCurrentView('admin-control');
  };

  const handleManageTeams = (auctionId: string, name: string) => {
    setSelectedAuctionId(auctionId);
    setSelectedAuctionName(name);
    setCurrentView('admin-teams');
  };

  const handleManagePlayers = (auctionId: string, name: string) => {
    setSelectedAuctionId(auctionId);
    setSelectedAuctionName(name);
    setCurrentView('admin-players');
  };

  const handleViewResults = (auctionId: string) => {
    setSelectedAuctionId(auctionId);
    setCurrentView('admin-results');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render active view
  const renderView = () => {
    switch (currentView) {
      case 'public-viewer':
        return (
          <LiveAuctionViewer
            auctionId={selectedAuctionId}
            onNavigateHome={handleNavigateHome}
          />
        );

      case 'admin-login':
        return (
          <AdminLogin
            onSuccess={handleAdminLoginSuccess}
            onNavigateHome={handleNavigateHome}
          />
        );

      case 'admin-dashboard':
        if (!isAdminAuthenticated) {
          return (
            <AdminLogin
              onSuccess={handleAdminLoginSuccess}
              onNavigateHome={handleNavigateHome}
            />
          );
        }
        return (
          <AdminDashboard
            adminEmail="zhepkridamandal@official"
            adminUid="zhepkridamandal"
            onCreateAuction={() => setCurrentView('admin-create')}
            onOpenControl={handleOpenControl}
            onManageTeams={handleManageTeams}
            onManagePlayers={handleManagePlayers}
            onViewResults={handleViewResults}
            onNavigateHome={handleNavigateHome}
            onLogout={handleAdminLogout}
          />
        );

      case 'admin-create':
        if (!isAdminAuthenticated) {
          return <AdminLogin onSuccess={handleAdminLoginSuccess} onNavigateHome={handleNavigateHome} />;
        }
        return (
          <AdminCreateAuction
            adminUid="zhepkridamandal"
            adminEmail="zhepkridamandal@official"
            onSuccess={(newAuctionId) => {
              setSelectedAuctionId(newAuctionId);
              setCurrentView('admin-dashboard');
            }}
            onCancel={() => setCurrentView('admin-dashboard')}
          />
        );

      case 'admin-control':
        if (!isAdminAuthenticated) {
          return <AdminLogin onSuccess={handleAdminLoginSuccess} onNavigateHome={handleNavigateHome} />;
        }
        return (
          <AdminLiveAuctionControl
            auctionId={selectedAuctionId}
            onBack={() => setCurrentView('admin-dashboard')}
            onViewResults={() => setCurrentView('admin-results')}
          />
        );

      case 'admin-teams':
        if (!isAdminAuthenticated) {
          return <AdminLogin onSuccess={handleAdminLoginSuccess} onNavigateHome={handleNavigateHome} />;
        }
        return (
          <AdminManageTeams
            auctionId={selectedAuctionId}
            auctionName={selectedAuctionName}
            onBack={() => setCurrentView('admin-dashboard')}
          />
        );

      case 'admin-players':
        if (!isAdminAuthenticated) {
          return <AdminLogin onSuccess={handleAdminLoginSuccess} onNavigateHome={handleNavigateHome} />;
        }
        return (
          <AdminManagePlayers
            auctionId={selectedAuctionId}
            auctionName={selectedAuctionName}
            onBack={() => setCurrentView('admin-dashboard')}
          />
        );

      case 'admin-results':
        return (
          <AdminAuctionResults
            auctionId={selectedAuctionId}
            onBack={() => {
              if (isAdminAuthenticated) {
                setCurrentView('admin-dashboard');
              } else {
                setCurrentView('public-viewer');
              }
            }}
          />
        );

      case 'public-list':
      default:
        return (
          <PublicAuctionList
            onSelectAuction={handleSelectAuction}
            onNavigateAdmin={handleNavigateAdmin}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-black text-white selection:bg-amber-400 selection:text-black">
      <div className="flex-1 flex flex-col">
        {renderView()}
      </div>
      <FooterCopyright />
    </div>
  );
}
