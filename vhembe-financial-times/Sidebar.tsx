
import React from 'react';
import { ViewState } from '../types';
import { 
  LayoutGrid, 
  Calendar, 
  TrendingUp, 
  PieChart, 
  Landmark, 
  Target, 
  PenTool, 
  Terminal, 
  Zap,
  Settings,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen }) => {
  const NavItem = ({ view, icon: Icon, label, badge }: { view: ViewState, icon: any, label: string, badge?: string }) => (
    <button
      onClick={() => setView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 group relative ${
        currentView === view
          ? 'bg-brand-primary text-white shadow-md'
          : 'text-brand-muted hover:bg-slate-100 hover:text-brand-secondary'
      }`}
    >
      <Icon size={18} className={currentView === view ? 'text-white' : 'text-slate-400 group-hover:text-brand-secondary'} />
      <span className={`text-xs font-bold uppercase tracking-wider ${currentView === view ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
      
      {currentView === view && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/20 rounded-r-sm"></div>
      )}
      
      {badge && (
         <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded border ${
            currentView === view 
               ? 'bg-white/20 text-white border-transparent' 
               : 'bg-slate-100 text-slate-500 border-slate-200'
         }`}>
            {badge}
         </span>
      )}
    </button>
  );

  return (
    <aside 
      className={`h-screen w-64 bg-white border-r border-brand-border flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      
      {/* Brand Header */}
      <div className="p-6 border-b border-brand-border">
         <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('news')}>
            <div className="w-8 h-8 bg-brand-secondary text-white flex items-center justify-center font-bold font-serif text-lg rounded-sm shadow-blue-900/20 shadow-lg">
              V
            </div>
            <div className="flex flex-col">
              <span className="text-brand-secondary font-serif text-lg leading-none font-bold tracking-tight">Vhembe</span>
              <span className="text-brand-muted text-[9px] font-mono uppercase tracking-[0.2em]">Terminal v2.0</span>
            </div>
         </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-grow p-4 space-y-2 overflow-y-auto no-scrollbar">
         <div className="text-[10px] font-bold uppercase text-slate-400 px-4 mb-2 mt-2">Main Feed</div>
         <NavItem view="news" icon={LayoutGrid} label="Dashboard" badge="LIVE" />
         <NavItem view="markets" icon={TrendingUp} label="Markets" />
         <NavItem view="calendar" icon={Calendar} label="Calendar" />
         
         <div className="text-[10px] font-bold uppercase text-slate-400 px-4 mb-2 mt-6">Deep Dive</div>
         <NavItem view="macro" icon={Landmark} label="Global Macro" />
         <NavItem view="analytics" icon={PieChart} label="Analytics" />
         <NavItem view="opinion" icon={Target} label="Smart Money" />
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-brand-border bg-slate-50">
          <button 
             onClick={() => setView('admin')}
             className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-bold uppercase rounded-sm transition-colors mb-2 ${
                currentView === 'admin' ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-primary'
             }`}
          >
             <PenTool size={14} /> Write Article
          </button>
          
          <button 
             onClick={() => setView('opinion')}
             className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-secondary text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-brand-primary transition-all shadow-sm group"
          >
             <Terminal size={14} className="group-hover:text-emerald-400 transition-colors" />
             <span>Launch Hub</span>
          </button>
      </div>
    </aside>
  );
};
