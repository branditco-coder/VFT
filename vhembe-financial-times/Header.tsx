
import React, { useState } from 'react';
import { Menu, LogOut, LogIn } from 'lucide-react';
import { ViewState, UserProfile } from '../types';
import { Sidebar } from './Sidebar';

interface HeaderProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: UserProfile | null;
  onLogout: () => void;
  onLoginClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView, user, onLogout, onLoginClick }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar currentView={currentView} setView={(v) => { setView(v); setIsSidebarOpen(false); }} isOpen={isSidebarOpen} />
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <header className="bg-white border-b border-brand-border h-16 px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-sm text-brand-secondary transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex flex-col">
             <h1 className="text-xl font-serif font-bold text-brand-secondary tracking-tight leading-none">Vhembe</h1>
             <span className="text-[10px] text-brand-muted uppercase tracking-widest font-mono">Institutional Terminal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {user ? (
             <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                   <p className="text-xs font-bold text-brand-secondary">{user.name}</p>
                   <p className="text-[10px] text-brand-muted uppercase font-mono">{user.role} account</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                   <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                  title="Sign Out"
                >
                   <LogOut size={18} />
                </button>
             </div>
           ) : (
             <button 
                onClick={onLoginClick}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-blue-700 transition-colors shadow-sm"
             >
                <LogIn size={16} /> <span className="hidden sm:inline">Sign In</span>
             </button>
           )}
        </div>
      </header>
    </>
  );
};
