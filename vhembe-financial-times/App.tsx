
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NewsFeed } from './components/NewsFeed';
import { EconomicCalendar } from './components/EconomicCalendar';
import { MarketDashboard } from './components/MarketDashboard';
import { SmartMoneyClub } from './components/SmartMoneyClub';
import { MacroDashboard } from './components/MacroDashboard';
import { AnalyticsSuite } from './components/AnalyticsSuite';
import { AdminEditor } from './components/AdminEditor';
import { AuthModal } from './components/AuthModal';
import { ViewState, UserProfile } from './types';
import { authService } from './services/authService';
import { Lock, Loader2 } from 'lucide-react';

function App() {
  const [currentView, setView] = useState<ViewState>('news');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState<string>('');

  useEffect(() => {
    // Listen for real-time auth changes from Firebase
    const unsubscribe = authService.observeUser((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    // Handled by observer automatically
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    setView('news');
  };

  const triggerAuth = (message: string) => {
    setAuthMessage(message);
    setAuthModalOpen(true);
  };

  const protectedView = (component: React.ReactNode, requiredRole: 'pro' | 'admin') => {
    if (!authService.canAccess(user, requiredRole)) {
       return (
         <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8 bg-slate-50 border border-brand-border rounded-sm border-dashed">
            <div className="w-16 h-16 bg-brand-secondary text-white rounded-full flex items-center justify-center mb-6 shadow-xl">
               <Lock size={32} />
            </div>
            <h2 className="text-3xl font-serif font-bold text-brand-secondary mb-3">
              {requiredRole === 'admin' ? 'Restricted Access' : 'Pro Feature Locked'}
            </h2>
            <p className="text-brand-muted max-w-md mb-8 leading-relaxed">
              {requiredRole === 'admin' 
                ? 'This control center is restricted to Vhembe Editorial Staff.' 
                : 'This intelligence suite is reserved for our Inner Circle members. Sign in to access institutional grade data.'}
            </p>
            <button 
              onClick={() => triggerAuth(requiredRole === 'admin' ? 'Please verify administrative credentials.' : 'Upgrade to Pro to access this feature.')}
              className="bg-brand-primary text-white px-8 py-3 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-md"
            >
              {user ? 'Switch Account' : 'Unlock Access'}
            </button>
         </div>
       );
    }
    return component;
  };

  const renderContent = () => {
    switch (currentView) {
      case 'news':
        return <NewsFeed />;
      case 'calendar':
        return <EconomicCalendar />;
      case 'markets':
        return <MarketDashboard />;
      case 'macro':
        return <MacroDashboard />;
      
      case 'opinion':
        return <SmartMoneyClub user={user} triggerAuth={triggerAuth} />;
      case 'analytics':
        return <AnalyticsSuite user={user} triggerAuth={triggerAuth} />;
      
      case 'admin':
        return protectedView(<AdminEditor />, 'admin');
        
      default:
        return <NewsFeed />;
    }
  };

  if (authLoading) {
     return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
           <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-brand-primary" size={48} />
              <span className="text-xs font-mono uppercase tracking-widest text-brand-muted">Connecting to Terminal...</span>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans text-brand-text flex flex-col">
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMessage={authMessage}
      />

      {/* 1. PRIMARY NAVIGATION */}
      <Header 
        currentView={currentView} 
        setView={setView} 
        user={user} 
        onLogout={handleLogout}
        onLoginClick={() => triggerAuth('Sign in to access your dashboard.')}
      />
      
      {/* 2. MAIN CONTENT STAGE */}
      <main className="flex-grow overflow-x-hidden p-6 relative">
         <div className="w-full animate-in fade-in duration-500">
            {renderContent()}
         </div>
      </main>

    </div>
  );
}

export default App;
