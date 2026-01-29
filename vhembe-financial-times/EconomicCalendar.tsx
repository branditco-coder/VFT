
import React, { useState } from 'react';
import { Calendar as CalendarIcon, RefreshCw, Info, ExternalLink } from 'lucide-react';

export const EconomicCalendar: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // Used to force reload iframe

  const handleRefresh = () => {
    setIsRefreshing(true);
    setIframeKey(prev => prev + 1); // Force re-mount of iframe
    setTimeout(() => {
        setIsRefreshing(false);
    }, 1500);
  };

  // Tradays (MQL5) Widget Embed Code
  // Wrapped in srcDoc to ensure isolation and proper script execution
  const tradaysEmbed = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin: 0; padding: 0; background: #fff; height: 100vh; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      #economicCalendarWidget { height: 100%; width: 100%; }
    </style>
    </head>
    <body>
    <div id="economicCalendarWidget"></div>
    <script async type="text/javascript" data-type="calendar-widget" src="https://www.tradays.com/c/js/widgets/calendar/widget.js?v=15">
      {"width":"100%","height":"100%","mode":"2","fw":"html"}
    </script>
    </body>
    </html>
  `;

  return (
    <div className="w-full px-4 py-2">
      
      {/* Container with Terminal Aesthetic - Full Width */}
      <div className="bg-white rounded-sm shadow-md border border-brand-border overflow-hidden flex flex-col min-h-[850px]">
          
          {/* 1. Top Toolbar */}
          <div className="bg-brand-secondary text-white px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-blue-900">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/10 rounded-sm">
                    <CalendarIcon size={18} className="text-blue-100" />
                </div>
                <div>
                    <h2 className="text-lg font-bold font-serif tracking-wide">Global Economic Calendar</h2>
                    <p className="text-[10px] text-blue-200 font-mono uppercase tracking-wider">Tradays / MQL5 Live Feed</p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-mono bg-blue-900/50 px-3 py-1.5 rounded-sm border border-blue-800 hidden sm:flex">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span>LIVE CONNECTION</span>
                </div>
                <button 
                    onClick={handleRefresh}
                    className={`p-2 hover:bg-white/10 rounded-sm transition-colors text-blue-200 hover:text-white ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh Calendar"
                >
                    <RefreshCw size={16} />
                </button>
            </div>
          </div>

          {/* 2. Main Iframe Area */}
          <div className="flex-grow bg-white relative min-h-[800px]">
              <iframe 
                  key={iframeKey}
                  srcDoc={tradaysEmbed}
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  className="w-full h-full min-h-[800px]"
                  title="Tradays Economic Calendar"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
              />
          </div>

          {/* 3. Footer Status Bar */}
          <div className="bg-slate-100 border-t border-brand-border px-4 py-2 flex flex-col sm:flex-row justify-between items-center text-[10px] text-brand-muted font-mono gap-2">
              <div className="flex items-center gap-2">
                  <Info size={12} />
                  <span>Events update automatically in real-time.</span>
              </div>
              <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                      Data provided by <ExternalLink size={10} className="ml-1" /> Tradays
                  </span>
              </div>
          </div>

      </div>
    </div>
  );
};
